# [GENERATION] PROCESS & DEFAULTS (binding) - DO NOT MODIFY WITHOUT USER SIGN-OFF
- The page must run on the site: mechanical skeleton + deliverable state the engines can read (FORMAT.md, FUNCTION.md);
- Every factual claim is true and defensible — never pad a section with an unverified assertion.
1. MANDATORY Inputs:
   - a) <TRACK>-ROADMAP.md [LESSON #] - read as its own line range, never the whole file.
   - b) FORMAT.md
   - c) FUNCTION.md [CONTENT] - Only within this section
   - d) <TRACK>-REGISTER.md - **<TRACK> is the PERSONA - guides context, voice, and vocabulary**
2. AS-NEEDED Inputs - Reference/Implementation:
   - a) style.css **implementation only** - ONLY IF defensibly necessary, read to answer an *implementation* question (eg. which class or knob does what).
   - b) CONTENT_EXAMPLES.md [HEADLINES] - the `###` heading lines only, each read as its own line range. A `####` heading is a draft, not a menu item: it is never read, chosen or implemented by a build.
   - c) _shell.html
   - d) engine4.js **implementation only** - the game-presentation engine (`window.GAMES4`). `_shell.html` does NOT load it, so a page that uses a game block must add `<script src="../engine4.js"></script>` itself, after engine2.js.
   - e) PAST_BATCHES.md
3. Allow: Downloaded material, song, clip, article, document, photo, assets/. **Withhold all other files unless you have a strong defensible need to access them**
4. Output = `<track>/lesson<N>.html`, **unpadded** (`lesson1.html`, never `lesson01.html` - the landing links are built as `track/lesson`+n+`.html`), plus a byte-identical `.edit.html` sidecar, built on `_shell.html`
5. At the beginning of each Lesson generation
   - Diff MANDATORY Inputs against the files in your memory. For each that does not return a zero, re-read its entry (a,b,c,and/or d)
   - Append 2 lines to PAST_BATCHES.md: `<Lesson #>,  What is the social context of the lesson? What is the most difficult concept for the student?`
   - `<which files did I not re-read, and what was their diff>`

## [BUILD] PROCESS
- The build is a **synthesis, not obedience**
- **The menu is chosen freely, and the choice is informed - never replaced - by what each heading says about itself: its description, its utility in the lesson's context, and its 'clarity of purpose' and 'fun' scores. Read them off the heading when you pick; never work from memory.** The scores rank the options; they do not filter them - the arbitrary, the uncatalogued and the untried stay available to the beat.
- Freely decide how the shape is built to maximise student learning and engagement.
- Never silently contradict the ROADMAP's "focus" or concepts ("teaches: .. ").
- May change included Vocabulary, Examples, Context if defensible purpose arises naturally.
- **HIGH PRIORITY**:
  - For any generated [[**Lesson introduction, explanatory text, tip, headline, or column header**], it is authored in Portuguese [only if [LESSON #] < ([CONTENT LEVEL] of the explanation)] ELSE [it is authored in English, and [CONTENT LEVEL] is authored to be as close as possible to [STUDENT LEVEL]]
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
- k) Practice trains the lesson's concepts in conceptually distinct blocks, inline with what they train and/or in a penultimate section. The last section is a quiz that tests all of it — it may echo the training, never copy it. A `.game` block inside that quiz carries `data-retry="0"` — one score, and it is final, because the radio the student answered once is the evidence; a `.game` in a training block leaves the default and stays replayable
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
