# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
A batch and its steps must be removed from this file when all of the batch's steps are completed. Any batch or step which is stale must be deleted.
---

# [CURRENT]
## [B12] - the solver gains spacing as a height lever for question and list cells "i just want the js to be able to use spacing between questions as the primary way to gain height ... and maybe for lists too ... Include it with the question spacing" + "i want that space to be compressed to reduce height too" + "if it is authored wrapping, it stays wrapping. we just arent going to compress past the existing width of the text" + "not every question is a `<p>` ... the span class isnt a guarantee just a marker" + the `span.qnum` marker — a width floor at the authored line, spacing both ways on question and list cells, and the authored page restored on save

### [READ FIRST] the state this lands in
- **The solver** `equalize.js` (243 lines) sizes every `.content-area .rows:not(.markup-row)` and is the only thing that sets cell widths. Constants `MIN_CELL 120`, `PROSE_FLOOR 200`, `STEPS 24`, `CENTER_MIN 12` (`:9-12`). Per row: `minW` from `getTableFloor` (`:34-47`, returns `PROSE_FLOOR` when the cell has no table), `maxW` from `getMediaMaxWidth` (`:63-69`) or, for prose in a row that also holds a table/drawing, `getProseMaxWidth` (`:73-82`, a hidden `width:max-content` clone appended to the row). 24-step loop trades width for height (`:150-167`); `apply` writes `data-eq` + `flex:0 0 Npx` + `width` (`:142-148`); then the 2-cell centering pass (`:170-182`, only when the gap > 12); `clean(root)` (`:196-209`) strips `flex`/`width`/`align-self`/`justify-content` and `data-eq` from a clone; the reveal (`:215-242`) runs the solver **4×** (DOMContentLoaded, fonts-or-1.5s, load, plus a re-run after fonts).
- **The sheet's vertical model** (`style.css:2954-2968`, `@layer spacing`): a gap belongs to the container. `--level-gap:20px` and `--cell-gap:14px` (`:41`); a frame's children `margin-block:var(--level-gap) 0` (`:2962`); **a cell's children `margin-block:var(--cell-gap) 0`** (`:2964`), **a cell's first child 0** (`:2965`), **a field (`input`/`textarea`/`select`/`button`) `margin-block-start:0`** (`:2966-2967`). A cell is `display:flex;flex-direction:column` (`:902`); the row is `display:flex;gap:26px;align-items:stretch` (`:903-904`).
- **A list's pitch** is the sheet's: `li{margin:0 0 calc(.7em + var(--para-gap));text-wrap:pretty}` (`:148`) with `--para-gap:8px` (`:41`) ≈ 19.9px per item; the last `li`'s bottom margin collapses out of the `ul`, so it does not count toward the cell's height.
- **The solver reads heights at each cell's own height** (`align-self:flex-start` during the solve, `:107-108`, restored at `:184-187`) because `align-items:stretch` would otherwise report the row's height for every cell.
- **B9's prose cap and B12's floor are the same number** for a spacing cell: a prose cell in a row with a table/drawing is capped at its `max-content` (`:98-103`). If a spacing cell is given a `max-content` floor it can no longer be narrowed at all in such a row, which is the intended outcome ("we just arent going to compress past the existing width of the text") — state that in the report rather than adding a second rule.
- **B14's centering stays** (`:170-182`) as the fallback for rows no spacing can equalize; run spacing **before** it, then let the gap decide whether centering is still needed.
- **The save path**: `engine2.js:49` (`fullPageHTML`) calls `EqualizeRows.clean(cl)`, so whatever the solver writes on a page must be in `clean()` or a saved page will carry it.

