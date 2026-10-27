# PENDING — active subtask batch plan (HARNESS.md RULE 7 step 1)
The live working plan for the CURRENT task. When a prompt is decomposed into subtask batches (RULE 7), they are written here, executed in order, and cleared here once done AND committed. Deferred / not-yet-started work stays in PARKED.md — move an item from PARKED.md here when you actually begin it, and clear it there once it is done and committed. Cross-session handoffs live in HANDOFF.md.

_(Active batches, newest first. Cleared once done AND committed.)_

- B-M4 [2026-10-26, owner request] PRONUNCIATION KEY SPEC — REWRITE (in progress):
  1. ✅ DONE (2026-10-27) Delete old renderer + reformat dictionary: removed pronHTML() / wirePron() and the auto-wiring IIFE from engine2.js; kept the custom dictionary `PRON` and reformatted it to one word per row — original word / original word with markup / syllable count / level 1 output / level 2 output / level 2 syllable count (146 words). The data-pron spans in lessons 13–14 keep their static fallback markup, so pages still render.
  2. ⏳ Update terms + definitions ("hanging letters" = the letters after the first 2 phonemes of a syllable).
  3. ⏳ Update syllable-splitting logic, display, level interactions, use-cases/guidance.
  4. ⏳ Dump non-conforming/extraneous content; cleanup.
