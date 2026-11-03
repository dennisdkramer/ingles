# PENDING — active subtask batch plan (HARNESS.md RULE 7 step 1)
The live working plan for the CURRENT task. When a prompt is decomposed into subtask batches (RULE 7), they are written here, executed in order, and cleared here once done AND committed. Deferred / not-yet-started work stays in PARKED.md — move an item from PARKED.md here when you actually begin it, and clear it there once it is done and committed. Cross-session handoffs live in HANDOFF.md.

_(Active batches, newest first. Cleared once done AND committed.)_

## Batch: CSS/FORMAT rule + sweep · shootPair engine · lessons 11-20 (owner prompt 2026-11-03)

1. **DONE — CSS**: only the two `.qopts` rules changed (`justify-content:flex-start`, `gap:6px 30px`).
2. **DONE — FORMAT rule 9** + `ROWWRAP` in `qa/overflow.mjs` + a full sweep of lessons 1-10 (every MCQ block
   uniformly stacked; lesson 3's long prompts moved their PT hint below the input; 4 blocks narrowed).
3. **DONE — `engine3.js`** (shootPair): duck + UFO skins, `data-speed` / `data-limit` / `data-replay` levers,
   Start → 1s fade-in → 2s → takeoff, hit = 1 pt, miss/time-out/off-screen = 0, misses replay once, answers
   persist through the authored radios. `qa/games.mjs` (22 assertions) is in `npm run qa`. Lesson 10 §1 runs on it.
4. **DONE — lessons 11-14** (design + page + sidecar each, content/width/overflow green, audio rendered):
   11 past continuous + reported frame · 12 numbers/prices/data · 13 comparatives & decisions ·
   14 words that shrink (reductions, the ambiguous 'd, register, four accents).
5. **OPEN — lessons 15-20**: 15 Can/Have to/Should + the future · 16 countable/uncountable & quantifiers ·
   17 time & movement prepositions · 18 phrasal verbs (the system + the *get* family) ·
   19 conditionals 1 & 2 + would (plus 0 and 3) · 20 present perfect continuous + the perfect standing alone.
   No designs written yet; the pipeline per lesson is unchanged (design → page → 3 harnesses → sidecar → audio).

Audio: 541 clips, `npm run audio:check` → "all clips present" (lessons 1-14).
