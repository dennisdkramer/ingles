/**
 * qa/overflow.mjs — real-browser geometry check. Four findings, all fatal:
 *   1. OVERFLOW — a block's content is wider than the block (scrollWidth > clientWidth + 8);
 *   2. ESCAPE   — an element crosses the .content-area frame (content pushed off the canvas);
 *   3. CELL     — a .blanks cell whose content is wider than the cell;
 *   4. RESIZE   — a textarea the student can drag (it can be widened past its block).
 * Nothing here judges how a page is laid out: which blocks exist, how wide they are, how many
 * options a question has, how much space they keep is a generation decision, not a defect.
 *
 * Run: node qa/overflow.mjs [--track=kids|business|adult] [lessonNumber ...]
 *      node qa/overflow.mjs --selftest            (fixtures/overflow-ok.html clean, overflow-bad.html not)
 *      node qa/overflow.mjs 1 --shot out.png [--shot-h <px>] [--shot-y <px>]   (a picture of the page)
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { pickTracks, hasTrackFlag, missingTargets, scopeLabel } from './track.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SECRET = 'abreportas2025';
const EMAIL = 'overflow.qa@test.com';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const h = s => { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return x; };

function server() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const fp = path.join(ROOT, rel === '/' ? 'index.html' : rel);
      if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(fp, (e, d) => {
        if (e) { res.writeHead(404); res.end(); return; }
        const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
          '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg' };
        res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' });
        res.end(d);
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve({ port: srv.address().port, close: () => new Promise(r => srv.close(r)) }));
  });
}

function launchChrome(profile) {
  const args = ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--window-size=1400,1000', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--mute-audio', 'about:blank'];
  const proc = spawn(CHROME, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let buf = '';
    const onData = d => { buf += d.toString(); const m = buf.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (m) { proc.stderr.off('data', onData); resolve({ proc, browserWs: m[1] }); } };
    proc.stderr.on('data', onData);
    proc.on('error', reject);
    setTimeout(() => reject(new Error('no devtools endpoint:\n' + buf)), 20000);
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
      if (m.id) { const w = c.waiters.get(m.id); if (w) { c.waiters.delete(m.id); m.error ? w.rej(new Error(w.method + ': ' + JSON.stringify(m.error))) : w.res(m.result) } return; }
      for (const fn of (c.listeners.get(m.method) || [])) fn(m.params, m.sessionId);
    });
    ws.addEventListener('error', e => reject(new Error('ws error: ' + (e.message || 'unknown'))));
    ws.addEventListener('open', () => resolve(c));
  });
}

const session = (cdp, id) => ({
  send: (m, p = {}) => cdp.send(m, p, id),
  on: (n, f) => cdp.on(n, (p, sid) => { if (!sid || sid === id) f(p, sid) })
});

const MEASURE = `(function(){
  var ca = document.querySelector('.content-area');
  if (!ca) return { empty: true };
  var cr = ca.getBoundingClientRect();
  function label(el){
    var hd = el.querySelector('.ex-head') || el.querySelector('h1,h2,h3,h4,summary,b');
    var t = hd ? hd.textContent : (el.textContent || '');
    return t.replace(/\\s+/g, ' ').trim().slice(0, 54);
  }
  var sel = '.content-area .panel, .content-area .itemrow > *, .content-area > .card, .content-area > p.card,'
    + ' .content-area > .chart, .content-area > fieldset, .content-area > .dialog,'
    + ' .content-area > .qgrid, .content-area > .blanks, .panels > .panel';
  var blocks = [].slice.call(document.querySelectorAll(sel));
  var findings = [], cells = [], escape = [];
  blocks.forEach(function(el){
    var r = el.getBoundingClientRect();
    if (!r.width) return;
    var over = el.scrollWidth - el.clientWidth;
    if (over > 8) findings.push({ kind: 'OVERFLOW', w: Math.round(r.width),
      extra: 'content is ' + over + 'px wider than the block', ex: label(el) });
  });
  /* anything crossing the fixed canvas frame */
  [].slice.call(document.querySelectorAll('.content-area *')).forEach(function(el){
    var r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > cr.right + 1 || r.left < cr.left - 1) && escape.length < 12) {
      escape.push({ kind: 'ESCAPE', w: Math.round(r.width),
        extra: (el.className || el.tagName).toString().slice(0, 34) + ' at ' + Math.round(r.left) + '..' + Math.round(r.right),
        ex: 'canvas ' + Math.round(cr.left) + '..' + Math.round(cr.right) });
    }
  });
  /* a .blanks cell whose content does not fit its cell */
  [].slice.call(document.querySelectorAll('.blanks > div')).forEach(function(c){
    var r = c.getBoundingClientRect();
    if (!r.width) return;
    var min = Infinity, max = -Infinity;
    var rg = document.createRange();
    rg.selectNodeContents(c);
    var rects = rg.getClientRects();
    for (var i = 0; i < rects.length; i++){ if (rects[i].width > 0){ min = Math.min(min, rects[i].left); max = Math.max(max, rects[i].right); } }
    c.querySelectorAll('input,textarea,button,label').forEach(function(k){
      var kr = k.getBoundingClientRect(); if (kr.width > 0){ min = Math.min(min, kr.left); max = Math.max(max, kr.right); } });
    var inner = min === Infinity ? 0 : max - min;
    if (inner > r.width + 8) cells.push({ kind: 'CELL', w: Math.round(inner), slot: Math.round(r.width),
      extra: 'needs ' + Math.round(inner) + 'px in a ' + Math.round(r.width) + 'px cell',
      ex: (c.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 44) });
  });
  /* a free-text block is fixed size: no drag handle */
  [].slice.call(document.querySelectorAll('.content-area textarea')).forEach(function(ta){
    var rz = getComputedStyle(ta).resize;
    if (rz && rz !== 'none') findings.push({ kind: 'RESIZE',
      extra: 'drag-resizable textarea (resize:' + rz + ')',
      ex: (ta.id || ta.className || 'textarea').toString().slice(0, 30) });
  });
  return { empty: false, canvas: Math.round(cr.left) + '..' + Math.round(cr.right), w: Math.round(cr.width),
    blocks: blocks.length, findings: findings, escape: escape, cells: cells };
})()`;

function discover(track) {
  const dir = path.join(ROOT, track);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map(f => (f.match(/^lesson(\d+)\.html$/) || [])[1])
    .filter(Boolean).map(Number).sort((a, b) => a - b);
}

/* print one page's result; returns the number of failing findings */
function report(head, v) {
  if (!v || v.empty) { console.log(head + ': ❌ no .content-area (page missing or not a lesson)'); return 1; }
  const bad = [].concat(v.findings, v.escape, v.cells);
  console.log(head + '  canvas ' + v.canvas + ' · blocks ' + v.blocks);
  bad.forEach(f => console.log('    ❌ ' + f.kind + '  ' + f.extra +
    (f.w ? '  w=' + f.w : '') + (f.slot ? '  slot=' + f.slot : '') + '  «' + f.ex + '»'));
  return bad.length;
}
async function main() {
  const argv = process.argv.slice(2);
  const selftest = argv.includes('--selftest');
  const optVals = new Set();
  ['--shot', '--shot-h', '--shot-y', '--shot-url'].forEach(f => { const j = argv.indexOf(f); if (j >= 0 && argv[j + 1]) optVals.add(argv[j + 1]); });
  const targets = argv.filter(a => !a.startsWith('--') && !optVals.has(a))
    .map(Number).filter(n => Number.isInteger(n) && n >= 1);
  const shotAt = argv.indexOf('--shot');
  const shotFile = shotAt >= 0 ? argv[shotAt + 1] : null;
  const shotHAt = argv.indexOf('--shot-h');
  const shotH = shotHAt >= 0 ? (Number(argv[shotHAt + 1]) || 1800) : 1800;
  const shotYAt = argv.indexOf('--shot-y');
  const shotY = shotYAt >= 0 ? (Number(argv[shotYAt + 1]) || 0) : 0;
  let shotDone = false;

  const site = await server();
  const base = 'http://127.0.0.1:' + site.port;
  const scopeTracks = pickTracks();
  const gateFor = t => ({ email: EMAIL, track: t, teacher: false, sig: h(EMAIL + t + SECRET) });
  const gateMap = {};
  for (const t of (scopeTracks.length ? scopeTracks : ['business'])) gateMap[t] = gateFor(t);
  const gateSrc = 'try{var g=' + JSON.stringify(gateMap) + ';var k=(location.pathname.split("/")[1]||"");'
    + 'sessionStorage.setItem("gate",JSON.stringify(g[k]||g[' + JSON.stringify(Object.keys(gateMap)[0]) + ']))}catch(e){}';

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ovf-'));
  let chrome;
  try { chrome = await launchChrome(profile); }
  catch (e) { console.log('could not launch chrome:', e.message); await site.close(); process.exit(1); }
  const cdp = await connect(chrome.browserWs);
  const { targetInfos } = await cdp.send('Target.getTargets');
  const page = targetInfos.find(t => t.type === 'page' && t.url.indexOf('devtools') < 0) || targetInfos.find(t => t.type === 'page');
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
  const ses = session(cdp, sessionId);
  await ses.send('Page.enable');
  await ses.send('Runtime.enable');
  await ses.send('Page.addScriptToEvaluateOnNewDocument', { source: gateSrc });

  const measure = async (rel) => {
    await ses.send('Page.navigate', { url: base + '/' + rel });
    await sleep(selftest ? 900 : 1300);
    /* a webfont that lands after the first paint re-wraps every line: measure what the student sees */
    try {
      await ses.send('Runtime.evaluate', {
        expression: '(document.fonts?Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,2500)})]):Promise.resolve()).then(function(){return 1})',
        awaitPromise: true, returnByValue: true
      });
    } catch (e) { }
    const r = await ses.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true });
    if (shotFile && !shotDone) {
      shotDone = true;
      try {
        const dim = await ses.send('Runtime.evaluate', { expression: 'document.documentElement.scrollWidth', returnByValue: true });
        const shot = await ses.send('Page.captureScreenshot', {
          format: 'png', captureBeyondViewport: true,
          clip: { x: 0, y: shotY, width: Math.min(dim.result.value || 1400, 1500), height: shotH, scale: 0.8 }
        });
        fs.writeFileSync(shotFile, Buffer.from(shot.data, 'base64'));
        console.log('  screenshot of the top of ' + rel + ' → ' + shotFile);
      } catch (e) { console.log('  (screenshot failed: ' + e.message + ')'); }
    }
    return (r.result && r.result.value) || null;
  };

  const finish = async code => {
    try { cdp.ws.close(); } catch (e) { }
    try { chrome.proc.kill(); } catch (e) { }
    await site.close();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
    process.exit(code);
  };

  /* --shot-url <rel>: render one page (any page) and exit — a review aid, not part of the sweep */
  const shotUrlAt = argv.indexOf('--shot-url');
  const shotUrl = shotUrlAt >= 0 ? argv[shotUrlAt + 1] : null;
  if (shotUrl) { report(shotUrl, await measure(shotUrl)); await finish(0); }

  let fails = 0;

  if (selftest) {
    /* the audit must PASS the good fixture and FAIL the bad one, so a vacuous pass can never look green */
    const cases = [{ name: 'overflow-ok.html', expect: 0 }, { name: 'overflow-bad.html', expect: 1 }];
    for (const c of cases) {
      const rel = 'qa/fixtures/' + c.name;
      if (!fs.existsSync(path.join(ROOT, rel))) { console.log('❌ fixture missing: ' + rel); fails++; continue; }
      const n = report(rel, await measure(rel));
      const ok = (n ? 1 : 0) === c.expect;
      if (!ok) fails++;
      console.log((ok ? '✅ ' : '❌ ') + rel + ' → ' + (n ? n + ' finding(s)' : 'clean') +
        ' (expected ' + (c.expect ? 'findings' : 'clean') + ')');
    }
    console.log(fails === 0 ? '✅ selftest green' : '❌ selftest FAILED');
    await finish(fails ? 1 : 0);
  }

  const tracks = scopeTracks;
  const strict = hasTrackFlag();
  const ghosts = missingTargets(tracks, targets);
  if (ghosts.length) { console.log('❌ lesson ' + ghosts.join(', ') + ' does not exist in ' + scopeLabel(tracks)); fails += ghosts.length; }
  if (!tracks.length) console.log('✅ no lesson pages in any track');
  for (const TRACK of tracks) {
    const lessons = targets.length ? targets : discover(TRACK);
    if (!lessons.length) { console.log('✅ no ' + TRACK + ' lesson pages to check'); continue; }
    let trackFails = 0;
    for (const L of lessons) {
      const rel = TRACK + '/lesson' + L + '.html';
      if (!fs.existsSync(path.join(ROOT, rel))) {
        if (strict) { console.log(rel + ': ❌ page not found'); trackFails++; }
        else console.log(rel + ': (page missing, skipped)');
        continue;
      }
      trackFails += report(rel, await measure(rel));
    }
    fails += trackFails;
    const label = TRACK + ' — lesson' + (lessons.length === 1 ? ' ' : 's ') + lessons.join(', ');
    console.log(trackFails === 0
      ? '✅ nothing overflows, nothing escapes the canvas (' + label + ')'
      : '❌ ' + trackFails + ' finding(s) — ' + TRACK);
  }
  await finish(fails ? 1 : 0);
}

main().catch(e => { console.error('crashed:', e.message); process.exit(1); });


