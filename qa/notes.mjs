/**
 * qa/notes.mjs — serve the repo, and keep qa/NOTES.md in step with the preview pages' note boxes.
 *
 * The two preview pages carry one `textarea.qa-note` per item (data-item="<name>"). qa/notes.js
 * posts each box here as it is typed; this server writes that text into qa/NOTES.md, never into
 * the page: one `##` block per page, one `###` section per item, and the item heading is the same
 * name as the `###` heading in CONTENT_EXAMPLES.md — so a note and the contract it argues with sit
 * side by side and can be compared by heading alone. Empty the box → its section is removed.
 *
 *   node qa/notes.mjs                 → http://127.0.0.1:8130/qa/preview-games4.html
 *                                       http://127.0.0.1:8130/qa/preview-blocks.html
 *   node qa/notes.mjs --port=9000      pick a port (or set PORT=9000)
 *   npm run qa:notes
 *
 * GET  /__notes?page=preview-blocks.html
 *                → {"ok":true,"file":"qa/NOTES.md","items":{"twoWordVerb":"…"}}
 * POST /__note   {"page":"preview-blocks.html","item":"twoWordVerb","text":"…"}
 *                → {"ok":true,"file":"qa/NOTES.md","bytes":42,"empty":false}
 *
 * Zero dependencies, Node 18+.
 */
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QADIR = path.join(ROOT, 'qa');
const NOTES = path.join(QADIR, 'NOTES.md');
const PAGES = ['preview-games4.html', 'preview-blocks.html'];
const MAX_BODY = 1 << 20;             // a note longer than a megabyte is a mistake, not a note

const HEADER = [
  '# Preview notes',
  '',
  'One `##` block per preview page and one `###` section per item, written by the note boxes',
  'themselves (`npm run qa:notes`, then type in a box). The item heading is the same name as the',
  '`###` heading in CONTENT_EXAMPLES.md, so a note and the contract it argues with can be read',
  'against each other by heading alone. Emptying a box removes its section; the record of work',
  'done is the commit.',
  ''
].join('\n');


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

/** NOTES.md → { preamble: [line], groups: [{ page, items: [{ item, lines }] }] } */
function parse(src) {
  const model = { preamble: [], groups: [] };
  let group = null;
  let item = null;
  for (const line of String(src).split(/\r?\n/)) {
    const h3 = /^###[ \t]+(\S.*?)[ \t]*$/.exec(line);
    const h2 = /^##[ \t]+(\S.*?)[ \t]*$/.exec(line);
    if (h3 && group) { item = { item: h3[1], lines: [] }; group.items.push(item); continue; }
    if (h2) { group = { page: h2[1], items: [] }; model.groups.push(group); item = null; continue; }
    if (item) item.lines.push(line);
    else if (group) continue;            // stray text directly under a page heading is dropped
    else model.preamble.push(line);
  }
  return model;
}

/** the model back to markdown — one blank line between every heading and section */
function build(model) {
  const chunks = [];
  const pre = model.preamble.join('\n').trim();
  if (pre) chunks.push(pre);
  for (const group of model.groups) {
    if (!group.items.length) continue;
    chunks.push('## ' + group.page);
    for (const item of group.items) {
      const body = item.lines.join('\n').trim();
      if (body) chunks.push('### ' + item.item + '\n\n' + body);
    }
  }
  return (chunks.length ? chunks.join('\n\n') : HEADER.trim()) + '\n';
}

function readModel() {
  return parse(fs.existsSync(NOTES) ? fs.readFileSync(NOTES, 'utf8') : HEADER);
}

/** every note in the file that belongs to one page, keyed by item name */
function readNotes(page) {
  if (!PAGES.includes(page)) throw new Error('unknown page: ' + page);
  const items = {};
  const group = readModel().groups.find((g) => g.page === page);
  if (group) group.items.forEach((item) => { items[item.item] = item.lines.join('\n').trim(); });
  return items;
}

/** Put one note into qa/NOTES.md, or take its section out when the text is empty. */
function writeNote(page, item, text) {
  if (!PAGES.includes(page)) throw new Error('unknown page: ' + page);
  const html = fs.readFileSync(path.join(QADIR, page), 'utf8');
  if (!html.includes('data-item="' + item + '"')) throw new Error('no box named "' + item + '" in ' + page);

  const model = readModel();
  let group = model.groups.find((g) => g.page === page);
  if (!group) { group = { page, items: [] }; model.groups.push(group); }
  const at = group.items.findIndex((i) => i.item === item);
  const body = String(text == null ? '' : text).replace(/\r\n?/g, '\n').trim();

  if (!body) {
    if (at >= 0) group.items.splice(at, 1);
  } else if (at >= 0) {
    group.items[at].lines = body.split('\n');
  } else {
    group.items.push({ item, lines: body.split('\n') });
  }

  fs.writeFileSync(NOTES, build(model), 'utf8');
  return { file: 'qa/NOTES.md', bytes: Buffer.byteLength(body, 'utf8'), empty: !body };
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

  if (req.method === 'GET' && url.pathname === '/__notes') {
    try {
      const page = url.searchParams.get('page') || '';
      const items = readNotes(page);
      send(res, 200, 'application/json', JSON.stringify({ ok: true, file: 'qa/NOTES.md', page, items }));
    } catch (e) {
      send(res, 400, 'application/json', JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

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
  console.log('notes server — every note box writes itself into qa/NOTES.md');
  PAGES.forEach((p) => console.log('  http://127.0.0.1:' + PORT + '/qa/' + p));
  console.log('  Ctrl+C to stop');
});
