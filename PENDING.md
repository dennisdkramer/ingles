# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
---

# [CURRENT]
## [B7] - the fixed-width row solver "I want to make some changes to the formatting of our pages ... implement into our project ... all at the root and effecting all pages, not scoped" — one root solver over every `.rows`, the sheet's media rule, and the runtime widths kept out of saved pages
[1] ✔ `equalize.js` — every `.content-area .rows` (`.markup-row` build tools excluded) sized at load: a table's floor is its widest nowrap row, `img` and `svg[width="100%"]` never pass their own width, prose never below 200px, heights read with `align-self:start` because the sheet stretches every cell, widths fitted to the row without exceeding a media cap; re-runs on fonts and load; `EqualizeRows.clean(root)` strips the runtime `flex`/`width` for the save path
[2] ✔ `style.css` — a row's media (`img`, `svg[width="100%"]`) scales down with its cell and never past its own size; `flex:1` stays the no-JS start state
[3] ✔ `business/lesson20-Needs-haves-and-shoulds.html` and the other 19 business lessons — the 54 authored cell `flex` styles deleted (superseded by the solver); the solver script tagged
[4] ✔ `_shell.html`, `_shell-preview.html`, 20 business lessons, `capability-map.html` — the solver script tagged on every page that carries a `.rows`
[5] ✔ `build-lessons.mjs` + every page — the sheet stamp (`style.css?v=<hash>`) written into every lesson page, the shell and the root pages, so a changed sheet is fetched on the next load; the hash is taken over LF text so a Windows and a Linux checkout stamp the same URL; the map's "a lesson page stamps nothing" line restated
[6] ✔ `engine2.js` — `fullPageHTML` calls `EqualizeRows.clean(cl)` so a saved page never carries the solver's widths
[7] ✔ verify (`node --check equalize.js`, Chrome geometry before/after on both reference pages, `qa:rowctx`, `qa:rowctx --self-test`, `qa:check` business 20 / adult 40 / kids 44, `cmcheck`, `mapcheck`, `batchcheck`, `build:check`, `qa:liquid`) — all pass; commit, push
---


## [B2] - the layout tool and the save path that lands a page in the repo "i want to be able to move elements at any level ... a local script that hears a lesson file fall in downloads ... for that same script to run a git push" — drag any node in edit mode, an inspector over rows and cells, and a watcher that places the page
[1] ✔ `layout.js` + `style.css` — drag any node inside `.content-area` (block, cell, paragraph, div, table) with its subtree; insertion line, undo, `clean()`
[2] ✔ `engine2.js` — the layer loads with edit mode; **Save to repo** downloads the cleaned document under the page's own filename; **Clear page ink** deletes highlight/note/answer/complete for this track+lesson (notebook kept)
[3] ✔ the inspector — every `.rows` outlined and numbered `R1, R2 …`, every cell numbered `1, 2, 3`, a cell carrying an inline width marked red, and a panel naming the cell under a press: section · row · cell · tag · inline style · resolved flex
[4] ✔ style.css — the row keeps content-proportional cells (lex:1 1 auto), with the note recording that equal shares was tried on 2026-11-20 and reverted
[5] ✔ the drag grain and the drop between rows — the smallest thing a press picks up is a `p`, a `.qitem`, a chart or a cell (never a word), and a drop between two `.rows` is its own target, so a cell can leave a row and stand between rows
[6] the gesture — layout mode holds the area at `contenteditable="false"`, so a press drags and a click inspects; **Shift** gives text while held and a **double-click** turns text mode on until Esc
[7] `qa/watch-saves.mjs` + `qa/watch.cmd` + `package.json` — watch Downloads, wait for the write to settle, resolve the target from the page's own `TRACK`/`L`, back the old file up, `build:lessons`, commit that file + `lessons.json`, push
[8] `PEDAGOGY-MAP.md` — a row carries multiple cells, the count content-aware against its neighbours; stacking is how a cell gets taller; no inline width on a cell unless the flow was wrong; and `FUNCTION.md` — the layout layer mutates the DOM and saves through the content row
[9] verify (jsdom drags, inspector, save, `node --check`, `qa:liquid`, `qa:check`, `mapcheck`, `batchcheck`, `build:check`), commit, push
---

