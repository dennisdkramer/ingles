# BLUEPRINT — the agent's own working memory (mutable; I own this file)

**Rule for the agent: update this file BEFORE any heavy edit or long command** (progress, the decision you just
took, and your next immediate step). **After any compaction, read this file → `PAGE-CHECKLIST.md` → the current
lesson's design — before touching anything.** Keep it under ~60 lines; trim old detail, never the `WHERE WE ARE`
and `NEXT STEP` lines.

## WHERE WE ARE
Lessons **1-14** built, pushed, audio rendered (541 clips). `lessons.json` business: 14 · COUNTS `0/14/0`.

## CURRENT SLICE
- [ ] Pass A for **15-20** (designs only; `designs/lesson15..20.design.md`)

## NEXT IMMEDIATE STEP
Write `designs/lesson15.design.md` from PEDAGOGY-MAP's lesson-15 entry (Modal operators + the future), with
`recycles:` / `must not re-teach:` lines. Then 16, then 17-20.

## DECISIONS TAKEN (newest first — append here, don't rewrite)
- **2026-11-03** — QA suspended by owner: per page only the two free structural checks; `content`+`width` per
  batch of 3; `overflow` every 3rd batch or on a new shape; full sweep + `smoke` + audio only at end-of-track.
- **2026-11-03** — audio deferred: author `data-say` on every target line now, render at the end (`audio:check`
  failing is expected until then).
- **2026-11-03** — batch = 3 lessons per push, ~12 lessons per task slice; tracks: kids then adult, **from the
  design files**, never by find-replacing business pages.
- **2026-11-03** — TO-DO sections allowed for an unbuilt *vehicle* only; must name the primitive used today.
- **2026-11-03** — format: `.qopts` left-justified, 30px apart; FORMAT rule 9 (a block never mixes inline and
  stacked fields); `ROWWRAP` enforces it.
- **2026-11-03** — `engine3.js` (`shootPair`) exists; lesson 10 §1 runs on it (duck skin, no countdown).

## RESUME PROMPT (paste this if the task dies)
> Read BLUEPRINT.md, then PAGE-CHECKLIST.md, then HANDOFF.md. Continue the CURRENT SLICE from NEXT IMMEDIATE STEP.
> QA is suspended per HANDOFF. Update BLUEPRINT.md as you go; do not stop for style doubts — record them below.

## NOTES / DOUBTS (parked, never a reason to stop)
- (empty)
