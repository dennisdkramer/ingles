/**
 * qa/page.mjs — THE ONE PAGE GATE: structure, blocks, items, markup boxes, the wrap, and runtime.
 *
 * ONE GATE, SUBFUNCTIONS SWITCHED BY WHAT THE PAGE IS. A page carrying `.block`s is read as a
 * lesson page; a page carrying a `markup-row` is read as a build page, and a build page OUTSIDE a
 * demo folder is a defect, because a markup box is a tool and never content. Nothing here decides
 * by folder name what to check — the markup of the page says what it is.
 *
 * SCOPE — the lesson being written, and nothing else. No run widens its own scope:
 *   (no flag)                    the ONE track whose pages the working tree touches. Two tracks
 *                                touched is refused: a green that reads two tracks is not a green
 *                                about the one being written.
 *   --track=<t> [--lessons=21-25|21 22]   that track, exactly those pages (no numbers = what that
 *                                track's working tree touches; nothing touched = nothing to audit)
 *   --page=<path>                exactly one page, any folder (the map, a root page)
 *   --all                        every track, said out loud
 *   --static                     skip the runtime half
 *
 * FAILS — the page is broken: an element never closed · a closer that closed nothing · a dead
 *   `#anchor` · a `.block` not opening with an `<h3>` · a `.block` inside a `.block` · a headline
 *   over 60 characters · a `.rows` holding a `.rows` or a non-cell · an empty `data-answer` · a
 *   `.qitem` key matching no option value · `#feed` missing, duplicated or not a `<textarea>` · a
 *   build page outside a demo folder · a stub label pointing at nothing · a `pre` holding parsed
 *   markup · `data-span` not summing to 12 per line · and, in the runtime half, a page that does
 *   not boot, an answer control that resolves no anchor, a `.listen` with no `data-say`, a game
 *   engine4 never wired, a console error.
 * WARNS — printed, never failed: a block with answers and no `.qnum` · a class with no rule in
 *   `style.css` · an item still outside a cell of its own (fix with `node qa/wrap.mjs --write`).
 * PRINTS — evidence, not a verdict: the roadmap items the page names, the register tiers it hits,
 *   the claim shapes it carries, the h1 length.
 *
 *   node qa/page.mjs                      the lesson being written, on the track being written
 *   node qa/page.mjs --track=kids 3       one page
 *   node qa/page.mjs --page="extra/lesson1-The Capability Map.html"
 *   node qa/page.mjs --all --static       every track, static rules only
 */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { ROOT, TRACKS, hasTrackFlag, hasAllFlag, pickNumbers, pickLessonsFlag, pickTracks,
  lessonsOnDisk, touchedScope, lessonFile } from './track.mjs';
import { isDemo } from './demo.mjs';
import { balance, audit } from './wrap.mjs';

const argv = process.argv.slice(2);
const STATIC_ONLY = argv.includes('--static');
const PAGE = (argv.find(a => a.startsWith('--page=')) || '').slice('--page='.length);

/* ---- what this run reads ---------------------------------------------------------------- */
function refuse(msg) { console.log('❌ ' + msg); process.exit(1); }

function scope() {
  if (PAGE) {
    const file = path.isAbsolute(PAGE) ? PAGE : path.join(ROOT, PAGE.replace(/\\/g, '/'));
    if (!fs.existsSync(file)) refuse('no such page: ' + PAGE);
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const m = /^([^/]+)\/lesson(\d+)-/.exec(rel);
    const track = m && TRACKS.includes(m[1]) ? m[1] : null;
    return [{ file, rel, track, n: m ? Number(m[2]) : null, demo: !!track && isDemo(ROOT, track) }];
  }
  /* THE TRACKS, AND NO SECOND OPINION: an explicit --track or --all names them; with neither, the
     working tree names one, and two is a refusal rather than a quiet sweep. */
  let tracks;
  if (hasTrackFlag() || hasAllFlag()) tracks = pickTracks().filter(t => !isDemo(ROOT, t));
  else {
    const s = touchedScope();
    if (!s) return [];
    if (s.tracks.length > 1) refuse('two tracks are touched (' + s.tracks.join(', ') +
      ') — name one with --track=<t>: a gate that reads two tracks is not a gate about the one being written');
    tracks = s.tracks;
  }
  const named = pickNumbers();
  const flagged = pickLessonsFlag() || [];
  const s = touchedScope();
  const out = [];
  for (const t of tracks) {
    let list;
    if (named.length) list = named;
    else if (flagged.length) list = flagged;
    else if (hasAllFlag()) list = lessonsOnDisk(t);           /* --all is the only full sweep, and it is said out loud */
    else list = s && s.numbers.has(t) ? [...s.numbers.get(t)].sort((a, b) => a - b) : [];
    if (!list.length) {
      refuse('nothing is being written in ' + t + ' — name the pages (--lessons=21-25, or 21 22), ' +
        'or --all for the whole track, or --page=<path>');
    }
    for (const n of list) {
      const file = lessonFile(t, n);
      if (!file) refuse('lesson ' + n + ' does not exist in ' + t);
      out.push({ file, rel: path.relative(ROOT, file).split(path.sep).join('/'), track: t, n, demo: false });
    }
  }
  return out;
}

