/**
 * qa/width.mjs — static width/division audit for the business lessons.
 * Run with: node qa/width.mjs [lessonNumber ...]   (no numbers = every business/lesson*.html that exists)
 *           node qa/width.mjs --selftest           (qa/fixtures/width-ok.html must pass, width-bad.html must fail)
 *
 * Markup-only audit (no browser, no layout). The model is CONTENT & LAYOUT AWARE (owner instruction
 * 2026-11-03, FORMAT.md): a row divides into as many columns as its content needs — any N — and the CSS
 * derives the number from the row alone, so the markup can be checked for everything except the pixels.
 *   1. a `.itemrow` holds at least 2 members (a row of one is just a full block), and when it declares
 *      `data-cols` that number equals its column total (members + their extra `data-span` shares);
 *   2. no member declares its own width — `.itemsize-half` / `.itemsize-third` are RETIRED and an inline
 *      width/​min-width/​max-width on a row member is a hard-coded dial (the row decides the share);
 *   3. no retired class remains (.grid3, .panels, .dialog.half, .qgrid-4);
 *   4. `.chart` never prescribes its own columns (the table's content decides them);
 *   5. `data-span` is an integer 2..4 (what the CSS implements) and never exceeds the row's columns.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RETIRED = ['.grid3', '.panels', '.dialog.half', '.qgrid-4', '.itemsize-half', '.itemsize-third'];
const CHART_COLS = '.chart colgroup, .chart col, .chart[data-cols], .chart [data-cols],'
  + ' .chart[style*="column"], .chart [style*="column"],'
  + ' .chart[style*="grid-template-columns"], .chart [style*="grid-template-columns"]';
const WIDTH_STYLE = /(^|;)\s*(width|min-width|max-width)\s*:/i;

const clip = el => {
  const s = el.outerHTML.replace(/\s+/g, ' ').trim();
  return s.length > 96 ? s.slice(0, 96) + '…' : s;
};

function audit(html) {
  const findings = [];
  const doc = new JSDOM(html).window.document;
  const add = (rule, msg, el) => findings.push({ rule, msg, el: el ? clip(el) : '' });
  const spanOf = el => Number(el.getAttribute('data-span') || 1);

  // 1 + 5 — a row's division: at least 2 members, a truthful data-cols, a supported span
  for (const row of doc.querySelectorAll('.itemrow')) {
    const kids = Array.from(row.children);
    const cols = kids.reduce((n, k) => n + (spanOf(k) || 1), 0);
    if (kids.length < 2) add(1, '.itemrow with ' + kids.length + ' member(s) — a row divides content, use a full block instead', row);
    const declared = row.getAttribute('data-cols');
    if (declared != null && Number(declared) !== cols)
      add(1, '.itemrow declares data-cols="' + declared + '" but divides into ' + cols + ' column(s)', row);
    for (const k of kids) {
      const sp = spanOf(k);
      if (k.hasAttribute('data-span') && (sp < 2 || sp > 4 || !Number.isInteger(sp)))
        add(5, 'data-span="' + k.getAttribute('data-span') + '" is not 2..4', k);
      else if (sp > cols)
        add(5, 'data-span="' + sp + '" exceeds the row\'s ' + cols + ' column(s)', k);
    }
  }

  // 2 — nobody sets a member's width by hand: the row decides the share
  for (const el of doc.querySelectorAll('.itemsize-half, .itemsize-third'))
    add(2, 'retired width class — a row divides its content; drop the size class', el);
  for (const row of doc.querySelectorAll('.itemrow'))
    for (const k of row.children)
      if (WIDTH_STYLE.test(k.getAttribute('style') || ''))
        add(2, 'row member carries an inline width — the row decides the share, not the member', k);

  // 3 — nothing retired survives in the markup (the two width classes are reported by rule 2)
  for (const sel of RETIRED.filter(s => s !== '.itemsize-half' && s !== '.itemsize-third'))
    for (const el of doc.querySelectorAll(sel)) add(3, 'retired class still generated: ' + sel, el);

  // 4 — a chart never prescribes its own columns
  for (const el of doc.querySelectorAll(CHART_COLS)) add(4, '.chart declares a column count', el);

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
