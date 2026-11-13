/* APPLY — bake a lesson's saved content row into the lesson file, publish it, then clear the row.
   Usage: node qa/apply.mjs --track=adult --lesson=21 [--email=you@x] [--keep] [--dry] [--force]
                           [--no-publish] [--url=<page URL>] [--wait=<seconds, default 300>]

   What a row holds: the whole page as the browser had it when the teacher pressed Done
   (engine2.js fullPageHTML), and applying uses only that page's `.content-area` innerHTML
   (engine2.js contentAreaHTML). Two consequences this tool enforces:

   1. A page saved after its games started carries the ENGINE'S OWN DOM inside `.game` —
      `.g4-ready`, targets, discs, SVG art, inline positions. That is never committed: each
      `.game` in the incoming area is replaced by the one in the file, which is the authored
      markup. If a game's title or how-to text differs between the two, the tool stops and
      says which one, because that difference is a real edit it cannot carry across.
   2. The rest of the incoming area is used verbatim, so nothing outside `.content-area`
      (head, script tags, header, footer) can be reverted by a stale copy.

   PUBLISHING IS PART OF THE BAKE (owner report 2026-11-13: "the page didnt change and the
   edits disappeared"). The site is GitHub Pages serving origin/main, so a file written in the
   working tree is not the page anyone reads. The old tool wrote the file and then deleted the
   row: the page kept the old lesson, and the edit no longer existed anywhere the owner could
   see it — the row is the only copy edit mode can stage. So a run now (a) commits that ONE
   lesson file, (b) pushes it, and (c) polls the live page until its `.content-area` is exactly
   the file's, and only THEN deletes the row. `--no-publish` writes the file and KEEPS the row;
   `--keep` publishes and keeps it; `--dry` touches nothing.

   Two answers are read instead of assumed. The backend answers a delete with
   `{"result":"deleted","count":n}` or `{"error":"busy"}` (the script lock was held), and the old
   tool printed either one as "row cleared" — so a failed clear left a stale row that then
   overrode the live page inside edit mode. And a content row keeps ONE id, so a Done pressed
   while the bake ran would be destroyed by a blind del: the row is re-read first and kept if it
   was saved again. The row is copied to a temp file before anything is written. */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const BACKPACK = 'https://script.google.com/macros/s/AKfycbxSR8UmOwosLIgn1-AGKhgXJvdqOVkzMqrTwdlWNF9kOkt-256TqTacOsQlo6JyHplR/exec';
const arg = (n, d) => { const m = process.argv.find(a => a.startsWith('--' + n + '=')); return m ? m.slice(n.length + 3) : d; };
const flag = n => process.argv.includes('--' + n);
const die = m => { console.error('apply: ' + m); process.exit(1); };

const track = arg('track'), lesson = arg('lesson');
if (!track || !lesson) die('--track and --lesson are required');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const teacher = arg('email') || (JSON.parse(fs.readFileSync(path.join(ROOT, 'access.json'), 'utf8')).teachers || [])[0];
if (!teacher) die('no --email and no teacher in access.json');
const file = path.join(ROOT, track, 'lesson' + lesson + '.html');
const rel = path.relative(ROOT, file).replace(/\\/g, '/');
if (!fs.existsSync(file)) die('no such lesson file: ' + file);

/* every element whose class list contains `cls`, as [start,end) spans in the source string */
function spans(html, cls) {
  const out = [], open = /<div\b[^>]*>/g;
  let m;
  while ((m = open.exec(html))) {
    const cm = /class="([^"]*)"/.exec(m[0]);
    if (!cm || !cm[1].split(/\s+/).includes(cls)) continue;
    const start = m.index, scan = /<div\b[^>]*>|<\/div\s*>/g;
    scan.lastIndex = start + m[0].length;
    let depth = 1, t;
    while ((t = scan.exec(html))) {
      depth += t[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { out.push({ start, end: t.index + t[0].length }); break; }
    }
  }
  return out;
}
const innerOf = (html, cls) => { const s = spans(html, cls)[0]; return s ? html.slice(html.indexOf('>', s.start) + 1, s.end - 6) : null; };
/* the game's authored text: its heading and its how-to paragraph, engine nodes ignored */
const authored = html => {
  const d = new JSDOM('<div>' + html + '</div>').window.document;
  const q = s => { const n = d.querySelector(s); return n ? n.textContent.replace(/\s+/g, ' ').trim() : ''; };
  return q('h3') + ' || ' + q('.game-how');
};

/* the content row for this track+lesson, as the backend keeps it */
async function readRow() {
  const url = BACKPACK + '?action=layer&email=' + encodeURIComponent(teacher) + '&lesson=' + encodeURIComponent(lesson) + '&t=' + Date.now();
  return ((await (await fetch(url)).json()).rows || []).find(r => r.type === 'content' && String(r.id) === 'content_' + track + '_' + lesson) || null;
}
const row = await readRow();
if (!row || !row.data) { console.log('apply: nothing to commit — no content row for ' + track + ' lesson ' + lesson); process.exit(0); }

let inc = innerOf(row.data, 'content-area');
const current = fs.readFileSync(file, 'utf8');
const cur = innerOf(current, 'content-area');
if (inc === null) die('the row has no .content-area');
if (cur === null) die('the lesson file has no .content-area');

