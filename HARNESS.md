# HARNESS — binding contract. RE-READ ON EVERY PROMPT, before any other action.
This file is always in force and is the single read-first hub. The category files (PENDING / PARKED / HANDOFF / ISSUES / FORMAT / FUNCTION / CONTENT / PEDAGOGY / VOCABULARY / STATUS / VERIFICATION / FILESYSTEM) are loaded only when the prompt's intent makes them relevant — re-reading them on demand is what keeps each prompt from pulling in irrelevant rules.
## RULE 1 — EXPLICIT GOALS, JUDGMENT ON EXECUTION
Anchor to what the owner explicitly asked for as the GOAL. How to get there — implementation
details, necessary adjacent fixes, reasonable technical decisions, and which files to touch — is
my judgment call; I do not stop to ask permission for mechanism. I also don't wait to be told to
fix something clearly broken that blocks or undermines the requested result.
**Questions vs. instructions, and initiative to change.** A question is not an instruction: when the owner asks a question ("will future edits produce artifacts?", "why did X happen?", "should we do Y?"), ANSWER it and stop — never treat a question as a request to change anything. If, while answering, I see a change worth making, I STOP, recommend it, and WAIT for approval. Full initiative applies to THINKING, PLANNING and CONTENT GENERATION; initiative to BEGIN making code/doc/content changes that were not explicitly requested is deliberately LOW — recommend first, act only after approval.
Parse intent, not wording: an example like "for example / in this case adding N items" describes the OUTCOME a guideline should produce — it is NOT a literal instruction to add exactly N. Apply the guideline's actual goal (e.g. reasonably aligned rendered height, never a specific item count).
A reported problem is an EXAMPLE of a CLASS. When the owner flags one instance (e.g. "9.8C is not centered"), understand the intent; when execution is requested, find and resolve every other instance of that same problem within the requested scope — the named item is a pointer, not the whole scope.
Content examples are pointers, not deliverables. When the owner names specific CONTENT items while describing a pedagogical/creative goal (e.g. "teach get up, hit up, send over", or "What's up?" = hi / what do you want / what's wrong), those items are EXAMPLES that point at the intended PRINCIPLE — not the literal list to implement. Parse the principle behind them, then do the synthesis: choose the concept order, the appropriate set and quantity of items, and the presentation. The named items carry no privileged status — include one only if it independently earns its place. Named items are a literal deliverable ONLY when the owner says so explicitly (e.g. "use exactly these", "just these N items"). Existing lesson pages are the same: they are outputs of past generations, not templates or specs. A new lesson's sections and structure are derived from the pedagogy (PEDAGOGY.md / CONTENT.md), never copied from a neighboring lesson file; only the fixed mechanical page skeleton (CONTENT.md) is reproduced by rule.
Stop and ask whenever there is ANY uncertainty about whether or how adherence to the prompt can be achieved — that uncertainty stops processing to confer with the user; never proceed on a guess. This includes: the desired OUTCOME or its target is ambiguous (not the mechanism — including an ambiguous reference label; see below), the request
conflicts with FUNCTION.md/FORMAT.md and the conflict looks unintentional, or the action is
destructive/hard to reverse (e.g. force-push, deleting user data, dropping a doc section) and the
owner hasn't clearly signed off on that scope.
**Ambiguous references — stop and ask, never guess.** When a prompt names a target by a short label (e.g. "6A", "5.6A", "block A", "that exercise") and the label does not pin a single lesson/section/block from context, STOP and ask which one is meant before acting. The threshold for asking is deliberately LOW: if there is any real chance the label points at two different things, ask — never pick the likelier reading and proceed. A wrong guess on a content target costs far more than one clarifying question.
**"Look / see / take a look" = investigate, never inspect visually.** The agent has no vision. "Take a look at X", "look into Y", "can you see why…" are requests to READ the code/content and REASON about it — never to render, screenshot, or "view" a page. Treat every "look" verb as "investigate the code/content"; do not attempt image capture.
When the owner requests a change, go straight to execution — no stalling, no deliberation replies,
no "here's my plan" unless the request is genuinely ambiguous or risky per above. "Go straight to
execution" means don't stall with plan-replies — it does NOT mean skip the deep thinking / research /
reasoning RULE 13 requires; that thinking happens internally, and the output is execution.
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
Only the pages/files/functions that CHANGED need verification or QA — scope every check to what changed; never run the whole site for a one-lesson edit. A single lesson HTML change → `node qa/content.mjs <n>` and `node qa/overflow.mjs <n>` (both take one or more lesson numbers, e.g. `node qa/content.mjs 5`; with no numbers they sweep 1–34). A shared-file change (engine1.js, engine2.js, style.css, backend/Code.gs) MAY affect every lesson — but run the FULL un-scoped sweep ONLY when explicitly asked, or inferred from the task context with overwhelming certainty. A shared-file change that merely ADDS a new rule/class used by a single lesson (e.g. a new CSS class) is scoped to that lesson, not swept. For the affected kind: structure `qa/content.mjs <n>`, layout `qa/overflow.mjs <n>`, engine `qa/smoke.mjs`. Content/layout changes (lesson HTML, style.css) MUST run the real-browser overflow/balloon check — jsdom cannot see layout. Before calling any lesson content "done", also run the CONTENT.md step-4/5 pedagogical+structural pass (see CONTENT.md) — the QA scripts prove structure and overflow only, not whether a block fills its width or an exercise is meaningful. Verification is mechanical (`node qa/overflow.mjs` measurements + reasoning); the owner's live-site review is the true visual judgment — the agent cannot see images. When generating or cleaning up content, default to EXHAUSTIVE vigilance: it is better to spend far longer on each block than to ship a wrong, ambiguous, dead-space or overflowing one. A pass that misses one of those is a failed pass.
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
edit → verify what I judge necessary (RULE 4) → commit + push → clear the finished batch from PENDING.md (and from PARKED.md if it came from the backlog) (RULE 7), so that no entry ever survives its own commit. Bundle whatever related changes
belong together into one commit if that's the coherent unit of work (no rule forcing one feature per
commit, no rule forcing it to be split either — use judgment). Avoid rapid, near-simultaneous
successive pushes when a single combined push would do. Build markers / live-site curl / fixed sleeps
are tools I reach for when I judge the risk of an undetected deploy problem is real, not a mandatory
step after every push. Never commit something I believe is broken.

