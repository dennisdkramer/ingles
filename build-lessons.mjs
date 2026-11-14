// build-lessons.mjs — what each lesson page IS, taken from its filename. No page is read.
// Run: node build-lessons.mjs  (or `npm run build:lessons` / `npm run qa`)
// A page is `lesson<N>-<Title>.html`: the number is its position in the book and the rest is its name, so
// this file lists {n, title, file} per track, writes root lessons.json, and re-stamps style.css in index.html.
// TRACKS ARE THE TABLE BELOW. A new track is one line, added by hand; a folder holding lesson pages that is
// missing from the table is reported, never silently dropped.
import fs from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

/* name, then how the site names and paints the track: label, icon, the 200 swatch of the access switch, order */
const TRACKS = [
  { name: 'kids', label: 'Kids', icon: '🛹', color: '#FFE082', order: 1 },
  { name: 'business', label: 'Business', icon: '💼', color: '#90CAF9', order: 2 },
  { name: 'adult', label: 'Adulto', icon: '🔞', color: '#FFAB91', order: 3 },
  { name: 'advanced-stem', label: 'Advanced STEM', icon: '🔬', color: '#80CBC4', order: 4 },
  { name: 'advanced-aave', label: 'Advanced AAVE', icon: '🎤', color: '#B39DDB', order: 5 },
  { name: 'memelord-mogger', label: 'Memelord Mogger', icon: '😎', color: '#E6EE9C', order: 6 },
  { name: 'english-basic-portuguese', label: 'English → Basic Portuguese', icon: '🔁', color: '#80DEEA', order: 7 },
  { name: 'gramatica-redacao', label: 'Gramática e Redação', icon: '✍️', color: '#F48FB1', order: 8 },
  { name: 'linguagem-figurativa-giria', label: 'Linguagem Figurativa e Giria', icon: '🎭', color: '#9FA8DA', order: 9 },
];

/* a folder with lesson pages that the table does not know: say so, rather than publish a site without it */
for (const d of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!d.isDirectory() || d.name[0] === '.' || d.name === 'node_modules') continue;
  if (TRACKS.some(t => t.name === d.name)) continue;
  let files = [];
  try { files = fs.readdirSync(path.join(ROOT, d.name)); } catch (e) { continue; }
  if (files.some(f => /^lesson\d+.*\.html$/.test(f))) {
    console.warn('WARN: ' + d.name + '/ has lesson pages but is not in the TRACKS table of this file');
  }
}

const manifest = {};
for (const meta of TRACKS) {
  const track = meta.name;
  const dir = path.join(ROOT, track);
  const entries = [];
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir)) {
      /* THE FILENAME IS THE TITLE: `lesson<N>-<Title>.html`. No page is read — a build that reads a page
         to learn its own name is reading content it has no business in. */
      const m = name.match(/^lesson(\d+)(?:-(.*))?\.html$/);
      if (!m) continue;
      const n = Number(m[1]);
      entries.push({ n, title: m[2] ? m[2] : 'Lesson ' + n, file: name });
    }
  }
  entries.sort((a, b) => a.n - b.n);
  manifest[track] = entries;
}

fs.writeFileSync(path.join(ROOT, 'lessons.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
const summary = Object.fromEntries(Object.entries(manifest).map(([k, v]) => [k, v.length]));

// tracks.json is what index.html reads to name and paint each track, so the page holds no track name of
// its own. No count travels here: a track's size is lessons.json's own array, and a copy can only drift.
const trackList = TRACKS.map(m => ({ name: m.name, label: m.label, icon: m.icon, color: m.color, order: m.order }));
fs.writeFileSync(path.join(ROOT, 'tracks.json'), JSON.stringify(trackList, null, 2) + '\n', 'utf8');

// The stylesheet's version stamp is BAKED INTO index.html by this build, never applied at runtime. It used to be
// swapped in by JS at load, which changed <link>.href while the first fetch was still in flight: the browser
// aborted and restarted the fetch, painted the document unstyled, then repainted — the page "decomposed", the
// logo flashed left, and it redrew centred (owner report 2026-11-09). A href present in the HTML is
// render-blocking, so there is nothing to paint early. The stamp is the file's own hash, so it changes exactly
// when style.css changes, and a stale stamp is a harness failure rather than an invisible cache miss.
const cssUrl = 'style.css?v=' + createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'style.css'))).digest('hex').slice(0, 10);
const linkRe = /<link rel="stylesheet" href="style\.css(?:\?v=[0-9a-f]*)?"/;
const indexPath = path.join(ROOT, 'index.html');
const htmlNow = fs.readFileSync(indexPath, 'utf8');
if (!linkRe.test(htmlNow)) {
  console.error('ERROR: index.html has no <link rel="stylesheet" href="style.css"> for the build to stamp.');
  process.exitCode = 1;
} else {
  const before = htmlNow.match(linkRe)[0];
  const wanted = '<link rel="stylesheet" href="' + cssUrl + '"';
  if (before !== wanted) {
    fs.writeFileSync(indexPath, htmlNow.replace(linkRe, wanted), 'utf8');
    console.log('index.html stylesheet stamped -> ' + cssUrl);
  }
}
console.log('lessons.json written: ' + JSON.stringify(summary));
console.log('tracks.json written: ' + trackList.map(t => t.name + ' "' + t.label + '"').join(', '));
