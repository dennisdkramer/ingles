# PEDAGOGY-MAP — GENERATION PROCESS & DEFAULTS (binding) - DO NOT MODIFY WITHOUT USER SIGN-OFF

## TRACK — persona & goals · the 3 [Registers] · the contexts that guide their use
- `<TRACK>-REGISTER.md`

## ROADMAPS — the per-lesson entries
- `<TRACK>-ROADMAP.md`

## LESSON GENERATION (BINDING PROCESS)

### 1. Two passes, with a barrier between them
**Pass B — build.** - (Output = `<track>/lessonNN.html`, plus a byte-identical `.edit.html` sidecar, built on `_shell.html`)
Inputs: [the single `## Lesson NN` section of `<TRACK>-ROADMAP.md` — located by that heading and read as its own line range, never the whole file] + FORMAT.md §2 onwards + §Content contracts of FUNCTION.md + `<TRACK>-REGISTER.md`- **HIGH PRIORITY** + `## READ HEADINGS` section of `CONTENT_EXAMPLES.md` — located by that heading and read as its own line range, never the whole file. (The build is a **synthesis, not obedience**)
	- Withhold: All other files.
	- **Vehicle justification — recorded per beat (binding)**: for every numbered beat of the `## Lesson NN` section, Pass B MUST record why that vehicle and not another, appending one line per beat to that same `## Lesson NN` section of `<TRACK>-ROADMAP.md` — `beat N → <vehicle> — because <why this and not another>` — written as the beat is built, never reconstructed afterwards. A beat whose vehicle could be swapped for another without changing what is learnt is generic: re-cut it before building it.
	- **The menu is selected by `fits`, never by memory**: `fits` names the kind of language work a shape is for — `form` `lexis` `sound` `meaning` `register` `text` `interaction` `listening` `culture` `music` `error` `model` `reference` `review` `order` `recognition` (meanings in `CONTENT_EXAMPLES.md` §The `fits` vocabulary). A beat takes the shape whose `fits` matches what that beat teaches; a shape carried over from the previous lesson because it was the visible precedent is a defect even when it fits.
	- How the shape is built with the available blocks — is Pass B's call, no escalation
	- Pass B never silently contradicts a teaching beat, but may replace the design's shape with a strong defensible reason.
	- **`style.css` is implementation only**: the build may read it for an *implementation* question (which class or knob does what) — never to decide content or shape.
	- **HIGH PRIORITY**:
      1. For any generated [**Lesson introduction, explanatory text, tip, headline, or column header**], it is Portuguese [only if its parent  [LESSON NUMBER] < [CONTENT LEVEL]] ELSE [it is English and [CONTENT LEVEL] is as close as possible to [LESSON LEVEL]]. 
      2. For any generated content of any other type, it is synthesized with [[derived socio-linguistic context] and [its TRACK's [register details and persona priorities]]], [CONTENT LEVEL] is as close as possible to [LESSON LEVEL], and [it is Portuguese ONLY when *defensibly optimal for teaching purposes*]
	- Pass B has creative freedom to choose the optimal order of a lesson's contents, and to include or not include any vehicles and/or content types for any section or block. If an item from among `CONTENT_EXAMPLES.md` headings is shown, read only that heading's line range for the implementation contract: `does`, `skins` (which authoring markup it drives), `art`, `can't`, `needs`. Nothing else in the file is opened.

### 2. ESCALATE / CONFER
	- Existing plans, content types, and examples are **defaults that a better idea is expected to beat**. A plan that suggests substantive changes to the lesson contents or new designs/functions is presented to the owner for approval, feedback, or veto before it is executed.
	- Conflicts and uncertainty always trigger escalation: **stop, present the idea, name the conflict, propose the resolution.** Never squash the idea to fit a rule, and never silently comply with the rule either.
   - Limit [attempt quantity / time spent] on reconciliation and/or problem resolution. maximum of 3 attempts to solve the same/similar/connected problem(s) without significant progress. After third attempt, log in ISSUES.md and skip to next section/lesson/subtask batch as appropriate.
	- If a rule would have blocked something better, that's an escalation, not a workaround (the mirror image of §2).
	- Handling depends on scope of elements involved in any escalation/conflict: 
		a) Planning/Content/Vehicle for a single section which does not interfere with successful generation of other sections -> (Affected content skipped, task processing continues)
		b) Conflict is limited to content of one specific lesson, but [more than one section is affected or risks being degraded] -> (task skips to next requested lesson generation if applicable)
		c) Any issue that effects the content of multiple lessons or generation in general - (task is immediately paused to confer with the user)

### 3. Non-Negotiables
	- the page runs on the site: mechanical skeleton + deliverable state the engines can read (FORMAT.md, FUNCTION.md);
    - every factual claim is true and defensible — never pad a section with an unverified assertion.
    

