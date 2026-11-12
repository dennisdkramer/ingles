/**
 * qa/readout.js — the preview page's nav, and the line above each block, read from the menu.
 *
 * Both used to be baked into the page and both drifted. The nav listed names CONTENT_EXAMPLES.md no
 * longer had, and listed one shape twice; the line under each note box was a hand copy of a heading
 * that had since been rewritten. Neither can drift now, because nothing is stored: the page asks
 * /__qa-brief, qa/serve.mjs answers with `readMenu()` from qa/menu.mjs — the same call
 * `node qa/brief.mjs --index` prints, so the nav IS the brief's index and not a copy of it —
 * builds the nav from that, writes each entry's header into the dim line under its note box, and
 * re-reads every 2 s so an edit to the file shows up without a reload.
 *
 * Identity is the entry's number: the section `item-42` answers for `### [42]`. A renumbered entry
 * therefore needs its block re-keyed, and this is how a mistake there becomes visible — the header
 * under the block stops describing the block.
 *
 * With no server the index is built from the page instead, which is why this works when the file is
 * opened by double-clicking it: `domIndex()` lists the blocks that are here, each under its entry's
 * header, which are the lines this script wrote. What that path cannot know is the entries with no
 * block on the page and the file's own section grouping, and it says so rather than guessing.
 */
