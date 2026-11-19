import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'capability-map.html');
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
  const p = path.join(root, el.getAttribute('src'));
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
