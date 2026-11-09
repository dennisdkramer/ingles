// build-lessons.mjs — derive lessons.json from each lesson page's content <h1>.
// Run: node build-lessons.mjs  (or `npm run build:lessons` / `npm run qa`)
// Reads kids/ business/ adult/ lesson*.html (the PUBLISHED copies, not the .edit.html
// sidecars), takes the lesson number from the filename and the title from the
// content-area <h1>, and writes root lessons.json.
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
const TRACKS = ['kids', 'business', 'adult'].filter(t => !ignored(t));

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
for (const track of TRACKS) {
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
  const wanted = 'const COUNTS={' + ['kids', 'business', 'adult'].map(t => t + ':' + (summary[t] || 0)).join(',') + '};';
  const before = indexHtml.match(countsLine)[0];
  if (before !== wanted) {
    fs.writeFileSync(indexPath, indexHtml.replace(countsLine, wanted), 'utf8');
    console.log('index.html COUNTS ' + before.slice(13, -1) + ' -> ' + wanted.slice(13, -1) + ' (fallback kept in step with the folders)');
  }
}
console.log('lessons.json written: ' + JSON.stringify(summary));
