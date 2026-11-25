/**
 * qa/run.mjs — run ONE harness, and only one whose scope matches what is being checked.
 *
 * Why this file exists: `npm run qa` chained six members in a single line, so a check of one kids
 * page also swept business and adult, rebuilt lessons.json, and ran two voice detectors over
 * whatever git said was touched. Two harms, both real: a failure in a track nobody is writing made
 * the report unreadable, and the run took long enough that it stopped being run.
 *
 * The rule, in two halves:
 *   1. ONE MEMBER PER INVOCATION. The member is named on the command line. There is no default
 *      sweep and no way to ask for several, because "everything" is not a scope — it is the
 *      absence of one.
 *   2. ONLY MEMBERS THAT HONOUR THE SCOPE. `--track=`, `--all` and lesson numbers narrow a run.
 *      A member that ignores them is REFUSED when one is present: it would report "kids" while
 *      having audited every track, and a green that means something other than what it says is
 *      worse than no green. Name it without a scope flag if the whole sweep is what you want.
 *
 *   node qa/run.mjs content --track=kids 3
 *   npm  run qa -- content --track=kids 3
 *   node qa/run.mjs                      → the menu, and a non-zero exit
 *
 * `scope` below was read off each file's import block, never assumed: check imports the track
 * resolver, and games4, landing, live, build and liquid import none.
 */
import { qaOff } from './checks.mjs'; /* this dispatcher stays live; each member keeps its own switch */
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MEMBERS = {
  build:    { file: 'qa/checks.mjs', fn: 'index', scope: false,
              what: 'derive lessons.json and tracks.json from the page FILENAMES — writes files, audits nothing (--check: refuse if stale)' },
  page:     { file: 'qa/checks.mjs', fn: 'check2', scope: true,
              what: 'THE page gate: structure, blocks, items, markup boxes, the wrap, and the runtime (boots, answers, games)' },
  games:    { file: 'qa/checks.mjs', fn: 'games', scope: false,
              what: 'engine4.js and every plugin state machine' },
  landing:  { file: 'qa/landing.mjs',    scope: false,
              what: 'index.html: a column per track, titles as links, jump button' },
  live:     { file: 'qa/checks.mjs', fn: 'live', scope: false,
              what: 'real-Chrome probe for what jsdom cannot reproduce (--only=<scenario>)' },
  liquid:   { file: 'qa/liquid.mjs',     scope: false,
              what: 'the .md GitHub renders as pages: a Liquid opener left unclosed kills the Pages build' },
  rowctx:   { file: 'qa/rowctx.mjs',     scope: false,
              what: 'the row and cell rules resolve to the SAME values in every context — page grid, <section>, .block, .card, inside a row (--self-test: plants the stale rule and must catch it)' },
  rows3:    { file: 'qa/rows3.mjs',      scope: false,
              what: 'the four drop shapes of the layout editor in real Chrome — a cell on the band between rows, a cell merged into a cell, an item on a level-3 side band, an item in a level-3 middle — and undo after each' },
};

/** an argument that narrows a run: a track, the full sweep spoken aloud, or a lesson number */
const narrowing = a => a === '--track' || a.startsWith('--track=') || a === '--all' || /^\d+$/.test(a);

function menu(exitCode, note) {
  if (note) console.log('❌ ' + note + '\n');
  console.log('One member per invocation — name it, and add a scope only if it honours one.\n');
  console.log('  npm run qa -- <member> [--track=kids|business|adult] [--all] [lessonNumber …]\n');
  const names = Object.keys(MEMBERS);
  const w = Math.max(...names.map(n => n.length));
  for (const n of names) {
    const m = MEMBERS[n];
    console.log('  ' + n.padEnd(w) + '  ' + (m.scope ? 'scope ✓' : 'scope ✗') + '  ' + m.what);
  }
  console.log('\n  scope ✓  honours --track / --all / lesson numbers.');
  console.log('  scope ✗  audits every track by nature; a scope flag is refused rather than ignored.');
  process.exit(exitCode);
}

const argv = process.argv.slice(2);
const name = argv[0];
const rest = argv.slice(1);

if (!name) menu(1, 'no member named');
if (name === '--help' || name === '-h' || name === '--list' || name === '-l') menu(0);
if (!MEMBERS[name]) menu(1, 'unknown member "' + name + '"');

const m = MEMBERS[name];
const asked = rest.filter(narrowing);

if (asked.length && !m.scope) {
  const honourable = Object.keys(MEMBERS).filter(k => MEMBERS[k].scope).join(', ');
  menu(1, '"' + name + '" does not honour ' + asked.join(' ') + ' — it audits every track.\n' +
    '   Run it with no scope flag, or pick a member that does: ' + honourable);
}

console.log('▶ ' + name + ' — ' + m.file + ' ' + [m.fn, ...rest].filter(Boolean).join(' ').trim());
const r = spawnSync(process.execPath, [path.join(ROOT, m.file), ...(m.fn ? [m.fn] : []), ...rest],
  { cwd: ROOT, stdio: 'inherit', windowsHide: true });

if (r.error) { console.log('❌ could not start ' + m.file + ': ' + r.error.message); process.exit(1); }
if (r.signal) { console.log('❌ ' + name + ' was killed (' + r.signal + ')'); process.exit(1); }
process.exit(r.status === null ? 1 : r.status);
