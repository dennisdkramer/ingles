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
    process: process,
    addToDictionary: addToDictionary,
    keyGen: keyGen,
    libraryLookup: libraryLookup,
    annotate: annotate
  };
})();
