# Lesson 8 — design (Pass A)

`must not re-teach:` prepositions of time belong to lesson 17 — at/on/in and the fixed blocks are not taught here.

## Core (what the student can do afterwards)
1. Say **how often** with the six adverbs and put them in the right place: *I **always** work from home. · She is **usually** late. · I **never** drink coffee after six.*
2. Read a clock out loud: *o'clock · half past · quarter past · quarter to · noon · midnight*.
3. Narrate a whole day in the past, reusing lesson 6-7 verbs: *I got up at six, I left at seven, I met the client, I got home at nine.*
4. Use the school-day and at-home routine fields: *alarm · breakfast · shower · backpack · classroom · desk · homework · recess · exam · assignment · due · finished · get dressed · go to bed*.

## Teaching beats (per core item) and dependencies
- **Frequency lives in one of two places, and the verb decides which**: **before** a normal verb (*I always work*), **after** *be* (*I'm always tired*). This is the single placement rule, and it is the part a Brazilian gets wrong because Portuguese allows the adverb at the end.
- **The adverbs are a scale, not synonyms**: *always · usually · often · sometimes · never* — from every time to no time. They are taught as one ordered set so the student can pick without translating.
- **The clock has a fixed script**: *o'clock* for the exact hour, *half past* for :30, *quarter past* / *quarter to* for :15 and :45, and the two named points *noon / midnight*. The digital reading (*nine thirty*) is also natural and is named, not hidden.
- **The day is the frame that makes all of it true.** A routine needs a sequence, so the page tells one whole day in order — and tells it in the **past**, which is the tense the last two lessons built. Dependencies: the past forms come from lessons 6-7 (*got up, left, met, came back*), and the prepositions of time (*at*, *in the morning*) are **deliberately not taught here** — lesson 17 owns them, so this lesson uses only the fixed blocks as whole chunks.
- **School-day vocabulary is the carrier**, not the topic: it supplies the nouns a routine is made of (*alarm, shower, backpack, classroom, homework, recess, exam, assignment, due*).

## Situation
A normal Tuesday: the phone alarm, the shower, the commute, three work blocks, and a colleague who asks *"What time do you usually start?"* — then asks what happened yesterday. The student must answer both the frequency question and the time question, in the same breath.

## Candidates (three channels)
- **Heard — the alarm-day audio.** Six short lines about a person's day, no text; the student ticks *how often* each thing happens.
- **Done — the day strip.** A strip of the day with clock faces; the student writes one sentence per block, with the verb in the right tense and the adverb in the right place.
- **Read — the school letter.** A letter to parents describing the school day (times + expectations); the student extracts the schedule and turns it into "my day" sentences.

## Chosen
**Done (the day strip), entered through Heard.** The day strip puts the clock and the adverb next to each other in one artefact: each block of the day needs a time (the clock) and a habit (the adverb), which is exactly the pair this lesson teaches. The letter is good reading input but belongs to a level where reading is not the bottleneck.

**First 30 seconds:** one line plays (*I usually get up at six*) and a strip with three clock faces appears; the student clicks the clock that matches. No rule yet.

## What the student produces (evidence)
Six frequency placements, six clock readings written and said, a whole-day narration of six sentences written then recorded, a three-question dialogue answered, then a quiz on all four behaviours with no reused item.


## Conflicts, and how I resolved them
- **Prepositions of time are lesson 17's.** Resolution: *at nine*, *in the morning*, *on Monday* appear **only as fixed chunks inside example sentences**, never as a rule, and no exercise asks the student to choose the preposition.
- **The frequency words were previewed in lesson 4.** Resolution: lesson 4 used them as time cues; here they get their **placement rule** and their scale. No repetition of the lesson-4 explanation.
- **The clock could pull in numbers beyond 60 (lesson 12).** Resolution: only the 12-hour clock and the two named points are taught; prices, percentages and dates stay in lesson 12.

## Pass B — build notes (2026-11-03, page generated)

Page: `business/lesson8.html` (+ identical `.edit.html` sidecar).
Sections: 1 Com que frequência (Heard entrance + the five-adverb scale) · 2 O lugar do advérbio · 3 Que horas são · 4 O dia inteiro (field + past dialogue) · 5 Lab do som (o'clock / half past / quarter / past) · 6 Treino · 7 Quiz.

### Decisions taken inside the design (Pass B, recorded per §4)
- **The adverb placement is taught as three rows, not two**: verb, *be*, and **helper** (*I don't usually…*). Lesson 5 already installed the helper slot, and a student who only learns "before the verb" will produce *"I don't usually"* by accident anyway — better to name it.
- **The clock is five formulas plus two named points**, and the digital reading is named rather than hidden, because it is what the student will hear in a meeting.
- **The day is a dialogue, not a list**: §4 puts the frequency question and the past narration in one exchange, which is exactly the pair of questions the situation promises.
- **Time prepositions appear only inside example chunks** — no exercise asks for *at/on/in* (lesson 17's).

### Width decisions
- §1, §2, §3, §4, §5 tables — full `.chart` (3–4 columns).
- §6 B+C and Quiz B+C — `itemrow[data-cols="2"]`: adjacent compressible groups.

### QA
`node qa/content.mjs 8` ✅ (chart 5 · panel 15 · listen 39 · gap 32 · radio 64, no anchor hints) ·
`node qa/width.mjs 8` ✅ · `node qa/overflow.mjs 8` ✅ clean (22 blocks).


## Shape of the session (what is met, in what order)
1. **Com que frequência** — the Heard entrance: six lines, tick how often; then the five-adverb scale.
2. **O lugar do advérbio** — before the verb, after *be*; one rule, two pictures.
3. **Que horas são** — the clock script, from *o'clock* to *midnight*.
4. **O dia inteiro** — the field and the day told in order, in the past.
5. **Lab do som** — *half past*, *quarter*, *o'clock* said fast.
6. **Treino** — placement, clock, day narration, listening, recording.
7. **Quiz — sem consulta.**

## Notes for the build pass
Portuguese for the explanation; the day is told as a story, not as a word list; every clock reading has audio; the past comes from lessons 6-7 and is not re-taught.
