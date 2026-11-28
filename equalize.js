/* ---- equalize.js — the fixed-width row solver --------------------------------------------
   Every `.rows` in `.content-area` is a fixed flex line whose cells are sized for their
   content at load: a table keeps the width of its widest row, an image or a drawn SVG never
   grows past its own size, and prose trades width for height until the cells read as one
   block. The sheet's `flex:1` is the no-JS start; this file writes the runtime widths. --- */
(function () {
  "use strict";

  var MIN_CELL = 120;        /* no cell below this */
  var PROSE_FLOOR = 200;     /* a prose cell never reads narrower */
  var STEPS = 24;
  var CENTER_MIN = 12;       /* a 2-cell row centers its shorter cell once the gap reads as one */
  var SPACE_CAP = 48;        /* a question's or a list item's own gap opens by at most this much */
  var SPACE_MIN = 6;         /* and never closes below this: the items stay visibly apart */

  function visibleCells(row) {
    return Array.prototype.filter.call(row.children, function (el) {
      return getComputedStyle(el).display !== "none";
    });
  }

  /* the horizontal padding and border between an element and the cell that owns it: a table
     inside a framed block needs its block's padding as well as its own width */
  function chromeTo(el, col) {
    var w = 0;
    for (var n = el.parentElement; n && n !== col; n = n.parentElement) {
      var cs = getComputedStyle(n);
      w += (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
        + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
    }
    return w;
  }

  /* A DRAWING WITH A WIDTH OF ITS OWN OWNS ITS CELL, the same way a table does: `.vz-map` is authored
     in px, so its computed width is the width it will be drawn at, whatever the cell it lands in is
     doing. Without this the cell is measured as prose, the drawing is capped by a percentage of a cell
     the solver is sizing from the drawing, and the map collapses — the one shape on a page whose width
     is neither prose nor a table. Any element with a fixed px width gets the same treatment. */
  function fixedFrameWidth(col) {
    var els = col.querySelectorAll(".vz-map, .chartwrap, .chart:has(>tbody>tr>th.vlab)"), best = 0;
    for (var i = 0; i < els.length; i++) {
      /* a drawing inside a `.block` this cell wraps is not this cell's own content — the cell holds a
         block, and the block is as wide as the row; only a drawing the cell carries directly counts */
      var inBlock = false;
      for (var p = els[i].parentElement; p && p !== col; p = p.parentElement) {
        if (p.classList && p.classList.contains("block")) { inBlock = true; break; }
      }
      if (inBlock) continue;
      var w = parseFloat(getComputedStyle(els[i]).width) || 0;
      if (w > best && w < col.getBoundingClientRect().width * 4) best = w;
    }
    return best;
  }

  /* the cell must be at least as wide as its table's widest nowrap row. `.chart` is
     width:100%;max-width:100%, so both are cleared for the measure and put back after. */
  function getTableFloor(col) {
    var table = col.querySelector("table");
    if (!table) {
      var fw = fixedFrameWidth(col);
      return fw ? Math.max(MIN_CELL, fw + (col.offsetWidth - col.clientWidth)) : PROSE_FLOOR;
    }
    var s = table.style, prev = [s.whiteSpace, s.width, s.maxWidth];
    s.whiteSpace = "nowrap";
    s.width = "auto";
    s.maxWidth = "none";
    var chrome = (col.offsetWidth - col.clientWidth) + chromeTo(table, col);
    var floor = (table.scrollWidth || table.getBoundingClientRect().width || 0) + chrome + 12;
    s.whiteSpace = prev[0];
    s.width = prev[1];
    s.maxWidth = prev[2];
    return Math.max(MIN_CELL, floor);
  }

  /* a table owns its cell even when a drawing sits inside it */
  function visual(col) {
    if (col.querySelector("table")) return null;
    return col.querySelector("img") || col.querySelector('svg[width="100%"]');
  }

  function svgWidth(el) {
    var vb = el.viewBox && el.viewBox.baseVal;
    if (vb && vb.width) return vb.width;
    var box = (el.getAttribute("viewBox") || "").trim().split(/[\s,]+/);
    var w = box.length === 4 ? parseFloat(box[2]) : NaN;
    return isFinite(w) && w > 0 ? w : Infinity;
  }

  function getMediaMaxWidth(col) {
    var el = visual(col);
    if (!el) return Infinity;
    var naturalW = el.tagName.toLowerCase() === "img" ? (el.naturalWidth || Infinity) : svgWidth(el);
    if (naturalW === Infinity) return Infinity;
    return naturalW + (col.offsetWidth - col.clientWidth) + chromeTo(el, col);
  }

  /* prose only: the width at which its longest line stops needing more. beyond it a cell
     is blank space, and the row's tables and drawings should take the slack instead. */
  function getProseMaxWidth(col) {
    if (col.querySelector("table") || visual(col)) return Infinity;
    var clone = col.cloneNode(true);
    clone.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;" +
      "width:max-content;max-width:none;flex:none";
    col.parentElement.appendChild(clone);
    var w = clone.getBoundingClientRect().width;
    clone.parentElement.removeChild(clone);
    return w;
  }

  /* the widest authored line: the cell at `max-content`, so an authored <br> and the sheet's own
     wrapping are kept and an authored max-width stays in place. this is a spacing cell's floor —
     the page never narrows a question below the line it was written on. */
  function getAuthoredFloor(col) {
    var clone = col.cloneNode(true);
    clone.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;" +
      "width:max-content;flex:none";
    col.parentElement.appendChild(clone);
    var w = clone.getBoundingClientRect().width;
    clone.parentElement.removeChild(clone);
    return Math.max(PROSE_FLOOR, w);
  }

  /* an item is a direct child of the cell that carries a `.qnum` and introduces an answer: the
     control is inside it, or the gap/options it opens sit immediately after it. the class is a
     marker, never the test — not every question is a <p>, and a numbered row in a table is not
     a question the cell can space. */
  function isItem(el, next) {
    if (!el.querySelector || !el.querySelector(".qnum")) return false;
    if (el.querySelector("table, .seq, .chips, img, svg")) return false;
    if (el.querySelector("input, textarea, select, .opts, .qopts")) return true;
    return !!(next && next.matches && next.matches("input.gap, .opts, .qopts"));
  }

  /* a cell the solver may space, with the elements that take the gap: a question cell is one whose
     direct children hold two or more items (each after the first takes the gap); a list cell is
     one whose direct child is a ul/ol of two or more li (each but the last). never the row itself,
     and never a cell that holds a table, a figure, a dialog, a chip run, an image or a drawing. */
  function getSpacingCell(col) {
    if (col.querySelector("table, figure, .seq, .chips, img, svg")) return null;
    var list = null;
    Array.prototype.forEach.call(col.children, function (el) {
      if (!list && /^(ul|ol)$/i.test(el.tagName) && !el.classList.contains("seq")) list = el;
    });
    if (list) {
      var lis = Array.prototype.filter.call(list.children, function (el) {
        return /^li$/i.test(el.tagName);
      });
      if (lis.length >= 2) return { items: lis, prop: "marginBottom" };
    }
    var kids = Array.prototype.filter.call(col.children, function (el) {
      return !/^(ul|ol)$/i.test(el.tagName);
    });
    var items = kids.filter(function (el, i) { return isItem(el, kids[i + 1]); });
    if (items.length >= 2) return { items: items, prop: "marginTop" };
    return null;
  }

  /* spread a cell's own gaps to meet `target`: the signed delta is this cell's height difference
     divided by its gaps, clamped to 6px … its authored gap + SPACE_CAP. expanding and compressing
     are the same line of code. */
  function spread(col, spec, height, target) {
    var items = spec.items, gaps = items.length - 1;
    if (gaps < 1) return;
    var delta = (target - height) / gaps;
    if (Math.abs(delta) < 0.5) return;
    var from = spec.prop === "marginTop" ? 1 : 0;
    var to = spec.prop === "marginTop" ? items.length : items.length - 1;
    for (var i = from; i < to; i++) {
      var el = items[i];
      var base = parseFloat(getComputedStyle(el)[spec.prop]) || 0;
      var gap = Math.max(SPACE_MIN, Math.min(base + SPACE_CAP, base + delta));
      el.setAttribute("data-eq", "");
      el.style[spec.prop] = gap + "px";
    }
  }

  /* every run starts from the authored page: the previous run's gaps go before anything measures */
  function clearSpacing(row) {
    Array.prototype.forEach.call(row.querySelectorAll("[data-eq]"), function (el) {
      if (!el.style.marginTop && !el.style.marginBottom) return;
      el.style.removeProperty("margin-top");
      el.style.removeProperty("margin-bottom");
      if (!el.getAttribute("style")) el.removeAttribute("style");
    });
  }

  function solveFixedRow(row) {
    /* the previous run's gaps come off before anything is measured or sized */
    clearSpacing(row);

    var cols = visibleCells(row);
    if (cols.length < 2) {
    /* a lone drawing that widths itself is a box of its own, not a cell stretched across the row */
    if (cols.length === 1) {
      var lone = fixedFrameWidth(cols[0]);
      if (lone) {
        var lw = lone + (cols[0].offsetWidth - cols[0].clientWidth);
        cols[0].setAttribute("data-eq", "");
        cols[0].style.flex = "0 0 " + lw + "px";
        cols[0].style.width = lw + "px";
      }
    }
    return;
  }

    var cs = getComputedStyle(row);
    var gap = parseFloat(cs.columnGap || cs.gap) || 0;
    var avail = row.clientWidth - gap * (cols.length - 1);
    if (avail <= 0) return;

    /* the cells the solver may space, and their width floor: a question cell is never narrowed
       past its widest authored line. the floor is honoured only where the row can hold it — if
       the authored widths together do not fit, the row keeps the widths it would have had. */
    var spacing = cols.map(getSpacingCell);
    var baseW = cols.map(getTableFloor);
    var authored = cols.map(function (c, i) { return spacing[i] ? Math.min(avail, getAuthoredFloor(c)) : 0; });
    var wantSum = 0;
    authored.forEach(function (w, i) { wantSum += Math.max(baseW[i], w); });
    var honourFloor = wantSum <= avail + 0.5;
    var minW = baseW.map(function (w, i) {
      if (!spacing[i] || !honourFloor) return w;
      return Math.max(w, authored[i]);
    });
    var media = cols.map(visual);
    /* a table or a drawing is the row's absorber; the prose beside it stops at its own content
       width, so the absorber takes the slack instead of the prose becoming blank space */
    var hasAbsorber = cols.some(function (c) { return c.querySelector("table") || visual(c) || fixedFrameWidth(c); });
    /* when the only thing that could absorb is an element with a width of its own, the slack has to
       go to the prose: that element is capped at its own width, so the text is what fills the row */
    var proseAbsorbs = !cols.some(function (c) {
      return (c.querySelector("table") && !fixedFrameWidth(c)) || visual(c);
    }) && cols.some(function (c) { return fixedFrameWidth(c); });
    var maxW = cols.map(function (c, i) {
      var mediaCap = getMediaMaxWidth(c);
      if (mediaCap !== Infinity || !hasAbsorber) return mediaCap;
      /* a drawing that widths itself is not an absorber: its cell is capped at the drawing's own
         width, so the box around a map, or around a thin chart, is never wider than the drawing */
      var frame = fixedFrameWidth(c);
      if (frame) return frame + (c.offsetWidth - c.clientWidth);
      if (c.querySelector("table") || media[i]) return Infinity;
      if (proseAbsorbs) return Infinity;
      return Math.max(PROSE_FLOOR, getProseMaxWidth(c));
    });

    /* align-items:stretch makes every cell the row's height, so a measured height says
       nothing about its content. Read each cell at its own height while solving. */
    var prevAlign = cols.map(function (c) { return c.style.alignSelf; });
    cols.forEach(function (c) { c.style.alignSelf = "flex-start"; });

    /* scale the line to `avail`, then honour the floors and the media caps. a surplus goes
       to cells that can still grow; a deficit comes off the cells above their floor. */
    function fit(ws) {
      var total = ws.reduce(function (a, b) { return a + b; }, 0);
      if (!total) return ws;
      var out = ws.map(function (w, i) {
        return Math.max(minW[i], Math.min(maxW[i], (w / total) * avail));
      });
      var diff = avail - out.reduce(function (a, b) { return a + b; }, 0);
      if (diff > 0.5) {
        var room = out.map(function (w, i) {
          return maxW[i] === Infinity ? Infinity : Math.max(0, maxW[i] - w);
        });
        var open = room.filter(function (r) { return r > 0.5; }).length;
        if (open) {
          var add = diff / open;
          out = out.map(function (w, i) { return room[i] > 0.5 ? Math.min(maxW[i], w + add) : w; });
        }
      } else if (diff < -0.5) {
        var slack = out.map(function (w, i) { return Math.max(0, w - minW[i]); });
        var slackSum = slack.reduce(function (a, b) { return a + b; }, 0);
        if (slackSum > 0.5) out = out.map(function (w, i) { return w + diff * (slack[i] / slackSum); });
      }
      return out;
    }

    var widths = cols.map(function (_, i) {
      var cap = Math.min(maxW[i], avail);
      return Math.max(minW[i], Math.min(cap, avail / cols.length));
    });
    widths = fit(widths);

    function apply(ws) {
      ws.forEach(function (w, i) {
        cols[i].setAttribute("data-eq", "");
        cols[i].style.flex = "0 0 " + w + "px";
        cols[i].style.width = w + "px";
      });
    }

    for (var step = 0; step < STEPS; step++) {
      apply(widths);

      var heights = cols.map(function (c) { return c.getBoundingClientRect().height; });
      var targetH = heights.reduce(function (a, b) { return a + b; }, 0) / heights.length;

      var next = widths.map(function (w, i) {
        var err = (heights[i] - targetH) / Math.max(targetH, 1);

        /* taller than the line: widen the prose/table to take a line back; shrink the
           image, whose height follows its width */
        if (cols[i].querySelector("table")) return Math.max(minW[i], Math.min(maxW[i], w * (1 + err * 0.2)));
        if (media[i]) return Math.max(MIN_CELL, Math.min(maxW[i], w * (1 - err * 0.35)));
        return Math.max(minW[i], Math.min(maxW[i], w * (1 + err * 0.35)));
      });

      widths = fit(next);
    }
    apply(widths);

    /* spacing is the height lever: once the widths settle, each cell that can space opens or
       closes its own gaps until it meets the tallest cell that cannot (or, when every cell can
       space, the tallest cell — so the shorter one opens). the heights are the content's, read
       once before any gap moves, and every cell is still at align-self:flex-start. */
    if (spacing.some(function (s) { return !!s; })) {
      var preH = cols.map(function (c) { return c.getBoundingClientRect().height; });
      var fixedH = preH.filter(function (h, i) { return !spacing[i]; });
      var spaceTarget = fixedH.length ? Math.max.apply(null, fixedH) : Math.max.apply(null, preH);
      cols.forEach(function (c, i) {
        if (spacing[i]) spread(c, spacing[i], preH[i], spaceTarget);
      });
    }

    /* a 2-cell row that cannot be equalized: center the shorter cell's content instead of
       leaving the whole gap below it. three or more cells stay top-aligned so their lines
       agree. the cells are still at their own height here, so these heights are their
       content's, not the row's. the previous run's decision is cleared first, because a
       photo that loads late can change the gap the next run sees.
       THE HEADLINE NEVER MOVES: a cell whose first child is a heading (a block a page put
       straight into the row) keeps that heading at the cell's top. Centering its content would
       carry the h3 down the page, and where the headline sits would then depend on how much
       text the cell holds beside it. */
    cols.forEach(function (c) { c.style.removeProperty("justify-content"); });
    if (cols.length === 2) {
      var lastH = cols.map(function (c) { return c.getBoundingClientRect().height; });
      var lo = Math.min.apply(null, lastH), hi = Math.max.apply(null, lastH);
      if (hi - lo > CENTER_MIN) {
        var k = lastH[0] <= lastH[1] ? 0 : 1;
        var first = cols[k].firstElementChild;
        var headed = !!(first && /^H[34]$/.test(first.tagName));
        if (!headed) cols[k].style.justifyContent = "center";
      }
    }

    cols.forEach(function (c, i) {
      if (prevAlign[i]) c.style.alignSelf = prevAlign[i];
      else c.style.removeProperty("align-self");
    });
  }

  function run(selector) {
    /* TWO LEVELS ARE SOLVED, THE THIRD IS NOT. A page is authored three rows deep (PEDAGOGY-MAP
       [1A]); level 3 exists only to put two short things side by side, and it has no spacing of
       its own, so there is nothing there to solve — solving it would only give a cell of a
       three-deep row a width it was never meant to have. Depth is the nesting count, so no marker
       is needed. */
    var all = document.querySelectorAll(selector || ".content-area .rows:not(.markup-row)");
    Array.prototype.forEach.call(all, function (r) {
      var d = 0;
      for (var p = r.parentElement; p; p = p.parentElement)
        if (p.classList && p.classList.contains("rows")) d++;
      if (d < 2) solveFixedRow(r);
    });
  }

  /* the save path clones the document and asks for the authored page back */
  function clean(root) {
    var r = root || document;
    /* a saved page must not inherit the runtime reveal state */
    if (r.nodeType === 9 && r.documentElement) r.documentElement.classList.remove("eq-ready");
    else if (r.classList) r.classList.remove("eq-ready");
    Array.prototype.forEach.call(r.querySelectorAll("[data-eq]"), function (el) {
      el.style.removeProperty("flex");
      el.style.removeProperty("width");
      el.style.removeProperty("align-self");
      el.style.removeProperty("justify-content");
      el.style.removeProperty("margin-top");
      el.style.removeProperty("margin-bottom");
      if (!el.getAttribute("style")) el.removeAttribute("style");
      el.removeAttribute("data-eq");
    });
  }

  window.EqualizeRows = { run: run, solve: solveFixedRow, clean: clean };

  /* A SECTION IS SOLVED WHEN IT IS RENDERED. `content-visibility:auto` keeps a section below the fold
     out of layout, so a row there measures nothing and the solver skips it — the row then shows equal
     shares, which is what a reader sees after scrolling and what made edit mode look unsolved. Each
     section is observed once, and its rows are solved the first time it is rendered near the screen. */
  function watchSections() {
    if (!window.IntersectionObserver) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        Array.prototype.forEach.call(en.target.querySelectorAll(".rows"), function (r) {
          var d = 0;
          for (var p = r.parentElement; p; p = p.parentElement)
            if (p.classList && p.classList.contains("rows")) d++;
          if (d < 2) solveFixedRow(r);
        });
      });
    }, { rootMargin: "300px 0px" });
    Array.prototype.forEach.call(document.querySelectorAll(".content-area>section"), function (s) {
      io.observe(s);
    });
  }

  function all() { watchSections(); run(); }

  /* a page that loads this file is marked `data-eq`; the sheet holds its content area at
     `visibility:hidden` until `eq-ready`. the first solve runs while hidden; the reveal
     then waits for the fonts or 1.5s, whichever comes first, and `load` re-solves for
     the image widths. the sheet's fallback reveals a page whose script never ran. */
  var revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    try { run(); } finally { document.documentElement.classList.add("eq-ready"); }
  }

  function ready() {
    if (!document.documentElement.hasAttribute("data-eq")) return;
    var timer = setTimeout(reveal, 1500);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        clearTimeout(timer);
        if (revealed) all();
        else reveal();
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", all);
  else all();
  window.addEventListener("load", all);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
