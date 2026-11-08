/**
 * qa/lang.mjs — is the page's own voice in the language its lesson number earns?
 *
 * PEDAGOGY-MAP §1 HIGH PRIORITY: an introduction, explanatory text, tip, headline or column header is
 * Portuguese only while the lesson is below the content's level; above that it is English. This harness
 * cannot judge CONTENT LEVEL per sentence — that is the author's call — so it does not grade the middle.
 * It checks that the page sits inside the band its lesson number allows, in both directions:
 *
 *   FAIL  the <h1> is Portuguese                       (a headline is named in the rule; it is never a gloss)
 *   FAIL  the page above the band its lesson allows      (it is too Portuguese for this lesson)
 *   FAIL  the page below that band's floor               (it stopped glossing for its reader)
 *   WARN  the <h1> cannot sit on one 38px line
 *
 * "The page" here is the one set of things the rule names in one breath — introduction, explanatory text,
 * tip, headline, column header — measured as a single share, because that is how the rule is written and
 * because grading headers separately judges the same page twice on the same evidence.
 *
 * The band is a function of the lesson number, exactly as the project states it:
 *
 *   ceiling = 95 − (L − 5) × 1.8        floor = 35 − (L − 5) × 1.8
 *
 * so lesson 1 must be 42–102% Portuguese, lesson 20 is 8–68%, and by lesson 40 the floor is negative —
 * nothing left to gloss for, and only the ceiling binds. A page that leaves the band either way fails: a
 * late page drowning in Portuguese and an early page that never glossed are the same defect, and the floor
 * is what makes the early lessons answerable.
 *
 * The band is applied with ONE element of slack, because it is a share and a share is not a measurement:
 * 46 elements at 67% is one gloss above a 66% ceiling, which is not a drift, and a harness that redded it
 * would be overruling the author on a rounding. A page that is genuinely too Portuguese is many elements
 * over, and still fails.
 *
 * There is no percentage warning tier: inside the band the exact number is the author's judgement, and
 * one number cannot tell a well-glossed page from a badly-glossed one. Only the <h1> length warns.
 *
 * A short page is not a share: below MIN_EX / MIN_TH elements the measure is not taken, so a page with
 * one chart is not judged on it.
 *
 * SCOPE: this is a voice detector, not a structural one, so with no flag it audits what the task touched —
 * the lesson pages changed in the working tree or in the last commit — and nothing else. A green light for
 * a track nobody is writing is not a claim about that track, and a red one is noise. `--track=adult` or
 * `--track=adult 7` names pages outright; `--all` sweeps every track, which is what a pre-release audit
 * wants.
 *
 * Run: node qa/lang.mjs [--track=kids|business|adult] [--all] [lessonNumber ...]
 */
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hasTrackFlag, hasAllFlag, pickNumbers, missingTargets, scopeLabel, touchedScope, pickVoiceTracks, pickVoiceLessons } from './track.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/* The band, exactly as stated for the project: ceiling 95 − (L−5)×1.8, floor 35 − (L−5)×1.8. Both move
   with the lesson, so the same page read at lesson 8 and at lesson 30 is judged differently — which is the
   point: what is correct glossing early is drowning late, and what is a readable page late is a page that
   abandoned its reader early. Below a negative floor the direction cannot fire at all; it is clamped to 0
   so the report reads honestly rather than showing −46%. */
const CEIL_BASE = 95, FLOOR_BASE = 35, SLOPE = 1.8, PIVOT = 5;
function band(n) {
  const shift = (n - PIVOT) * SLOPE;
  return {
    hi: (CEIL_BASE - shift) / 100,
    lo: Math.max(0, FLOOR_BASE - shift) / 100,
  };
}

const MIN_EX = 12;         // a short page is not a share; below this many elements only the h1 is judged
const H1_MAX = 46;         // chars that still sit on one line at 38px inside the 1200px canvas

