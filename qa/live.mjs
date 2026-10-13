/**
 * qa/live.mjs — LIVE English-lessons harness: a REAL headless Chrome driven over CDP.
 *
 * WHY THIS EXISTS (MASTER_CONTEXT "VERIFICATION ENVIRONMENT"): qa/smoke.mjs runs on jsdom, which has
 * no layout, no painting, no real selection/mouse and no real MediaRecorder — so it cannot see the
 * highlight layer being painted (#hlLayer), it cannot make a real text selection with a real drag and
 * it cannot see a rectangle land on the wrong characters. A previous bug (the Ctrl auto-repeat
 * palette) passed jsdom QA and still broke in the browser. This harness closes that hole:
 *
 *   node qa/live.mjs                  run every scenario
 *   node qa/live.mjs --only=diag       run one (diag | geo | bf2 | bf2b | bf3 | bf4 | all)
 *   node qa/live.mjs --headful        show the browser (default: headless=new)
 *   node qa/live.mjs --keep           keep the temp Chrome profile + the screenshots
 *   $env:CHROME="C:\path\to\chrome.exe"   override the browser
 *
 * HOW IT WORKS (zero dependencies — Node 22+ has global fetch + WebSocket):
 *   1. a tiny static server serves the repo (portal.html, lesson pages, engines, css);
 *   2. the same server answers the harness control API under /__bp (reset / foreign row / write delay)
 *      and plays the role of the Apps Script deployment: a real in-memory "sheet" of rows with the
 *      same shape (id|email|track|lesson|type|anchor|data|author|ts|b64) and the same actions
 *      (add/set/del). Every request to script.google.com is intercepted with Fetch.fulfillRequest, so
 *      the page runs its REAL code path (fetch → JSON) against a controllable backend;
 *   3. Chrome runs with --headless=new --remote-debugging-port=0; the DevTools endpoint is read from
 *      its stderr and a minimal CDP client (WebSocket) drives it;
 *   4. a probe is injected with Page.addScriptToEvaluateOnNewDocument BEFORE any page script, so it can
 *      seed sessionStorage (the gate), stub MediaRecorder/getUserMedia/AudioContext (a fake mic that
 *      goes loud then silent, so a recording finishes in ~3s) and expose window.__q — find/rect/drag
 *      helpers plus a full state dump (layer rows, local rows, pending windows, mark.nb pieces,
 *      #hlLayer rectangles, popup buttons, page errors);
 *   5. gestures are REAL: Input.dispatchMouseEvent down/move/up (+ modifiers for Ctrl) and
 *      Input.dispatchKeyEvent for keys. Popup buttons are real DOM buttons with real handlers, so a
 *      synthetic click is honest there; text selection is never faked.
 *
 * The scenarios reproduce the three pending bugs from FUNCTION.md and print a state dump at every
 * step, so a failure shows WHY (rows written, pending windows, mark pieces, painted rectangles).
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, '_live');
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EMAIL = 'live.qa@ingles.test';
const SECRET = 'abreportas2025';
const TRACK = 'business';
const LESSON = 1;

const has = n => process.argv.includes(n);
const arg = (n, d) => { const a = process.argv.find(x => x.startsWith(n + '=')); return a ? a.slice(n.length + 1) : d };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => { const s = a.join(' '); console.log(s); try { fs.appendFileSync(path.join(OUT, 'run.txt'), s + '\n'); } catch (e) { } };


/* ---------------------------------------------------------------------------------------------
   1. THE FAKE BACKPACK (Apps Script) — same row shape / same actions as backend/Code.gs
   --------------------------------------------------------------------------------------------- */
const bp = { rows: [], log: [], postDelay: 0, seq: 0 };
const bpReset = () => { bp.rows = []; bp.log = []; bp.postDelay = 0; bp.seq = 0 };
const bpRow = r => ({ id: r.id, type: r.type, anchor: r.anchor, data: r.data, author: r.author, ts: r.ts, fileId: r.fileId || '', b64: r.b64 || '', mime: 'audio/webm' });
const bpLayer = (email, lesson) => bp.rows
  .filter(r => String(r.email) === String(email) && String(r.lesson) === String(lesson))
  .map(bpRow);
/* the write: like the backend — an id already present is REPLACED, otherwise appended; a clip that
   arrives as b64 comes back with a Drive pointer (the real path) and no inline copy */
function bpWrite(o) {
  const id = String(o.id || ('srv_' + (++bp.seq)));
  const i = bp.rows.findIndex(r => String(r.id) === id);
  if (i >= 0) bp.rows.splice(i, 1);
  const row = {
    id, email: o.email || '', track: o.track || '', lesson: o.lesson == null ? '' : o.lesson,
    type: o.type || '', anchor: o.anchor || '',
    data: typeof o.data === 'string' ? o.data : JSON.stringify(o.data == null ? '' : o.data),
    author: o.author || 'aluno', ts: new Date().toISOString(),
    b64: o.b64 ? '' : '', fileId: o.b64 ? 'FAKE_' + id + '.webm' : ''
  };
  bp.rows.push(row);
  return row;
}
const bpDel = id => { const n = bp.rows.length; bp.rows = bp.rows.filter(r => String(r.id) !== String(id)); return n - bp.rows.length };
function bpForeign(tag) {   /* a row from ANOTHER session: changes the poll's id signature */
  bp.rows.push({
    id: 'foreign_' + tag, email: EMAIL, track: TRACK, lesson: LESSON, type: 'hl',
    anchor: 'foreign row ' + tag, data: '{"color":"red","b":0,"o":0}',
    author: 'aluno', ts: new Date().toISOString(), fileId: '', b64: ''
  });
}

/* ---------------------------------------------------------------------------------------------
   2. SITE + CONTROL SERVER
   --------------------------------------------------------------------------------------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
function startSite() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      if (u.pathname === '/__bp') {                    /* harness control API (the page never calls it) */
        const q = u.searchParams;
        if (q.has('reset')) bpReset();
        if (q.has('delay')) bp.postDelay = Number(q.get('delay')) || 0;
        if (q.has('foreign')) bpForeign(q.get('foreign') || String(Date.now()));
        if (q.has('mk')) bp.rows.push(JSON.parse(q.get('mk')));
        if (q.has('del')) bpDel(q.get('del'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, n: bp.rows.length }));
        return;
      }
      const fp = path.join(ROOT, decodeURIComponent(u.pathname === '/' ? '/portal.html' : u.pathname));
      if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('no'); return }
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404'); return }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port, close: () => new Promise(r => srv.close(r)) }));
  });
}

/* ---------------------------------------------------------------------------------------------
   3. CHROME + A MINIMAL CDP CLIENT
   --------------------------------------------------------------------------------------------- */
function launchChrome(profile) {
  const args = [
    '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--window-size=1400,1000', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-sync', '--disable-default-apps',
    '--disable-extensions', '--disable-component-update', '--disable-client-side-phishing-detection',
    '--disable-features=Translate,MediaRouter,OptimizationHints', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--allow-running-insecure-content', 'about:blank'
  ];
  if (has('--headful')) { args.shift(); args.splice(1, 0, '--start-maximized'); }
  const proc = spawn(CHROME, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let buf = '';
    const onData = d => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) { proc.stderr.off('data', onData); resolve({ proc, browserWs: m[1] }); }
    };
    proc.stderr.on('data', onData);
    proc.on('error', reject);
    setTimeout(() => reject(new Error('chrome did not print a DevTools endpoint:\n' + buf)), 20000);
  });
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const c = {
      ws, id: 0, waiters: new Map(), listeners: new Map(),
      send(method, params = {}, sessionId) {
        const id = ++c.id;
        return new Promise((res, rej) => {
          c.waiters.set(id, { res, rej, method });
          ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
          setTimeout(() => { if (c.waiters.has(id)) { c.waiters.delete(id); rej(new Error('CDP timeout: ' + method)) } }, 30000);
        });
      },
      on(name, fn) { if (!c.listeners.has(name)) c.listeners.set(name, []); c.listeners.get(name).push(fn) }
    };
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.id) {
        const w = c.waiters.get(m.id);
        if (w) { c.waiters.delete(m.id); m.error ? w.rej(new Error(w.method + ': ' + JSON.stringify(m.error))) : w.res(m.result) }
        return;
      }
      for (const fn of (c.listeners.get(m.method) || [])) fn(m.params, m.sessionId);
    });
    ws.addEventListener('error', e => reject(new Error('ws error: ' + (e.message || 'unknown'))));
    ws.addEventListener('open', () => resolve(c));
  });
}

/* every request to the Apps Script deployment is answered by the fake sheet above */
function wireBackpack(cdp) {
  cdp.on('Fetch.requestPaused', async p => {
    const req = p.request || {};
    const url = req.url || '';
    const finish = obj => cdp.send('Fetch.fulfillRequest', {
      requestId: p.requestId, responseCode: 200,
      responseHeaders: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Cache-Control', value: 'no-store' }
      ],
      body: Buffer.from(JSON.stringify(obj)).toString('base64')
    }).catch(e => log('  !! fulfill failed', e.message));
    try {
      if (req.method === 'POST') {
        let body = req.postData;
        if (!body) { try { body = (await cdp.send('Fetch.getRequestPostData', { requestId: p.requestId })).postData } catch (e) { } }
        let o = {}; try { o = JSON.parse(body || '{}') } catch (e) { log('  !! bad POST body', body) }
        bp.log.push('POST ' + o.action + ' ' + (o.type || ''));
        if (bp.postDelay) await sleep(bp.postDelay);            /* a slow write (LockService / Drive) */
        let out;
        if (o.action === 'del') { const n = bpDel(o.id); out = { result: 'ok', purged: n > 0 } }
        else { bpWrite(o); out = { result: 'ok', id: o.id } }
        log('  bp ← POST', o.action, o.type || '', String(o.id || '').slice(0, 24), 'rows=' + bp.rows.length);
        return finish(out);
      }
      const q = new URL(url).searchParams;
      const action = q.get('action') || 'layer';
      bp.log.push('GET ' + action);
      if (action === 'file') return finish({ b64: 'TUlOSQ==', mime: 'audio/webm' });
      /* engine2.loadLayer reads j.rows — the real deployment answers {rows:[…]}; a bare array here
         would make EVERY poll return an empty layer, so no stored row could ever be restored and
         B-F2/B-F3 would "fail" for a harness reason instead of a real one */
      return finish({ rows: bpLayer(q.get('email'), q.get('lesson')) });
    } catch (e) {
      log('  !! interception error', e.message);
      return finish({ error: 'harness' });
    }
  });
}

