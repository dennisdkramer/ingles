/**
 * qa/rowctx.mjs — prove the ROW and CELL rules win in every context, by cascade rather than by eye.
 *
 * Why: the two rules were once a bare `.rows` and a bare `.rows>*`, so a row inside `.cols` (whose `>*`
 * rule sets `flex:1 1 var(--cw,220px)`), inside another row (whose cells are columns), or in the page grid
 * did not resolve like a row in a `.block`. style.css now names each context on both rules. This check
 * reads the sheet, matches EVERY rule against a small DOM per context, and prints the value that actually
 * wins for flex-direction / flex-wrap / flex / min-width. It fails when a rule is reordered, a stale rule
 * comes back, or a page puts a row in a context the sheet does not name.
 *
 * Scope: the sheet as a stylesheet (selector matching + specificity + cascade layers), never pixels.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const { JSDOM } = require('jsdom');

const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const layerOrder = [];
const orderM = css.match(/@layer\s+([\w\s,.-]+);/);
if (orderM) orderM[1].split(',').forEach(n => { const s = n.trim(); if (s) layerOrder.push(s); });

/* a small CSS reader: quotes and parens are stepped over, so an @import's ";" is not a rule break */
const rules = [];
const skipParen = (t, i) => {
  let d = 0;
  for (let j = i; j < t.length; j++) {
    if (t[j] === '(') d++;
    else if (t[j] === ')') { if (!--d) return j + 1; }
  }
  return t.length;
};
function closeBrace(t, i) {
  let depth = 0;
  for (let j = i; j < t.length; j++) {
    const c = t[j];
    if (c === '"' || c === "'") { const e = t.indexOf(c, j + 1); j = e < 0 ? t.length : e; continue; }
    if (c === '{') depth++;
    else if (c === '}') { if (!--depth) return j; }
  }
  return t.length;
}
function scan(text, layer, inMedia) {
  let i = 0, start = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"' || c === "'") { const e = text.indexOf(c, i + 1); i = e < 0 ? text.length : e + 1; continue; }
    if (c === '(') { i = skipParen(text, i); continue; }
    if (c === ';' || c === '}') { i++; start = i; continue; }
    if (c !== '{') { i++; continue; }
    const prelude = text.slice(start, i).trim();
    const end = closeBrace(text, i);
    const body = text.slice(i + 1, end);
    if (/^@layer\b/.test(prelude)) scan(body, prelude.replace(/^@layer\s*/, '').trim() || layer, inMedia);
    else if (/^@(media|supports)\b/.test(prelude)) scan(body, layer, true);
    else if (!/^@/.test(prelude)) {
      const decls = {};
      body.split(';').forEach(d => {
        const k = d.indexOf(':');
        if (k < 0) return;
        const prop = d.slice(0, k).trim().toLowerCase(), val = d.slice(k + 1).trim();
        if (prop) decls[prop] = val;
      });
      prelude.split(',').forEach(sel => {
        const s = sel.trim();
        if (s) rules.push({ sel: s, decls, layer, inMedia, order: rules.length });
      });
    }
    i = end + 1; start = i;
  }
}
scan(css, null, false);
/* ---- specificity; :where counts 0, :is/:not/:has take their most specific argument ---- */
const cmp = (x, y) => (x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]);
function spec(sel) {
  let a = 0, b = 0, c = 0, work = '', i = 0;
  while (i < sel.length) {
    const m = /^:(where|is|not|has)\(/.exec(sel.slice(i));
    if (!m) { work += sel[i++]; continue; }
    let depth = 1, j = i + m[0].length;
    while (j < sel.length && depth) { if (sel[j] === '(') depth++; else if (sel[j] === ')') depth--; j++; }
    const inner = sel.slice(i + m[0].length, j - 1);
    if (m[1] !== 'where') {
      const best = inner.split(',').map(spec).sort((p, q) => cmp(q, p))[0] || [0, 0, 0];
      a += best[0]; b += best[1]; c += best[2];
    }
    work += ' ';
    i = j;
  }
  c += (work.match(/::[\w-]+/g) || []).length;
  work = work.replace(/::[\w-]+/g, ' ').replace(/\([^()]*\)/g, ' ');
  a += (work.match(/#[\w-]+/g) || []).length;
  b += (work.match(/\.[\w-]+/g) || []).length;
  b += (work.match(/\[[^\]]*\]/g) || []).length;
  b += (work.match(/:([\w-]+)/g) || []).length;
  const bare = work.replace(/\.[\w-]+|#[\w-]+|\[[^\]]*\]|:[\w-]+/g, ' ');
  c += (bare.match(/(^|[\s>+~,])([a-zA-Z][\w-]*)/g) || []).length;
  return [a, b, c];
}

/* a later cascade layer beats an earlier one; unlayered styles beat every layer */
const layerRank = l => (l == null ? 1e6 : (layerOrder.indexOf(l) < 0 ? 0 : layerOrder.indexOf(l)));

function winner(el, prop) {
  let best = null;
  for (const r of rules) {
    if (r.inMedia || !(prop in r.decls)) continue;
    let hit = false;
    try { hit = el.matches(r.sel); } catch (e) { continue; }
    if (!hit) continue;
    const now = { r, sp: spec(r.sel), lr: layerRank(r.layer) };
    if (!best) { best = now; continue; }
    if (now.lr !== best.lr) { if (now.lr > best.lr) best = now; continue; }
    if (cmp(now.sp, best.sp) > 0 || (cmp(now.sp, best.sp) === 0 && now.r.order > best.r.order)) best = now;
  }
  return best ? { val: best.r.decls[prop], sel: best.r.sel } : null;
}
/* ---- the five contexts a row is used in, and what each must resolve to ---- */
const CONTEXTS = [
  ['page grid', '<div class="content-area"><div class="rows" id="row"><div class="a"></div><div class="b"></div></div></div>'],
  ['section', '<div class="content-area"><section><div class="rows" id="row"><div class="a"></div><div class="b"></div></div></section></div>'],
  ['block', '<div class="content-area"><section><div class="block"><div class="rows" id="row"><div class="a"></div><div class="b"></div></div></div></section></div>'],
  ['cols', '<div class="content-area"><div class="cols"><div class="rows" id="row"><div class="a"></div><div class="b"></div></div></div></div>'],
  ['inside a row', '<div class="content-area"><div class="rows"><div class="rows" id="row"><div class="a"></div><div class="b"></div></div></div></div>']
];
const WANT = { 'flex-direction': 'row', 'flex-wrap': 'nowrap', flex: '1 0 auto' };
const norm = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().toLowerCase();

let bad = 0;
const SELF = process.argv.includes('--self-test');
if (SELF) rules.push({ sel: '.cols>.rows', decls: { flex: '1 1 var(--cw,220px)' }, layer: 'layout', inMedia: false, order: rules.length });
console.log('rowctx - the row and cell rules in every context' + (SELF ? '  [self-test: a stale rule is planted]' : '') + '\n');
console.log('  rules read:', rules.length, '| layers:', layerOrder.length, '\n');
for (const [name, html] of CONTEXTS) {
  const dom = new JSDOM('<div>' + html + '</div>');
  const d = dom.window.document;
  const row = d.getElementById('row'), cell = d.querySelector('#row > .a');
  const out = [];
  for (const [prop, want] of Object.entries(WANT)) {
    const got = winner(row, prop), ok = !!got && norm(got.val) === want;
    if (!ok) bad++;
    out.push(prop + (ok ? ' ok' : ' FAIL ' + (got ? got.val : '(none)') + ' want ' + want));
  }
  const cf = winner(cell, 'flex'), cfOk = !!cf && norm(cf.val) === '1 1 auto';
  if (!cfOk) bad++;
  out.push('cell flex ' + (cfOk ? 'ok' : 'FAIL ' + (cf ? cf.val : '(none)')));
  const mw = winner(cell, 'min-width');
  out.push('min-width ' + (mw ? norm(mw.val) : '(none)'));
  console.log('  ' + (name + ':').padEnd(15) + out.join(' | '));
  dom.window.close();
}

try {
  const dom = new JSDOM('<div class="content-area"><div class="block"><div class="rows"><div id="c"><figure class="chartwrap"></figure></div></div></div></div>');
  const got = winner(dom.window.document.getElementById('c'), 'flex');
  const ok = !!got && norm(got.val) === '0 0 auto';
  if (!ok) bad++;
  console.log('  ' + 'chart cell:'.padEnd(15) + 'flex ' + (ok ? 'ok 0 0 auto' : 'FAIL ' + (got ? got.val : '(none)')));
  dom.window.close();
} catch (e) {
  console.log('  chart cell:    not exercised (:has unsupported here)');
}

{
  const dom = new JSDOM(CONTEXTS[0][1]);
  const got = winner(dom.window.document.querySelector('#row > .a'), 'flex-direction');
  console.log('  ' + 'cell direction:'.padEnd(15) + (got ? got.val : '(none)') + ' (column: a cell stacks what it holds)');
  dom.window.close();
}

console.log('\n' + (bad ? 'RESULT: ' + bad + ' check(s) do not resolve to the row rules' : 'RESULT: every context resolves to the row rules'));
if (SELF) { console.log(bad ? 'self-test: the planted rule IS caught' : 'self-test: the planted rule was NOT caught'); process.exit(bad ? 0 : 1); }
process.exit(bad ? 1 : 0);
