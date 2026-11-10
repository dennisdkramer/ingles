/**
 * qa/liquid.mjs — will the next push publish, or leave the old site standing while saying nothing?
 *
 * The incident this exists for, on 2026-11-10: PENDING.md carried the two characters `{{` inside a code
 * span, on a line recording that no placeholder had been left in a page it had just written. Every tracked
 * `.md` here is a Jekyll page — GitHub Pages runs jekyll-optional-front-matter, so a .md without front
 * matter gets one — and Jekyll parses the file with LIQUID BEFORE Kramdown turns it into HTML. Liquid read
 * `{{` as an output tag that never closed and aborted the build. Pages then kept serving the previous
 * deployment: `git push` succeeded, two commits in a row published nothing, the site silently stayed on the
 * old lesson list, and no local tool had said a word. The owner found it, not the checks.
 *
 * Backticks are not an escape here. Markdown's own escaping runs after Liquid has already parsed the text,
 * so a code span protects nothing: to Liquid, the backticks are ordinary characters wrapped around an
 * unclosed opener.
 *
 *   FAIL  an unclosed `{{` or `{%` — Liquid's own syntax error, and the whole build dies with it
 *   FAIL  a `{%` tag name Liquid does not know — the same syntax error, spelled differently
 *   WARN  a closed `{{…}}` — legal and evaluated, so the published page shows a BLANK where the name was:
 *         FORMAT.md:6 has five, and a reader of that page sees "its five placeholders filled: ` `, ` `…".
 *         A warning, because the site still builds.
 *   SAFE  `{% raw %}` … `{% endraw %}` — Liquid copies that span through untouched, so an opener inside it
 *         is a text token, not a delimiter. This is the escape to reach for when a token must be shown.
 *
 * Presence is not the defect — balance is. FORMAT.md has carried five closed tokens for as long as the site
 * has built; the incident was one that never closed. A harness that redded on presence would be red on a
 * healthy repo and would be turned off within a week.
 *
 * SCOPE: the tracked `.md` set, because that is what GitHub builds (`git ls-files`). A file git does not
 * know about is not published and is not judged. Paths named on the command line replace that set, which is
 * how a falsification run reads an old revision of a file.
 *
 * Run: node qa/liquid.mjs [path …] [--selftest]
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const OUT_OPEN = '{{', OUT_CLOSE = '}}', TAG_OPEN = '{%', TAG_CLOSE = '%}';
const RAW_OPEN = '{% raw %}', RAW_CLOSE = '{% endraw %}';

/* Liquid 4, as Jekyll 3.10 ships it: every tag a .md may legally open. A name outside this list is
   "Liquid syntax error: Unknown tag" and kills the build exactly like an unclosed opener does. */
const TAGS = new Set([
  'assign', 'break', 'capture', 'case', 'comment', 'continue', 'cycle', 'decrement', 'echo', 'for', 'if',
  'ifchanged', 'include', 'increment', 'layout', 'liquid', 'raw', 'render', 'tablerow', 'unless', 'when',
  'while', 'else', 'elsif', 'endcapture', 'endcase', 'endcomment', 'endfor', 'endif', 'endifchanged',
  'endraw', 'endtablerow', 'endunless', 'endwhile',
]);

const lineOf = (text, pos) => {
  let n = 1;
  for (let k = 0; k < pos && k < text.length; k++) if (text.charCodeAt(k) === 10) n++;
  return n;
};

/** the line as Liquid sees it, trimmed for the report */
const excerpt = (text, pos) => {
  const start = text.lastIndexOf('\n', pos) + 1;
  const end = text.indexOf('\n', pos);
  const raw = text.slice(start, end < 0 ? text.length : end).trim();
  return raw.length > 110 ? raw.slice(0, 107) + '…' : raw;
};

/* ---- the scanner ---- */

/**
 * One text in, findings out. Each finding: { at: <offset>, kind: 'fail'|'warn', what }.
 * A `raw` span is jumped whole, never scanned: that is Liquid's own rule, and honouring it is what lets a
 * document show a token without lying about what it means.
 */