/* ---------------------------------------------------------------------------------------------
   4. THE INJECTED PROBE (runs in the page before any page script) + the driver helpers
   --------------------------------------------------------------------------------------------- */
function probeFn(gate) {
  try { sessionStorage.setItem('gate', JSON.stringify(gate)) } catch (e) { }
  window.__errs = [];
  window.addEventListener('error', e => window.__errs.push('err:' + (e.message || e)));
  window.addEventListener('unhandledrejection', e => window.__errs.push('rej:' + ((e.reason && e.reason.message) || e.reason)));
  /* --- fake microphone: a MediaRecorder stand-in whose level goes loud then SOLENT, so the page's
         own silence detector stops the clip ~immediately (fast tests, no 15s wait per recording).
         getByteTimeDomainData is what the page samples, so the level is scripted there. ------- */
  (function () {
    var SILENT_AFTER = 900;
    function FakeRec(stream, opts) {
      var self = this, done = false;
      this.state = 'inactive'; this.ondataavailable = null; this.onstop = null; this.onerror = null;
      this.start = function () { self.state = 'recording' };
      this.stop = function () {
        if (done) return; done = true; self.state = 'inactive';
        if (typeof self.ondataavailable === 'function') self.ondataavailable({ data: { size: 20300, type: (opts && opts.mimeType) || 'audio/webm' } });
        if (typeof self.onstop === 'function') self.onstop();
      };
      this.addEventListener = function (n, f) { self['on' + n] = f };
      this.removeEventListener = function () { };
    }
    FakeRec.isTypeSupported = function () { return true };
    window.MediaRecorder = FakeRec;
    var stream = { getTracks: function () { return [{ stop: function () { } }] }, getAudioTracks: function () { return [{ stop: function () { } }] } };
    /* `mediaDevices` is a READONLY accessor on Navigator.prototype: a plain assignment silently fails
       in a real browser and the page would then call the REAL getUserMedia (permission denied in
       headless). The fake must be forced in with defineProperty, with a last-resort fallback. */
    var gum = { getUserMedia: function () { window.__recT0 = Date.now(); return Promise.resolve(stream) }, enumerateDevices: function () { return Promise.resolve([]) } };
    try { Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: gum }) }
    catch (e) { try { navigator.mediaDevices.getUserMedia = gum.getUserMedia } catch (e2) { } }
    var analyser = {
      fftSize: 2048, frequencyBinCount: 1024, connect: function () { }, disconnect: function () { },
      getByteTimeDomainData: function (a) {
        var loud = (Date.now() - (window.__recT0 || 0)) < SILENT_AFTER;
        for (var i = 0; i < a.length; i++) a[i] = loud ? 128 + 60 * Math.sin(i / 3) : 128;
      },
      getByteFrequencyData: function (a) { for (var i = 0; i < a.length; i++) a[i] = 0 }
    };
    function FakeCtx() {
      this.state = 'running';
      this.createMediaStreamSource = function () { return { connect: function () { }, disconnect: function () { } } };
      this.createAnalyser = function () { return analyser };
      this.close = function () { }; this.resume = function () { return Promise.resolve() };
    }
    window.AudioContext = FakeCtx; window.webkitAudioContext = FakeCtx;
  })();
  /* --- geometry + state helpers (window.__q) ------------------------------------------------- */
  var Q = {};
  Q.T = function () {                      /* visible text + the text nodes it is made of */
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), ns = [], all = '', n;
    while ((n = w.nextNode())) {
      var p = n.parentElement;
      if (p && p.closest('script,style,.pop,#hlLayer,#toast,.recind')) continue;
      ns.push({ n: n, s: all.length });
      all += n.data;
    }
    return { all: all, ns: ns };
  };
  Q.find = function (sub, occ) {           /* the nth occurrence of `sub` -> the boundary points */
    var m = Q.T(), all = m.all, want = occ || 0, at = -1, c = 0, i = -1;
    for (; ;) {
      i = all.indexOf(sub, i + 1);
      if (i < 0) break;
      if (c === want) { at = i; break }
      c++;
    }
    if (at < 0) return null;
    var end = at + sub.length, a = null, b = null, k, o;
    for (k = 0; k < m.ns.length; k++) {
      o = m.ns[k];
      if (!a && o.s <= at && at < o.s + o.n.data.length) a = { n: o.n, off: at - o.s };
      if (!b && o.s < end && end <= o.s + o.n.data.length) b = { n: o.n, off: end - o.s };
    }
    if (!a || !b) return null;
    return { ns: a.n, os: a.off, ne: b.n, oe: b.off, txt: sub, i: at };
  };
  Q.rng = function (p) { var r = document.createRange(); r.setStart(p.ns, p.os); r.setEnd(p.ne, p.oe); return r };
  /* the selection the page had AT the moment the button was released, captured before the engine can
     destroy it: the Ctrl path (hlFromSelection) removes all ranges inside its own mouseup listener,
     so reading getSelection() from outside can only ever see "". Registered here at document start,
     i.e. BEFORE engine1.js, and with capture:true — capture listeners run in registration order, so
     this one always observes the selection the gesture ended with. Empty changes are ignored so the
     engine clearing the ranges a moment later cannot wipe the record. */
  window.__lastSel = '';
  var noteSel = function () { try { var s = getSelection(), t = s ? s.toString() : ''; if (t) window.__lastSel = t } catch (e) { } };
  document.addEventListener('selectionchange', noteSel, true);
  document.addEventListener('mouseup', noteSel, true);
  Q.lastSel = function () { return window.__lastSel };
  Q.dotAt = function (p) {                 /* viewport coords for a drag over a range, current scroll */
    var r = Q.rng(p), rs = [];
    try { rs = [].slice.call(r.getClientRects()) } catch (e) { }
    rs = rs.filter(function (b) { return b.width > 0 || b.height > 0 });
    if (!rs.length) return { err: 'no rect for ' + p.txt };
    var first = rs[0], last = rs[rs.length - 1];   /* a multi-line phrase: from the first to the last line */
    return {
      txt: p.txt, occ: p.i, lines: rs.length,
      sx: Math.round(first.left + 1), sy: Math.round(first.top + first.height / 2),
      ex: Math.round(last.right - 1), ey: Math.round(last.bottom - last.height / 2),
      rect: [Math.round(first.left), Math.round(first.top), Math.round(first.width), Math.round(first.height)]
    };
  };
  Q.dot = function (sub, occ) {            /* viewport coords for a drag over the nth occurrence */
    var p = Q.find(sub, occ);
    if (!p) return { err: 'text not found: ' + sub };
    var host = p.ns.parentElement || document.body;
    try { host.scrollIntoView({ block: 'center', inline: 'nearest' }) } catch (e) { }
    return Q.dotAt(p);
  };
  /* TWO dots for ONE drag that may run from a phrase to ANOTHER one far away: scrolling per-dot would
     invalidate the first dot's viewport coords, so scroll ONCE for the union of both ranges and measure
     the two ends at that single scroll position. */
  Q.dot2 = function (sa, oa, sb, ob) {
    var pa = Q.find(sa, oa), pb = Q.find(sb, ob);
    if (!pa) return { err: 'text not found: ' + sa };
    if (!pb) return { err: 'text not found: ' + sb };
    var ra = Q.rng(pa).getBoundingClientRect(), rb = Q.rng(pb).getBoundingClientRect();
    var sy = window.scrollY || 0, top = Math.min(ra.top + sy, rb.top + sy), bot = Math.max(ra.bottom + sy, rb.bottom + sy);
    var room = Math.max(80, window.innerHeight - 150);
    window.scrollTo(0, Math.max(0, (bot - top < room) ? (top + bot) / 2 - window.innerHeight / 2 : top - 90));
    return { a: Q.dotAt(pa), b: Q.dotAt(pb) };
  };
  Q.rectsOf = function (sub, occ) {        /* every line rectangle of the nth occurrence, in doc coords */
    var p = Q.find(sub, occ); if (!p) return [];
    var r = Q.rng(p), out = [];
    try { out = [].slice.call(r.getClientRects()) } catch (e) { }
    var sx = window.scrollX || 0, sy = window.scrollY || 0;
    return out.filter(function (b) { return b.width > 0 || b.height > 0 })
      .map(function (b) { return [Math.round(b.left + sx), Math.round(b.top + sy), Math.round(b.width), Math.round(b.height)] });
  };
  Q.rectOf = function (sub, occ) { var d = Q.dot(sub, occ); return d.err ? d.err : d.rect };
  Q.docRect = function (node) { var r = node.getBoundingClientRect(); return [Math.round(r.left + scrollX), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)] };
  Q.rects = function () {
    return [].slice.call(document.querySelectorAll('#hlLayer .hlr')).map(function (d) {
      var b = d.getBoundingClientRect();
      return { id: d.getAttribute('data-hlid'), cls: d.className, doc: [Math.round(b.left + scrollX), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)] };
    });
  };
  /* every piece of a note/recording anchor. A piece is one mark.nb[data-a=…] element: engine1's
     nbWrap deliberately SPLITS a mark an overlapping save merely crosses, so an anchor can be painted
     by several pieces — B-F4 is exactly the question of whether it should be. The dump therefore
     carries b/o (the stored occurrence, once the engine records it), kids (how many nodes the mark
     covers: only a MULTI-node mark can be split) and the mark's own document rectangle. */
  Q.marks = function () {
    return [].slice.call(document.querySelectorAll('mark.nb')).map(function (m) {
      return {
        a: m.getAttribute('data-a'), cls: m.className, txt: m.textContent,
        b: m.dataset.b == null ? null : Number(m.dataset.b),
        o: m.dataset.o == null ? null : Number(m.dataset.o),
        kids: m.childNodes.length, doc: Q.docRect(m)
      };
    });
  };
  Q.pieces = function (a) { return Q.marks().filter(function (m) { return m.a === a }) };
  Q.rectHit = function (r1, r2) {          /* do two document rectangles touch at all? */
    return !(r1[0] + r1[2] <= r2[0] || r2[0] + r2[2] <= r1[0] || r1[1] + r1[3] <= r2[1] || r2[1] + r2[3] <= r1[1]);
  };
  Q.rectsHit = function (list, want) {     /* any of these painted rects over any of these text rects? */
    for (var i = 0; i < list.length; i++) for (var k = 0; k < want.length; k++) if (Q.rectHit(list[i], want[k])) return true;
    return false;
  };
  Q.markRect = function (a, i) {           /* a mark piece's viewport rect, scrolled into view */
    var list = [], all = document.querySelectorAll('mark.nb');
    for (var k = 0; k < all.length; k++) if (all[k].getAttribute('data-a') === a) list.push(all[k]);
    var el = list[i || 0]; if (!el) return null;
    try { el.scrollIntoView({ block: 'center' }) } catch (e) { }
    var rs = [].slice.call(el.getClientRects());
    var r = (rs.length ? rs[0] : el.getBoundingClientRect());
    return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
  };
  Q.spanOf = function (sub, occ) {         /* the ENGINE's own ruler: {b,start,end} of the nth occurrence */
    var p = Q.find(sub, occ); if (!p) return null;
    try {
      var blk = hlBlockOf(p.ns); if (!blk) return null;
      var b = hlBlocks().indexOf(blk); if (b < 0) return null;
      return { b: b, start: hlOffset(blk, p.ns, p.os), end: hlOffset(blk, p.ne, p.oe) };
    } catch (e) { return { err: String((e && e.message) || e) } }
  };
  Q.freeSpot = function () {               /* a point that is NOT a link/button/popup: safe to click to dismiss */
    var bad = 'a,button,input,textarea,select,label,.pop,[onclick]';
    var W = innerWidth, H = innerHeight;
    var pts = [[Math.round(W - 6), 4], [4, 4], [Math.round(W / 2), 4],
    [4, Math.round(H - 6)], [Math.round(W - 6), Math.round(H - 6)]];
    for (var i = 0; i < pts.length; i++) {
      var x = pts[i][0], y = pts[i][1];
      if (x < 1 || y < 1 || x > W - 2 || y > H - 2) continue;
      var el = document.elementFromPoint(x, y);
      if (!el) continue;
      if (el.closest && el.closest(bad)) continue;
      return [x, y];
    }
    return null;
  };
  Q.popup = function () {
    var p = document.querySelector('.pop');
    if (!p) return null;
    var btns = [].slice.call(p.querySelectorAll('button')).map(function (b) { return b.id + (b.disabled ? '#' : (b.className.indexOf('locked') >= 0 ? '*' : '')) });
    var nb = p.querySelector('#nbNote'), nt = p.querySelector('#nt');
    return {
      cls: p.className, buttons: btns.join(','),
      note: nb ? nb.textContent : null, editing: !!nt,
      text: (p.textContent || '').split(' ').join(' ').slice(0, 140)
    };
  };
  Q.state = function () {
    var out = { errs: (window.__errs || []).slice(0, 5) };
    out.errb = (document.getElementById('errb') || {}).textContent || null;
    out.toast = (document.getElementById('toast') || {}).textContent || null;
    out.A = !!window.__A; out.B = !!window.__B;
    out.host = location.pathname;
    out.sel = (function () { try { var s = getSelection(); return s ? s.toString() : '' } catch (e) { return '?' } })();
    var g = function (v) { try { return v } catch (e) { return null } };
    var rows = g(typeof layer === 'undefined' ? null : layer) || [];
    out.layer = rows.map(function (r) { return { id: r.id, type: r.type, anchor: r.anchor, data: r.data, fileId: r.fileId || '' } });
    var nl = g(typeof nbLocal === 'undefined' ? null : nbLocal) || [];
    out.nbLocal = nl.map(function (r) { return r.id + '|' + r.type + '|' + r.anchor });
    var po = g(typeof pendingOps === 'undefined' ? null : pendingOps) || [];
    out.pending = po.map(function (p) { return p.id.slice(0, 18) + '|' + p.action + '|' + Math.round((p.until - Date.now()) / 1000) + 's' });
    var hl = g(typeof hlList === 'undefined' ? null : hlList) || [];
    out.hlList = hl.map(function (r) { return { id: r.id, color: r.color, anchor: r.anchor, b: r.b, start: r.start, end: r.end, nrects: (r.rects || []).length } });
    out.hlr = Q.rects();
    out.marks = Q.marks();
    out.popup = Q.popup();
    return out;
  };
  window.__q = Q;
}
function h(s) { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return x }
const GATE = { email: EMAIL, track: TRACK, sig: h(EMAIL + TRACK + SECRET), teacher: false };
const PROBE = '(' + probeFn.toString() + ')(' + JSON.stringify(GATE) + ')';

