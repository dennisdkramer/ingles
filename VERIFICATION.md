# VERIFICATION — how to verify / QA

Six checks, all narrow. None of them judges how a page is laid out: block widths, columns, option
counts, spacing and class names are generation decisions, not defects.

- `node qa/content.mjs [--track=…] [n …]` — the page still works: engine1/engine2 executed, exactly one
  `#feed` that is a textarea, every `.listen` has `data-say`, no `<!-- MORE -->` sentinel, every answer
  control resolves an anchor (an unanchored one is never saved), no console errors.
- `node qa/overflow.mjs [--track=…] [n …]` — real Chrome over CDP (jsdom cannot see layout). OVERFLOW
  (content wider than its block), ESCAPE (an element across the `.content-area` frame), CELL (a `.blanks`
  cell whose item does not fit), RESIZE (a draggable textarea). `--shot <file>` saves a picture of the page
  top — the fastest way to see a real defect; `--selftest` proves the harness still catches a broken page.
  A user instruction that asks about a "visual" or "space fill" issue is answered with this harness, never from jsdom.
- `node qa/landing.mjs` — the student index (index.html) in jsdom: one column per track in the list, plus a
  track that exists in no file (it must still get a column, its `track.json` label and a grant option),
  title as the link, continue above the list, locked tracks inert, the `go()` gate, the teacher's
  grant/remove controls.
- `node qa/games4.mjs` — the engine4.js game runner and every plugin's state machine in jsdom.
- `node qa/live.mjs` — real-Chrome probe for what jsdom cannot reproduce (timing, auto-repeat, real
  mouse/keyboard, on-screen position). Reach for it when a report mentions any of those.
- `node qa/liquid.mjs` — the files GitHub renders as pages, checked before Liquid reads them. Every tracked
  `.md` is a Jekyll page (GitHub Pages adds the front matter it lacks), and Jekyll parses it with Liquid
  BEFORE Kramdown, so a code span protects nothing: an opener that never closes aborts the whole build, and
  Pages then keeps serving the previous deployment while `git push` reports success. On 2026-11-10 one such
  line in PENDING.md stopped two commits in a row and the live site silently kept the old lesson list. FAIL on
  an unclosed opener or on a tag Liquid does not know; WARN on a closed token, which is legal but publishes
  as a blank ("its five placeholders filled: ` `, ` `…" where five names were expected). A raw block is the escape when a token must be shown. `--selftest`
  proves the scanner still fails the exact line that caused it and still passes prose. Scope is
  `git ls-files` — the published set — and named paths replace it for a falsification run.
  **The same check runs before a push** via `.githooks/pre-push`, which refuses to send objects that would
  abort the build. That hook is opt-IN per clone, because `core.hooksPath` is local config and cannot be
  committed: a fresh clone has no guard until someone runs `git config core.hooksPath .githooks`. Check it
  with `git config --get core.hooksPath` — silence means unprotected. `--no-verify` skips it, and that flag
  is how the guard was missed on 2026-11-10.

Scope belongs to the harnesses, not the caller: with no lesson numbers every page in every track that has
pages is swept, `--track=kids|business|adult` narrows it (qa/track.mjs), and a named lesson that does not
exist is a failure. `npm run qa -- <member>` runs ONE harness and nothing else (`qa/run.mjs`);
`node qa/run.mjs` with no member prints the menu and exits non-zero, and a member that does not honour
`--track`/`--all`/lesson numbers is refused when one is passed rather than silently sweeping every
track. `npm run qa:layout` = the overflow selftest + sweep; `npm run qa:live` = the CDP probe. Every
harness exits non-zero on a finding.

**`qa/cssdiff.mjs` runs once per batch, at the commit boundary — never per step.** It photographs the computed
style of every element on three pages and diffs it against a saved baseline, so it is the only thing that can tell
a CSS reorder from damage; it is also the slowest check here and needed two determinism fixes before it was
trustworthy. A per-step run buys nothing a per-batch run does not, and the artefacts it produced when run casually
cost more attention than the defects it found.

**A build runs one of these on itself.** Before a lesson is reported as done, the page it just wrote is checked
with `node qa/lang.mjs --track=<track> <N>` (its own voice against the target range in PEDAGOGY-MAP.md
[PORTUGUESE] HIGH PRIORITY). That page and no others: a sweep is not a self-check, and it
shows a build the bands and shapes of pages it may not read. A red is fixed in the page, never in the threshold,
and a page reshaped after the check is recorded again. `content`, `overflow` and `live` are not in that loop —
each opens a server or a real browser and belongs to the end of a batch (PEDAGOGY-MAP.md §5).
**Every check above except `qa/liquid.mjs` prints one line and exits 0 unread unless `QA_ON=1` is in the
environment** (`qa/off.mjs`, owner instruction 2026-11-10, ISSUES.md) — so a green from any of them without that
variable is the switch reporting, not the page. Run the self-check as `QA_ON=1 node qa/lang.mjs --track=<t> <N>`
or it proves nothing.

Which of those to run, and how deep, is the caller's decision, not the harness's: when scope is most or
all live pages, pick a few with defensible relevance to test/verify. Request user sign-off before
[sweeping the rest only if defensibly necessary].