## RULE 7 — STEP 1 OF EVERY TASK: SUBTASK BATCHES, PLANNED IN PENDING.md
Step 1 of task execution is to analyse the intent of the user prompt and define "subtask batches" — the ordered pieces of work, each owned by the spec file for its category. Write the ACTIVE plan to PENDING.md and park deferred / not-yet-started work in PARKED.md, then route each batch to the file that owns it:
- Active subtask batches / the live plan → PENDING.md
- Deferred / queued / parked to-do items (the backlog) → PARKED.md
- Context handoffs between sessions → HANDOFF.md
- Bugs / problems → ISSUES.md
- Behaviour / functionality / engines / backend / edit mode → FUNCTION.md
- Site structure & formatting (structure, layout, HTML/CSS, section/block formatting) → FORMAT.md
- Content handling (how lesson content is stored, structured and generated; the lesson pages themselves hold the prose) → CONTENT.md
- Teaching-side structure and rationale → PEDAGOGY.md
- Concept inventory (concept → context → mapping) → VOCABULARY.md
- Current state & shared parameter values → STATUS.md
- How to verify / QA → VERIFICATION.md
- Repository layout / file map → FILESYSTEM.md
When RULE 7 writes to any of these files, CHECK FOR CONFLICT, OVERLAP OR REDUNDANCY against the existing content first — if an apparent overlap/conflict turns up, STOP and ask the owner to resolve it (never silently duplicate). When RESUMING work from PENDING.md / PARKED.md, first sanity-check that the item is still relevant and still conflicts with nothing, before acting.
Then make a quick high-level judgement of which tasks/batches must be handled together and in which order they will be addressed, and whether any batches or parts of the prompt should be parked until after task completion — park them if necessary — and then execute, modifying only the files the change requires (reading and context-gathering is unrestricted — read whatever files the task needs, in full; for large files see RULE 9). Assume all non-referenced files are fully functional unless a verification step shows otherwise.

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
**Reading large files (truncation).** A single read of a large file can come back MIDDLE-TRUNCATED (an elided span marked `[truncated N chars]`). Never trust a truncated read: page through the file in bounded chunks with `start_line`/`end_line` (keep each chunk well under ~6000 characters — dense files like FUNCTION.md need ~15–20 line chunks), and re-read any span that came back with a `[truncated …]` marker before relying on it.

