/**
 * qa/prose.mjs — the page's own sentences: is a claim one a student could check, and is the
 * explanation sized to what the lesson actually teaches?
 *
 * Two rules from PEDAGOGY-MAP [AUTHORING] [Claims, practice and budget]:
 *
 *   q) a claim is made only if it is true and checkable on this page. This harness cannot verify a
 *      claim — that is the author's job, and no parser holds the truth of English. What it CAN do is
 *      refuse the SHAPE of a claim that is unfalsifiable by construction: an absolute about all of
 *      history ("no human has ever"), a claim about the whole class of phrasal verbs from a lesson that
 *      teaches ten of them, and a name coined for a class of words this repo already names. Those FAIL.
 *      A history, an absolute or a coinage that MIGHT be true is a WARN — the rule allows it, so the
 *      harness names the sentence and asks for the source instead of overruling the author.
 *
 *   r) prose is budgeted against what the lesson teaches. Allowance = 60 words per taught element
 *      (every roadmap `- Vocabulary:` item + every pid on `teaches:`) + 240, and no section may spend
 *      more than 40% of it. The measure is the running explanation: <p> and .lead outside .dialog,
 *      .qstem, .qopts, .game-how, .blanks and tables. A rule stated inside a chart cell is inside the
 *      budget's intent, so it is not counted — the budget stops the commentary, not the teaching.
 *      One sentence per section may talk about the lesson itself; a second is a WARN, because that
 *      commentary is the part that grows without bound.
 *
 * WHY THE BUDGET SCALES WITH THE LESSON: a lesson whose concept is one form needs a paragraph and a
 * table; a lesson carrying twelve items needs almost no prose, because the items are the content. One
 * flat cap punishes the first to restrain the second, and a cap set for the second starves the first.
 * The unit both share is the taught element, so that is the unit.
 *
 * SCOPE: structural, like content and overflow — every page on disk, or the ones named. `--selftest`
 * proves each finding fires on a page built to contain it.
 *
 * Run: node qa/prose.mjs [--track=kids|business|adult] [lessonNumber ...] [--selftest]
 */
import { qaOff } from './off.mjs'; qaOff('prose'); /* QA OFF - see qa/off.mjs */
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pickTracks, hasTrackFlag, pickNumbers, pickLessons, missingTargets, scopeLabel } from './track.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roadmapFile = t => t.toUpperCase() + '-ROADMAP.md';

/* ---- [q] the shape of a claim that cannot be checked ------------------------ */
const LIES = [
  [/\b(no|not one|never a)\s+(human|person|one|word|sentence|student)\b[^.!?]{0,60}\b(has|have) ever\b|\bnobody has ever\b|\bno one has ever\b/i,
    'an absolute about all of history — nothing on this page can check it, and it is almost never true'],
  [/\b(every|all|no)\s+(single\s+)?phrasal verbs?\b/i,
    'a claim about the whole class of phrasal verbs, from a lesson that teaches its own few'],
];
const MIGHT_BE_TRUE = [
  [/\b(latin|greek|french|german|old english|anglo[- ]saxon|norse)\b/i,
    'a history claim — keep it only if it is real, and say where it came from'],
  [/\b(come|comes|came|derived?|derives?|originates?|roots?)\s+(from|in)\b/i,
    'a history claim — name the source or drop it'],
  [/\b(always|never|every time|without exception)\b/i,
    'an absolute inside an ordinary sentence — check it holds for every case this page shows'],
];
const COINED = [
  [/\btwins?\b/i, '"twin" is a label this repo does not use — name the formal verb itself'],
  [/\b(helper|glue|little|small|function)\s+words?\b/i, 'a coined class name — say which word you mean'],
  [/\bfamily unit\b/i, 'a coined class name — the roadmap calls it a family'],
];

