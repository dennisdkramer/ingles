#!/usr/bin/env node
// qa/batchcheck.mjs — the ledger's rules, checked against the ledger and the pages.
//
// The ledger is <track>/BATCH-RECORD.md. One line per lesson, appended in two phases:
//   pass 1 writes the sections (key, subject, device) and their block subjects, and the quiz;
//   pass 2 appends the elements it built, the quiz's elements, and the register score.
//
//   L07 | S1-rul@chart:rsn>ex>con>rul | S2-voc:mng>voc>mng | Q:rul>mng>rul>ex | el:dialoggap:3,mc:1 | qel:mc:1,flip:1 | reg:3/5
//
// Rules (a window counts the current lesson and the ones before it):
//   novelty   from lesson 2 — >=1 element the previous 3 lessons did not use; skipped when those
//             lessons already name the whole palette, since then nothing is fresh and no markup repairs it
//   churn     from lesson 10 — >=60% of the palette inside any 5 consecutive lessons
//   coverage  from lesson 10 — every element inside any 10 consecutive lessons
//   quiz      from lesson 3 — no 3 identical subjects in a row, >=1 element the previous 2 quizzes did not use
//   dominance every lesson — no element over half of that lesson's activity blocks
//   devices   every lesson — no teaching device in more than max(1, floor(0.35 x teaching sections)) sections
//   subjects  4 blocks in a row repeated inside one section fails; 3 warns; a repeat straddling 2+ sections is ignored
//   rhythm    the same 2 subjects in a row in every teaching section fails; 4 times or 60% warns
//   lessons   4 section-subjects in a row identical to a recent lesson fails; 3 warns
//   locale    2 occurrences of a register's locale word warn; 3 or more fail
//   portuguese  Portuguese that appears unmarked is a warning — it is marked .pt so it can be identified
//   register  sections judged in-register / all sections: <60% fails, <75% warns
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { authoredLessons } from './track.mjs';

const ROOT = process.cwd();
// the palette is the map's own element ids: a lesson names the element it built, and the markup box
// it copied is the same name. A game is a skin over one of these, never an element of its own.
const PALETTE = ['chunks', 'stripgaps', 'chartanswer', 'dialoggap', 'mc', 'matching',
  'correction', 'fill', 'translation', 'dictation', 'flip', 'map'];
const SUBJECTS = ['rul', 'rsn', 'ex', 'con', 'exc', 'voc', 'mng', 'prn', 'tim', 'soc', 'rcp'];
const NOVEL_WINDOW = 3, CHURN_WINDOW = 5, COVER_WINDOW = 10, QUIZ_WINDOW = 2;
const CHURN_SHARE = 0.6, MATURE_FROM = 10;
const REG_FAIL = 0.6, REG_WARN = 0.75, DEVICE_SHARE = 0.35;
// high-frequency Portuguese: the only cheap signal a page's explanation is carried in the student's
// language. Never a failure — the rule above it decides when Portuguese belongs on the page.
const PT_WORDS = new Set(['que', 'não', 'nao', 'para', 'você', 'voce', 'isso', 'uma', 'com', 'do', 'da',
  'seu', 'sua', 'mais', 'como', 'mas', 'sim', 'muito', 'aqui', 'agora', 'então', 'entao', 'também',
  'tambem', 'por', 'dos', 'das', 'ao', 'se', 'já', 'ja', 'tá', 'ta', 'pra', 'né', 'ne', 'é', 'ser', 'tem']);

const fails = [];
const warns = [];
const sepOpen = [];
const fail = (where, msg) => fails.push(`${where} — ${msg}`);
const warn = (where, msg) => warns.push(`${where} — ${msg}`);

function parseEls(seg) {
  const out = {};
  for (const part of seg.split(',').map(s => s.trim()).filter(Boolean)) {
    const [name, n] = part.split(':');
    if (!PALETTE.includes(name)) { warn('ledger', `unknown element "${name}"`); continue; }
    out[name] = (out[name] || 0) + (n ? Number(n) : 1);
  }
  return out;
}

