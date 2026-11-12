/**
 * qa/patch-prompt.mjs — remove the default system prompt's contradictions with .clinerules.
 *
 * The base prompt is one string literal shipped inside the extension bundle. It cannot be replaced or
 * switched off (there is no compact-prompt mode, no custom-prompt file, and `{{CLINE_RULES}}` is
 * interpolated INSIDE it), so the only way to stop it teaching the opposite of our rules is to delete
 * the offending sentences from the bundle.
 *
 * What it says that we cannot obey, and why it has to go:
 *   - "Always show your planning process before executing any task" — our rule is no plan narration.
 *   - "present your plan at the start of your response ... It's OK for this section to be quite long"
 *     — same contradiction, plus an invitation to be long.
 *   - "be helpful and proactive! Don't ask for permission" — our rule is stop and ask when a request
 *     has more than one plausible reading.
 *   - the paragraph telling it to write up "a summary ... what you did and any relevant information
 *     the user should know" — our rule is the final answer is the result, not a report about it.
 *
 * What is deliberately KEPT: "IMPORTANT: Always include tool calls in your response until the task is
 * completed" — that is the sentence that keeps the agent working to the end instead of stopping early
 * with prose. Removing it would cost results, not prose.
 *
 * These strings are hand-maintained prose with typos ("Do not indicates", "will considered"). Match on
 * the typo, not on a corrected form — a corrected form does not exist in the bundle.
 *
 * Every replacement deletes whole sentences that sit inside a double-quoted literal and contain no
 * quote or backslash, so a deletion cannot break the literal or the file.
 *
 * Run:  node qa/patch-prompt.mjs --dry      show what would change
 *       node qa/patch-prompt.mjs            apply (safe to re-run; already-patched strings count 0)
 * Re-run after every extension update: a new version ships a fresh, unpatched bundle.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';

const DRY = process.argv.includes('--dry');
const MARKER = 'You are Cline, an AI coding agent.';

/* old -> new. `new` is empty for every deletion; the last one is a rewrite, not a deletion. */
const EDITS = [
  ['- Always show your planning process before executing any task. This will help ensure that you have a clear understanding of the requirements and that your approach aligns with the user\'s needs.\n', ''],
  [' Then, present your plan at the start of your response along with tool calls before proceeding with the task. It\'s OK for this section to be quite long.', ''],
  ['REMEMBER, be helpful and proactive! Don\'t ask for permission to do something when you can do it! Do not indicates you will be using a tool unless you are actually going to use it.\n\n', ''],
  ['When you have completed the task, please provide a summary of what you did and any relevant information that the user should know. This will help ensure that the user understands the changes made and can easily follow up if they have any questions or need further assistance. Do not indicate that you will perform an action without actually doing it. Always provide the final result in your response. Always validate your answer with checking the code and running it if possible. ',
    'When you have completed the task, provide the final result in your response. Do not indicate that you will perform an action without actually doing it. Validate the result by checking the code and running it if possible. '],
];

/* the extension ships one folder per version; patch them all, newest first, so an update cannot leave
   a stale patched copy behind that the loader might still reach */
const roots = path.join(os.homedir(), '.vscode', 'extensions');
const dirs = fs.readdirSync(roots)
  .filter(n => n.startsWith('saoudrizwan.claude-dev-'))
  .map(n => ({ n, v: (n.match(/(\d+)\.(\d+)\.(\d+)/) || [, 0, 0, 0]).slice(1).map(Number) }))
  .sort((a, b) => (b.v[0] - a.v[0]) || (b.v[1] - a.v[1]) || (b.v[2] - a.v[2]))
  .map(o => path.join(roots, o.n));
if (!dirs.length) { console.error('patch-prompt: no saoudrizwan.claude-dev-* extension found'); process.exit(1); }

const walk = d => fs.readdirSync(d, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : (/\.(js|mjs|cjs)$/.test(e.name) ? [path.join(d, e.name)] : []));

/* --- the baseline ------------------------------------------------------------
   What the prompt costs is base literal + .clinerules, and the base half is a moving target: an
   extension update replaces the bundle with a fresh, unpatched one. One command prints both halves and
   refuses to be quiet about a version change, so the number cannot drift unremarked. Update EXPECTED
   only after re-running the patch and confirming the new bundle still carries the four strings. */
const EXPECTED = '4.1.26';
const newest = dirs[0];
const version = (path.basename(newest).match(/(\d+\.\d+\.\d+)/) || [, 'unknown'])[1];

/** the base template: from the marker to the backtick closing the literal that holds {{CLINE_METADATA}} */
function basePromptChars() {
  for (const f of walk(newest)) {
    const t = fs.readFileSync(f, 'utf8');
    const i = t.indexOf(MARKER);
    if (i === -1) continue;
    const j = t.indexOf('{{CLINE_METADATA}}', i);
    const k = j === -1 ? -1 : t.indexOf('`', j);
    if (k !== -1) return t.slice(i, k).length;
  }
  return 0;
}

if (process.argv.includes('--baseline')) {
  const rulesFile = path.join(process.cwd(), '.clinerules', '.clinerules.md');
  /* bytes, not string length: the rules carry em dashes, which are 3 bytes each in UTF-8 */
  const rules = fs.existsSync(rulesFile) ? fs.readFileSync(rulesFile).length : 0;
  const base = basePromptChars();
  console.log('extension      ' + version + '   (' + path.basename(newest) + ')');
  console.log('base prompt    ' + base + ' chars');
  console.log('.clinerules    ' + rules + ' B');
  console.log('total          ' + (base + rules) + ' chars  ~' + Math.round((base + rules) / 4) + ' tokens');
  if (version !== EXPECTED) {
    console.log('\nFAIL version changed: the edits were authored against ' + EXPECTED + '.');
    console.log('  A new version ships a fresh, unpatched bundle. Run --dry, confirm it still carries the');
    console.log('  four strings, patch it, then set EXPECTED to ' + version + '.');
    process.exit(1);
  }
  process.exit(0);
}

let files = 0, changed = 0, before = 0, after = 0, partial = [];
for (const root of dirs) {
  for (const f of walk(root)) {
    const text = fs.readFileSync(f, 'utf8');
    if (!text.includes(MARKER)) continue;          // only the copies that carry the prompt
    files++;
    let next = text, n = 0;
    const missing = [];
    for (const [oldStr, newStr] of EDITS) {
      if (next.includes(oldStr)) { next = next.split(oldStr).join(newStr); n++; }
      else missing.push(oldStr.slice(0, 34));
    }
    /* some strings gone and some still here = an interrupted or hand-edited patch; report it loudly */
    if (n && missing.length) partial.push(path.relative(root, f) + ' — missing ' + missing.length + '/4');
    if (n) {
      const rel = path.relative(root, f);
      console.log((DRY ? 'would patch ' : 'patched ') + rel + '  ' + n + '/4 edit(s)  ' +
        text.length + ' -> ' + next.length + ' B  (' + (text.length - next.length) + ')');
      before += text.length; after += next.length; changed++;
      if (!DRY) fs.writeFileSync(f, next, 'utf8');
    } else {
      console.log('already clean ' + path.relative(root, f));
    }
  }
}

console.log('\nfiles carrying the prompt: ' + files + ' · changed: ' + changed +
  ' · bytes ' + before + ' -> ' + after + (before ? ' (-' + (before - after) + ')' : ''));
if (partial.length) { console.log('PARTIAL PATCHES: ' + partial.join('; ')); process.exitCode = 1; }
if (!changed && !partial.length) console.log('nothing to do: every copy is already patched');
