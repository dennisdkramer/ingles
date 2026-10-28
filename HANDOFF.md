# HANDOFF — context handoffs between sessions
A running note for handing context from one session/task to the next: where the work stands, what is in flight, and what to pick up next. Write here when a session ends mid-work, or when the next session needs context that is not obvious from the files themselves. (Not a task queue — see PENDING.md for the active plan and PARKED.md for the backlog.)

# PRONUNCIATION DICTIONARY — author columns 1–3 (handoff)

## Purpose (context — HARNESS.md RULE 6)
A visual aid so beginner Brazilian students SEE why pronunciations/rhythms/reductions happen.
Every break/stress/cluster decision is judged by: does it teach the correct RHYTHM to a Brazilian
beginner? Keep clusters whole as onsets (mash); split at true word/compound boundaries; "both-ways"
→ pick the rhythm-teaching break. See PHONEMES.md for the full unit lists + worked examples.

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

## Parsing principle (no lists)
Judge every break by: does it teach the correct RHYTHM to a Brazilian beginner? Keep consonant clusters whole as onsets ("mash"); split at word/compound boundaries; "both-ways" → rhythm-teaching break. Intuition drives it — see PEDAGOGY.md "next steps" for the principle + worked examples.

## EXCEPTIONS
Any word whose break is ambiguous or un-inferable → write to `EXCEPTIONS.md`, do NOT force into the dictionary.

## Scope
- Start with the 146 words currently in `pron.js` (preserve order; append new words at the end).
- Columns 4–6 (core/hanging + schwa + L2 reduction) are a SEPARATE later task.
