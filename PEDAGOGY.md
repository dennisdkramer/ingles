# PEDAGOGY — teaching-side contract: the structure and rationale of the materials, from the teacher's perspective
This file holds the teaching-side shape of the lessons: what exercise types exist, what each one is FOR (which skill it trains), and the order and structure they should follow so a lesson teaches rather than merely tests. It does NOT hold lesson content (the page files), content-handling rules (CONTENT.md), or visual layout (FORMAT.md).

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-P<n>.)_

_(none queued.)_

## What this file is

This file is the single source of truth for the pedagogical shape of the materials, written from the teacher's point of view. It answers, for anyone generating a new lesson: which exercise types the course uses, what each type trains, and how they should be sequenced and structured. It is deliberately about intent and rationale — the concrete layout rules it implies are implemented in `style.css` and the handling rules live in CONTENT.md, so a change here can be carried out without contradicting either.

## Curriculum

Each lesson builds on the previous one — it reuses vocabulary and structures the student already knows and introduces one new thing at a time. Do not skip or reorder.

### Book 1 — foundations (built)

1. **Introductions & to be** — cognates, am/is/are, a/an, vowels.
2. **Question words** — who/what/when/where/why/how, with "be".
3. **"do" & the simple present** — question words with "do" ("What do you…?"), do/does, and the simple-present meaning (facts/in-general only; the two PT traps are flagged here).
4. **Simple present** — third-person -s, don't/doesn't, adverbs of frequency (always/usually/sometimes/never), work-routine vocabulary.
5. **Present continuous vs simple present** — "now" (I am studying) vs "in general" (I study).
6. **Plurals & this/that/these/those** — regular/irregular plurals, demonstratives.
7. **There is / there are & place prepositions** — in/on/under/next to/between…
8. **Past simple** — was/were + regular -ed; the first past tense, contrasted against the "never past" rule.

### Book 1 — toward intermediate (built)

9. **The future: will / going to / "gonna"** — plans vs on-the-spot decisions; "gonna" is taught as the spoken future marker (a MODE, not a verb) so it never gets confused with the verb "go".
10. **Past continuous vs past simple** — a long action in progress interrupted by a short one ("I was working when you called").

### Book 1 — remaining roadmap to intermediate (planned)

11. **Present perfect (1)** — have/has + past participle for life experience ("I have visited") and, crucially, duration from the past ("I have worked here for 5 years" — the flagship PT trap).
12. **Present perfect (2) vs past simple** — finished vs unfinished time; ever/never/already/yet/just.
13. **Comparatives & superlatives** — better/worse, cheaper/most reliable.
14. **Modals of obligation & ability** — can/can't, must/have to, should (advice).
15. **Countable/uncountable + quantifiers** — some/any/much/many/a lot of (business: information, advice, money).
16. **Prepositions of time & movement** — at/on/in, to/from (consolidation).
17. **Phrasal verbs & "get"** — the coringa; business: get back to, set up, call off.
18. **Conditionals (1st & 2nd) + would** — if I have time… / if I were you…

## Pedagogy principles

- **Contrast with Portuguese above all.** The highest-value content is where English does NOT behave like Portuguese. The simple present is the flagship example:
  - EN simple present = FACTS and IN-GENERAL statements only. It never touches the past, and touches the future only as a scheduled FACT ("I start school tomorrow", "the train leaves at six").
  - PT simple present → EN present perfect for duration from the past: "trabalho aqui há 5 anos" = "I HAVE worked here for 5 years" (never "I work here for 5 years").
  - PT simple present → EN present continuous for "right now": "estou estudando" = "I AM studying" (not "I study").
- **Reuse, then extend.** Start each lesson from the last one's phrases; add the new structure on top.
- **Audio everywhere, Portuguese only to explain.** Every new phrase carries ▶ TTS; PT text is for translation/explanation, not the target.
- **One idea per section.** A section teaches one thing; a chart, a dialogue or an exercise reinforces it.
- **"gonna" is a future MODE, not a verb.** Teach `[be] + gonna + verb` as the spoken future ("I'm gonna call" = *vou ligar*), and keep it separate from the verb "go" with a PLACE after it ("I'm going to the office" = *estou indo ao escritório*). "I'm gonna go to the office" is therefore not a contradiction — "gonna" marks future and "go" is the verb. The student must use "gonna" (not avoid it); it is the natural spoken form, while "going to" is the written/formal twin.
- **Track voice — business.** The business book aims at correct speech and grammar and leans on business vocabulary (meeting, deadline, invoice, client, report, schedule…), but it never avoids common expressions or contractions (don't/doesn't, I'm, gonna, 'll). Contractions are the default in speech; the "full forms" are for formal writing.
- **Practice quantity follows pedagogical weight.** When a concept is central to the lesson — or the student simply hasn't had enough exposure to it yet — generate more practice (more questions, longer phrases, an extra column) rather than fewer. A high-value, under-practised concept is never under-served just to keep a block small; add the extra practice it deserves.
- **Phrase length follows the student's place in the course.** The closer to the start, the shorter and simpler the phrases must stay; later content may lengthen them. That length in turn decides how a block reaches its width: short phrases get there with more phrases or more columns, longer phrases get there with length. There is no fixed beginner/advanced split — judge each block as you go.

## Language by student level
The mix of English and Portuguese shifts with the student's level. Portuguese text is ALWAYS italic — tag it with `<i>` (or the `.ptw`/`.pt` class), even inside a header or a chart column header.

- **Beginner (Book 1, lessons 1–10):** headers — section titles, exercise-group titles, chart column headers — are written in ENGLISH with the PORTUGUESE alongside, wherever both fit in the line/block/column header (Portuguese italic). When there is not room for both, keep only the Portuguese. Explanatory prose stays Portuguese.
- **Intermediate:** conceptual explanations stay Portuguese; simple explanations and reminders switch to English where the vocabulary is already known. Headers are English, but NEW vocabulary in those sections carries its Portuguese alongside where space allows.
- **Advanced:** almost entirely English; Portuguese appears only where there is a clear pedagogical motive or a complex explanation that needs it.