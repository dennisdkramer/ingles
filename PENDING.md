# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
---

# [CURRENT]
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

# PAST BATCHES
## [B1] - the answer pill a second field loses, and a home for what a build teaches "integrate learned info into guidance ... add a block near the bottom of capability map thats like 'Learned during Build generation' and wire up part of the generation process to add and update notes there" — one pill per control, a map section of definitive items, and the loop step that maintains it
[1] engine2.js — `applyCompleted` gives each control its own `.ans` pill, so a cell with two fields shows two answers (7c1)
[2] capability-map.html — `<h2>Learned during build generation</h2>` after Games: the numbered key, the drifting index, two controls one cell, the build artifacts, the unstamped link, the map's own grid — definitive, no issue reports
[3] PEDAGOGY-MAP.md — step 0 reads that block; the lesson's close appends to it, one line, the mechanism learned
[4] verify (probe, qa:liquid, cmcheck, mapcheck, batchcheck, build:check), commit, push

