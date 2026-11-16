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
  wh: 'who whom whose what which when where why how whoever whatever whichever'.split(' '),
  adv: 'not never always often sometimes usually already still just only even too very really quite rather almost soon then now here there again also perhaps maybe ever once twice away back out however therefore instead anyway actually probably definitely honestly basically literally lowkey yesterday today tomorrow tonight later recently afterwards beforehand'.split(' '),
};
const IN = {};
for (const k of Object.keys(LEX)) for (const w of LEX[k]) IN[w] = k;

const CLS = { n: 'n', v: 'v', adj: 'adj', adv: 'adv', det: 'det', pron: 'pron', prep: 'prep', conj: 'conj', aux: 'aux', wh: 'wh', num: 'num' };
/* the sheet's published groups (#94 POS in style.css). English pedagogy groups the words that can
   head a noun phrase together with the nouns: articles and demonstratives, pronouns, and a
   substantival infinitive all take a noun's slot, so they all emit `pos-n`. A conjunction is not a
   word class here — it joins two clauses, so it emits `pos-join data-rel=` and the relation is the
   mark. An auxiliary or modal emits `pos-m` (the word that carries the mode and the tense).
   The ten internal tags stay, because the reasons are still worth printing.
   KNOWN MISS: be/have/do are tagged from the closed-class lexicon, so `I have a car` and `I do the
   dishes` come out as mode words. `--tags` shows this, and the fix is a context rule, not a lexicon. */
const GROUP = { n: 'n', v: 'v', adj: 'adj', adv: 'adv', det: 'n', pron: 'n', prep: 'prep', wh: 'n', aux: 'm', num: 'n',
  infn: 'n', infp: 'prep' };
