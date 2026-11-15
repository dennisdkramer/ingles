/**
 * generation/checks/measure.mjs — the row-void check, in a real headless Chrome.
 *
 * THE PROBLEM IT NAMES: a row whose blocks end at different heights (the gap under the shorter
 * block) and a frame taller than its own content (the gap inside it). CSS alone cannot be read for
 * either — both exist only after layout.
 *
 * PRINTS, per page: every multi-block row's bottom delta (0 = frames end on one line) and every
 * block whose last line stops more than 60px above its frame's bottom edge.
 * EXIT 1 when any row is ragged, so a harness can gate on it.
 *
 * Run from the repo root, page paths relative to it:
 *   node generation/checks/measure.mjs adult/lesson30-....html preview.html
 *   $env:REVERT=1   re-injects `align-items:start` to print the pre-stretch baseline
 *
 * Not part of the site. No dependency, no repo write: Node's global WebSocket drives Chrome over CDP,
 * the page is opened as file://, and animations plus content-visibility are neutralised so the
 * numbers are layout only (a scroll-linked `translate` otherwise moves a rect without moving a box).
 */
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function launch(profile) {
  const args = ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--window-size=1500,1100', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-extensions', '--mute-audio',
    '--hide-scrollbars', 'about:blank'];
  const proc = spawn(CHROME, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let buf = '';
    const onData = d => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) { proc.stderr.off('data', onData); resolve({ proc, ws: m[1] }); }
    };
    proc.stderr.on('data', onData);
    proc.on('error', reject);
    setTimeout(() => reject(new Error('no DevTools endpoint:\n' + buf)), 20000);
  });
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const c = {
      ws, id: 0, waiters: new Map(),
      send(method, params = {}, sessionId) {
        const id = ++c.id;
        return new Promise((res, rej) => {
          c.waiters.set(id, { res, rej, method });
          ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
          setTimeout(() => { if (c.waiters.has(id)) { c.waiters.delete(id); rej(new Error('CDP timeout: ' + method)); } }, 30000);
        });
      }
    };
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      const w = m.id && c.waiters.get(m.id);
      if (w) { c.waiters.delete(m.id); m.error ? w.rej(new Error(w.method + ': ' + JSON.stringify(m.error))) : w.res(m.result); }
    });
    ws.addEventListener('error', e => reject(new Error('ws error: ' + (e.message || 'unknown'))));
    ws.addEventListener('open', () => resolve(c));
  });
}

const MEASURE = `(function(){
  var secs = [].slice.call(document.querySelectorAll('.content-area > section')), out = {rows: [], blocks: []};
  secs.forEach(function(sec){
    var h2 = sec.querySelector('h2');
    var label = h2 ? h2.textContent.trim().replace(/\\s+/g,' ').slice(0,20) : '?';
    [].slice.call(sec.querySelectorAll('.itemrow')).forEach(function(row, ri){
      var bs = [].slice.call(row.children).filter(function(el){ return el.classList.contains('block'); });
      var bot = bs.map(function(b){ return b.getBoundingClientRect().bottom; });
      out.rows.push({s: label, r: ri, n: bs.length,
        kids: bs.map(function(b){ var cs = getComputedStyle(b);
          return {c: String(b.className).replace(/\s+/g,'.'), id: b.querySelector('h3,h4') ? 1 : 0,
            h: Math.round(b.getBoundingClientRect().height), as: cs.alignSelf, hs: cs.height, mn: cs.minHeight}; }),
        d: bot.length > 1 ? Math.round(Math.max.apply(null,bot) - Math.min.apply(null,bot)) : 0});
    });
    [].slice.call(sec.querySelectorAll('.block')).forEach(function(b){
      var r = b.getBoundingClientRect(), cs = getComputedStyle(b), kids = [].slice.call(b.children);
      var drawn = kids.filter(function(k){ var q = k.getBoundingClientRect(); return q.width > 0 && q.height > 0; });
      var last = drawn[drawn.length-1];
      var inner = r.bottom - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingBottom);
      var t = b.querySelector('h3,h4');
      out.blocks.push({s: label, t: (t ? t.textContent : '-').trim().replace(/\\s+/g,' ').slice(0,30),
        w: (b.className.match(/itemsize-\\w+/) || ['full'])[0].replace('itemsize-',''),
        h: Math.round(r.height), v: last ? Math.round(inner - last.getBoundingClientRect().bottom) : 0});
    });
  });
  return out;
})()`;

const pages = process.argv.slice(2);
if (!pages.length) throw new Error('usage: node measure.mjs <page.html> [...]');
const { proc, ws } = await launch(path.join(os.tmpdir(), 'measure-profile-' + Date.now()));
const cdp = await connect(ws);
const { targetInfos } = await cdp.send('Target.getTargets');
const page = targetInfos.find(t => t.type === 'page');
const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
const ses = { send: (m, p = {}) => cdp.send(m, p, sessionId) };
await ses.send('Page.enable');
await ses.send('Runtime.enable');
await ses.send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 1100, deviceScaleFactor: 1, mobile: false });

let fail = 0;
for (const p of pages) {
  await ses.send('Page.navigate', { url: pathToFileURL(path.resolve(p)).href });
  for (let i = 0; i < 120; i++) {
    const r = await ses.send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
    const n = await ses.send('Runtime.evaluate', { expression: 'document.querySelectorAll(".block").length', returnByValue: true });
    if (r.result.value === 'complete' && n.result.value > 0) break;
    await sleep(150);
  }
  await ses.send('Runtime.evaluate', {
    expression: `(function(){var s=document.createElement('style');s.id='vis';
      s.textContent='*,*::before,*::after{animation:none!important;transition:none!important}' +
        '.content-area>section{content-visibility:visible!important}' + ${JSON.stringify(process.env.REVERT ? '.itemrow{align-items:start}' : '')};
      document.head.appendChild(s);return 1})()`,
    returnByValue: true
  });
  await sleep(350);
  const v = (await ses.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true })).result.value;
  const rows = v.rows.filter(x => x.n > 1);
  const bad = rows.filter(x => x.d > 0);
  const voids = v.blocks.filter(b => b.v > 60).sort((a, b) => b.v - a.v);
  console.log('\n### ' + path.basename(p));
  console.log('multi-block rows: ' + rows.map(x => x.s + '#' + x.r + '=' + x.d).join('  '));
  console.log('delta>0: ' + bad.length + '/' + rows.length + '   blocks: ' + v.blocks.length);
  console.log('void>60: ' + (voids.length ? voids.map(b => b.s + ' "' + b.t + '" ' + b.w + ' ' + b.h + 'px v' + b.v).join('; ') : 'none'));
  for (const row of bad) console.log('  ragged ' + row.s + '#' + row.r + ': ' + row.kids.map(k => k.h + 'px(' + k.as + ',h=' + k.hs + ',min=' + k.mn + ')').join(' | '));
  if (bad.length) fail++;
}
await ses.send('Browser.close').catch(() => { });
proc.kill();
console.log('\nresult: ' + (fail ? 'FAIL - ' + fail + ' page(s) still ragged' : 'PASS - every row ends on one line'));
setTimeout(() => process.exit(fail ? 1 : 0), 300);
