# BLUEPRINT — the agent's own working memory (mutable; I own this file)

**Rule for the agent: update this file BEFORE any heavy edit or long command** (progress, the decision you just
took, and your next immediate step). **After any compaction, read this file → `PAGE-CHECKLIST.md` → the current
lesson's design — before touching anything.** Keep it under ~60 lines; trim old detail, never the `WHERE WE ARE`
and `NEXT IMMEDIATE STEP` lines.

## WHERE WE ARE
Business **1-35** built and pushed (`a23f924`); `designs/lesson01-35` exist. **Nothing above 35 exists.** `kids/` and
`adult/` are tracked and empty (old pages moved to `lessons-archive/`). `lessons.json` 35/0/0 · COUNTS `0/35/0`.
**Spec:** `PEDAGOGY-MAP.md` + `PAGE-CHECKLIST.md` are king (owner edit 2026-11-03) — Portuguese §4 t), register §4 u),
level §5 v)-y) judged at generation. **QA is OFF for this run.** `qa/lang.mjs` was deleted with it.

## CURRENT SLICE
Fixed order (owner 2026-11-03; batches free, order not): **① Pass A business 36-50 → ② sweep business 1-35
(language + level, rapid) → ③ Pass B 36-50 → ④ Pass A kids 1-50 (from the business idea) → ⑤ Pass B kids →
⑥ Pass A adult 1-50 (from the kids idea) → ⑦ Pass B adult → ⑧ close with a QA report, then await instruction.**
Detail and push cadence: `PENDING.md` + `HANDOFF.md`.

## NEXT IMMEDIATE STEP
- [ ] **Pass A lesson 36** (storytelling / narrative) → `designs/lesson36.design.md`, then 37, 38 → push batch 8.

## DELTA
**L35 vs L34:** 34 was written tone (the e-mail ladder); 35 is spoken service under pressure — the call script,
de-escalation, the partial yes and escalation with a date. New axis: live conflict, not register.

## DECISIONS TAKEN (newest first — append here, don't rewrite)
- **2026-11-03 (owner edit)** — **language and register are single statements, decided at the point of generation**
  (`PEDAGOGY-MAP` §4 t) / §4 u); level §5 v)-y), CONTENT LEVEL judged, nothing scored). No counts, quotas, bands or
  checkers. `qa/lang.mjs`, the `band:` design line and every scoring table were removed; the two spec files are king.
- **2026-11-03 (owner)** — the run is **one task, three tracks**, in the fixed order above; kids derives from the
  business design's fundamental idea, adult from the kids design's — re-imagined, never find-replaced.
- **2026-11-03** — lesson 15 shape: travel-planning carrier, `.dialog` for the permission/request beat, future
  contrast as one chart (will / going to / present continuous) — one idea per section, 9 sections.
- **2026-11-03** — audio deferred: author `data-say` on every target line now, render at the very end.
- **2026-11-03** — batch = 3 lessons per push, 4 at a track boundary; `WHERE WE ARE` rewritten after every lesson.
- **2026-11-03** — TO-DO sections allowed for an unbuilt *vehicle* only; must name the primitive used today.
- **2026-11-03** — format: `.qopts` left-justified, 30px apart; FORMAT rule 9 (a block never mixes inline and
  stacked fields); `ROWWRAP` enforces it.
- **2026-11-03** — `engine3.js` (`shootPair`) exists; lesson 10 §1 runs on it (duck skin, no countdown).

## RESUME PROMPT (paste this if the task dies)
> Read BLUEPRINT.md, then PAGE-CHECKLIST.md, then HANDOFF.md → PENDING.md. Continue the fixed run order from
> NEXT IMMEDIATE STEP. QA stays off; the loop is writes, the two free structural checks, `build-lessons.mjs`, `git`.

## NOTES / DOUBTS (parked, never a reason to stop)
- **Duplicate stems** — 33 has 3, 34 has 2, 35 has 5; rename in the quiz instance. Close-of-run bug pass.
- **Unmarked Portuguese** in 1-35 is widespread (L1 ≈509 words of PT rendering as English). The sweep marks what it
  touches; a full marking pass belongs to the bug pass.
- **`overflow.mjs` (Chrome) has not run since lesson 14** — QA is off, so nothing will catch a layout regression
  until the close-of-run pass. Every page 15-35 uses the shapes of 15-17; a new shape is the risk to watch.
- **Audio:** 541 clips for 1-14 only; the rest carry `data-say`; render at the end.
- **Pronunciation dictionary** lacks some business keys (`stakeholder`, `onboarding`); inline pronunciation is not in
  the spec — deferred.
- **Compaction** was still unverified after the `models.json` repair — check the meter early in a long run.

