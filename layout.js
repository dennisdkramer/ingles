/* ---- layout editor (layout.js) ------------------------------------------------------
   Teacher-only, and only while engine2.js has its edit mode open. It drags any node
   inside .content-area — a block, a .rows cell, a paragraph, a div, a table, a whole
   .rows — together with its subtree, and drops it before or after any sibling, or inside
   any container that holds items. Nothing is stored here: the DOM is the only thing this
   file changes, and edit mode's own Done (engine2.js → saveContent) or Save to repo
   writes the result.
   WHAT MAY NOT MOVE — h1/h2 (a section is left alone), a block's h3 (the block letter is
   drawn from it), and the parts of a control item: a td, a .qopts, a .qstem, a .qnum, an
   input, a textarea, a button. Those travel only with the item that holds them, so no drop
   can leave a control answering nothing; a .qitem, a label.flip, a figure or a table moves
   whole and takes its controls with it.
   Entry points: LayoutEditor.enable() · .disable() · .undo() · .clean() · .moves()
   ---------------------------------------------------------------------------------- */
window.LayoutEditor = (function () {
  'use strict';

  var ON = false, CA = null, drag = null, hist = [], moved = 0, line = null, chipEl = null;
  var sel = null, panelEl = null;
  var THRESH = 4;   /* px of travel before a press counts as a drag, so a click keeps its caret */

  var STILL = 'h1,h2,h3';
  /* THE SMALLEST THING A PRESS MAY PICK UP is a paragraph, a question-and-answer pair, a chart or a
     cell — never a word, a span, a bold or a link. Editing inside a paragraph is copy and paste in the
     text mode, not a drag. So a press walks up to the nearest grain and drags THAT. */
  var GRAIN = 'p,ul,ol,dl,figure,table,pre,blockquote,div,section,article,aside,header,footer,form,fieldset,details,hr';
  var COMPOSITE = '.qitem,label.flip,figure,table,.seq,.tlgrid,.flip-grid,.chartwrap,.viz';
  var PARTS = '.qopts,.qstem,.qline,.qnum,input,textarea,button,select,option,td,th,.gap,.write,.listen,.glossbtn,.ans';
  /* a container that cannot hold an item, because the browser would not have parsed it there */
  var NOCONTAINER = 'p,span,b,i,u,em,strong,a,small,sup,sub,code,ruby,rt,rp,summary,label,button,input,textarea,select,option,h1,h2,h3,h4,h5,h6,br,img,svg';
  /* a node that only parses inside one kind of parent */
  var ONLY = { td: 'tr', th: 'tr', tr: 'tbody,thead,tfoot,table', li: 'ul,ol',
               thead: 'table', tbody: 'table', tfoot: 'table',
               option: 'select', legend: 'fieldset', dt: 'dl', dd: 'dl' };

  function ca() { return CA || (CA = document.querySelector('.content-area')); }
  function inside(n) { var c = ca(); return !!(c && n && n.nodeType === 1 && n !== c && c.contains(n)); }
  function still(n) { return !!(n.matches && n.matches(STILL)); }
  function part(n) { return !!(n.matches && n.matches(PARTS)); }

  /* a whole item may move; anything living inside one is a part of it and moves with it */
  function movable(n) {
    if (!inside(n) || still(n) || part(n)) return false;
    if (n.matches(COMPOSITE)) return true;
    if (!n.matches(GRAIN)) return false;          /* a span, a bold, a link: never picked up */
    return !(n.closest && n.closest(COMPOSITE));
  }

  function onlyOk(n, box) {
    var want = ONLY[n.tagName.toLowerCase()];
    if (!want) return true;
    return want.split(',').indexOf(box.tagName.toLowerCase()) > -1;
  }

  function accepts(n, box) {
    if (!box || box.nodeType !== 1) return false;
    if (box === n || n.contains(box)) return false;      /* never into its own subtree */
    if (still(box) || part(box)) return false;
    if (box.matches(NOCONTAINER)) return false;
    if (!onlyOk(n, box)) return false;
    var c = ca(); return box === c || c.contains(box);
  }

  /* siblings run left-to-right inside a flex row, and top-to-bottom everywhere else */
  function flow(el) {
    var p = el.parentElement; if (!p) return 'y';
    var cs = getComputedStyle(p);
    if ((cs.display === 'flex' || cs.display === 'inline-flex' || cs.display === 'grid') &&
        String(cs.flexDirection || '').indexOf('column') < 0) return 'x';
    return 'y';
  }

  /* ---- where would the node land? -------------------------------------------------
     Two answers only: BETWEEN two siblings (a line is drawn at the boundary), or INSIDE a
     container that accepts it (the container is tinted). The middle of a cell is "inside";
     its edges are "between". Everything is measured at the pointer, so scrolling and a
     re-flowed row need no bookkeeping. */
  function pick(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el) return null;
    var n = drag.node;
    while (el && (el === n || n.contains(el))) el = el.parentElement;
    if (!el) return null;
    if (el === ca()) return { box: ca(), inside: true, host: null };
    if (!inside(el)) return null;
    /* BETWEEN TWO ROWS is its own target, and it is the top or bottom band of a row: a cell dropped
       there leaves the row it came from and stands between rows, instead of joining the next row. */
    var row = el.closest ? el.closest('.rows') : null;
    if (row && row.parentElement) {
      var rr = row.getBoundingClientRect(), band = Math.min(18, rr.height / 3);
      if (y < rr.top + band || y > rr.bottom - band) {
        var rp = row.parentElement;
        if (accepts(n, rp)) {
          var before = y < rr.top + rr.height / 2;
          return { box: rp, ref: before ? row : row.nextElementSibling, inside: false, host: row, before: before };
        }
      }
    }
    var r = el.getBoundingClientRect(), f = flow(el), e = 18;
    var onEdge = f === 'x' ? (x < r.left + e || x > r.right - e)
                           : (y < r.top + e || y > r.bottom - e);
    if (!onEdge && accepts(n, el)) return { box: el, inside: true, host: el };
    var p = el.parentElement;
    if (!p || (!inside(p) && p !== ca()) || !accepts(n, p)) return { box: ca(), inside: true, host: null };
    var before = f === 'x' ? x < r.left + r.width / 2 : y < r.top + r.height / 2;
    return { box: p, ref: before ? el : el.nextElementSibling, inside: false, host: el, before: before };
  }

  function showLine(t) {
    if (!line) { line = document.createElement('div'); line.className = 'layout-line'; document.body.appendChild(line); }
    if (!t) { line.style.display = 'none'; return; }
    line.style.display = 'block';
    var r;
    if (t.inside) {
      r = t.box.getBoundingClientRect();
      line.className = 'layout-line is-inside';
      line.style.left = r.left + 'px'; line.style.top = r.top + 'px';
      line.style.width = r.width + 'px'; line.style.height = r.height + 'px';
      return;
    }
    line.className = 'layout-line';
    r = t.host.getBoundingClientRect();
    if (flow(t.host) === 'x') {
      line.style.left = ((t.before ? r.left : r.right) - 2) + 'px'; line.style.top = r.top + 'px';
      line.style.width = '4px'; line.style.height = r.height + 'px';
    } else {
      line.style.top = ((t.before ? r.top : r.bottom) - 2) + 'px'; line.style.left = r.left + 'px';
      line.style.height = '4px'; line.style.width = r.width + 'px';
    }
  }

  /* ---- the inspector ---------------------------------------------------------------
     What rows and cells exist right now, named while the layer is on. Every outline and every
     badge below is CSS on body.layout-on, so the inspector writes NOTHING into the page — the
     only two attributes it sets (data-layout-pin, data-layout-sel) are stripped by clean() before
     a save. The panel names the node under the last press: its section, row, cell, tag, its
     inline style, the flex the sheet resolved, and how many children it holds — which is the
     answer to "why is this not filling the row?". */
  function sections() { var c = ca(); return c ? [].filter.call(c.children, function (x) { return x.tagName === 'H2'; }) : []; }
  function sectionOf(n) {
    var c = ca(), s = null, e;
    for (e = n; e && e !== c; e = e.parentElement) {
      for (var q = e.previousElementSibling; q; q = q.previousElementSibling) if (q.tagName === 'H2') { s = q; break; }
      if (s) break;
    }
    return s;
  }
  function pickNode(el) {
    if (!el || !inside(el)) return null;
    if (el.matches('.rows')) return el;
    var cell = el.closest('.rows>*'); if (cell) return cell;
    var blk = el.closest('.block'); if (blk) return blk;
    return el;
  }
  function facts(n) {
    if (!n) return 'click a cell or a row to see what it is';
    var c = ca(), out = [], h2 = sectionOf(n), si = sections().indexOf(h2) + 1;
    var row = n.closest('.rows'), ri = 0, ci = 0;
    if (row) { ri = [].indexOf.call(c.querySelectorAll('.rows'), row) + 1; if (n.parentElement === row) ci = [].indexOf.call(row.children, n) + 1; }
    out.push('S' + (si || '?') + (ri ? ' · R' + ri : '') + (ci ? ' · cell ' + ci : '') + (n.matches('.rows') ? ' (the row)' : ''));
    out.push(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') +
      (typeof n.className === 'string' && n.className.trim() ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : ''));
    var st = n.getAttribute('style');
    out.push(st ? 'inline: ' + st : 'inline: none');
    try {
      var cs = getComputedStyle(n);
      if (cs.display === 'flex' || cs.display === 'grid') out.push('display: ' + cs.display + ' · direction: ' + (cs.flexDirection || '-'));
      out.push('flex: ' + (cs.flex || '-') + ' · basis: ' + (cs.flexBasis || '-') + ' · min: ' + (cs.minWidth || '-') + ' · now: ' + (cs.width || '-'));
    } catch (e) { }
    out.push(n.children.length + ' child' + (n.children.length === 1 ? '' : 'ren'));
    return out.join(' — ');
  }
  function markPins() {
    var c = ca(); if (!c) return;
    [].forEach.call(c.querySelectorAll('.rows>*'), function (n) {
      var st = n.getAttribute('style') || '';
      if (/flex|min-width|width|max-width/.test(st)) n.setAttribute('data-layout-pin', '');
      else n.removeAttribute('data-layout-pin');
    });
  }
  function select(n) {
    if (sel) sel.removeAttribute('data-layout-sel');
    sel = n || null;
    if (sel) sel.setAttribute('data-layout-sel', '');
    paintPanel();
  }
  /* ---- the width actions -------------------------------------------------------------
     A row's cells are `flex:1 1 auto` with a floor of a quarter of the page (style.css
     .rows>*), so their widths come from their own content and grow by equal shares: nothing
     in the sheet ever asks for equal widths, and a cell never collapses to even the heights
     by itself. These four actions are the repair, and they write only the cell's own inline
     `flex` — no class, no wrapper, no change to the sheet.
       even row          every cell in this row at an exact share of the line
       half / full       this cell fixed at half the line, or on a line of its own
       auto (clear)      the cell's inline width is REMOVED, so the flow decides again —
                         the repair for a width the builder hand-wrote. */
  function setFlex(n, v) {
    if (!n) return;
    if (v === null) n.style.removeProperty('flex');
    else n.style.flex = v;
    if (!n.getAttribute('style')) n.removeAttribute('style');
  }
  function act(what, field) {
    if (!sel) return;
    var n = sel, row = n.parentElement;
    if (what === 'set' && field) {
      var v = String(field.value || '').trim().replace(/^style\s*=\s*/i, '');
      if (!v || /^(auto|none|-)$/i.test(v)) what = 'auto';
      else {
        /* a bare number is a width; anything else is taken as the flex shorthand it looks like */
        n.style.flex = /^[\d.]+(%|px|em|rem|vw)?$/.test(v) ? '0 0 ' + v : v;
        if (!n.getAttribute('style')) n.removeAttribute('style');
      }
    }
    if (what === 'auto') {
      /* `flex` is a SHORTHAND, and the browser expands it into the three longhands the moment it is
         set — so removing `flex` alone removes nothing. Every form a builder might have written is
         cleared here, and a cell left with no style at all loses the attribute entirely. */
      ['flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'min-width', 'width', 'max-width', 'flex-wrap']
        .forEach(function (p) { n.style.removeProperty(p); });
      if (!n.getAttribute('style')) n.removeAttribute('style');
    } else if (what === 'half') setFlex(n, '0 0 calc(50% - 13px)');
    else if (what === 'min') setFlex(n, '0 1 0');          /* collapse: no growth, no basis — the cell drops to the sheet's minimum width and its neighbours take the rest */
    else if (what === 'natural') setFlex(n, '0 1 auto');   /* its own content width, no growth: never smaller than its longest line, never inflated by the row */
    else if (what === 'full') setFlex(n, '0 0 100%');
    else if (what === 'even' && row && row.classList && row.classList.contains('rows')) {
      var kids = [].filter.call(row.children, function (k) { return k.nodeType === 1; }), c = kids.length;
      kids.forEach(function (k) { k.style.flex = '0 0 calc((100% - ' + (c - 1) + ' * 26px) / ' + c + ')'; });
    }
    markPins(); select(n); paintChip();
  }

  function paintPanel() {
    if (!ON) { if (panelEl) panelEl.style.display = 'none'; document.body.classList.remove('layout-panelled'); return; }
    if (!panelEl) {
      panelEl = document.createElement('div');
      panelEl.className = 'layout-panel';
      panelEl.setAttribute('role', 'status');
      panelEl.innerHTML = '<div class="layout-facts"></div><div class="layout-acts">' +
        '<button type="button" data-act="even">even row</button>' +
        '<button type="button" data-act="min">min</button>' +
        '<button type="button" data-act="natural">natural</button>' +
        '<button type="button" data-act="half">half</button>' +
        '<button type="button" data-act="full">full</button>' +
        '<button type="button" data-act="auto">clear width</button>' +
        '<input class="layout-w" type="text" placeholder="40% · 320px · 0 0 auto" aria-label="this cell\'s flex">' +
        '<button type="button" data-act="set">set</button></div>';
      panelEl.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
        if (!b) return;
        e.preventDefault(); e.stopPropagation();
        act(b.getAttribute('data-act'), panelEl.querySelector('.layout-w'));
      });
      panelEl.addEventListener('keydown', function (e) {
        if (e.target && e.target.classList && e.target.classList.contains('layout-w') && e.key === 'Enter') {
          e.preventDefault(); e.stopPropagation(); act('set', e.target);
        }
      });
      document.body.appendChild(panelEl);
    }
    document.body.classList.add('layout-panelled');
    var box = panelEl.querySelector('.layout-facts');
    var txt = facts(sel);
    if (box && box.textContent !== txt) box.textContent = txt;
    var w = panelEl.querySelector('.layout-w');
    if (w && sel && document.activeElement !== w) w.value = sel.getAttribute('style') || '';
  }

  /* the chip is the tool's whole control surface: what it is, how many moves, and undo */
  function paintChip() {
    if (!ON) { if (chipEl) chipEl.style.display = 'none'; return; }
    if (!chipEl) {
      chipEl = document.createElement('button');
      chipEl.type = 'button'; chipEl.className = 'layout-chip';
      chipEl.addEventListener('click', function (e) { e.preventDefault(); undo(); });
      document.body.appendChild(chipEl);
    }
    chipEl.style.display = 'block';
    chipEl.textContent = 'layout · ' + moved + ' move' + (moved === 1 ? '' : 's') +
      (hist.length ? ' · undo' : '') + ' · Esc to stop';
  }

  /* ---- the move, and taking it back ----------------------------------------------- */
  /* an emptied .rows is removed, and remembered, so nothing leaves an empty flex row behind */
  function dropRows(from) {
    if (!from || from.nodeType !== 1 || !from.classList || !from.classList.contains('rows')) return [];
    if (from.children.length) return [];
    var rec = { row: from, parent: from.parentNode, next: from.nextElementSibling };
    rec.parent.removeChild(from);
    return [rec];
  }

  function applyDrop(d) {
    var n = d.node, t = d.t;
    if (!t) return;
    var from = { parent: n.parentNode, next: n.nextElementSibling };
    if (t.inside) {
      if (t.box === from.parent && t.box.lastElementChild === n) return;     /* already there */
      t.box.appendChild(n);
    } else {
      if (t.box === from.parent && (t.ref || null) === from.next) return;     /* already there */
      t.box.insertBefore(n, t.ref || null);
    }
    hist.push({ node: n, from: from, rows: dropRows(from.parent) });
    if (hist.length > 40) hist.shift();
    moved++; markPins(); paintChip();
  }

  function undo() {
    var s = hist.pop();
    if (!s) return false;
    for (var i = s.rows.length - 1; i >= 0; i--) {
      var r = s.rows[i];
      if (r.parent) r.parent.insertBefore(r.row, r.next && r.next.parentNode === r.parent ? r.next : null);
    }
    s.from.parent.insertBefore(s.node,
      s.from.next && s.from.next.parentNode === s.from.parent ? s.from.next : null);
    moved = Math.max(0, moved - 1);
    paintChip();
    return true;
  }

  /* ---- the gesture -----------------------------------------------------------------
     A press becomes a drag only after 4px, so a click still places a caret; while a drag
     is live the area leaves contenteditable, because a live contenteditable starts a text
     drag of its own and the gesture never arrives. */
  function down(e) {
    if (!ON || e.button !== 0) return;
    if (!chipEl) paintChip();          /* a save cleaned the chrome away; the press brings it back */
    var n = e.target && e.target.nodeType === 1 ? e.target : null;
    if (!n) return;
    /* walk up to the nearest thing that may be picked up: a word becomes its paragraph, a chart's cell
       becomes its table, an option becomes the whole question */
    while (n && !movable(n)) {
      if (n === ca() || !n.parentElement) return;
      n = n.parentElement;
    }
    if (!n) return;
    drag = { node: n, x: e.clientX, y: e.clientY, on: false, t: null, attr: null, target: n };
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
  }

  function move(e) {
    if (!drag) return;
    if (!drag.on) {
      if (Math.abs(e.clientX - drag.x) < THRESH && Math.abs(e.clientY - drag.y) < THRESH) return;
      drag.on = true;
      var c = ca();
      drag.attr = c ? c.getAttribute('contenteditable') : null;
      if (c) c.setAttribute('contenteditable', 'false');
      drag.node.classList.add('layout-dragging');
      document.body.classList.add('layout-drag');
    }
    drag.t = pick(e.clientX, e.clientY);
    showLine(drag.t);
    e.preventDefault();
    e.stopPropagation();
  }

  function up(e) {
    var d = drag;
    drag = null;
    window.removeEventListener('pointermove', move, true);
    window.removeEventListener('pointerup', up, true);
    window.removeEventListener('pointercancel', up, true);
    if (!d) return;
    showLine(null);
    d.node.classList.remove('layout-dragging');
    document.body.classList.remove('layout-drag');
    var c = ca();
    if (c) {
      if (d.attr === null) c.removeAttribute('contenteditable');
      else c.setAttribute('contenteditable', d.attr);
    }
    if (d.on) { applyDrop(d); e.preventDefault(); }
    else if (d.target) { select(pickNode(d.target)); }   /* a press that never travelled inspects */
  }

  function key(e) {
    if (!ON) return;
    if (e.key === 'Escape') disable();
    else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.altKey) { undo(); e.preventDefault(); }
  }

  /* ---- on and off ------------------------------------------------------------------
     clean() is what the save path calls: it strips the tool's own traces from the DOM and
     nothing else, so a document saved right after it carries no chip, no line and no drag
     class. The tool stays live — the chip comes back — which is what lets a layout be
     saved without leaving edit mode. */
  function clean() {
    if (line && line.parentNode) line.parentNode.removeChild(line);
    line = null;
    if (chipEl && chipEl.parentNode) chipEl.parentNode.removeChild(chipEl);
    chipEl = null;
    if (panelEl && panelEl.parentNode) panelEl.parentNode.removeChild(panelEl);
    panelEl = null;
    var c = ca();
    if (c) {
      var d = c.querySelectorAll('.layout-dragging');
      for (var i = 0; i < d.length; i++) d[i].classList.remove('layout-dragging');
      var m = c.querySelectorAll('[data-layout-sel],[data-layout-pin]');
      for (var j = 0; j < m.length; j++) { m[j].removeAttribute('data-layout-sel'); m[j].removeAttribute('data-layout-pin'); }
      if (c.getAttribute('contenteditable') === 'false') c.setAttribute('contenteditable', 'true');
    }
    sel = null;
    drag = null;
    document.body.classList.remove('layout-drag', 'layout-panelled');
    if (!ON) document.body.classList.remove('layout-on');
    /* the chip is NOT repainted here: clean() runs immediately before a save, and the chip is
       a body child, so leaving it would put the tool's own chrome into the saved document.
       The next press brings it back (down()). */
  }

  function enable() {
    if (ON) return;
    ON = true; CA = null; hist = []; moved = 0; sel = null;
    document.body.classList.add('layout-on');
    var c = ca();
    if (c) c.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key, true);
    markPins(); paintChip(); paintPanel();
  }

  function disable() {
    if (!ON) return;
    ON = false;
    var c = ca();
    if (c) c.removeEventListener('pointerdown', down, true);
    document.removeEventListener('keydown', key, true);
    if (line) line.style.display = 'none';
    clean();
  }

  return {
    enable: enable,
    disable: disable,
    undo: undo,
    clean: clean,
    moves: function () { return moved; },
    active: function () { return ON; }
  };
})();
