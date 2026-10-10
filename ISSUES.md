# ISSUES — status log (open/closed issues, repro notes). Not rules; see HARNESS.md.

## OPEN
- [CLOSED 2026-10-11] Drawing/highlight functions REMOVED entirely from engine2.js + style.css per owner request (commit 11457fb), ahead of a rebuild whose parameters the owner will define in the harness. Prior open issue ("drawing still has problems", Oct 6) is moot — code no longer exists. Rebuild = next task, awaiting owner's parameter spec. NOTE: any existing draw/highlayer items in server layer rows are now ignored by renderLayer (not rendered); they remain in the Sheet untouched.
- [Oct 7] business/lesson1.html had malformed markup committed in HEAD: stray `</div></main>` after the scripts and a duplicate `<footer>` (browser auto-corrects, but layout is unpredictable — likely contributor to owner's "text still compresses dynamically" report). Cleaned up as part of the 1400px drawable-area rework; watch for any residual rendering oddities on that page.
- Undo/back button, 3-way toggle, highlight layer, touch gestures: implemented in code per FUNCTION.md but never verified by owner in a real browser. jsdom QA cannot test canvas/real clicks.
- Lesson layout "significantly prettier and more consistent": pending owner iteration.

## CLOSED
- [Oct 6, commit 5970eac] Ghost drawings/notes/recordings reappearing after Sheet deletion — root cause localStorage ghosts; code now wipes on load. Owner confirmed drawings gone on live site. Re-open if they return.
- [Aug 15, commit 1237924] engine2.js SyntaxError "Identifier 'deletedIds' has already been declared" — duplicate declaration removed.
- [Oct 6] Stale BACKPACK exec URL (403s) — all three lessons updated to deployment URL AKfycbxSR8UmOwosLIgn1-AGKhgXJvdqOVkzMqrTwdlWNF9kOkt-256TqTacOsQlo6JyHplR.
- [Oct 5, commit 605c736] Root URL 404 — index.html created (copy of portal).

## ENVIRONMENT NOTES
- Playwright unavailable here → qa/smoke.mjs runs on jsdom: covers JS syntax, DOM structure, engine init flags (__A/__B), selection-popup logic; does NOT cover real rendering, canvas, media, or actual mouse/touch events.
- raw.githubusercontent.com caches branch-name fetches briefly; verify content by commit SHA when in doubt.
