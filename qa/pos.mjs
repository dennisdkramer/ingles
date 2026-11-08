/**
 * qa/pos.mjs — label parts of speech and emit `.pos-*` markup for a sentence.
 *
 * Why this exists: a grammar page shows a sentence, then names one word's job. Doing that by hand
 * is slow, and it drifts as sentences are edited — the label lands on the wrong word and nothing
 * notices. This tags deterministically, so a build can call it and a check can disagree with it.
 *
 * No dependencies, no model, no network: a closed-class lexicon (function words are finite and
 * certain), then morphology (suffixes only one class takes), then local context. Every tag carries
 * the reason it was chosen, so `--tags` can be read and argued with.
 *
 * Usage:
 *   node qa/pos.mjs "The student who won quietly told me that she had never believed it."
 *   node qa/pos.mjs --tags  "…"     word · tag · the rule that decided it
 *   node qa/pos.mjs --check "…"     only the open-class words nothing could place
 *   node qa/pos.mjs --text  "…"     the sentence with tags in brackets, for review
 *
 * Output on stdout: one line of HTML, punctuation left outside the spans.
 */

const LEX = {
  det: 'the a an this that these those my your his her its our their some any no every each either neither another such all both few many much more most little less enough'.split(' '),
  pron: 'i you he she it we they me him us them myself yourself himself herself itself ourselves themselves someone anyone everyone nobody somebody anybody everybody something anything everything nothing mine yours hers ours theirs one'.split(' '),
  prep: 'in on at to by for with about under over into onto from off through during before after between among against without within across behind beyond up down near since until till per via despite beside besides around along toward towards inside outside above below'.split(' '),
  conj: 'and but or so because although though while if unless when whenever where whereas than that whether nor yet'.split(' '),
  aux: 'be is am are was were been being have has had having do does did doing will would can could shall should may might must ought'.split(' '),
  wh: 'who whom whose what which when where why how'.split(' '),
  adv: 'not never always often sometimes usually already still just only even too very really quite rather almost soon then now here there again also perhaps maybe ever once twice away back out however therefore instead anyway actually probably definitely honestly basically literally lowkey yesterday today tomorrow tonight later recently afterwards beforehand'.split(' '),
};
const IN = {};
for (const k of Object.keys(LEX)) for (const w of LEX[k]) IN[w] = k;

