import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'extra', 'lesson1-The Capability Map.html');
const dom = new JSDOM(fs.readFileSync(file, 'utf8'));
const doc = dom.window.document;
const out = [];
const fail = [];

const area = doc.querySelector('.content-area');
const kids = [...area.children];
let row = 0, rows = 0, bad = [];
for (const el of kids) {
  const s = Number(el.getAttribute('data-span') || 12);
  if (row + s > 12) { bad.push(el.outerHTML.slice(0, 60) + ` (${row}+${s})`); row = 0; rows++; }
  row += s;
  if (row === 12) { row = 0; rows++; }
}
if (row) bad.push(`trailing row of ${row}`);
out.push(`grid: ${rows} rows, ${kids.length} children, bad=${bad.length}`);
bad.forEach(b => fail.push('row: ' + b));

const blocks = doc.querySelectorAll('.block').length;
const bare = doc.querySelectorAll('.content-area>.chartwrap').length;
const panels = doc.querySelectorAll('.panel').length;
const steps = doc.querySelectorAll('[data-step]').length;
const reveals = doc.querySelectorAll('details.reveal').length;
out.push(`blocks=${blocks} bare-charts=${bare} panels=${panels} data-step=${steps} reveals=${reveals}`);
if (panels) fail.push('a .panel is still on the page');
if (steps) fail.push('data-step is still on the page');

/* THE TOOL'S CHROME IS NOT PAGE CONTENT. Edit mode marks what a drag could take and keeps a chip,
   a panel and a drag line on the body; a save has to write a copy with none of it (engine2.js
   fullPageHTML), so finding any of these here means a save landed the tool instead of the page. */
const chrome = [...doc.querySelectorAll('[data-layout-grain],[data-layout-pin],[data-layout-sel],.layout-chip,.layout-panel,.layout-line,.layout-grip')];
const editable = [...doc.querySelectorAll('[contenteditable]')];
out.push(`tool chrome in the page=${chrome.length} contenteditable=${editable.length}`);
if (chrome.length) fail.push(`the edit tool's chrome reached the file (${chrome.length}): ` + chrome.slice(0, 2).map(n => n.outerHTML.slice(0, 60)).join(' | '));
if (editable.length) fail.push(`contenteditable reached the file (${editable.length})`);

const h2 = [...doc.querySelectorAll('.content-area>h2')];
out.push(`h2 sections=${h2.length}: ` + h2.map(h => h.textContent.trim()).join(' | '));

const h3 = [...doc.querySelectorAll('.block>h3')];
out.push(`h3 headings=${h3.length}`);
h3.forEach(h => { if (h.textContent.trim().length > 60) fail.push('long heading: ' + h.textContent); });

for (const a of doc.querySelectorAll('a[href^="#"]')) {
  const id = a.getAttribute('href').slice(1);
  if (!doc.getElementById(id)) fail.push(`dead link #${id}`);
}
out.push(`ids: ` + [...doc.querySelectorAll('[id]')].map(e => e.id).join(', '));

for (const el of doc.querySelectorAll('img[src],audio[src]')) {
  /* resolved from the PAGE's folder, not the repo root: the map lives in extra/, so its
     `../logo.png` is the root logo and `../assets/…` is the root asset folder. */
  const p = path.join(path.dirname(file), el.getAttribute('src'));
  if (!fs.existsSync(p)) fail.push('missing file ' + el.getAttribute('src'));
}

const pre = [...doc.querySelectorAll('details.reveal pre')];
out.push(`pre specimens=${pre.length}`);
pre.forEach((p, i) => {
  if (p.children.length) fail.push(`tag parsed inside pre #${i + 1}: ` + p.firstElementChild.outerHTML.slice(0, 60));
  if (!/&lt;/.test(p.innerHTML)) fail.push(`pre #${i + 1} holds no escaped tag`);
});

const audio = doc.querySelector('#audio');
out.push(`audio: ${audio?.querySelector('audio')?.getAttribute('src')} li=${audio?.querySelectorAll('.vz-lyrics li[data-t]').length}`);
const tlw = doc.querySelectorAll('.tlw');
out.push(`tlw figures=${tlw.length} tenses=` + [...tlw].map(f => f.dataset.tense).join(',') + ` tlx=${doc.querySelectorAll('.tlx').length}`);

console.log(out.join('\n'));
console.log(fail.length ? '\nFAIL\n- ' + fail.join('\n- ') : '\nOK: no structural failures');
process.exitCode = fail.length ? 1 : 0;
