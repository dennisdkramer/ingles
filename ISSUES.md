# ISSUES — status log (open/closed issues, repro notes). Not rules; see HARNESS.md.

## OPEN
- [CLOSED 2026-10-11] Draw-on-page feature REMOVED for good. The engine/style code went in commit 11457fb; this commit purged the leftovers: the old canvas-strip script in business/lesson1.html, the teacher visibility toggle and the kids mute button (both were dead — their values were sent to the server but never read by any code), the dead related state in the engines, and every drawing reference in FORMAT.md / FUNCTION.md / style.css / qa. NO rebuild is planned: the highlight (mark.nb.has-hl) is the only text-mark feature. NOTE: any draw/highlayer rows still in the server layer are ignored by renderLayer (not rendered) and remain in the Sheet untouched.
- [Oct 7] business/lesson1.html had malformed markup committed in HEAD: stray `</div></main>` after the scripts and a duplicate `<footer>` (browser auto-corrects, but layout is unpredictable — likely contributor to owner's "text still compresses dynamically" report). Cleaned up as part of the 1400px page-area rework; watch for any residual rendering oddities on that page.
- Undo/back button and highlight layer: implemented in code per FUNCTION.md but never verified by owner in a real browser (owner is verifying the highlight live now). jsdom QA cannot test real clicks.
- Lesson layout "significantly prettier and more consistent": pending owner iteration.

## CLOSED
- [Oct 6, commit 5970eac] Ghost layer items reappearing after Sheet deletion — root cause localStorage ghosts; code now wipes on load. Owner confirmed gone on live site. Re-open if they return.
- [Aug 15, commit 1237924] engine2.js SyntaxError "Identifier 'deletedIds' has already been declared" — duplicate declaration removed.
- [Oct 6] Stale BACKPACK exec URL (403s) — all three lessons updated to deployment URL AKfycbxSR8UmOwosLIgn1-AGKhgXJvdqOVkzMqrTwdlWNF9kOkt-256TqTacOsQlo6JyHplR.
- [Oct 5, commit 605c736] Root URL 404 — index.html created (copy of portal).

## ENVIRONMENT NOTES
- Playwright unavailable here → qa/smoke.mjs runs on jsdom: covers JS syntax, DOM structure, engine init flags (__A/__B), selection-popup logic; does NOT cover real rendering, media, or actual mouse/touch events.
- raw.githubusercontent.com caches branch-name fetches briefly; verify content by commit SHA when in doubt.
