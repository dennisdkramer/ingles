# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
---

# [CURRENT]
## [B8] - a page that loads the solver is hidden until its rows are sized "put the page in a loading state until it is solved and fade in the content ... go with (a) as described" — the reveal after fonts/timeout, a CSS fallback, the page marker, and the solver's own stamp
[1] ✔ `equalize.js` — `eq-ready` after the first solve following `document.fonts.ready` or 600ms, whichever first; `load` re-solves; a `try/finally` always reveals; `clean()` strips `eq-ready` from the saved `<html>` and keeps the page's `data-eq`
[2] ✔ `style.css` — `html[data-eq]:not(.eq-ready) .content-area` hidden with a 2.5s CSS reveal fallback; `html.eq-ready` fades in; `body.layout-on` / `body.editing` always visible
[3] ✔ 20 business lessons, `capability-map.html`, `_shell.html`, `_shell-preview.html` — `data-eq` on `<html>`
[4] ✔ `build-lessons.mjs` — `equalize.js?v=8cef9f9982` stamped on the 23 pages that load it, the hash over LF text; `build:check` catches a stale solver
[5] ✔ `capability-map.html` + `PEDAGOGY-MAP.md` — the loading mechanism and the solver stamp stated
[6] ✔ verify — `node --check` clean; Chrome: `DCL` hidden / `eq-ready` visible, 2.5s fallback reveals, `body.layout-on` and `body.editing` visible, saved clone loses `eq-ready` and keeps `data-eq`, row widths unchanged (`business` R1 528/592, R5 219/901, R12 920/200; map R5 468/200/200/200), unmarked `index.html` never hidden; `qa/rowctx`, `qa/check` business 20, `qa/cmcheck`, `qa/mapcheck`, `qa/batchcheck`, `qa/liquid`, `build:check` pass; committed and pushed
## [B9] - the veil is a whole-page 50% fade, the page and header fade over 1s and the content over 1s from .8s, and the row solver stops widening a prose cell past its content "veil fade away evenly ... content area fade in as a wipe ... start at .8s" then "everything transparent and 50% veil ... header and content area background fade in ... at .8s the content area begins its 1s fade" + 8E "a cells width should never be arbitrarily more than what it contains" — the page/header/content fades, the prose max-content cap, and 2-cell centering
[1] ✔ `equalize.js` — reveal at fonts or 1.5s; a prose cell in a row that has a table or media is capped at its `width:max-content` clone, so the table takes the slack (8E UL 772→447, table 348→673; 3B 366→601 / 754→519); a 2-cell row centers the shorter cell's content when the heights still differ (3B, 5A, 8E; 6A and 8C too; 4B's 10px stays top-aligned); `clean()` strips `justify-content`
[2] ✔ `style.css` — the page-container paper/grain moved to `::after`; at load the veil is 50% and the paper, frame, border, shadow, header and content are transparent; at `eq-ready` the veil fades 1s `linear` while the paper, frame, border, shadow and header fade 1s `linear`, and the content fades 1s `linear` with `.8s` delay; 4s/5s fallback; editor exempt
[3] ✔ verify — Chrome timeline: `eq-ready` at .900s, veil 0 at 1.974s, paper/header/border at 1.974s, content first moves at 1.775s and reaches 1 at 2.773s (1.87s from `eq-ready`); no-script page: veil fades 4.68s→5.57s and paper/header/content appear at 5.67s; editor: veil `none`, paper/header/content 1, border ink; saved clone loses `eq-ready`, keeps `data-eq`, 0 `justify-content`; `qa/rowctx`, `qa/check` business 20, `cmcheck`, `mapcheck`, `batchcheck`, `qa/liquid`, `build:check` pass
[4] ✔ report — the 8E cause (a prose cell's `maxW` was Infinity, so `fit` handed it the row's surplus) and the 4B answer (a `qnum` is inline; its top padding adds no line height; the lever is a prose floor + block spacing)

