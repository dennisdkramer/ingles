import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { OpenAI } from 'openai'; // DeepSeek speaks the OpenAI API

// --- CONFIGURATION ---
const INPUT_WORDLIST_PATH = './top50000_english.txt';   // one word per line
const OUTPUT_JSON_PATH = './dictionary.json';          // final dictionary (one JSON object: word -> key)
const PROGRESS_LOG_PATH = './progress.log';             // human-readable progress marker
const BATCH_SIZE = 50;
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 5000;

// Load a local .env (DEEPSEEK_API_KEY=sk-…) so the key never has to be exported in a shell.
function loadDotEnv() {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] == null) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
loadDotEnv();
if (!process.env.DEEPSEEK_API_KEY) {
  console.error('❌ DEEPSEEK_API_KEY is not set - add it to .env (DEEPSEEK_API_KEY=sk-...) and re-run.');
  process.exit(1);
}

// Initialize DeepSeek client (DEEPSEEK_API_KEY comes from the environment or .env)
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});


// --- VOICE & PROMPTS (3-step pipeline) ---
const VOICE = `You are a neutral, unplaceable American accent speaker (Boston-born, educated; lived TX/CA/GA; fluent AAVE). You speak in casual, connected, fast speech ("allegro"). This is the ONLY register — there is no slow or careful reading. Standard reductions are ALWAYS applied and never undone.`;

const CALL1_PROMPT = `${VOICE}

For each word, output how the phrase "WORD to" is pronounced in this voice. Use only plain letters, 'ə', and '-'. No IPA, no other characters.

The "to" assimilates to the preceding sound: "tə" after vowels, "nə" after n, "də" after d, etc.

Spell each vowel sound with the word's OWN vowel letter wherever that letter can make the sound (e.g. the "e" of "because" makes /ɪ/); use 'ə' only for a genuine schwa. Never respell a vowel to a different letter. Keep the word's own consonant letters too (do not respell "th"→"p", "s"→"z", etc.).

Examples:
"attempt to" → "ə-tem-tə"
"laboratory to" → "lab-rə-tor-ee-tə"
"temperature to" → "tem-pə-chər-tə"  (the p is never dropped)
"because to" → "be-kuz-tə"
"something to" → "səm-thin-tə"

Respond ONLY with a JSON array: [{"word":"...", "pron":"..."}]`;

const CALL2_PROMPT = `Given each word and its reduced pronunciation of "WORD to", output the word's OWN reduced pronunciation alone, with syllable boundaries adjusted for connected speech (in-word sandhi).

Steps:
1. Remove the trailing "to" syllable (however it was realized: tə, nə, də, …).
2. Resyllabify in-word sandhi: a consonant that ends a syllable moves to be the onset of the next syllable when that syllable begins with a vowel (e.g. "lab-rə-tor-ee" → "lab-rə-to-ree").

Use only plain letters, 'ə', and '-'.

Respond ONLY with a JSON array: [{"word":"...", "pron":"..."}]`;

