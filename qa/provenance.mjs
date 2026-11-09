/**
 * qa/provenance.mjs — the record that a lesson was built from its own inputs, and the [k] floor.
 *
 * PEDAGOGY-MAP.md 5 requires one line in `provenance.jsonl` BEFORE the first line of a page is
 * written, and [k] requires every taught element to be trained and at least 70% of the lesson's new
 * items to be asked about in the closing quiz. Neither is visible in the page, so neither can be
 * audited by qa/content.mjs: a page can load perfectly and still be a lesson nobody can point at the
 * inputs for. This member is the only place those two claims are checked.
 *
 *   node qa/provenance.mjs [--track=kids|business|adult] [lessonNumber ...] [--selftest]
 *
 * What it checks, per page in scope:
 *   record    a line in provenance.jsonl for `<track>/<N>`; the LATEST line wins, because an
 *             amendment is an append (never an edit) and the sequence keeps the pre-page record first
 *   inputs    the six sha8 hashes still match the files on disk — a mismatch means the rules changed
 *             after this page was built, so the page is no longer evidence about the current contract
 *   range     `range` is this lesson's own roadmap heading span, never another lesson's
 *   shape     the page's h2+vehicle fingerprint equals the record's, and matches NO other lesson in
 *             the same track (an identical shape is a copied shape, not a coincidence)
 *   coverage  [k] read off the roadmap's own `- Vocabulary:` line: every item present in the page is
 *             trained outside the quiz, and >=70% of the present items are asked about in the last section
 *   concepts  [k] the harder half, and the reason a page has to declare itself: every pid on the
 *             roadmap's `teaches:` line is marked `data-teaches="<pid>"` on a block that TRAINS it and
 *             on a block in the quiz that TESTS it. Concepts outrank vocabulary — a lesson on a tense
 *             that never makes the student produce that tense has failed, however many words it lists.
 *
 * NOTHING HERE IS TRACK-WIDE. Each lesson is green or red on its own; a page is never judged by its
 * siblings' completeness. The one comparison that crosses pages is the [1.e] shape-collision test,
 * and it reads siblings only to ask whether this page copied one.
 *
 * THE LEDGER IS TRANSIENT (PEDAGOGY-MAP.md 5): once the track is regenerated and verified it is
 * deleted, so an absent ledger is RETIRED — a notice, never a failure and never "no records". The
 * record checks (inputs, range, fingerprint, collision) need the ledger and stop with it; the checks
 * that need only the page and its own roadmap entry (concepts, coverage) keep running.
 *
 * Reading lesson pages is this harness's job, not a build's: PEDAGOGY-MAP.md 3 forbids a *generation*
 * from reading a lesson page. Shape comparison needs every page in the track, so they are read HERE,
 * by the check, and never to inform a page.
 *
 * Tiering (as qa/content.mjs): FAIL what makes the claim false or the lesson lossy; WARN what a reader
 * could still use and a rule elsewhere permits — a roadmap vocabulary item the build dropped is a
 * WARN because PEDAGOGY-MAP.md [BUILD] allows changing included vocabulary where purpose justifies it.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { JSDOM } from 'jsdom';
import { ROOT, pickTracks, hasTrackFlag, pickNumbers, pickLessons, lessonsOnDisk, missingTargets, scopeLabel } from './track.mjs';

const LEDGER = 'provenance.jsonl';
const NEED = 0.7;

/** first 8 hex of sha256 — the record's unit of "this file, this content" */
const sha8 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 8);

/** the six MANDATORY/as-needed inputs a record hashes, as [record key, file on disk] */
const CONTRACT = track => [
  ['contract', 'PEDAGOGY-MAP.md'],
  ['roadmap', track.toUpperCase() + '-ROADMAP.md'],
  ['format', 'FORMAT.md'],
  ['function', 'FUNCTION.md'],
  ['register', track.toUpperCase() + '-REGISTER.md'],
  ['shell', '_shell.html'],
];

const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

