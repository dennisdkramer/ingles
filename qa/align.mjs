/**
 * qa/align.mjs — the CONTENT BALANCE pass: does each row's shorter cell carry what its neighbour does?
 *
 * WHY IT MEASURES BEFORE THE SOLVER (owner report 2026-11-22): a row can look level and be lopsided.
 * equalize.js reads every cell at align-self:flex-start while solving (`:199`), because a stretched
 * cell's height says nothing about its content; it then equalizes by REDISTRIBUTING WIDTHS (`:244`), by
 * SPREADING a question cell's own gaps (`:268`) and, in a two-cell row, by CENTRING the shorter cell
 * (`:277`). Each of those makes a thin cell look full, so a height read from the finished page measures
 * the solver, not the author. This pass asks the engine for the authored page back
 * (EqualizeRows.clean()), holds every cell at its own height, and reads what each cell actually carries.
 *
 * WHAT IT PRINTS: one line per row whose cells differ by more than TOL px, at each measured width, and
 * exit 1 if there is one. A row of a single cell has nothing to balance and is skipped — but the
 * activities inside it are not: a .qgrid puts its questions in adjacent cells of its own, so its items
 * are measured too, and a scramble's answer line (input.gap declared in em from its answer) is reported
 * when it is wider than the cell that holds it, because that line is what wraps the chips above it.
 *
 * It is NOT behind qa/off.mjs. The kill switch silences harnesses that judge a style choice; this is a
 * measurement the batch's own last step runs (PEDAGOGY-MAP.md [ALIGN]), and a silent pass would let a
 * lopsided row ship.
 *
 *   node qa/align.mjs --track=business --lessons=26-36
 *   node qa/align.mjs --track=business --lessons=26-36 --verbose    every row, not only the uneven ones
 *   node qa/align.mjs --track=business --widths=1280,1024 --tol=30
 *   $env:CHROME="C:\path\to\chrome.exe"    override the browser
 *
 * HOW IT RUNS (zero dependencies — Node 22+ has global fetch + WebSocket, the way qa/live.mjs does it):
 *   1. a tiny static server serves the repo, so the page measured is the working tree, never a deploy;
 *   2. Chrome runs headless with a remote-debugging port and a minimal CDP client drives it;
 *   3. a seed injected before any page script writes sessionStorage.gate, so the lesson page opens;
 *   4. per width, per lesson: navigate, wait for eq-ready (the sheet reveals content at that class), then
 *      EqualizeRows.clean() + every cell at align-self:flex-start + one rect read per cell.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { ROOT, pickTracks, lessonsOnDisk, lessonFile, pickLessonsFlag } from './track.mjs';

const TOL = (() => {
  const a = process.argv.find(s => s.startsWith('--tol='));
  return a ? Number(a.slice(6)) : 30;
})();
const WIDTHS = (() => {
  const a = process.argv.find(s => s.startsWith('--widths='));
  return a ? a.slice(9).split(',').map(Number).filter(Boolean) : [1280, 1024];
})();
const VERBOSE = process.argv.includes('--verbose');
const EMAIL = 'align.qa@ingles.test';
const SECRET = 'abreportas2025';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };
/* EOP */

function serveRepo() {
  const srv = http.createServer((req, res) => {
    let u = decodeURIComponent(req.url.split('?')[0]);
    if (u.endsWith('/')) u += 'index.html';
    const file = path.join(ROOT, u);
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(buf);
    });
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ srv, port: srv.address().port })));
}

