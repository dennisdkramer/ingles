/* ---- pronunciation key engine (pronkey.js) --------------------------------------
   Thin display + lookup layer for the pronunciation key. The dictionary data lives in
   dictionary.json (fetched on load) — the single source of truth: one key per word.
   Notation rules live in FUNCTION.md.
   Entry points:
     PronKey.words(text)    parse a word / text string into whole words (partial words thrown out)
     PronKey.lookup(word)   dictionary lookup (returns the word's key string, or null)
     PronKey.ready()        true once the dictionary has been fetched and has entries
     PronKey.render(s)      expand compact notation to display HTML (notation rules → FUNCTION.md) */
window.PronKey = (function () {
  let DICT = null;   // fast case-insensitive map: lowercase word -> key string

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

  // custom-dictionary lookup (case-insensitive) -> the word's single key string, or null
  function lookup(word) {
    if (!DICT) return null;
    return DICT.get(String(word == null ? '' : word).toLowerCase()) || null;
  }

  // minimal display render: expand a compact key string (e.g. "di-ffə-rə[nt]") to HTML —
  // (notation rules live in FUNCTION.md) — display only, no generation.
  function render(compact) {
    return String(compact == null ? '' : compact).split('-').map(function (seg) {
      let html = '', buf = '';
      const flush = () => { if (buf) { html += '<b>' + buf + '</b>'; buf = ''; } };
      for (let i = 0; i < seg.length; i++) {
        const ch = seg[i];
        if (ch === '[') {
          const j = seg.indexOf(']', i);
          if (j < 0) { buf += ch; }
          else { flush(); html += '<span class="pr-g">' + seg.slice(i + 1, j) + '</span>'; i = j; }
        } else { buf += ch; }
      }
      flush();
      return html;
    }).join('·');
  }

  // Parse dictionary.json ({ "word": "key", ... }) into a single fast case-insensitive map:
  // lowercase word -> key string. No duplicate array copy is held.
  function load(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    const map = new Map();
    Object.keys(obj).forEach(function (w) {
      map.set(String(w).toLowerCase(), String(obj[w] == null ? '' : obj[w]));
    });
    DICT = map;
  }

  // Fetch the dictionary. dictionary.json sits next to pronkey.js (repo root),
  // so the URL is derived from THIS script's src (not the document URL, which would
  // break on pages nested one level down: business/, kids/, nsfw/).
  (function boot() {
    try {
      const cs = document.currentScript;
      const base = (cs && cs.src) ? cs.src.slice(0, cs.src.lastIndexOf('/') + 1) : '../';
      fetch(base + 'dictionary.json', { cache: 'no-cache' })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
        .then(load)
        .catch(function (err) { if (window.console) console.warn('pronkey: could not load dictionary.json —', err); });
    } catch (e) {
      if (window.console) console.warn('pronkey: boot failed —', e);
    }
  })();

  function ready() { return !!(DICT && DICT.size); }

  return {
    words: words,
    lookup: lookup,
    render: render,
    ready: ready
  };
})();