const CALL3_PROMPT = `Given a word and its reduced pronunciation, map that pronunciation onto the word's own letters. The reduced pronunciation is AUTHORITATIVE — conform to it exactly; do not re-derive the pronunciation yourself.

Notation: write the word's own letters; wrap letters in [ ] when their sound is NOT in the pronunciation; write 'ə' for a vowel reduced to "uh"; separate syllables with '-'.

Rules:
- Match the pronunciation to the word letter-by-letter, LEFT TO RIGHT, in order. Each pronunciation sound maps to the word letter that spells it there (an "u" maps to the word's "u"; a /z/ maps to the word's "s"; a /k/ maps to the word's "c").
- The pronunciation's 'ə' (schwa) REPLACES the word's vowel letter at that position — write 'ə' in place of that letter (plain). Never grey the letter that 'ə' replaces, and never add 'ə' as an extra letter.
- Grey ([ ]) a word letter that NO pronunciation sound maps to — dropped, silent, or a lone vowel letter reduced to a DIFFERENT vowel (not "uh").
- A multi-letter vowel team reduced to one vowel: the team letter whose OWN sound matches that vowel carries it (plain); the other letter is greyed.
- Core reduction — EVERY CVC syllable, in any position (initial, medial, final): grey the VOWEL when the coda is a nasal/liquid (m, n, l, r) that glues onto the onset into a stop+sonorant cluster — "tem"→"t[e]m" whether in "attempt", "temperature", or "atom"→"a-t[ə]m" ("o"→schwa). Grey the CODA when it does not glue (a stop coda, or a glide onset): "lab"→"la[b]", "wan"→"wa[n]".
- Never drop a letter — grey it.

Examples:
"ə-tem" on "attempt" → "ə-tt[e]m[pt]"   (a→ə; tt one sound; e greyed by core reduction; m kept; pt absent)
"wan" on "want" → "wa[nt]"               (the t is absent → grey it)
"go-in" on "going" → "go-in[g]"          (the final g is absent → grey it; the n is present → plain)
"be-kuz" on "because" → "b[e]-c[a]us[e]" (the "u" carries the reduced "au"; "a" and the two "e"s are greyed)

Respelling table (exact match only):
- vowel(s) reduced to "uh" → 'ə'
- ough → o / əf / o[ff] / u
- ought → ot (never "aw")
- augh → o (never "aw"); augh → af
- tion/sion → xn
- cient → xn[t]
- sure → xr (never "ʒ")
- eigh → ei
- igh → ai
- cc → ks
- cious → x[ə]s
- alm → [o]m (never "ah")

Never change s→z, c→k (except cc→ks), x→z/ks, y→i/ee.

Respond ONLY with a JSON array: [{"word":"...", "pron":"..."}]`;

// --- HELPERS ---
async function ask(systemPrompt, userContent) {
  const response = await openai.chat.completions.create({
    model: 'deepseek-chat',
    temperature: 0,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]
  });
  const raw = (response.choices[0].message.content || '').trim();
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('response was not an array.');
  return parsed;
}

function mapByWord(parsedArray) {
  const byWord = new Map();
  for (const e of parsedArray) {
    if (e && typeof e === 'object' && e.word != null) byWord.set(String(e.word).toLowerCase(), e);
  }
  return byWord;
}

async function askMapped(systemPrompt, userContent, words) {
  const parsed = await ask(systemPrompt, userContent);
  const byWord = mapByWord(parsed);
  const missing = words.filter(w => !byWord.has(w.toLowerCase()));
  if (missing.length) throw new Error('response missing words: ' + missing.slice(0, 6).join(', ') + (missing.length > 6 ? '…' : ''));
  return byWord;
}


// Resume from the OUTPUT file: one key per completed word. This is crash-safe — a
// process killed mid-batch re-reads the true number of finished words, so it never
// duplicates or skips. progress.log is kept only as a human-readable marker.
function loadDone() {
  if (!fs.existsSync(OUTPUT_JSON_PATH)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(OUTPUT_JSON_PATH, 'utf8'));
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch (e) {
    return {};
  }
}

// Deterministic post-check: the model sometimes "spells the sound" (k for the /k/ of c,
// z for the /z/ of s, gz/ks for x) and under-reduces "-thing" compounds. These are
// reliable, word-shaped corrections; anything else is flagged (not rewritten).
function postProcess(word, pron) {
  const w = word.toLowerCase();
  let out = pron;

  // 1. "-thing" compounds (something, nothing, anything, everything) collapse their
  //    final syllable to a bare nasal: th, i, g are greyed; only n is heard.
  if (w.endsWith('thing') && w.length > 5) {
    const i = out.toLowerCase().lastIndexOf('th');
    if (i > 0) {
      let prefix = out.slice(0, i);
      if (prefix.endsWith('[')) prefix = prefix.slice(0, -1);
      prefix = prefix.replace(/-+$/, '');
      out = prefix + '-[thi]n[g]';
    }
  }

  // 2. Reverse the model's most common "spell-the-sound" respellings (only when the
  //    word itself spells that sound with the original letter).
  if (w.includes('c') && !w.includes('k')) out = out.replace(/k/g, 'c');
  if (w.includes('s') && !w.includes('z')) out = out.replace(/z/g, 's');
  if (w.includes('x')) out = out.replace(/gz/g, 'x').replace(/ks/g, 'x');

  // 3. Warn (but keep) about any letter that still is not in the word.
  const foreign = [...new Set(out.toLowerCase().replace(/\[|\]|-|ə/g, '').split('').filter(ch => !w.includes(ch)))];
  if (foreign.length) {
    console.warn(`   ⚠️ post-check "${word}" → "${out}" still has foreign letters: ${foreign.join(', ')}`);
  }

  return out;
}