/* ---------------------------------------------------------------------------------------------
   5. THE DRIVER — real mouse/keyboard over CDP, plus dumps and PNG evidence
   --------------------------------------------------------------------------------------------- */
class Live {
  constructor(cdp, url) { this.cdp = cdp; this.url = url; this.shots = [] }
  async ev(expr) {
    const r = await this.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, userGesture: true });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error('page eval failed: ' + ((d.exception && (d.exception.description || d.exception.value)) || d.text) + '\n  expr: ' + expr.slice(0, 300));
    }
    return r.result.value;
  }
  async wait(expr, ms = 8000, label) {
    const t0 = Date.now(), why = label || expr;
    for (; ;) {
      let v = false;
      try { v = await this.ev(expr) } catch (e) { }
      if (v) return v;
      if (Date.now() - t0 > ms) throw new Error('TIMEOUT waiting for: ' + why);
      await sleep(100);
    }
  }
  async boot() {                                   /* wait for a loaded page with both engines up */
    await this.wait('document.readyState==="complete"', 20000, 'document load');
    await this.wait('!!(window.__A&&window.__B)', 20000, 'engines loaded (__A/__B)');
    await sleep(400);
    const s = await this.state();
    if (String(s.host).indexOf('/business/lesson1.html') < 0) throw new Error('the browser is not on the lesson page: ' + s.host + ' (gate rejected?) ' + JSON.stringify(s.errs));
  }
  async nav(url) { await this.cdp.send('Page.navigate', { url: url || this.url }); await this.boot() }
  async reload() { await this.cdp.send('Page.reload', {}); await this.boot() }
  async state() { return this.ev('window.__q?window.__q.state():"no probe"') }
  async mouse(type, x, y, o = {}) {
    const mods = o.mods || 0;
    /* A DRAGGING mouseMoved must be tagged button:'left'. Measured live in the diag scenario:
       moves sent with button:'none' (however correct the buttons bitmask is) never extend a
       selection, so a drag selected NOTHING and no gesture in this harness could fire — while the
       exact same coordinates with button:'left' select the phrase and open the popup. */
    const buttons = o.buttons == null ? (type === 'mousePressed' ? 1 : 0) : o.buttons;
    await this.cdp.send('Input.dispatchMouseEvent', {
      type, x: Math.round(x), y: Math.round(y), modifiers: mods, pointerType: 'mouse',
      button: type === 'mouseMoved' ? (buttons ? 'left' : 'none') : 'left', clickCount: o.clicks || 1,
      buttons
    });
  }
  /* a real text selection: down, several moves, up — Chrome builds the selection itself */
  async drag(from, to, o = {}) {
    const mods = o.ctrl ? 2 : 0, steps = o.steps || 8;
    await this.mouse('mouseMoved', from.sx, from.sy, { mods, buttons: 0 });
    await sleep(40);
    await this.mouse('mousePressed', from.sx, from.sy, { mods, buttons: 1 });
    await sleep(60);
    for (let i = 1; i <= steps; i++) {
      await this.mouse('mouseMoved', from.sx + (to.ex - from.sx) * i / steps, from.sy + (to.ey - from.sy) * i / steps, { mods, buttons: 1 });
      await sleep(15);
    }
    await this.mouse('mouseReleased', to.ex, to.ey, { mods, buttons: 0 });
    await sleep(220);
  }
  async click(x, y, o = {}) {
    await this.mouse('mouseMoved', x, y, { mods: o.mods || 0, buttons: 0 });
    await this.mouse('mousePressed', x, y, { mods: o.mods || 0 });
    await sleep(30);
    await this.mouse('mouseReleased', x, y, { mods: o.mods || 0 });
    await sleep(150);
  }
  async key(key, code, mods = 0) {
    const base = { modifiers: mods, key, code, windowsVirtualKeyCode: key === 'Escape' ? 27 : (key === 'Control' ? 17 : 0), nativeVirtualKeyCode: 0 };
    await this.cdp.send('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown' }, base));
    await this.cdp.send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, base));
    await sleep(80);
  }
  clickSel(sel) { return this.ev('(function(){var e=document.querySelector(' + JSON.stringify(sel) + ');if(!e)return "missing "+' + JSON.stringify(sel) + ';e.click();return "clicked"})()') }
  typeInto(sel, text) {
    return this.ev('(function(){var e=document.querySelector(' + JSON.stringify(sel) + ');if(!e)return "missing";e.focus();e.value=' + JSON.stringify(text) + ';e.dispatchEvent(new Event("input",{bubbles:true}));return e.value})()');
  }
  async shot(name, box) {
    const p = { format: 'png', captureBeyondViewport: false };
    if (box) p.clip = { x: box[0], y: box[1], width: box[2], height: box[3], scale: 1 };
    const r = await this.cdp.send('Page.captureScreenshot', p);
    const file = path.join(OUT, name + '.png');
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    this.shots.push(file);
    log('      📷 ' + file);
    return file;
  }
  /* a compact, readable dump of everything the three bugs can be seen in */
  async dump(label, full) {
    const s = await this.state();
    log('   ── ' + label);
    log('      marks   : ' + JSON.stringify(s.marks));
    log('      hlr     : ' + JSON.stringify(s.hlr));
    if (full) {
      log('      hlList  : ' + JSON.stringify(s.hlList));
      log('      layer   : ' + JSON.stringify(s.layer));
      log('      nbLocal : ' + JSON.stringify(s.nbLocal));
      log('      pending : ' + JSON.stringify(s.pending));
    }
    log('      popup   : ' + JSON.stringify(s.popup));
    if (s.toast) log('      toast   : ' + JSON.stringify(s.toast));
    if (s.errb) log('      errb    : ' + JSON.stringify(s.errb));
    if (s.errs && s.errs.length) log('      pageErr : ' + JSON.stringify(s.errs));
    return s;
  }
}

