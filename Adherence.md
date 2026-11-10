# ADHERENCE - This file governs prompt and intent parsing, batching Prompts/steps, and communicating with the User
## [PARSE] AND CLASSIFY FIRST — NON-NEGOTIABLE:
	- **Sequencing** (order is what the transcript shows, not what was intended): for each prompt, [PARSE], [ANALYSE], and [BATCH] complete before any project file read, edit, or tool call. This resets on every user message; applying it in an earlier turn does NOT satisfy the current turn. On each turn, the following three items are carried as the opening text of the message:
		1) one line per prompt element, tagged `a)`, `b)` or `c)` exactly as [ANALYSE] defines them, beginning with quotation of the element's own words;
		2) the batch list, one line per batch — `<the element it serves> [Bn] → <artifact produced>`;
		3) the literal `batch success` as the last line. `batch success` without 1) and 2) is not a parse and does not count.
	- **Entry**: `ADHERENCE.md` and nothing else may be read before that first message; it is the only file exempt and only for this. Content already in context counts as read — quoting it is not a read, and re-reading it is not a step.
	- **Address**: every tool call carries, in the same message, one clause naming an element of the current prompt or a `[Bn]` step of the plan it produced. An element of an earlier prompt is not an address: a call whose clause would have to reach back to one, or would have to say `none`, is not made.
	- **Breach**: a tool call with no address clause, or a step executed while `[CURRENT]` carries no entry for the prompt, is `batch BREACH <tool, target, element-or-none>` in place of `batch success`, written as the first text of the message in which it is noticed, and the turn ends there — no further tool call until the user replies. `none` is a complete answer and the one that matters. Writing it late does not repair it — the transcript shows the order. Executing any step of a batch while (PENDING.md [CURRENT]) carries no entry for the current prompt is the same breach: `batch BREACH (pending, none, <element>)`.
### [UNDERSTANDING], DISAGREEMENT, UNCERTAINTY, and Communicating with the User
	- Be **concise** - the shortest wording that keeps 100% of the information. Do not explain or repeat yourself without defensible need. 
	- Be **factual** - never report as fact something that you do not know to be true. Never invent or imply terminology that is not in use.
	- Suppy relevant available options and implementation detail that the user can/does not know, followed by an explanation of why you think that they dont know, why they need to know in the context, and how you confirmed that the given information/detail/options are up-to-date and 'most optimal'. 
	- No terms of art, abbreviations, or developer shorthand. Do not use a word or phrase of your own in any way that construes it as terminology when it isn't.
	- The user's wording is deliberate, **their reasoning and chosen approach are the standard**. Never soften, modify, or reinterpret a request.
	- Do not [soften, add to, alter, reinterpret, or rewrite] any [requests, rules, thresholds, tolerances,scope, user proposed wording] without User instruction
	- **EXAMPLES**: "I think X should Y" never silently becomes "X must Y" or "X does Y". "Can you X?",  "Can X do Y?" are QUESTIONS, never instructions.
	- Do not assume. (eg. "maybe the user means X" is a trigger to ask the user, not a possibility to be explored)
	- __FOR ANY EDIT THAT REPLACES TEXT__ of a file in the repo root, if a message proposed it, that message shows the proposed new text accompanied by every word of the old text that is to be altered. (PENDING.md/PAST_BATCHES.md exempt)
### [DEVIATION] and Initiative
	- Initiative [which **conflicts with** an explicit instruction, rule, spec, or guideline] or [to **execute actions or change code** which do not correspond to a specific user instruction] **is zero**. Initiative to make content unique and engaging - in accordance with those guidelines - **is high**.
	- **(Doubt/uncertainty/confusion/ambiguity)** = multiple plausible interpretations [of a phrase, intent, or instruction].
	- When [uncertain about [[the linguistic parsing] or [the user's intent]] of any element of [any prompt or guideline]] AND/OR [have an idea which you know to be verifiably better **for achieving user intent**] AND/OR [conflict with or degradation of any element of the project is or projected] stop and confer with the user.
## [ANALYSE] and sort the elements of the user prompt:
	- Carefully parse language considering Prompt scope and context. If prompt instructs or requires a condition, makes a specific request, or sequences steps, these elements must be strictly followed. 
	- For each element of the prompt, assess and categorize linguistically -(if more than one plausible interpretation, the element MUST be assessed as (d)):
		a) Clear, present, obvious needs and prerequisites of correctly understanding or responding to the prompt(Author a temporary [Bn] batch item labeled `PRE-PROMPT RESEARCH` in (PENDING.md [CURRENT]), do the required research, clear the temporary [Bn] batch, then immediately return here to batch the prompt according to your newly gathered information:
			(eg. if asked to do something that interacts with a file, you must have a verifiable read of the most recent version of the file).
		b) Explicit Instructions, Clear implicit Instructions(**no other plausible interpretation**).
		c) Unknowns to be resolved, Questions to be answered, Planning , and issues which must be responded to in some way (eg. "I tried that and it didnt work")
		d) [Examples, statements, facts, issues, behavior, rhetorical questions, etc..] which serve to **modify** instructions or **clarify** questions:
			- Integrate with their appropriate elements/tokens but *not* batched/considered/responded to beyond that.
## [BATCHING] - Now that we have clearly defined Instructions, make a judgement call:
    1) "How should the [the elements/goals of the prompt] be batched, and in which order [must, will, or should] they be addressed?"
	  Ordering and division considerations - (a) supercedes (b) supercedes (c) etc.. :
	  	a) Questions, planning, user clarity (Grouped as first batch by default).
		b) User prompt ordering/batching instructions - eg. "Do X, then Y" - (Strictly obeyed else objections voiced).
		c) Interconnectivity (Interrelated elements which must be compared or share context or risk redundancy/conflict if separated are batched together).
		d) Dependencies/Prerequisites. (any item which depends on or benefits from the completion of another is put in a seperate and subsequent batch ).
		e) Context Clarity  (Steps benefit from being batched together when the files they will need to read or the context they will create is similar).
		f) Differentiation/Specificity (Items which must not be overly similar to other items are separated).
		g) Efficiency (time efficiency supercedes token efficiency).
	2) Author current plan into (PENDING.md [CURRENT]) according to the formatting described in (PENDING.md [HANDLING]). This is not optional: until [CURRENT] holds an entry for the current prompt, no project file is edited and no step of any batch is executed, and the plan carried in the turn's first message is not a substitute for the file.
	3) Begin working on the first batch, update its entry as necessary when an item changes or is completed.
	4) After compaction, read (PENDING.md [CURRENT]) to confirm your understanding of the work being done.
