# PENDING — active batch plan (authored at Adherence.md [BATCHING] 3, summary and clearing at 6 and 7)

## [GUIDELINES]
- Requested changes are committed and pushed when done by default. For any changes that are not pushed, the user must be notified at Turn completion.
- Avoid rapid successive pushes when a single combined push would do — build markers, a live-site curl or a fixed sleep are tools reached for when the risk of an undetected deploy problem is real, not mandatory steps after every push.

## [HANDLING]
- Each completed `[Sn]` is marked `DONE - <date> - <which files it modified>` and triggers beginning work on the following `[Sn]` or the first `[Sn]` in the following `[Bn]`.
- Read only the `### [Bn]` batch section you are on. Don't read ahead without verifiable need or user instruction.
- An unfinished item is moved into `[PAST]` at the end of the turn, one line, newest first: `<date> — <the user's words> — <what remains>`. It is a record, not a queue: it is not read back as a mandatory step on later prompts, and its entries are not named unless asked.
- Heading depth is fixed per prompt, and every level is a real heading - never a bold line standing in for one, never a bullet:
	- `## [n]` - the Prompt line, directly under `# [CURRENT]`
	- `### [Bn]` - a batch
	- `#### [Sn]` - a step
- Author in the following format:

```markdown
## [n] <1 line summary of the user prompt; all of its batches sit beneath it> — this line is not one of the lines Adherence.md [PARSE] 1) and 2) put in the turn's first message: those are the per-element lines and the batch list.

### [Bn] <the purpose of batching its child steps - the overarching thing getting done> <the user's words it serves> <artifact produced> <exit condition> <the rule most likely to be broken in this batch, and how that would show>

#### [Sn] <the action or goal of the step> <the File & Section name of the rules which are most relevant> <any prerequisite items or actions> <exit condition>
```

# [CURRENT] Prompt - (Active batches, newest first)

## [1] Generate the kids track lessons 1-50, exams 25/45 as blank shells, one lesson per batch with a commit and push, QA only where a defect is detected

### [B1] Fix the generation contract so 50 lessons are authored against one read rather than fifty guesses; serves "read PEDADOGY_MAP.md and go from there" + "generate the kids track"; artifact = the ten inputs read (PEDAGOGY-MAP.md whole, KIDS-ROADMAP.md Decisions/Shape + per-lesson ranges, FORMAT.md, FUNCTION.md §CONTENT, KIDS-REGISTER.md, _shell.html, CONTENT_EXAMPLES.md `###` headings, VERIFICATION.md, qa/run.mjs, one finished adult page as markup reference); exit = kids/ confirmed empty, exams 25/45 read, QA shape known (`npm run qa -- content --track=kids <N>`), plan in this file; risk = reading the roadmap whole instead of per-lesson line ranges (PEDAGOGY-MAP.md §1.a)

#### [S1] Read the inputs named above, none whole where a range will do <PEDAGOGY-MAP.md §1/§2/§5> <nothing> <DONE - 2026-11-08 - read-only, no file modified>

### [B2] Lesson 1 authored and shipped as its own batch; serves "lessons 1-50" + "each lesson is a batch, commit and push when a batch is done"; artifact = kids/lesson1.html + kids/lesson1.edit.html; exit = both files on origin/main in one commit; risk = a page that misses the 10-vocabulary floor or the closing quiz (PEDAGOGY-MAP.md §q/§k)

#### [S1] Read KIDS-ROADMAP.md lines 18-26 as the lesson's own range, diff the other mandatory inputs, author on _shell.html, mirror to .edit.html, append the two §5 lines to PAST_BATCHES.md, commit and push <PEDAGOGY-MAP.md §1/§4/§5, FORMAT.md> <B1> <DONE - 2026-11-08 - kids/lesson1.html, kids/lesson1.edit.html (byte-identical), PAST_BATCHES.md - 6 sections, 12/12 vocabulary items, closing skeetRange quiz at data-retry="0">>

### [B3] Lesson 2 — the silent e, the vowel pairs, the cognates that lie; same artifact/exit/risk shape as [B2]
#### [S1] Roadmap lines 28-36; author + sidecar + §5 lines + commit and push <PEDAGOGY-MAP.md §1/§4/§5> <B2> <DONE - 2026-11-08 - kids/lesson2.html + .edit.html (byte-identical), PAST_BATCHES.md - 6 sections, 12/12 items, catchBasket training game (replayable) + whackMole quiz at data-retry="0">

### [B4] Lesson 3 — be, get and it; same shape as [B2]
#### [S1] Roadmap lines 38-46; author + sidecar + §5 lines + commit and push <PEDAGOGY-MAP.md §1/§4/§5> <B3> <DONE - 2026-11-08 - kids/lesson3.html + .edit.html (byte-identical), PAST_BATCHES.md - 6 sections, 12/12 items, video from lesson 1 returns in a be sentence, stackDrop quiz at data-retry="0">