/* ---------------------------------------------------------------------------------------------
   6. ASSERTIONS + GESTURE HELPERS
   --------------------------------------------------------------------------------------------- */
let pass = 0, fail = 0;
const failures = [];
function check(name, cond, extra) {
  if (cond) { pass++; log('   ✅ ' + name) }
  else { fail++; failures.push(name); log('   ❌ ' + name + (extra === undefined ? '' : '   → ' + JSON.stringify(extra))) }
}
/* do two rectangle lists describe the same area (px tolerance)? */
function sameRects(got, want, tol = 4) {
  if (got.length !== want.length) return false;
  const norm = list => list.map(r => [r[0], r[1], r[2], r[3]]).sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
  const g = norm(got), w = norm(want);
  return g.every((r, i) => r.every((v, k) => Math.abs(v - w[i][k]) <= tol));
}
async function dragOver(live, txt, occ, ctrl) {
  const d = await live.ev('window.__q.dot(' + JSON.stringify(txt) + ',' + (occ || 0) + ')');
  if (d && d.err) throw new Error('dragOver(' + txt + '): ' + d.err);
  await live.ev('window.__lastSel=""');   /* a stale capture from an earlier gesture must never pass as this one's */
  await live.drag(d, d, { ctrl: !!ctrl });
  const sel = await live.ev('window.__q.lastSel()');
  return { d, sel };
}
/* Ctrl+drag = the highlight gesture: paints #hlLayer and writes one hl row */
async function paint(live, txt, occ, tag) {
  const r = await dragOver(live, txt, occ, true);
  log('   · ctrl-drag ' + JSON.stringify(txt) + (occ ? ' #' + occ : '') + ' → sel=' + JSON.stringify(r.sel) + ' lines=' + r.d.lines + ' rect=' + JSON.stringify(r.d.rect));
  if (tag) check(tag + ': the Ctrl gesture selected exactly the phrase', r.sel === txt, { got: r.sel, want: txt });
  return r;
}
/* plain drag = the note/recording gesture: opens the seven-button popup */
async function selectPhrase(live, txt, occ, tag) {
  const r = await dragOver(live, txt, occ, false);
  log('   · drag ' + JSON.stringify(txt) + (occ ? ' #' + occ : '') + ' → sel=' + JSON.stringify(r.sel));
  if (tag) check(tag + ': the plain drag selected exactly the phrase', r.sel === txt, { got: r.sel, want: txt });
  await live.wait('!!document.querySelector(".pop")', 4000, 'the selection popup');
  return r;
}
const api = (site, q) => fetch('http://127.0.0.1:' + site.port + '/__bp?' + q).then(r => r.json());

/* ---------------------------------------------------------------------------------------------
   7. SCENARIO B-F2 — does a painted highlight PERSIST the way a note/recording does?
   --------------------------------------------------------------------------------------------- */
async function scenBF2(live, site) {
  log('\n================ B-F2 · HIGHLIGHT PERMANENCE (painted #hlLayer) ================');
  const H = "I'm Marina.";
  await api(site, 'reset=1');
  await live.nav();
  await live.dump('page loaded', true);

  log('\n step 1 — Ctrl+drag a phrase: it must be painted AND written as one "hl" row');
  await paint(live, H, 0, 'paint');
  const want = await live.ev('window.__q.rectsOf(' + JSON.stringify(H) + ',0)');
  let s = await live.dump('after the Ctrl+drag', true);
  check('the phrase is painted on #hlLayer', s.hlr.length >= 1, s.hlr);
  check('the painted rectangle sits on the text it covers', sameRects(s.hlr.map(r => r.doc), want), { painted: s.hlr.map(r => r.doc), text: want });
  check('exactly one server row, type "hl"', bp.rows.length === 1 && bp.rows[0].type === 'hl', bp.rows);
  check('the row carries anchor + {color,b,o}',
    bp.rows.length === 1 && bp.rows[0].anchor === H && /"color":"yellow"/.test(bp.rows[0].data) && /"b":\d+/.test(bp.rows[0].data) && /"o":\d+/.test(bp.rows[0].data),
    bp.rows[0] && { anchor: bp.rows[0].anchor, data: bp.rows[0].data });
  check('the palette opened above the fresh highlight', !!(s.popup && /hlpal/.test(s.popup.cls)), s.popup);
  await live.key('Escape', 'Escape');
  await live.shot('bf2-1-created', box(s.hlr[0] ? s.hlr[0].doc : [0, 0, 400, 200]));

  log('\n step 2 — two 3s polls later the highlight must still be exactly where it was');
  await sleep(6500);
  s = await live.dump('after ~2 polls', true);
  check('still painted after the polls', s.hlr.length >= 1, s.hlr);
  check('geometry unchanged across the polls', sameRects(s.hlr.map(r => r.doc), want, 6), { now: s.hlr.map(r => r.doc), was: want });
  check('still exactly one server row (no duplicate write)', bp.rows.length === 1, bp.rows.map(r => r.id));
  check('the local record kept its id and colour', s.hlList.length === 1 && s.hlList[0].color === 'yellow', s.hlList);

  log('\n step 3 — RELOAD: the row is on the server, so the highlight must come back by itself');
  await live.reload();
  await live.wait('document.querySelectorAll("#hlLayer .hlr").length>0', 6000, 'the highlight restored after a reload');
  s = await live.dump('after a reload', true);
  check('restored after a reload', s.hlr.length >= 1, s.hlr);
  const want2 = await live.ev('window.__q.rectsOf(' + JSON.stringify(H) + ',0)');
  check('restored on the very same characters', sameRects(s.hlr.map(r => r.doc), want2), { painted: s.hlr.map(r => r.doc), text: want2 });
  check('restored with its colour', s.hlList.length === 1 && s.hlList[0].color === 'yellow', s.hlList);
  await live.shot('bf2-2-after-reload', box(want2[0] || [0, 0, 400, 200]));
}

function box(doc) {                     /* a small screenshot window around a document rect */
  return [Math.max(0, doc[0] - 40), Math.max(0, doc[1] - 40), 420, 160];
}

/* B-F2 steps 4-5: the same string twice (block+offset must win) and a write slower than the
   12s pending window (the row is in flight for longer than the grace window protects it). */
async function scenBF2b(live, site) {
  log('\n step 4 — the SAME string twice in the page: block+offset must win over the text alone');
  const T2 = 'Are you from São Paulo?';
  await api(site, 'reset=1');
  await live.nav();
  await paint(live, T2, 0);
  await paint(live, T2, 1);
  const wantA = await live.ev('window.__q.rectsOf(' + JSON.stringify(T2) + ',0)');
  const wantB = await live.ev('window.__q.rectsOf(' + JSON.stringify(T2) + ',1)');
  let s = await live.dump('two identical strings highlighted', true);
  check('two rows stored for the same anchor text', bp.rows.length === 2 && bp.rows.every(r => r.anchor === T2), bp.rows.map(r => r.anchor));
  check('two rectangles painted, one per occurrence', s.hlr.length === 2, s.hlr);
  await live.reload();
  await live.wait('document.querySelectorAll("#hlLayer .hlr").length>1', 8000, 'both highlights restored');
  s = await live.dump('after a reload', true);
  const got = s.hlr.map(r => r.doc).sort((a, b) => a[1] - b[1]);
  check('each occurrence restored at ITS OWN place (block+offset wins)',
    got.length === 2 && sameRects([got[0]], [wantA[0]]) && sameRects([got[1]], [wantB[0]]),
    { got, wantA, wantB });
  await live.shot('bf2-3-two-identical', box(wantA[0] || [0, 0, 400, 200]));

  log('\n step 5 — a write SLOWER than the 12s pending window (in flight longer than the grace window)');
  await api(site, 'reset=1&delay=14000');
  await live.nav();
  const H3 = 'Nice to meet you.';
  await paint(live, H3, 0);
  const t0 = Date.now();
  let empty = 0, samples = 0, minN = 99;
  while (Date.now() - t0 < 20000) {
    const n = await live.ev('document.querySelectorAll("#hlLayer .hlr").length');
    samples++; minN = Math.min(minN, n);
    if (n === 0) empty++;
    await sleep(280);
  }
  s = await live.dump('after a 14s write finally landed', true);
  check('the highlight never vanished while its own write was still in flight', empty === 0,
    { samples, samplesWithNothingPainted: empty, minPainted: minN, rows: bp.rows.length });
  check('it is still painted once the row landed', s.hlr.length >= 1, s.hlr);
  check('the row really is on the server now', bp.rows.length === 1 && bp.rows[0].anchor === H3, bp.rows.map(r => r.anchor));
  await api(site, 'delay=0');
}

/* (the end of startSite and GATE/h now sit in their proper sections above) */

/* ---------------------------------------------------------------------------------------------
   7b. NOTE / RECORDING GESTURES + THE THREE INVARIANTS THE OWNER REPORTS ON
   --------------------------------------------------------------------------------------------- */
const Pos = (t, o) => ({ t: t, o: o || 0 });        /* a phrase + which occurrence in the page */
const spanOf = (live, x) => live.ev('window.__q.spanOf(' + JSON.stringify(x.t) + ',' + x.o + ')');
const rectsOf = (live, x) => live.ev('window.__q.rectsOf(' + JSON.stringify(x.t) + ',' + x.o + ')');
const marksNow = live => live.ev('window.__q.marks()');
const piecesOf = (live, a) => live.ev('window.__q.pieces(' + JSON.stringify(a) + ')');
const flagged = (ms, f) => ms.filter(m => String(m.cls || '').indexOf(f) >= 0);
const selNow = live => live.ev('(function(){var s=getSelection();return s?s.toString():""})()');
const hits = (live, ms, want) => live.ev('window.__q.rectsHit(' + JSON.stringify(ms.map(m => m.doc)) + ',' + JSON.stringify(want) + ')');
/* a REAL drag from the START of `from` to the END of `to`: ONE contiguous selection that may cross
   inline elements (<b>/<i>), which is exactly what makes a mark cover several child nodes — and only
   a multi-node mark can be split by a later save (engine1 nbWrap/nbSplitEl). This is the gesture the
   owner makes when a new note/recording "overlaps a previous one". */
