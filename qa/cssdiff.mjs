/**
 * qa/cssdiff.mjs — the computed-style gate for style.css.
 *
 * WHY THIS EXISTS. The style.css sweep moves rules between categories. Moving a rule changes the
 * cascade without changing a single declaration, so a text diff reads "I moved it" — the most
 * harmless-looking diff there is — while a later rule of equal specificity silently starts winning.
 * This records what the browser ACTUALLY computes for every element of a page and compares a later
 * run against that record. It judges nothing about the design; it answers exactly one question:
 * did a computed value change, and on which element.
 *
 * Run:  node qa/cssdiff.mjs --save        record the baseline for the default pages
 *       node qa/cssdiff.mjs              compare against that baseline; exit 1 on any difference
 *       node qa/cssdiff.mjs --page=<rel> [--page=<rel>]      a narrower reach
 *       node qa/cssdiff.mjs --selftest   prove the gate detects change AND is stable on a rerun
 *
 * The baseline (qa/.css-baseline.json) is deliberately NOT committed: it is only meaningful against
 * the working tree it was taken from. Record before an edit, compare after it.
 */
import { qaOff } from './off.mjs'; qaOff('cssdiff'); /* QA OFF - see qa/off.mjs */
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASELINE = path.join(__dirname, '.css-baseline.json');
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* two pages cover the sheet's consumers: the block catalogue, games included, and a real lesson */
const DEFAULT_PAGES = ['qa/preview-blocks.html', 'business/lesson40.html'];

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
    '--disable-extensions', '--mute-audio', '--force-device-scale-factor=1', 'about:blank'];
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

/* Every element, keyed by its position, hashed over the properties a cascade change can move.
   Transitions and animations are switched OFF first: they are timing, not style, and a petal
   mid-float would differ between two runs of an unchanged file. The injected rule is identical in
   every run, so it cannot hide a real difference — it only removes the noise. */
const QUIET = '*{transition:none !important;animation:none !important;caret-color:transparent !important}';

const PAGE = `(function(){
  var PROPS = ['display','position','top','right','bottom','left','float','z-index','opacity',
    'margin-top','margin-right','margin-bottom','margin-left',
    'padding-top','padding-right','padding-bottom','padding-left',
    'width','height','min-width','max-width','min-height','max-height',
    'background-color','color','border-top-width','border-top-style','border-top-color',
    'border-radius','font-family','font-size','font-weight','font-style','line-height',
    'text-align','text-decoration-line','white-space','letter-spacing','vertical-align',
    'flex-direction','flex-wrap','justify-content','align-items','flex-grow','flex-shrink',
    'grid-template-columns','grid-auto-flow','gap','overflow-x','overflow-y','visibility'];
  function key(el){
    var p = [], n = el;
    while (n && n !== document.documentElement){
      var i = 1, s = n;
      while ((s = s.previousElementSibling)) if (s.tagName === n.tagName) i++;
      p.unshift(n.tagName.toLowerCase() + i);
      n = n.parentElement;
    }
    return p.join('>') || 'html';
  }
  function h(s){ var x = 0; for (var i = 0; i < s.length; i++){ x = (x * 31 + s.charCodeAt(i)) | 0 } return (x >>> 0).toString(36) }
  var rows = {}, named = {}, all = document.querySelectorAll('*');
  for (var i = 0; i < all.length; i++){
    var el = all[i], t = el.tagName;
    if (t === 'SCRIPT' || t === 'STYLE' || t === 'META' || t === 'LINK' || t === 'TITLE') continue;
    var cs = getComputedStyle(el), v = [];
    for (var j = 0; j < PROPS.length; j++) v.push(cs.getPropertyValue(PROPS[j]));
    var k = key(el);
    rows[k] = h(v.join(';'));
    /* a human name, so a finding names what changed instead of an index path */
    var cls = (el.getAttribute && el.getAttribute('class') || '').trim().split(/\\s+/).slice(0, 2).join('.');
    named[k] = t.toLowerCase() + (cls ? '.' + cls : '') + (el.id ? '#' + el.id : '');
  }
  return { count: Object.keys(rows).length, rows: rows, named: named };
})()`;

const has = n => process.argv.includes('--' + n);

const pack = m => Object.keys(m.rows).sort().map(k => k + ':' + m.rows[k]).join(',');
const unpack = s => { const o = {}; if (!s) return o; for (const pair of s.split(',')) { const i = pair.lastIndexOf(':'); o[pair.slice(0, i)] = pair.slice(i + 1) } return o };

function diff(before, after) {
  const out = [];
  for (const k of Object.keys(after)) if (before[k] !== after[k]) out.push(k);
  for (const k of Object.keys(before)) if (!(k in after)) out.push(k);
  return out;
}

