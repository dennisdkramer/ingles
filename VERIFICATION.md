# VERIFICATION — how to verify / QA

Five checks, all narrow. None of them judges how a page is laid out: block widths, columns, option
counts, spacing and class names are generation decisions, not defects.

- `node qa/content.mjs [--track=…] [n …]` — the page still works: engine1/engine2 executed, exactly one
  `#feed` that is a textarea, every `.listen` has `data-say`, no `<!-- MORE -->` sentinel, every answer
  control resolves an anchor (an unanchored one is never saved), no console errors.
- `node qa/overflow.mjs [--track=…] [n …]` — real Chrome over CDP (jsdom cannot see layout). OVERFLOW
  (content wider than its block), ESCAPE (an element across the `.content-area` frame), CELL (a `.blanks`
  cell whose item does not fit), RESIZE (a draggable textarea). `--shot <file>` saves a picture of the page
  top — the fastest way to see a real defect; `--selftest` proves the harness still catches a broken page.
  A user instruction that asks about a "visual" or "space fill" issue is answered with this harness, never from jsdom.
- `node qa/landing.mjs` — the student index (index.html) in jsdom: three tracks, title as the link,
  continue above the list, locked tracks inert, the `go()` gate, the teacher's grant/remove controls.
- `node qa/games4.mjs` — the engine4.js game runner and every plugin's state machine in jsdom.
- `node qa/live.mjs` — real-Chrome probe for what jsdom cannot reproduce (timing, auto-repeat, real
  mouse/keyboard, on-screen position). Reach for it when a report mentions any of those.

Scope belongs to the harnesses, not the caller: with no lesson numbers every page in every track that has
pages is swept, `--track=kids|business|adult` narrows it (qa/track.mjs), and a named lesson that does not
exist is a failure. `npm run qa -- <member>` runs ONE harness and nothing else (`qa/run.mjs`);
`node qa/run.mjs` with no member prints the menu and exits non-zero, and a member that does not honour
`--track`/`--all`/lesson numbers is refused when one is passed rather than silently sweeping every
track. `npm run qa:layout` = the overflow selftest + sweep; `npm run qa:live` = the CDP probe. Every
harness exits non-zero on a finding.

Which of those to run, and how deep, is the caller's decision, not the harness's: when scope is most or
all live pages, pick a few with defensible relevance to test/verify. Request user sign-off before
[sweeping the rest only if defensibly necessary].
