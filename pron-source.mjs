import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DICT_PATH = path.join(__dirname, 'data', 'cmudict.dict');

const VOWELS = new Set(['AA','AE','AH','AO','AW','AY','EH','ER','EY','IH','IY','OW','OY','UH','UW']);
const CC_ONSETS = new Set([
  'PR','PL','BR','BL','TR','DR','KR','KL','GR','GL','FR','FL','THR','SHR',
  'SP','ST','SK','SL','SM','SN','SW','TW','DW','KW','GW',
  'PY','BY','TY','DY','KY','GY','FY','VY','THY','SY','ZY','SHY','HY','MY','NY','LY','RY','WY','HHY'
]);

let DICT = null;

function load() {
  if (DICT) return DICT;
  DICT = new Map();
  const raw = fs.readFileSync(DICT_PATH, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line[0] === ';') continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const word = parts[0];
    if (/\(\d+\)$/.test(word)) continue; // skip alternate pronunciations WORD(2)…
    const phones = parts.slice(1).map(parsePhone);
    const key = word.toUpperCase();
    if (!DICT.has(key)) DICT.set(key, phones); // keep the primary (first-listed) pronunciation
  }
  return DICT;
}

function parsePhone(token) {
  const m = token.match(/^([A-Z]+)([0-2])?$/);
  if (!m) return { p: token, stress: null };
  return { p: m[1], stress: m[2] == null ? null : Number(m[2]) };
}

const isVowel = (p) => VOWELS.has(p);

// legal English onset cluster (maximal-onset syllabification)
function isLegalOnset(seg) {
  if (seg.length === 0) return true;
  if (seg.length === 1) return true;
  if (seg.length === 2) return CC_ONSETS.has(seg[0] + seg[1]);
  if (seg.length === 3) return seg[0] === 'S' && CC_ONSETS.has(seg[1] + seg[2]);
  return false;
}

function syllabify(phones) {
  const vowelIdx = [];
  for (let i = 0; i < phones.length; i++) if (isVowel(phones[i].p)) vowelIdx.push(i);
  if (vowelIdx.length === 0) return [{ start: 0, end: phones.length, stress: null }];
  const syll = [];
  for (let k = 0; k < vowelIdx.length; k++) {
    const v = vowelIdx[k];
    let start;
    if (k === 0) {
      start = 0;
    } else {
      const cluster = phones.slice(vowelIdx[k - 1] + 1, v).map((x) => x.p);
      let split = cluster.length;
      for (let j = 0; j <= cluster.length; j++) {
        if (isLegalOnset(cluster.slice(j))) { split = j; break; }
      }
      start = vowelIdx[k - 1] + 1 + split;
    }
    syll.push({ start, end: v + 1, stress: phones[v].stress });
  }
  syll[syll.length - 1].end = phones.length;
  for (let k = 1; k < syll.length; k++) syll[k - 1].end = syll[k].start;
  return syll;
}

export function pronounce(word) {
  load();
  const phones = DICT.get(word.toUpperCase());
  if (!phones) return null;
  return { word, phones, syllables: syllabify(phones) };
}

export function renderSyllabified(pron) {
  return pron.syllables
    .map((s) => pron.phones.slice(s.start, s.end).map((x) => x.p + (x.stress ?? '')).join(' '))
    .join(' · ');
}

export function isInDict(word) {
  load();
  return DICT.has(word.toUpperCase());
}