## [B10] - every vertical gap belongs to its container at one value per level "put the top padding on the level, so a row, a bare <p>, etc that is the direct child of the content area or of a frame gets that 20px padding, and same thing with the third layer at the cell ... leave h1 and h2 as they currently are" + the framed-child choice "Uniform margin-top at each level — external 20px, 0 on a cell's first child and on inputs" with "14px at the cell level" — the three level gaps, the element-level space deleted, and the framed-child exception resolved by keeping the gap external
[1] ✔ `style.css` — `--level-gap:20px` and `--cell-gap:14px`; the content area's grid `row-gap` 20 (was 22, its children's own margins 0), a frame's direct children 20, a cell's direct children 14 (first child 0, answer fields 0); the frame's text padding keeps its sides only; the rhythm block (14/12/7/10/7), the first-child 14, the `.dim` 7/4, the prose `h4` margin and the `p:has(+.opts)` margin deleted; `.rows` loses its own 20px top padding; `.viz` loses its 3px translate; `#feed` margin 0; h1/h2 untouched
[2] ✔ `equalize.js` — the 2-cell centering removed: it pushed a short cell's first child down, which is exactly the top the flush makes equal; every cell now starts at 0 and a short cell's blank sits below its content
[3] ✔ verify — the four blocks: first-child margin 0 on all 8 cells; answer fields 0; 3B chart blank 16, 8E 17, 5A prose 24, list cells flush (−1/−2px rounding); 4B still wraps #15 (that is [B12]); screenshots of kids 1, adult 29 and business 20 show the level gaps; `qa:rowctx` (16 layers), `qa:check` business 20 + adult 29 + kids 1, `cmcheck`, `mapcheck`, `batchcheck`, `qa:liquid`, `build:check` pass; commit, push
[4] ✔ `capability-map.html` — a "Every vertical gap is its container's" item; the stale "a two-cell row centers the shorter content" sentence removed
## [B12] - the solver gains spacing as a height lever for question and list cells "i just want the js to be able to use spacing between questions as the primary way to gain height ... and maybe for lists too ... Include it with the question spacing" + "i want that space to be compressed to reduce height too" + the `span.qnum` marker — question/list cells only, a width floor at the authored line, and a read-only shape survey first
[1] survey — every question/list container inside `.rows>div` the solver would tag, and every `.qnum` it would skip
[2] `equalize.js` — a question item is a `.qnum`-bearing element plus the answer control it introduces; a list cell is a direct-child `ul`/`ol`; ≥2 items; the gaps expand to the row target and (lists) compress; a question/list cell is never narrowed past its widest authored line; `clean()` restores
[3] verify — 4B one line + spacing, 3B/8E list compressed, the row targets; QA, commit
## [B11] - the control bar and its legend are part of the header "put them inside the header wrapper so whenever I say anything about the header, they are included ... part of the header fade in" — the header wrapper on every page that has the pattern
[1] ✔ 98 tracked pages — the two divs moved inside `<header class="brand">`; the ignored `.old/` copies were moved too but are not in the commit; `index.html` and `preview-vehicles.html` carry no control bar
[2] ✔ `style.css` — `.brand` loses its 14px side padding; `.brand .control-bar` and `.brand .barhelp` fill the header (both stay at left 15, width 1400); the `#98 SHELL` header comment
[3] ✔ `capability-map.html` — the header wrapper holds the brand, the control bar and its legend
[4] ✔ `build-lessons.mjs` — every page in the tree that links the sheet now carries its stamp, not only the manifest pages (99 stamped)
[5] ✔ verify — `containsCb`/`containsBh` true on business 20, the map, adult 29 and kids 1; control bar 15/1400 and legend 15/1400 on all four; header 318 tall, content top 336 (unchanged); fade still holds header at 0 then 1 with the controls inside; fallback/editing/save pass; `qa:rowctx`, `qa:check` business 20 + adult 29 + kids 1, `cmcheck`, `mapcheck`, `batchcheck`, `qa:liquid`, `build:check` pass



---


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

