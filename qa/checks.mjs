#!/usr/bin/env node
/**
 * qa/checks.mjs — EVERY lesson-page check, in one file, each callable alone, importable with no
 * side effect, and pageable BY NAME.
 *
 * THE FILE IS READ BY SECTION NAME, NEVER BY LINE SPAN. No process and no prompt may be told to
 * "read lines 300-460" of this file: read `qa/checks.mjs the page check`. This head says what each
 * section is; every section opens with a banner carrying its name in brackets, and that name
 * appears EXACTLY ONCE in the file. `Select-String -Pattern '\[CHECK 2\]' qa/checks.mjs` lands on
 * that banner and nothing else. A section may be split across several functions; a name may not
 * appear twice.
 *
 *   the kill switch   the kill switch: `all` and one key per function. Every check reads it first; a
 *              disabled function says so and names the key that did it — never a silent pass.
 *   the scope section    where a run reads: the track list, lesson files, what the working tree touches, and
 *              the ONE local static server (the page check for jsdom, the alignment pass/the live pass for Chrome).
 *   the wrap section     the three-level wrap: its rule (`audit`, `balance`) and its writer (`--write`).
 *   the prose check  the prose: the items are the `Checks` bullets of the map page, read at run time;
 *              each is PROBED, MATERIAL (its extract is printed) or UNPROBED (said by name).
 *   the page check  everything about a page's markup and its running state — structure, blocks, items,
 *              markup boxes, the wrap, the block sequence against the track's ledger lines, and
 *              (runtime) engines, anchors, games, console.
 *   the alignment pass    rendered geometry: a row's shorter cell against its neighbour, at measured widths.
 *              It is also the step that reads each page and marks its Portuguese `.pt`, and adds the
 *              quiz: language is the reader's judgement, and this file makes none.
 *   the live pass     what only a painted page can answer: layout, a real selection, the sheet round trip.
 *   the games check    engine4's state machine, through each instance's own hooks.
 *   the index build    the derived files (lessons.json, tracks.json, the two stamps). Not a check.
 *   the queue    the finding shape, the halt, and the one idempotent write into PENDING.
 *   the command line      `node qa/checks.mjs <fn> …`; importing the file runs nothing.
 *
 * THE CALL SURFACE — nothing is guessed:
 *   node qa/checks.mjs <fn> …        <fn> is check1 | check2 | wrap | align | live |
 *                                    games | index. No name, or a name that is not one of them,
 *                                    prints one line naming the file and exits 1: no menu, no list,
 *                                    no sweep.
 *   check1   --track=<t> <n…> | --text="<a block of prose>"
 *   check2   the same lesson targeting plus --static
 *   wrap     one or more page paths and --write (or --check)
 *   align    --track, --lessons, optional --widths / --tol
 *   index    --check (writes nothing; reports what is stale)
 *   live     --only=<scenario>
 *   games    no target
 * The same functions are exported taking an options object ({ track, n }, { text }, { pages },
 * { widths, tol }, { check }, { only }), so a caller can import instead of shelling out —
 * `check1({ text })` works on prose alone, with no page, no track and no lesson number.
 *
 * SCOPE belongs to the harness, not the caller: no flag reads the ONE track whose pages the
 * working tree touches — two tracks touched is a refusal, because a green that reads two tracks is
 * not a green about the one being written. `--track=<t>` narrows it but names no page, so it needs
 * `--lessons=21-25` (or bare numbers) or `--all`; `--page=<path>` reads exactly one page in any
 * folder; `--all` is every track, said out loud, and it is the only full sweep.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isDemo } from './demo.mjs';

/* two facts every section needs, defined once */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const hashStr = s => { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return x; };

/**
 * WHAT the page check FAILS — the page is broken: an element never closed · a closer that closed nothing ·
 * a dead `#anchor` · a `.block` not opening with an `<h3>` · a block inside a block · a `.rows` holding
 * a `.rows` · an empty `data-answer` · a `.qitem` key matching no option · a build page outside a demo
 * folder · a stub label pointing at nothing · a `pre` holding parsed markup · the edit tool's marks ·
 * four block types in a row as the same four run on one of the three lessons before it — and, in the
 * runtime half, a page that does not boot, an answer control that resolves no anchor, a `.listen`
 * with no `data-say`, a game engine4 never wired, a console error. WARNS — printed, never failed: a
 * block with answers and no `.qnum` · a class with no rule in `style.css` · an item still outside a
 * cell of its own (fix with `wrap --write`). PRINTS — evidence, not a verdict: the h1 length.
 *
 * A FINDING HAS ONE SHAPE, ONE DISPOSITION: `{ fn, rule, disposition, at, said, next }`.
 *   fix   a local defect; a step is written under the current batch and the lesson STAYS in the batch.
 *   halt  the lesson is probably broken beyond a quick fix; it LEAVES the run (see below).
 *   note  printed, and written only when an action is owed later.
 * HALT — engines never booted · EVERY answer control resolves no anchor (one or more controls and
 * zero resolved; a single unanchored control is only `fix`) · no `.block` or no `.content-area` ·
 * a console error before first paint. A halt does
 * three things in ONE write: a batch of its own in PENDING (`## [Bn] - Review lesson <N> of <track>
 * before it is checked again …`), the lesson excluded from every remaining check and the exclusion
 * stated in that batch, and the follow-up check its failure implies queued for that lesson alone:
 * no anchors → `check2 --static`; engines never booted → `check2 --static`, then `live` if static is
 * clean; no blocks → back to pass 2, no check queued.
 *
 * QUEUE, NEVER REMEMBER. Every write is idempotent (keyed by lesson + fn + rule + said), so a second
 * run of the same check adds nothing, and the write happens once per call, after the findings are
 * complete — a check that dies mid-way leaves no half-written batch.
 *
 * THE PRE-PUSH ORDER (`.githooks/pre-push`): the `.md` Liquid guard (`qa/liquid.mjs`) first, then
 * `index --check`. `index` is not a check (it is deliberately not in the the kill switch matrix) and is the
 * only function the hook runs. The derived files are SERVED — GitHub Pages has no build step — so a
 * push that leaves them stale publishes a site that does not link the lesson it just added.
 *
 * OUT OF SCOPE, said out loud: `qa/landing.mjs`, `qa/liquid.mjs`, `qa/rows3.mjs` and `qa/rowctx.mjs`
 * stay where they are (the signed-in landing page, the `.md` publish guard, the layout editor on a
 * fixture, the sheet's cascade), and so do `qa/serve.mjs`, `qa/NOTES.md` and their endpoints.
 * `qa/landing.mjs` and `qa/rows3.mjs` import `qaOff` from here and keep their own switch.
 *
 * THE FILES THIS ONE REPLACED are recorded, with their scope ladder, `QA_ON` switch, pre-push order
 * and probe list, in `PENDING.md` [STATE] as history. This head is where those facts now live; no
 * document describes a check this file does not run.
 */

const DELETE_ME_HEAD_END = 0;

/* [QA OFF] — THE KILL SWITCH, and the owner instruction behind it (2026-11-10).
 *
 * WHY IT EXISTS: a lesson is judged on the page it produces, with nothing between the prompt and the
 * page. A harness that reds on a style choice is a second author, and its verdict arrives before the
 * page does. So a switch that can silence ONE check in one word is what keeps a harness from becoming
 * a second author — and a disabled function SAYS it is disabled and names the key, because a silent
 * pass is exactly the doubt this block removes.
 *
 * It holds two variables only:
 *   `all` — one boolean that turns off every check in this file;
 *   `fn`  — one key per function, the same names the CLI takes, each false.
 * Turning one function off is one word in this block and nothing else. `index` is deliberately not
 * in the matrix: it is not a check, and the pre-push hook depends on it answering.
 * A switch gates a function's OWN run; it never disables a pure helper another check calls
 * (the wrap section's `audit`/`balance`, the scope section's finders).
 */
const QA = {
  all: false,
  fn: { check1: false, check2: false, wrap: false, align: false, live: false, games: false },
};

/**
 * The first statement of every function: `if (qaOff('check2')) return;`. It reads both variables in
 * one test (`QA.all || QA.fn[name]`) and, when it turns a function off, names the key that did it.
 * A name outside the matrix (`qa/landing.mjs`, `qa/rows3.mjs`, which stay outside this file) keeps
 * its documented behaviour: off unless `QA_ON=1` is in the environment.
 */
export function qaOff(name) {
  const keyed = Object.prototype.hasOwnProperty.call(QA.fn, name);
  if (!keyed) {
    /* a harness outside this file (qa/landing.mjs, qa/rows3.mjs) keeps its documented 2026-11-10
       behaviour: OFF, one line, exit 0 — unless QA_ON=1 turns it on for the run. */
    if (process.env.QA_ON === '1') return false;
    console.log('QA OFF — ' + name + ': disabled by the owner instruction 2026-11-10. Re-enable with QA_ON=1.');
    return process.exit(0);
  }
  const off = QA.all || !!QA.fn[name];
  if (!off) return false;
  const key = QA.all ? 'all' : 'fn.' + name;
  console.log('QA OFF — ' + name + ': disabled by ' + key + '.');
  return true;
}

/* =====================================================================================
   [SCOPE] — where a run reads: the tracks, the lesson files, and the one server
   ===================================================================================== */
export const {
  ROOT, TRACKS, hasTrackFlag, pickTracks, scopeLabel, pickNumbers, missingTargets,
  lessonsOnDisk, lessonDir, lessonFile, pickLessons, hasAllFlag, touchedScope, pickLessonsFlag, authoredLessons,
  pickVoiceTracks, pickVoiceLessons, startServer, flags, MIME,
} = (() => {
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** A TRACK IS A FOLDER: one holding at least one lesson page, or a track.json (so a track can exist — and
 *  audit as an empty passing state — before its first lesson is written). Discovered, never listed: a track
 *  created months from now is in scope, and `--track=<it>` is a valid narrowing, with no edit to this file.
 *  A folder whose track.json says `{"demo": true}` is a DEMO, not a track of the book: anyone may open its
 *  pages without a login, so it is not audited, not indexed and never named by `--track`. The test lives in
 *  qa/demo.mjs, so a new demo folder excludes itself here without an edit. */
function discoverTracks() {
  const out = [];
  let dirs = [];
  try { dirs = fs.readdirSync(ROOT, { withFileTypes: true }); } catch (e) { return out; }
  for (const d of dirs) {
    if (!d.isDirectory() || d.name[0] === '.' || d.name === 'node_modules') continue;
    let files = [];
    try { files = fs.readdirSync(path.join(ROOT, d.name)); } catch (e) { continue; }
    if (isDemo(ROOT, d.name)) continue;
    if (files.indexOf('lessons') >= 0) {
      try { files = files.concat(fs.readdirSync(path.join(ROOT, d.name, 'lessons'))); } catch (e) { /* no folder */ }
    }
    if (files.some(f => /^lesson\d+.*\.html$/.test(f)) || files.indexOf('track.json') >= 0) out.push(d.name);
  }
  return out.sort();
}
const TRACKS = discoverTracks();

/** was `--track` given at all? (a named page that is missing fails only when a track was named) */
function hasTrackFlag(argv = process.argv.slice(2)) {
  return argv.some(a => a === '--track' || a.startsWith('--track='));
}

function readTrackFlag(argv) {
  let t = '';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--track') t = argv[i + 1] || '';
    else if (argv[i].startsWith('--track=')) t = argv[i].slice('--track='.length);
  }
  t = String(t || '').trim().toLowerCase();
  if (!TRACKS.includes(t)) {
    console.log('❌ --track must be one of: ' + TRACKS.join(' | ') + '  (got "' + t + '")');
    process.exit(1);
  }
  return t;
}

/**
 * the tracks this run covers: `--track` names one, otherwise every track with at least one page.
 * `[]` (no pages anywhere) is a passing state — the caller prints it as such.
 */
function pickTracks(argv = process.argv.slice(2)) {
  if (hasTrackFlag(argv)) return [readTrackFlag(argv)];
  return TRACKS.filter(t => lessonsOnDisk(t).length);
}

/** 'kids + business' — how a run names its scope in its output */
function scopeLabel(tracks) {
  return tracks.length ? tracks.join(' + ') : 'no track has pages';
}

/** the bare `digits` arguments of a harness (lesson numbers) */
function pickNumbers(argv = process.argv.slice(2)) {
  return argv.filter(a => !a.startsWith('--') && /^\d+$/.test(a)).map(Number);
}

/** named numbers that exist in NO track in scope — a typo must never pass as "nothing to audit" */
function missingTargets(tracks, numbers) {
  const have = new Set(tracks.flatMap(t => lessonsOnDisk(t)));
  return numbers.filter(n => !have.has(n));
}

/** a track's lesson pages live in <track>/lessons; a folder that has none is looked in directly */
function lessonDir(track) {
  const deep = path.join(ROOT, track, 'lessons');
  return fs.existsSync(deep) ? deep : path.join(ROOT, track);
}

/** the lesson numbers that exist on disk for a track, ascending (empty array = nothing to audit) */
function lessonsOnDisk(track) {
  const dir = lessonDir(track);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map(f => (f.match(/^lesson(\d+)(?:-.*)?\.html$/) || [])[1])
    .filter(Boolean).map(Number).sort((a, b) => a - b);
}

/** THE FILE a lesson number names: `lesson7-<Title>.html`. The title lives in the filename — no page is
 *  read to find it — so a number is looked up, never concatenated into a path. */
function lessonFile(track, n) {
  const dir = lessonDir(track);
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find(f => new RegExp('^lesson' + n + '(?:-.*)?\\.html$').test(f));
  return hit ? path.join(dir, hit) : null;
}

/** `4 7 --track=kids` → [4, 7]; no numbers → every page on disk for the track */
function pickLessons(track, argv = process.argv.slice(2)) {
  const named = pickNumbers(argv);
  return named.length ? named : lessonsOnDisk(track);
}

/* ---- scope for the voice detectors -------------------------------------------
   lang.mjs and register.mjs judge a page's VOICE — the language it explains in, the register it speaks
   in — and voice drifts by hand while a track is being written. They therefore default to what the work
   actually touched: the lesson pages changed in the working tree and in the last commit. A red on a track
   nobody is writing is noise, and noise is how a report stops being read.

     (no flag)             what the task touches — nothing touched means nothing to audit, and that passes
     --track=adult         that track, every page
     --track=adult 7 8     those pages
     --all                 every track, every page, the full sweep

   The structural harnesses (games) are deliberately NOT scoped this way: a page can be
   broken without anyone touching it, so pickTracks/pickLessons keep their full sweep for them.
*/
function hasAllFlag(argv = process.argv.slice(2)) {
  return argv.includes('--all');
}

/** A rename line counts its destination. The leading class
 *  tolerates git's porcelain prefix (`?? adult/lessons/lesson22-The Clock.html`) and quoted paths, so an untracked page —
 *  which is exactly what a page being written looks like — is in scope. The track alternation is built from
 *  the DISCOVERED tracks, so a page in a track that did not exist when this line was written still counts. */
const PAGE_PATH = TRACKS.length
  ? new RegExp('(?:^|[\\s"\'\\\\/])(' + TRACKS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
      + ')[\\\\/](?:lessons[\\\\/])?lesson(\\d+)(?:-[^"]*)?\\.html["\']?$')
  : /(?!)/;

function gitPagePaths(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', windowsHide: true });
  if (r.error || r.status !== 0 || !r.stdout) return [];
  const out = [];
  for (let line of r.stdout.split(/\r?\n/)) {
    line = line.trim();
    if (!line) continue;
    if (line.includes(' -> ')) line = line.slice(line.indexOf(' -> ') + 4).trim();
    const m = line.match(PAGE_PATH);
    if (m) out.push({ track: m[1], n: Number(m[2]) });
  }
  return out;
}

/**
 * `{ tracks:[…], numbers:Map(track → [n…]) }` for the lesson pages the task touched, or null when git is
 * unavailable or nothing lesson-shaped was touched. "Touched" is the working tree (staged, unstaged,
 * untracked — which is what a lesson being written looks like) union the last commit (which is what the
 * batch just committed looks like, since the workflow audits after committing). Pages that no longer
 * exist on disk are dropped, so a deleted stub is not asked for.
 */
/**
 * A page that differs from HEAD only in a `?v=<hash>` stamp is NOT being authored: the build restamps
 * every page when the sheet changes, and a gate that treated those as authored would drag the whole
 * site back into every run. Compared after the two stamps are removed.
 */
function stampedOnly(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const old = spawnSync('git', ['show', 'HEAD:' + rel], { cwd: ROOT, encoding: 'utf8', windowsHide: true });
  if (old.error || old.status !== 0 || typeof old.stdout !== 'string') return false;
  let now = '';
  try { now = fs.readFileSync(file, 'utf8'); } catch (e) { return false; }
  const strip = s => s.replace(/\r\n/g, '\n').replace(/(style\.css|equalize\.js)\?v=[0-9a-f]+/g, '$1');
  return strip(old.stdout) === strip(now);
}

function touchedScope() {
  const seen = [...gitPagePaths(['show', '--name-only', '--pretty=format:', 'HEAD']),
    ...gitPagePaths(['status', '--porcelain'])];
  const byTrack = new Map();
  for (const p of seen) {
    if (!lessonsOnDisk(p.track).includes(p.n)) continue;
    const file = lessonFile(p.track, p.n);
    if (file && stampedOnly(file)) continue;
    if (!byTrack.has(p.track)) byTrack.set(p.track, new Set());
    byTrack.get(p.track).add(p.n);
  }
  if (!byTrack.size) return null;
  return { tracks: TRACKS.filter(t => byTrack.has(t)), numbers: byTrack };
}

/** the lesson numbers on a `--lessons=` flag (`--lessons=21-25,30`), or null when the flag is absent */
function pickLessonsFlag(argv = process.argv.slice(2)) {
  const a = argv.find(s => s.startsWith('--lessons='));
  if (!a) return null;
  const out = new Set();
  for (const part of a.slice('--lessons='.length).split(',').map(s => s.trim()).filter(Boolean)) {
    const range = /^(\d+)-(\d+)$/.exec(part);
    if (range) {
      const [from, to] = [Number(range[1]), Number(range[2])];
      for (let n = Math.min(from, to); n <= Math.max(from, to); n++) out.add(n);
    } else if (/^\d+$/.test(part)) out.add(Number(part));
  }
  return [...out].sort((x, y) => x - y);
}

/**
 * THE LESSONS A GATE AUDITS: the pages being authored, not the track's history.
 *
 *   (no flag)                what the task touches - the working tree union the last commit, so a page
 *                            being written and a batch just committed are both in scope, and a track
 *                            nobody is writing audits nothing (which passes)
 *   --lessons=21-25,30       exactly those
 *   21 22 25  (bare)         exactly those
 *   --all                    every page on disk, the full sweep, said out loud
 *
 * A gate that audits 200 pages nobody touched buries the one page that is broken; the full sweep stays
 * one flag away for the day it is wanted.
 */
function authoredLessons(track, argv = process.argv.slice(2)) {
  const named = pickNumbers(argv);
  if (named.length) return named;
  const flagged = pickLessonsFlag(argv);
  if (flagged && flagged.length) return flagged;
  if (hasAllFlag(argv)) return lessonsOnDisk(track);
  const scope = touchedScope();
  return scope && scope.numbers.has(track) ? [...scope.numbers.get(track)].sort((a, b) => a - b) : [];
}

/** the tracks a voice detector covers: an explicit `--track` wins, then `--all`, then what was touched */
function pickVoiceTracks(argv = process.argv.slice(2)) {
  if (hasTrackFlag(argv) || hasAllFlag(argv)) return pickTracks(argv);
  const s = touchedScope();
  return s ? s.tracks : [];
}

/** the pages of one track a voice detector covers (named numbers > --lessons > touched > none) */
function pickVoiceLessons(track, scope, argv = process.argv.slice(2)) {
  return authoredLessons(track, argv);
}

/* ---- the ONE static server ---------------------------------------------------------------- */

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4' };

/**
 * Serve the working tree from a random loopback port. This is the only server in the file:
 * the page check loads pages from it in jsdom, the alignment pass and the live pass point Chrome at it. `onRequest` is
 * the live pass's control API — it is asked first and returns true when it answered the request itself.
 */
function startServer(onRequest) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      if (onRequest && onRequest(u, res) === true) return;
      let p = decodeURIComponent(u.pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(ROOT, p === '/' ? 'index.html' : p);
      if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve({
      srv, port: srv.address().port, host: '127.0.0.1',
      close: () => new Promise(r => srv.close(r)),
    }));
  });
}

/**
 * An options object as the CLI would spell it, so every function can be driven either way. Arrays
 * expand to one token each (`n: [1, 2]` → `1 2`); `argv` carries anything the caller wants verbatim.
 */
function flags(opts = {}) {
  const a = [];
  if (opts.track) a.push('--track=' + opts.track);
  if (opts.page) a.push('--page=' + opts.page);
  if (opts.pages) for (const p of [].concat(opts.pages)) a.push(String(p));
  if (opts.lessons) a.push('--lessons=' + [].concat(opts.lessons).join(','));
  if (opts.n != null) for (const n of [].concat(opts.n)) a.push(String(n));
  if (opts.text != null) a.push('--text=' + opts.text);
  if (opts.only) a.push('--only=' + opts.only);
  if (opts.widths) a.push('--widths=' + [].concat(opts.widths).join(','));
  if (opts.tol != null) a.push('--tol=' + opts.tol);
  for (const f of ['all', 'static', 'write', 'check', 'verbose', 'headful', 'keep', 'selfTest'])
    if (opts[f]) a.push('--' + f.replace(/[A-Z]/g, c => '-' + c.toLowerCase()));
  for (const extra of [].concat(opts.argv || [])) a.push(String(extra));
  return a;
}

return {
  ROOT, TRACKS, hasTrackFlag, pickTracks, scopeLabel, pickNumbers, missingTargets, lessonsOnDisk,
  lessonDir, lessonFile, pickLessons, hasAllFlag, touchedScope, pickLessonsFlag, authoredLessons, pickVoiceTracks,
  pickVoiceLessons, startServer, flags, MIME,
};

})();
/* =====================================================================================
   [WRAP] — the three-level wrap: its rule and its writer
   ===================================================================================== */
export const { wrap, audit, balance } = (() => {
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAWTEXT = new Set(['script', 'style', 'textarea', 'title']);

/* ---- 1. the scanner: text in, a tree of raw source slices out --------------------------- */
function parse(src) {
  const root = { kind: 'root', tag: '#root', children: [] };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  const text = s => { if (s) top().children.push({ kind: 'text', raw: s }); };
  let i = 0;

  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt < 0) { text(src.slice(i)); break; }
    if (lt > i) text(src.slice(i, lt));

    /* a comment or a doctype is copied through, never parsed */
    if (src.startsWith('<!--', lt)) {
      const end = src.indexOf('-->', lt + 4);
      const j = end < 0 ? src.length : end + 3;
      text(src.slice(lt, j)); i = j; continue;
    }
    if (src[lt + 1] === '!') {
      const end = src.indexOf('>', lt);
      const j = end < 0 ? src.length : end + 1;
      text(src.slice(lt, j)); i = j; continue;
    }
    /* a closing tag belongs to the nearest matching element still open. A closer with nothing to
       close is kept as text, verbatim: it is the page's own defect, and a scanner that silently
       drops it would "fix" a file it was only asked to wrap. */
    if (src[lt + 1] === '/') {
      const end = src.indexOf('>', lt);
      const j = end < 0 ? src.length : end + 1;
      const tag = src.slice(lt + 2, end).trim().toLowerCase();
      let closed = false;
      for (let k = stack.length - 1; k > 0; k--) {
        if (stack[k].tag === tag) { stack[k].close = src.slice(lt, j); stack.length = k; closed = true; break; }
      }
      if (closed) { i = j; continue; }
      text(src.slice(lt, j)); i = j; continue;
    }
    /* an opening tag: its raw text is taken whole, quotes honoured, so `onerror="…'…'"` survives */
    let j = lt + 1, q = null;
    for (; j < src.length; j++) {
      const c = src[j];
      if (q) { if (c === q) q = null; }
      else if (c === '"' || c === "'") q = c;
      else if (c === '>') break;
    }
    const raw = src.slice(lt, j + 1);
    const m = /^<([a-zA-Z][\w:-]*)/.exec(raw);
    if (!m) { text(raw); i = j + 1; continue; }
    const tag = m[1].toLowerCase();
    const el = { kind: 'el', tag, raw, close: '', children: [] };
    top().children.push(el);
    i = j + 1;
    if (VOID.has(tag) || /\/>$/.test(raw)) continue;          /* no children, no closer */
    if (RAWTEXT.has(tag)) {                                    /* script/style/textarea: opaque */
      const lower = src.toLowerCase();
      const at = lower.indexOf('</' + tag, i);
      if (at < 0) { el.children.push({ kind: 'text', raw: src.slice(i) }); i = src.length; continue; }
      if (at > i) el.children.push({ kind: 'text', raw: src.slice(i, at) });
      const end = src.indexOf('>', at);
      const stop = end < 0 ? src.length : end + 1;
      el.close = src.slice(at, stop);
      i = stop; continue;
    }
    stack.push(el);
  }
  return root;
}

function serialize(n) {
  if (n.kind === 'text') return n.raw;
  if (n.kind === 'root') return n.children.map(serialize).join('');
  return n.raw + n.children.map(serialize).join('') + n.close;
}

