/**
 * qa/notes.js — the note boxes on the two preview pages.
 *
 * This is authoring chrome, not lesson code: it touches no answer, no radio and no engine.
 *   - every `textarea.qa-note` fills its block and grows with its own text;
 *   - its text is written back INTO the preview .html file (POST /__note → qa/notes.mjs),
 *     so a note sits in the repo and can be read like any other line;
 *   - opened from file:// (no server running) it holds the text in this tab, keeps a copy in
 *     localStorage, and Ctrl+S downloads a patched copy of the page to replace the original.
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
  var timers = {};
  var touched = {};

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
      say('no server: this text lives in this tab only — Ctrl+S downloads a copy of the page', true);
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
      say((j.empty ? 'cleared' : 'saved ' + j.bytes + ' bytes') + ' in ' + j.file +
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

  function download() {
    var live = boxes;
    var clone = document.documentElement.cloneNode(true);
    var copy = clone.querySelectorAll('textarea.qa-note');
    for (var i = 0; i < copy.length && i < live.length; i++) copy[i].textContent = live[i].value;
    var html = '<!doctype html>' + (clone.outerHTML || '');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    a.download = page.replace(/\.html$/, '') + '.notes.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    say('downloaded ' + a.download + ' — put it over the original file', false);
  }

  /* on load: fit every box, and recover text a previous tab typed but never got saved */
  var recovered = 0;
  boxes.forEach(function (el) {
    grow(el);
    var stored = null;
    try { stored = localStorage.getItem(KEY + name(el)); } catch (e) { stored = null; }
    if (stored && stored !== el.value && !el.value.trim()) {
      el.value = stored;
      el.setAttribute('data-recovered', '1');
      grow(el);
      recovered++;
    }
  });

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
          ' recovered from this browser — check them, they are not in the file yet', true);
    } else if (!served) {
      say('opened from file:// — notes stay in this tab; Ctrl+S downloads a copy', true);
    } else {
      say('ready — every box saves into ' + page + ' as you type');
    }
  });
}());
