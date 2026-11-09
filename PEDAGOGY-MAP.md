# [GENERATION] PROCESS & DEFAULTS (binding) - DO NOT MODIFY WITHOUT USER SIGN-OFF
- The page must run on the site: mechanical skeleton + deliverable state the engines can read (FORMAT.md, FUNCTION.md);
- Every factual claim is true and defensible — never pad a section with an unverified assertion.
- A page is judged against this document's floors, not against the page next door: precedent is not evidence, and "the other lessons do it this way" is not an input.
1. MANDATORY Inputs:
   - a) <TRACK>-ROADMAP.md [LESSON #] - read as its own line range, never the whole file, and never another lesson's range: the entry for lesson N is the only roadmap text a lesson may be built from.
   - b) FORMAT.md
   - c) FUNCTION.md [CONTENT] - Only within this section
   - d) <TRACK>-REGISTER.md - **<TRACK> is the PERSONA - guides context, voice, and vocabulary**
   - e) **The list above is closed - a file added to it is a change to this document, not a generation decision.** **No lesson page is an input to any lesson:** not a neighbouring lesson, not another track's finished page, not the page being replaced (see 3). A lesson's shape is decided for its own beat and is never inherited; a page that reproduces a sibling's shape is a failed generation, not a variant of it.
2. AS-NEEDED Inputs - Reference/Implementation:
   - a) style.css **implementation only** - ONLY IF defensibly necessary, read to answer an *implementation* question (eg. which class or knob does what).
   - b) CONTENT_EXAMPLES.md [HEADLINES] - the `###` heading lines only, each read as its own line range. A `####` heading is a draft, not a menu item: it is never read, chosen or implemented by a build.
   - c) _shell.html
   - d) engine4.js **implementation only** - the game-presentation engine (`window.GAMES4`). `_shell.html` does NOT load it, so a page that uses a game block must add `<script src="../engine4.js"></script>` itself, after engine2.js.
   - e) PAST_BATCHES.md
3. Allow: Downloaded material, song, clip, article, document, photo, assets/. **Withhold all other files unless you have a strong defensible need to access them.** **No `*/*lesson<N>.html` is read while authoring any lesson** - a structural question is answered by 2.a-2.d, and continuity of concept or vocabulary comes from this lesson's own roadmap entry (`uses:`/`deepens:`), never from a prior page. `PEDAGOGY.md` is withheld outright: it governs roadmap generation, not lessons.
4. Output = `<track>/lesson<N>.html`, **unpadded** (`lesson1.html`, never `lesson01.html` - the landing links are built as `track/lesson`+n+`.html`), plus a byte-identical `.edit.html` sidecar, built on `_shell.html`
5. At the beginning of each Lesson generation
   - compare  MANDATORY Inputs  against the files in your memory. For each that does not return a zero, re-read its entry (a,b,c,and/or d)
   - **Write the provenance record BEFORE the first line of the page is written.** A record appended after the page exists is a description of what was done, not proof of what was used. One line, appended to `provenance.jsonl` at the repo root - its own ledger, so no other file's clearing can erase it - with values computed at write time:
     `{"lesson":"<track>/<N>","contract":"<sha8 of PEDAGOGY-MAP.md>","roadmap":"<sha8>","format":"<sha8>","function":"<sha8>","register":"<sha8>","shell":"<sha8>","range":"<start>-<end>","fingerprint":[["<h2 text>","<vehicle>"],...],"pagesRead":"none","date":"<YYYY-MM-DD>"}`
     `range` is this lesson's own roadmap line span. `fingerprint` is the page's h2s in order, each with the vehicle it uses, recomputed from the finished page and compared; a fingerprint identical to another lesson in the same track is a failure, and so is a record whose hashes no longer match the inputs on disk. `pagesRead:"none"` declares rule 3. **The ledger is transient:** once the track is regenerated and verified it is deleted, and the check reads an absent ledger as retired, never as "no records" (`VERIFICATION.md`).
   - Append 2 lines to PAST_BATCHES.md: `<Lesson #>,  What is the social context of the lesson? What is the most difficult concept for the student?`
   - `<which files did I not re-read, and what was their diff>`
   - **The build ends by measuring the page it just wrote.** When the page and its sidecar exist, and before the lesson is reported as done, run the two static checks on that one page and on nothing wider:
     - `node qa/lang.mjs --track=<track> <N>` and `node qa/provenance.mjs --track=<track> <N>` - the page's own voice against the target range in [BUILD] HIGH PRIORITY, and the record written above: its six hashes against disk, this lesson's own roadmap span, the concept marks, and the quiz coverage.
     - **Scope is that page.** A sweep (`--all`, or a bare `npm run qa`) is not a self-check: it puts other lessons' pages, bands and fingerprints in front of a build that may not read them ([GENERATION] 1.e and 3).
     - **A verdict on finished work, never a dial.** A share met by adding Portuguese because the floor is near, or a concept met by marking a block that does not train it, satisfies the instrument instead of the student - the same defect as a copied shape, reached from the other side. A red is answered in the page.
     - **The record leads the page.** If a check sends the build back to reshape the page, the fingerprint no longer matches and a new record is appended: the record never catches up to the page it describes.
     - `qa/content.mjs`, `qa/overflow.mjs` and `qa/live.mjs` are not part of this step - each opens a server or a real browser, so they belong at the end of a batch, not at the end of every page (`VERIFICATION.md`).

