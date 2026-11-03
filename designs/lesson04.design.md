# Lesson 4 — design (Pass A)

## Core (what the student can do afterwards)
1. Say what is **always** true and what is **now** true, and hear the difference in their own sentence: *I work here* (rotina) vs *I'm working here* (agora).
2. Put the **-s** on the verb when the owner is *he / she / it*: *she works, he goes, she studies, it has*, and know why it appears at all.
3. Order at the coffee shop and understand the answer: *a latte to go, please · with milk, no sugar · here or to go?*
4. Say *-ing* without a hard *g* — the nasal that betrays the accent in *working, meeting, going*.

## Teaching beats (per core item) and dependencies
- **The simple present is not "the present".** It is habit, fact and routine; it does **not** mean "right now". *I work in Recife* is a fact about the person, not about this minute.
- **"Now" needs a different machine: am/is/are + -ing.** Both forms are taught in the same lesson because the contrast is the lesson: the student must hear that the two sentences are not two ways of saying one thing.
- **The -s belongs to the owner, not to the tense.** He/she/it (one person, one thing) takes it; I/you/we/they do not. Dependencies: the subject rule of lesson 1 is the platform; *have → has* is the one irregular.
- **Spelling follows sound.** *+s* after most; *+es* after the sounds that cannot take a bare *s* (*watch, finish, go, do*); *consonant + y → -ies* (*study → studies*). The same three sounds (-s/-z/-ɪz) come back as a sound exercise.
- **The coffee-shop field is the carrier, not the topic.** *menu, order, latte, espresso, barista, sugar, milk, cream, to go, here, now* live inside a real order; the grammar rides on it.
- **-ing has no g.** The back of the tongue touches, the air goes through the nose, and the *g* never releases: *working* is not "workin-gui".

## Situation
First coffee after the first meeting: the student orders, is asked *here or to go?*, and then answers a colleague who asks what they do and what they are doing right now.

## Candidates (three channels)
- **Heard — the café counter.** A three-line order is heard (audio only); the student rebuilds it by choosing what was said.
- **Done — two columns of truth.** The student sorts their own real sentences into *always* and *now* (write them), then converts a colleague's routine into the third person.
- **Read — the onboarding page.** A short "your first week" text in the simple present; the student rewrites it as *now* sentences.

## Chosen
**Done (two columns of truth), entered through Heard.** The distinction only exists if the student's *own* habits are on one side and their *own* present moment on the other; sorting their own sentences is the shortest path to hearing the pair. The café arrives immediately after, as the place where both forms are used naturally.

## Conflicts, and how I resolved them
- **The roadmap previews the frequency adverbs here (always/usually/often/sometimes/never) for lesson 8.** Resolution: they appear **only as carriers** in this lesson's sentences (in the chart examples and two gap items) and are *named* as a set — the place of the adverb, its behaviour after *be*, and the full set are lesson 8's and are not taught here.
- **Ordering is arguably lesson 3's (polite requests).** Resolution: the café lines here are **statements and fixed phrases** (*a latte to go, please*), not questions; the *Can I have…?* form is glossed, not analysed.
- **The -s sound set could belong to the sound lessons.** Resolution: it is taught here because it is the sound *of this lesson's own ending* (three sounds), while the consonant inventory stays in lesson 10.

## Shape of the session (what is met, in what order)
1. **Duas colunas** — the entrance: two audio lines, one question (which is "agora"?), then the pair laid out side by side.
2. **O -s** — who takes it and how it is spelled (+s / +es / -ies / has).
3. **O agora** — am/is/are + -ing as the second machine, born next to the first.
4. **O café** — the field inside a real order: menu words, the counter dialogue, *here or to go?*
5. **Lab do som** — *-ing* with no *g*; the three sounds of *-s*.
6. **Treino** — conjugations, always/now, the order, listening, recording.
7. **Quiz — sem consulta.**

## Notes for the build pass
Portuguese for the explanations at this point on the ramp; every cafe word glossed inline before it is used; audio on every target verb form; the pair (*I work / I'm working*) must appear as a pair, never alone.



## Pass B — build notes (2026-11-03, page generated)

Page: `business/lesson4.html` (+ identical `.edit.html` sidecar).
Sections: 1 Duas colunas (Heard entrance + the pair table) · 2 O -s (owner + spelling) · 3 O agora (be + -ing) · 4 O café (field + counter dialogue + order gaps) · 5 Lab do som (-ing sem g; the three -s sounds) · 6 Treino · 7 Quiz.

### Decisions taken inside the design (Pass B, recorded per §4)
- **The entrance is two cards that ask the same question**, not a chart: the student must decide *which line is "agora"* before the two machines are named.
- **The frequency words appear only as the time cue inside brackets** (`todos os dias`, `neste momento`) — they are the student's decision-maker here and the topic of lesson 8, so they are used, never taught.
- **The -s sound set was added to the sound lab**: the roadmap names only *-ing*, but the `-es` spelling rule taught in §2 exists *because* of that third sound, so leaving it out would have left the rule unexplained.
- **Quiz A moved from "I work → she" to real sentences**: the bare conversion duplicated Treino A's exact prompt text, which collides with the answer anchor (the same field would have been restored into two places). Sentence forms keep the behaviour and stay unique.
- **Entry radios live inside a `.qgrid.stack` stem** (`Frase 1 — o que ela descreve?`): a bare radio in a card resolves no anchor and cannot be restored, which `qa/content.mjs` catches.

### Width decisions
- §2 and §3 tables — full `.chart` (4–5 columns).
- §1 entry — `itemrow[data-cols="2"]`: *compare* the two lines side by side, one card each.
- §5 three -s sounds — `itemrow[data-cols="3"]`: *divide* one ending into its three sounds.
- §6 B+C and Quiz C+D — `itemrow[data-cols="2"]`: adjacent compressible MCQ groups.

### QA
`node qa/content.mjs 4` ✅ (chart 6 · panel 14 · listen 42 · gap 28 · radio 68) · `node qa/width.mjs 4` ✅ ·
`node qa/overflow.mjs 4` ✅ clean (27 blocks).

**First 30 seconds:** two audio lines play (*I work in Recife* / *I'm working in Recife*) and the student picks which one describes "agora". No rule is named yet.

## What the student produces (evidence)
Six verbs conjugated for he/she/it, six sentences sorted or converted, a written order at the counter with gap-filled field words, a listen-and-tick on -ing, three recorded sentences, then a quiz on all four behaviours with none of the training items.
