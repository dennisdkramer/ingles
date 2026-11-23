/* qa/wrap.mjs — THE THREE-LEVEL WRAP, as a tool: one page at a time, or a list of them.

   WHAT IT DOES. Puts every node of a lesson page into a cell and a row, three levels deep and no
   deeper (PEDAGOGY-MAP [1A]; the levels layout.js reads):
     · level 1 — the section's row, a direct child of .content-area;
     · level 2 — the row inside a cell: a block's own children, and the items of a level-1 cell;
     · level 3 — the row inside a level-2 cell, whose only job is horizontal positioning.
   A heading (h1–h4), a block's own <script>, the notebook and a markup box (`details.reveal`, a
   control and not a container) stand alone. Nothing is written at level 4. Each item gets a row
   with ONE cell in it, so the wrap is spacing-neutral: the gap between two items moves from the
   container's own rule to the row that now holds them, at the same value (`--level-gap` between a
   frame's children, `--cell-gap` inside a cell, and level 3's gap is the cell's too).

   WHY A TEXT SCANNER AND NOT JSDOM. jsdom gives back a re-serialized document: entity spelling,
   attribute order, quote style, self-closing slashes and line wrapping all change, and every page
   in this repo is diffed by hand. So the page is tokenized into raw source slices and each element
   is re-emitted from its **own opening tag**, byte for byte; the only markup written from scratch
   is the row and the cell this tool adds. A parse + serialize of the input with the rules turned
   off MUST be the input — that check runs on every invocation, and `--check` fails on it. This is
   what keeps `id`, `style`, `data-*`, `aria-*` and `popover` on the boxes a class-string rebuild
   would silently have dropped.

   USE
     node qa/wrap.mjs <page.html> […]            report only — what the wrap would add
     node qa/wrap.mjs --write <page.html> […]    rewrite the page in place
     node qa/wrap.mjs --check <page.html> […]    exit 1 unless the page is ALREADY wrapped and the
                                                 scanner copies it through untouched
   The tool is a fixed point: running it on a wrapped page adds no row, so `--check` is also the
   way to prove a page carries the wrap.
*/
import fs from 'node:fs';
import path from 'node:path';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAWTEXT = new Set(['script', 'style', 'textarea', 'title']);

/* ---- 1. the scanner: text in, a tree of raw source slices out --------------------------- */
export function parse(src) {
  const root = { kind: 'root', tag: '#root', children: [] };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  const text = s => { if (s) top().children.push({ kind: 'text', raw: s }); };
  let i = 0;

  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt < 0) { text(src.slice(i)); break; }
    if (lt > i) text(src.slice(i, lt));

    /* a comment or a doctype is copied through, never parsed */
    if (src.startsWith('<!--', lt)) {
      const end = src.indexOf('-->', lt + 4);
      const j = end < 0 ? src.length : end + 3;
      text(src.slice(lt, j)); i = j; continue;
    }
    if (src[lt + 1] === '!') {
      const end = src.indexOf('>', lt);
      const j = end < 0 ? src.length : end + 1;
      text(src.slice(lt, j)); i = j; continue;
    }
    /* a closing tag belongs to the nearest matching element still open. A closer with nothing to
       close is kept as text, verbatim: it is the page's own defect, and a scanner that silently
       drops it would "fix" a file it was only asked to wrap. */
    if (src[lt + 1] === '/') {
      const end = src.indexOf('>', lt);
      const j = end < 0 ? src.length : end + 1;
      const tag = src.slice(lt + 2, end).trim().toLowerCase();
      let closed = false;
      for (let k = stack.length - 1; k > 0; k--) {
        if (stack[k].tag === tag) { stack[k].close = src.slice(lt, j); stack.length = k; closed = true; break; }
      }
      if (closed) { i = j; continue; }
      text(src.slice(lt, j)); i = j; continue;
    }
    /* an opening tag: its raw text is taken whole, quotes honoured, so `onerror="…'…'"` survives */
    let j = lt + 1, q = null;
    for (; j < src.length; j++) {
      const c = src[j];
      if (q) { if (c === q) q = null; }
      else if (c === '"' || c === "'") q = c;
      else if (c === '>') break;
    }
    const raw = src.slice(lt, j + 1);
    const m = /^<([a-zA-Z][\w:-]*)/.exec(raw);
    if (!m) { text(raw); i = j + 1; continue; }
    const tag = m[1].toLowerCase();
    const el = { kind: 'el', tag, raw, close: '', children: [] };
    top().children.push(el);
    i = j + 1;
    if (VOID.has(tag) || /\/>$/.test(raw)) continue;          /* no children, no closer */
    if (RAWTEXT.has(tag)) {                                    /* script/style/textarea: opaque */
      const lower = src.toLowerCase();
      const at = lower.indexOf('</' + tag, i);
      if (at < 0) { el.children.push({ kind: 'text', raw: src.slice(i) }); i = src.length; continue; }
      if (at > i) el.children.push({ kind: 'text', raw: src.slice(i, at) });
      const end = src.indexOf('>', at);
      const stop = end < 0 ? src.length : end + 1;
      el.close = src.slice(at, stop);
      i = stop; continue;
    }
    stack.push(el);
  }
  return root;
}

