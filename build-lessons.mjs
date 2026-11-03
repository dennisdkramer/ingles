// build-lessons.mjs — derive lessons.json from each lesson page's content <h1>.
// Run: node build-lessons.mjs  (or `npm run build:lessons` / `npm run qa`)
// Reads kids/ business/ adult/ lesson*.html (the PUBLISHED copies, not the .edit.html
// sidecars), takes the lesson number from the filename and the title from the
// content-area <h1>, and writes root lessons.json.
// A track whose folder is GITIGNORED is skipped: kids/ and adult/ hold the old pre-rewrite wording and are
// untracked/ignored on purpose (owner instruction 2026-11-03), so they must not be advertised in the
// committed manifest. Regenerating a track and committing it brings it back automatically (git check-ignore
// then says it is not ignored). Without git, every existing folder is included.
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
console.log('lessons.json written: ' + JSON.stringify(summary));