function scan(text) {
  const found = [];
  let i = 0;
  while (i < text.length) {
    if (text.startsWith(RAW_OPEN, i)) {
      const end = text.indexOf(RAW_CLOSE, i + RAW_OPEN.length);
      if (end < 0) {
        found.push({ at: i, kind: 'fail', what: 'a {% raw %} that never closes — everything after it is swallowed' });
        break;
      }
      i = end + RAW_CLOSE.length;
      continue;
    }
    if (text.startsWith(TAG_OPEN, i)) {
      const end = text.indexOf(TAG_CLOSE, i + TAG_OPEN.length);
      if (end < 0) {
        found.push({ at: i, kind: 'fail', what: 'an unclosed {% — a Liquid tag with no ending, so the Pages build aborts' });
        break;
      }
      const name = (text.slice(i + TAG_OPEN.length, end).trim().split(/\s+/)[0] || '').toLowerCase();
      if (!TAGS.has(name)) {
        found.push({ at: i, kind: 'fail', what: 'a Liquid tag Liquid does not know «' + name + '» — the same build abort' });
      }
      i = end + TAG_CLOSE.length;
      continue;
    }
    if (text.startsWith(OUT_OPEN, i)) {
      const end = text.indexOf(OUT_CLOSE, i + OUT_OPEN.length);
      if (end < 0) {
        found.push({ at: i, kind: 'fail',
          what: 'an unclosed {{ — Liquid reads it as an output tag and the Pages build aborts before Markdown runs' });
        break;
      }
      found.push({ at: i, kind: 'warn', what: 'a closed Liquid output tag «' + text.slice(i, end + OUT_CLOSE.length)
        + '» — evaluated, so the published page shows a blank' });
      i = end + OUT_CLOSE.length;
      continue;
    }
    i++;
  }
  return found;
}

/* ---- the falsification: each case is a verdict the incident theory stands on ---- */

function selftest() {
  const cases = [
    ['the 74136eb line, verbatim', 'div 205/205, table 6/6, no `{{` left', { fail: 1, warn: 0 }],
    ['a token written closed', 'The shell fills {{TRACK_TITLE}} and {{L}} when a page is made.', { fail: 0, warn: 2 }],
    ['a token wrapped in raw', 'Write it as {% raw %}{{{% endraw %} and Liquid copies it through.', { fail: 0, warn: 0 }],
    ['a tag that never closes', 'before {% if x and after', { fail: 1, warn: 0 }],
    ['a tag Liquid does not know', 'before {% frobnicate %} after', { fail: 1, warn: 0 }],
    ['ordinary prose', 'The cold held me back for three places, and I still had eight to go.', { fail: 0, warn: 0 }],
  ];
  let bad = 0;
  for (const [name, text, want] of cases) {
    const f = scan(text);
    const got = { fail: f.filter(x => x.kind === 'fail').length, warn: f.filter(x => x.kind === 'warn').length };
    const ok = got.fail === want.fail && got.warn === want.warn;
    if (!ok) bad++;
    console.log((ok ? '✅ ' : '❌ ') + name + ' → ' + got.fail + ' fail, ' + got.warn + ' warn'
      + (ok ? '' : '  (expected ' + want.fail + ' fail, ' + want.warn + ' warn)'));
  }
  console.log('\n' + (bad ? '❌ ' + bad + ' of ' + cases.length + ' selftest case(s) no longer land'
    : '✅ ' + cases.length + ' selftest cases: the incident still fails, prose still passes'));
  process.exit(bad ? 1 : 0);
}

/* ---- the run ---- */

const argv = process.argv.slice(2);
if (argv.includes('--selftest')) selftest();
const named = argv.filter(a => !a.startsWith('--'));

let files = named;
if (!files.length) {
  const r = spawnSync('git', ['ls-files', '-z', '*.md'], { cwd: ROOT, encoding: 'utf8', windowsHide: true });
  if (r.error || r.status !== 0) {
    console.log('❌ could not list the tracked .md set with git' + (r.error ? ': ' + r.error.message : ''));
    process.exit(1);
  }
  files = r.stdout.split('\0').filter(Boolean);
}
if (!files.length) { console.log('✅ no .md files to read'); process.exit(0); }

console.log('▶ liquid — ' + files.length
  + (named.length ? ' named file(s)' : ' tracked .md file(s), the set GitHub Pages builds'));

let fails = 0, warns = 0, clean = 0;
for (const rel of files) {
  let text;
  try { text = fs.readFileSync(path.resolve(ROOT, rel), 'utf8'); }
  catch (e) { console.log('❌ ' + rel + '  cannot be read: ' + e.message); fails++; continue; }
  const found = scan(text);
  const f = found.filter(x => x.kind === 'fail');
  const w = found.filter(x => x.kind === 'warn');
  if (f.length) {
    fails++;
    console.log('❌ ' + rel);
    for (const x of f) {
      console.log('   ' + rel + ':' + lineOf(text, x.at) + '  ' + x.what);
      console.log('      ' + excerpt(text, x.at));
    }
  }
  if (w.length) {
    warns++;
    console.log('⚠  ' + rel + ' — ' + w.length + ' closed Liquid construct(s)');
    for (const x of w.slice(0, 6)) console.log('   ' + rel + ':' + lineOf(text, x.at) + '  ' + x.what);
    if (w.length > 6) console.log('   … and ' + (w.length - 6) + ' more');
  }
  if (!f.length && !w.length) clean++;
}

console.log('\n' + (fails
  ? '❌ ' + fails + ' file(s) above would abort the Pages build: the push publishes nothing and the site keeps '
    + 'the previous deployment. Fix the line, or wrap the token in a raw block.'
  : '✅ ' + clean + ' clean file(s), ' + warns + ' with warnings: every .md this site publishes parses as Liquid'));
process.exit(fails ? 1 : 0);