(function () {
  'use strict';

  var toc = document.getElementById('qa-toc');
  if (!toc) return;

  var POLL_MS = 2000;
  var ENDPOINT = '/__qa-brief';
  var sig = null;                 // what the page is showing, so a poll that changes nothing does nothing
  var live = false;               // the endpoint answered at least once: this page is served

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function state(text, bad) {
    var s = toc.querySelector('.qa-toc-state');
    if (!s) { s = el('span', 'qa-toc-state'); toc.appendChild(s); }
    s.textContent = text;
    s.className = 'qa-toc-state' + (bad ? ' qa-toc-bad' : '');
  }

  /* the section's own identity: `[42]`, `syllableLab`, or `skeetRange — recognition + sound` */
  function keyOf(sec) {
    var h = sec.querySelector('h2');
    var t = h ? (h.textContent || '').trim() : '';
    var n = /^\[(\d+)\]/.exec(t);
    if (n) return '[' + n[1] + ']';
    var m = /^([A-Za-z0-9]+)/.exec(t);
    return m ? m[1] : t;
  }

  function sections() { return [].slice.call(document.querySelectorAll('section.qa-item')); }

  /* the one dim line that belongs to the frame, not to the block inside it */
  function dimOf(sec) {
    var kids = sec.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].tagName === 'P' && kids[i].classList.contains('dim')) return kids[i];
    }
    return null;
  }

  /** the line above each block becomes that entry's header, verbatim from the file */
  function heads(data) {
    var by = {};
    data.shapes.forEach(function (s) { by[s.key] = s; });
    var stale = [];
    sections().forEach(function (sec) {
      var key = keyOf(sec);
      var shape = by[key];
      if (!shape) { if (key) stale.push(key); return; }
      sec.setAttribute('data-shape', key);
      var line = dimOf(sec);
      var head = shape.header || shape.what;
      if (line && line.textContent !== head) line.textContent = head;
    });
    return stale;
  }


  /** the nav: the index itself, grouped by the file's own sections, with the gaps named */
  function nav(data, stale) {
    var have = {};
    sections().forEach(function (sec) { have[keyOf(sec)] = true; });
    var by = {}, order = [];
    data.shapes.forEach(function (s) {
      var g = s.section || '—';
      if (!by[g]) { by[g] = []; order.push(g); }
      by[g].push(s);
    });

    var wrap = el('div', 'qa-toc-readout');
    var blocks = 0, missing = 0;
    order.forEach(function (g) {
      var titled = data.sections.filter(function (s) { return s.key === g; })[0];
      var head = el('div', 'qa-toc-g');
      /* a shape outside any group heading is still a shape; name the group rather than printing `—` */
      var label = titled ? titled.title : (data.groupTitle || (g === '—' ? 'the whole menu' : g));
      head.appendChild(el('b', null, label));
      head.appendChild(el('span', 'qa-toc-n', ' ' + by[g].length));
      wrap.appendChild(head);
      by[g].forEach(function (s, i) {
        var node;
        if (have[s.key]) { node = el('a'); node.href = '#' + s.anchor; blocks++; }
        else { node = el('span', 'qa-toc-miss'); node.title = 'no block for ' + s.key + ' on this page'; missing++; }
        node.appendChild(el('b', null, s.key));
        node.appendChild(document.createTextNode(' ' + s.header));
        if (i) wrap.appendChild(document.createTextNode(' · '));
        wrap.appendChild(node);
      });
      wrap.appendChild(document.createTextNode(' · '));
    });

    if (stale.length) {
      var out = el('div', 'qa-toc-g');
      out.appendChild(el('b', null, 'not in CONTENT_EXAMPLES.md (' + stale.length + ')'));
      wrap.appendChild(out);
      wrap.appendChild(el('span', 'qa-toc-miss', stale.join(' · ')));
    }

    toc.textContent = '';
    toc.appendChild(wrap);
    /* no server: every shape listed IS a block here, so saying both is noise */
    if (!data.sections.length) {
      state(data.shapes.length + ' blocks on this page, each headed by its entry · ' + data.file + ' (no server)');
      return;
    }
    state(data.shapes.length + ' shapes · ' +
      blocks + ' with a block here' +
      (missing ? ' · ' + missing + ' without one' : '') +
      (stale.length ? ' · ' + stale.length + ' block(s) with no entry' : '') +
      ' · ' + data.file + (live ? ', via qa/brief.mjs' : ' (no server)'));
  }

  function render(data) {
    if (!data || !data.shapes) return;
    var next = data.shapes.map(function (s) { return s.key + '\u0000' + s.header; }).join('\u0001');
    if (next === sig) return;
    sig = next;
    nav(data, heads(data));
  }

  function get(url) {
    /* `fetch` is absent in some contexts (and throws synchronously there), which would escape the
       `.catch` below and leave the nav empty — a rejected promise instead reaches the fallback */
    if (typeof fetch !== 'function') return Promise.reject(new Error('no fetch'));
    try {
      return fetch(url, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error(url + ' → ' + r.status);
        return r.text();
      });
    } catch (e) { return Promise.reject(e); }
  }

  /* The index without a server: every block on this page carries its entry's header in its own dim
     line — the line this script wrote — so the page already holds the index, and a nav that lists the
     page can neither list a block that is missing nor miss one that is here. Opening this file by
     double-clicking it is a supported way in and reads what is on the page, not a list typed once. */
  function domIndex() {
    var shapes = [];
    sections().forEach(function (sec) {
      var key = keyOf(sec);
      if (!key) return;
      var dim = dimOf(sec);
      shapes.push({
        key: key, anchor: sec.id || ('item-' + key.replace(/[^0-9A-Za-z]/g, '')),
        header: dim ? (dim.textContent || '').replace(/\s+/g, ' ').trim() : '', section: null
      });
    });
    return { file: 'this page', sections: [], groupTitle: 'blocks on this page', shapes: shapes };
  }

  /* served: the JSON endpoint, which is the brief's own index — every entry in the file, grouped by the
     file's sections, including the ones with no block here. Without it the page's own blocks are the
     index, which is every block here and no claim about the rest. */
  function poll() {
    if (document.hidden) return;
    get(ENDPOINT).then(function (text) {
      live = true;
      render(JSON.parse(text));
    }).catch(function () {
      if (live) { state('qa/serve.mjs stopped answering — this readout is now stale', true); return; }
      try {
        render(domIndex());
      } catch (e) {
        state('readout failed: ' + e.message, true);
      }
    });
  }

  poll();
  setInterval(poll, POLL_MS);
  window.addEventListener('focus', poll);
  document.addEventListener('visibilitychange', poll);
}());
