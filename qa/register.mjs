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
 * register file, so a track's vocabulary lives where its policy lives; with no block it falls back to the
 * defaults and says so, rather than inventing a register or silently passing.
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
 */
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
/* the masked forms carry the register too, and they are not words a tells list can hold */
const MASKED = /\bf---|\bshi-|\bc---|\bfrickin|\bfreakin/gi;

/* The marker lists are NOT this file's. They are read from the track's own register file, in its
   "Tells, for the checker" block — so the vocabulary lives where the policy lives, and this harness tests
   what that track says its voice is. A register file with no block falls back to these defaults and says
   so in the report: a silent pass would be this harness inventing a register. */
const DEFAULTS = {
  taboo: 'damn, hell, ass, asshole, bitch, bastard, piss, screwed, freaking',
  street: "ain't, gonna, wanna, gotta, y'all, finna, lowkey, highkey, dude, my bad, no way, for sure",
  formal: 'however, therefore, furthermore, moreover, in addition, regarding, please be advised',
  locale: 'mate, cheers, bloody, loo, flat, lift, queue, rubbish',
};
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
const listRe = list => new RegExp('\\b(?:'
  + list.split(',').map(s => escRe(s.trim())).filter(Boolean).join('|') + ')\\b', 'gi');
function tellsOf(track) {
  const f = path.join(ROOT, track.toUpperCase() + '-REGISTER.md');
  const out = Object.assign({ owes: false, own: false }, DEFAULTS);
  if (!fs.existsSync(f)) return out;
  out.owes = true;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*[-*]\s*(taboo|street|formal|locale)\s*:\s*(.+?)\s*$/i);
    if (m) { out[m[1].toLowerCase()] = m[2]; out.own = true; }
  }
  return out;
}

const count = (html, re) => (html.match(re) || []).length;
const distinct = (html, re) => new Set((html.match(re) || []).map(s => s.toLowerCase())).size;
const uniq = a => [...new Set((a || []).map(s => s.toLowerCase()))];

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
  const RE_T = listRe(T.taboo), RE_S = listRe(T.street), RE_F = listRe(T.formal), RE_L = listRe(T.locale);
  const lines = allNums.map(n => {
    const raw = fs.readFileSync(path.join(ROOT, TRACK, 'lesson' + n + '.html'), 'utf8');
    const leaks = (raw.match(UNCENSORED) || []).map(s => s.toLowerCase());
    return { n, t: count(raw, RE_T) + count(raw, MASKED), s: distinct(raw, RE_S),
      formal: T.own ? uniq(raw.match(RE_F)) : [], locale: T.own ? uniq(raw.match(RE_L)) : [],
      leaks: [...new Set(leaks)], leakCount: leaks.length };
  });
  const witTaboo = lines.filter(l => l.t).length;
  const witSlang = lines.filter(l => l.s >= 2).length;

  /* A track owes the voice only when its own file says what that voice is: a register file with no tells
     block has not declared a floor, and judging it against these defaults would report every one of its
     pages as neutral — 107 warnings on a green run, which is how a report stops being read. */
  const owes = T.owes && T.own;
  console.log('— ' + TRACK + ' · ' + sample.size + (sample.size === allNums.length ? '' : ' of ' + allNums.length)
    + ' page(s) · track taboo ' + witTaboo + ' (' + Math.round((witTaboo / allNums.length) * 100) + '%)'
    + ' · track colloquial ' + witSlang + ' (' + Math.round((witSlang / allNums.length) * 100) + '%)');
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
    else if (l.t || l.s >= 2) console.log('✅ ' + id + '  taboo ' + l.t + ' · colloquial ' + l.s);
    else if (owes) { warned++; console.log('⚠  ' + id + '  register-neutral page (no taboo, no colloquial marker)'); }
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
