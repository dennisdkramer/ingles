# PENDING — active subtask batch plan (HARNESS.md RULE 7 step 1)
The live working plan for the CURRENT task. When a prompt is decomposed into subtask batches (RULE 7), they are written here, executed in order, and cleared here once done AND committed. Deferred / not-yet-started work stays in PARKED.md — move an item from PARKED.md here when you actually begin it, and clear it there once it is done and committed. Cross-session handoffs live in HANDOFF.md.

_(Active batches, newest first. Cleared once done AND committed.)_

`WHERE WE ARE` — business **1-35** built and pushed (batch 7 = `a23f924`); **nothing after 35 has started**. On
2026-11-03 the language + register framework was rewritten to one rule each (§4, §1) and `qa/lang.mjs` was added;
pages 1-35 predate both (they carry unmarked Portuguese), and the retrofit below is queued. Next: lesson **36**.

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

**Per lesson:** Pass A → `designs/lessonNN.design.md` (with `recycles:` / `must not re-teach:` / the `band:` line);
Pass B → `business/lessonNN.html` + identical `.edit.html`. Then `node qa/lang.mjs NN` (the one language gate: marked
PT + on-track register), the two free structural checks, the sidecar copy, and a push every 3 lessons.
TO-DO sections are allowed wherever a vehicle is defensively
optimal but not built (see HANDOFF.md for the exact shape). Audio: author `data-say` now, render at the end —
`npm run audio:check` will fail until then, which is expected.

### Retrofit subtask — business 15-35 language & level pass (BLOCKS kids/adult)

Queued 2026-11-03 (owner), to run **after business 50 + its QA** and **before kids 1-50**. The 21 pages 15-35 were
built to the old, unmeasured Portuguese rule: PT share of explanatory text is 100% of the leads, the opener is PT on
every page, and mean target-sentence length only moves 3.1 → 7.0 words across those 21 lessons. PEDAGOGY-MAP §4 is now
a measured band, and these pages are the design source for kids/adult — so they get the same treatment before the
track switch rather than after 100 pages inherit the flat register.

**Scope.** `business/lesson15`-`lesson35` + their `.edit.html` sidecars + the matching `designs/lessonNN.design.md`
(designs gain one line: `band: business · L__ · C__ · registers: __ · contexts: __`). **Marking applies to 1-14 too** —
`qa/lang.mjs 1 10 20` shows the same defect there (L1: 250 words of unmarked Portuguese); it is the same mechanical
fix and belongs in this pass.

**Changes.** The explanation layer (introductions, explanatory text, tips, headlines, column headers) loses its
Portuguese wherever the element's `C` does not exceed the lesson number; PT stays wherever it is defensibly optimal —
word lists with translations, a paired PT phrase, a note, a hint. Every PT span gets marked; register is checked
against the track.

**Does not change.** Teaching items, answers, grammar sequence, `data-say` strings (audio re-renders at end of track).

**Acceptance per page.** `node qa/lang.mjs NN` clean (no unmarked PT, no off-track term); the explanation layer reads as
English at L31+ except where `C > L`; `qa/content` + `qa/width` green; sidecar re-copied; push every 3 pages.

**Owner.** The same unattended task. Status: queued, not started.


**After business 50:** kids, then adult, generated **from the design files** (same shapes; new register, contexts
and examples per track persona; swap business-specific slots for track-native ones). Never build a track by
find-replacing another track's pages.

Audio today: 541 clips for lessons 1-14. Lessons 15+ author `data-say` now; render at end of track (`audio:check`
red until then is expected). Built: **15-32** (pages + sidecars, two free checks green; `content`/`width` green for
all six batches; overflow/smoke/audio deferred to end-of-track).

## NOTES
- `overflow.mjs` (real Chrome) has NOT run since lesson 14 — the run policy forbids Chrome in the loop. Every page
  uses the same block shapes as 15-17 (`.panel`/`.chart`/`.dialog`/`.itemrow`), no new shape. End-of-track sweep must
  run 15-50 in one go.

