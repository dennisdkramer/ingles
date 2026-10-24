# PEDAGOGY — teaching-side contract: the structure and rationale of the materials, from the teacher's perspective
This file holds the teaching-side shape of the lessons: what exercise types exist, what each one is FOR (which skill it trains), and the order and structure they should follow so a lesson teaches rather than merely tests. It does NOT hold lesson content (the page files), content-handling rules (CONTENT.md), or visual layout (FORMAT.md).

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-P<n>.)_

- B-P4 [2026-10-24] CONTENT RE-GENERATION (pedagogy side, start at lesson 5). Apply the corrected method to every business lesson: derive each lesson's content SET from the pedagogical principle (group related items into families; choose by frequency and usefulness) — never from owner-named examples, which carry no privileged status (HARNESS RULE 1). Teach in context and in phrases; make the instructional content engaging and dynamic; match depth to the concept's weight; use any medium/activity freely; state only true, defensible facts. Lesson 5 FIRST: re-derive the phrasal-verb lesson (grouped families chosen by frequency — particles up/out/off/on; meaning taught as a whole since it is non-compositional; the separable-vs-inseparable distinction as the structural rule, with the pronoun position as its consequence; presented in a scenario/story) — then proceed 6→34.

## What this file is

This file is the single source of truth for the pedagogical shape of the materials, written from the teacher's point of view. It answers, for anyone generating a new lesson: which exercise types the course uses, what each type trains, and how they should be sequenced and structured. It is deliberately about intent and rationale — the concrete layout rules it implies are implemented in `style.css` and the handling rules live in CONTENT.md, so a change here can be carried out without contradicting either.

## Curriculum

