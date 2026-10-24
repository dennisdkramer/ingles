/**
 * qa/render.mjs — capture full-page screenshots of business lessons for the visual (step-4/5) pass.
 * Run with: node qa/render.mjs [lessonNumber ...]   (no numbers = all 45)
 * Writes PNGs to _renders/lessonN.png (gitignored — delete after verification).
 * $env:CHROME="C:\path\to\chrome.exe"   override the browser
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '_renders');
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SECRET = 'abreportas2025';
const EMAIL = 'render.qa@test.com';
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
        const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
        res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' });
        res.end(d);
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve({ port: srv.address().port, close: () => new Promise(r => srv.close(r)) }));
  });
}

function launchChrome(profile) {
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--window-size=1400,1000', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio', 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let buf = '';
    proc.stderr.on('data', d => { buf += d.toString(); const m = buf.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (m) resolve({ proc, browserWs: m[1] }); });
    proc.on('error', reject);
    setTimeout(() => reject(new Error('no devtools endpoint:\n' + buf)), 20000);
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
          setTimeout(() => { if (c.waiters.has(id)) { c.waiters.delete(id); rej(new Error('CDP timeout: ' + method)) } }, 30000);
        });
      }
    };
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.id) { const w = c.waiters.get(m.id); if (w) { c.waiters.delete(m.id); m.error ? w.rej(new Error(w.method + ': ' + JSON.stringify(m.error))) : w.res(m.result) } }
    });
    ws.addEventListener('error', e => reject(new Error('ws error: ' + (e.message || 'unknown'))));
    ws.addEventListener('open', () => resolve(c));
  });
}

async function main() {
  const site = await server();
  const base = 'http://127.0.0.1:' + site.port;
  const gate = { email: EMAIL, track: TRACK, teacher: false, sig: h(EMAIL + TRACK + SECRET) };
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'rnd-'));
  fs.mkdirSync(OUT, { recursive: true });
  const chrome = await launchChrome(profile);
  const cdp = await connect(chrome.browserWs);
  const { targetInfos } = await cdp.send('Target.getTargets');
  const page = targetInfos.find(t => t.type === 'page' && t.url.indexOf('devtools') < 0) || targetInfos.find(t => t.type === 'page');
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
  const ses = { send: (m, p = {}) => cdp.send(m, p, sessionId) };
  await ses.send('Page.enable');
  await ses.send('Page.addScriptToEvaluateOnNewDocument', { source: 'try{sessionStorage.setItem("gate",JSON.stringify(' + JSON.stringify(gate) + '))}catch(e){}' });

  const targets = process.argv.slice(2).map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 45);
  const lessons = targets.length ? targets : Array.from({ length: 45 }, (_, i) => i + 1);

  for (const L of lessons) {
    await ses.send('Page.navigate', { url: base + '/business/lesson' + L + '.html' });
    await sleep(1500);
    const shot = await ses.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(path.join(OUT, 'lesson' + L + '.png'), Buffer.from(shot.data, 'base64'));
    console.log('rendered lesson' + L + ' -> _renders/lesson' + L + '.png');
  }

  try { cdp.ws.close(); } catch (e) {}
  try { chrome.proc.kill(); } catch (e) {}
  await site.close();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  console.log('screenshots saved to _renders/');
}
main().catch(e => { console.error('crashed:', e.message); process.exit(1); });