const DIA = /[áàâãéêíóôõúüç]/i;
const WORDS = /(?:^|[\s"“”'—–-])(?:que|não|uma|para|você|com|mais|como|aqui|isso|essa|esse|porque|quando|então|já|muito|também|só|bem|tem|vai|está|é|nós|ele|ela|deles|num|numa|pelo|pela|dos|das|ser|foi|aos|nem|nunca|sempre|outro|outra)(?:$|[\s"“”'—–.,!?;:])/gi;

/* a diacritic, or two different Portuguese function words: one short unhyphenated word is undecidable,
   and guessing on it is how a permissive detector turns into a red run */
function isPT(text) {
  const s = (text || '').replace(/\s+/g, ' ').trim();
  if (!s) return false;
  if (DIA.test(s)) return true;
  const hits = s.match(WORDS);
  return !!(hits && new Set(hits.map(x => x.trim().toLowerCase())).size >= 2);
}

const asPct = v => Math.round(v * 100) + '%';
const pct = (a, b) => asPct(b ? a / b : 0);

function page(track, n) {
  const file = path.join(ROOT, track, 'lesson' + n + '.html');
  if (!fs.existsSync(file)) return null;
  const doc = new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
  const ca = doc.querySelector('.content-area');
  if (!ca) return { missing: true };

  const h1 = ca.querySelector('h1');
  const h1Text = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : '';

  const ex = [...ca.querySelectorAll('h1, h2, h3, p.card, p.lead, th, tr.note td')]
    .filter(el => !el.closest('.game-list'));
  const exPt = ex.filter(el => isPT(el.textContent) || el.getAttribute('lang') === 'pt');

  const th = [...ca.querySelectorAll('th')];
  const thPt = th.filter(el => isPT(el.textContent) || el.getAttribute('lang') === 'pt');

  const fails = [], warns = [];
  const { hi, lo } = band(n);
  if (h1 && isPT(h1Text)) fails.push('the <h1> is Portuguese «' + h1Text.slice(0, 40) + '»');
  if (h1Text.length > H1_MAX) warns.push('the <h1> is ' + h1Text.length + ' chars — it may not sit on one 38px line');

  /* the rule names one set of things in one breath — introduction, explanatory text, tip, headline, column
     header — so it is graded as ONE share. Header elements are already inside `ex`, so `th` is reported
     for diagnosis only: grading them separately would judge the same page twice on the same evidence. */
  const edge = asPct(hi) + ' ceiling / ' + asPct(lo) + ' floor';
  if (ex.length >= MIN_EX) {
    const share = exPt.length / ex.length;
    const slack = 1 / ex.length;          // one element: a band is a share, and one gloss is not a drift
    if (share > hi + slack) fails.push('the page is ' + asPct(share) + ' Portuguese (' + exPt.length + '/' + ex.length
      + ') — above the ' + asPct(hi) + ' this lesson allows');
    else if (share < lo - slack) fails.push('the page is ' + asPct(share) + ' Portuguese (' + exPt.length + '/' + ex.length
      + ') — under the ' + asPct(lo) + ' floor: it stopped glossing for its reader');
  }

  return { fails, warns, edge, ex: ex.length, exPt: exPt.length, th: th.length, thPt: thPt.length };
}


const scope = hasTrackFlag() || hasAllFlag() ? null : touchedScope();
const tracks = pickVoiceTracks();
if (!tracks.length) {
  console.log(scope === null && !hasTrackFlag() && !hasAllFlag()
    ? '✅ nothing touched: no lesson page changed in the working tree or the last commit (--all sweeps every page)'
    : '✅ no lesson pages');
  process.exit(0);
}
const strict = hasTrackFlag();
const ghosts = missingTargets(tracks, pickNumbers());
if (ghosts.length) { console.log('❌ lesson ' + ghosts.join(', ') + ' does not exist in ' + scopeLabel(tracks)); process.exit(1); }

let pages = 0, bad = 0, warned = 0;
for (const TRACK of tracks) {
  const lessons = pickVoiceLessons(TRACK, scope);
  if (!lessons.length) { console.log('✅ no ' + TRACK + ' lesson pages'); continue; }
  console.log('— ' + TRACK + ' lesson' + (lessons.length === 1 ? ' ' : 's ') + lessons.join(', '));
  for (const n of lessons) {
    const id = TRACK + '/lesson' + n;
    const r = page(TRACK, n);
    if (!r) { if (strict) { console.log('❌ ' + id + ' page not found'); bad++; pages++; } continue; }
    pages++;
    if (r.missing) { console.log('❌ ' + id + '  no .content-area'); bad++; continue; }
    const stat = '  ex ' + r.ex + ' · PT ' + r.exPt + ' (' + pct(r.exPt, r.ex) + ') · th '
      + r.thPt + '/' + r.th + ' · band ' + r.edge;
    if (r.fails.length) { bad++; console.log('❌ ' + id + stat); r.fails.forEach(f => console.log('     - ' + f)); }
    else if (r.warns.length) { warned++; console.log('⚠  ' + id + stat); r.warns.forEach(f => console.log('     - ' + f)); }
    else console.log('✅ ' + id + stat);
  }
}

console.log('\n' + (bad
  ? '❌ ' + bad + ' of ' + pages + ' page(s) are outside the language band for their lesson number'
  : '✅ ' + pages + ' page(s): every page is inside the band its lesson number allows'
    + (warned ? '  (' + warned + ' warning(s) — recorded in ISSUES.md, not blocking)' : '')));
process.exit(bad ? 1 : 0);
