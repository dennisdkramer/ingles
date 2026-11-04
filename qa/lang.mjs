#!/usr/bin/env node
/**
 * qa/lang.mjs — language + register audit. Read-only: no browser, no network, no writes.
 *
 * Implements the two rules and nothing else (PEDAGOGY-MAP §4, §1):
 *   language — Portuguese may be used in [lesson introduction · explanatory text · tip · headline · column header]
 *              only when its parent [LESSON NUMBER] < [CONTENT LEVEL]; in any other content type only when
 *              *defensibly optimal for teaching*. A script cannot judge "defensibly optimal", so this one does NOT
 *              gate on amount: it counts PT by element type and reports it. Amount is an author judgement.
 *   register — the socio-linguistic context fixes the register as one of the TRACK's three options; a term from
 *              another track's context field is a defect. GATED.
 *   marking  — Portuguese is always italic and always marked (.pt / .ptw / lang="pt"). GATED: an unmarked PT span
 *              renders as English, which is the one objectively wrong outcome.
 *
 * usage:  node qa/lang.mjs 15-35
 *         node qa/lang.mjs 1-8 --track kids
 *         node qa/lang.mjs 15-35 --json
 * exit 1 only for unmarked Portuguese and off-track register.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TRACKS = ['business', 'kids', 'adult'];

/* Portuguese function words: enough to recognise PT prose, rare enough not to fire on English. */
const PT_WORDS = new Set(`que nao não para voce você vocês com uma um dos das pelo pela isso aqui quando mais mas
  seu sua tem foi ser esta está estão tambem também porque entao então nos nós eles ela ele ao à às num numa muito
  so só ja já nunca sempre depois antes entre sobre mesmo cada tudo nada alguem alguém ninguem ninguém nosso nossa
  meu minha dele dela la lá onde como qual quais quem quanto`.split(/\s+/));

/* §1 context fields: a term that belongs to a different track's world. */
const OFF_TRACK = {
  kids: ['invoice', 'client', 'deadline', 'revenue', 'agenda', 'stakeholder', 'quarterly', 'budget', 'proposal',
    'negotiate', 'kpi', 'spreadsheet', 'memo', 'onboarding', 'payroll', 'vendor', 'procurement', 'appraisal'],
  adult: ['playground', 'cartoon', 'crayon', 'lunchbox', 'sandbox', 'teddy bear', 'recess', 'schoolbag'],
  business: ['playground', 'cartoon', 'crayon', 'lunchbox', 'sandbox', 'teddy bear', 'recess', 'schoolbag'],
};

const EN_STOP = new Set(`the a an and or of to in on at for with is are was were be been being it this that these
  those i you he she we they me my your his her our their not no do does did have has had will would can could
  should may might must as by from up down out about if then than so but what which who when where why how there
  here one two all any some more most other into over after before also just only very too its s t re ll ve d m`.split(/\s+/));

