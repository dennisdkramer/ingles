import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';
import { pronounce, renderSyllabified } from './pron-source.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] == null) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
loadDotEnv();

const MODEL = 'deepseek-chat';
const openai = new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: process.env.DEEPSEEK_API_KEY });

// ---- canonical ground truth (HANDOFF §9) ----
const CANON = [
  ['nothing', 'nə-th[i]n[g]'],
  ['everything', 'ev-ry-th[i]n[g]'],
  ['going', 'go-in[g]'],
  ['meeting', 'mee-tin[g]'],
  ['understand', 'ən-d[ə]r-sta[nd]'],
  ['different', 'di-ff[e]r[e]n[t]'],
  ['government', 'gə-v[e]r[n]-m[e]n[t]'],
  ['probably', 'prə-b[ab]ly'],
  ['door', 'do[or]'],
  ['street', 's[t]ree[t]'],
  ['to', 't[ə]'],
  ["ain't", "ai[n't]"],
  ['comfortable', 'co[mf]-tə-bl'],
  ['every', 'e-v[e]ry'],
  ['police', 'pə-li[ce]'],
  ['exactly', 'e-[x]ac[t]-ly'],
];

const ACCEPT = {
  going: ['go-in[g]', 'go[i]n[g]'],
  meeting: ['mee-tin[g]', 'mee-t[i]n[g]'],
  doing: ['do-in[g]', 'do[i]n[g]'],
  about: ['ə-b[out]', 'ə-b[ət]'],
  exactly: ['e-[x]ac[t]-ly'],
};

// extra few-shot examples (settled rules, not in the §9 test set)
const EXTRA = [
  ['some', 's[ə]m[e]'],
  ['want', 'wa[nt]'],
];

const PRON_OVERRIDE = { to: 'T AH0' };

function acceptedOf(word) {
  const c = CANON.find((x) => x[0] === word);
  return ACCEPT[word] || [c ? c[1] : ''];
}

