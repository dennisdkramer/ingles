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
/* masked, or rough-but-unmasked language that carries the same register work */
const TABOO = /\bf---|\bshi-|\bc---|\bdamn\b|\bhell\b|\bass\b|\basshole\b|\bbitch\b|\bbastard\b|\bpiss\b|\bscrewed\b|\bfreaking\b|\bfrickin/g;
/* street / AAVE / internet markers — the voice, not the profanity */
const SLANG = /\bain'?t\b|\bgonna\b|\bwanna\b|\bgotta\b|\by'?all\b|\bfinna\b|\blowkey\b|\bhighkey\b|\bhook(?:ed)? up\b|\bbail(?:ed)?\b|\bcall it a night\b|\bcrash at\b|\bwhat'?s up\b|\bon read\b|\bno way\b|\bfor sure\b|\bshow(?:ing)? off\b|\bhang(?:ing)? out\b|\bmy bad\b|\bdude\b|\bmess with\b|\bfreak out\b/g;

/* which pages owe the register: only a track that actually ships a register file. business and kids have
   none on disk, so demanding a taboo floor of them would be this harness inventing a rule — and a run of
   90 permanent warnings is how a report stops being read. */
const TRACK_REGISTER = { adult: true, business: false, kids: false };

const count = (html, re) => (html.match(re) || []).length;
const distinct = (html, re) => new Set((html.match(re) || []).map(s => s.toLowerCase())).size;

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
  const lines = allNums.map(n => {
    const raw = fs.readFileSync(path.join(ROOT, TRACK, 'lesson' + n + '.html'), 'utf8');
    const leaks = (raw.match(UNCENSORED) || []).map(s => s.toLowerCase());
    return { n, t: count(raw, TABOO), s: distinct(raw, SLANG), leaks: [...new Set(leaks)], leakCount: leaks.length };
  });
  const witTaboo = lines.filter(l => l.t).length;
  const witSlang = lines.filter(l => l.s >= 2).length;

  const owes = !!TRACK_REGISTER[TRACK];
  console.log('— ' + TRACK + ' · ' + sample.size + (sample.size === allNums.length ? '' : ' of ' + allNums.length)
    + ' page(s) · track taboo ' + witTaboo + ' (' + Math.round((witTaboo / allNums.length) * 100) + '%)'
    + ' · track colloquial ' + witSlang + ' (' + Math.round((witSlang / allNums.length) * 100) + '%)');

  for (const l of lines) {
    if (!sample.has(l.n)) continue;
    const id = TRACK + '/lesson' + l.n;
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
