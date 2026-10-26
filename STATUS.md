# STATUS — current state & shared parameters
Mutable, machine-relevant facts and shared parameter VALUES — the things that can change without changing behaviour. Behaviour rules live in FUNCTION.md; this file only holds the state/values those rules read.

## Deploy / state
- Backend is owner-deployed (I cannot deploy): a Code.gs change only takes effect after a NEW deployment version; the /exec URL does not change, so pages need no update.
- REDEPLOY PENDING (2026-10-20, was ISSUES B-I6): the access-control flow (status/request/approve/reject/queue + the `students` GET + the new `access` tab + server-side Google ID-token verification) is committed but NOT deployed. Until the owner redeploys (Deploy → Manage deployments → New deployment), the index page shows every non-teacher "solicitar acesso" (the new actions return {error:"unknown action"} on the old deployment), the teacher queue will not load, and the lesson-page student selector will be empty. Owner action only — no code change remains.
- REDEPLOY PENDING (2026-10-17, was ISSUES B-I5): the Code.gs `wipe` change (exclude `notebook`/`content` rows so "Clear page" only wipes marks) is committed but NOT deployed. Until the owner redeploys, "Clear page" still deletes the shared-notebook row. Owner action only — no code change remains.
- Development scope: the current build is business/lesson1.html–lesson34.html (a single 34-lesson progression). `qa/content.mjs` structure-checks the business lessons and `qa/overflow.mjs` checks their layout — both take lesson numbers to scope (e.g. `node qa/content.mjs 5`) and sweep 1–34 with none given. kids/, nsfw/ and the login pages still carry their older wording.

## Shared parameters
- BACKPACK exec URL (set per lesson as `const BACKPACK`): https://script.google.com/macros/s/AKfycbxSR8UmOwosLIgn1-AGKhgXJvdqOVkzMqrTwdlWNF9kOkt-256TqTacOsQlo6JyHplR/exec
- Gate: `sig = h(email + track + SECRET)` with SECRET = "abreportas2025" (h = Java-style `x = x*31 + charCode`), stored in sessionStorage.gate; engine1.js redirects to index.html when it is invalid. OAuth origin: https://dennisdkramer.github.io.
- access.json: teachers [dennisdkramer@gmail.com] only. The approved-student list and the pending-request queue live server-side (sheet `IAP_backpack!access`, columns email|name|track|status|ts), starting EMPTY — the teacher approves each student and assigns their book in the index page. Teachers are mirrored as a constant in Code.gs for server-side approval authorization — keep the two in sync.
- Grace window: the `notePending`/`pendingFor` local-action grace window is 12s (FUNCTION.md Sync).
- Git: main tracks origin/main — run `git status` for the live working-tree state (in-flight work may be present).