### [B5] Lesson 4 — have, do, make, go; same shape as [B2]
#### [S1] Roadmap lines 48-56; author + sidecar + §5 lines + commit and push <PEDAGOGY-MAP.md §1/§4/§5> <B4> <DONE - 2026-11-08 - kids/lesson4.html + .edit.html (byte-identical), PAST_BATCHES.md - 6 sections, 12/12 items, catchBasket do/make sorting drill + whackMole quiz at data-retry="0">

### [B6] Lesson 5 — a, the and there is; same shape as [B2]
#### [S1] Roadmap lines 58-66; author + sidecar + §5 lines + commit and push <PEDAGOGY-MAP.md §1/§4/§5> <B5> <DONE - 2026-11-08 - kids/lesson5.html + .edit.html (byte-identical), PAST_BATCHES.md - 6 sections, 12/12 items, catchBasket training game + skeetRange quiz at data-retry="0">

### [B7] Lesson 6 — the sentence skeleton and the -s of he, she, it; same shape as [B2]
#### [S1] Roadmap lines 68-76; author + sidecar + §5 lines + commit and push <PEDAGOGY-MAP.md §1/§4/§5> <B6> <DONE - 2026-11-08 - kids/lesson6.html + .edit.html (byte-identical), PAST_BATCHES.md - 6 sections, 12/12 items, catchBasket subject-sort training + skeetRange quiz at data-retry="0", tags balanced 95/95 divs and 3/3 tables>

### [B8] Lesson 7 — saying no, don't and doesn't; same shape as [B2]
#### [S1] Roadmap lines 78-86; author + sidecar + §5 lines + commit and push

### [B9] Lesson 8 — asking, do/does, wh-front, short answer; same shape as [B2]
#### [S1] Roadmap lines 88-96; author + sidecar + §5 lines + commit and push

### [B10] Lesson 9 — the simple present is a fact, never right now; same shape as [B2]
#### [S1] Roadmap lines 98-106; author + sidecar + §5 lines + commit and push

### [B11] Lesson 10 — frequency, routine order, in/on/at; same shape as [B2]
#### [S1] Roadmap lines 108-116; author + sidecar + §5 lines + commit and push

### [B12] Lesson 11 — right now, be + -ing, and the text-speak code the register requires; same shape as [B2]
#### [S1] Roadmap lines 118-126; author + sidecar + §5 lines + commit and push

### [B13] Lesson 12 — fact against moment, side by side; same shape as [B2]
#### [S1] Roadmap lines 128-136; author + sidecar + §5 lines + commit and push

### [B14] Lesson 13 — the verbs that refuse -ing; same shape as [B2]
#### [S1] Roadmap lines 138-146; author + sidecar + §5 lines + commit and push

### [B15] Lesson 14 — can: ability, permission and requests; same shape as [B2]
#### [S1] Roadmap lines 148-156; author + sidecar + §5 lines + commit and push

### [B16] Lesson 15 — to and for, and the one para that splits; same shape as [B2]
#### [S1] Roadmap lines 158-166; author + sidecar + §5 lines + commit and push

### [B17] Lesson 16 — on, in, at: contact, container, point; same shape as [B2]
#### [S1] Roadmap lines 168-176; author + sidecar + §5 lines + commit and push

### [B18] Lesson 17 — verbs that carry their preposition; same shape as [B2]
#### [S1] Roadmap lines 178-186; author + sidecar + §5 lines + commit and push

### [B19] Lesson 18 — the past of be, and there was; same shape as [B2]
#### [S1] Roadmap lines 188-196; author + sidecar + §5 lines + commit and push

### [B20] Lesson 19 — -ed, its three sounds, and the time words that force it; same shape as [B2]
#### [S1] Roadmap lines 198-206; author + sidecar + §5 lines + commit and push

### [B21] Lesson 20 — the verbs that ignore -ed, and did; same shape as [B2]
#### [S1] Roadmap lines 208-216; author + sidecar + §5 lines + commit and push

### [B22] Lesson 21 — telling it in the past, in order; same shape as [B2]
#### [S1] Roadmap lines 218-226; author + sidecar + §5 lines + commit and push

### [B23] Lesson 22 — object pronouns, possessives, reflexive; same shape as [B2]
#### [S1] Roadmap lines 228-236; author + sidecar + §5 lines + commit and push

### [B24] Lesson 23 — commands, let's, the softeners, and the border where slang stops; same shape as [B2]
#### [S1] Roadmap lines 238-246; author + sidecar + §5 lines + commit and push

### [B25] Lesson 24 — how much, how many, some, any; same shape as [B2]
#### [S1] Roadmap lines 248-256; author + sidecar + §5 lines + commit and push

