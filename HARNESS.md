# HARNESS — binding contract. RE-READ ON EVERY PROMPT, before any other action.
This file is the single read-first hub after RULE 0 is read from the global rules.
It is always in force and adherence is non-negotiable
The category files (PENDING / PARKED / HANDOFF / ISSUES / FORMAT / FUNCTION / PEDAGOGY / VOCABULARY / STATUS / VERIFICATION / FILESYSTEM) hold the parameters of elements and functionality and are loaded only when they are in scope for the current task.

## RULE 1 — CONTEXT & TOKEN ECONOMY

    - Trim all context which you are certain is (stale, inaccurate, conflicting, and irrelevant) as you find it
    - Any and all other context trim and task compaction must not degrade current task objectives or relevant (non-stale) context
    - Never skip a needed read, shorten reasoning, or attempt to save tokens if it risks degrading task performance

        Priorities are (ordered by importance):
    - Detection and reporting of conflicts, rule failures, misunderstanding, or context drift which threaten subsequent priorities
    - Task sanity, context clarity
    - Guideline and Rule adherence,
    - Holistic Understanding
    - Logic and Objective Correctness
    - Systemic (Files,Project,Platform) Efficiency - Avoid bloat, load times, latency. Maximise utility.  
    - Token thrift is only a tie-breaker between two approaches that are equally correct and equally clear — never a goal in itself.

**Reading large files (truncation).** A single read of a large file can come back MIDDLE-TRUNCATED (an elided span marked `[truncated N chars]`). Never trust a truncated read: page through the file in bounded chunks with `start_line`/`end_line` (keep each chunk well under ~6000 characters — dense files like FUNCTION.md need ~15–20 line chunks), and re-read any span that came back with a `[truncated …]` marker before relying on it.


## RULE 2 — VERIFY WHAT NEEDS VERIFYING
Verification (QA run, curl, node --check, reading back a diff) is done when I judge it adds real
confidence — not as a mandated step after every micro-edit. Trivial/doc-only/comment changes don't
need proof-pasting. Logic changes to engine1.js/engine2.js/backend should get at least one real
check (QA and/or a reasoned read-through) before I call them done, at my discretion on depth.
Verification or QA scoped to only what changed
A single lesson HTML change → `node qa/content.mjs <n>`, `node qa/overflow.mjs <n>` and `node qa/width.mjs <n>` (all three take one or more lesson numbers, e.g. `node qa/content.mjs 5`; with no numbers they sweep every page that exists). A shared-file change (engine1.js, engine2.js, style.css, backend/Code.gs) MAY affect every lesson — but run the FULL un-scoped sweep ONLY when explicitly asked, or inferred from the task context with overwhelming certainty. A shared-file change that merely ADDS a new rule/class used by a single lesson (e.g. a new CSS class) is scoped to that lesson, not swept. For the affected kind: structure `qa/content.mjs <n>`, layout `qa/overflow.mjs <n>`, width slots `qa/width.mjs <n>`, engine `qa/smoke.mjs`. Content/layout changes (lesson HTML, style.css) 
MUST run the real-browser overflow/balloon check — jsdom cannot see layout. 
Never state something is verified if it wasn't; if I skipped verification, say so plainly
"Done" means committed and pushed, with whatever verification I judged necessary per this rule


## RULE 3 — COMMIT & PUSH
Requested changes are committed and pushed when done by DEFAULT. Overrides that justify NOT committing/pushing: (a) prompt intent, (b) a strong defensible reason (confer with user), or (c) an unresolved question/conflict in the step

Avoid rapid successive pushes when a single combined push would do. Build markers / live-site curl / fixed sleeps are tools I reach for when I judge that the risk of an undetected deploy problem is real, not mandatory steps after every push.


## RULE 4 — PRESERVE WORKING CODE
Do not modify rules/guidance/spec documents in any way without explicit instructions or consent. 
Prioritise "do not degrade existing behaviour"
Always update or verify affected paths/routing when making changes that may effect them
Always perform cleanup, minimize verbosity and bloat, and remove conflicts when you encounter opportunities to do so (that you are sure will not degrade any function, break any path, cause any conflict, or change any needed logic) during any task processing step. Opportunities which are encountered but not acted upon must be reported to the user on step completion and recorded as appropriate in the issues file.


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