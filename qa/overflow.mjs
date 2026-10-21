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
      let fp = path.join(ROOT, urlPath === '/' ? 'portal.html' : urlPath);
      if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(fp, (e, d) => {
        if (e) { res.writeHead(404); res.end(); return; }
        const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
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
  var out = [];
  document.querySelectorAll('.panels').forEach(function(panels){
    var pw = panels.getBoundingClientRect().width;
    [].slice.call(panels.querySelectorAll(':scope > .panel')).forEach(function(p){
      var r = p.getBoundingClientRect();
      var ex = (p.querySelector('.ex-head') || {}).textContent || '';
      out.push({
        full: p.classList.contains('full'),
        w: Math.round(r.width),
        h: Math.round(r.height),
        half: Math.round(pw / 2),
        over: p.scrollWidth - p.clientWidth,
        ex: ex.replace(/\\s+/g, ' ').slice(0, 60)
      });
    });
  });
  return out;
})()`;

async function main() {
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

  let fails = 0;
  for (let L = 1; L <= 10; L++) {
    await ses.send('Page.navigate', { url: base + '/business/lesson' + L + '.html' });
    await sleep(1300);
    const r = await ses.send('Runtime.evaluate', { expression: MEASURE, returnByValue: true });
    const panels = (r.result && r.result.value) || [];
    // Overflow is checked on EVERY panel — including .panel.full, which is exactly where the
    // long translation/listening option rows used to spill. Only the "balloon" check (a half-width
    // panel that has grown wider than half the container) is restricted to non-full panels.
    const bad = panels.filter(p => p.over > 8 || (!p.full && p.w > p.half + 8));
    if (bad.length) {
      console.log('lesson ' + L + ':');
      bad.forEach(p => { fails++; console.log('    ' + (p.over > 8 ? 'OVERFLOW' : 'BALLOON') + '  full=' + p.full + ' w=' + p.w + ' h=' + p.h + ' half=' + p.half + ' over=' + p.over + '  «' + p.ex + '»'); });
    }
  }

  try { cdp.ws.close(); } catch (e) { }
  try { chrome.proc.kill(); } catch (e) { }
  await site.close();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
  console.log(fails === 0 ? '✅ no overflow across lessons 1-10' : '❌ ' + fails + ' overflowing panel(s)');
  process.exit(fails ? 1 : 0);
}

main().catch(e => { console.error('crashed:', e.message); process.exit(1); });

