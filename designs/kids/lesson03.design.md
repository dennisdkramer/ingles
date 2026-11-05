# Lesson 3 (kids) — design (Pass A)

## Fundamental idea taken from `designs/kids/lesson02.design.md` and its parent `designs/lesson03.design.md`
The parent design's idea: **a question is the missing piece of an answer** — six words stand for the six kinds of gap (thing, place, time, person, manner, reason); with `be` the order is *wh- + be + subject*; the **polite** version folds the clause back into statement order (*Can you tell me where the gym **is**?*); and when you do not understand, four fixed chunks keep you in the conversation. Kids keep the idea and drop the induction call, the client, the office and "scope".

## Core (what the student can do afterwards)
1. Ask six real questions in the right order: *Where's the gym? · When's the test? · Who's the new teacher? · What's the wi-fi password? · Why's the app down? · How do you spell that?*
2. Ask the same thing **politely**, to a teacher or a stranger, with the question folded inside: *Can you tell me where the gym is? · Do you know when the test is?*
3. Survive not understanding: *Sorry, can you say that again? · I didn't catch that · What does "due" mean? · Wait, what?* — the first three with a teacher, the last with a friend.
4. Keep apart the pairs that get mixed up — *what / that* and *where / there* — and say *who* with a plain *h* and no *w*.

## Teaching beats (per core item) and dependencies
- **Each wh- word stands for one kind of gap.** Thing (*what*), place (*where*), time (*when*), person (*who*), manner/degree (*how*), reason (*why*). The student already owns the answers from lessons 1-2 (a place, a day, a name, a reason); this lesson only teaches the word that pulls the answer out. **Dependency:** every answer used is a sentence the student can already build with `be`.
- **With `be`, the order is wh- + be + subject.** *Where **is** the gym?* — Portuguese agrees here (*Onde **é** a quadra?*), which makes this the cheap part, and therefore the right place to stand for the expensive part.
- **The polite question stops being a question.** Inside a sentence the clause takes statement order: *Can you tell me **where the gym is**?* — because it is now a piece of information, not a question. *"Can you tell me where **is** the gym?"* is the classic Brazilian slip and the actual target of this lesson. **Dependency:** *Can you…* is used as a fixed opener, not taught as a modal — modals are lesson 15's.
- **Repair is a skill, not a failure.** Four chunks, said fast, keep a conversation alive; two of them belong to a teacher (polite), two to a friend (casual). Nothing is analysed — the chunk is the unit.
- **Two pairs, one mouth movement.** *what / that* and *where / there* differ only in the first sound (*w* glide vs tongue between the teeth); *who* has no *w* at all — it is a plain *h*. **Dependency:** *that* and *there* are already known from lesson 1 (the empty `it`, the objects on the desk) and are used here as the contrast, not re-taught.
- **Silly stakes.** A new school is a building full of doors you cannot find, and a group chat where asking the wrong way gets you screenshotted. Asking well is the difference between "he's new" and "he's the guy who asked the teacher *where is the bathroom?* in the middle of class".

## Situation
Asking a teacher or a stranger, asking friends in the class chat — a new school building, the class group chat, a game lobby, the school wi-fi.
Day three. The class has a group project and the student is the one who has to find out the practical things: which room, what time, who is in the group, what the wi-fi password is, why the school app will not open, and how you spell the teacher's name. Half the questions go in the class chat (friends), half go to a teacher (politely), and at least one answer arrives too fast to understand.

## Candidates (three channels)
- **Heard — six questions in the corridor.** Six questions arrive as audio only, at natural speed; the student ticks **what each one is about** (place, time, person, reason, spelling), then sees the text.
- **Done — the answer wall.** Eight answers are pinned (a room number, a time, a name, a password); the student writes the question that produced each one, then turns the blunt question into the polite version for the teacher.
- **Read — the group chat.** A message thread where a classmate asks and the class rep answers; the student finds the polite requests and rewrites the blunt ones, then adds the two repair lines the thread is missing.

## Chosen
**Done (the answer wall), entered through Heard.** Producing the question from an answer forces the wh- word **and** the order at once, and it is the exact move the student needs in the corridor: the answer already exists, they must retrieve the question. The chat thread is the best reading material of the three, but it turns into translation instead of speech.

**First 30 seconds:** one voice note plays — *"Room 12, second floor"* — and two questions stand on the wall: *Where's the room?* / *When's the room?* Pick one. The six words are named only after three answers have been matched correctly.

## What the student produces (evidence)
Eight questions written from answers, four direct → polite conversions for a teacher, four repair gaps chosen by *who* is speaking, one listen-and-tick on *what/that* and *where/there*, two recorded polite questions, then a quiz that re-tests all four behaviours on material the training never used.

## Conflicts, and how I resolved them
- **Six question words + the polite form + repair is a lot for one short-attention session.** Resolution: the polite form is taught as **one** transformation of the question the student already built (same six words, reused), and repair is four chunks with no analysis. Nothing is dropped, nothing is doubled.
- **Politeness at 14 can sound fake.** Resolution: the split is by *who is listening* — the teacher version and the friend version sit side by side in one block, so the register contrast is the content, not an etiquette lecture.
- **"Can you…" is a modal, and modals are lesson 15's.** Resolution: it enters as a fixed opener (*Can you tell me…*, *Do you know…*) with its meaning given, never as a system; lesson 15 owns the modal, and this page does not touch ability or permission.
- **/w/ here vs the consonant map in lesson 10.** Resolution: this page trains only the glide itself and the two minimal pairs; the full map is lesson 10's and is not anticipated.

## Shape of the session (what is met, in what order)
1. **Seis perguntas no corredor** — the Heard entrance (audio + "what is it about?"), then the six words as one reference block.
2. **A ordem** — wh- + `be` + subject, then ordering items.
3. **A pergunta educada** — direct | polite shown as a *pair*, the statement-order law, the two openers (*Can you tell me… / Do you know…*).
4. **Quando não se entende** — a short dialogue where the student gets lost, then the four repair chunks, split teacher / friend.
5. **Lab do som** — the *w* glide; *who* vs *how*; the pairs *what/that* and *where/there*.
6. **Treino** — questions from answers, direct → polite, repair, listen-and-tick, two recordings.
7. **Quiz — sem consulta.**

The answer wall comes first and the rule second: this persona needs a win in the first minute, and "you already know the answer, now ask for it" is that win. The polite transformation arrives once the question is already solid, so only one thing is new at a time.

## Notes for the build pass
The six words are a reference the whole page reuses, not a section of their own. The polite version is always shown as a pair (direct | polite) — never as a rule alone. `data-say` on every target line.

`recycles:` lesson 1's `be` and `it` (*Where's the gym? — It's on the second floor*), lesson 2's cognates inside the answers (*information, password* is not a cognate — glossed) — used, never re-taught.
`must not re-teach:` lesson 4 owns the simple present and the -s; lesson 5 owns do-support and the question skeleton with *do/does* (this page only asks with `be` and the fixed openers); lesson 15 owns modals; lesson 44 owns the full repair-and-clarification strategy.

