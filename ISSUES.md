# ISSUES — status log (open/closed issues, repro notes). Not rules; see HARNESS.md.

## OPEN
- Drawing function "still has problems" (owner, Oct 6). Exact symptoms/repro steps NOT yet provided. Do not touch engine2.js drawing code until owner describes them.
- Fixed page layout: owner reported text still compresses dynamically despite .page-container work. Needs re-verification on live site + fix.
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
