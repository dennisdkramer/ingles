/**
 * qa/pending.mjs — PENDING.md still has its authoring spine.
 *
 * Why this exists: the file is where a task's plan survives a context reset, so it is edited on almost
 * every turn. It was once rewritten wholesale — the edit's anchor covered the whole file — which deleted
 * `# [HANDLING]` and `# [CURRENT]` and left a bare list of batches. Nothing noticed. The format is what
 * makes the file readable to the next session, and a file that has lost it is worse than no file: it
 * looks like a plan and no longer says how a plan is written.
 *
 * A structure check, not a content review: it cannot tell whether a batch is well described, only that
 * the two headings that define the format are present, in order, and that every batch has a step.
 *
 * NOT behind qa/off.mjs: it reads one file and is meant to run at pre-push, where a corrupted spine would
 * otherwise be committed and reach the remote.
 *
 * Run: node qa/pending.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'PENDING.md');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('  OK   ' + name + (extra ? '  «' + extra + '»' : '')); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  «' + extra + '»' : '')); }
};

if (!fs.existsSync(FILE)) { console.log('  FAIL PENDING.md exists'); process.exit(1); }
const lines = fs.readFileSync(FILE, 'utf8').split(/\r?\n/);

const iHandling = lines.findIndex(l => l.trim() === '# [HANDLING]');
const iCurrent = lines.findIndex(l => l.trim() === '# [CURRENT]');
ok('# [HANDLING] is present', iHandling !== -1);
ok('# [CURRENT] is present', iCurrent !== -1);
ok('# [HANDLING] comes before # [CURRENT]', iHandling !== -1 && iCurrent !== -1 && iHandling < iCurrent,
  iHandling !== -1 && iCurrent !== -1 ? (iCurrent - iHandling) + ' lines apart' : 'cannot compare');

/* the format itself: the two template lines that say how a batch and a step are written */
const handling = iHandling === -1 ? [] : lines.slice(iHandling, iCurrent === -1 ? lines.length : iCurrent);
ok('[HANDLING] states the [Bn] format', handling.some(l => l.includes('## [Bn] - <')));
ok('[HANDLING] states the [Sn] format', handling.some(l => l.includes('- [Sn] - <')));

/* every batch that survives must have at least one step, or it is a heading with no work under it */
const body = iCurrent === -1 ? lines : lines.slice(iCurrent);
const batches = [], stepless = [];
for (let i = 0; i < body.length; i++) {
  const b = body[i].match(/^## \[B(\d+)\] /);
  if (!b) continue;
  let steps = 0;
  for (let j = i + 1; j < body.length && !/^## \[B/.test(body[j]); j++) if (/^\s+- \[S\d+\]/.test(body[j])) steps++;
  batches.push({ n: b[1], steps });
  if (!steps) stepless.push('B' + b[1]);
}
ok('a batch has at least one step', stepless.length === 0, stepless.join(', ') || batches.length + ' batch(es)');

console.log('\n' + (fail ? 'FAILED: ' : 'OK: ') + pass + ' passed, ' + fail + ' failed\n');
process.exitCode = fail ? 1 : 0;
