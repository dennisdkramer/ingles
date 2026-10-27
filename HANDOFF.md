# HANDOFF — context handoffs between sessions
A running note for handing context from one session/task to the next: where the work stands, what is in flight, and what to pick up next. Write here when a session ends mid-work, or when the next session needs context that is not obvious from the files themselves. (Not a task queue — see PENDING.md for the active plan and PARKED.md for the backlog.)

# PRONUNCIATION DICTIONARY — author columns 1–3 (handoff)

## Goal
Author columns 1–3 of `pron.js` for every dictionary word, from knowledge of English (NO scraping, no derivation code).

## Output format
`pron.js` is `window.PRON = [ headerRow, descriptionRow, wordRows… ]`.
Each word row for THIS task (columns 4–6 are a later task; leave them empty):
```
[word, marked, count]
```
- `word`   — plain lowercase spelling.
- `marked` — the spelling with `-` at every syllable break and `*` before the stressed syllable's first letter. OMIT `*` when stress is uncertain.
- `count`  — integer syllable count (= number of `-` + 1).

Examples:
```
["important", "im-*por-tant", 3]
["impostor",  "im-*po-stor",  3]
["haphazard", "hap-haz-ard",  3]
["letter",    "*le-tter",     2]
["singer",    "*sing-er",     2]     // ng = /ŋ/ (whole)
["finger",    "*fin-ger",     2]     // ng = /ŋɡ/ (split)
```

## Authoring rule
1. Syllabify from knowledge (formal breaks).
2. If a break falls inside a PHONEME → move the break BEFORE that phoneme (keep it whole).
3. If a break falls inside a DIGRAPH/TRIGRAPH → leave the break (the unit deactivates).
4. `*` before the stressed syllable (primary stress only; ignore secondary). If unsure, OMIT the `*`.

## Lists
PHONEMES (keep whole):
- st sp sk sl sm sn sw sc str spr spl scr squ
- doubles: bb cc dd ff gg ll mm nn pp rr ss tt zz

DIGRAPHS/TRIGRAPHS (may split):
- ch sh th ph wh ng ck tch dge qu kn wr gh
- silent-letter: gn mb lk lf lm mn rh ps pt bt

## EXCEPTIONS
Any word whose break is ambiguous or un-inferable → write to `EXCEPTIONS.md`, do NOT force into the dictionary.

## Scope
- Start with the 146 words currently in `pron.js` (preserve order; append new words at the end).
- Columns 4–6 (core/hanging + schwa + L2 reduction) are a SEPARATE later task.
