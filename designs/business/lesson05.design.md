# Lesson 5 — design (Pass A)

## Core (what the student can do afterwards)
1. Ask anything about a routine with **do / does**, and know exactly where the **-s** went: *Does she work here? → Yes, she does.*
2. Say no without saying "no": *I don't work Fridays. · She doesn't use that tool.*
3. Answer short and correctly: *Yes, I do · No, she doesn't* — not *"Yes, I work"* when the question used *do*.
4. Tell *do* the helper from *do* the verb: *What do you do? — I'm an analyst.*

## Teaching beats (per core item) and dependencies
- **The skeleton, named once.** Every sentence is `[subject] [mode] [verb] [rest]`. When the *mode* slot is empty, the verb carries the marker (*she work**s***); when the mode is filled (*do / does / will / can / should*), the marker moves to the mode and the verb goes back to base (*does she work*). This is ONE rule that every later tense reuses — the lesson says so out loud, because it is the promise the rest of the course depends on.
- **The -s moves house, it is not doubled.** *She works* → *Does she work?* / *She doesn't work.* The verb drops it, the helper takes it. Portuguese speakers double it (*"Does she works?"*) precisely because nobody ever showed them the move.
- **Negation is a mode, not a word placed after the verb.** *I don't work* — not *"I not work"*.
- **Short answers stop at the mode.** *Yes, I do / No, she doesn't.* Repeating the full verb is not wrong in meaning but is not what a native answers.
- **The main-verb do must be shown, not mentioned**: *What do you do?* has two *do* doing two jobs in one sentence, and it is the most common question in a first meeting. Dependencies: the job words (*analyst, designer, manager*) come from lesson 1.

## Situation
Second call with a new team. The student is asked about routines (*Do you work with data? Does your team use Jira?*), must answer short, and must ask the same kind of question back without sounding like a machine.

## Candidates (three channels)
- **Heard — the interview.** Eight questions as audio, some real and some about routines; the student ticks *yes* or *no* and then says the short answer out loud.
- **Done — the two columns of the team.** A table of five colleagues with ticks; the student writes questions and short answers from the ticks.
- **Read — the tools page.** A one-paragraph "how we work" text where every sentence has a bare verb; the student turns statements into questions and negatives.

## Chosen
**Heard → Done.** The interview is the situation itself, and *do/does* is above all a listening problem: the helper is unstressed and swallowed (*D'you work here?*), so the ear must find it before the mouth can use it. The tick-table then forces the move of the *-s* mechanically, which is exactly the behaviour the lesson wants.

## Conflicts, and how I resolved them
- **The roadmap promises that every later operator reuses this slot (be, have, will, would, can, should).** Resolution: the skeleton is shown **once**, with the empty mode and with *do/does* filled — the other operators are named in a single preview line, never drilled here (lesson 15 owns the modal set).
- **The reduced *do you* (d'you) belongs to connected speech (lesson 14).** Resolution: it is **heard** here, never taught as a rule; the student meets it as a fast sound, and lesson 14 explains why it shrinks.
- **Short answers overlap with lesson 3's questions.** Resolution: lesson 3 owns wh- questions with *be*; this lesson owns yes/no with *do*, and says the distinction in one line instead of re-teaching the wh- set.

## Shape of the session (what is met, in what order)
1. **A entrevista** — Heard entrance: fast questions, tick what each asks about; then the short answers.
2. **O esqueleto** — the four slots, the empty mode vs the filled one, the -s moving house.
3. **A negativa** — don't / doesn't, and why the -s disappears from the verb.

## Pass B — build notes (2026-11-03, page generated)

Page: `business/lesson5.html` (+ identical `.edit.html` sidecar).
Sections: 1 A entrevista (Heard entrance: do vs does) · 2 O esqueleto (four slots, the -s moving house) · 3 Sim e não (negatives + short answers) · 4 O segundo do (helper vs verb) · 5 Lab do som (d'you, does, don't) · 6 Treino · 7 Quiz.

### Decisions taken inside the design (Pass B, recorded per §4)
- **The skeleton is one table with three rows of the same verb** (*works / does … work / doesn't work*): the design asked for the slot to be named once, and showing one verb in all three houses is the cheapest way to make the *-s* visible.
- **§3 merges the negative and the short answer.** They are the same helper in two positions; splitting them would have doubled the explanation and halved the contrast.
- **Every listening stem carries its section name** (`Entrevista 1`, `Som 2`, `Treino 3`): five groups all called "Frase 1" produce identical answer anchors, and a saved answer could then be restored into the wrong group (qa/content.mjs hint).
- **Treino A is a `.blanks.sent` list, not the `.blanks.line` two-column form**: the line form resolves its anchor as «→ ?» for every item (the prompt span is not read), so all six answers shared one anchor.

### Width decisions
- §2 and §3 tables — full `.chart` (4–5 columns).
- §6 B+C and Quiz B+C — `itemrow[data-cols="2"]`: adjacent compressible MCQ groups.
- Everything else full width; the MCQ groups use `.qgrid.stack.cols` internally.

### QA
`node qa/content.mjs 5` ✅ (chart 5 · panel 15 · listen 32 · gap 28 · radio 64, no anchor hints) ·
`node qa/width.mjs 5` ✅ · `node qa/overflow.mjs 5` ✅ clean (22 blocks).

4. **A resposta curta** — *Yes, I do / No, she doesn't*, and what a native does *not* say.
5. **do de verdade** — *What do you do?* with two *do* in one sentence.
6. **Lab do som** — the swallowed helper (*d'you*), *does* said with the right vowel, *don't* without the *t*.
7. **Treino** — questions from ticks, negatives, short answers, listening, recording.
8. **Quiz — sem consulta.**

## Notes for the build pass
Portuguese for the explanation; the skeleton is the page's spine and must look the same every time it appears; every target question has audio; no modal is drilled.


**First 30 seconds:** three questions play fast, back to back; the student only ticks which ones they heard as questions about *a person* vs about *a routine*. Nothing is explained yet.

## What the student produces (evidence)
Eight yes/no answers, six questions written from ticks, six negatives, a written interview of their own, three recorded exchanges, then a quiz on all four behaviours with no reused item.
