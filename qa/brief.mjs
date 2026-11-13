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
import { readMenu } from './menu.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => {
  const hit = process.argv.find(a => a.startsWith('--' + k + '='));
  return hit ? hit.slice(k.length + 3) : d;
};
const has = k => process.argv.includes('--' + k);

/* the menu's index, machine-readable, with no track and no lesson in hand: this is what the preview
   page's nav is a readout of (`qa/serve.mjs` serves the same call to `qa/readout.js`), so the nav and
   the brief cannot list different shapes — one grammar, one parser (`qa/menu.mjs`).
     node qa/brief.mjs --index        the whole parse, as JSON (what the page receives)
     node qa/brief.mjs --index=raw    the `###` lines, one per shape, exactly as the brief prints them */
const indexArg = process.argv.find(a => a === '--index' || a.startsWith('--index='));
if (indexArg) {
  const menu = readMenu();
  if (indexArg === '--index=raw') menu.shapes.forEach(s => process.stdout.write(s.raw + '\n'));
  else process.stdout.write(JSON.stringify(menu, null, 2) + '\n');
  process.exit(0);
}

const track = (arg('track', '')).toLowerCase();
const lesson = Number(arg('lesson', '0'));
if (!track || !lesson) {
  console.error('usage: node qa/brief.mjs --track=<business|adult|kids> --lesson=<n> [--reassert] [--exemplars=N]');
  console.error('       node qa/brief.mjs --index        the menu read as an index (JSON; the preview nav\'s source)');
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

/* 4. the menu: [INSTRUCTIONS] once, then ONE LINE PER SHAPE — never the bodies.
      [I/O] 5 says the build gets `[INSTRUCTIONS]` and **ONLY `###`-level headings after it**; [BUILD] 3(e)
      then has it read one chosen shape's section on its own. This used to send whole sections, one in ten:
      nine shapes of eighty-one, at 23 KB, and `[INSTRUCTIONS]` arrived only because it happened to be glued
      into the first section. `### Build [Constraints]` is scaffolding, not a shape, and is skipped.
      --exemplars=N samples the INDEX (one line in N) for a deliberately narrow read; --section=<NN|name>
      prints one entry whole, which is what a build does once it has picked that shape — by its number
      (`### [03] <…>`) in the numbered form, or by its backticked name while an entry still carries one. */
const CE = read('CONTENT_EXAMPLES.md');
const iIns = CE.indexOf('## [INSTRUCTIONS]');
/* the grammar runs from `## [INSTRUCTIONS]` to the first vehicle entry (`### [NN] …`), not to the next
   `##` section: with the old `## [TEACHING]`/`[MIXED]`/`[TRAINING]`/`[GAMES]` headings deleted, a
   `##`-only bound ran on to the next `##` section and delivered all 96 entries in full — 78 KB for a 20 KB grammar. */
const relEntry = iIns < 0 ? -1 : CE.slice(iIns).search(/\n### \[\d+\] /);
const iEnd = iIns < 0 ? 0 : (relEntry > 0 ? iIns + relEntry : CE.length);
if (iIns >= 0) emit('CONTENT_EXAMPLES.md - [INSTRUCTIONS] (the field grammar)',
  CE.slice(iIns, iEnd).trimEnd());
const heads = readMenu().shapes.map(s => s.raw);
const every = Math.max(1, Number(arg('exemplars', '0')) || 1);
const picked = heads.filter((_, i) => i % every === 0);
emit('CONTENT_EXAMPLES.md - ' + picked.length + ' of ' + heads.length + ' SHAPES, one line each'
  + (every > 1 ? ' (1 in ' + every + ')' : ''),
  picked.join('\n'));
const want = arg('section', '');
if (want) {
  const num = /^\d+$/.test(want) ? String(Number(want)) : null;
  const numRe = num && new RegExp('^### \\[0*' + num + '\\] ');
  const part = CE.split(/\n(?=### )/).find(s =>
    s.startsWith('### `' + want + ' ') || s.startsWith('### `' + want + ' -') || (numRe && numRe.test(s)));
  if (part) emit('CONTENT_EXAMPLES.md - ' + want + ' IN FULL', part.trimEnd());
  else console.error('brief: no such shape: ' + want);
}

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
      [G2] is the content-level question, and it is answered by NAMING the band, not by arithmetic:
      [LEVEL] gives the five bands and the four demands that set them, so the question is "which band
      is this block's hardest demand in", and the answer must be at or above the lesson number.
      The load product (L x M) is deliberately NOT the gate: [LEVEL] itself says a multiplier cannot
      turn one kind of demand into another ("x2 on 10-level content is the same stated fact twice"),
      so a page can reach a passing load by asking easy things often. Only L is the question; M is
      what the activity declares, and the markup can supply it — not L. */
const GATE = [
  '[G1] Does any answer appear in its own prompt? (it must not, in any form)',
  '[G2] Does every block carry `data-level` set to the band of its hardest demand (10/20/30/40/50), at or above the lesson number, and can you name which of the four demands set it?',
  '[G3] Is every concept taught, then trained, then asked? (three moves, none skipped)',
  '[G4] Does every row of blocks close to 100%? (full alone · half+half · third+twothird · third x3)',
  '[G5] Is Portuguese only where marked, and inside the budget?',
  '[G6] Are items numbered in the order the layout draws them? (across for .qopts, down for .qgrid.stack)',
  '[G7] Does every example use the register voice?',
];
emit('THE GATE - seven questions, answered as each section is finished, from what you just wrote (never by re-reading the page)',
  GATE.join('\n'));

process.stderr.write('\nbrief total: ' + kb('x'.repeat(total)) + '   (run with --reassert for copy 2 of the map)\n');