const TAG = /<([a-zA-Z][\w:-]*)((?:'[^']*'|"[^"]*"|[^>'"])*)>([^<]*)/g;

const isMarked = (a) => /lang\s*=\s*["']pt/i.test(a) || /class\s*=\s*(?:"[^"]*\bptw?\b[^"]*"|'[^']*\bptw?\b[^']*')/i.test(a);
const words = (t) => (t.match(/[A-Za-zÀ-ÿ']+/g) || []).length;
const tokens = (t) => t.toLowerCase().match(/[a-zà-ÿ']{2,}/g) || [];

const RANK = new Map();
try {
  fs.readFileSync(path.join(ROOT, 'top50000_english.txt'), 'utf8').split(/\r?\n/)
    .forEach((w, i) => { const k = w.trim().toLowerCase(); if (k && !RANK.has(k)) RANK.set(k, i + 1); });
} catch { /* vocabulary-density signal disabled, the two rules still run */ }

const BLOCK = /<(p|td|th|li|h1|h2|h3|figcaption|label)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
const MARK = /<(\w+)([^>]*(?:lang\s*=\s*["']pt["']|class\s*=\s*["'][^"']*\bptw?\b[^"']*["'])[^>]*)>([\s\S]*?)<\/\1>/gi;

function audit(track, n) {
  const file = path.join(ROOT, track, `lesson${n}.html`);
  if (!fs.existsSync(file)) return null;
  let html = fs.readFileSync(file, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const cut = html.search(/<div class="content-area"/i);
  if (cut > 0) html = html.slice(cut);
  const sections = html.split(/<h2\b/i).length;

  let pt = 0, unmarked = 0, hardN = 0, totN = 0;
  const violations = [], notes = [];

  BLOCK.lastIndex = 0;
  let m;
  while ((m = BLOCK.exec(html))) {
    const attrs = m[2];
    const inner = m[3];
    if (isMarked(attrs)) {                       // whole block is PT: <p class="card pt">, <td lang="pt">
      pt += words(inner.replace(/<[^>]+>/g, ' '));
      continue;
    }
    MARK.lastIndex = 0;
    let k;
    while ((k = MARK.exec(inner))) {             // inline PT inside an English block
      pt += words(k[3].replace(/<[^>]+>/g, ' '));
    }
    const rest = inner.replace(MARK, ' ').replace(/<[^>]+>/g, ' ');
    const tk = tokens(rest);
    if (tk.length < 4) continue;
    const hits = tk.filter((t) => PT_WORDS.has(t)).length;
    if (hits >= 2 && hits / tk.length >= 0.15) { unmarked += tk.length; continue; }
    for (const t of tk) {
      if (EN_STOP.has(t) || PT_WORDS.has(t)) continue;
      totN++;
      const r = RANK.get(t);
      if (!r || r > 2000) hardN++;
    }
  }

  if (unmarked >= 12) violations.push(`${unmarked} words of unmarked Portuguese (renders as English)`);
  else if (unmarked) notes.push(`${unmarked} unmarked PT word(s)`);

  const plain = html.replace(/<[^>]+>/g, ' ').toLowerCase();
  const leaks = (OFF_TRACK[track] || []).filter((t) => new RegExp(`\\b${t}\\b`, 'i').test(plain));
  if (leaks.length) violations.push(`off-track register: ${leaks.join(', ')}`);

  if (n >= 31 && pt >= 40) notes.push(`${pt}w of marked PT at L${n} — each span must clear C > L, or be a defensible other-type use`);

  return { track, n, sections, pt, unmarked, hard: totN ? Math.round((100 * hardN) / totN) : null, violations, notes };
}
const argv = process.argv.slice(2);
let track = null, json = false;
const nums = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--json') json = true;
  else if (a === '--track') track = (argv[++i] || '').toLowerCase();
  else if (/^\d+-\d+$/.test(a)) { const [s, e] = a.split('-').map(Number); for (let k = s; k <= e; k++) nums.push(k); }
  else if (/^\d+$/.test(a)) nums.push(Number(a));
  else if (TRACKS.includes(a.toLowerCase())) track = a.toLowerCase();
}
track = track || 'business';
if (!nums.length) { console.error('usage: node qa/lang.mjs <n | n-m> ... [--track kids|adult|business] [--json]'); process.exit(2); }

const rows = nums.map((n) => audit(track, n)).filter(Boolean);
const failing = rows.filter((r) => r.violations.length);
if (json) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  for (const r of rows) {
    const head = `${r.track} L${String(r.n).padStart(2)}  sects ${String(r.sections).padStart(2)}  PT ${String(r.pt).padStart(4)}w · unmarked ${String(r.unmarked).padStart(4)}w  hard ${String(r.hard ?? '--').padStart(3)}%`;
    console.log(`${r.violations.length ? '[FAIL]' : '[ ok ]'} ${head}`);
    for (const x of r.violations) console.log(`         - ${x}`);
    for (const x of r.notes) console.log(`         · ${x}`);
  }
  console.log(`\n${rows.length - failing.length}/${rows.length} clean${failing.length ? `, ${failing.length} failing` : ''}`);
  console.log('amount is reported, not gated — PT is a judgement (§4), marking and register are the rules');
}
process.exit(failing.length ? 1 : 0);

