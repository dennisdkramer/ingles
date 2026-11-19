/* qa/mapcheck.mjs — the consistency gate for the two contract files.
   Run before a generation task and before any commit that touches
   capability-map.html or PEDAGOGY-MAP.md. Exits 1 on a hard failure:
   a pointer that resolves to nothing is a page a fresh task cannot build. */
import fs from 'node:fs';
import path from 'node:path';
import {JSDOM} from 'jsdom';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const fails = [], warns = [];
const fail = m => fails.push(m), warn = m => warns.push(m);

const map = read('capability-map.html');
const ped = read('PEDAGOGY-MAP.md');
const css = read('style.css');
const shell = read('_shell.html');
const dom = new JSDOM(map).window.document;

/* 1 — every #link on the map points at an id that exists */
const ids = new Set([...dom.querySelectorAll('[id]')].map(e => e.id));
for (const a of dom.querySelectorAll('a[href]')) {
  const h = a.getAttribute('href');
  if (h.startsWith('#') && !ids.has(h.slice(1))) fail(`dead anchor: ${h}`);
}

/* 2 — every #id named in a markup-stub label resolves */
const stubs = [...dom.querySelectorAll('.cols.markup-row summary')];
if (!stubs.length) fail('no markup stubs found — the row selector changed');
for (const s of stubs) {
  for (const h of (s.textContent.match(/#[a-z0-9][a-z0-9-]*/g) || [])) {
    if (!ids.has(h.slice(1))) fail(`stub points at nothing: ${h} in "${s.textContent.trim()}"`);
  }
}

/* 3 — no lettered block/section labels survive (4a, 5B …) */
for (const [f, txt] of [['capability-map.html', map], ['PEDAGOGY-MAP.md', ped]]) {
  const hits = [...txt.matchAll(/\b[45][a-e]\b/g)].map(m => m[0]).filter(v => v !== '4b' && v !== '5e');
  if (hits.length) warn(`${f}: lettered labels ${[...new Set(hits)].join(',')} — sections have names, not letters`);
}

/* 4 — the page is balanced and no block is nested in a block */
const open = (map.match(/<div\b/g) || []).length, close = (map.match(/<\/div>/g) || []).length;
if (open !== close) fail(`div tags unbalanced: ${open} open / ${close} close`);
const nested = dom.querySelectorAll('.block .block').length;
if (nested) fail(`${nested} block(s) nested inside a block — a block is never a second block`);

/* 5 — every key in the map is a key: a radio group whose value carries it, a gap with an answer */
for (const q of dom.querySelectorAll('.qitem[data-a]')) {
  const vals = [...q.querySelectorAll('input[type=radio]')].map(i => i.value);
  if (!vals.includes(q.getAttribute('data-a'))) {
    fail(`.qitem data-a="${q.getAttribute('data-a')}" matches no radio value (${vals.join(',') || 'none'})`);
  }
  if (!vals.length) fail('.qitem[data-a] holds no radio');
}
for (const el of dom.querySelectorAll('[data-answer]')) {
  if (!el.getAttribute('data-answer').trim()) fail(`${el.tagName.toLowerCase()} carries an empty data-answer`);
}

/* 6 — a markup box never leaks into a lesson, and no lesson is empty */
const tracks = fs.readdirSync(root, {withFileTypes: true})
  .filter(d => d.isDirectory() && fs.existsSync(path.join(root, d.name, 'track.json')))
  .map(d => d.name);
for (const t of tracks) {
  for (const f of fs.readdirSync(path.join(root, t)).filter(f => f.endsWith('.html'))) {
    const body = fs.readFileSync(path.join(root, t, f), 'utf8');
    if (body.includes('markup-row')) fail(`${t}/${f} carries a markup box — those are build tools, never content`);
    if (!body.includes('id="feed"')) fail(`${t}/${f} has no notebook — the shell was not the frame it was copied from`);
  }
}

/* 7 — the shell still has its placeholders and no guidance */
for (const ph of ['{{TRACK_TITLE}}', '{{TRACK_UPPER}}', '{{TRACK}}', '{{LESSON_TITLE}}', '{{L}}']) {
  if (!shell.includes(ph)) fail(`_shell.html lost its placeholder ${ph}`);
}
if (/<!--/.test(shell) && /LESSON CONTENT|opener/.test(shell)) fail('_shell.html carries a content instruction');

/* 8 — every file PEDAGOGY-MAP names exists (catches a renamed or deleted input) */
for (const tok of new Set(ped.match(/[\w./-]+\.(?:mjs|json|js|md|html|css|mp3)/g) || [])) {
  if (/[<>*]/.test(tok) || tok.startsWith('-') || tok.startsWith('/')) continue;
  if (!fs.existsSync(path.join(root, tok))) warn(`PEDAGOGY-MAP names a file that is not there: ${tok}`);
}

/* 9 — classes drawn on the map are styles the sheet knows (warn: a typo renders, it just does not look right) */
const known = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]));
const inlineOnly = new Set(['markup-row', 'chartcap', 'flip-grid', 'pt', 'dim']);
const used = new Set();
for (const el of dom.querySelectorAll('[class]')) {
  for (const c of el.getAttribute('class').split(/\s+/).filter(Boolean)) used.add(c);
}
const unknown = [...used].filter(c => !known.has(c) && !inlineOnly.has(c));
if (unknown.length) warn(`class on the map with no rule in style.css: ${unknown.join(', ')}`);

/* report */
console.log(`mapcheck — ${stubs.length} stubs, ${ids.size} ids, ${dom.querySelectorAll('.block').length} blocks, ${tracks.length} tracks`);
for (const w of warns) console.log('  warn  ' + w);
for (const f of fails) console.log('  FAIL  ' + f);
console.log(fails.length ? `\n${fails.length} hard failure(s)` : '\nclean');
process.exit(fails.length ? 1 : 0);
