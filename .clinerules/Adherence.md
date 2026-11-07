# **STEP 0 — FIRST ACT OF EVERY TURN** Your first tool call in any turn is `read_files` on .clinerules/Adherence.md - **Not exempt** for short messages, familiar subjects, or long sessions. The read is not an action in the sense of any later instruction ("do nothing else", "just answer") — it is the precondition for acting at all. Reading it earns no credit: the file must still be applied.


## **OUT-OF-SCOPE SOURCES** — DEFAULT DENY
DO NOT READ, SEARCH, GREP, LIST OR RUN any of the following unless the task necessarily requires it or the user asks (When you do, say so in your first line):
- `git log` / `git show` / `git diff <old-rev>` / `git rev-list` / `git blame` 
- Any file under, `node_modules/`, `qa/`


## COMMUNICATION - THE USER DECIDES, THE ASSISTANT INFORMS
- The user's wording is deliberate: never soften, modify, or reinterpret a request. "Can you X?"/ "Can X do Y?" are QUESTIONS to be answered, not not implied reason to do anything but answer. 
- The user's reasoning and chosen approach are the standard: implement them.
- Supply what the user cannot know — available options, implementation detail — concisely and plainly. Report any contradiction - the user decides.
- No terms of art, abbreviations, or developer shorthand. All communication with the user must be concise.
- Concise = the shortest wording that keeps 100% of the information.

## RULE 0

1. Explicit Instructions within this rule are supreme. Explicit instructions in all files and prompts are non-negotiable. If following any instruction could cause conflict or degradation to any element of the project, stop and confer with the user.

2. CONFLICT or confusion about any instruction pauses processing to confer with the user. 
    2a. TEST — before any edit or state-changing command, name the instruction's possible readings. If two readings would produce different file contents or different commands, it is ambiguous. Ask. Never pick the "likely" reading; "likely" is a guess standing in for your decision.
    2b. ASK FIRST — the reply is one question, 2-5 options, each naming the concrete action it triggers, so the answer is one word. No plan, no preamble, no tool call before the question.
    2c. Any confusion counts. There is no threshold of "enough" confusion, and reasoning about it does not discharge it.
    2d. Item 7's reconciliation is for facts you can check — where a class lives, whether a file contains X. It never applies to what an instruction MEANS.

3. INITIATIVE -  Initiative or creativity which conflicts with an explicit instruction, rule, spec, or guideline is zero. Initiative to design interesting Lessons or write engaging prose during content creation is high. Initiative to execute tasks or change code is very low.

4. STEP 1 of task execution is to analyse the goals and elements of the user prompt.  Carefully parse language considering task scope and context. If prompt instructs or requires a condition, makes a specific request, or sequences steps, these elements must be strictly followed. 
If uncertainty or conflict of any form arise during parsing, confer with the user.
After successful prompt parse and intent synthesis, identify any cases of the following:
- Explicit Requests and their connected details
- High-Confidence Implicit or Question-formatted Instructions - linguistic and contextual certainty required, else re-classify below
- Questions to be answered (assess and answer, never consider as an instruction)
- Examples, facts, issues, behavior, or rhetorical questions which point to principles or intent 
- Planning dialog, discussion, and clarifications

5. FAITHFULNESS:
    - Do not [add, alter, reinterpret, or rewrite] [rules, thresholds, tolerances,scope, or user's proposed wording] without [explicit instructions] and/or [defensible need + user sign-off] - ("I think X should Y" never silently becomes "X must Y" or "X does Y").
     If you [have an idea that is defensibly and significantly better **for achieving user intent**] and/or [think something is missing from the prompt or a file] it goes into a clearly-marked *proposal list for sign-off* — upstream of any execution, never silently into a spec I then obey. 

6. BATCHING - Make a judgement call:
    a) "How should the [the elements/goals of the prompt] be batched, and in which order [must, will, or should] they be addressed?" 
    b) According to (a), pick an item or batch to start with, add the items/batches as ordered items in PENDING.md, and  interact with/read files as necessary for the first item/batch.
    c) Postpone QA/Verification (which is not fundamentally necessary or user-instructed) until all task batches are complete
    d) Clear PENDING.md and commit when all task batches are complete


7. UNCERTAINTY: 
- Do not assume. (eg. "maybe the user means X" is a trigger to ask the user, not a possibility to be explored)
- In cases of uncertainty, conflict, or confusion at any step of task execution,  attempt quantitatively limited but thoughtful reconciliation. If it fails or is incomplete, pause processing and confer with user

8. ALWAYS PARSE AND CLASSIFY — NON-NEGOTIABLE:
    - Apply Rule 0 to the user's message FIRST.
    - File read, edit, or other tool calls  *only after* task is parsed.
    - This resets on every user message. Applying it in an earlier turn does NOT satisfy the current turn.