/* ---- [r] what counts as running explanation --------------------------------- */
const NOT_PROSE = '.dialog, .qstem, .qopts, .game-how, .blanks, table, .chips, .qnum, .qline';
const META = /\b(this|that) is (the|a) (whole )?(method|trick|point|idea)\b|\bread (that|it|this) (twice|again)\b|\byou (will|'ll) see (this|it) again\b|\bnotice (that|how)\b|\bremember (this|that)\b/gi;

function sectionsOf(doc) {
  const area = doc.querySelector('.content-area');
  if (!area) return [];
  const out = [];
  let cur = null;
  for (const el of area.children) {
    if (/^H2$/i.test(el.tagName)) { cur = { title: el.textContent.replace(/\s+/g, ' ').trim(), nodes: [] }; out.push(cur); }
    else if (cur) cur.nodes.push(el);
  }
  return out;
}

/** the explanation in one section, and how often it talks about the lesson rather than English.
 *  TWO measures from one walk, because they answer different questions: `words` is the BUDGET, so it
 *  skips everything NOT_PROSE (tables, stems, options, the game's how-to); `claims` is the TRUTH scan,
 *  so it reads every sentence the student can see outside dialogue — including a claim sitting in a
 *  table cell, which is exactly where the sentence "no human has ever said this out loud" hid from an
 *  earlier version that excluded tables from both. Dialogue is out of the claim scan: a character may
 *  be wrong on purpose, and the page is not asserting what a character says. */
function proseOf(sec) {
  let words = 0, meta = 0;
  const budget = [], claims = [];
  const all = [];
  for (const el of sec.nodes) { all.push(el); for (const d of el.querySelectorAll('*')) all.push(d); }
  for (const el of all) {
    if (!el.matches('p, .lead, td, th, li, .game-how')) continue;
    if (el.querySelector('p, .lead, td, th, li, .game-how')) continue;   /* innermost only */
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!t) continue;
    if (!el.closest('.dialog')) claims.push(t);
    if (el.closest(NOT_PROSE)) continue;
    words += t.split(' ').filter(Boolean).length;
    budget.push(t);
    meta += (t.match(META) || []).length;
  }
  return { words, meta, text: budget.join(' '), claims: claims.join(' ') };
}

