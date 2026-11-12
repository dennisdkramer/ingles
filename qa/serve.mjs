/**
 * qa/serve.mjs — the preview pages, served so the note boxes write qa/NOTES.md with no dialog.
 *
 * Why this exists: a page opened by double-click is a `file://` document, and a write to the disk from
 * there needs a picker gesture plus a per-visit permission grant that is easy to lose — the boxes look
 * connected and then ignore you. Served from here, `notes.js` talks to two endpoints instead, so typing
 * in a box IS a write to the file: no picker, no permission, no IndexedDB handle to re-grant.
 *
 *   node qa/serve.mjs                 serve the repo on 127.0.0.1:8137 and open preview-blocks.html
 *   node qa/serve.mjs --no-open       serve only (the URL is printed)
 *   node qa/serve.mjs --port 8200     a different port
 *
 * Endpoints (bound to loopback by construction — nothing on the network can reach them):
 *   GET  /__qa-notes/ping   { ok, file }        what notes.js probes for; another static server answers 404
 *   GET  /__qa-notes        the markdown       what the boxes read, every 2 s
 *   POST /__qa-notes        the markdown       written temp-then-renamed, so a dropped tab cannot half-write
 *   GET  /__qa-brief        the menu's index   the same parse `node qa/brief.mjs --index` prints, because
 *                                              both call qa/menu.mjs — this is what the preview page's nav
 *                                              and the line above each block are a readout of (qa/readout.js)
 *
 * Everything else is the repo, unchanged: the page, style.css, the engines, logo.png.
 *
 * This is authoring chrome. It touches no lesson page and no engine, and a lesson opened from the
 * filesystem still works with no server at all.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { readMenu } from './menu.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOTES = path.join(ROOT, 'qa', 'NOTES.md');
const PAGE = '/qa/preview-blocks.html?notes=server';
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const argv = process.argv.slice(2);
const portAt = argv.indexOf('--port');
const PORT = Number(portAt >= 0 ? argv[portAt + 1] : (process.env.PORT || 8137));
const OPEN = !argv.includes('--no-open') && !argv.includes('--no-browser');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2'
};

/** a write that would destroy the file is refused: the header is the proof this is still qa/NOTES.md */
function plausible(text) {
  return typeof text === 'string' && text.length > 0 &&
    text.indexOf('# Preview notes') === 0 && /^###[ \t]/m.test(text);
}

function sections(text) { const m = String(text).match(/^###[ \t]/gm); return m ? m.length : 0; }

function saveNotes(text) {
  const tmp = NOTES + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, NOTES);                 // same volume: the swap is atomic, no half-file is ever read
  const n = sections(text);
  console.log(new Date().toLocaleTimeString() + '  qa/NOTES.md written · ' +
    Buffer.byteLength(text) + ' bytes · ' + n + ' section' + (n === 1 ? '' : 's'));
}

function json(res, code, body) {
  const out = JSON.stringify(body);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(out);
}

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent((req.url || '/').split('?')[0]);

  if (rel === '/__qa-notes/ping') return json(res, 200, { ok: true, file: 'qa/NOTES.md' });

  /* the preview pages' nav: the index the brief prints, from the one parser the brief uses */
  if (rel === '/__qa-brief') {
    try { return json(res, 200, readMenu()); }
    catch (e) { return json(res, 500, { ok: false, error: 'cannot read the menu: ' + e.message }); }
  }

  if (rel === '/__qa-notes') {
    if (req.method === 'GET' || req.method === 'HEAD') {
      let text;
      try { text = fs.readFileSync(NOTES, 'utf8'); }
      catch (e) { return json(res, 500, { ok: false, error: 'cannot read qa/NOTES.md: ' + e.message }); }
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(req.method === 'HEAD' ? undefined : text);
    }
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'GET or POST only' });
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (c) => { body += c; if (body.length > 4e6) req.destroy(); });
    req.on('end', () => {
      if (!plausible(body)) return json(res, 400, { ok: false, error: 'refused: not a qa/NOTES.md document' });
      try { saveNotes(body); }
      catch (e) { return json(res, 500, { ok: false, error: e.message }); }
      return json(res, 200, { ok: true, bytes: Buffer.byteLength(body), sections: sections(body) });
    });
    return;
  }

  const target = path.resolve(ROOT, '.' + (rel === '/' ? PAGE : rel));
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { 'content-type': 'text/plain' }); return res.end('outside the repo');
  }
  fs.stat(target, (err, st) => {
    const file = err ? null : (st.isDirectory() ? path.join(target, 'index.html') : target);
    if (!file) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('not found: ' + rel); }
    fs.readFile(file, (e2, buf) => {
      if (e2) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('not found: ' + rel); }
      res.writeHead(200, {
        'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'cache-control': 'no-store'
      });
      res.end(buf);
    });
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('port ' + PORT + ' is already in use — qa/serve.mjs is probably already running.');
    console.log('  open: http://127.0.0.1:' + PORT + PAGE + '   (or: node qa/serve.mjs --port 8200)');
    process.exit(0);
  }
  console.log('qa/serve.mjs could not start: ' + e.message);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  const url = 'http://127.0.0.1:' + PORT + PAGE;
  console.log('qa/serve.mjs — ' + ROOT);
  console.log('  notes: ' + NOTES);
  console.log('  open:  ' + url);
  console.log('  stop:  Ctrl+C');
  if (!OPEN) return;
  try {
    const p = spawn(CHROME, [url], { detached: true, stdio: 'ignore' });
    p.on('error', () => console.log('  (could not start Chrome — open the URL above by hand)'));
    p.unref();
  } catch (e) { console.log('  (could not start Chrome — open the URL above by hand)'); }
});