async function main() {
  const pages = process.argv.filter(x => x.startsWith('--page=')).map(x => x.slice(7));
  const wanted = pages.length ? pages : DEFAULT_PAGES;
  const save = has('save'), self = has('selftest');
  if (!save && !self && !fs.existsSync(BASELINE)) {
    console.log('❌ no baseline at ' + path.relative(ROOT, BASELINE));
    console.log('   record one first:  node qa/cssdiff.mjs --save');
    process.exit(1);
  }

  const site = await server();
  const base = 'http://127.0.0.1:' + site.port;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cssdiff-'));
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
  /* An activity that places art or shuffles options with Math.random() lays out differently on every
     load, and a page whose DOM grows after a fixed sleep is measured mid-build. Both read as "the
     cascade changed" when nothing changed. The pin is a CONSTANT, not a seeded sequence: a seeded generator only reproduces a shuffle while its CALL ORDER is stable, and an async load reorders the calls. */
  await ses.send('Page.addScriptToEvaluateOnNewDocument', {
    source: '(function(){Math.random=function(){return 0.5}})()'
  });

  const count = async () => {
    const r = await ses.send('Runtime.evaluate', { expression: 'document.querySelectorAll("*").length', returnByValue: true });
    return (r.result && r.result.value) || 0;
  };

  /* wait for the DOM to stop growing rather than for a guessed number of milliseconds: three
     identical counts over 2s means the page has finished building itself (three samples is not enough: lesson40 inserts nodes about a second in) */
  const settle = async () => {
    let last = -1, same = 0;
    for (let i = 0; i < 40; i++) {
      const n = await count();
      same = n === last ? same + 1 : 0;
      last = n;
      if (same >= 8) return n;
      await sleep(250);
    }
    return last;
  };

  const measure = async (rel, extraCss) => {
    await ses.send('Page.navigate', { url: base + '/' + rel });
    await settle();
    try {
      await ses.send('Runtime.evaluate', {
        expression: '(document.fonts?Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,2500)})]):Promise.resolve()).then(function(){return 1})',
        awaitPromise: true, returnByValue: true
      });
    } catch (e) { }
    const css = QUIET + (extraCss || '');
    await ses.send('Runtime.evaluate', {
      expression: '(function(){var s=document.createElement("style");s.id="cssdiff-quiet";s.textContent=' + JSON.stringify(css) + ';document.head.appendChild(s);return 1})()',
      returnByValue: true
    });
    await sleep(150);
    const r = await ses.send('Runtime.evaluate', { expression: PAGE, returnByValue: true });
    return (r.result && r.result.value) || { count: 0, rows: {}, named: {} };
  };

  const finish = async code => {
    try { cdp.ws.close(); } catch (e) { }
    try { chrome.proc.kill(); } catch (e) { }
    await site.close();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
    process.exit(code);
  };

  if (self) {
    /* The gate has two things to prove and neither is "it ran": that it SEES a change, and that it is
       STABLE on an unchanged file. A tool that reports "no differences" for both is worthless. */
    const rel = wanted[0];
    const a = await measure(rel, null);
    const b = await measure(rel, '.content-area p,.content-area li,.content-area td{letter-spacing:1.5px !important}');
    const c = await measure(rel, null);
    const seen = diff(unpack(pack(a)), unpack(pack(b))).length;
    const stable = diff(unpack(pack(a)), unpack(pack(c))).length;
    const ok1 = seen > 0, ok2 = stable === 0;
    console.log((ok1 ? '✅ ' : '❌ ') + 'a real style change is seen: ' + seen + ' element(s) differ (must be > 0)');
    console.log((ok2 ? '✅ ' : '❌ ') + 'an unchanged rerun is identical: ' + stable + ' difference(s) (must be 0)');
    console.log(ok1 && ok2 ? '✅ selftest green on ' + a.count + ' elements of ' + rel : '❌ selftest FAILED');
    await finish(ok1 && ok2 ? 0 : 1);
  }

  if (save) {
    const out = {};
    for (const rel of wanted) {
      if (!fs.existsSync(path.join(ROOT, rel))) { console.log('⚠️  skipped (no such page): ' + rel); continue; }
      const m = await measure(rel, null);
      out[rel] = { count: m.count, rows: pack(m) };
      console.log('recorded ' + rel + ' — ' + m.count + ' elements');
    }
    fs.writeFileSync(BASELINE, JSON.stringify(out));
    const kb = Math.round(fs.statSync(BASELINE).size / 1024);
    console.log('✅ baseline written: ' + path.relative(ROOT, BASELINE) + ' (' + kb + ' KB, ' + Object.keys(out).length + ' page(s))');
    await finish(0);
  }

  const before = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  let fails = 0;
  for (const rel of Object.keys(before)) {
    if (!fs.existsSync(path.join(ROOT, rel))) { console.log('⚠️  ' + rel + ' — page gone; baseline entry skipped'); continue; }
    const m = await measure(rel, null);
    const d = diff(unpack(before[rel].rows), unpack(pack(m)));
    if (!d.length && before[rel].count === m.count) { console.log('✅ ' + rel + ' — identical, ' + m.count + ' elements'); continue; }
    fails += d.length || 1;
    console.log('❌ ' + rel + ' — ' + d.length + ' element(s) changed' + (before[rel].count !== m.count ? ' (element count ' + before[rel].count + ' → ' + m.count + ')' : ''));
    for (const k of d.slice(0, 12)) console.log('     ' + (m.named[k] || k) + '   [' + k + ']');
    if (d.length > 12) console.log('     … and ' + (d.length - 12) + ' more');
  }
  console.log(fails === 0 ? '✅ the cascade is unchanged everywhere the baseline covers'
    : '❌ ' + fails + ' computed-style change(s) — the sweep moved something it should not have');
  await finish(fails ? 1 : 0);
}

main().catch(e => { console.error('crashed:', e.message); process.exit(1); });


