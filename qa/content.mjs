/**
 * qa/content.mjs — content/structure harness for the lesson pages.
 *
 * Loads each lesson with a mocked sessionStorage gate + mocked fetch, lets the page
 * inline engine1.js/engine2.js, and then checks:
 *   - window.__A / window.__B (both engines executed)
 *   - element counts: .chart, .panel, .listen, input.gap, input[type=radio], #feed
 *   - every .listen carries data-say (audio presence)
 *   - #feed is a <textarea>
 *   - no leftover <!-- MORE --> build sentinel
 *
 * Run with: node qa/content.mjs [--track=kids|business|adult] [lessonNumber ...]
 *           (no numbers = every lesson page that exists; no --track = EVERY track with pages)
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
function h(s) { let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) | 0; return x; }

function createServer() {
  return http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];
    let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      const ext = path.extname(filePath);
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

function mockFetch() {
  global.fetch = async (url, options = {}) => {
    const urlStr = String(url);
    if (options && options.body && urlStr.includes('script.google.com')) {
      return { ok: true, status: 200, text: async () => '{}', json: async () => ({ result: 'ok' }), headers: new Map() };
    }
    if (urlStr.includes('googleapis.com') || urlStr.includes('fonts.') || urlStr.includes('script.google.com') || urlStr.includes('.googleapis')) {
      return { ok: false, status: 0, text: async () => '', json: async () => ({}), headers: new Map() };
    }
    if (urlStr.includes('action=')) {
      return { ok: true, status: 200, text: async () => '{"status":"ok"}', json: async () => ({ status: 'ok' }), headers: new Map() };
    }
    return { ok: true, status: 200, text: async () => '', json: async () => ({}), headers: new Map() };
  };
}

async function checkLesson(serverUrl, track, n) {
  const pageName = track + '/lesson' + n + '.html';
  const email = 'qa@test.com';
  const sig = h(email + track + SECRET);
  const filePath = path.join(ROOT, pageName);
  let html = fs.readFileSync(filePath, 'utf8');

  if (html.includes('<!-- MORE -->')) {
    return { lesson: n, errors: ['leftover <!-- MORE --> build sentinel found'], counts: {} };
  }

  const sessionMock = `
  <script>
  (function(){
    const SIG=${sig};
    const gateData={email:"${email}",track:"${track}",teacher:true,sig:SIG};
    const store={};
    window.sessionStorage={
      getItem:k=>store[k]||null,
      setItem:(k,v)=>{store[k]=v;},
      get length(){return Object.keys(store).length;},
      key:i=>Object.keys(store)[i]||null,
      removeItem:k=>{delete store[k];},
      clear:()=>{for(const k in store)delete store[k];}
    };
    sessionStorage.setItem('gate',JSON.stringify(gateData));
    navigator.mediaDevices=navigator.mediaDevices||{};
    navigator.mediaDevices.getUserMedia=async()=>({getTracks:()=>[],getAudioTracks:()=>[]});
  })();
  </script>`;
  html = html.replace('<head>', '<head>' + sessionMock);

  const consoleErrors = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: serverUrl + '/' + pageName,
    pretendToBeVisual: true,
    beforeParse(window) {
      try { Object.defineProperty(window.document, 'hidden', { value: true, configurable: true }); } catch (e) {}
      window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
      window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
      window.cancelAnimationFrame = (id) => clearTimeout(id);
      window.fetch = (...args) => global.fetch(...args);
      const mockRect = { top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20, x: 0, y: 0 };
      window.Element.prototype.getBoundingClientRect = function () { return mockRect; };
      window.HTMLElement.prototype.getBoundingClientRect = function () { return mockRect; };
      window.Range.prototype.getBoundingClientRect = function () { return mockRect; };
      delete window.localStorage;
      const ls = {};
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: k => ls[k] || null,
          setItem: (k, v) => { ls[k] = String(v); },
          removeItem: k => { delete ls[k]; },
          clear: () => { for (const k in ls) delete ls[k]; },
          get length() { return Object.keys(ls).length; },
          key: i => Object.keys(ls)[i] || null
        },
        writable: true,
        configurable: true
      });
      window.console.error = (...a) => {
        const m = a.join(' ');
        if (!m.includes('Failed to load resource') && !m.includes('net::')) consoleErrors.push('[ERROR] ' + m);
      };
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  const w = dom.window;
  const d = w.document;
  const errors = [];
  if (!w.__A) errors.push('__A not set (engine1.js did not execute)');
  if (!w.__B) errors.push('__B not set (engine2.js did not execute)');

  const counts = {
    chart: d.querySelectorAll('.chart').length,
    panel: d.querySelectorAll('.panel').length,
    listen: d.querySelectorAll('.listen').length,
    gap: d.querySelectorAll('input.gap').length,
    radio: d.querySelectorAll('input[type=radio]').length,
    feed: d.querySelectorAll('#feed').length,
    trw: d.querySelectorAll('#trw').length
  };

  // No minimum element counts: charts, panels, audio chips, gaps and radios are all CONDITIONAL
  // content types (a lesson may legitimately use none of them). Only structural integrity of the
  // elements that ARE present is checked below.
  if (counts.feed !== 1) errors.push('#feed missing or duplicated (expected exactly 1)');
  if (counts.trw > 1) errors.push('#trw translation box duplicated (expected 0 or 1)');
  const feedEl = d.querySelector('#feed');
  if (feedEl && feedEl.tagName !== 'TEXTAREA') errors.push('#feed is not a <textarea>');
  const listens = d.querySelectorAll('.listen');
  let noSay = 0;
  listens.forEach(l => { if (!l.getAttribute('data-say')) noSay++; });
  if (noSay > 0) errors.push(noSay + ' .listen chip(s) missing data-say');


  // radio anchor resolution (flat AND stacked MCQ layouts): every radio must resolve a stem/anchor
  const radioRes = JSON.parse(w.eval(`JSON.stringify((function(){
    var nulls = 0, total = 0;
    document.querySelectorAll('input[type="radio"]').forEach(function(r){
      total++;
      var o = ansOf(r);
      if (!o || !o.anchor) nulls++;
    });
    return { nulls: nulls, total: total };
  })())`));
  if (radioRes && radioRes.nulls > 0) errors.push(radioRes.nulls + ' of ' + radioRes.total + ' radios resolve no anchor');

   // answer anchoring (EVERY gap / radio / textarea): a control that resolves no anchor is never saved or
   // restored (data loss — B-I12), and two controls that resolve the same anchor AND the same place overwrite
   // each other (two gaps alone in one table row, before the ordinal tie-breaker). Both are hard errors: they
   // lose a student's answer silently, which no layout finding would ever show.
   const ansRes = JSON.parse(w.eval(`JSON.stringify((function(){
     var noAnchor = 0, total = 0, seen = {};
     document.querySelectorAll('input.gap, input[type="radio"], textarea').forEach(function(el){
       if (el.id === 'feed') return;
       total++;
       var o = ansOf(el);
       if (!o || !o.anchor) { noAnchor++; return; }
       if (el.type === 'radio') return;                 /* a radio GROUP legitimately shares one stem */
       var p = ansPosOf(o);
       var key = o.anchor + '\\u0000' + (p ? (p.b + ':' + p.o) : 'no-place');
       seen[key] = (seen[key] || 0) + 1;
     });
     var clash = Object.keys(seen).filter(function(k){ return seen[k] > 1; })
       .map(function(k){ return k.split('\\u0000')[0].slice(0, 40); });
     return { total: total, noAnchor: noAnchor, clash: clash };
   })())`));
   if (ansRes && ansRes.noAnchor > 0) errors.push(ansRes.noAnchor + ' of ' + ansRes.total
     + ' answer control(s) resolve NO anchor — their answers are never saved (data loss)');
   if (ansRes && ansRes.clash.length) errors.push(ansRes.clash.length
     + ' answer anchor(s) used by two controls in the SAME place — they overwrite each other: '
     + ansRes.clash.slice(0, 3).map(a => '«' + a + '»').join(', ') + (ansRes.clash.length > 3 ? ', …' : ''));


  // stacked-radio save/restore round-trip: seed a row, renderAnswers must re-check the radio

   // EVERY gap save/restore round-trip: seed one row per gap (through ansOf + ansPosOf, exactly as ansSet
   // would key it), blank the fields, let renderAnswers restore, and require each gap to get ITS OWN value
   // back — the check that two gaps sharing a prompt cannot silently trade or overwrite answers.
   const gapRt = JSON.parse(w.eval(`JSON.stringify((function(){
     var gaps = []; document.querySelectorAll('input.gap').forEach(function(g){ gaps.push(g); });
     if (!gaps.length) return null;
     var ids = [];
     gaps.forEach(function(g, i){
       var o = ansOf(g);
       if (!o || !o.anchor) return;
       var p = ansPosOf(o), id = 'qa_gap_' + i;
       ids.push(id);
       layer.push({ id: id, type: 'answer', anchor: o.anchor,
         data: p ? JSON.stringify({ v: 'qa' + i, b: p.b, o: p.o }) : JSON.stringify({ v: 'qa' + i }) });
     });
     gaps.forEach(function(g){ g.value = ''; document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
     renderAnswers();
     var bad = 0;
     gaps.forEach(function(g, i){ if (g.value !== 'qa' + i) bad++; });
     layer = layer.filter(function(r){ return ids.indexOf(r.id) < 0; });
     renderAnswers();
     return { bad: bad, total: gaps.length };
   })())`));
   if (gapRt && gapRt.bad > 0) errors.push(gapRt.bad + ' of ' + gapRt.total
     + ' gap(s) did not get their own answer back (they share an anchor/place with another gap)');

  const stackedRt = JSON.parse(w.eval(`JSON.stringify((function(){
    var r = document.querySelector('.qgrid.stack input[type="radio"]');
    if (!r) return null;
    var o = ansOf(r);
    if (!o || !o.anchor) return { ok: false };
    var p = ansPos(o.posEl);
    if (!p) return { ok: false };
    layer.push({ id: 'qa_stack_rt', type: 'answer', anchor: o.anchor, data: JSON.stringify({ v: r.value, b: p.b, o: p.o }) });
    renderAnswers();
    var restored = r.checked;
    layer = layer.filter(function(x){ return x.id !== 'qa_stack_rt'; });
    renderAnswers();
    return { ok: restored };
  })())`));
  if (stackedRt && stackedRt.ok === false) errors.push('stacked radio save/restore round-trip failed');

  // duplicate answer anchors (HINT, non-failing): two controls that normalise to the same anchor text are
  // only told apart by the {block,offset} tie-breaker, so re-ordering the page can make their saved answers
  // swap. A generation should still give every control its own prompt text.
  let dupAnchors = [];
  try {
    dupAnchors = JSON.parse(w.eval(`JSON.stringify((function(){
      var map = {}, i = 0;
      document.querySelectorAll('input.gap, input[type="radio"], textarea').forEach(function(el){
        if (el.id === 'feed') return;
        var o = ansOf(el);
        if (!o || !o.anchor) return;
        /* a radio GROUP is one control (its options legitimately share the stem) */
        var id = el.type === 'radio' ? ('radio:' + el.name) : ('field#' + (i++));
        (map[o.anchor] = map[o.anchor] || {})[id] = 1;
      });
      return Object.keys(map).filter(function(k){ return Object.keys(map[k]).length > 1; });
    })())`));
  } catch (e) { }
  const hints = [];
  if (dupAnchors.length) hints.push(dupAnchors.length + ' anchor(s) shared by more than one control: '
    + dupAnchors.slice(0, 4).map(a => '«' + String(a).slice(0, 34) + '»').join(', ')
    + (dupAnchors.length > 4 ? ', …' : ''));

  errors.push(...consoleErrors.filter(e => !errors.includes(e)));
  return { lesson: n, errors, counts, hints };
}

async function main() {
  // scope: every track with pages, or the one --track names. No numbers = whatever pages exist; a named
  // number that exists in no track in scope is a hard error (never read as "nothing to audit").
  const tracks = pickTracks();
  const strict = hasTrackFlag();
  if (!tracks.length) { console.log('✅ no lesson pages in any track'); process.exit(0); }
  const ghosts = missingTargets(tracks, pickNumbers());
  if (ghosts.length) { console.log('❌ lesson ' + ghosts.join(', ') + ' does not exist in ' + scopeLabel(tracks)); process.exit(1); }

  const server = createServer();
  const PORT = 0; // ephemeral: a leftover or parallel run can never collide on a fixed port
  await new Promise(r => server.listen(PORT, r));
  const serverUrl = 'http://localhost:' + server.address().port;
  mockFetch();

  const results = [];
  for (const TRACK of tracks) {
    const lessons = pickLessons(TRACK);
    if (!lessons.length) { console.log('✅ no ' + TRACK + ' lesson pages to check'); continue; }
    console.log((tracks.length > 1 ? '\n— ' : '🧪 Content structure harness — ') + TRACK + ' lesson'
      + (lessons.length === 1 ? '' : 's') + ' ' + lessons.join(', '));
    for (const n of lessons) {
      if (!fs.existsSync(path.join(ROOT, TRACK, 'lesson' + n + '.html'))) {
        const msg = 'page not found: ' + TRACK + '/lesson' + n + '.html';
        if (strict) { results.push({ track: TRACK, lesson: n, errors: [msg] }); console.log('❌ ' + TRACK + '/lesson' + n + '  page not found'); }
        else console.log('(page missing, skipped) ' + TRACK + '/lesson' + n);
        continue;
      }
      try {
        const r = await checkLesson(serverUrl, TRACK, n);
        r.track = TRACK;
        results.push(r);
        const ok = r.errors.length === 0;
        console.log((ok ? '✅' : '❌') + ' ' + TRACK + '/lesson' + n +
          '  chart=' + (r.counts.chart ?? '-') + ' panel=' + (r.counts.panel ?? '-') +
          ' listen=' + (r.counts.listen ?? '-') + ' gap=' + (r.counts.gap ?? '-') +
          ' radio=' + (r.counts.radio ?? '-') + ' feed=' + (r.counts.feed ?? '-'));
        if (!ok) r.errors.forEach(e => console.log('     - ' + e));
        if (r.hints && r.hints.length) r.hints.forEach(hy => console.log('     (hint) ' + hy));
      } catch (e) {
        results.push({ track: TRACK, lesson: n, errors: [e.message] });
        console.log('❌ ' + TRACK + '/lesson' + n + ' threw: ' + e.message);
      }
    }
  }
  server.close();
  const failed = results.filter(r => r.errors.length);
  console.log('\n' + (results.length ? results.length + ' page(s) checked, ' + scopeLabel(tracks) + ' — ' : '')
    + (failed.length ? ('❌ ' + failed.length + ' lesson(s) FAILED') : '✅ ALL LESSONS PASSED'));
  process.exit(failed.length ? 1 : 0);
}

main().catch(e => { console.error('[FATAL]', e); process.exit(1); });

