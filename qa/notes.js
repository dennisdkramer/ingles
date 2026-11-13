/**
 * qa/notes.js — the note boxes on qa/preview-blocks.html.
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
 *     most one allow-click, not a fresh search. Chrome and Edge only;
 *   - OR with no picker, no permission prompt and nothing to re-grant: `node qa/serve.mjs` serves the
 *     repo on 127.0.0.1 and opens this page with `?notes=server`. The page then reads and writes
 *     qa/NOTES.md through that server, so typing in a box IS a write to the file. This is the path to
 *     use when the picker misbehaves — a `file://` page keeps its handle only as long as the browser
 *     lets it, and that grant lapses silently between sessions. The flag is explicit, so any OTHER
 *     static server leaves the page on the picker path, and double-clicking the page (no server, no
 *     flag) still works exactly as described above;
 *   - localStorage holds only text that has NOT reached the file: a draft typed before linking,
 *     or text whose write failed. The draft is dropped the moment its section is written, so a
 *     draft can never put back a note you deleted from qa/NOTES.md;
 *   - NOTHING IS EVER DELETED BY A BOX THAT WAS NOT READ. A page opens with every box empty, and a
 *     box is only allowed to write once it has ADOPTED a value (from the file, or from a draft, or
 *     from your typing). Ctrl+S used to walk every box on the page and write it — so in the window
 *     before the file was adopted, every empty box said "this section is empty" and the whole page's
 *     notes were deleted by one keystroke. Now a box with no adopted value is skipped, Ctrl+S refuses
 *     to write at all until the file is adopted, and before any write that would leave the file with
 *     fewer sections than it had, the text it is about to replace is kept in localStorage (one
 *     backup per page, restored by the "restore last backup" button). A write that arrives while an
 *     earlier one is still in flight is queued behind it, so two saves can never read the same text
 *     and lose each other's section. And NO BOX DELETES A SECTION: an empty box changes nothing and
 *     its last-read text goes straight back into it, so a request leaves this file only when its
 *     section is deleted from it in an editor — which empties the box on the next tick;
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
  /* `node qa/serve.mjs` opens the page with `?notes=server`, and then there is no picker at all: the
     page reads and writes qa/NOTES.md through two endpoints on the local server. The flag is explicit
     rather than sniffed, so any OTHER static server (the screenshot harness, a stray `python -m
     http.server`) leaves the page on the picker path instead of silently pointing at nothing. */
  var SERVED = /(?:^|[?&])notes=server(?:&|$)/.test(location.search);
  var SERVER = { endpoint: '/__qa-notes' };   // the stand-in "handle" when a local server is writing
  var POLL_MS = 2000;            // how often a linked page re-reads the file

  var HEADER = [
    '# Preview notes',
    '',
    'Open requests: one `##` block per preview page, one `###` section per item. The note boxes on the',
    'preview pages read and write this file directly (Chrome or Edge, click "link ' + STORE + '" once), so',
    'this file is the whole record and editing it here edits the boxes.',
    '',
    'Every section opens with a pointer to the item\'s `###` heading in `' + CONTRACT + '` — that',
    'heading is the contract the request argues with, and reading the two against each other is the whole',
    'job. The request stays here and is never copied into ' + CONTRACT + '. A section holding finished',
    'text and new text together loses only the finished part — execute what remains.',
    '',
    'How a request is worked, in the agent\'s own hand. When work on one starts, its text is tagged by',
    'prefixing it with `(IN PROGRESS)` — `(IN PROGRESS) make both blocks half width` — so a box shows at a',
    'glance what is under way and what is still untouched. The tag goes at the front of the line it applies',
    'to, which also makes it findable as `^(IN PROGRESS)`. When the request is met — the shape changed, the',
    'harness read — that text is deleted from this file: the section keeps its heading and its pointer and',
    'is simply empty, ready for the next request, and the record of work done is the commit. A section',
    'holding several requests is tagged and cleared one request at a time, never all at once, so the',
    'untagged lines are the ones still owed.',
    '',
    'The tag is the agent\'s to write, and only ever on work it has actually begun, so it never reads as a',
    'promise. A request it cannot meet as written — a question waiting on an answer, a note to self, a line',
    'that contradicts another in the same file — keeps its text, untagged, and the reply says what it waits',
    'for: nothing is deleted that was not done. Emptying a box deletes nothing either. Only this file',
    'removes a request: delete a `###` section here and its box empties within 2 s, so a request\'s text is',
    'deleted only once it is met.',
    '',
    'Two ways in. Best: `node qa/serve.mjs` (or double-click `qa/serve.cmd`) — it serves the repo on',
    '127.0.0.1 and opens the preview page with `?notes=server`, and the boxes then read and write this file',
    'through that server: nothing to pick, nothing to grant. Double-clicking the page on its own still',
    'works — one click on "link ' + STORE + '" grants the page file-system access — but that grant lapses',
    'between sessions, so the server is the reliable way in. Either way the page re-reads this file every 2 s.',
    'Text sitting directly under a `##` page heading is dropped the next time any box writes, so a block\'s',
    'content belongs in its `###` sections.',
].join('\n');

  var file = null;               // FileSystemFileHandle for qa/NOTES.md, once linked
  var linked = false;            // handle known and readable
  var timers = {};
  var touched = {};              // typed in, or a draft: the file must not overwrite this box
  var busy = 0;                  // writes in flight, so a poll cannot read a half-written file
  var lastSrc = null;            // the file text the boxes are showing
  var adopted = {};              // item -> the text this box last READ (file, draft or its own write)
  var chain = Promise.resolve(); // one write at a time: two saves must not read the same text
  var BACKUP = 'qa-notes-undo:' + page;
  var restoreBtn = null;
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
      if (!group.items.length) return;
      chunks.push('## ' + group.page);
      group.items.forEach(function (item) {
        /* A SECTION WITH NO BODY IS STILL A SECTION: it is a heading plus its pointer, waiting to be
           filled in, and only an edit to this file may delete it. Dropping it here meant the first
           write from any box silently destroyed every placeholder the file held — so a page of
           `### name` + pointer headings could not survive one keystroke anywhere else. */
        var body = strip(item.lines);
        chunks.push('### ' + item.item + '\n\n' + pointer(item.item) + (body ? '\n' + body : ''));
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

  /** src with one item's section set to body. An empty body changes NOTHING: a box cannot delete a
      section — only an edit to qa/NOTES.md can, and that reaches the box on the next tick. */
  function setSection(src, item, body) {
    var model = parse(src);
    var group = groupFor(model, page);
    if (!group) { group = { page: page, items: [] }; model.groups.push(group); }
    var at = -1;
    group.items.forEach(function (i, n) { if (i.item === item) at = n; });
    body = strip(String(body == null ? '' : body).replace(/\r\n?/g, '\n').split('\n'));
    if (!body) return src;                       // an empty box changes nothing: only the file deletes
    if (at >= 0) {
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
    if (SERVED) {
      button.textContent = linked ? STORE + ' · via serve.mjs' : 'reconnect ' + STORE;
      button.className = 'qa-link' + (linked ? ' qa-link-on' : '');
      return;
    }
    button.textContent = linked ? STORE + ' linked' : 'link ' + STORE;
    button.className = 'qa-link' + (linked ? ' qa-link-on' : '');
  }

  function restoreLabel() {
    if (!restoreBtn) return;
    var on = hasBackup();
    restoreBtn.hidden = !on;
    restoreBtn.disabled = !on;
  }

  /* the way back from a write that removed sections: the text it replaced, put back over the file as it
     stands. It is the ONE write that takes no backup — a backup here would replace the very text it is
     restoring with the text being undone. */
  function restore() {
    var src = null;
    try { src = localStorage.getItem(BACKUP); } catch (e) { src = null; }
    if (!src) { say('no backup kept for this page', true); return; }
    if (!file) { say('not linked to ' + STORE + ' — click “link ' + STORE + '” once', true); return; }
    var ask = (typeof window.eodConfirm === 'function') ? window.eodConfirm : function (o) { return Promise.resolve(window.confirm(o.title + ' ' + o.body)); };
    var proceed = ask({title:'Restore the backup?',body:'Write the last backed-up ' + STORE + ' back over the file?',confirm:'Restore',cancel:'Cancel'});
    proceed.then(function (yes) { return yes ? write(function () { return src; }, true) : null; }).then(function (out) {
      if (out == null) return; try { localStorage.removeItem(BACKUP); } catch (e) { /* private mode */ }
      restoreLabel();
      adopt(out);
      say('backup restored in ' + STORE + ' · ' + time());
    }).catch(function (e) {
      say('NOT restored: ' + e.message, true);
    });
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
    if (handle === SERVER) {
      return fetch(handle.endpoint, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('local server said ' + r.status);
        return r.text();
      });
    }
    return handle.getFile().then(function (f) { return f.text(); });
  }

  function writeFile(handle, text) {
    if (handle === SERVER) {
      return fetch(handle.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'text/plain;charset=utf-8' },
        body: text
      }).then(function (r) {
        if (r.ok) return text;
        return r.text().then(function (t) {
          throw new Error('local server refused the write: ' + r.status + ' ' + t.slice(0, 120));
        });
      });
    }
    return handle.createWritable().then(function (w) {
      return w.write(text).then(function () { return w.close(); });
    });
  }

  /* ---- the boxes follow the file --------------------------------------------------------- */

  /** one write at a time: read, edit, write, and remember the text the boxes are now showing */
  function write(edit, noBackup) {
    var run = function () {
      busy++;
      return readFile(file).then(function (src) {
        var out = edit(src);
        if (out === src) return src;
        /* a write that leaves the file with FEWER sections than it had is reversible: the text it is
           about to replace is kept in localStorage, one slot per page, until it is restored */
        if (!noBackup && sections(out) < sections(src)) backup(src);
        return writeFile(file, out).then(function () { return out; });
      }).then(function (out) {
        busy--;
        lastSrc = out;
        return out;
      }, function (e) {
        busy--;
        throw e;
      });
    };
    /* a second save that arrives mid-write must not read the same text the first one read, or the
       two would each write the other's change away */
    chain = chain.then(run, run);
    return chain;
  }

  function sections(src) {
    var m = String(src).match(/^###[ \t]/gm);
    return m ? m.length : 0;
  }
  /* the one backup a page keeps: the last text a shrinking write replaced */
  function backup(src) {
    try { localStorage.setItem(BACKUP, src); } catch (e) { /* private mode: no backup, the guard still holds */ }
    restoreLabel();
  }
  function hasBackup() {
    try { return !!localStorage.getItem(BACKUP); } catch (e) { return false; }
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
      /* this box has now READ a value, so it may speak for its section; until it has, it may not */
      adopted[id] = text;
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
      if (!el.value.trim()) { kept(el); return; }   // an emptied draft deletes nothing
      var before = out;
      out = setSection(out, id, el.value.trim());
      if (out === before) {                         // the file already says this
        adopted[id] = el.value.trim();
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
        adopted[name(el)] = el.value.trim();
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
        if (SERVED) msg += ' · via qa/serve.mjs';
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

  /** a box never deletes a section: its last-read text goes back into it and the file is not touched */
  function kept(el) {
    var id = name(el);
    delete touched[id];
    drop(el);
    /* this box never read the file (a draft cleared before linking): read it now, so the text comes back */
    if (!adopted.hasOwnProperty(id) && lastSrc) adopt(lastSrc);
    if (adopted[id]) { el.value = adopted[id]; grow(el); }
    return !!adopted[id];
  }

  function save(el) {
    var id = name(el);
    var text = el.value.trim();
    hold(el);                                    // a draft until the write lands
    if (!file) {
      say(SERVED ? 'still reading ' + STORE + ' from the local server — one second'
        : 'not linked to ' + STORE + ' — click “link ' + STORE + '” once', true);
      return;
    }
    /* the file has not been read yet, so this page does not know what the section says: the text is
       kept in this browser as a draft and written the moment the file is adopted (flushDrafts) */
    if (!linked) { say('not linked yet — your text is kept in this browser until ' + STORE + ' is read', true); return; }
    if (!text) {                                 // an emptied box writes nothing, and deletes nothing
      say(kept(el) ? 'empty box — the section stays in ' + STORE + '; delete it there'
                   : 'empty box — nothing to save');
      return;
    }
    return write(function (src) { return setSection(src, id, text); }).then(function () {
      adopted[id] = text;
      delete touched[id];
      drop(el);
      say('saved ' + size(text) + ' bytes in ' + STORE + ' · ' + time());
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

  /**
   * Every box at once. THE GUARD: a box only writes if it has READ its section or you TYPED in it —
   * an empty box left over from a page load says nothing about the file. A box whose text still
   * equals what it read is skipped too: an unchanged box never rewrites the file. And no box ever
   * deletes a section — emptying one puts its text straight back, because only the file deletes.
   */
  function saveAll() {
    if (!file) { say('not linked to ' + STORE + ' — click “link ' + STORE + '” once', true); return; }
    if (!linked) {
      say('not linked yet — ' + STORE + ' has not been read, so nothing was written '
        + '(your text is held in this browser)', true);
      return;
    }
    var changed = false, written = {}, emptied = 0;
    boxes.forEach(hold);
    return write(function (src) {
      var out = src;
      boxes.forEach(function (el) {
        var id = name(el);
        if (!touched[id] && !adopted.hasOwnProperty(id)) return;   // never read: it may not speak
        if (!touched[id] && el.value === adopted[id]) return;      // unchanged: leave it alone
        if (!el.value.trim()) { kept(el); emptied++; return; }     // an emptied box deletes nothing
        out = setSection(out, id, el.value);
        written[id] = true;
      });
      changed = out !== src;
      return out;
    }).then(function () {
      boxes.forEach(function (el) {
        if (!written[name(el)]) return;
        adopted[name(el)] = el.value.trim();
        delete touched[name(el)];
        drop(el);
      });
      say(changed ? 'saved every box in ' + STORE + ' · ' + time()
          : emptied ? 'empty box kept — only ' + STORE + ' deletes a section'
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

  if (PICKER || SERVED) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'qa-link';
    button.addEventListener('click', function () {
      if (SERVED) { linkServer(); return; }
      connect().catch(function (e) { say('not linked: ' + e.message, true); });
    });
    document.body.appendChild(button);
    buttonLabel();
    /* the backup button: only on screen when this page has a backup to put back */
    restoreBtn = document.createElement('button');
    restoreBtn.type = 'button';
    restoreBtn.className = 'qa-link';
    restoreBtn.textContent = 'restore last backup';
    restoreBtn.addEventListener('click', restore);
    document.body.appendChild(restoreBtn);
    restoreLabel();
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
          STORE + (SERVED ? ' — writing it now'
            : ' — click “link ' + STORE + '” to save ' + (restored === 1 ? 'it' : 'them')), !SERVED);
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
    if (SERVED) { saveAll(); return; }
    if (!PICKER) { download(); return; }
    if (!file) { connect().catch(function (err) { say('not linked: ' + err.message, true); }); return; }
    saveAll();
  });

  /** the served page: the server IS the file, so there is nothing to pick and nothing to grant */
  function linkServer() {
    file = SERVER;
    return linkUp(SERVER).catch(function (e) {
      linked = false;
      buttonLabel();
      say('cannot reach ' + STORE + ' through qa/serve.mjs: ' + e.message +
          ' — is the server still running?', true);
    });
  }

  if (!PICKER && !SERVED) {
    recover();
    say('this browser cannot reach ' + STORE + ' — Ctrl+S downloads the note text', true);
    return;
  }

  if (SERVED) {
    recover();                                   // a draft typed before the server was started
    linkServer();
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

