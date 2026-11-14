# [GENERATION] PROCESS & DEFAULTS (binding) - DO NOT MODIFY WITHOUT USER SIGN-OFF
1. No lesson page or content vehicle from **this or any other page** may be inherited, referenced, or copied. - 
2. For each section of every page in a lesson generation task, after its content is generated, when its shape is chosen - append into PAST_BATCHES.md an affirmation that you chose the shape independently, that it does NOT copy or repeat the prior section or lesson's shape (if it does, you must defend why), and your reasoning for why it is the best way to present that part of the lesson's content.

## [I/O]
- MANDATORY Inputs - **Reading order is the sequence printed below; PRECEDENCE IS NUMERICAL ORDER, this file is #3 in that order**:
	
	1) (<TRACK>-ROADMAP.md [#]) section and its contents, never the whole file, and never another lesson's range: this entry is the roadmap that the lesson's contents will be built from. Coverage ≠ section plan: a roadmap item doesn't get its own h2 unless it earns one.
	5) (<TRACK>-ROADMAP.md '##' HEADERS ONLY) - Reference **only to reduce redundancy with other lessons**.
	4) FUNCTION.md [CONTENT] - Only within this section if needed 
	2) <TRACK>-REGISTER.md contains the [PERSONA] of the STUDENT and guides the content and tone of the lessons along with the roadmap.
	6) `node qa/brief.mjs --css` - Headers ONLY, each with its line number for Styling & formatting implementation only (eg. which class or knob does what).
	
- As-Needed Inputs (**Withhold all other files**):
	- qa/AUDIO.md - When the lesson wants to include music/audio.

- **Output** = `<track>/lesson<N>-<Title>.html`, 

## [BUILD] SHAPE
Consider:
  a) Can the concepts be grouped or categorized to optimize understanding?
  b) To what extent and in what combination does student success depend on [understanding [a concept] or [translation mapping]], [training and getting accustomed to its use], or [memorization]?
  c) Is this lesson/section/block a good opportunity to [introduce, compare, or make note of] any [synonyms, antonyms, homophones, homographs, false cognates, relevant idioms/expressions, etc.]?
  d) Considering (a), (b), and (c), what is the best way to organize, display, and teach these items?

## [PORTUGUESE] Quantity decreases as student english level increases **HIGH PRIORITY**
- Portuguese is used to explain content or give translations when the necessary information in english would not be well understood by the student at the level of the lesson that contains it. 


## [LEVEL] - Prosem teaching, and training - activities, prompts, quizzes, etc.. are authored at a difficulty level which is accessible but mildly challenging for the student who has arrived to that lesson.
- "STUDENT LEVEL" is assumed and relative to [Current Lesson #] and the english concepts and vocabulary they have learned in the course up to that point.
- **Ability grows with the lesson number** Lesson 1 assumes the student knows no english. By lesson 50 the student should have achieved functional fluency.
- **What maps directly onto Portuguese is cheap; what maps onto it and misleads is expensive; what has no counterpart is built from nothing. Frequency says nothing here: "descend" is cheaper than "go down" although it is the rarer word. Present perfect costs this student more than the past perfect although it costs a native speaker less — the mapping breaks in one and holds in the other.
- **Sentence complexity is what the sentence asks the reader to hold at once**: a clause inside a clause, a tense that changes mid-sentence, a reference the reader carries to the end, a form whose Portuguese counterpart does not match.
- **Importance can outrank level.** A concept the track cannot do without belongs in the lesson that needs it even when it is expensive, and then the support around it grows — more teaching before the item, more training after it — the item is not lowered and the level is not moved.

## [AUTHORING]
- Every (new word/form/concept) the student must understand is presented before it is used; if a block wants the student to *infer*, the page says so. An item never requests a judgement on an axis the page didn't define prior to the item, and no 'terminology' is used to categorize or describe linguistic concepts or classes if it is not verifiably in real-world use.
- No copy-exercises: the student produces from memory or meaning, never transcribes the prompt.
- Teach the rule, the reasoning (the mental model), and its direct consequences.
- Multiple-choice options are shuffled so the right one is not always in the same slot.
- Activity answer options match the lesson in concept and the [LEVEL] in length and linguistic complexity.
- For any adjascent columns or containers, their contents should be authored with similar heights, adding more to the shorter and never subtracting from the taller.
- A block's size follows the content it has been chosen for, never anticipates it. The block takes the narrowest slot the content fills — its width steps up one slot only when a structural element stops fitting — prose wraps, so prose never widens a block. → (style.css `/* ## BLOCK WIDTHS`)