/**
 * this lesson's own line span in the roadmap: the `## Lesson N:` heading line through the last
 * non-blank line before the next heading. Returned 1-based and inclusive, which is the form the
 * record's `range` is written in.
 */
function roadmapSpan(text, n) {
  const lines = String(text).split(/\r?\n/);
  const heads = [];
  lines.forEach((l, i) => {
    const m = l.match(/^##\s+Lesson\s+(\d+)\s*:/);
    if (m) heads.push({ n: Number(m[1]), i });
  });
  const at = heads.findIndex(h => h.n === n);
  if (at < 0) return null;
  const start = heads[at].i + 1;
  let end = at + 1 < heads.length ? heads[at + 1].i : lines.length;
  while (end > start && !norm(lines[end - 1])) end--;
  return { start, end, body: lines.slice(start, end).join('\n') };
}

/** the `- Vocabulary:` line of one lesson entry — the lesson's own declared items, nothing else */
function roadmapVocabulary(body) {
  const line = String(body).split(/\r?\n/).find(l => /^\s*-\s*Vocabulary\s*:/i.test(l));
  if (!line) return [];
  const rest = line.replace(/^\s*-\s*Vocabulary\s*:/i, '').trim();
  const quoted = [...rest.matchAll(/"([^"]+)"/g)].map(m => norm(m[1])).filter(Boolean);
  if (quoted.length) return quoted;
  return rest.split(/[,;]/).map(s => norm(s).replace(/^["']|["']$/g, '')).filter(Boolean);
}

/** the `- teaches:` line of one lesson entry — the concept ids that lesson is held to */
function roadmapTeaches(body) {
  const line = String(body).split(/\r?\n/).find(l => /^\s*-\s*teaches\s*:/i.test(l));
  if (!line) return [];
  const rest = line.replace(/^\s*-\s*teaches\s*:/i, '').trim();
  const backticked = [...rest.matchAll(/`([^`]+)`/g)].map(m => norm(m[1])).filter(Boolean);
  if (backticked.length) return backticked;
  return rest.split(/[,;]/).map(s => norm(s)).filter(Boolean);
}

/** an item as it would appear in prose; word-boundaries only where the item has word edges */
function itemPattern(item) {
  const esc = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp((/^\w/.test(item) ? '\\b' : '') + esc + (/\w$/.test(item) ? '\\b' : ''), 'i');
}

/**
 * the concept ids an element declares, `data-teaches="pid pid"` — how a page says what it trains.
 * Checked on the element itself and on everything under it, so the mark can sit on a block, on a
 * section's wrapper, or on the h2 that heads it; a page's structure is its own decision (FORMAT.md),
 * and this marker follows it rather than dictating it.
 */
function pidsOf(el) {
  const out = [];
  const take = e => {
    const v = e.getAttribute && e.getAttribute('data-teaches');
    if (v) out.push(...String(v).split(/[\s,]+/).map(norm).filter(Boolean));
  };
  take(el);
  for (const d of el.querySelectorAll('[data-teaches]')) take(d);
  return out;
}

/**
 * the vehicle a block is: the game plugin it runs (engine4), or the framed container FORMAT.md [k]
 * names as a visible block. Everything else is a wrapper to look inside (`.itemrow` and friends).
 */
function vehicleOf(el) {
  const cl = el.classList;
  if (!cl || !cl.length) return null;
  if (cl.contains('game')) return 'game:' + (el.getAttribute('data-game') || 'none');
  for (const k of ['chart', 'dialog', 'card', 'panel']) if (cl.contains(k)) return k;
  return null;
}

/** the shell's own notebook heading is boilerplate, not a section of the lesson */
function isFeedHeading(el) {
  if (/caderno compartilhado/i.test(el.textContent || '')) return true;
  const sib = el.nextElementSibling;
  return !!sib && sib.id === 'feed';
}

/**
 * the page as sections: each h2 with the ordered vehicles under it and the text it carries.
 * `text` is the whole content area's prose, for "does this word appear anywhere" questions.
 */
function sectionsOf(html) {
  const d = new JSDOM(String(html)).window.document;
  const area = d.querySelector('.content-area');
  if (!area) return { sections: [], text: '' };
  const sections = [];
  let cur = null;
  const walk = el => {
    const v = vehicleOf(el);
    if (v) { if (cur) cur.tokens.push(v); return; }
    for (const c of el.children) walk(c);
  };
  for (const el of area.children) {
    if (el.tagName === 'H2') {
      if (isFeedHeading(el)) { cur = null; continue; }
      cur = { title: norm(el.textContent), tokens: [], text: norm(el.textContent), pids: new Set() };
      pidsOf(el).forEach(p => cur.pids.add(p));
      sections.push(cur);
      continue;
    }
    if (!cur) continue;
    walk(el);
    pidsOf(el).forEach(p => cur.pids.add(p));
    cur.text = norm(cur.text + ' ' + (el.textContent || ''));
  }
  /* the prose the page carries, assembled from its sections rather than from raw `textContent`:
     adjacent elements leave no whitespace in the source, so `qlook` would defeat a word boundary
     that the reader never sees. */
  return { sections, text: sections.map(s => s.text).join(' ') };
}

/** the record's `fingerprint`: the page's h2s in order, each with the vehicles it uses */
const fingerprintOf = page => page.sections.map(s => [s.title, s.tokens.join('+') || '—']);

/** every line of the ledger, in file order; a malformed line is reported, never skipped silently */
function readLedger(file) {
  const records = new Map();
  const bad = [];
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (!norm(line)) return;
    let rec;
    try { rec = JSON.parse(line); } catch { bad.push('ledger line ' + (i + 1) + ' is not JSON'); return; }
    if (!rec || typeof rec.lesson !== 'string' || !/^[a-z]+\/\d+$/.test(rec.lesson)) {
      bad.push('ledger line ' + (i + 1) + ' has no `<track>/<N>` lesson field'); return;
    }
    if (!records.has(rec.lesson)) records.set(rec.lesson, []);
    records.get(rec.lesson).push(rec);
  });
  return { records, bad };
}

/** retired, or present — the one branch that decides whether this member is a no-op */
function ledgerState(root) {
  return fs.existsSync(path.join(root, LEDGER)) ? 'present' : 'retired';
}

/**
 * one lesson, against the record it declared. `peers` is every other page in the SAME track as
 * `{ n, fp }`, so the shape comparison is a track-local question and never a cross-track one.
 */
function auditLesson({ root, track, n, record, peers, retired }) {
  const errors = [], warns = [];
  const html = fs.readFileSync(path.join(root, track, 'lesson' + n + '.html'), 'utf8');
  const page = sectionsOf(html);
  const fp = fingerprintOf(page);

  if (!record && !retired) {
    errors.push('no provenance record in ' + LEDGER + ' for ' + track + '/' + n +
      ' — PEDAGOGY-MAP.md 5 requires one before the first line of the page');
    return { errors, warns };
  }
  if (!fp.length) errors.push('no lesson sections found under .content-area — the page was not read as a lesson');

  // this lesson's own roadmap entry: the only roadmap text it is held to, and the source of both its
  // concepts and its vocabulary
  const rmFile = path.join(root, track.toUpperCase() + '-ROADMAP.md');
  const span = fs.existsSync(rmFile) ? roadmapSpan(fs.readFileSync(rmFile, 'utf8'), n) : null;
  if (!span) {
    errors.push('the roadmap has no `## Lesson ' + n + ':` heading — nothing this lesson is held to can be located');
  }

  /* ---- what only the ledger can vouch for; skipped once it is retired ---- */
  if (record) {
    // inputs — a hash that no longer matches means the rules moved after this page was built
    for (const [key, file] of CONTRACT(track)) {
      const p = path.join(root, file);
      if (!fs.existsSync(p)) { errors.push('input ' + file + ' is missing on disk (the record names a hash for it)'); continue; }
      const now = sha8(p);
      if (record[key] !== now) {
        errors.push('input ' + file + ' changed after this page was built (record ' + (record[key] || '—') +
          ', disk ' + now + ') — the page is no longer evidence about the current contract');
      }
    }
    if (record.pagesRead !== 'none') {
      errors.push('record does not declare pagesRead:"none" (it says ' + JSON.stringify(record.pagesRead) +
        ') — PEDAGOGY-MAP.md 3');
    }

    // range — its own heading span in the roadmap, never another lesson's
    if (span) {
      const want = span.start + '-' + span.end;
      if (String(record.range || '') !== want) {
        errors.push('range ' + JSON.stringify(record.range) + ' is not this lesson\'s own span (' + want +
          ') — PEDAGOGY-MAP.md 1.a');
      }
    }

    // shape — equal to the record, and to no sibling
    if (!Array.isArray(record.fingerprint)) {
      errors.push('record carries no fingerprint array');
    } else if (JSON.stringify(record.fingerprint) !== JSON.stringify(fp)) {
      const i = fp.findIndex((p, k) => JSON.stringify(p) !== JSON.stringify(record.fingerprint[k] || null));
      const at = i < 0 ? fp.length : i;
      errors.push('page shape differs from the record at section ' + (at + 1) + ' (record ' +
        JSON.stringify(record.fingerprint[at] || null) + ', page ' + JSON.stringify(fp[at] || null) + ')');
    }
    if (fp.length) {
      for (const peer of peers) {
        if (peer.n === n) continue;
        if (JSON.stringify(peer.fp) === JSON.stringify(fp)) {
          errors.push('shape is identical to ' + track + '/lesson' + peer.n +
            ' — a copied shape is a failed generation, not a variant (PEDAGOGY-MAP.md 1.e)');
        }
      }
    }
  }

  // coverage — [k], measured against the roadmap's own vocabulary line
  if (span) {
    const items = roadmapVocabulary(span.body);
    const quiz = page.sections.length ? page.sections[page.sections.length - 1] : null;
    const quizText = quiz ? quiz.text : '';
    const trainText = page.sections.slice(0, -1).map(s => s.text).join(' ');
    const present = [], absent = [], untrained = [], unquizzed = [];
    for (const it of items) {
      const re = itemPattern(it);
      if (!re.test(page.text)) { absent.push(it); continue; }
      present.push(it);
      if (!re.test(trainText)) untrained.push(it);
      if (!re.test(quizText)) unquizzed.push(it);
    }
    if (!items.length) {
      warns.push('the roadmap names no vocabulary for this lesson, so the 70% floor could not be measured');
    }
    if (absent.length) {
      warns.push(absent.length + ' of ' + items.length + ' roadmap item(s) do not appear on the page (' +
        absent.join(', ') + ') — permitted by [BUILD] where purpose justifies it; record why in ISSUES.md');
    }
    if (present.length && present.length < 10) {
      warns.push('only ' + present.length + ' roadmap item(s) appear — q) asks for at least 10 new items;' +
        ' if the page teaches others, this count does not see them');
    }
    if (untrained.length) {
      errors.push(untrained.length + ' item(s) appear only in the quiz and are trained nowhere (' +
        untrained.join(', ') + ') — every taught element is trained, [k]');
    }
    if (present.length) {
      const asked = present.length - unquizzed.length;
      if (asked < Math.ceil(present.length * NEED)) {
        errors.push('the quiz asks about ' + asked + ' of ' + present.length + ' present item(s), under the 70% floor (' +
          Math.ceil(present.length * NEED) + ') — never asked: ' + unquizzed.join(', '));
      }
    }

    /* concepts — [k], and the check that outranks the vocabulary one: a lesson on a tense must make the
       student produce that tense, in practice and again in the quiz. The page declares which block
       trains which concept with `data-teaches="<pid>"`; without that declaration nothing can tell a
       page that trains the tense from a page that only names it. */
    const concepts = roadmapTeaches(span.body);
    const trainSecs = page.sections.slice(0, -1);
    const trainedPids = new Set();
    trainSecs.forEach(s => s.pids.forEach(p => trainedPids.add(p)));
    const quizPids = quiz ? quiz.pids : new Set();
    const declared = new Set([...trainedPids, ...quizPids]);

    if (!concepts.length) {
      warns.push('the roadmap names no teaches: concept for this lesson, so concept training could not be measured');
    }
    const notTrained = concepts.filter(c => !trainedPids.has(c));
    const notTested = concepts.filter(c => !quizPids.has(c));
    if (notTrained.length) {
      errors.push(notTrained.length + ' concept(s) carry no training block (' + notTrained.join(', ') +
        ') — every taught element is trained, [k]: mark the block that trains it data-teaches="<pid>"');
    }
    if (notTested.length) {
      errors.push(notTested.length + ' concept(s) are absent from the quiz (' + notTested.join(', ') +
        ') — the closing quiz tests all of it, [k]: mark the quiz block that asks about it');
    }
    const stray = [...declared].filter(p => !concepts.includes(p));
    if (stray.length) {
      warns.push('declared with data-teaches but not named in the roadmap teaches: list (' + stray.join(', ') + ')');
    }
    const bareConcept = concepts.filter(c => trainedPids.has(c) &&
      !trainSecs.some(s => s.pids.has(c) && present.some(it => itemPattern(it).test(s.text))));
    if (bareConcept.length) {
      warns.push('concept(s) trained with none of the lesson\'s new vocabulary (' + bareConcept.join(', ') +
        ') — the practice items should carry the new words');
    }
  }
  return { errors, warns };
}

/* ---- the run ------------------------------------------------------------------------------ */

/** every page in a track as `{ n, fp }` — the shape question is track-local, so it needs the track.
 *  Enumerated under `root` (not the repo) so `--selftest` can point the whole member at a temp tree. */
function trackFingerprints(root, track) {
  const dir = path.join(root, track);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map(f => (f.match(/^lesson(\d+)\.html$/) || [])[1])
    .filter(Boolean).map(Number).sort((a, b) => a - b)
    .map(n => ({
      n,
      fp: fingerprintOf(sectionsOf(fs.readFileSync(path.join(dir, 'lesson' + n + '.html'), 'utf8'))),
    }));
}

if (process.argv.slice(2).includes('--selftest')) selftest();

const tracks = pickTracks();
if (!tracks.length) { console.log('✅ no lesson pages'); process.exit(0); }

const retired = ledgerState(ROOT) === 'retired';
if (retired) {
  console.log('note: ' + LEDGER + ' is absent — the ledger is RETIRED (PEDAGOGY-MAP.md 5), so the record');
  console.log('      checks (inputs, range, fingerprint, shape-collision) are skipped. The checks that need');
  console.log('      no ledger — concept train+test and vocabulary coverage, both read from the lesson\'s own');
  console.log('      roadmap entry — still run, lesson by lesson.\n');
}

const strict = hasTrackFlag();
const ghosts = missingTargets(tracks, pickNumbers());
if (ghosts.length) { console.log('❌ lesson ' + ghosts.join(', ') + ' does not exist in ' + scopeLabel(tracks)); process.exit(1); }

const { records, bad } = retired ? { records: new Map(), bad: [] } : readLedger(path.join(ROOT, LEDGER));
let checked = 0, failed = 0, warned = 0;
for (const b of bad) { failed++; console.log('❌ ' + LEDGER + ' — ' + b); }

for (const track of tracks) {
  const scope = pickLessons(track);
  if (!scope.length) { console.log('✅ no ' + track + ' lesson pages'); continue; }
  const peers = retired ? [] : trackFingerprints(ROOT, track);
  console.log('— ' + track + ' lesson' + (scope.length === 1 ? '' : 's') + ' ' + scope.join(', '));

  for (const n of scope) {
    const file = path.join(ROOT, track, 'lesson' + n + '.html');
    if (!fs.existsSync(file)) {
      if (strict) { console.log('❌ ' + track + '/lesson' + n + ' page not found'); failed++; }
      continue;
    }
    const lines = records.get(track + '/' + n) || [];
    const record = lines.length ? lines[lines.length - 1] : null;
    let r;
    try { r = auditLesson({ root: ROOT, track, n, record, peers, retired }); }
    catch (e) { r = { errors: ['threw: ' + e.message], warns: [] }; }
    checked++;
    if (lines.length > 1) console.log('   note: ' + track + '/' + n + ' was amended (' + lines.length +
      ' record(s)); the latest line is the one verified');
    if (r.errors.length) {
      failed++;
      console.log('❌ ' + track + '/lesson' + n);
      r.errors.forEach(e => console.log('     - ' + e));
      r.warns.forEach(w => console.log('     ⚠ ' + w));
    } else if (r.warns.length) {
      warned++;
      console.log('⚠  ' + track + '/lesson' + n + ' (recorded; small errors)');
      r.warns.forEach(w => console.log('     - ' + w));
    } else console.log('✅ ' + track + '/lesson' + n);
  }

  for (const key of records.keys()) {
    const [t, ns] = key.split('/');
    if (t !== track || lessonsOnDisk(track).includes(Number(ns))) continue;
    console.log('   note: a record exists for ' + key + ' but its page is not on disk');
  }
}

console.log('\n' + (failed ? '❌ ' + failed + ' of ' + checked + ' page(s) failed'
  : '✅ ' + checked + ' page(s) green, each on its own: every concept trained and tested, 70%+ of the new items'
    + ' quizzed' + (retired ? ', ledger retired so the record checks were skipped'
      : ', recorded before writing with the inputs unchanged')
    + (warned ? '  (' + warned + ' warning(s) — recorded, not fatal)' : '')));
process.exit(failed ? 1 : 0);

/* ---- selftest ----------------------------------------------------------------------------- */

/**
 * `--selftest` plants each defect this member exists to catch in a temp tree built here, and asserts
 * the finding fires. A check that cannot fail is not evidence, and this member's whole subject — a
 * record nothing else reads — is exactly the kind that rots silently.
 */
function selftest() {
  const dirs = [];
  let fails = 0;
  const mk = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'prov-')); dirs.push(d); return d; };
  const say = (ok, name, detail) => {
    if (ok) console.log('✅ ' + name);
    else { fails++; console.log('❌ ' + name + (detail ? '\n      ' + detail : '')); }
  };

  const VOC = ['look at', 'look for', 'look up'];
  const SECS = [
    { t: '1. The family', v: ['panel'], x: 'look at it, look for it', p: 'tense/fixture' },
    { t: '2. Training', v: ['chart', 'game:catchBasket'], x: 'look up a word', p: 'tense/fixture' },
    { t: '3. Quiz', v: ['panel'], x: 'look at it, look for it, look up it', p: 'tense/fixture' },
  ];
  const block = v => v.startsWith('game:')
    ? '<div class="game" data-game="' + v.slice(5) + '"><div class="stub">x</div></div>'
    : v === 'chart' ? '<table class="chart"><tbody><tr><td>a</td></tr></tbody></table>'
      : '<div class="' + v + '"><div class="qgrid"><div>q</div></div></div>';
  /* the concept mark sits on the block itself, which is how a real page declares it */
  const blockAttr = (v, p) => {
    const h = block(v);
    return p ? h.replace('>', ' data-teaches="' + p + '">') : h;
  };
  const pageHtml = secs => '<!doctype html><html><body><main><div class="page-container"><div class="content-area">'
    + '<h1>Fixture</h1>'
    + secs.map(s => '<h2>' + s.t + '</h2>' + s.v.map(v => blockAttr(v, s.p)).join('') + '<p>' + s.x + '</p>').join('')
    + '<h2>\u{1F4D2} Caderno compartilhado</h2><textarea id="feed" rows="8"></textarea>'
    + '</div></div></main></body></html>';
  const roadmapOf = vocab => [
    '## Lesson 1: One', '',
    '   - Focus: fixture',
    '   - teaches: `tense/fixture`',
    '   - Vocabulary: ' + vocab.map(v => '"' + v + '"').join(', '), '',
    '## Lesson 2: Two', '',
    '   - Focus: fixture',
    '   - teaches: `sound/fixture`',
    '   - Vocabulary: "look at", "look for", "look up"', '',
  ].join('\n');

  const build = (opts = {}) => {
    const root = mk();
    fs.writeFileSync(path.join(root, 'PEDAGOGY-MAP.md'), 'contract\n');
    fs.writeFileSync(path.join(root, 'FORMAT.md'), 'format\n');
    fs.writeFileSync(path.join(root, 'FUNCTION.md'), 'function\n');
    fs.writeFileSync(path.join(root, 'KIDS-REGISTER.md'), 'register\n');
    fs.writeFileSync(path.join(root, '_shell.html'), '<div class="content-area"></div>\n');
    fs.writeFileSync(path.join(root, 'KIDS-ROADMAP.md'), roadmapOf(opts.vocab || VOC));
    fs.mkdirSync(path.join(root, 'kids'), { recursive: true });
    fs.writeFileSync(path.join(root, 'kids', 'lesson1.html'), pageHtml(opts.secs || SECS));
    fs.writeFileSync(path.join(root, 'kids', 'lesson2.html'),
      pageHtml(opts.secs2 || [
        { t: '1. Another beat', v: ['dialog'], x: 'other', p: 'sound/fixture' },
        { t: '2. Its quiz', v: ['card'], x: 'other again', p: 'sound/fixture' },
      ]));
    return root;
  };
  const recordFor = (root, n, over = {}) => {
    const rec = { lesson: 'kids/' + n };
    for (const [key, file] of CONTRACT('kids')) rec[key] = sha8(path.join(root, file));
    const span = roadmapSpan(fs.readFileSync(path.join(root, 'KIDS-ROADMAP.md'), 'utf8'), n);
    const html = fs.readFileSync(path.join(root, 'kids', 'lesson' + n + '.html'), 'utf8');
    return {
      ...rec, range: span.start + '-' + span.end, fingerprint: fingerprintOf(sectionsOf(html)),
      pagesRead: 'none', date: '2026-11-09', ...over,
    };
  };
  const audit = (root, n, rec, retired) =>
    auditLesson({ root, track: 'kids', n, record: rec, peers: trackFingerprints(root, 'kids'), retired });

  // 1. the clean case — a correct record over a correct page
  {
    const root = build();
    const r = audit(root, 1, recordFor(root, 1));
    say(r.errors.length === 0, 'clean record passes', r.errors.join(' | '));
  }
  // 2. a page with no record at all
  {
    const root = build();
    const r = audit(root, 1, null);
    say(/no provenance record/.test(r.errors.join(' ')), 'a page with no record fails', r.errors.join(' | '));
  }
  // 3. an input edited after the page was built
  {
    const root = build();
    const rec = recordFor(root, 1);
    fs.writeFileSync(path.join(root, 'FORMAT.md'), 'format, edited after the page\n');
    const r = audit(root, 1, rec);
    say(/FORMAT\.md changed after this page was built/.test(r.errors.join(' ')),
      'a changed input fails', r.errors.join(' | '));
  }
  // 4. a range that is not this lesson's own span
  {
    const root = build();
    const r = audit(root, 1, recordFor(root, 1, { range: '1-99' }));
    say(/is not this lesson's own span/.test(r.errors.join(' ')),
      "a range off the lesson's span fails", r.errors.join(' | '));
  }
  // 5. the page's shape is not the shape the record declared
  {
    const root = build();
    const r = audit(root, 1, recordFor(root, 1, { fingerprint: [['9. a section that is not there', 'panel']] }));
    say(/differs from the record/.test(r.errors.join(' ')),
      'a shape unlike its record fails', r.errors.join(' | '));
  }
  // 6. a shape copied wholesale from a sibling in the same track
  {
    const root = build({ secs2: SECS });
    const r = audit(root, 2, recordFor(root, 2));
    say(/identical to kids\/lesson1/.test(r.errors.join(' ')),
      'a shape copied from a sibling fails', r.errors.join(' | '));
  }
  // 7. a quiz that asks about under 70% of the items the page presents
  {
    const secs = SECS.map(s => (s.t === '3. Quiz' ? { ...s, x: 'look at it, look for it' } : s));
    const root = build({ secs });
    const r = audit(root, 1, recordFor(root, 1));
    say(/under the 70% floor/.test(r.errors.join(' ')), 'a quiz under 70% fails', r.errors.join(' | '));
  }
  // 8. an item that appears only in the quiz — presented, never trained
  {
    const secs = SECS.map(s => (s.t === '3. Quiz' ? { ...s, x: s.x + ' look out' } : s));
    const root = build({ vocab: [...VOC, 'look out'], secs });
    const r = audit(root, 1, recordFor(root, 1));
    say(/trained nowhere/.test(r.errors.join(' ')), 'an untrained item fails', r.errors.join(' | '));
  }
  // 9. a roadmap item the build dropped — a WARN, because [BUILD] permits changing vocabulary
  {
    const root = build({ vocab: [...VOC, 'look into'] });
    const r = audit(root, 1, recordFor(root, 1));
    say(r.errors.length === 0 && /do not appear on the page/.test(r.warns.join(' ')),
      'a dropped roadmap item warns only', r.errors.concat(r.warns).join(' | '));
  }
  // 10. no ledger is RETIRED, never "no records"
  {
    say(ledgerState(mk()) === 'retired', 'an absent ledger reads as retired');
  }
  // 11. a malformed ledger line is reported, never skipped
  {
    const root = mk();
    fs.writeFileSync(path.join(root, LEDGER), '{"lesson":"kids/1"}\n{oops\n');
    const { bad } = readLedger(path.join(root, LEDGER));
    say(bad.length === 1 && /not JSON/.test(bad[0]), 'a malformed ledger line is reported', bad.join(' | '));
  }

  // 12. a concept on no training block — the lesson names the tense and never has anyone use it
  {
    const secs = SECS.map(s => (s.t === '3. Quiz' ? s : { ...s, p: '' }));
    const root = build({ secs });
    const r = audit(root, 1, recordFor(root, 1));
    say(/carry no training block/.test(r.errors.join(' ')),
      'a concept with no training block fails', r.errors.join(' | '));
  }
  // 13. a concept the closing quiz never tests
  {
    const secs = SECS.map(s => (s.t === '3. Quiz' ? { ...s, p: '' } : s));
    const root = build({ secs });
    const r = audit(root, 1, recordFor(root, 1));
    say(/absent from the quiz/.test(r.errors.join(' ')),
      'a concept the quiz never tests fails', r.errors.join(' | '));
  }
  // 14. a concept trained with none of the lesson's new vocabulary
  {
    const secs = SECS.map(s => (s.t === '3. Quiz' ? s : { ...s, x: 'nothing to see here' }));
    const root = build({ secs });
    const r = audit(root, 1, recordFor(root, 1));
    say(/trained with none of the lesson's new vocabulary/.test(r.warns.join(' ')),
      'a concept trained without new vocabulary warns', r.errors.concat(r.warns).join(' | '));
  }
  // 15. a block marked as teaching a concept the roadmap never named
  {
    const secs = SECS.map(s => (s.t === '1. The family' ? { ...s, p: 'tense/fixture mystery/pid' } : s));
    const root = build({ secs });
    const r = audit(root, 1, recordFor(root, 1));
    say(/not named in the roadmap teaches/.test(r.warns.join(' ')),
      'a mark the roadmap never named warns', r.errors.concat(r.warns).join(' | '));
  }
  // 16. retired: the record checks stop with the ledger, the page checks do not
  {
    const secs = SECS.map(s => ({ ...s, p: '' }));
    const root = build({ secs });
    const r = audit(root, 1, null, true);
    const all = r.errors.join(' ');
    say(!/no provenance record/.test(all) && /carry no training block/.test(all),
      'a retired ledger skips the record but still checks concepts', all);
  }

  for (const d of dirs) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* temp */ } }
  console.log(fails === 0 ? '\n✅ selftest green' : '\n❌ selftest FAILED (' + fails + ')');
  process.exit(fails ? 1 : 0);
}



