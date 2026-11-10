/**
 * qa/examples.mjs — the CONTENT_EXAMPLES.md structure contract.
 *
 * The A–J scoring block was removed from the file, so this no longer asserts it: a harness that
 * keeps checking a deleted rule fails forever and trains everyone to ignore it. What is checked is
 * what still breaks silently:
 *   - CONTENT_EXAMPLES.md has entries (`###`) and every heading parses;
 *   - IN-BLOCK-VISUALS.md has the drafts (`####`) — the part of the menu that sits inside a block —
 *     and every heading there parses too;
 *   - no name is used twice across the two files;
 *   - every draft declares the five fields the drafts share
 *     (draws / built from / ends in / fits / the risk);
 *   - a draft that says it is built in `qa/preview-blocks.html` has a matching `id="item-NAME"`
 *     there — so "chosen, then implemented" cannot rot into a pointer at nothing. This is the
 *     check that keeps a draft reachable from a lesson build.
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
const DRAFTS = path.join(ROOT, 'IN-BLOCK-VISUALS.md');
const text = fs.readFileSync(FILE, 'utf8');
const lines = text.split(/\r?\n/);
const draftLines = fs.readFileSync(DRAFTS, 'utf8').split(/\r?\n/);

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('  OK   ' + name + (extra ? '  «' + extra + '»' : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  «' + extra + '»' : '')); }
};

/* an entry is              `### `name - (best for: …)``
   a draft is               `#### `name` — one line about it``                              */
const ENTRY_RE = /^### `([A-Za-z0-9]+) - \(/;
const DRAFT_RE = /^#### `([A-Za-z0-9]+)`/;
/* `### Build [Constraints]` is a sub-heading of [INSTRUCTIONS], not a vehicle: the one `###` in
   the file that is scaffolding rather than an entry, so it is named here and skipped. */
const SCAFFOLD = /^### Build \[Constraints\]/;
const FIELDS = ['**draws**', '**built from**', '**ends in**', '**fits**', '**the risk**'];

const entries = [], drafts = [], unparsed = [];
lines.forEach((l, i) => {
  if (!l.startsWith('### ')) return;
  if (SCAFFOLD.test(l)) return;
  const m = l.match(ENTRY_RE);
  if (m) entries.push({ n: i + 1, name: m[1] });
  else unparsed.push('CONTENT_EXAMPLES.md ' + (i + 1) + ': ' + l.slice(0, 80));
});

/* the drafts live in their own file: the figures that sit inside a block, not the blocks themselves */
draftLines.forEach((l, i) => {
  if (l.startsWith('#### ')) {
    const m = l.match(DRAFT_RE);
    if (m) drafts.push({ n: i + 1, name: m[1], body: '' });
    else unparsed.push('IN-BLOCK-VISUALS.md ' + (i + 1) + ': ' + l.slice(0, 80));
  }
});

/* a draft's body runs to the next heading of any level */
for (const d of drafts) {
  for (let i = d.n; i < draftLines.length && !/^#{1,4} /.test(draftLines[i]); i++) d.body += draftLines[i] + '\n';
}

console.log('\nCONTENT_EXAMPLES structure\n');

ok('the file has entries', entries.length > 50, entries.length + ' entries');
ok('IN-BLOCK-VISUALS.md has drafts', drafts.length > 0, drafts.length + ' drafts');
ok('every ### and #### heading parses', unparsed.length === 0,
  unparsed.length ? unparsed.slice(0, 5).join(' | ') : 'all parse');

const names = entries.concat(drafts).map(h => h.name);
const dupes = names.filter((n, i, a) => a.indexOf(n) !== i);
ok('no name is used twice', dupes.length === 0, [...new Set(dupes)].join(', '));

const thin = drafts.filter(d => FIELDS.some(f => d.body.indexOf(f) === -1)).map(d => d.name);
ok('every draft declares the five shared fields', thin.length === 0, thin.join(', '));

/* draft → built: a pointer in the markdown must land on a real item in the preview page */
const preview = fs.readFileSync(path.join(ROOT, 'qa', 'preview-blocks.html'), 'utf8');
const claimed = drafts.filter(d => d.body.indexOf('qa/preview-blocks.html') !== -1);
const orphans = claimed.filter(d => preview.indexOf('id="item-' + d.name + '"') === -1).map(d => d.name);
ok('every draft built in the preview page has an item there',
  orphans.length === 0, orphans.join(', ') || (claimed.length + ' draft(s) linked'));

/* --- the generation contract the blocks are read through ---------------------
   A built block must declare the vehicle's KIND, and a chart is inside a block rather than beside it. These
   are the facts that break silently — an untagged block, a chart that became a sibling of the panels
   again — so each is checked against the artefact, not the prose. A width invariant used to live here; it
   was withdrawn with the `**width**` field at the owner's instruction (PENDING.md [16]), because a harness
   that keeps checking a deleted rule fails forever and trains everyone to ignore it. */

/* the vehicle's category, read off the menu's own ## [SECTION] headings */
const kindOf = {};
let section = null;
for (const l of lines) {
  const h = l.match(/^## \[(TEACHING|MIXED|TRAINING|GAMES)\]/);
  if (h) { section = h[1].toLowerCase(); continue; }
  const e = l.match(ENTRY_RE);
  if (e && section) kindOf[e[1]] = section;
}
/* every block in a vehicle's section on the page, with the kind it carries */
const blocksOn = name => {
  const at = preview.indexOf('<h2>' + name + '</h2>');
  if (at === -1) return [];
  const end = preview.indexOf('</section>', at);
  const chunk = preview.slice(at, end === -1 ? preview.length : end);
  return [...chunk.matchAll(/<div class="([^"]*\b(?:panel|card|dialog|game)\b[^"]*)"([^>]*)>/g)]
    .map(m => ({ cls: m[1], kind: (/data-kind="([a-z]+)"/.exec(m[2]) || [])[1] }));
};
const wrongKind = [];
const withBlocks = entries.filter(e => blocksOn(e.name).length);
for (const e of withBlocks) {
  for (const b of blocksOn(e.name)) if (b.kind !== kindOf[e.name]) wrongKind.push(e.name + ':' + (b.kind || 'none'));
}
ok('every block carries its vehicle\'s kind', wrongKind.length === 0,
  wrongKind.join(', ') || (withBlocks.length + ' vehicles tagged'));

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
