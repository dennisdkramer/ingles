/**
 * qa/overflow.mjs — real-browser overflow / balloon / canvas check for the business lessons.
 * Run with: node qa/overflow.mjs [lessonNumber ...]   (no numbers = every business/lesson*.html that exists)
 *           node qa/overflow.mjs --selftest           (qa/fixtures/overflow-ok.html must be clean,
 *                                                      qa/fixtures/overflow-bad.html must report findings)
 *           node qa/overflow.mjs 1 --shot <file.png>   (review aid: also captures the top of the page)
 *
 * jsdom cannot see layout, so this is the ONLY harness that measures it, in real Chrome over CDP.
 * FORMAT.md is the model: the canvas is fixed (.page-container 1400px, .content-area 1200px, never
 * reflows), a block is full / half (50% - 7px) / third (33.3% - 9.3px) and is TAGGED with its size
 * (`.itemsize*`, or `data-cols` on the `.itemrow` that holds it). Checks, all fatal except where noted:
 *   1. OVERFLOW — a block's content is wider than the block (scrollWidth > clientWidth + 8);
 *   2. BALLOON  — a block is wider than its slot (a row member past its share of the row, a full block past
 *                 the canvas, ...). A row's columns are counted from its members and their `data-span`, so
 *                 any number of columns is measured correctly;
 *   3. ESCAPE   — ANY element crosses the .content-area frame. This is the one that catches content
 *                 that is geometrically inside its block but pushed out of the canvas (a right-aligned
 *                 `.blanks` cell spilling to the LEFT of its panel, for example);
 *   4. CELL     — a `.blanks` cell whose content is wider than the cell (item does not fit its cell);
 *   5. SPACING  — BLOCKGAP (less than 8px of vertical space between two stacked blocks), ROWGAP
 *                 (less than 8px between the members of an `.itemrow`), OPTGAP (less than 4px between
 *                 the options of one question, which are laid across the block width) and CHARTPAD
 *                 (a chart cell with less than 8px of horizontal padding);
 *   5. RESIZE   — a `textarea` inside `.content-area` that the student can still drag (`resize` ≠ none):
 *                 a free-text block is fixed-size, and a drag handle can widen it past its block;
 *   (hint) DEADSPACE  — a full block whose content fills < 75% of it (review-only; pedagogy decides);
 *   (hint) HEIGHT     — adjacent half/third blocks whose heights differ by > 50px (review-only).
 *
 * `.panels > .panel` (the retired structure) is measured too when present, so an old page copied back
 * into business/ is still checked. COMPLETENESS of `.itemrow` rows is qa/width.mjs's job, not this file's.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SECRET = 'abreportas2025';
const EMAIL = 'overflow.qa@test.com';
const TRACK = 'business';
const sleep = ms => new Promise(r => setTimeout(r, ms));
function h(s) { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return x; }

function server() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let fp = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
      if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(fp, (e, d) => {
        if (e) { res.writeHead(404); res.end(); return; }
        const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg' };
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

function session(cdp, id) {
  return {
    send: (m, p = {}) => cdp.send(m, p, id),
    on: (n, f) => cdp.on(n, (p, sid) => { if (!sid || sid === id) f(p, sid) })
  };
}

const MEASURE = `(function(){
  function cw(el){
    var r = document.createRange();
    r.selectNodeContents(el);
    var min = Infinity, max = -Infinity;
    var rects = r.getClientRects();
    for (var i = 0; i < rects.length; i++){ if (rects[i].width > 0){ min = Math.min(min, rects[i].left); max = Math.max(max, rects[i].right); } }
    el.querySelectorAll('input,textarea,button,select,label').forEach(function(c){ var b = c.getBoundingClientRect(); if (b.width > 0){ min = Math.min(min, b.left); max = Math.max(max, b.right); } });
    return min === Infinity ? 0 : (max - min);
  }
  var ca = document.querySelector('.content-area');
  if (!ca) return { empty: true };
  var cr = ca.getBoundingClientRect();
  function slotOf(el){
    var pa = el.parentElement;
    var row = pa && pa.classList && pa.classList.contains('itemrow') ? pa : null;
    if (!row) return cr.width;
    /* content & layout aware: the row divides into as many columns as it has shares (members +
       their data-span), and each member owns its share of the width minus the 14px gaps */
    var kids = [].slice.call(row.children);
    var span = Number(el.getAttribute('data-span') || 1) || 1;
    var cols = 0;
    for (var ki = 0; ki < kids.length; ki++) cols += Number(kids[ki].getAttribute('data-span') || 1) || 1;
    if (cols < 1) return cr.width;
    return (cr.width - 14 * (cols - 1)) * (span / cols);
  }
  function label(el){
    var hd = el.querySelector('.ex-head') || el.querySelector('h1,h2,h3,h4,summary,b');
    var t = hd ? hd.textContent : (el.textContent || '');
    return t.replace(/\\s+/g, ' ').trim().slice(0, 54);
  }
  var sel = '.content-area .panel, .content-area .itemrow > *, .content-area > .card, .content-area > p.card,'
    + ' .content-area > .chart, .panels > .panel';
  var blocks = [].slice.call(document.querySelectorAll(sel));
  var findings = [], hints = [], tally = { full: 0, inRow: 0 };
  var lastRow = null, lastRowTop = -9999;
  blocks.forEach(function(el){
    var r = el.getBoundingClientRect();
    if (!r.width) return;
    var slot = slotOf(el);
    var ex = label(el);
    if (slot >= cr.width - 1) tally.full++; else tally.inRow++;
    var over = el.scrollWidth - el.clientWidth;
    if (over > 8) findings.push({ kind: 'OVERFLOW', w: Math.round(r.width), slot: Math.round(slot), extra: 'over=' + over + 'px', ex: ex });
    else if (r.width - slot > 8) findings.push({ kind: 'BALLOON', w: Math.round(r.width), slot: Math.round(slot), extra: 'wider than its slot by ' + Math.round(r.width - slot) + 'px', ex: ex });
    var pct = Math.round(100 * cw(el) / r.width);
    if (slot >= cr.width - 1 && pct > 0 && pct < 75) hints.push({ kind: 'DEADSPACE', extra: 'fill=' + pct + '%  w=' + Math.round(r.width), ex: ex });
    /* HEIGHT hint: two blocks of the same row (or two consecutive half/third blocks) of unequal height */
    if (slot < cr.width - 1) {
      var sameRow = Math.abs(r.top - lastRowTop) < 4;
      if (sameRow && Math.abs(r.height - lastRow.h) > 50)
        hints.push({ kind: 'HEIGHT', extra: 'row pair ' + Math.round(lastRow.h) + 'px vs ' + Math.round(r.height) + 'px', ex: ex });
      lastRowTop = r.top; lastRow = { h: r.height };
    }
  });
  var escape = [];
  [].slice.call(document.querySelectorAll('.content-area *')).forEach(function(el){
    var r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > cr.right + 1 || r.left < cr.left - 1) && escape.length < 12) {
      escape.push({ kind: 'ESCAPE', w: Math.round(r.width),
        extra: (el.className || el.tagName).toString().slice(0, 34) + ' at ' + Math.round(r.left) + '..' + Math.round(r.right),
        ex: 'canvas ' + Math.round(cr.left) + '..' + Math.round(cr.right) });
    }
  });
  var cells = [];
  [].slice.call(document.querySelectorAll('.blanks > div')).forEach(function(c){
    var r = c.getBoundingClientRect();
    if (!r.width) return;
    var min = Infinity, max = -Infinity;
    c.querySelectorAll('input,textarea,button,label').forEach(function(k){ var kr = k.getBoundingClientRect(); if (kr.width > 0){ min = Math.min(min, kr.left); max = Math.max(max, kr.right); } });
    var rg = document.createRange();
    rg.selectNodeContents(c);
    var rects = rg.getClientRects();
    for (var i = 0; i < rects.length; i++){ if (rects[i].width > 0){ min = Math.min(min, rects[i].left); max = Math.max(max, rects[i].right); } }
    var inner = min === Infinity ? 0 : max - min;
    if (inner > r.width + 8) cells.push({ kind: 'CELL', w: Math.round(inner), slot: Math.round(r.width),
      extra: 'needs ' + Math.round(inner) + 'px in a ' + Math.round(r.width) + 'px cell', ex: (c.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 44) });
  });
  /* ---- spacing: blocks must read as separate blocks, and row members / options must not touch ---- */
  function brief(el){
    var t = label(el);
    return t.slice(0, 28);
  }
  var gaps = [], minBlock = -1, minRow = -1, minOpt = -1, minChart = -1;
  /* 1. vertical space between stacked blocks (every direct child of the fixed canvas) */
  var flow = [].slice.call(document.querySelectorAll('.content-area > *')).filter(function(el){
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.id === 'feed') return false;
    return el.getBoundingClientRect().height > 0;
  });
  for (var gi = 0; gi + 1 < flow.length; gi++) {
    var ra = flow[gi].getBoundingClientRect(), rb = flow[gi + 1].getBoundingClientRect();
    var vy = Math.round(rb.top - ra.bottom);
    if (minBlock < 0 || vy < minBlock) minBlock = vy;
    if (vy < 8) gaps.push({ kind: 'BLOCKGAP', extra: vy + 'px between «' + brief(flow[gi]) + '» and «' + brief(flow[gi + 1]) + '»', ex: '' });
  }
  /* 2. horizontal space between the members of a row (halves / thirds) */
  [].slice.call(document.querySelectorAll('.itemrow')).forEach(function(row){
    var ch = [].slice.call(row.children);
    for (var ci = 0; ci + 1 < ch.length; ci++) {
      var c1 = ch[ci].getBoundingClientRect(), c2 = ch[ci + 1].getBoundingClientRect();
      var hg = Math.round(c2.left - c1.right);
      if (minRow < 0 || hg < minRow) minRow = hg;
      if (hg < 8) gaps.push({ kind: 'ROWGAP', extra: hg + 'px between «' + brief(ch[ci]) + '» and «' + brief(ch[ci + 1]) + '»', ex: '' });
    }
  });
  /* 3. space between the options of one question — wherever they sit: spread across the block width
        (.qopts) or kept compact beside the stem (.qline) */
  var labelGroups = [];
  [].slice.call(document.querySelectorAll('label')).forEach(function(l){
    var p = l.parentElement;
    if (p && labelGroups.indexOf(p) < 0) labelGroups.push(p);
  });
  labelGroups.forEach(function(p){
    var ls = [].slice.call(p.children).filter(function(el){ return el.tagName === 'LABEL'; });
    for (var li = 0; li + 1 < ls.length; li++) {
      var a = ls[li].getBoundingClientRect(), b = ls[li + 1].getBoundingClientRect();
      var sameLine = Math.abs(a.top - b.top) < 6;
      var d = sameLine ? Math.round(b.left - a.right) : Math.round(b.top - a.bottom);
      if (minOpt < 0 || d < minOpt) minOpt = d;
      if (d < 4) gaps.push({ kind: 'OPTGAP', extra: d + 'px between «' + (ls[li].textContent || '').trim().slice(0, 18) + '» and «' + (ls[li + 1].textContent || '').trim().slice(0, 18) + '»', ex: '' });
    }
  });
  /* 4. chart cells keep their content off the neighbour's content (padding + border) */
  [].slice.call(document.querySelectorAll('.chart th, .chart td')).forEach(function(cell){
    var cs = getComputedStyle(cell);
    var pad = Math.round(parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));
    if (minChart < 0 || pad < minChart) minChart = pad;
    if (pad < 8) gaps.push({ kind: 'CHARTPAD', extra: pad + 'px horizontal padding on a chart cell', ex: (cell.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 30) });
  });
  /* 5. free-text blocks are fixed size: a textarea the student can drag can also widen past its block */
  [].slice.call(document.querySelectorAll('.content-area textarea')).forEach(function(ta){
    var rz = getComputedStyle(ta).resize;
    if (rz && rz !== 'none') findings.push({ kind: 'RESIZE',
      extra: 'drag-resizable textarea (resize:' + rz + ')',
      ex: (ta.id || ta.className || 'textarea').toString().slice(0, 30) });
  });
  return { empty: false, canvas: Math.round(cr.left) + '..' + Math.round(cr.right), w: Math.round(cr.width),
    blocks: blocks.length, tally: tally, findings: findings, escape: escape, cells: cells, gaps: gaps,
    spacing: { block: minBlock, row: minRow, opt: minOpt, chart: minChart }, hints: hints };
})()`;

function discover() {
  const dir = path.join(ROOT, 'business');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map(f => (f.match(/^lesson(\d+)\.html$/) || [])[1])
    .filter(Boolean).map(Number).sort((a, b) => a - b);
}

/* print one page's result; returns the number of FAILING findings (hints never fail) */
function report(head, v) {
  if (!v || v.empty) { console.log(head + ': ❌ no .content-area (page missing or not a lesson)'); return 1; }
  const bad = [].concat(v.findings, v.escape, v.cells, v.gaps || []);
  console.log(head + '  canvas ' + v.canvas + ' · blocks ' + v.blocks +
    ' (full ' + v.tally.full + ' / dividing a row ' + v.tally.inRow + ')');
  const sp = v.spacing || {};
  const px = n => (n == null || n < 0) ? '—' : n + 'px';
  console.log('  spacing (min): between blocks ' + px(sp.block) + ' · between row members ' + px(sp.row) +
    ' · between options ' + px(sp.opt) + ' · chart cell padding ' + px(sp.chart));
  bad.forEach(f => console.log('    ❌ ' + f.kind + '  ' + f.extra +
    (f.w ? '  w=' + f.w : '') + (f.slot ? '  slot=' + f.slot : '') + '  «' + f.ex + '»'));
  v.hints.forEach(f => console.log('    (hint) ' + f.kind + '  ' + f.extra + '  «' + f.ex + '»'));
  return bad.length;
}

async function main() {
  const argv = process.argv.slice(2);
  const selftest = argv.includes('--selftest');
  /* values that belong to an option are not lesson numbers */
  const optVals = new Set();
  ['--shot', '--shot-h'].forEach(f => { const j = argv.indexOf(f); if (j >= 0 && argv[j + 1]) optVals.add(argv[j + 1]); });
  const targets = argv.filter(a => !a.startsWith('--') && !optVals.has(a))
    .map(Number).filter(n => Number.isInteger(n) && n >= 1);
  const shotAt = argv.indexOf('--shot');
  const shotFile = shotAt >= 0 ? argv[shotAt + 1] : null;
  const shotHAt = argv.indexOf('--shot-h');
  const shotH = shotHAt >= 0 ? (Number(argv[shotHAt + 1]) || 1800) : 1800;
  let shotDone = false;

  const site = await server();
  const base = 'http://127.0.0.1:' + site.port;
  const gate = { email: EMAIL, track: TRACK, teacher: false, sig: h(EMAIL + TRACK + SECRET) };
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
  await ses.send('Page.addScriptToEvaluateOnNewDocument', { source: 'try{sessionStorage.setItem("gate",JSON.stringify(' + JSON.stringify(gate) + '))}catch(e){}' });

  const measure = async (rel) => {
    await ses.send('Page.navigate', { url: base + '/' + rel });
    await sleep(selftest ? 900 : 1300);
    const r = await ses.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true });
    if (shotFile && !shotDone) {
      shotDone = true;
      try {
        const dim = await ses.send('Runtime.evaluate', { expression: 'document.documentElement.scrollWidth', returnByValue: true });
        const shot = await ses.send('Page.captureScreenshot', {
          format: 'png', captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: Math.min(dim.result.value || 1400, 1500), height: shotH, scale: 0.8 }
        });
        fs.writeFileSync(shotFile, Buffer.from(shot.data, 'base64'));
        console.log('  screenshot of the top of ' + rel + ' → ' + shotFile);
      } catch (e) { console.log('  (screenshot failed: ' + e.message + ')'); }
    }
    return (r.result && r.result.value) || null;
  };

  let fails = 0;

  if (selftest) {
    /* the audit must PASS the good fixture and FAIL the bad one — this is what keeps a
       vacuous pass (measuring nothing) from ever looking green again */
    const cases = [{ name: 'overflow-ok.html', expect: 0 }, { name: 'overflow-bad.html', expect: 1 }];
    let broken = 0;
    for (const c of cases) {
      const rel = 'qa/fixtures/' + c.name;
      if (!fs.existsSync(path.join(ROOT, rel))) { console.log('❌ fixture missing: ' + rel); broken++; continue; }
      const n = report(rel, await measure(rel));
      const ok = (n ? 1 : 0) === c.expect;
      if (!ok) broken++;
      console.log((ok ? '✅ ' : '❌ ') + rel + ' → ' + (n ? n + ' finding(s)' : 'clean') +
        ' (expected ' + (c.expect ? 'findings' : 'clean') + ')');
    }
    console.log(broken === 0 ? '✅ overflow audit selftest green' : '❌ overflow audit selftest FAILED');
    fails = broken;
  } else {
    const lessons = targets.length ? targets : discover();
    if (!lessons.length) console.log('✅ overflow audit: no business lesson pages to check');
    for (const L of lessons) {
      const rel = 'business/lesson' + L + '.html';
      if (!fs.existsSync(path.join(ROOT, rel))) {
        if (targets.length) { console.log('lesson ' + L + ': ❌ page not found'); fails++; }
        else console.log('lesson ' + L + ': (page missing, skipped)');
        continue;
      }
      fails += report('lesson ' + L, await measure(rel));
    }
    const label = targets.length ? ('lesson' + (lessons.length > 1 ? 's ' : ' ') + lessons.join(', '))
      : (lessons.length ? 'lessons ' + lessons.join(', ') : 'no pages');
    console.log(fails === 0
      ? '✅ layout clean — no overflow, no balloon, no spacing gap, no drag-resizable text box, nothing escapes the canvas (' + label + ')'
      : '❌ ' + fails + ' layout finding(s)');
  }

  try { cdp.ws.close(); } catch (e) { }
  try { chrome.proc.kill(); } catch (e) { }
  await site.close();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
  process.exit(fails ? 1 : 0);
}

main().catch(e => { console.error('crashed:', e.message); process.exit(1); });