## [B13] - the pointer and the outline look's edge on hover "make the mouseover for buttons, radios, checkboxes use the pointer, and have a mouseover highlight that uses the same visual as the outline look" — the ring on the three control types, the older hover effects retired
[1] `style.css` — `button`, `input[type=radio]`, `input[type=checkbox]`, `.opt` take the pointer (disabled/locked default); on hover each wears the outline look's edge, `outline: var(--edge-w) solid var(--accent)`, 2px offset; the generic button's brightness/lift, the control bar/welcome bar's accent fill and the `.opt`'s border hover retired
[2] ✔ verify — computed in Chrome: a control-bar button and a lesson-20 button (idle `outline:none`, hover `2px solid oklch(.58 .14 210)` at offset 2), an `.opt` pill (the block's own accent, hue 65), a `.qopts` label and a `.flip` card (hue 65) all ring; the dot inside its label takes none; every cursor is `pointer`; `label:has(>input)` makes the label the hit area for the bare radios and the flip checkbox; `qa:rowctx`, `qa:check` business 20/1, `cmcheck`, `mapcheck`, `batchcheck`, `qa:liquid`, `build:check` pass (`qa:check` business 11 reports 30 answer controls with no anchor — content, present on the previous commit too, not the sheet)
## [B14] - the 2-cell vertical centering returns "it looks like the vertical centering (center the shorter item in a 2 cell row when their heights cant be equalized) was removed, i want it back" — the solver centers the shorter cell again, at the gap the flush now leaves
[1] `equalize.js` — after the last `apply`, a 2-cell row whose content heights still differ by more than `CENTER_MIN` (12) centers the shorter cell's content (`justify-content:center`); the previous decision is cleared first on every run; 3+ cell rows stay top-aligned; `clean()` already strips it
[2] `capability-map.html` — the level-gap item records the centering and its 12px gate
[3] verify — the four lesson-20 blocks before/after (3B 16, 8E 17, 5A 25 center; 4B 8 stays flush), QA, commit, push



## [B15] - a full shuffle for matching and unscramble, and section 1 told straight "matching answers and unscramble words MUST be scrambled/randomized. one item being switched is insufficient, they need to be completely shuffled" + "rewrite section 1 ... a sections content does not HAVE TO go into a row ... a cell doesnt have to be one or two items ... no width is written on the cell is the ONLY part that is true" — the rule wherever it belongs, the map's own examples, and every authored item deranged
[1] ✔ `capability-map.html` section 1 — the first paragraph rewritten: a section's content is arranged by what it teaches; a row is a line whose children are its cells; a cell holds whatever its content needs and its share is settled against its neighbours; any number of rows, or none; the false width/table/equalize claims and the "one row, one or two items" prescriptions gone
[2] ✔ `capability-map.html` — the `#matching` and `#chunks` markup blocks state the rule; the `#chunks` specimen's chips re-dealt (never, that, has, anyone, she, told / when, I got there, he, already, had, left), the `#matching` specimen checked (already deranged) and its instruction now says the phrases are in no order
[3] ✔ `PEDAGOGY-MAP.md` — the authoring rule beside the multiple-choice shuffle: a matching's rows and an unscramble's chips are fully shuffled, never the answer order with one item moved
[4] ✔ 21 matchings in 18 files and 29 chunk sentences in 12 files (all business) — the phrase/answer pairs moved across the numbered rows (the numbers stay put on the page's sequence), the chips re-dealt and renumbered in display order; every order is a derangement and no deal is the old order or a disguised ascending run; the two 3-chip sets (whose only derangements are the two rotations) allowed their rotation
[5] ✔ verify — `--verify` re-reads every block: 0 in place, 0 unsegmented; the case-duplicate words ("The"/"the") are matched case-exact first, so a lowercase chip is never credited with the capital's position; `qa/check` business 2, 10, 13, 16, 19, 20 pass; `mapcheck`, `cmcheck`, `batchcheck`, `qa:liquid`, `build:check` pass; commit, push
## [B16] - the hover highlight is the outline look's moving wash, not a ring "i wanted the mouseover highlights on buttons etc that you did before to apply the outline looks's animated background, not a border" — the gradient and the 1s --grad turn on the same controls, the ring gone
[1] `style.css` — `#64 HOVER`: the outline is removed; the same controls carry `--grad` and the 1s transition, and on hover take the outline look's own gradient (accent at 15%, transparent at 62%) with `--grad:180deg`, so the wash rises; at rest the control keeps its own background; the flip card paints the wash on its `.face`, which covers the label
[2] ✔ verify — Chrome: at rest `background-image:none`, `--grad:0deg`; on hover the look's gradient with `--grad` visibly interpolating 13° → 127° → 180° over 1s on the control-bar button, the `.opt` pill, a `.qopts` label, the flip's `.face` and the radio dot; `outline:none` everywhere (the ring is gone); the bar button re-sampled after a 4s settle holds 180° (its first run lost the hover to the control bar's own render at load); the unchecked controls are untouched at rest and a checked `.opt`/dot keeps its accent fill; `qa:rowctx`, `qa:check` business 20, `cmcheck`, `mapcheck`, `batchcheck`, `qa:liquid`, `build:check` pass; commit, push

## [B17] - the re-deal tool is kept in qa/, unwired "keep the re-deal script in qa/ for future use but dont wire it to anything now" — a qa/ tool, no npm script, no run.mjs member, no build hook, no doc reference
[1] ✔ `qa/deal.mjs` — the working script with a header (what it does, the three modes, the rule it serves, that it is manual), the root resolved from the file, and the page's own line ending preserved when it writes
[2] ✔ verify — `node --check` clean; `node qa/deal.mjs --verify` from the repo root reads all 50 activities (21 matchings, 29 chip sets), 0 in place, 0 unsegmented; `package.json` and `qa/run.mjs` hold 0 references to it, the build never calls it; commit, push






## [B18] - the chart frame and header rule fade, the column headers centre and grow 3pt, and h1/h2 take h3's font "at the root, reduce chart border opacity by 20%, center chart column headers, increase their font size by 3pt and set their opacity to 80%, set H1 and H2 font to the current font of h3 but dont change any of their other properties" + "the outer 2px frame. Also reduce the line below the header row to 1px and make it 80% opacity"
[1] ✔ `style.css` — the `.chart` frame ring 2px at 80% of its colour (`:1567-1571`); `.chart thead th` centred, `calc(1em + 3pt)`, `opacity:.8`, and its bottom rule 1px ink at full paint so it renders at the header's 80% (`:1582-1585`)
[2] ✔ `style.css` — the `h1` and `h2` base rules take `var(--display)`, the family `h3` uses (`:100`, `:103`); size, letter-spacing, margin, rule and decoration untouched; the header logotype (`.brand h1`) keeps its own font
[3] ✔ computed — `thead th` 21px (17px + 3pt), `text-align:center`, `opacity:0.8`, rule `1px` ink; frame ring `oklab(… / 0.8) 0 0 0 2px`; `h1`/`h2`/`h3` all `"Cormorant Garamond", Georgia, serif`, with `h1` still 38px / 5.32px tracking and `h2` 28.67px; build stamped, commit, push


## [B19] - a chart header must teach, so the ones that only name what a column plainly holds are collapsed "table headers like Form / What it means / The sentence are not materially useful ... remove the column header text from the first chart and collapse the header just like the other table examples ... write into the guidance ... sweep the current business lessons and collapse all headings that should be collapsed"
[1] ✔ `capability-map.html` — the first chart (the Concept/Visual index) is collapsed to the 3px row; the `#chart` guidance carries the rule: a header is written only when it names a contrast, a category, or the question the column answers, and a header that only names what a column obviously holds is removed
[2] ✔ `PEDAGOGY-MAP.md:63` — the same rule beside "the tests are the gate", with the bare-thead markup
[3] ✔ `style.css` — `.chart tr.bare th` keeps `opacity:1`, so a collapsed row is the full 3px rule and not the header's 80%
[4] ✔ 33 business headers collapsed (lesson4 2, lesson6 2, lesson11 3, lesson13 4, lesson14 1, lesson15 4, lesson16 2, lesson17 2, lesson18 4, lesson19 4, lesson20 5); 35 kept because a header names a contrast/category the lesson teaches (Written/Said, Now/Past, Around now/In general, Which one?, Where it sits, Both orders work/Or only one, With the doer/Without it, Strength/Where it comes from, Rung/Who it is for, Portuguese/English and the conjugation tables)
[5] ✔ verify — the sweep re-read every business thead: 35 left, all informative; `mapcheck` clean (existing kids warning), `cmcheck` OK, `batchcheck` passes, `qa:liquid` clean, `qa:check` business 13/17/20 pass (11 fails on its pre-existing "30 answer controls resolve no anchor"), `build:check` clean, commit, push


