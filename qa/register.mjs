/**
 * qa/register.mjs — did the track's voice actually reach the page?
 *
 * `<TRACK>-REGISTER.md` says the uninhibited voice and its taboo language are core content of most
 * contexts, masked in the forms the model mandates ('f---', 'shi-', 'c---'). A register is not a wording
 * rule that a page either obeys or breaks — it is a presence, and presence is what silently drains. So
 * this harness checks presence, not craft:
 *
 *   FAIL  a track with 5+ pages has no page carrying any taboo or street marker at all
 *         (and, for a track whose register demands slang, no page carrying colloquial markers either)
 *   WARN  coverage of either is under half the pages
 *   WARN  a mandated-masked word is spelled out ('fuck'/'shit'/'cunt') — read it before changing anything:
 *         a sheet/shit listening pair has to print the spelling to be a pair, prose does not
 *   WARN  a word from the register's own `formal` tells, or from its `locale` tells (a British word in an
 *         American scene) — quoted, because "flat" and "cheers" have honest American lives of their own
 *
 * The marker lists are NOT this file's. It reads the "Tells, for the checker" block out of the track's
 * register file, so a track's vocabulary lives where its policy lives; with no block it says so in one line
 * and judges nothing, rather than inventing a register or silently passing.
 *
 * Deliberately NOT checked: whether a specific swear sits next to advice, whether the scene is register
 * (a), whether the slang has dated, and whether an unmasked word is a mistake or a minimal pair. That is
 * the author's judgement and it is visible to a reader; a harness that tried to grade it would go red on
 * taste and be ignored within a lesson or two.
 *
 * SCOPE: a voice detector defaults to what the task touched — the lesson pages changed in the working tree
 * or in the last commit — because a register report about a track nobody is writing is noise. `--track=adult`
 * or `--track=adult 7` names pages outright; `--all` sweeps every track, which is what a pre-release audit
 * wants. The track-level coverage verdict is still measured over every page on disk, so three new pages can
 * never conclude "dead track".
 *
 * Run: node qa/register.mjs [--track=kids|business|adult] [--all] [lessonNumber ...]
 *      node qa/register.mjs --tells    prints the parsed vocabulary and the tier sizes, reads no page
 */
import { qaOff } from './off.mjs'; qaOff('register'); /* QA OFF - see qa/off.mjs */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lessonsOnDisk, hasTrackFlag, hasAllFlag, pickNumbers, missingTargets, scopeLabel,
  touchedScope, pickVoiceTracks, pickVoiceLessons } from './track.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/* the three words the register file mandates masking — spelled out is worth a look, not a verdict: a
   sheet/shit/shoot listening pair has to print the spelling to be a pair, so this only ever warns. */
const UNCENSORED = /\b(?:fuck(?:s|ed|ing|er|ers)?|shit(?:s|ty|ting)?|cunt(?:s)?)\b/gi;
/* the masked forms carry the register too, and they are not words a tells list can hold. Euphemisms are
   NOT here: "freaking", "fricking" and "shoot" are the opposite evidence — a softened word is a costume,
   and counting it would let a page pass by wearing one. */
const MASKED = /\bf---|\bshi-|\bc---/gi;

/* The marker lists are NOT this file's. They are read from the track's own register file, in its
   "Tells, for the checker" block — so the vocabulary lives where the policy lives, and this harness tests
   what that track says its voice is. There are no defaults: a track that has declared nothing has no floor,
   and the report says so. Supplying words of our own would be this harness inventing a register.
   Keys are family and tier (`street-core`, `sexual-situational`); `taboo`, `street` and `sexual` are presence,
   `formal` and `locale` are negative tells. The tiers are the register's instruction to the AUTHOR — where a
   word belongs between "any lesson" and "only this scene" — and are reported, never scored: no harness can
   know whether a scene earned "catch a body". */
