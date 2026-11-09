/**
 * qa/provenance.mjs — the record that a lesson was built from its own inputs, and the [k] floor.
 *
 * PEDAGOGY-MAP.md 5 requires one line in `provenance.jsonl` BEFORE the first line of a page is
 * written, and [k] requires every taught element to be trained and every new item to be TESTED. Neither
 * is visible in the page, so neither can be audited by qa/content.mjs: a page can load perfectly and
 * still be a lesson nobody can point at the inputs for. This member is the only place those two claims
 * are checked.
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
 *             trained outside the quiz, and every present item is the ANSWER to a question of its own in
 *             the closing quiz. Answers are read from the key (`data-a` on the `.qitem`, or the option's
 *             value = the key), never from the block's prose: an item sitting in a distractor, a stem or
 *             a paragraph was never tested, and one answer naming four items is one question about none
 *             of them. Counting words anywhere in the quiz is what let a quiz look thorough while asking
 *             nothing, so it is not done at all.
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
/* NO percentage floor. The 70% floor this member used to carry is superseded: every new item must be
   the answer to a question of its own, and an item that is merely present in the quiz - as a distractor,
   in a stem, or in prose - is not tested at all (User, 2026-11-09). */

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

/**
 * the `- Vocabulary:` line of one lesson entry — the lesson's own declared items, nothing else.
 * A line may quote some items (anything with a space needs quotes) and leave single words bare;
 * reading only the quoted run silently drops the bare tail, so the line is split on commas and
 * semicolons OUTSIDE quotes and every piece is kept.
 */
