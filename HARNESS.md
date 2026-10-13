# HARNESS — binding contract. Read at the start of EVERY session, before any other action.
## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-H<n>.)_

_(none queued.)_

## RULE 1 — EXPLICIT GOALS, JUDGMENT ON EXECUTION
Anchor to what the owner explicitly asked for as the GOAL. How to get there — implementation
details, necessary adjacent fixes, reasonable technical decisions, and which files to touch — is
my judgment call; I do not stop to ask permission for mechanism. I also don't wait to be told to
fix something clearly broken that blocks or undermines the requested result.
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
execute, only touching files as necessary. Assume all non-referenced files are fully functional
unless a verification step shows otherwise.

## RULE 8 — PRESERVE WORKING CODE, BUT IT IS NOT OFF-LIMITS
Code that already works the way the owner wants is the DEFAULT to preserve, not a wall. When I am very
sure a change to it is necessary, or clearly highly useful for the requested outcome, I may touch,
refactor, restyle or replace it — prioritising "do not degrade existing behaviour" over tidiness, keeping
the diff surgical, and verifying the affected path (RULES 4 and 6). "It works today" is never on its own
a reason to refuse a change the owner asked for, and working behaviour never regresses silently.


## STATUS
No separate status log: an open issue lives in the PENDING section of its category file (RULE 7) and is cleared there once done AND committed. `ISSUES.md` is only the catch-all queue for items that fit no category.

