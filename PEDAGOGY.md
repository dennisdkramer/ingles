# PEDAGOGY — teaching-side contract: the structure and rationale of the materials, from the teacher's perspective
This file holds the teaching-side shape of the lessons: what exercise types exist, what each one is FOR (which skill it trains), and the order and structure they should follow so a lesson teaches rather than merely tests. It does NOT hold lesson content (the page files), content-handling rules (CONTENT.md), or visual layout (FORMAT.md).

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-P<n>.)_

_(none queued.)_

## What this file is

This file is the single source of truth for the pedagogical shape of the materials, written from the teacher's point of view. It answers, for anyone generating a new lesson: which exercise types the course uses, what each type trains, and how they should be sequenced and structured. It is deliberately about intent and rationale — the concrete layout rules it implies are implemented in `style.css` and the handling rules live in CONTENT.md, so a change here can be carried out without contradicting either.

## Curriculum

Each lesson builds on the previous one — it reuses vocabulary and structures the student already knows and introduces one new thing at a time. Do not skip or reorder.

1. **Introductions & to be** (done) — cognates, am/is/are, a/an, vowels.
2. **Question words** (done) — who/what/when/where/why/how, with "be".
3. **"do" & the simple present** (next) — question words with "do" ("What do you…?"), do/does, and the simple present.
4. **Simple present** — third-person -s, don't/doesn't, adverbs of frequency (always/usually/sometimes/never).
5. **Present continuous vs simple present** — "now" (I am studying) vs "in general" (I study).
6. **Plurals & this/that/these/those** — regular/irregular plurals, demonstratives.
7. **There is / there are & place prepositions** — in/on/under/next to.
8. **Past simple** — was/were + regular -ed; the first past tense, contrasted against the "never past" rule.

## Pedagogy principles

- **Contrast with Portuguese above all.** The highest-value content is where English does NOT behave like Portuguese. The simple present is the flagship example:
  - EN simple present = FACTS and IN-GENERAL statements only. It never touches the past, and touches the future only as a scheduled FACT ("I start school tomorrow", "the train leaves at six").
  - PT simple present → EN present perfect for duration from the past: "trabalho aqui há 5 anos" = "I HAVE worked here for 5 years" (never "I work here for 5 years").
  - PT simple present → EN present continuous for "right now": "estou estudando" = "I AM studying" (not "I study").
- **Reuse, then extend.** Start each lesson from the last one's phrases; add the new structure on top.
- **Audio everywhere, Portuguese only to explain.** Every new phrase carries ▶ TTS; PT text is for translation/explanation, not the target.
- **One idea per section.** A section teaches one thing; a chart, a dialogue or an exercise reinforces it.