_(Ordering is derived from this book's own difficulty model — not from any external grammar syllabus. Every item is placed by how far it sits from Portuguese (transparent / partial / opaque) times how useful it is in business-casual speech (core / common / marginal). Lesson quantity follows the needs of the domain, not a target number.)_

### The difficulty model

- **Distance from Portuguese (transfer).** Transparent = a direct anchor exists (a cognate, or a structure whose meaning maps cleanly). Partial = an anchor exists but misleads (the form maps, the meaning does not — or vice-versa). Opaque = no anchor; it must be built from nothing.
- **Utility in business-casual speech.** Core = the sentence cannot be formed without it (word order, do-support, the dummy subject, the top workhorse verbs). Common = frequent and useful but not sentence-blocking. Marginal = rare, formal, or replaceable.
- **Placement = the two axes combined by judgment.** Transparent + Core → earliest (fast wins). Opaque + Core → early, taught as a structural rule. Partial + Core → middle, taught as a meaning trap. Transparent + Marginal → a deliberate choice (early-with-its-kin OR late as "formal only"), recorded with a reason. Opaque + Common → mid-to-late, sized to importance. Opaque + Marginal → late or optional.
- **Vocabulary is concept → context → mapping.** Each Portuguese concept is enumerated across the contexts of a working day, mapped to the English word(s) a native actually uses in each context, and ranked by frequency/register. A cognate and its more-used cousin are taught together at introduction (with a frequency note); after that, teaching uses whichever is most common in that context. The concept inventory lives in VOCABULARY.md.
- **Carrier content escalates with the course.** Example phrases grow in length, clause complexity and register as the course advances.

### Stage 1 — the skeleton & the fast wins (lessons 1–9)

1. **First talk & the sentence skeleton** — the subject is required (no pro-drop); "to be"; "I'm / It's"; the dummy "it".
2. **The cognate fast lane** — recognition plus the frequency override: the cognate is the recognition bridge, the everyday word is the production target.
3. **Question words & polite embedded questions** — who/what/when/where/why/how with "be"; polite forms that map straight onto PT; the first repair chunk.
4. **"do" support in questions & negatives** — the structural rule for asking and negating with ordinary verbs.
5. **Simple present & the fixed word order** — third-person -s; [subject] [verb] [object] [place] [time]; don't/doesn't.
6. **Workhorse verbs, mapped by context (1)** — the high-frequency movement/transfer verbs, one PT concept → several EN verbs.
7. **Workhorse verbs, mapped by context (2)** — the high-frequency action/communication verbs, context-mapped.
8. **Routine, frequency, time & schedules** — always/usually/never; telling the time, days, dates.
9. **"There is / there are" & place** — in/on/at (place); the first connectors (and/but/because/so).

### Stage 2 — time & the meaning traps (lessons 10–19)

10. **Simple past** — regular -ed + the irregular workhorses; past time words.
11. **Past: questions & negatives** — did/didn't; short answers.
12. **Present continuous** — now vs. in general (the trap: PT uses the -ndo form more broadly).
13. **Future: plan vs. on-the-spot decision** — going to vs. will.
14. **Future: the spoken "gonna"** — a mode, not a verb.
15. **Present perfect: experience & duration** — the big trap (its meaning maps onto PT's simple past, not onto the PT verb form that looks like it).
16. **Present perfect: finished vs. unfinished time** — for/since, ever/never, already/yet/just.
17. **Comparisons & opinions** — comparative/superlative + opinion chunks.
18. **Modals: ability, permission, requests** — can/could.
19. **Modals: obligation, advice, possibility** — must/have to/should/might.

### Stage 3 — the opaque-but-useful toolkit (lessons 20–31)

20. **Countability & quantity** — countable/uncountable; some/any/much/many/a lot of.
21. **Prepositions & verb+preposition units** — time/movement at/on/in/to/from; verbs learned with their preposition attached.
22. **Phrasal verbs: the system** — whole meaning (non-compositional), grouped by particle, separable vs. inseparable.
23. **Phrasal verbs: movement & routine**.
24. **Phrasal verbs: work & communication**.
25. **Phrasal verbs: plans, problems & changes**.
26. **Conditionals (1st & 2nd) + "would"** — real vs. hypothetical; polite offers.
27. **Modals of deduction** — must/might/could/can't for guessing.
28. **Relative clauses** — who/that/which/where; omitting the pronoun.
29. **Gerunds & infinitives** — high-frequency verb patterns.
30. **The everyday passive & "get" passive** — "it was sent", "it got lost", "it's done".
31. **Reported speech** — say/tell/ask + backshift.

### Stage 4 — fluency & discourse (lessons 32–40)

32. **Connected speech & reductions** — the reduced forms + linking at natural speed (consolidation, not first introduction).
33. **Discourse markers & fillers** — the glue that keeps speech natural.
34. **Meetings** — open, give opinion, agree/disagree, confirm, decide (question tags as a thin confirmation device).
35. **Softening, hedging & polite requests** — "Could you…?", "Would you mind…?", vagueness.
36. **Email & the written↔casual register swap** — the same message in both registers.
37. **Phone & customer-service** — the phone script, clarifying, handling a problem.
38. **Storytelling** — telling a work story in order; the past perfect as a thin "already-before-then" add-on (optional; natives often just use the simple past).
39. **Small talk → deeper conversation** — early greetings recycled inside fuller exchanges.
40. **Nuanced opinion & disagreement** — agreeing/disagreeing with tact and depth.

### Stage 5 — consolidation & polish (lessons 41–45)

41. **Review loop: tenses & question forms** — under time pressure (third conditional as a thin, formal/optional note).
42. **Review loop: phrasal verbs & modals** — under time pressure.
43. **The capstone working day** — one full role-play that uses everything.
44. **Self-correction, repair & asking for clarification** — what to say when communication breaks.
45. **Idiomatic chunk bank & register refresh** — high-frequency formulaic speech, consolidated.

## Pedagogy principles

- **Contrast with Portuguese above all.** The highest-value content is where English does NOT behave like Portuguese. The simple present is the flagship example:
  - EN simple present = FACTS and IN-GENERAL statements only. It never touches the past, and touches the future only as a scheduled FACT ("I start school tomorrow", "the train leaves at six").
  - PT simple present → EN present perfect for duration from the past: "trabalho aqui há 5 anos" = "I HAVE worked here for 5 years" (never "I work here for 5 years").
  - PT simple present → EN present continuous for "right now": "estou estudando" = "I AM studying" (not "I study").
- **Reuse, then extend.** Start each lesson from the last one's phrases; add the new structure on top.
- **Audio everywhere, Portuguese only to explain.** Every new phrase carries ▶ TTS; PT text is for translation/explanation, not the target.
- **One idea per section — and no section without an idea.** A section exists to teach one thing (a chart, a dialogue or an exercise reinforces it); a section with nothing to teach — boilerplate, filler, or a heading that adds nothing — is not generated. An opening ("abertura") is optional and appears only when it earns its place.
- **"gonna" is a future MODE, not a verb.** Teach `[be] + gonna + verb` as the spoken future ("I'm gonna call" = *vou ligar*), and keep it separate from the verb "go" with a PLACE after it ("I'm going to the office" = *estou indo ao escritório*). "I'm gonna go to the office" is therefore not a contradiction — "gonna" marks future and "go" is the verb. The student must use "gonna" (not avoid it); it is the natural spoken form, while "going to" is the written/formal twin.
- **Track voice — business.** The business book aims at correct speech and grammar and leans on business vocabulary (meeting, deadline, invoice, client, report, schedule…), but it never avoids common expressions or contractions (don't/doesn't, I'm, gonna, 'll). Contractions are the default in speech; the "full forms" are for formal writing.
- **Practice quantity follows pedagogical weight.** When a concept is central to the lesson — or the student simply hasn't had enough exposure to it yet — generate more practice (more questions, longer phrases, an extra column) rather than fewer. A high-value, under-practised concept is never under-served just to keep a block small; add the extra practice it deserves.
- **Phrase length and complexity follow the student's place in the course.** The closer to the start, the shorter and simpler the phrases must stay; later content must lengthen AND grow in clause complexity and register — an advanced lesson never falls back to beginner phrasing. That length in turn decides how a block reaches its width: short phrases get there with more phrases or more columns, longer phrases get there with length. There is no fixed beginner/advanced split — judge each block against the lesson's expected level.
- **Carrier content escalates with the course.** The example phrases and contexts that carry each lesson's grammar are matched to the student's level at that point: they draw on everything already taught and grow in length, clause complexity and business register as the course advances. When an early item is recycled, it reappears inside a richer frame — never re-taught at its original basic level (a "How's it going?" in lesson 33 is out of place).
- **Phrasal verbs first, formal only to map meaning.** Where a native speaker would say the phrasal verb (put off, call off, set up, get back to, go over, wrap up), that is what the student learns and produces. The formal single-word twin (postpone, cancel, arrange, return, review, conclude) appears only as a gloss so the student can connect meaning — never as the default answer or the preferred form.
- **Business-casual register is the target voice.** The book teaches the English of a normal working day — contractions, phrasal verbs, discourse markers and friendly-but-professional politeness — not jargon and not stiff written English. "Term of the art" business vocabulary is excluded; when a formal term is shown at all it is only to contrast with the natural spoken form.
- **Listening and speaking are trained, not just tested.** Every new item has audio; listening blocks teach connected speech and reductions; speaking blocks teach flow, linking and the chunks a native speaker produces automatically. Grammar is taught so the student can *generate* correct structure, not merely recognise it.
- **Verbs are learned as "verb + preposition" units.** A verb that requires a preposition (look AT, go TO, give TO, talk TO, depend ON, wait FOR) is always introduced — and recycled — with that preposition attached and visually marked, so the student never memorizes a bare verb and then wonders which preposition goes with it.
- **High-frequency prepositions are taught by MEANING, early.** TO = direction/movement/change + the infinitive marker; FOR = purpose or duration; ON = connection/surface contact; IN = inside a larger thing; AT = a point in space or time / a target. The PT single word "para" splits into TO and FOR — flagged and drilled because it is a persistent PT→EN error. These meanings are integrated into the early routine/place/time lessons and recycled, never parked in one grammar lesson.
- **Group related items into families.** When vocabulary, phrases or structures can be taught at a similar grammatical level, teach them together as a set rather than scattered — e.g. a family of phrasal verbs built on ONE root verb (get back / get on / get up; look at / look for / look up / look over). Grouping by root or theme reveals the system and improves retention; a random assortment hides the pattern.
- **Factuality.** Every factual or statistical claim in the materials must be true and defensible. Never pad a section with an unverified assertion (e.g. a made-up claim about how common something is); say only what is true and useful.
- **Teach in context and in phrases.** Vocabulary and structures are taught inside natural example phrases and, wherever useful, inside a scenario, story or dialogue — never as isolated glosses. The instructional content should be engaging and dynamic rather than a dead table.
- **Match depth to the concept's weight.** A grammar point is taught as a general principle with enough cases to cover its scope; a one-sentence rule is folded into its section, and a substantial rule gets full treatment — never inflated, never under-covered.
- **The medium and activity are free.** Any medium (chart, dialogue, graphic, audio, video, song) and any exercise shape is allowed when it serves the pedagogy. The established components are examples, not a closed menu; invent freely and record any new component in FORMAT.md/CONTENT.md.
- **Teach the pattern — or state plainly there is none.** For each concept, decide by research and analysis whether it has a teachable pattern, regularity or logic. Teach the pattern when one exists. When none exists — e.g. WHICH phrasal verbs are separable vs inseparable is a per-verb property, not predictable from the particle or the verb — say so explicitly, so the student knows it is memorized/absorbed through use rather than derived.
- **A rule and its direct consequence are one idea.** Do not split one concept into separate sections when one section is simply the consequence of the other (e.g. separability and the pronoun's position). Keep them in a single section with an explicit bridge ("Consequência: …"), or cross-reference them — never leave two adjacent sections teaching the same concept as if they were unrelated.
- **A context vehicle that leans on new items comes after they are taught.** A story, dialogue or scenario that leans heavily on items the student has not met yet comes AFTER those items are taught, so it is comprehensible and consolidates what was just learned. If it must come first, the new items must be presented within the vehicle/section in some way (primarily core notes, once built; other presentation methods remain available) — or the vehicle uses only already-known items.

## Lesson & block types (synthesized from the 2026-10-21 research pass)

The business track keeps the established components (chart, dialogue, listen-and-choose, fill-in, translation, recording) as its baseline, and the patterns below are EXAMPLES of what it adds — not a closed menu. Any new medium or exercise shape is allowed when it serves the pedagogy (see the principles above), and is then recorded in FORMAT.md/CONTENT.md. The patterns below were built from the existing CSS, but new styling may be added when a new shape needs it:

- **Phrasal-verb swap (natural-first).** A chart teaches the everyday phrasal verb alongside its formal twin, and the exercise asks the student to *replace the formal word with the phrasal verb* (postpone → put off; cancel → call off; arrange → set up; return a call → call back; review → go over; submit → hand in). The phrasal verb is always the answer the student produces; the formal twin is only there to map meaning.
- **Chunk bank (lexical approach).** Teach a set of whole, prefabricated expressions a native speaker says as one unit ("I'll get back to you," "Let me check," "Sounds good," "No worries," "Just a heads-up") with audio, then a matching/translation exercise. These chunks are the 55–80% of native speech that is formulaic (Lewis/Schmitt), and they build fluency faster than rules alone.
- **Connected-speech lab (listening).** Show full form vs reduced form side by side (want to → wanna; going to → gonna; have to → hafta; kind of → kinda; don't know → dunno; let me → lemme; give me → gimme) with ▶ audio, then a listen-and-choose that asks "what did you hear?" — training the ear for modern US English.
- **Micro-listening / dictation.** A short natural-speed sentence plays; the student types or picks exactly what they heard. The gap is a contiguous line, never literal underscores.
- **Register swap (formal ↔ natural).** Two columns or a chart contrast a stiff written phrase with its business-casual spoken twin ("I regret to inform you" ↔ "Sorry to say"; "We are unable to" ↔ "We can't"), and the exercise picks the natural one for speech.
- **Question-building.** Given an answer, form the question; given a context, ask the follow-up question. This is the single highest-leverage speaking/flow skill for keeping a conversation alive.
- **Repair & clarification.** Fixed phrases for when communication breaks ("Could you say that again?", "I didn't catch that", "What do you mean by…?"), practised as listen-and-repeat and a fill-in.
- **Speaking flow / shadowing.** A short, linked paragraph (or dialogue) read aloud and recorded, targeting linking, rhythm and the reduced forms from the connected-speech lab. The ⏺ recording prompt stays complete and read-aloud-able.

Sequencing rule for these new blocks: a new structure is always introduced in a chart/dialogue with ▶ audio first, then practised in Treino, then tested in the Quiz — the same one-idea-per-section discipline as the rest of the book.

## Language by student level (English-first, comprehensibility-driven)
Portuguese text is ALWAYS italic — tag it with `<i>` (or the `.ptw`/`.pt` class), even inside a header or a chart column header.

Use ENGLISH wherever the student can actually follow it — i.e. wherever the text can be generated primarily with language the student has ALREADY been taught, or sits at a linguistic level generally below the level of the text that contains it. This applies to section headlines, explanatory text, warnings, tips, block headers and column headers alike. Portuguese is used only when that logic — or the pedagogy/content generation — dictates it, never "at will":

- **Beginner (early stage):** little has been taught yet, so most English would be above the student's level → headers and explanatory prose are Portuguese. English appears where it is the item being taught (e.g. the phrasal verb itself) and where an already-taught word fits.
- **Intermediate:** the parts the student already controls switch to English (section/block/column headers first, then simple explanations and reminders); conceptual explanations — and anything whose English would be above level — stay Portuguese.
- **Advanced:** almost entirely English. Portuguese is reserved for exactly two cases: (1) when the content type or pedagogy demands it, and (2) limited explanation where your analysis/reasoning/research explicitly predicts the equivalent English is beyond the student's level or ability to understand.