function parseRow(line) {
  const parts = line.split('|').map(s => s.trim());
  const head = parts.shift();
  const m = /^L(\d+)$/.exec(head);
  if (!m) return null;
  const row = { L: Number(m[1]), sections: [], quiz: null, el: {}, qel: {}, reg: null, sep: [], raw: line };
  for (const seg of parts) {
    if (seg.startsWith('el:')) { row.el = parseEls(seg.slice(3)); continue; }
    if (seg.startsWith('qel:')) { row.qel = parseEls(seg.slice(4)); continue; }
    if (seg.startsWith('reg:')) {
      const r = /^(\d+)\/(\d+)$/.exec(seg.slice(4).trim());
      if (r) row.reg = { good: Number(r[1]), total: Number(r[2]) };
      else warn(`L${row.L}`, `reg must read reg:good/total, found "${seg}"`);
      continue;
    }
    const q = /^Q:(.+)$/.exec(seg);
    if (q) { row.quiz = { blocks: q[1].split('>').map(s => s.trim()).filter(Boolean) }; continue; }
    if (seg.startsWith('sep:')) {
      row.sep = (row.sep || []).concat(seg.slice(4).trim());
      continue;
    }
    const s = /^S(\d+)-([a-z]{3})(?:@([a-z-]+))?:(.+)$/.exec(seg);
    if (!s) { warn(`L${row.L}`, `segment not understood: "${seg}"`); continue; }
    if (!SUBJECTS.includes(s[2])) warn(`L${row.L}`, `unknown subject "${s[2]}" in ${seg}`);
    row.sections.push({
      n: Number(s[1]), subject: s[2], device: s[3] || null,
      blocks: s[4].split('>').map(t => t.trim()).filter(Boolean)
    });
  }
  row.sections.sort((a, b) => a.n - b.n);
  for (const sec of row.sections) {
    for (const t of sec.blocks) if (!SUBJECTS.includes(t)) warn(`L${row.L}`, `unknown subject "${t}" in S${sec.n}`);
  }
  if (row.quiz) for (const t of row.quiz.blocks) if (!SUBJECTS.includes(t)) warn(`L${row.L}`, `unknown subject "${t}" in Q`);
  return row;
}

