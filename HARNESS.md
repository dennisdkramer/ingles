# HARNESS — binding contract. RE-READ ON EVERY PROMPT, before any other action.
This file is the single read-first hub. It is always in force and adherence is mandatory unless user prompt explicitly overrides
The category files (PENDING / PARKED / HANDOFF / ISSUES / FORMAT / FUNCTION / CONTENT / PEDAGOGY / VOCABULARY / STATUS / VERIFICATION / FILESYSTEM) hold the parameters of elements and functionality and are loaded only when they are in scope for the current task.

## RULE 1 — CONTEXT & TOKEN ECONOMY
Never trim context, skip a needed read, shorten reasoning, or shrink an edit to save tokens if doing so will degrade results.
Token thrift is only a tie-breaker between two approaches that are equally correct and equally clear — never a goal in itself.
**Reading large files (truncation).** A single read of a large file can come back MIDDLE-TRUNCATED (an elided span marked `[truncated N chars]`). Never trust a truncated read: page through the file in bounded chunks with `start_line`/`end_line` (keep each chunk well under ~6000 characters — dense files like FUNCTION.md need ~15–20 line chunks), and re-read any span that came back with a `[truncated …]` marker before relying on it.


## RULE 2 — PROMPT PARSING AND TASK BATCHING
Full initiative applies to ANALYSIS, PLANNING, and CONTENT GENERATION. Initiative in inference/bypassing uncertainty is low and must not conflict with any rules, specs, or guidelines.
Step 1 of task execution is to analyse the goals and elements of the user prompt.  Carefully parse language considering task context. If prompt instructs or requires a condition, makes a specific request, or sequences steps, these elements must be strictly followed. If scope of prompt relates to a file during parsing, pause parsing and load that file, then continue as appropriate.
If uncertainty or conflict arise during parsing, if parsed intent us unclear, or if parsed intent conflicts in any way with any guidance, spec, or existing content, execute extremely limited attempts to reconcile. If reconciliation fails or is incomplete, pause processing and check in.
After successful prompt parse and intent synthesis, identify any cases of the following:
- Explicit Requests and their connected details
- High-Confidence Implicit or Question-formatted Instructions - linguistic and contextual certainty required, else re-classify below
- Questions to be answered (assess and answer, never consider as an instruction)
- Examples, facts, issues, behavior, or rhetorical questions which point to principles or intent 
- Planning dialog, discussion, and clarifications

 Next, make a high-level judgement call: In which order or  batches must, will, or should the prompt  be addressed? Elements or batches be parked in PENDING.md to simpify active step as necessary.

After that, define scope of current step and interact with/read files as necessary.

File purpose and content as follows:
- Deferred / parked / plans and tasks → PARKED.md
- Context handoffs between sessions → HANDOFF.md
- Parked Bugs/Issues/problems → ISSUES.md
- Behaviour / functionality / engines / backend / edit mode → FUNCTION.md
- Site structure & formatting (structure, layout, HTML/CSS, section/block formatting) → FORMAT.md
- Instructions for content storage, structure and generation → CONTENT.md
- Teaching-side structure and rationale → PEDAGOGY.md (WHAT content to teach and how it is ordered within and between lessons)
- Dictionary and linguistic mapping → VOCABULARY.md
- Current state & shared parameter values → STATUS.md
- How to verify / QA → VERIFICATION.md
- Repository layout / file map → FILESYSTEM.md
- Lesson Pages (HTML) hold prose

When RESUMING (prior-task) work from these files, begin by sanity-checking relevance to current project state and lack of conflict before acting.
When uncertainty or conflict arises during step execution, try quantitatively limited but thoughtful attempts to reconcile. If reconciliation fails or is incomplete, pause processing and check in.


