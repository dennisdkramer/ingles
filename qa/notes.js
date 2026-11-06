/**
 * qa/notes.js — the note boxes on the two preview pages.
 *
 * This is authoring chrome, not lesson code: it touches no answer, no radio and no engine.
 *   - every `textarea.qa-note` fills its block and grows with its own text;
 *   - the notes live in one file, qa/NOTES.md — one `##` block per preview page, one `###`
 *     section per item, the item heading being the item's own name (the same name as the `###`
 *     heading in CONTENT_EXAMPLES.md, so a note and the contract it argues with sit side by side);
 *   - the page reads and writes that file itself, through the browser's file-system access.
 *     A web page may never touch the disk without a gesture, so the first time in a browser you
 *     click the "link qa/NOTES.md" button and pick that file once; the handle is kept in
 *     IndexedDB, so later visits need at most one allow-click, not a fresh search. Chrome and
 *     Edge only. There is no server and nothing listens on a port — you double-click the page;
 *   - autosave: 700 ms after you stop typing the box's section is written into qa/NOTES.md;
 *     emptying a box removes its section; Ctrl+S saves every box at once;
 *   - a browser without that API (Firefox, Safari) cannot reach the file at all: the text stays
 *     in the tab and in localStorage, and Ctrl+S downloads the markdown fragment to paste in.
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
  var KEY = 'qa-notes:' + page + ':';
  var STORE = 'qa/NOTES.md';
  var HANDLE_KEY = 'notes-file';
  var PICKER = typeof window.showOpenFilePicker === 'function';

  var HEADER = [
    '# Preview notes',
    '',
    'One `##` block per preview page and one `###` section per item, written by the note boxes',
    'themselves (open a preview page in Chrome or Edge, click "link ' + STORE + '", then type).',
    'The item heading is the same name as the `###` heading in CONTENT_EXAMPLES.md, so a note and',
    'the contract it argues with can be read against each other by heading alone. Emptying a box',
    'removes its section; the record of work done is the commit.',
    ''
  ].join('\n');

  var file = null;               // FileSystemFileHandle for qa/NOTES.md, once linked
  var linked = false;            // handle known and readable
  var timers = {};
  var touched = {};
  var button = null;

  /* ---- the markdown shape of qa/NOTES.md ------------------------------------------------ */

  function parse(src) {
    var model = { preamble: [], groups: [] };
    var group = null;
    var item = null;
    String(src).split(/\r?\n/).forEach(function (line) {
      var h3 = /^###[ \t]+(\S.*?)[ \t]*$/.exec(line);
      var h2 = /^##[ \t]+(\S.*?)[ \t]*$/.exec(line);
      if (h3 && group) { item = { item: h3[1], lines: [] }; group.items.push(item); return; }
      if (h2) { group = { page: h2[1], items: [] }; model.groups.push(group); item = null; return; }
      if (item) item.lines.push(line);
      else if (group) return;              // stray text directly under a page heading is dropped
      else model.preamble.push(line);
    });
    return model;
  }

  function build(model) {
    var chunks = [];
    var pre = model.preamble.join('\n').trim();
    if (pre) chunks.push(pre);
    model.groups.forEach(function (group) {
      if (!group.items.length) return;
      chunks.push('## ' + group.page);
      group.items.forEach(function (item) {
        var body = item.lines.join('\n').trim();
        if (body) chunks.push('### ' + item.item + '\n\n' + body);
      });
    });
    return (chunks.length ? chunks.join('\n\n') : HEADER.trim()) + '\n';
  }

  function groupFor(model, pageName) {
    var found = null;
    model.groups.forEach(function (g) { if (g.page === pageName) found = g; });
    return found;
  }

  /** this page's notes in the file, keyed by item name */
  function readPage(src) {
    var map = {};
    var group = groupFor(parse(src), page);
    if (group) group.items.forEach(function (i) { map[i.item] = i.lines.join('\n').trim(); });
    return map;
  }

  /** src with one item's section set to body — or removed when body is empty */
  function setSection(src, item, body) {
    var model = parse(src);
    var group = groupFor(model, page);
    if (!group) { group = { page: page, items: [] }; model.groups.push(group); }
    var at = -1;
    group.items.forEach(function (i, n) { if (i.item === item) at = n; });
    body = String(body == null ? '' : body).replace(/\r\n?/g, '\n').trim();
    if (!body) {
      if (at >= 0) group.items.splice(at, 1);
    } else if (at >= 0) {
      group.items[at].lines = body.split('\n');
    } else {
      group.items.push({ item: item, lines: body.split('\n') });
    }
    return build(model);
  }


  /* ---- ui ------------------------------------------------------------------------------- */

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

  function size(text) { return new Blob([text]).size; }

  function time() { return new Date().toLocaleTimeString(); }

  function hold(el) {
    try { localStorage.setItem(KEY + name(el), el.value); } catch (e) { /* private mode */ }
  }

  function buttonLabel() {
    if (!button) return;
    button.textContent = linked ? STORE + ' linked' : 'link ' + STORE;
    button.className = 'qa-link' + (linked ? ' qa-link-on' : '');
  }

  /* ---- reaching the file ---------------------------------------------------------------- */

  function idb() {
    return new Promise(function (resolve, reject) {
      var open = indexedDB.open('qa-notes', 1);
      open.onupgradeneeded = function () { open.result.createObjectStore('handles'); };
      open.onsuccess = function () { resolve(open.result); };
      open.onerror = function () { reject(open.error); };
    });
  }

  function idbGet(key) {
    return idb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = db.transaction('handles', 'readonly').objectStore('handles').get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function idbPut(key, value) {
    return idb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = db.transaction('handles', 'readwrite').objectStore('handles').put(value, key);
        req.onsuccess = function () { resolve(); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function permitted(handle) {
    if (!handle.queryPermission) return Promise.resolve('granted');
    return handle.queryPermission({ mode: 'readwrite' });
  }

  function readFile(handle) {
    return handle.getFile().then(function (f) { return f.text(); });
  }

  function writeFile(handle, text) {
    return handle.createWritable().then(function (w) {
      return w.write(text).then(function () { return w.close(); });
    });
  }

  /* ---- the boxes follow the file --------------------------------------------------------- */

  /** untouched boxes take the file's text; a box you are typing in is never thrown away */
  function adopt(src) {
    var map = readPage(src);
    var count = 0;
    boxes.forEach(function (el) {
      var id = name(el);
      if (touched[id]) return;
      var text = map[id] || '';
      if (text && el.value !== text) { el.value = text; grow(el); count++; }
      else if (!text && el.value.trim()) { grow(el); }   // not in the file: keep what is on screen
    });
    return count;
  }

  /** whatever was typed before the file could be read is written now, without losing anything */
  function flushTyped(handle, src) {
    var out = src;
    var map = readPage(out);
    var pending = 0;
    boxes.forEach(function (el) {
      var text = el.value.trim();
      if (!text || map[name(el)] === text) return;
      out = setSection(out, name(el), text);
      map = readPage(out);
      pending++;
    });
    if (!pending) return Promise.resolve(0);
    return writeFile(handle, out).then(function () { return pending; });
  }

  function linkUp(handle) {
    return readFile(handle).then(function (src) {
      var count = adopt(src);
      return flushTyped(handle, src).then(function (written) {
        linked = true;
        buttonLabel();
        if (written) boxes.forEach(function (el) { delete touched[name(el)]; });
        var msg = count
          ? count + ' note' + (count === 1 ? '' : 's') + ' read from ' + STORE
          : STORE + ' linked — no notes for this page yet';
        if (written) msg += ' · ' + written + ' box' + (written === 1 ? '' : 'es') + ' saved';
        say(msg);
      });
    }).catch(function (e) {
      linked = false;
      buttonLabel();
      say('cannot read ' + STORE + ': ' + e.message, true);
    });
  }

  /* ---- actions -------------------------------------------------------------------------- */

  /** must run inside a click or keypress: the picker needs a gesture */
  function connect() {
    if (!PICKER) return Promise.reject(new Error('this browser has no file-system access'));
    say('pick ' + STORE + ' in the dialog…');
    return window.showOpenFilePicker({
      multiple: false,
      types: [{ description: 'markdown', accept: { 'text/markdown': ['.md'] } }]
    }).then(function (handles) {
      return handles[0];
    }).then(function (handle) {
      file = handle;
      buttonLabel();
      return permitted(handle).then(function (state) {
        if (state === 'granted') return handle;
        return handle.requestPermission({ mode: 'readwrite' }).then(function (next) {
          if (next !== 'granted') throw new Error('permission ' + next);
          return handle;
        });
      });
    }).then(function (handle) {
      idbPut(HANDLE_KEY, handle).catch(function () { /* no IndexedDB: pick again next time */ });
      return linkUp(handle);
    });
  }

  function save(el) {
    var id = name(el);
    var text = el.value.trim();
    hold(el);
    if (!file) { say('not linked to ' + STORE + ' — click “link ' + STORE + '” once', true); return; }
    readFile(file).then(function (src) {
      return writeFile(file, setSection(src, id, text));
    }).then(function () {
      delete touched[id];
      say((text ? 'saved ' + size(text) + ' bytes' : 'section removed') + ' in ' + STORE + ' · ' + time());
    }).catch(function (e) {
      say('NOT saved: ' + e.message, true);
    });
  }

  function queue(el) {
    var id = name(el);
    touched[id] = true;
    clearTimeout(timers[id]);
    timers[id] = setTimeout(function () { save(el); }, 700);
  }

  function saveAll() {
    if (!file) { say('not linked to ' + STORE + ' — click “link ' + STORE + '” once', true); return; }
    readFile(file).then(function (src) {
      var out = src;
      boxes.forEach(function (el) { out = setSection(out, name(el), el.value); });
      if (out === src) { say('nothing to save — ' + STORE + ' already says this'); return; }
      return writeFile(file, out).then(function () {
        boxes.forEach(function (el) { delete touched[name(el)]; });
        say('saved every box in ' + STORE + ' · ' + time());
      });
    }).catch(function (e) {
      say('NOT saved: ' + e.message, true);
    });
  }

  /* Firefox and Safari: no file access at all, so hand the text over as a download */
  function download() {
    var chunks = ['## ' + page];
    boxes.forEach(function (el) {
      var text = el.value.trim();
      if (text) chunks.push('### ' + name(el) + '\n\n' + text);
    });
    var out = page.replace(/\.html$/, '.NOTES.md');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([chunks.join('\n\n') + '\n'], { type: 'text/markdown;charset=utf-8' }));
    a.download = out;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    say('downloaded ' + out + ' — paste its sections into ' + STORE, true);
  }


  /* ---- start ---------------------------------------------------------------------------- */

  if (PICKER) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'qa-link';
    button.addEventListener('click', function () {
      connect().catch(function (e) { say('not linked: ' + e.message, true); });
    });
    document.body.appendChild(button);
    buttonLabel();
  }

  boxes.forEach(function (el) { grow(el); });

  /* no handle yet, or no permission: show what this browser typed earlier rather than nothing */
  function recover() {
    var restored = 0;
    boxes.forEach(function (el) {
      if (touched[name(el)] || el.value.trim()) return;
      var stored = null;
      try { stored = localStorage.getItem(KEY + name(el)); } catch (e) { stored = null; }
      if (stored && stored.trim()) {
        el.value = stored;
        el.setAttribute('data-recovered', '1');
        grow(el);
        restored++;
      }
    });
    if (restored) {
      say(restored + ' box' + (restored === 1 ? '' : 'es') + ' held in this browser, not in ' +
          STORE + ' — click “link ' + STORE + '” to save them', true);
    }
    return restored;
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
    if (!PICKER) { download(); return; }
    if (!file) { connect().catch(function (err) { say('not linked: ' + err.message, true); }); return; }
    saveAll();
  });

  if (!PICKER) {
    recover();
    say('this browser cannot reach ' + STORE + ' — Ctrl+S downloads the note text', true);
    return;
  }

  if (!recover()) say('click “link ' + STORE + '” once — then every box saves itself', true);

  /* a handle from an earlier visit: if the browser still allows it, the boxes fill themselves */
  idbGet(HANDLE_KEY).then(function (handle) {
    if (!handle) return;
    file = handle;
    return permitted(handle).then(function (state) {
      if (state === 'granted') return linkUp(handle);
      say('click “link ' + STORE + '” to allow this page to read and write it', true);
    });
  }).catch(function () { /* no stored handle to restore: the button is the way in */ });
}());