const ig = spans(inc, 'game'), fg = spans(cur, 'game');
if (ig.length !== fg.length) die('row has ' + ig.length + ' game(s), the file has ' + fg.length + ' — refusing to guess');
for (let i = ig.length - 1; i >= 0; i--) {
  const a = authored(inc.slice(ig[i].start, ig[i].end)), f = authored(cur.slice(fg[i].start, fg[i].end));
  if (a !== f && !flag('force')) die('game ' + (i + 1) + ' title/how-to differs:\n  file: ' + f + '\n  row : ' + a + '\n  (--force writes the file game markup and keeps the row text outside games)');
  inc = inc.slice(0, ig[i].start) + cur.slice(fg[i].start, fg[i].end) + inc.slice(ig[i].end);
}
const engineNodes = (inc.match(/g4-ready|class="[^"]*\bg4\b/g) || []).length;
if (engineNodes) die('the incoming area still carries ' + engineNodes + ' engine-generated marker(s) — refusing to write');

const block = inc.replace(/\r?\n/g, '\r\n');
const at = current.indexOf(cur);
const next = current.slice(0, at) + block + current.slice(at + cur.length);

console.log('row      ' + row.id + '  ' + row.data.length + ' chars, saved ' + (row.ts || '?'));
console.log('file     ' + rel);
console.log('content  ' + cur.length + ' -> ' + block.length + ' chars, ' + ig.length + ' game(s) kept from the file');

if (flag('dry')) { console.log('apply: --dry, nothing written, row untouched'); process.exit(0); }
const backup = path.join(os.tmpdir(), 'apply-' + track + '-' + lesson + '-' + Date.now() + '.json');
fs.writeFileSync(backup, JSON.stringify(row));
fs.writeFileSync(file, next);
console.log('wrote    ' + rel + '  (' + (next.length - current.length >= 0 ? '+' : '') + (next.length - current.length) + ' chars)');
console.log('backup   ' + backup);

/* ---- publish: GitHub Pages serves origin/main, so the file is not the page until it is pushed ---- */
const git = (...a) => execFileSync('git', ['-C', ROOT, ...a], { encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }).trim();
const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
const norm = s => String(s).replace(/\r\n/g, '\n').trim();
/* the page's own URL, derived from the GitHub remote: <owner>.github.io/<repo>/ + <track>/<file> */
function liveURL() {
  const forced = arg('url');
  if (forced) return forced;
  const m = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(git('remote', 'get-url', 'origin'));
  if (!m) return '';
  const owner = m[1], repo = m[2];
  const base = 'https://' + owner + '.github.io/' + (repo.toLowerCase() === (owner + '.github.io').toLowerCase() ? '' : repo + '/');
  return base + rel;
}
function publish() {
  if (git('status', '--porcelain', '--', rel)) {
    git('add', '--', rel);
    /* a pathspec commit carries THIS file only: the index may be holding unrelated work */
    git('commit', '-m', rel.replace(/\.html$/, '') + ': the edit-mode copy baked into the page (row ' + row.id + ', saved ' + (row.ts || '?') + ')', '--', rel);
    console.log('commit   ' + git('rev-parse', '--short', 'HEAD') + '  ' + rel);
  } else console.log('commit   none — ' + rel + ' already matches HEAD');
  const ahead = Number(git('rev-list', '--count', 'origin/' + branch + '..HEAD'));
  if (!ahead) { console.log('pushed   nothing — origin/' + branch + ' already has it'); return; }
  try { git('push', 'origin', 'HEAD:' + branch); }
  catch (e) { die('git push failed, the row is KEPT:\n' + String(e.stderr || e.message)); }
  console.log('pushed   origin/' + branch + '  (' + ahead + ' commit(s))');
}
/* the bake is not done until the page a reader gets is the file just written */
async function waitForLive() {
  const url = liveURL();
  if (!url) die('cannot work out the live URL from the GitHub remote — the row is KEPT; pass --url=<lesson page URL>');
  const want = norm(block), limit = Number(arg('wait', '300')) * 1000, t0 = Date.now();
  console.log('live     ' + url + '  (waiting up to ' + limit / 1000 + 's for the Pages build)');
  for (;;) {
    let got = '';
    try { got = norm(innerOf(await (await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now())).text(), 'content-area')); } catch (e) { got = ''; }
    if (got === want) { console.log('live     serves the baked page  (' + want.length + ' chars in .content-area)'); return true; }
    if (Date.now() - t0 > limit) return false;
    await new Promise(r => setTimeout(r, 10000));
  }
}
/* cleared only now: while the page was not live the row was the only copy the owner could edit */
async function clearRow() {
  const now = await readRow();
  if (!now) { console.log('row      already gone'); return; }
  if (String(now.ts) !== String(row.ts)) { console.log('row      KEPT — saved again at ' + now.ts + ' while the bake ran; run apply again for that copy'); return; }
  const res = await (await fetch(BACKPACK, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'del', id: row.id })
  })).json().catch(e => ({ error: String(e) }));
  if (!res || res.result !== 'deleted') die('the backend did not clear the row: ' + JSON.stringify(res) + ' — the page is live, the row is untouched');
  console.log('row      cleared  ' + JSON.stringify(res));
}

if (flag('no-publish')) {
  console.log('live     NOT published (--no-publish) — the row is KEPT; commit and push ' + rel + ' to make the page serve it');
  process.exit(0);
}
publish();
if (!(await waitForLive())) die('the live page still does not serve ' + rel + ' after ' + arg('wait', '300') + 's — the row is KEPT; check the Pages build, then run apply again');
if (flag('keep')) { console.log('row      kept (--keep)'); process.exit(0); }
await clearRow();
