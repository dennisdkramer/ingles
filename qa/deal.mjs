/**
 * qa/deal.mjs — deal every matching's pairs and every chunks' chips into a full shuffle, by hand and on demand.
 *
 * Why: a matching whose rows sit in the pool's order, or an unscramble whose chips sit in the sentence's,
 * teaches nothing. The authoring rule (PEDAGOGY-MAP, "a full shuffle") is that no item keeps its answer
 * position, and one moved item is not a shuffle — so this tool re-deals the whole order. It is NOT wired:
 * no npm script, no member in qa/run.mjs, no build hook, and the build never runs it.
 *
 *   node qa/deal.mjs            → a dry run: the proposed order for every matching and every .chips set
 *   node qa/deal.mjs --apply    → write the dealt order into the lesson pages
 *   node qa/deal.mjs --verify   → re-read the pages: no item at its answer position, every set segmented
 *
 * A matching keeps its numbers: the phrase and its letter move across the numbered rows, so the page's
 * numbering is untouched. A chip set is re-dealt and renumbered in display order — the number is the
 * display order, never the answer. Every deal is a derangement, never the order it found, and never a
 * cyclic shift of the sorted answer order; a three-item set has only two derangements and may take one.
 * The capability map's own examples are hand-kept, not in this tool's scope.
 *
 * Scope: business/, kids/ and adult/ .html only. The map, the shells and the root pages are not touched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['business', 'kids', 'adult'];
const APPLY = process.argv.includes('--apply');
const VERIFY = process.argv.includes('--verify');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.html$/i.test(e.name)) out.push(p);
  }
  return out;
}
function seedOf(s) {
  let h = 2166136261 >>> 0;
  for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
function shuffle(a, rand) {
  const o = a.slice();
  for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
  return o;
}
/* a random order in which ok(item, position1) holds for every item, and check(order) passes */
function deal(items, ok, rand, check) {
  for (let t = 0; t < 8000; t++) {
    const o = shuffle(items, rand);
    if (o.every((it, i) => ok(it, i + 1)) && (!check || check(o))) return o;
  }
  return null;
}
/* an ascending run in disguise: the sequence is a cyclic shift of its own sorted order */
function cyclic(seq) {
  const sorted = seq.slice().sort((a, b) => a - b);
  const n = sorted.length;
  if (n < 4) return false;
  for (let k = 0; k < n; k++) {
    let ok = true;
    for (let i = 0; i < n; i++) if (seq[i] !== sorted[(k + i) % n]) { ok = false; break; }
    if (ok) return true;
  }
  return false;
}
/* balanced spans of one tag, in document order */
function spans(html, tag) {
  const out = [];
  const re = new RegExp('<' + tag + '\\b|</' + tag + '>', 'gi');
  let m, start = -1, depth = 0;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') {
      if (start >= 0) { depth--; if (!depth) { out.push({ start, end: re.lastIndex }); start = -1; } }
    } else { if (start < 0) { start = m.index; depth = 1; } else depth++; }
  }
  return out;
}
/* the element that opens at the attr's own tag: scan locally, so an earlier unbalanced tag on
   the page (an onerror string, a script) cannot move the block's edges */
function blockAt(html, at) {
  const start = html.lastIndexOf('<', at);
  const m = /^<([a-z0-9]+)/i.exec(html.slice(start));
  if (!m) return null;
  const s = spans(html.slice(start), m[1].toLowerCase())[0];
  return s ? { start: start + s.start, end: start + s.end } : null;
}
function textOf(h) {
  return h.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}
function norm(w) {
  return String(w).replace(/^[^0-9A-Za-z\u00c0-\u024f']+|[^0-9A-Za-z\u00c0-\u024f']+$/g, '');
}