const RULES = `You are a linguist transcribing fast, reduced, connected American English ("allegro") into a learner respelling. This is the ONLY register; reductions are always applied.

TASK: given a WORD and its syllabified ARPABET pronunciation (with stress digits), output how the word is pronounced in reduced speech, written in the word's OWN letters.

OUTPUT ALPHABET — only the word's own letters plus '-' (syllable break)  '[' ']'(brackets surround characters as described below) and 'ə'. No IPA.

Resyllabify: a consonant ending a syllable moves to the onset of the next.

ARPABET vowels: AA=ah(father) AE=a(cat) AH=uh(strut) AO=aw(thought) AW=ow(cow) AY=ay(eye) EH=e(bet) ER=er(her) EY=ay(they) IH=i(bit) IY=ee(see) OW=oh(go) OY=oy(toy) UH=u(put) UW=oo(too). Stress digit after a vowel: 1=primary, 2=secondary, 0=unstressed. Consonants as spelled (HH=h, TH=th, DH=th, SH=sh, CH=ch, ZH=zh, NG=ng, Y=y, W=w).

RULES (in priority order):

1. WHAT A VOWEL BECOMES — pick exactly one:
   (a) Kept plain (stressed, or a "coloured" vowel before r/n/v/l that resists reduction): family -> 'fa-…', camera -> 'ca-…'.
   (b) Reduced to "uh" and clearly pronounced -> write 'ə': about -> 'ə-b[out]', probably -> 'prə-b[ab]ly', because -> '…-cəs[e]' (the 'au'->'ə'), nothing -> 'nə-th[i]n[g]' (the 'o'->'ə'), police -> 'pə-li[ce]' (the 'o'->'ə').
   (c) Reduced to "uh" but then DROPPED/inaudible -> write '[ə]': something -> 's[ə]m[e]-th[i]n[g]' (the 'o'->'[ə]'), to -> 't[ə]', family -> 'fa-m[ə]ly'.
   (d) [Not pronounced as written] OR [silent] OR [dropped] -> grey the ORIGINAL letter (the letter actually in the word - '[e]','[i]','[o]','[ea]', etc..) never a respell: fame ->'fam[e]' ("magic"/silent 'e'),  camera -> 'ca-m[e]ra' (dropped 'e'), even -> 'e-v[e]n', ə-bout -> 'ə-b[out]', pear -> 'p[ea]r', anything -> '[a]-ny-th[i]n[g]' ('any' sounds like 'eny').
 
2. RESPELLING:
  - ONLY FOR (exact string match, only when the pronunciation matches): vowel(s) [reduced to "uh" (you -> yə)] OR [as-written letter doesnt reconcile with actual pronunciation (business -> b[ə]s-n[ə]ss)] -> 'ə' ; ough->o/əf/o[ff]/u ; ought->ot ; augh->o/af ; tion/sion->xn ; cient->xn[t] ; sure->xr ; eigh->ei ; igh->ai ; cc->ks ; cious->x[ə]s ; alm->[o]m ..
  .. ELSE Keep the word's OWN letters even when the sound is spelled by another letter: 't' pronounced "ch" stays 't' (actually -> 'ac-t[u]a-lly'), 'x' pronounced "z/gz" stays 'x' (exactly -> 'e[x]-a[ct]-ly'). Forbidden: s->z, c->k (except cc->ks), x->z/ks, y->i, t->ch ..
  .. ELSE If any letter(s) are absent from the pronunciation, GREY the letter; if it merely changed sound, keep it plain.

3. NEVER DROP a letter — grey it. Swallowed consonants are greyed, not deleted:
   - word-final 't' after a vowel is usually inaudible -> '[t]' (about -> '…[t]', street -> 's[t]ree[t]').
   - 'str' is NOT one sound — it splits and greys the weak middle: 's[t]r' (street -> 's[t]ree[t]').

4. SANDHI (connected speech): a word-final consonant swallowed by the following word is greyed: because -> 'b[ə]-cə[se]' (final 'se' greyed), police -> 'pə-li[ce]' (final 'ce' greyed), different -> 'di-ff[e]r[e]n[t]' (final 't').

5. NON-RHOTIC 'r': 'r' after a FULL vowel is greyed (door -> 'do[or]'); 'r' after a schwa is KEPT and that schwa is greyed (understand -> 'ən-d[ə]r-sta[nd]').

6. '-ing' reduces to 'in[g]' or '[i]n[g]' to match pronunciation: 'go-in[g]' / 'go[i]n[g]', meeting -> 'mee-tin[g]' / 'mee-t[i]n[g]'. '-thing' COMPOUND suffix (something/nothing/anything/everything) reduces to 'th[i]n[g]'.

7. Some words always reduce: different -> 'di-ff[e]r[e]n[t]' (2 syllables), comfortable -> 'co[mf]-tə-bl' (3 syllables), every -> 'ev-ry' (2 syllables).

8. RESYLLABIFY: a consonant ending a syllable moves to the onset of the next syllable.

Do not include any reasoning, explanation, or commentary — only the JSON. Respond ONLY with a JSON array: [{"word":"...", "pron":"..."}].`;

function exampleLine(word, pron) {
  const p = pronounce(word);
  if (!p) return null;
  const ph = PRON_OVERRIDE[word] || renderSyllabified(p);
  return `${word}  [${ph}]  ->  ${pron}`;
}

function buildSystem(excludeWord) {
  const lines = [RULES, '', 'GROUND-TRUTH EXAMPLES:'];
  for (const [w, pron] of CANON) {
    if (w === excludeWord) continue;
    const ex = exampleLine(w, pron);
    if (ex) lines.push(ex);
  }
  for (const [w, pron] of EXTRA) {
    if (w === excludeWord) continue;
    const ex = exampleLine(w, pron);
    if (ex) lines.push(ex);
  }
  return lines.join('\n');
}

function cleanLetters(s) {
  return String(s).toLowerCase().replace(/[\[\]\-ə]/g, '');
}

function foreignLetters(word, pron) {
  const w = word.toLowerCase();
  return [...new Set(cleanLetters(pron).split('').filter((c) => !w.includes(c)))];
}

function isSubseq(word, pron) {
  const w = word.toLowerCase();
  const s = cleanLetters(pron);
  let i = 0;
  for (const c of s) {
    while (i < w.length && w[i] !== c) i++;
    if (i >= w.length) return false;
    i++;
  }
  return true;
}

