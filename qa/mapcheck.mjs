/* qa/mapcheck.mjs — the consistency gate for the two contract files.
   Run before a generation task and before any commit that touches
   the map page or PEDAGOGY-MAP.md. Exits 1 on a hard failure:
   a pointer that resolves to nothing is a page a fresh task cannot build.

   THE MAP IS A PAGE, NOT A ROOT FILE. It lives in the demo folder
   (`extra/lesson1-The Capability Map.html`) with every other page, so one
   path here is the whole contract: the page the checks read is the page an
   author opens. */
import fs from 'node:fs';
import path from 'node:path';
import {JSDOM} from 'jsdom';
import { isDemo } from './demo.mjs';

const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const fails = [], warns = [];
const fail = m => fails.push(m), warn = m => warns.push(m);

const MAP = 'extra/lesson1-The Capability Map.html';
const map = read(MAP);
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
const stubs = [...dom.querySelectorAll('.rows.markup-row summary')];
if (!stubs.length) fail('no markup stubs found — the row selector changed');
for (const s of stubs) {
  for (const h of (s.textContent.match(/#[a-z0-9][a-z0-9-]*/g) || [])) {
    if (!ids.has(h.slice(1))) fail(`stub points at nothing: ${h} in "${s.textContent.trim()}"`);
  }
}

/* 3 — no lettered block/section labels survive (4a, 5B …) */
for (const [f, txt] of [[MAP, map], ['PEDAGOGY-MAP.md', ped]]) {
  const hits = [...txt.matchAll(/\b[45][a-e]\b/g)].map(m => m[0]).filter(v => v !== '4b' && v !== '5e');
  if (hits.length) warn(`${f}: lettered labels ${[...new Set(hits)].join(',')} — sections have names, not letters`);
}

/* 4 — the page is balanced and no block is nested in a block */
const open = (map.match(/<div\b/g) || []).length, close = (map.match(/<\/div>/g) || []).length;
if (open !== close) fail(`div tags unbalanced: ${open} open / ${close} close`);
const nested = dom.querySelectorAll('.block .block').length;
if (nested) fail(`${nested} block(s) nested inside a block — a block is never a second block`);

/* 5 — every key in the map is a key: a radio or checkbox group whose value carries it, a gap with an answer */
for (const q of dom.querySelectorAll('.qitem[data-a]')) {
  const vals = [...q.querySelectorAll('input[type=radio], input[type=checkbox]')].map(i => i.value);
  if (!vals.includes(q.getAttribute('data-a'))) {
    fail(`.qitem data-a="${q.getAttribute('data-a')}" matches no option value (${vals.join(',') || 'none'})`);
  }
  if (!vals.length) fail('.qitem[data-a] holds no radio or checkbox');
}
for (const el of dom.querySelectorAll('[data-answer]')) {
  if (!el.getAttribute('data-answer').trim()) fail(`${el.tagName.toLowerCase()} carries an empty data-answer`);
}

/* 6 — a markup box never leaks into a lesson, and no lesson is empty. A DEMO folder (track.json says
   {"demo":true}) is not a lesson track: its pages are open, hand-organised examples, so they are not
   held to the lesson rules here. */
const tracks = fs.readdirSync(root, {withFileTypes: true})
  .filter(d => d.isDirectory() && fs.existsSync(path.join(root, d.name, 'track.json')))
  .map(d => d.name)
  .filter(d => !isDemo(root, d));
for (const t of tracks) {
  for (const f of fs.readdirSync(path.join(root, t)).filter(f => f.endsWith('.html'))) {
    const body = fs.readFileSync(path.join(root, t, f), 'utf8');
    if (body.includes('markup-row')) fail(`${t}/${f} carries a markup box — those are build tools, never content`);
    if (!body.includes('id="feed"')) fail(`${t}/${f} has no notebook — the shell was not the frame it was copied from`);
    /* 6a — a block's letter is drawn from its <h3>: no headline, no letter */
    const doc = new JSDOM(body).window.document;
    const num = (f.match(/^lesson(\d+)/i) || [])[1];
    const ledgerFile = path.join(root, t, 'BATCH-RECORD.md');
    const ledger = fs.existsSync(ledgerFile) ? fs.readFileSync(ledgerFile, 'utf8') : '';
    const ledgered = !!num && new RegExp(`^L0*${num}\\s*\\|`, 'm').test(ledger);
    const noH = [...doc.querySelectorAll('.block')].filter(b => b.firstElementChild && b.firstElementChild.tagName !== 'H3');
    if (noH.length) {
      (ledgered ? fail : warn)(`${t}/${f}: ${noH.length} of ${doc.querySelectorAll('.block').length} block(s) open with no <h3> — the block letter is drawn from the headline`);
    }
    /* 6b — items are numbered */
    const unnum = [...doc.querySelectorAll('.block')]
      .filter(b => b.querySelector('input.gap,textarea.write,input[type=radio]') && !b.querySelector('.qnum'));
    if (unnum.length) warn(`${t}/${f}: ${unnum.length} block(s) hold answers but carry no .qnum — items are numbered 1., 2. …`);
  }
}

/* 7 — the shell still has its placeholders and no guidance */
for (const ph of ['{{TRACK_TITLE}}', '{{TRACK_UPPER}}', '{{TRACK}}', '{{LESSON_TITLE}}', '{{L}}']) {
  if (!shell.includes(ph)) fail(`_shell.html lost its placeholder ${ph}`);
}
if (/<!--/.test(shell) && /LESSON CONTENT|opener/.test(shell)) fail('_shell.html carries a content instruction');

/* 8 — every file PEDAGOGY-MAP names exists (catches a renamed or deleted input). A path is taken as
   whole when it sits inside backticks: a page name with spaces in it (`extra/lesson1-The Capability
   Map.html`) is one file, and reading the last word of it as a path reports a file nobody wrote. */
const named = new Set();
for (const m of ped.matchAll(/`([^`]+)`/g)) {
  const s = m[1].trim();
  if (/^[\w./ -]+\.(?:mjs|json|js|md|html|css|mp3)$/.test(s)) named.add(s);
}
for (const tok of new Set(ped.match(/[\w./-]+\.(?:mjs|json|js|md|html|css|mp3)/g) || [])) {
  if ([...named].some(p => p.endsWith(tok))) continue;
  named.add(tok);
}
for (const tok of named) {
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
