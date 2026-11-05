# HARNESS — binding contract. RE-READ ON EVERY PROMPT, before any other action.
This file is the single read-first hub after RULE 0 is read from the global rules.
It is always in force and adherence is non-negotiable
The category files (PARKED / HANDOFF / ISSUES / FORMAT / FUNCTION / PEDAGOGY / VOCABULARY / STATUS / VERIFICATION / FILESYSTEM) hold the parameters of elements and functionality and are loaded only when they are in scope for the current task.

## RULE 1 — CONTEXT & TOKEN ECONOMY

    a) Trim/ignore all context which you are certain is (stale, inaccurate, conflicting, and irrelevant) as you find it
    b) Never skip a needed read, shorten reasoning, or attempt to save tokens if it risks degrading task performance
	c) **Reading large files (truncation).** A single read of a large file can come back MIDDLE-TRUNCATED (an elided span marked `[truncated N chars]`) - if it does, you must: 
		- Page through the file in bounded chunks with `start_line`/`end_line` (keep each chunk well under ~6000 characters — dense files like FUNCTION.md need ~15–20 line chunks) until the full file is read, then re-read the full file before relying on it.

        ### Priorities are (ordered by importance):
    - Detection and reporting of conflicts, rule failures, misunderstanding, or context drift which threaten subsequent priorities
    - Task sanity, context clarity
    - Guideline and Rule adherence,
    - Holistic Understanding
    - Logic and Objective Correctness
    - Systemic Efficiency - Maximise utility and versatility of project elements, avoid bloat/redundancy/overlap
    - Token thrift is only a tie-breaker between two approaches that are equally correct and equally clear — never a goal in itself.



## RULE 2 — VERIFY WHAT NEEDS VERIFYING
- Verification (QA run, curl, node --check, reading back a diff) is done only when [defensibly mandatory to the step] AND/OR [After user instruction/sign-off] — not as a mandated step after edits/generations. 
- Trivial/doc-only/comment changes don't need proof-pasting. 
- Use discretion on QA depth and scope, be conservative. When scope is most or all live pages, pick a few with defensible relevance to test/verify. Request user sign-off before [sweeping the rest only if defensibly necessary].
- For user instructions that involve assessing a 'visual' or 'space fill' issue, run the real-browser overflow/balloon check — jsdom cannot see layout. 
- Never state something is verified if it wasn't.
- "Done" means committed and pushed, with whatever verification I judged necessary per this rule. For any changes that are not pushed, user must be notified.


## RULE 3 — COMMIT & PUSH
- Requested changes are committed and pushed after execution (and QA green where applicable) by DEFAULT. Overrides that justify NOT committing/pushing: (a) prompt intent, (b) a strong defensible reason (confer with user), or (c) an unresolved question/conflict in the step.
- Avoid rapid successive pushes when a single combined push would do. Build markers / live-site curl / fixed sleeps are tools I reach for when I judge that the risk of an undetected deploy problem is real, not mandatory steps after every push.


## RULE 4 — PRESERVE WORKING CODE
	a) Do not modify rules/guidance/spec documents in any way without explicit instructions or consent according to the following:
		- "Can X do Y?" or similar phrasing is not an instruction
		- When instructed to make a behavior change that involves substantially (more than 2 lines) altering a guideline file, present your plan to the user and request sign-off.
		- Prioritise "do not degrade existing behaviour"
		- Always update or verify affected paths/routing (between guideline files, not lesson files) when making changes that may effect them
		- Minimize verbosity, overlap, and excessive specificity wherever/whenever possible. No silent changes, no silent decision not to act, when any doubt exists, confer with user.


## TOOL / TERMINAL PARAMETERS
The shell reports the true exit code (`$LASTEXITCODE`); Cline's capture of it does not — it often misreports a succeeded command as code 1, so work WITH that:
- Judge a call by its printed output, never the reported exit code.
- When the exit code matters, print it in the command: `& node qa/content.mjs; 'EXIT=' + $LASTEXITCODE`.
- A captured chunk may open with a leaked terminal-title escape, and when capture fails it falls back to raw scrollback — keep commands short (reliability, not tokens) and re-run rather than trust a torn buffer.
- Non-ASCII can arrive as mojibake — confirm with an ASCII marker (`Write-Output 'MARKER_OK'`) and read files via `read_files`/`search_codebase`, not shell echo.
- NEVER run a bare `exit` / `exit <n>` (it closes the terminal); print the value or `throw` instead.
- A session may be logged `status: failed` / `exit_code 1` after a real success — that log status is noise.


## STATUS
Status lives in dedicated files: the backlog in PARKED.md, bugs/problems in ISSUES.md, handoffs in HANDOFF.md, and current state + shared parameter values in STATUS.md. Nothing is cleared anywhere until it is done AND committed.

**Handoff content.** Handoff information is included only when explicitly requested, or when a "new/next task" is unambiguously implied by the user. Then include an optimally-concise version of the requested information and/or an optimally-concise version of the information the next task MUST have in order to achieve the next task intent/goals — nothing else.