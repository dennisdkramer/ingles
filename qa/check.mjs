/**
 * qa/check.mjs — the one lesson gate: content, roadmap coverage, register evidence.
 *
 * Replaces qa/content.mjs, qa/lang.mjs and qa/register.mjs, all deleted. Deliberately absent:
 *   - any Portuguese share or band. The band was a policy, not a defect: the page is not judged on
 *     which language it explains in.
 *   - any per-track quota, and any verdict on whether a page "sounds" right. The register tiers a
 *     page hits are PRINTED. Whether that is the track's voice is the reader's call.
 *   - any masking rule. A masked spelling does not match a tells list, which is one more reason the
 *     register block is evidence and not a verdict.
 *
 * FAIL — the page is broken:
 *   engine1/engine2 did not boot · not exactly one #feed <textarea> · a .listen chip with no data-say
 *   · an answer control resolving no anchor (the answer is never saved) · a .game block engine4 never
 *   wired · a console error
 *
 * WARN — printed, never failed: roadmap coverage under half of the lesson's own items (vocabulary +
 * examples), the register tiers the page hits, the formal/locale words it uses, the <h1> length. A
 * legacy page that predates a rule would otherwise red for a bar nobody was writing to, and a red that
 * is really a policy is how a report stops being read. The coverage line states the bar it is measured
 * against: `need N`, and a WARN below it.
 *
 * FAIL — complete mismatch: a page that names NONE of the items its own roadmap block lists is not that
 * lesson, however well it loads. business 19 shipped teaching the passive (roadmap 33) and went green.
 *
 * SCOPE: no flag = the pages the working tree or last commit touched; --track=<t> [n …] names pages;
 * --all sweeps every page. A number that exists in no track is a hard error, so a typo cannot pass.
 *
 * Run: node qa/check.mjs [--track=adult] [28 …] [--all]
 */
import { JSDOM } from 'jsdom';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { ROOT, hasTrackFlag, hasAllFlag, pickNumbers, missingTargets, scopeLabel,
  touchedScope, pickVoiceTracks, pickVoiceLessons, lessonFile } from './track.mjs';

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
/* ---- the roadmap: what this lesson's own block says its items and examples are ---- */

const norm = s => String(s || '').toLowerCase()
  .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

/* the items on one `- Vocabulary:` / `- Examples:` line, in the order the roadmap lists them.
   The roadmaps use two heading shapes: `## [21] - ...` (adult, kids) and `## Lesson 21: ...` (business). */
function roadmap(track, n) {
  const f = path.join(ROOT, track.toUpperCase() + '-ROADMAP.md');
  if (!fs.existsSync(f)) return null;
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  const num = l => {
    const m = l.match(/^## (?:\[(\d+)\]|Lesson (\d+))/);
    return m ? Number(m[1] || m[2]) : null;
  };
  const start = lines.findIndex(l => num(l) === n);
  if (start < 0) return null;
  const body = [];
  for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i++) body.push(lines[i]);
  const grab = label => {
    const line = body.find(l => new RegExp('^\\s*-\\s*' + label + '\\s*:', 'i').test(l));
    if (!line) return [];
    const quoted = [...line.matchAll(/"([^"]+)"/g)].map(m => m[1]);
    /* what is left outside the quotes is the rest of a mixed list (`until, "by then", ago, ...`) */
    const rest = line.replace(/"[^"]*"/g, ',').replace(/^\s*-\s*[A-Za-z]+\s*:/, '');
    const bare = rest.split(',').map(s => s.trim().replace(/^`+|`+$/g, '')).filter(s => s.length > 1);
    return quoted.concat(bare);
  };
  const vocab = grab('vocabulary'), examples = grab('examples');
  return { vocab, examples, items: vocab.concat(examples) };
}

/** an item as a matcher. A hyphen run becomes \S* so a masked spelling still matches its word:
 *  "shi-" finds "shi-" or "shit", and an item quoted with `f---in'` finds either mask or spelling. */
function rx(item) {
  const body = norm(item)
    .replace(/[.!?]+$/, '')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/-+/g, '\\S*')
    .replace(/ /g, '\\s+');
  return new RegExp('(^|[^\\p{L}])' + body + '(?![\\p{L}])', 'u');
}

/* ---- the track's own tells, read from its register file ----
   The tier is the `### **core**` heading over a family bullet (`- taboo: …`), which is the shape
   ADULT-REGISTER.md declares. `formal` and `locale` are not tiers: they are the words the voice does
   not use, so they are collected apart and reported as tells. */

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
    const t = out.tiers[tier] = out.tiers[tier] || [];
    for (const w of items) t.push({ w, fam });
  }
  for (const k of Object.keys(out.tiers)) for (const o of out.tiers[k]) o.re = rx(o.w);
  for (const k of Object.keys(out.neg)) out.neg[k] = out.neg[k].map(w => ({ w, re: rx(w) }));
  return out;
}

/* ---- one page: does it work, what does it carry, what does it sound like ---- */