## RULE 10 — SPEC/RULE FILES HOLD THE RULES AND THE QUEUES
The category files (HARNESS, PENDING, PARKED, HANDOFF, ISSUES, FUNCTION, FORMAT, CONTENT, PEDAGOGY, VOCABULARY, STATUS, VERIFICATION, FILESYSTEM) hold two things and two things only: (1) queued / parked tasks, and (2) the parameters of elements and functionality — what something IS and what it DOES at a user-visible level (e.g. "a note is indicated by a light blue wash", "a recording is indicated by a blue underline", "a highlight is a translucent coloured rectangle").

## RULE 11 — A PROMPT OVERRIDES A SPEC/RULE FILE ON CONFLICT
When a user PROMPT (the instruction in the current message) contradicts a category file (HARNESS/PENDING/PARKED/HANDOFF/ISSUES/FUNCTION/FORMAT/CONTENT/PEDAGOGY/VOCABULARY/STATUS/VERIFICATION/FILESYSTEM) or an earlier owner rule, the PROMPT has authority — follow the prompt, not the file. When a prompt changes earlier guidance, also check whether it makes sense to RELAX or REWRITE the rule in the category file so it aligns with the new guidance (otherwise the files keep contradicting the code and the next task inherits the stale rule). The files are a record of the owner's intent, and the latest prompt is the latest intent: a prompt is never silently overridden by a spec file.

## RULE 12 — PEDAGOGICAL vs CONTENT HARNESS
Two harnesses govern content work. PEDAGOGY.md (the pedagogical harness) = WHAT content to teach and how it is ordered within and between lessons. CONTENT.md (the content harness) = HOW that content is generated, structured, and formatted. When deciding what to include, what to drop, and how to sequence topics (including grouping related items), reference the pedagogical harness. When authoring blocks, exercises, and layout, reference the content harness.

## RULE 13 — DEPTH, SCOPE & METHOD (defaults, binding)
- Depth default: the standing rule for this whole project is "take your time / do your best." Treat every task as deep and thorough unless the owner's words clearly say otherwise ("quick", "just fix"). Calibrate further by inferring from the owner's specific language, and honor depth words ("thorough / deep / extremely / take your time / absolute best") LITERALLY — more research angles, more reasoning passes, weigh and reject alternatives explicitly, denser output. Never read them as rhetorical emphasis.
- Scope inference: deduce the layer of work — subject content, pedagogy, or craft/process (guidelines, formatting, harness) — from the prompt's context and from what is necessary to achieve the intent. Never default to researching the nearest concrete subject; when the conversation is about guidelines, formatting, or pedagogy, the work is about the craft/process, not the subject matter. (Owner feedback about HOW work was done is not a request to study the topic being discussed.)
- Method (content & craft tasks): understand the abstract intent first → research the right layer → reason as an expert/designer (choose content, depth, structure, form, media by judgment) → reason about the rendered result → produce. Do not reduce a dynamic intent into a mechanical rule or checklist.
- **Pre-flight (every authoring/generation task).** Before producing: (a) re-read the relevant harness sections, (b) transcribe the prompt's explicit requirements — especially the QUALITATIVE ones (exhaustive / thorough / any length / any content type / invent new types / synthesize) — into a short checklist, (c) enumerate candidate content types (including new ones) and pick the strongest, and (d) after producing, grade the output against that checklist before committing. The qualitative instructions are the spec, not flavor; never substitute the familiar/template version of a task for the one actually asked.

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
Status lives in dedicated files: the ACTIVE plan in PENDING.md, the backlog in PARKED.md, bugs/problems in ISSUES.md, handoffs in HANDOFF.md, and current state + shared parameter values in STATUS.md. Nothing is cleared anywhere until it is done AND committed.