function chromePath() {
  const cands = [process.env.CHROME,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  throw new Error('no Chrome found — set CHROME=<path to chrome.exe>');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const h = s => { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return x; };

/** launch and attach one blank target; returns {send, sid, close} */
async function openBrowser(port) {
  const profile = path.join(os.tmpdir(), 'align-' + process.pid + '-' + port);
  const proc = spawn(chromePath(), ['--headless=new', '--remote-debugging-port=' + port,
    '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--mute-audio', 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let ver = null;
  for (let i = 0; i < 80 && !ver; i++) {
    try { ver = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json(); }
    catch (e) { await sleep(250); }
  }
  if (!ver) { proc.kill(); throw new Error('chrome did not open a DevTools endpoint'); }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  const send = (method, params = {}, sessionId) => new Promise(res => {
    const i = ++id; pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });
  const t = await send('Target.createTarget', { url: 'about:blank' });
  const a = await send('Target.attachToTarget', { targetId: t.result.targetId, flatten: true });
  return { send, sid: a.result.sessionId, close: () => { try { ws.close(); } catch (e) { } proc.kill(); } };
}
/* EOP */

/* THE READING. EqualizeRows.clean() restores the authored page — widths, align-self, the centred cell and
   the margins the spacing lever wrote. `run` is then made a no-op, so a late font or image solve cannot
   put the solver back while the cells are read. Each cell is held at align-self:flex-start, so its rect is
   its own content's height and never the row's. */
const MEASURE = `(() => {
  const E = window.EqualizeRows;
  if (!E) return JSON.stringify({ error: 'this page does not load equalize.js' });
  const SEL = '.content-area .rows:not(.markup-row)';
  /* FIRST READ — the page as the student sees it, after the solver has redistributed widths. This is the
     only state in which a squeezed cell exists: the authored page gives every cell its half, and the solver
     then hands the wide content its share. A chip run or a chart that no longer fits is read here. */
  const solved = [];
  document.querySelectorAll(SEL).forEach(r => {
    solved.push(Array.prototype.slice.call(r.children).map(c => {
      const cw = c.getBoundingClientRect().width;
      const sq = [];
      Array.prototype.forEach.call(c.querySelectorAll('.chips'), el => {
        const kids = Array.prototype.slice.call(el.children);
        if (!kids.length) return;
        const st = getComputedStyle(el);
        const gap = parseFloat(st.columnGap || st.gap) || 0;
        const nat = kids.reduce((a, k) => a + k.getBoundingClientRect().width, 0) + gap * (kids.length - 1);
        const first = kids[0].getBoundingClientRect().height || 1;
        const rows = Math.max(1, Math.round(el.getBoundingClientRect().height / first));
        if (nat > cw + 2) {
          const n = el.closest('.block') && el.closest('.block').querySelector('h3');
          sq.push({ what: (n ? n.textContent : 'chips').trim().slice(0, 22), want: Math.round(nat), have: Math.round(cw), rows: rows });
        }
      });
      Array.prototype.forEach.call(c.querySelectorAll('table.chart'), el => {
        const nat = el.scrollWidth;
        if (nat > cw + 2) {
          const n = el.closest('.block') && el.closest('.block').querySelector('h3');
          sq.push({ what: 'chart in ' + (n ? n.textContent.trim().slice(0, 18) : 'block'), want: Math.round(nat), have: Math.round(cw), rows: 0 });
        }
      });
      return { w: Math.round(cw), squeeze: sq };
    }));
  });
  /* THIRD READ, inside an activity: a .qgrid lays its questions in adjacent cells, so the questions are
     cells too — one long question beside two short ones is the same fault as a lopsided row, and only the
     rendered page can see it. Also read every answer line: a scramble's input.gap is declared in em from
     its answer, and one that does not fit its cell is what squeezes the chips above it. */
  const inside = [];
  document.querySelectorAll('.content-area .qgrid').forEach(g => {
    const items = Array.prototype.slice.call(g.children);
    const hs = items.map(i => Math.round(i.getBoundingClientRect().height));
    if (items.length < 2) return;
    const d = Math.max(...hs) - Math.min(...hs);
    if (d > ${TOL}) {
      const n = g.closest('.block') && g.closest('.block').querySelector('h3');
      inside.push({ what: (n ? n.textContent : 'a question grid').trim().slice(0, 32), d: d,
                    items: hs.join(' / ') });
    }
  });
  document.querySelectorAll('.content-area .gap').forEach(el => {
    const want = el.getBoundingClientRect().width;
    const cell = el.closest('.rows') && el.closest('.rows').children;
    let have = 0;
    for (const c of (cell || [])) if (c.contains(el)) have = c.getBoundingClientRect().width;
    if (have && want > have + 2) {
      const n = el.closest('.block') && el.closest('.block').querySelector('h3');
      inside.push({ what: 'answer line in ' + (n ? n.textContent.trim().slice(0, 20) : 'a block'),
                    d: 0, items: Math.round(want) + 'px wants > ' + Math.round(have) + 'px of cell' });
    }
  });
  /* SECOND READ — the authored page. clean() restores widths, align-self, the centred cell and the margins
     the spacing lever wrote; run is then a no-op so a late font cannot put the solver back. */
  E.clean(document);
  E.run = function () {};
  const out = [];
  document.querySelectorAll(SEL).forEach((r, i) => {
    const cs = Array.prototype.slice.call(r.children);
    if (cs.length < 2) { out.push({ row: i + 1, cells: [] }); return; }
    const prev = cs.map(c => c.style.alignSelf);
    cs.forEach(c => { c.style.alignSelf = 'flex-start'; });
    const cells = cs.map((c, j) => {
      const h3 = c.querySelector('h3');
      const first = c.querySelector('p,li,td');
      const label = h3 ? h3.textContent.trim()
        : (first ? first.textContent.trim() : '(empty)');
      /* a cell may hold more than one block: read each one, so a stacked column reports its parts and
         not just their sum */
      const blocks = Array.prototype.slice.call(c.children).filter(b => b.classList.contains('block'));
      const parts = blocks.length > 1 ? blocks.map(b => {
        const t = b.querySelector('h3');
        return { head: (t ? t.textContent : '?').trim().slice(0, 24), h: Math.round(b.getBoundingClientRect().height) };
      }) : null;
      const s = (solved[i] && solved[i][j]) || { w: Math.round(c.getBoundingClientRect().width), squeeze: [] };
      return { h: Math.round(c.getBoundingClientRect().height), head: label.slice(0, 34),
               w: s.w, authoredW: Math.round(c.getBoundingClientRect().width), parts: parts, squeeze: s.squeeze };
    });
    cs.forEach((c, j) => { if (prev[j]) c.style.alignSelf = prev[j]; else c.style.removeProperty('align-self'); });
    out.push({ row: i + 1, cells });
  });
  return JSON.stringify({ rows: out, inside: inside });
})()`;

/** print one lesson's rows; return the uneven ones */
function report(rows) {
  const bad = [];
  for (const r of rows) {
    if (!r.cells || r.cells.length < 2) continue;
    const hs = r.cells.map(c => c.h);
    const d = Math.max(...hs) - Math.min(...hs);
    const squz = [];
    r.cells.forEach(c => (c.squeeze || []).forEach(s => squz.push(
      s.what + ' wants ' + s.want + 'px in ' + s.have + 'px' + (s.rows > 1 ? ' (chips on ' + s.rows + ' rows)' : ''))));
    const squeeze = squz.length > 0;
    if (d <= TOL && !VERBOSE && !squeeze) continue;
    const short = r.cells.filter(c => c.h < Math.max(...hs) - TOL).map(c => {
      const gapPx = Math.max(...hs) - c.h;
      if (c.parts && c.parts.length) {
        const last = c.parts[c.parts.length - 1].head;
        return c.head + ' (last block there: ' + last + ' — ' + gapPx + 'px)';
      }
      return c.head + ' (' + gapPx + 'px)';
    });
    const parts = r.cells.map(c => (c.parts ? ' {' + c.parts.map(p => p.head + ' ' + p.h).join(' + ') + '}' : ''));
    console.log('  ' + (d > TOL ? '**' : squeeze ? '~~' : '  ') + ' row ' + String(r.row).padStart(2) + '  d=' + String(d).padStart(3) + 'px  ' +
      r.cells.map((c, i) => c.head + parts[i] + ' [' + c.h + ' / ' + c.w + 'w]').join('   |   ') +
      (short.length ? '   -> short: ' + short.join(' / ') : '') +
      (squeeze ? '   -> squeeze: ' + squz.join('; ') : ''));
    if (d > TOL || squeeze) bad.push({ row: r.row, d, short, squeeze: squz });
  }
  return bad;
}

async function main() {
  const tracks = pickTracks();
  const named = pickLessonsFlag();
  const jobs = [];
  for (const t of tracks) {
    const have = lessonsOnDisk(t);
    const nums = named && named.length ? named.filter(n => have.includes(n)) : have;
    for (const n of nums) { const f = lessonFile(t, n); if (f) jobs.push({ track: t, n, file: f }); }
  }
  if (!jobs.length) { console.log('align: nothing to measure (no lesson page in scope)'); return; }
  console.log('align: ' + jobs.length + ' page(s), tolerance ' + TOL + 'px, widths ' + WIDTHS.join(' / '));

  const site = await serveRepo();
  const basePort = 9300 + (process.pid % 200);
  const failing = [];
  try {
    for (const w of WIDTHS) {
      const b = await openBrowser(basePort + (w % 7));
      await b.send('Page.enable', {}, b.sid);
      await b.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: false }, b.sid);
      console.log('\n-- width ' + w + 'px');
      for (const j of jobs) {
        const sig = h(EMAIL + j.track + SECRET);
        /* one seed per navigation, written unconditionally: the newest script runs last, so the gate in
           sessionStorage always names the track of the page about to be loaded */
        await b.send('Page.addScriptToEvaluateOnNewDocument', {
          source: `sessionStorage.gate = JSON.stringify({ email: ${JSON.stringify(EMAIL)}, track: ${JSON.stringify(j.track)}, teacher: false, sig: ${sig} });`,
        }, b.sid);
        const url = 'http://127.0.0.1:' + site.port + '/' + j.track + '/' + encodeURIComponent(path.basename(j.file)) + '?v=' + Date.now();
        await b.send('Page.navigate', { url }, b.sid);
        let ready = false;
        for (let i = 0; i < 60 && !ready; i++) {
          const r = await b.send('Runtime.evaluate', {
            expression: "document.documentElement.classList.contains('eq-ready')", returnByValue: true }, b.sid);
          ready = !!(r.result && r.result.result && r.result.result.value === true);
          if (!ready) await sleep(200);
        }
        if (!ready) { console.log('  ?? ' + j.track + ' ' + j.n + ' — the page never reached eq-ready'); failing.push({ j, w }); continue; }
        const ev = await b.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true }, b.sid);
        const val = ev.result && ev.result.result && ev.result.result.value;
        if (!val) { console.log('  ?? ' + j.track + ' ' + j.n + ' — no reading'); continue; }
        const data = JSON.parse(val);
        if (data.error) { console.log('  ?? ' + j.track + ' ' + j.n + ' — ' + data.error); continue; }
        console.log(' ' + j.track + ' ' + j.n + ':');
        const bad = report(data.rows);
        if (data.inside && data.inside.length) {
          for (const s of data.inside) {
            console.log('  ** inside  ' + s.what + '  ' + (s.d ? 'items ' + s.items + ' (d=' + s.d + 'px)' : s.items));
          }
          bad.push({ row: 'inside', d: 0, short: [], squeeze: data.inside.map(s => s.what + ' — ' + s.items) });
        }
        if (bad.length) failing.push({ j, w, bad });
      }
      b.close();
    }
  } finally { site.srv.close(); }

  if (!failing.length) { console.log('\nalign: every measured row is within ' + TOL + 'px at ' + WIDTHS.join(' and ') + 'px'); return; }
  /* exit codes are set, never called: on Windows a pipe is written asynchronously and process.exit()
     would throw the report away */
  console.log('\nalign: ' + failing.length + ' uneven row reading(s) across ' +
    new Set(failing.map(f => f.j.track + ' ' + f.j.n)).size + ' lesson(s)');
  process.exitCode = 1;
}

main().catch(e => { console.error('align: ' + (e && e.stack || e)); process.exitCode = 1; });
