/**
 * qa/examples.mjs — the CONTENT_EXAMPLES.md structure contract.
 *
 * The A–J scoring block was removed from the file, so this no longer asserts it: a harness that
 * keeps checking a deleted rule fails forever and trains everyone to ignore it. What is checked is
 * what still breaks silently:
 *   - CONTENT_EXAMPLES.md has entries (`### [NN] <shape> <itemsize> …`) and every heading parses;
 *     the four `### [GAMES]`, `[BLOCKS]`, `[VISUALS]` and `[IN-BLOCK]` headings are scaffolding under
 *     `## [BUILD]` rather than vehicles, and are named in `SCAFFOLD` so they are skipped;
 *   - no name is used twice (the drafts from the retired IN-BLOCK-VISUALS.md are `[84]`–`[97]` here now,
 *     so there is one list, not two);
 *   - every block in `qa/preview-blocks.html` carries the shape atoms of the vehicle it renders. Its
 *     atoms are its own (`data-kind="teach"` / `"train"` / `"teach|train"`) and, for a numbered entry,
 *     are checked against that entry's heading: a block may carry a subset of the heading's atoms (a
 *     pure `teach` chart beside a `train` task in one vehicle), never an atom the heading lacks. A
 *     legacy word (`teaching`, `training`, `mixed`, `games`) is a failure wherever it survives.
 *
 * STANDING INSTRUCTION TO THE ASSISTANT — a task that names text in a preview page's note box is a
 * task against that box (`textarea.qa-note` in qa/preview-blocks.html), and every box mirrors its
 * `###` section in qa/NOTES.md. `node qa/serve.mjs` is the reliable way in: it serves the file, so the
 * boxes read and write it with nothing to pick. So the request is in qa/NOTES.md — read it there.
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
const preview = fs.readFileSync(path.join(ROOT, 'qa', 'preview-blocks.html'), 'utf8');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('  OK   ' + name + (extra ? '  «' + extra + '»' : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  «' + extra + '»' : '')); }
};

/* an entry is  `### `name — what shape it is (teaching|training|mixed|games)``  (the old form, still read)
   an entry is  `### [NN] <SHAPE> <ITEMSIZE> what it does <min|max> <min|max>`      (the numbered form)                 */
const ENTRY_RE = /^### `([A-Za-z0-9]+) — /;
const NUM_RE = /^### \[(\d+)\] <[^>]*>/;
/* `[BUILD]`'s sub-headings and the old `### Build [Constraints]` are scaffolding, not vehicles: they
   are the rules for authoring a block, so they are named here and skipped. */
const SCAFFOLD = /^### (Build \[Constraints\]|\[(GAMES|BLOCKS|VISUALS|IN-BLOCK)\])/;

const entries = [], unparsed = [];
lines.forEach((l, i) => {
  if (!l.startsWith('### ')) return;
  if (SCAFFOLD.test(l)) return;
  const m = l.match(ENTRY_RE);
  const q = l.match(NUM_RE);
  if (m) entries.push({ n: i + 1, name: m[1] });
  else if (q) entries.push({ n: i + 1, name: '[' + q[1] + ']', num: q[1] });
  else unparsed.push('CONTENT_EXAMPLES.md ' + (i + 1) + ': ' + l.slice(0, 80));
});

console.log('\nCONTENT_EXAMPLES structure\n');

ok('the file has entries', entries.length > 20, entries.length + ' entries');
ok('every ### heading parses', unparsed.length === 0,
  unparsed.length ? unparsed.slice(0, 5).join(' | ') : 'all parse');

