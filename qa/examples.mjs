/**
 * qa/examples.mjs — the CONTENT_EXAMPLES.md contract.
 *
 * The file is a menu a build selects from by reading ONLY its `###` headings. That only works if every
 * heading is machine-readable and complete, so this asserts exactly that:
 *   - every ENTRY `###` heading parses as  name - (A0 … J0)  with all ten scores present in 0–3
 *     (the only non-entry `###` heading allowed is the Headline Key that defines the axes)
 *   - no duplicate entry names
 *   - the A–J Headline Key is present, and the A–J axes are defined in READ HEADINGS
 *   - the two-step reading protocol is still stated (browse headings → read only the chosen body)
 *
 * STANDING INSTRUCTION TO THE ASSISTANT — a task that names text in a preview page's note box is a
 * task against that box (`textarea.qa-note` in qa/preview-games4.html, qa/preview-blocks.html), and
 * every box mirrors its `###` section in qa/NOTES.md. There is no server: the page writes the file
 * itself through the browser's file-system access. So the request is in qa/NOTES.md — read it there.
 * An empty box means the section is not in the file either, and never a reason to substitute a
 * request of your own.
 *
 * Run with: node qa/examples.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'CONTENT_EXAMPLES.md');
const text = fs.readFileSync(FILE, 'utf8');
const lines = text.split(/\r?\n/);

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('  OK   ' + name + (extra ? '  «' + extra + '»' : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  «' + extra + '»' : '')); }
};

/* an entry heading is `### `name - (A0, B0, … J0)`` — name alphanumeric, every score a digit 0–3 */
const ENTRY_RE = /^### `([A-Za-z0-9]+) - \(A([0-3]), B([0-3]), C([0-3]), D([0-3]), E([0-3]), F([0-3]), G([0-3]), H([0-3]), I([0-3]), J([0-3])\)`$/;

const heads = [];
const unparsed = [];
let keySeen = false;
lines.forEach((l, i) => {
  if (!l.startsWith('### ')) return;
  const m = l.match(ENTRY_RE);
  if (m) { heads.push({ n: i + 1, name: m[1], scores: m.slice(2) }); return; }
  if (/^### The Headline Key\b/.test(l)) { keySeen = true; return; }
  unparsed.push((i + 1) + ': ' + l.slice(0, 80));
});

console.log('\nCONTENT_EXAMPLES contract\n');

ok('the file has entries', heads.length > 50, heads.length + ' entries');
ok('every entry ### heading is machine-readable', unparsed.length === 0,
  unparsed.length ? unparsed.slice(0, 5).join(' | ') : 'all parse');
ok('the A–J Headline Key is present', keySeen);

const badScore = heads.filter(h => h.scores.some(s => !/^[0-3]$/.test(s))).map(h => h.name);
ok('every entry carries ten A–J scores in 0–3', badScore.length === 0, badScore.join(', '));

const dupes = heads.map(h => h.name).filter((n, i, a) => a.indexOf(n) !== i);
ok('no duplicate entry names', dupes.length === 0, [...new Set(dupes)].join(', '));

/* the axis meanings must stay defined, or the scores a build selects on are arbitrary numbers */
const missingAxes = ['A) Presentational Utility', 'E) Multi-Axis Comparative Utility', 'J) Socio-Cultural']
  .filter(s => text.indexOf(s) === -1);
ok('the A–J axes are defined in READ HEADINGS', missingAxes.length === 0, missingAxes.join(', '));

/* the selection protocol must stay stated, or a build will read ~106 KB to pick one shape */
ok('the two-step reading protocol is stated',
  /Step 1 — browse the headings/.test(text) &&
  /Select-String -Path CONTENT_EXAMPLES\.md -Pattern '\^### '/.test(text) &&
  /Step 2 — read only the entry you chose/.test(text));

console.log('\n' + (fail ? 'FAILED: ' : 'OK: ') + pass + ' passed, ' + fail + ' failed\n');
process.exitCode = fail ? 1 : 0;