### [START] where the repo is
- `main` is at the commit that carries this file, pushed and clean; the only other working-tree entries are the owner's `.clinerules/.clinerules.md` and untracked `.headers.txt`. Nothing from an earlier batch is half-done: the solver, the sheet, the docs and every page are consistent, and `build-lessons.mjs --check` is clean.
- The solver stamp is `equalize.js?v=33d64bf0a5` on 23 pages (`build-lessons.mjs` writes it); editing `equalize.js` means running `node build-lessons.mjs` so the stamp follows, and the 23 pages' stamp line changes with it.
- Tools already in `qa/` that this batch leans on: `rowctx.mjs` (parses the sheet and asserts every rule resolves to its row context), `check.mjs` (loads a page, saves every answer), `cmcheck.mjs` (the map's structure), `mapcheck.mjs` (page structure), `batchcheck.mjs`, `liquid.mjs`. `qa/deal.mjs` is the re-deal tool and is not involved.
- Measured in this environment: Chrome `C:\Program Files\Google\Chrome\Application\chrome.exe`, pages served from the repo root at `127.0.0.1`, a gate script in `sessionStorage` (`{email,track,teacher,sig}`) is needed before a lesson boots, and `#page` scrolls — measure with `getBoundingClientRect()` after `scrollIntoView`, not with page offsets.



### [SURVEY] already run — the shapes, read-only, all 43 cells that carry a `.qnum`
- **26 cells: the questions are `p` or `.qitem` children of the cell.** Two sub-shapes, both real, and the same lever serves both:
  - **11 cells the control is INSIDE its item** — `<p><span class="qnum">1.</span> … <input class="gap">…</p>` (lesson1 6 items, lesson12 3+3, lesson13, lesson14 3+3, lesson15). A `div.qitem` holding `p.qstem` + `.qopts` is the same shape (lesson12).
  - **15 cells the answer is a SIBLING** — `[p14][input.gap][p15][input.gap]` (lesson20 4B `:233-247`, lesson12, lesson13 ×2, lesson15 ×2, lesson16 ×2, lesson19 ×3). The space to grow sits under an answer, so it is written on the **next question's** `margin-top`.
  - the lead `<p>` that sometimes opens the cell (an instruction, lesson12) carries no `.qnum` and is not an item.
- **3 cells: an `<ol class="seq viz" data-mode="turns">`** — dialogs whose numbered turns are speaker bubbles (lesson11, 16, 18). **Never spaced**: a dialog's rhythm is `--seq-gap:12px`, its turns are not questions, and B21 gave each turn its side.
- **10 cells: a chart table** — the `.qnum`s are inside `table` rows (lesson2/3/7/8/11/14/17/18/19). **Never spaced**: row heights inside a table are the table's, and B19 governs its header row.
- **4 cells: `.chips`** (unscramble) — the `.qnum` heads a chip run inside one `<p>`. **Never spaced.**
- **Every numbered item is answerable**: the `gap`/`opts` count equals the `qnum` count in all 32 multi-item cells. A cell with a single question has nothing to space and is left alone.
- **The user's marker caveat**: "not every question is a `<p>` ... there are some numbered items that shouldnt be height spaced, so the span class isnt a guarantee just a marker." So the test is structural — an item is a direct child of the cell that carries a `.qnum` **and** the answer control it introduces (inside it, or the `input.gap`/`.opts` immediately after it) — never the class name alone.

### [NOW] the failure this batch fixes, measured at 1400px on `business/lesson20-Needs-haves-and-shoulds.html`
- **4B** (`:233-247`) — the row is 2 cells 236 / 884 (row 1146, gap 26). `#15` **wraps** ("She shoulds check / the numbers.") because the solver narrowed the cell to 236 to buy height; the second cell measures 162 and the first 170, so the 8px gap is under `CENTER_MIN` and nothing centers it. The correct fix is the width floor + spacing, not a wider wrap.
- **3B** (`:187-213`) — list cell 519 wide with 6 meanings + a `.dim`, content 300; chart 284 and its rows are single-line, so no width change adds height. Today the 16px gap is centered (B14); with list spacing it compresses instead (−3.2px on each of 5 gaps).
- **8E** (`:464-489`) — same shape, content 236 (table) vs 253 (list) → −3.4px per gap.
- **5A** (`:253-331`) — no question or list cell, so it keeps today's behaviour (the prose centers its 25px gap). It is the control case: B12 must not change it.


### [RULES] what the solver does, as agreed in the earlier turns
1. **Width floor at the authored line.** A spacing cell is never narrowed past its widest authored line: `minW` becomes `max(PROSE_FLOOR, getProseMaxWidth(col))` for a cell that is a spacing cell. Authored wrapping stays (`width:max-content` keeps a `<br>`, and the clone must not clear an authored `max-width`); the solver adds no breaks of its own. This is the fix for 4B's `#15`.
2. **Spacing is the height lever, both ways.** After the width loop settles:
   - **questions**: each item after the first gets its `margin-top` set to `base + delta`, where `base` is the computed `margin-top` the sheet gives it (`--cell-gap`, 14px) and `delta` is this cell's share of the row's height difference; clamp to `0 … base + CAP`. In the sibling shape (4B) the item is the `<p>` that follows the previous answer, so the space opens under the answer and above the next question.
   - **lists**: each `li` except the last gets its `margin-bottom` set to `base + delta` (base ≈ 19.9px), same clamp. Expanding and compressing are the same line of code with a signed delta.
   - the authored spacing stays: 4B's `padding-top:14px` is page data and is never removed or folded into the delta.
3. **The target** is the height of the tallest cell that cannot space (a chart, a drawing, a dialog, a 5A prose cell). If every cell can space, the target is the tallest cell, so the shorter one expands (4B). The delta is the difference divided by that cell's gap count; a cell already at the target gets nothing.
4. **Which cells**: two kinds, never the row itself and never a cell that already holds a table, `figure`, `.seq`, `.chips`, `img` or `svg`:
   - **a question cell** — a cell whose direct children include **≥2 items** as defined in [SURVEY];
   - **a list cell** — a cell whose direct child is a `ul`/`ol` (not `.seq`) with **≥2 `li`**.
   Everything else (a chart cell, a dialog cell, a chips cell, a drawing cell, a single-question cell, 5A's prose) is untouched.
5. **Order inside `solveFixedRow`**: clear last run's inline spacing → measure floors → width loop → apply → spacing pass (cells still at `align-self:flex-start`) → centering pass (unchanged) → restore `align-self`. Every run recomputes; nothing accumulates, because the page is solved four times.
6. **Save path**: mark each element the solver writes with `data-eq`, and have `clean()` remove `margin-top` and `margin-bottom` (and any empty `style`) from every `[data-eq]`, so a saved page carries the authored spacing and re-solves on its next load. The *live* page keeps the spacing — `clean()` is only ever called on the save clone (`engine2.js:49`). Say this plainly in the report; it was misread once as "the solver's work is thrown away".
7. **Docs**: `PEDAGOGY-MAP.md` — authoring rule that a question's or list's spacing is never authored (no `<br>`, no padding) to gain height, the solver spreads and compresses it, and a question cell is never narrower than its longest question; `capability-map.html` — the solver item (near `:1075`) gains the spacing lever, and the "Learned during build generation" list may take the 4B mechanism if it is a new one.

### [STEPS]
1. **Confirm the two numbers the rules need, in one question, before code** (they are design values, not derivable): the per-gap cap (`CAP`, proposed **48px** — 4B's single gap needs ~43), and that compression may go to **0** (items touching). If the user answers, record it in this batch; if they leave it to you, use 48 / 0 and say so.
2. **`equalize.js`** — add `data-eq` clearing for spacing at the top of the solve; `getSpacingCell(col)` (returns the item list or null, per rule 4); `getAuthoredFloor(col)` folded into `minW`; `spread(col, target)`; call it after `apply` and before centering; extend `clean()`.
3. **Verify on `business/lesson20`** — 4B: `#15` on one line, the two questions spaced, both cells' content heights equal within ~2px, `justify-content` not set; 3B and 8E: the list compressed, cell heights equal within ~2px, no centering; 5A unchanged; the row still exactly 1146px wide with no cell past the page. Then a lesson with the `<p>`+`input` sibling shape and one with `.qitem`s (lesson1, lesson11, lesson12) and one dialog lesson (11/16/18) untouched.
4. **`node --check equalize.js`, `node build-lessons.mjs`** (the solver is stamped `equalize.js?v=<hash>` into 23 pages — the build must run so the stamp matches), then `build-lessons.mjs --check`.
5. **QA**: `qa/rowctx`, `qa/check --track=business 20` (plus 1 and 12), `qa/cmcheck`, `qa/mapcheck`, `qa/batchcheck`, `qa/liquid`. Known pre-existing failure: `qa/check --track=business 11` reports "30 answer controls resolve no anchor" — content, present before this work.
6. **Save-path check** (Chrome, one page): open the page, let it solve, call `EqualizeRows.clean` on a clone and confirm 0 items keep `margin-top`/`margin-bottom`/`data-eq`; the live page keeps them.
7. **Commit and push**, with the report naming the numbers each block ended at.