const CLS = { n: 'n', v: 'v', adj: 'adj', adv: 'adv', det: 'det', pron: 'pron', prep: 'prep', conj: 'conj', aux: 'aux', wh: 'wh', num: 'num' };
const PUNCT = /^[.,;:!?()"'“”‘’—-]+$/;

/* irregular past forms: no suffix to read, so they are listed. This is the same set the roadmaps
   teach as "irregular verbs" — if a form is missing there it will show up in --check. */
const IRREG = ('told said went came took gave made knew thought saw found got ate drank wrote spoke broke chose ' +
  'drove felt left met paid ran sat slept stood swam threw understood wore beat bought brought caught taught fought ' +
  'held kept lost meant sent spent built heard won became began forgot began rode rose sang sank spoke stole stuck ' +
  'swept woke wore woke ate fell flew froze hid hit hurt let put read shut cut cost bet burst').split(' ');

/* closed-class adjectives and quantifiers: finite, and the suffix rules cannot see them */
const ADJ_CLOSED = 'last next past few other same own whole first second third main only such own dear poor'.split(' ');
for (const w of ADJ_CLOSED) IN[w] = 'adj';

/* common adjectives with no giveaway suffix. Listed rather than inferred, because a positional
   guess ("noun after determiner") would call `school` in "the school bus" an adjective. Grows by
   addition when --check reports one; never by a rule that can misfire. */
const ADJ_OPEN = ('hard easy tired bored excited interesting difficult simple happy sad angry hungry thirsty ' +
  'big small tall short long fast slow new old young early late good bad nice awful terrible great silly ' +
  'serious careful quiet loud clean dirty cheap expensive funny boring kind rude busy free full empty safe ' +
  'dangerous healthy sick strong weak soft rough wet dry hot cold warm cool bright dark heavy light').split(' ');
for (const w of ADJ_OPEN) if (!IN[w]) IN[w] = 'adj';

function tokenize(s) {
  return s.match(/[A-Za-z0-9'’-]+|[.,;:!?()"'“”‘’]|—/g) || [];
}
const lower = t => t.toLowerCase().replace(/’/g, "'");
const isCap = t => /^[A-Z]/.test(t);


const SUF = [
  [/(?:tion|sion|ment|ness|ity|ance|ence|ship|hood|ism)$/, 'n', 'noun suffix'],
  [/(?:ous|ful|less|ive|able|ible|ical|ish)$/, 'adj', 'adjective suffix'],
  [/ly$/, 'adv', 'adverb suffix -ly'],
];
/* these lean verb, but flip to adjective after a determiner or be: the running water / it is broken */
const BOTH = /(?:ing|ed)$/;
/* -ing words that are nouns and never participles: the suffix cannot tell "a thing" from
   "is running", and after a determiner the -ing rule was making "thing" an adjective. */
const ING_NOUN = ('thing morning evening wedding meeting building beginning ending feeling ' +
  'painting meaning ceiling clothing housing training gathering').split(' ');

function tag(words) {
  const out = [];
  words.forEach((w, i) => {
    const t = lower(w);
    const prev = i ? out[i - 1] : null;
    const prev2 = i > 1 ? out[i - 2] : null;
    const ptag = prev ? prev.tag : null;
    const next = i + 1 < words.length ? lower(words[i + 1]) : '';
    const rec = (tg, why) => out.push({ w, tag: tg, why });

    if (PUNCT.test(w)) return rec('punct', 'punctuation');
    if (/^\d+$/.test(w)) return rec('num', 'digits');

    /* 1. closed class: a finite list, no guessing */
    if (IN[t]) {
      if (t === 'to' && (IN[next] === 'aux' || !IN[next])) return rec('aux', 'to + verb = infinitive marker');
      if (t === 'that' && ptag === 'v') return rec('conj', 'that after a verb = clause link');
      return rec(IN[t], 'closed-class lexicon');
    }
    if (/n't$/.test(t)) return rec('aux', 'negated auxiliary');
    if (IRREG.indexOf(t) !== -1) {
      if (ptag === 'det' || ptag === 'adj') return rec('adj', 'irregular form used as a description');
      return rec('v', 'irregular past form (listed)');
    }

    /* 2. an auxiliary other than be has already decided the word after it: "would finish", "can run".
       This runs BEFORE the suffix rules, because a suffix reads one word alone and "-ish" in
       "finish" is not an adjective once "would" is in front of it. be is excluded on purpose:
       "is happy", "is ready" are adjectives, so be leaves the decision open. */
    if (ptag === 'aux' && !/^(be|is|am|are|was|were|been|being)$/.test(lower(prev.w)))
      return rec('v', 'after an auxiliary (not be) = verb');
    /* be is the exception the rule above leaves open, so it gets its own: after be the word is the
       state being described ("is happy", "were ready") unless it is a participle form, which the
       BOTH pattern recognises. Without this, "were ready" was reaching the generic aux rule below
       and becoming a verb. */
    if (ptag === 'aux' && /^(be|is|am|are|was|were|been|being)$/.test(lower(prev.w))) {
      if (BOTH.test(t) || /(?:ed|en)$/.test(t)) return rec('v', 'be + participle = verb form');
      return rec('adj', 'after be = the state being described');
    }
    /* an auxiliary two words back still governs the verb: "have never SEEN", "would not FINISH" */
    if (prev2 && /^(aux)$/.test(IN[lower(prev2.w)] || '') && /(?:ed|en)$/.test(t)) {
      return rec('v', 'verb form with an auxiliary two words back');
    }

    /* 3. morphology: a suffix only one class takes */
    for (const [re, tg, why] of SUF) if (re.test(t) && t.length > 4) return rec(tg, why);
    if (ING_NOUN.indexOf(t) !== -1) return rec('n', '-ing word that is a noun (listed)');
    if (BOTH.test(t) && t.length > 4) {
      if (ptag === 'det' || ptag === 'adj' || ptag === 'wh') return rec('adj', '-ing/-ed as a description here');
      return rec('v', '-ing/-ed verb form');
    }
    if (/(?:er|or)$/.test(t) && t.length > 4) return rec('n', 'agent-noun suffix');
    if (/est$/.test(t) && t.length > 4) return rec('adj', 'superlative suffix');

    /* 3. local context */
    if (ptag === 'det' || ptag === 'adj') return rec('n', 'after a determiner/adjective = noun');
    if (ptag === 'aux') return rec('v', 'after an auxiliary = verb');
    if (ptag === 'wh') return rec('v', 'after a wh-word = the verb of its clause');
    if (ptag === 'adv' && /^(very|so|too|quite|really|rather)$/.test(lower(prev.w))) return rec('adj', 'after an intensifier = adjective');
    if (ptag === 'prep') return rec('n', 'after a preposition = noun');
    if (ptag === 'pron') return rec('v', 'after a pronoun = verb');
    if (isCap(w) && i > 0) return rec('n', 'capitalised mid-sentence = proper noun');

    /* 4. nothing knew it: call it a noun and say so, so --check can report it */
    return rec('n', 'UNPLACED - defaulted to noun');
  });

  /* 5. repair pass, right to left: English puts the disambiguating word AFTER the ambiguous one —
     "the OLDER players" is an adjective only because a noun follows it. So read the noun, then
     retag the word in front of it. */
  for (let i = out.length - 1; i >= 1; i--) {
    const head = out[i], mod = out[i - 1];
    if (head.tag !== 'n' || mod.tag !== 'n') continue;
    if (/(?:er|est)$/.test(lower(mod.w))) {
      mod.tag = 'adj'; mod.why = 'comparative + noun = adjective';
    }
  }
  return out;
}

const argv = process.argv.slice(2);
const isFlag = a => /^--/.test(a);
const mode = isFlag(argv[0]) ? argv[0] : '';
const sentence = (isFlag(argv[0]) ? argv.slice(1) : argv).join(' ').trim();
if (!sentence) { console.error('usage: node qa/pos.mjs [--tags|--check|--text] "sentence"'); process.exitCode = 2; }
else {
  const row = tag(tokenize(sentence));

  if (mode === '--tags') {
    for (const r of row) console.log(r.w.padEnd(14) + ' ' + String(r.tag).padEnd(6) + ' ' + r.why);
  } else if (mode === '--check') {
    const bad = row.filter(r => r.why.indexOf('UNPLACED') === 0);
    console.log(bad.length ? bad.map(r => r.w).join(', ') : 'all placed');
  } else if (mode === '--text') {
    console.log(row.map(r => (r.tag === 'punct' ? r.w : r.w + '[' + r.tag + ']')).join(' '));
  } else {
    console.log(row.map((r, i) => {
      if (r.tag === 'punct') return r.w;
      const glue = (i === 0 || /^['’]/.test(r.w)) ? '' : ' ';
      return glue + '<span class="pos-' + CLS[r.tag] + '">' + r.w + '</span>';
    }).join('').replace(/ ([.,;:!?])/g, '$1').trim());
  }
}
