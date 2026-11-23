#!/usr/bin/env node
/* qa/watch-saves.mjs — lands "💾 Save to repo" downloads in the page they came from.

   THE BROWSER CANNOT WRITE A FILE INTO THE REPO. So the save is two halves: the page downloads a
   cleaned copy of itself under its own filename, and this watcher — running on the same machine —
   recognises that filename, splices the saved CONTENT into the authored file, commits and pushes.

   What the splice keeps: the destination's head, brand bar, script tags and CSS stamps. A save is a
   content edit, so it may not carry the browser's re-serialisation of the page into the repo, and it
   may not drop `data-eq` or a build stamp the solver relies on. What it replaces: everything inside
   `.content-area` — the authored blocks, their arrangement, and their text.

   Usage:  npm run saves              watch ~/Downloads while you edit
           npm run saves -- --import  land what is already there (last 20 min), then exit
           npm run saves -- --dry-run  report what a save would land, write nothing
           npm run saves -- --no-push  watch, but commit without pushing
           npm run saves -- --all      with --import: sweep every download, however old
*/
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import cp from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DL = path.join(os.homedir(), 'Downloads');
const argv = process.argv.slice(2);
const ONCE = argv.includes('--import');
const PUSH = !argv.includes('--no-push');
const DRY = argv.includes('--dry-run');
const ALL = argv.includes('--all');
/* a page you just saved is minutes old. An old download with the same name is a different version of
   the page, and landing it would undo whatever the repo has learned since — so import takes only what
   is recent, and `--all` is the deliberate sweep. */
const FRESH_MS = 20 * 60 * 1000;
/* folders that hold no authored page */
const SKIP = new Set(['qa', 'assets', 'node_modules', '.git', '.old']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(path.join(dir, e.name), out); }
    else if (/\.html$/i.test(e.name)) out.push(path.join(dir, e.name));
  }
  return out;
}

/* the pages a save can land in, keyed by the name the browser will give the download. Chrome turns a
   `%` into `-`, so a page saved through an engine that percent-encoded its own path arrives as
   `lesson1-The-20Capability-20Map.html`; both spellings point at the same page. */
function pageIndex() {
  const by = new Map();
  for (const f of walk(ROOT)) {
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    const base = path.basename(f);
    by.set(base.toLowerCase(), rel);
    const legacy = encodeURIComponent(base).replace(/%/g, '-').toLowerCase();
    if (!by.has(legacy)) by.set(legacy, rel);
  }
  return by;
}

/* WHAT A BROWSER WRITES THAT AN AUTHORED FILE DOES NOT. A serialised DOM spells every attribute it
   holds, closes every empty element, and reports the STATE of a control rather than the state the
   page was authored with. Three repairs put a save back into the shape the repo is written in:
     · `class=""`, `style=""`, `popover=""` — attributes the page never set. Dropped.
     · `<path …></path>` — an empty element written as a pair. Closed as `<path …/>`.
     · `<details>` — the browser says whether it is open NOW, and the specimens are authored open.
       The destination's `<details>` are matched by position, and the authored `open` is put back. */
const VOID = 'path|circle|rect|line|polyline|polygon|ellipse|use|stop|image|br|hr|img|input|meta|link';
function quiet(inner, destInner) {
  let out = inner
    .replace(/ (?:class|style|popover)=""/g, ' ')
    .replace(new RegExp('<(?:' + VOID + ')(\\b[^>]*[^/])></(?:' + VOID + ')>', 'g'), m => m.replace(/></, '/><'))
    .replace(/ +>/g, '>');
  const destOpen = [...(destInner || '').matchAll(/<details\b([^>]*)>/g)].map(m => /\bopen\b/.test(m[1]));
  let i = 0;
  out = out.replace(/<details\b([^>]*)>/g, (m, attrs) => {
    const want = destOpen[i++];
    const has = /\bopen\b/.test(attrs);
    if (want && !has) return '<details' + attrs + ' open>';
    if (!want && has) return '<details' + attrs.replace(/\s*open\b/, '') + '>';
    return m;
  });
  return out;
}

function contentInner(html) {
  const open = /<div\b[^>]*class="[^"]*\bcontent-area\b[^"]*"[^>]*>/i.exec(html);
  if (!open) return null;
  const start = open.index + open[0].length;
  const tagRe = /<div\b[^>]*>|<\/div>/gi;
  tagRe.lastIndex = start;
  let depth = 1, m;
  while ((m = tagRe.exec(html))) {
    if (m[0][1] === '/') { depth--; if (!depth) return { inner: html.slice(start, m.index), after: m.index, before: start }; }
    else depth++;
  }
  return null;
}

function splice(destHtml, inner) {
  const ca = contentInner(destHtml);
  if (!ca) return null;
  return destHtml.slice(0, ca.before) + inner + destHtml.slice(ca.after);
}

function git(args) {
  return cp.execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}

function land(file, by) {
  const name = path.basename(file).toLowerCase();
  const rel = by.get(name);
  if (!rel) return 'no page has that name';
  const dest = path.join(ROOT, rel);
  const saved = contentInner(fs.readFileSync(file, 'utf8'));
  if (!saved) return 'the download holds no .content-area';
  const current = fs.readFileSync(dest, 'utf8');
  const now = contentInner(current);
  if (!now) return rel + ' has no .content-area';
  /* the browser writes `class=""`, `style=""`, `popover=""`, closes empty SVG elements as pairs and
     reports a details' open state: quiet() puts all three back into the shape the file is written in */
  const inner = quiet(saved.inner, now.inner);
  const same = inner.replace(/\s+/g, ' ').trim() === now.inner.replace(/\s+/g, ' ').trim();
  if (same) return 'unchanged — ' + rel + ' already holds this content';
  if (DRY) return 'would land in ' + rel + ' — dry run, nothing written';
  const next = splice(current, inner);
  if (!next) return 'could not splice ' + rel;
  fs.writeFileSync(dest, next);
  git(['add', '--', rel]);
  git(['commit', '-m', 'save: ' + rel + ' (edit mode, ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ')']);
  if (PUSH) git(['push']);
  fs.unlinkSync(file);
  return 'landed in ' + rel + (PUSH ? ' and pushed' : ' (committed, not pushed)');
}

const by = pageIndex();
console.log('saves: watching ' + DL + ' for ' + by.size + ' page name(s)');
if (!fs.existsSync(DL)) { console.error('saves: no Downloads folder at ' + DL); process.exit(1); }

const started = Date.now();
const done = new Set();
function scan() {
  let found = 0;
  for (const f of fs.readdirSync(DL)) {
    if (!/\.html$/i.test(f)) continue;
    const full = path.join(DL, f);
    const st = fs.statSync(full);
    if (!ONCE && st.mtimeMs < started) continue;      /* only what you saved after the watcher started */
    if (ONCE && !ALL && Date.now() - st.mtimeMs > FRESH_MS) continue;   /* an old download is old content */
    const key = f + ':' + st.mtimeMs;
    if (done.has(key)) continue;
    done.add(key);
    const verdict = land(full, by);
    if (verdict === 'no page has that name') { done.delete(key); continue; }
    found++;
    console.log('  ' + f + ' → ' + verdict);
  }
  return found;
}

scan();
if (ONCE) {
  if (!done.size) console.log('saves: nothing in Downloads is a page of this repo');
  process.exit(0);
}
setInterval(scan, 1500);
