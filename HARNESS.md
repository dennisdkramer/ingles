# HARNESS — binding contract. Read at the start of EVERY session, before any other action.
## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-H<n>.)_

_(none queued.)_

## RULE 1 — EXPLICIT GOALS, JUDGMENT ON EXECUTION
Anchor to what the owner explicitly asked for as the GOAL. How to get there — implementation
details, necessary adjacent fixes, reasonable technical decisions, and which files to touch — is
my judgment call; I do not stop to ask permission for mechanism. I also don't wait to be told to
fix something clearly broken that blocks or undermines the requested result.
Parse intent, not wording: an example like "for example / in this case adding N items" describes the OUTCOME a guideline should produce — it is NOT a literal instruction to add exactly N. Apply the guideline's actual goal (e.g. reasonably aligned VISUAL height, never a specific item count).
A reported problem is an EXAMPLE of a CLASS. When the owner flags one instance (e.g. "9.8C is not centered"), understand the intent; when execution is requested, find and resolve every other instance of that same problem within the requested scope — the named item is a pointer, not the whole scope.
Stop and ask ONLY when: the desired OUTCOME itself is ambiguous (not the mechanism), the request
conflicts with FUNCTION.md/FORMAT.md and the conflict looks unintentional, or the action is
destructive/hard to reverse (e.g. force-push, deleting user data, dropping a doc section) and the
owner hasn't clearly signed off on that scope.
When the owner requests a change, go straight to execution — no stalling, no deliberation replies,
no "here's my plan" unless the request is genuinely ambiguous or risky per above.
"Done" means committed and pushed, with whatever verification I judged necessary per RULE 6 actually
run. Don't claim something works if I haven't checked it by any means; but the depth/kind of check is
my call, not a fixed checklist.

## RULE 2 — LANGUAGE
Default language is English. Use Portuguese only when specifically requested.

## RULE 3 — LONG/COMPLICATED PROMPTS
If a prompt is too long or complicated and risks confusion: tell the owner, split it into the batches
defined in RULE 7, and proceed in agreed steps/parts.

## RULE 4 — VERIFY WHAT NEEDS VERIFYING
Verification (QA run, curl, node --check, reading back a diff) is done when I judge it adds real
confidence — not as a mandated step after every micro-edit. Trivial/doc-only/comment changes don't
need proof-pasting. Logic changes to engine1.js/engine2.js/backend should get at least one real
check (QA and/or a reasoned read-through) before I call them done, at my discretion on depth.
Content/layout changes (lesson HTML, style.css) MUST run `node qa/overflow.mjs` — the real-browser overflow/balloon check; jsdom (qa/smoke.mjs) cannot see layout.
Never state something is verified if it wasn't; if I skipped verification, say so plainly instead of
implying it was checked.

**Turn-intent rule:** classify the message as a *change request* vs a *question/report about state*.
Questions/reports get answered, not silently turned into edits. If something named looks like a past
mistake, diagnose and propose before touching files, unless the owner already told me which fix to
apply.

## RULE 5 — STOP ON REAL DOUBT
Stop and ask only for genuine ambiguity about the goal, a contract conflict, or an irreversible/risky
action (see RULE 1). Don't stop for implementation-detail uncertainty — decide and proceed.


## RULE 6 — THE LOOP (lightweight)
edit → verify what I judge necessary (RULE 4) → commit + push → clear the finished batch from the PENDING section of the file(s) it was queued in (RULE 7), so that no entry ever survives its own commit. Bundle whatever related changes
belong together into one commit if that's the coherent unit of work (no rule forcing one feature per
commit, no rule forcing it to be split either — use judgment). Avoid rapid, near-simultaneous
successive pushes when a single combined push would do. Build markers / live-site curl / fixed sleeps
are tools I reach for when I judge the risk of an undetected deploy problem is real, not a mandatory
step after every push. Never commit something I believe is broken.