function postProcess(word, pron) {
  const w = word.toLowerCase();
  let out = String(pron).toLowerCase();
  if (w.endsWith('thing') && w.length > 5) {
    const i = out.lastIndexOf('th');
    if (i > 0) {
      let prefix = out.slice(0, i);
      if (prefix.endsWith('[')) prefix = prefix.slice(0, -1);
      prefix = prefix.replace(/-+$/, '');
      out = prefix + '-th[i]n[g]';
    }
  }
  if (w === "ain't") out = "ai[n't]";
  if (w.includes('c') && !w.includes('k')) out = out.replace(/k/g, 'c');
  if (w.includes('s') && !w.includes('z')) out = out.replace(/z/g, 's');
  if (w.includes('x')) out = out.replace(/gz/g, 'x').replace(/ks/g, 'x');
  return out;
}

async function ask(system, user) {
  const res = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return res.choices[0].message.content || '';
}

function extractArray(raw) {
  const s = String(raw).replace(/```json/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(s); } catch {}
  // bracket-aware scan: find every top-level JSON array (brackets inside strings ignored)
  // and return the LAST one (the model's final answer, after any leaked reasoning).
  const found = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] !== '[') { i++; continue; }
    let depth = 0, j = i, inStr = false, esc = false;
    for (; j < s.length; j++) {
      const c = s[j];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
      } else if (c === '"') inStr = true;
      else if (c === '[') depth++;
      else if (c === ']') { depth--; if (depth === 0) { j++; break; } }
    }
    try { found.push(JSON.parse(s.slice(i, j))); } catch {}
    i = j;
  }
  if (found.length) return found[found.length - 1];
  throw new Error('no JSON array in response');
}

async function askJSON(system, user, attempts = 4) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    const raw = await ask(system, user);
    try {
      return extractArray(raw);
    } catch (e) {
      lastErr = e;
      if (i === attempts - 1) console.error('RAW (parse failed):\n' + String(raw).slice(0, 1500) + '\n---');
    }
  }
  throw lastErr;
}

function phonemesOf(word) {
  if (PRON_OVERRIDE[word]) return PRON_OVERRIDE[word];
  const p = pronounce(word);
  return p ? renderSyllabified(p) : '';
}

async function runBatch(words, system, retries = 3) {
  const entries = words.map((w) => ({ word: w, phonemes: phonemesOf(w) }));
  const user = 'Transcribe each entry and respond with ONLY the JSON array:\n' + JSON.stringify(entries);
  const arr = await askJSON(system, user);
  const byWord = new Map();
  for (const e of arr) if (e && e.word != null) byWord.set(String(e.word).toLowerCase(), String(e.pron ?? ''));

  const results = new Map();
  for (const w of words) {
    let pron = byWord.get(w.toLowerCase()) ?? '';
    let attempt = 0;
    while (attempt < retries && (foreignLetters(w, pron).length || !isSubseq(w, pron))) {
      const bad = foreignLetters(w, pron);
      const fixUser = `Your output for "${w}" was "${pron}" — it introduces letters not in the word${bad.length ? ' (' + bad.join(',') + ')' : ''} or breaks the letter order. Re-transcribe ONLY "${w}" and respond with the JSON array.`;
      const arr2 = await askJSON(system, fixUser + '\n' + JSON.stringify([{ word: w, phonemes: phonemesOf(w) }]));
      const e2 = arr2.find((x) => x && String(x.word).toLowerCase() === w.toLowerCase());
      pron = e2 ? String(e2.pron ?? '') : pron;
      attempt++;
    }
    results.set(w.toLowerCase(), pron);
  }
  return results;
}

async function validate() {
  let pass = 0;
  const rows = [];
  for (const [word] of CANON) {
    const system = buildSystem(word); // leave-one-out: test word is NOT in the examples
    const map = await runBatch([word], system);
    const got = postProcess(word, map.get(word.toLowerCase()) || '');
    const acc = acceptedOf(word);
    const ok = acc.includes(got);
    const foreign = foreignLetters(word, got);
    const sub = isSubseq(word, got);
    if (ok) pass++;
    rows.push({ word, got, want: acc[0], ok, foreign, sub });
  }
  for (const r of rows) {
    console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.word.padEnd(12)} got=${r.got.padEnd(24)} want=${r.want}`);
    if (!r.ok || r.foreign.length || !r.sub) {
      console.log(`      foreign=[${r.foreign}] subseq=${r.sub}`);
    }
  }
  console.log(`\n${pass}/${rows.length} exact match (leave-one-out generalization).`);
}