/* ---- 2. reading an element's attributes — never rewriting them -------------------------- */
function attr(raw, name) {
  const body = raw.replace(/^<[a-zA-Z][\w:-]*/, '');
  const re = new RegExp('(^|\\s)' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i');
  const m = re.exec(body);
  return m ? (m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : m[5]) : null;
}
const classes = n => (n.kind === 'el' ? (attr(n.raw, 'class') || '').split(/\s+/).filter(Boolean) : []);
const isRow = n => n.kind === 'el' && classes(n).includes('rows');
const isBlock = n => n.kind === 'el' && classes(n).includes('block');
const HEADING = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const CONTROL = new Set(['script', 'style']);

/* every element, with the number of `.rows` above it (its row's level is that + 1) */
function walk(n, out, depth) {
  for (const c of n.children) {
    if (c.kind !== 'el') continue;
    c._depth = depth;
    out.push(c);
    walk(c, out, depth + (isRow(c) ? 1 : 0));
  }
  return out;
}


/* ---- 3. the rule ----------------------------------------------------------------------- */
const ROW_OPEN = '<div class="rows">';

function wrapPage(src) {
  const tree = parse(src);
  const all = walk(tree, [], 0);
  const ca = all.find(n => classes(n).includes('content-area'));
  const report = { rows: 0, cells: 0, added: 0, depth: {}, error: null };
  if (!ca) { report.error = 'no .content-area — is this a lesson page?'; return { tree, report }; }

  const before = countRows(all);
  const rowsAt = level => all.filter(n => isRow(n) && n._depth === level - 1);
  const targets = [];   /* [container, predicate] — the whole list is taken before anything moves */

  /* level 1 — a node standing directly under .content-area. A section heading, a block's own
     <script>, the notebook and an existing row stand alone; anything else (a paragraph, a chart, a
     block authored at page level) is given the row it must have, so nothing on the page is a bare
     leaf the editor cannot place. */
  targets.push([ca, n => n.kind === 'el' && !HEADING.has(n.tag) && !CONTROL.has(n.tag)
    && n.tag !== 'textarea' && !isRow(n)]);

  /* level 2 — a block's own children: not in a cell at all, so each one is given the row it must
     have. A block's content is a row per child, whatever the count. */
  for (const b of all.filter(isBlock)) {
    targets.push([b, n => n.kind === 'el' && !HEADING.has(n.tag) && !CONTROL.has(n.tag) && !isRow(n)]);
  }
  /* EVERY ITEM IS ONE CELL OF A LEVEL-3 ROW, whatever its cell holds. A single item used to be
     left bare — "the cell is finished" — and that is exactly what made the page uneven: an item with
     a level-3 row can be dropped beside another and the pair read side by side, while an item sitting
     straight in a level-1 or level-2 cell has no level 3 to be placed in, so half a page answers the
     editor and half of it does not. Each item gets a row of its own, one per item, which is what keeps
     the page's appearance: what stood one above the other still stands one above the other, one level
     deeper. That is also what makes the tool a FIXED POINT — what it writes is cells holding rows, so
     a second run finds no item left in a cell. A `.qitem` is atomic: its stem and its options are one
     question and are never taken apart by the wrap. */
  for (const level of [1, 2]) {
    for (const row of rowsAt(level)) {
      for (const cell of row.children) {
        if (cell.kind !== 'el' || cell.tag !== 'div' || isBlock(cell) || classes(cell).includes('reveal')
          || classes(cell).includes('qitem')) continue;
        const pred = n => n.kind === 'el' && !isRow(n) && !isBlock(n) && !CONTROL.has(n.tag);
        if (cell.children.filter(pred).length < 1) continue;
        targets.push([cell, pred]);
      }
    }
  }

  for (const [parent, pred] of targets) {
    const out = [];
    for (const n of parent.children) {
      if (!pred(n)) { out.push(n); continue; }
      out.push({
        kind: 'el', tag: 'div', raw: ROW_OPEN, close: '</div>', children: [{
          kind: 'el', tag: 'div', raw: '<div>', close: '</div>', children: [n]
        }]
      });
      report.added++;
    }
    parent.children = out;
  }

  /* A QUESTION AUTHORED AS A CELL — `<div class="rows"><div class="qitem">` — IS PUT IN A CELL OF ITS
     OWN, so the row's child is a box and the question is that box's content; the next pass then gives
     the question its level-3 row like any other item. The cell is written here rather than through the
     loop above, because the loop's shape is a row around a cell and this needs only the cell. */
  for (const level of [1, 2]) {
    for (const row of rowsAt(level)) {
      const out = [];
      for (const n of row.children) {
        if (n.kind === 'el' && classes(n).includes('qitem')) {
          /* a question the wrap itself had already taken apart is put back together first: the rows
             inside it lose their boxes, so the question stays one item and the page stays three deep */
          const flat = [];
          for (const kid of n.children || []) {
            const oneCell = kid.kind === 'el' && kid.raw === ROW_OPEN && kid.children.length === 1
              && kid.children[0].kind === 'el' && kid.children[0].raw === '<div>';
            if (oneCell) { for (const g of kid.children[0].children) flat.push(g); }
            else flat.push(kid);
          }
          n.children = flat;
          out.push({ kind: 'el', tag: 'div', raw: '<div>', close: '</div>', children: [n] });
          report.added++;
        } else out.push(n);
      }
      row.children = out;
    }
  }

  /* A QUESTION HOLDS ITS OWN TEXT AND ITS OWN OPTIONS, never a row of its own: a row the wrap put
     inside it earlier is flattened back, so the question is one item and the page never reaches a
     fourth level. Only the tool's own boxes are flattened — one with an attribute of its own is
     content and stays. */
  for (const q of walk(tree, [], 0).filter(n => n.kind === 'el' && classes(n).includes('qitem'))) {
    const flat = [];
    for (const kid of q.children || []) {
      const oneCell = kid.kind === 'el' && kid.raw === ROW_OPEN && kid.children.length === 1
        && kid.children[0].kind === 'el' && kid.children[0].raw === '<div>';
      if (oneCell) { for (const g of kid.children[0].children) flat.push(g); report.added++; }
      else flat.push(kid);
    }
    q.children = flat;
  }

  /* the shape of the page the wrap produced, read back off the tree */
  const after = walk(tree, [], 0);
  const now = countRows(after);
  report.rows = now.rows; report.cells = now.cells;
  report.depth = now.depth;
  report.before = before;
  return { tree, report };
}

function countRows(all) {
  const out = { rows: 0, cells: 0, depth: {} };
  for (const n of all) {
    if (isRow(n)) {
      out.rows++;
      const l = n._depth + 1;
      out.depth[l] = (out.depth[l] || 0) + 1;
    }
  }
  /* a cell is an element child of a row; counted off the parent's children */
  for (const n of all) {
    if (!isRow(n)) continue;
    for (const c of n.children) if (c.kind === 'el') out.cells++;
  }
  return out;
}

/* every attribute that is not a class, counted: a rebuild that dropped one would move the number */
function attrCensus(src) {
  const out = {};
  for (const m of src.matchAll(/\s(id|style|data-[\w-]+|aria-[\w-]+|popover|src|href)\s*=/g)) {
    out[m[1]] = (out[m[1]] || 0) + 1;
  }
  return out;
}
const sameCensus = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

/* ---- THE PAGE'S TAGS, BALANCED, read by the same scanner -----------------------------------
   Counting `<div` against `</div>` is fooled by a specimen inside a `pre` and by a comment. This
   reads the tree instead: an element that never got a closer, or a closer that closed nothing, is the
   defect — and both are things the parser can only know by having parsed the page. */
function balance(src) {
  const tree = parse(src);
  const bad = [];
  (function visit(n, inRaw) {
    for (const c of n.children) {
      if (c.kind === 'text') {
        /* A SCRIPT'S OWN STRINGS ARE NOT MARKUP. An inline script that writes `<div …></div>` into the
           page carries a closer in a string, and the scanner keeps a script's body whole — so text
           inside a raw-text element is never read as a tag. */
        if (inRaw) continue;
        const m = /<\/[a-zA-Z][^>]*>/.exec(c.raw);
        if (m) bad.push('a closer with nothing to close: ' + m[0]);
        continue;
      }
      if (!c.close && !VOID.has(c.tag) && !/\/>$/.test(c.raw) && !RAWTEXT.has(c.tag))
        bad.push('<' + c.tag + '> is never closed');
      visit(c, RAWTEXT.has(c.tag));
    }
  })(tree, false);
  return bad;
}

/* ---- THE WRAP AS A RULE, read off the same tree the writer uses -----------------------------
   A page is wrapped when every item has a cell of its own, a row's children are cells, and no row
   stands directly in a row. NOTHING HERE COUNTS A LEVEL: the shape is rows holding cells and cells
   holding items, so another container around the page — or around the whole site — moves no
   assertion. `added` is the writer's own answer to "what is still outside a cell", so the gate and
   the fix can never disagree about what is left. */
function audit(src) {
  const { tree, report } = wrapPage(src);
  const all = walk(tree, [], 0);
  const bad = [];
  for (const n of all) {
    if (!isRow(n)) continue;
    for (const c of n.children) {
      if (c.kind !== 'el') continue;
      if (isRow(c)) bad.push({ rule: 'row-in-row', detail: 'a .rows holds a .rows directly — a row is a cell\'s child, never a row\'s' });
      else if (c.tag !== 'div') bad.push({ rule: 'row-child', detail: 'a .rows holds a <' + c.tag + '> — a row\'s children are cells' });
    }
  }
  return { added: report.added, error: report.error, bad, rows: all.filter(isRow).length };
}

function wrap(opts = {}) {
  if (qaOff('wrap')) return;
  const argv = flags(opts);
  const write = argv.includes('--write');
  const check = argv.includes('--check');
  const files = (opts.pages ? [].concat(opts.pages) : argv.filter(a => !a.startsWith('--')))
    .map(f => ({ label: f, abs: path.isAbsolute(f) ? f : path.join(ROOT, f) }));
  if (!files.length) {
    console.log('node qa/checks.mjs wrap [--write|--check] <page.html> […]');
    console.log('  no flag   report what the wrap would add');
    console.log('  --write   rewrite each page in place');
    console.log('  --check   1 unless the page is already wrapped, its attributes are intact and the');
    console.log('            scanner copies it through byte for byte');
    return 1;
  }
  let bad = 0;
  for (const { label: f, abs } of files) {
    const src = fs.readFileSync(abs, 'utf8');
    const roundTrip = serialize(parse(src)) === src;
    /* THE WRAP RUNS TO A FIXED POINT. Wrapping an item makes the cell around it one level deeper,
       which can leave that cell holding something else bare: on this page the second pass found six
       more. So --write repeats until a pass adds nothing, and reports the total the page gained. */
    let cur = src, tree = null, report = null, passes = 0, total = 0;
    for (;;) {
      const r = wrapPage(cur);
      tree = r.tree; report = r.report;
      if (report.error || !report.added) break;
      const next = serialize(tree);
      if (next === cur) break;                 /* nothing the tool can do: report what is left */
      total += report.added;
      cur = next;
      if (++passes > 8) break;
    }
    const { tree: _t, report: _r } = wrapPage(src);
    report.added = total || report.added;
    const out = serialize(tree);
    const censusOk = sameCensus(attrCensus(src), attrCensus(out));
    const shape = `rows ${_r.before ? _r.before.rows : '?'} → ${report.rows} · cells ${_r.before ? _r.before.cells : '?'} → ${report.cells}`
      + ` · depth ${Object.entries(report.depth).sort().map(([k, v]) => `${k}:${v}`).join(' ')}`
      + ` · +${report.added} row${report.added === 1 ? '' : 's'}`;

    const notes = [];
    if (!roundTrip) notes.push('SCANNER ALTERS THE PAGE (round trip differs) — nothing written');
    if (!censusOk) notes.push('ATTRIBUTES CHANGED (id/style/data-*/aria-* census differs) — nothing written');
    if (report.error) notes.push(report.error);

    if (write && !report.error && roundTrip && censusOk && report.added) fs.writeFileSync(abs, out, 'utf8');
    console.log(`${f} — ${shape}${notes.length ? ' · ' + notes.join(' · ') : ''}`);

    if (check) {
      if (!roundTrip) { console.log(`  ✗ ${f}: the scanner does not copy this page through — a fix is needed before the wrap is read`); bad++; }
      if (!censusOk) { console.log(`  ✗ ${f}: an attribute would change`); bad++; }
      if (report.added) { console.log(`  ✗ ${f}: ${report.added} item(s) still outside a cell of their own — run with --write`); bad++; }
      if (report.error) bad++;
    }
    /* a page that is already wrapped must come back unchanged: the tool is a fixed point */
    if (!check && !write && !report.added && out !== src) { console.log(`  ! ${f}: no row added, yet the output differs`); bad++; }
  }
  return bad ? 1 : 0;
}

return { wrap, audit, balance };

})();
/* =====================================================================================
   [CHECK 1] — the prose: the map page's Checks bullets, read at run time
   ===================================================================================== */
