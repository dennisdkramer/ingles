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

   A SAVE MADE WHILE THE MACHINE WAS OFF IS STILL A SAVE. The watcher remembers when it last started
   and lands anything saved since, so an edit made at night while the computer was shut down goes live
   at the next login instead of waiting for someone to notice a download. Two downloads of the same
   page are one edit: the newest lands and the ones it supersedes are deleted, so an older copy can
   never overwrite what was written after it.
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
/* `--diff` says WHAT a save would change, without writing it: the count of lines the page gains and
   loses, and the first few of each. A save that reports 300 changed lines is the browser's
   re-serialisation leaking through, and a save that reports one changed line is an edit. */
const DIFF = argv.includes('--diff');
/* a page you just saved is minutes old. An old download with the same name is a different version of
   the page, and landing it would undo whatever the repo has learned since — so import takes only what
   is recent, and `--all` is the deliberate sweep. */
const FRESH_MS = 20 * 60 * 1000;
/* WHEN THE WATCHER LAST STARTED is this machine's state, not the repo's, so it lives beside the log
   and never in the tree. `since` is the cutoff a save must be newer than: the previous start, so an
   edit made while the computer was off still lands. A first run has no state and falls back to now. */
const STATE = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), '.cache'), 'ingles-saves', 'state.json');
function lastRun() {
  try { return Number(JSON.parse(fs.readFileSync(STATE, 'utf8')).since) || 0; } catch (e) { return 0; }
}
function markRun(t) {
  try { fs.mkdirSync(path.dirname(STATE), { recursive: true }); fs.writeFileSync(STATE, JSON.stringify({ since: t })); } catch (e) { }
}
/* A LOG FILE IS THE WATCHER'S OWN WRITE. The login task starts node through wscript with no
   console: stdout has nowhere to go, and a process writing to a closed handle is a process that
   can die on its own first line. So `--log <path>` (or `--log=<path>`) appends every line to that
   file and writes to the console only when there is a terminal to write to. That file is how a
   save that failed at the push is read back the next morning. */
const LOGI = argv.findIndex(s => s === '--log' || s.startsWith('--log='));
const LOGFILE = LOGI < 0 ? null : (argv[LOGI].includes('=') ? argv[LOGI].slice(argv[LOGI].indexOf('=') + 1) : argv[LOGI + 1]);
if (LOGFILE) {
  const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19) + '  ';
  const say = tag => (...a) => {
    const line = stamp() + tag + a.map(String).join(' ') + '\n';
    try { fs.appendFileSync(LOGFILE, line); } catch (e) { }
    try { if (process.stdout.isTTY) process.stdout.write(tag + a.join(' ') + '\n'); } catch (e) { }
  };
  console.log = say('');
  console.error = say('ERROR ');
}
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

/* A SECOND SAVE OF THE SAME PAGE IS THE SAME PAGE. A browser that will not overwrite an existing
   download names the next one `lesson1-The Capability Map (1).html`, and that copy is a later edit,
   not another page — so the number Chrome appends is not part of a page's name. */
const NTH = / \(\d+\)(?=\.html$)/i;
function pageOf(by, name) {
  return by.get(name.toLowerCase().replace(NTH, '')) || by.get(name.toLowerCase());
}

/* WHAT A BROWSER WRITES THAT AN AUTHORED FILE DOES NOT. A serialised DOM spells every attribute it
   holds, closes every empty element, and reports the STATE of a control rather than the state the
   page was authored with. Three repairs put a save back into the shape the repo is written in:
     · `class=""`, `style=""`, `popover=""` — attributes the page never set. Dropped.
     · `<path …></path>` — an empty element written as a pair. Closed as `<path …/>`.
     · `<details>` — the browser says whether it is open NOW, and the specimens are authored open.
       The destination's `<details>` are matched by position, and the authored `open` is put back. */
/* WHAT A BROWSER WRITES THAT AN AUTHORED FILE DOES NOT. A serialised DOM spells every attribute it
   holds, reports the STATE of a control instead of the state the page was authored with, and picks
   one spelling for an empty element. quiet() puts a save back into the shape the FILE is written in:
     · `class=""`, `style=""`, `popover=""` — attributes the page never set. Dropped.
     · `open=""` — the browser's spelling of a boolean attribute the file writes bare.
     · two spaces left inside a tag where an empty attribute was dropped.
     · `<path …/>` or `<path …></path>` — the same node. Chrome always writes the pair, and a file
       writes either one, so each element is put back into the spelling the destination used FOR
       THAT ELEMENT. Conforming the whole file to one spelling instead moved 390 lines of the map.
     · `<details>` — the browser says whether it is open NOW, and the specimens are authored open.
       The destination's `<details>` are matched by position, and the authored `open` is put back. */
