# VERIFICATION — how to verify / QA

Six checks, all narrow. None of them judges how a page is laid out: block widths, columns, option
counts, spacing and class names are generation decisions, not defects.

- `node qa/content.mjs [--track=…] [n …]` — the page still works: engine1/engine2 executed, exactly one
  `#feed` that is a textarea, every `.listen` has `data-say`, no `<!-- MORE -->` sentinel, every answer
  control resolves an anchor (an unanchored one is never saved), no console errors.
- `node qa/provenance.mjs [--track=…] [n …]` — the two claims nothing else can see (PEDAGOGY-MAP.md §5 and §k):
  a record in `provenance.jsonl` written before the page, the six input hashes still matching disk, the record's
  `range` being this lesson's own roadmap heading span, the page's h2+vehicle shape equal to the record and
  identical to no other lesson in the track, **every concept on the roadmap's `teaches:` line marked
  `data-teaches="<pid>"` on a block that trains it and on a block in the quiz that tests it** — concepts
  outrank vocabulary, since a tense taught by name is not taught — and of the vocabulary the page presents,
  all of it trained outside the quiz and every item the correct answer to a question of its own in it. The
  answer is read from the question's key (`data-a`, `data-answer`, or the option a `.listen` names) and only
  when it is about that item alone: a word sitting in a distractor, a stem or the quiz's prose was never
  tested, and one answer naming four new items is one question about none of them. **Nothing here is judged track-wide:** each
  lesson is green or red on its own. **An absent ledger is RETIRED** — a note, not a failure: the checks only
  the ledger can make (inputs, range, fingerprint, collision) stop with it, while concepts and coverage keep
  running. `--selftest` plants each defect the member exists to catch (and the retired case) and proves each
  still fires.
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

Scope belongs to the harnesses, not the caller: with no lesson numbers every page in every track that has
pages is swept, `--track=kids|business|adult` narrows it (qa/track.mjs), and a named lesson that does not
exist is a failure. `npm run qa -- <member>` runs ONE harness and nothing else (`qa/run.mjs`);
`node qa/run.mjs` with no member prints the menu and exits non-zero, and a member that does not honour
`--track`/`--all`/lesson numbers is refused when one is passed rather than silently sweeping every
track. `npm run qa:layout` = the overflow selftest + sweep; `npm run qa:live` = the CDP probe. Every
harness exits non-zero on a finding.

**A build runs two of these on itself.** Before a lesson is reported as done, the page it just wrote is checked
with `node qa/lang.mjs --track=<track> <N>` (its own voice against the target range in PEDAGOGY-MAP.md [BUILD]
HIGH PRIORITY) and `node qa/provenance.mjs --track=<track> <N>` (the record, its hashes, this lesson's own
roadmap span, the concept marks, the quiz coverage). That page and no others: a sweep is not a self-check, and it
shows a build the bands and shapes of pages it may not read. A red is fixed in the page, never in the threshold,
and a page reshaped after the check is recorded again. `content`, `overflow` and `live` are not in that loop —
each opens a server or a real browser and belongs to the end of a batch (PEDAGOGY-MAP.md §5).

Which of those to run, and how deep, is the caller's decision, not the harness's: when scope is most or
all live pages, pick a few with defensible relevance to test/verify. Request user sign-off before
[sweeping the rest only if defensibly necessary].