export const check1 = (() => {
  /* THE ITEMS ARE THE GUIDANCE'S, NOT A COPY OF THEM. They are the `<li>` bullets of the map page's
     `Checks` section, read at run time. Rewording a bullet changes this check with no edit here, and
     no bullet can be silently dropped: every one is printed as PROBED (a named probe below runs it),
     MATERIAL (the extract it needs is printed for the reader) or UNPROBED (nothing implements it).
     The level read is one of those bullets (the map's difficulty item), so it reports the page
     against PEDAGOGY-MAP.md's own [LEVEL] section and freezes no definition of its own. */
  const MAP = 'extra/lesson1-The Capability Map.html';

  const textOf = s => String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

  function mapBullets() {
    const file = path.join(ROOT, MAP);
    if (!fs.existsSync(file)) return null;
    const src = fs.readFileSync(file, 'utf8');
    const at = src.indexOf('<summary>Checks</summary>');
    if (at < 0) return null;
    const open = src.indexOf('<ul>', at), shut = src.indexOf('</ul>', open);
    if (open < 0 || shut < 0) return null;
    return [...src.slice(open, shut).matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => textOf(m[1])).filter(Boolean);
  }

  const N = { one: 1, two: 2, three: 3, four: 4, five: 5 };

  /* what the run reads: prose on the command line, or the lesson pages the scope section resolves */
  function sources(argv) {
    const t = argv.find(a => a.startsWith('--text='));
    if (t) return [{ rel: 'prose on the command line', track: null, n: null, file: null, src: t.slice('--text='.length) }];
    const out = [];
    for (const track of pickTracks(argv)) {
      for (const n of authoredLessons(track, argv)) {
        const file = lessonFile(track, n);
        if (!file) { console.log('❌ lesson ' + n + ' does not exist in ' + track); continue; }
        out.push({ rel: path.relative(ROOT, file).split(path.sep).join('/'), track, n, file, src: fs.readFileSync(file, 'utf8') });
      }
    }
    return out;
  }

  /* one page's prose, its headings, its items — read without a DOM */
  function read(one) {
    const src = one.src;
    const area = (src.match(/<div class="content-area"[\s\S]*$/i) || [src])[0];
    const body = textOf(area);
    const headings = [...area.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => textOf(m[1]));
    const stems = [...area.matchAll(/class="qstem"[^>]*>([\s\S]*?)<\/span>/gi)].map(m => textOf(m[1]))
      .filter(s => s && s !== '▶' && !/^\d+\.$/.test(s));
    const secs = headings.filter(h => !/caderno|notebook/i.test(h));
    const paras = [...area.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
      .map(m => textOf(m[1])).filter(s => s.length > 20 && !/^(complete|write|read|choose)\b/i.test(s));
    const count = re => (area.match(re) || []).length;
    return {
      body, headings, stems, paras, secs,
      produced: count(/<textarea[^>]*class="[^"]*\bwrite\b/gi) + count(/<input[^>]*class="[^"]*\bgap\b/gi),
      picked: count(/<input[^>]*type="radio"/gi),
      qitems: count(/class="qitem"/gi),
      blocks: count(/class="block\b/gi),
      feed: count(/id="feed"/gi),
      firstBlock: (area.match(/<div[^>]*class="[^"]*\bblock\b[^"]*"[^>]*>([\s\S]*?)<h3[^>]*>([\s\S]*?)<\/h3>/i) || [])[2],
    };
  }

  /* ---- the probes: each one a named rule, run against the prose the page carries ---------------- */

  function registerFile(track) {
    const f = path.join(ROOT, track.toUpperCase() + '-REGISTER.md');
    return fs.existsSync(f) ? f : null;
  }

  function roadmapSection(track, n) {
    const f = path.join(ROOT, track, 'roadmap.md');
    if (!fs.existsSync(f)) return [];
    const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
    const at = lines.findIndex(l => new RegExp('^## (?:\\[' + n + '\\]|Lesson ' + n + '\\b)').test(l));
    if (at < 0) return [];
    const out = [];
    for (let i = at + 1; i < lines.length && !lines[i].startsWith('## '); i++) if (lines[i].trim()) out.push(lines[i].trim());
    return out;
  }

  /* the ledger is one line under each roadmap heading: `- Ledger: rul>ex>mc>…` */
  function ledgerTail(track, n) {
    const f = path.join(ROOT, track, 'roadmap.md');
    if (!fs.existsSync(f)) return [];
    const out = [];
    let lesson = 0;
    for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      const h = /^## (?:\[(\d+)\]|Lesson (\d+))/.exec(line);
      if (h) { lesson = Number(h[1] || h[2]); continue; }
      const l = /^\s*-\s*Ledger\s*:\s*(.+)$/i.exec(line);
      if (l && lesson && lesson < n) out.push('L' + lesson + ' | ' + l[1].trim());
    }
    return out.slice(-3);
  }

  const PROBES = [
    { name: 'headings', re: /Read the section headings alone/i, run(one, P) {
      const fails = [], lines = [];
      if (!P.headings.length) fails.push('the page carries no section headings');
      lines.push(P.headings.map((h, i) => (i + 1) + '. ' + h).join(' | ') || '(none)');
      for (const h of P.headings) {
        if (/^\s*\d+[.)]\s/.test(h)) fails.push('a heading carries a number: "' + h + '"');
        if (/\b\d+(?:st|nd|rd|th)\s+(?:form|tense|lesson)\b/i.test(h)) fails.push('a heading carries a number: "' + h + '"');
        if (/[.?]$/.test(h)) fails.push('a heading is a sentence, not a name: "' + h + '"');
      }
      return { fails, lines };
    } },

    { name: 'first-block', re: /Read the first block on its own/i, run(one, P) {
      const fails = [], lines = [];
      if (!P.blocks) fails.push('the page carries no block');
      else if (!P.firstBlock) fails.push('the first block opens with no <h3>');
      else lines.push('first block: "' + P.firstBlock + '"');
      return { fails, lines };
    } },

    /* THE LEVEL READ — one of the map's bullets, reported against PEDAGOGY-MAP.md's own [LEVEL]
       section, read at run time. It freezes no definition: the bands below are parsed out of the
       guidance's own sentences, and the guidance is printed for the reader. */
    { name: 'level', re: /Read the difficulty against the lesson's number/i, run(one, P, bullet, ctx) {
      const fails = [], lines = [];
      const lvl = ctx.level || '';
      if (!lvl) { lines.push('PEDAGOGY-MAP.md has no [LEVEL] section — nothing to read the page against'); return { fails, lines }; }
      const bands = [...lvl.matchAll(/[Ll]esson (\d+)/g)].map(m => Number(m[1])).sort((a, b) => a - b);
      const n = one.n || 0;
      const band = n ? bands.filter(b => b <= n).pop() : null;
      if (band != null) {
        const line = lvl.split(/\r?\n/).find(l => new RegExp('Lesson ' + band + '\\b').test(l)) || '';
        lines.push('lesson ' + n + ' sits at the guidance\'s "' + band + '" band: ' + line.replace(/^[\s\t*-]+/, '').slice(0, 220));
      }
      lines.push('items: ' + P.produced + ' produced · ' + P.picked + ' picked');
      lines.push('the other half (nothing depends on English the course has not taught) is a reading: the guidance above is printed for it');
      return { fails, lines };
    } },
  ];

  /* ---- MATERIAL: the extract the bullet needs, printed so the reader can run the item ---------- */
  const MATERIAL = [
    { re: /Read the roadmap section line by line/i, run(one) {
      if (!one.track) return ['no track: a --text run has no roadmap'];
      const lines = roadmapSection(one.track, one.n);
      return lines.length ? lines.slice(0, 12).map(l => l.slice(0, 160)) : ['no roadmap section for this lesson'];
    } },
    { re: /Read the register: remove a scene/i, run(one) {
      const f = one.track && registerFile(one.track);
      if (!f) return ['no register file to read'];
      return ['register: ' + path.relative(ROOT, f).split(path.sep).join('/'),
        ...fs.readFileSync(f, 'utf8').split(/\r?\n/).filter(l => /^###/.test(l)).map(l => l.trim())];
    } },
    { re: /Read three examples and three drill items at random/i, run(one, P) {
      const pick = (a, k) => a.slice().sort(() => Math.random() - 0.5).slice(0, k);
      return [...pick(P.paras, 3).map(s => 'example: ' + s.slice(0, 150)),
        ...pick(P.stems, 3).map(s => 'drill: ' + s.slice(0, 150))];
    } },
    { re: /Read the block sequence against the three ledger lines/i, run(one, P) {
      if (!one.track) return ['no track: a --text run has no ledger'];
      const tail = ledgerTail(one.track, one.n);
      return [...tail.map(l => 'ledger: ' + l.slice(0, 200)),
        'this page: ' + (P.headings.join(' | ') || '(no headings)')];
    } },
    { re: /Read the examples of speech/i, run(one, P) {
      const speech = P.paras.filter(s => /['’]|would have|would've|have\b/i.test(s)).slice(0, 4);
      return speech.length ? speech.map(s => 'speech: ' + s.slice(0, 150))
        : ['no example of speech found in the prose'];
    } },
  ];

  async function check1(opts = {}) {
    if (qaOff('check1')) return;
    const argv = flags(opts);
    const items = mapBullets();
    if (!items) {
      console.log('❌ check1: ' + MAP + ' has no Checks section — the items are read from it, never copied');
      return 1;
    }
    const ones = sources(argv);
    if (!ones.length) {
      console.log('check1 — nothing to read: name lessons (--track=<t> <n…>) or pass --text="<prose>"');
      return 0;
    }
    const map = path.join(ROOT, 'PEDAGOGY-MAP.md');
    let level = '';
    if (fs.existsSync(map)) {
      const all = fs.readFileSync(map, 'utf8');
      const at = all.indexOf('## [LEVEL]');
      if (at >= 0) {
        const rest = all.slice(at);
        const next = rest.slice(1).search(/\r?\n## /);
        level = next < 0 ? rest : rest.slice(0, next + 1);
      }
    }
    const findings = [];
    let failed = 0;
    console.log('check1 — ' + items.length + ' item(s) from ' + MAP + ' · reads: ' + ones.map(o => o.rel).join(', '));
    for (const one of ones) {
      const P = read(one);
      const at = one.track ? one.track + ' ' + one.n : one.rel;
      console.log('\n' + at + ' · ' + P.headings.length + ' section(s) · ' + P.qitems + ' item(s)');
      for (const bullet of items) {
        const label = bullet.split(/\s+/).slice(0, 12).join(' ');
        const probe = PROBES.find(p => p.re.test(bullet));
        const mat = !probe && MATERIAL.find(m => m.re.test(bullet));
        if (probe && !one.file && /headings|quiz|first-block/.test(probe.name)) {
          /* prose on the command line has no sections or items to read */
          console.log('  · MATERIAL — ' + label + '\n    (a --text run carries prose only: no page structure to read)');
          continue;
        }
        if (probe) {
          const r = probe.run(one, P, bullet, { level });
          for (const l of r.lines) console.log('  · ' + l);
          if (r.fails.length) {
            failed++;
            for (const f of r.fails) {
              console.log('  ❌ ' + f);
              findings.push(finding('check1', probe.name, 'fix', at, f));
            }
          } else console.log('  ✅ PROBED ' + probe.name + ' — ' + label);
        } else if (mat) {
          console.log('  · MATERIAL — ' + label);
          for (const l of mat.run(one, P)) console.log('    ' + l);
        } else {
          console.log('  · UNPROBED — ' + label);
        }
      }
    }
    queueFindings(findings, { batch: opts.batch, fn: 'check1' });
    console.log('\n' + (failed ? '❌ check1: ' + failed + ' item(s) failed' : '✅ check1: every probed item passes'));
    return failed ? 1 : 0;
  }

  return check1;
})();

/* =====================================================================================
   [CHECK 2] — the page: its markup, its running state, and the one count of its words
   ===================================================================================== */
export const { check2 } = (() => {
let JSDOM;   /* assigned by check2, inside the function that needs it */
/* A CLASS THAT IS ONLY A MARKER, not a style: engine4 adds `g4-hear` at load and reads `g4-keep` to
   know which nodes are the place the game happens in, and the flip deck's `flip-grid` is its own
   container. None of the three is a typo, so none is reported. */
const MARKER_CLASSES = new Set(['g4-hear', 'g4-keep', 'flip-grid']);
const RUNTIME_CLASSES = new Set(['eq-ready', 'layout-on', 'layout-panelled', 'layout-drag', 'layout-shift',
  'layout-dragging', 'layout-line', 'layout-chip', 'layout-panel', 'layout-grip', 'editing', 'kbd',
  'no-js', 'is-inside', 'lvl1', 'lvl2', 'lvl3']);

/* the ledger is one line per lesson under its roadmap heading: `- Ledger: rul>ex>mc>…`, the block
   types that page built, in page order. A lesson is ledgered when that line exists. */
function ledgerLine(track, n) {
  if (!track || !n) return '';
  const f = path.join(ROOT, track, 'roadmap.md');
  if (!fs.existsSync(f)) return '';
  let lesson = 0;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const h = /^## (?:\[(\d+)\]|Lesson (\d+))/.exec(line);
    if (h) { lesson = Number(h[1] || h[2]); continue; }
    const l = /^\s*-\s*Ledger\s*:\s*(.+)$/i.exec(line);
    if (l && lesson === n) return l[1].trim();
  }
  return '';
}
const ledgered = (track, n) => !!ledgerLine(track, n);
const ledgerSeq = (track, n) => ledgerLine(track, n).split('>').map(s => s.trim()).filter(Boolean);

/* the page's own block sequence: a block names its type in `data-type` (the ledger's subject words),
   an older activity block in `data-activity`, and a teaching block with neither reads `teach` */
function blockSeq(area) {
  return [...area.querySelectorAll('.block')].map(b =>
    b.getAttribute('data-type') || b.getAttribute('data-activity') || 'teach');
}

/* the longest run of the same types, in the same order, in two sequences */
function longestRun(a, b) {
  let best = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      let k = 0;
      while (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) k++;
      if (k > best) best = k;
    }
  }
  return best;
}
/* the edit-mode chrome the layout editor adds to the live page: never part of a saved page */
const DOMCHROME = dom => [...dom.querySelectorAll('.layout-chip,.layout-panel,.layout-line,.layout-grip,#layoutLayer')];

/* ---- the static rules: what the page is made of ----------------------------------------- */
function staticRules(p, src, ctx) {
  const fails = [], halts = [], warns = [], notes = [];
  const dom = new JSDOM(src).window.document;
  const area = dom.querySelector('.content-area') || dom.body;
  const ledger = ledgered(p.track, p.n);
  /* a halt: the page has no content root, so nothing else it says can be read */
  if (!dom.querySelector('.content-area')) halts.push('no .content-area — the page has no content root');

  /* TAGS ARE READ BY A PARSER, NOT COUNTED. `<div` against `</div>` is fooled by a specimen inside a
     pre and by a comment; the scanner knows which element a closer closed and which one never got
     one. */
  for (const b of balance(src).slice(0, 4)) fails.push('tag: ' + b);

  /* every #anchor goes somewhere */
  const ids = new Set([...dom.querySelectorAll('[id]')].map(e => e.id));
  for (const a of dom.querySelectorAll('a[href^="#"]')) {
    const h = a.getAttribute('href');
    if (h.length > 1 && !ids.has(h.slice(1))) fails.push('dead anchor: ' + h);
  }

  /* every class the page carries is a class the sheet knows (warn: a typo renders, it just does not
     look right) */
  const unknown = new Set();
  for (const el of dom.querySelectorAll('[class]'))
    for (const c of el.getAttribute('class').split(/\s+/).filter(Boolean))
      if (!ctx.css.has(c) && !RUNTIME_CLASSES.has(c) && !MARKER_CLASSES.has(c)) unknown.add(c);
  if (unknown.size) warns.push('class with no rule in style.css: ' + [...unknown].join(', '));

  /* a block opens with its headline (the block letter is drawn from it), and never holds a block */
  const blocks = [...area.querySelectorAll('.block')];
  if (!blocks.length && p.track) halts.push('no .block — the page carries no lesson block');
  if (blocks.length) {
    const headless = blocks.filter(b => !(b.firstElementChild && b.firstElementChild.tagName === 'H3'));
    if (headless.length) {
      const msg = headless.length + ' of ' + blocks.length + ' block(s) open with no <h3> — the block letter is drawn from the headline';
      (ledger ? fails : warns).push(msg);
    }
    const nested = area.querySelectorAll('.block .block').length;
    if (nested) fails.push(nested + ' block(s) nested inside a block — a block is never a second block');
  }

  /* every answer has a key, and every key names an option */
  for (const el of area.querySelectorAll('[data-answer]'))
    if (!el.getAttribute('data-answer').trim()) fails.push('empty data-answer on a <' + el.tagName.toLowerCase() + '>');
  /* a listen chip with no words behind it is a dead button */
  const mute = [...area.querySelectorAll('.listen')].filter(b => !b.getAttribute('data-say'));
  if (mute.length) fails.push(mute.length + ' .listen chip(s) without data-say — a dead button');
  for (const q of area.querySelectorAll('.qitem[data-a]')) {
    const vals = [...q.querySelectorAll('input[type=radio], input[type=checkbox]')].map(i => i.value);
    if (!vals.length) { fails.push('.qitem[data-a]="' + q.getAttribute('data-a') + '" holds no radio or checkbox'); continue; }
    const keys = q.getAttribute('data-a').split('|').map(s => s.trim());
    const lost = keys.filter(k => !vals.includes(k));
    if (lost.length) fails.push('.qitem data-a="' + q.getAttribute('data-a') + '" names ' + lost.join(',') + ' but the options are ' + vals.join(','));
  }
  /* items are numbered, and a block that holds answers says so */
  const answered = blocks.filter(b => b.querySelector('input.gap,textarea.write,input[type=radio]'));
  const unnumbered = answered.filter(b => !b.querySelector('.qnum'));
  if (unnumbered.length) warns.push(unnumbered.length + ' block(s) hold answers but carry no .qnum — items are numbered 1., 2. …');

  /* ---- the markup box: a tool, and read only where one exists ----------------------------- */
  const markup = area.querySelector('.markup-row');
  if (markup) {
    if (p.track) fails.push('a markup box on a lesson page — a markup box is a build tool, never content');
    for (const s of area.querySelectorAll('.markup-row summary'))
      for (const h of (s.textContent.match(/#[a-z0-9][a-z0-9-]*/g) || []))
        if (!ids.has(h.slice(1))) fails.push('stub label points at nothing: ' + h);
    for (const pre of area.querySelectorAll('.markup-row pre')) {
      if (pre.children.length) fails.push('a <pre> holds parsed markup, not escaped tags: ' + pre.firstElementChild.outerHTML.slice(0, 40));
      else if (!/&lt;/.test(pre.innerHTML)) fails.push('a <pre> in a markup box holds no escaped tag');
    }
  }

  /* ---- the wrap: rows hold cells, a cell holds its items --------------------------------
     A ROW INSIDE A ROW IS A FAILURE wherever it appears: it is a shape the sheet cannot read. The
     rest of the wrap — a row holding a bare element, an item with no cell of its own — is reported
     as a WARNING, because the pages built before this rule are not wrapped yet and a gate that reds
     on the whole corpus is a gate nobody runs. `node qa/checks.mjs wrap --write <page>` is the fix, and the
     count is what is left to do. */
  const wrap = audit(src);
  if (wrap.error) fails.push('wrap: ' + wrap.error);
  const rowwise = wrap.bad.filter(b => b.rule === 'row-in-row');
  for (const b of rowwise.slice(0, 3)) fails.push('wrap: ' + b.detail);
  if (rowwise.length > 3) fails.push('wrap: … and ' + (rowwise.length - 3) + ' more rows inside rows');
  const unbundled = wrap.bad.filter(b => b.rule !== 'row-in-row').length + wrap.added;
  if (unbundled) warns.push('not wrapped: ' + unbundled + ' item(s) stand outside a cell of their own — run `node qa/checks.mjs wrap --write ' + p.rel + '`');

  /* ---- the edit tool's marks never reach a saved page ---------------------------------- */
  const marks = area.querySelectorAll('[data-layout-grain],[data-layout-pin],[data-layout-sel],[contenteditable]');
  const chrome = DOMCHROME(dom);
  if (marks.length) fails.push(marks.length + ' element(s) carry the edit tool\'s marks (data-layout-* / contenteditable) — a save writes a clean page');
  if (chrome.length) fails.push(chrome.length + ' element(s) of edit-mode chrome are in the page');

  /* ---- the block sequence, read against the track's ledger ------------------------------- */
  if (p.track && p.n) {
    const seq = blockSeq(area);
    for (const prev of [p.n - 1, p.n - 2, p.n - 3]) {
      if (prev < 1) continue;
      const before = ledgerSeq(p.track, prev);
      if (!before.length) continue;
      const run = longestRun(seq, before);
      if (run >= 4) fails.push('blocks: ' + run + ' in a row as L' + prev + ' — the same run of block types');
      else if (run === 3) warns.push('blocks: 3 in a row as L' + prev + ' — the same run of block types');
    }
  }

  notes.push(blocks.length + ' block(s) · ' + wrap.rows + ' row(s)' + (markup ? ' · a markup box' : '')
    + (p.track ? ' · a lesson page' : ' · not a track page: static only'));
  const h1 = area.querySelector('h1');
  return { fails, halts, warns, notes, h1: h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '' };
}

/* ---- the runtime half: the page as a student loads it ----------------------------------
   The static rules read the source; these read the running page in jsdom, with a stubbed login so the
   engines boot exactly as a signed-in student sees them. Only what a source cannot answer is here:
   the engines ran, every answer control resolved an anchor, no game was left unwired, no console
   error. */
const SECRET = 'abreportas2025';

const mockFetch = () => {
  global.fetch = async () => ({ ok: true, status: 200, headers: new Map(),
    text: async () => '{}', json: async () => ({ status: 'ok', result: 'ok' }) });
};
function gated(html, track) {
  const email = 'qa@test.com', s = hashStr(email + track + SECRET);
  return html.replace('<head>', '<head><script>(function(){const store={};'
    + 'sessionStorage.setItem("gate",' + JSON.stringify(JSON.stringify({ email, track, teacher: true, sig: s })) + ');'
    + 'sessionStorage.getItem=k=>store[k]||null;sessionStorage.setItem=(k,v)=>{store[k]=v;};'
    + 'navigator.mediaDevices=navigator.mediaDevices||{};'
    + 'navigator.mediaDevices.getUserMedia=async()=>({getTracks:()=>[],getAudioTracks:()=>[]});'
    + '})();</script>');
}

async function runtime(base, p, html) {
  const fails = [], halts = [];
  const console_ = [];
  const rel = path.relative(ROOT, p.file).split(path.sep).join('/');
  const dom = new JSDOM(gated(html, p.track), {
    runScripts: 'dangerously', resources: 'usable', url: base + '/' + rel, pretendToBeVisual: true,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
      w.requestAnimationFrame = cb => setTimeout(cb, 0);
      w.fetch = (...a) => global.fetch(...a);
      const r = { top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20, x: 0, y: 0 };
      w.Element.prototype.getBoundingClientRect = () => r;
      w.Range.prototype.getBoundingClientRect = () => r;
      w.console.error = (...a) => { const m = a.join(' '); if (!/Failed to load resource|net::/.test(m)) console_.push(m); };
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  const w = dom.window, d = w.document;
  if (!w.__A) halts.push('engine1.js did not execute');
  if (!w.__B) halts.push('engine2.js did not execute');
  if (w.ansOf) {
    const controls = [...d.querySelectorAll('input.gap, input[type="radio"], textarea')].filter(el => el.id !== 'feed');
    const un = controls.filter(el => { const a = w.ansOf(el); return !a || !a.anchor; }).length;
    /* EVERY control unanchored is a halt (its inputs are not wired up at all); one is a local defect */
    if (un && un === controls.length) halts.push('every answer control (' + un + ') resolves no anchor — the answer is never saved');
    else if (un) fails.push(un + ' answer control(s) resolve no anchor — the answer is never saved');
  }
  const dead = [...d.querySelectorAll('.game[data-game]')].filter(g => !g.classList.contains('g4-ready')).length;
  if (dead) fails.push(dead + ' game block(s) engine4 never wired');
  console_.forEach(e => halts.push('console error: ' + e));
  const area = d.querySelector('.content-area');
  const h1 = area && area.querySelector('h1');
  const out = { fails, halts, h1: h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '' };
  w.close();
  return out;
}

  /* ---- what this run reads — the scope section is the one owner of it -------------------------------- */
  const REFUSED = Symbol('refused');
  const refuse = msg => { console.log('❌ ' + msg); throw REFUSED; };

  function scope(argv) {
    const PAGE = (argv.find(a => a.startsWith('--page=')) || '').slice('--page='.length);
    if (PAGE) {
      const file = path.isAbsolute(PAGE) ? PAGE : path.join(ROOT, PAGE.replace(/\\/g, '/'));
      if (!fs.existsSync(file)) refuse('no such page: ' + PAGE);
      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      const m = /^([^/]+)\/(?:lessons\/)?lesson(\d+)-/.exec(rel);
      const track = m && TRACKS.includes(m[1]) ? m[1] : null;
      return [{ file, rel, track, n: m ? Number(m[2]) : null, demo: !!track && isDemo(ROOT, track) }];
    }
    /* THE TRACKS, AND NO SECOND OPINION: an explicit --track or --all names them; with neither, the
       working tree names one, and two is a refusal rather than a quiet sweep. */
    let tracks;
    if (hasTrackFlag(argv) || hasAllFlag(argv)) tracks = pickTracks(argv).filter(t => !isDemo(ROOT, t));
    else {
      const s = touchedScope();
      if (!s) return [];
      if (s.tracks.length > 1) refuse('two tracks are touched (' + s.tracks.join(', ') +
        ') — name one with --track=<t>: a gate that reads two tracks is not a gate about the one being written');
      tracks = s.tracks;
    }
    const named = pickNumbers(argv);
    const flagged = pickLessonsFlag(argv) || [];
    const s = touchedScope();
    const out = [];
    for (const t of tracks) {
      let list;
      if (named.length) list = named;
      else if (flagged.length) list = flagged;
      else if (hasAllFlag(argv)) list = lessonsOnDisk(t);      /* --all is the only full sweep, said out loud */
      else list = s && s.numbers.has(t) ? [...s.numbers.get(t)].sort((a, b) => a - b) : [];
      if (!list.length) {
        refuse('nothing is being written in ' + t + ' — name the pages (--lessons=21-25, or 21 22), ' +
          'or --all for the whole track, or --page=<path>');
      }
      for (const n of list) {
        const file = lessonFile(t, n);
        if (!file) refuse('lesson ' + n + ' does not exist in ' + t);
        out.push({ file, rel: path.relative(ROOT, file).split(path.sep).join('/'), track: t, n, demo: false });
      }
    }
    return out;
  }

  /* ---- the run ------------------------------------------------------------------------------- */
  const ruleOf = s => String(s).split(/[—:(]/)[0].trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const haltRule = s => (/^engine/.test(s) ? 'engines'
    : /every answer control/.test(s) ? 'anchors'
      : /console error/.test(s) ? 'console' : 'shell');

  async function check2(opts = {}) {
    if (qaOff('check2')) return;
    /* jsdom is loaded HERE, inside the function that needs it — never at the top of the file */
    JSDOM = (await import('jsdom')).JSDOM;
    const argv = flags(opts);
    const STATIC_ONLY = argv.includes('--static');
    let pages;
    try { pages = scope(argv); } catch (e) { if (e === REFUSED) return 1; throw e; }
    if (!pages.length) {
      console.log('check2 — nothing to audit: no page in this task is touched. Name one: --track=<t> 3, --page=<path>, or --all.');
      return 0;
    }
    const sheet = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
    const css = new Set([...sheet.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map(m => m[1]));

    const server = await startServer();
    const base = 'http://localhost:' + server.port;
    mockFetch();

    console.log('check2 — ' + pages.length + ' page(s) · ' + (STATIC_ONLY ? 'static only' : 'static + runtime')
      + ' · reads: ' + pages.map(p => p.rel).join(', '));
    const findings = [];
    let failed = 0, warned = 0, skipped = 0;
    try {
      for (const p of pages) {
        if (p.track && p.n && isExcluded(p.track, p.n)) {
          console.log('⏭  ' + p.rel + ' — excluded: an open review batch in PENDING for ' + p.track + ' ' + p.n);
          skipped++;
          continue;
        }
        const src = fs.readFileSync(p.file, 'utf8');
        const st = staticRules(p, src, { css });
        let rt = { fails: [], halts: [], h1: '' };
        if (!STATIC_ONLY && p.track) rt = await runtime(base, p, src);
        const fails = st.fails.concat(rt.fails), halts = st.halts.concat(rt.halts), warns = st.warns.slice();
        const line = [st.notes.join(' · ')];
        const h1 = rt.h1 || st.h1;
        if (h1) line.push('h1 ' + h1.length);

        console.log((fails.length || halts.length ? '❌ ' : warns.length ? '⚠  ' : '✅ ') + p.rel);
        console.log('     ' + line.join(' · '));
        for (const f of halts.concat(fails)) console.log('     - ' + f);
        for (const w of warns) console.log('     ~ ' + w);

        const at = p.track ? p.track + ' ' + p.n : p.rel;
        /* a halt LEAVES the run; a page that is not a lesson cannot leave a batch of lessons, so its
           halt is recorded as a fix and the page still fails */
        for (const h of halts) findings.push(finding('check2', haltRule(h), (p.track && p.n) ? 'halt' : 'fix', at, h));
        for (const f of fails) findings.push(finding('check2', ruleOf(f), 'fix', at, f));
        for (const w of warns) findings.push(finding('check2', ruleOf(w), 'note', at, w));
        if (fails.length || halts.length) failed++; else if (warns.length) warned++;
      }
    } finally { await server.close(); }

    queueFindings(findings, { batch: opts.batch, fn: 'check2' });
    const total = pages.length - skipped;
    console.log('\n' + (failed
      ? '❌ ' + failed + ' of ' + total + ' page(s) failed' + (warned ? ' · ' + warned + ' warned' : '')
      : '✅ ' + total + ' page(s) pass' + (warned ? ' · ' + warned + ' warned' : '')));
    return failed ? 1 : 0;
  }

  return { check2 };
})();

/* =====================================================================================
   [ALIGN] — the end-of-batch pass: rendered geometry, and the two things a reader does last
   The geometry is measured here, on a real browser, at measured widths. The other two jobs of
   this step are the reader's and have no code here: marking every Portuguese phrase `.pt` (it is
   done on the page as it stands, never during the build), and writing the quiz from what the
   lesson taught. Both are the step's own work, and neither is a check.
   ===================================================================================== */
export const { align, chromePath } = (() => {
  const EMAIL = 'align.qa@ingles.test';
  const SECRET = 'abreportas2025';
  let TOL = 30, WIDTHS = [1280, 1024], VERBOSE = false;

function chromePath() {
  const cands = [process.env.CHROME,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  throw new Error('no Chrome found — set CHROME=<path to chrome.exe>');
}
/** launch and attach one blank target; returns {send, sid, close} */
async function openBrowser(port) {
  const profile = path.join(os.tmpdir(), 'align-' + process.pid + '-' + port);
  const proc = spawn(chromePath(), ['--headless=new', '--remote-debugging-port=' + port,
    '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--mute-audio', 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let ver = null;
  for (let i = 0; i < 80 && !ver; i++) {
    try { ver = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json(); }
    catch (e) { await sleep(250); }
  }
  if (!ver) { proc.kill(); throw new Error('chrome did not open a DevTools endpoint'); }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  const send = (method, params = {}, sessionId) => new Promise(res => {
    const i = ++id; pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });
  const t = await send('Target.createTarget', { url: 'about:blank' });
  const a = await send('Target.attachToTarget', { targetId: t.result.targetId, flatten: true });
  return { send, sid: a.result.sessionId, close: () => { try { ws.close(); } catch (e) { } proc.kill(); } };
}
/* THE READING. EqualizeRows.clean() restores the authored page — widths, align-self, the centred cell and
   the margins the spacing lever wrote. `run` is then made a no-op, so a late font or image solve cannot
   put the solver back while the cells are read. Each cell is held at align-self:flex-start, so its rect is
   its own content's height and never the row's. */
const MEASURE = () => `(() => {
  const E = window.EqualizeRows;
  if (!E) return JSON.stringify({ error: 'this page does not load equalize.js' });
  const SEL = '.content-area .rows:not(.markup-row)';
  /* FIRST READ — the page as the student sees it, after the solver has redistributed widths. This is the
     only state in which a squeezed cell exists: the authored page gives every cell its half, and the solver
     then hands the wide content its share. A chip run or a chart that no longer fits is read here. */
  const solved = [];
  document.querySelectorAll(SEL).forEach(r => {
    solved.push(Array.prototype.slice.call(r.children).map(c => {
      const cw = c.getBoundingClientRect().width;
      const sq = [];
      Array.prototype.forEach.call(c.querySelectorAll('.chips'), el => {
        const kids = Array.prototype.slice.call(el.children);
        if (!kids.length) return;
        const st = getComputedStyle(el);
        const gap = parseFloat(st.columnGap || st.gap) || 0;
        const nat = kids.reduce((a, k) => a + k.getBoundingClientRect().width, 0) + gap * (kids.length - 1);
        const first = kids[0].getBoundingClientRect().height || 1;
        const rows = Math.max(1, Math.round(el.getBoundingClientRect().height / first));
        if (nat > cw + 2) {
          const n = el.closest('.block') && el.closest('.block').querySelector('h3');
          sq.push({ what: (n ? n.textContent : 'chips').trim().slice(0, 22), want: Math.round(nat), have: Math.round(cw), rows: rows });
        }
      });
      Array.prototype.forEach.call(c.querySelectorAll('table.chart'), el => {
        const nat = el.scrollWidth;
        if (nat > cw + 2) {
          const n = el.closest('.block') && el.closest('.block').querySelector('h3');
          sq.push({ what: 'chart in ' + (n ? n.textContent.trim().slice(0, 18) : 'block'), want: Math.round(nat), have: Math.round(cw), rows: 0 });
        }
      });
      return { w: Math.round(cw), squeeze: sq };
    }));
  });
  /* THIRD READ, inside an activity: a .qgrid lays its questions in adjacent cells, so the questions are
     cells too — one long question beside two short ones is the same fault as a lopsided row, and only the
     rendered page can see it. Also read every answer line: a scramble's input.gap is declared in em from
     its answer, and one that does not fit its cell is what squeezes the chips above it. */
  const inside = [];
  document.querySelectorAll('.content-area .qgrid').forEach(g => {
    const items = Array.prototype.slice.call(g.children);
    const hs = items.map(i => Math.round(i.getBoundingClientRect().height));
    if (items.length < 2) return;
    const d = Math.max(...hs) - Math.min(...hs);
    if (d > ${TOL}) {
      const n = g.closest('.block') && g.closest('.block').querySelector('h3');
      inside.push({ what: (n ? n.textContent : 'a question grid').trim().slice(0, 32), d: d,
                    items: hs.join(' / ') });
    }
  });
  document.querySelectorAll('.content-area .gap').forEach(el => {
    const want = el.getBoundingClientRect().width;
    const cell = el.closest('.rows') && el.closest('.rows').children;
    let have = 0;
    for (const c of (cell || [])) if (c.contains(el)) have = c.getBoundingClientRect().width;
    if (have && want > have + 2) {
      const n = el.closest('.block') && el.closest('.block').querySelector('h3');
      inside.push({ what: 'answer line in ' + (n ? n.textContent.trim().slice(0, 20) : 'a block'),
                    d: 0, items: Math.round(want) + 'px wants > ' + Math.round(have) + 'px of cell' });
    }
  });
  /* SECOND READ — the authored page. clean() restores widths, align-self, the centred cell and the margins
     the spacing lever wrote; run is then a no-op so a late font cannot put the solver back. */
  E.clean(document);
  E.run = function () {};
  const out = [];
  document.querySelectorAll(SEL).forEach((r, i) => {
    const cs = Array.prototype.slice.call(r.children);
    if (cs.length < 2) { out.push({ row: i + 1, cells: [] }); return; }
    const prev = cs.map(c => c.style.alignSelf);
    cs.forEach(c => { c.style.alignSelf = 'flex-start'; });
    const cells = cs.map((c, j) => {
      const h3 = c.querySelector('h3');
      const first = c.querySelector('p,li,td');
      const label = h3 ? h3.textContent.trim()
        : (first ? first.textContent.trim() : '(empty)');
      /* a cell may hold more than one block: read each one, so a stacked column reports its parts and
         not just their sum */
      const blocks = Array.prototype.slice.call(c.children).filter(b => b.classList.contains('block'));
      const parts = blocks.length > 1 ? blocks.map(b => {
        const t = b.querySelector('h3');
        return { head: (t ? t.textContent : '?').trim().slice(0, 24), h: Math.round(b.getBoundingClientRect().height) };
      }) : null;
      const s = (solved[i] && solved[i][j]) || { w: Math.round(c.getBoundingClientRect().width), squeeze: [] };
      return { h: Math.round(c.getBoundingClientRect().height), head: label.slice(0, 34),
               w: s.w, authoredW: Math.round(c.getBoundingClientRect().width), parts: parts, squeeze: s.squeeze };
    });
    cs.forEach((c, j) => { if (prev[j]) c.style.alignSelf = prev[j]; else c.style.removeProperty('align-self'); });
    out.push({ row: i + 1, cells });
  });
  return JSON.stringify({ rows: out, inside: inside });
})()`;
/** print one lesson's rows; return the uneven ones */
function report(rows) {
  const bad = [];
  for (const r of rows) {
    if (!r.cells || r.cells.length < 2) continue;
    const hs = r.cells.map(c => c.h);
    const d = Math.max(...hs) - Math.min(...hs);
    const squz = [];
    r.cells.forEach(c => (c.squeeze || []).forEach(s => squz.push(
      s.what + ' wants ' + s.want + 'px in ' + s.have + 'px' + (s.rows > 1 ? ' (chips on ' + s.rows + ' rows)' : ''))));
    const squeeze = squz.length > 0;
    if (d <= TOL && !VERBOSE && !squeeze) continue;
    const short = r.cells.filter(c => c.h < Math.max(...hs) - TOL).map(c => {
      const gapPx = Math.max(...hs) - c.h;
      if (c.parts && c.parts.length) {
        const last = c.parts[c.parts.length - 1].head;
        return c.head + ' (last block there: ' + last + ' — ' + gapPx + 'px)';
      }
      return c.head + ' (' + gapPx + 'px)';
    });
    const parts = r.cells.map(c => (c.parts ? ' {' + c.parts.map(p => p.head + ' ' + p.h).join(' + ') + '}' : ''));
    console.log('  ' + (d > TOL ? '**' : squeeze ? '~~' : '  ') + ' row ' + String(r.row).padStart(2) + '  d=' + String(d).padStart(3) + 'px  ' +
      r.cells.map((c, i) => c.head + parts[i] + ' [' + c.h + ' / ' + c.w + 'w]').join('   |   ') +
      (short.length ? '   -> short: ' + short.join(' / ') : '') +
      (squeeze ? '   -> squeeze: ' + squz.join('; ') : ''));
    if (d > TOL || squeeze) bad.push({ row: r.row, d, short, squeeze: squz });
  }
  return bad;
}
  async function align(opts = {}) {
    if (qaOff('align')) return;
    const argv = flags(opts);
    TOL = (() => { const a = argv.find(s => s.startsWith('--tol=')); return a ? Number(a.slice(6)) : 30; })();
    WIDTHS = (() => {
      const a = argv.find(s => s.startsWith('--widths='));
      return a ? a.slice(9).split(',').map(Number).filter(Boolean) : [1280, 1024];
    })();
    VERBOSE = argv.includes('--verbose');

    const tracks = pickTracks(argv);
    const named = pickLessonsFlag(argv);
    const jobs = [];
    for (const t of tracks) {
      const have = lessonsOnDisk(t);
      const nums = named && named.length ? named.filter(n => have.includes(n)) : have;
      for (const n of nums) {
        if (isExcluded(t, n)) { console.log('align — ' + t + ' ' + n + ' is excluded: an open review batch in PENDING'); continue; }
        const f = lessonFile(t, n);
        if (f) jobs.push({ track: t, n, file: f });
      }
    }
    if (!jobs.length) { console.log('align: nothing to measure (no lesson page in scope)'); return 0; }
    console.log('align: ' + jobs.length + ' page(s), tolerance ' + TOL + 'px, widths ' + WIDTHS.join(' / '));

    const site = await startServer();
    const basePort = 9300 + (process.pid % 200);
    const failing = [];
    try {
      for (const w of WIDTHS) {
        const b = await openBrowser(basePort + (w % 7));
        await b.send('Page.enable', {}, b.sid);
        await b.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: false }, b.sid);
        console.log('\n-- width ' + w + 'px');
        for (const j of jobs) {
          const sig = hashStr(EMAIL + j.track + SECRET);
          /* one seed per navigation, written unconditionally: the newest script runs last, so the gate in
             sessionStorage always names the track of the page about to be loaded */
          await b.send('Page.addScriptToEvaluateOnNewDocument', {
            source: `sessionStorage.gate = JSON.stringify({ email: ${JSON.stringify(EMAIL)}, track: ${JSON.stringify(j.track)}, teacher: false, sig: ${sig} });`,
          }, b.sid);
          const url = 'http://127.0.0.1:' + site.port + '/' + j.track + '/lessons/' + encodeURIComponent(path.basename(j.file)) + '?v=' + Date.now();
          await b.send('Page.navigate', { url }, b.sid);
          let ready = false;
          for (let i = 0; i < 60 && !ready; i++) {
            const r = await b.send('Runtime.evaluate', {
              expression: "document.documentElement.classList.contains('eq-ready')", returnByValue: true }, b.sid);
            ready = !!(r.result && r.result.result && r.result.result.value === true);
            if (!ready) await sleep(200);
          }
          if (!ready) { console.log('  ?? ' + j.track + ' ' + j.n + ' — the page never reached eq-ready'); failing.push({ j, w }); continue; }
          const ev = await b.send('Runtime.evaluate', { expression: MEASURE(), returnByValue: true }, b.sid);
          const val = ev.result && ev.result.result && ev.result.result.value;
          if (!val) { console.log('  ?? ' + j.track + ' ' + j.n + ' — no reading'); continue; }
          const data = JSON.parse(val);
          if (data.error) { console.log('  ?? ' + j.track + ' ' + j.n + ' — ' + data.error); continue; }
          console.log(' ' + j.track + ' ' + j.n + ':');
          const bad = report(data.rows);
          if (data.inside && data.inside.length) {
            for (const s of data.inside) {
              console.log('  ** inside  ' + s.what + '  ' + (s.d ? 'items ' + s.items + ' (d=' + s.d + 'px)' : s.items));
            }
            bad.push({ row: 'inside', d: 0, short: [], squeeze: data.inside.map(s => s.what + ' — ' + s.items) });
          }
          if (bad.length) failing.push({ j, w, bad });
        }
        b.close();
      }
    } finally { await site.close(); }

    if (!failing.length) { console.log('\nalign: every measured row is within ' + TOL + 'px at ' + WIDTHS.join(' and ') + 'px'); return 0; }
    /* exit codes are set, never called: on Windows a pipe is written asynchronously and process.exit()
       would throw the report away */
    console.log('\nalign: ' + failing.length + ' uneven row reading(s) across ' +
      new Set(failing.map(f => f.j.track + ' ' + f.j.n)).size + ' lesson(s)');
    return 1;
  }

  return { align, chromePath };
})();

/* =====================================================================================
   [LIVE] — what only a painted page can answer: Chrome over CDP
   ===================================================================================== */
export const live = (() => {
  /* the live pass's own constants, kept beside its code. `TRACK`/`PAGE_REL`/`GATE`/`PROBE` are set by
     live() before any scenario runs; `ARGV` is this run's command line, so `has`/`arg` read the
     function's own flags and never the process's. */
  const OUT = path.join(ROOT, 'qa', '_live');
  const EMAIL = 'live.qa@ingles.test';
  const SECRET = 'abreportas2025';
  let LESSON = 1, TRACK = 'business', PAGE_REL = '/business/lessons/lesson1.html', GATE = null, PROBE = '';
  let ARGV = [];
  const has = n => ARGV.includes(n);
  const arg = (n, d) => { const a = ARGV.find(x => x.startsWith(n + '=')); return a ? a.slice(n.length + 1) : d };
  const log = (...a) => { const s = a.join(' '); console.log(s); try { fs.appendFileSync(path.join(OUT, 'run.txt'), s + '\n'); } catch (e) { } };
/* ---------------------------------------------------------------------------------------------
   1. THE FAKE BACKPACK (Apps Script) — same row shape / same actions as backend/Code.gs
   --------------------------------------------------------------------------------------------- */
const bp = { rows: [], log: [], postDelay: 0, seq: 0 };
const bpReset = () => { bp.rows = []; bp.log = []; bp.postDelay = 0; bp.seq = 0 };
const bpRow = r => ({ id: r.id, type: r.type, anchor: r.anchor, data: r.data, author: r.author, ts: r.ts, fileId: r.fileId || '', b64: r.b64 || '', mime: 'audio/webm' });
const bpLayer = (email, lesson) => bp.rows
  .filter(r => String(r.email) === String(email) && String(r.lesson) === String(lesson))
  .map(bpRow);
/* the write: like the backend — an id already present is REPLACED, otherwise appended; a clip that
   arrives as b64 comes back with a Drive pointer (the real path) and no inline copy */
function bpWrite(o) {
  const id = String(o.id || ('srv_' + (++bp.seq)));
  const i = bp.rows.findIndex(r => String(r.id) === id);
  if (i >= 0) bp.rows.splice(i, 1);
  const row = {
    id, email: o.email || '', track: o.track || '', lesson: o.lesson == null ? '' : o.lesson,
    type: o.type || '', anchor: o.anchor || '',
    data: typeof o.data === 'string' ? o.data : JSON.stringify(o.data == null ? '' : o.data),
    author: o.author || 'aluno', ts: new Date().toISOString(),
    b64: o.b64 ? '' : '', fileId: o.b64 ? 'FAKE_' + id + '.webm' : ''
  };
  bp.rows.push(row);
  return row;
}
const bpDel = id => { const n = bp.rows.length; bp.rows = bp.rows.filter(r => String(r.id) !== String(id)); return n - bp.rows.length };
function bpForeign(tag) {   /* a row from ANOTHER session: changes the poll's id signature */
  bp.rows.push({
    id: 'foreign_' + tag, email: EMAIL, track: TRACK, lesson: LESSON, type: 'hl',
    anchor: 'foreign row ' + tag, data: '{"color":"red","b":0,"o":0}',
    author: 'aluno', ts: new Date().toISOString(), fileId: '', b64: ''
  });
}function startSite() {
  /* the repo server from the scope section, plus the harness control API under /__bp — the page never calls it */
  return startServer((u, res) => {
    if (u.pathname !== '/__bp') return false;
    const q = u.searchParams;
    if (q.has('reset')) bpReset();
    if (q.has('delay')) bp.postDelay = Number(q.get('delay')) || 0;
    if (q.has('foreign')) bpForeign(q.get('foreign') || String(Date.now()));
    if (q.has('mk')) bp.rows.push(JSON.parse(q.get('mk')));
    if (q.has('del')) bpDel(q.get('del'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, n: bp.rows.length }));
    return true;
  });
}
/* ---------------------------------------------------------------------------------------------
   3. CHROME + A MINIMAL CDP CLIENT
   --------------------------------------------------------------------------------------------- */function launchChrome(profile) {
  const args = [
    '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--window-size=1400,1000', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-sync', '--disable-default-apps',
    '--disable-extensions', '--disable-component-update', '--disable-client-side-phishing-detection',
    '--disable-features=Translate,MediaRouter,OptimizationHints', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--allow-running-insecure-content', 'about:blank'
  ];
  if (has('--headful')) { args.shift(); args.splice(1, 0, '--start-maximized'); }
  const proc = spawn(chromePath(), args, { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let buf = '';
    const onData = d => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) { proc.stderr.off('data', onData); resolve({ proc, browserWs: m[1] }); }
    };
    proc.stderr.on('data', onData);
    proc.on('error', reject);
    setTimeout(() => reject(new Error('chrome did not print a DevTools endpoint:\n' + buf)), 20000);
  });
}function connect(wsUrl) {
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
      if (m.id) {
        const w = c.waiters.get(m.id);
        if (w) { c.waiters.delete(m.id); m.error ? w.rej(new Error(w.method + ': ' + JSON.stringify(m.error))) : w.res(m.result) }
        return;
      }
      for (const fn of (c.listeners.get(m.method) || [])) fn(m.params, m.sessionId);
    });
    ws.addEventListener('error', e => reject(new Error('ws error: ' + (e.message || 'unknown'))));
    ws.addEventListener('open', () => resolve(c));
  });
}/* every request to the Apps Script deployment is answered by the fake sheet above */
function wireBackpack(cdp) {
  cdp.on('Fetch.requestPaused', async p => {
    const req = p.request || {};
    const url = req.url || '';
    const finish = obj => cdp.send('Fetch.fulfillRequest', {
      requestId: p.requestId, responseCode: 200,
      responseHeaders: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Cache-Control', value: 'no-store' }
      ],
      body: Buffer.from(JSON.stringify(obj)).toString('base64')
    }).catch(e => log('  !! fulfill failed', e.message));
    try {
      if (req.method === 'POST') {
        let body = req.postData;
        if (!body) { try { body = (await cdp.send('Fetch.getRequestPostData', { requestId: p.requestId })).postData } catch (e) { } }
        let o = {}; try { o = JSON.parse(body || '{}') } catch (e) { log('  !! bad POST body', body) }
        bp.log.push('POST ' + o.action + ' ' + (o.type || ''));
        if (bp.postDelay) await sleep(bp.postDelay);            /* a slow write (LockService / Drive) */
        let out;
        if (o.action === 'del') { const n = bpDel(o.id); out = { result: 'ok', purged: n > 0 } }
        else { bpWrite(o); out = { result: 'ok', id: o.id } }
        log('  bp ← POST', o.action, o.type || '', String(o.id || '').slice(0, 24), 'rows=' + bp.rows.length);
        return finish(out);
      }
      const q = new URL(url).searchParams;
      const action = q.get('action') || 'layer';
      bp.log.push('GET ' + action);
      if (action === 'file') return finish({ b64: 'TUlOSQ==', mime: 'audio/webm' });
      /* engine2.loadLayer reads j.rows — the real deployment answers {rows:[…]}; a bare array here
         would make EVERY poll return an empty layer, so no stored row could ever be restored and
         B-F2/B-F3 would "fail" for a harness reason instead of a real one */
      return finish({ rows: bpLayer(q.get('email'), q.get('lesson')) });
    } catch (e) {
      log('  !! interception error', e.message);
      return finish({ error: 'harness' });
    }
  });
}/* ---------------------------------------------------------------------------------------------
   4. THE INJECTED PROBE (runs in the page before any page script) + the driver helpers
   --------------------------------------------------------------------------------------------- */function probeFn(gate) {
  try { sessionStorage.setItem('gate', JSON.stringify(gate)) } catch (e) { }
  window.__errs = [];
  window.addEventListener('error', e => window.__errs.push('err:' + (e.message || e)));
  window.addEventListener('unhandledrejection', e => window.__errs.push('rej:' + ((e.reason && e.reason.message) || e.reason)));
  /* --- fake microphone: a MediaRecorder stand-in whose level goes loud then SOLENT, so the page's
         own silence detector stops the clip ~immediately (fast tests, no 15s wait per recording).
         getByteTimeDomainData is what the page samples, so the level is scripted there. ------- */
  (function () {
    var SILENT_AFTER = 900;
    function FakeRec(stream, opts) {
      var self = this, done = false;
      this.state = 'inactive'; this.ondataavailable = null; this.onstop = null; this.onerror = null;
      this.start = function () { self.state = 'recording' };
      this.stop = function () {
        if (done) return; done = true; self.state = 'inactive';
        if (typeof self.ondataavailable === 'function') self.ondataavailable({ data: { size: 20300, type: (opts && opts.mimeType) || 'audio/webm' } });
        if (typeof self.onstop === 'function') self.onstop();
      };
      this.addEventListener = function (n, f) { self['on' + n] = f };
      this.removeEventListener = function () { };
    }
    FakeRec.isTypeSupported = function () { return true };
    window.MediaRecorder = FakeRec;
    var stream = { getTracks: function () { return [{ stop: function () { } }] }, getAudioTracks: function () { return [{ stop: function () { } }] } };
    /* `mediaDevices` is a READONLY accessor on Navigator.prototype: a plain assignment silently fails
       in a real browser and the page would then call the REAL getUserMedia (permission denied in
       headless). The fake must be forced in with defineProperty, with a last-resort fallback. */
    var gum = { getUserMedia: function () { window.__recT0 = Date.now(); return Promise.resolve(stream) }, enumerateDevices: function () { return Promise.resolve([]) } };
    try { Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: gum }) }
    catch (e) { try { navigator.mediaDevices.getUserMedia = gum.getUserMedia } catch (e2) { } }
    var analyser = {
      fftSize: 2048, frequencyBinCount: 1024, connect: function () { }, disconnect: function () { },
      getByteTimeDomainData: function (a) {
        var loud = (Date.now() - (window.__recT0 || 0)) < SILENT_AFTER;
        for (var i = 0; i < a.length; i++) a[i] = loud ? 128 + 60 * Math.sin(i / 3) : 128;
      },
      getByteFrequencyData: function (a) { for (var i = 0; i < a.length; i++) a[i] = 0 }
    };
    function FakeCtx() {
      this.state = 'running';
      this.createMediaStreamSource = function () { return { connect: function () { }, disconnect: function () { } } };
      this.createAnalyser = function () { return analyser };
      this.close = function () { }; this.resume = function () { return Promise.resolve() };
    }
    window.AudioContext = FakeCtx; window.webkitAudioContext = FakeCtx;
  })();
  /* --- geometry + state helpers (window.__q) ------------------------------------------------- */
  var Q = {};
  Q.T = function () {                      /* visible text + the text nodes it is made of */
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), ns = [], all = '', n;
    while ((n = w.nextNode())) {
      var p = n.parentElement;
      if (p && p.closest('script,style,.pop,#hlLayer,#toast,.recind')) continue;
      ns.push({ n: n, s: all.length });
      all += n.data;
    }
    return { all: all, ns: ns };
  };
  Q.find = function (sub, occ) {           /* the nth occurrence of `sub` -> the boundary points */
    var m = Q.T(), all = m.all, want = occ || 0, at = -1, c = 0, i = -1;
    for (; ;) {
      i = all.indexOf(sub, i + 1);
      if (i < 0) break;
      if (c === want) { at = i; break }
      c++;
    }
    if (at < 0) return null;
    var end = at + sub.length, a = null, b = null, k, o;
    for (k = 0; k < m.ns.length; k++) {
      o = m.ns[k];
      if (!a && o.s <= at && at < o.s + o.n.data.length) a = { n: o.n, off: at - o.s };
      if (!b && o.s < end && end <= o.s + o.n.data.length) b = { n: o.n, off: end - o.s };
    }
    if (!a || !b) return null;
    return { ns: a.n, os: a.off, ne: b.n, oe: b.off, txt: sub, i: at };
  };
  Q.rng = function (p) { var r = document.createRange(); r.setStart(p.ns, p.os); r.setEnd(p.ne, p.oe); return r };
  /* the selection the page had AT the moment the button was released, captured before the engine can
     destroy it: the Ctrl path (hlFromSelection) removes all ranges inside its own mouseup listener,
     so reading getSelection() from outside can only ever see "". Registered here at document start,
     i.e. BEFORE engine1.js, and with capture:true — capture listeners run in registration order, so
     this one always observes the selection the gesture ended with. Empty changes are ignored so the
     engine clearing the ranges a moment later cannot wipe the record. */
  window.__lastSel = '';
  var noteSel = function () { try { var s = getSelection(), t = s ? s.toString() : ''; if (t) window.__lastSel = t } catch (e) { } };
  document.addEventListener('selectionchange', noteSel, true);
  document.addEventListener('mouseup', noteSel, true);
  Q.lastSel = function () { return window.__lastSel };
  Q.dotAt = function (p) {                 /* viewport coords for a drag over a range, current scroll */
    var r = Q.rng(p), rs = [];
    try { rs = [].slice.call(r.getClientRects()) } catch (e) { }
    rs = rs.filter(function (b) { return b.width > 0 || b.height > 0 });
    if (!rs.length) return { err: 'no rect for ' + p.txt };
    var first = rs[0], last = rs[rs.length - 1];   /* a multi-line phrase: from the first to the last line */
    return {
      txt: p.txt, occ: p.i, lines: rs.length,
      sx: Math.round(first.left + 1), sy: Math.round(first.top + first.height / 2),
      ex: Math.round(last.right - 1), ey: Math.round(last.bottom - last.height / 2),
      rect: [Math.round(first.left), Math.round(first.top), Math.round(first.width), Math.round(first.height)]
    };
  };
  Q.dot = function (sub, occ) {            /* viewport coords for a drag over the nth occurrence */
    var p = Q.find(sub, occ);
    if (!p) return { err: 'text not found: ' + sub };
    var host = p.ns.parentElement || document.body;
    try { host.scrollIntoView({ block: 'center', inline: 'nearest' }) } catch (e) { }
    return Q.dotAt(p);
  };
  /* TWO dots for ONE drag that may run from a phrase to ANOTHER one far away: scrolling per-dot would
     invalidate the first dot's viewport coords, so scroll ONCE for the union of both ranges and measure
     the two ends at that single scroll position. */
  Q.dot2 = function (sa, oa, sb, ob) {
    var pa = Q.find(sa, oa), pb = Q.find(sb, ob);
    if (!pa) return { err: 'text not found: ' + sa };
    if (!pb) return { err: 'text not found: ' + sb };
    var ra = Q.rng(pa).getBoundingClientRect(), rb = Q.rng(pb).getBoundingClientRect();
    var sy = window.scrollY || 0, top = Math.min(ra.top + sy, rb.top + sy), bot = Math.max(ra.bottom + sy, rb.bottom + sy);
    var room = Math.max(80, window.innerHeight - 150);
    window.scrollTo(0, Math.max(0, (bot - top < room) ? (top + bot) / 2 - window.innerHeight / 2 : top - 90));
    return { a: Q.dotAt(pa), b: Q.dotAt(pb) };
  };
  Q.rectsOf = function (sub, occ) {        /* every line rectangle of the nth occurrence, in doc coords */
    var p = Q.find(sub, occ); if (!p) return [];
    var r = Q.rng(p), out = [];
    try { out = [].slice.call(r.getClientRects()) } catch (e) { }
    var sx = window.scrollX || 0, sy = window.scrollY || 0;
    return out.filter(function (b) { return b.width > 0 || b.height > 0 })
      .map(function (b) { return [Math.round(b.left + sx), Math.round(b.top + sy), Math.round(b.width), Math.round(b.height)] });
  };
  Q.rectOf = function (sub, occ) { var d = Q.dot(sub, occ); return d.err ? d.err : d.rect };
  Q.docRect = function (node) { var r = node.getBoundingClientRect(); return [Math.round(r.left + scrollX), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)] };
  Q.rects = function () {
    return [].slice.call(document.querySelectorAll('#hlLayer .hlr')).map(function (d) {
      var b = d.getBoundingClientRect();
      return { id: d.getAttribute('data-hlid'), cls: d.className, doc: [Math.round(b.left + scrollX), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)] };
    });
  };
  /* every piece of a note/recording anchor. A piece is one mark.nb[data-a=…] element: engine1's
     nbWrap deliberately SPLITS a mark an overlapping save merely crosses, so an anchor can be painted
     by several pieces — B-F4 is exactly the question of whether it should be. The dump therefore
     carries b/o (the stored occurrence, once the engine records it), kids (how many nodes the mark
     covers: only a MULTI-node mark can be split) and the mark's own document rectangle. */
  Q.marks = function () {
    var out = [].slice.call(document.querySelectorAll('mark.nb')).map(function (m) {
      return {
        a: m.getAttribute('data-a'), cls: m.className, txt: m.textContent,
        b: m.dataset.b == null ? null : Number(m.dataset.b),
        o: m.dataset.o == null ? null : Number(m.dataset.o),
        kids: m.childNodes.length, doc: Q.docRect(m)
      };
    });
    /* notes are painted on their own layer: surface each note (ONE per ntList entry — a multi-line note
       paints several rectangles, but it is still ONE note) with a synthetic mark-like shape (cls
       'nb has-note', txt = anchor) so the note assertions and the split/cut invariants still see them
       exactly as if they were text marks */
    if (typeof ntList !== 'undefined') ntList.forEach(function (r) {
      var rs = (r.rects || []).filter(function (b) { return b.width > 0 && b.height > 0 });
      out.push({ a: r.anchor, cls: 'nb has-note', txt: r.anchor, b: r.b, o: r.o, kids: 0,
        doc: rs.length ? [Math.round(rs[0].left), Math.round(rs[0].top), Math.round(rs[0].width), Math.round(rs[0].height)] : null });
    });
    return out;
  };
  Q.notes = function () {                   /* every note on its own layer (#noteLayer .ntr) */
    var byId = {};
    if (typeof ntList !== 'undefined') ntList.forEach(function (r) { byId[r.id] = r; });
    return [].slice.call(document.querySelectorAll('#noteLayer .ntr')).map(function (d) {
      var r = byId[d.getAttribute('data-ntid')] || {};
      var b = d.getBoundingClientRect();
      return { a: r.anchor, id: r.id, b: r.b, o: r.o, doc: [Math.round(b.left + scrollX), Math.round(b.top + scrollY), Math.round(b.width), Math.round(b.height)] };
    });
  };
  Q.pieces = function (a) { return Q.marks().filter(function (m) { return m.a === a }) };
  Q.rectHit = function (r1, r2) {          /* do two document rectangles touch at all? */
    return !(r1[0] + r1[2] <= r2[0] || r2[0] + r2[2] <= r1[0] || r1[1] + r1[3] <= r2[1] || r2[1] + r2[3] <= r1[1]);
  };
  Q.rectsHit = function (list, want) {     /* any of these painted rects over any of these text rects? */
    for (var i = 0; i < list.length; i++) for (var k = 0; k < want.length; k++) if (Q.rectHit(list[i], want[k])) return true;
    return false;
  };
  Q.markRect = function (a, i) {           /* a mark piece's viewport rect, scrolled into view */
    var list = [], all = document.querySelectorAll('mark.nb');
    for (var k = 0; k < all.length; k++) if (all[k].getAttribute('data-a') === a) list.push(all[k]);
    var el = list[i || 0];
    if (!el) {                             /* a note lives on its own layer: find its rect there */
      var nIds = [];
      if (typeof ntList !== 'undefined') ntList.forEach(function (r) { if (r.anchor === a) nIds.push(r.id); });
      var nd = nIds[i || 0] ? document.querySelector('#noteLayer .ntr[data-ntid="' + nIds[i || 0] + '"]') : null;
      if (!nd) return null;
      try { nd.scrollIntoView({ block: 'center' }) } catch (e) { }
      var br = nd.getBoundingClientRect();
      return [Math.round(br.left), Math.round(br.top), Math.round(br.width), Math.round(br.height)];
    }
    try { el.scrollIntoView({ block: 'center' }) } catch (e) { }
    var rs = [].slice.call(el.getClientRects());
    var r = (rs.length ? rs[0] : el.getBoundingClientRect());
    return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
  };
  Q.spanOf = function (sub, occ) {         /* the ENGINE's own ruler: {b,start,end} of the nth occurrence */
    var p = Q.find(sub, occ); if (!p) return null;
    try {
      var blk = hlBlockOf(p.ns); if (!blk) return null;
      var b = hlBlocks().indexOf(blk); if (b < 0) return null;
      return { b: b, start: hlOffset(blk, p.ns, p.os), end: hlOffset(blk, p.ne, p.oe) };
    } catch (e) { return { err: String((e && e.message) || e) } }
  };
  Q.freeSpot = function () {               /* a point that is NOT a link/button/popup: safe to click to dismiss */
    var bad = 'a,button,input,textarea,select,label,.pop,[onclick]';
    var W = innerWidth, H = innerHeight;
    var pts = [[Math.round(W - 6), 4], [4, 4], [Math.round(W / 2), 4],
    [4, Math.round(H - 6)], [Math.round(W - 6), Math.round(H - 6)]];
    for (var i = 0; i < pts.length; i++) {
      var x = pts[i][0], y = pts[i][1];
      if (x < 1 || y < 1 || x > W - 2 || y > H - 2) continue;
      var el = document.elementFromPoint(x, y);
      if (!el) continue;
      if (el.closest && el.closest(bad)) continue;
      return [x, y];
    }
    return null;
  };
  Q.popup = function () {
    var p = document.querySelector('.pop');
    if (!p) return null;
    var btns = [].slice.call(p.querySelectorAll('button')).map(function (b) { return b.id + (b.disabled ? '#' : (b.className.indexOf('locked') >= 0 ? '*' : '')) });
    var nb = p.querySelector('#nbNote'), nt = p.querySelector('#nt');
    return {
      cls: p.className, buttons: btns.join(','),
      note: nb ? nb.textContent : null, editing: !!nt,
      text: (p.textContent || '').split(' ').join(' ').slice(0, 140)
    };
  };
  Q.state = function () {
    var out = { errs: (window.__errs || []).slice(0, 5) };
    out.errb = (document.getElementById('errb') || {}).textContent || null;
    out.toast = (document.getElementById('toast') || {}).textContent || null;
    out.A = !!window.__A; out.B = !!window.__B;
    out.host = location.pathname;
    out.sel = (function () { try { var s = getSelection(); return s ? s.toString() : '' } catch (e) { return '?' } })();
    var g = function (v) { try { return v } catch (e) { return null } };
    var rows = g(typeof layer === 'undefined' ? null : layer) || [];
    out.layer = rows.map(function (r) { return { id: r.id, type: r.type, anchor: r.anchor, data: r.data, fileId: r.fileId || '' } });
    var nl = g(typeof nbLocal === 'undefined' ? null : nbLocal) || [];
    out.nbLocal = nl.map(function (r) { return r.id + '|' + r.type + '|' + r.anchor });
    var po = g(typeof pendingOps === 'undefined' ? null : pendingOps) || [];
    out.pending = po.map(function (p) { return p.id.slice(0, 18) + '|' + p.action + '|' + Math.round((p.until - Date.now()) / 1000) + 's' });
    var hl = g(typeof hlList === 'undefined' ? null : hlList) || [];
    out.hlList = hl.map(function (r) { return { id: r.id, color: r.color, anchor: r.anchor, b: r.b, start: r.start, end: r.end, nrects: (r.rects || []).length } });
    out.hlr = Q.rects();
    out.marks = Q.marks();
    out.notes = Q.notes();
    out.popup = Q.popup();
    return out;
  };
  window.__q = Q;
}/* ---------------------------------------------------------------------------------------------
   5. THE DRIVER — real mouse/keyboard over CDP, plus dumps and PNG evidence
   --------------------------------------------------------------------------------------------- */