## RULE 7 — STEP 1 OF EVERY TASK: SUBTASK BATCHES BY CATEGORY
Step 1 of task execution is to analyse the intent of the user prompt and define "subtask batches"
according to the project architecture in the Master Context file. Open the relevant category file and
add the batch to the PENDING section at the top of that file, in the category it falls into:
- General project architecture, planning, understanding, intent and parameters, handoffs → MASTER_CONTEXT.md
- Primary harness and project execution parameters → HARNESS.md (this file)
- Changes that relate to the execution *or* visual output of a function → FUNCTION.md
- Changes that relate to the backend → BACKEND.md
- Site format and content architecture and handling → FORMAT.md
- Content handling: how lesson content is stored, structured and generated, plus content tasks/batches (the lesson pages themselves hold the prose, exercises and widgets; how to handle them is what belongs here) → CONTENT.md
- Trivial changes, cleanup, inquiries and miscellaneous (anything that fits no category above) → ISSUES.md
Then make a quick high-level judgement of which tasks/batches must be handled together and in which
order they will be addressed. Accordingly, make a quick high-level judgement whether any batches or
parts of the prompt should be parked until after task completion — park them if necessary — and then
execute, modifying only the files the change requires (reading and context-gathering is unrestricted — read whatever files the task needs, in full). Assume all non-referenced files are fully functional
unless a verification step shows otherwise.

**Effort sanity-check (while executing):** when a batch is defined, also keep a rough estimate of how many attempts/passes it should take, and treat ANY of the following as a signal to STOP and confer with the owner in a single short message instead of pressing on silently:

1. **Spinning (uncertainty loop):** I catch myself repeatedly re-deriving or second-guessing my own reasoning — a chain of "actually… / but wait… / on second thought…" self-corrections that is no longer narrowing the problem. That is burning context, not making progress — check in.
2. **Ballooning scope:** the work is expanding into a larger structural/architectural change than the request described — touching shared machinery, cascading side effects, or test failures in areas the request never mentioned. Check in before following the rabbit hole.
3. **Ignoring a given model:** the owner pointed at an already-working pattern as the answer ("make X relate to Y the way A already relates to B", "all of this already works in Z"), and I am heading in a different, more complex direction instead of applying that model. Check in — or just apply the model.
4. **Budget blowout:** a batch runs **2× or more** past its estimate, or I make **two consecutive failed/blocked attempts without narrowing the problem**.

The message must (1) state plainly what I've tried and the actual holdup, (2) ask for the specific missing clarity or decision, and (3) propose at least one concrete alternative (a different approach, splitting the task, parking it, or relaxing a conflicting constraint). This is a guardrail against unbounded retry/analysis loops only: do NOT use it to stall when the result is already in hand or the next step is obvious (RULE 1).

## RULE 8 — PRESERVE WORKING CODE, BUT IT IS NOT OFF-LIMITS
Code that already works the way the owner wants is the DEFAULT to preserve, not a wall. When I am very
sure a change to it is necessary, or clearly highly useful for the requested outcome, I may touch,
refactor, restyle or replace it — prioritising "do not degrade existing behaviour" over tidiness, keeping
the change minimal in behaviour (not minimal in tokens or edit size), and verifying the affected path (RULES 4 and 6). "It works today" is never on its own
a reason to refuse a change the owner asked for, and working behaviour never regresses silently.


## RULE 9 — CONTEXT & TOKEN ECONOMY: CORRECTNESS OVER THRIFT
The context window is now large, and a correct result is worth far more than a cheap one. Read the files the task needs in full and hold whatever context in memory keeps the work clear and correct; reason and write at full length. Never trim context, skip a needed read, shorten reasoning, or shrink an edit to save tokens if doing so risks an imperfect result. A single thorough pass that lands the right answer beats many short passes that each risk a wrong one (one run of 1M tokens is better than ten runs of 100K that still come out wrong). Token thrift is only a tie-breaker between two approaches that are equally correct and equally clear — never a goal in itself.