const SVGEMPTY = 'path|circle|rect|line|polyline|polygon|ellipse|use|stop|image';
/* every empty SVG element, in document order, with the spelling this text gives it */
function empties(html) {
  const re = new RegExp('<(' + SVGEMPTY + ')\\b([^>]*)>', 'gi');
  const out = []; let m;
  while ((m = re.exec(html))) {
    const raw = m[2];
    const self = /\/\s*$/.test(raw);
    const attrs = raw.replace(/\/\s*$/, '').trim();
    const after = html.slice(m.index + m[0].length);
    const pair = !self && new RegExp('^</(?:' + SVGEMPTY + ')\\s*>', 'i').test(after);
    const closeLen = pair ? (/^<\/[a-z]+\s*>/i.exec(after) || [''])[0].length : 0;
    out.push({ start: m.index, end: m.index + m[0].length + closeLen, tag: m[1], attrs, self, pair });
  }
  return out;
}
/* one tag, tidied: repeated spaces collapsed OUTSIDE quotes only, and the space an author leaves
   before `>` removed. Attribute values keep every space they were written with. */
function tidyTag(body) {
  let out = '', q = null, space = false;
  for (const ch of body) {
    if (q) { out += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; out += ch; space = false; continue; }
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') { if (!space) out += ' '; space = true; continue; }
    out += ch; space = false;
  }
  const selfClose = /\/$/.test(out.trim());
  const b = out.replace(/\/\s*$/, '').trim();
  return '<' + b + (selfClose && b ? '/' : '') + '>';
}
function quiet(inner, destInner) {
  let out = inner
    .replace(/ (?:class|style|popover)=""/g, ' ')
    .replace(/ (open|hidden|disabled|checked|selected|required|multiple|readonly|autofocus)=""/gi, ' $1')
    .replace(/<([^<>]*)>/g, (m, body) => tidyTag(body));
  /* the empty elements, in the destination's own spelling, element by element — and only when the
     two texts hold the same elements in the same order, because otherwise the page was edited and
     the spelling is the least interesting difference between them */
  const mine = empties(out), theirs = empties(destInner || '');
  const alike = mine.length === theirs.length &&
    mine.every((e, i) => e.tag.toLowerCase() === theirs[i].tag.toLowerCase() && e.attrs === theirs[i].attrs);
  if (alike) {
    for (let k = mine.length - 1; k >= 0; k--) {
      const e = mine[k], want = theirs[k];
      if (want.self === e.self) continue;
      const text = want.self ? '<' + e.tag + (e.attrs ? ' ' + e.attrs : '') + '/>'
        : '<' + e.tag + (e.attrs ? ' ' + e.attrs : '') + '></' + e.tag + '>';
      out = out.slice(0, e.start) + text + out.slice(e.end);
    }
  }
  /* the browser rewrites an inline style as it parses it — `calc(100% + 8px)` comes back without its
     spaces — so the same declaration is a different string and every styled element counts as
     changed. Where a style differs from the author's only in whitespace, the author's spelling wins.
     ONLY a style written on one line is taken: the file also quotes styles inside <pre> specimens,
     wrapped across lines, and adopting one of those would pull a specimen's wrapping into the page. */
  const styleBag = new Map();
  for (const m of (destInner || '').matchAll(/\sstyle="([^"\n]*)"/g)) {
    const key = m[1].replace(/\s+/g, '');
    if (!styleBag.has(key)) styleBag.set(key, m[1]);
  }
  if (styleBag.size) {
    out = out.replace(/(\sstyle=")([^"\n]*)(")/g, (all, a, v, z) => {
      const want = styleBag.get(v.replace(/\s+/g, ''));
      return want === undefined ? all : a + want + z;
    });
  }
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

/* WHAT AN ENGINE WRITES INTO THE PAGE IS THE PAGE'S STATE, NOT ITS CONTENT. A player builds no markup:
   it decorates the authored figure and then reports where the audio is — `is-enhanced` on the figure,
   `aria-valuenow` on the bar, an inline width on the fill, `is-now` on the line being sung, a running
   clock. A save taken while a track was playing therefore carries a song's position into the file, and
   the next reader finds a page that starts at 0:42. The same goes for any attribute the browser adds
   to an element the author gave an id: Chrome does not write `popover` back out.
   So a save is put back into the AUTHOR'S state for the parts the author wrote:
     · elements with an id — the destination's opening tag wins, attribute for attribute;
     · a container an engine decorates (RESTORE) — the destination's inner HTML wins, in order;
     · comments — the destination's line wrapping wins, matched on the text without its whitespace.
   Nothing here touches a part of the page an engine only reads. */
const RESTORE = ['figure.vz-play', 'h4.flip-ask'];