class Live {
  constructor(cdp, url) { this.cdp = cdp; this.url = url; this.shots = [] }
  async ev(expr) {
    const r = await this.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true, userGesture: true });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error('page eval failed: ' + ((d.exception && (d.exception.description || d.exception.value)) || d.text) + '\n  expr: ' + expr.slice(0, 300));
    }
    return r.result.value;
  }
  async wait(expr, ms = 8000, label) {
    const t0 = Date.now(), why = label || expr;
    for (; ;) {
      let v = false;
      try { v = await this.ev(expr) } catch (e) { }
      if (v) return v;
      if (Date.now() - t0 > ms) throw new Error('TIMEOUT waiting for: ' + why);
      await sleep(100);
    }
  }
  async boot() {                                   /* wait for a loaded page with both engines up */
    await this.wait('document.readyState==="complete"', 20000, 'document load');
    await this.wait('!!(window.__A&&window.__B)', 20000, 'engines loaded (__A/__B)');
    await sleep(400);
    const s = await this.state();
    if (String(s.host).indexOf(PAGE_REL) < 0) throw new Error('the browser is not on the lesson page: ' + s.host + ' (gate rejected?) ' + JSON.stringify(s.errs));
  }
  async nav(url) { await this.cdp.send('Page.navigate', { url: url || this.url }); await this.boot() }
  async reload() { await this.cdp.send('Page.reload', {}); await this.boot() }
  async state() { return this.ev('window.__q?window.__q.state():"no probe"') }
  async mouse(type, x, y, o = {}) {
    const mods = o.mods || 0;
    /* A DRAGGING mouseMoved must be tagged button:'left'. Measured live in the diag scenario:
       moves sent with button:'none' (however correct the buttons bitmask is) never extend a
       selection, so a drag selected NOTHING and no gesture in this harness could fire — while the
       exact same coordinates with button:'left' select the phrase and open the popup. */
    const buttons = o.buttons == null ? (type === 'mousePressed' ? 1 : 0) : o.buttons;
    await this.cdp.send('Input.dispatchMouseEvent', {
      type, x: Math.round(x), y: Math.round(y), modifiers: mods, pointerType: 'mouse',
      button: type === 'mouseMoved' ? (buttons ? 'left' : 'none') : 'left', clickCount: o.clicks || 1,
      buttons
    });
  }
  /* a real text selection: down, several moves, up — Chrome builds the selection itself */
  async drag(from, to, o = {}) {
    const mods = o.ctrl ? 2 : 0, steps = o.steps || 8;
    await this.mouse('mouseMoved', from.sx, from.sy, { mods, buttons: 0 });
    await sleep(40);
    await this.mouse('mousePressed', from.sx, from.sy, { mods, buttons: 1 });
    await sleep(60);
    for (let i = 1; i <= steps; i++) {
      await this.mouse('mouseMoved', from.sx + (to.ex - from.sx) * i / steps, from.sy + (to.ey - from.sy) * i / steps, { mods, buttons: 1 });
      await sleep(15);
    }
    await this.mouse('mouseReleased', to.ex, to.ey, { mods, buttons: 0 });
    await sleep(220);
  }
  async click(x, y, o = {}) {
    await this.mouse('mouseMoved', x, y, { mods: o.mods || 0, buttons: 0 });
    await this.mouse('mousePressed', x, y, { mods: o.mods || 0 });
    await sleep(30);
    await this.mouse('mouseReleased', x, y, { mods: o.mods || 0 });
    await sleep(150);
  }
  async key(key, code, mods = 0) {
    const base = { modifiers: mods, key, code, windowsVirtualKeyCode: key === 'Escape' ? 27 : (key === 'Control' ? 17 : 0), nativeVirtualKeyCode: 0 };
    await this.cdp.send('Input.dispatchKeyEvent', Object.assign({ type: 'keyDown' }, base));
    await this.cdp.send('Input.dispatchKeyEvent', Object.assign({ type: 'keyUp' }, base));
    await sleep(80);
  }
  clickSel(sel) { return this.ev('(function(){var e=document.querySelector(' + JSON.stringify(sel) + ');if(!e)return "missing "+' + JSON.stringify(sel) + ';e.click();return "clicked"})()') }
  typeInto(sel, text) {
    return this.ev('(function(){var e=document.querySelector(' + JSON.stringify(sel) + ');if(!e)return "missing";e.focus();e.value=' + JSON.stringify(text) + ';e.dispatchEvent(new Event("input",{bubbles:true}));return e.value})()');
  }
  async shot(name, box) {
    const p = { format: 'png', captureBeyondViewport: false };
    if (box) p.clip = { x: box[0], y: box[1], width: box[2], height: box[3], scale: 1 };
    const r = await this.cdp.send('Page.captureScreenshot', p);
    const file = path.join(OUT, name + '.png');
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    this.shots.push(file);
    log('      📷 ' + file);
    return file;
  }
  /* a compact, readable dump of everything the three bugs can be seen in */
  async dump(label, full) {
    const s = await this.state();
    log('   ── ' + label);
    log('      marks   : ' + JSON.stringify(s.marks));
    log('      hlr     : ' + JSON.stringify(s.hlr));
    if (full) {
      log('      hlList  : ' + JSON.stringify(s.hlList));
      log('      layer   : ' + JSON.stringify(s.layer));
      log('      nbLocal : ' + JSON.stringify(s.nbLocal));
      log('      pending : ' + JSON.stringify(s.pending));
    }
    log('      popup   : ' + JSON.stringify(s.popup));
    if (s.toast) log('      toast   : ' + JSON.stringify(s.toast));
    if (s.errb) log('      errb    : ' + JSON.stringify(s.errb));
    if (s.errs && s.errs.length) log('      pageErr : ' + JSON.stringify(s.errs));
    return s;
  }
}/* ---------------------------------------------------------------------------------------------
   6. ASSERTIONS + GESTURE HELPERS
   --------------------------------------------------------------------------------------------- */
let pass = 0, fail = 0;
const failures = [];
function check(name, cond, extra) {
  if (cond) { pass++; log('   ✅ ' + name) }
  else { fail++; failures.push(name); log('   ❌ ' + name + (extra === undefined ? '' : '   → ' + JSON.stringify(extra))) }
}
/* do two rectangle lists describe the same area (px tolerance)? */
function sameRects(got, want, tol = 4) {
  if (got.length !== want.length) return false;
  const norm = list => list.map(r => [r[0], r[1], r[2], r[3]]).sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
  const g = norm(got), w = norm(want);
  return g.every((r, i) => r.every((v, k) => Math.abs(v - w[i][k]) <= tol));
}
async function dragOver(live, txt, occ, ctrl) {
  const d = await live.ev('window.__q.dot(' + JSON.stringify(txt) + ',' + (occ || 0) + ')');
  if (d && d.err) throw new Error('dragOver(' + txt + '): ' + d.err);
  await live.ev('window.__lastSel=""');   /* a stale capture from an earlier gesture must never pass as this one's */
  await live.drag(d, d, { ctrl: !!ctrl });
  const sel = await live.ev('window.__q.lastSel()');
  return { d, sel };
}
/* Ctrl+drag = the highlight gesture: paints #hlLayer and writes one hl row */
async function paint(live, txt, occ, tag) {
  const r = await dragOver(live, txt, occ, true);
  log('   · ctrl-drag ' + JSON.stringify(txt) + (occ ? ' #' + occ : '') + ' → sel=' + JSON.stringify(r.sel) + ' lines=' + r.d.lines + ' rect=' + JSON.stringify(r.d.rect));
  if (tag) check(tag + ': the Ctrl gesture selected exactly the phrase', r.sel === txt, { got: r.sel, want: txt });
  return r;
}
/* plain drag = the note/recording gesture: opens the seven-button popup */
async function selectPhrase(live, txt, occ, tag) {
  const r = await dragOver(live, txt, occ, false);
  log('   · drag ' + JSON.stringify(txt) + (occ ? ' #' + occ : '') + ' → sel=' + JSON.stringify(r.sel));
  if (tag) check(tag + ': the plain drag selected exactly the phrase', r.sel === txt, { got: r.sel, want: txt });
  await live.wait('!!document.querySelector(".pop")', 4000, 'the selection popup');
  return r;
}
const api = (site, q) => fetch('http://127.0.0.1:' + site.port + '/__bp?' + q).then(r => r.json());/* ---------------------------------------------------------------------------------------------
   7. SCENARIO B-F2 — does a painted highlight PERSIST the way a note/recording does?
   --------------------------------------------------------------------------------------------- */
async function scenBF2(live, site) {
  log('\n================ B-F2 · HIGHLIGHT PERMANENCE (painted #hlLayer) ================');
  const H = "I'm Marina.";
  await api(site, 'reset=1');
  await live.nav();
  await live.dump('page loaded', true);

  log('\n step 1 — Ctrl+drag a phrase: it must be painted AND written as one "hl" row');
  await paint(live, H, 0, 'paint');
  const want = await live.ev('window.__q.rectsOf(' + JSON.stringify(H) + ',0)');
  let s = await live.dump('after the Ctrl+drag', true);
  check('the phrase is painted on #hlLayer', s.hlr.length >= 1, s.hlr);
  check('the painted rectangle sits on the text it covers', sameRects(s.hlr.map(r => r.doc), want), { painted: s.hlr.map(r => r.doc), text: want });
  check('exactly one server row, type "hl"', bp.rows.length === 1 && bp.rows[0].type === 'hl', bp.rows);
  check('the row carries anchor + {color,b,o}',
    bp.rows.length === 1 && bp.rows[0].anchor === H && /"color":"yellow"/.test(bp.rows[0].data) && /"b":\d+/.test(bp.rows[0].data) && /"o":\d+/.test(bp.rows[0].data),
    bp.rows[0] && { anchor: bp.rows[0].anchor, data: bp.rows[0].data });
  check('the palette opened above the fresh highlight', !!(s.popup && /hlpal/.test(s.popup.cls)), s.popup);
  await live.key('Escape', 'Escape');
  await live.shot('bf2-1-created', box(s.hlr[0] ? s.hlr[0].doc : [0, 0, 400, 200]));

  log('\n step 2 — two 1s polls later the highlight must still be exactly where it was');
  await sleep(2500);
  s = await live.dump('after ~2 polls', true);
  check('still painted after the polls', s.hlr.length >= 1, s.hlr);
  check('geometry unchanged across the polls', sameRects(s.hlr.map(r => r.doc), want, 6), { now: s.hlr.map(r => r.doc), was: want });
  check('still exactly one server row (no duplicate write)', bp.rows.length === 1, bp.rows.map(r => r.id));
  check('the local record kept its id and colour', s.hlList.length === 1 && s.hlList[0].color === 'yellow', s.hlList);

  log('\n step 3 — RELOAD: the row is on the server, so the highlight must come back by itself');
  await live.reload();
  await live.wait('document.querySelectorAll("#hlLayer .hlr").length>0', 6000, 'the highlight restored after a reload');
  s = await live.dump('after a reload', true);
  check('restored after a reload', s.hlr.length >= 1, s.hlr);
  const want2 = await live.ev('window.__q.rectsOf(' + JSON.stringify(H) + ',0)');
  check('restored on the very same characters', sameRects(s.hlr.map(r => r.doc), want2), { painted: s.hlr.map(r => r.doc), text: want2 });
  check('restored with its colour', s.hlList.length === 1 && s.hlList[0].color === 'yellow', s.hlList);
  await live.shot('bf2-2-after-reload', box(want2[0] || [0, 0, 400, 200]));
}

function box(doc) {                     /* a small screenshot window around a document rect */
  return [Math.max(0, doc[0] - 40), Math.max(0, doc[1] - 40), 420, 160];
}

/* B-F2 steps 4-5: the same string twice (block+offset must win) and a write slower than the
   12s pending window (the row is in flight for longer than the grace window protects it). */
async function scenBF2b(live, site) {
  log('\n step 4 — the SAME string twice in the page: block+offset must win over the text alone');
  const T2 = 'Are you from São Paulo?';
  await api(site, 'reset=1');
  await live.nav();
  await paint(live, T2, 0);
  await paint(live, T2, 1);
  const wantA = await live.ev('window.__q.rectsOf(' + JSON.stringify(T2) + ',0)');
  const wantB = await live.ev('window.__q.rectsOf(' + JSON.stringify(T2) + ',1)');
  let s = await live.dump('two identical strings highlighted', true);
  check('two rows stored for the same anchor text', bp.rows.length === 2 && bp.rows.every(r => r.anchor === T2), bp.rows.map(r => r.anchor));
  check('two rectangles painted, one per occurrence', s.hlr.length === 2, s.hlr);
  await live.reload();
  await live.wait('document.querySelectorAll("#hlLayer .hlr").length>1', 8000, 'both highlights restored');
  s = await live.dump('after a reload', true);
  const got = s.hlr.map(r => r.doc).sort((a, b) => a[1] - b[1]);
  check('each occurrence restored at ITS OWN place (block+offset wins)',
    got.length === 2 && sameRects([got[0]], [wantA[0]]) && sameRects([got[1]], [wantB[0]]),
    { got, wantA, wantB });
  await live.shot('bf2-3-two-identical', box(wantA[0] || [0, 0, 400, 200]));

  log('\n step 5 — a write SLOWER than the 12s pending window (in flight longer than the grace window)');
  await api(site, 'reset=1&delay=14000');
  await live.nav();
  const H3 = 'Nice to meet you.';
  await paint(live, H3, 0);
  const t0 = Date.now();
  let empty = 0, samples = 0, minN = 99;
  while (Date.now() - t0 < 20000) {
    const n = await live.ev('document.querySelectorAll("#hlLayer .hlr").length');
    samples++; minN = Math.min(minN, n);
    if (n === 0) empty++;
    await sleep(280);
  }
  s = await live.dump('after a 14s write finally landed', true);
  check('the highlight never vanished while its own write was still in flight', empty === 0,
    { samples, samplesWithNothingPainted: empty, minPainted: minN, rows: bp.rows.length });
  check('it is still painted once the row landed', s.hlr.length >= 1, s.hlr);
  check('the row really is on the server now', bp.rows.length === 1 && bp.rows[0].anchor === H3, bp.rows.map(r => r.anchor));
  await api(site, 'delay=0');
}/* ---------------------------------------------------------------------------------------------
   7b. NOTE / RECORDING GESTURES + THE THREE INVARIANTS THE OWNER REPORTS ON
   --------------------------------------------------------------------------------------------- */
const Pos = (t, o) => ({ t: t, o: o || 0 });        /* a phrase + which occurrence in the page */
const spanOf = (live, x) => live.ev('window.__q.spanOf(' + JSON.stringify(x.t) + ',' + x.o + ')');
const rectsOf = (live, x) => live.ev('window.__q.rectsOf(' + JSON.stringify(x.t) + ',' + x.o + ')');
const marksNow = live => live.ev('window.__q.marks()');
const notesNow = live => live.ev('window.__q.notes()');
const piecesOf = (live, a) => live.ev('window.__q.pieces(' + JSON.stringify(a) + ')');
const flagged = (ms, f) => ms.filter(m => String(m.cls || '').indexOf(f) >= 0);
const selNow = live => live.ev('(function(){var s=getSelection();return s?s.toString():""})()');
const hits = (live, ms, want) => live.ev('window.__q.rectsHit(' + JSON.stringify(ms.map(m => m.doc)) + ',' + JSON.stringify(want) + ')');
/* a REAL drag from the START of `from` to the END of `to`: ONE contiguous selection that may cross
   inline elements (<b>/<i>), which is exactly what makes a mark cover several child nodes — and only
   a multi-node mark can be split by a later save (engine1 nbWrap/nbSplitEl). This is the gesture the
   owner makes when a new note/recording "overlaps a previous one". */
async function dragSpan(live, from, to) {
  const d = await live.ev('window.__q.dot2(' + JSON.stringify(from.t) + ',' + from.o + ',' + JSON.stringify(to.t) + ',' + to.o + ')');
  if (!d || d.err) throw new Error('dragSpan(' + from.t + ' → ' + to.t + '): ' + ((d && d.err) || 'no dots'));
  await live.ev('window.__lastSel=""');
  await live.drag(d.a, d.b);
  return { a: d.a, b: d.b, sel: await live.ev('window.__q.lastSel()') };
}
async function selectSpan(live, from, to, tag) {
  const r = await dragSpan(live, from, to);
  log('   · drag ' + JSON.stringify(from.t) + ' → ' + JSON.stringify(to.t) + '  sel=' + JSON.stringify(r.sel));
  if (tag) check(tag, !!r.sel && r.sel.length >= 3, { sel: r.sel });
  await live.wait('!!document.querySelector(".pop")', 4000, 'the selection popup');
  return r;
}
/* 📝 Add/Edit Note → type → 💾 Save (the popup must be open from a selection gesture) */
async function dismiss(live) {              /* dismiss the popup the way a user does: a click outside it */
  const p = await live.ev('window.__q.freeSpot()');
  if (p) await live.click(p[0], p[1]);
  if (!(await live.ev('!document.querySelector(".pop")'))) await live.ev('closePop()');
  await sleep(120);
}
async function saveNote(live, text) {
  await live.wait('!!document.querySelector("#pN")', 3000, '📝 Add/Edit Note');
  await live.clickSel('#pN');
  await live.wait('!!document.querySelector("#nt")', 3000, 'the note editor');
  await live.typeInto('#nt', text);
  await live.clickSel('#pN');
  /* 💾 Save LEAVES the popup open ON PURPOSE (FUNCTION.md: Save drops the editor state, the seven
     buttons stay, the saved note shows above them) — so the proof a save went through is the editor
     DISAPPEARING, never the popup closing. The gesture then dismisses the popup like a user would. */
  await live.wait('!document.querySelector("#nt")', 4000, 'the editor closing on Save');
  await dismiss(live);
  await sleep(300);
}
async function makeNote(live, x, text) {           /* select a phrase, then save a note on it */
  await selectPhrase(live, x.t, x.o);
  await saveNote(live, text);
}
/* ⏺ Record: the fake mic goes loud then silent, so the page's own detector finishes the clip in ~3s
   and the mark is painted by the SAVE (never by the click). */