/* wh-words split: the pronominal ones take a noun's slot, the rest are adverbs */
const WH_ADV = 'when where why how'.split(' ');
/* only pronouns whose form is object-only can be marked as the object; you/it/her are both cases */
const OBJ = 'me him us them whom'.split(' ');
/* be forms, and the adverbs an auxiliary's reach passes through: "do not KNOW", "have never SEEN" */
const BE_FORM = /^(be|is|am|are|was|were|been|being)$/;
/* a modal is always a mode word: it never is the verb of its own clause */
const MODAL = /^(will|would|can|could|shall|should|may|might|must|ought|won't|wouldn't|can't|couldn't|shouldn't|mustn't|gonna|wanna|gotta)$/;
const ADV_SKIP = /^(not|never|already|just|still|even|only|always|usually|often|really|also|then|soon|yet|ever|too|quite|rather|almost|probably|definitely|honestly|basically|literally|hardly|scarcely)$/;
/* a conjunction is a relation between two clauses, so the relation is what gets marked */
const REL = { and: 'add', nor: 'add', but: 'contrast', yet: 'contrast', although: 'contrast',
  though: 'contrast', whereas: 'contrast', while: 'contrast', or: 'alternative', so: 'cause',
  because: 'cause', if: 'condition', unless: 'condition', when: 'time', whenever: 'time',
  where: 'place', than: 'comparison', that: 'content', whether: 'content' };
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
    /* which auxiliary governs the word at k, if any — adverbs between do not break it */
    const auxGov = k => {
      for (let j = k - 1; j >= 0; j--) {
        if (out[j].tag === 'adv' && ADV_SKIP.test(lower(out[j].w))) continue;
        return out[j].tag === 'aux' ? j : -1;
      }
      return -1;
    };

    if (PUNCT.test(w)) return rec('punct', 'punctuation');
    if (/^\d+$/.test(w)) return rec('num', 'digits');

    /* 1. closed class: a finite list, no guessing */
    if (IN[t]) {
      if (t === 'to' && (IN[next] === 'aux' || !IN[next])) {
        /* a substantival infinitive takes a noun's slot (I want TO GO / TO GO is hard), so it joins the
           noun group. Everywhere else the marker is a connector, and the remainder of the groups is the
           prepositions. The verb after it is tagged below, whichever way this goes. */
        const prevW = i ? lower(words[i - 1]) : '';
        const back = i > 1 ? lower(words[i - 2]) : '';
        const SUBST = /^(want|wants|wanted|need|needs|needed|try|tries|tried|decide|decides|decided|hope|hopes|hoped|plan|plans|planned|forget|forgets|forgot|forget|remember|remembers|remembered|learn|learns|learned|learnt|choose|chooses|chose|chosen|begin|begins|began|start|starts|started|refuse|refuses|refused|promise|promises|promised|agree|agrees|agreed|manage|manages|managed|offer|offers|offered|love|loves|loved|like|likes|liked|hate|hates|hated|prefer|prefers|preferred|ask|asks|asked|tell|tells|told|expect|expects|expected|afford|affords|afforded|help|helps|helped)$/;
        if (SUBST.test(prevW) || SUBST.test(back) || i === 0) return rec('infn', 'infinitive in a noun slot = noun group');
        return rec('infp', 'infinitive marker = connector, so a preposition');
      }
      if (t === 'that' && ptag === 'v') return rec('conj', 'that after a verb = clause link');
      return rec(IN[t], 'closed-class lexicon');
    }
    if (/n't$/.test(t)) return rec('aux', 'negated auxiliary');
    if (IRREG.indexOf(t) !== -1) {
      if (ptag === 'det' || ptag === 'adj') return rec('adj', 'irregular form used as a description');
      return rec('v', 'irregular past form (listed)');
    }

    /* the word after the infinitive marker is a base verb, whichever way the marker was tagged */
    if (ptag === 'infn' || ptag === 'infp') return rec('v', 'base verb after the infinitive marker');
    /* 2. an auxiliary governs the next verb, and it keeps governing it across adverbs: "would finish",
       "can run", "have never SEEN", "do not KNOW". This runs BEFORE the suffix rules, because a
       suffix reads one word alone and "-ish" in "finish" is not an adjective once "would" is in
       front of it. be is excluded on purpose: "is happy", "is ready" are states, so be leaves the
       decision open. */
    const gov = auxGov(i);
    if (gov !== -1 && !BE_FORM.test(lower(out[gov].w)))
      return rec('v', 'after an auxiliary (not be) = verb');
    /* be is the exception the rule above leaves open, so it gets its own: after be the word is the
       state being described ("is happy", "were ready") unless it is a participle form, which the
       BOTH pattern recognises. Without this, "were ready" was reaching the generic aux rule below
       and becoming a verb. */
    if (gov !== -1) {
      if (BOTH.test(t) || /(?:ed|en)$/.test(t)) return rec('v', 'be + participle = verb form');
      return rec('adj', 'after be = the state being described');
    }

    /* a gerund in the subject slot is a substantive, i.e. a noun group: "Swimming is fun" */
    if (i === 0 && /ing$/.test(t) && t.length > 4) return rec('n', 'gerund in the subject slot = a noun group');
    /* after a verb and before an object, an -s word is that verb's own 3rd person:
       "whoever calls GETS a prize" */
    if (ptag === 'v' && /[^s]s$/.test(t) && /^(det|pron)$/.test(IN[next] || ''))
      return rec('v', 'after a verb and before an object = 3rd-person verb');

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
  /* 6. mode word or verb? be/have/do are listed as auxiliaries because most of their uses are, but
     each of them is also a verb in its own right: "I have a car", "I do the dishes", "He is happy".
     An aux is a MODE word only when a verb follows it; otherwise it is the verb that carries the
     tense by itself. A modal (can, would, must …) is always mode. */
  const HV_F = /^(have|has|had|having)$/;
  const DO_F = /^(do|does|did|doing)$/;
  for (let i = 0; i < out.length; i++) {
    if (out[i].tag !== 'aux') continue;
    const w = lower(out[i].w);
    if (MODAL.test(w)) continue;
    /* look ahead for the verb it would govern, across adverbs and up to four words */
    let verb = false;
    for (let j = i + 1; j < out.length && j <= i + 4; j++) {
      const t = out[j];
      if (t.tag === 'adv' && ADV_SKIP.test(lower(t.w))) continue;
      if (t.tag === 'v' || /^(been|being|got|gotten)$/.test(lower(t.w))) { verb = true; break; }
      if (t.tag === 'punct') break;
      if (/^(det|n|adj|num|pron)$/.test(t.tag)) break;   /* that is its object, so no verb follows */
    }
    if (HV_F.test(w) && /^to$/.test(lower((out[i + 1] || {}).w || ''))) verb = true;   /* have to go */
    if (!verb && (BE_FORM.test(w) || HV_F.test(w) || DO_F.test(w))) {
      out[i].tag = 'v';
      out[i].why = 'nothing after it to govern = the verb itself (not a mode word)';
    }
  }
  return out;
}

/* A substantive phrase is a group of words doing one noun's job, so it is marked ONCE, around the
   whole phrase, and the words inside carry no marks of their own (the sheet's #94 POS rule).
   Four kinds, each opened by a word that cannot start anything else here:
     that/whether/if after a verb of saying or thinking → a content clause   ("I know that he left")
     what/whoever/whatever/whichever                    → a free relative    ("What she said was true")
     to + base verb                                     → an infinitive      ("I told him to leave")
     an -ing word in the subject slot                   → a gerund           ("Swimming is fun")
   The clause ends just before the matrix verb: the first finite verb INSIDE the clause is its own,
   the second one belongs to what contains it. That is why the spans are found after tagging. */
