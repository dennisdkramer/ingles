// build-audio.mjs — render every `data-say` string to audio/<hash>.mp3 + audio/manifest.json.
// Local neural TTS (Kokoro-82M, voice af_heart = neutral US female), no API key, no network
// beyond the one-off model download. Run: `npm run build:audio` (or `node build-audio.mjs`).
//   --dir <name>      folder to scan (repeatable; default: business)
//   --limit <n>       render at most n new clips (useful for a smoke render)
//   --check           render nothing; list missing clips (exit 1 if any, for a publish gate)
//   --force           re-render clips that already exist
//   --voice <id>      Kokoro voice (default af_heart)
// The manifest is merged, never truncated: a partial render keeps earlier clips.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'audio');
const MAN = path.join(OUT, 'manifest.json');
const MODEL = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const DTYPE = 'q8';
const RATE = 24000;

const argv = process.argv.slice(2);
const flag = (n) => argv.includes('--' + n);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const dirs = [];
for (let i = 0; i < argv.length; i++) if (argv[i] === '--dir' && argv[i + 1]) dirs.push(argv[i + 1]);
if (!dirs.length) dirs.push('business');
const VOICE = opt('voice', 'af_heart');
const LIMIT = Number(opt('limit', '0')) || 0;
const CHECK = flag('check');
const FORCE = flag('force');

function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function collect(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) { console.warn('skip (no such folder): ' + dir); return []; }
  const out = [];
  for (const name of fs.readdirSync(abs)) {
    if (!/^lesson\d+\.html$/.test(name)) continue; // .edit.html sidecars are identical copies
    const html = fs.readFileSync(path.join(abs, name), 'utf8');
    for (const m of html.matchAll(/data-say="([^"]*)"/g)) {
      const t = decode(m[1]).trim();
      if (t) out.push(t);
    }
  }
  return out;
}

const fileFor = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 16) + '.mp3';

function toMp3(samples, sr) {
  // lazy import: only needed when we actually render
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return { pcm, sr };
}

function encode(pcm, sr, lamejs) {
  const enc = new lamejs.Mp3Encoder(1, sr, 64);
  const parts = [];
  const chunk = 1152 * 10;
  for (let i = 0; i < pcm.length; i += chunk) {
    const buf = enc.encodeBuffer(pcm.subarray(i, Math.min(i + chunk, pcm.length)));
    if (buf.length) parts.push(Buffer.from(buf));
  }
  const tail = enc.flush();
  if (tail.length) parts.push(Buffer.from(tail));
  return Buffer.concat(parts);
}

const texts = [...new Set(dirs.flatMap(collect))].sort();
fs.mkdirSync(OUT, { recursive: true });
let manifest = { voice: VOICE, model: MODEL, sampleRate: RATE, format: 'mp3', clips: {} };
if (fs.existsSync(MAN)) {
  try { const old = JSON.parse(fs.readFileSync(MAN, 'utf8')); manifest = { ...manifest, ...old, clips: old.clips || {} }; } catch (e) { }
}
manifest.voice = VOICE;

const missing = texts.filter((t) => FORCE || !manifest.clips[t] || !fs.existsSync(path.join(OUT, fileFor(t))));
console.log(`${dirs.join(',')}: ${texts.length} unique data-say strings, ${missing.length} to render (voice ${VOICE})`);

if (CHECK) {
  if (missing.length) {
    console.log('MISSING:\n' + missing.map((t) => '  - ' + t).join('\n'));
    process.exit(1);
  }
  console.log('all clips present');
  process.exit(0);
}
if (!missing.length) { console.log('nothing to render'); process.exit(0); }

const { KokoroTTS } = await import('kokoro-js');
const lamejs = (await import('@breezystack/lamejs')).default;
const tts = await KokoroTTS.from_pretrained(MODEL, { dtype: DTYPE, device: 'cpu' });

const todo = LIMIT ? missing.slice(0, LIMIT) : missing;
let done = 0;
for (const text of todo) {
  const audio = await tts.generate(text, { voice: VOICE });
  const { pcm } = toMp3(audio.audio, audio.sampling_rate || RATE);
  const mp3 = encode(pcm, audio.sampling_rate || RATE, lamejs);
  const file = fileFor(text);
  fs.writeFileSync(path.join(OUT, file), mp3);
  manifest.clips[text] = file;
  done++;
  if (done % 10 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}`);
}
fs.writeFileSync(MAN, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`wrote ${done} clip(s); manifest now holds ${Object.keys(manifest.clips).length} entry(ies)`);