## RULE 3 — VERIFY WHAT NEEDS VERIFYING
Verification (QA run, curl, node --check, reading back a diff) is done when I judge it adds real
confidence — not as a mandated step after every micro-edit. Trivial/doc-only/comment changes don't
need proof-pasting. Logic changes to engine1.js/engine2.js/backend should get at least one real
check (QA and/or a reasoned read-through) before I call them done, at my discretion on depth.
Verification or QA scoped to only what changed
A single lesson HTML change → `node qa/content.mjs <n>` and `node qa/overflow.mjs <n>` (both take one or more lesson numbers, e.g. `node qa/content.mjs 5`; with no numbers they sweep 1–34). A shared-file change (engine1.js, engine2.js, style.css, backend/Code.gs) MAY affect every lesson — but run the FULL un-scoped sweep ONLY when explicitly asked, or inferred from the task context with overwhelming certainty. A shared-file change that merely ADDS a new rule/class used by a single lesson (e.g. a new CSS class) is scoped to that lesson, not swept. For the affected kind: structure `qa/content.mjs <n>`, layout `qa/overflow.mjs <n>`, engine `qa/smoke.mjs`. Content/layout changes (lesson HTML, style.css) 
MUST run the real-browser overflow/balloon check — jsdom cannot see layout. 
Never state something is verified if it wasn't; if I skipped verification, say so plainly
"Done" means committed and pushed, with whatever verification I judged necessary per this rule


## RULE 4 — COMMIT & PUSH
Requested changes are committed and pushed when done by DEFAULT. Overrides that justify NOT committing/pushing: (a) prompt intent, (b) a defensible reason not to, or (c) an unresolved question/conflict in the step
Avoid rapid successive pushes when a single combined push would do. Build markers / live-site curl / fixed sleeps
are tools I reach for when I judge the risk of an undetected deploy problem is real, not a mandatory step after every push.


## RULE 5 — PRESERVE WORKING CODE, BUT IT IS NOT OFF-LIMITS
Avoid touching code within or connected to existing functions unless defensibly necessary - prioritise "do not degrade existing behaviour", and update or verify affected paths/routing. 


## RULE 6 — PRONUNCIATION KEY PURPOSE (why this exists)
Every pronunciation-key decision serves ONE goal: a visual accompaniment to text-based lessons that lets beginner Brazilian students SEE why pronunciations, rhythms, and reductions happen — and build intuition for English that feels opaque or random. Judge every parsing choice (syllable breaks, stress, consonant clusters) by one test: does it teach the correct RHYTHM to a Brazilian beginner? Keep consonant clusters whole as onsets so students learn to "mash" them; split at true word/compound boundaries; in "both-ways" cases pick the break that teaches rhythm. The conventions in PEDAGOGY.md "next steps" are the durable guardrails — intuition is the engine.

## TOOL / TERMINAL PARAMETERS
The shell reports the true exit code (`$LASTEXITCODE`); Cline's capture of it does not — it often misreports a succeeded command as code 1, so work WITH that:
- Judge a call by its printed output, never the reported exit code.
- When the exit code matters, print it in the command: `& node qa/smoke.mjs; 'EXIT=' + $LASTEXITCODE`.
- A captured chunk may open with a leaked terminal-title escape, and when capture fails it falls back to raw scrollback — keep commands short (reliability, not tokens) and re-run rather than trust a torn buffer.
- Non-ASCII can arrive as mojibake — confirm with an ASCII marker (`Write-Output 'MARKER_OK'`) and read files via `read_files`/`search_codebase`, not shell echo.
- NEVER run a bare `exit` / `exit <n>` (it closes the terminal); print the value or `throw` instead.
- A session may be logged `status: failed` / `exit_code 1` after a real success — that log status is noise.


## STATUS
Status lives in dedicated files: the ACTIVE plan in PENDING.md, the backlog in PARKED.md, bugs/problems in ISSUES.md, handoffs in HANDOFF.md, and current state + shared parameter values in STATUS.md. Nothing is cleared anywhere until it is done AND committed.