async function dragSpan(live, from, to) {
  const d = await live.ev('window.__q.dot2(' + JSON.stringify(from.t) + ',' + from.o + ',' + JSON.stringify(to.t) + ',' + to.o + ')');
  if (!d || d.err) throw new Error('dragSpan(' + from.t + ' → ' + to.t + '): ' + ((d && d.err) || 'no dots'));
  await live.ev('window.__lastSel=""');
  await live.drag(d.a, d.b);
  return { a: d.a, b: d.b, sel: await live.ev('window.__q.lastSel()') };
}
async function selectSpan(live, from, to, tag) {
  const r = await dragSpan(live, from, to);
  log('   · drag ' + JSON.stringify(from.t) + ' → ' + JSON.stringify(to.t) + '  sel=' + JSON.stringify(r.sel));
  if (tag) check(tag, !!r.sel && r.sel.length >= 3, { sel: r.sel });
  await live.wait('!!document.querySelector(".pop")', 4000, 'the selection popup');
  return r;
}
/* 📝 Add/Edit Note → type → 💾 Save (the popup must be open from a selection gesture) */
async function dismiss(live) {              /* dismiss the popup the way a user does: a click outside it */
  const p = await live.ev('window.__q.freeSpot()');
  if (p) await live.click(p[0], p[1]);
  if (!(await live.ev('!document.querySelector(".pop")'))) await live.ev('closePop()');
  await sleep(120);
}
async function saveNote(live, text) {
  await live.wait('!!document.querySelector("#pN")', 3000, '📝 Add/Edit Note');
  await live.clickSel('#pN');
  await live.wait('!!document.querySelector("#nt")', 3000, 'the note editor');
  await live.typeInto('#nt', text);
  await live.clickSel('#pS');
  /* 💾 Save LEAVES the popup open ON PURPOSE (FUNCTION.md: Save drops the editor state, the seven
     buttons stay, the saved note shows above them) — so the proof a save went through is the editor
     DISAPPEARING, never the popup closing. The gesture then dismisses the popup like a user would. */
  await live.wait('!document.querySelector("#nt")', 4000, 'the editor closing on Save');
  await dismiss(live);
  await sleep(300);
}
async function makeNote(live, x, text) {           /* select a phrase, then save a note on it */
  await selectPhrase(live, x.t, x.o);
  await saveNote(live, text);
}
/* ⏺ Record: the fake mic goes loud then silent, so the page's own detector finishes the clip in ~3s
   and the mark is painted by the SAVE (never by the click). */
async function makeRec(live, x) {
  await selectPhrase(live, x.t, x.o);
  await live.clickSel('#pR');
  await live.wait('!!document.querySelector("mark.nb.has-rec")', 16000, 'the recording’s underline');
  await sleep(300);
  await dismiss(live);
}
/* THE TWO INVARIANTS the owner's reports reduce to:
     • pieces  — an anchor painted by MORE THAN ONE mark element (= what he sees as one note/recording
                 split into two underlines by a later, overlapping save);
     • fragment— a mark whose painted text is no longer its own anchor text (= the underline/wash left
                 covering only PART of the phrase the row is stored for: the "cut" the owner sees). */
function invariants(ms) {
  const by = {};
  /* ONE ITEM PER (anchor text, occurrence): the anchor text IDENTIFIES the item and the stored place
     (mark.nb data-b/data-o, owner spec 2026-10-13) only tells two identical strings apart — so a note
     in the top box and a recording on the same words in the dialogue are two items, NOT "one anchor
     split in two". Pieces of a REAL split still share the place of the mark they were cut from
     (nbSplitEl clones the attributes), and the `cut` half below catches their partial text anyway. */
  const key = m => m.a + '\u0000' + (m.b == null ? '' : m.b) + ':' + (m.o == null ? '' : m.o);
  ms.forEach(m => { const k = key(m); (by[k] = by[k] || []).push(m) });
  const split = Object.keys(by).filter(k => by[k].length > 1).map(k => by[k][0].a + ' ×' + by[k].length);
  const cut = ms.filter(m => m.txt !== m.a).map(m => ({ a: m.a, painted: m.txt }));
  return { n: ms.length, by, split, cut };
}
function checkInvariants(ms, tag) {
  const v = invariants(ms);
  check(tag + ': every anchor is painted by exactly ONE mark', v.split.length === 0, v.split);
  check(tag + ': every mark still covers exactly its own anchor text', v.cut.length === 0, v.cut);
  return v;
}
const rowsOf = type => bp.rows.filter(r => r.type === type);
/* real DOM click in the middle of a mark piece (viewport coords, scrolled into view first) */
async function clickPiece(live, a, i) {
  const r = await live.ev('window.__q.markRect(' + JSON.stringify(a) + ',' + (i || 0) + ')');
  if (!r) { check('the mark is on the page to click', false, a); return null }
  await live.click(r[0] + r[2] / 2, r[1] + r[3] / 2);
  return r;
}

/* ---------------------------------------------------------------------------------------------
   9. SCENARIO B-F4 — a later save that OVERLAPS an earlier mark must never cut or split it
      owner: "when a note overlaps a previous one the previous one gets cut"; "the recording gets
      split in two"; "after a reload it is still cut"
   --------------------------------------------------------------------------------------------- */
const P1a = "My name's Daniel.", P1b = "Meu nome é Daniel.";   /* the pair on line 31 of lesson 1 */
const P2b = "I'm from Brazil.";                                /* the tail the note reaches (line 32) */
/* ⏺ Record over a multi-node span (a phrase PAIR: <b>…</b> = <i>…</i>) */
async function recSpan(live, from, to) {
  await selectSpan(live, from, to, 'the recording’s selection was made');
  await live.clickSel('#pR');
  await live.wait('!!document.querySelector("mark.nb.has-rec")', 16000, 'the recording’s underline');
  await sleep(300);
  await dismiss(live);
}
/* 📝 note over a multi-node span */
async function noteSpan(live, from, to, text) {
  await selectSpan(live, from, to, 'the note’s selection was made');
  await saveNote(live, text);
}
async function scenBF4(live, site) {
  log('\n================ B-F4 · OVERLAPPING SAVES (cut / split marks) ================');

  log('\n step 1 — a recording across a phrase PAIR (one mark over <b>…</b> = <i>…</i>)');
  await api(site, 'reset=1');
  await live.nav();
  await recSpan(live, Pos(P1a, 0), Pos(P1b, 0));
  let ms = await marksNow(live);
  let s = await live.dump('the recording, before any overlap', true);
  check('the recording is ONE mark covering the whole pair',
    ms.length === 1 && !!ms[0] && ms[0].txt.indexOf(P1a) === 0 && ms[0].txt.indexOf(P1b) > 0, ms);
  check('ONE rec row, anchored to exactly what the mark paints',
    rowsOf('rec').length === 1 && !!ms[0] && rowsOf('rec')[0].anchor === ms[0].a, rowsOf('rec'));
  log('   · the recording row is anchored to ' + JSON.stringify(ms[0] && ms[0].a));
  checkInvariants(ms, 'recording only');

  log('\n step 2 — THE GESTURE: a NOTE starting inside the recording and ending on the NEXT pair');
  await noteSpan(live, Pos(P1b, 0), Pos(P2b, 0), 'nota que cruza');
  /* WHY the note may not be painted at all: a stored anchor is re-found ONLY by its text (findRange),
     so measure the anchor bytes against the page text and ask the engine itself. Read-only. */
  const why = await live.ev('(function(){var t=document.querySelector("p.pt").textContent;var i=t.indexOf("Meu nome");' +
    'var row=(layer.filter(function(r){return r.type==="note"})[0]||{});var a=String(row.anchor||"");' +
    'return{a:a,found:!!findRange(a),marks:nbMarks(a).length,slice:i<0?null:t.slice(i-2,i+40)}})()');
  log('   · the note row anchor is ' + JSON.stringify(why.a));
  log('   · the page text around it is ' + JSON.stringify(why.slice));
  log('   · findRange(anchor)=' + why.found + '   nbMarks(anchor)=' + why.marks);
  ms = await marksNow(live);
  s = await live.dump('after the overlapping note', true);
  const v2 = invariants(ms);
  check('the earlier recording is still ONE mark (not split into pieces)', v2.split.length === 0,
    { split: v2.split, marks: ms.map(m => ({ a: m.a, txt: m.txt })) });
  check('...still covering exactly its own anchor text (not cut)', v2.cut.length === 0, v2.cut);
  check('the note itself is one mark covering its own anchor', rowsOf('note').length === 1 &&
    ms.some(m => m.a === rowsOf('note')[0].anchor && m.txt === m.a),
    { note: rowsOf('note'), marks: ms.map(m => ({ a: m.a, txt: m.txt })) });
  check('exactly 2 rows on the server (1 rec + 1 note)', bp.rows.length === 2, bp.rows.map(r => r.type + ':' + r.anchor));
  log('   · marks now: ' + JSON.stringify(ms.map(m => ({ a: m.a, txt: m.txt, cls: m.cls }))));
  checkInvariants(ms, 'after the crossing note');

  log('\n step 3 — RELOAD: the cut/split must not survive (the rows are one anchor each)');
  await live.reload();
  await live.wait('!!document.querySelector("mark.nb")', 9000, 'the marks restored after a reload');
  await sleep(800);
  ms = await marksNow(live);
  const v3 = invariants(ms);
  check('after a reload the recording is STILL one whole mark', v3.split.length === 0 && v3.cut.length === 0, { split: v3.split, cut: v3.cut });
  check('...and both rows are still there, one anchor each',
    rowsOf('rec').length === 1 && rowsOf('note').length === 1, bp.rows.map(r => r.type + ':' + r.anchor));
  checkInvariants(ms, 'crossing note reload');

  log('\n step 4 — CONTROL: two DISJOINT pairs, saved one after the other (no overlap → no cut)');
  const SP = 'Are you from São Paulo?';        /* the third pair of the same <p> (occurrence 0) */
  await api(site, 'reset=1');
  await live.nav();
  await makeNote(live, Pos(P1a, 0), 'primeira frase');
  await makeNote(live, Pos(SP, 0), 'segunda frase');
  ms = await marksNow(live);
  check('two notes, two anchors, two whole marks', rowsOf('note').length === 2 && ms.length === 2,
    { rows: rowsOf('note').map(r => r.anchor), marks: ms.map(m => m.txt) });
  checkInvariants(ms, 'two disjoint notes');

  log('\n step 5 — CONTROL: a note strictly INSIDE a recording (nested, nothing crossed)');
  await api(site, 'reset=1');
  await live.nav();
  await recSpan(live, Pos(P1a, 0), Pos(P1b, 0));
  await makeNote(live, Pos(P1b, 0), 'nota dentro');
  ms = await marksNow(live);
  check('the recording is still ONE whole mark (the note sits nested inside it)',
    ms.length === 2 && invariants(ms).split.length === 0 && invariants(ms).cut.length === 0,
    { marks: ms.map(m => ({ a: m.a, txt: m.txt, cls: m.cls })) });
  check('1 rec row + 1 note row', rowsOf('rec').length === 1 && rowsOf('note').length === 1, bp.rows.map(r => r.type + ':' + r.anchor));
  checkInvariants(ms, 'note inside a recording');

  log('\n step 6 — CONTROL: widening a note over itself must RE-ANCHOR its row (never duplicate)');
  const MA = "I'm Marina.";                    /* the first pair of the same <p> (occurrence 0) */
  await api(site, 'reset=1');
  await live.nav();
  await makeNote(live, Pos(P1b, 0), 'nota curta');
  const before = rowsOf('note').map(r => r.anchor);
  await noteSpan(live, Pos(MA, 0), Pos(P1b, 0), 'nota mais longa');
  await sleep(600);
  ms = await marksNow(live);
  const rowsNow = rowsOf('note').map(r => r.anchor);
  check('still ONE note row (re-anchored, not duplicated)', rowsNow.length === 1, { before: before, now: rowsNow });
  check('the row now covers the WIDER span',
    rowsNow.length === 1 && ms.some(m => m.a === rowsNow[0] && m.txt === m.a && m.txt.indexOf(MA) === 0),
    { now: rowsNow, marks: ms.map(m => ({ a: m.a, txt: m.txt })) });
  checkInvariants(ms, 'note expansion');
}
/* ---------------------------------------------------------------------------------------------
   10. SCENARIO B-F3 — the OCCURRENCE a note/recording belongs to, and its presentation
      owner: "notes/recordings are not anchored to the right place"; "selecting part of the phrase
      does not present the note"; "after a reload the recording lands on another phrase"
   --------------------------------------------------------------------------------------------- */