const lessonBlock = (text, n) => {
  const lines = text.split(/\r?\n/);
  const at = lines.findIndex(l => new RegExp('^##\\s+(?:Lesson\\s+' + n + '\\s*:|\\[' + n + '\\])').test(l));
  if (at < 0) return '';
  const out = [lines[at]];
  for (let i = at + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) out.push(lines[i]);
  return out.join('\n');
};
/* an entry's heading carries what its fields no longer repeat: teaches · vocabulary · example */
const headingSegs = block => {
  const line = String(block).split(/\r?\n/).find(l => /^##\s+\[\d+\]/.test(l));
  return line ? line.replace(/^##\s+\[\d+\]\s*-\s*/, '').split(/\s+·\s+/) : [];
};
const splitItems = s => String(s).split(/,\s*(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(x => x.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
const itemsOf = block => {
  const m = block.match(/^\s*-\s*Vocabulary:\s*(.*)$/m);
  const segs = headingSegs(block);
  return [...new Set([...(segs[1] ? splitItems(segs[1]) : []), ...(m ? splitItems(m[1]) : [])])];
};
const pidsOf = block => {
  const m = block.match(/^\s*-\s*teaches:\s*(.*)$/m);
  if (m) return [...m[1].matchAll(/`([^`]+)`/g)].map(x => x[1]);
  const segs = headingSegs(block);
  return segs[0] ? [...segs[0].matchAll(/`([^`]+)`/g)].map(x => x[1]) : [];
};

/** the whole verdict for one page, given its html and its own lesson's roadmap text */
function auditPage(html, block, n) {
  const errors = [], warns = [];
  const items = itemsOf(block), pids = pidsOf(block);
  if (!items.length && !pids.length) {
    warns.push('the roadmap names no vocabulary and no concept for this lesson, so the budget was not measured');
    return { errors, warns, total: 0, allowance: 0 };
  }
  const elements = items.length + pids.length;
  const allowance = 60 * elements + 240;
  const share = Math.round(allowance * 0.4);
  const doc = new JSDOM(html).window.document;
  let total = 0;
  sectionsOf(doc).forEach((sec, i) => {
    const p = proseOf(sec);
    total += p.words;
    if (p.words > share) {
      errors.push('section ' + (i + 1) + ' spends ' + p.words + ' words of explanation, over its ' + share +
        '-word share of a ' + allowance + '-word allowance (' + elements + ' taught elements)');
    }
    if (p.meta > 1) warns.push('section ' + (i + 1) + ' talks about the lesson ' + p.meta + ' times — one sentence per section');
    for (const [re, why] of LIES) {
      const m = p.claims.match(re);
      if (m) errors.push('section ' + (i + 1) + ': "' + m[0].trim() + '" — ' + why);
    }
    for (const [re, why] of MIGHT_BE_TRUE.concat(COINED)) {
      const m = p.claims.match(re);
      if (m) warns.push('section ' + (i + 1) + ': "' + m[0].trim() + '" — ' + why);
    }
  });
  if (total > allowance) {
    errors.push(total + ' words of explanation against a ' + allowance + '-word allowance for ' + elements + ' taught elements');
  }
  return { errors, warns, total, allowance };
}

function selftest() {
  let fails = 0;
  const say = (ok, name, detail) => { if (ok) console.log('✅ ' + name); else { fails++; console.log('❌ ' + name + (detail ? '\n      ' + detail : '')); } };
  const BLOCK = '## Lesson 1: One\n\n   - teaches: `tense/one`\n   - Vocabulary: "a", "b", "c"\n';
  const page = body => '<html><body><div class="content-area">' + body + '</div></body></html>';
  const run = (body, block = BLOCK) => auditPage(page(body), block, 1);

  { const r = run('<h2>1. One</h2><p>No human has ever said that sentence out loud.</p>');
    say(r.errors.some(e => /all of history/.test(e)), 'an unfalsifiable absolute fails', r.errors.join(' | ')); }
  { const r = run('<h2>1. One</h2><p>Every phrasal verb has a formal equivalent.</p>');
    say(r.errors.some(e => /whole class/.test(e)), 'a claim about the whole class fails', r.errors.join(' | ')); }
  { const r = run('<h2>1. One</h2><p>The word comes from Latin.</p>');
    say(!r.errors.length && r.warns.some(w => /history claim/.test(w)), 'a history is a warning, not a failure', r.errors.concat(r.warns).join(' | ')); }
  { const r = run('<h2>1. One</h2><p>They are twins.</p>');
    say(!r.errors.length && r.warns.some(w => /"twin"/.test(w)), 'a coined label is a warning', r.errors.concat(r.warns).join(' | ')); }
  // 5. 3 items + 1 concept = 480 words; the page is over it
  { const r = run('<h2>1. One</h2><p>' + 'word '.repeat(500) + '</p>');
    say(r.errors.some(e => /against a 480-word allowance/.test(e)), 'a page over its allowance fails', r.errors.join(' | ')); }
  // 6. a section over 40% fails even when the page total fits (192 of 480)
  { const r = run('<h2>1. One</h2><p>' + 'word '.repeat(200) + '</p><h2>2. Two</h2><p>' + 'word '.repeat(40) + '</p>');
    say(r.errors.some(e => /over its 192-word share/.test(e)), 'a section over its share fails', r.errors.join(' | ')); }
  // 7. dialogue, stems and table cells are not explanation
  { const body = '<h2>1. One</h2><div class="dialog"><p><b>ASH:</b> ' + 'word '.repeat(300) + '</p></div>' +
      '<table><tbody><tr><td>' + 'word '.repeat(300) + '</td></tr></tbody></table>' +
      '<div class="qgrid"><div class="qitem"><div class="qstem">' + 'word '.repeat(300) + '</div></div></div>';
    const r = run(body);
    say(r.errors.length === 0, 'dialogue, stems and tables are not counted', r.errors.join(' | ')); }
  // 8. one meta sentence is allowed, a second is reported
  { const once = run('<h2>1. One</h2><p>That is the whole method.</p>');
    const twice = run('<h2>1. One</h2><p>That is the whole method. Read that twice.</p>');
    say(once.warns.every(w => !/talks about the lesson/.test(w)) && twice.warns.some(w => /talks about the lesson/.test(w)),
      'a second meta sentence is reported', once.warns.concat(twice.warns).join(' | ')); }
  // 9. a false claim sitting in a TABLE CELL still fails. The budget skips tables; truth does not,
  //    and keeping the two together is how "no human has ever said this out loud" walked.
  { const r = run('<h2>1. One</h2><table><tbody><tr><td>Supervise your brother is a sentence no human has ever said out loud.</td></tr></tbody></table>');
    say(r.errors.some(e => /all of history/.test(e)), 'a claim inside a table is still a claim', r.errors.concat(r.warns).join(' | ')); }
  // 10. a character may be wrong on purpose: dialogue is not the page asserting anything
  { const r = run('<h2>1. One</h2><div class="dialog"><p><b>ASH:</b> No human has ever said that.</p></div>');
    say(r.errors.length === 0, 'dialogue is outside the claim scan', r.errors.join(' | ')); }
  // 11. a lesson with no roadmap entry is not measured, and says so rather than passing in silence
  { const r = auditPage(page('<h2>1. One</h2>'), '', 1);
    say(!r.errors.length && r.warns.some(w => /budget was not measured/.test(w)), 'no roadmap entry warns', r.warns.join(' | ')); }
  console.log(fails === 0 ? '\n✅ selftest green' : '\n❌ selftest FAILED (' + fails + ')');
  process.exit(fails ? 1 : 0);
}

if (process.argv.includes('--selftest')) selftest();

const tracks = pickTracks();
if (!tracks.length) { console.log('✅ no lesson pages'); process.exit(0); }
const strict = hasTrackFlag();
const ghosts = missingTargets(tracks, pickNumbers());
if (ghosts.length) { console.log('❌ lesson ' + ghosts.join(', ') + ' does not exist in ' + scopeLabel(tracks)); process.exit(1); }

let checked = 0, failed = 0, warned = 0;
for (const TRACK of tracks) {
  const lessons = pickLessons(TRACK);
  if (!lessons.length) { console.log('✅ no ' + TRACK + ' lesson pages'); continue; }
  const rmPath = path.join(ROOT, roadmapFile(TRACK));
  const roadmap = fs.existsSync(rmPath) ? fs.readFileSync(rmPath, 'utf8') : '';
  console.log('— ' + TRACK + ' lesson' + (lessons.length === 1 ? '' : 's') + ' ' + lessons.join(', '));
  for (const n of lessons) {
    const page = TRACK + '/lesson' + n + '.html';
    const abs = path.join(ROOT, page);
    if (!fs.existsSync(abs)) { if (strict) { console.log('❌ ' + page + ' page not found'); failed++; } continue; }
    let r;
    try { r = auditPage(fs.readFileSync(abs, 'utf8'), lessonBlock(roadmap, n), n); }
    catch (e) { r = { errors: ['threw: ' + e.message], warns: [], total: 0, allowance: 0 }; }
    checked++;
    const budget = r.allowance ? '  ' + r.total + '/' + r.allowance + ' words' : '';
    if (r.errors.length) { failed++; console.log('❌ ' + page + budget); r.errors.forEach(e => console.log('     - ' + e)); }
    else if (r.warns.length) { warned++; console.log('⚠  ' + page + budget); r.warns.forEach(e => console.log('     - ' + e)); }
    else console.log('✅ ' + page + budget);
  }
}
console.log('\n' + (failed ? '❌ ' + failed + ' of ' + checked + ' page(s) failed'
  : '✅ ' + checked + ' page(s): every claim is one a student could check, and every explanation is inside its budget'
    + (warned ? '  (' + warned + ' warning(s) — a claim worth a source, recorded in ISSUES.md)' : '')));
process.exit(failed ? 1 : 0);