const SAY = /^(say|says|said|tell|tells|told|ask|asks|asked|know|knows|knew|known|think|thinks|thought|believe|believes|believed|hope|hopes|hoped|wish|wishes|wished|wonder|wonders|wondered|doubt|doubts|doubted|feel|feels|felt|seem|seems|seemed|appear|appears|appeared|notice|notices|noticed|remember|remembers|remembered|forget|forgets|forgot|forgotten|hear|hears|heard|see|sees|saw|seen|show|shows|showed|shown|suggest|suggests|suggested|mean|means|meant|explain|explains|explained|agree|agrees|agreed|promise|promises|promised|answer|answers|answered|reply|replies|replied|admit|admits|admitted|deny|denies|denied|realise|realize|realises|realizes|realised|realized|guess|guesses|guessed|suppose|supposes|supposed|assume|assumes|assumed)$/;
const IF_VERB = /^(ask|asks|asked|know|knows|knew|known|wonder|wonders|wondered|doubt|doubts|doubted|see|sees|saw|seen|tell|tells|told|say|says|said|remember|remembers|remembered|forget|forgets|forgot|decide|decides|decided|check|checks|checked)$/;

function phrases(row) {
  const out = [];
  for (let i = 0; i < row.length; i++) {
    const t = row[i], w = lower(t.w);
    let kind = '';
    if (t.tag === 'conj' && (w === 'that' || w === 'whether' || w === 'if')) {
      /* a content clause needs a verb in front of it; a relative needs a noun, and is not this */
      let v = -1;
      for (let j = i - 1; j >= 0 && j >= i - 2; j--) if (row[j].tag === 'v') { v = j; break; }
      const before = v !== -1 ? lower(row[v].w) : '';
      if (w === 'that' && (v !== -1 && SAY.test(before) || i === 0)) kind = 'content-clause';
      if (w !== 'that' && v !== -1 && IF_VERB.test(before)) kind = 'content-clause';
    } else if (/^(what|whoever|whatever|whichever)$/.test(w)) {
      const nx = row[i + 1];
      if (nx && (nx.tag === 'pron' || nx.tag === 'v')) kind = 'free-relative';
    } else if (t.tag === 'infn') {
      kind = 'infinitive';
    }
    if (!kind) continue;

    /* where does it end? */
    let end = row.length - 1, seenV = false;
    for (let j = i + 1; j < row.length; j++) {
      const u = row[j];
      if (u.tag === 'punct') { end = j - 1; break; }
      if (u.tag === 'conj' && j > i + 1) { end = j - 1; break; }
      if (kind === 'gerund' && u.tag === 'v') { end = j - 1; break; }
      /* the phrase's own verb is the first one inside it; the second one belongs to the clause that
         contains the phrase — "⟨To swim⟩ IS hard", "⟨What she said⟩ WAS true" */
      if (u.tag === 'v') { if (seenV) { end = j - 1; break; } seenV = true; }
    }
    if (end > i) out.push({ s: i, e: end, kind });
    i = end;
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

  const ph = phrases(row);
  const open = new Map(ph.map(x => [x.s, x]));

  if (mode === '--tags') {
    const inPh = new Map();
    for (const x of ph) for (let j = x.s; j <= x.e; j++) inPh.set(j, j === x.s ? x.kind : '·');
    row.forEach((r, i) => console.log(r.w.padEnd(14) + ' ' + String(r.tag).padEnd(6) + ' ' +
      (inPh.has(i) ? '«' + inPh.get(i) + '» ' : '') + r.why));
  } else if (mode === '--check') {
    const bad = row.filter(r => r.why.indexOf('UNPLACED') === 0);
    console.log(bad.length ? bad.map(r => r.w).join(', ') : 'all placed');
  } else if (mode === '--text') {
    let s = '', i = 0;
    while (i < row.length) {
      const x = open.get(i);
      if (x) {
        s += (i ? ' ' : '') + '⟨' + row.slice(x.s, x.e + 1).map(r => r.w).join(' ') + '⟩' + x.kind;
        i = x.e + 1;
        continue;
      }
      const r = row[i];
      s += (i ? ' ' : '') + (r.tag === 'punct' ? r.w : r.w + '[' + r.tag + ']');
      i++;
    }
    console.log(s);
  } else {
    let html = '', i = 0;
    while (i < row.length) {
      const x = open.get(i);
      if (x) {
        const words = row.slice(x.s, x.e + 1).map(r => r.w).join(' ');
        html += (i ? ' ' : '') + '<span class="pos-n" data-ph="' + x.kind + '">' + words + '</span>';
        i = x.e + 1;
        continue;
      }
      const r = row[i], t = lower(r.w);
      html += (i ? ' ' : '') + (r.tag === 'punct' ? r.w
        : r.tag === 'conj' ? '<span class="pos-join" data-rel="' + (REL[t] || 'add') + '">' + r.w + '</span>'
        : r.tag === 'wh' && WH_ADV.indexOf(t) === -1 ? '<span class="pos-n">' + r.w + '</span>'
        : '<span class="pos-' + (GROUP[r.tag] || 'n') + (r.tag === 'pron' && OBJ.indexOf(t) !== -1 ? ' pos-o' : '') + '">' + r.w + '</span>');
      i++;
    }
    console.log(html.replace(/ ([.,;:!?])/g, '$1').replace(/ (['’])/g, '$1').trim());
  }
}