/* ---- matching: re-deal the phrase/answer pairs across the rows, whose numbers stay put ---- */
function matchingState(block) {
  const tables = spans(block, 'table');
  if (!tables.length) return { err: 'no table' };
  const t = tables[0];
  const table = block.slice(t.start, t.end);
  const rows = [];
  for (const r of spans(table, 'tr')) {
    const rowHTML = table.slice(r.start, r.end);
    if (/<th\b/i.test(rowHTML)) continue;
    const am = /data-answer="([^"]*)"/i.exec(rowHTML);
    if (!am) continue;
    const tds = spans(rowHTML, 'td');
    if (tds.length < 2) { rows.push({ err: 'tds' }); continue; }
    const first = rowHTML.slice(tds[0].start, tds[0].end);
    const open = /^<td\b[^>]*>/i.exec(first);
    if (!open) { rows.push({ err: 'td' }); continue; }
    rows.push({
      absStart: t.start + r.start, absEnd: t.start + r.end,
      phrase: first.slice(open[0].length, first.length - '</td>'.length),
      input: /<input\b[^>]*>/i.exec(rowHTML),
      answer: am[1].trim()
    });
  }
  const after = block.slice(t.end);
  const uls = spans(after, 'ul');
  let pool = null;
  if (uls.length) {
    const ul = after.slice(uls[0].start, uls[0].end);
    pool = [...ul.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(m => {
      const b = /<b[^>]*>\s*([A-Za-z])\s*<\/b>/.exec(m[1]);
      return b ? b[1].toLowerCase() : null;
    });
  }
  return { t, rows, pool };
}
function rowsOk(st) {
  return st.rows.length >= 2 && st.rows.every(r => !r.err && r.input && r.phrase.trim());
}
function planMatching(block, seed) {
  const st = matchingState(block);
  if (st.err) return { err: st.err };
  if (!rowsOk(st)) return { err: 'row shape' };
  if (!st.pool || st.pool.some(x => !x)) return { err: 'pool' };
  const pairs = st.rows.map(r => ({ phrase: r.phrase, answer: r.answer, pool: st.pool.indexOf(r.answer.toLowerCase()) + 1 }));
  if (pairs.some(p => !p.pool)) return { err: 'letter not in pool' };
  const order = deal(pairs.map((_, i) => i), (i, pos) => pairs[i].pool !== pos, rng(seed),
    o => !cyclic(o.map(i => pairs[i].pool)) && o.some((v, i) => v !== i));
  if (!order) return { err: 'no derangement' };
  return { st, pairs, order, old: pairs.map(p => p.answer).join(','), next: order.map(i => pairs[i].answer).join(',') };
}
function applyMatching(block, plan) {
  const parts = plan.st.rows.map((row, i) => {
    const p = plan.pairs[plan.order[i]];
    let html = block.slice(row.absStart, row.absEnd);
    html = html.replace(/(<td\b[^>]*>)[\s\S]*?(<\/td>)/i, (m, a, b) => a + p.phrase + b);
    html = html.replace(/data-answer="[^"]*"/i, 'data-answer="' + p.answer + '"');
    return { start: row.absStart, end: row.absEnd, html };
  });
  for (const part of parts.reverse()) block = block.slice(0, part.start) + part.html + block.slice(part.end);
  return block;
}
function verifyMatching(block) {
  const st = matchingState(block);
  if (st.err) return st.err;
  if (!rowsOk(st) || !st.pool) return 'unparsed';
  const bad = [];
  st.rows.forEach((r, i) => {
    const p = st.pool.indexOf(r.answer.toLowerCase()) + 1;
    if (p === i + 1) bad.push((i + 1) + ':' + r.answer);
  });
  return bad.length ? 'IN PLACE ' + bad.join(' ') : 'ok';
}

