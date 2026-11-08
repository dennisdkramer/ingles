/* qa/_live/gameshot.mjs — throwaway probe: open lesson 10 in real headless Chrome, press Start,
   force one takeoff, and photograph the stage. Not a harness (gitignored); just an eyeball aid. */
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PAGE = process.argv[2] || 'business/lesson10.html';
const OUT = process.argv[3] || path.join(__dirname, 'game.png');

function server() {
  return new Promise(res => {
    const s = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      fs.readFile(p, (e, d) => {
        if (e) { rsp.writeHead(404); return rsp.end('no'); }
        const ext = path.extname(p);
        rsp.writeHead(200, { 'Content-Type': ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : ext === '.png' ? 'image/png' : 'text/html' });
        rsp.end(d);
      });
    });
    s.listen(0, () => res({ s, port: s.address().port }));
  });
}
function connect(url) {
  return new Promise((res, rej) => {
    const ws = new WebSocket(url);
    let id = 0; const wait = new Map();
    ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m.result !== undefined ? m.result : m); wait.delete(m.id); } };
    ws.onerror = rej;
    ws.onopen = () => res({
      send: (method, params = {}, sessionId) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify(sessionId ? { id: i, method, params, sessionId } : { id: i, method, params })); }),
      close: () => ws.close()
    });
  });
}

const { s, port } = await server();
const profile = path.join(__dirname, 'profile-shot-' + Date.now());
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
  '--no-first-run', '--no-default-browser-check', '--window-size=1500,1200', 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
const ws = await new Promise(res => { let b = ''; proc.stderr.on('data', d => { b += d; const m = b.match(/ws:\/\/[^\s]+/); if (m) res(m[0]); }); });

const cdp = await connect(ws);
const { targetInfos } = await cdp.send('Target.getTargets');
const page = targetInfos.find(t => t.type === 'page');
const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
const ses = (m, p = {}) => cdp.send(m, p, sessionId);
await ses('Page.enable'); await ses('Runtime.enable');
function h(s) { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return x; }
const SIG = h('shot@test.com' + 'business' + 'abreportas2025');
await ses('Page.addScriptToEvaluateOnNewDocument', { source: 'try{sessionStorage.setItem("gate",JSON.stringify({email:"shot@test.com",track:"business",teacher:true,sig:' + SIG + '}))}catch(e){}' });
await ses('Page.navigate', { url: `http://localhost:${port}/${PAGE}` });
await new Promise(r => setTimeout(r, 2500));
await ses('Runtime.evaluate', { expression: 'document.querySelector(".game-start").click()' });
await new Promise(r => setTimeout(r, 1200));
await ses('Runtime.evaluate', { expression: 'window.__G[0].hooks.takeoff()' });
await new Promise(r => setTimeout(r, 900));
const shot = await ses('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
console.log('game screenshot → ' + OUT);
try { proc.kill(); } catch { }
s.close();
process.exit(0);
