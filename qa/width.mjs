/**
 * qa/width.mjs — static width-slot audit for the business lessons.
 * Run with: node qa/width.mjs [lessonNumber ...]   (no numbers = every business/lesson*.html that exists)
 *           node qa/width.mjs --selftest           (qa/fixtures/width-ok.html must pass, width-bad.html must fail)
 *
 * Markup-only audit (no browser, no layout): width is decided at generation and tagged onto the
 * block, so the markup alone can be checked. FORMAT.md is the model. Checks:
 *   1. every .itemsize-half / .itemsize-third sits inside an .itemrow;
 *   2. every .itemrow is complete (2 children for data-cols="2", 3 for data-cols="3") and holds no mixed sizes;
 *   3. no retired class remains (.grid3, .panels, .dialog.half, .qgrid-4);
 *   4. no element carries both itemsize-half and itemsize-third;
 *   5. no .chart declares a column count.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RETIRED = ['.grid3', '.panels', '.dialog.half', '.qgrid-4'];
const CHART_COLS = '.chart colgroup, .chart col, .chart[data-cols], .chart [data-cols],'
  + ' .chart[style*="column"], .chart [style*="column"],'
  + ' .chart[style*="grid-template-columns"], .chart [style*="grid-template-columns"]';

const clip = el => {
  const s = el.outerHTML.replace(/\s+/g, ' ').trim();
  return s.length > 96 ? s.slice(0, 96) + '…' : s;
};

function audit(html) {
  const findings = [];
  const doc = new JSDOM(html).window.document;
  const add = (rule, msg, el) => findings.push({ rule, msg, el: el ? clip(el) : '' });

  // 1 + 4 — a half/third appears only inside a row, and only ever with one size
  for (const el of doc.querySelectorAll('.itemsize-half, .itemsize-third')) {
    const c = el.classList;
    if (c.contains('itemsize-half') && c.contains('itemsize-third')) add(4, 'element carries both itemsize-half and itemsize-third', el);
    if (!el.closest('.itemrow')) add(1, 'half/third block generated outside .itemrow', el);
  }

  // 2 — every row is complete and size-consistent
  for (const row of doc.querySelectorAll('.itemrow')) {
    const cols = row.getAttribute('data-cols');
    const kids = Array.from(row.children);
    if (cols !== '2' && cols !== '3') { add(2, '.itemrow without data-cols="2"|"3"', row); continue; }
    const want = cols === '2' ? 2 : 3;
    const wantCls = cols === '2' ? 'itemsize-half' : 'itemsize-third';
    const otherCls = cols === '2' ? 'itemsize-third' : 'itemsize-half';
    if (kids.length !== want) add(2, '.itemrow[data-cols="' + cols + '"] holds ' + kids.length + ' child(ren), expected ' + want, row);
    for (const k of kids) {
      if (!k.classList.contains(wantCls)) add(2, '.itemrow[data-cols="' + cols + '"] child is not .' + wantCls, k);
      if (k.classList.contains(otherCls)) add(2, '.itemrow[data-cols="' + cols + '"] mixes .' + otherCls + ' into a ' + cols + '-row', k);
    }
  }

  // 3 — nothing retired survives in the markup
  for (const sel of RETIRED) for (const el of doc.querySelectorAll(sel)) add(3, 'retired class still generated: ' + sel, el);

  // 5 — a chart never prescribes its own columns
  for (const el of doc.querySelectorAll(CHART_COLS)) add(5, '.chart declares a column count', el);

  return findings;
}

function printFindings(findings) {
  for (const f of findings) console.log('    [rule ' + f.rule + '] ' + f.msg + (f.el ? '  «' + f.el + '»' : ''));
}

/* ---- selftest: the audit must pass the good fixture and fail the bad one ---- */
if (process.argv.includes('--selftest')) {
  const cases = [
    { name: 'width-ok.html', expect: 0 },
    { name: 'width-bad.html', expect: 1 }
  ];
  let broken = 0;
  for (const c of cases) {
    const file = path.join(__dirname, 'fixtures', c.name);
    if (!fs.existsSync(file)) { console.log('❌ fixture missing: qa/fixtures/' + c.name); broken++; continue; }
    const findings = audit(fs.readFileSync(file, 'utf8'));
    const got = findings.length ? 1 : 0;
    const ok = got === c.expect;
    if (!ok) broken++;
    console.log((ok ? '✅ ' : '❌ ') + 'qa/fixtures/' + c.name + ' → '
      + (findings.length ? findings.length + ' finding(s)' : 'clean')
      + ' (expected ' + (c.expect ? 'findings' : 'clean') + ')');
    printFindings(findings);
  }
  console.log(broken === 0 ? '✅ width audit selftest green' : '❌ width audit selftest FAILED');
  process.exit(broken ? 1 : 0);
}

/* ---- audit the real pages ---- */
const targets = process.argv.slice(2).filter(a => /^\d+$/.test(a)).map(Number);
let lessons = targets;
if (!lessons.length) {
  const dir = path.join(ROOT, 'business');
  lessons = fs.existsSync(dir)
    ? fs.readdirSync(dir).map(f => (f.match(/^lesson(\d+)\.html$/) || [])[1]).filter(Boolean).map(Number).sort((a, b) => a - b)
    : [];
}
if (!lessons.length) { console.log('✅ width audit: no business lesson pages to check'); process.exit(0); }

let fails = 0;
for (const n of lessons) {
  const file = path.join(ROOT, 'business', 'lesson' + n + '.html');
  if (!fs.existsSync(file)) {
    if (targets.length) { console.log('lesson ' + n + ': ❌ page not found'); fails++; }
    else console.log('lesson ' + n + ': (page missing, skipped)');
    continue;
  }
  const findings = audit(fs.readFileSync(file, 'utf8'));
  if (findings.length) { console.log('lesson ' + n + ':'); printFindings(findings); fails += findings.length; }
}
console.log(fails === 0 ? '✅ widths OK (' + lessons.length + ' page' + (lessons.length === 1 ? '' : 's') + ')' : '❌ ' + fails + ' width finding(s)');
process.exit(fails ? 1 : 0);