/* the elements of one tag whose opening tag passes `want`, with their whole extent */
function els(html, tag, want) {
  const out = [];
  const open = new RegExp('<' + tag + '\\b[^>]*>', 'gi');
  let m;
  while ((m = open.exec(html))) {
    if (want && !want(m[0])) continue;
    const start = m.index, after = m.index + m[0].length;
    if (/\/\s*>$/.test(m[0])) { out.push({ start, innerStart: after, innerEnd: after, end: after }); continue; }
    const re = new RegExp('<' + tag + '\\b[^>]*>|</' + tag + '\\s*>', 'gi');
    re.lastIndex = after;
    let depth = 1, x;
    while ((x = re.exec(html))) {
      if (x[0][1] === '/') { depth--; if (!depth) { out.push({ start, innerStart: after, innerEnd: x.index, end: x.index + x[0].length }); break; } }
      else if (!/\/\s*>$/.test(x[0])) depth++;
    }
  }
  return out;
}

function authoredState(inner, destInner) {
  let out = inner;

  /* 1. an id is the author's name for an element, so the author's tag is the true one */
  const byId = new Map();
  for (const t of els(destInner, 'div').concat(els(destInner, 'span'), els(destInner, 'details'), els(destInner, 'figure'))) {
    const tag = destInner.slice(t.start, t.innerStart);
    const id = /\sid="([^"]*)"/.exec(tag);
    if (id) byId.set(id[1], tag);
  }
  if (byId.size) {
    out = out.replace(/<(div|span|details|figure)\b[^>]*\sid="([^"]*)"[^>]*>/gi, (tag, name, id) => {
      const want = byId.get(id);
      return want || tag;
    });
  }

  /* 2. a decorated container: keep the author's contents, not the engine's state */
  for (const sel of RESTORE) {
    const tag = sel.slice(0, sel.indexOf('.'));
    const cls = sel.slice(sel.indexOf('.') + 1);
    const want = t => new RegExp('class="[^"]*\\b' + cls + '\\b', 'i').test(t);
    const mine = els(out, tag, want), theirs = els(destInner || '', tag, want);
    if (!mine.length || mine.length !== theirs.length) continue;
    for (let i = mine.length - 1; i >= 0; i--) {
      /* the opening tag belongs to the author too: `is-enhanced` is a class the player adds, and the
         figure it decorates is the one the file wrote */
      out = out.slice(0, mine[i].start) + destInner.slice(theirs[i].start, theirs[i].innerStart) +
        destInner.slice(theirs[i].innerStart, theirs[i].innerEnd) + out.slice(mine[i].innerEnd);
    }
  }

  /* 3. a comment is one node however it was wrapped, and the file's wrapping is the authored form */
  const bag = new Map();
  for (const c of (destInner || '').matchAll(/<!--([\s\S]*?)-->/g)) {
    const key = c[1].replace(/\s+/g, ' ').trim();
    if (!bag.has(key)) bag.set(key, '<!--' + c[1] + '-->');
  }
  if (bag.size) {
    out = out.replace(/<!--([\s\S]*?)-->/g, (m, body) => {
      const key = body.replace(/\s+/g, ' ').trim();
      return bag.get(key) || m;
    });
  }
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
  const name = path.basename(file);
  const rel = pageOf(by, name);
  if (!rel) return 'no page has that name';
  const dest = path.join(ROOT, rel);
  const current = fs.readFileSync(dest, 'utf8');
  const now = contentInner(current);
  if (!now) return rel + ' has no .content-area';
  /* LINE ENDINGS FOLLOW THE FILE. The working tree is CRLF under core.autocrlf; the browser writes
     LF. Splicing one into the other leaves a file with two conventions inside it, and every line of
     the content then counts as changed in a diff read from the working tree. */
  let saved = contentInner(fs.readFileSync(file, 'utf8'));
  if (!saved) return 'the download holds no .content-area';
  const crlf = /\r\n/.test(current);
  saved = { inner: crlf ? saved.inner.replace(/\r?\n/g, '\r\n') : saved.inner.replace(/\r\n/g, '\n') };
  /* the browser writes `class=""`, `style=""`, `popover=""`, closes empty SVG elements as pairs and
     reports a details' open state: quiet() puts all three back into the shape the file is written in */
  const inner = authoredState(quiet(saved.inner, now.inner), now.inner);
  const same = inner.replace(/\s+/g, ' ').trim() === now.inner.replace(/\s+/g, ' ').trim();
  if (same) return 'unchanged — ' + rel + ' already holds this content';
  if (DIFF) {
    const bag = s => { const m = new Map(); for (const l of s.split('\n')) { const k = l.trim(); m.set(k, (m.get(k) || 0) + 1); } return m; };
    const A = bag(now.inner), B = bag(inner);
    const gone = [], came = [];
    for (const [k, n] of A) { const d = n - (B.get(k) || 0); for (let i = 0; i < d; i++) gone.push(k); }
    for (const [k, n] of B) { const d = n - (A.get(k) || 0); for (let i = 0; i < d; i++) came.push(k); }
    console.log('  diff against ' + rel + ': ' + came.length + ' line(s) added, ' + gone.length + ' removed');
    came.slice(0, 12).forEach(l => console.log('    + ' + l.slice(0, 150)));
    gone.slice(0, 12).forEach(l => console.log('    - ' + l.slice(0, 150)));
    if (came.length + gone.length > 24) console.log('    … ' + (came.length + gone.length - 24) + ' more');
  }
  if (DRY) return 'would land in ' + rel + ' — dry run, nothing written';
  const next = splice(current, inner);
  if (!next) return 'could not splice ' + rel;
  fs.writeFileSync(dest, next);
  git(['add', '--', rel]);
  git(['commit', '-m', 'save: ' + rel + ' (edit mode, ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ')']);
  /* A PUSH THAT FAILS IS NOT A SAVE THAT FAILS. The content is already committed, so the download
     has done its job; the commit rides out with the next successful push. Reporting it as a failure
     and keeping the file would land the same content twice. */
  let pushed = false;
  if (PUSH) {
    try { git(['push']); pushed = true; }
    catch (e) { fs.unlinkSync(file); return 'committed ' + rel + ' - push failed: ' + (e.message || e); }
  }
  fs.unlinkSync(file);
  return 'landed in ' + rel + (pushed ? ' and pushed' : ' (committed, not pushed)');
}

