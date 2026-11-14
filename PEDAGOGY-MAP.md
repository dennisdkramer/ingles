# [GENERATION] PROCESS & DEFAULTS (binding) - DO NOT MODIFY WITHOUT USER SIGN-OFF
1. No lesson page or content vehicle is an input, and **No shape is inherited from one** - not a neighbouring lesson, not another track's page, not a page being replaced. A page that references, copies, or reproduces a sibling's shape is a failed generation, not a variant.
2. The page must run on the site: mechanical skeleton + deliverable state the engines can read;
3. Every factual claim is true and defensible — never pad a section with an unverified assertion.

## [I/O]
- MANDATORY Inputs - **Reading order is the sequence printed below; PRECEDENCE IS NUMERICAL ORDER**:
	1) THIS FILE
	4) (<TRACK>-ROADMAP.md [#]) section and its contents, never the whole file, and never another lesson's range: this entry is the roadmap that the lesson's contents will be built from. Coverage ≠ section plan: a roadmap item doesn't get its own h2 unless it earns one.
	6) (<TRACK>-ROADMAP.md '##' HEADERS ONLY) - Reference **only to reduce redundancy with other lessons**.
	3) FUNCTION.md [CONTENT] - Only within this section
	2) <TRACK>-REGISTER.md - **<TRACK> is the PERSONA - guides**: context, voice, and vocabulary (tiered by real-life frequency (`core` → `common` → `situational` → `rare`, in its tells block))
	5) `node qa/brief.mjs --index` - the **ONLY `###`-level** headings that follow CONTENT_EXAMPLES.md `[INSTRUCTIONS]` (the grammar block itself comes with the full run; one entry whole is `--section=NN`; `--indexes` prints this index and item 7's in one run). **CARRIES NO AUTHORITY AT ALL** — vehicle may be chosen by [BUILD] 3(d), content is written for the lesson. An entry whose heading carries `IGNORE - pending updates` is withheld (`--index=raw` omits the line; the JSON flags it `ignore`), because the shape is still waiting for its update, and is not available.
	7) `node qa/brief.mjs --css` - style.css `/* ## ` Headers ONLY, each with its line number; no stored copy exists (`--indexes` prints it with item 5's index). Styling, formatting implementation (eg. which class or knob does what).

- As-Needed Inputs — **read only the section that answers the question, never the whole file.** The engines are implementation, not pedagogy: engine1.js, engine2.js, engine4.js (`window.GAMES4`; a page that uses a game block must add `<script src="../engine4.js"></script>` itself, after engine2.js). CONTENT_EXAMPLES.md `### ` section content for each header chosen by ([BUILD] 3(d)) during the current step - that section only. The contents of a specific (style.css `/* ## `) **ONLY WHEN** that span is mandatory to correct authoring of specific HTML for the lesson being generated.
When the lesson wants to include music/audio: qa/AUDIO.md

- Allow: Downloaded materials, assets/. - **Withhold all other files, all other file reads require user sign-off**.

- **Output ONLY** = `<track>/lesson<N>.html`, **unpadded** (`lesson1.html`, never `lesson01.html` - the landing links are built as `track/lesson`+n+`.html`), built on `_shell.html`. **artifact creation, do not read**: PAST_BATCHES.md

## [BUILD] SHAPE
1. The build is a **synthesis according to [I/O] Precedence and the model to make outstanding teaching material**
2. Track register, [LEVEL] and model intuition may supercede the ROADMAP's items, but never silently - the purpose for the deviation must be authored below the <h2> of the affected content.
3. Use your creativity to decide what [[type of content] and [in what order]] is optimal for the student to learn from, and enjoy each lesson. **The order is always** Pedagogical shape -> Lesson Content -> THEN vehicles are imagined or selected which best present that content in that shape. **Consider the following**:
  - a) Can the concepts be grouped or categorized to optimize understanding?
  - b) To what extent and in what combination does student success depend on [understanding [a concept] or [translation mapping]], [training and getting accustomed to its use], or [memorization]?
  - c) Is this lesson/section/block a good opportunity to [introduce, compare, or make note of] any [synonyms, antonyms, homophones, homographs, false cognates, relevant idioms/expressions, etc.]?
  - d) Considering (a), (b), and (c), is the given content well suited to a particular display element, vehicle, or game from [I/O] 5 or from an outside source?
  - e) If an item from among [I/O] #5 `###` headings is chosen, read only that heading's entry for implementation details (`node qa/brief.mjs --section=NN` prints one whole). The heading is the shape, the itemsize and what it does; the `markup` and `info` lines under it are how it is built. Any shape and vehicle you imagine is equally valid and may be used for any part of any lesson - examples are mere possibilities.

