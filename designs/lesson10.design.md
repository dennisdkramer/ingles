# Lesson 10 — design (Pass A, double lesson)

`sequence:` the sound work, slice 1 of 2 — the inventory and the key (slice 2: lesson 14, contractions and reductions). No later lesson re-teaches this; later lessons only use it inline.

## Core (what the student can do afterwards)
1. Look at a word they have never seen and make a defensible guess at how it sounds — then check it without asking a person.
2. Say out loud the pairs that betray Brazilians, and hear the difference when they come back at them fast: *ship/sheep, three/tree, hat/hot, west/vest*.
3. Choose the right sound for the consonants that Portuguese never trained: *TH* (tongue out), *R*, *H*, *NG*, dark *L*, flap *T*.
4. Read the key: syllables, the strong syllable, the sleeping vowel (schwa), and the difference between the careful and the natural version of a word.

## Situation
The student is in a meeting (or reading an email) and meets a word with no teacher nearby. They must commit to a pronunciation, then sound like a person rather than a dictionary.

## Candidates
- **Done — the clinic.** Six real words from the student's own working life (pulled from a supplied industry list). Each gets a diagnosis: which sound is the risk, what the mouth must do, and a before/after recording.
- **Heard — the shooter.** Two targets appear with *ship* and *sheep*; one is spoken; hit the one you heard. Eight rounds, misses come back at the end.
- **Read — the decoding puzzle.** Ten unknown words plus the key; the student decides the pronunciation, then checks against the audio.

## Chosen
**All three, in this order: shooter → clinic → puzzle.** Ears first (the shooter is the only thing here that is pure listening, and it is the part the student will repeat for fun), then the student's own words (which is what makes the mouth-position talk worth reading), then the key as the tool that makes them independent. The key is only motivating when it unlocks words the student actually needs.

**First 30 seconds:** two targets, one spoken word, no text to read — the student acts before they are taught anything.

## What the student produces (evidence)
The shooter's choices (persisted like any exercise), a diagnosis line per clinic word, gap-fills that read the key, three recorded words before/after, then a quiz on the four core behaviours (no shooter items reused).

## Conflicts, and how I resolved them
- **A game is Tier 1 (`shootPair`) and does not exist yet.** Resolution: propose it as the first generic engine, parameterised by item pairs and a skin (ducks, plates, planets), with each shot recorded through an ordinary option choice so the teacher still sees the result. Approved by the owner.
- **A double lesson with a full-width game block stretches the single-block layout rules.** Resolution: the game occupies its own full-width panel, and the rest of the lesson is normal blocks; flagged because FORMAT.md owns that decision.
- **The entry bundles vowels + consonants + the key.** Not a conflict, but it is why this lesson is double length: three skills that share one artefact (the key).


## Escalation recorded in Pass B — now RESOLVED (2026-11-03)

**`shootPair` did not exist when this page was first built.** The design's chosen entrance is the "shooter" — a
Tier-1 generic engine (two targets, one spoken word, a skin). It was not in the repo at first, so the eight
rounds shipped as ordinary listen-and-tick radios (same behaviour, same persistence, no skin, no timing) and
the gap was recorded here and in PARKED.md (B-C7). **It has since been built** (`engine3.js`, `qa/games.mjs`),
and §1 of `business/lesson10.html` now runs on it: `.game[data-game="shootPair"]` with `data-skin="duck"`,
`data-speed="95"`, `data-limit="0"` (off-screen is the limit for a first encounter), `data-replay="1"`, and the
eight authored `.qitem`s kept verbatim inside `.game-list` — which is what still persists, prints and shows if
the engine never loads. The right answer is inferred from each round's `data-say`, so the page carries no
answer key. Leave unchanged unless the owner wants a countdown as well.


## Pass B — build notes (2026-11-03, page generated)

Page: `business/lesson10.html` (+ identical `.edit.html` sidecar). Double lesson: 8 sections.
Sections: 1 Round 1 — the shooter (listen-and-tick pairs) · 2 The vowel map (+ C/G) · 3 The consonant map · 4 The key (syllables, beat, sleeping vowel, noun/verb pairs, function-word reductions) · 5 The clinic (6 words, diagnosis) · 6 The puzzle (decode with the key, then check) · 7 Treino · 8 Quiz.

### Decisions taken inside the design (Pass B, recorded per §4)
- **The key is described exactly as the site renders it** (`·` syllable, grey letters = letters the mouth skips, `ə` = the sleeping vowel) and **stress is shown in CAPITALS on the page**, because the site's `PronKey.render()` does not mark stress. Claiming the key marks the beat would have been a false statement about the platform.
- **The puzzle's words are all "letters that vanish" cases** (*island, debt, subtle, business, vegetable, comfortable*) — the section teaches decoding, so every item must be decodable from the marks.
- **The clinic's six words are business words** (*focus, schedule, receipt, colleague, queue, analysis*), not sound-lab abstractions: the design's promise is "your own working life".
- **§6's `tr.note` was emitted outside a table by mistake and fixed during the build** (a note row is only valid inside a `.chart`); recorded here as the kind of mechanical slip the QA harness catches only indirectly.

### Width decisions
- §2 vowel map, §3 consonant map, §4 key tables, §5 clinic, §6 puzzle — full `.chart` / `.panel` (one teaching object each).
- §2 C and G — `itemrow[data-cols="2"]`: *compare* two letters whose rule is identical.
- §7 B+C and Quiz B+C — `itemrow[data-cols="2"]`: adjacent compressible groups.

### QA
`node qa/content.mjs 10` ✅ (chart 7 · panel 16 · listen 65 · gap 22 · radio 96) · `node qa/width.mjs 10` ✅ ·
`node qa/overflow.mjs 10` ✅ clean (26 blocks). Audio: all 371 `data-say` strings across lessons 1-10 render (`npm run audio:check` → "all clips present").

## Notes for the build pass
English instructions here (A1 student, lesson 10), Portuguese only for the mouth-position explanations and the "you say X → say Y" contrast. Audio for every single item — this lesson is worthless without it.