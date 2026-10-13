# MASTER CONTEXT — read first: goals, architecture, filesystem, state. Source of the batch map for HARNESS RULE 7.

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-MC<n>.)_

_(none queued.)_

## GOALS
- "Inglês Abre Portas": a static English-teaching site — one teacher plus a few allow-listed students, three books (kids, business, adults/nsfw); every lesson is a standalone page.
- A student reads/listens to a lesson and marks it up (highlight, note, record); every mark persists server-side per student and per book, and the teacher sees the same layer (student selector in the control bar).
- Non-goals: no accounts/permissions beyond access.json, no client-side source of truth.

## ARCHITECTURE
- Pages: login (index.html; portal.html is the same app on a named path) reads access.json and hands a signed `sessionStorage.gate` to `<track>/lessonN.html`.
- Lesson pages are content-only: config consts (BACKPACK exec URL, SECRET, TRACK, L, COUNT) + `<script src="../engine1.js">` + `<script src="../engine2.js">` + style.css.
- engine1.js = gate, gestures/selection popup, notes/recordings/audio, highlights, `send()` (network last). engine2.js = control bar, 3-second layer poll (`loadLayer`/`renderLayer`), feed, restoring marks and rectangles.
- One server (backend/Code.gs — see BACKEND.md): Sheet `IAP_backpack!layer` + Drive folder `IAP_uploads`. It is the ONLY source of truth; a local action is shielded from a racing poll by a generic id+action grace window (`notePending`/`pendingFor` in engine1.js; 12s since 2026-10-12).
- Two mark layers that must never interact: notes/recordings are text-DOM `mark.nb` (inset underline / wash); highlights are rectangles painted on `#hlLayer`.

## FILESYSTEM
- root: index.html · portal.html · style.css · engine1.js · engine2.js · logo.png · access.json · .gitignore
- category files: MASTER_CONTEXT.md (this — general/planning/architecture) · HARNESS.md (execution) · FUNCTION.md (behavior) · BACKEND.md (server) · FORMAT.md (visual) · ISSUES.md (status log, not rules)
- pages: business/lesson1.html · kids/lesson1.html · nsfw/lesson1.html — backend/Code.gs — qa/smoke.mjs (jsdom suite, run with `node qa/smoke.mjs`) — node_modules/ (untracked, gitignored)
- A file that the current batch does not reference is assumed fully functional; only a verification step proves otherwise.

## STATE / PARAMETERS (as of 2026-10-12)
- Git: HEAD == origin/main; the only uncommitted change is engine1.js `notePending` grace window 6s → 12s.
- Gate: `sig = h(email+track+SECRET "abreportas2025")` (h = Java-style `x = x*31 + charCode` hash), stored in sessionStorage.gate; engine1.js redirects to portal.html when it is invalid. OAuth origin: https://dennisdkramer.github.io.
- access.json: teachers [dennisdkramer@gmail.com]; students Maria (kids), João (business), Ale (business).
- Backend is owner-deployed (I cannot deploy it): a Code.gs change only takes effect after a NEW deployment version, while the /exec URL stays the same. Exec URL: https://script.google.com/macros/s/AKfycbxSR8UmOwosLIgn1-AGKhgXJvdqOVkzMqrTwdlWNF9kOkt-256TqTacOsQlo6JyHplR/exec (set per lesson as const BACKPACK).
- Development scope: the current/ported build is business/lesson1.html and `qa/smoke.mjs` tests that page only — re-add the other pages when the port starts; kids/, nsfw/ and the login pages still carry their older wording.
- Engines and style.css ship as FULL files; lesson pages are content-only. Never ask the owner to hand-paste fragments I can edit myself.
- Environment: `run_commands` has no VS Code shell integration here (it echoes the terminal buffer back plus a bogus exit 1) — judge any call by its printed output only, bound every command, and inspect with read_files / search_codebase instead of the shell.