const by = pageIndex();
console.log('saves: watching ' + DL + ' for ' + by.size + ' page name(s)');
if (!fs.existsSync(DL)) { console.error('saves: no Downloads folder at ' + DL); process.exit(1); }

const started = Date.now();
const since = ONCE ? 0 : (lastRun() || started);
if (!ONCE && !DRY) markRun(started);
const done = new Set();
function scan() {
  let files = [];
  try { files = fs.readdirSync(DL); } catch (e) { console.error('saves: cannot read ' + DL + ' - ' + e.message); return 0; }
  /* ONE SAVE PER PAGE, NEWEST FIRST. Two downloads of the same lesson are one edit written twice: a
     save, then a second save after a change of mind, or the browser's `(1)` copy. Landing them in
     name order would leave the older text in the file, so they are grouped by the page they resolve
     to, the newest lands, and the ones it supersedes are deleted — a copy left in Downloads would
     land on a later start and undo the newer one. */
  const groups = new Map();
  for (const f of files) {
    if (!/\.html$/i.test(f)) continue;
    const full = path.join(DL, f);
    let st;
    try { st = fs.statSync(full); } catch (e) { continue; }
    if (!ONCE && st.mtimeMs < since) continue;   /* saved before the previous start: already seen */
    if (ONCE && !ALL && Date.now() - st.mtimeMs > FRESH_MS) continue;   /* an old download is old content */
    const rel = pageOf(by, f);
    if (!rel) continue;
    if (!groups.has(rel)) groups.set(rel, []);
    groups.get(rel).push({ f, full, st });
  }
  let found = 0;
  for (const list of groups.values()) {
    list.sort((a, b) => b.st.mtimeMs - a.st.mtimeMs);
    const newest = list[0];
    for (const old of list.slice(1)) {
      if (DRY) { console.log('  ' + old.f + ' → superseded by ' + newest.f + ' (dry run, kept)'); continue; }
      try { fs.unlinkSync(old.full); } catch (e) { }
      console.log('  ' + old.f + ' → superseded by ' + newest.f + ', deleted');
    }
    const key = newest.f + ':' + newest.st.mtimeMs;
    if (done.has(key)) continue;
    done.add(key);
    let verdict;
    try { verdict = land(newest.full, by); }
    catch (e) { verdict = 'FAILED - ' + (e && e.message ? e.message : e); }
    if (verdict === 'no page has that name') { done.delete(key); continue; }
    found++;
    console.log('  ' + newest.f + ' → ' + verdict);
  }
  return found;
}

/* A BACKGROUND WATCHER OUTLIVES ITS MISTAKES. The task runs it at every login with no window and
   nobody reading, so one unreadable file or one rejected push must not end the watch: the error is
   written to the log and the next tick tries again. A save that failed at the push is still
   committed, so the next successful push carries it. */
process.on('uncaughtException', e => console.error('uncaught - ' + (e && e.stack ? e.stack : e)));
process.on('unhandledRejection', e => console.error('unhandled - ' + e));

try { scan(); } catch (e) { console.error('first scan - ' + e.message); }
if (ONCE) {
  if (!done.size) console.log('saves: nothing in Downloads is a page of this repo');
  process.exit(0);
}
setInterval(() => { try { scan(); } catch (e) { console.error('scan - ' + e.message); } }, 1500);
