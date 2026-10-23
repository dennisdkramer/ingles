/**
 * qa/content.mjs — content/structure harness for every business lesson.
 *
 * Loads each lesson with a mocked sessionStorage gate + mocked fetch, lets the page
 * inline engine1.js/engine2.js, and then checks:
 *   - window.__A / window.__B (both engines executed)
 *   - element counts: .chart, .panel, .listen, input.gap, input[type=radio], #feed
 *   - every .listen carries data-say (audio presence)
 *   - #feed is a <textarea>
 *   - no leftover <!-- MORE --> build sentinel
 *
 * Run with: node qa/content.mjs
 */

import { JSDOM } from 'jsdom';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function checkLesson(serverUrl, n) {
  const pageName = 'business/lesson' + n + '.html';
  const email = 'qa@test.com';
  const track = 'business';
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

  if (counts.chart < 1) errors.push('no .chart table found');
  if (counts.panel < 2) errors.push('too few .panel groups (expected >= 2)');
  if (counts.listen < 1) errors.push('no .listen audio chip found');
  if (counts.gap < 1) errors.push('no input.gap found');
  if (counts.radio < 4) errors.push('too few radios (expected >= 4)');
  if (counts.feed !== 1) errors.push('#feed missing or duplicated (expected exactly 1)');
  if (counts.trw !== 1) errors.push('#trw translation box missing or duplicated (expected exactly 1)');
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

  // stacked-radio save/restore round-trip: seed a row, renderAnswers must re-check the radio
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

  errors.push(...consoleErrors.filter(e => !errors.includes(e)));
  return { lesson: n, errors, counts };
}

async function main() {
  console.log('🧪 Content structure harness — business lessons 1..34\n');
  const server = createServer();
  const PORT = 8766;
  await new Promise(r => server.listen(PORT, r));
  const serverUrl = 'http://localhost:' + PORT;
  mockFetch();

  const results = [];
  for (let n = 1; n <= 34; n++) {
    try {
      const r = await checkLesson(serverUrl, n);
      results.push(r);
      const ok = r.errors.length === 0;
      console.log((ok ? '✅' : '❌') + ' lesson' + n +
        '  chart=' + (r.counts.chart ?? '-') + ' panel=' + (r.counts.panel ?? '-') +
        ' listen=' + (r.counts.listen ?? '-') + ' gap=' + (r.counts.gap ?? '-') +
        ' radio=' + (r.counts.radio ?? '-') + ' feed=' + (r.counts.feed ?? '-'));
      if (!ok) r.errors.forEach(e => console.log('     - ' + e));
    } catch (e) {
      results.push({ lesson: n, errors: [e.message] });
      console.log('❌ lesson' + n + ' threw: ' + e.message);
    }
  }
  server.close();
  const failed = results.filter(r => r.errors.length);
  console.log('\n' + (failed.length ? ('❌ ' + failed.length + ' lesson(s) FAILED') : '✅ ALL LESSONS PASSED'));
  process.exit(failed.length ? 1 : 0);
}

main().catch(e => { console.error('[FATAL]', e); process.exit(1); });

