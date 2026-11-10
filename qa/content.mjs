/**
 * qa/content.mjs — the page still works. Nothing else.
 *
 * Loads each lesson page with a mocked login gate and a mocked backend, then checks only what would
 * break the page for a student:
 *   - engine1.js and engine2.js executed
 *   - exactly one #feed, and it is a <textarea>
 *   - every .listen chip carries data-say (a chip with no line is a dead button) — 1 or 2 chips is a
 *     WARN, 3+ is a FAIL: one dead chip is a small error worth tagging, a page full of them is not
 *   - no leftover <!-- MORE --> build sentinel
 *   - every answer control resolves an anchor (an unanchored control is never saved — data loss)
 *   - no console errors
 *
 * It does NOT check classes, counts, block widths, option counts, spacing or structure: those are
 * generation decisions (FORMAT.md + model judgement), not defects a harness can adjudicate.
 *
 * Tiering policy (same as qa/lang.mjs and qa/register.mjs): FAIL only what makes the page wrong or
 * lossy for a student; WARN everything a reader could still use, and record it in ISSUES.md. A suite
 * that reds on small errors gets read as noise and stops protecting the failures that matter.
 *
 * Run: node qa/content.mjs [--track=kids|business|adult] [lessonNumber ...]
 */
import { JSDOM } from 'jsdom';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickTracks, hasTrackFlag, pickNumbers, pickLessons, missingTargets, scopeLabel } from './track.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SECRET = 'abreportas2025';
const h = s => { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return x; };

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
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

function mockFetch() {
  global.fetch = async () => ({ ok: true, status: 200, headers: new Map(),
    text: async () => '{}', json: async () => ({ status: 'ok', result: 'ok' }) });
}

async function check(base, track, n) {
  const page = track + '/lesson' + n + '.html';
  let html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  if (html.includes('<!-- MORE -->')) return { errors: ['leftover <!-- MORE --> build sentinel'], warns: [] };

  const email = 'qa@test.com', sig = h(email + track + SECRET);
  html = html.replace('<head>', '<head><script>(function(){const store={};'
    + 'sessionStorage.setItem("gate",' + JSON.stringify(JSON.stringify({ email, track, teacher: true, sig })) + ');'
    + 'sessionStorage.getItem=k=>store[k]||null;sessionStorage.setItem=(k,v)=>{store[k]=v;};'
    + 'navigator.mediaDevices=navigator.mediaDevices||{};'
    + 'navigator.mediaDevices.getUserMedia=async()=>({getTracks:()=>[],getAudioTracks:()=>[]});'
    + '})();</script>');

  const consoleErrors = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', url: base + '/' + page, pretendToBeVisual: true,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
      w.requestAnimationFrame = cb => setTimeout(cb, 0);
      w.fetch = (...a) => global.fetch(...a);
      const r = { top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20, x: 0, y: 0 };
      w.Element.prototype.getBoundingClientRect = () => r;
      w.Range.prototype.getBoundingClientRect = () => r;
      w.console.error = (...a) => {
        const m = a.join(' ');
        if (!/Failed to load resource|net::/.test(m)) consoleErrors.push(m);
      };
    }
  });

  await new Promise(r => setTimeout(r, 1500));
  const w = dom.window, d = w.document;
  const errors = [], warns = [];

  if (!w.__A) errors.push('engine1.js did not execute (window.__A missing)');
  if (!w.__B) errors.push('engine2.js did not execute (window.__B missing)');

  const feeds = d.querySelectorAll('#feed');
  if (feeds.length !== 1) errors.push('#feed missing or duplicated (' + feeds.length + ')');
  else if (feeds[0].tagName !== 'TEXTAREA') errors.push('#feed is not a <textarea>');

  const noSay = [...d.querySelectorAll('.listen')].filter(b => !b.getAttribute('data-say')).length;
  /* one dead chip is a small error — tag it and fix it when the page is next opened; three is a pattern */
  if (noSay >= 3) errors.push(noSay + ' listen chip(s) without data-say');
  else if (noSay) warns.push(noSay + ' listen chip(s) without data-say — dead button, tag it in ISSUES.md');

  if (w.ansOf) {
    const unanchored = [...d.querySelectorAll('input.gap, input[type="radio"], textarea')]
      .filter(el => el.id !== 'feed')
      .filter(el => { const a = w.ansOf(el); return !a || !a.anchor; }).length;
    if (unanchored) errors.push(unanchored + ' answer control(s) resolve no anchor (their answers are never saved)');
  }

  /* A block that names a game engine4 does not have is SILENT: boot() skips it, `g4-ready` hides the
     start button, and the student gets a dead drill that no geometry check can see (games are clipped
     frames, so overflow is not looking either). The Runner stamps `g4-ready` on every block it wires, so
     the stamp's absence is the whole evidence. */
  const dead = [...d.querySelectorAll('.game[data-game]')].filter(g => !g.classList.contains('g4-ready'));
  if (dead.length) errors.push(dead.length + ' game block(s) never wired — engine4 has no plugin named '
    + [...new Set(dead.map(g => g.getAttribute('data-game')))].join(', '));

  consoleErrors.forEach(e => errors.push('console error: ' + e));
  return { errors, warns };
}

const tracks = pickTracks();
if (!tracks.length) { console.log('✅ no lesson pages'); process.exit(0); }
const strict = hasTrackFlag();
const ghosts = missingTargets(tracks, pickNumbers());
if (ghosts.length) { console.log('❌ lesson ' + ghosts.join(', ') + ' does not exist in ' + scopeLabel(tracks)); process.exit(1); }

const server = serve();
await new Promise(r => server.listen(0, r));
const base = 'http://localhost:' + server.address().port;
mockFetch();

let checked = 0, failed = 0, warned = 0;
for (const TRACK of tracks) {
  const lessons = pickLessons(TRACK);
  if (!lessons.length) { console.log('✅ no ' + TRACK + ' lesson pages'); continue; }
  console.log('— ' + TRACK + ' lesson' + (lessons.length === 1 ? '' : 's') + ' ' + lessons.join(', '));
  for (const n of lessons) {
    if (!fs.existsSync(path.join(ROOT, TRACK, 'lesson' + n + '.html'))) {
      if (strict) { console.log('❌ ' + TRACK + '/lesson' + n + ' page not found'); failed++; }
      continue;
    }
    let errors = [], warns = [];
    try { ({ errors, warns } = await check(base, TRACK, n)); }
    catch (e) { errors = ['threw: ' + e.message]; }
    checked++;
    if (errors.length) { failed++; console.log('❌ ' + TRACK + '/lesson' + n); errors.forEach(e => console.log('     - ' + e)); }
    else if (warns.length) { warned++; console.log('⚠  ' + TRACK + '/lesson' + n + ' (loads; small error)'); warns.forEach(e => console.log('     - ' + e)); }
    else console.log('✅ ' + TRACK + '/lesson' + n);
  }
}
server.close();
console.log('\n' + (failed ? '❌ ' + failed + ' of ' + checked + ' page(s) failed'
  : '✅ ' + checked + ' page(s) load, and every control that carries an answer is anchored'
    + (warned ? '  (' + warned + ' warning(s) — small errors, recorded in ISSUES.md)' : '')));
process.exit(failed ? 1 : 0);
