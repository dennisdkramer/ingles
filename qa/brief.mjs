#!/usr/bin/env node
/**
 * qa/brief.mjs - the generation brief. A PRINTER, not a check.
 *
 *   node qa/brief.mjs --track=business --lesson=41        the input set, then the gate
 *   node qa/brief.mjs --track=business --lesson=41 --reassert   PEDAGOGY-MAP.md again, nothing else
 *
 * Why the map appears twice: it is the file that decides what the lesson contains and at what
 * level, and it has been the file least obeyed. Copy 1 is read before the shape is chosen; copy 2
 * is read after it, when the drift has already happened.
 *
 * Nothing here judges anything. No page is opened, no lesson page is read, and no file is written.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => {
  const hit = process.argv.find(a => a.startsWith('--' + k + '='));
  return hit ? hit.slice(k.length + 3) : d;
};
const has = k => process.argv.includes('--' + k);

const track = (arg('track', '')).toLowerCase();
const lesson = Number(arg('lesson', '0'));
if (!track || !lesson) {
  console.error('usage: node qa/brief.mjs --track=<business|adult|kids> --lesson=<n> [--reassert] [--exemplars=N]');
  process.exit(2);
}
const TR = track.toUpperCase();
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const lines = f => read(f).split(/\r?\n/);

const bar = t => '\n' + '='.repeat(78) + '\n' + t + '\n' + '='.repeat(78);
const kb = s => (s.length / 1024).toFixed(1) + ' KB';
let total = 0;
const emit = (title, body) => {
  total += body.length;
  process.stdout.write(bar(title + '   [' + kb(body) + ']') + '\n' + body.trimEnd() + '\n');
};

/* the re-assert is one command that prints the map again and stops */
const MAP = read('PEDAGOGY-MAP.md');
if (has('reassert')) {
  emit('PEDAGOGY-MAP.md - COPY 2 OF 2 (re-assert: read this before answering the gate)', MAP);
  process.stderr.write('\nre-assert: ' + kb(MAP) + '\n');
  process.exit(0);
}

/* 1. the map */
emit('PEDAGOGY-MAP.md - COPY 1 OF 2', MAP);

/* 2. this lesson's own roadmap block, and nothing else from that file */
const ROADMAP = TR + '-ROADMAP.md';
const R = lines(ROADMAP);
const start = R.findIndex(l => new RegExp('^## (?:\\[' + lesson + '\\]|Lesson ' + lesson + ':)').test(l));
if (start < 0) {
  console.error('brief: ' + ROADMAP + ' has no `## [' + lesson + ']` block');
  process.exit(3);
}
let end = R.length;
for (let i = start + 1; i < R.length; i++) if (/^## /.test(R[i])) { end = i; break; }
emit(ROADMAP + ' - lesson ' + lesson + ' ONLY', R.slice(start, end).join('\n'));

/* 3. the register: voice, and how formal the track is */
const REG = TR + '-REGISTER.md';
if (fs.existsSync(path.join(ROOT, REG))) emit(REG, read(REG));

/* 4. exemplars: ONE IN EVERY TEN, never all of them. Within one lesson the items sit at
      similar levels, so four representative shapes tell a build more than forty do. */
const CE = read('CONTENT_EXAMPLES.md');
const parts = CE.split(/\n(?=### )/);
const heads = parts.filter(p => /^### /.test(p));
const every = Math.max(1, Number(arg('every', '0'))
  || (Number(arg('exemplars', '0')) ? Math.max(1, Math.floor(heads.length / Number(arg('exemplars')))) : 10));
const picked = heads.filter((_, i) => i % every === 0);
emit('CONTENT_EXAMPLES.md - ' + picked.length + ' of ' + heads.length + ' exemplars (1 in ' + every + ')',
  picked.map(p => p.trimEnd()).join('\n\n'));

/* 5. the stylesheet, headers only: the ten contracts, not the mechanism */
const CSS = lines('style.css');
const heads2 = [];
for (let i = 0; i < CSS.length; i++) {
  if (!/^\s*\/\*\s##\s/.test(CSS[i])) continue;
  const buf = [CSS[i]];
  let j = i;
  while (j < CSS.length - 1 && !/\*\//.test(CSS[j])) { j++; buf.push(CSS[j]); }
  heads2.push(buf.join('\n'));
}
emit('style.css - ' + heads2.length + ' `## ` HEADERS ONLY', heads2.join('\n\n'));

/* 6. the shell the page is built on */
emit('_shell.html - THE PAGE THIS IS BUILT ON', read('_shell.html'));

/* 7. the gate: one question per line, answered AS EACH SECTION IS FINISHED — from what was just
      written, never by re-reading the finished page. Seven questions.
      [G2] is the content-level question, not a shape rule: "is it challenging for THIS level".
      The system already quantifies that as load = L x M against the lesson number ([LEVEL] t), so
      [G2] and the old load line are one question, and [G2] is the only one of the seven that can be
      computed rather than judged — once the load curves exist. */
const GATE = [
  '[G1] Does any answer appear in its own prompt? (it must not, in any form)',
  '[G2] Is every item CHALLENGING for this level — its load at or above the lesson number, and nothing a level-N student would answer without thinking?',
  '[G3] Is every concept taught, then trained, then asked? (three moves, none skipped)',
  '[G4] Does every row of blocks close to 100%? (full alone · half+half · third+twothird · third x3)',
  '[G5] Is Portuguese only where marked, and inside the budget?',
  '[G6] Are items numbered in the order the layout draws them? (across for .qopts, down for .qgrid.stack)',
  '[G7] Does every example use the register voice?',
];
emit('THE GATE - seven questions, answered as each section is finished, from what you just wrote (never by re-reading the page)',
  GATE.join('\n'));

process.stderr.write('\nbrief total: ' + kb('x'.repeat(total)) + '   (run with --reassert for copy 2 of the map)\n');