/* ---- the shapes of a claim nothing on the page can check ----
   The truth of a sentence is the author's job; what a machine can see is a claim that is unfalsifiable by
   construction. Printed, never failed: a hyperbole in a street voice is a real teaching defect, and the
   reader still decides. The bare `always`/`never` scan prose.mjs used is gone: it fired on ordinary prose. */
const CLAIM = [
  [/\b(no|not one|never a)\s+(human|person|one|word|sentence|student)\b[^.!?]{0,60}\b(has|have) ever\b|\bnobody has ever\b|\bno one has ever\b/i,
    'an absolute about all of history'],
  [/\b(every|all|no)\s+(single\s+)?phrasal verbs?\b/i, 'a claim about a whole class'],
  [/\b(the|this|that|a)\s+word\s+[^.!?]{0,40}\b(comes?|came|derives?|originates?|roots?)\b|\betymolog/i,
    'a history claim — name the source'],
  [/\btwins?\b/i, '"twin" is a label this repo does not use'],
  [/\b(helper|glue|little|small|function)\s+words?\b/i, 'a coined class name — say which word'],
  [/\bfamily unit\b/i, 'a coined class name — the roadmap says family'],
];

/** the real page with a stubbed login gate, so the engines run exactly as a signed-in student sees them */
function gate(html, track) {
  const email = 'qa@test.com', s = sig(email + track + SECRET);
  return html.replace('<head>', '<head><script>(function(){const store={};'
    + 'sessionStorage.setItem("gate",' + JSON.stringify(JSON.stringify({ email, track, teacher: true, sig: s })) + ');'
    + 'sessionStorage.getItem=k=>store[k]||null;sessionStorage.setItem=(k,v)=>{store[k]=v;};'
    + 'navigator.mediaDevices=navigator.mediaDevices||{};'
    + 'navigator.mediaDevices.getUserMedia=async()=>({getTracks:()=>[],getAudioTracks:()=>[]});'
    + '})();</script>');
}