async function testFull() {
  const system = buildSystem(null);
  const words = CANON.map((c) => c[0]);
  const map = await runBatch(words, system);
  let pass = 0;
  for (const [w] of CANON) {
    const got = postProcess(w, map.get(w.toLowerCase()) || '');
    const ok = acceptedOf(w).includes(got);
    if (ok) pass++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${w.padEnd(12)} got=${got}`);
  }
  console.log(`\n${pass}/${CANON.length} (full few-shot, copy check).`);
}

async function sample() {
  const system = buildSystem(null);
  const words = ['water', 'little', 'letter', 'better', 'people', 'money', 'asked', 'picture', 'question', 'children', 'woman', 'wanted'];
  const map = await runBatch(words, system);
  for (const w of words) {
    const got = postProcess(w, map.get(w.toLowerCase()) || '');
    const f = foreignLetters(w, got);
    console.log(`${w.padEnd(12)} ${got}${f.length ? '  [foreign: ' + f.join(',') + ']' : ''}`);
  }
}

async function produce() {
  const words = [];
  const wordListPath = path.join(__dirname, 'top50000_english.txt');
  for (const line of fs.readFileSync(wordListPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (t) words.push(t);
  }
  if (process.env.LIMIT) words.length = Math.min(words.length, Number(process.env.LIMIT));

  const outPath = path.join(__dirname, 'dictionary.json');
  const oovPath = path.join(__dirname, 'oov.txt');
  const done = {};
  if (fs.existsSync(outPath)) {
    try { Object.assign(done, JSON.parse(fs.readFileSync(outPath, 'utf8'))); } catch {}
  }
  const oov = new Set();
  const system = buildSystem(null);
  const BATCH = 40;
  const MAX_TRIES = 6;

  console.log(`word list: ${words.length} total, ${Object.keys(done).length} already saved (resume).`);
  console.log(`batches of ${BATCH} → ~${Math.ceil(words.length / BATCH)} API calls.`);

  for (let i = 0; i < words.length; i += BATCH) {
    const batch = words.slice(i, i + BATCH).filter((w) => {
      if (w.toLowerCase() in done) return false;
      if (!pronounce(w)) { oov.add(w); return false; }
      return true;
    });
    if (!batch.length) continue;

    let ok = false;
    for (let attempt = 1; attempt <= MAX_TRIES && !ok; attempt++) {
      try {
        const map = await runBatch(batch, system);
        for (const w of batch) done[w.toLowerCase()] = postProcess(w, map.get(w.toLowerCase()) || '');
        const tmp = outPath + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(done, null, 2) + '\n');
        fs.renameSync(tmp, outPath); // atomic: never leave a half-written dictionary.json
        ok = true;
      } catch (e) {
        console.error(`  batch ${i}-${Math.min(i + BATCH, words.length)} attempt ${attempt}/${MAX_TRIES}: ${e.message}`);
        if (attempt < MAX_TRIES) {
          await new Promise((r) => setTimeout(r, 2000 * attempt)); // 2s, 4s, 6s, 8s, 10s backoff
        } else {
          console.error('  gave up on this batch. Aborting — re-run to resume (completed batches are already saved).');
          process.exit(1);
        }
      }
    }
    console.log(`${Math.min(i + BATCH, words.length)}/${words.length} processed · ${Object.keys(done).length} saved · ${oov.size} OOV`);
  }

  if (oov.size) fs.writeFileSync(oovPath, [...oov].join('\n') + '\n');
  console.log('\ndone.');
  console.log('saved entries:', Object.keys(done).length);
  console.log('OOV (not in CMUdict):', oov.size, oov.size ? '→ oov.txt' : '');
}

const mode = process.argv[2];
if (mode === '--validate') await validate();
else if (mode === '--test') await testFull();
else if (mode === '--sample') await sample();
else await produce();

