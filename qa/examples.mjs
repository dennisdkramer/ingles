/**
 * qa/examples.mjs — the CONTENT_EXAMPLES.md structure contract.
 *
 * The A–J scoring block was removed from the file, so this no longer asserts it: a harness that
 * keeps checking a deleted rule fails forever and trains everyone to ignore it. What is checked is
 * what still breaks silently:
 *   - the file has entries (`###`) and drafts (`####`), and every heading parses;
 *   - no name is used twice across entries and drafts;
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
const text = fs.readFileSync(FILE, 'utf8');
const lines = text.split(/\r?\n/);

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('  OK   ' + name + (extra ? '  «' + extra + '»' : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  «' + extra + '»' : '')); }
};

/* an entry is              `### `name - (best for: …)``
   a draft is               `#### `name` — one line about it``                              */
const ENTRY_RE = /^### `([A-Za-z0-9]+) - \(/;
const DRAFT_RE = /^#### `([A-Za-z0-9]+)`/;
const FIELDS = ['**draws**', '**built from**', '**ends in**', '**fits**', '**the risk**'];

const entries = [], drafts = [], unparsed = [];
lines.forEach((l, i) => {
  if (l.startsWith('### ')) {
    const m = l.match(ENTRY_RE);
    if (m) entries.push({ n: i + 1, name: m[1] });
    else unparsed.push((i + 1) + ': ' + l.slice(0, 80));
    return;
  }
  if (l.startsWith('#### ')) {
    const m = l.match(DRAFT_RE);
    if (m) drafts.push({ n: i + 1, name: m[1], body: '' });
    else unparsed.push((i + 1) + ': ' + l.slice(0, 80));
  }
});

/* a draft's body runs to the next heading of any level */
for (const d of drafts) {
  for (let i = d.n; i < lines.length && !/^#{1,4} /.test(lines[i]); i++) d.body += lines[i] + '\n';
}

console.log('\nCONTENT_EXAMPLES structure\n');

ok('the file has entries', entries.length > 50, entries.length + ' entries');
ok('the file has drafts', drafts.length > 0, drafts.length + ' drafts');
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

console.log('\n' + (fail ? 'FAILED: ' : 'OK: ') + pass + ' passed, ' + fail + ' failed\n');
process.exitCode = fail ? 1 : 0;
