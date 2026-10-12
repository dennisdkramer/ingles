# HARNESS — binding contract. Read at the start of EVERY session, before any other action.

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
If a prompt is too long or complicated and risks confusion: save it verbatim to a file (e.g.
`requests/<date>-<topic>.md`), tell the owner, and proceed in agreed steps/parts.

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
edit → verify what I judge necessary (RULE 4) → commit + push. Bundle whatever related changes
belong together into one commit if that's the coherent unit of work (no rule forcing one feature per
commit, no rule forcing it to be split either — use judgment). Avoid rapid, near-simultaneous
successive pushes when a single combined push would do. Build markers / live-site curl / fixed sleeps
are tools I reach for when I judge the risk of an undetected deploy problem is real, not a mandatory
step after every push. Never commit something I believe is broken.

## RULE 7 — FILES & CONVENTIONS
- DEVELOPMENT SCOPE (owner decision 2026-10-11): lesson work happens on `business/lesson1.html`
  ONLY — read, edit, QA-test and reason about that page plus the shared files it loads (engine1.js,
  engine2.js, style.css). kids/lesson1.html, nsfw/lesson1.html and the login pages (index.html,
  portal.html) are PARKED: do not open, edit, test or spend context on them until the owner says the
  business build is final and the feature set is ported there. `qa/smoke.mjs` runs business only for
  the same reason; re-add the other pages to its page list when the port starts.
- Engines (engine1.js, engine2.js) and style.css ship as FULL files. Lessons are content-only (config
  consts + engine includes). Never ask the owner to hand-paste fragments I can edit myself.
- Backend: Google Apps Script "ingles-backpack" (owner's account; I cannot deploy it). Canonical copy
  in repo `backend/Code.gs`; owner paste-deploys. BACKPACK exec URL:
  https://script.google.com/macros/s/AKfycbxSR8UmOwosLIgn1-AGKhgXJvdqOVkzMqrTwdlWNF9kOkt-256TqTacOsQlo6JyHplR/exec
  (set per-lesson as const BACKPACK).
- Gate hash: h(s){let x=0;for(const c of s)x=(x*31+c.charCodeAt(0))|0;return x} applied to
  email+track+SECRET ("abreportas2025"); stored in sessionStorage.gate.
- OAuth origin: https://dennisdkramer.github.io (add new origin if host changes).

## RULE 8 — FUNCTION / FORMAT CONTRACTS (READ ONLY WHAT'S RELEVANT)
Site functionality is defined in `FUNCTION.md`; site formatting/visual layout is defined in
`FORMAT.md`. Only read/reason about the contract that's actually relevant to the task: a
functionality-only task (behavior, gestures, sync, data) doesn't need FORMAT.md, and a pure
visual/layout task doesn't need FUNCTION.md. Read both only when a change plausibly touches both. If
a change would alter a contract whose section I did read, flag it and preserve everything not being
explicitly changed; don't re-read a contract file "just in case" once I've already confirmed scope.

## RULE 9 — TOOL EFFICIENCY
Prefer direct, batched reads: use `read_files` with explicit line ranges across multiple files in one
call instead of shell `Get-Content`/temp-file dumping workarounds. Don't re-read the same region of a
file more than once in a session unless it changed. Parallelize independent reads/searches/edits in a
single turn rather than serializing them one tool-call at a time.

## RULE 10 — UPDATING THIS FILE
Whenever an owner instruction contains "from now on", "always", or "never": append/update the rule
here (conservatively, in the owner's own wording where possible) in the same turn. This file is the
persistent memory; conversations are not.

## STATUS
Open/closed issues live in `ISSUES.md` (status log, not rules).