async function makeRec(live, x) {
  await selectPhrase(live, x.t, x.o);
  await live.clickSel('#pR');
  await live.wait('!!document.querySelector("mark.nb.has-rec")', 16000, 'the recording’s underline');
  await sleep(300);
  await dismiss(live);
}
/* THE TWO INVARIANTS the owner's reports reduce to:
     • pieces  — an anchor painted by MORE THAN ONE mark element (= what he sees as one note/recording
                 split into two underlines by a later, overlapping save);
     • fragment— a mark whose painted text is no longer its own anchor text (= the underline/wash left
                 covering only PART of the phrase the row is stored for: the "cut" the owner sees). */
function invariants(ms) {
  const by = {};
  /* ONE ITEM PER (anchor text, occurrence): the anchor text IDENTIFIES the item and the stored place
     (mark.nb data-b/data-o, owner spec 2026-10-13) only tells two identical strings apart — so a note
     in the top box and a recording on the same words in the dialogue are two items, NOT "one anchor
     split in two". Pieces of a REAL split still share the place of the mark they were cut from
     (nbSplitEl clones the attributes), and the `cut` half below catches their partial text anyway. */
  const key = m => m.a + '\u0000' + (m.b == null ? '' : m.b) + ':' + (m.o == null ? '' : m.o) + ':' + (m.cls.indexOf('has-rec') >= 0 ? 'rec' : 'note');
  ms.forEach(m => { const k = key(m); (by[k] = by[k] || []).push(m) });
  const split = Object.keys(by).filter(k => by[k].length > 1).map(k => by[k][0].a + ' ×' + by[k].length);
  const cut = ms.filter(m => String(m.txt || '').indexOf(m.a) < 0).map(m => ({ a: m.a, painted: m.txt }));
  return { n: ms.length, by, split, cut };
}
function checkInvariants(ms, tag) {
  const v = invariants(ms);
  check(tag + ': every anchor is painted by exactly ONE mark', v.split.length === 0, v.split);
  check(tag + ': every mark still covers exactly its own anchor text', v.cut.length === 0, v.cut);
  return v;
}
const rowsOf = type => bp.rows.filter(r => r.type === type);
/* real DOM click in the middle of a mark piece (viewport coords, scrolled into view first) */
async function clickPiece(live, a, i) {
  const r = await live.ev('window.__q.markRect(' + JSON.stringify(a) + ',' + (i || 0) + ')');
  if (!r) { check('the mark is on the page to click', false, a); return null }
  await live.click(r[0] + r[2] / 2, r[1] + r[3] / 2);
  return r;
}

/* ---------------------------------------------------------------------------------------------
   9. SCENARIO B-F4 — a later save that OVERLAPS an earlier mark must never cut or split it
      owner: "when a note overlaps a previous one the previous one gets cut"; "the recording gets
      split in two"; "after a reload it is still cut"
   --------------------------------------------------------------------------------------------- */
const P1a = "My name's Daniel.", P1b = "Meu nome é Daniel.";   /* the pair on line 31 of lesson 1 */
const P2b = "I'm from Brazil.";                                /* the tail the note reaches (line 32) */
/* ⏺ Record over a multi-node span (a phrase PAIR: <b>…</b> = <i>…</i>) */
async function recSpan(live, from, to) {
  await selectSpan(live, from, to, 'the recording’s selection was made');
  await live.clickSel('#pR');
  await live.wait('!!document.querySelector("mark.nb.has-rec")', 16000, 'the recording’s underline');
  await sleep(300);
  await dismiss(live);
}
/* 📝 note over a multi-node span */
async function noteSpan(live, from, to, text) {
  await selectSpan(live, from, to, 'the note’s selection was made');
  await saveNote(live, text);
}
async function scenBF4(live, site) {
  log('\n================ B-F4 · OVERLAPPING SAVES (cut / split marks) ================');

  log('\n step 1 — a recording across a phrase PAIR (one mark over <b>…</b> = <i>…</i>)');
  await api(site, 'reset=1');
  await live.nav();
  await recSpan(live, Pos(P1a, 0), Pos(P1b, 0));
  let ms = await marksNow(live);
  let s = await live.dump('the recording, before any overlap', true);
  check('the recording is ONE mark covering the whole pair',
    ms.length === 1 && !!ms[0] && ms[0].txt.indexOf(P1a) === 0 && ms[0].txt.indexOf(P1b) > 0, ms);
  check('ONE rec row, anchored to exactly what the mark paints',
    rowsOf('rec').length === 1 && !!ms[0] && rowsOf('rec')[0].anchor === ms[0].a, rowsOf('rec'));
  log('   · the recording row is anchored to ' + JSON.stringify(ms[0] && ms[0].a));
  checkInvariants(ms, 'recording only');

  log('\n step 2 — THE GESTURE: a NOTE starting inside the recording and ending on the NEXT pair');
  await noteSpan(live, Pos(P1b, 0), Pos(P2b, 0), 'nota que cruza');
  /* WHY the note may not be painted at all: a stored anchor is re-found ONLY by its text (findRange),
     so measure the anchor bytes against the page text and ask the engine itself. Read-only. */
  const why = await live.ev('(function(){var t=document.querySelector("p.pt").textContent;var i=t.indexOf("Meu nome");' +
    'var row=(layer.filter(function(r){return r.type==="note"})[0]||{});var a=String(row.anchor||"");' +
    'return{a:a,found:!!findRange(a),marks:nbMarks(a).length,slice:i<0?null:t.slice(i-2,i+40)}})()');
  log('   · the note row anchor is ' + JSON.stringify(why.a));
  log('   · the page text around it is ' + JSON.stringify(why.slice));
  log('   · findRange(anchor)=' + why.found + '   nbMarks(anchor)=' + why.marks);
  ms = await marksNow(live);
  s = await live.dump('after the overlapping note', true);
  const v2 = invariants(ms);
  check('the earlier recording is still ONE mark (not split into pieces)', v2.split.length === 0,
    { split: v2.split, marks: ms.map(m => ({ a: m.a, txt: m.txt })) });
  check('...still covering exactly its own anchor text (not cut)', v2.cut.length === 0, v2.cut);
  check('the note itself is one mark covering its own anchor', rowsOf('note').length === 1 &&
    ms.some(m => m.a === rowsOf('note')[0].anchor && String(m.txt || '').indexOf(m.a) >= 0),
    { note: rowsOf('note'), marks: ms.map(m => ({ a: m.a, txt: m.txt })) });
  check('exactly 2 rows on the server (1 rec + 1 note)', bp.rows.length === 2, bp.rows.map(r => r.type + ':' + r.anchor));
  log('   · marks now: ' + JSON.stringify(ms.map(m => ({ a: m.a, txt: m.txt, cls: m.cls }))));
  checkInvariants(ms, 'after the crossing note');

  log('\n step 3 — RELOAD: the cut/split must not survive (the rows are one anchor each)');
  await live.reload();
  await live.wait('!!document.querySelector("mark.nb")', 9000, 'the marks restored after a reload');
  await sleep(800);
  ms = await marksNow(live);
  const v3 = invariants(ms);
  check('after a reload the recording is STILL one whole mark', v3.split.length === 0 && v3.cut.length === 0, { split: v3.split, cut: v3.cut });
  check('...and both rows are still there, one anchor each',
    rowsOf('rec').length === 1 && rowsOf('note').length === 1, bp.rows.map(r => r.type + ':' + r.anchor));
  checkInvariants(ms, 'crossing note reload');

  log('\n step 4 — CONTROL: two DISJOINT pairs, saved one after the other (no overlap → no cut)');
  const SP = 'Are you from São Paulo?';        /* the third pair of the same <p> (occurrence 0) */
  await api(site, 'reset=1');
  await live.nav();
  await makeNote(live, Pos(P1a, 0), 'primeira frase');
  await makeNote(live, Pos(SP, 0), 'segunda frase');
  ms = await marksNow(live);
  check('two notes, two anchors, two whole marks', rowsOf('note').length === 2 && ms.length === 2,
    { rows: rowsOf('note').map(r => r.anchor), marks: ms.map(m => m.txt) });
  checkInvariants(ms, 'two disjoint notes');

  log('\n step 5 — CONTROL: a note strictly INSIDE a recording (nested, nothing crossed)');
  await api(site, 'reset=1');
  await live.nav();
  await recSpan(live, Pos(P1a, 0), Pos(P1b, 0));
  await makeNote(live, Pos(P1b, 0), 'nota dentro');
  ms = await marksNow(live);
  check('the recording is still ONE whole mark (the note sits nested inside it)',
    ms.length === 2 && invariants(ms).split.length === 0 && invariants(ms).cut.length === 0,
    { marks: ms.map(m => ({ a: m.a, txt: m.txt, cls: m.cls })) });
  check('1 rec row + 1 note row', rowsOf('rec').length === 1 && rowsOf('note').length === 1, bp.rows.map(r => r.type + ':' + r.anchor));
  checkInvariants(ms, 'note inside a recording');

  log('\n step 6 — CONTROL: widening a note over itself must RE-ANCHOR its row (never duplicate)');
  const MA = "I'm Marina.";                    /* the first pair of the same <p> (occurrence 0) */
  await api(site, 'reset=1');
  await live.nav();
  await makeNote(live, Pos(P1b, 0), 'nota curta');
  const before = rowsOf('note').map(r => r.anchor);
  await noteSpan(live, Pos(MA, 0), Pos(P1b, 0), 'nota mais longa');
  await sleep(600);
  ms = await marksNow(live);
  const rowsNow = rowsOf('note').map(r => r.anchor);
  check('still ONE note row (re-anchored, not duplicated)', rowsNow.length === 1, { before: before, now: rowsNow });
  check('the row now covers the WIDER span',
    rowsNow.length === 1 && ms.some(m => m.a === rowsNow[0] && m.txt === m.a && m.txt.indexOf(MA) === 0),
    { now: rowsNow, marks: ms.map(m => ({ a: m.a, txt: m.txt })) });
  checkInvariants(ms, 'note expansion');

  log('\n step 7 — a RECORDING containing a NOTE anchors to the SELECTION, never the note');
  await api(site, 'reset=1');
  await live.nav();
  await makeNote(live, Pos(P1a, 0), 'nota da frase');
  await recSpan(live, Pos(P1a, 0), Pos(P1b, 0));   /* the selection (the whole pair) CONTAINS the note on P1a */
  const recAnchor = rowsOf('rec')[0] && rowsOf('rec')[0].anchor;
  check('the recording is anchored to the SELECTION (the whole pair), not the note',
    !!recAnchor && recAnchor.indexOf(P1a) >= 0 && recAnchor.indexOf(P1b) >= 0 && recAnchor !== P1a,
    { anchor: recAnchor, note: P1a });
}/* ---------------------------------------------------------------------------------------------
   10. SCENARIO B-F3 — the OCCURRENCE a note/recording belongs to, and its presentation
      owner: "notes/recordings are not anchored to the right place"; "selecting part of the phrase
      does not present the note"; "after a reload the recording lands on another phrase"
   --------------------------------------------------------------------------------------------- */
