#!/usr/bin/env node
// qa/span.mjs — measures each frame in a rendered page and writes its `data-span`.
// The span is measured, never chosen: node qa/span.mjs --page=preview.html [--write|--json]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import cp from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => {
  const hit = process.argv.find(a => a.startsWith('--' + k + '='));
  return hit ? hit.slice(k.length + 3) : d;
};
const flag = k => process.argv.includes('--' + k);

const page = arg('page', '');
if (!page) {
  console.error('usage: node qa/span.mjs --page=<file> [--write] [--json]');
  process.exit(1);
}
const file = path.resolve(ROOT, page);
const src = fs.readFileSync(file, 'utf8');
const ROOTF = 'file:///' + ROOT.replace(/\\/g, '/');

const PROBE = `
<pre id="span-out"></pre>
<script>
(function () {
  var out = { rows: [], rowW: 0, gap: 0 };
  var firstRow = document.querySelector('.itemrow');
  if (!firstRow) { out.error = 'no .itemrow on this page'; document.getElementById('span-out').textContent = JSON.stringify(out); return; }
  out.rowW = Math.round(firstRow.getBoundingClientRect().width);
  out.gap = Math.round(parseFloat(getComputedStyle(firstRow).columnGap) || 0);
  [].forEach.call(document.querySelectorAll('.itemrow'), function (row, ri) {
    var frames = [].filter.call(row.children, function (c) { return c.matches('.block,.panel,.card,.dialog'); });
    if (!frames.length) return;
    var items = frames.map(function (b) {
      var c = b.cloneNode(true);
      c.style.cssText += ';position:absolute;left:-99999px;top:0;width:max-content;max-width:none;min-width:0;flex:none;margin:0';
      document.body.appendChild(c);
      var w = Math.round(c.getBoundingClientRect().width);
      c.remove();
      return { want: w, span: b.getAttribute('data-span') || '' };
    });
    out.rows.push({ row: ri, items: items });
  });
  document.getElementById('span-out').textContent = JSON.stringify(out);
})();
</script>`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'span-'));
const fixture = path.join(tmp, 'page.html');
let html = src.replace('</body>', PROBE + '</body>');
html = html.split('href="style.css"').join('href="' + ROOTF + '/style.css"');
html = html.split('href="../style.css"').join('href="' + ROOTF + '/style.css"');
html = html.split('href="qa/preview.css"').join('href="' + ROOTF + '/qa/preview.css"');
html = html.split('href="../qa/preview.css"').join('href="' + ROOTF + '/qa/preview.css"');
fs.writeFileSync(fixture, html);

const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']
  .find(p => fs.existsSync(p));
if (!chrome) { console.error('no Chrome found'); process.exit(1); }

const dom = cp.execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--allow-file-access-from-files',
  '--user-data-dir=' + path.join(tmp, 'prof'),
  '--window-size=1500,3000', '--virtual-time-budget=3000', '--dump-dom',
  'file:///' + fixture.replace(/\\/g, '/')
], { maxBuffer: 1 << 26 }).toString('utf8');

const m = dom.match(/<pre id="span-out">([\s\S]*?)<\/pre>/);
if (!m) { console.error('the page produced no measurement'); process.exit(1); }
const decoded = m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const data = JSON.parse(decoded);
if (data.error) { console.error(data.error); process.exit(1); }

const ROW = data.rowW, G = data.gap;
const W = {
  quarter: (ROW - 3 * G) / 4,
  third: (ROW - 2 * G) / 3,
  half: (ROW - G) / 2,
  twothird: (2 * ROW - G) / 3,
  full: ROW
};
const ORDER = ['quarter', 'third', 'half', 'twothird', 'full'];

const nearestAtLeast = want => ORDER.find(s => W[s] >= want - 2) || 'full';

function pack(wants) {
  const n = wants.length;
  if (n === 1) return [nearestAtLeast(wants[0])];
  let best = null;
  const combos = [];
  (function walk(acc) {
    if (acc.length === n) { combos.push(acc.slice()); return; }
    for (const s of ORDER) { acc.push(s); walk(acc); acc.pop(); }
  })([]);
  for (const c of combos) {
    const total = c.reduce((a, s) => a + W[s], 0) + (n - 1) * G;
    if (Math.abs(total - ROW) > 2) continue;
    const err = c.reduce((a, s, i) => a + Math.abs(W[s] - wants[i]), 0);
    if (!best || err < best.err) best = { c, err };
  }
  return best ? best.c : wants.map(nearestAtLeast);
}

const results = [];
for (const row of data.rows) {
  const spans = pack(row.items.map(i => i.want));
  row.items.forEach((it, i) => results.push({ row: row.row, want: it.want, span: spans[i], had: it.span }));
}

if (flag('json')) {
  console.log(JSON.stringify({ rowW: ROW, gap: G, widths: W, blocks: results }, null, 1));
} else {
  console.log('row ' + ROW + 'px, gap ' + G + 'px');
  const byRow = {};
  for (const r of results) (byRow[r.row] = byRow[r.row] || []).push(r);
  for (const k of Object.keys(byRow)) {
    console.log('  row ' + k + ': ' + byRow[k].map(r => r.want + '->' + r.span + (r.had && r.had !== r.span ? ' (was ' + r.had + ')' : '')).join(', '));
  }
}

if (flag('write')) {
  const tag = /<(div|section|article)\b[^>]*\bclass="[^"]*\b(?:block|panel|card|dialog)\b[^"]*"[^>]*>/g;
  const tags = [...src.matchAll(tag)];
  if (tags.length !== results.length) {
    console.error('refusing to write: ' + tags.length + ' frame tags in the file, ' + results.length + ' measured');
    process.exit(2);
  }
  let out = '', last = 0, changed = 0;
  results.forEach((r, i) => {
    const t = tags[i];
    let open = t[0];
    if (/\bdata-span="/.test(open)) {
      const next = open.replace(/data-span="[^"]*"/, 'data-span="' + r.span + '"');
      if (next !== open) changed++;
      open = next;
    } else {
      open = open.replace(/\s*>$/, ' data-span="' + r.span + '">');
      changed++;
    }
    out += src.slice(last, t.index) + open;
    last = t.index + t[0].length;
  });
  out += src.slice(last);
  if (changed) fs.writeFileSync(file, out);
  console.log('wrote ' + changed + ' span(s) into ' + page);
}

fs.rmSync(tmp, { recursive: true, force: true });