/* a numbered heading carries all four fields: shape, itemsize, the phrase and the counts */
const worn = lines.map((l, i) => ({ l, i })).filter(o => /^### \[\d+\]/.test(o.l))
  .filter(o => !/^### \[\d+\] <[^>]+> <[^>]+> .+ <[^>]*> <[^>]*>$/.test(o.l))
  .map(o => (o.i + 1) + ': ' + o.l.slice(0, 60));
ok('every numbered heading has shape, size, phrase and counts', worn.length === 0,
  worn.slice(0, 4).join(' | ') || 'all complete');

/* the numbers are the index: unique, and no hole between the first and the last */
const nums = entries.filter(e => e.num).map(e => Number(e.num)).sort((a, b) => a - b);
const dupNum = nums.filter((n, i) => i && n === nums[i - 1]);
const holes = [];
for (let n = nums[0]; n <= nums[nums.length - 1]; n++) if (nums.indexOf(n) === -1) holes.push(n);
ok('numbers are unique and contiguous', dupNum.length === 0 && holes.length === 0,
  (dupNum.length ? 'twice: ' + dupNum.join(',') : '') + (holes.length ? ' missing: ' + holes.join(',') : '') ||
  (nums[0] + '–' + nums[nums.length - 1]));

const names = entries.map(h => h.name);
const dupes = names.filter((n, i, a) => a.indexOf(n) !== i);
ok('no name is used twice', dupes.length === 0, [...new Set(dupes)].join(', '));

/* --- the generation contract the blocks are read through ---------------------
   A built block must declare the vehicle's KIND, and a chart is inside a block rather than beside it. These
   are the facts that break silently — an untagged block, a chart that became a sibling of the panels
   again — so each is checked against the artefact, not the prose. A width invariant used to live here; it
   was withdrawn with the `**width**` field at the owner's instruction (PENDING.md [16]), because a harness
   that keeps checking a deleted rule fails forever and trains everyone to ignore it. */

/* the page's shape label is written in the same atoms as the heading, lowercase: `teach`, `train`, or
   `teach|train` where one block both explains and asks. The heading is the authority — a numbered entry
   must carry exactly its heading's TEACH/TRAIN atoms — and a legacy word is a failure wherever it
   survives, because two vocabularies cannot both be true. */
const LEGACY = { teaching: 'teach', training: 'train', mixed: 'teach|train', games: 'train' };
const atomsOf = v => [...new Set(String(v || '').toLowerCase().split('|')
  .flatMap(a => (LEGACY[a] || a).trim().split('|')))]
  .filter(a => a === 'teach' || a === 'train').sort().join('|');
const expectAtoms = {};
for (const l of lines) {
  const q = l.match(NUM_RE);
  if (q) expectAtoms['[' + q[1] + ']'] = atomsOf((l.match(/^### \[\d+\] <([^>]*)>/) || [, ''])[1]);
}
/* every block in a vehicle's section on the page, with the label it carries */
const blocksOn = name => {
  const at = preview.indexOf('<h2>' + name + '</h2>');
  if (at === -1) return [];
  const end = preview.indexOf('</section>', at);
  const chunk = preview.slice(at, end === -1 ? preview.length : end);
  return [...chunk.matchAll(/<div class="([^"]*\b(?:panel|card|dialog|game)\b[^"]*)"([^>]*)>/g)]
    .map(m => ({ cls: m[1], kind: (/data-kind="([^"]*)"/.exec(m[2]) || [])[1] }));
};
const wrongKind = [], legacyKind = [];
const withBlocks = entries.filter(e => blocksOn(e.name).length);
for (const e of withBlocks) {
  for (const b of blocksOn(e.name)) {
    if (!b.kind) continue;
    for (const a of b.kind.split('|')) if (LEGACY[a]) legacyKind.push(e.name + ':' + b.kind);
    const want = expectAtoms[e.name];
    /* a vehicle may hold a pure `teach` block beside a `train` one, so a block's atoms must be a
       subset of its heading's — never an atom the heading does not carry */
    if (want && atomsOf(b.kind).split('|').some(a => a && !want.includes(a))) {
      wrongKind.push(e.name + ':' + b.kind + ' (heading says ' + (want || 'nothing') + ')');
    }
  }
}
ok('every block carries its vehicle\'s shape atoms', wrongKind.length === 0,
  wrongKind.join(', ') || (withBlocks.length + ' sections read'));
ok('no block carries a legacy shape word', legacyKind.length === 0,
  legacyKind.join(', ') || 'atoms only');

/* a chart is an in-block class: it is never the thing that a `###` section opens with */
const bareCharts = withBlocks.filter(e => {
  const at = preview.indexOf('<h2>' + e.name + '</h2>');
  const firstBlock = preview.slice(at).indexOf('<div class="');
  const firstChart = preview.slice(at).indexOf('<table class="chart"');
  return firstChart !== -1 && firstChart < firstBlock;
}).map(e => e.name);
ok('no chart stands where a block belongs', bareCharts.length === 0, bareCharts.join(', ') || 'all charts are inside a block');

console.log('\n' + (fail ? 'FAILED: ' : 'OK: ') + pass + ' passed, ' + fail + ' failed\n');
process.exitCode = fail ? 1 : 0;