function readLedger(file) {
  const rows = [];
  let fence = false;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (/^\s*```/.test(line)) { fence = !fence; continue; }
    if (fence) continue;
    const t = line.trim();
    if (!t.startsWith('L')) continue;
    const row = parseRow(t);
    if (row) rows.push(row);
  }
  rows.sort((a, b) => a.L - b.L);
  return rows;
}

// ---- what the page says it did -------------------------------------------------------------
// a unit may declare data-activity="<element id>" on the element that holds the control; without it
// the markup is read heuristically and an unrecognised activity unit is reported as unattributed.
// A game is a skin: its inner list is read, so a reskinned gap counts as a gap.
function detectEl(unit) {
  if (unit.dataset.activity) return unit.dataset.activity;
  if (unit.querySelector('.flip')) return 'flip';
  if (unit.querySelector('.chips')) return 'chunks';
  if (unit.querySelector('textarea.write') && unit.querySelector('.listen')) return 'dictation';
  if (unit.querySelector('textarea.write')) return 'correction';
  if (unit.querySelector('.pt') && unit.querySelector('input.gap')) return 'translation';
  if (unit.querySelector('.seq .who') && unit.querySelector('input')) return 'dialoggap';
  const items = [...unit.querySelectorAll('.qitem')];
  if (items.some(i => i.querySelectorAll('input[type=radio]').length >= 3)) return 'mc';
  const gapN = unit.querySelectorAll('input.gap').length;
  if (gapN && unit.querySelector('table.chart')) return 'chartanswer';
  return null;
}

function pageScan(file, locale) {
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'));
  const doc = dom.window.document;
  const area = doc.querySelector('.content-area') || doc.body;
  const heads = [...area.children].filter(el => el.tagName === 'H2');
  const sections = heads.map((h, i) => {
    const nodes = [];
    for (let n = h.nextElementSibling; n && n.tagName !== 'H2'; n = n.nextElementSibling) nodes.push(n);
    const paras = nodes.flatMap(n => [...n.querySelectorAll('p')]).filter(p => !p.classList.contains('dim'));
    const words = paras.reduce((a, p) => a + p.textContent.trim().split(/\s+/).filter(Boolean).length, 0);
    const sents = paras.reduce((a, p) => a + Math.max(1, (p.textContent.match(/[.!?]+(\s|$)/g) || []).length), 0);
    return { n: i + 1, title: h.textContent.trim(), teaching: !(i === heads.length - 1 || /quiz|test/i.test(h.textContent)), words, sents };
  });
  const els = {};
  let unattributed = 0, activityBlocks = 0;
  const CTRL = 'input.gap,input[type=radio],input[type=checkbox],textarea,.chips,.flip,.game,.listen,.qitem';
  for (const u of area.querySelectorAll('[data-activity]')) {
    const t = u.dataset.activity;
    if (!PALETTE.includes(t)) { unattributed++; continue; }
    els[t] = (els[t] || 0) + 1;
    activityBlocks++;
  }
  for (const b of area.querySelectorAll('.block')) {
    if (!b.querySelector(CTRL)) continue;
    if (b.matches('[data-activity]') || b.querySelector('[data-activity]') || b.closest('[data-activity]')) continue;
    const t = detectEl(b);
    if (!t) {
      const composite = b.querySelector('.qitem,.chips,.flip,.game,.listen,textarea,.qopts,.opts,table.chart');
      if (!composite && b.querySelector('input.gap')) continue; // a lone field is a component, not an activity
      activityBlocks++; unattributed++; continue;
    }
    activityBlocks++;
    els[t] = (els[t] || 0) + 1;
  }
  const text = area.textContent.toLowerCase();
  const hits = [];
  for (const w of locale) {
    const re = new RegExp('(^|[^a-z])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z])', 'g');
    const n = (text.match(re) || []).length;
    if (n) hits.push({ word: w, n });
  }
  const words = text.match(/[a-zà-ÿ']+/g) || [];
  const ptTokens = words.filter(w => PT_WORDS.has(w)).length;
  const ptElems = area.querySelectorAll('.pt').length;
  // how much of the page is Portuguese: the words inside .pt against every word on the page
  const count = s => (s.match(/[a-zà-ÿ']+/gi) || []).length;
  const ptWords = [...area.querySelectorAll('.pt')].reduce((a, e) => a + count(e.textContent), 0);
  const allWords = count(area.textContent);
  return { els, unattributed, activityBlocks, sections, localeHits: hits, ptTokens, ptElems, ptWords, allWords };
}

function readLocale(track) {
  const f = path.join(ROOT, `${track.toUpperCase()}-REGISTER.md`);
  if (!fs.existsSync(f)) return [];
  const m = /[-–]\s*locale:\s*(.+)/i.exec(fs.readFileSync(f, 'utf8'));
  return m ? m[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];
}

// ---- the rules -----------------------------------------------------------------------------
const union = (rows, key) => rows.reduce((set, r) => {
  for (const k of Object.keys(r[key] || {})) set.add(k);
  return set;
}, new Set());

function longestRun(a, b) {
  let best = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      let k = 0;
      while (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) k++;
      if (k > best) best = k;
    }
  }
  return best;
}

function checkWindows(rows, where, inScope = () => true) {
  rows.forEach((row, i) => {
    if (!inScope(row)) return;
    const prev = rows.slice(Math.max(0, i - NOVEL_WINDOW), i);
    // an exam is written to reuse what the block taught; novelty and quiz-novelty are for teaching pages
    const isExam = row.sections.length > 1 && row.sections.every(s => s.subject === 'exc');
    if (prev.length && !isExam) {
      const used = union(prev, 'el');
      const fresh = Object.keys(row.el).filter(e => !used.has(e));
      // the rule asks for an element the window did not use; a window that already names the whole
      // palette leaves none to find, so the check is vacuous there and churn/coverage carry freshness
      if (!fresh.length && used.size < PALETTE.length) fail(where + row.L, `novelty: no element outside the previous ${prev.length} lessons — ${Object.keys(row.el).join(', ') || 'no elements'}`);
    }
    if (i + 1 < MATURE_FROM) return;
    const w5 = rows.slice(Math.max(0, i - CHURN_WINDOW + 1), i + 1);
    if (w5.length === CHURN_WINDOW) {
      const need = Math.ceil(CHURN_SHARE * PALETTE.length);
      const seen = union(w5, 'el').size;
      if (seen < need) fail(where + row.L, `churn: ${seen}/${PALETTE.length} elements inside the last ${CHURN_WINDOW} lessons, needs ${need}`);
    }
    const w10 = rows.slice(Math.max(0, i - COVER_WINDOW + 1), i + 1);
    if (w10.length === COVER_WINDOW) {
      const seen = union(w10, 'el');
      const missing = PALETTE.filter(e => !seen.has(e));
      if (missing.length) fail(where + row.L, `coverage: ${missing.join(', ')} absent from the last ${COVER_WINDOW} lessons`);
    }
  });
}

function checkQuiz(rows, where, inScope = () => true) {
  rows.forEach((row, i) => {
    if (!inScope(row)) return;
    if (!row.quiz) { warn(where + row.L, 'no quiz line (Q:…)'); return; }
    const t = row.quiz.blocks;
    for (let k = 2; k < t.length; k++) {
      if (t[k] === t[k - 1] && t[k] === t[k - 2]) fail(where + row.L, `quiz: "${t[k]}" three times in a row`);
    }
    const prev = rows.slice(Math.max(0, i - QUIZ_WINDOW), i).flatMap(r => Object.keys(r.qel || {}));
    const isExam = row.sections.length > 1 && row.sections.every(s => s.subject === 'exc');
    if (prev.length && !isExam) {
      const fresh = Object.keys(row.qel).filter(e => !prev.includes(e));
      if (!fresh.length) fail(where + row.L, `quiz: no element outside the previous ${QUIZ_WINDOW} quizzes`);
    }
  });
}

function checkBlocks(rows, where, inScope = () => true) {
  rows.forEach(row => {
    if (!inScope(row)) return;
    const total = Object.values(row.el).reduce((a, b) => a + b, 0);
    for (const [name, n] of Object.entries(row.el)) {
      if (n > Math.ceil(total / 2)) fail(where + row.L, `dominance: ${name} is ${n} of ${total} activity blocks`);
    }
    const teaching = row.sections.length;
    if (teaching > 3 && !(row.sep && row.sep.length)) {
      sepOpen.push(where + 'L' + row.L + ' (' + teaching + ')');
    }
    const cap = Math.max(1, Math.floor(DEVICE_SHARE * teaching));
    const devs = {};
    for (const s of row.sections) if (s.device) devs[s.device] = (devs[s.device] || 0) + 1;
    for (const [d, n] of Object.entries(devs)) {
      if (n > cap) fail(where + row.L, `devices: ${d} teaches ${n} of ${teaching} sections, cap ${cap}`);
    }
    const stream = [];
    row.sections.forEach((s, si) => s.blocks.forEach(t => stream.push({ t, si })));
    for (const n of [4, 3]) {
      const seen = new Map();
      for (let k = 0; k + n <= stream.length; k++) {
        const g = stream.slice(k, k + n).map(x => x.t).join('>');
        const span = stream[k + n - 1].si - stream[k].si;
        if (!seen.has(g)) seen.set(g, []);
        seen.get(g).push(span);
      }
      for (const [g, spans] of seen) {
        if (spans.length < 2 || spans.every(s => s >= 2)) continue;
        const msg = `subjects: "${g}" repeats`;
        if (n === 4) fail(where + row.L, msg); else warn(where + row.L, msg);
      }
    }
    if (teaching >= 3) {
      const grams = new Map();
      row.sections.forEach((s, si) => {
        for (let k = 0; k + 1 < s.blocks.length; k++) {
          const g = s.blocks[k] + '>' + s.blocks[k + 1];
          if (!grams.has(g)) grams.set(g, { n: 0, secs: new Set() });
          const rec = grams.get(g);
          rec.n++; rec.secs.add(si);
        }
      });
      for (const [g, rec] of grams) {
        if (rec.secs.size === teaching) fail(where + row.L, `rhythm: "${g}" runs in every section`);
        else if (rec.n >= 4 || rec.secs.size >= Math.ceil(0.6 * teaching)) warn(where + row.L, `rhythm: "${g}" in ${rec.secs.size} of ${teaching} sections, ${rec.n} times`);
      }
    }
  });
  rows.forEach((row, i) => {
    if (!inScope(row)) return;
    const seq = row.sections.map(s => s.subject);
    const exam = seq.length > 1 && seq.every(s => s === 'exc');
    for (const prev of rows.slice(Math.max(0, i - 3), i)) {
      const run = longestRun(seq, prev.sections.map(s => s.subject));
      if (exam) continue;   // an exam's parts are fixed by the roadmap, not chosen for variety
      if (run >= 4) fail(where + row.L, `order: ${run} section subjects in a row as in L${prev.L}`);
      else if (run === 3) warn(where + row.L, `order: 3 section subjects in a row as in L${prev.L}`);
    }
  });
}

function checkPage(row, scan, where) {
  const L = row.L;
  for (const e of Object.keys(row.el)) if (!scan.els[e]) warn(where + L, `ledger claims ${e}; the page has none`);
  for (const e of Object.keys(scan.els)) if (!row.el[e]) warn(where + L, `the page builds ${e} x${scan.els[e]}; the ledger does not`);
  if (scan.unattributed) warn(where + L, `${scan.unattributed} activity unit(s) with no element id — mark the element that holds the control with data-activity="<id>"`);
  const hits = scan.localeHits.reduce((a, h) => a + h.n, 0);
  const list = scan.localeHits.map(h => h.word + '×' + h.n).join(', ');
  if (hits >= 3) fail(where + L, `locale: ${list}`);
  else if (hits === 2) warn(where + L, `locale: ${list}`);
  // Portuguese is identified because it is marked, so Portuguese that is not marked is the defect
  if (scan.ptTokens >= 12 && scan.ptElems === 0)
    warn(where + L, `Portuguese appears (${scan.ptTokens} common words) but is not marked .pt`);
  if (!row.reg) warn(where + L, 'no register score (reg:good/total)');
  else {
    const r = row.reg.good / Math.max(1, row.reg.total);
    const pct = (r * 100).toFixed(0);
    if (row.reg.total !== scan.sections.length) warn(where + L, `register score covers ${row.reg.total} sections; the page has ${scan.sections.length}`);
    if (r < REG_FAIL) fail(where + L, `register: ${row.reg.good}/${row.reg.total} sections in voice, ${pct}%`);
    else if (r < REG_WARN) warn(where + L, `register: ${row.reg.good}/${row.reg.total} sections in voice, ${pct}%`);
  }
}

// ---- running -------------------------------------------------------------------------------
function runTrack(track) {
  const dir = path.join(ROOT, track);
  const ledger = path.join(dir, 'BATCH-RECORD.md');
  if (!fs.existsSync(ledger)) { console.log(`${track.padEnd(24)} no BATCH-RECORD.md`); return; }
  const rows = readLedger(ledger);
  const where = `${track} L`;
  const locale = readLocale(track);
  const scope = new Set(authoredLessons(track));
  const inScope = row => scope.has(row.L);
  checkWindows(rows, where, inScope);
  checkQuiz(rows, where, inScope);
  checkBlocks(rows, where, inScope);
  for (const row of rows) {
    if (!inScope(row)) continue;
    const page = fs.readdirSync(dir).find(f => new RegExp(`^lesson0*${row.L}-.+\\.html$`).test(f));
    if (!page) { warn(where + row.L, 'no page for this row'); continue; }
    checkPage(row, pageScan(path.join(dir, page), locale), where);
  }
  const pages = fs.readdirSync(dir).filter(f => /^lesson\d+-.*\.html$/.test(f));
  const ledgered = new Set(rows.map(r => r.L));
  const orphans = pages.filter(f => !ledgered.has(Number(/^lesson(\d+)-/.exec(f)[1])))
    .filter(f => inScope({ L: Number(/^lesson(\d+)-/.exec(f)[1]) }));
  if (orphans.length) warn(track, `${orphans.length} authored page(s) with no row in the ledger (e.g. ${orphans[0]})`);
  const used = union([{ el: Object.assign({}, ...rows.map(r => r.el)) }], 'el');
  const unused = PALETTE.filter(e => !used.has(e));
  const scoped = rows.filter(inScope).map(r => "L" + r.L).join(" ");
  console.log(`${track.padEnd(24)} ${String(rows.length).padStart(2)} rows · ${used.size}/${PALETTE.length} elements`
    + (unused.length ? ` · never used: ${unused.join(", ")}` : "")
    + ` · in scope: ${scoped || "none (name lessons, --lessons=21-25, or --all)"}`);
}

function selfTest() {
  const row = (L, el, secs) => ({ L, el, qel: { mc: 1 }, reg: { good: 5, total: 5 }, quiz: { blocks: ['rul', 'ex', 'rul'] },
    sections: secs || [{ n: 1, subject: 'rul', device: null, blocks: ['rul', 'ex'] }] });
  const cases = [
    ['novelty fails on a repeat', () => { checkWindows([row(1, { gap: 1 }), row(2, { gap: 1 })], 'T L'); }, 'novelty'],
    ['novelty passes on a new element', () => { checkWindows([row(1, { gap: 1 }), row(2, { mc: 1 })], 'T L'); }, null],
    ['novelty is vacuous once the window already names the whole palette', () => {
      const hold = els => Object.fromEntries(els.map(e => [e, 1]));
      checkWindows([row(1, hold(PALETTE.slice(0, 4))), row(2, hold(PALETTE.slice(4, 8))),
        row(3, hold(PALETTE.slice(8))), row(4, { fill: 1 })], 'T L');
    }, null],
    ['novelty window is 3, so the fourth lesson may reuse the first', () => {
      checkWindows([row(1, { gap: 1 }), row(2, { mc: 1 }), row(3, { chunks: 1 }), row(4, { flip: 1 }), row(5, { gap: 1 })], 'T L');
    }, null],
    ['churn fails inside 5 lessons', () => {
      const rs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(L => row(L, { gap: 1 }));
      rs.forEach((r, i) => { if (i) r.el = { [PALETTE[i]]: 1 }; });
      checkWindows(rs, 'T L');
    }, 'churn'],
    ['coverage fails at the tenth', () => {
      const rs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(L => row(L, { gap: 1 }));
      checkWindows(rs, 'T L');
    }, 'coverage'],
    ['quiz three alike', () => {
      const r = row(1, { gap: 1 }); r.quiz = { blocks: ['rul', 'rul', 'rul'] }; checkQuiz([r], 'T L');
    }, 'three times'],
    ['dominance fails at 4 of 5', () => { checkBlocks([row(7, { gap: 4, mc: 1 })], 'T L'); }, 'dominance'],
    ['device cap fails on two charts in four', () => {
      const r = row(7, { gap: 1 }, [
        { n: 1, subject: 'voc', device: 'chart', blocks: ['voc'] },
        { n: 2, subject: 'voc', device: 'chart', blocks: ['voc'] },
        { n: 3, subject: 'rul', device: 'timeline', blocks: ['rul'] },
        { n: 4, subject: 'exc', device: null, blocks: ['exc'] }]);
      checkBlocks([r], 'T L');
    }, 'devices'],
    ['rhythm fails on one gram everywhere', () => {
      const r = row(7, { gap: 1 }, [
        { n: 1, subject: 'rul', device: null, blocks: ['rul', 'ex'] },
        { n: 2, subject: 'voc', device: null, blocks: ['rul', 'ex'] },
        { n: 3, subject: 'tim', device: null, blocks: ['rul', 'ex'] }]);
      checkBlocks([r], 'T L');
    }, 'every section'],
  ];
  let bad = 0;
  for (const [name, run, expect] of cases) {
    fails.length = 0; warns.length = 0;
    run();
    const all = fails.concat(warns).join('\n');
    const ok = expect ? all.includes(expect) : fails.length === 0;
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}`);
    if (!ok) console.log(`      wanted ${expect || 'no failure'}\n      got ${all || '(nothing)'}`);
  }
  console.log(bad ? `\n${bad} self-test case(s) failed` : '\nall self-test cases ok');
  return bad;
}

const tracks = fs.readdirSync(ROOT).filter(d => fs.existsSync(path.join(ROOT, d, 'track.json')));
if (process.argv.includes('--self-test')) {
  process.exitCode = selfTest() ? 1 : 0;
} else {
  for (const t of tracks) runTrack(t);
  if (sepOpen.length) {
    console.log(`\nnote  ${sepOpen.length} lesson(s) teach more than 3 sections with no sep: defence — the default is 3:`);
    console.log('      ' + sepOpen.join(', '));
  }
  if (warns.length) { console.log(`\n${warns.length} warning(s):`); for (const w of warns) console.log('  warn  ' + w); }
  if (fails.length) { console.log(`\n${fails.length} failure(s):`); for (const f of fails) console.log('  FAIL  ' + f); }
  console.log(fails.length ? '\nbatchcheck: fails' : '\nbatchcheck: passes');
  process.exitCode = fails.length ? 1 : 0;
}