const pages = scope();
if (!pages.length) {
  console.log('page — nothing to audit: no page in this task is touched. Name one: --track=<t> 3, --page=<path>, or --all.');
  process.exit(0);
}
/* ---- the sheet's own words: every class a page may carry -------------------------------- */
const sheet = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const CSS_CLASSES = new Set([...sheet.matchAll(/\.(-?[a-zA-Z_][\w-]*)/g)].map(m => m[1]));

/* A CLASS THAT IS ONLY A MARKER, not a style: engine4 adds `g4-hear` at load and reads `g4-keep` to
   know which nodes are the place the game happens in, and the flip deck's `flip-grid` is its own
   container. None of the three is a typo, so none is reported. */
const MARKER_CLASSES = new Set(['g4-hear', 'g4-keep', 'flip-grid']);
const RUNTIME_CLASSES = new Set(['eq-ready', 'layout-on', 'layout-panelled', 'layout-drag', 'layout-shift',
  'layout-dragging', 'layout-line', 'layout-chip', 'layout-panel', 'layout-grip', 'editing', 'kbd',
  'no-js', 'is-inside', 'lvl1', 'lvl2', 'lvl3']);

/* the ledger says whether a lesson has been recorded: a block opening with no headline is a failure
   on a ledgered lesson and a warning elsewhere, because a page built before the rule is not redesigned
   by a gate */
function ledgered(track, n) {
  if (!track || !n) return false;
  const f = path.join(ROOT, track, 'BATCH-RECORD.md');
  if (!fs.existsSync(f)) return false;
  return new RegExp('^L0*' + n + '\\s*\\|', 'm').test(fs.readFileSync(f, 'utf8'));
}

/* the edit-mode chrome the layout editor adds to the live page: never part of a saved page */
const DOMCHROME = dom => [...dom.querySelectorAll('.layout-chip,.layout-panel,.layout-line,.layout-grip,#layoutLayer')];

