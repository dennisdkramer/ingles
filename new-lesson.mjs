#!/usr/bin/env node
/**
 * new-lesson.mjs — start a lesson the way the page is actually built: copy `_shell.html`, fill its four
 * tokens, write the file, and report the line where the content begins.
 *
 *   node new-lesson.mjs --track=adult --lesson=29 --title="The Title You Want"
 *
 * Why a copy and not a printed input: the frame — doctype/head, `header.brand`, `#controlbar`, the
 * Portuguese `#barhelp` legend, `main#page > .page-container > .content-area`, and the engine script
 * slot — is fixed furniture. `style.css:48` says of the legend that "nothing a page generates writes
 * it", and `qa/apply.mjs:12-14` will never let an edit change anything outside `.content-area`. So a
 * generation does not need to read the shell; it needs the shell to already be in the file it writes
 * into, with an empty content area. That is what this script leaves behind.
 *
 * Tokens filled, all five present in `_shell.html`:
 *   {{TRACK_TITLE}}   track.json `label` ("Adulto"), falling back to the folder name with a capital
 *   {{TRACK_UPPER}}   the folder name in capitals ("ADULT")
 *   {{TRACK}}         the folder name as the backend's track key ("adult", `_shell.html:28`)
 *   {{LESSON_TITLE}}  --title, and the filename carries it too (nothing reads a page to learn its title)
 *   {{L}}             --lesson
 *
 * It writes nothing else and runs no build. `npm run build:lessons` afterwards is what puts the new page
 * into lessons.json — and the pre-push hook refuses a stale index, so a page added without it cannot go
 * out. Checking the finished page: `node qa/check.mjs --track=<track> <n>`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => {
  const m = process.argv.find(a => a.startsWith('--' + k + '='));
  return m ? m.slice(k.length + 3) : d;
};
const has = k => process.argv.includes('--' + k);

const track = arg('track', '').toLowerCase();
const lesson = Number(arg('lesson', '0'));
const title = arg('title', '').trim();

if (!track || !lesson || !title) {
  console.error('usage: node new-lesson.mjs --track=<adult|kids|business> --lesson=<n> --title="<Title>" [--force]');
  process.exit(2);
}
const dir = path.join(ROOT, track);
if (!fs.existsSync(dir)) {
  console.error('new-lesson: no such track folder: ' + track);
  process.exit(1);
}

/* the display label is the track's own, so the head of the page cannot disagree with the site's menu */
let label = track.charAt(0).toUpperCase() + track.slice(1);
const tj = path.join(dir, 'track.json');
if (fs.existsSync(tj)) {
  try {
    const j = JSON.parse(fs.readFileSync(tj, 'utf8'));
    if (j && j.label) label = j.label;
  } catch (e) {
    console.error('new-lesson: ' + path.relative(ROOT, tj) + ' is not valid JSON — using "' + label + '"');
  }
}

/* the filename is lesson<N>-<Title>.html: build-lessons.mjs derives the whole site index from it, and a
   character a filesystem or a URL refuses would break that derivation, so those are dropped, not escaped. */
const safe = title.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
const rel = track + '/lesson' + lesson + '-' + safe + '.html';
const file = path.join(ROOT, rel);
if (fs.existsSync(file) && !has('force')) {
  console.error('new-lesson: already exists: ' + rel + '   (--force overwrites, which erases the lesson)');
  process.exit(1);
}

const shell = fs.readFileSync(path.join(ROOT, '_shell.html'), 'utf8');
const filled = shell
  .replace(/\{\{TRACK_TITLE\}\}/g, label)
  .replace(/\{\{TRACK_UPPER\}\}/g, track.toUpperCase())
  .replace(/\{\{TRACK\}\}/g, track)
  .replace(/\{\{LESSON_TITLE\}\}/g, safe)
  .replace(/\{\{L\}\}/g, String(lesson));

/* a token the shell grows later must stop the run, not survive into a published page as "{{…}}" */
const left = [...new Set(filled.match(/\{\{[A-Z_]+\}\}/g) || [])];
if (left.length) {
  console.error('new-lesson: unfilled token(s) in _shell.html: ' + left.join(', '));
  process.exit(1);
}

fs.writeFileSync(file, filled, 'utf8');

const at = filled.split(/\r?\n/).findIndex(l => l.includes('class="content-area"')) + 1;
const mark = filled.split(/\r?\n/).findIndex(l => l.includes('LESSON CONTENT')) + 1;
const lines = filled.split(/\r?\n/).length;
console.log('created ' + rel + '   (' + lines + ' lines, frame only, content area empty)');
console.log('write the blocks at ' + rel + ':' + mark + ' — between the ▼▼ and ▲▲ markers, inside .content-area (opens at :' + at + '); nothing outside it is yours to change');
console.log('then: npm run build:lessons   ·   check: node qa/check.mjs --track=' + track + ' ' + lesson);