const FAMILIES = ['taboo', 'street', 'sexual', 'formal', 'locale'];
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
const listRe = list => {
  const w = String(list || '').split(',').map(s => escRe(s.trim())).filter(Boolean);
  return w.length ? new RegExp('\\b(?:' + w.join('|') + ')\\b', 'gi') : null;
};
function tellsOf(track) {
  const f = path.join(ROOT, track.toUpperCase() + '-REGISTER.md');
  const out = { owes: false, own: false, byFam: {}, byTier: {}, byKey: {} };
  if (!fs.existsSync(f)) return out;
  out.owes = true;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*[-*]\s*([a-z]+(?:-[a-z]+)?)\s*:\s*(.+?)\s*$/i);
    if (!m) continue;
    const k = m[1].toLowerCase(), fam = k.split('-')[0];
    if (!FAMILIES.includes(fam)) continue;
    out.byFam[fam] = out.byFam[fam] ? out.byFam[fam] + ', ' + m[2] : m[2];
    const items = m[2].split(',').map(s => s.trim().toLowerCase().replace(/^["']|["']$/g, '')).filter(Boolean);
    out.byTier[k] = (out.byTier[k] || 0) + items.length;
    out.byKey[k] = (out.byKey[k] || []).concat(items);
    out.own = true;
  }
  return out;
}

const hits = (html, re) => (re ? (html.match(re) || []) : []);
const count = (html, re) => hits(html, re).length;
const distinct = (html, re) => new Set(hits(html, re).map(s => s.toLowerCase())).size;
const uniq = a => [...new Set((a || []).map(s => s.toLowerCase()))];

/* `--tells` prints the parsed vocabulary and exits: it is a self-test of the register file's block and the
   tiers in it, and it reads no page. */
if (process.argv.includes('--tells')) {
  for (const t of ['adult', 'business', 'kids']) {
    const T = tellsOf(t);
    if (!T.owes) { console.log('— ' + t + ': no register file'); continue; }
    if (!T.own) { console.log('— ' + t + ': no "Tells, for the checker" block'); continue; }
    console.log('— ' + t);
    for (const fam of FAMILIES) {
      const tiers = Object.keys(T.byTier).filter(k => k.split('-')[0] === fam);
      if (!tiers.length) continue;
      const items = T.byFam[fam].split(',').filter(s => s.trim()).length;
      console.log('   ' + fam + ': ' + items + ' items · ' + tiers.map(k => k + ' ' + T.byTier[k]).join(' · '));
    }
    /* one item, one key: a word listed twice is counted twice and, worse, makes the tier meaningless —
       "5-0" in common and "five-o" in rare is the same word wearing two labels. Spelling variants cannot be
       caught here, so the register file carries that rule in prose. */
    const where = {};
    for (const k of Object.keys(T.byKey)) for (const w of T.byKey[k]) (where[w] = where[w] || []).push(k);
    const dups = Object.keys(where).filter(w => where[w].length > 1);
    console.log(dups.length
      ? '   ⚠ listed twice: ' + dups.map(w => w + ' (' + where[w].join(', ') + ')').join(' · ')
      : '   ✅ no item listed twice');
  }
  process.exit(0);
}

const scope = hasTrackFlag() || hasAllFlag() ? null : touchedScope();
const tracks = pickVoiceTracks();
if (!tracks.length) {
  console.log(!hasTrackFlag() && !hasAllFlag()
    ? '✅ nothing touched: no lesson page changed in the working tree or the last commit (--all sweeps every page)'
    : '✅ no lesson pages');
  process.exit(0);
}
const strict = hasTrackFlag();
const ghosts = missingTargets(tracks, pickNumbers());
if (ghosts.length) { console.log('❌ lesson ' + ghosts.join(', ') + ' does not exist in ' + scopeLabel(tracks)); process.exit(1); }

let bad = 0, warned = 0;
for (const TRACK of tracks) {
  const allNums = lessonsOnDisk(TRACK);
  if (!allNums.length) { if (strict) { console.log('✅ no ' + TRACK + ' lesson pages'); } continue; }
  const sample = new Set(pickVoiceLessons(TRACK, scope)
    .filter(n => fs.existsSync(path.join(ROOT, TRACK, 'lesson' + n + '.html'))));
  if (!sample.size) { if (strict) { console.log('✅ nothing touched in ' + TRACK); } continue; }

  /* the coverage verdict is a property of the whole track, so it is measured over every page on disk even
     when only some pages are being reported: a sample of three new pages must not conclude "dead track". */
  const T = tellsOf(TRACK);
  const RE_T = listRe(T.byFam.taboo), RE_S = listRe(T.byFam.street), RE_X = listRe(T.byFam.sexual),
    RE_F = listRe(T.byFam.formal), RE_L = listRe(T.byFam.locale);
  const lines = allNums.map(n => {
    const raw = fs.readFileSync(path.join(ROOT, TRACK, 'lesson' + n + '.html'), 'utf8');
    const leaks = (raw.match(UNCENSORED) || []).map(s => s.toLowerCase());
    return { n, t: count(raw, RE_T) + count(raw, MASKED), s: distinct(raw, RE_S), x: distinct(raw, RE_X),
      formal: T.own ? uniq(hits(raw, RE_F)) : [], locale: T.own ? uniq(hits(raw, RE_L)) : [],
      leaks: [...new Set(leaks)], leakCount: leaks.length };
  });
  const hasVoice = l => !!(l.t || l.s >= 2 || l.x);
  const witTaboo = lines.filter(l => l.t).length;
  const witSlang = lines.filter(l => l.s >= 2).length;
  const witBed = lines.filter(l => l.x).length;

  /* A track owes the voice only when its own file says what that voice is: a register file with no tells
     block has not declared a floor, and judging it against words of our own would report every one of its
     pages as neutral — 107 warnings on a green run, which is how a report stops being read. */
  const owes = T.owes && T.own;
  console.log('— ' + TRACK + ' · ' + sample.size + (sample.size === allNums.length ? '' : ' of ' + allNums.length)
    + ' page(s) · track taboo ' + witTaboo + ' (' + Math.round((witTaboo / allNums.length) * 100) + '%)'
    + ' · track colloquial ' + witSlang + ' (' + Math.round((witSlang / allNums.length) * 100) + '%)'
    + ' · track bedroom ' + witBed + ' (' + Math.round((witBed / allNums.length) * 100) + '%)');
  if (T.owes && !T.own) {
    warned++;
    console.log('⚠  ' + TRACK + ': ' + TRACK.toUpperCase()
      + '-REGISTER.md has no "Tells, for the checker" block — this track has declared no floor, so its pages are counted and not judged');
  }

  for (const l of lines) {
    if (!sample.has(l.n)) continue;
    const id = TRACK + '/lesson' + l.n;
    if (l.formal.length || l.locale.length) {
      warned++;
      console.log('⚠  ' + id + '  tells: '
        + (l.formal.length ? 'formal «' + l.formal.join('», «') + '»' : '')
        + (l.formal.length && l.locale.length ? ' · ' : '')
        + (l.locale.length ? 'not American «' + l.locale.join('», «') + '»' : '')
        + ' — read it: the tells are a floor, the persona test decides');
    }
    if (l.leaks.length) {
      warned++;
      console.log('⚠  ' + id + '  unmasked: ' + l.leaks.join(', ') + ' ×' + l.leakCount
        + ' — read it: the register masks as f--- / shi- / c---, but a minimal pair needs the spelling'
        + '  (taboo ' + l.t + ' · colloquial ' + l.s + ')');
    }
    else if (hasVoice(l)) console.log('✅ ' + id + '  taboo ' + l.t + ' · colloquial ' + l.s + ' · bedroom ' + l.x);
    else if (owes) { warned++; console.log('⚠  ' + id + '  register-neutral page (no taboo, no street, no bedroom marker)'); }
  }

  if (owes) {
    if (allNums.length >= 5 && witTaboo === 0) {
      bad++;
      console.log('❌ ' + TRACK + ': 0 of ' + allNums.length + ' pages carry any taboo or street marker — the register never reached the track');
    } else if (witTaboo / allNums.length < 0.5) {
      warned++;
      console.log('⚠  ' + TRACK + ': taboo in ' + witTaboo + ' of ' + allNums.length + ' pages — under half; see ISSUES.md');
    }
    if (allNums.length >= 5 && witSlang === 0) {
      bad++;
      console.log('❌ ' + TRACK + ': 0 of ' + allNums.length + ' pages carry any colloquial marker — the voice never reached the track');
    } else if (witSlang / allNums.length < 0.5) {
      warned++;
      console.log('⚠  ' + TRACK + ': colloquial markers in ' + witSlang + ' of ' + allNums.length + ' pages — under half; see ISSUES.md');
    }
  }
}

console.log('\n' + (bad
  ? '❌ ' + bad + ' register finding(s)'
  : '✅ no unmasked taboo, no register-dead track' + (warned ? '  (' + warned + ' warning(s) — recorded, not blocking)' : '')));
process.exit(bad ? 1 : 0);