/* ---- chunks: re-deal the chips, whose number is only the display order ---- */
function chunksState(block) {
  const out = [];
  const re = /<p\b([^>]*\bclass="chips"[^>]*)>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(block))) {
    const inner = m[2];
    const chips = [];
    const cre = /<span><b style="font-size:\.8em">(\d+)<\/b>([\s\S]*?)<\/span>/gi;
    let c;
    while ((c = cre.exec(inner))) {
      chips.push({ label: +c[1], word: c[2], start: c.index, end: c.index + c[0].length });
    }
    const after = block.slice(m.index + m[0].length);
    const im = /<input\b[^>]*data-answer="([^"]*)"/i.exec(after);
    out.push({ start: m.index, end: m.index + m[0].length, attrs: m[1], inner, chips, answer: im ? im[1] : null });
  }
  return out;
}
function solveChips(chips, answer) {
  const raw = textOf(answer).split('|')[0].trim();
  const toks = raw.split(/\s+/).map(norm);
  const groups = chips.map(c => textOf(c.word).split(/\s+/).map(norm));
  const lens = groups.map(g => g.length);
  if (toks.length !== lens.reduce((a, b) => a + b, 0)) return null;
  const n = chips.length, full = (1 << n) - 1;
  const lower = toks.map(t => t.toLowerCase());
  const memo = new Map();
  function rec(used) {
    if (used === full) return { score: 0, path: [] };
    if (memo.has(used)) return memo.get(used);
    let ai = 0;
    for (let c = 0; c < n; c++) if (used & (1 << c)) ai += lens[c];
    let best = null;
    for (let c = 0; c < n; c++) {
      if (used & (1 << c)) continue;
      const g = groups[c];
      if (ai + g.length > toks.length) continue;
      let ok = true, exact = true;
      for (let k = 0; k < g.length; k++) {
        if (g[k].toLowerCase() !== lower[ai + k]) { ok = false; break; }
        if (g[k] !== toks[ai + k]) exact = false;
      }
      if (!ok) continue;
      const r = rec(used | (1 << c));
      if (!r) continue;
      const sc = r.score + (exact ? 1 : 0);
      if (!best || sc > best.score) best = { score: sc, path: [c, ...r.path] };
    }
    memo.set(used, best);
    return best;
  }
  const res = rec(0);
  return res ? res.path : null;
}
function planChunks(chips, answer, seed) {
  if (!answer) return { err: 'no answer' };
  const solved = solveChips(chips, answer);
  if (!solved) return { err: 'no segmentation' };
  const ordinal = new Map();
  solved.forEach((c, i) => ordinal.set(c, i + 1));
  const order = deal(chips.map((_, i) => i), (i, pos) => ordinal.get(i) !== pos, rng(seed),
    o => !cyclic(o.map(i => ordinal.get(i))) && o.some((v, i) => v !== i));
  if (!order) return { err: 'no derangement' };
  return { solved, ordinal, order, old: chips.map(c => textOf(c.word)).join(' / '), next: order.map(i => textOf(chips[i].word)).join(' / ') };
}
function rebuildChips(item, plan, nl) {
  const first = item.chips[0].start, last = item.chips[item.chips.length - 1].end;
  const prefix = item.inner.slice(0, first).replace(/\s+$/, '');
  const trailer = item.inner.slice(last);
  const body = plan.order.map((c, i) =>
    nl + '    <span><b style="font-size:.8em">' + (i + 1) + '</b> ' + item.chips[c].word.trim() + '</span>').join('');
  return '<p' + item.attrs + '>' + prefix + body + trailer + '</p>';
}
function applyChunks(block, items, nl) {
  for (const it of items.slice().sort((a, b) => b.start - a.start)) {
    block = block.slice(0, it.start) + rebuildChips(it, it.plan, nl) + block.slice(it.end);
  }
  return block;
}
function verifyChunks(item) {
  if (!item.answer) return 'no answer';
  if (item.chips.length < 2) return 'one chip';
  const solved = solveChips(item.chips, item.answer);
  if (!solved) return 'no segmentation';
  const ord = new Map(); solved.forEach((c, i) => ord.set(c, i + 1));
  const bad = [];
  item.chips.forEach((c, i) => { if (ord.get(i) === i + 1) bad.push((i + 1) + ':' + textOf(c.word)); });
  return bad.length ? 'IN PLACE ' + bad.join(' ') : 'ok';
}


const files = DIRS.flatMap(d => walk(path.join(ROOT, d)));
let filesChanged = 0;
const problems = [];
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  let html = fs.readFileSync(file, 'utf8');
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const edits = [];
  for (const kind of ['matching', 'chunks']) {
    let from = 0;
    for (;;) {
      const at = html.indexOf('data-activity="' + kind + '"', from);
      if (at < 0) break;
      from = at + 1;
      const sp = blockAt(html, at);
      if (!sp) { problems.push(rel + ' | ' + kind + ' | no block'); continue; }
      const block = html.slice(sp.start, sp.end);
      const seed = seedOf(rel + '|' + kind + '|' + at);
      if (VERIFY) {
        if (kind === 'matching') console.log(rel + ' | matching | ' + verifyMatching(block));
        else for (const it of chunksState(block)) console.log(rel + ' | chunks | ' + verifyChunks(it));
        continue;
      }
      if (kind === 'matching') {
        const plan = planMatching(block, seed);
        if (plan.err) { problems.push(rel + ' | matching | ' + plan.err); continue; }
        console.log(rel + ' | matching ' + plan.st.rows.length + ' | ' + plan.old + ' -> ' + plan.next);
        edits.push({ start: sp.start, end: sp.end, html: applyMatching(block, plan) });
      } else {
        const items = chunksState(block).filter(it => it.chips.length >= 2);
        if (!items.length) { problems.push(rel + ' | chunks | no multi-chip .chips'); continue; }
        for (const it of items) {
          const plan = planChunks(it.chips, it.answer, seed + it.start);
          if (plan.err) { problems.push(rel + ' | chunks | ' + plan.err); continue; }
          it.plan = plan;
          console.log(rel + ' | chunks ' + it.chips.length + ' | ' + plan.old + ' -> ' + plan.next);
        }
        const ready = items.filter(it => it.plan);
        if (ready.length) edits.push({ start: sp.start, end: sp.end, html: applyChunks(block, ready, nl) });
      }
    }
  }
  if (VERIFY || !edits.length) continue;
  edits.sort((a, b) => b.start - a.start);
  const before = html;
  for (const e of edits) html = html.slice(0, e.start) + e.html + html.slice(e.end);
  if (html !== before) {
    if (APPLY) fs.writeFileSync(file, html, 'utf8');
    filesChanged++;
  }
}
console.log((VERIFY ? 'verify: ' : APPLY ? 'written: ' : 'dry run: ') + filesChanged + ' file(s), problems ' + problems.length);
for (const p of problems) console.log('  ! ' + p);