const D1 = "My name's Daniel.";        /* phrase list (0) · dialogue (1) · quiz label (2) */
const SUB = "name's Daniel.";          /* a PIECE of that phrase (same occurrence 0) */
async function scenBF3(live, site) {
  log('\n================ B-F3 · NOTES/RECORDINGS ANCHORING + PRESENTATION ================');

  log('\n step 1 — a note on the phrase: stored, painted ONCE, covering exactly its own text');
  await api(site, 'reset=1');
  await live.nav();
  await makeNote(live, Pos(D1, 0), 'nota do Daniel');
  let ms = await marksNow(live);
  let s = await live.dump('after the note', true);
  check('one mark on the annotated phrase', ms.length === 1, ms);
  check('the mark wears has-note', flagged(ms, 'has-note').length === 1, ms);
  check('the mark covers exactly its anchor text', !!ms[0] && ms[0].txt === D1, ms[0]);
  check('ONE note row, anchored to the phrase', rowsOf('note').length === 1 && rowsOf('note')[0].anchor === D1, rowsOf('note'));
  check('the row carries the typed text', JSON.stringify(rowsOf('note')).indexOf('nota do Daniel') >= 0, rowsOf('note'));
  checkInvariants(ms, 'note');

  log('\n step 2 — selecting only PART of the annotated phrase must PRESENT its note');
  await selectPhrase(live, SUB, 0);
  s = await live.dump('popup from a partial selection', false);
  check('the popup presents the saved note', !!(s.popup && String(s.popup.note || '').indexOf('nota do Daniel') >= 0), s.popup);
  check('📝 Delete is offered for it', !!(s.popup && /(^|,)pD($|,)/.test(s.popup.buttons)), s.popup && s.popup.buttons);
  check('💾 Save is greyed while not editing', !!(s.popup && /(^|,)pS#($|,)/.test(s.popup.buttons)), s.popup && s.popup.buttons);
  check('the mere selection painted nothing', (await marksNow(live)).length === 1, await marksNow(live));
  await live.key('Escape', 'Escape');

  log('\n step 3 — clicking the mark must present the same note');
  const r3 = await clickPiece(live, D1);
  s = await live.dump('popup from a click on the mark', false);
  check('the click opened the popup on the mark', !!(r3 && s.popup && /(^|,)pN($|,)/.test(s.popup.buttons)), s.popup);
  check('...presenting the same note', !!(s.popup && String(s.popup.note || '').indexOf('nota do Daniel') >= 0), s.popup && s.popup.note);
  checkInvariants(await marksNow(live), 'after the click');
  await live.key('Escape', 'Escape');

  log('\n step 4 — RELOAD (note on the FIRST occurrence): control — it must come back where it was');
  await live.reload();
  await live.wait('!!document.querySelector("#noteLayer .ntr")', 9000, 'the note restored after a reload');
  await sleep(700);
  ms = await marksNow(live);
  let w0 = await rectsOf(live, Pos(D1, 0)), w1 = await rectsOf(live, Pos(D1, 1));
  check('the note is back, on the occurrence it was saved for',
    ms.length === 1 && (await hits(live, flagged(ms, 'has-note'), w0)) && !(await hits(live, flagged(ms, 'has-note'), w1)),
    { ms, w0, w1 });
  checkInvariants(ms, 'reload (first occurrence)');

  log('\n step 5 — the SAME phrase on a LATER occurrence: the note must stay on ITS OWN occurrence');
  await api(site, 'reset=1');
  await live.nav();
  await makeNote(live, Pos(D1, 1), 'nota no diálogo');
  ms = await marksNow(live);
  w0 = await rectsOf(live, Pos(D1, 0)); w1 = await rectsOf(live, Pos(D1, 1));
  check('saved live on the occurrence that was selected',
    (await hits(live, flagged(ms, 'has-note'), w1)) && !(await hits(live, flagged(ms, 'has-note'), w0)), { ms, w0, w1 });
  log('   · stored note row: ' + JSON.stringify(rowsOf('note').map(r => ({ id: r.id, anchor: r.anchor, data: r.data }))));
  await live.reload();
  await live.wait('!!document.querySelector("#noteLayer .ntr")', 9000, 'the note restored after a reload');
  await sleep(700);
  ms = await marksNow(live);
  check('after a reload it is STILL on occurrence 1 (the one that was annotated)',
    ms.length === 1 && (await hits(live, flagged(ms, 'has-note'), w1)) && !(await hits(live, flagged(ms, 'has-note'), w0)),
    { ms, w0, w1 });
  checkInvariants(ms, 'reload (later occurrence)');

  log('\n step 6 — a RECORDING on that same later occurrence must not jump on reload');
  await api(site, 'reset=1');
  await live.nav();
  await makeRec(live, Pos(D1, 1));
  ms = await marksNow(live);
  check('the live recording underline is on the selected occurrence',
    (await hits(live, flagged(ms, 'has-rec'), w1)) && !(await hits(live, flagged(ms, 'has-rec'), w0)), { ms, w0, w1 });
  await live.reload();
  await live.wait('!!document.querySelector("mark.nb.has-rec")', 9000, 'the recording restored after a reload');
  await sleep(700);
  ms = await marksNow(live);
  check('after a reload the recording is STILL on occurrence 1',
    ms.length === 1 && (await hits(live, flagged(ms, 'has-rec'), w1)) && !(await hits(live, flagged(ms, 'has-rec'), w0)),
    { ms, w0, w1 });
  checkInvariants(ms, 'recording reload');

  log('\n step 7 — a note on occurrence 0 + a recording on occurrence 1: two rows, one phrase each');
  await api(site, 'reset=1');
  await live.nav();
  await makeNote(live, Pos(D1, 0), 'nota do topo');
  await makeRec(live, Pos(D1, 1));
  ms = await marksNow(live);
  await live.dump('two items on two occurrences', true);
  check('two rows stored (1 note + 1 rec)', rowsOf('note').length === 1 && rowsOf('rec').length === 1, bp.rows.map(r => r.type + ':' + r.anchor));
  check('the note is painted on occurrence 0 only', (await hits(live, flagged(ms, 'has-note'), w0)) && !(await hits(live, flagged(ms, 'has-note'), w1)), ms);
  check('the recording underline is on occurrence 1 only',
    (await hits(live, flagged(ms, 'has-rec'), w1)) && !(await hits(live, flagged(ms, 'has-rec'), w0)), ms);
  await live.reload();
  await live.wait('!!document.querySelector("mark.nb")', 9000, 'the two items restored after a reload');
  await sleep(700);
  ms = await marksNow(live);
  check('after a reload each item is still on its own occurrence',
    (await hits(live, flagged(ms, 'has-note'), w0)) && (await hits(live, flagged(ms, 'has-rec'), w1)) && !(await hits(live, flagged(ms, 'has-rec'), w0)),
    { ms, w0, w1 });
  checkInvariants(ms, 'two occurrences reload');

  log('\n step 8 — note + recording on the SAME occurrence: two separate marks');
  await api(site, 'reset=1');
  await live.nav();
  await makeRec(live, Pos(D1, 1));
  await makeNote(live, Pos(D1, 1), 'nota junto');
  ms = await marksNow(live);
  await live.dump('note + recording on the same occurrence', true);
  check('1 recording row + 1 note row (no duplicates)', rowsOf('rec').length === 1 && rowsOf('note').length === 1, bp.rows.map(r => r.type));
  check('exactly TWO separate marks on the phrase (one note, one recording)', ms.length === 2, ms);
  check('the note mark wears has-note only, the recording mark has-rec only',
    ms.some(m => /has-note/.test(m.cls) && !/has-rec/.test(m.cls)) && ms.some(m => /has-rec/.test(m.cls) && !/has-note/.test(m.cls)), ms);
  checkInvariants(ms, 'combined item');
  await live.reload();
  await live.wait('!!document.querySelector("#noteLayer .ntr")', 9000, 'both items restored');
  await sleep(700);
  ms = await marksNow(live);
  check('after a reload the two separate marks sit on the same occurrence',
    ms.length === 2 &&
    ms.some(m => /has-note/.test(m.cls) && !/has-rec/.test(m.cls)) &&
    ms.some(m => /has-rec/.test(m.cls) && !/has-note/.test(m.cls)) &&
    (await hits(live, ms, await rectsOf(live, Pos(D1, 1)))), ms);
  await clickPiece(live, D1);
  s = await live.dump('click on the phrase holding both items', false);
  check('the click presents the note AND offers the recording',
    !!(s.popup && String(s.popup.note || '').indexOf('nota junto') >= 0 && /(^|,)pP($|,)/.test(s.popup.buttons) && /(^|,)pR\*/.test(s.popup.buttons)),
    s.popup);
  await live.key('Escape', 'Escape');
  checkInvariants(ms, 'combined item reload');
}/* ---------------------------------------------------------------------------------------------
   11. SCENARIO GEO — the ruler and the painted layer AWAY FROM THE TOP OF THE PAGE
   Everything B-F2/B-F3 assume about geometry is exercised here where it can actually go wrong:
   a phrase far down the page (the drag has to scroll first), a scroll away and back, a reload
   from scroll 0 while the row points deep into the document, and the block-aware ruler.
   --------------------------------------------------------------------------------------------- */
async function scenGeo(live, site) {
  log('\n================ GEO · ruler + #hlLayer geometry off-screen ================');
  const DEEP = "I'm from Curitiba.";            /* the dialogue line (occurrence 0), far down the page */
  await api(site, 'reset=1');
  await live.nav();
  await live.wait('document.body.scrollHeight > window.innerHeight*2', 8000, 'a page taller than the window');

  log('\n step 1 — a Ctrl+drag on a phrase FAR DOWN the page (the gesture must scroll first)');
  const sc0 = await live.ev('window.scrollY');
  await paint(live, DEEP, 0, 'the deep phrase');
  await sleep(600);
  let s = await live.dump('painted deep in the page', true);
  const p0 = await rectsOf(live, Pos(DEEP, 0));
  check('the gesture scrolled the page to reach the phrase', p0.length > 0 && p0[0][1] > 900, { scrollY: sc0, firstLineTop: p0[0] && p0[0][1] });
  check('the rectangle is painted exactly on the phrase (document coords)', sameRects(s.hlr.map(r => r.doc), p0), { painted: s.hlr.map(r => r.doc), text: p0 });
  const ruler = await spanOf(live, Pos(DEEP, 0));
  log('   · the engine’s own ruler for that phrase: ' + JSON.stringify(ruler));
  check('the stored row carries the engine’s own (b,start,end)',
    !!ruler && !ruler.err && s.hlList.length === 1 && s.hlList[0].b === ruler.b && s.hlList[0].start === ruler.start && s.hlList[0].end === ruler.end,
    { row: s.hlList, ruler: ruler });
  check('exactly one row on the server', bp.rows.length === 1 && bp.rows[0].type === 'hl', bp.rows.map(r => r.type + ':' + r.anchor));
  await live.shot('geo-1-deep', box(p0[0] || [0, 0, 400, 200]));

  log('\n step 2 — scroll to the top and back: the painting must stay on the same characters');
  await live.ev('window.scrollTo(0,0)');
  await sleep(600);
  await live.ev('window.scrollTo(0,document.body.scrollHeight)');
  await sleep(600);
  s = await live.dump('after scrolling away and back', true);
  check('still one rectangle, still over the very same text (doc coords)',
    sameRects(s.hlr.map(r => r.doc), p0, 6), { now: s.hlr.map(r => r.doc), was: p0 });
  check('the scroll did not write a second row', bp.rows.length === 1, bp.rows.map(r => r.id));

  log('\n step 3 — RELOAD from the very top: a row pointing deep into the document must come back');
  await live.ev('window.scrollTo(0,0)');
  await live.reload();
  let back = true;
  try { await live.wait('document.querySelectorAll("#hlLayer .hlr").length>0', 9000, 'the deep highlight restored') }
  catch (e) { back = false }
  s = await live.dump('after a reload from scroll 0', true);
  const p1 = await rectsOf(live, Pos(DEEP, 0));
  check('the deep highlight was restored at all (no rectangle → hlMake gave up)', back, { hlr: s.hlr.length, hlList: s.hlList.length, wait: 'timed out' });
  check('the row was NOT dropped by the restore (layer + hlList + sheet)', s.layer.length === 1 && s.hlList.length === 1 && bp.rows.length === 1,
    { layer: s.layer.length, hlList: s.hlList.length, rows: bp.rows.length });
  check('restored on the same characters', sameRects(s.hlr.map(r => r.doc), p1, 6), { painted: s.hlr.map(r => r.doc), text: p1 });
  check('the restored row still carries the same (b,start,end)',
    !!ruler && !ruler.err && s.hlList.length === 1 && s.hlList[0].b === ruler.b && s.hlList[0].start === ruler.start && s.hlList[0].end === ruler.end,
    { row: s.hlList, ruler: ruler });
  await live.shot('geo-2-restored', box(p1[0] || [0, 0, 400, 200]));

  log('\n step 4 — the ruler is BLOCK-aware: the same string in another block has its own place');
  const r0 = await spanOf(live, Pos(DEEP, 0)), r1 = await spanOf(live, Pos(DEEP, 1));
  log('   · occurrence 0 ' + JSON.stringify(r0) + '   occurrence 1 ' + JSON.stringify(r1));
  check('both occurrences resolve, in different blocks (or at least different offsets)',
    !!r0 && !!r1 && !r0.err && !r1.err && (r0.b !== r1.b || r0.start !== r1.start), { r0: r0, r1: r1 });
}/* ---------------------------------------------------------------------------------------------
   11b. SCENARIO DIAG — is the harness itself honest? (real input → real selection)
   Before trusting any scenario, prove that CDP mouse input actually reaches the page and that a
   real drag selects real text. Counts the page's own mousedown/mousemove/mouseup (a page listener
   that the engine knows nothing about), then tries the same gesture three ways: a plain drag, a
   drag while Ctrl is held as a real key, and a Ctrl-modified drag. Whichever works is the gesture
   the scenarios must use — and if NONE works, the harness is lying about every gesture.
   --------------------------------------------------------------------------------------------- */
async function scenDiag(live, site) {
  log('\n================ DIAG · does real input reach the page? ================');
  const T = "My name's Daniel.";
  const COUNT = 'window.__ct={mousemove:0,mousedown:0,mouseup:0,keydown:0};' +
    'Object.keys(window.__ct).forEach(function(t){document.addEventListener(t,function(){window.__ct[t]++},true)});1';
  /* does anything call preventDefault on the gesture? a WINDOW bubble listener runs after every
     document listener, so __dp holds the final flag; __ss counts selectstart (the event Chrome fires
     right before it starts a native selection — a capture listener here is the last word on it). */
  const DPSEEN = 'window.__dp={};window.__ss=0;' +
    'window.addEventListener("mousedown",function(e){window.__dp.md=e.defaultPrevented},false);' +
    'window.addEventListener("mouseup",function(e){window.__dp.mu=e.defaultPrevented},false);' +
    'document.addEventListener("selectstart",function(e){window.__ss++;window.__dp.ss=e.defaultPrevented},true);1';
  await api(site, 'reset=1');
  await live.nav();
  log('   · hasFocus=' + await live.ev('document.hasFocus()') + '  innerHeight=' + await live.ev('window.innerHeight') +
    '  dpr=' + await live.ev('window.devicePixelRatio'));
  await live.ev(COUNT);
  await live.ev(DPSEEN);
  let d = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
  log('   · dot = ' + JSON.stringify(d));
  log('   · element at the drag start = ' + await live.ev(
    '(function(){var e=document.elementFromPoint(' + d.sx + ',' + d.sy + ');if(!e)return "nothing";' +
    'var c=getComputedStyle(e);return e.tagName+"."+String(e.className).slice(0,24)+" pe="+c.pointerEvents+" us="+c.userSelect+" <"+e.textContent.slice(0,30)})()'));
  log('   · body user-select = ' + await live.ev('getComputedStyle(document.body).userSelect'));

  log('\n (1) a PLAIN drag across the phrase');
  d = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
  await live.drag(d, d, { ctrl: false });
  log('   · events the page saw: ' + JSON.stringify(await live.ev('window.__ct')));
  log('   · preventDefault seen by the page (window bubble = last word): ' + JSON.stringify(await live.ev('window.__dp')) +
    '  selectstart fired ' + await live.ev('window.__ss') + '×');
  log('   · sel=' + JSON.stringify(await selNow(live)) + '  popup=' + JSON.stringify(await live.ev('!!document.querySelector(".pop")')) +
    '  marks=' + JSON.stringify((await marksNow(live)).length));
  await sleep(500);
  log('   · +500ms: popup=' + JSON.stringify(await live.ev('!!document.querySelector(".pop")')) +
    '  btns=' + JSON.stringify(await live.ev('(document.querySelector(".pop")||{textContent:null}).textContent')) +
    '  toast=' + JSON.stringify(await live.ev('(document.getElementById("toast")||{}).textContent||null')));

  log('\n (2) the same drag while Ctrl is held as a REAL key (no modifier flag on the mouse)');
  await api(site, 'reset=1'); await live.nav(); await live.ev(COUNT);
  await live.key('Control', 'ControlLeft', 2);
  d = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
  await live.drag(d, d, { ctrl: false });
  log('   · sel=' + JSON.stringify(await selNow(live)) + '  hlr=' + JSON.stringify(await live.ev('document.querySelectorAll("#hlLayer .hlr").length')));
  await live.key('Control', 'ControlLeft', 0);
  await sleep(600);
  log('   · +600ms: hlr=' + JSON.stringify(await live.ev('document.querySelectorAll("#hlLayer .hlr").length')) +
    '  rows=' + bp.rows.length + '  events=' + JSON.stringify(await live.ev('window.__ct')));

  log('\n (3) the modifier-flag drag (the gesture the scenarios use)');
  await api(site, 'reset=1'); await live.nav(); await live.ev(COUNT);
  d = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
  await live.drag(d, d, { ctrl: true });
  log('   · sel=' + JSON.stringify(await selNow(live)) + '  hlr=' + JSON.stringify(await live.ev('document.querySelectorAll("#hlLayer .hlr").length')) +
    '  rows=' + bp.rows.length + '  events=' + JSON.stringify(await live.ev('window.__ct')));

  log('\n (4) the plain drag again, right→left and with more steps');
  await api(site, 'reset=1'); await live.nav(); await live.ev(COUNT);
  d = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
  await live.drag({ sx: d.ex, sy: d.ey, ex: d.sx, ey: d.sy }, d, { ctrl: false, steps: 16 });
  log('   · sel=' + JSON.stringify(await selNow(live)) + '  events=' + JSON.stringify(await live.ev('window.__ct')));
  log('\n (5) CONTROL PAGE with NO engine at all — can CDP input select text there?');
  const rootUrl = live.url.replace(PAGE_REL, '');
  await live.cdp.send('Page.navigate', { url: rootUrl + '/qa/_live/control.html' });
  await sleep(1200);
  await live.ev(COUNT); await live.ev(DPSEEN);
  let c = await live.ev('window.__q ? "probe present" : "no probe"');
  log('   · on the control page: ' + c + '  text=' + JSON.stringify(await live.ev('document.body.innerText.slice(0,60)')));
  const cd = await live.ev('(function(){var b=document.querySelector("b");var r=b.getClientRects()[0];' +
    'return {sx:Math.round(r.left+1),sy:Math.round(r.top+r.height/2),ex:Math.round(r.right-1),ey:Math.round(r.bottom-r.height/2)}})()');
  log('   · drag point = ' + JSON.stringify(cd));
  await live.drag(cd, cd, { ctrl: false });
  log('   · events=' + JSON.stringify(await live.ev('window.__ct')) + '  preventDefault=' + JSON.stringify(await live.ev('window.__dp')) +
    '  selectstart=' + await live.ev('window.__ss'));
  log('   · ⭐ sel on the control page = ' + JSON.stringify(await selNow(live)));
  /* and the blunt instrument: if the DOM cannot select at all, nothing else matters */
  await live.ev('(function(){var r=document.createRange();r.selectNodeContents(document.querySelector("p"));var s=getSelection();s.removeAllRanges();s.addRange(r);return 1})()');
  log('   · sel after a scripted addRange = ' + JSON.stringify(await selNow(live)));

  log('\n (6) back on the lesson page: scripted selection vs a real drag');
  await live.nav();
  const d6 = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
  await live.ev('(function(){var p=window.__q.find(' + JSON.stringify(T) + ',0);var r=window.__q.rng(p);var s=getSelection();s.removeAllRanges();s.addRange(r);return 1})()');
  log('   · scripted selection of the phrase = ' + JSON.stringify(await selNow(live)));
  await sleep(500);
  log('   · +500ms popup=' + JSON.stringify(await live.ev('!!document.querySelector(".pop")')));
  await live.drag(d6, d6, { ctrl: false });
  log('   · after a real drag over the same phrase: sel=' + JSON.stringify(await selNow(live)) +
    '  popup=' + JSON.stringify(await live.ev('!!document.querySelector(".pop")')));
  log('\n (7) raw CDP recipes — which one makes Chrome start a selection at all?');
  const raw = (type, x, y, o = {}) => live.cdp.send('Input.dispatchMouseEvent', Object.assign({
    type, x: Math.round(x), y: Math.round(y), modifiers: 0, pointerType: 'mouse',
    button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1,
    buttons: type === 'mousePressed' ? 1 : (type === 'mouseMoved' ? 1 : 0)
  }, o));
  const clear = () => live.ev('(function(){var s=getSelection();if(s)s.removeAllRanges();return 1})()');
  const variants = [
    ['minimal: down → ONE move → up', { moves: 1 }],
    ['four moves', { moves: 4 }],
    ['moves tagged button:left', { moves: 4, moveBtn: 'left' }],
    ['moves with buttons:0', { moves: 4, moveButtons: 0 }],
    ['explicit timestamps', { moves: 4, stamp: true }],
    ['no hover move before the press', { moves: 4, noHover: true }],
    ['HOLD longer between events (40ms)', { moves: 6, gap: 40 }],
    ['press+release at once (click), then the drag', { moves: 4, preClick: true }]
  ];
  for (const [name, o] of variants) {
    await api(site, 'reset=1'); await live.nav();
    const dd = await live.ev('window.__q.dot(' + JSON.stringify(T) + ',0)');
    await clear();
    if (o.preClick) { await raw('mousePressed', dd.ex, dd.ey); await raw('mouseReleased', dd.ex, dd.ey); await sleep(120) }
    if (!o.noHover) { await raw('mouseMoved', dd.sx - 30, dd.sy, { buttons: 0 }); await sleep(30) }
    await raw('mousePressed', dd.sx, dd.sy);
    const n = o.moves || 4, t0 = Date.now();
    for (let i = 1; i <= n; i++) {
      const extra = {};
      if (o.moveBtn) extra.button = o.moveBtn;
      if (o.moveButtons != null) extra.buttons = o.moveButtons;
      if (o.stamp) extra.timestamp = (t0 + i * 25) / 1000;
      await raw('mouseMoved', dd.sx + (dd.ex - dd.sx) * i / n, dd.sy, extra);
      if (o.gap) await sleep(o.gap);
    }
    await raw('mouseReleased', dd.ex, dd.ey);
    const s1 = await selNow(live);
    await sleep(300);
    log('   · ' + name + '  →  sel=' + JSON.stringify(s1) + '  +300ms=' + JSON.stringify(await selNow(live)) +
      '  popup=' + await live.ev('!!document.querySelector(".pop")') + '  hlr=' + await live.ev('document.querySelectorAll("#hlLayer .hlr").length'));
  }

  await live.dump('diag end', false);
}/* ---------------------------------------------------------------------------------------------
   11c. SCENARIO BAR — the control bar: every control ONE height, and the buttons in one order.
   jsdom computes no layout at all, so this is the only place a bar height can actually be measured.
   The defect it is built around: 🧹 Clear page was created and wired but never appended, so the
   button vanished from every lesson page and no harness noticed. Presence is therefore checked
   explicitly, alongside the height and the order (owner instruction 2026-11-09).
   --------------------------------------------------------------------------------------------- */
async function scenBar(live, site) {
  log('\n================ BAR · one height, one order ================');
  await live.nav();
  await live.wait('document.querySelectorAll("#controlbar>button").length>=4', 9000, 'the bar to build');
  const info = await live.ev('(function(){'
    + 'var bar=document.getElementById("controlbar");'
    + 'var kids=[].slice.call(bar.children);'
    + 'function h(el){var r=el.getBoundingClientRect();return Math.round(r.height*100)/100}'
    + 'function ti(el){var r=el.getBoundingClientRect();return Math.round(r.top*100)/100}'
    + 'return {'
    + ' order:kids.map(function(el){return el.id||el.className||el.tagName}),'
    + ' btns:kids.filter(function(el){return el.tagName==="BUTTON"}).map(function(b){'
    + '  return {id:b.id,h:h(b),top:ti(b),txt:(b.textContent||"").trim().slice(0,16)}}),'
    + ' sel:(function(){var s=bar.querySelector("select");return s?{h:h(s),top:ti(s)}:null})(),'
    + ' rect:(function(){var r=bar.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]})()'
    + '};})()');
  log('   · order: ' + info.order.join(' · '));
  log('   · ' + info.btns.map(function (b) { return b.id + '=' + b.h + 'px' }).join('  '));

  const LAST = (info.btns.find(function (b) { return b.id === 'nextlesson' }) || {}).h;
  check('the bar has a Clear page button (it once disappeared unbuilt)',
    info.btns.some(function (b) { return b.id === 'clearpage' }), info.btns.map(function (b) { return b.id }));
  check('every bar button is exactly the Next → height',
    info.btns.length >= 4 && info.btns.every(function (b) { return b.h === LAST }), { next: LAST, seen: info.btns.map(function (b) { return b.id + ':' + b.h }) });
  if (info.sel) check('the teacher/student selector matches too', info.sel.h === LAST, { select: info.sel.h, next: LAST });
  check('every control sits on ONE line (no row stepping up/down)',
    info.btns.every(function (b) { return b.top === info.btns[0].top }) && (!info.sel || info.sel.top === info.btns[0].top),
    { tops: info.btns.map(function (b) { return b.id + ':' + b.top }) });

  const at = function (id) { return info.order.indexOf(id) };
  check('Index is the FIRST control', info.order[0] === 'idxbtn', info.order);
  check('the book selector follows Index', String(info.order[1]).indexOf('bookdrop') >= 0, info.order);
  check('Clear page is to the RIGHT of Print', at('clearpage') > at('printpage') && at('printpage') > 0,
    { print: at('printpage'), clear: at('clearpage'), order: info.order });
  await live.shot('bar-1-controls', box(info.rect));
}/* The LANDING page (index.html) — the owner's two reports live here and neither can be answered by jsdom, which
   lays nothing out: "on reload it only shows the first 3 tracks and populates the rest after a couple seconds"
   and "auto-resizing on the text so it doesn't wrap within the button". This measures the real grid and the real
   fitted text. It does NOT use live.nav(): boot() asserts the lesson gate (__A/__B and a lesson URL), and this
   page is not one. */
async function scenLanding(live, site) {
  log('\n================ LANDING · three per row, no reflow, text fits ================');
  const idx = 'http://127.0.0.1:' + site.port + '/index.html';
  const tracksRaw = fs.readFileSync(path.join(ROOT, 'tracks.json'), 'utf8');
  const NT = JSON.parse(tracksRaw).length;
  await live.cdp.send('Page.navigate', { url: idx });
  await live.wait('document.readyState==="complete"', 20000, 'document load');
  await live.wait('typeof start==="function" && typeof applyTracks==="function"', 9000, 'the index script');
  /* a returning visitor's state — the three caches a previous successful load leaves behind: the track list
     (written by writeTracks), the role, and the last status/queue. Miss any of them and the page is not in the
     state this scenario is about. */
  await live.ev('(function(){'
    + 'localStorage.setItem("eod_tracks",' + JSON.stringify(tracksRaw) + ');'
    + 'localStorage.setItem("eod_role_qa-landing@example.com",JSON.stringify("student"));'
    + 'localStorage.setItem("eod_status_qa-landing@example.com",JSON.stringify('
    + '{status:"approved",tracks:["kids","business"],track:"kids",progress:{},done:{},name:"QA"}));'
    + 'cred="qa";profile={email:"qa-landing@example.com",name:"QA",exp:9999999999};'
    + 'window.api=function(a){return Promise.resolve(a==="status"?'
    + '{status:"approved",tracks:["kids","business"],track:"kids",name:"QA",progress:{},done:{}}'
    + ':a==="queue"?{pending:[],approved:[]}:{result:"ok"})};'
    + 'document.getElementById("app").innerHTML="";return 1})()');
  /* start() paints synchronously before its first await, so this count IS the first paint */
  const first = await live.ev('(function(){start();return {'
    + 'cards:document.querySelectorAll(".tracks .track-card").length,'
    + 'spinner:!!document.querySelector("#app .spinner")};})()');
  await sleep(1800);                                  /* let the validated paint land on top of it */
  const g = await live.ev('(function(){'
    + 'var el=document.querySelector(".tracks");if(!el)return {err:"no .tracks grid"};'
    + 'var cs=getComputedStyle(el),cards=[].slice.call(el.querySelectorAll(".track-card"));'
    + 'var rows={};cards.forEach(function(c){rows[Math.round(c.getBoundingClientRect().top)]=1});'
    + 'var btns=[].slice.call(el.querySelectorAll(".bookbtn"));'
    + 'return {cards:cards.length,'
    + ' cols:cs.gridTemplateColumns.split(" ").filter(function(s){return s&&s!=="none"}).length,'
    + ' colcss:cs.gridTemplateColumns,rows:Object.keys(rows).length,'
    + ' cw:cards.map(function(c){return Math.round(c.getBoundingClientRect().width*100)/100}),'
    + ' rect:(function(){var r=el.getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]})(),'
    + ' btns:btns.map(function(b){var s=getComputedStyle(b),r=b.getBoundingClientRect();return {'
    + '  txt:(b.textContent||"").trim(),fs:Math.round(parseFloat(s.fontSize)*100)/100,'
    + '  ws:s.whiteSpace,sw:b.scrollWidth,cw:b.clientWidth,w:Math.round(r.width)};})};})()');
  if (g.err) { check('the landing grid renders at all', false, g.err); return }
  log('   · columns: ' + g.colcss + '   cards: ' + g.cards + '   rows: ' + g.rows);
  log('   · ' + g.btns.map(function (b) { return b.txt + '=' + b.fs + 'px' }).join('  '));
  check('the FIRST paint already shows every track (this is the reflow report)',
    first.cards === NT, { firstPaint: first.cards, tracks: NT, spinner: first.spinner });
  check('nothing is added after the network answers (no reflow)', g.cards === first.cards,
    { before: first.cards, after: g.cards });
  check('exactly three columns', g.cols === 3, g.colcss);
  /* the owner's report, as a number: the page is a FIXED-WIDTH document, so a fractional track is a defect.
     Every card must measure the same WHOLE number of pixels, and the grid must fill the 1200px area exactly. */
  const cw = g.cw || [];
  check('every card is the SAME whole-pixel width (no fractional tracks)',
    cw.length === NT && cw.every(function (w) { return w === cw[0] }),
    cw.join(', '));
  check('a column is 390px and the grid fills the fixed 1200px content area exactly',
    cw[0] === 390 && Math.round(g.rect[2]) === 1200, 'card=' + cw[0] + 'px grid=' + g.rect[2] + 'px');
  check('nine tracks sit in three rows of three', g.rows === 3, g.rows + ' row(s)');
  const over = g.btns.filter(function (b) { return b.sw > b.cw + 1 });
  check('no track name overflows its button (nothing wraps, nothing is cut off)',
    g.btns.length === NT && over.length === 0,
    over.length ? over.map(function (b) { return b.txt + ' ' + b.sw + '>' + b.cw }) : 'all ' + g.btns.length + ' fit');
  check('every trigger keeps its label on one line', g.btns.every(function (b) { return b.ws === 'nowrap' }),
    g.btns.map(function (b) { return b.ws }).join(','));
  const shrunk = g.btns.filter(function (b) { return b.fs < 19 });
  check('the long names SHRANK rather than wrapping', shrunk.length > 0,
    shrunk.map(function (b) { return b.txt + '@' + b.fs + 'px' }));
  await live.shot('landing-grid', box(g.rect));
  /* THE RESIZE REPORT (owner report 2026-11-09): "the cards still re-size and reflow into 1 per row vertical on
     window resize. Just like the rest of the site, nothing should resize or move based on viewport." The document
     is a fixed-width sheet, so the grid must measure IDENTICALLY at every viewport — this drives the real emulated
     viewport narrow and wide and re-measures, which is the only way to answer a report about resizing. Must run
     BEFORE the teacher block below, which re-paints #app and takes .tracks with it. */
  const seen = [];
  for (const w of [800, 1280, 2400]) {
    await live.cdp.send('Emulation.setDeviceMetricsOverride',
      { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
    await sleep(180);
    const m = await live.ev('(function(){'
      + 'var el=document.querySelector(".tracks");if(!el)return {err:"no .tracks grid"};'
      + 'var cs=getComputedStyle(el),cards=[].slice.call(el.querySelectorAll(".track-card"));'
      + 'var rows={};cards.forEach(function(c){rows[Math.round(c.getBoundingClientRect().top)]=1});'
      + 'return {cols:cs.gridTemplateColumns.split(" ").filter(function(s){return s&&s!=="none"}).length,'
      + ' colcss:cs.gridTemplateColumns,rows:Object.keys(rows).length,cards:cards.length,'
      + ' cw:cards.map(function(c){return Math.round(c.getBoundingClientRect().width*100)/100})};})()');
    seen.push({ w: w, m: m });
  }
  await live.cdp.send('Emulation.clearDeviceMetricsOverride').catch(() => { });
  await sleep(120);
  log('   · resize: ' + seen.map(function (s) {
    return s.w + 'px→' + (s.m.cols || '?') + 'col/' + ((s.m.cw || [])[0] || '?') + 'px/' + (s.m.rows || '?') + 'row';
  }).join('   '));
  check('resizing the window never changes the column count',
    seen.every(function (s) { return s.m.cols === 3 }),
    seen.map(function (s) { return s.w + 'px:' + s.m.cols; }).join(' '));
  check('resizing the window never changes a card width',
    seen.every(function (s) { return (s.m.cw || []).length === NT && s.m.cw.every(function (x) { return x === 390 }) }),
    seen.map(function (s) { return s.w + 'px:' + (s.m.cw || [])[0]; }).join(' '));
  check('resizing the window never reflows a row',
    seen.every(function (s) { return s.m.rows === 3 && s.m.cards === NT }),
    seen.map(function (s) { return s.w + 'px:' + s.m.rows + 'r/' + s.m.cards + 'c'; }).join(' '));
  /* the teacher panel was fractional too, and the cards above are only half the answer: its dropdown row and
     its two columns must obey the same fixed metric, or the panel above the columns still resizes. */
  const t = await live.ev('(function(){'
    + 'teacher=true;paintQueue({pending:[],approved:[{email:"s@x.y",name:"Sol",'
    + 'tracks:[{track:"kids",lastCompleted:0}]}]});'
    + 'var cols=document.querySelector(".tadmin-cols"),books=document.querySelector(".tadmin-books");'
    + 'if(!cols||!books)return {err:"no teacher panel"};'
    + 'var drops=[].slice.call(books.querySelectorAll(".bookdrop"));'
    + 'var rows={};drops.forEach(function(d){rows[Math.round(d.getBoundingClientRect().top)]=1});'
    + 'return {cols:getComputedStyle(cols).gridTemplateColumns,'
    + ' w:Math.round(cols.getBoundingClientRect().width),'
    + ' drop:drops.map(function(d){return Math.round(d.getBoundingClientRect().width*100)/100}),'
    + ' rows:Object.keys(rows).length};})()');
  if (t.err) { check('the teacher panel renders', false, t.err); return }
  const dw = t.drop || [];
  log('   · teacher: ' + t.cols + ' in ' + t.w + 'px, dropdowns ' + dw.join('/') + ', ' + t.rows + ' row(s)');
  check('the teacher dropdowns are a fixed 380px, three per row inside the card',
    dw.length === NT && dw.every(function (w) { return w === 380 }), dw.join(', '));
  check('the teacher panel is two equal fixed columns filling 1200px',
    t.w === 1200 && t.cols.split(' ').filter(Boolean).length === 2 &&
    t.cols.split(' ')[0] === t.cols.split(' ')[1],
    t.cols + ' in ' + t.w + 'px');
  check('nine dropdowns wrap on a fixed count, three per row', t.rows === 3, t.rows + ' row(s)');
}/* ---------------------------------------------------------------------------------------------
   12. THE RUNNER — one browser, one fake sheet, the scenarios that were asked for
   --------------------------------------------------------------------------------------------- */
const SCEN = { diag: scenDiag, geo: scenGeo, bar: scenBar, landing: scenLanding, bf2: scenBF2, bf2b: scenBF2b, bf3: scenBF3, bf4: scenBF4 };

/* a page-scoped view of the connection: every command/event carries the page's session id */
function session(cdp, id) {
  return {
    send: (method, params) => cdp.send(method, params, id),
    on: (name, fn) => cdp.on(name, (params, sid) => { if (!sid || sid === id) fn(params, sid) })
  };
}
  /* ---- the runner: one browser, one fake sheet, the scenarios that were asked for --------------- */
  async function live(opts = {}) {
    if (qaOff('live')) return;
    ARGV = flags(opts);
    TRACK = String(arg('--track', 'business')).trim().toLowerCase();
    if (!TRACKS.includes(TRACK)) {
      console.error('❌ --track must be one of: ' + TRACKS.join(' | ') + '  (got "' + TRACK + '")');
      return 1;
    }
    PAGE_REL = '/' + TRACK + '/lessons/' + encodeURIComponent(path.basename(lessonFile(TRACK, LESSON) || ('lesson' + LESSON + '.html')));
    GATE = { email: EMAIL, track: TRACK, sig: hashStr(EMAIL + TRACK + SECRET), teacher: false };
    PROBE = '(' + probeFn.toString() + ')(' + JSON.stringify(GATE) + ')';
    if (isExcluded(TRACK, LESSON)) {
      console.log('live — ' + TRACK + ' ' + LESSON + ' is excluded: an open review batch in PENDING');
      return 0;
    }

    const only = String(arg('--only', 'all')).split(',').map(s => s.trim()).filter(Boolean);
    const names = (only.length && only[0] !== 'all') ? only : Object.keys(SCEN);
    const unknown = names.filter(n => !SCEN[n]);
    if (unknown.length) {
      console.log('unknown scenario(s): ' + unknown.join(', ') + '\nknown: ' + Object.keys(SCEN).join(', ') + ' | all');
      return 2;
    }
    fs.mkdirSync(OUT, { recursive: true });
    try { fs.writeFileSync(path.join(OUT, 'run.txt'), '') } catch (e) { }

    const site = await startSite();
    const url = 'http://127.0.0.1:' + site.port + PAGE_REL;
    log('· repo   ' + ROOT + '   (node ' + process.version + ')');
    log('· page   ' + url + '   as ' + EMAIL);
    log('· chrome ' + chromePath() + (has('--headful') ? '   [headful]' : '   [headless=new]'));
    log('· runner ' + names.join(', '));

    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ingles-live-'));
    let chrome, cdp;
    try { chrome = await launchChrome(profile) }
    catch (e) {
      log('✗ could not start Chrome: ' + e.message);
      log('  set $env:CHROME="C:\\path\\to\\chrome.exe" and try again');
      await site.close();
      return 1;
    }
    cdp = await connect(chrome.browserWs);
    const clean = async () => {
      try { cdp.ws.close() } catch (e) { }
      try { chrome.proc.kill() } catch (e) { }
      try { await site.close() } catch (e) { }
      if (!has('--keep')) { try { fs.rmSync(profile, { recursive: true, force: true }) } catch (e) { } }
      else log('· kept   ' + profile);
    };

    try {
      const { targetInfos } = await cdp.send('Target.getTargets');
      const page = targetInfos.find(t => t.type === 'page' && t.url.indexOf('devtools') < 0) || targetInfos.find(t => t.type === 'page');
      if (!page) throw new Error('no page target to attach to');
      const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
      const ses = session(cdp, sessionId);
      await ses.send('Page.enable');
      await ses.send('Runtime.enable');
      /* a headless page can be treated as unfocused: force focus so real mouse/key input is delivered */
      await ses.send('Page.bringToFront').catch(() => { });
      await ses.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => { });
      ses.on('Runtime.exceptionThrown', p => {
        const d = (p && p.exceptionDetails) || {};
        log('  !! page exception: ' + (d.text || '') + ' ' + String((d.exception && (d.exception.description || d.exception.value)) || '').slice(0, 200));
      });
      /* every call to the real deployment is answered by the fake sheet — the page keeps its own BACKPACK */
      await ses.send('Fetch.enable', {
        patterns: [
          { urlPattern: 'https://script.google.com/*' },
          { urlPattern: 'https://*.googleusercontent.com/*' }
        ]
      });
      wireBackpack(ses);
      /* the probe must be in place BEFORE the page's own scripts (sessionStorage gate, fake mic, window.__q) */
      await ses.send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
      /* the recorder needs a microphone: the fake device is granted for the test origin up front, so
         getUserMedia never stalls on a permission prompt the harness could not click */
      await cdp.send('Browser.grantPermissions', {
        origin: 'http://127.0.0.1:' + site.port,
        permissions: ['audioCapture', 'videoCapture']
      }).catch(() => { });

      const lv = new Live(ses, url);
      for (const n of names) {
        log('\n\n################### scenario ' + n + ' ###################');
        const t0 = Date.now();
        try { await SCEN[n](lv, site) }
        catch (e) {
          fail++;
          failures.push(n + ' (threw): ' + e.message);
          log('   ❌ scenario ' + n + ' threw: ' + e.message);
          log('      ' + String(e.stack || '').split('\n').slice(1, 3).join('\n      '));
        }
        log('   · scenario ' + n + ' finished in ' + Math.round((Date.now() - t0) / 1000) + 's');
      }
    } catch (e) {
      fail++;
      failures.push('runner: ' + e.message);
      log('❌ the runner itself failed: ' + e.message + '\n' + (e.stack || ''));
    } finally {
      log('\n' + '─'.repeat(78));
      log(fail === 0 ? ('✅ live harness: ' + pass + ' checks passed, 0 failed')
        : ('❌ live harness: ' + fail + ' failed, ' + pass + ' passed'));
      if (failures.length) log('   failures:\n     · ' + failures.join('\n     · '));
      log('   log  : ' + path.join(OUT, 'run.txt'));
      await clean();
    }
    return fail ? 1 : 0;
  }

  return live;
})();

/* =====================================================================================
   [GAMES] — engine4's state machine, through each instance's own hooks
   ===================================================================================== */
export const games = (() => {
  const engineSrc = () => fs.readFileSync(path.join(ROOT, 'engine4.js'), 'utf8');
  let JSDOM;   /* assigned by games(), inside the function that needs it */
  /* a game plugin keeps its requestAnimationFrame loop alive; closing every window is what lets the
     run RETURN its exit code instead of calling process.exit and throwing the report away */
  const DOMS = [];
  const closeAll = () => { for (const w of DOMS) { try { w.close() } catch (e) { } } };

const item = (n, stem, key, opts) => `
  <div class="qitem" data-a="${key}">
    <div class="qline"><span class="qnum">${n}.</span><span class="qstem">${stem}</span></div>
    <div class="qopts">${opts.map(o => `<label><input type="radio" name="q${n}" value="${o[0]}">${o[1]}</label>`).join('')}</div>
  </div>`;

const FIXTURE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>games4</title></head><body>
<div class="content-area">
  <div class="game" id="catch" data-game="catchBasket" data-shuffle="0" data-replay="1" data-time="6000">
    <p class="game-how">Drag each one into the basket that fits.</p>
    <div class="game-list">
      ${item(1, 'a finished thing', 'a', [['a', 'past'], ['b', 'now']])}
      ${item(2, 'a thing happening', 'b', [['a', 'past'], ['b', 'now']])}
    </div>
    <button class="game-start" type="button">▶ Start</button>
  </div>
  <div class="game" id="mole" data-game="whackMole" data-shuffle="0" data-time="60000">
    <p class="game-how">Hit the one that fits.</p>
    <div class="game-list">
      ${item(1, 'which one is a greeting', 'c', [['a', 'a'], ['b', 'b'], ['c', 'hello']])}
    </div>
    <button class="game-start" type="button">▶ Start</button>
  </div>
</div></body></html>`;
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name + (extra ? '  <<' + extra + '>>' : '')); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  <<' + extra + '>>' : '')); }
}
/* the lives are the HEARTS in the stage's top-left corner, so a test reads what the student reads:
   full hearts out of the row's length (the row never shrinks — a spent heart goes hollow). */
const hearts = root => {
  const box = root.querySelector('.g4-hearts');
  if (!box) return '0/0';
  const all = [...box.querySelectorAll('.g4-heart')];
  return all.filter(h => h.classList.contains('full')).length + '/' + all.length;
};
function mount(html, prep) {
  const dom = new JSDOM(html || FIXTURE, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/games4.html',
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addListener: () => { }, removeListener: () => { } });
      w.console.error = (...a) => { console.log('  [page error] ' + a.join(' ')); };
      w.HTMLElement.prototype.scrollIntoView = () => { };
      if (prep) prep(w);
    }
  });
  const w = dom.window;
  w.eval(engineSrc());
  w.eval('window.__booted = window.GAMES4.boot()');
  DOMS.push(w);
  return w;
}
async function games(opts = {}) {
    if (qaOff('games')) return;
    JSDOM = (await import('jsdom')).JSDOM;
  console.log('🧪 engine4 / catchBasket + whackMole\n');
  const w = mount();
  const doc = w.document;
  const rc = doc.getElementById('catch'), rm = doc.getElementById('mole');
  const gc = (w.__G4 || []).find(g => g.root === rc);
  const gm = (w.__G4 || []).find(g => g.root === rm);

  ok('boot found both game blocks', w.__G4.length === 2 && !!gc && !!gm, (w.__booted || 0) + ' instance(s)');
  ok('both games read the same authored markup', gc.items.length === 2 && gm.items.length === 1);

  /* --- the DEFAULT view is the game's intro screen --- */
  ok('the block opens on an intro screen', !!rc.querySelector('.g4-intro') && !rc.classList.contains('is-on'));
  ok('the intro carries the authored how-text',
    /Drag each one/.test((rc.querySelector('.g4-intro .game-how') || {}).textContent || ''));
  ok('the intro carries the Play button, not a form', !!rc.querySelector('.g4-intro .game-start'));
  ok('the intro carries no rounds/deadline/keys strip', !rc.querySelector('.g4-intro-meta'));
  ok('the engine marks the block ready — that class is what hides the list', rc.classList.contains('g4-ready'));
  ok('the authored radios survive in the DOM (hidden, not deleted)',
    rc.querySelectorAll('.game-list input[type=radio]').length === 4);
  ok('the intro overlay sits over a still of the game art (a poster, not blank space)',
    !!(rc.querySelector('.g4-poster') || doc.querySelector('.g4-poster')));
  ok('the poster is a picture, not a control surface (nothing clickable on the stage yet)',
    doc.querySelectorAll('.g4-stage button').length === 2,
    doc.querySelectorAll('.g4-stage button').length + ' button(s) on stage (2 = the Play button only + start)');

  /* --- the fallback: a block no game claimed stays a plain form --- */
  const orphan = doc.createElement('div');
  orphan.className = 'game';
  orphan.setAttribute('data-game', 'noSuchGame');
  orphan.innerHTML = '<p class="game-how">fallback</p><div class="game-list">'
    + item(1, 'q', 'a', [['a', 'x']]) + '</div><button class="game-start" type="button">▶</button>';
  doc.querySelector('.content-area').appendChild(orphan);
  w.GAMES4.boot();
  ok('an unclaimed block gets NO ready class, so its list and how-text stay visible',
    !orphan.classList.contains('g4-ready') && !orphan.querySelector('.g4-intro'));
  orphan.remove();

  /* --- and CSS must actually express that, or the fallback is a fiction --- */
  const CSS_SRC = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8').replace(/\s+/g, ' ');
  ok('style.css hides the list only behind .g4-ready', /\.game\.g4-ready \.game-list\{display:none\}/.test(CSS_SRC));
  ok('style.css hides a dead Start button on an unclaimed block',
    /\.game:not\(\.g4-ready\) \.game-start\{display:none\}/.test(CSS_SRC));
  ok('print always shows the authored list', /@media print\{[^\n]*\.game-list\{display:block !important/.test(CSS_SRC));

  /* --- catchBasket: a row of words on top, baskets from the block's own option labels --- */
  rc.querySelector('.game-start').click();
  ok('Start begins the run', rc.classList.contains('is-on') && gc.state().running, gc.state().phase);
  ok('one basket per option', doc.querySelectorAll('#catch .g4-bucket').length === 2);
  ok('every basket is drawn art, not a bare box', doc.querySelectorAll('#catch .g4-bucket .g4-art').length === 2);
  ok('the buckets are labelled by the activity (its option text)',
    [...doc.querySelectorAll('#catch .g4-bucket-t')].map(t => t.textContent).join('|') === 'past|now',
    [...doc.querySelectorAll('#catch .g4-bucket-t')].map(t => t.textContent).join('|'));
  ok('ONE word is on the row — the one being sorted, not all of them',
    [...doc.querySelectorAll('#catch .g4-chip')].map(c => c.textContent).join('|') === 'a finished thing',
    [...doc.querySelectorAll('#catch .g4-chip')].map(c => c.textContent).join('|'));
  ok('the first word starts selected', doc.querySelector('#catch .g4-chip').classList.contains('active'));
  ok('the deadline is visible as a bar', !!doc.querySelector('#catch .g4-timebar i'));
  ok('data-time is read as the per-item deadline', gc.state().itemTime === 6000, 'itemTime=' + gc.state().itemTime);
  ok('the right answer is the authored data-a, not a written key', gc.state().key === 'a', 'key=' + gc.state().key);

  gc.hooks.pick('a');
  ok('a hit scores', gc.state().score === 1);
  ok('a hit checks the REAL radio (that is what persists)',
    doc.querySelector('#catch input[name="q1"][value="a"]').checked === true);
  await sleep(700);

  ok('the next item follows on its own', gc.state().prompt === 'a thing happening', gc.state().prompt);
  ok('the answered word leaves the row', doc.querySelectorAll('#catch .g4-chip').length === 1,
    doc.querySelectorAll('#catch .g4-chip').length + ' chip(s) left');

  /* any word can be answered, not only the front of the queue */
  gc.hooks.start();
  const it2 = gc.queue[1];
  gc.pickOn(it2, 'b');
  ok('a word that is NOT at the front can be answered (pickOn)',
    doc.querySelector('#catch input[name="q2"][value="b"]').checked === true);
  ok('pickOn counts it once, not twice', gc.state().score === 1, 'score=' + gc.state().score);
  await sleep(700);

  gc.hooks.pick('b');
  ok('a wrong basket is a miss', gc.state().score === 1 && gc.state().missed === 1,
    'score=' + gc.state().score + ' missed=' + gc.state().missed);
  ok('a miss leaves the radio blank — the blank is the evidence',
    doc.querySelector('#catch input[name="q1"][value="b"]').checked === false);
  await sleep(1100);

  ok('the missed item comes back once', gc.state().replaying === true, 'replaying=' + gc.state().replaying);
  gc.hooks.pick('a');
  await sleep(700);
  const line = rc.querySelector('.game-score-line');
  ok('the run ends with the score line',
    gc.state().phase === 'over' && !!line && /Score: 2 \/ 2/.test(line.textContent),
    line ? line.textContent : 'no line');
  ok('the authored list is handed back', !rc.classList.contains('is-on'));

  /* --- an unanswered fall is a miss, not a silent skip --- */
  gc.hooks.start();
  gc.hooks.expire();
  ok('an unanswered fall is a miss', gc.state().missed === 1 && gc.state().score === 0);
  await sleep(1000);

  /* --- the keyboard is a first-class way to answer --- */
  gc.hooks.start();
  rc.dispatchEvent(new w.KeyboardEvent('keydown', { key: '1', bubbles: true }));
  ok('the keyboard answers too (1..n)', gc.state().score === 1, 'score=' + gc.state().score);
  await sleep(700);

  /* --- whackMole: moles are options, drawn, in holes, under a HUD prompt --- */
  rm.querySelector('.game-start').click();
  ok('whackMole surfaces one mole per option', doc.querySelectorAll('#mole .g4-mole').length === 3);
  ok('every mole is drawn art', doc.querySelectorAll('#mole .g4-mole .g4-art').length === 3);
  ok('the moles live in holes', doc.querySelectorAll('#mole .g4-hole').length >= 6,
    doc.querySelectorAll('#mole .g4-hole').length + ' holes');
  ok('a hole has a dirt rim, so it reads as a hole', !!doc.querySelector('#mole .g4-hole .g4-dirt'));
  ok('the prompt sits on the HUD line', doc.querySelector('#mole .g4-prompt').textContent === 'which one is a greeting');
  const right = [...doc.querySelectorAll('#mole .g4-mole')].find(m => m.getAttribute('data-v') === 'c');
  right.click();
  ok('clicking the right mole marks the radio',
    doc.querySelector('#mole input[name="q1"][value="c"]').checked === true);
  ok('and scores', gm.state().score === 1);
  await sleep(700);
  ok('the single-item run ends', gm.state().phase === 'over', gm.state().phase);

  /* --- a pointer drag answers through the same path as a click --- */
  gc.hooks.start();
  const card = doc.querySelector('#catch .g4-chip');
  const baskets = doc.querySelectorAll('#catch .g4-bucket');
  ok('a word chip and the baskets are there to drag between', !!card && baskets.length === 2);
  const fire = (elm, type) => elm.dispatchEvent(new w.MouseEvent(type, { bubbles: true, clientX: 0, clientY: 0 }));
  fire(card, 'pointerdown');
  ok('pointerdown lifts the card', card.classList.contains('dragging'));
  fire(card, 'pointermove');
  fire(card, 'pointerup');
  ok('dropping the card on a basket answers, and marks the real radio',
    doc.querySelector('#catch input[name="q1"][value="a"]').checked === true, 'score=' + gc.state().score);
  await sleep(700);

  /* --- the levers are data, so difficulty is authored, never coded --- */
  const probe = doc.createElement('div');
  probe.className = 'game';
  probe.setAttribute('data-game', 'whackMole');
  probe.setAttribute('data-rounds', '1');
  probe.setAttribute('data-shuffle', '1');
  probe.setAttribute('data-limit', '30');
  probe.innerHTML = '<div class="game-list"></div>';
  doc.querySelector('.content-area').appendChild(probe);
  w.GAMES4.boot();
  const pg = (w.__G4 || []).find(x => x.root === probe);
  ok('the levers are read from the block (limit / shuffle / rounds)', !!pg && pg.limit === 30 && pg.shuffleOn === true);
  ok('an empty game disables itself instead of pretending', !!pg && !!probe.querySelector('.game-start') && probe.querySelector('.game-start').disabled === true);
  ok('boot is idempotent (no double instances)', w.GAMES4.boot() === 3 && probe.__g4 === pg);

  /* ---- every game in the menu boots, draws its own furniture, and resolves the authored radio ---- */
  const GAMES = {
    catchBasket: '.g4-bucket', whackMole: '.g4-mole',
    stackDrop: '.g4-padbtn', flapGate: '.g4-gapg',
    mineGrid: '.g4-door', wordleBoard: '.g4-tile', crosswordBoard: '.g4-xboard',
    echoPads: '.g4-pad', bingoCard: '.g4-btile',
    ladderRun: '.g4-lclimber', bossRaid: '.g4-bossart', trainOrder: '.g4-tcar'
  };
  const fixtures = Object.keys(GAMES).map(name => `
    <div class="game" id="g-${name}" data-game="${name}" data-shuffle="0" data-replay="0" data-time="0">
      <p class="game-how">Block for ${name}.</p>
      <div class="game-list">
        <div class="qitem" data-a="a" data-code="1" data-answer="hi" data-at="0,0" data-dir="across">
          <div class="qline"><span class="qstem">first prompt</span></div>
          <div class="qopts"><label><input type="radio" name="n-${name}-1" value="a">hi</label><label><input type="radio" name="n-${name}-1" value="b">bye</label></div>
        </div>
        <div class="qitem" data-a="b" data-code="2" data-answer="ta" data-at="0,0" data-dir="across">
          <div class="qline"><span class="qstem">second prompt</span></div>
          <div class="qopts"><label><input type="radio" name="n-${name}-2" value="a">no</label><label><input type="radio" name="n-${name}-2" value="b">ta</label></div>
        </div>
      </div>
      <button class="game-start" type="button">▶ Start</button>
    </div>`).join('');

  const w2 = mount(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>all</title></head>
    <body><div class="content-area">${fixtures}</div></body></html>`);
  const d2 = w2.document;
  ok('every game in the menu boots', (w2.__G4 || []).length === Object.keys(GAMES).length,
    (w2.__G4 || []).length + '/' + Object.keys(GAMES).length);

  Object.keys(GAMES).forEach(name => {
    const root = d2.getElementById('g-' + name);
    const sceneSvg = root.querySelector('.g4-scene svg');
    ok(name + ': has a drawn scene behind it',
      !!sceneSvg && sceneSvg.innerHTML.length > 300 && sceneSvg.innerHTML.indexOf('url(#g4-') > -1,
      sceneSvg ? sceneSvg.innerHTML.length + ' chars' : 'no scene');
    const g = (w2.__G4 || []).find(x => x.root === root);
    if (!g) { ok(name + ': instance exists', false); return; }
    root.querySelector('.game-start').click();
    const drew = root.querySelector(GAMES[name]);
    const on = root.classList.contains('is-on');
    if (g.board) {
      /* a board game places every card up front and answers out of order — proven on its own below */
      ok(name + ': starts, lays its board out, claims the run',
        on && g.phase === 'play' && !!drew,
        drew ? '' : 'no ' + GAMES[name]);
      return;
    }
    g.hooks.pick('a');
    const radio = root.querySelector('input[name="n-' + name + '-1"][value="a"]');
    ok(name + ': starts, draws its own furniture, marks the radio',
      on && !!drew && !!radio && radio.checked === true,
      (on ? '' : 'not started ') + (drew ? '' : 'no ' + GAMES[name] + ' '));
  });

  /* the three games whose input is typed, not clicked */
  const xw = (w2.__G4 || []).find(x => x.root === d2.getElementById('g-crosswordBoard'));
  xw.hooks.start();
  const cells = [...d2.querySelectorAll('#g-crosswordBoard .g4-gap')];
  cells.forEach((c, i) => { c.value = ['h', 'i'][i]; c.dispatchEvent(new w2.Event('input', { bubbles: true })); });
  ok('crosswordBoard: spelling the word answers it',
    d2.querySelector('#g-crosswordBoard input[value="a"]').checked === true);

  const wd = (w2.__G4 || []).find(x => x.root === d2.getElementById('g-wordleBoard'));
  wd.hooks.start();
  const entry = d2.querySelector('#g-wordleBoard .g4-wtype');
  entry.value = 'hi';
  entry.dispatchEvent(new w2.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('wordleBoard: guessing the word answers it',
    d2.querySelector('#g-wordleBoard input[value="a"]').checked === true);

  const lk = (w2.__G4 || []).find(x => x.root === d2.getElementById('g-echoPads'));
  lk.hooks.start();
  [...d2.querySelectorAll('#g-echoPads .g4-pad')].filter(p => p.getAttribute('data-v') === 'a')[0].click();
  ok('echoPads: the pad with the word that fits answers that item',
    d2.querySelector('#g-echoPads input[value="a"]').checked === true);

  /* the scene and the intro card are part of every claimed block */
  const anyRoot = d2.getElementById('g-catchBasket');
  ok('every claimed block carries a drawn scene', !!anyRoot.querySelector('.g4-scene svg'));
  ok('the intro is a card over the scene, not a full-page form',
    !!anyRoot.querySelector('.g4-intro > .g4-intro-card'));
  ok('the shared gradient defs are injected once per page',
    d2.querySelectorAll('.g4-defs').length === 1);

  /* ---- trainOrder: the order of adjectives, on rails, under a low bridge --------------------------
     One item per WORD. The words of one sentence are laid out together (that is what a train is) and
     the verdict is GEOMETRY: a car further back is shorter, a word grows to the height its own slot is
     allowed, so a word a car too far back comes through the deck. These drive it the way a student
     does — tap a word, tap a car — and then let the train leave on its own. */
  const SLOTLIST = ['opinion', 'size', 'age', 'shape', 'color', 'origin', 'material', 'purpose'];
  const word = (n, stem, key, train) => `
    <div class="qitem" data-a="${key}"${train ? ' data-train="' + train + '"' : ''}>
      <div class="qline"><span class="qstem">${stem}</span></div>
      <div class="qopts">${SLOTLIST.map(v => `<label><input type="radio" name="t${n}" value="${v}">${v}</label>`).join('')}</div>
    </div>`;
  const tPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="tk" data-game="trainOrder" data-shuffle="0" data-time="0" data-depart="0" data-retry="0">
        <p class="game-how">Load the cars.</p>
        <div class="game-list">
          ${word(1, 'lovely', 'opinion')}${word(2, 'little', 'size')}${word(3, 'wooden', 'material')}
          ${word(4, 'French', 'origin', 2)}${word(5, 'round', 'shape', 2)}
        </div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const tkRoot = tPage.document.getElementById('tk');
  const tk = (tPage.__G4 || [])[0];
  const tCars = () => [...tkRoot.querySelectorAll('.g4-tcar')];
  const tDock = () => [...tkRoot.querySelectorAll('.g4-tword')].map(c => c.textContent).join('|');
  /* a tap is a pointerdown and the pointerup that ends it without moving: the card stays picked */
  const tapWord = (label) => {
    const card = [...tkRoot.querySelectorAll('.g4-tword')].find(c => c.textContent === label);
    if (!card) return false;
    card.dispatchEvent(new tPage.Event('pointerdown', { bubbles: true }));
    tPage.document.dispatchEvent(new tPage.Event('pointerup', { bubbles: true }));
    return card.classList.contains('on');
  };
  /* the yard runs on its own clock, so the test waits for the STATE it wants, never for a guessed
     number of milliseconds: a slow machine must not be able to fail the game */
  const until = async (fn, ms = 8000) => {
    const t0 = Date.now();
    while (!fn() && Date.now() - t0 < ms) await sleep(40);
    return fn();
  };
  tkRoot.querySelector('.game-start').click();
  ok('trainOrder: one car per slot — the whole order is always on the rails', tCars().length === 8,
    tCars().length + ' car(s)');
  ok('trainOrder: the first train takes only ITS OWN words to the dock, not the block',
    tDock() === 'lovely|little|wooden', tDock());
  ok('trainOrder: the car behind stands higher and is shorter, so its opening is less room',
    tCars()[0].style.height === '122px' && tCars()[7].style.height === '80px'
    && tCars()[7].style.marginBottom === '42px',
    tCars()[0].style.height + ' @' + tCars()[0].style.marginBottom
    + ' → ' + tCars()[7].style.height + ' @' + tCars()[7].style.marginBottom);
  ok('trainOrder: every car wears its slot name while the level is low',
    [...tkRoot.querySelectorAll('.g4-tslot')].map(t => t.textContent).join('|')
    === 'Opinion|Size|Age|Shape|Color|Origin|Material|Purpose',
    tkRoot.querySelectorAll('.g4-tslot').length + ' plaque(s)');
  ok('trainOrder: tapping a word picks it up', tapWord('lovely'));
  tCars()[0].click();
  ok('trainOrder: a word dropped in its own car checks THAT car\'s radio',
    tPage.document.querySelector('#tk input[name="t1"][value="opinion"]').checked === true);
  const loveLoad = tCars()[0].querySelector('.g4-tload');
  ok('trainOrder: the word grows to the height its own slot is allowed (100px for the front car)',
    !!loveLoad && loveLoad.style.height === '100px' && tCars()[0].classList.contains('ok'),
    loveLoad ? loveLoad.style.height : 'no load');
  /* a word a car too far back: taller than the room that car has */
  tapWord('little');
  tCars()[3].click();
  ok('trainOrder: a word put further back is marked wrong, and its radio is the car it landed in',
    tCars()[3].classList.contains('no')
    && tPage.document.querySelector('#tk input[name="t2"][value="shape"]').checked === true);
  ok('trainOrder: and it bursts through the deck where the growth ends',
    await until(() => !!tCars()[3].querySelector('.g4-tburst')));
  /* a word too far FORWARD fits (a gap), which is why the crash is not symmetric */
  tapWord('wooden');
  tCars()[1].click();
  ok('trainOrder: a word that ends up too far forward fits under the bridge (it is a gap, not a crash)',
    tCars()[1].classList.contains('no') && !tCars()[1].querySelector('.g4-tburst'));
  ok('trainOrder: a full train leaves on its own, and the wreck is on the stage',
    await until(() => tkRoot.querySelector('.g4-ttrain').classList.contains('jolt')),
    tkRoot.querySelector('.g4-ttrain').className);
  ok('trainOrder: the plank over the wrong car is what breaks',
    await until(() => tkRoot.querySelectorAll('.g4-tplank.broken').length === 1),
    tkRoot.querySelectorAll('.g4-tplank.broken').length + ' plank(s)');
  ok('trainOrder: the verdict is stamped on the stage',
    await until(() => /DERAILED/.test((tkRoot.querySelector('.g4-tstamp') || {}).textContent || '')),
    (tkRoot.querySelector('.g4-tstamp') || {}).textContent || '(none)');
  ok('trainOrder: a wreck costs one of the run\'s hearts',
    await until(() => hearts(tkRoot) === '1/2'), hearts(tkRoot));
  ok('trainOrder: the next train is laid for the next sentence',
    await until(() => tDock() === 'French|round'), tDock());
  ok('trainOrder: the new train starts on a clean rail (the last verdict is off the stage)',
    !/showing/.test((tkRoot.querySelector('.g4-tstamp') || {}).className || ''));
  /* the second train, loaded correctly */
  tapWord('French');
  tCars()[5].click();
  tapWord('round');
  tCars()[3].click();
  ok('trainOrder: a train with every word in its own car runs out under the bridge',
    await until(() => tkRoot.querySelector('.g4-ttrain').classList.contains('pull')),
    tkRoot.querySelector('.g4-ttrain').className);
  ok('trainOrder: and it is CLEARED',
    /CLEARED/.test((tkRoot.querySelector('.g4-tstamp') || {}).textContent || ''));
  /* the run ends with the LAST train still on the stage: the ending is part of the game, so the stage is
     kept until the train has gone, and only then handed back to the intro */
  ok('trainOrder: the ending holds the stage (the intro does not cover the last train leaving)',
    await until(() => tk.state().phase === 'over') && tkRoot.classList.contains('is-on'),
    tk.state().phase + ' is-on=' + tkRoot.classList.contains('is-on'));
  ok('trainOrder: ... and hands it back when the yard is empty',
    await until(() => !tkRoot.classList.contains('is-on') && !!tkRoot.querySelector('.g4-prev.on')),
    'is-on=' + tkRoot.classList.contains('is-on'));
  ok('trainOrder: the score is the words that were fitted right (3 of 5)', tk.state().score === 3,
    'score=' + tk.state().score + '/' + tk.state().total);

  /* the labels are a LEVEL lever: a plaque saying "Opinion" over the front car is the answer.
     The level is the lesson number the page declares; a block cannot claim one of its own. */
  const LVL = (id, level, attrs) => mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="${id}" data-game="trainOrder" ${attrs || ''} data-shuffle="0" data-depart="0">
        <p class="game-how">a</p><div class="game-list">${word(1, 'lovely', 'opinion')}</div>
        <button class="game-start" type="button">▶</button></div>
    </div>${level ? '<script>const L = ' + level + ';</script>' : ''}</body></html>`);
  const l31 = LVL('l31', 31), l31on = LVL('l31on', 31, 'data-labels="1"'), l20 = LVL('l20', 20),
        l34 = LVL('l34', 34), lNo = LVL('lNo', 0);
  [l31, l31on, l20, l34, lNo].forEach(p => p.document.querySelector('.game-start').click());
  const plaques = (p, id) => p.document.querySelectorAll('#' + id + ' .g4-tslot').length;
  ok('trainOrder: level 31 hides the car labels by default', plaques(l31, 'l31') === 0, plaques(l31, 'l31') + ' plaque(s)');
  ok('trainOrder: data-labels="1" puts them back', plaques(l31on, 'l31on') === 8, plaques(l31on, 'l31on') + ' plaque(s)');
  ok('trainOrder: level 20 keeps them', plaques(l20, 'l20') === 8, plaques(l20, 'l20') + ' plaque(s)');
  ok('trainOrder: the lesson page\'s own L is the level (L=34 hides the labels)',
    plaques(l34, 'l34') === 0, plaques(l34, 'l34') + ' plaque(s)');
  ok('trainOrder: a page with no level keeps the labels (an unknown student is no expert)',
    plaques(lNo, 'lNo') === 8, plaques(lNo, 'lNo') + ' plaque(s)');


  /* ---- structural guards: the two bug classes we kept hitting ----
     1. a class the engine creates with NO rule in style.css renders as unstyled text (the greyed
        options), and
     2. two games sharing one class name means the later rule silently restyles the earlier game.
     A class reaches the DOM by TWO routes: the element helper `el('div', 'g4-a g4-b')`, and any
     `class="g4-a g4-b"` inside a string that becomes innerHTML. Reading only the first route left
     whole pictures invisible to both guards — mineGrid's signpost plaque, written in a string, was
     being restyled by a stale `.g4-board` stage rule and no guard could see either half. So the
     scan below reads BOTH routes, here and for each game's ownership. */
  const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
  const styled = new Set([...css.matchAll(/\.(g4-[a-z0-9-]+)/g)].map(m => m[1]));
  const src = fs.readFileSync(path.join(ROOT, 'engine4.js'), 'utf8');
  /* every g4- class the text puts on an element, by either route. A token must be a whole class name
     (`g4-x`), which drops the half-built prefix of a concatenation (`'g4-' + kind`). engine4.js writes
     its HTML in single-quoted strings with escaped quotes (`class=\"g4-x\"`) and the posters use plain
     ones, so the quote may carry any number of backslashes and either quote character. */
  function classesIn(text) {
    const out = new Set();
    /* a class token may carry hyphens (`g4-bucket-t`) but can never END in one: a trailing dash is the
       half-built prefix of a concatenation (`'g4-' + kind`), not a name */
    const take = s => s.split(/\s+/).forEach(c => {
      if (/^g4-[a-z0-9]+(-[a-z0-9]+)*$/.test(c)) out.add(c);
    });
    for (const m of text.matchAll(/el\('[a-z]+', '([^']*)'/g)) take(m[1]);
    for (const m of text.matchAll(/class=\\*["']([^"'\\]+)\\*["']/g)) take(m[1]);
    return out;
  }
  const made = classesIn(src);
  const elOnly = new Set([...src.matchAll(/el\('[a-z]+', '(g4-[a-z0-9-]+)/g)].map(m => m[1]));
  const unstyled = [...made].filter(c => !styled.has(c));
  ok('every class the engine creates has a rule in style.css', unstyled.length === 0, unstyled.join(' '));
  /* a guard on the guard: if the scan narrows back to el() literals it stops seeing the strings, and
     the two guards above quietly become half a guard again */
  ok('the class scan reads innerHTML strings as well as el() calls', made.size > elOnly.size,
    made.size + ' classes vs ' + elOnly.size + ' from el() alone');

  /* classes owned by more than one game: only ones that are deliberately shared are allowed. The
     same two-route scan is used per game, so a class that appears only as `class="…"` in a game's
     picture still counts as that game's. */
  const SHARED = new Set(['g4-again', 'g4-raceopt', 'g4-raceopts']);
  const starts = [];
  src.split('\n').forEach((l, i) => {
    const m = l.match(/^\s*PLUGINS\.([a-zA-Z]+) = function/);
    if (m) starts.push({ name: m[1], start: i });
  });
  const owners = new Map();
  /* the SCENE/POSTER tables build stills out of every game's furniture, so they are not an owner */
  const sceneStart = src.split('\n').findIndex(l => /var SCENE = \{/.test(l));
  const sceneEnd = src.split('\n').findIndex((l, i) => i > sceneStart && /^\s*PLUGINS\./.test(l));
  starts.forEach((s, i) => {
    const body = src.split('\n')
      .map((l, n) => (n >= sceneStart && n < sceneEnd) ? '' : l)
      .slice(s.start, i + 1 < starts.length ? starts[i + 1].start : src.split('\n').length).join('\n');
    classesIn(body).forEach(c => {
      if (!owners.has(c)) owners.set(c, new Set());
      owners.get(c).add(s.name);
    });
  });
  const clashes = [...owners.entries()].filter(([c, o]) => o.size > 1 && !SHARED.has(c))
    .map(([c, o]) => c + ':' + [...o].join('/'));
  ok('no two games fight over one class name', clashes.length === 0, clashes.join(' '));

  /* the unreadable-text guard: the bug was option TEXT rendered in a very light grey on a light
     panel. Size was never the problem, so this checks COLOUR: any rule that sets a text colour on
     a game element must use the ink/cream custom properties or a dark hex. Light greys fail. */
  {
    const lum = (hex) => {
      const h = hex.replace('#', '');
      const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const [r, g, b] = [0, 2, 4].map(i => parseInt(n.substr(i, 2), 16) / 255)
        .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const rules = [...css.matchAll(/([^{}]*\.g4-[^{}]*)\{([^}]*)\}/g)];
    const bad = [];
    rules.forEach(m => {
      const color = (m[2].match(/(?:^|;)\s*color:\s*([^;]+)/) || [])[1];
      if (!color) return;
      const v = color.trim().toLowerCase();
      if (v.indexOf('var(--') === 0) return;            /* the palette's own ink/cream */
      if (v === '#fff' || v === '#ffffff' || v === 'white' || v === 'transparent' || v === 'inherit') return;
      const hex = v.match(/#[0-9a-f]{3,6}/);
      if (hex && lum(hex[0]) < 0.35) return;            /* a dark colour is readable */
      bad.push(m[1].trim().split('\n').pop().trim() + ' { color: ' + v + ' }');
    });
    ok('every text colour the games set is ink, cream or a dark colour (no light grey text)',
      bad.length === 0, bad.join(' | ') || 'all readable');
  }

  /* bingoCard must CALL a word, not read the question — the bug you spotted */
  const spoken = [];
  const bPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="bg" data-game="bingoCard" data-shuffle="0" data-time="0" data-sound="0">
        <p class="game-how">Stamp the one you hear.</p>
        <div class="game-list">
          <div class="qitem" data-a="b">
            <div class="qline"><span class="qstem">which of these means a finished action</span></div>
            <div class="qopts"><label><input type="radio" name="bg1" value="a">running</label><label><input type="radio" name="bg1" value="b">walked</label></div>
          </div>
        </div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`, w => {
    w.speechSynthesis = { speak: u => spoken.push(u.text), cancel: () => { } };
    w.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  const bg = (bPage.__G4 || [])[0];
  bPage.document.getElementById('bg').querySelector('.game-start').click();
  await sleep(400);
  ok('bingoCard calls the answer word, not the question',
    spoken.length > 0 && spoken[spoken.length - 1] === 'walked', 'said «' + (spoken[spoken.length - 1] || '') + '»');

  /* the counting is bingoCard's clock, and it stands BESIDE the card — never on the curtain, never twice,
     and never a written instruction inside the stage */
  const bRoot = bPage.document.getElementById('bg'), bBox = bRoot.querySelector('.g4-bingo');
  const bKids = [...bBox.children].map(n => n.className.split(' ')[0]);
  ok('bingoCard: the card is wrapped so a curtain can cover it', !!bRoot.querySelector('.g4-card-wrap .g4-curtain'));
  ok('bingoCard: the lead countdown stands LEFT of the card and the rush countdown RIGHT',
    bKids[0] === 'g4-count' && bKids[bKids.length - 1] === 'g4-count'
    && bBox.firstElementChild.classList.contains('g4-count-lead')
    && bBox.lastElementChild.classList.contains('g4-count-rush'), bKids.join(' | '));
  ok('bingoCard: the rush countdown is only there while the card is open',
    /\.g4-count-rush\{[^}]*visibility:hidden/.test(CSS_SRC)
    && /\.g4-bingo\.open \.g4-count-rush\{visibility:visible\}/.test(CSS_SRC));
  ok('bingoCard: the two counts sit side by side, not stacked', /\.g4-bingo\{[^}]*flex-direction:row/.test(CSS_SRC));
  ok('bingoCard: the stage prints no second instruction and no replay button',
    !bRoot.querySelector('.g4-bingo .g4-yell') && !bRoot.querySelector('.g4-bingo .g4-again'));
  ok('bingoCard: the curtain starts shut', !bBox.classList.contains('open')
    && bBox.firstElementChild.textContent !== '', 'lead «' + bBox.firstElementChild.textContent + '»');
  await sleep(3000);
  ok('bingoCard: the call ends and the curtain rises on its own', bBox.classList.contains('open'));
  ok('bingoCard: the rush countdown runs once the card is open', /^[1-5]$/.test(bBox.lastElementChild.textContent),
    'rush «' + bBox.lastElementChild.textContent + '»');
  ok('bingoCard: the word is called once — there is nothing to replay', spoken.length === 1,
    spoken.length + ' call(s)');
  /* the deadline: the rush reaches zero, the curtain falls, and the item is a miss */
  let waited = 0;
  while (bBox.classList.contains('open') && waited < 7000) { await sleep(50); waited += 50; }
  ok('bingoCard: the curtain falls when the rush countdown ends', !bBox.classList.contains('open'),
    waited + 'ms after the card opened');
  ok('bingoCard: the fallen curtain marks the item wrong (the point is gone)',
    bg.state().missed === 1 && bg.state().score === 0,
    'score=' + bg.state().score + ' missed=' + bg.state().missed);
  ok('bingoCard: the unanswered radio stays blank — the blank is the evidence',
    bPage.document.querySelector('#bg input[value="b"]').checked === false);

  /* the crossword must be a REAL crossword: crossing words share their letter, typed once */
  const xwItems = [['cat', 'a small pet'], ['are', 'you ___ ready']].map(([w, clue], i) => `
    <div class="qitem" data-a="a" data-answer="${w}">
      <div class="qline"><span class="qstem">${clue}</span></div>
      <div class="qopts"><label><input type="radio" name="xw${i}" value="a">${w}</label><label><input type="radio" name="xw${i}" value="b">zzz</label></div>
    </div>`).join('');
  const xPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="xx" data-game="crosswordBoard" data-shuffle="0" data-time="0" data-sound="0">
        <p class="game-how">Fill the grid.</p>
        <div class="game-list">${xwItems}</div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const xr = xPage.document.getElementById('xx');
  xr.querySelector('.game-start').click();
  const xcells = [...xr.querySelectorAll('.g4-gap')];
  ok('crosswordBoard lays the words so they cross (a shared letter, one cell)',
    xcells.length < 6 && xcells.length >= 5, xcells.length + ' cells for 6 letters');
  xcells.forEach(c => {
    const k = c.getAttribute('data-key');
    const want = { '0,0': 'c', '0,1': 'a', '0,2': 't', '1,1': 'r', '2,1': 'e' }[k];
    if (want) { c.value = want; c.dispatchEvent(new xPage.Event('input', { bubbles: true })); }
  });
  ok('crosswordBoard: one typed shared letter finishes both words',
    xr.querySelector('input[name="xw0"][value="a"]').checked === true &&
    xr.querySelector('input[name="xw1"][value="a"]').checked === true);

  /* the crossword punishes nothing: a wrong word takes no point, ends no run, and leaves its radio
     blank (qa/NOTES.md 71 — "wrong answers dont subtract points, there is no fail condition") */
  const yItems = [['cat', 'a small pet'], ['are', 'you ___ ready']].map(([w, clue], i) => `
    <div class="qitem" data-a="a" data-answer="${w}">
      <div class="qline"><span class="qstem">${clue}</span></div>
      <div class="qopts"><label><input type="radio" name="yw${i}" value="a">${w}</label><label><input type="radio" name="yw${i}" value="b">zzz</label></div>
    </div>`).join('');
  const yPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="yy" data-game="crosswordBoard" data-shuffle="0" data-time="0" data-sound="0">
        <p class="game-how">Fill the grid.</p>
        <div class="game-list">${yItems}</div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const yr = yPage.document.getElementById('yy');
  const yg = (yPage.__G4 || [])[0];
  yr.querySelector('.game-start').click();
  [...yr.querySelectorAll('.g4-gap')].forEach(c => {
    if ({ '0,0': 1, '0,1': 1, '0,2': 1 }[c.getAttribute('data-key')] && !c.value) {
      c.value = 'z';
      c.dispatchEvent(new yPage.Event('input', { bubbles: true }));
    }
  });
  ok('crosswordBoard: a wrong word costs no point', yg.state().score === 0,
    'score=' + yg.state().score);
  ok('crosswordBoard: and there is no fail condition', yg.state().phase !== 'over',
    'phase=' + yg.state().phase);
  ok('crosswordBoard: the missed word leaves its radio blank',
    yr.querySelector('input[name="yw0"][value="a"]').checked === false);

  /* ladderRun must actually climb, and a wrong answer must drop it back to the safe rung */
  const lItems = Array.from({ length: 8 }, (_, i) => `
    <div class="qitem" data-a="a">
      <div class="qline"><span class="qstem">rung ${i}</span></div>
      <div class="qopts"><label><input type="radio" name="ld${i}" value="a">yes</label><label><input type="radio" name="ld${i}" value="b">no</label></div>
    </div>`).join('');
  const lPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="ld" data-game="ladderRun" data-shuffle="0" data-time="0" data-replay="0" data-sound="0">
        <p class="game-how">Climb.</p>
        <div class="game-list">${lItems}</div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const ld = lPage.document.getElementById('ld');
  const lg = (lPage.__G4 || [])[0];
  ld.querySelector('.game-start').click();
  const climber = ld.querySelector('.g4-lclimber');
  const y0 = climber.style.bottom;
  lg.hooks.pick('a');
  const y1 = climber.style.bottom;
  ok('ladderRun climbs on a right answer', y0 !== y1, y0 + ' -> ' + y1);
  await sleep(700);
  lg.hooks.pick('b');
  const y2 = climber.style.bottom;
  ok('ladderRun drops back to the safe rung on a wrong one', y2 === y0, y2);

  /* skeetRange: one disc per option, ONE shot per item, and a click on the sky spends that shot */
  const skPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="sk" data-game="skeetRange" data-shuffle="0" data-time="0" data-replay="0" data-sound="0">
        <p class="game-how">One shot per round. Hit the disc that fits.</p>
        <div class="game-list">
          <div class="qitem" data-a="b">
            <div class="qline"><span class="qstem">which one ends with the sound in wanted</span></div>
            <div class="qopts"><label><input type="radio" name="sk1" value="a">walked</label><label><input type="radio" name="sk1" value="b">needed</label></div>
          </div>
          <div class="qitem" data-a="a">
            <div class="qline"><span class="qstem">which one has the long i</span></div>
            <div class="qopts"><label><input type="radio" name="sk2" value="a">seat</label><label><input type="radio" name="sk2" value="b">sick</label></div>
          </div>
        </div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const skr = skPage.document.getElementById('sk');
  const skg = (skPage.__G4 || [])[0];
  skr.querySelector('.game-start').click();
  ok('skeetRange: one disc per option', skr.querySelectorAll('.g4-target').length === 2,
    skr.querySelectorAll('.g4-target').length + ' disc(s)');
  ok('skeetRange: every disc is a drawn ring with its label on a plaque',
    skr.querySelectorAll('.g4-target .g4-ring').length === 2 &&
    [...skr.querySelectorAll('.g4-target .g4-target-t')].map(t => t.textContent).join('|') === 'walked|needed',
    [...skr.querySelectorAll('.g4-target .g4-target-t')].map(t => t.textContent).join('|'));
  ok('skeetRange: the stem is the prompt line on the stage',
    /wanted/.test((skr.querySelector('.g4-prompt') || {}).textContent || ''));
  /* the sky is a shot: one click that hits no disc spends the item and is a miss */
  skr.querySelector('.g4-range').dispatchEvent(new skPage.MouseEvent('click', { bubbles: true }));
  ok('skeetRange: a click on the sky is your one shot, and it is a miss',
    skg.state().missed === 1 && skg.state().score === 0,
    'score=' + skg.state().score + ' missed=' + skg.state().missed);
  ok('skeetRange: a miss leaves the radio blank — the blank is the evidence',
    skr.querySelector('input[name="sk1"][value="a"]').checked === false &&
    skr.querySelector('input[name="sk1"][value="b"]').checked === false);
  await sleep(1200);
  ok('skeetRange: the spent item does not come back (data-replay="0")',
    skg.state().replaying !== true, 'replaying=' + skg.state().replaying);
  const goodDisc = [...skr.querySelectorAll('.g4-target')].find(d => d.getAttribute('data-v') === 'a');
  ok('skeetRange: the next item lays its own discs', !!goodDisc);
  if (goodDisc) goodDisc.click();
  ok('skeetRange: hitting the right disc checks the REAL radio (that is what persists)',
    skr.querySelector('input[name="sk2"][value="a"]').checked === true);
  ok('skeetRange: a hit scores', skg.state().score === 1, 'score=' + skg.state().score);

  /* ---- catchBasket: a right answer waters a pot and plants a flower that STAYS (the garden is the run) ---- */
  const fPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="fb" data-game="catchBasket" data-shuffle="0" data-time="0" data-sound="0">
        <p class="game-how">Sort.</p>
        <div class="game-list">
          ${item(1, 'she ___ here', 'a', [['a', 'walks'], ['b', 'walk']])}
          ${item(2, 'they ___ here', 'b', [['a', 'walks'], ['b', 'walk']])}
        </div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const fRoot = fPage.document.getElementById('fb');
  const fg = (fPage.__G4 || [])[0];
  fRoot.querySelector('.game-start').click();
  const potOf = v => [...fRoot.querySelectorAll('.g4-bucket')].find(b => b.getAttribute('data-v') === v);
  fg.hooks.pick('a');
  ok('catchBasket: a right answer waters that pot', !!potOf('a') && potOf('a').classList.contains('watered'));
  ok('catchBasket: and plants one flower in it', potOf('a').querySelectorAll('.g4-bloom').length === 1,
    potOf('a').querySelectorAll('.g4-bloom').length + ' bloom(s)');
  ok('catchBasket: the pot that was not chosen grows nothing', potOf('b').querySelectorAll('.g4-bloom').length === 0);
  await sleep(750);
  ok('catchBasket: the flower is still there on the next word (the garden is the run)',
    !!potOf('a') && potOf('a').querySelectorAll('.g4-bloom').length === 1,
    potOf('a') ? potOf('a').querySelectorAll('.g4-bloom').length + ' bloom(s)' : 'no pot');

  /* ---- mineGrid: saloon doors. The right door is entered, a wrong one is a snake, and the three
     lives belong to the RUN: an item must never hand one back. ---- */
  const mPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="mg" data-game="mineGrid" data-shuffle="0" data-replay="0" data-time="0" data-sound="0">
        <p class="game-how">Open a door.</p>
        <div class="game-list">
          ${item(1, 'the room where you cook', 'b', [['a', 'hall'], ['b', 'kitchen'], ['c', 'garage'], ['d', 'cellar']])}
          ${item(2, 'the person who fixes a car', 'c', [['a', 'baker'], ['b', 'driver'], ['c', 'mechanic'], ['d', 'plumber']])}
          ${item(3, 'something you borrow from a library', 'a', [['a', 'a book'], ['b', 'a ticket'], ['c', 'a receipt'], ['d', 'a fridge']])}
        </div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const mgRoot = mPage.document.getElementById('mg');
  const mg = (mPage.__G4 || [])[0];
  mgRoot.querySelector('.game-start').click();
  const doorFor = v => [...mgRoot.querySelectorAll('.g4-door')].find(d => d.getAttribute('data-v') === v);
  /* the lives are the HUD's count — read what the student reads, not a private variable */
  const livesTxt = () => hearts(mgRoot);
  ok('mineGrid: one saloon door per option (four doors on the street)',
    mgRoot.querySelectorAll('.g4-door').length === 4, mgRoot.querySelectorAll('.g4-door').length + ' doors');
  ok('mineGrid: the pit is gone (no hole to fall in)',
    mgRoot.querySelectorAll('.g4-pit,.g4-stake').length === 0);
  doorFor('b').click();
  /* he walks (360ms), goes in (560ms), then the runner takes the answer: ~1s before the radio moves */
  await sleep(1200);
  ok('mineGrid: a right door opens and checks its radio, and no snake comes out',
    doorFor('b').classList.contains('ok') && !doorFor('b').classList.contains('bitten') &&
    mgRoot.querySelector('input[name="q1"][value="b"]').checked === true);
  await sleep(600);
  ok('mineGrid: the street did not hand a life back between items (still 3/3)',
    livesTxt() === '3/3', livesTxt());
  doorFor('d').click();
  await sleep(1200);
  ok('mineGrid: a wrong door turns red with the snake in it, and the right door is outlined',
    doorFor('d').classList.contains('no') && doorFor('d').classList.contains('bitten') &&
    doorFor('c').classList.contains('reveal'));
  ok('mineGrid: a snake bite costs exactly one life',
    livesTxt() === '2/3', livesTxt());
  ok('mineGrid: the bite leaves the radio blank (the blank is the evidence)',
    [...mgRoot.querySelectorAll('input[name="q2"]')].every(r => r.checked === false));

  /* ---- bossRaid: the fighter picked on the intro card decides the attack, and the boss answers
     back with two different attacks rather than repeating one. ---- */
  const brPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="br" data-game="bossRaid" data-shuffle="0" data-replay="0" data-time="0" data-sound="0">
        <p class="game-how">Fight.</p>
        <div class="game-list">
          ${item(1, 'first', 'a', [['a', 'yes'], ['b', 'no']])}
          ${item(2, 'second', 'a', [['a', 'yes'], ['b', 'no']])}
          ${item(3, 'third', 'a', [['a', 'yes'], ['b', 'no']])}
          ${item(4, 'fourth', 'a', [['a', 'yes'], ['b', 'no']])}
        </div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const brRoot = brPage.document.getElementById('br');
  const br = (brPage.__G4 || [])[0];
  const picks = [...brRoot.querySelectorAll('.g4-pick-btn')];
  ok('bossRaid: the intro card offers three fighters', picks.length === 3, picks.map(b => b.getAttribute('data-fighter')).join(', '));
  ok('bossRaid: one is picked from the start', picks.filter(b => b.classList.contains('on')).length === 1);
  picks.find(b => b.getAttribute('data-fighter') === 'wizard').click();
  ok('bossRaid: picking a fighter marks it, and only it',
    picks.filter(b => b.classList.contains('on')).length === 1 &&
    picks.find(b => b.getAttribute('data-fighter') === 'wizard').classList.contains('on'));
  brRoot.querySelector('.game-start').click();
  br.hooks.pick('a');
  ok('bossRaid: a right answer fires THAT fighter\'s projectile (the wizard\'s fireball)',
    !!brRoot.querySelector('.g4-proj.fire'), brRoot.querySelectorAll('.g4-proj').length + ' projectile(s)');
  /* the fireball is in the air at once and bursts on the boss 440ms later */
  await sleep(520);
  ok('bossRaid: the fireball bursts on the boss (it flinches)',
    brRoot.querySelector('.g4-bossart').classList.contains('hurt'));
  /* a hit clears after 620ms, a miss after 1000ms: wait the slower one before the next answer */
  await sleep(1200);
  br.hooks.pick('b');
  ok('bossRaid: a wrong answer is the boss\'s turn, and the first one is the bite',
    brRoot.querySelector('.g4-bossart').classList.contains('bite'));
  await sleep(1200);
  br.hooks.pick('b');
  ok('bossRaid: the boss does not repeat itself — the second turn is acid, and it travels',
    !!brRoot.querySelector('.g4-proj.spit'), brRoot.querySelectorAll('.g4-proj').length + ' projectile(s)');
  const bossLives = () => hearts(brRoot);
  ok('bossRaid: two boss turns cost two of the three lives',
    bossLives() === '1/3', bossLives());

  /* ---- the ONE fail condition: the last life ends the run, and the runner is what enforces it, so a
     presentation that only spends the life cannot leave the run going. ---- */
  /* a miss clears after 1000ms: the third pick must wait for the next item, or it is ignored */
  await sleep(1200);
  br.hooks.pick('b');
  await sleep(1500);
  ok('lives 0 ends the run (the third boss turn takes the last heart)',
    bossLives() === '0/3', bossLives());
  ok('lives 0 ends the run: the stage is handed back and the run is over',
    !brRoot.classList.contains('is-on') && br.hooks.state().phase === 'over',
    br.hooks.state().phase);
  ok('lives 0 ends the run: the score line says why',
    /out of lives/.test((brRoot.querySelector('.game-score-line') || {}).textContent || ''),
    (brRoot.querySelector('.game-score-line') || {}).textContent || '(no line)');

  console.log('\n' + (fail ? 'FAILED: ' : 'OK: ') + pass + ' passed, ' + fail + ' failed\n');
  /* some game plugins keep a requestAnimationFrame loop or a timer alive; jsdom would never exit */
  closeAll();
  return fail ? 1 : 0;
}

  return games;
})();

/* =====================================================================================
   [INDEX] — the derived files: lessons.json, tracks.json, the two stamps
   ===================================================================================== */
export const index = (() => {
  function index(opts = {}) {
    const argv = flags(opts);
    const CHECK = argv.includes('--check') || !!opts.check;
    /* --track=<t> WRITES ONE TRACK'S SLICE AND NOTHING ELSE. The other slices are carried over from
       lessons.json exactly as they stand; the stylesheet stamp is a site-wide edit and is skipped,
       which --check (the pre-push gate) still imposes on the whole repo. */
    const ONLY = (argv.find(a => a.startsWith('--track=')) || '').slice('--track='.length);
    if (ONLY && CHECK) {
      console.error('index: --check is the whole-repo statement and cannot be narrowed. Run it with no --track.');
      return 1;
    }
    let badExit = 0;

const PREV = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'lessons.json'), 'utf8')); } catch (e) { return {}; }
})();

/* every derived file goes through here: identical content is left alone, and --check reports instead of writes.
   Line endings are the CHECKOUT's, never a reason to report drift: core.autocrlf=true means a Windows working
   copy holds CRLF while git stores LF, and a check that compared raw bytes would refuse every push after a
   fresh clone. */
const drift = [];
function emit(rel, text) {
  const abs = path.join(ROOT, rel);
  const now = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  const eol = now !== null && now.includes('\r\n') ? '\r\n' : '\n';
  if (eol !== '\n') text = text.replace(/\r?\n/g, eol);
  if (now === text) return false;
  if (CHECK) { drift.push(rel); return true; }
  fs.writeFileSync(abs, text, 'utf8');
  return true;
}

/* name, then how the site names the track: label, icon, order. NO COLOUR: a track's colour is a hue in
   style.css (`[data-track=…],.t-…`), so the sheet owns it and nothing here has to be restamped. */
const TRACKS = [
  { name: 'kids', label: 'Kids', icon: '🛹', order: 1 },
  { name: 'business', label: 'Business', icon: '💼', order: 2 },
  { name: 'adult', label: 'Adult', icon: '🔞', order: 3 },
  { name: 'advanced-stem', label: 'Advanced STEM', icon: '🔬', order: 4 },
  { name: 'advanced-aave', label: 'Advanced AAVE', icon: '🎤', order: 5 },
  { name: 'memelord-mogger', label: 'Memelord Mogger', icon: '😎', order: 6 },
  { name: 'english-basic-portuguese', label: 'English → Basic Portuguese', icon: '🔁', order: 7 },
  { name: 'gramatica-redacao', label: 'Gramática e Redação', icon: '✍️', order: 8 },
  { name: 'linguagem-figurativa-giria', label: 'Linguagem Figurativa e Giria', icon: '🎭', order: 9 },
];

if (ONLY && !TRACKS.some(t => t.name === ONLY)) {
  console.error('index: no track named "' + ONLY + '" — the tracks are: ' + TRACKS.map(t => t.name).join(', '));
  return 1;
}

/* a folder with lesson pages that the table does not know: say so, rather than publish a site without it */
for (const d of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name[0] === '.' || d.name === 'node_modules') continue;
  if (TRACKS.some(t => t.name === d.name)) continue;
  if (isDemo(ROOT, d.name)) continue;
  let files = [];
  try { files = fs.readdirSync(path.join(ROOT, d.name)); } catch (e) { continue; }
  if (files.indexOf('lessons') >= 0) {
    try { files = files.concat(fs.readdirSync(path.join(ROOT, d.name, 'lessons'))); } catch (e) { /* none */ }
  }
  if (files.some(f => /^lesson\d+.*\.html$/.test(f))) {
    console.warn('WARN: ' + d.name + '/ has lesson pages but is not in the TRACKS table of this file');
  }
}

const manifest = {};
/* a title is READABLE OR IT IS NOT A TITLE. `lesson<N>-<Title>.html` is the page's ADDRESS; the name the
   student reads is the page's own <h1>, because a filename cannot carry a space, an apostrophe or a colon —
   `Doesnt-TheLittleVerb` and `TheModeIndicatorThatCarriesTheTense` are not what the lesson is called. The
   slug is still the fallback (de-dashed) for a page with no headline, so a new page lists the moment it
   exists and is named the moment it has an <h1>. */
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”' };
function pageTitle(abs, slug) {
  let html = '';
  try { html = fs.readFileSync(abs, 'utf8'); } catch (e) { return slug; }
  /* the LAST <h1> is the lesson's own headline: the sheet's brand bar is a <header> holding its own <h1>
     (`BUSINESS LESSON 5`), which names the book, not the lesson. */
  const all = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (!all.length) return slug;
  const m = all[all.length - 1];
  const text = m[1].replace(/<[^>]*>/g, ' ')
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (all, e) => {
      if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return ENTITIES[e.toLowerCase()] !== undefined ? ENTITIES[e.toLowerCase()] : all;
    })
    .replace(/\s+/g, ' ').replace(/\s+([,;:.!?])/g, '$1').trim();
  return text || slug;
}
for (const meta of TRACKS) {
  const track = meta.name;
  const dir = path.join(ROOT, track);
  const entries = [];
  /* a track this run was not asked about is neither rebuilt nor read */
  if (ONLY && track !== ONLY) { manifest[track] = PREV[track] || []; continue; }
  const pageDir = lessonDir(track);
  if (fs.existsSync(pageDir)) {
    for (const name of fs.readdirSync(pageDir)) {
      /* THE FILENAME IS THE ADDRESS: `lesson<N>-<Title>.html` decides the number and the file served. The
         headline inside the page is the name. No other page is read — the stylesheet stamp at the foot of
         this file is the one edit the build makes inside a page. */
      const m = name.match(/^lesson(\d+)(?:-(.*))?\.html$/);
      if (!m) continue;
      const n = Number(m[1]);
      const slug = m[2] ? m[2].replace(/-+/g, ' ').trim() : '';
      /* the address is the page's path under the track: `lessons/lesson7-….html` */
      const rel = path.relative(dir, path.join(pageDir, name)).split(path.sep).join('/');
      entries.push({ n, title: pageTitle(path.join(pageDir, name), slug || 'Lesson ' + n), file: rel });
    }
  }
  entries.sort((a, b) => a.n - b.n);
  manifest[track] = entries;
}

const summary = Object.fromEntries(Object.entries(manifest).map(([k, v]) => [k, v.length]));
const wroteLessons = emit('lessons.json', JSON.stringify(manifest, null, 2) + '\n');

// tracks.json is what index.html reads to name and paint each track, so the page holds no track name of
// its own. No count travels here: a track's size is lessons.json's own array, and a copy can only drift.
// It changes ONLY when the table above changes — adding a lesson never touches it.
const trackList = TRACKS.map(m => ({ name: m.name, label: m.label, icon: m.icon, order: m.order }));
const wroteTracks = emit('tracks.json', JSON.stringify(trackList, null, 2) + '\n');

// The stylesheet's version stamp is BAKED INTO EVERY PAGE by this build, never applied at runtime. It used to
// be swapped in by JS at load, which changed <link>.href while the first fetch was still in flight: the browser
// aborted and restarted the fetch, painted the document unstyled, then repainted — the page "decomposed", the
// logo flashed left, and it redrew centred (owner report 2026-11-09). A href present in the HTML is
// render-blocking, so there is nothing to paint early. The stamp is the file's own hash, so it changes exactly
// when style.css changes, and a stale stamp is a harness failure rather than an invisible cache miss.
// The hash is taken over the LF text: the checkout's line endings are not the sheet's content, and a Windows
// CRLF copy must stamp the same URL a Linux copy does.
const cssText = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8').replace(/\r\n/g, '\n');
const cssHash = createHash('sha256').update(cssText).digest('hex').slice(0, 10);
const cssUrl = 'style.css?v=' + cssHash;
const linkRe = /<link rel="stylesheet" href="((?:\.\.\/)*)style\.css(?:\?v=[0-9a-f]*)?"/;
// The solver is stamped the same way: a cached equalize.js would leave a page hidden waiting for a
// script that never ran, and a changed solver would measure against the widths it wrote last time.
const jsText = fs.readFileSync(path.join(ROOT, 'equalize.js'), 'utf8').replace(/\r\n/g, '\n');
const jsHash = createHash('sha256').update(jsText).digest('hex').slice(0, 10);
const jsUrl = 'equalize.js?v=' + jsHash;
const scriptRe = /<script src="((?:\.\.\/)*)equalize\.js(?:\?v=[0-9a-f]*)?"/;
/* every page that links the sheet carries the same stamp: the root pages draw the menu and the map, and a
   lesson page must not keep a cached sheet after the sheet changes. The manifest cannot list every page —
   a lesson folder may hold pages the book does not list — so the rest are found in the tree. */
const stampedPages = new Set(ONLY ? [] : ['index.html', '_shell.html', '_shell-preview.html']);
if (!ONLY) for (const [track, entries] of Object.entries(manifest)) {
  for (const entry of entries) stampedPages.add(track + '/' + entry.file);
}
function walkHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name[0] === '.' || e.name === 'node_modules' || e.name === 'qa' || e.name === 'assets') continue;
      walkHtml(path.join(dir, e.name), out);
    } else if (/\.html$/i.test(e.name)) out.push(path.join(dir, e.name));
  }
  return out;
}
if (!ONLY) for (const file of walkHtml(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  if (stampedPages.has(rel)) continue;
  if (/\.old\.html$/i.test(rel)) continue;
  if (!/<link rel="stylesheet" href="(?:\.\.\/)?style\.css/.test(fs.readFileSync(file, 'utf8'))) continue;
  stampedPages.add(rel);
}
let stamped = 0;
for (const page of stampedPages) {
  const pagePath = path.join(ROOT, page);
  if (!fs.existsSync(pagePath)) continue;
  const htmlNow = fs.readFileSync(pagePath, 'utf8');
  const link = htmlNow.match(linkRe);
  if (!link) {
    drift.push(page + ' (no stylesheet link)');
    badExit = 1;
    continue;
  }
  let next = htmlNow;
  let changed = false;
  const wanted = '<link rel="stylesheet" href="' + link[1] + cssUrl + '"';
  if (link[0] !== wanted) { next = next.replace(linkRe, wanted); changed = true; }
  const script = next.match(scriptRe);
  if (script) {
    const jsWanted = '<script src="' + script[1] + jsUrl + '"';
    if (script[0] !== jsWanted) { next = next.replace(scriptRe, jsWanted); changed = true; }
  }
  if (changed && emit(page, next)) stamped++;
}
if (!CHECK && stamped) console.log(stamped + ' page link(s) stamped -> ' + cssUrl + ' / ' + jsUrl);

if (CHECK) {
  if (drift.length) {
    console.error('index --check: OUT OF DATE -> ' + drift.join(', '));
    console.error('run: npm run build:lessons   then commit the result (these files are served, not built at deploy)');
    return 1;
  }
  return badExit;
}
if (wroteLessons) console.log('lessons.json written: ' + JSON.stringify(summary));
if (wroteTracks) console.log('tracks.json written: ' + trackList.map(t => t.name + ' "' + t.label + '"').join(', '));
if (!wroteLessons && !wroteTracks) console.log('lessons.json and tracks.json already correct — nothing written');

    return badExit;
  }

  return index;
})();

/* =====================================================================================
   [QUEUE] — the finding shape, the halt, and the one idempotent PENDING write
   ===================================================================================== */

/** the one shape: `{ fn, rule, disposition, at, said, next }`. `disposition` is fix | halt | note. */
function finding(fn, rule, disposition, at, said, next = null) {
  return { fn, rule, disposition, at, said, next };
}

const PEND = 'PENDING.md';
const BATCH_RE = /^## \[B(\d+)\] - (.*)$/;

function pendText() {
  const file = path.join(ROOT, PEND);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
  return { raw, eol: raw.includes('\r\n') ? '\r\n' : '\n', text: raw.replace(/\r\n/g, '\n') };
}

/** every open review batch — `Review lesson <N> of <track> before it is checked again` */
function openReviews() {
  const p = pendText();
  if (!p) return new Map();
  const out = new Map();
  const re = /^## \[B(\d+)\] - Review lesson (\d+) of (\S+) before it is checked again/gm;
  let m;
  while ((m = re.exec(p.text))) out.set(m[3] + ' ' + m[2], { batch: Number(m[1]), track: m[3], n: Number(m[2]) });
  return out;
}

/** a halt LEAVES the run: every function asks this before it reads that lesson */
function isExcluded(track, n) {
  return !!track && openReviews().has(track + ' ' + n);
}

const haltNext = rule => (rule === 'anchors'
  ? 'Run `check2 --static` for this lesson alone first — the markup may be sound and only the wiring broken.'
  : rule === 'engines'
    ? 'Run `check2 --static` for this lesson alone; then `live` if static is clean.'
    : rule === 'shell'
      ? 'Back to pass 2: the page has no block, so no check is queued.'
      : 'Run `check2 --static` for this lesson alone.');

function nextBatchNo(text) {
  let max = 0;
  for (const m of text.matchAll(/^## \[B(\d+)\]/gm)) max = Math.max(max, Number(m[1]));
  return max + 1;
}

/** append a batch at the end of [CURRENT] — the file's whole tail — and return the new text */
function appendBatch(text, block) {
  return text.replace(/\s*$/, '\n') + '\n' + block + '\n';
}

/** the batch a `fix` step belongs to: the last [Bn] under [CURRENT] that is not a review batch */
function currentBatch(text) {
  const batches = [...text.matchAll(/^## \[B(\d+)\] - (.*)$/gm)]
    .filter(m => !/^Review lesson \d+ of \S+ before it is checked again/.test(m[2]));
  const last = batches[batches.length - 1];
  return last ? { n: Number(last[1]), start: last.index, title: last[2] } : null;
}

/** the insertion point for a step: before the next `## [` after the batch, or at EOF */
function appendStep(text, batchNo, step) {
  const head = text.indexOf('## [B' + batchNo + ']');
  if (head < 0) return appendBatch(text, '## [B' + batchNo + '] - Fix the findings the checks reported\n\n' + step);
  const next = text.slice(head + 1).search(/^## \[B\d+\]/m);
  const at = next < 0 ? text.length : head + 1 + next;
  return text.slice(0, at).replace(/\s*$/, '\n') + step + '\n\n' + text.slice(at);
}

/**
 * Queue, never remember: ONE write per call, after the findings are complete. Keyed by lesson + fn +
 * rule + said, so a second run of the same check adds nothing. A `note` is written only when an
 * action is owed later (`next`), because a note without an action is already printed.
 */
function queueFindings(list, ctx = {}) {
  const owed = (list || []).filter(f => f.disposition === 'halt' || f.disposition === 'fix' || (f.disposition === 'note' && f.next));
  if (!owed.length) return;
  const p = pendText();
  if (!p) { console.log('   the queue PENDING.md is missing — the findings above are printed and not queued'); return; }
  let text = p.text;
  const said = new Set();

  /* (a) a halt writes a batch of its own, and (b)+(c) state the exclusion and queue the follow-up */
  const byLesson = new Map();
  for (const f of owed.filter(f => f.disposition === 'halt')) {
    if (!byLesson.has(f.at)) byLesson.set(f.at, []);
    byLesson.get(f.at).push(f);
  }
  for (const [at, fs_] of byLesson) {
    if (!/^\S+ \d+$/.test(at)) continue;              /* not a lesson: nothing to review */
    if (openReviews().has(at)) continue;
    const n = nextBatchNo(text);
    const first = fs_[0];
    const block = [
      `## [B${n}] - Review lesson ${at.split(' ')[1] || '?'} of ${at.split(' ')[0]} before it is checked again ${first.rule} — ${first.said}`,
      '',
      ...fs_.map((f, i) => `- [S${i + 1}] ${f.said} (\`${f.fn}\` · \`${f.rule}\` · halt)`),
      `- [S${fs_.length + 1}] Excluded from every remaining check in this batch until this review is done: ${at} — the lesson may be rewritten rather than repaired.`,
      `- [S${fs_.length + 2}] ${haltNext(first.rule)}`,
      '',
    ].join('\n');
    text = appendBatch(text, block);
    for (const f of fs_) said.add(f.said);
  }

  /* fixes go under the current batch; one is made when the file has none to hold them */
  const rest = owed.filter(f => f.disposition !== 'halt' && !said.has(f.said) && !text.includes(f.said));
  if (rest.length) {
    let cur = currentBatch(text);
    if (!cur) {
      const n = nextBatchNo(text);
      text = appendBatch(text, `## [B${n}] - Fix the findings the checks reported\n`);
      cur = { n };
    }
    /* the batch's own steps are counted, so a second run continues the numbering instead of
       writing [S1] twice */
    const head = text.indexOf('## [B' + cur.n + ']');
    const tail = head < 0 ? text.length : (() => {
      const next = text.slice(head + 1).search(/^## \[B\d+\]/m);
      return next < 0 ? text.length : head + 1 + next;
    })();
    let k = (text.slice(head < 0 ? 0 : head, tail).match(/^- \[S\d+\]/gm) || []).length;
    for (const f of rest) {
      k++;
      text = appendStep(text, cur.n, `- [S${k}] ${f.at} — ${f.said} (\`${f.fn}\` · \`${f.rule}\` · ${f.disposition})`);
    }
  }

  if (text !== p.text) fs.writeFileSync(path.join(ROOT, PEND), text.replace(/\n/g, p.eol), 'utf8');
}

/* =====================================================================================
   [CLI] — the call surface: `node qa/checks.mjs <fn> …`
   ===================================================================================== */

const FUNCTIONS = { check1, check2, wrap, align, live, games, index };

async function cli(argv = process.argv.slice(2)) {
  const name = argv[0];
  if (!name || !FUNCTIONS[name]) {
    console.log('qa/checks.mjs — name one function: check1, check2, wrap, align, live, games, index.');
    return 1;
  }
  return (await FUNCTIONS[name]({ argv: argv.slice(1) })) || 0;
}

/* S4: the dispatch is guarded — importing this file runs nothing, and jsdom/Chrome are only loaded
   inside the functions that need them. */
const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entry && entry === path.resolve(fileURLToPath(import.meta.url))) {
  cli().then(code => { process.exitCode = code; })
    .catch(e => { console.error('qa/checks.mjs: ' + (e && e.stack || e)); process.exitCode = 1; });
}
