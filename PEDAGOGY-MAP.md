# PEDAGOGY-MAP — GENERATION PROCESS & DEFAULTS (binding) - DO NOT MODIFY WITHOUT USER SIGN-OFF
	- The page must run on the site: mechanical skeleton + deliverable state the engines can read (FORMAT.md, FUNCTION.md);
    - Every factual claim is true and defensible — never pad a section with an unverified assertion.
	- Build the page on `_shell.html` (repo root; placeholders `{{TRACK_TITLE}}`, `{{TRACK_UPPER}}`, `{{TRACK}}`, `{{L}}`, `{{LESSON_TITLE}}`) — never on another lesson's shell, which carries that lesson's comment, title and `L`.

### 1. [BUILD] PROCESS (BINDING)
Output = `<track>/lessonNN.html`, plus a byte-identical `.edit.html` sidecar, built on `_shell.html`
Inputs: [the single `## Lesson NN` section of `<TRACK>-ROADMAP.md` — located by that heading and read as its own line range, never the whole file] + FORMAT.md §2 onwards + §Content contracts of FUNCTION.md + **`<TRACK>-REGISTER.md`- HIGH PRIORITY** + (CONTENT_EXAMPLES.md [HEADLINES]) and ONLY the headlines below it 
	- (The build is a **synthesis, not obedience**). **Withhold: All other files.**
	- **Vehicle justification**: Why this vehicle/block type/layout/presentation style and not another.
	- **The menu is selected by the heading scores, never by memory**: each `CONTENT_EXAMPLES.md` `###` heading carries an A–J score (meanings in `CONTENT_EXAMPLES.md` §READ HEADINGS). Shortlist from the scores against what the beat must do — a beat that must be *heard* wants `G` high, one that contrasts three forms wants `E` high, a class whose level you cannot rely on wants `H` low, a beat that must end in writing wants `F` high — then read only the chosen entry's body for its `fits` (width/size) and its markup. A shape carried over from the previous lesson because it was the visible precedent is a defect even when it fits.
	- How the shape is built with the available blocks — is Pass B's call, no escalation
	- Never silently contradict the ROADMAP's "focus" or teaching beats ("teaches: .. ") - May change included Vocabulary, Examples, Context if defensible purpose arises naturally.
	- **`style.css` is implementation only**: If necessary, read it for an *implementation* question (which class or knob does what) — never to decide content or shape.
	- **HIGH PRIORITY**:
      1. For any generated [**Lesson introduction, explanatory text, tip, headline, or column header**], it is authored in Portuguese [only if its parent  [LESSON NUMBER] < [CONTENT LEVEL]] ELSE [it is authored in English, and [CONTENT LEVEL] is as close as possible to [LESSON LEVEL]]. 
      2. For any generated content of any other type, it is synthesized with [[derived socio-linguistic context] and [its TRACK's [register details and persona priorities]]], [CONTENT LEVEL] is as close as possible to [LESSON LEVEL], and [it is Portuguese ONLY when *defensibly optimal for teaching purposes*] (else english).
	- Use your creativity to decide what type of content and in what order is optimal for the student to engage with and understand each lesson. Consider the following:
		a) Can the concepts be grouped or categorized to optimize understanding?
		b) To what extent and in what combination does student success depend on [understanding [a concept] or  [translation mapping]],[training and getting acustomed to its use], or [memorization]?
		c) Is this lesson/section/block a good opportunity to [introduce, compare, or make note of] any [synonyms, antonyms, homophones, homographs, false cognates, relevant idioms/expressions, etc..]?
		d) Considering (a), (b), and (c), is the given content well suited to a particular display element, vehicle, or game from CONTENT-EXAMPLES or from an outside source? -If an item from among `CONTENT_EXAMPLES.md` headings is chosen, read only that heading's line range for implementatin details.




	- Existing plans, content types, and examples are **defaults that a better idea is expected to beat**. A plan that suggests substantive changes to the lesson contents or new designs/functions is presented to the owner for approval, feedback, or veto before it is executed.
   - If a rule would have blocked something better, that's an escalation, not a workaround
   - Limit [attempt quantity / time spent] on reconciliation and/or problem resolution. 
	 (the mirror image of §2).
	- Handling depends on scope of elements involved in any escalation/conflict: 
		a) Planning/Content/Vehicle for a single section which does not interfere with successful generation of other sections -> (Affected content skipped, task processing continues)
		b) Conflict is limited to content of one specific lesson, but [more than one section is affected or risks being degraded] -> (task skips to next requested lesson generation if applicable)
		c) Any issue that effects the content of multiple lessons or generation in general - (task is immediately paused to confer with the user)

	
    