async function runPipeline() {
  console.log('🚀 Initializing DeepSeek Phonetic Processing Pipeline...');

  // 1. Read all words from the word list
  const allWords = [];
  const rl = readline.createInterface({ input: fs.createReadStream(INPUT_WORDLIST_PATH), crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed) allWords.push(trimmed);
  }

  const totalWords = allWords.length;
  const results = loadDone();     // resume: already-finished words (one key per word)
  let startIndex = Math.min(Object.keys(results).length, totalWords);
  console.log(`📊 Total words: ${totalWords}. Already done: ${startIndex}`);

  // 2. Loop through words in strict, isolated batches
  while (startIndex < totalWords) {
    const endIndex = Math.min(startIndex + BATCH_SIZE, totalWords);
    const currentBatch = allWords.slice(startIndex, endIndex);
    let ok = false;

    for (let attempt = 1; attempt <= MAX_RETRIES && !ok; attempt++) {
      try {
        console.log(`📦 Batch ${startIndex}-${endIndex} (attempt ${attempt}/${MAX_RETRIES})…`);

        // 3. Three sequential LLM calls per batch:
        //    call 1 — reduced pronunciation of "word to"
        //    call 2 — strip "to" + resyllabify in-word sandhi
        //    call 3 — map pronunciation onto letters + greying
        const p1 = await askMapped(
          CALL1_PROMPT,
          `Pronounce each word followed by "to": ${JSON.stringify(currentBatch)}`,
          currentBatch
        );
        const rows1 = currentBatch.map(w => ({ word: w, pron: String(p1.get(w.toLowerCase()).pron ?? '') }));

        const p2 = await askMapped(
          CALL2_PROMPT,
          JSON.stringify(rows1),
          currentBatch
        );
        const rows2 = currentBatch.map(w => ({ word: w, pron: String(p2.get(w.toLowerCase()).pron ?? '') }));

        const p3 = await askMapped(
          CALL3_PROMPT,
          JSON.stringify(rows2),
          currentBatch
        );

        for (const w of currentBatch) {
          const e = p3.get(w.toLowerCase());
          results[w] = postProcess(w, String(e.pron == null ? '' : e.pron));
        }

        // 5. Write the whole dictionary atomically (a single JSON object: word -> key).
        const tmp = OUTPUT_JSON_PATH + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(results, null, 2) + '\n', 'utf8');
        fs.renameSync(tmp, OUTPUT_JSON_PATH);
        startIndex = endIndex;
        fs.writeFileSync(PROGRESS_LOG_PATH, String(startIndex), 'utf8');
        console.log(`✅ ${startIndex}/${totalWords}`);
        ok = true;
      } catch (error) {
        console.error(`❌ Batch ${startIndex}-${endIndex}: ${error.message}`);
        if (attempt < MAX_RETRIES) {
          const wait = RETRY_BASE_MS * attempt;
          console.log(`   retrying in ${wait / 1000}s…`);
          await new Promise(resolve => setTimeout(resolve, wait));
        } else {
          console.error('   gave up after ' + MAX_RETRIES + ' attempts. Aborting — re-run to resume (no work lost).');
          process.exit(1);
        }
      }
    }
  }

  console.log('🎉 Generation complete! All entries securely stored in dictionary.json.');
}

runPipeline();