function roadmapVocabulary(body) {
  const line = String(body).split(/\r?\n/).find(l => /^\s*-\s*Vocabulary\s*:/i.test(l));
  if (!line) return [];
  const rest = line.replace(/^\s*-\s*Vocabulary\s*:/i, '').trim();
  const parts = [];
  let cur = '', inQ = false;
  for (const ch of rest) {
    if (ch === '"') { inQ = !inQ; cur += ch; continue; }
    if (!inQ && (ch === ',' || ch === ';')) { parts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  parts.push(cur);
  return parts.map(s => norm(s).replace(/^["']|["']$/g, '')).filter(Boolean);
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
 * the same item as it appears in an ANSWER. A phrasal verb splits when its object is a pronoun -
 * `look it up`, `look them over` - and the split form is the harder half of the lesson, so an answer
 * that separates the verb from its particle still counts as that phrase. Only the particle move is
 * allowed: the words themselves must be there, in order, with an optional object pronoun between
 * the last two.
 */
function answerPattern(item) {
  const words = String(item).split(/\s+/).filter(Boolean);
  if (words.length < 2) return itemPattern(item);
  const esc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  /* the VERB may be inflected in the answer: the item is `look for`, and `looking for` is that phrase
     in the sentence a student would actually write. Nothing else is loosened - the particle and every
     later word stay literal and in order. */
  const head = words.slice(0, -1)
    .map((w, i) => esc(w) + (i === 0 ? '(?:s|es|ed|ing|d)?' : '')).join('\\s+');
  const tail = esc(words[words.length - 1]);
  return new RegExp((/^\w/.test(item) ? '\\b' : '') + head +
    '\\s+(?:(?:it|them|him|her|me|us|you)\\s+)?' + tail + (/\w$/.test(item) ? '\\b' : ''), 'i');
}

/** an answerable control: something whose value the page can be right or wrong about */
const ANSWERABLE = 'input.gap, input[type="radio"], .qitem[data-answer], textarea';

/**
 * the correct answers a subtree declares, one string per question. Three ways a page states one:
 *   - a radio `.qitem` with `data-a` naming the right option (the games' own contract, engine4.js)
 *   - a `.qitem` with `data-answer` (the crossword and bingo contract)
 *   - any element with `data-answer` wrapping a `.gap` blank
 * A question with no declared answer contributes nothing: a blank the page never keys cannot be the
 * evidence that an item was tested, and a distractor is not an answer at all.
 */
function answersOf(el) {
  const out = [];
  for (const q of el.querySelectorAll('.qitem')) {
    const key = q.getAttribute('data-a');
    const own = q.getAttribute('data-answer');
    if (own) { out.push(norm(own)); continue; }
    if (!key) continue;
    const r = [...q.querySelectorAll('input[type="radio"]')].find(x => x.value === key);
    if (!r) continue;
    const lab = r.closest('label');
    out.push(norm((lab ? lab.textContent : '') || ''));
  }
  for (const g of el.querySelectorAll('input.gap')) {
    const host = g.closest('[data-answer]');
    if (host && !host.classList.contains('qitem')) out.push(norm(host.getAttribute('data-answer')));
  }
  return out.filter(Boolean);
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
  /* every text node under an element, joined with a space. Adjacent elements leave no whitespace
     between them in the source, so `<td>yeah</td><td>yes</td>` arrives as `yeahyes` and defeats the
     word boundary a reader never sees; joining text nodes keeps every word a word. */
  const proseOf = el => {
    const out = [];
    const w = d.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */);
    for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n.nodeValue);
    return norm(out.join(' '));
  };
  for (const el of area.children) {
    if (el.tagName === 'H2') {
      if (isFeedHeading(el)) { cur = null; continue; }
      cur = { title: norm(el.textContent), tokens: [], text: norm(el.textContent), pids: new Set(),
        answers: [], askPids: new Set() };
      pidsOf(el).forEach(p => cur.pids.add(p));
      sections.push(cur);
      continue;
    }
    if (!cur) continue;
    walk(el);
    const ps = pidsOf(el);
    ps.forEach(p => cur.pids.add(p));
    /* a concept mark on a block that carries an answerable control is a question about it; the same
       mark on a bare block is a label, and a label tests nothing */
    if (el.querySelector(ANSWERABLE)) {
      ps.forEach(p => cur.askPids.add(p));
      cur.answers.push(...answersOf(el));
    }
    cur.text = norm(cur.text + ' ' + proseOf(el));
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
    const trainText = page.sections.slice(0, -1).map(s => s.text).join(' ');
    const present = [], absent = [], untrained = [];
    for (const it of items) {
      const re = itemPattern(it);
      if (!re.test(page.text)) { absent.push(it); continue; }
      present.push(it);
      if (!re.test(trainText)) untrained.push(it);
    }
    /* a question TESTS an item only when that item is part of the question's correct answer, and the
       answer is about that item alone. One answer naming four new words is not four questions, and an
       item that appears only as a distractor, in a stem, or in prose was never tested at all - which is
       how a quiz can look thorough while asking nothing. */
    const asked = new Map(present.map(it => [it, 0]));
    const crowded = [];
    for (const ans of (quiz ? quiz.answers : [])) {
      const hits = present.filter(it => answerPattern(it).test(ans));
      if (hits.length === 1) asked.set(hits[0], asked.get(hits[0]) + 1);
      else if (hits.length > 1) crowded.push('"' + ans + '" (' + hits.join(', ') + ')');
    }
    const unquizzed = present.filter(it => !asked.get(it));
    if (crowded.length) {
      warns.push(crowded.length + ' quiz answer(s) name more than one new item, so they test none of them' +
        ' on its own (' + crowded.slice(0, 3).join('; ') + ') — give each item its own question');
    }
    if (!items.length) {
      warns.push('the roadmap names no vocabulary for this lesson, so coverage could not be measured');
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
      if (unquizzed.length) {
        errors.push(unquizzed.length + ' of ' + present.length + ' present item(s) are never the answer to a' +
          ' question of their own (' + unquizzed.join(', ') + ') — a distractor is not a test, [k]: each item' +
          ' needs its own question');
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
    /* only a mark on a question counts as TESTING a concept; a mark on a bare block is a label */
    const quizPids = quiz ? quiz.askPids : new Set();
    const quizLabels = quiz ? [...quiz.pids].filter(p => !quiz.askPids.has(p)) : [];
    const declared = new Set([...trainedPids, ...(quiz ? quiz.pids : new Set())]);

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
        ') — the closing quiz tests all of it, [k]: mark the question that asks about it');
    }
    if (quizLabels.length) {
      warns.push('concept mark(s) in the quiz sit on a block with no answerable control (' +
        quizLabels.join(', ') + ') — a label is not a question: mark the question that asks about it');
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
  : '✅ ' + checked + ' page(s) green, each on its own: every concept trained and tested, every new item'
    + ' the answer to a question of its own' + (retired ? ', ledger retired so the record checks were skipped'
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
  /* one question per item, with that item as the CORRECT option: coverage counts ANSWERS, so a fixture
     whose quiz is only prose would measure nothing at all */
  const ask = items => items.map((it, i) =>
    '<div class="qitem" data-a="a"><div class="qline"><span class="qnum">' + (i + 1) + '.</span>' +
    '<span class="qstem">which phrase?</span></div><div class="qopts">' +
    '<label><input type="radio" name="f' + i + '" value="a"> ' + it + '</label>' +
    '<label><input type="radio" name="f' + i + '" value="b"> not this one</label></div></div>').join('');
  const SECS = [
    { t: '1. The family', v: ['panel'], x: 'look at it, look for it', p: 'tense/fixture' },
    { t: '2. Training', v: ['chart', 'game:catchBasket'], x: 'look up a word', p: 'tense/fixture' },
    { t: '3. Quiz', v: ['panel'], x: ask(VOC), p: 'tense/fixture', in: true },
  ];
  const block = (v, inner) => v.startsWith('game:')
    ? '<div class="game" data-game="' + v.slice(5) + '"><div class="stub">x</div></div>'
    : v === 'chart' ? '<table class="chart"><tbody><tr><td>a</td></tr></tbody></table>'
      : '<div class="' + v + '">' + (inner || '<div class="qgrid"><div>q</div></div>') + '</div>';
  /* the concept mark sits on the block itself, which is how a real page declares it */
  const blockAttr = (v, p, inner) => {
    const h = block(v, inner);
    return p ? h.replace('>', ' data-teaches="' + p + '">') : h;
  };
  /* a section's `x` is its prose; `in: true` puts it INSIDE the first block instead, which is where a
     question has to live for a concept mark on that block to be a question rather than a label */
  const pageHtml = secs => '<!doctype html><html><body><main><div class="page-container"><div class="content-area">'
    + '<h1>Fixture</h1>'
    + secs.map(s => '<h2>' + s.t + '</h2>'
      + s.v.map((v, i) => blockAttr(v, s.p, i === 0 && s.in ? s.x : '')).join('')
      + (s.in ? '' : '<div>' + s.x + '</div>')).join('')
    + '<h2>\u{1F4D2} Caderno compartilhado</h2><textarea id="feed" rows="8"></textarea>'
    + '</div></div></main></body></html>';
  const roadmapOf = (vocab, raw) => [
    '## Lesson 1: One', '',
    '   - Focus: fixture',
    '   - teaches: `tense/fixture`',
    '   - Vocabulary: ' + (raw || vocab.map(v => '"' + v + '"').join(', ')), '',
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
    fs.writeFileSync(path.join(root, 'KIDS-ROADMAP.md'), roadmapOf(opts.vocab || VOC, opts.vocabRaw));
    fs.mkdirSync(path.join(root, 'kids'), { recursive: true });
    fs.writeFileSync(path.join(root, 'kids', 'lesson1.html'), pageHtml(opts.secs || SECS));
    fs.writeFileSync(path.join(root, 'kids', 'lesson2.html'),
      pageHtml(opts.secs2 || [
        { t: '1. Another beat', v: ['dialog'], x: 'other', p: 'sound/fixture' },
        { t: '2. Its quiz', v: ['card'], x: ask(['look at']), p: 'sound/fixture', in: true },
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
  // 7. an item the quiz never asks about in a question of its own
  {
    const secs = SECS.map(s => (s.t === '3. Quiz' ? { ...s, x: ask(['look at', 'look for']) } : s));
    const root = build({ secs });
    const r = audit(root, 1, recordFor(root, 1));
    say(/never the answer to a question of their own/.test(r.errors.join(' ')),
      'an item the quiz never asks about fails', r.errors.join(' | '));
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

  // 17. a vocabulary line that quotes some items and leaves others bare is read WHOLE. Reading only
  //     the quoted run silently drops the bare tail, and that is not hypothetical: it made a real
  //     lesson's 70% floor be computed over 7 of its 12 items. Here the bare item is trained nowhere,
  //     so a parser that stops at the quotes reports nothing at all.
  {
    const secs = SECS.map(s => (s.t === '2. Training' ? { ...s, x: 'nothing here' } : s));
    const root = build({ secs, vocabRaw: '"look at", "look for", look up' });
    const r = audit(root, 1, recordFor(root, 1));
    say(/trained nowhere/.test(r.errors.join(' ')),
      'a bare (unquoted) vocabulary item is read too', r.errors.concat(r.warns).join(' | '));
  }
  // 18. text that runs across adjacent elements still yields whole words: `<td>yeah</td><td>yes</td>`
  //     arrives as `yeahyes` through textContent and defeats a trailing word boundary, which is how
  //     three items came to be reported as trained nowhere while sitting in a table.
  {
    const secs = SECS.map(s => (s.t === '2. Training' ? { ...s, x: '<b>look up</b><span>now</span>' } : s));
    const root = build({ secs });
    const r = audit(root, 1, recordFor(root, 1));
    say(r.errors.length === 0 && !/do not appear on the page/.test(r.warns.join(' ')),
      'adjacent inline elements still read as separate words', r.errors.concat(r.warns).join(' | '));
  }

  // 19. an item that appears in the quiz ONLY as a distractor. This is the defect that made a quiz look
  //     thorough while asking nothing: `re.test(quizText)` matched the wrong option and the item counted
  //     as tested. A distractor is not an answer.
  {
    const trap = '<div class="qitem" data-a="a"><div class="qopts">' +
      '<label><input type="radio" name="t" value="a"> nothing at all</label>' +
      '<label><input type="radio" name="t" value="b"> look up</label></div></div>';
    const secs = SECS.map(s => (s.t === '3. Quiz' ? { ...s, x: ask(['look at', 'look for']) + trap } : s));
    const root = build({ secs });
    const r = audit(root, 1, recordFor(root, 1));
    say(/look up/.test(r.errors.join(' ')) && /never the answer to a question of their own/.test(r.errors.join(' ')),
      'a distractor does not count as a test', r.errors.concat(r.warns).join(' | '));
  }
  // 20. an item mentioned in the quiz's prose, with no question about it at all
  {
    const secs = SECS.map(s => (s.t === '3. Quiz' ? { ...s, x: 'remember look at, look for and look up' } : s));
    const root = build({ secs });
    const r = audit(root, 1, recordFor(root, 1));
    say(/3 of 3 present item\(s\) are never the answer/.test(r.errors.join(' ')),
      'prose is not a question', r.errors.concat(r.warns).join(' | '));
  }
  // 21. one question whose answer names two items: it tests neither on its own
  {
    const both = '<div class="qitem" data-a="a"><div class="qopts">' +
      '<label><input type="radio" name="b1" value="a"> look at and look for</label>' +
      '<label><input type="radio" name="b1" value="b"> nothing at all</label></div></div>';
    const secs = SECS.map(s => (s.t === '3. Quiz' ? { ...s, x: both + ask(['look up']) } : s));
    const root = build({ secs });
    const r = audit(root, 1, recordFor(root, 1));
    say(/name more than one new item/.test(r.warns.join(' ')) &&
      /look at, look for/.test(r.errors.join(' ')),
      'one answer cannot test two items', r.errors.concat(r.warns).join(' | '));
  }
  // 22. a concept marked in the quiz on a block with no answerable control: a label, not a question
  {
    const secs = SECS.map(s => (s.t === '3. Quiz' ? { ...s, x: 'nothing to answer here', p: 'tense/fixture' } : s));
    const root = build({ secs });
    const r = audit(root, 1, recordFor(root, 1));
    say(/sit on a block with no answerable control/.test(r.warns.join(' ')),
      'a concept label with no question is reported', r.errors.concat(r.warns).join(' | '));
  }

  for (const d of dirs) { try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* temp */ } }
  console.log(fails === 0 ? '\n✅ selftest green' : '\n❌ selftest FAILED (' + fails + ')');
  process.exit(fails ? 1 : 0);
}



