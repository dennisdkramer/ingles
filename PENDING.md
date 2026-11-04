# PENDING — active subtask batch plan (HARNESS.md RULE 7 step 1)
The live working plan for the CURRENT task. When a prompt is decomposed into subtask batches (RULE 7), they are written here, executed in order, and cleared here once done AND committed. Deferred / not-yet-started work stays in PARKED.md — move an item from PARKED.md here when you actually begin it, and clear it there once it is done and committed. Cross-session handoffs live in HANDOFF.md.

_(Active batches, newest first. Cleared once done AND committed.)_

## Queue: business 15-50 (owner-approved 2026-11-03; handoff detail in HANDOFF.md)

Batch size **3** (same-family lessons may use 4). Order: Pass A for lessons 15-20 **sequentially** (one design per
turn, high creativity, compaction after each) → build **15-17** → Pass A for 21-23 → build **18-20** → … push per
batch. QA is **suspended by owner instruction**: per page the two free structural checks, per batch
`content.mjs` + `width.mjs` scoped, `overflow.mjs` every 3rd batch / first page of a new shape, full sweep +
smoke + audio render only at the end of the track.

| Batch | Lessons | Roadmap |
|---|---|---|
| 1 | 15 · 16 · 17 | Can/Have to/Should + future · countable/uncountable & quantifiers · time & movement prepositions |
| 2 | 18 · 19 · 20 | phrasal verbs (system + *get* family) · conditionals 1&2 + would (0 and 3) · present perfect continuous |
| 3 | 21 · 22 · 23 | prepositions & verb+preposition · phrasal verbs: people & talk · phrasal verbs: work, planning, problems |
| 4 | 24 · 25 · 26 | articles · conditionals: mixed & alternatives · modals of deduction |
| 5 | 27 · 28 · 29 | relative clauses · (see map) · passive |
| 6 | 30 · 31 · 32 | reported speech (full) · (see map) · (see map) |
| … | 33-50 | read each roadmap entry at Pass A time — the map is authoritative, not this table |

**Per lesson:** Pass A → `designs/lessonNN.design.md` (with `recycles:` / `must not re-teach:`); Pass B →
`business/lessonNN.html` + identical `.edit.html`. TO-DO sections are allowed wherever a vehicle is defensively
optimal but not built (see HANDOFF.md for the exact shape). Audio: author `data-say` now, render at the end —
`npm run audio:check` will fail until then, which is expected.

**After business 50:** kids, then adult, generated **from the design files** (same shapes; new register, contexts
and examples per track persona; swap business-specific slots for track-native ones). Never build a track by
find-replacing another track's pages.

Audio today: 541 clips for lessons 1-14. Lessons 15+ author `data-say` now; render at end of track (`audio:check`
red until then is expected). Built: **15-23** (pages + sidecars, two free checks green; `content`/`width` green for
15-17, 18-20 and 21-23; overflow/smoke/audio deferred to end-of-track).

