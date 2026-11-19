# [GENERATION] DO NOT MODIFY WITHOUT USER SIGN-OFF - **No other page is an input, and reading one is the act that is barred** — during a generation no `lesson<N>*.html` (any track, any lesson) and no `preview*.html` may be opened, searched, diffed, quoted, offered as precedent, or recalled from memory: not its content, not its markup, not its link line, not its class or attribute names, not its naming scheme, not its order. **Plumbing is not exempt** — the stylesheet a page links, the shell it was copied from, the scripts it loads, how a control is written, how an answer is keyed, what the file is called: each is answered by an input the list below allows, or it is a question for the owner. Each lesson generation starts fresh.

1. Generation **BEGINS** by copying `_shell.html` - The frame is fixed — head, `header.brand`, `#controlbar`, `#barhelp`, `main#page > .page-container > .content-area`, the script slot.
2. Choose a title that gives a clear idea of whe main thing taught by the lesson, then RENAME the file to `lesson<N>-<Title>.html`: the filename carries the title, and it is the only place the site index learns either.
3. Synthesize a thorough lesson based on the lesson plan in the ROADMAP, the teaching voice and student needs in the REGISTER, and [AUTHORING] instructions. The shell's placeholders are filled as the page is written — TRACK_TITLE (<`track`>), TRACK_UPPER (the same word in capitals), TRACK (the folder name, the backend key)
4. WHEN the lesson is finished, RUN `npm run build:lessons`, commit, and push.

## [I/O] THIS FILE HAS PRECEDENCE AND GUIDES SYNTHESIS AND AUTHORING OF A THOROUGH AND ENGAGING ENGLISH LESSON FOR THE CONCEPTS AND VOCABULARY IN THE ROADMAP LESSON PLAN BELOW, USING THE <TRACK>-REGISTER.md VOICE, FOR THE [PERSONA] OF THE TARGET STUDENT
Mandatory Inputs:
	1) (<TRACK>-ROADMAP.md [<lesson #>]) section contents
	2) <TRACK>-REGISTER.md - the voice of the author and student, **who the student is**.
	3) `/* #` Headers only from style.css  **formatting and styling options**
Optional Inputs: 
	- (IN-BLOCK-VISUALS.md [AUDIO] section only) and its inputs
	- qa/pos.mjs (paint parts of speech)
**WITHHOLD ALL OTHER INPUTS** DO NOT READ ANY FILE NOT ON THIS LIST

## [AUTHORING] - 
- Each lesson is imagined and generated in a unique and varied way, the order and type of its sections and blocks are never a standard - they are conceived independently as the optimal way to deliver the specific lesson and/or the specific elements within it.
- The tone and vocabulary described in the REGISTER is maintained throughout. The ROADMAP teaching concepts, vocabulary, and examples are thoroughly explored, explained, trained, and tested - there is *NO LIMIT* on lesson duration or content quantity - more depth, more thorough explanations (**clarity**, never filler or prose for its own sake), and more training activities are always better than less- all incorporated into an engaging and relevant lesson for the <TRACK>-REGISTER.md [PERSONA].
- "STUDENT LEVEL" is assumed and relative to [Current Lesson #] and the english concepts and vocabulary they have learned in the course up to that point.
- **Ability grows with the lesson number** Lesson 1 assumes the student knows no english. By lesson 50 the student should have achieved functional fluency.
- **What maps directly** onto Portuguese is cheap; what maps onto it and misleads - or has no counterpart - is expensive. ("descend" is cheaper than "go down" although it is the rarer word. Present perfect is very expensive because the mapping breaks)
- **Sentence complexity** - a clause inside a clause, a form whose Portuguese counterpart does not match, etc.. is expensive
- **Importance can outrank level.** A concept the lesson must teach, when it is expensive, gains increased support around it grows - more teaching and more training.
- Optimize concept/element/content grouping/order according to the needs of the student. [Introduce, compare, or make note of] [synonyms, antonyms, homophones, homographs, false cognates, relevant idioms/expressions, etc.] that are relevant to the lesson content.
- Every (new word/form/concept) the student must understand is presented before it is used; if a block wants the student to *infer*, the page says so. 
- Teach the rule, the reasoning (the mental model), and its direct consequences.
- Multiple-choice options are shuffled so the right one is not always in the same slot. No copy-exercises: the student produces from memory or meaning,
- Portuguese is used to explain content, compare/contrast grammar/vocabulary between the languages, or give translations when the necessary information in english would not be well understood by the student at the level of the lesson that contains it or when it is significantly more efficient to explain something with portuguese.


