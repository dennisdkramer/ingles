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

  /* the cell must be at least as wide as its table's widest nowrap row. `.chart` is
     width:100%;max-width:100%, so both are cleared for the measure and put back after. */
  function getTableFloor(col) {
    var table = col.querySelector("table");
    if (!table) return PROSE_FLOOR;
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

  function solveFixedRow(row) {
    var cols = visibleCells(row);
    if (cols.length < 2) return;

    var cs = getComputedStyle(row);
    var gap = parseFloat(cs.columnGap || cs.gap) || 0;
    var avail = row.clientWidth - gap * (cols.length - 1);
    if (avail <= 0) return;

    var minW = cols.map(getTableFloor);
    var maxW = cols.map(getMediaMaxWidth);
    var media = cols.map(visual);

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

    cols.forEach(function (c, i) {
      if (prevAlign[i]) c.style.alignSelf = prevAlign[i];
      else c.style.removeProperty("align-self");
    });
  }

  function run(selector) {
    var rows = document.querySelectorAll(selector || ".content-area .rows:not(.markup-row)");
    Array.prototype.forEach.call(rows, solveFixedRow);
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
      if (!el.getAttribute("style")) el.removeAttribute("style");
      el.removeAttribute("data-eq");
    });
  }

  window.EqualizeRows = { run: run, solve: solveFixedRow, clean: clean };

  function all() { run(); }

  /* a page that loads this file is marked `data-eq`; the sheet holds its content area at
     `visibility:hidden` until `eq-ready`. the first solve runs while hidden; the reveal
     then waits for the fonts or 600ms, whichever comes first, and `load` re-solves for
     the image widths. the sheet's 2.5s animation reveals a page whose script never ran. */
  var revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    try { run(); } finally { document.documentElement.classList.add("eq-ready"); }
  }

  function ready() {
    if (!document.documentElement.hasAttribute("data-eq")) return;
    var timer = setTimeout(reveal, 600);
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