### [B26] Lesson 25 is an EXAM and stays a blank shell, per "Exam lessons left as blank shells"; artifact = kids/lesson25.html + sidecar carrying the shell, the roadmap title, and no authored section; exit = both files on origin/main with nothing between the shell's LESSON CONTENT markers; risk = inventing exam content the user asked to withhold
#### [S1] Copy _shell.html, fill the five placeholders from roadmap lines 258-261, write the byte-identical sidecar, commit and push

### [B27] Lesson 26 — gonna, the spoken future; same shape as [B2]
#### [S1] Roadmap lines 263-271; author + sidecar + §5 lines + commit and push

### [B28] Lesson 27 — will, the decision taken while you speak; same shape as [B2]
#### [S1] Roadmap lines 273-281; author + sidecar + §5 lines + commit and push

### [B29] Lesson 28 — the arranged future, be + -ing with a time; same shape as [B2]
#### [S1] Roadmap lines 283-291; author + sidecar + §5 lines + commit and push

### [B30] Lesson 29 — the get family, four particles; same shape as [B2]
#### [S1] Roadmap lines 293-301; author + sidecar + §5 lines + commit and push

### [B31] Lesson 30 — the look family and the particle that splits; same shape as [B2]
#### [S1] Roadmap lines 303-311; author + sidecar + §5 lines + commit and push

### [B32] Lesson 31 — what English sounds like when it is fast; same shape as [B2]
#### [S1] Roadmap lines 313-321; author + sidecar + §5 lines + commit and push

### [B33] Lesson 32 — have + participle, and the participles you cannot guess; same shape as [B2]
#### [S1] Roadmap lines 323-331; author + sidecar + §5 lines + commit and push

### [B34] Lesson 33 — the perfect for duration, the trap Portuguese sets; same shape as [B2]
#### [S1] Roadmap lines 333-341; author + sidecar + §5 lines + commit and push

### [B35] Lesson 34 — ever, never, just, already, yet; same shape as [B2]
#### [S1] Roadmap lines 343-351; author + sidecar + §5 lines + commit and push

### [B36] Lesson 35 — since and for, starting point against length; same shape as [B2]
#### [S1] Roadmap lines 353-361; author + sidecar + §5 lines + commit and push

### [B37] Lesson 36 — -er or more, and the than that follows; same shape as [B2]
#### [S1] Roadmap lines 363-371; author + sidecar + §5 lines + commit and push

### [B38] Lesson 37 — the best out of all of them, and the slang that ranks; same shape as [B2]
#### [S1] Roadmap lines 373-381; author + sidecar + §5 lines + commit and push

### [B39] Lesson 38 — have to, don't have to, mustn't, should; same shape as [B2]
#### [S1] Roadmap lines 383-391; author + sidecar + §5 lines + commit and push

### [B40] Lesson 39 — if this happens, that follows; same shape as [B2]
#### [S1] Roadmap lines 393-401; author + sidecar + §5 lines + commit and push

### [B41] Lesson 40 — who, that, where, saying which one you mean; same shape as [B2]
#### [S1] Roadmap lines 403-411; author + sidecar + §5 lines + commit and push

### [B42] Lesson 41 — like doing against want to do; same shape as [B2]
#### [S1] Roadmap lines 413-421; author + sidecar + §5 lines + commit and push

### [B43] Lesson 42 — used to, the habits that are gone; same shape as [B2]
#### [S1] Roadmap lines 423-431; author + sidecar + §5 lines + commit and push

### [B44] Lesson 43 — the past continuous and the when or while that joins it; same shape as [B2]
#### [S1] Roadmap lines 433-441; author + sidecar + §5 lines + commit and push

### [B45] Lesson 44 — passing on what someone said; same shape as [B2]
#### [S1] Roadmap lines 443-451; author + sidecar + §5 lines + commit and push

### [B46] Lesson 45 is an EXAM and stays a blank shell; artifact = kids/lesson45.html + sidecar; exit = both files on origin/main with no authored section; risk = inventing exam content
#### [S1] Copy _shell.html, fill the five placeholders from roadmap lines 453-456, write the byte-identical sidecar, commit and push

### [B47] Lesson 46 — had + participle, the step before the story starts; same shape as [B2]
#### [S1] Roadmap lines 458-466; author + sidecar + §5 lines + commit and push

### [B48] Lesson 47 — if it were true, would and the were kept for I; same shape as [B2]
#### [S1] Roadmap lines 468-476; author + sidecar + §5 lines + commit and push

### [B49] Lesson 48 — when the doer does not matter; same shape as [B2]
#### [S1] Roadmap lines 478-486; author + sidecar + §5 lines + commit and push

### [B50] Lesson 49 — question tags and the answer that follows; same shape as [B2]
#### [S1] Roadmap lines 488-496; author + sidecar + §5 lines + commit and push

### [B51] Lesson 50 — the layer under the grammar, tone without a voice; same shape as [B2]
#### [S1] Roadmap lines 498-506; author + sidecar + §5 lines + commit and push

## [PAST]

