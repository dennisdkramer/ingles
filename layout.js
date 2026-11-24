/* ---- layout editor (layout.js) ------------------------------------------------------
   Teacher-only, and only while engine2.js has its edit mode open. TWO GESTURES, ONE MODIFIER:
   a plain click places a caret and edits text; holding SHIFT engages this file — Shift+drag
   picks a node up and drops it, Shift+click (no travel) selects it for the width panel.
   "Dragging any node" means inside .content-area — a block, a .rows cell, a paragraph, a div,
   a table, a whole .rows — together with its subtree, and drops it before or after any sibling,
   or inside any container that holds items. Nothing is stored here: the DOM is the only thing
   this file changes, and edit mode's own Done (engine2.js → saveContent) or Save to repo
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
  /* whether the teacher has TYPED since the last move: Ctrl+Z belongs to the caret while it is true, and
     to the layout while it is false */
  var typed = false;
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
  /* how the CONTAINER itself lays its children out — the axis its gaps run across. Asked of the box,
     not of the box's parent (which is what flow() answers): a row is a flex line whether it sits in a
     block, in a cell or in the page grid. */
  function axisOf(box) {
    var cs;
    try { cs = getComputedStyle(box); } catch (e) { return 'y'; }
    if (cs.display === 'flex' || cs.display === 'inline-flex')
      return String(cs.flexDirection || '').indexOf('column') < 0 ? 'x' : 'y';
    return 'y';                       /* block flow and the page grid stack downwards */
  }

  /* the children that take part in a container's flow, with their boxes */
  function slots(box) {
    var out = [];
    for (var c = box.firstElementChild; c; c = c.nextElementSibling) {
      var r = c.getBoundingClientRect();
      if (r.width || r.height) out.push({ el: c, r: r });
    }
    return out;
  }

  /* WHERE BETWEEN TWO SIBLINGS the pointer sits, along the container's own axis. One rule for every
     gap there is: the space between two cells inside a row, the space between two rows inside a
     parent, and the space between two blocks in the page. The line is drawn at the boundary the drop
     would land on, and the drop inserts before that sibling (or appends when there is none). */
  function between(box, x, y) {
    var ax = axisOf(box), pos = ax === 'x' ? x : y;
    var list = slots(box), ref = null, host = null, before = false;
    for (var i = 0; i < list.length; i++) {
      var r = list[i].r, mid = ax === 'x' ? r.left + r.width / 2 : r.top + r.height / 2;
      if (pos < mid) { ref = list[i].el; host = list[i].el; before = true; break; }
    }
    if (!ref) { var last = list[list.length - 1]; host = last ? last.el : null; before = false; }
    return { box: box, ref: ref, inside: false, host: host, before: before, ax: ax };
  }

  /* ---- the three levels, read off the markup ----------------------------------------
     THE PAGE IS THREE ROWS DEEP ([1A] in PEDAGOGY-MAP): the section's row, the row inside one of
     its cells, and the row inside that cell, whose only job is to let two short things stand side
     by side. Depth is the nesting itself, so nothing is marked and nothing is counted twice. */
  function isRow(n) { return !!(n && n.nodeType === 1 && n.classList && n.classList.contains('rows')); }
  function isCell(n) { return !!(n && n.nodeType === 1 && n.parentElement && isRow(n.parentElement)); }
  function rowsAbove(n) {
    var d = 0;
    for (var p = n && n.parentElement; p; p = p.parentElement) if (isRow(p)) d++;
    return d;
  }
  function levelOf(row) { return rowsAbove(row) + 1; }
  function cellLevel(cell) { var r = cell && cell.parentElement; return isRow(r) ? levelOf(r) : 0; }
  function kindOf(n) { return isRow(n) ? 'row' : (isCell(n) ? 'cell' : 'item'); }
  /* the side band of a level-3 cell: the strip that reads as "beside", not "above" or "below" */
  var BAND = 24;
  /* the edge of the item inside a cell: held this close, the drop is the level-3 gesture rather than
     the level-2 one, so "beside this paragraph" and "beside this cell" are different targets */
  var EDGE3 = 3;

  function midY(el) { var r = el.getBoundingClientRect(); return r.top + r.height / 2; }
  /* the position a drop would give, against the place the node already holds: equal means no move */
  function samePlace(t, n) {
    if (!t || t.merge || !t.box) return false;
    /* a drop beside the item itself always makes a row it does not have yet, so it is never "already
       where it is" — the box it lands in is a cell both of them stand in, not the arrival's own place */
    if (t.insert === 'cell3') return false;
    if (t.box !== n.parentElement) return false;
    var ref = t.ref || null;
    return ref === n || ref === n.nextElementSibling;
  }

  /* ---- where would the node land? ---------------------------------------------------
     A CONTAINER ALTERNATES: a page and a block hold rows, a row holds cells, a cell at level 1
     or 2 holds rows or the block that owns them, and a level-3 cell holds items. So a drop is one
     of four shapes, and the level decides which are legal:
        A CELL INTO A ROW     it becomes a cell beside the ones already there.
        A ROW INTO A CELL     it becomes a row among the rows already there.
        A CELL INTO A CELL    there is no cell inside a cell, so the dropped cell's children move
                              into the target at the pointer's edge, in their own order, and the
                              emptied cell — and the row it left empty — go with it.
        A CELL BETWEEN ROWS   a cell inside a cell has no shape of its own, so a row is made for it
                              at that boundary and the cell becomes that row's only cell.
     WHAT EACH KIND MAY ENTER
        a row    never a cell, so a row dropped on a row's own area belongs to that row's parent;
                 a level-3 row is never dragged at all (down() refuses the press).
        a cell   a cell's SIDE EDGE at any level, where it sits beside it in that row; its middle,
                 where it merges (the merge above); a row, where it becomes a cell.
        an item  a cell's SIDE EDGE at any level, where it becomes a cell of that row; a level-3
                 cell straight on, where it becomes a cell that cell's row can hold; a level-2 cell
                 as a level-3 row of its own; anywhere else, an item joins the cell it was dropped
                 in, which is a place a cell has always been allowed to hold.
     THE EDGE IS THE SAME RULE AT EVERY LEVEL: `band` is a quarter of the cell, capped at BAND, so a
     narrow cell still has a middle to merge into. A markup box (.markup-row) is read as one object
     and placed, never merged, because its parent is a `.rows` and the shape test calls it a cell.
     A DROP OVER THE NODE ITSELF IS NOT A DROP. The pointer inside the dragged subtree returns no
     target at all: no line, and the release changes nothing — which is what makes putting a thing
     back where it came from safe.
     WHERE THE LINE GOES: every drop draws the line at the boundary it will land on. The tint is
     kept for a container with nothing to draw against — an empty cell. */
  /* A BLOCK'S WIDTH, AND THE FOUR COLUMNS BEHIND IT.
     A cell does not occupy one column — it occupies as many as the widest row of cells it holds, so a
     block whose rows are one cell and then two counts TWO at every point in its height, and only two
     more fit beside it. The count is structural, never geometric: it asks the DOM, never the browser's
     flex answer, so a row that solves with unequal widths cannot make a fifth cell look like a fourth.
     A level-2 line holds four cells and a level-1 line holds four widths, so any mix that comes to four
     works: four blocks one wide, one block four wide, or two and two. A level-3 row is private to its
     cell — it holds two and is NEVER counted upward, because a pair of items side by side is a detail
     of that cell and not a column of the page. A drop that would make one too many shows NO LINE AT
     ALL — the pointer has to find a place inside a cell that fits. */
  function elemKids(row) {
    var n = 0;
    for (var i = 0; i < row.children.length; i++) if (row.children[i].nodeType === 1) n++;
    return n;
  }
  function firstRowOfLevel(cell, lvl) {
    var best = null;
    for (var i = 0; i < cell.children.length; i++) {
      var c = cell.children[i];
      if (isRow(c) && levelOf(c) === lvl && elemKids(c) > (best ? elemKids(best) : 0)) best = c;
    }
    return best;
  }
  /* a cell's own rows: the .rows it holds directly, and any it holds through a wrapper such as
     .block — but never a row inside one of ITS rows, which belongs to that row's cells. A row stops
     the walk, so the count is the cell's own line and not the depth below it. */
  function ownRows(cell) {
    var out = [];
    (function walk(el) {
      for (var i = 0; i < el.children.length; i++) {
        var c = el.children[i];
        if (isRow(c)) { out.push(c); continue; }
        walk(c);
      }
    })(cell);
    return out;
  }
  /* the columns a cell occupies: its widest own row of cells, and never less than one */
  function weight(el) {
    if (!el || el.nodeType !== 1) return 1;
    var rs = ownRows(el);
    if (!rs.length) return 1;
    var w = 1;
    for (var i = 0; i < rs.length; i++) w = Math.max(w, elemKids(rs[i]));
    return w;
  }
  /* the columns the cells of a row occupy, together */
  function widths(row) {
    var n = 0;
    for (var i = 0; row && i < row.children.length; i++) {
      if (row.children[i].nodeType === 1) n += weight(row.children[i]);
    }
    return n;
  }
  function colsIn(l1row) { return widths(l1row); }
  function l1Of(row) {
    for (var p = row; p && p !== ca(); p = p.parentElement) if (isRow(p) && levelOf(p) === 1) return p;
    return null;
  }
  /* the level-3 row the level-3 gesture would put the arrival into, or null when one has to be made
     (which is always two cells, so it fits) */
  function rowFor3(item) {
    var p = item && item.parentElement;
    if (!p) return null;
    if (isRow(p)) return p;
    if (isCell(p) && cellLevel(p) >= 3) return p.parentElement;
    return null;
  }
  function fits(t, n) {
    if (!t || !t.insert) return true;
    if (t.insert === 'cell3') {
      var r3 = rowFor3(t.item);
      if (!r3) return true;
      var have3 = elemKids(r3) + (isRow(t.item.parentElement) ? 1 : 0);
      return have3 + 1 <= 2;
    }
    /* MERGING AND ROW-DROPPING WIDEN A CELL TOO. A cell merged into another brings its own rows with
       it, and a row dropped into a cell becomes one more row of cells there — either can push the
       line above four with no cell ever being added to a row. Count what arrives, not what lands. */
    if (t.insert === 'row' || t.insert === 'merge') {
      var host = isCell(t.box) ? t.box : (isCell(t.merge) ? t.merge : null);
      if (!host || cellLevel(host) > 2) return true;
      var b1 = l1Of(host);
      if (!b1) return true;
      var comes = t.insert === 'merge' ? weight(n) : (isRow(n) ? Math.max(1, elemKids(n)) : 1);
      var rest = colsIn(b1) - weight(host);
      return rest + Math.max(weight(host), comes) <= 4;
    }
    /* HOW WIDE THE ARRIVAL IS. A cell arrives as wide as the widest row it holds; a joined row
       arrives as the sum of its cells' widths. A LEVEL-2 LINE COUNTS CELLS, not widths, because a
       level-3 row inside a cell is private to that cell and never widens the line above it. */
    var row = null, add = 1, addW = 1;
    if (t.insert === 'cell') { row = isRow(t.box) ? t.box : null; addW = weight(n); }
    else if (t.insert === 'join') {
      row = isRow(t.box) ? t.box : null;
      add = elemKids(n); addW = widths(n);
    }
    if (!row) return true;
    var base = levelOf(row) === 1 ? row : l1Of(row);
    if (!base) return true;
    /* WHAT LEAVES COUNTS. A cell or a row moved from one place to another inside the same level-1 tree
       does not add a column — it trades one for another — so the move is allowed even in a full row. */
    var srcRow = n.parentElement;
    var sameTree = isRow(srcRow) && l1Of(srcRow) === base;
    if (t.insert === 'cell' && n.parentElement === row) { add = 0; addW = 0; }
    else if (sameTree) {
      if (t.insert === 'join') {
        add = Math.max(0, add - elemKids(srcRow));
        addW = Math.max(0, addW - widths(srcRow));
      } else { add = 0; addW = 0; }
    }
    /* A LEVEL-2 ROW HOLDS FOUR CELLS, and widening it also widens the block it sits in: the block
       beside it keeps its own width, so the line above must still come to four. A LEVEL-1 ROW HOLDS
       FOUR WIDTHS: its cells hold their own rows, so the columns that end up side by side across the
       page are that row's whole tree. */
    if (levelOf(row) === 2) {
      if (elemKids(row) + add > 4) return false;
      /* the cell this row sits in, through any wrapper (.block) between them */
      var cell = null;
      for (var p = row.parentElement; p && p !== ca(); p = p.parentElement) if (isCell(p)) { cell = p; break; }
      if (!cell) return true;
      var others = colsIn(base) - weight(cell);
      var grown = Math.max(weight(cell), elemKids(row) + add);
      return others + grown <= 4;
    }
    return colsIn(base) + addW <= 4;
  }
  function pick(x, y) {
    var t = pickRaw(x, y);
    return fits(t, drag && drag.node) ? t : null;
  }
  function pickRaw(x, y) {
    var n = drag.node;
    var el = document.elementFromPoint(x, y);
    if (!el) return null;
    if (el === n || n.contains(el)) return null;        /* over itself: not a drop */
    if (!inside(el)) return null;

    var row = el.closest ? el.closest('.rows') : null;
    if (!row) return el === ca() ? inPage(x, y) : null;

    /* the space AROUND a row is its parent's: the band above or below the row's own cells */
    var cs = slots(row), top = Infinity, bottom = -Infinity;
    for (var i = 0; i < cs.length; i++) { top = Math.min(top, cs[i].r.top); bottom = Math.max(bottom, cs[i].r.bottom); }
    if (cs.length && (y < top - 2 || y > bottom + 2)) {
      var up = row.parentElement;
      if (!up || up === ca() || !isCell(up)) return inPage(x, y);
      var beforeIt = y < (top + bottom) / 2;
      var ref = beforeIt ? row : (row.nextElementSibling || null);
      /* A ROW DROPPED THERE joins the rows already in the cell. A CELL DROPPED THERE needs a row
         of its own at that boundary, because a cell inside a cell is not a shape the page has —
         the row is made at the drop, and the cell goes into it. */
      if (drag.kind === 'row') {
        var tr = { box: up, ref: ref, inside: !ref, host: ref || row, before: beforeIt, ax: 'y', insert: 'row' };
        return samePlace(tr, drag.node) ? null : tr;
      }
      return { box: up, ref: ref, host: ref || row, before: beforeIt, ax: 'y', insert: 'row', wrapCell: true };
    }

    if (el === row) return inRow(row, x, y);            /* the row's padding, or the gap between cells */

    var cell = el.closest('.rows>*');
    if (!cell) return inPage(x, y);
    /* the ITEM under the pointer, if there is one: an edge of it is the level-3 gesture, and the cell
       around it is the wider level-2 one */
    var inner = null;
    if (el !== cell && cell.contains(el)) {
      var n2 = el;
      while (n2 && n2 !== cell && !movable(n2)) n2 = n2.parentElement;
      if (n2 && n2 !== cell && cell.contains(n2) && !isRow(n2)) inner = n2;
    }
    return inCell(cell, x, y, inner, el);
  }

  /* a row's own area: a cell goes in beside the cells already there; a row cannot be a cell */
  function inRow(row, x, y) {
    if (drag.kind === 'row') {
      var up = row.parentElement;
      if (!up || up === ca() || !isCell(up)) return inPage(x, y);
      var t = between(up, x, y);
      t.insert = 'row';
      return samePlace(t, drag.node) ? null : t;
    }
    var t2 = between(row, x, y);
    t2.insert = 'cell';
    return samePlace(t2, drag.node) ? null : t2;
  }

  /* the content area's own area: a row goes in among the rows; anything else is given a row */
  function inPage(x, y) {
    var t = between(ca(), x, y);
    t.insert = 'row';
    return samePlace(t, drag.node) ? null : t;
  }

  /* a cell's body — the place a row lands, and the place a cell merges into. */
  function inCell(cell, x, y, inner, el) {
    var k = drag.kind;

    /* EVERY GESTURE IS MEASURED ON THE LEVEL-2 CELL. Whatever the pointer is over — a level-2 cell, a
       level-3 row, a level-3 cell, the item itself — the drop is read against the box that holds them
       all, so the three gestures sit inside one another instead of competing:

         the side line of an item  -> a cell beside that item, one level down (level 3)
         the cell's own sides      -> a cell beside the cell, on its row      (level 2)
         the bottom, and all else  -> into the cell, among what it holds      (level 3 inside it)

       Measuring the level-3 cell's own edges as "beside" is what made level 2 unreachable: every item
       sits inside one, so its edges were one level too deep. */
    var guard = 0;
    while (cell && guard++ < 4 && isCell(cell) && cellLevel(cell) > 2) {
      var upRow = rowOf(cell);
      if (!upRow || !upRow.parentElement || !isCell(upRow.parentElement)) break;
      cell = upRow.parentElement;
    }
    var lvl = cellLevel(cell);

    /* A MARKUP BOX MOVES WHOLE. It is a `details` in a .markup-row, so its parent is a `.rows` and the
       shape test calls it a cell — which would merge its summary and body into another cell. Read as one
       object, it is placed and never merged. */
    var loose = !!(drag.node.closest && drag.node.closest('.markup-row')) && k === 'cell' ? 'item' : k;

    /* LEVEL 3 IS THE SIDE LINE OF AN ITEM, from the side that leaves the item where it is. Three pixels,
       because it is the finer of the two side gestures: past that line is the cell's own side, which is
       level 2. */
    var it = itemUnder(cell, el) || inner;
    if (loose === 'item' && it && it !== drag.node && lvl <= 2) {
      var ir = it.getBoundingClientRect();
      var near = x <= ir.left + EDGE3 ? 'left' : (x >= ir.right - EDGE3 ? 'right' : null);
      if (near) {
        var t3 = { box: cell, ref: null, host: it, before: near === 'left', ax: 'x', insert: 'cell3', item: it };
        return samePlace(t3, drag.node) ? null : t3;
      }
    }

    /* BESIDE, AT EVERY LEVEL, IS THE CELL'S OWN EDGE — the same rule the level-3 cell already had, read
       one level up. A cell dropped on another cell's side sits beside it in that row; dropped in the
       middle it merges, as it always did. An item dropped on the same edge becomes a cell of that row,
       because the side is the only place an item can arrive without going inside the cell. */
    /* THE TOP OR BOTTOM LINE OF A LEVEL-3 CELL IS THAT CELL: held within three pixels of either edge,
       the arrival goes IN — above or below what the cell already holds — instead of making a new
       level-3 row beside it. It is the level-3 cell's own edge, not the item's. */
    var deep = null;
    if (el && el !== cell) {
      var dn = el;
      while (dn && dn !== cell) {
        if (isCell(dn) && cellLevel(dn) >= 3) { deep = dn; break; }
        dn = dn.parentElement;
      }
    }
    if (loose !== 'row' && deep && deep !== drag.node) {
      var dr = deep.getBoundingClientRect();
      var atTop = y <= dr.top + EDGE3, atBot = y >= dr.bottom - EDGE3;
      if (atTop || atBot) {
        var td = { box: deep, ref: atTop ? (deep.firstElementChild || null) : null,
                   host: deep, before: atTop, ax: 'y', insert: 'row' };
        return samePlace(td, drag.node) ? null : td;
      }
    }

    var er = cell.getBoundingClientRect();
    /* BESIDE AT LEVEL 2 IS A WIDE TARGET — a fifth of the cell, capped — because that is the ordinary
       gesture: put this thing on the line beside that one. LEVEL 3 IS NOT: it asks for the pointer to
       be held almost exactly on the edge of the item inside (EDGE3), so the narrow gesture is the one
       that goes a level down. */
    var band = Math.min(200, Math.round(er.width * 0.2));
    var bband = Math.min(40, Math.round(er.height * 0.25));
    /* THE BOTTOM OF THE CELL IS ITS OWN BAND AND IT WINS OVER THE SIDES: the bottom is where "add this
       to what the cell holds" lives, so the corner keeps that gesture rather than the side's. */
    var nearBottom = y > er.bottom - bband;
    var edge = !nearBottom && x < er.left + band ? 'left'
             : (!nearBottom && x > er.right - band ? 'right' : null);
    if (edge && loose === 'row') {
      /* A ROW BESIDE A ROW: two rows cannot stand side by side — a row is a line, not a box — so the
         dropped row's cells join the row it was dropped on, which puts what the two rows held beside
         each other on one line. That is the only shape "row beside row" has. */
      var tj = { box: cell.parentElement, ref: edge === 'left' ? cell : (cell.nextElementSibling || null),
                 host: cell, before: edge === 'left', ax: 'x', insert: 'join' };
      return samePlace(tj, drag.node) ? null : tj;
    }
    if (edge && (loose === 'cell' || loose === 'item')) {
      if (loose === 'cell' && cell === drag.node.parentElement) return null;
      var atC = edge === 'left' ? cell : (cell.nextElementSibling || null);
      var tc = { box: cell.parentElement, ref: atC, host: cell, before: edge === 'left', ax: 'x', insert: 'cell' };
      return samePlace(tc, drag.node) ? null : tc;
    }

    /* A CELL INTO A CELL: the target takes the dropped cell's children at the pointer's edge, in
       their own order, and the emptied cell goes when the drop is recorded. */
    if (loose === 'cell') {
      if (cell === drag.node.parentElement) return null;      /* its own cell: no merge to make */
      var tm = between(cell, x, y);
      tm.insert = 'merge'; tm.merge = cell;
      return samePlace(tm, drag.node) ? null : tm;
    }

    /* a row into a cell, or an item: a new row among the rows already here */
    var t4 = between(cell, x, y);
    t4.insert = 'row';
    return samePlace(t4, drag.node) ? null : t4;
  }

  /* THE LEVEL THE DROP WILL LAND ON, which is what the line's colour says: the level of the row the
     arrival becomes a cell of, or the level of the row that is made for it. */
  function targetLevel(t) {
    if (!t || !t.box) return 0;
    var box = t.box;
    if (box === ca()) return 1;
    if (isRow(box)) return levelOf(box);
    if (isCell(box)) return cellLevel(box) + (t.insert === 'cell3' ? 1 : 0);
    return 0;
  }

  /* the line, drawn at the boundary the drop will land on. A target with no host is a container
     with nothing to draw against (an empty cell), and that one is tinted instead. */
  function showLine(t) {
    if (!line) { line = document.createElement('div'); line.className = 'layout-line'; document.body.appendChild(line); }
    if (!t) { line.style.display = 'none'; return; }
    line.style.display = 'block';
    var lvl = targetLevel(t), lvlCls = lvl >= 1 && lvl <= 3 ? ' lvl' + lvl : '';
    var r;
    if (!t.host) {
      r = t.box.getBoundingClientRect();
      line.className = 'layout-line is-inside' + lvlCls;
      line.style.left = r.left + 'px'; line.style.top = r.top + 'px';
      line.style.width = r.width + 'px'; line.style.height = r.height + 'px';
      return;
    }
    line.className = 'layout-line' + lvlCls;
    r = t.host.getBoundingClientRect();
    var ax = t.ax || axisOf(t.box);
    if (ax === 'x') {
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
    out.push('S' + (si || '?') + (ri ? ' · R' + ri : '') + (ci ? ' · cell ' + ci : '') + (n.matches('.rows') ? ' (THE ROW — pick a cell for a width)' : ''));
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
  /* WHAT A PRESS WOULD PICK UP IS SHOWN BEFORE THE PRESS. Every grain a drag would take — a paragraph,
     a list, a chart, a question, a whole block, each one separately — carries a dotted frame while the
     layer is on, so the divisions the drag will honour are visible before anything moves. An attribute
     like every other trace of the tool, so clean() takes it out of the page before a save. */
  function markGrains() {
    var c = ca(); if (!c) return;
    [].forEach.call(c.querySelectorAll('[data-layout-grain]'), function (n) { n.removeAttribute('data-layout-grain'); });
    markGrips();                                  /* the row handles follow every change to the page */
    if (!ON) return;
    [].forEach.call(c.querySelectorAll(GRAIN + ',' + COMPOSITE), function (n) {
      if (!movable(n) || isItem(n)) return;      /* a cell already has a frame of its own */
      if (!n.closest('.rows>*')) return;         /* only what stands inside a cell is content */
      if (isRow(n) && levelOf(n) >= 3) return;   /* a level-3 row cannot be carried: no frame */
      n.setAttribute('data-layout-grain', '');
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
  /* A FLEX VALUE BELONGS ON AN ITEM, NEVER ON A CONTAINER. A cell is a direct child of a .rows; the
     .rows itself is the panel that lays the cells out, and putting `flex` on it does nothing at all —
     which is exactly what happens if a press lands on a row's own padding and the row becomes the
     selection. So every width action below is refused unless the target is a cell, and `even row` is
     the one action that accepts either the row or one of its cells. */
  function isItem(n) {
    return !!(n && n.nodeType === 1 && n.parentElement &&
      n.parentElement.classList && n.parentElement.classList.contains('rows') &&
      !n.classList.contains('rows'));
  }
  function act(what, field) {
    if (!sel) return;
    var n = sel, row = n.classList.contains('rows') ? n : n.parentElement;
    if (what === 'del') { remove(n); return; }
    if (what === 'even') {
      if (!row || !row.classList || !row.classList.contains('rows')) return;
      var kids = [].filter.call(row.children, function (k) { return k.nodeType === 1; }), c = kids.length;
      kids.forEach(function (k) { k.style.flex = '0 0 calc((100% - ' + (c - 1) + ' * 26px) / ' + c + ')'; });
      markPins(); select(n); paintChip();
      return;
    }
    if (!isItem(n)) return;            /* a container, a block, a paragraph: never a flex item, never written */
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
        '<button type="button" data-act="del" class="layout-del">delete</button>' +
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
    var item = isItem(sel), isRow = !!(sel && sel.classList && sel.classList.contains('rows'));
    [].forEach.call(panelEl.querySelectorAll('[data-act]'), function (b) {
      var a = b.getAttribute('data-act');
      /* `delete` takes anything the drag may pick up, including a row; `even row` takes a row or a
         cell; the width actions need a cell, because a flex value on a container does nothing (and
         hiding them is what stops it being tried) */
      if (a === 'del') b.disabled = !(sel && sel !== ca() && !still(sel) && inside(sel));
      else if (a === 'even') b.disabled = !(item || isRow);
      else b.disabled = !item;
    });
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
    chipEl.textContent = 'Shift+drag a block · ' + moved + ' change' + (moved === 1 ? '' : 's') +
      (hist.length ? ' · Ctrl+Z undo' : '') + ' · Esc to stop';
  }

  /* ---- the move, and taking it back ----------------------------------------------- */
  /* an emptied .rows is removed, and remembered, so nothing leaves an empty flex row behind.
     A node's parent may be the ROW it left or the CELL it left inside one, so both are read here. */
  function rowOf(from) {
    if (!from || from.nodeType !== 1) return null;
    if (from.classList && from.classList.contains('rows')) return from;
    var p = from.parentElement;
    return p && p.classList && p.classList.contains('rows') ? p : null;
  }
  /* THE ITEM UNDER THE POINTER: the deepest thing standing in a cell, which is what the level-3 gesture
     is measured against. Null when the pointer is over a cell's padding rather than its content. */
  function itemUnder(cell, el) {
    var n = el;
    while (n && n !== cell) {
      if (n.parentElement && isCell(n.parentElement)) return n;
      n = n.parentElement;
    }
    return null;
  }
  /* NOTHING EMPTY STAYS. An emptied cell prunes itself, and the row it leaves empty prunes itself,
     and the cell THAT leaves empty prunes too — the page climbs until it meets something that still
     holds content. Each removal is recorded in the order it happened, because undo has to put the
     outermost box back first: a cell can only return to a parent that exists again.
     AN EMPTY DIV COUNTS: a wrapper the tool made is as empty as a cell the author made. */
  function tidy(from) {
    var gone = [], n = from;
    while (n && n.nodeType === 1 && n !== ca()) {
      var row = rowOf(n);
      if (!row) break;
      [].slice.call(row.children).forEach(function (k) {
        if (k.children.length || (k.textContent || '').trim()) return;
        gone.push({ el: k, parent: row, next: k.nextElementSibling });
        row.removeChild(k);
      });
      if (row.children.length) break;
      var up = row.parentNode;
      gone.push({ el: row, parent: up, next: row.nextElementSibling });
      if (up) up.removeChild(row);
      n = up;                              /* the cell the row was in: now possibly empty itself */
    }
    return gone;
  }

  /* EVERY BLOCK LIVES IN A ROW. A node dropped at section level used to become a bare child of
     .content-area — full width, and nothing could ever be placed beside it, because a row is the only
     thing that holds more than one cell. It is wrapped in a fresh .rows with one cell instead, so the
     next drop on that row's area has a cell to become. A node that was ITSELF a cell needs no second
     cell: the new row is the shape it already had.
     WHY A CELL DIV AND NOT THE NODE ITSELF: `.rows>*` is `display:flex;flex-direction:column`, so
     whatever is made a cell is forced into a flex column. A .block already is one; a table, a
     paragraph or a list is not, and turning one into a flex container breaks its own layout. */
  function wrap(n, wasCell) {
    if (!n || !n.parentNode) return null;
    if (n.closest && n.closest('.rows')) return null;      /* already a cell's content */
    if (!n.matches || still(n)) return null;
    var row = document.createElement('div');
    row.className = 'rows';
    n.parentNode.insertBefore(row, n);
    if (wasCell) { row.appendChild(n); return row; }
    var cell = document.createElement('div');
    row.appendChild(cell);
    cell.appendChild(n);
    return row;
  }
  /* a bare item standing in a ROW becomes a cell of its own: `.rows>*` is a flex column, so the page
     never lets a paragraph play the part of a box. A DIV is already the page's own cell. */
  function cellAround(n) {
    if (!n || !n.parentNode || !isRow(n.parentNode)) return null;
    if (n.tagName === 'DIV') return null;
    var cell = document.createElement('div');
    n.parentNode.insertBefore(cell, n);
    cell.appendChild(n);
    return cell;
  }
  function unwrap(w) {
    if (!w || !w.parentNode) return;
    if (w.textContent.trim() || w.querySelector('input,img,svg,table,audio,textarea')) return;
    w.parentNode.removeChild(w);
  }

  /* a .rows holding exactly one node, made at the drop. Used when the shape the drop needs does not
     exist yet: a cell that has to stand between two rows, and that no row can hold as it is. */
  function rowAround(n) {
    var p = n && n.parentNode;
    if (!p) return null;
    var row = document.createElement('div');
    row.className = 'rows';
    var cell = document.createElement('div');
    row.appendChild(cell);
    p.insertBefore(row, n);
    cell.appendChild(n);
    return row;
  }

  /* THE ROW A MERGED CHILD NEEDS. A cell's children entering another cell are the cells of the row
     the dropped cell used to be — so a bare paragraph arriving beside a .block would be a shape the
     page does not have (an item and a box sharing one cell, one of them unable to be dragged
     independently). Each item that is not already a row, and not the block that owns its own
     content, is given the row it would have had where it came from: level 2 inside a level-1 cell,
     level 3 inside a level-2 one — the deepest a cell's content may go. */
  function mergeRow(k) {
    if (!k || k.nodeType !== 1) return null;
    if (isRow(k)) return null;                                  /* already a row */
    if (!k.classList || k.classList.contains('block')) return null;   /* a block owns its content */
    if (still(k) || part(k)) return null;                       /* a heading, a control's part */
    var row = document.createElement('div');
    row.className = 'rows';
    var cell = document.createElement('div');
    row.appendChild(cell);
    cell.appendChild(k);
    return row;
  }

  /* THE ROW THE ITEM SITS IN, ONE LEVEL DOWN, MADE IF IT IS NOT THERE: a paragraph bare in a row gets
     its cell; a paragraph inside a level-2 cell gets a level-3 row with a cell inside it. What was made
     is recorded, so the undo can take it apart again. */
  function ensureRow3(item, rec) {
    var p = item && item.parentElement;
    if (!p) return null;
    if (isRow(p)) {
      var c = document.createElement('div');
      p.insertBefore(c, item);
      c.appendChild(item);
      rec.cell = c;
      return p;
    }
    if (isCell(p) && cellLevel(p) >= 3) return rowOf(p) || null;   /* already in a level-3 cell: its row */
    if (isCell(p) && cellLevel(p) <= 2) {
      var row = document.createElement('div'); row.className = 'rows';
      var box = document.createElement('div');
      row.appendChild(box);
      p.insertBefore(row, item);
      box.appendChild(item);
      rec.row = row;
      return row;
    }
    return null;
  }

  /* NOTHING ARRIVES WITHOUT ITS THREE LEVELS. An ITEM dropped anywhere is read from where it landed: a
     bare item in a row gets a cell, and an item standing in a cell above level 3 gets the row and the
     cell it needs, one level at a time. Only the arrival is wrapped — a cell or a row arrives with its
     own contents, and touching those would restructure a page the teacher did not touch. What is made
     is recorded, so an undo takes it apart again. */
  function ensureDeepArrival(n, rec, kind) {
    if (!n || !n.parentElement) return;
    if (kind !== 'item') return;
    var guard = 0;
    while (n.parentElement && guard++ < 4) {
      var p = n.parentElement;
      if (isRow(p) && !isCell(n)) {
        var c = document.createElement('div');
        p.insertBefore(c, n);
        c.appendChild(n);
        rec.cells.push(c);
      }
      var cell = n.parentElement;
      if (!isCell(cell) || cellLevel(cell) >= 3) break;
      var row = document.createElement('div'); row.className = 'rows';
      var box = document.createElement('div');
      row.appendChild(box);
      cell.insertBefore(row, n);
      box.appendChild(n);
      rec.rows.push(row);
    }
  }

  /* A ROW IS RE-SOLVED WHERE THE DROP LANDED. The page is edited on its solved geometry, so a row that
     gained or lost a cell is measured again straight away — the whole page is solved on Done, because
     heights settle across rows. Cleaning only that row leaves every other row's widths untouched. */
  function resolve(el) {
    var E = window.EqualizeRows;
    if (!E) return;
    try {
      var row = el && el.closest ? el.closest('.rows') : null;
      if (row) { E.clean(row); E.solve(row); }
      checkCap(row);
    } catch (e) { /* a page without the solver keeps the widths it has */ }
  }

  /* THE CAP IS CHECKED ON THE PAGE, NOT ONLY ON THE GESTURE. Every drop already refuses a fifth column,
     but a cap that lives only in a decision cannot be trusted: this reads the row after the drop and
     says so in the console when a line carries more than four, so a hole in the gestures is visible
     instead of silent. */
  function checkCap(el) {
    if (!el) return;
    if (el.classList && el.classList.contains('markup-row')) return;   /* a gallery of boxes, not a line of columns */
    var l1 = levelOf(el) === 1 ? el : l1Of(el);
    if (l1 && colsIn(l1) > 4) console.warn('layout: level-1 line carries ' + colsIn(l1) + ' columns', l1);
    if (levelOf(el) === 2 && elemKids(el) > 4) console.warn('layout: level-2 row holds ' + elemKids(el) + ' cells', el);
    if (levelOf(el) === 3 && elemKids(el) > 2) console.warn('layout: level-3 row holds ' + elemKids(el) + ' cells', el);
  }

  function resolveAll() {
    var E = window.EqualizeRows;
    if (!E) return;
    try { E.clean(); document.documentElement.classList.add('eq-ready'); E.run(); } catch (e) {}
  }

  /* does every line this drop touched still hold its cap? level 1: four columns, level 2: four cells,
     level 3: two cells — and only a line that the drop made WORSE is a failure. */
  function capHolds(guards) {
    for (var i = 0; i < guards.length; i++) {
      var g = guards[i], lvl = levelOf(g.row);
      var now = lvl === 1 ? colsIn(g.row) : elemKids(g.row);
      var max = lvl === 1 ? 4 : (lvl === 3 ? 2 : 4);
      if (now > max && now > g.was) return false;
    }
    return true;
  }

  function applyDrop(d) {
    var n = d.node, t = d.t;
    if (!t) return;
    var from = { parent: n.parentNode, next: n.nextElementSibling };
    /* the lines this drop could widen, read BEFORE the page changes: the one the node left, and the one
       it lands in. Compared after the drop, a line that went over the cap is taken back. */
    var guards = [];
    (function () {
      var a = l1Of(n); if (a) guards.push({ row: a, was: colsIn(a) });
      var tb = t.box || n;
      var b = levelOf(tb) === 1 ? tb : l1Of(tb);
      if (b && b !== a) guards.push({ row: b, was: colsIn(b) });
      var l3 = isRow(tb) ? tb : null;
      if (l3 && levelOf(l3) === 3) guards.push({ row: l3, was: elemKids(l3) });
      var l2 = isRow(tb) ? tb : null;
      if (l2 && levelOf(l2) === 2) guards.push({ row: l2, was: elemKids(l2) });
    })();
    var back = null, wraps = [], fill = { rows: [], cells: [] };
    /* A MERGE MOVES WHAT THE CELL HELD, not the cell: a cell inside a cell is not a shape the page
       has, so its children go into the target at the edge the pointer is on, keeping their order,
       and the emptied cell is pruned with the rest. The record keeps them so undo can put them
       back before the cell returns. */
    if (t.insert === 'cell3') {
      /* BESIDE THE ITEM ITSELF, ONE LEVEL DOWN. The item's own row is made first — the cell it needs
         if it was bare in a row, or a whole level-3 row inside its cell — and the arrival goes beside
         it as a cell of that row. */
      var host = t.item;
      var made = { host: host, parent: host.parentElement, next: host.nextElementSibling, row: null, cell: null };
      var row3 = ensureRow3(host, made);
      var hcell = host.parentElement;
      if (row3 && hcell && isCell(hcell)) {
        var ref3 = t.before ? hcell : (hcell.nextElementSibling || null);
        row3.insertBefore(n, ref3);
        if (n.tagName !== 'DIV') { var cw3 = cellAround(n); if (cw3) wraps.push(cw3); }
      }
      back = { made: made };
    } else if (t.insert === 'join') {
      /* the dropped row's cells move into the row it was dropped on, at the edge, in their order; the
         emptied row goes with the rest and comes back on undo, with its cells */
      var cells = [].slice.call(n.children);
      if (!cells.length) return;
      for (var j = 0; j < cells.length; j++) t.box.insertBefore(cells[j], t.ref || null);
      back = { join: { row: n, cells: cells } };
    } else if (t.insert === 'merge') {
      var dest = t.merge, kids = [].slice.call(n.children);
      if (!kids.length) return;
      var at = t.ref || null, moves = [];
      for (var i = 0; i < kids.length; i++) {
        var row = mergeRow(kids[i]);
        moves.push({ item: kids[i], row: row });
        dest.insertBefore(row || kids[i], at);
      }
      back = { cell: n, moves: moves };
    } else {
      if (t.inside) {
        if (t.box === from.parent && t.box.lastElementChild === n) return;   /* already there */
        if (t.ref) t.box.insertBefore(n, t.ref);
        else t.box.appendChild(n);
      } else {
        if (t.box === from.parent && (t.ref || null) === from.next) return;  /* already there */
        t.box.insertBefore(n, t.ref || null);
      }
      var roww = t.wrapCell ? rowAround(n) : wrap(n, d.cell);
      if (roww) wraps.push(roww);
      /* AN ITEM THAT LANDS AS A CELL GETS A DIV FOR ITS CELL: the page keeps one shape — a cell is a
         div and the item is its content — instead of a paragraph playing the part of a box. */
      if (t.insert === 'cell' && n.tagName !== 'DIV' && isRow(n.parentNode)) {
        var cw = cellAround(n); if (cw) wraps.push(cw);
      }
    }
    /* THE ARRIVAL IS WRAPPED TO ITS THREE LEVELS before anything is pruned */
    ensureDeepArrival(n, fill, d.kind);
    if (fill.rows.length || fill.cells.length) { back = back || {}; back.fill = fill; }

    /* tidy() starts at the cell the node left: it finds that cell's row itself, so the row does not
       have to be captured before the prune any more. */
    var gone = tidy(from.parent);
    hist.push({ node: n, from: from, gone: gone, wraps: wraps, back: back });
    if (hist.length > 40) hist.shift();
    /* THE CAP IS A POST-CONDITION, NOT ONLY A DECISION. A gesture can reach a row by a path `fits` did
       not model — a level-2 side band that lands a line wider than four, an arrival that carries a row
       of its own. If the drop made a line wider than four, or a level-3 row wider than two, it is taken
       back before anything is counted as a move. A page that was ALREADY over stays as it is: only a
       drop that makes it worse is refused. */
    if (!capHolds(guards)) { undo(); return; }
    typed = false;
    moved++; markPins(); markGrains(); paintChip();
    /* the row it landed in, and the row it left, are solved again — nothing else is touched */
    resolve(t.box || n); if (from.parent) resolve(from.parent);
  }

  /* DELETE IS A MOVE, AND IT UNDOES LIKE ONE. The node leaves the page and the record of where it came
     from goes on the same stack as a drag, so one click on the chip puts it back — which is the whole
     reason the tool needs no confirmation dialog. */
  function remove(n) {
    if (!n || !inside(n) || still(n)) return false;
    var parent = n.parentNode;
    if (!parent) return false;
    var rec = { node: n, from: { parent: parent, next: n.nextElementSibling }, gone: [], wraps: [], back: null };
    parent.removeChild(n);
    rec.gone = tidy(parent);
    hist.push(rec);
    if (hist.length > 40) hist.shift();
    typed = false;
    moved++; markPins(); markGrains(); select(null); paintChip(); resolveAll();
    return true;
  }

  function undo() {
    var s = hist.pop();
    if (!s) return false;
    typed = false;
    /* A NEW BLOCK UNDOES BY GOING: the record is the row this tool made, so the undo takes it out
       rather than putting it back. */
    if (s.added) {
      if (s.node.parentNode) s.node.parentNode.removeChild(s.node);
      moved = Math.max(0, moved - 1);
      markPins(); markGrains(); paintChip(); resolveAll();
      return true;
    }
    /* WHAT WENT IS PUT BACK IN THE REVERSE OF THE ORDER IT WENT, so every box returns to a parent
       that is there again: the outermost cell first, then the row it left, then the cell inside it. */
    for (var i = (s.gone || []).length - 1; i >= 0; i--) {
      var g = s.gone[i];
      if (g.parent) g.parent.insertBefore(g.el, g.next && g.next.parentNode === g.parent ? g.next : null);
    }
    s.from.parent.insertBefore(s.node,
      s.from.next && s.from.next.parentNode === s.from.parent ? s.from.next : null);
    /* a merge takes a cell apart, so its children come home before the cell does — and the row a
       child was carried in comes out with it, so the cell goes back to holding what it held */
    if (s.back) {
      if (s.back.made) {
        /* the row (or the cell) that was made for the item beside it comes out, and the item goes back
           where it stood first, because the box that was made for it is about to go */
        var mk = s.back.made;
        if (mk.host && mk.parent) {
          var bk = mk.next && mk.next.parentNode === mk.parent ? mk.next : null;
          mk.parent.insertBefore(mk.host, bk);
        }
        if (mk.row && mk.row.parentNode) mk.row.parentNode.removeChild(mk.row);
        if (mk.cell && mk.cell.parentNode) mk.cell.parentNode.removeChild(mk.cell);
      } else if (s.back.join) {
        /* the cells go back into the row they came out of, in the order they were carried */
        var jn = s.back.join;
        for (var k2 = 0; k2 < jn.cells.length; k2++) jn.row.appendChild(jn.cells[k2]);
      } else if (s.back.moves) {
        s.back.moves.forEach(function (m) {
          s.back.cell.appendChild(m.item);
          if (m.row && m.row.parentNode) m.row.parentNode.removeChild(m.row);
        });
      } else {
        (s.back.kids || []).forEach(function (k) { s.back.cell.appendChild(k); });
      }
    }
    for (var j = (s.wraps || []).length - 1; j >= 0; j--) unwrap(s.wraps[j]);
    /* the rows the drop made to give the arrival its levels go when they hold nothing: the node has
       already been put back where it came from, so what is left is an empty box */
    if (s.back && s.back.fill) {
      var fr = s.back.fill.rows;
      for (var f1 = fr.length - 1; f1 >= 0; f1--) {
        var r0 = fr[f1];
        var host = r0.parentNode;
        if (!host) continue;
        /* what the row was made around goes back where the row stood, then the row itself goes */
        for (var f2 = r0.children.length - 1; f2 >= 0; f2--) {
          var box = r0.children[f2];
          while (box.children.length) host.insertBefore(box.children[box.children.length - 1], r0);
        }
        host.removeChild(r0);
      }
      var fc = s.back.fill.cells || [];
      for (var f3 = fc.length - 1; f3 >= 0; f3--) {
        var c0 = fc[f3];
        if (!c0.parentNode) continue;
        while (c0.children.length) c0.parentNode.insertBefore(c0.children[c0.children.length - 1], c0);
        c0.parentNode.removeChild(c0);
      }
    }
    moved = Math.max(0, moved - 1);
    markPins(); markGrains(); paintChip(); resolveAll();
    return true;
  }

  /* ---- the gesture -----------------------------------------------------------------
     ONE MODIFIER DECIDES WHAT A PRESS DOES. Without Shift the press belongs to the text: the
     area is contenteditable while edit mode is open, so a click places a caret and the teacher
     types. With Shift the press belongs to this file: a drag moves the node, a shift-click that
     never travels selects it for the width panel.
     THE CARET IS NOT TAKEN AWAY BY SHIFT. The press is not cancelled, so a Shift+click still lands
     a caret and typing still works; only a press that TRAVELS becomes a drag, and only then is the
     area taken out of contenteditable (a live contenteditable starts a text drag of its own) and
     the text selection cleared. */
  /* ---- A NEW BLOCK -----------------------------------------------------------------------
     SHIFT + RIGHT CLICK ABOVE, BELOW OR BETWEEN what is already on the page, and a block arrives
     where the click landed. It is a level-1 row with one cell in it and nothing else: a `.block`
     holding an empty `h3`, because a page is wrapped to the depth its content needs — an empty row
     inside an empty cell is a shape with nothing in it, and the drop that fills the block makes the
     levels it needs. The caret goes straight into the headline, so the title is the next thing typed.
     The click reads the OUTERMOST row under the pointer, level 1 or 2 or 3 down: a block is never
     made inside a cell, only between the things that stand in the section. */
  function newBlockAt(x, y) {
    var c = ca();
    if (!c) return false;
    var el = document.elementFromPoint(x, y);
    if (!el || !c.contains(el)) return false;
    var row = el.closest ? el.closest('.rows') : null;
    /* climb to the outermost row: the one whose parent is not itself a cell's row */
    while (row && row.parentElement && row.parentElement !== c) {
      var up = row.parentElement.closest ? row.parentElement.closest('.rows') : null;
      if (!up || !c.contains(up)) break;
      row = up;
    }
    var host = row ? row.parentElement : c;
    var ref;
    if (row) {
      var b = row.getBoundingClientRect();
      ref = y < b.top + b.height / 2 ? row : (row.nextElementSibling || null);
    } else if (el === c) {
      ref = null;
    } else {
      var eb = el.getBoundingClientRect();
      ref = y < eb.top + eb.height / 2 ? el : (el.nextElementSibling || null);
    }
    var wrap = document.createElement('div'); wrap.className = 'rows';
    var cell = document.createElement('div');
    var block = document.createElement('div'); block.className = 'block';
    var h3 = document.createElement('h3');
    block.appendChild(h3);
    cell.appendChild(block);
    wrap.appendChild(cell);
    host.insertBefore(wrap, ref || null);
    hist.push({ node: wrap, from: null, added: true, gone: [], wraps: [], back: null });
    if (hist.length > 40) hist.shift();
    moved++; markPins(); markGrains(); paintChip();
    caretIn(h3);
    return true;
  }

  /* the caret goes inside the new headline: a block with no title is a block nobody can name */
  function caretIn(node) {
    try {
      var r = document.createRange();
      r.selectNodeContents(node); r.collapse(true);
      var s = window.getSelection();
      s.removeAllRanges(); s.addRange(r);
    } catch (err) { }
  }

  function menu(e) {
    if (!ON || !e.shiftKey) return;
    var n = e.target && e.target.nodeType === 1 ? e.target : null;
    if (!n || !inside(n)) return;
    e.preventDefault();
    newBlockAt(e.clientX, e.clientY);
    resolveAll();
  }

  /* ---- ROW GRIPS ---------------------------------------------------------------------
     THE `R1` AND THE CELL NUMBERS ARE CSS COUNTERS. They are pseudo-elements, so they cannot be
     pressed: nothing can start a drag from them, which is why pulling a row by its number did
     nothing. The grip is a real button laid over the row's left edge, outside every cell, so a row
     is picked up without having to find the gap between two cells first. A level-3 row gets none,
     because a level-3 row is never carried — its two items are dragged themselves. */
  var grips = [];
  function clearGrips() {
    for (var i = 0; i < grips.length; i++) grips[i].remove();
    grips = [];
  }
  function placeGrip(g) {
    var r = g.__row;
    if (!r || !r.isConnected) return;
    var b = r.getBoundingClientRect();
    g.style.left = Math.round(b.left - 22) + 'px';
    g.style.top = Math.round(b.top + 1) + 'px';
  }
  function placeGrips() { for (var i = 0; i < grips.length; i++) placeGrip(grips[i]); }
  function markGrips() {
    clearGrips();
    var c = ca();
    if (!ON || !c) return;
    [].forEach.call(c.querySelectorAll('.rows'), function (r) {
      if (levelOf(r) >= 3) return;
      var g = document.createElement('button');
      g.type = 'button';
      g.className = 'layout-grip';
      g.textContent = '\u28FF';
      g.setAttribute('aria-label', 'drag this row');
      g.__row = r;
      g.addEventListener('pointerdown', function (e) {
        if (!ON || e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        beginDrag(r, e);
      });
      document.body.appendChild(g);
      grips.push(g);
      placeGrip(g);
    });
  }

  function down(e) {
    if (!ON || e.button !== 0) return;
    if (!e.shiftKey) return;           /* the caret's press, not the layout's */
    var n = e.target && e.target.nodeType === 1 ? e.target : null;
    if (!n) return;
    /* walk up to the nearest thing that may be picked up: a word becomes its paragraph, a chart's cell
       becomes its table, an option becomes the whole question */
    while (n && !movable(n)) {
      if (n === ca() || !n.parentElement) return;
      n = n.parentElement;
    }
    if (!n) return;
    /* A LEVEL-3 ROW IS NOT A THING TO CARRY. It exists to put two short things beside each other,
       and where it sits is decided by the level-2 cell it belongs to, so a press on it grabs
       nothing and the page stays where it is. */
    if (isRow(n) && levelOf(n) >= 3) return;
    beginDrag(n, e);
  }

  /* one gesture from two doors: a Shift press on the page, and a press on a row's grip */
  function beginDrag(n, e) {
    if (!chipEl) { paintChip(); markGrains(); }   /* a save cleaned the chrome away; the press brings it back */
    drag = { node: n, x: e.clientX, y: e.clientY, on: false, t: null, attr: null, target: n,
             kind: kindOf(n), cell: isItem(n),
             /* whether the node carried a class attribute at all: a drag adds `layout-dragging`
                and takes it away again, and a div that never had a class must not be left with
                class="" in the page a save writes */
             hadClass: n.hasAttribute('class') };
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('pointercancel', up, true);
    /* THE PAGE SCROLLS UNDER A DRAG. A row picked up near the bottom of the screen has to be able to
       reach the top of the page without letting go, so the wheel moves the page and the target is read
       again at the point the pointer is still holding. */
    window.addEventListener('wheel', duringWheel, { passive: false, capture: true });
  }

  function duringWheel(e) {
    if (!drag || !drag.on) return;
    e.preventDefault();
    e.stopPropagation();
    window.scrollBy(e.deltaX || 0, e.deltaY);
    var x = drag.px, y = drag.py;
    requestAnimationFrame(function () {
      if (!drag) return;
      drag.t = pick(x, y);
      showLine(drag.t);
    });
  }

  function move(e) {
    if (!drag) return;
    if (!drag.on) {
      if (Math.abs(e.clientX - drag.x) < THRESH && Math.abs(e.clientY - drag.y) < THRESH) return;
      drag.on = true;
      var c = ca();
      drag.attr = c ? c.getAttribute('contenteditable') : null;
      /* the Shift press left a selection behind, because the caret kept its rights; a drag does not
         want one, and nothing may be dragged as text while a node is being moved */
      try { var sel = window.getSelection(); if (sel) sel.removeAllRanges(); } catch (err) { }
      if (c) c.setAttribute('contenteditable', 'false');
      drag.node.classList.add('layout-dragging');
      document.body.classList.add('layout-drag');
    }
    drag.t = pick(e.clientX, e.clientY);
    /* the last point the pointer was seen at, so the wheel can re-read the page under it after a scroll */
    drag.px = e.clientX; drag.py = e.clientY;
    if (window.__LAYOUT_DEBUG) {
      var tg = drag.t;
      window.__lastPick = tg ? { ax: tg.ax, insert: tg.insert, merge: !!tg.merge, wrapCell: !!tg.wrapCell,
        box: tg.box && (tg.box.id || tg.box.className), host: tg.host && (tg.host.id || tg.host.tagName),
        before: !!tg.before, kind: drag.kind } : null;
    }
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
    window.removeEventListener('wheel', duringWheel, { capture: true });
    if (!d) return;
    showLine(null);
    d.node.classList.remove('layout-dragging');
    /* a node that carried no class attribute keeps none: the drag's own class was the only one */
    if (!d.hadClass && !d.node.getAttribute('class')) d.node.removeAttribute('class');
    document.body.classList.remove('layout-drag');
    /* ONLY A PRESS THAT TRAVELLED TOUCHES THE PAGE'S EDITABILITY. A Shift+click is an inspection,
       and taking `contenteditable` away from it is what used to lock the caret out of the page. */
    if (d.on) {
      var c = ca();
      if (c) {
        if (d.attr === null) c.removeAttribute('contenteditable');
        else c.setAttribute('contenteditable', d.attr);
      }
      applyDrop(d); e.preventDefault();
    }
    else if (d.target) { select(pickNode(d.target)); }   /* a press that never travelled inspects */
  }

  function key(e) {
    if (!ON) return;
    /* the Shift state is SHOWN, not guessed: while the modifier is down the page reads as a canvas
       (grab cursor, and the chip says what the press will do), and it goes back to text the moment
       it lifts. Without it the only clue to the gesture is the sentence in the toast. */
    if (e.key === 'Shift') {
      document.body.classList.toggle('layout-shift', e.type === 'keydown');
      return;
    }
    if (e.key === 'Escape') disable();
    /* CTRL+Z UNDOES THE LAST MOVE, unless the teacher has typed since — then it is the browser's text
       undo, which is what a caret needs. Ctrl+Alt+Z always undoes a move, whatever came before. */
    else if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey)) {
      if (e.altKey || (!typed && hist.length)) { undo(); e.preventDefault(); }
    }
  }
  function blurShift() { document.body.classList.remove('layout-shift'); }
  /* typing takes Ctrl+Z back for the caret; a move gives it to the layout again */
  document.addEventListener('input', function (e) {
    if (!ON) return;
    var t = e.target;
    if (t && t.closest && t.closest('.content-area')) typed = true;
  }, true);
  /* a browser drag of selected text would swallow the pointer events a layout drag needs; while
     Shift is held (or a node is already moving) the native drag is refused */
  function noNativeDrag(e) {
    if (!ON) return;
    if (drag || document.body.classList.contains('layout-shift')) { e.preventDefault(); e.stopPropagation(); }
  }


  /* ---- on and off ------------------------------------------------------------------
     clean() is what the save path calls: it strips the tool's own traces from the DOM and
     nothing else, so a document saved right after it carries no chip, no line and no drag
     class. The tool stays live — the chip comes back — which is what lets a layout be
     saved without leaving edit mode. */
  function clean(root) {
    if (line && line.parentNode) line.parentNode.removeChild(line);
    line = null;
    if (chipEl && chipEl.parentNode) chipEl.parentNode.removeChild(chipEl);
    chipEl = null;
    if (panelEl && panelEl.parentNode) panelEl.parentNode.removeChild(panelEl);
    panelEl = null;
    /* THE SAVE PATH CLEANS A CLONE, NOT THE PAGE. engine2.js hands fullPageHTML() a detached copy of
       the document, so the sweep has to run inside whatever root it is given — otherwise the copy
       keeps every data-layout-* attribute and the file writes them down. No root means the live page,
       which is what Done uses. */
    var scope = root && root.querySelector ? root.querySelector('.content-area') : null;
    [ca(), scope].forEach(function (c) {
      if (!c) return;
      var d = c.querySelectorAll('.layout-dragging');
      for (var i = 0; i < d.length; i++) d[i].classList.remove('layout-dragging');
      var m = c.querySelectorAll('[data-layout-sel],[data-layout-pin],[data-layout-grain]');
      for (var j = 0; j < m.length; j++) { m[j].removeAttribute('data-layout-sel'); m[j].removeAttribute('data-layout-pin'); m[j].removeAttribute('data-layout-grain'); }
      if (c.getAttribute && c.getAttribute('contenteditable') === 'false') c.setAttribute('contenteditable', 'true');
    });
    sel = null;
    drag = null;
    document.body.classList.remove('layout-drag', 'layout-panelled', 'layout-shift');
    if (!ON) document.body.classList.remove('layout-on');
    /* the frames belong to the layer, not to the save: a save made while editing cleans the copy it
       writes and leaves the teacher's page as it was, frames and all. No-op once the layer is off. */
    markGrains();
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
    document.addEventListener('keyup', key, true);
    document.addEventListener('dragstart', noNativeDrag, true);
    document.addEventListener('contextmenu', menu, true);   /* Shift + right click makes a block */
    window.addEventListener('blur', blurShift);
    window.addEventListener('scroll', placeGrips, true);   /* the grips are fixed, the page is not */
    window.addEventListener('resize', placeGrips);
    markPins(); markGrains(); paintChip(); paintPanel();
    /* ENTERING SOLVES. The layer turns off content-visibility for every section, so every row now has
       a width to measure — solve once here and the page opens as the reader gets it. */
    resolveAll();
  }

  function disable() {
    if (!ON) return;
    ON = false;
    var c = ca();
    if (c) c.removeEventListener('pointerdown', down, true);
    document.removeEventListener('keydown', key, true);
    document.removeEventListener('keyup', key, true);
    document.removeEventListener('dragstart', noNativeDrag, true);
    window.removeEventListener('blur', blurShift);
    if (line) line.style.display = 'none';
    clean();
    /* DONE RE-SOLVES THE WHOLE PAGE: every row is measured again, so the geometry the teacher leaves
       is the geometry a reader gets — including the heights that moved because a row above changed. */
    resolveAll();
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
