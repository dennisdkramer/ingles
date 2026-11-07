/**
 * qa/notes.js — the note boxes on the two preview pages.
 *
 * This is authoring chrome, not lesson code: it touches no answer, no radio and no engine.
 *   - every `textarea.qa-note` fills its block and grows with its own text;
 *   - qa/NOTES.md is where the notes live and it is the source of truth: one `##` block per
 *     preview page, one `###` section per item, and every section body opens with a pointer to
 *     that item's `###` heading in CONTENT_EXAMPLES.md. The section is the request; the pointer
 *     names the contract it argues with. A request is never copied into CONTENT_EXAMPLES.md;
 *   - the boxes and the file follow each other. Typing writes the section into the file 700 ms
 *     after you stop; the file is re-read every 2 s and on window focus, so a section deleted in
 *     an editor leaves its box empty without a reload, and a reload always shows the file as it
 *     stands. A box you are typing in is never overwritten; Ctrl+S saves every box at once;
 *   - the page reaches the file through the browser's file-system access. A page may never touch
 *     the disk without a gesture, so the first time in a browser you click the "link qa/NOTES.md"
 *     button and pick that file once; the handle is kept in IndexedDB, so later visits need at
 *     most one allow-click, not a fresh search. Chrome and Edge only. There is no server and
 *     nothing listens on a port — you double-click the page;
 *   - localStorage holds only text that has NOT reached the file: a draft typed before linking,
 *     or text whose write failed. The draft is dropped the moment its section is written, so a
 *     draft can never put back a note you deleted from qa/NOTES.md;
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
  var CONTRACT = 'CONTENT_EXAMPLES.md';
  var HANDLE_KEY = 'notes-file';
  var PICKER = typeof window.showOpenFilePicker === 'function';
  var POLL_MS = 2000;            // how often a linked page re-reads the file

  var HEADER = [
    '# Preview notes',
    '',
    'Open requests: one `##` block per preview page, one `###` section per item. The note boxes on',
    'the preview pages read and write this file directly (Chrome or Edge, click "link ' + STORE + '"',
    'once), so this file is the whole record and editing it here edits the boxes.',
    '',
    'Every section opens with a pointer to the item\'s `###` heading in `' + CONTRACT + '` — that',
    'heading is the contract the request argues with. The request stays here and is never copied',
    'into ' + CONTRACT + '. Emptying a box, or deleting a section here, removes the request; the',
    'record of work done is the commit.',
    ''
  ].join('\n');

  var file = null;               // FileSystemFileHandle for qa/NOTES.md, once linked
  var linked = false;            // handle known and readable
  var timers = {};
  var touched = {};              // typed in, or a draft: the file must not overwrite this box
  var busy = 0;                  // writes in flight, so a poll cannot read a half-written file
  var lastSrc = null;            // the file text the boxes are showing
  var poll = 0;
  var button = null;

  /* ---- the markdown shape of qa/NOTES.md ------------------------------------------------ */

  var POINTER = /^→\s*CONTENT_EXAMPLES\.md/;      // the line every section opens with

  function pointer(item) { return '→ ' + CONTRACT + ' §`' + item + '`'; }

  /** body lines with the pointer removed: what a box shows, and what a box's text becomes */
  function strip(lines) {
    return lines.filter(function (l) { return !POINTER.test(l.trim()); }).join('\n').trim();
  }

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
      var kept = group.items.filter(function (item) { return strip(item.lines); });
      if (!kept.length) return;
      chunks.push('## ' + group.page);
      kept.forEach(function (item) {
        chunks.push('### ' + item.item + '\n\n' + pointer(item.item) + '\n' + strip(item.lines));
      });
    });
    return (chunks.length ? chunks.join('\n\n') : HEADER.trim()) + '\n';
  }

  function groupFor(model, pageName) {
    var found = null;
    model.groups.forEach(function (g) { if (g.page === pageName) found = g; });
    return found;
  }

  /** this page's notes in the file, keyed by item name, the pointer line taken out */
  function readPage(src) {
    var map = {};
    var group = groupFor(parse(src), page);
    if (group) group.items.forEach(function (i) { map[i.item] = strip(i.lines); });
    return map;
  }

  /** src with one item's section set to body — or removed when body is empty */
  function setSection(src, item, body) {
    var model = parse(src);
    var group = groupFor(model, page);
    if (!group) { group = { page: page, items: [] }; model.groups.push(group); }
    var at = -1;
    group.items.forEach(function (i, n) { if (i.item === item) at = n; });
    body = strip(String(body == null ? '' : body).replace(/\r\n?/g, '\n').split('\n'));
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

  /* ---- drafts: the only text localStorage may keep --------------------------------------- */

  function draftKey(el) { return KEY + name(el); }

  function hold(el) {
    try { localStorage.setItem(draftKey(el), el.value); } catch (e) { /* private mode */ }
  }

  /** the section is in the file now, so the draft must not outlive it */
  function drop(el) {
    try { localStorage.removeItem(draftKey(el)); } catch (e) { /* private mode */ }
  }

  function draft(el) {
    try { return localStorage.getItem(draftKey(el)); } catch (e) { return null; }
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

  /** one write at a time: read, edit, write, and remember the text the boxes are now showing */
  function write(edit) {
    busy++;
    return readFile(file).then(function (src) {
      var out = edit(src);
      if (out === src) return src;
      return writeFile(file, out).then(function () { return out; });
    }).then(function (out) {
      busy--;
      lastSrc = out;
      return out;
    }, function (e) {
      busy--;
      throw e;
    });
  }

  /**
   * The file says what the boxes say. A box you are typing in is never thrown away, and a box
   * whose section is gone from the file is emptied — that is the point of the link.
   */
  function adopt(src) {
    var map = readPage(src);
    var count = 0;
    boxes.forEach(function (el) {
      var id = name(el);
      if (touched[id]) return;
      var text = map[id] || '';
      if (el.value === text) return;
      el.value = text;
      el.removeAttribute('data-draft');
      grow(el);
      count++;
    });
    return count;
  }

  /** text that never reached the file — a draft typed before linking — is written now */
  function flushDrafts(handle, src) {
    var out = src;
    var written = {};
    var n = 0;
    boxes.forEach(function (el) {
      var id = name(el);
      if (!touched[id]) return;                     // the file's own text, not a draft
      var before = out;
      out = setSection(out, id, el.value.trim());
      if (out === before) {                         // the file already says this
        delete touched[id];
        drop(el);
        return;
      }
      written[id] = el;
      n++;
    });
    if (!n) return Promise.resolve({ written: 0, src: out });
    return writeFile(handle, out).then(function () {
      boxes.forEach(function (el) {
        if (!written[name(el)]) return;
        delete touched[name(el)];
        drop(el);
      });
      return { written: n, src: out };
    });
  }

  function linkUp(handle) {
    return readFile(handle).then(function (src) {
      var count = adopt(src);
      return flushDrafts(handle, src).then(function (res) {
        linked = true;
        buttonLabel();
        lastSrc = res.src;
        var msg = count
          ? count + ' note' + (count === 1 ? '' : 's') + ' shown from ' + STORE
          : STORE + ' linked — nothing outstanding for this page';
        if (res.written) msg += ' · ' + res.written + ' draft' + (res.written === 1 ? '' : 's') + ' saved';
        say(msg);
        watch();
      });
    }).catch(function (e) {
      linked = false;
      buttonLabel();
      say('cannot read ' + STORE + ': ' + e.message, true);
    });
  }

  /** the file changed under us: a section deleted or edited in an editor reaches its box here */
  function tick() {
    if (!file || !linked || busy) return;
    return readFile(file).then(function (src) {
      if (src === lastSrc) return;
      lastSrc = src;
      var count = adopt(src);
      if (count) say(count + ' box' + (count === 1 ? '' : 'es') + ' refreshed from ' + STORE + ' · ' + time());
    }).catch(function () { /* not readable this second: the next tick tries again */ });
  }

  function watch() {
    if (poll) return;
    poll = setInterval(tick, POLL_MS);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
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
    hold(el);                                    // a draft until the write lands
    if (!file) { say('not linked to ' + STORE + ' — click “link ' + STORE + '” once', true); return; }
    return write(function (src) { return setSection(src, id, text); }).then(function () {
      delete touched[id];
      drop(el);
      say((text ? 'saved ' + size(text) + ' bytes' : 'section removed') + ' in ' + STORE + ' · ' + time());
    }).catch(function (e) {
      say('NOT saved: ' + e.message + ' — kept as a draft in this browser', true);
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
    var changed = false;
    boxes.forEach(hold);
    return write(function (src) {
      var out = src;
      boxes.forEach(function (el) { out = setSection(out, name(el), el.value); });
      changed = out !== src;
      return out;
    }).then(function () {
      boxes.forEach(function (el) { delete touched[name(el)]; drop(el); });
      say(changed ? 'saved every box in ' + STORE + ' · ' + time()
                  : 'nothing to save — ' + STORE + ' already says this');
    }).catch(function (e) {
      say('NOT saved: ' + e.message + ' — kept as a draft in this browser', true);
    });
  }

  /* Firefox and Safari: no file access at all, so hand the text over as a download */
  function download() {
    var chunks = ['## ' + page];
    boxes.forEach(function (el) {
      var text = el.value.trim();
      if (text) chunks.push('### ' + name(el) + '\n\n' + pointer(name(el)) + '\n' + text);
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

  /**
   * A draft that never reached the file comes back. A section deleted from the file has no
   * draft — its draft was dropped when the section was written — so it stays deleted.
   */
  function recover() {
    var restored = 0;
    boxes.forEach(function (el) {
      if (el.value.trim()) return;
      var text = draft(el);
      if (!text || !text.trim()) return;
      el.value = text;
      touched[name(el)] = true;
      el.setAttribute('data-draft', '1');
      grow(el);
      restored++;
    });
    if (restored) {
      say(restored + ' box' + (restored === 1 ? '' : 'es') + ' held as a draft in this browser, not in ' +
          STORE + ' — click “link ' + STORE + '” to save ' + (restored === 1 ? 'it' : 'them'), true);
    }
    return restored;
  }

  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || el.tagName !== 'TEXTAREA' || !el.classList.contains('qa-note')) return;
    el.removeAttribute('data-draft');
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

  if (!recover()) say('click “link ' + STORE + '” once — then the file and the boxes follow each other', true);

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