## [B4] - the row is one flex line of equal cells, and the sheet stops explaining itself "ignore my prior guidance not to change that part of the css, remove all the guidance, every style in the .css that relates to rows, flexbox, stretch, alignment - set it back to the default, then apply the style that i just suggested at the root" — the row/cell machinery and its comment block deleted, three root rules in their place, the guard and the docs restated to match
[1] ✔ `style.css` — lines 898–964 gone (`.cols` flex pair, the 43-line "DO NOT CHANGE" block, the quarter-of-the-page cell floor, the `.viz`/`.vz-map` stretch exception, the `:has(.chartwrap)` chart exception, the six-selector panel rule, `container-type:inline-size`); in their place `.rows>*,.cols>*{flex:1;min-width:0;display:flex;flex-direction:column}` then `.rows,.cols{display:flex;gap;align-items:stretch}` — cells equal, order puts the container last so a nested row is a row
[2] ✔ `qa/rowctx.mjs` — `WANT` becomes the new row values, the cell must resolve `flex:1`, `min-width:0`, the chart-cell and quarter-floor assertions removed, and the self-test plants `.rows>*{flex:1 1 auto}` to prove a stale rule is caught
[3] ✔ `PEDAGOGY-MAP.md` — [2] "a cell never drops below a quarter of the page" and [1b] "widths are floors or exact halves" restated: cells are equal shares, an inline flex is the only repair
[4] ✔ `capability-map.html` — the row paragraph and its "mixed row always needs the repair" sentence state the equal-share model
[5] ✔ `business/lesson11-20` — the twenty inline `flex:0 0 calc(50% - 13px)` halves from the previous batch removed; the root model governs
[6] ✔ uniformity — the `>:only-child{flex:1 1 auto}` line removed, so no child of a cell carries a flex of its own; and the two width huggers went too: `.chart{width:100%}` and `.chartwrap{width:100%}`, so a chart fills its cell like any prose
[7] ✔ `business/lesson19-People-in-a-building.html` — the five hand-written `flex:0 0 auto` cells removed; the page has 18 rows and 0 cells carrying an inline style
[8] verify (`qa:rowctx`, `qa:rowctx --self-test`, `qa:check`, `mapcheck`, `batchcheck`, `cmcheck`, `build:check`), commit, push
---

## [B6] - capability-map's cells obey the row rule "make sure there is no hand-written css affecting the stuff we're working on now" — 17 inline layout styles stripped, so no cell on the map carries a width of its own
[1] ✔ `capability-map.html` — 15 cell styles removed (`justify-content:center` ×1, `flex:0 1 auto;justify-content:center` ×4, `flex:1 1 auto`, `flex:0 0 auto`, `flex:0 0 calc(50% - 13px)` ×4, `min-width:calc(33% - 13px)` ×3, `min-width:calc(50% - 13px)` ×1) and 2 table styles (`width:100%;height:100%;flex:1 1 auto`, `width:100%`); the map now has 0 cells with an inline style and div 150/150
[2] verify (`cmcheck`, `mapcheck`, `batchcheck`, `build:check`), commit, push
[3] answer the mechanism — `flex:1` is basis `0%`, so content contributes nothing to width and every cell takes an equal share; `align-items:stretch` makes the boxes equal height while a short cell's content keeps its own height

## [B5] - `.cols` is gone, and a row is the only container "is there anywhere that .col is being applied? i thought we were not using columns anywhere" — the class deleted from the sheet, its four clients moved to `.rows`, and the spacing selectors left naming one container
[1] ✔ `capability-map.html` — the four `class="cols markup-row"` rows are `class="rows markup-row"`; the row paragraph no longer offers `.cols` as a second container
[2] ✔ `style.css` — `.cols` removed from the cell rule (899), the container rule (900) and deleted at 902; dropped from the four `:is(.cols,.rows)` groups (945, 955, 956, 957, 1538) and from the `>.cols` selector at 952; `.markup-row` keeps `gap:10px` only, so its boxes sit on one line with every other row — the owner wants no wrapping anywhere
[3] ✔ verify (`qa:rowctx`, `mapcheck`, `cmcheck`, `batchcheck`, `build:check`, `qa:liquid`), commit, push — `30151ef`

# PAST BATCHES
## [B1] - the answer pill a second field loses, and a home for what a build teaches "integrate learned info into guidance ... add a block near the bottom of capability map thats like 'Learned during Build generation' and wire up part of the generation process to add and update notes there" — one pill per control, a map section of definitive items, and the loop step that maintains it
[1] engine2.js — `applyCompleted` gives each control its own `.ans` pill, so a cell with two fields shows two answers (7c1)
[2] capability-map.html — `<h2>Learned during build generation</h2>` after Games: the numbered key, the drifting index, two controls one cell, the build artifacts, the unstamped link, the map's own grid — definitive, no issue reports
[3] PEDAGOGY-MAP.md — step 0 reads that block; the lesson's close appends to it, one line, the mechanism learned
[4] verify (probe, qa:liquid, cmcheck, mapcheck, batchcheck, build:check), commit, push

## [B3] - the novelty rule no lesson can satisfy "you can adjust batchcheck to advois that problem in the future" — a vacuity guard for a window that already names the palette, a self-test pinning it, and the map line corrected
[1] `qa/batchcheck.mjs` — `checkWindows` skips novelty when the union of the previous three rows is the whole palette, and the header states the skip
[2] `qa/batchcheck.mjs --self-test` — a case where three rows spend all twelve elements and the fourth repeats one: no failure
[3] `capability-map.html` — the novelty item records the guard instead of only the dead end
[4] verify (`batchcheck:self`, `batchcheck`, `mapcheck`, `cmcheck`), commit, push — `02db153`

