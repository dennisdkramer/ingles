// build-lessons.mjs — derive lessons.json from each lesson page's content <h1>.
// Run: node build-lessons.mjs  (or `npm run build:lessons` / `npm run qa`)
// Reads kids/ business/ nsfw/ lesson*.html (the PUBLISHED copies, not the .edit.html
// sidecars), takes the lesson number from the filename and the title from the
// content-area <h1>, and writes root lessons.json.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TRACKS = ['kids', 'business', 'nsfw'];

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
