# BLUEPRINT — the agent's own working memory (mutable; I own this file)

**Rule for the agent: update this file BEFORE any heavy edit or long command** (progress, the decision you just
took, and your next immediate step). **After any compaction, read this file → `PAGE-CHECKLIST.md` → the current
lesson's design — before touching anything.** Keep it under ~60 lines; trim old detail, never the `WHERE WE ARE`
and `NEXT STEP` lines.

## WHERE WE ARE
Lessons **1-35** built (pages + sidecars, two free checks per page). `lessons.json` business: **35** · COUNTS `0/35/0`.
Batches 1-7 (**15-35**) pushed (`a23f924`). Audio + `overflow` (real Chrome) deferred to end-of-track per the run
policy - `audio:check` red is expected.
**2026-11-03 (later):** language + register are now **one rule each** (§4, §1 - no counts, no quotas) and `qa/lang.mjs`
is the gate. Pages **1-35 predate the rule** and carry unmarked Portuguese (L1: 176w marked / 509w unmarked); the
retrofit is queued in `PENDING.md`.

## CURRENT SLICE
- [ ] **Everything remaining, all tracks:** business **15-50** → kids **1-50** → adult **1-50** (owner: one task).
      Run policy (failure/skip rule, re-read rhythm, push cadence, context budget) lives in `HANDOFF.md` →
      "Run policy for the unattended run". No owner decisions needed except a PEDAGOGY-MAP §2 conflict.

## NEXT IMMEDIATE STEP
- [ ] **Pass A 36** (storytelling / narrative) -> 37 -> 38 -> push batch 8 - under the new `band:` line and the
      §4 language rule. Ready to resume; the run was paused only for the context-window fix (resolved: models.json valid,
      cw 200k -> compaction ~162k).

## DELTA
**L35 vs L34:** 34 was written tone (the e-mail ladder); 35 is spoken service under pressure — the call script,
de-escalation, the partial yes and escalation with a date. New axis: live conflict, not register.

## DECISIONS TAKEN (newest first — append here, don't rewrite)
- **2026-11-03** — **language = one rule, register = one rule** (§4, §1): PT in the explanation layer only while
  `L < C`; PT in any other content type only when defensibly optimal for teaching; register fixed by socio-linguistic
  context as one of the TRACK three options. No counts, quotas or ceilings. `qa/lang.mjs` reports PT amount, and gates
  only unmarked PT + off-track terms.
- **2026-11-03** — lesson 15 shape: travel-planning carrier, `.dialog` for the permission/request beat, future
  contrast as one chart (will / going to / present continuous) — one idea per section, 9 sections.
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
- **Duplicate-stem hints outstanding (fix in end-of-track bug pass):** 33 has 3 (`"Sorry to interrupt — just on
  that point…"`, `abrir: ____, let's get started.`, `votar: who's in ____?`), 34 has 2 (`"Hey guys, quick one —"`,
  `"I would appreciate it if you coul…"`), 35 has 5 (`"You're speaking to Ana."`, `"Can you tell me what
  happened?"`, `"I'll take care of it."`, `assumir: I'm ____ this happened.`, plus one `fechar/escalar` blank).
  Rename in the quiz instance (e.g. append `· quiz`) — content.mjs still passes, but one saved answer would serve
  two controls.
- `overflow.mjs` (real Chrome) has NOT run since lesson 14 — the run policy forbids Chrome in the loop. All pages
  15-35 use the shapes of 15-17 (`.panel`/`.chart`/`.dialog`/`.itemrow`), no new shape. End-of-track sweep 15-50.


- **Unmarked Portuguese is the systemic defect (measured 2026-11-03, `qa/lang.mjs`):** every page 1-35 renders most of its
  PT as non-italic English - L1 176w marked vs 509w unmarked, L20 127/338, L35 113/296. Mechanical fix (wrap the span),
  queued in the 1-35 retrofit.
