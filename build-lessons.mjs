// build-lessons.mjs — derive lessons.json from each lesson page's content <h1>.
// Run: node build-lessons.mjs  (or `npm run build:lessons` / `npm run qa`)
// Reads EVERY TRACK FOLDER's lesson*.html (the PUBLISHED copies, not the .edit.html sidecars), takes the
// lesson number from the filename and the title from the content-area <h1>, and writes root lessons.json
// plus root tracks.json (each track's label and order, read from that folder's track.json).
// A TRACK IS A FOLDER: discovery replaced the hardcoded ['kids','business','adult'], so a track created
// months from now is listed and grantable with no edit here, in index.html or in the QA harnesses.
// A track whose folder is GITIGNORED is skipped (nothing is gitignored today); without git, every existing
// folder is included. Generating into a deleted track's folder brings it back automatically.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
function ignored(rel) {
  try {
    execFileSync('git', ['check-ignore', '-q', rel], { cwd: ROOT, stdio: 'ignore' });
    return true;                     // exit 0 = the path IS ignored
  } catch (e) {
    return false;                    // exit 1 = not ignored; any other failure = assume published
  }
}
const TRACKS = discoverTracks();
const META = TRACKS.map(readTrackMeta).sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));

/* Which folders are tracks. A folder counts when it holds at least one published lesson page, OR a
   track.json — the second so a track can be created and granted before its first lesson is written. */
function discoverTracks() {
  const out = [];
  for (const d of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name[0] === '.' || d.name === 'node_modules') continue;
    let files = [];
    try { files = fs.readdirSync(path.join(ROOT, d.name)); } catch (e) { continue; }
    if (files.some(f => /^lesson\d+\.html$/.test(f)) || files.indexOf('track.json') >= 0) out.push(d.name);
  }
  return out.filter(t => !ignored(t)).sort();
}

/* track.json is the ONLY place a track's display name lives. The labels are Portuguese and painted
   ("Adulto 🔞", "Kids 🛹"), which no rule could derive from an English folder name, so the name is data,
   not code. Both fields are optional: no file (or no field) falls back to the folder name, and a track
   with no order sorts after every ordered track. */
function readTrackMeta(track) {
  const p = path.join(ROOT, track, 'track.json');
  let meta = {};
  if (fs.existsSync(p)) {
    try { meta = JSON.parse(fs.readFileSync(p, 'utf8')) || {}; }
    catch (e) { console.error('ERROR: ' + track + '/track.json is not valid JSON — ' + e.message); process.exitCode = 1; }
  }
  const name = String(track);
  const label = String(meta.label || (name.charAt(0).toUpperCase() + name.slice(1)));
  const order = Number.isFinite(Number(meta.order)) ? Number(meta.order) : 1000;
  /* icon: the emoji the approved-student switch carries in its thumb. color: the 200 swatch that switch
     turns ON in (owner instruction 2026-11-09). Both travel through tracks.json, so a track created later
     supplies its own and no code holds a track's colour. */
  const icon = String(meta.icon || '');
  const color = /^#[0-9a-f]{3,8}$/i.test(String(meta.color || '')) ? String(meta.color) : '';
  return { name: name, label: label, icon: icon, color: color, order: order };
}

function decodeEntities(s) {
  return String(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function extractTitle(html) {
  const at = html.indexOf('class="content-area"');
  const region = at >= 0 ? html.slice(at) : html;
  const m = region.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!m) return null;
  return decodeEntities(m[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

const manifest = {};
for (const meta of META) {
  const track = meta.name;
  const dir = path.join(ROOT, track);
  const entries = [];
  if (fs.existsSync(dir)) {
    for (const name of fs.readdirSync(dir)) {
      const m = name.match(/^lesson(\d+)\.html$/);
      if (!m) continue;
      const n = Number(m[1]);
      const html = fs.readFileSync(path.join(dir, name), 'utf8');
      const title = extractTitle(html);
      if (title == null) { console.warn(`WARN: no content <h1> in ${track}/${name}`); continue; }
      entries.push({ n, title });
    }
  }
  entries.sort((a, b) => a.n - b.n);
  manifest[track] = entries;
}

fs.writeFileSync(path.join(ROOT, 'lessons.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
const summary = Object.fromEntries(Object.entries(manifest).map(([k, v]) => [k, v.length]));

// tracks.json is what index.html reads to build its columns and its "＋ dar acesso" options, so the page
// holds no track name of its own: the list, the labels and their order all come from the folders.
const trackList = META.map(m => ({ name: m.name, label: m.label, icon: m.icon, color: m.color, order: m.order, count: summary[m.name] || 0 }));
fs.writeFileSync(path.join(ROOT, 'tracks.json'), JSON.stringify(trackList, null, 2) + '\n', 'utf8');

// index.html keeps a COUNTS fallback for the case where lessons.json cannot be fetched, and it is
// hand-written, so it silently disagreed with the folders: kids said 30 while kids/lesson31.html
// existed, and a student saw no lesson 31 at all. Derive it from the same walk that made the
// manifest. A missing anchor is an error, not a quiet pass — the failure this prevents was quiet.
const indexPath = path.join(ROOT, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');
const countsLine = /^const COUNTS=\{[^}]*\};$/m;
if (!countsLine.test(indexHtml)) {
  console.error('ERROR: index.html has no `const COUNTS={...};` line to keep in sync with the lesson folders.');
  process.exitCode = 1;
} else {
  const wanted = 'const COUNTS={' + META.map(m => m.name + ':' + (summary[m.name] || 0)).join(',') + '};';
  const before = indexHtml.match(countsLine)[0];
  if (before !== wanted) {
    fs.writeFileSync(indexPath, indexHtml.replace(countsLine, wanted), 'utf8');
    console.log('index.html COUNTS ' + before.slice(13, -1) + ' -> ' + wanted.slice(13, -1) + ' (fallback kept in step with the folders)');
  }
}
console.log('lessons.json written: ' + JSON.stringify(summary));
console.log('tracks.json written: ' + trackList.map(t => t.name + ' "' + t.label + '"').join(', '));
