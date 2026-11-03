# Lesson 3 — design (Pass A)

## Core (what the student can do afterwards)
1. Ask a real question in the right order and answer it: *Where is the office? · When is the meeting? · Who is the client? · What is the password? · Why is it late? · How do you spell it?*
2. Ask the same thing **politely**, with the question folded inside a sentence: *Can you tell me where the office is? · Do you know when the meeting is?*
3. Survive the moment they do not understand: *Sorry, could you say that again? · I didn't catch that · What do you mean by "scope"? · Let me check and get back to you.*
4. Keep apart the two pairs that get mixed up: *what / that* and *where / there*, and say *who* with a plain *h* (no *w*).

## Teaching beats (per core item) and dependencies
- **A wh- word is the missing piece of an answer.** Each of the six stands for one kind of gap: thing (*what*), place (*where*), time (*when*), person (*who*), manner/degree (*how*), reason (*why*). The student already knows the answers from lesson 1 and 2 — this lesson only teaches the question that pulls them out.
- **With *be* the order is wh- + be + subject.** *Where is the office?* Portuguese happens to agree here, so this is the cheap part — and it is the platform the expensive part stands on.
- **The polite question stops being a question.** *Can you tell me **where the office is*** — inside a sentence the clause takes statement order (subject, then *be*), because it is now a piece of information, not a question. *"Can you tell me where **is** the office?"* is the classic Brazilian error and the actual target of the lesson.
- **Repair is a skill, not a failure.** Four fixed chunks, said fast, keep a call alive: repeat, slower, meaning, and buy-time.
- **Two pairs, one mouth movement.** *what/that* and *where/there* differ only in the first sound (*w* glide vs tongue-between-teeth); *who* has no *w* at all. Dependencies: *that* and *there* are already known from lesson 1's *it* and the office tour; they are used here as the contrast, not retaught.

## Situation
First week. A video call starts, someone asks three things fast, the student understands two words and must (a) answer, (b) ask the same thing politely, (c) ask the person to say it again — without leaving the conversation.

## Candidates (three channels)
- **Heard — the induction call.** Six questions arrive as audio only, in natural speed; the student ticks **what each question is about** (place, time, person, reason…), then sees the text.
- **Done — the answer board.** Six answers are pinned on a wall; the student writes the question that produced each one, then turns the direct question into the polite version.
- **Read — the chat thread.** A message thread where a client asks and a colleague answers; the student finds the polite requests and rewrites the blunt ones.

## Chosen
**Done (the answer board), entered through Heard.** Producing the question from the answer is the only exercise that forces the wh- word *and* the order at once, and it is what the student actually needs on a call — the answer already exists, they must retrieve the question. The chat thread is the best *reading* material of the three but at this level it turns into translation rather than speech.

**First 30 seconds:** one question plays, two possible answers stand on the board, the student picks — no text, no rule. The six words are named only after three questions have been answered correctly.

## What the student produces (evidence)
Six questions written from answers, four direct→polite conversions, four repair-phrase gaps, a listen-and-tick on the two minimal pairs, three recorded polite questions, then a quiz that re-tests all four behaviours on material the training never used.

## Conflicts, and how I resolved them
- **The roadmap gives the polite question here, but its full skill (repair and clarification) returns in lesson 44.** Resolution: this lesson owns the *chunk and the word order*; lesson 44 owns the strategy. No conflict, recorded so the later page does not re-teach the order rule.
- **Six question words plus the polite form plus repair is a lot for one session.** Resolution: the polite form is taught as **one** transformation of the direct question (same six words reused), not as new vocabulary; repair is four chunks, no analysis. Nothing is dropped.
- **/w/ here and the consonant inventory in lesson 10.** Resolution: this lesson only trains the *glide itself* (what/where/when/why vs who/how) and the two minimal pairs; the full consonant map belongs to lesson 10 and is not anticipated.

## Shape of the session (what is met, in what order)
1. **As seis peças** — the Heard entrance: six questions as audio, tick what each asks about; then the six words as a reference table.
2. **A ordem** — wh- + be + subject (chart), then ordering drills.
3. **A pergunta educada** — direct → embedded pairs, the statement-order law, the three polite openers.
4. **Quando não se entende** — the four repair chunks inside a short dialogue, then gap-fill by situation.
5. **Lab do som** — the *w* glide, *who/how*, and the two minimal pairs.

## Pass B — build notes (2026-11-03, page generated)

Page: `business/lesson3.html` (+ identical `.edit.html` sidecar).
Sections: 1 As seis peças (Heard entrance + the six-word table) · 2 A ordem (wh- + be + subject) · 3 A pergunta educada (direct → embedded + the three openers) · 4 Quando não se entende (dialogue + six rescue chunks) · 5 Lab do som (w glide, who/how, what/that, where/there) · 6 Treino · 7 Quiz.

### Decisions taken inside the design (Pass B, recorded per §4)
- **The six-word chart is a reference the page reuses**, not a section of its own: the entrance *is* the six words heard, so a separate "here are the words" section would have repeated it.
- **The polite form is always shown as a pair** (direct | polite), never as a rule alone — the transformation is the teaching object.
- **Repair is a dialogue first, a table second**: the four chunks appear inside a conversation the student overhears, then as a reference with "when it serves".
- **The quiz gained a written production group** (3 polite-question gaps): the four MCQ groups alone would have tested recognition only, and the core of this lesson is *producing* the embedded order.

### Width decisions
- §1 six-word table, §2 order table, §3 pair table, §4 rescue table, §5 w-table — full `.chart`: 3–5 content columns each, so each saturates a full slot alone.
- §3 polite openers — `itemrow[data-cols="3"]`: *divide* the choice into its three registers.
- §6 B+C and Quiz D+E — `itemrow[data-cols="2"]`: *adjacent compressible blocks* (two short MCQ groups).
- §5's two pairs and the MCQ groups use `.qgrid.stack.cols` (two columns inside one block) rather than a row: the items are short and a half-slot would waste the width.

### QA
`node qa/content.mjs 3` ✅ (chart 5 · panel 16 · listen 48 · gap 9 · radio 105) · `node qa/width.mjs 3` ✅ ·
`node qa/overflow.mjs 3` ✅ clean (26 blocks).

6. **Treino** — questions from answers, direct→polite, repair, listen-and-tick, record.
7. **Quiz — sem consulta.**

## Notes for the build pass
Portuguese for the explanations, English for every target question; the six words are a reference the whole page reuses; the polite transformation is shown as a *pair*, never as a rule alone.

