/**
 * qa/track.mjs — the ONE place a harness learns which track it audits.
 *
 * SCOPE, not a target: with no flag a harness audits EVERY track that has pages on disk, so `npm run qa`
 * needs no argument and a rebuilt track is audited from its first page. `--track=kids|business|adult`
 * (or `--track kids`) narrows the run to that one track.
 *
 * A track with no pages on disk is a valid, passing state (a track is rebuilt one lesson at a time); a
 * track name that does not exist is a hard error, never a silent fallback to another track. Lesson numbers
 * are per-track: a number that exists in NO track in scope is a hard error too, so a typo can never be
 * read as "nothing to audit" and pass green.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const TRACKS = ['kids', 'business', 'adult'];
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
    .map(f => (f.match(/^lesson(\d+)\.html$/) || [])[1])
    .filter(Boolean).map(Number).sort((a, b) => a - b);
}

/** `4 7 --track=kids` → [4, 7]; no numbers → every page on disk for the track */
export function pickLessons(track, argv = process.argv.slice(2)) {
  const named = pickNumbers(argv);
  return named.length ? named : lessonsOnDisk(track);
}