## [PORTUGUESE] Quantity decreases as student english level increases **HIGH PRIORITY**
- For any generated [[**Lesson introduction, explanatory text, tip, headline, or column header**], it is authored in Portuguese [only if [LESSON #] < ([CONTENT LEVEL] of the explanation)] ELSE [it is authored in English, and [CONTENT LEVEL] is authored to be as close as possible to [STUDENT LEVEL]]]
    - **The Portuguese share is a target range in figures, not a judgement call.** Take the elements this rule names - lesson introduction, explanatory text, tip, headline, column header - and the share of them authored in Portuguese must sit inside:
       - **ceiling = 75 − (L − 5) × 1.8 %** - no more Portuguese than this, at any lesson number;
       - **floor = 35 − (L − 5) × 1.8 %**, clamped at 0 - no less, because a lesson that stopped glossing has abandoned its reader.
       - With L the lesson number, lesson 1 targets **42–82%**, lesson 5 **35–75%**, lesson 20 **8–48%**, lesson 30 **0–30%**, lesson 40 **0–12%**, and from lesson 47 the ceiling itself reaches 0 and is clamped there, so nothing above that level is glossed.
- For any generated content which is NOT [[**Lesson introduction, explanatory text, tip, headline, or column header**]], [it is synthesized with [[derived socio-linguistic context] and [its TRACK's [register details and persona priorities]]], [CONTENT LEVEL] is as close as possible to [STUDENT LEVEL], and [it is Portuguese ONLY when *defensibly optimal for teaching purposes*] ELSE it is authored in English].

## [LEVEL]
- "STUDENT LEVEL" = [Current Lesson #].
- "STUDENT LEVEL APPROPRIATE" = at or above [STUDENT LEVEL]
- **The difficulty is measured by the CONCEPTS and the required  TRAINING to master them, never in the prose or the options.** An explanation may sit at whatever level clarity needs — it is an auxiliary tool, and density there is reading load, not difficulty. What is graded is what the student must infer, choose and produce
- Training blocks are authored and marked with a hidden data value according to the following question: "what % of the questions or requested answers would I expect a student - who is just reaching the level of english of the concepts being taught by this lesson- to get right"?. If the marked number is below 40%, the activities are a failure - too hard. If the number is above 90%, also a failure - too easy.

## [AUTHORING]
- `<TRACK>-REGISTER.md` governs every string the student reads — headline, explanation, stem, option, note, table cell — not only dialogue and vocabulary. Would this persona write this, in this situation, in this country? An explanation in textbook English beside slang options teaches the student to answer in the wrong voice. That comparison is the author's, applied string by string
- Explanatory prose may live anywhere: lead, chart cell, an extra explanation column, a `tr.note` row - it must be clear and directly aid student understanding - There is no cap on sections, examples, exercises, or any other element, and no page-length limit. Never cut useful tips and explanations - avoid filler and metaphor.
- Every (new word/form/concept) the student must understand is presented before it is used, else removed; if a block wants the student to *infer*, the page says so. An item never requests a judgement on an axis the page didn't define prior to the item, and no 'terminology' is used to categorize or describe linguistic concepts or classes if it is not verifiably in real-world use.
- Never show the answer in a prompt, and show Portuguese hints/explainers only where NECESSARY — the English that would carry the point sits above this lesson's level — or OPTIMAL — the point is a contrast between the two languages that English cannot make. Test, in order: can the student act correctly without it? cut it. Could the same point be made in English at this level? write English. Otherwise the smallest Portuguese that unblocks it: the word, the clause — never a translation of English already on the page.
- No copy-exercises: the student produces from memory or meaning, never transcribes the prompt.
- Whenever student level appropriate, teach the rule, the reasoning (the mental model), and its direct consequences (integrated with the lesson content or in its own section as appropriate); say plainly when [there is no clear or consistent] [rule and/or reasoning].
- False cognates (eg. 'pretend' -X- 'pretender' -> 'intend') and words which [in one language cleanly map onto] [more than one word in the other] (eg. 'live' -> 'morar' / 'viver') are presented together when possible and explained/demonstrated as appropriate.
- Practice trains the lesson's concepts, inline following what they train and/or in a penultimate section. The last section is a quiz that tests all of it — it may echo the training, never copy it.  **Every new item and/or concept is thoroughly taught and/or demonstrated, confirmed with training, subsequently TESTED - each by its own question.** A vocabulary item or a concept is tested only when it is the correct answer to a question that is about it: one question per new item, at least one question per concept (difficult concepts like present perfect tense require MANY questions). Additional questions with trained content as distractors may be authored as appropriate but do not count towards training/testing requirements. 
- Multiple-choice options are shuffled so the right one is not always in the same slot.
- **An item's option count is set by what it has to discriminate, never by habit.** 2 is right only when the pair is genuinely binary, and 5–6 belong to an item whose content supplies that many plausible candidates (a family of ten look-phrases, six tense forms). If a vehicle has a maximum option count, it is stated in its entry in the vehicles index.
- Per ([BUILD] 3), content must be authored first, and vehicles which are appropriate **may** be chosen to hold it. The build may choose to place its content directly into the section as it sees fit - choosing no pre-existing vehicle - or may or choose one which is an optimal fit for the authored content.
- A block that asks the student to write carries an `input.gap` or a `textarea` other than `#feed` — a radio-only block cannot ask for writing. A block that trains nothing on its own is a **teaching** block tagged by the <TEACH> atom in vehicle headers.
- For any section and/or block, a concise <h4> or <p> text may be included below the header to explain its contents or direct the student only if it does not repeat any other content on the page.
- Each item carries the condition that decides it (a gloss that could go either way is not an item).
- Activity answer options match the lesson in concept and the [LEVEL] in length and linguistic complexity — a phrase answer gets phrase distractors, never one-word ones.
- For any adjascent columns or containers, their contents should be authored with similar heights, adding more to the shorter and never subtracting from the taller.

## [PAGE] MECHANICS — the order a page is decided
- The generation order is always content-first: the lesson's shape, then the student-facing strings, then content and concept-based organization — parallel elements sit beside each other in matching block sizes (three things to compare are three thirds in one row, a pair is two halves) so the comparison reads as one set. Then the vehicle ([BUILD] 3) is chosen and applied. A block's size follows the content it has been chosen for, never anticipates it. The block takes the narrowest slot the content fills — its width steps up one slot only when a structural element stops fitting — prose wraps, so prose never widens a block. → (style.css `/* ## BLOCK WIDTHS`)

