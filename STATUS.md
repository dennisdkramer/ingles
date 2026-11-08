# STATUS — current state & shared parameters
Mutable, machine-relevant facts and shared parameter VALUES — the things that can change without changing behaviour. Behaviour rules live in FUNCTION.md; this file only holds the state/values those rules read.

## Shared parameters
- BACKPACK exec URL (set per lesson as `const BACKPACK`): https://script.google.com/macros/s/AKfycbxSR8UmOwosLIgn1-AGKhgXJvdqOVkzMqrTwdlWNF9kOkt-256TqTacOsQlo6JyHplR/exec
- Gate: `sig = h(email + track + SECRET)` with SECRET = "abreportas2025" (h = Java-style `x = x*31 + charCode`), stored in sessionStorage.gate; engine1.js redirects to index.html when it is invalid. OAuth origin: https://dennisdkramer.github.io.
- access.json: teachers [dennisdkramer@gmail.com] only. The approved-student list and the pending-request queue live server-side (sheet `IAP_backpack!access`, columns email|name|track|status|ts), starting EMPTY — the teacher approves each student and assigns their book in the index page. Teachers are mirrored as a constant in Code.gs for server-side approval authorization — keep the two in sync.
- Grace window: the `notePending`/`pendingFor` local-action grace window is 12s (FUNCTION.md Sync).
- Git: main tracks origin/main — run `git status` for the live working-tree state (in-flight work may be present).