### CONTENT [AUTHORING]
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
	k) Practice trains the lesson's concepts in conceptually distinct blocks, inline with what they train and/or in a penultimate section. The last section is a quiz that tests all of it — it may echo the training, never copy it. A `.game` block inside that quiz carries `data-retry="0"` — one score, and it is final, because the radio the student answered once is the evidence; a `.game` in a training block leaves the default and stays replayable (FUNCTION.md §Content contracts).
	l) Multiple-choice options are shuffled so the right one is not always in the same slot.
	m) Boilerplate & filler are last resorts.
		
#### Lesson [Length] / Content Quantity
	n) Never compress, summarise or omit an item to fit a page.
	o) There is no cap on sections, tables, examples, exercises, dictation lines, recordings or quiz items, and no page-length limit. 
	p) All primary concepts and specific items suggested by the entry must be appropriately explained and trained *in its own lesson* — explain → show → recognise → produce → test.

####  [Vocabulary] - (`Key vocabulary:`)
	q) Each lesson must present at least 10 new vocabulary items which are relevant to the concepts and context of the lesson (eg. a lesson teaching modes counts "would" as a vocabulary item). 
	r) Input Vocabulary items are SUGGESTIONS, any vocabulary that is relevant/useful to the lesson or student goals is taught. Presentation can be in the form of a list, inside phrases, or brief notes/tips accompanying related content. Drill and recycle the most useful items.

#### [LEVEL] -
	s) "STUDENT LEVEL" = [Current Lesson #] = "LESSON DIFFICULTY".
	t) "LEVEL APPROPRIATE" = [STUDENT LEVEL ± 5] - ("appropriate"/"appropriateness" [must be clearly understandable as a specific characteristic defined by its parent phrase/context] ELSE = [LEVEL APPROPRIATE]).
	u) "CONTENT LEVEL" is judged by "how much this piece of content asks of this student", on the same 1-50 scale as the lesson number. 
	v) "VOCABULARY LEVEL" - Judged by intuition from 1 (extremely simple word/phrase/idea) to 50 (extremely complex, unusual or opaque to the learner). 
    
  
### 5. [Vehicles]
	- **A standing priority of every build — after correctness — is variety and engagement.** the student should be curious what comes next. Pitch that engagement at the *track's personality*, not a generic one: read `<TRACK>-REGISTER.md` and choose every vehicle and its tone for that persona (what a kids page finds fun, a business page may find unserious). Variety is a goal, never a checklist — a shape is still chosen because the beat needs it, not to tick a box.
	-`CONTENT_EXAMPLES.md` is the vehicle menu, and a build has **full reign over it**: browse the headings, then freely pick, combine, adapt or extend what is there to fit the beat and the track. Any vehicle is allowed, catalogued or not — authored text, dialogue or chart; real material (song, clip, article, document, photo); interactive (game, timed drill, role-play); a project; an arrangement nobody has tried yet. Recombining the existing blocks into a new shape is always free; Referencing material instead of embedding it is fine (a song named by lyric, "go and listen to it"); a *link* that ships must resolve, and the section must still teach if it dies.