## [BUILD] PROCESS
- The build is a **synthesis, not obedience**
- **The menu is chosen freely, and the choice is informed - never replaced - by what each heading says about itself: its description, its utility in the lesson's context, and its 'clarity of purpose' and 'fun' scores. Read them off the heading when you pick; never work from memory.** The scores rank the options; they do not filter them - the arbitrary, the uncatalogued and the untried stay available to the beat.
- Freely decide how the shape is built to maximise student learning and engagement.
- Never silently contradict the ROADMAP's "focus" or concepts ("teaches: .. ").
- May change included Vocabulary, Examples, Context if defensible purpose arises naturally.
- **HIGH PRIORITY**:
  - For any generated [[**Lesson introduction, explanatory text, tip, headline, or column header**], it is authored in Portuguese [only if [LESSON #] < ([CONTENT LEVEL] of the explanation)] ELSE [it is authored in English, and [CONTENT LEVEL] is authored to be as close as possible to [STUDENT LEVEL]]
     - **The Portuguese share is a target range in figures, not a judgement call.** Take the elements this rule names - lesson introduction, explanatory text, tip, headline, column header - and the share of them authored in Portuguese must sit inside:
       - **ceiling = 75 − (L − 5) × 1.8 %** - no more Portuguese than this, at any lesson number;
       - **floor = 35 − (L − 5) × 1.8 %**, clamped at 0 - no less, because a lesson that stopped glossing has abandoned its reader.
       - With L the lesson number, lesson 1 targets **42–82%**, lesson 5 **35–75%**, lesson 20 **8–48%**, lesson 30 **0–30%**, lesson 40 **0–12%**, and from lesson 47 the ceiling itself reaches 0 and is clamped there, so nothing above that level is glossed.
       - A share is not a measurement: one element outside the range is allowed on a page, and a page carrying fewer than 12 such elements is not judged as a share at all. These are the exact figures `qa/lang.mjs` enforces, so the range a build is given and the range a page is judged by cannot drift apart.
  - For any generated content which is NOT [[**Lesson introduction, explanatory text, tip, headline, or column header**]], [it is synthesized with [[derived socio-linguistic context] and [its TRACK's [register details and persona priorities]]], [CONTENT LEVEL] is as close as possible to [STUDENT LEVEL], and [it is Portuguese ONLY when *defensibly optimal for teaching purposes*] ELSE it is authored in English.
- Use your creativity to decide what type of content and in what order is optimal for the student to engage with and understand each lesson. Consider the following:
  - a) Can the concepts be grouped or categorized to optimize understanding?
  - b) To what extent and in what combination does student success depend on [understanding [a concept] or [translation mapping]], [training and getting accustomed to its use], or [memorization]?
  - c) Is this lesson/section/block a good opportunity to [introduce, compare, or make note of] any [synonyms, antonyms, homophones, homographs, false cognates, relevant idioms/expressions, etc.]?
  - d) Considering (a), (b), and (c), is the given content well suited to a particular display element, vehicle, or game from CONTENT_EXAMPLES or from an outside source?
  - e) If an item from among [GENERATION] 2.b headings is chosen, read only that heading's line range for implementation details.

### [AUTHORING]
- a) Explanatory layer may live anywhere: lead, chart cell, an extra explanation column, a `tr.note` row. A chart is a teaching device, not a display device.
- b) Every (word/new form) the student must understand is presented before it is used, else removed; if a block wants the student to *infer*, the page says so.
- c) Coverage ≠ section plan: a roadmap item doesn't get its own h2 unless it earns one.
- d) No budget ≠ no depth: length is not a proxy, and enumeration is not depth.
- e) Never show the answer in a prompt; a hint may only be in the language the student is not producing.
- f) No copy-exercises: the student produces from memory or meaning, never transcribes the prompt.
- g) Teach in context, in phrases, inside a scenario, dialogue or story — not isolated glosses.
- h) Whenever feasible (sanity check the existence, relevance, appropriateness, and accessibility of each), teach the rule, the reasoning (the mental model), and its direct consequences (integrated with the lesson content or in its own section as appropriate); say plainly when [there is no clear or consistent] [rule and/or reasoning].
- i) Each item carries the condition that decides it (a gloss that could go either way is not an item).
- j) False cognates (eg. 'pretend' -X- 'pretender' -> 'intend') and words which [in one language cleanly map onto] [more than one word in the other] (eg. 'live' -> 'morar' / 'viver') are presented together with these characteristics [shown/explained/demonstrated as appropriate].
- k) Practice trains the lesson's concepts in conceptually distinct blocks, inline with what they train and/or in a penultimate section. The last section is a quiz that tests all of it — it may echo the training, never copy it. A `.game` block inside that quiz carries `data-retry="0"` — one score, and it is final, because the radio the student answered once is the evidence; a `.game` in a training block leaves the default and stays replayable. **Every taught element is trained, and every concept and every new item is TESTED - each by its own question.** A vocabulary item or a concept is tested only when it is the correct answer to a question that is about it: one question per new item, at least one question per concept, and the item must be the answer rather than a distractor, a word in the stem, or a word in the surrounding prose (an item that only ever appears as a wrong option was ignored, not tested). One question whose answer names four new items is one question about none of them, so it tests nothing. Every question that counts carries its own key (`data-a` on the `.qitem`, `data-answer` on the item, or the option whose text matches its `.listen` clip) - an unkeyed question cannot show what it tested, and a game item with no key scores every right answer wrong. **A concept is declared, not implied:** each pid on this lesson's own roadmap `teaches:` line is written verbatim into `data-teaches="<pid>"` on every block that trains it and on the quiz question that tests it, because a page that only names a tense has not taught the tense and no check can tell the two apart. The practice for a concept is made of that lesson's new vocabulary - the tense is produced inside sentences built from the new words, never in bare conjugation rows beside them.
- l) Multiple-choice options are shuffled so the right one is not always in the same slot.
- m) Boilerplate & filler are last resorts.
- n) All concepts that are meant to be trained in the Lesson must be appropriately explained and concepts demonstrated.

