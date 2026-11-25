# VERIFICATION — how to verify / QA

Five checks, all narrow. None of them judges how a page is laid out: block widths, columns, option
counts, spacing and class names are generation decisions, not defects.

- `node qa/page.mjs` — **THE page gate**, and the only one that reads a page's markup. Its
  subfunctions switch on what the page IS, not on its folder: a page carrying `.block`s is read as a
  lesson page, a page carrying a `markup-row` is read as a build page, and a build page inside a
  track is a failure. FAILS: an element never closed · a closer that closed nothing · a dead
  `#anchor` · a `.block` not opening with an `<h3>` · a block inside a block · a headline over 60
  characters · a row inside a row · an empty `data-answer` · a `.qitem` key naming no option · `#feed`
  missing, duplicated or not a textarea · a stub label pointing at nothing · a `pre` holding parsed
  markup · `data-span` not summing to 12 · a `.listen` with no `data-say` · and, in its runtime half,
  the page not booting, an answer control resolving no anchor, a game engine4 never wired, a console
  error. WARNS (printed, never failed): a block with answers and no `.qnum` · a class with no rule in
  `style.css` · an item still outside a cell of its own (run `node qa/wrap.mjs --write`). It also
  PRINTS — never fails — half-coverage of the lesson's roadmap items, the register tiers the page
  hits, the formal and locale words it uses, the claim shapes nothing can check, and the `<h1>`
  length, for the reader to judge. `npm run map` runs it on the contract page
  (`--page="extra/lesson1-The Capability Map.html"`).
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

Scope belongs to the harnesses, not the caller: **no flag reads the ONE track whose pages the working
tree touches** — two tracks touched is a refusal, because a green that reads two tracks is not a green
about the one being written. `--track=kids|business|adult` narrows it to that track — and names no
page, so it needs `--lessons=21-25` (or bare numbers) or `--all`; `--page=<path>` reads exactly one
page in any folder; `--all` is every track, said out loud, and it is the only full sweep.
`npm run qa -- <member>` runs ONE harness and nothing else (`qa/run.mjs`); `node qa/run.mjs` with no
member prints the menu and exits non-zero, and a member that does not honour
`--track`/`--all`/lesson numbers is refused when one is passed rather than silently sweeping every
track. `npm run qa:live` = the CDP probe. Every harness exits non-zero on a finding.

**The computed-style baseline is gone (2026-11-24).** `qa/cssdiff.mjs` and its 330 KB
`.css-baseline.json` were switched off and referenced by nothing; `qa/rowctx.mjs` proves the cascade
on the shapes that matter, and a stored photograph of every computed style is drift bait — it fails on
a font fallback and passes on a rule that moved.

**A build runs the gate on itself.** Before a lesson is reported as done, the page it just wrote is checked
with `node qa/page.mjs --track=<track> <N>`. That page and no others: a sweep is not a self-check, and it
shows a build the shapes of pages it may not read. A red is fixed in the page, never in the threshold.
`live` is not in that loop — it opens a real browser and belongs to the end of a batch.
**`qa/page.mjs` is the one harness that runs as written.** Every other harness prints one line and exits 0
unless `QA_ON=1` is in the environment (`qa/off.mjs`, owner instruction 2026-11-10 — its text moves to `[QA OFF]` at the head of `qa/checks.mjs`) — so a green
from one of them without that variable is the switch reporting, not the page.

Which of those to run, and how deep, is the caller's decision, not the harness's: when scope is most or
all live pages, pick a few with defensible relevance to test/verify. Request user sign-off before
[sweeping the rest only if defensibly necessary].
