# PENDING — active subtask batch plan (HARNESS.md RULE 7 step 1)
The live working plan for the CURRENT task. When a prompt is decomposed into subtask batches (RULE 7), they are written here, executed in order, and cleared here once done AND committed. Deferred / not-yet-started work stays in PARKED.md — move an item from PARKED.md here when you actually begin it, and clear it there once it is done and committed. Cross-session handoffs live in HANDOFF.md.

_(Active batches, newest first. Cleared once done AND committed.)_

- B-M4 [2026-10-26, owner request] PRONUNCIATION KEY SPEC — REWRITE (in progress):
  1. ✅ DONE (2026-10-27) Remove old renderer + migrate & restructure the dictionary: removed pronHTML() / wirePron() and the auto-wiring IIFE from engine2.js; migrated the custom dictionary out of engine2.js into root pron.js (window.PRON) with the new 6-column schema — Word / Stress syllable,"vowel-hiatus" / Syllables # / L1 output / L2 output / L2 Syllables # — plus a header row and a description row below it (146 words); merged the old alts into the L2 output column. pron.js is included only by the pronunciation lessons (business/lesson13 & lesson14 + their .edit copies). data-pron spans keep their static fallback markup.
  2. ⏳ Create the phoneme library — the source for column 2 (stress syllable, "vowel - hiatus") and column 3 (syllables #). No library exists yet: column 2 is empty and column 3 is derived from the old data.
  3. ⏳ Update terms + definitions ("hanging letters" = the letters after the first 2 phonemes of a syllable).
  4. ⏳ Update syllable-splitting logic, display, level interactions, use-cases/guidance; re-add the renderer against pron.js.
  5. ⏳ Dump non-conforming/extraneous content; cleanup.
