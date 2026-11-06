/**
 * qa/notes.mjs — serve the repo, and write the preview pages' note boxes back into their files.
 *
 * The two preview pages carry one `textarea.qa-note` per item (data-item="<name>"). qa/notes.js
 * posts each box here as it is typed; this server rewrites that box's text INSIDE the page's own
 * .html file, so a note lives in the repo and can be read like any other line — and nothing is
 * stored anywhere else.
 *
 *   node qa/notes.mjs                 → http://127.0.0.1:8130/qa/preview-games4.html
 *                                       http://127.0.0.1:8130/qa/preview-blocks.html
 *   node qa/notes.mjs --port=9000      pick a port (or set PORT=9000)
 *   npm run qa:notes
 *
 * POST /__note   {"page":"preview-blocks.html","item":"twoWordVerb","text":"…"}
 *                → {"ok":true,"file":"qa/preview-blocks.html","bytes":42,"empty":false}
 *
 * Zero dependencies, Node 18+.
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QADIR = path.join(ROOT, 'qa');
const PAGES = ['preview-games4.html', 'preview-blocks.html'];
const MAX_BODY = 1 << 20;             // a note longer than a megabyte is a mistake, not a note

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

const argPort = process.argv.find((a) => a.startsWith('--port='));
const PORT = Number(argPort ? argPort.slice('--port='.length) : process.env.PORT || 8130);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Rewrite one note box in one preview page. Returns what was written. */
function writeNote(page, item, text) {
  if (!PAGES.includes(page)) throw new Error('unknown page: ' + page);
  const file = path.join(QADIR, page);
  const src = fs.readFileSync(file, 'utf8');
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const at = src.indexOf('data-item="' + item + '"');
  if (at < 0) throw new Error('no box named "' + item + '" in ' + page);
  const openEnd = src.indexOf('>', at);
  const close = openEnd < 0 ? -1 : src.indexOf('</textarea>', openEnd);
  if (close < 0) throw new Error('malformed textarea for "' + item + '" in ' + page);
  const body = esc(text).replace(/\r\n|\r|\n/g, eol);
  fs.writeFileSync(file, src.slice(0, openEnd + 1) + body + src.slice(close), 'utf8');
  return { file: 'qa/' + page, bytes: Buffer.byteLength(body, 'utf8'), empty: !body.trim() };
}

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

function serveFile(res, pathname) {
  const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const file = path.resolve(ROOT, '.' + rel);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, 'text/plain', 'forbidden');
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'text/plain', 'not found: ' + rel);
    send(res, 200, MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', buf);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');

  if (req.method === 'POST' && url.pathname === '/__note') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY) req.destroy();
    });
    req.on('end', () => {
      try {
        const note = JSON.parse(body || '{}');
        const out = writeNote(note.page, note.item, note.text == null ? '' : note.text);
        console.log('  note  ' + note.item.padEnd(18) + ' ' + out.file + '  ' + (out.empty ? '(cleared)' : out.bytes + ' bytes'));
        send(res, 200, 'application/json', JSON.stringify({ ok: true, ...out }));
      } catch (e) {
        send(res, 400, 'application/json', JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'text/plain', 'method not allowed');
  serveFile(res, url.pathname);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('notes server — every note box writes itself into the page file');
  PAGES.forEach((p) => console.log('  http://127.0.0.1:' + PORT + '/qa/' + p));
  console.log('  Ctrl+C to stop');
});