/* ---- the static rules: what the page is made of ----------------------------------------- */
function staticRules(p, src) {
  const fails = [], warns = [], notes = [];
  const dom = new JSDOM(src).window.document;
  const area = dom.querySelector('.content-area') || dom.body;
  const ledger = ledgered(p.track, p.n);

  /* TAGS ARE READ BY A PARSER, NOT COUNTED. `<div` against `</div>` is fooled by a specimen inside a
     pre and by a comment; the scanner knows which element a closer closed and which one never got
     one. */
  for (const b of balance(src).slice(0, 4)) fails.push('tag: ' + b);

  /* every #anchor goes somewhere */
  const ids = new Set([...dom.querySelectorAll('[id]')].map(e => e.id));
  for (const a of dom.querySelectorAll('a[href^="#"]')) {
    const h = a.getAttribute('href');
    if (h.length > 1 && !ids.has(h.slice(1))) fails.push('dead anchor: ' + h);
  }

  /* every class the page carries is a class the sheet knows (warn: a typo renders, it just does not
     look right) */
  const unknown = new Set();
  for (const el of dom.querySelectorAll('[class]'))
    for (const c of el.getAttribute('class').split(/\s+/).filter(Boolean))
      if (!CSS_CLASSES.has(c) && !RUNTIME_CLASSES.has(c) && !MARKER_CLASSES.has(c)) unknown.add(c);
  if (unknown.size) warns.push('class with no rule in style.css: ' + [...unknown].join(', '));

  /* a block opens with its headline (the block letter is drawn from it), never holds a block, and
     no headline runs past one line */
  const blocks = [...area.querySelectorAll('.block')];
  if (blocks.length) {
    const headless = blocks.filter(b => !(b.firstElementChild && b.firstElementChild.tagName === 'H3'));
    if (headless.length) {
      const msg = headless.length + ' of ' + blocks.length + ' block(s) open with no <h3> — the block letter is drawn from the headline';
      (ledger ? fails : warns).push(msg);
    }
    const nested = area.querySelectorAll('.block .block').length;
    if (nested) fails.push(nested + ' block(s) nested inside a block — a block is never a second block');
    for (const h of area.querySelectorAll('h3')) {
      const t = h.textContent.replace(/\s+/g, ' ').trim();
      if (t.length > 60) fails.push('headline over 60 characters (' + t.length + '): ' + t);
    }
  }

  /* every answer has a key, and every key names an option */
  for (const el of area.querySelectorAll('[data-answer]'))
    if (!el.getAttribute('data-answer').trim()) fails.push('empty data-answer on a <' + el.tagName.toLowerCase() + '>');
  /* a listen chip with no words behind it is a dead button */
  const mute = [...area.querySelectorAll('.listen')].filter(b => !b.getAttribute('data-say'));
  if (mute.length) fails.push(mute.length + ' .listen chip(s) without data-say — a dead button');
  for (const q of area.querySelectorAll('.qitem[data-a]')) {
    const vals = [...q.querySelectorAll('input[type=radio], input[type=checkbox]')].map(i => i.value);
    if (!vals.length) { fails.push('.qitem[data-a]="' + q.getAttribute('data-a') + '" holds no radio or checkbox'); continue; }
    const keys = q.getAttribute('data-a').split('|').map(s => s.trim());
    const lost = keys.filter(k => !vals.includes(k));
    if (lost.length) fails.push('.qitem data-a="' + q.getAttribute('data-a') + '" names ' + lost.join(',') + ' but the options are ' + vals.join(','));
  }
  /* items are numbered, and a block that holds answers says so */
  const answered = blocks.filter(b => b.querySelector('input.gap,textarea.write,input[type=radio]'));
  const unnumbered = answered.filter(b => !b.querySelector('.qnum'));
  if (unnumbered.length) warns.push(unnumbered.length + ' block(s) hold answers but carry no .qnum — items are numbered 1., 2. …');

  /* a lesson page has its notebook, exactly one */
  if (p.track) {
    const feeds = dom.querySelectorAll('#feed');
    if (feeds.length !== 1) fails.push('#feed missing or duplicated (' + feeds.length + ')');
    else if (feeds[0].tagName !== 'TEXTAREA') fails.push('#feed is not a <textarea> — the notebook is a textarea');
  }

  /* ---- the markup box: a tool, and read only where one exists ----------------------------- */
  const markup = area.querySelector('.markup-row');
  if (markup) {
    if (p.track) fails.push('a markup box on a lesson page — a markup box is a build tool, never content');
    for (const s of area.querySelectorAll('.markup-row summary'))
      for (const h of (s.textContent.match(/#[a-z0-9][a-z0-9-]*/g) || []))
        if (!ids.has(h.slice(1))) fails.push('stub label points at nothing: ' + h);
    for (const pre of area.querySelectorAll('.markup-row pre')) {
      if (pre.children.length) fails.push('a <pre> holds parsed markup, not escaped tags: ' + pre.firstElementChild.outerHTML.slice(0, 40));
      else if (!/&lt;/.test(pre.innerHTML)) fails.push('a <pre> in a markup box holds no escaped tag');
    }
    let row = 0;
    for (const el of area.children) {
      const s = Number(el.getAttribute('data-span') || 12);
      if (row + s > 12) { fails.push('data-span overflows the line (' + row + '+' + s + ') at <' + el.tagName.toLowerCase() + '>'); row = 0; }
      row += s;
      if (row === 12) row = 0;
    }
    if (row) fails.push('data-span leaves a short line of ' + row);
  }

  /* ---- the wrap: rows hold cells, a cell holds its items --------------------------------
     A ROW INSIDE A ROW IS A FAILURE wherever it appears: it is a shape the sheet cannot read. The
     rest of the wrap — a row holding a bare element, an item with no cell of its own — is reported
     as a WARNING, because the pages built before this rule are not wrapped yet and a gate that reds
     on the whole corpus is a gate nobody runs. `node qa/wrap.mjs --write <page>` is the fix, and the
     count is what is left to do. */
  const wrap = audit(src);
  if (wrap.error) fails.push('wrap: ' + wrap.error);
  const rowwise = wrap.bad.filter(b => b.rule === 'row-in-row');
  for (const b of rowwise.slice(0, 3)) fails.push('wrap: ' + b.detail);
  if (rowwise.length > 3) fails.push('wrap: … and ' + (rowwise.length - 3) + ' more rows inside rows');
  const unbundled = wrap.bad.filter(b => b.rule !== 'row-in-row').length + wrap.added;
  if (unbundled) warns.push('not wrapped: ' + unbundled + ' item(s) stand outside a cell of their own — run `node qa/wrap.mjs --write ' + p.rel + '`');

  /* ---- the edit tool's marks never reach a saved page ---------------------------------- */
  const marks = area.querySelectorAll('[data-layout-grain],[data-layout-pin],[data-layout-sel],[contenteditable]');
  const chrome = DOMCHROME(dom);
  if (marks.length) fails.push(marks.length + ' element(s) carry the edit tool\'s marks (data-layout-* / contenteditable) — a save writes a clean page');
  if (chrome.length) fails.push(chrome.length + ' element(s) of edit-mode chrome are in the page');

  notes.push(blocks.length + ' block(s) · ' + wrap.rows + ' row(s)' + (markup ? ' · a markup box' : '')
    + (p.track ? ' · a lesson page' : ' · not a track page: static only'));
  const h1 = area.querySelector('h1');
  return { fails, warns, notes, h1: h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '' };
}

/* ---- evidence: what the page carries, printed and never judged -------------------------- */
const norm = s => String(s || '').toLowerCase()
  .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

/* the items on one `- Vocabulary:` / `- Examples:` line of the lesson's own roadmap block */
function roadmap(track, n) {
  const f = path.join(ROOT, track.toUpperCase() + '-ROADMAP.md');
  if (!fs.existsSync(f)) return null;
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  const num = l => { const m = l.match(/^## (?:\[(\d+)\]|Lesson (\d+))/); return m ? Number(m[1] || m[2]) : null; };
  const start = lines.findIndex(l => num(l) === n);
  if (start < 0) return null;
  const body = [];
  for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i++) body.push(lines[i]);
  const grab = label => {
    const line = body.find(l => new RegExp('^\\s*-\\s*' + label + '\\s*:', 'i').test(l));
    if (!line) return [];
    const quoted = [...line.matchAll(/"([^"]+)"/g)].map(m => m[1]);
    const rest = line.replace(/"[^"]*"/g, ',').replace(/^\s*-\s*[A-Za-z]+\s*:/, '');
    const bare = rest.split(',').map(s => s.trim().replace(/^`+|`+$/g, '')).filter(s => s.length > 1);
    return quoted.concat(bare);
  };
  const vocab = grab('vocabulary'), examples = grab('examples');
  return { vocab, examples, items: vocab.concat(examples) };
}

/** an item as a matcher. A hyphen run becomes \S* so a masked spelling still matches its word. */
function rx(item) {
  const body = norm(item).replace(/[.!?]+$/, '')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-+/g, '\\S*').replace(/ /g, '\\s+');
  return new RegExp('(^|[^\\p{L}])' + body + '(?![\\p{L}])', 'u');
}

/* the track's register: the tiers it declares, and the `formal`/`locale` words it does not use */
function tells(track) {
  const f = path.join(ROOT, track.toUpperCase() + '-REGISTER.md');
  const out = { file: fs.existsSync(f), tiers: {}, neg: {} };
  if (!out.file) return out;
  let tier = '';
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const h = line.match(/^###\s*(?:\[([a-z]+)\]|\*\*([a-z]+)\*\*|([a-z]+))/i);
    if (h) { tier = (h[1] || h[2] || h[3]).toLowerCase(); continue; }
    const b = line.match(/^\s*-\s*([a-z]+)\s*:\s*(.+)$/i);
    if (!b) continue;
    const fam = b[1].toLowerCase();
    const items = b[2].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    if (fam === 'formal' || fam === 'locale') { (out.neg[fam] = out.neg[fam] || []).push(...items); continue; }
    if (!tier) continue;
    (out.tiers[tier] = out.tiers[tier] || []).push(...items.map(w => ({ w, fam })));
  }
  for (const k of Object.keys(out.tiers)) out.tiers[k].forEach(o => { o.re = rx(o.w); });
  for (const k of Object.keys(out.neg)) out.neg[k] = out.neg[k].map(w => ({ w, re: rx(w) }));
  return out;
}

/* the shapes of a claim nothing on the page can check: printed, never failed */
const CLAIM = [
  [/\b(no|not one|never a)\s+(human|person|one|word|sentence|student)\b[^.!?]{0,60}\b(has|have) ever\b|\bnobody has ever\b|\bno one has ever\b/i, 'an absolute about all of history'],
  [/\b(every|all|no)\s+(single\s+)?phrasal verbs?\b/i, 'a claim about a whole class'],
  [/\b(the|this|that|a)\s+word\s+[^.!?]{0,40}\b(comes?|came|derives?|originates?|roots?)\b|\betymolog/i, 'a history claim — name the source'],
  [/\btwins?\b/i, '"twin" is a label this repo does not use'],
  [/\b(helper|glue|little|small|function)\s+words?\b/i, 'a coined class name — say which word'],
  [/\bfamily unit\b/i, 'a coined class name — the roadmap says family'],
];

/* ---- the runtime half: the page as a student loads it ----------------------------------
   The static rules read the source; these read the running page in jsdom, with a stubbed login so the
   engines boot exactly as a signed-in student sees them. Only what a source cannot answer is here:
   the engines ran, every answer control resolved an anchor, no game was left unwired, no console
   error. */
const SECRET = 'abreportas2025';
const sig = s => { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return x; };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

function serve() {
  return http.createServer((req, res) => {
    const rel = req.url.split('?')[0];
    const file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });
}
const mockFetch = () => {
  global.fetch = async () => ({ ok: true, status: 200, headers: new Map(),
    text: async () => '{}', json: async () => ({ status: 'ok', result: 'ok' }) });
};
function gated(html, track) {
  const email = 'qa@test.com', s = sig(email + track + SECRET);
  return html.replace('<head>', '<head><script>(function(){const store={};'
    + 'sessionStorage.setItem("gate",' + JSON.stringify(JSON.stringify({ email, track, teacher: true, sig: s })) + ');'
    + 'sessionStorage.getItem=k=>store[k]||null;sessionStorage.setItem=(k,v)=>{store[k]=v;};'
    + 'navigator.mediaDevices=navigator.mediaDevices||{};'
    + 'navigator.mediaDevices.getUserMedia=async()=>({getTracks:()=>[],getAudioTracks:()=>[]});'
    + '})();</script>');
}

async function runtime(base, p, html) {
  const fails = [];
  const console_ = [];
  const rel = path.relative(ROOT, p.file).split(path.sep).join('/');
  const dom = new JSDOM(gated(html, p.track), {
    runScripts: 'dangerously', resources: 'usable', url: base + '/' + rel, pretendToBeVisual: true,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
      w.requestAnimationFrame = cb => setTimeout(cb, 0);
      w.fetch = (...a) => global.fetch(...a);
      const r = { top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20, x: 0, y: 0 };
      w.Element.prototype.getBoundingClientRect = () => r;
      w.Range.prototype.getBoundingClientRect = () => r;
      w.console.error = (...a) => { const m = a.join(' '); if (!/Failed to load resource|net::/.test(m)) console_.push(m); };
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  const w = dom.window, d = w.document;
  if (!w.__A) fails.push('engine1.js did not execute');
  if (!w.__B) fails.push('engine2.js did not execute');
  if (w.ansOf) {
    const un = [...d.querySelectorAll('input.gap, input[type="radio"], textarea')]
      .filter(el => el.id !== 'feed').filter(el => { const a = w.ansOf(el); return !a || !a.anchor; }).length;
    if (un) fails.push(un + ' answer control(s) resolve no anchor — the answer is never saved');
  }
  const dead = [...d.querySelectorAll('.game[data-game]')].filter(g => !g.classList.contains('g4-ready')).length;
  if (dead) fails.push(dead + ' game block(s) engine4 never wired');
  console_.forEach(e => fails.push('console error: ' + e));
  const area = d.querySelector('.content-area');
  const h1 = area && area.querySelector('h1');
  /* coverage reads the AUTHORED page: an answer key counts as the words in its sentence */
  let text = norm(area ? area.textContent : d.body.textContent);
  if (area) {
    const clone = area.cloneNode(true);
    clone.querySelectorAll('input[data-answer]').forEach(el => {
      el.replaceWith(d.createTextNode(' ' + (el.getAttribute('data-answer') || '') + ' '));
    });
    clone.querySelectorAll('script, style').forEach(el => el.remove());
    text = norm(clone.innerHTML.replace(/<[^>]*>/g, ' '));
  }
  const claims = [];
  if (area) for (const el of area.querySelectorAll('p, td, th, li, .lead')) {
    if (el.querySelector('p, td, th, li')) continue;
    if (el.closest('.dialog')) continue;
    const t = el.textContent.replace(/\s+/g, ' ').trim();
    for (const [re, why] of CLAIM) { const m = t.match(re); if (m) claims.push('"' + m[0].trim() + '" (' + why + ')'); }
  }
  const out = { fails, text, claims, h1: h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '' };
  w.close();
  return out;
}

/* ---- the run ---------------------------------------------------------------------------- */
const server = serve();
await new Promise(r => server.listen(0, r));
const base = 'http://localhost:' + server.address().port;
mockFetch();

console.log('page — ' + pages.length + ' page(s) · ' + (STATIC_ONLY ? 'static only' : 'static + runtime')
  + ' · reads: ' + pages.map(p => p.rel).join(', '));
let failed = 0, warned = 0;
for (const p of pages) {
  const src = fs.readFileSync(p.file, 'utf8');
  const st = staticRules(p, src);
  let rt = { fails: [], text: '', claims: [], h1: '' };
  if (!STATIC_ONLY && p.track) rt = await runtime(base, p, src);
  const fails = st.fails.concat(rt.fails), warns = st.warns.slice();
  const line = [st.notes.join(' · ')];

  /* evidence: printed, never a verdict */
  if (STATIC_ONLY) line.push('evidence skipped (--static)');
  else if (p.track && p.n) {
    const rm = roadmap(p.track, p.n);
    if (!rm) line.push('roadmap: no [' + p.n + '] block');
    else if (!rm.items.length) line.push('roadmap: this entry lists no items to measure');
    else {
      const hit = rm.items.filter(i => rx(i).test(rt.text));
      const need = Math.ceil(rm.items.length / 2);
      const miss = rm.items.filter(i => hit.indexOf(i) < 0);
      line.push('items ' + hit.length + '/' + rm.items.length + ' (need ' + need + ')'
        + (miss.length ? ' · missing ' + miss.map(m => '"' + m + '"').join(' ') : ''));
      if (!hit.length) fails.push('roadmap: 0/' + rm.items.length + ' items — the page does not teach lesson ' + p.n);
      else if (hit.length < need) warns.push('under the bar — items ' + hit.length + '/' + rm.items.length + ' (need ' + need + ')');
    }
    const T = tells(p.track);
    const reg = [];
    for (const tier of ['core', 'common', 'situational', 'rare', 'text']) {
      const set = T.tiers[tier];
      if (!set) continue;
      const h = set.filter(o => o.re.test(rt.text));
      if (!h.length) continue;
      const fams = h.reduce((a, o) => (a[o.fam] = (a[o.fam] || 0) + 1, a), {});
      reg.push(tier + ' ' + h.length + ' (' + Object.keys(fams).map(f => f + ' ' + fams[f]).join(' · ') + ')');
    }
    const neg = Object.keys(T.neg).map(k => {
      const h = T.neg[k].filter(o => o.re.test(rt.text));
      return h.length ? k + ' ' + h.map(o => '"' + o.w + '"').join(' ') : '';
    }).filter(Boolean);
    line.push('register ' + (reg.join(' · ') || 'neutral') + (neg.length ? ' · tells ' + neg.join(' · ') : ''));
  }
  if (rt.claims.length) line.push('claims ' + rt.claims.length + ': ' + rt.claims.slice(0, 2).join(' · '));
  const h1 = rt.h1 || st.h1;
  if (h1) line.push('h1 ' + h1.length);

  console.log((fails.length ? '❌ ' : warns.length ? '⚠  ' : '✅ ') + p.rel);
  console.log('     ' + line.join(' · '));
  for (const f of fails) console.log('     - ' + f);
  for (const w of warns) console.log('     ~ ' + w);
  if (fails.length) failed++; else if (warns.length) warned++;
}
server.close();
console.log('\n' + (failed
  ? '❌ ' + failed + ' of ' + pages.length + ' page(s) failed' + (warned ? ' · ' + warned + ' warned' : '')
  : '✅ ' + pages.length + ' page(s) pass' + (warned ? ' · ' + warned + ' warned' : '')));
process.exitCode = failed ? 1 : 0;






