# HARNESS — binding contract. Read at the start of EVERY session, before any other action.

## RULE 1 — EXPLICIT SCOPE ONLY
Before any action, thinking, updates, or responses: confirm what is explicitly requested in the owner's prompt. Do exactly that and NOTHING more. If you think something should also be done, propose it in a reply and wait. If anything is unclear, stop processing immediately and communicate with the owner before going forward.

## RULE 2 — LANGUAGE
Default language is English. Use Portuguese only when specifically requested.

## RULE 3 — LONG/COMPLICATED PROMPTS
If a prompt is too long or complicated and risks confusion: save it verbatim to a file (e.g. `requests/<date>-<topic>.md`), tell the owner, and proceed in agreed steps/parts.

## RULE 4 — VERIFIED CLAIMS ONLY
Only make claims you have verified within this turn, with pasted terminal output as proof (curl, node --check, git log, QA run). No proof → say "not yet verified". Never restate a past success without re-checking current state first.

## RULE 5 — STOP ON DOUBT
Stop and communicate if you encounter any problem, question, or doubt. No guessing.

## RULE 6 — THE LOOP (for every file edit)
edit → QA green (`node qa/smoke.mjs`) → build marker `<!-- build: <ISO timestamp> -->` in changed HTML → commit + push origin main → sleep 75 → curl live URL and grep the new marker → report with pasted evidence. One feature per commit; never rapid successive pushes (jams Pages queue). NEVER commit red QA.

## RULE 7 — FILES & CONVENTIONS
- Engines (engine1.js, engine2.js) and style.css ship as FULL files. Lessons are content-only (config consts + engine includes). Never ask the owner to hand-paste fragments I can edit myself.
- Backend: Google Apps Script "ingles-backpack" (owner's account; I cannot deploy it). Canonical copy in repo `backend/Code.gs`; owner paste-deploys. BACKPACK exec URL: https://script.google.com/macros/s/AKfycbxSR8UmOwosLIgn1-AGKhgXJvdqOVkzMqrTwdlWNF9kOkt-256TqTacOsQlo6JyHplR/exec (set per-lesson as const BACKPACK).
- Gate hash: h(s){let x=0;for(const c of s)x=(x*31+c.charCodeAt(0))|0;return x} applied to email+track+SECRET ("abreportas2025"); stored in sessionStorage.gate.
- OAuth origin: https://dennisdkramer.github.io (add new origin if host changes).

## RULE 8 — FUNCTION / FORMAT CONTRACTS
Site functionality is defined in `FUNCTION.md`; site formatting is defined in `FORMAT.md`. Whenever a task touches functionality or formatting, read the relevant file FIRST and preserve everything not explicitly being changed. If a change would alter either contract, flag it and wait for approval.

## RULE 9 — UPDATING THIS FILE
Whenever an owner instruction contains "from now on", "always", or "never": append/update the rule here (conservatively, in the owner's own wording where possible) in the same turn. This file is the persistent memory; conversations are not.

## STATUS
Open/closed issues live in `ISSUES.md` (status log, not rules).