### 4. CONTENT AUTHORING
	a) Restructuring Pass A is allowed: Pass B may merge/split/reorder to serve the teaching beats; escalation is for unresolved *conflicts* only.
	b) Explanatory layer may live anywhere__: lead, chart cell, an extra explanation column, a `tr.note` row. A chart is a teaching device, not a display device.
	c) Every (word/new form) the student must understand is [taught or glossed inline in PT] before it is used, else removed; if a block wants the student to *infer*, the page says so.
	d) Coverage ≠ section plan__: a roadmap item doesn't get its own h2 unless it earns one.
	e) No budget ≠ no depth__: length is not a proxy, and enumeration is not depth.
    - Never show the answer in a prompt; a hint may only be in the language the student is not producing.
    f) No copy-exercises: the student produces from memory or meaning, never transcribes the prompt.
	g) Teach in context, in phrases, inside a scenario, dialogue or story — not isolated glosses.
	h) Whenever feasible(sanity check the existance, relevance, appropriateness, and accessability of each), teach the rule, the reasoning(the mental model), and its direct consequences (integrated with the lesson content or in its own section as apppropriate); say plainly when [there is no clear or consistent] [rule and/or reasoning]. 
	i) Each item carries the condition that decides it (a gloss that could go either way is not an item).
	j) False cognates (eg. 'pretend' -X- 'pretender' -> 'intend') and words which [in one language cleanly map onto] [more than one word in the other] (eg. 'live' -> 'morar' / 'viver') are presented together with these characteriscs [shown/explained/demonstrated as appropriate].
	k) Practice trains the lesson's concepts in conceptually distinct blocks, inline with what they train and/or in a penultimate section. The last section is a quiz that tests all of it — it may echo the training, never copy it.
	l) Multiple-choice options are shuffled so the right one is not always in the same slot.
	m) Boilerplate & filler are last resorts.
		
#### Lesson Length / Content Quantity
	n) Never compress, summarise or omit an item to fit a page.
	o) There is no cap on sections, tables, examples, exercises, dictation lines, recordings or quiz items, and no page-length limit. 
	p) All primary concepts and specific items suggested by the entry must be appropriately explained and trained *in its own lesson* — explain → show → recognise → produce → test.

####  Vocabulary - (`Key vocabulary:`)
	q) Each lesson must present at least 10 new vocabulary items which are relevant to the concepts and context of the lesson (eg. a lesson teaching modes counts "would" as a vocabulary item). 
	r) Input Vocabulary items are SUGGESTIONS, any vocabulary that is relevant/useful to the lesson or student goals is taught. Presentation can be in the form of a list, inside phrases, or brief notes/tips accompanying related content. Drill and recycle the most useful items.

#### LEVEL -
	s) "STUDENT LEVEL" = [Current Lesson #] = "LESSON DIFFICULTY".
	t) "LEVEL APPROPRIATE" = [STUDENT LEVEL ± 5] - ("appropriate"/"appropriateness" [must be clearly understandable as a specific characteristic defined by its parent phrase/context] ELSE = [LEVEL APPROPRIATE]).
	u) "CONTENT LEVEL" is judged by "how much this piece of content asks of this student", on the same 1-50 scale as the lesson number. 
	v) "VOCABULARY LEVEL" - Judged by intuition from 1 (extremely simple word/phrase/idea) to 50 (extremely complex, unusual or opaque to the learner). 
    
  

### 5. Vehicles
Any vehicle is allowed: authored text, dialogue or chart; real material (song, clip, article, document, photo); interactive (game, timed drill, role-play); a project; something nobody has tried yet. Two tiers decide how it gets built:
   - **Tier 0** — existing primitives (FORMAT.md): tables, cards, dialogues, audio chips, gap-fills, multiple choice, recording, text boxes.
   - **Tier 1** — one *generic* engine, then free with per-lesson data: `whackMole` (a moving choice), `catchBasket` (sort into buckets), `skeetRange` (one shot at a moving target), `stackDrop` (order), `pairFlip` (memory), `ladderRun` (timed climb). Novelty should be parameterised, not bespoke: a new game is usually item data + a plugin on the existing engine (the block's markup and levers: FUNCTION.md §Content contracts). New plugins are proposed to the owner and built once, then reused.
   - **Tier 2** — bespoke simulation or multi-step project: propose it, don't build it unbidden.
Referencing material instead of embedding it is fine (a song named by lyric, "go and listen to it"); a *link* that ships must resolve, and the section must still teach if it dies.

### 6. Site contract (mechanical)
   - Publish `<lesson>.html` and its `.edit.html` sidecar — identical by definition, FUNCTION.md §Content contracts.
   - Build the page on `_shell.html` (repo root; placeholders `{{TRACK_TITLE}}`, `{{TRACK_UPPER}}`, `{{TRACK}}`, `{{L}}`, `{{LESSON_TITLE}}`) — never on another lesson's shell, which carries that lesson's comment, title and `L`.
   - Authored content sits in `.content-area` under one `<h1>` — that heading is the title `build-lessons.mjs` reads, and the build may set or change it at will (the next `build:lessons` run writes the new title into `lessons.json`).
   - Navigation is purely sequential (`← Last` / `Next →`); there is no lesson count anywhere.
   - Exercise state persists only through the three controls named in FUNCTION.md §Content contracts; if Pass A suggests an exercise type outside them, escalate per #2.
   - Audio for `.listen`: the built-in voice (`speechSynthesis`) is the **default delivery** — a `data-say` string with no clip is complete content and nothing waits on a render. Rendering clips is an optional later step: `npm run build:audio` does it at any time, `audio:check` is informational, and the `data-say` rule plus both commands are in FUNCTION.md §Content contracts.
   - Shell, classes and sizing: FORMAT.md. Behaviour, engines and edit mode: FUNCTION.md.