async function inspect(base, track, n) {
  const abs = lessonFile(track, n);
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  const fails = [], console_ = [];
  const dom = new JSDOM(gate(fs.readFileSync(abs, 'utf8'), track), {
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

  const feeds = d.querySelectorAll('#feed');
  if (feeds.length !== 1) fails.push('#feed missing or duplicated (' + feeds.length + ')');
  else if (feeds[0].tagName !== 'TEXTAREA') fails.push('#feed is not a <textarea>');

  const noSay = [...d.querySelectorAll('.listen')].filter(b => !b.getAttribute('data-say')).length;
  if (noSay) fails.push(noSay + ' listen chip(s) without data-say — dead button');

  /* an unanchored control is never saved: the student answers and the answer goes nowhere */
  if (w.ansOf) {
    const un = [...d.querySelectorAll('input.gap, input[type="radio"], textarea')]
      .filter(el => el.id !== 'feed').filter(el => { const a = w.ansOf(el); return !a || !a.anchor; }).length;
    if (un) fails.push(un + ' answer control(s) resolve no anchor');
  }

  /* a block naming a game engine4 does not have never boots, and no geometry check can see it */
  const dead = [...d.querySelectorAll('.game[data-game]')].filter(g => !g.classList.contains('g4-ready')).length;
  if (dead) fails.push(dead + ' game block(s) never wired');

  console_.forEach(e => fails.push('console error: ' + e));

  const area = d.querySelector('.content-area');
  const h1 = area && area.querySelector('h1');
  /* coverage reads the AUTHORED page, so an answer key counts as the words in its sentence: a roadmap
     example is often the drill's own gap, and its word lives in data-answer, never in the text. */
  let text = norm(area ? area.textContent : d.body.textContent);
  if (area) {
    const clone = area.cloneNode(true);
    clone.querySelectorAll('input[data-answer]').forEach(el => {
      el.replaceWith(d.createTextNode(' ' + (el.getAttribute('data-answer') || '') + ' '));
    });
    clone.querySelectorAll('script, style').forEach(el => el.remove());
    /* tags become a space, so two cells side by side do not glue into one word (`now` + `in an hour`) */
    text = norm(clone.innerHTML.replace(/<[^>]*>/g, ' '));
  }
  /* claims: prose the student reads as fact, dialogue excluded because a character may be wrong on purpose */
  const hits = [];
  if (area) {
    for (const el of area.querySelectorAll('p, td, th, li, .lead')) {
      if (el.querySelector('p, td, th, li')) continue;
      if (el.closest('.dialog')) continue;
      const t = el.textContent.replace(/\s+/g, ' ').trim();
      for (const [re, why] of CLAIM) {
        const m = t.match(re);
        if (m) hits.push('"' + m[0].trim() + '" (' + why + ')');
      }
    }
  }
  const out = { fails, text, claims: hits, h1: h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '' };
  w.close();
  return out;
}
/* ---- the run ---- */

const named = pickNumbers();
const strict = hasTrackFlag();
const tracks = pickVoiceTracks();
if (!tracks.length) { console.log('✅ nothing touched — name a track (--track=adult 28) or --all'); process.exit(0); }
const ghosts = missingTargets(tracks, named);
if (ghosts.length) { console.log('❌ lesson ' + ghosts.join(', ') + ' does not exist in ' + scopeLabel(tracks)); process.exit(1); }

const scope = hasAllFlag() ? null : touchedScope();
const server = serve();
await new Promise(r => server.listen(0, r));
const base = 'http://localhost:' + server.address().port;
mockFetch();

let failed = 0, warned = 0, pages = 0;
const warns = [];
for (const track of tracks) {
  const list = pickVoiceLessons(track, scope);
  if (!list.length) {
    console.log('— ' + track + ': nothing authored in this run (name lessons, --lessons=21-25, or --all)');
    continue;
  }
  console.log('— ' + track + ' ' + list.join(', '));
  const T = tells(track);
  for (const n of list) {
    const abs = lessonFile(track, n);
    if (!abs) { if (strict) { console.log('❌ ' + track + '/lesson' + n + ' page not found'); failed++; } continue; }
    pages++;
    const r = await inspect(base, track, n);
    const fails = r.fails.slice();

    /* half of the lesson's own roadmap block: vocabulary items + example strings, any mix.
       Under the bar is a WARN — printed, not failed: a page that half-covers its lesson still teaches
       it. NONE of the items is a FAIL: the page is then not this lesson at all, which is what a page
       numbered for one roadmap entry but authored from another looks like. */
    const rm = roadmap(track, n);
    let cover, warn = '';
    if (!rm) { cover = 'roadmap: no [' + n + '] block'; warn = 'no roadmap block — not measured'; }
    else {
      const hit = rm.items.filter(i => rx(i).test(r.text));
      const need = Math.ceil(rm.items.length / 2);
      const miss = rm.items.filter(i => hit.indexOf(i) < 0);
      cover = 'items ' + hit.length + '/' + rm.items.length + ' (need ' + need + ')'
        + (miss.length ? ' · missing ' + miss.map(m => '"' + m + '"').join(' ') : '');
      /* an exam entry lists `- Vocabulary: -` and `- Examples: -`: nothing to measure, not a mismatch */
      if (!rm.items.length) { cover = 'roadmap: this entry lists no items to measure'; warn = 'no items to measure'; }
      else if (!hit.length) {
        cover += '  ← none of this lesson';
        fails.push('roadmap: 0/' + rm.items.length + ' items — the page does not teach lesson ' + n);
      } else if (hit.length < need) {
        cover += '  ← under the bar (warn)';
        warn = 'under the bar — items ' + hit.length + '/' + rm.items.length + ' (need ' + need + ')';
      }
    }
    if (warn) warns.push(track + '/lesson' + n + ': ' + warn);

    /* the register, printed tier by tier: evidence for the reader, never a verdict */
    const reg = [];
    for (const tier of ['core', 'common', 'situational', 'rare', 'text']) {
      const set = T.tiers[tier];
      if (!set) continue;
      const h = set.filter(o => o.re.test(r.text));
      if (!h.length) continue;
      const fams = h.reduce((a, o) => (a[o.fam] = (a[o.fam] || 0) + 1, a), {});
      reg.push(tier + ' ' + h.length + ' (' + Object.keys(fams).map(f => f + ' ' + fams[f]).join(' · ') + ')');
    }
    const neg = Object.keys(T.neg).map(k => {
      const h = T.neg[k].filter(o => o.re.test(r.text));
      return h.length ? k + ' ' + h.map(o => '"' + o.w + '"').join(' ') : '';
    }).filter(Boolean);
    if (!T.file) reg.push('no ' + track.toUpperCase() + '-REGISTER.md');
    else if (!Object.keys(T.tiers).length) reg.push('no tier heading — nothing to compare');

    const line = (cover + ' · register ' + (reg.join(' · ') || 'neutral')
      + (neg.length ? ' · tells ' + neg.join(' · ') : '')
      + (r.claims.length ? ' · claims ' + r.claims.length + ': ' + r.claims.slice(0, 2).join(' · ') : '')
      + (r.h1 ? ' · h1 ' + r.h1.length : '')).trim();
    if (fails.length) { failed++; console.log('❌ ' + track + '/lesson' + n + '\n     ' + line); fails.forEach(f => console.log('     - ' + f)); }
    else if (warn) { warned++; console.log('⚠ ' + track + '/lesson' + n + '\n     ' + line); }
    else console.log('✅ ' + track + '/lesson' + n + '\n     ' + line);
  }
}
server.close();
if (warns.length) console.log('\n⚠ ' + warned + ' page(s) warned, not failed:\n   ' + warns.join('\n   '));
console.log('\n' + (failed
  ? '❌ ' + failed + ' of ' + pages + ' page(s) failed' + (warned ? ' · ' + warned + ' warned' : '')
  : '✅ ' + pages + ' page(s): loads, saves every answer' + (warned ? ' · ' + warned + ' warned' : '')
    + '; roadmap coverage and register are printed above'));
process.exit(failed ? 1 : 0);
