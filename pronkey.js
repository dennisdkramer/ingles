/* ---- pronunciation key engine (pronkey.js) --------------------------------------
   The rebuilt pronunciation-key function. Entry points:
     PronKey.words(text)    parse a word / text string into whole words (partial words thrown out)
     PronKey.lookup(word)   custom-dictionary lookup (window.PRON rows 2+)
     PronKey.key(row)       the rendered key for a row (column 4 = L1 output)
     PronKey.process(word)  one word through the whole pipeline:
        dictionary lookup -> (absent: addToDictionary + keyGen) -> general library lookup ->
        annotate (mark * at stressed syllables, - at vowel hiatus, syllable count -> column 3)
   Render and key-generation are STUBS for now (dead until the logic is ironed out) but are wired
   here so the engine calls one entry point and the logic drops in without touching call sites. */
window.PronKey = (function () {
  function PRON() { return Array.isArray(window.PRON) ? window.PRON : []; }
  function rows() { return PRON().slice(2); }   // rows 0/1 = column headers + descriptions

  // parse into whole words; fragments and single-letter partials are thrown out
  function words(text) {
    if (text == null) return [];
    const re = /[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['’][A-Za-zÀ-ÖØ-öø-ÿ]+)*/g;
    const out = [];
    let m;
    while ((m = re.exec(String(text)))) {
      const w = m[0].replace(/^['’]+|['’]+$/g, '');
      if (w.length >= 2) out.push(w);
    }
    return out;
  }

  // custom-dictionary lookup (case-insensitive)
  function lookup(word) {
    const w = String(word == null ? '' : word).toLowerCase();
    for (const r of rows()) { if (String(r[0]).toLowerCase() === w) return r; }
    return null;
  }

  // the rendered key for a dictionary row - column 4 = L1 output (index 3)
  function key(row) { return row ? String(row[3] || '') : ''; }
  // the reduced key for a dictionary row - column 5 = L2 output (index 4)
  function key2(row) { return row ? String(row[4] || '') : ''; }

  // minimal display render: expand a compact L1/L2 string (e.g. "di-ffə-rə[nt]") to HTML —
  // bold core, grey [hanging letters], "·" between syllables. This is DISPLAY only, not generation.
  function render(compact) {
    return String(compact == null ? '' : compact).split('-').map(function (syl) {
      let html = '', buf = '';
      const flush = () => { if (buf) { html += '<b>' + buf + '</b>'; buf = ''; } };
      for (let i = 0; i < syl.length; i++) {
        const ch = syl[i];
        if (ch === '[') {
          const j = syl.indexOf(']', i);
          if (j < 0) { buf += ch; }
          else { flush(); html += '<span class="pr-g">' + syl.slice(i + 1, j) + '</span>'; i = j; }
        } else { buf += ch; }
      }
      flush();
      return html;
    }).join('·');
  }

  /* ---- lexicon annotation derivation ------------------------------------------------
     derive(word, breaks, stress) -> { count, marked }
       breaks : spelling char indices where the LEXICON marks a syllable break (the FULL set).
       stress : 0-based index of the stressed syllable.
       Keeps only the breaks that FOLLOW A VOWEL (the only boundaries we trust), and places
       "*" at the start of the stressed syllable — remapped onto the FULL breaks so a dropped
       break never moves the stress. */
  function derive(word, breaks, stress) {
    const W = String(word || '');
    const V = 'aeiouyAEIOUY';
    const full = (breaks || []).slice();
    const kept = full.filter(b => b > 0 && b < W.length && V.indexOf(W[b - 1]) >= 0);
    const start = stress > 0 && full[stress - 1] != null ? full[stress - 1] : 0;
    const marks = new Set(kept);
    let out = '';
    for (let i = 0; i < W.length; i++) {
      if (marks.has(i)) out += '-';
      if (i === start) out += '*';
      out += W[i];
    }
    return { count: full.length + 1, marked: out };
  }

  /* parse a lexicon source into derive()'s {breaks, stress} contract.
     hyph : spelling syllabification, e.g. "busi|ness" (separators | · -) — EXACT when present.
     ipa  : IPA with primary stress ˈ and (usually) syllable dots ".".
     Without hyph, breaks are inferred from the IPA dot count mapped onto the spelling's vowels
     (best-effort; a word with no hyph AND no dots cannot be placed and returns breaks=[]). */
  function parseLexicon(word, hyph, ipa) {
    const W = String(word || '');
    const V = 'aeiouyAEIOUY';
    let breaks = [];
    if (hyph) {
      const p = String(hyph).split(/[|·\-]/).filter(Boolean);
      let pos = 0;
      for (let i = 0; i < p.length - 1; i++) { pos += p[i].length; breaks.push(pos); }
    } else {
      const bare = String(ipa || '').replace(/^\/|\/$/g, '');
      const dots = bare.split('.').length - 1;
      const vp = [];
      for (let i = 0; i < W.length; i++) if (V.indexOf(W[i]) >= 0) vp.push(i);
      for (let k = 0; k < Math.min(dots, vp.length - 1); k++) breaks.push(vp[k] + 1);
    }
    const bare = String(ipa || '').replace(/^\/|\/$/g, '');
    let stress = 0;
    for (let i = 0, seen = false; i < bare.length; i++) {
      if (bare[i] === 'ˈ') seen = true;
      else if (bare[i] === '.' && !seen) stress++;
    }
    return { breaks, stress };
  }

  // one word through the whole pipeline
  function process(word) {
    let row = lookup(word);
    if (!row) row = addToDictionary(word);   // absence -> add to dictionary + key-generation
    libraryLookup(word);
    annotate(row, word);
    return row;
  }

  // ---- STUBS (dead for now; wired so the logic drops in later) ----
  function addToDictionary(word) { /* TODO: append a new row to window.PRON, then keyGen(word) */ return null; }
  function keyGen(word) { /* TODO: derive L1/L2 outputs for a word */ return null; }
  function libraryLookup(word) { /* TODO: general phoneme library lookup */ return null; }
  function annotate(row, word) { /* TODO: * stressed syllables, - vowel hiatus, syllable count -> column 3 */ return row; }

  return {
    words: words,
    lookup: lookup,
    key: key,
    key2: key2,
    render: render,
    derive: derive,
    parseLexicon: parseLexicon,
    process: process,
    addToDictionary: addToDictionary,
    keyGen: keyGen,
    libraryLookup: libraryLookup,
    annotate: annotate
  };
})();