const D1 = "My name's Daniel.";        /* phrase list (0) · dialogue (1) · quiz label (2) */
const SUB = "name's Daniel.";          /* a PIECE of that phrase (same occurrence 0) */
async function scenBF3(live, site) {
  log('\n================ B-F3 · NOTES/RECORDINGS ANCHORING + PRESENTATION ================');

  log('\n step 1 — a note on the phrase: stored, painted ONCE, covering exactly its own text');
  await api(site, 'reset=1');
  await live.nav();
  await makeNote(live, Pos(D1, 0), 'nota do Daniel');
  let ms = await marksNow(live);
  let s = await live.dump('after the note', true);
  check('one mark on the annotated phrase', ms.length === 1, ms);
  check('the mark wears has-note', flagged(ms, 'has-note').length === 1, ms);
  check('the mark covers exactly its anchor text', !!ms[0] && ms[0].txt === D1, ms[0]);
  check('ONE note row, anchored to the phrase', rowsOf('note').length === 1 && rowsOf('note')[0].anchor === D1, rowsOf('note'));
  check('the row carries the typed text', JSON.stringify(rowsOf('note')).indexOf('nota do Daniel') >= 0, rowsOf('note'));
  checkInvariants(ms, 'note');

  log('\n step 2 — selecting only PART of the annotated phrase must PRESENT its note');
  await selectPhrase(live, SUB, 0);
  s = await live.dump('popup from a partial selection', false);
  check('the popup presents the saved note', !!(s.popup && String(s.popup.note || '').indexOf('nota do Daniel') >= 0), s.popup);
  check('📝 Delete is offered for it', !!(s.popup && /(^|,)pD($|,)/.test(s.popup.buttons)), s.popup && s.popup.buttons);
  check('💾 Save is greyed while not editing', !!(s.popup && /(^|,)pS#($|,)/.test(s.popup.buttons)), s.popup && s.popup.buttons);
  check('the mere selection painted nothing', (await marksNow(live)).length === 1, await marksNow(live));
  await live.key('Escape', 'Escape');

  log('\n step 3 — clicking the mark must present the same note');
  const r3 = await clickPiece(live, D1);
  s = await live.dump('popup from a click on the mark', false);
  check('the click opened the popup on the mark', !!(r3 && s.popup && /(^|,)pN($|,)/.test(s.popup.buttons)), s.popup);
  check('...presenting the same note', !!(s.popup && String(s.popup.note || '').indexOf('nota do Daniel') >= 0), s.popup && s.popup.note);
  checkInvariants(await marksNow(live), 'after the click');
  await live.key('Escape', 'Escape');

  log('\n step 4 — RELOAD (note on the FIRST occurrence): control — it must come back where it was');
  await live.reload();
  await live.wait('!!document.querySelector("mark.nb.has-note")', 9000, 'the note restored after a reload');
  await sleep(700);
  ms = await marksNow(live);
  let w0 = await rectsOf(live, Pos(D1, 0)), w1 = await rectsOf(live, Pos(D1, 1));
  check('the note is back, on the occurrence it was saved for',
    ms.length === 1 && (await hits(live, flagged(ms, 'has-note'), w0)) && !(await hits(live, flagged(ms, 'has-note'), w1)),
    { ms, w0, w1 });
  checkInvariants(ms, 'reload (first occurrence)');

  log('\n step 5 — the SAME phrase on a LATER occurrence: the note must stay on ITS OWN occurrence');
  await api(site, 'reset=1');
  await live.nav();
  await makeNote(live, Pos(D1, 1), 'nota no diálogo');
  ms = await marksNow(live);
  w0 = await rectsOf(live, Pos(D1, 0)); w1 = await rectsOf(live, Pos(D1, 1));
  check('saved live on the occurrence that was selected',
    (await hits(live, flagged(ms, 'has-note'), w1)) && !(await hits(live, flagged(ms, 'has-note'), w0)), { ms, w0, w1 });
  log('   · stored note row: ' + JSON.stringify(rowsOf('note').map(r => ({ id: r.id, anchor: r.anchor, data: r.data }))));
  await live.reload();
  await live.wait('!!document.querySelector("mark.nb.has-note")', 9000, 'the note restored after a reload');
  await sleep(700);
  ms = await marksNow(live);
  check('after a reload it is STILL on occurrence 1 (the one that was annotated)',
    ms.length === 1 && (await hits(live, flagged(ms, 'has-note'), w1)) && !(await hits(live, flagged(ms, 'has-note'), w0)),
    { ms, w0, w1 });
  checkInvariants(ms, 'reload (later occurrence)');

  log('\n step 6 — a RECORDING on that same later occurrence must not jump on reload');
  await api(site, 'reset=1');
  await live.nav();
  await makeRec(live, Pos(D1, 1));
  ms = await marksNow(live);
  check('the live recording underline is on the selected occurrence',
    (await hits(live, flagged(ms, 'has-rec'), w1)) && !(await hits(live, flagged(ms, 'has-rec'), w0)), { ms, w0, w1 });
  await live.reload();
  await live.wait('!!document.querySelector("mark.nb.has-rec")', 9000, 'the recording restored after a reload');
  await sleep(700);
  ms = await marksNow(live);
  check('after a reload the recording is STILL on occurrence 1',
    ms.length === 1 && (await hits(live, flagged(ms, 'has-rec'), w1)) && !(await hits(live, flagged(ms, 'has-rec'), w0)),
    { ms, w0, w1 });
  checkInvariants(ms, 'recording reload');

  log('\n step 7 — a note on occurrence 0 + a recording on occurrence 1: two rows, one phrase each');
  await api(site, 'reset=1');
  await live.nav();
  await makeNote(live, Pos(D1, 0), 'nota do topo');
  await makeRec(live, Pos(D1, 1));
  ms = await marksNow(live);
  await live.dump('two items on two occurrences', true);
  check('two rows stored (1 note + 1 rec)', rowsOf('note').length === 1 && rowsOf('rec').length === 1, bp.rows.map(r => r.type + ':' + r.anchor));
  check('the note is painted on occurrence 0 only', (await hits(live, flagged(ms, 'has-note'), w0)) && !(await hits(live, flagged(ms, 'has-note'), w1)), ms);
  check('the recording underline is on occurrence 1 only',
    (await hits(live, flagged(ms, 'has-rec'), w1)) && !(await hits(live, flagged(ms, 'has-rec'), w0)), ms);
  await live.reload();
  await live.wait('!!document.querySelector("mark.nb")', 9000, 'the two items restored after a reload');
  await sleep(700);
  ms = await marksNow(live);
  check('after a reload each item is still on its own occurrence',
    (await hits(live, flagged(ms, 'has-note'), w0)) && (await hits(live, flagged(ms, 'has-rec'), w1)) && !(await hits(live, flagged(ms, 'has-rec'), w0)),
    { ms, w0, w1 });
  checkInvariants(ms, 'two occurrences reload');

  log('\n step 8 — note + recording on the SAME occurrence: ONE mark wearing both flags');
  await api(site, 'reset=1');
  await live.nav();
  await makeRec(live, Pos(D1, 1));
  await makeNote(live, Pos(D1, 1), 'nota junto');
  ms = await marksNow(live);
  await live.dump('note + recording on the same occurrence', true);
  check('1 recording row + 1 note row (no duplicates)', rowsOf('rec').length === 1 && rowsOf('note').length === 1, bp.rows.map(r => r.type));
  check('exactly ONE mark on the phrase', ms.length === 1, ms);
  check('the one mark wears both flags', !!ms[0] && /has-rec/.test(ms[0].cls) && /has-note/.test(ms[0].cls), ms[0]);
  checkInvariants(ms, 'combined item');
  await live.reload();
  await live.wait('!!document.querySelector("mark.nb.has-note")', 9000, 'both items restored');
  await sleep(700);
  ms = await marksNow(live);
  check('after a reload both flags sit on the one mark, on the same occurrence',
    ms.length === 1 && /has-rec/.test(ms[0].cls) && /has-note/.test(ms[0].cls) && (await hits(live, ms, await rectsOf(live, Pos(D1, 1)))),
    ms);
  await clickPiece(live, D1);
  s = await live.dump('click on the phrase holding both items', false);
  check('the click presents the note AND offers the recording',
    !!(s.popup && String(s.popup.note || '').indexOf('nota junto') >= 0 && /(^|,)pP($|,)/.test(s.popup.buttons) && /(^|,)pR\*/.test(s.popup.buttons)),
    s.popup);
  await live.key('Escape', 'Escape');
  checkInvariants(ms, 'combined item reload');
}

/* ---------------------------------------------------------------------------------------------
   11. SCENARIO GEO — the ruler and the painted layer AWAY FROM THE TOP OF THE PAGE
   Everything B-F2/B-F3 assume about geometry is exercised here where it can actually go wrong:
   a phrase far down the page (the drag has to scroll first), a scroll away and back, a reload
   from scroll 0 while the row points deep into the document, and the block-aware ruler.
   --------------------------------------------------------------------------------------------- */
async function scenGeo(live, site) {
  log('\n================ GEO · ruler + #hlLayer geometry off-screen ================');
  const DEEP = "I'm from Curitiba.";            /* the dialogue line (occurrence 0), far down the page */
  await api(site, 'reset=1');
  await live.nav();
  await live.wait('document.body.scrollHeight > window.innerHeight*2', 8000, 'a page taller than the window');

  log('\n step 1 — a Ctrl+drag on a phrase FAR DOWN the page (the gesture must scroll first)');
  const sc0 = await live.ev('window.scrollY');
  await paint(live, DEEP, 0, 'the deep phrase');
  await sleep(600);
  let s = await live.dump('painted deep in the page', true);
  const p0 = await rectsOf(live, Pos(DEEP, 0));
  check('the gesture scrolled the page to reach the phrase', p0.length > 0 && p0[0][1] > 900, { scrollY: sc0, firstLineTop: p0[0] && p0[0][1] });
  check('the rectangle is painted exactly on the phrase (document coords)', sameRects(s.hlr.map(r => r.doc), p0), { painted: s.hlr.map(r => r.doc), text: p0 });
  const ruler = await spanOf(live, Pos(DEEP, 0));
  log('   · the engine’s own ruler for that phrase: ' + JSON.stringify(ruler));
  check('the stored row carries the engine’s own (b,start,end)',
    !!ruler && !ruler.err && s.hlList.length === 1 && s.hlList[0].b === ruler.b && s.hlList[0].start === ruler.start && s.hlList[0].end === ruler.end,
    { row: s.hlList, ruler: ruler });
  check('exactly one row on the server', bp.rows.length === 1 && bp.rows[0].type === 'hl', bp.rows.map(r => r.type + ':' + r.anchor));
  await live.shot('geo-1-deep', box(p0[0] || [0, 0, 400, 200]));

  log('\n step 2 — scroll to the top and back: the painting must stay on the same characters');
  await live.ev('window.scrollTo(0,0)');
  await sleep(600);
  await live.ev('window.scrollTo(0,document.body.scrollHeight)');
  await sleep(600);
  s = await live.dump('after scrolling away and back', true);
  check('still one rectangle, still over the very same text (doc coords)',
    sameRects(s.hlr.map(r => r.doc), p0, 6), { now: s.hlr.map(r => r.doc), was: p0 });
  check('the scroll did not write a second row', bp.rows.length === 1, bp.rows.map(r => r.id));

  log('\n step 3 — RELOAD from the very top: a row pointing deep into the document must come back');
  await live.ev('window.scrollTo(0,0)');
  await live.reload();
  let back = true;
  try { await live.wait('document.querySelectorAll("#hlLayer .hlr").length>0', 9000, 'the deep highlight restored') }
  catch (e) { back = false }
  s = await live.dump('after a reload from scroll 0', true);
  const p1 = await rectsOf(live, Pos(DEEP, 0));
  check('the deep highlight was restored at all (no rectangle → hlMake gave up)', back, { hlr: s.hlr.length, hlList: s.hlList.length, wait: 'timed out' });
  check('the row was NOT dropped by the restore (layer + hlList + sheet)', s.layer.length === 1 && s.hlList.length === 1 && bp.rows.length === 1,
    { layer: s.layer.length, hlList: s.hlList.length, rows: bp.rows.length });
  check('restored on the same characters', sameRects(s.hlr.map(r => r.doc), p1, 6), { painted: s.hlr.map(r => r.doc), text: p1 });
  check('the restored row still carries the same (b,start,end)',
    !!ruler && !ruler.err && s.hlList.length === 1 && s.hlList[0].b === ruler.b && s.hlList[0].start === ruler.start && s.hlList[0].end === ruler.end,
    { row: s.hlList, ruler: ruler });
  await live.shot('geo-2-restored', box(p1[0] || [0, 0, 400, 200]));

  log('\n step 4 — the ruler is BLOCK-aware: the same string in another block has its own place');
  const r0 = await spanOf(live, Pos(DEEP, 0)), r1 = await spanOf(live, Pos(DEEP, 1));
  log('   · occurrence 0 ' + JSON.stringify(r0) + '   occurrence 1 ' + JSON.stringify(r1));
  check('both occurrences resolve, in different blocks (or at least different offsets)',
    !!r0 && !!r1 && !r0.err && !r1.err && (r0.b !== r1.b || r0.start !== r1.start), { r0: r0, r1: r1 });
}

/* ---------------------------------------------------------------------------------------------
   11b. SCENARIO DIAG — is the harness itself honest? (real input → real selection)
   Before trusting any scenario, prove that CDP mouse input actually reaches the page and that a
   real drag selects real text. Counts the page's own mousedown/mousemove/mouseup (a page listener
   that the engine knows nothing about), then tries the same gesture three ways: a plain drag, a
   drag while Ctrl is held as a real key, and a Ctrl-modified drag. Whichever works is the gesture
   the scenarios must use — and if NONE works, the harness is lying about every gesture.
   --------------------------------------------------------------------------------------------- */
async function scenDiag(live, site) {
  log('\n================ DIAG · does real input reach the page? ================');
  const T = "My name's Daniel.";
  const COUNT = 'window.__ct={mousemove:0,mousedown:0,mouseup:0,keydown:0};' +
    'Object.keys(window.__ct).forEach(function(t){document.addEventListener(t,function(){window.__ct[t]++},true)});1';
  /* does anything call preventDefault on the gesture? a WINDOW bubble listener runs after every
     document listener, so __dp holds the final flag; __ss counts selectstart (the event Chrome fires
     right before it starts a native selection — a capture listener here is the last word on it). */
  const DPSEEN = 'window.__dp={};window.__ss=0;' +
    'window.addEventListener("mousedown",function(e){window.__dp.md=e.defaultPrevented},false);' +
    'window.addEventListener("mouseup",function(e){window.__dp.mu=e.defaultPrevented},false);' +
    'document.addEventListener("selectstart",function(e){window.__ss++;window.__dp.ss=e.defaultPrevented},true);1';
  await api(site, 'reset=1');
  await live.nav();
  log('   · hasFocus=' + await live.ev('document.hasFocus()') + '  innerHeight=' + await live.ev('window.innerHeight') +
    '  dpr=' + await live.ev('window.devicePixelRatio'));
  await live.ev(COUNT);
  await live.ev(DPSEEN);
  let d = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
  log('   · dot = ' + JSON.stringify(d));
  log('   · element at the drag start = ' + await live.ev(
    '(function(){var e=document.elementFromPoint(' + d.sx + ',' + d.sy + ');if(!e)return "nothing";' +
    'var c=getComputedStyle(e);return e.tagName+"."+String(e.className).slice(0,24)+" pe="+c.pointerEvents+" us="+c.userSelect+" <"+e.textContent.slice(0,30)})()'));
  log('   · body user-select = ' + await live.ev('getComputedStyle(document.body).userSelect'));

  log('\n (1) a PLAIN drag across the phrase');
  d = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
  await live.drag(d, d, { ctrl: false });
  log('   · events the page saw: ' + JSON.stringify(await live.ev('window.__ct')));
  log('   · preventDefault seen by the page (window bubble = last word): ' + JSON.stringify(await live.ev('window.__dp')) +
    '  selectstart fired ' + await live.ev('window.__ss') + '×');
  log('   · sel=' + JSON.stringify(await selNow(live)) + '  popup=' + JSON.stringify(await live.ev('!!document.querySelector(".pop")')) +
    '  marks=' + JSON.stringify((await marksNow(live)).length));
  await sleep(500);
  log('   · +500ms: popup=' + JSON.stringify(await live.ev('!!document.querySelector(".pop")')) +
    '  btns=' + JSON.stringify(await live.ev('(document.querySelector(".pop")||{textContent:null}).textContent')) +
    '  toast=' + JSON.stringify(await live.ev('(document.getElementById("toast")||{}).textContent||null')));

  log('\n (2) the same drag while Ctrl is held as a REAL key (no modifier flag on the mouse)');
  await api(site, 'reset=1'); await live.nav(); await live.ev(COUNT);
  await live.key('Control', 'ControlLeft', 2);
  d = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
  await live.drag(d, d, { ctrl: false });
  log('   · sel=' + JSON.stringify(await selNow(live)) + '  hlr=' + JSON.stringify(await live.ev('document.querySelectorAll("#hlLayer .hlr").length')));
  await live.key('Control', 'ControlLeft', 0);
  await sleep(600);
  log('   · +600ms: hlr=' + JSON.stringify(await live.ev('document.querySelectorAll("#hlLayer .hlr").length')) +
    '  rows=' + bp.rows.length + '  events=' + JSON.stringify(await live.ev('window.__ct')));

  log('\n (3) the modifier-flag drag (the gesture the scenarios use)');
  await api(site, 'reset=1'); await live.nav(); await live.ev(COUNT);
  d = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
  await live.drag(d, d, { ctrl: true });
  log('   · sel=' + JSON.stringify(await selNow(live)) + '  hlr=' + JSON.stringify(await live.ev('document.querySelectorAll("#hlLayer .hlr").length')) +
    '  rows=' + bp.rows.length + '  events=' + JSON.stringify(await live.ev('window.__ct')));

  log('\n (4) the plain drag again, right→left and with more steps');
  await api(site, 'reset=1'); await live.nav(); await live.ev(COUNT);
  d = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
  await live.drag({ sx: d.ex, sy: d.ey, ex: d.sx, ey: d.sy }, d, { ctrl: false, steps: 16 });
  log('   · sel=' + JSON.stringify(await selNow(live)) + '  events=' + JSON.stringify(await live.ev('window.__ct')));
  log('\n (5) CONTROL PAGE with NO engine at all — can CDP input select text there?');
  const rootUrl = live.url.replace('/business/lesson1.html', '');
  await live.cdp.send('Page.navigate', { url: rootUrl + '/qa/_live/control.html' });
  await sleep(1200);
  await live.ev(COUNT); await live.ev(DPSEEN);
  let c = await live.ev('window.__q ? "probe present" : "no probe"');
  log('   · on the control page: ' + c + '  text=' + JSON.stringify(await live.ev('document.body.innerText.slice(0,60)')));
  const cd = await live.ev('(function(){var b=document.querySelector("b");var r=b.getClientRects()[0];' +
    'return {sx:Math.round(r.left+1),sy:Math.round(r.top+r.height/2),ex:Math.round(r.right-1),ey:Math.round(r.bottom-r.height/2)}})()');
  log('   · drag point = ' + JSON.stringify(cd));
  await live.drag(cd, cd, { ctrl: false });
  log('   · events=' + JSON.stringify(await live.ev('window.__ct')) + '  preventDefault=' + JSON.stringify(await live.ev('window.__dp')) +
    '  selectstart=' + await live.ev('window.__ss'));
  log('   · ⭐ sel on the control page = ' + JSON.stringify(await selNow(live)));
  /* and the blunt instrument: if the DOM cannot select at all, nothing else matters */
  await live.ev('(function(){var r=document.createRange();r.selectNodeContents(document.querySelector("p"));var s=getSelection();s.removeAllRanges();s.addRange(r);return 1})()');
  log('   · sel after a scripted addRange = ' + JSON.stringify(await selNow(live)));

  log('\n (6) back on the lesson page: scripted selection vs a real drag');
  await live.nav();
  const d6 = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
  await live.ev('(function(){var p=window.__q.find(' + JSON.stringify(T) + ',0);var r=window.__q.rng(p);var s=getSelection();s.removeAllRanges();s.addRange(r);return 1})()');
  log('   · scripted selection of the phrase = ' + JSON.stringify(await selNow(live)));
  await sleep(500);
  log('   · +500ms popup=' + JSON.stringify(await live.ev('!!document.querySelector(".pop")')));
  await live.drag(d6, d6, { ctrl: false });
  log('   · after a real drag over the same phrase: sel=' + JSON.stringify(await selNow(live)) +
    '  popup=' + JSON.stringify(await live.ev('!!document.querySelector(".pop")')));
  log('\n (7) raw CDP recipes — which one makes Chrome start a selection at all?');
  const raw = (type, x, y, o = {}) => live.cdp.send('Input.dispatchMouseEvent', Object.assign({
    type, x: Math.round(x), y: Math.round(y), modifiers: 0, pointerType: 'mouse',
    button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1,
    buttons: type === 'mousePressed' ? 1 : (type === 'mouseMoved' ? 1 : 0)
  }, o));
  const clear = () => live.ev('(function(){var s=getSelection();if(s)s.removeAllRanges();return 1})()');
  const variants = [
    ['minimal: down → ONE move → up', { moves: 1 }],
    ['four moves', { moves: 4 }],
    ['moves tagged button:left', { moves: 4, moveBtn: 'left' }],
    ['moves with buttons:0', { moves: 4, moveButtons: 0 }],
    ['explicit timestamps', { moves: 4, stamp: true }],
    ['no hover move before the press', { moves: 4, noHover: true }],
    ['HOLD longer between events (40ms)', { moves: 6, gap: 40 }],
    ['press+release at once (click), then the drag', { moves: 4, preClick: true }]
  ];
  for (const [name, o] of variants) {
    await api(site, 'reset=1'); await live.nav();
    const dd = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
    await clear();
    if (o.preClick) { await raw('mousePressed', dd.ex, dd.ey); await raw('mouseReleased', dd.ex, dd.ey); await sleep(120) }
    if (!o.noHover) { await raw('mouseMoved', dd.sx - 30, dd.sy, { buttons: 0 }); await sleep(30) }
    await raw('mousePressed', dd.sx, dd.sy);
    const n = o.moves || 4, t0 = Date.now();
    for (let i = 1; i <= n; i++) {
      const extra = {};
      if (o.moveBtn) extra.button = o.moveBtn;
      if (o.moveButtons != null) extra.buttons = o.moveButtons;
      if (o.stamp) extra.timestamp = (t0 + i * 25) / 1000;
      await raw('mouseMoved', dd.sx + (dd.ex - dd.sx) * i / n, dd.sy, extra);
      if (o.gap) await sleep(o.gap);
    }
    await raw('mouseReleased', dd.ex, dd.ey);
    const s1 = await selNow(live);
    await sleep(300);
    log('   · ' + name + '  →  sel=' + JSON.stringify(s1) + '  +300ms=' + JSON.stringify(await selNow(live)) +
      '  popup=' + await live.ev('!!document.querySelector(".pop")') + '  hlr=' + await live.ev('document.querySelectorAll("#hlLayer .hlr").length'));
  }

  await live.dump('diag end', false);
}

/* ---------------------------------------------------------------------------------------------
   12. THE RUNNER — one browser, one fake sheet, the scenarios that were asked for
   --------------------------------------------------------------------------------------------- */
const SCEN = { diag: scenDiag, geo: scenGeo, bf2: scenBF2, bf2b: scenBF2b, bf3: scenBF3, bf4: scenBF4 };

/* a page-scoped view of the connection: every command/event carries the page's session id */
function session(cdp, id) {
  return {
    send: (method, params) => cdp.send(method, params, id),
    on: (name, fn) => cdp.on(name, (params, sid) => { if (!sid || sid === id) fn(params, sid) })
  };
}

async function main() {
  const only = String(arg('--only', 'all')).split(',').map(s => s.trim()).filter(Boolean);
  const names = (only.length && only[0] !== 'all') ? only : Object.keys(SCEN);
  const unknown = names.filter(n => !SCEN[n]);
  if (unknown.length) {
    console.log('unknown scenario(s): ' + unknown.join(', ') + '\nknown: ' + Object.keys(SCEN).join(', ') + ' | all');
    process.exit(2);
  }
  fs.mkdirSync(OUT, { recursive: true });
  try { fs.writeFileSync(path.join(OUT, 'run.txt'), '') } catch (e) { }

  const site = await startSite();
  const url = 'http://127.0.0.1:' + site.port + '/business/lesson1.html';
  log('· repo   ' + ROOT + '   (node ' + process.version + ')');
  log('· page   ' + url + '   as ' + EMAIL);
  log('· chrome ' + CHROME + (has('--headful') ? '   [headful]' : '   [headless=new]'));
  log('· runner ' + names.join(', '));

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ingles-live-'));
  let chrome, cdp;
  try { chrome = await launchChrome(profile) }
  catch (e) {
    log('✗ could not start Chrome: ' + e.message);
    log('  set $env:CHROME="C:\\path\\to\\chrome.exe" and try again');
    await site.close(); process.exit(1);
  }
  cdp = await connect(chrome.browserWs);
  const clean = async () => {
    try { cdp.ws.close() } catch (e) { }
    try { chrome.proc.kill() } catch (e) { }
    try { await site.close() } catch (e) { }
    if (!has('--keep')) { try { fs.rmSync(profile, { recursive: true, force: true }) } catch (e) { } }
    else log('· kept   ' + profile);
  };

  try {
    const { targetInfos } = await cdp.send('Target.getTargets');
    const page = targetInfos.find(t => t.type === 'page' && t.url.indexOf('devtools') < 0) || targetInfos.find(t => t.type === 'page');
    if (!page) throw new Error('no page target to attach to');
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
    const ses = session(cdp, sessionId);
    await ses.send('Page.enable');
    await ses.send('Runtime.enable');
    /* a headless page can be treated as unfocused: force focus so real mouse/key input is delivered */
    await ses.send('Page.bringToFront').catch(() => { });
    await ses.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => { });
    ses.on('Runtime.exceptionThrown', p => {
      const d = (p && p.exceptionDetails) || {};
      log('  !! page exception: ' + (d.text || '') + ' ' + String((d.exception && (d.exception.description || d.exception.value)) || '').slice(0, 200));
    });
    /* every call to the real deployment is answered by the fake sheet — the page keeps its own BACKPACK */
    await ses.send('Fetch.enable', {
      patterns: [
        { urlPattern: 'https://script.google.com/*' },
        { urlPattern: 'https://*.googleusercontent.com/*' }
      ]
    });
    wireBackpack(ses);
    /* the probe must be in place BEFORE the page's own scripts (sessionStorage gate, fake mic, window.__q) */
    await ses.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
    /* the recorder needs a microphone: the fake device is granted for the test origin up front, so
       getUserMedia never stalls on a permission prompt the harness could not click */
    await cdp.send('Browser.grantPermissions', {
      origin: 'http://127.0.0.1:' + site.port,
      permissions: ['audioCapture', 'videoCapture']
    }).catch(() => { });

    const live = new Live(ses, url);
    for (const n of names) {
      log('\n\n################### scenario ' + n + ' ###################');
      const t0 = Date.now();
      try { await SCEN[n](live, site) }
      catch (e) {
        fail++;
        failures.push(n + ' (threw): ' + e.message);
        log('   ❌ scenario ' + n + ' threw: ' + e.message);
        log('      ' + String(e.stack || '').split('\n').slice(1, 3).join('\n      '));
      }
      log('   · scenario ' + n + ' finished in ' + Math.round((Date.now() - t0) / 1000) + 's');
    }
  } catch (e) {
    fail++;
    failures.push('runner: ' + e.message);
    log('❌ the runner itself failed: ' + e.message + '\n' + (e.stack || ''));
  } finally {
    log('\n' + '─'.repeat(78));
    log(fail === 0 ? ('✅ live harness: ' + pass + ' checks passed, 0 failed')
      : ('❌ live harness: ' + fail + ' failed, ' + pass + ' passed'));
    if (failures.length) log('   failures:\n     · ' + failures.join('\n     · '));
    log('   log  : ' + path.join(OUT, 'run.txt'));
    await clean();
  }
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error('harness crashed:', e); try { console.error(e.stack) } catch (x) { } process.exit(3) });

