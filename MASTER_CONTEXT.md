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
- ANCHORING (owner spec 2026-10-13, binding): the lesson content is ABSOLUTE, FIXED CONTENT — a published lesson page's prose never changes and never moves. Every persisted item consequently references a TEXT STRING and nothing else: highlights, notes and recordings are stored, matched, painted and restored by their anchor text (plus the note text / colour / clip they carry). Nothing positional is ever persisted or consulted — no character offsets, no block indexes, no "which occurrence" counters, in any row or on any layer. Consequence: where the SAME string occurs more than once on a page, uniqueness can only come from the anchor string itself (save a longer anchor that includes its neighbouring text) — never from where it sits; and any row, helper or check that still carries offsets/blocks (the legacy `b`/`o` on highlight rows, expectations phrased as "block+offset wins") is stale and must not be extended.

## FILESYSTEM
- root: index.html · portal.html · style.css · engine1.js · engine2.js · logo.png · access.json · .gitignore · package.json
- category files: MASTER_CONTEXT.md (this — general/planning/architecture) · HARNESS.md (execution) · FUNCTION.md (behavior) · BACKEND.md (server) · FORMAT.md (format/layout) · CONTENT.md (content handling/architecture + content tasks/batches — the lesson content itself lives in the lesson pages, never here) · ISSUES.md (catch-all queue for items that fit no category)
- pages: business/lesson1.html · kids/lesson1.html · nsfw/lesson1.html — backend/Code.gs — qa/smoke.mjs (jsdom suite, run with `node qa/smoke.mjs`) — qa/live.mjs (real-Chrome CDP harness, run with `node qa/live.mjs`) — node_modules/ (untracked, gitignored)
- A file that the current batch does not reference is assumed fully functional; only a verification step proves otherwise.

## STATE / PARAMETERS (as of 2026-10-12)
- Git: HEAD == origin/main with a clean tracked tree (untracked scratch files remain — see ISSUES.md B-I2); the `notePending` grace window is 12s (ARCHITECTURE above).
- Gate: `sig = h(email+track+SECRET "abreportas2025")` (h = Java-style `x = x*31 + charCode` hash), stored in sessionStorage.gate; engine1.js redirects to portal.html when it is invalid. OAuth origin: https://dennisdkramer.github.io.
- access.json: teachers [dennisdkramer@gmail.com]; students Maria (kids), João (business), Ale (business).
- Backend is owner-deployed (I cannot deploy it): a Code.gs change only takes effect after a NEW deployment version, while the /exec URL stays the same. Exec URL: https://script.google.com/macros/s/AKfycbxSR8UmOwosLIgn1-AGKhgXJvdqOVkzMqrTwdlWNF9kOkt-256TqTacOsQlo6JyHplR/exec (set per lesson as const BACKPACK).
- Development scope: the current/ported build is business/lesson1.html and `qa/smoke.mjs` tests that page only — re-add the other pages when the port starts; kids/, nsfw/ and the login pages still carry their older wording.
- Shared files (engine1.js, engine2.js, style.css) are edited IN PLACE with surgical, exact-match edits — no whole-file rewrite and no holding a whole file in memory; lesson pages stay content-only (config consts + engine includes).

## VERIFICATION ENVIRONMENT
- Playwright is unavailable here, so `qa/smoke.mjs` runs on jsdom: JS syntax, DOM structure, engine init flags (`__A`/`__B`), the selection popup, the highlight Ctrl gesture gate, `#hlLayer` paint separation, the colour palette, Ctrl+click delete and the layer-independence rule. jsdom has no layout, so the suite installs a deterministic fake layout (8px/char, 40 chars/line, 20px/line) to exercise rectangle geometry and the hit test — it does NOT cover real rendering, media, or actual mouse/keyboard events.
- Real input/timing bugs (e.g. the 2026-10-12 palette that the held Ctrl's auto-repeat killed) CANNOT be caught by jsdom — QA stayed green while the live page was broken. When a report mentions timing, auto-repeat, real mouse/keyboard or on-screen position, drive a real headless Chrome over the DevTools Protocol (throwaway probe: `--headless=new --remote-debugging-port=0`, `Input.dispatchMouseEvent`/`Input.dispatchKeyEvent`, `Runtime.evaluate` to read `getBoundingClientRect`) instead of trusting the jsdom suite alone. That harness now exists and is tracked: `qa/live.mjs` (real Chrome over CDP, zero npm dependencies).
- `raw.githubusercontent.com` caches branch-name fetches briefly — verify fetched content by commit SHA when in doubt.