export function serialize(n) {
  if (n.kind === 'text') return n.raw;
  if (n.kind === 'root') return n.children.map(serialize).join('');
  return n.raw + n.children.map(serialize).join('') + n.close;
}

/* ---- 2. reading an element's attributes — never rewriting them -------------------------- */
function attr(raw, name) {
  const body = raw.replace(/^<[a-zA-Z][\w:-]*/, '');
  const re = new RegExp('(^|\\s)' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i');
  const m = re.exec(body);
  return m ? (m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : m[5]) : null;
}
const classes = n => (n.kind === 'el' ? (attr(n.raw, 'class') || '').split(/\s+/).filter(Boolean) : []);
const isRow = n => n.kind === 'el' && classes(n).includes('rows');
const isBlock = n => n.kind === 'el' && classes(n).includes('block');
const HEADING = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const CONTROL = new Set(['script', 'style']);

/* every element, with the number of `.rows` above it (its row's level is that + 1) */
function walk(n, out, depth) {
  for (const c of n.children) {
    if (c.kind !== 'el') continue;
    c._depth = depth;
    out.push(c);
    walk(c, out, depth + (isRow(c) ? 1 : 0));
  }
  return out;
}


/* ---- 3. the rule ----------------------------------------------------------------------- */
const ROW_OPEN = '<div class="rows">';

function wrapPage(src) {
  const tree = parse(src);
  const all = walk(tree, [], 0);
  const ca = all.find(n => classes(n).includes('content-area'));
  const report = { rows: 0, cells: 0, added: 0, depth: {}, error: null };
  if (!ca) { report.error = 'no .content-area — is this a lesson page?'; return { tree, report }; }

  const before = countRows(all);
  const rowsAt = level => all.filter(n => isRow(n) && n._depth === level - 1);
  const targets = [];   /* [container, predicate] — the whole list is taken before anything moves */

  /* level 1 — a node standing directly under .content-area. A section heading, a block's own
     <script>, the notebook and an existing row stand alone; anything else (a paragraph, a chart, a
     block authored at page level) is given the row it must have, so nothing on the page is a bare
     leaf the editor cannot place. */
  targets.push([ca, n => n.kind === 'el' && !HEADING.has(n.tag) && !CONTROL.has(n.tag)
    && n.tag !== 'textarea' && !isRow(n)]);

  /* level 2 — a block's own children: not in a cell at all, so each one is given the row it must
     have. A block's content is a row per child, whatever the count. */
  for (const b of all.filter(isBlock)) {
    targets.push([b, n => n.kind === 'el' && !HEADING.has(n.tag) && !CONTROL.has(n.tag) && !isRow(n)]);
  }
  /* level 2 and 3 — the items of a cell. A cell that already holds ONE item is finished: the item
     is a cell of a row, which is the whole of what the wrap promises, and a row made around it
     could hold nothing beside it. A cell holding several items is the case level 3 exists for, so
     each of those items gets a cell of its own in a row one level down. That is also what makes the
     tool a FIXED POINT: what it writes is a cell holding rows, so a second run adds no row. */
  for (const level of [1, 2]) {
    for (const row of rowsAt(level)) {
      for (const cell of row.children) {
        if (cell.kind !== 'el' || cell.tag !== 'div' || isBlock(cell) || classes(cell).includes('reveal')) continue;
        const pred = n => n.kind === 'el' && !isRow(n) && !isBlock(n) && !CONTROL.has(n.tag);
        if (cell.children.filter(pred).length < 2) continue;
        targets.push([cell, pred]);
      }
    }
  }

  for (const [parent, pred] of targets) {
    const out = [];
    for (const n of parent.children) {
      if (!pred(n)) { out.push(n); continue; }
      out.push({
        kind: 'el', tag: 'div', raw: ROW_OPEN, close: '</div>', children: [{
          kind: 'el', tag: 'div', raw: '<div>', close: '</div>', children: [n]
        }]
      });
      report.added++;
    }
    parent.children = out;
  }

  /* the shape of the page the wrap produced, read back off the tree */
  const after = walk(tree, [], 0);
  const now = countRows(after);
  report.rows = now.rows; report.cells = now.cells;
  report.depth = now.depth;
  report.before = before;
  return { tree, report };
}

function countRows(all) {
  const out = { rows: 0, cells: 0, depth: {} };
  for (const n of all) {
    if (isRow(n)) {
      out.rows++;
      const l = n._depth + 1;
      out.depth[l] = (out.depth[l] || 0) + 1;
    }
  }
  /* a cell is an element child of a row; counted off the parent's children */
  for (const n of all) {
    if (!isRow(n)) continue;
    for (const c of n.children) if (c.kind === 'el') out.cells++;
  }
  return out;
}

/* every attribute that is not a class, counted: a rebuild that dropped one would move the number */
function attrCensus(src) {
  const out = {};
  for (const m of src.matchAll(/\s(id|style|data-[\w-]+|aria-[\w-]+|popover|src|href)\s*=/g)) {
    out[m[1]] = (out[m[1]] || 0) + 1;
  }
  return out;
}
const sameCensus = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

/* ---- 4. the command line ---------------------------------------------------------------- */
function main(argv) {
  const write = argv.includes('--write');
  const check = argv.includes('--check');
  const files = argv.filter(a => !a.startsWith('--'));
  if (!files.length) {
    console.log('node qa/wrap.mjs [--write|--check] <page.html> […]');
    console.log('  no flag   report what the wrap would add');
    console.log('  --write   rewrite each page in place');
    console.log('  --check   1 unless the page is already wrapped, its attributes are intact and the');
    console.log('            scanner copies it through byte for byte');
    return 1;
  }
  let bad = 0;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const roundTrip = serialize(parse(src)) === src;
    const { tree, report } = wrapPage(src);
    const out = serialize(tree);
    const censusOk = sameCensus(attrCensus(src), attrCensus(out));
    const shape = `rows ${report.before ? report.before.rows : '?'} → ${report.rows} · cells ${report.before ? report.before.cells : '?'} → ${report.cells}`
      + ` · depth ${Object.entries(report.depth).sort().map(([k, v]) => `${k}:${v}`).join(' ')}`
      + ` · +${report.added} row${report.added === 1 ? '' : 's'}`;
    const notes = [];
    if (!roundTrip) notes.push('SCANNER ALTERS THE PAGE (round trip differs) — nothing written');
    if (!censusOk) notes.push('ATTRIBUTES CHANGED (id/style/data-*/aria-* census differs) — nothing written');
    if (report.error) notes.push(report.error);

    if (write && !report.error && roundTrip && censusOk && report.added) fs.writeFileSync(f, out, 'utf8');
    console.log(`${f} — ${shape}${notes.length ? ' · ' + notes.join(' · ') : ''}`);

    if (check) {
      if (!roundTrip) { console.log(`  ✗ ${f}: the scanner does not copy this page through — a fix is needed before the wrap is read`); bad++; }
      if (!censusOk) { console.log(`  ✗ ${f}: an attribute would change`); bad++; }
      if (report.added) { console.log(`  ✗ ${f}: ${report.added} item(s) still outside a cell of their own — run with --write`); bad++; }
      if (report.error) bad++;
    }
    /* a page that is already wrapped must come back unchanged: the tool is a fixed point */
    if (!check && !write && !report.added && out !== src) { console.log(`  ! ${f}: no row added, yet the output differs`); bad++; }
  }
  return bad ? 1 : 0;
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entry && entry === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  process.exitCode = main(process.argv.slice(2));
}


