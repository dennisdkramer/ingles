/**
 * qa/examples.mjs — the CONTENT_EXAMPLES.md contract.
 *
 * The file is a menu a build selects from by reading ONLY its `###` headings. That only works if every
 * heading is machine-readable and complete, so this asserts exactly that:
 *   - every `###` heading parses into name · size · cost · evidence · fits · tests · fun · reuse · status
 *   - `fits` uses only the published vocabulary (so selection-by-tag cannot silently rot)
 *   - `size`, `cost`, `evidence` use their published values
 *   - no duplicate entry names, and no name repeated as a heading
 *   - the vocabulary table in the prose lists every tag the headings use (and nothing else)
 *   - the two-step reading protocol is still stated, and the `fits` field is in the key
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

const SIZES = ['beat', 'section', 'page'];
const COSTS = ['A', 'B', 'C'];
const EVIDENCE = ['radio', 'gap', 'textarea', 'audio', 'none'];
const VOCAB = ['form', 'lexis', 'sound', 'meaning', 'register', 'text', 'interaction',
  'listening', 'culture', 'music', 'error', 'model', 'reference', 'review', 'order', 'recognition'];

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('  OK   ' + name + (extra ? '  «' + extra + '»' : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  «' + extra + '»' : '')); }
};

const RE = /^### `([A-Za-z0-9]+)` — ([a-z]+) · cost ([A-C]) · evidence ([a-z/ ]+(?:\+ [a-z]+)?) · fits ([a-z+]+) — tests ([0-3]) · fun ([0-3]) · reuse ([0-3])(?: · (.+))?$/;

const heads = [];
const unparsed = [];
lines.forEach((l, i) => {
  if (!l.startsWith('### ')) return;
  const m = l.match(RE);
  if (!m) { unparsed.push((i + 1) + ': ' + l.slice(0, 80)); return; }
  heads.push({
    n: i + 1, name: m[1], size: m[2], cost: m[3], evidence: m[4].trim(),
    fits: m[5], tests: m[6], fun: m[7], reuse: m[8], status: m[9]
  });
});

console.log('\nCONTENT_EXAMPLES contract\n');

ok('the file has entries', heads.length > 50, heads.length + ' entries');
ok('every ### heading is machine-readable', unparsed.length === 0,
  unparsed.length ? unparsed.slice(0, 5).join(' | ') : 'all parse');

const badSize = heads.filter(h => !SIZES.includes(h.size)).map(h => h.name + ':' + h.size);
ok('every size is published', badSize.length === 0, badSize.join(', '));

const badCost = heads.filter(h => !COSTS.includes(h.cost)).map(h => h.name + ':' + h.cost);
ok('every cost is published', badCost.length === 0, badCost.join(', '));

/* a block may end in either of two controls (`radio/gap`, `radio + textarea`) — each part must be published */
const evidenceParts = h => h.evidence.split(/[/+]/).map(s => s.trim()).filter(Boolean);
const badEv = heads.filter(h => evidenceParts(h).some(p => !EVIDENCE.includes(p)))
  .map(h => h.name + ':' + h.evidence);
ok('every evidence value is published', badEv.length === 0, badEv.join(', '));

const badTag = heads.filter(h => h.fits.split('+').some(t => !VOCAB.includes(t)))
  .map(h => h.name + ':' + h.fits);
ok('every fits tag is in the vocabulary', badTag.length === 0, badTag.join(', '));

const noFits = heads.filter(h => !h.fits || !h.fits.trim()).map(h => h.name);
ok('no entry lacks a fits tag', noFits.length === 0, noFits.join(', '));

const dupes = heads.map(h => h.name).filter((n, i, a) => a.indexOf(n) !== i);
ok('no duplicate entry names', dupes.length === 0, [...new Set(dupes)].join(', '));

/* the prose vocabulary table must match reality: a tag nobody uses is a tag a build may reach for in
   vain, and a used tag missing from the table is a tag a build cannot look up */
const tableTags = [...text.matchAll(/^\| `([a-z]+)` \|/gm)].map(m => m[1]);
const usedTags = [...new Set(heads.flatMap(h => h.fits.split('+')))];
const missingFromTable = usedTags.filter(t => !tableTags.includes(t));
const unusedInTable = VOCAB.filter(t => !usedTags.includes(t));
ok('the vocabulary table lists every tag the headings use', missingFromTable.length === 0,
  missingFromTable.join(', '));
ok('no tag in the vocabulary goes unused', unusedInTable.length === 0, unusedInTable.join(', '));

/* the selection protocol must stay stated, or a build will read 106 KB to pick one shape */
ok('the two-step reading protocol is stated',
  /reads it in two cheap moves/.test(text) &&
  /Select-String -Path CONTENT_EXAMPLES\.md -Pattern '\^### '/.test(text) &&
  /read only the entry you chose/i.test(text));
ok('fits is documented in the key', /^\| `fits` \|/m.test(text));

/* a cut entry must say so unprompted, so no build authors against a game that does not exist */
const cut = heads.filter(h => /cut/i.test(h.status));
ok('cut entries still declare fits and status', cut.every(h => h.fits && h.status), cut.length + ' cut');

console.log('\n' + (fail ? 'FAILED: ' : 'OK: ') + pass + ' passed, ' + fail + ' failed\n');
process.exitCode = fail ? 1 : 0;
