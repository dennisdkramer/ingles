/**
 * qa/notes.js — the note boxes on the two preview pages.
 *
 * This is authoring chrome, not lesson code: it touches no answer, no radio and no engine.
 *   - every `textarea.qa-note` fills its block and grows with its own text;
 *   - on load each box is filled FROM qa/NOTES.md (GET /__notes → qa/notes.mjs), so that file is
 *     the only store and the page holds no note text of its own;
 *   - as you type, the box is written back into qa/NOTES.md (POST /__note) under a `###` heading
 *     that is the item's own name — the same name as the `###` heading in CONTENT_EXAMPLES.md;
 *   - opened from file:// (no server running) the page cannot read or write that file: text is
 *     held in this tab, kept in localStorage, and Ctrl+S downloads the markdown fragment to paste.
 *
 * Every box carries `data-item="<name>"`, which is the only thing the save path matches on —
 * not a position, so re-ordering the page cannot put a note on the wrong item.
 */
(function () {
  'use strict';

  var boxes = [].slice.call(document.querySelectorAll('textarea.qa-note'));
  if (!boxes.length) return;

  var page = (location.pathname.split('/').pop() || '').toLowerCase();
  var status = document.getElementById('qa-status');
  var served = location.protocol === 'http:' || location.protocol === 'https:';
  var KEY = 'qa-notes:' + page + ':';
  var STORE = 'qa/NOTES.md';
  var timers = {};
  var touched = {};
  var ready = !served;          // nothing to wait for when there is no store to read

  function say(msg, bad) {
    if (!status) return;
    status.textContent = msg;
    status.className = 'qa-status' + (bad ? ' qa-status-bad' : '');
  }

  function grow(el) {
    el.style.height = 'auto';
    el.style.height = Math.max(el.scrollHeight, 2) + 'px';
  }

  function name(el) { return el.getAttribute('data-item') || ''; }

  function hold(el) {
    try { localStorage.setItem(KEY + name(el), el.value); } catch (e) { /* private mode */ }
  }

  function save(el) {
    var id = name(el);
    var text = el.value;
    hold(el);
    if (!served) {
      say('no server: this text lives in this tab only — Ctrl+S downloads it for ' + STORE, true);
      return;
    }
    if (!ready) {
      say('not saving yet: ' + STORE + ' has not been read', true);
      return;
    }
    fetch('/__note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: page, item: id, text: text })
    }).then(function (r) {
      return r.json();
    }).then(function (j) {
      if (!j || !j.ok) throw new Error((j && j.error) || 'rejected');
      delete touched[id];
      say((j.empty ? 'section removed' : 'saved ' + j.bytes + ' bytes') + ' in ' + j.file +
          ' · ' + new Date().toLocaleTimeString());
    }).catch(function (e) {
      say('NOT saved: ' + e.message + ' — start it with `node qa/notes.mjs`, then reload', true);
    });
  }

  function queue(el) {
    var id = name(el);
    touched[id] = true;
    clearTimeout(timers[id]);
    timers[id] = setTimeout(function () { save(el); }, 700);
  }

  /* the markdown this page would contribute, for the file:// fallback */
  function fragment() {
    var chunks = ['## ' + page];
    boxes.forEach(function (b) {
      var text = b.value.trim();
      if (text) chunks.push('### ' + name(b) + '\n\n' + text);
    });
    return chunks.join('\n\n') + '\n';
  }

  function download() {
    var file = page.replace(/\.html$/, '.NOTES.md');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([fragment()], { type: 'text/markdown;charset=utf-8' }));
    a.download = file;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    say('downloaded ' + file + ' — paste its sections into ' + STORE, true);
  }

  /* on load: fit every box; from file:// recover what a previous tab typed and never saved */
  var recovered = 0;
  boxes.forEach(function (el) {
    grow(el);
    if (served) return;                     // the store is the truth when there is one
    var stored = null;
    try { stored = localStorage.getItem(KEY + name(el)); } catch (e) { stored = null; }
    if (stored && stored !== el.value) {
      el.value = stored;
      el.setAttribute('data-recovered', '1');
      grow(el);
      recovered++;
    }
  });

  /* served: the boxes say what qa/NOTES.md says, and nothing is saved until it has been read */
  if (served) {
    fetch('/__notes?page=' + encodeURIComponent(page)).then(function (r) {
      return r.json();
    }).then(function (j) {
      if (!j || !j.ok) throw new Error((j && j.error) || 'rejected');
      var count = 0;
      boxes.forEach(function (el) {
        var text = j.items[name(el)];
        if (text) { el.value = text; grow(el); count++; }
      });
      ready = true;
      say(count + ' note' + (count === 1 ? '' : 's') + ' read from ' + j.file);
    }).catch(function (e) {
      say('cannot read ' + STORE + ': ' + e.message + ' — start it with `node qa/notes.mjs`, then reload', true);
    });
  }

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || el.tagName !== 'TEXTAREA' || !el.classList.contains('qa-note')) return;
    el.removeAttribute('data-recovered');
    grow(el);
    queue(el);
  });

  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || (e.key !== 's' && e.key !== 'S')) return;
    e.preventDefault();
    if (!served) { download(); return; }
    say('saving every box…');
    boxes.forEach(function (b) {
      if (touched[name(b)] || b.value.trim()) save(b);
    });
    if (!boxes.some(function (b) { return touched[name(b)] || b.value.trim(); })) say('nothing typed yet');
  });

  window.addEventListener('load', function () {
    boxes.forEach(grow);
    if (recovered) {
      say(recovered + ' box' + (recovered === 1 ? '' : 'es') +
          ' recovered from this browser — Ctrl+S downloads them for ' + STORE, true);
    } else if (!served) {
      say('opened from file:// — start `node qa/notes.mjs` to read and save ' + STORE, true);
    }
  });
}());
