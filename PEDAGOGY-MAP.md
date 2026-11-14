# [GENERATION] PROCESS & DEFAULTS (binding) - DO NOT MODIFY WITHOUT USER SIGN-OFF
1. None of the decisions, elements, shapes, vehicles, order, skeleton, block count, the order of teach and train across sections, structure, or composition from any other page may be reproduced, inherited, referenced, or copied.
2. For each lesson generation, before any shape, display elements, or markup is chosen, author its core structure into PAST_BATCHES.md. Explain in 1 line per block what it teaches, trains, or demonstrates, why it is in that place in the lesson, and what is the best way to structure/visualize/wrap its content. If it is similar in anyway to another block in the lesson or in your memory, you must defend why.

## [I/O]
Inputs - ORDERED BY PRECEDENCE **Withhold others**:
	1) (<TRACK>-ROADMAP.md [#]) section and its contents, never the whole file, and never another lesson's range: this entry is the roadmap that the lesson's contents will be built from. Coverage ≠ section plan: a roadmap item doesn't get its own h2 unless it earns one.
	2) <TRACK>-REGISTER.md contains the [PERSONA] of the STUDENT and guides details of the language being taught The same voice - or its context-dependent alternative registers - is used for the prose of all parts of the lessons, and plays a key role in defining which contexts and scenarios the lessons use to present the roadmap concepts and items. The primary register of the lesson is the linguistic shape which is trained and produced by the student, taking precedence over 'book' shapes.
	3) `node qa/brief.mjs --index=raw`
	4) FUNCTION.md [CONTENT] - Only within this section if needed 
	5) (<TRACK>-ROADMAP.md '##' HEADERS ONLY) - Reference **only to reduce redundancy with other lessons**.
	6) `node qa/brief.mjs --css` - Headers ONLY, each with its line number for Styling & formatting implementation only (eg. which class or knob does what).
	- As-Needed: - qa/AUDIO.md  (fetch/cut/include music/audio).


## [LEVEL] - Prosem teaching, and training - activities, prompts, quizzes, etc.. are authored at a difficulty level which is accessible but mildly challenging for the student who has arrived to that lesson.
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


**Output** = `<track>/lesson<N>-<Title>.html`, 