#### [Length] / Content Quantity
- o) Never compress, summarise or omit an item to fit a page.
- p) There is no cap on sections, tables, examples, exercises, dictation lines, recordings or quiz items, and no page-length limit.

#### [Vocabulary] - (`Key vocabulary:`)
- q) Each lesson must present at least 10 new vocabulary items which are relevant to the concepts and context of the lesson (eg. a lesson teaching modes counts "would" as a vocabulary item).
- r) Input Vocabulary items are the minimum items, any vocabulary that is relevant/useful to the lesson or student goals is taught. Presentation can be in the form of a list, inside phrases, or brief notes/tips accompanying related content. Drill and recycle the most useful items.

#### [LEVEL] -
- s) "STUDENT LEVEL" = [Current Lesson #] = "LESSON DIFFICULTY".
- t) "LEVEL APPROPRIATE" = [STUDENT LEVEL ± 5]
- u) "CONTENT LEVEL" is judged by "how much this piece of content asks of this student", on the same 1-50 scale as the lesson #.

### [Vehicles]
- **A standing priority of every build — after correctness — is variety and engagement.** the student should be curious what comes next. Pitch that engagement at the *track's personality*, not a generic one: read `<TRACK>-REGISTER.md` and choose every vehicle and its tone for that persona (what a kids page finds fun, a business page may find unserious). Variety is a goal, never a checklist — a shape is still chosen because the beat needs it, not to tick a box.
- `CONTENT_EXAMPLES.md` is the vehicle menu, and a build has **full reign over it**: browse the `###` headings (the `####` drafts are out of scope - see 2.b), then freely pick, combine, adapt or extend what is there to fit the beat and the track. Any vehicle is allowed, catalogued or not — authored text, dialogue or chart; real material (song, clip, article, document, photo); interactive (game, timed drill, role-play); a project; an arrangement nobody has tried yet. Recombining the existing blocks into a new shape is always free; Referencing material instead of embedding it is fine (a song named by lyric, "go and listen to it"); a *link* that ships must resolve, and the section must still teach if it dies.
