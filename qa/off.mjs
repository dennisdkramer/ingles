/**
 * qa/off.mjs — the QA kill switch. Owners instruction 2026-11-10: every harness is OFF.
 *
 * Why: lesson generation is being judged on the page it produces, with nothing between the prompt and
 * the page. A harness that reds on a style choice is a second author, and its verdict arrives before
 * the page does. So each harness calls qaOff() as its first statement and exits 0 without reading a
 * page: a run now reports nothing, which is honest, rather than a red that is really a policy.
 *
 * TURN IT ALL BACK ON: set QA_ON=1 for the run (PowerShell: `$env:QA_ON='1'; node qa/run.mjs content`).
 * TURN ONE BACK ON FOR GOOD: delete its `qaOff('…')` line. Nothing else in the harness changed.
 *
 * What this does NOT cover: build-lessons.mjs (`npm run build:lessons`) is a build step, not a check,
 * and still writes lessons.json / tracks.json.
 */
export function qaOff(name) {
  if (process.env.QA_ON === '1') return;
  console.log('QA OFF - ' + name + ': disabled by owner instruction 2026-11-10. Re-enable with QA_ON=1.');
  process.exit(0);
}