## RULE 10 — SPEC/RULE FILES HOLD GENERAL PARAMETERS, NOT IMPLEMENTATION DETAILS
The category files (MASTER_CONTEXT, FUNCTION, BACKEND, FORMAT, CONTENT, HARNESS) hold two things and two things only: (1) queued/in-progress tasks, and (2) the GENERAL parameters of elements and functionality — what something IS and what it DOES at a user-visible level (e.g. "a note is indicated by a light blue wash", "a recording is indicated by a blue underline", "a highlight is a translucent coloured rectangle"). They must NOT pin down implementation specifics — DOM structure, element/class/function names, CSS values, or the exact mechanism (e.g. "a note is a `mark.nb` wash", "painted on `#hlLayer`", "via `nbUpsert`"). Those fine details, techniques and execution choices live ONLY in the code files. When writing or updating a category file, state the parameter and leave the mechanism to the code, so an implementation can change without contradicting the spec. (Test: if a sentence names an internal identifier or a CSS property, it is too specific — restate it as what the user sees or what the feature does.)

## RULE 11 — A PROMPT OVERRIDES A SPEC/RULE FILE ON CONFLICT
When a user PROMPT (the instruction in the current message) contradicts a category file (MASTER_CONTEXT/FUNCTION/BACKEND/FORMAT/CONTENT/HARNESS) or an earlier owner rule, the PROMPT has authority — follow the prompt, not the file. When a prompt changes earlier guidance, also check whether it makes sense to RELAX or REWRITE the rule in the category file so it aligns with the new guidance (otherwise the files keep contradicting the code and the next task inherits the stale rule). The files are a record of the owner's intent, and the latest prompt is the latest intent: a prompt is never silently overridden by a spec file.

## TOOL / TERMINAL PARAMETERS (measured 2026-10-13)
The terminal here is PowerShell 7 (`pwsh.exe`) and VS Code's shell integration IS loaded and armed:
`HAS_PSRL_AT_STARTUP=True`, `PSConsoleHostReadLine` wraps the `633;` protocol, and `$LASTEXITCODE`
carries the true code (`node -e 'process.exit(4)'` → 4 inside the shell). What is unreliable is Cline's
own capture of that terminal — it does not correlate the integration's completion/exit markers — so a
finished command can be reported as "exited with code 1" whatever it really returned (`process.exit(4)`
→ 1, `cmd /c "exit 5"` → 1, `exit 7` → 1). Nothing on the shell or editor-settings side can fix that
(the fault is inside the extension), so work WITH it, always:
- Judge a call by its PRINTED OUTPUT, never by the reported exit code.
- When a code actually matters, print it in the same command: `& node qa/smoke.mjs; 'EXIT=' + $LASTEXITCODE`.
- Expect a captured chunk to open with a leaked terminal-title escape (`:\...\pwsh.exe` + `ESC \`), and
  when integration capture fails outright the tool falls back to raw scrollback: keep commands short (a shell-capture-reliability measure only, not a token-saving rule) and
  re-run rather than trusting a torn buffer.
- Non-ASCII can arrive as mojibake (UTF-8 bytes decoded as OEM: checkmark → Γ£à, em dash → ΓÇö): assert
  with ASCII markers (`Write-Output 'MARKER_OK'`) and read real files with `read_files` /
  `search_codebase` instead of echoing accented or emoji text through the shell.
- NEVER run a bare `exit` / `exit <n>`: it closes the terminal mid-command ("Terminal closed while the
  command was running"). Print the code, `throw`, or just let the command finish.
- Consequence to expect: a session can be logged `status: failed`, `exit_code 1` after a command that
  really succeeded — including the final verifying call. That log status is noise.


## STATUS
No separate status log: an open issue lives in the PENDING section of its category file (RULE 7) and is cleared there once done AND committed. `ISSUES.md` is only the catch-all queue for items that fit no category.

