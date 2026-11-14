#!/usr/bin/env node
/**
 * qa/brief.mjs - the generation brief. A PRINTER, not a check.
 *
 *   node qa/brief.mjs --track=business --lesson=41        the input set, then the gate
 *   node qa/brief.mjs --track=business --lesson=41 --reassert   PEDAGOGY-MAP.md again, nothing else
 *   node qa/brief.mjs --css            the style.css `## ` headers, one line each, with their line numbers
 *   node qa/brief.mjs --indexes        both indexes: the menu index, then the style.css headers
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
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const lines = f => read(f).split(/\r?\n/);

/* the stylesheet's `## ` headers, ONE scan: --css prints the index and step 5 prints these same headers,
   so the two cannot list different ones. `line` is the line the header starts on, in the file as it stands. */
function cssHeaders() {
  const src = lines('style.css');
  const out = [];
  for (let i = 0; i < src.length; i++) {
    if (!/^\s*\/\*\s##\s/.test(src[i])) continue;
    const buf = [src[i]];
    let j = i;
    while (j < src.length - 1 && !/\*\//.test(src[j])) { j++; buf.push(src[j]); }
    out.push({ line: i + 1, text: src[i].trim(), block: buf.join('\n') });
    i = j;
  }
  return out;
}

/* the stylesheet read as an index, at print time. A stored index is wrong after the next insert, so this
   printer holds no copy of the file:
     node qa/brief.mjs --css        style.css:LINE  ## text, one line per header */
if (has('css')) {
  cssHeaders().forEach(h => process.stdout.write('style.css:' + h.line + '  ' + h.text + '\n'));
  process.exit(0);
}

/* the menu's index, machine-readable, with no track and no lesson in hand: this is what the preview
   page's nav is a readout of (`qa/serve.mjs` serves the same call to `qa/readout.js`), so the nav and
   the brief cannot list different shapes — one grammar, one parser (`qa/menu.mjs`).
     node qa/brief.mjs --index        the whole parse, as JSON (what the page receives)
     node qa/brief.mjs --index=raw    the `###` lines, one per shape, exactly as the brief prints them */
const indexArg = process.argv.find(a => a === '--index' || a.startsWith('--index='));
if (indexArg) {
  const menu = readMenu();
  if (indexArg === '--index=raw') menu.shapes.filter(s => !s.ignore).forEach(s => process.stdout.write(s.raw + '\n'));
  else process.stdout.write(JSON.stringify(menu, null, 2) + '\n');
  process.exit(0);
}

/* both indexes in one run, for a prompt that says "print the indexes": the menu's index in the same JSON
   `--index` prints, then the stylesheet's headers in the same one-line form `--css` prints.
     node qa/brief.mjs --indexes */
if (has('indexes')) {
  const menu = readMenu();
  const css = cssHeaders();
  process.stdout.write('CONTENT_EXAMPLES.md - ' + menu.shapes.length + ' SHAPES (the menu index)\n'
    + JSON.stringify(menu, null, 2) + '\n\n');
  process.stdout.write('style.css - ' + css.length + ' `## ` HEADERS\n');
  css.forEach(h => process.stdout.write('style.css:' + h.line + '  ' + h.text + '\n'));
  process.exit(0);
}

const track = (arg('track', '')).toLowerCase();
const lesson = Number(arg('lesson', '0'));
if (!track || !lesson) {
  console.error('usage: node qa/brief.mjs --track=<business|adult|kids> --lesson=<n> [--reassert] [--exemplars=N]');
  console.error('       node qa/brief.mjs --index        the menu read as an index (JSON; the preview nav\'s source)');
  console.error('       node qa/brief.mjs --css          the style.css `## ` headers, with their line numbers');
  console.error('       node qa/brief.mjs --indexes      both indexes: the menu, then the style.css headers');
  process.exit(2);
}
const TR = track.toUpperCase();

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
      [I/O] 5 is `[INSTRUCTIONS] SECTION ONLY` plus `--index=raw`, so this prints the grammar and then the
      headings; [BUILD] 3(e) then has the build read one chosen shape's section on its own. `### Build
      [Constraints]` is scaffolding, not a shape, and is skipped.
      --exemplars=N samples the INDEX (one line in N) for a deliberately narrow read; --section=<NN|name>
      prints one entry whole, which is what a build does once it has picked that shape — by its number
      (`### [03] <…>`) in the numbered form, or by its backticked name while an entry still carries one. */
const CE = read('CONTENT_EXAMPLES.md');
const iIns = CE.indexOf('## [INSTRUCTIONS]');
/* the grammar runs from `## [INSTRUCTIONS]` to the first numbered entry (`### [NN] …`), not to the next
   `##` section: a `##`-only bound runs on into the entries and delivers every one of them in full. */
const relEntry = iIns < 0 ? -1 : CE.slice(iIns).search(/\n### \[\d+\] /);
const iEnd = iIns < 0 ? 0 : (relEntry > 0 ? iIns + relEntry : CE.length);
if (iIns >= 0) emit('CONTENT_EXAMPLES.md - [INSTRUCTIONS] (the field grammar)',
  CE.slice(iIns, iEnd).trimEnd());
/* an entry whose heading carries `IGNORE - pending updates` is not in the builder's index: it is a shape
   still waiting for its update, so offering it would be offering a shape that is about to change. The
   count is printed with the section so the withholding is visible rather than silent. */
const shapes = readMenu().shapes;
const heads = shapes.filter(s => !s.ignore).map(s => s.raw);
const withheld = shapes.length - heads.length;
const every = Math.max(1, Number(arg('exemplars', '0')) || 1);
const picked = heads.filter((_, i) => i % every === 0);
emit('CONTENT_EXAMPLES.md - ' + picked.length + ' of ' + heads.length + ' SHAPES, one line each'
  + (every > 1 ? ' (1 in ' + every + ')' : '')
  + (withheld ? ', ' + withheld + ' withheld: marked IGNORE - pending updates' : ''),
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

/* 5. the stylesheet, headers only: the contracts, not the mechanism — the scan --css prints */
const heads2 = cssHeaders();
emit('style.css - ' + heads2.length + ' `## ` HEADERS ONLY', heads2.map(h => h.block).join('\n\n'));

/* 6. the shell the page is built on */
emit('_shell.html - THE PAGE THIS IS BUILT ON', read('_shell.html'));

/* 7. the gate: one question per line, answered AS EACH SECTION IS FINISHED — from what was just
      written, never by re-reading the finished page. Seven questions.
      [G2] is the difficulty question, and it is answered by NAMING the estimated share and what
      set it, not by arithmetic: [LEVEL] measures the difficulty by the concepts and the training
      required to master them — never by the prose or the options. */
const GATE = [
  '[G1] Does any answer appear in its own prompt? (it must not, in any form)',
  '[G2] Is the estimated difficulty of every block inside 40–90% for a student who has just been taught the concepts that block trains, and can you name the concept or the training that set it?',
  '[G3] Is every concept taught, then trained, then asked? (three moves, none skipped)',
  '[G4] Does every row of blocks close to 100%? (full alone · half+half · third+twothird · third x3)',
  '[G5] Is Portuguese only where marked, and inside the budget?',
  '[G6] Are items numbered in the order the layout draws them? (across for .qopts, down for .qgrid.stack)',
  '[G7] Does every example use the register voice?',
];
emit('THE GATE - seven questions, answered as each section is finished, from what you just wrote (never by re-reading the page)',
  GATE.join('\n'));

process.stderr.write('\nbrief total: ' + kb('x'.repeat(total)) + '   (run with --reassert for copy 2 of the map)\n');
