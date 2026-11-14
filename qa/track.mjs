/**
 * qa/track.mjs — the ONE place a harness learns which track it audits.
 *
 * SCOPE, not a target: with no flag a structural harness audits EVERY track that has pages on disk, so
 * `npm run qa` needs no argument and a rebuilt track is audited from its first page.
 * `--track=kids|business|adult` (or `--track kids`) narrows the run to that one track, and `--all` says
 * "the full sweep" out loud for the voice detectors, which are otherwise scoped to what the task touched.
 *
 * A track with no pages on disk is a valid, passing state (a track is rebuilt one lesson at a time); a
 * track name that does not exist is a hard error, never a silent fallback to another track. Lesson numbers
 * are per-track: a number that exists in NO track in scope is a hard error too, so a typo can never be
 * read as "nothing to audit" and pass green.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** A TRACK IS A FOLDER: one holding at least one lesson page, or a track.json (so a track can exist — and
 *  audit as an empty passing state — before its first lesson is written). Discovered, never listed: a track
 *  created months from now is in scope, and `--track=<it>` is a valid narrowing, with no edit to this file. */
function discoverTracks() {
  const out = [];
  let dirs = [];
  try { dirs = fs.readdirSync(ROOT, { withFileTypes: true }); } catch (e) { return out; }
  for (const d of dirs) {
    if (!d.isDirectory() || d.name[0] === '.' || d.name === 'node_modules') continue;
    let files = [];
    try { files = fs.readdirSync(path.join(ROOT, d.name)); } catch (e) { continue; }
    if (files.some(f => /^lesson\d+.*\.html$/.test(f)) || files.indexOf('track.json') >= 0) out.push(d.name);
  }
  return out.sort();
}
export const TRACKS = discoverTracks();

/** was `--track` given at all? (a named page that is missing fails only when a track was named) */
export function hasTrackFlag(argv = process.argv.slice(2)) {
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
export function pickTracks(argv = process.argv.slice(2)) {
  if (hasTrackFlag(argv)) return [readTrackFlag(argv)];
  return TRACKS.filter(t => lessonsOnDisk(t).length);
}

/** 'kids + business' — how a run names its scope in its output */
export function scopeLabel(tracks) {
  return tracks.length ? tracks.join(' + ') : 'no track has pages';
}

/** the bare `digits` arguments of a harness (lesson numbers) */
export function pickNumbers(argv = process.argv.slice(2)) {
  return argv.filter(a => !a.startsWith('--') && /^\d+$/.test(a)).map(Number);
}

/** named numbers that exist in NO track in scope — a typo must never pass as "nothing to audit" */
export function missingTargets(tracks, numbers) {
  const have = new Set(tracks.flatMap(t => lessonsOnDisk(t)));
  return numbers.filter(n => !have.has(n));
}

/** the lesson numbers that exist on disk for a track, ascending (empty array = nothing to audit) */
export function lessonsOnDisk(track) {
  const dir = path.join(ROOT, track);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map(f => (f.match(/^lesson(\d+)(?:-.*)?\.html$/) || [])[1])
    .filter(Boolean).map(Number).sort((a, b) => a - b);
}

/** THE FILE a lesson number names: `lesson7-<Title>.html`. The title lives in the filename — no page is
 *  read to find it — so a number is looked up, never concatenated into a path. */
export function lessonFile(track, n) {
  const dir = path.join(ROOT, track);
  if (!fs.existsSync(dir)) return null;
  const hit = fs.readdirSync(dir).find(f => new RegExp('^lesson' + n + '(?:-.*)?\\.html$').test(f));
  return hit ? path.join(dir, hit) : null;
}

/** `4 7 --track=kids` → [4, 7]; no numbers → every page on disk for the track */
export function pickLessons(track, argv = process.argv.slice(2)) {
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

   The structural harnesses (content, overflow, games) are deliberately NOT scoped this way: a page can be
   broken without anyone touching it, so pickTracks/pickLessons keep their full sweep for them.
*/
export function hasAllFlag(argv = process.argv.slice(2)) {
  return argv.includes('--all');
}

/** A rename line counts its destination. The leading class
 *  tolerates git's porcelain prefix (`?? adult/lesson22-The Clock.html`) and quoted paths, so an untracked page —
 *  which is exactly what a page being written looks like — is in scope. The track alternation is built from
 *  the DISCOVERED tracks, so a page in a track that did not exist when this line was written still counts. */
const PAGE_PATH = TRACKS.length
  ? new RegExp('(?:^|[\\s"\'\\\\/])(' + TRACKS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
      + ')[\\\\/]lesson(\\d+)(?:-[^"]*)?\\.html["\']?$')
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
export function touchedScope() {
  const seen = [...gitPagePaths(['show', '--name-only', '--pretty=format:', 'HEAD']),
    ...gitPagePaths(['status', '--porcelain'])];
  const byTrack = new Map();
  for (const p of seen) {
    if (!lessonsOnDisk(p.track).includes(p.n)) continue;
    if (!byTrack.has(p.track)) byTrack.set(p.track, new Set());
    byTrack.get(p.track).add(p.n);
  }
  if (!byTrack.size) return null;
  return { tracks: TRACKS.filter(t => byTrack.has(t)), numbers: byTrack };
}

/** the tracks a voice detector covers: an explicit `--track` wins, then `--all`, then what was touched */
export function pickVoiceTracks(argv = process.argv.slice(2)) {
  if (hasTrackFlag(argv) || hasAllFlag(argv)) return pickTracks(argv);
  const s = touchedScope();
  return s ? s.tracks : [];
}

/** the pages of one track a voice detector covers (named numbers > touched > every page on disk) */
export function pickVoiceLessons(track, scope, argv = process.argv.slice(2)) {
  const named = pickNumbers(argv);
  if (named.length) return named;
  if (scope && scope.numbers.has(track)) return [...scope.numbers.get(track)].sort((a, b) => a - b);
  return lessonsOnDisk(track);
}
