# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
A batch and its steps must be removed from this file when all of the batch's steps are completed. Any batch or step which is stale must be deleted.
---

# [CURRENT]

## [B1] - a demo folder on an unindexed track: pages anyone can open, edit and keep <"i want to use this track to make demo pages so actually anyone should be able to enter the pages without logging in at all. i just dont want the track indexed or reachable from the other pages for now. do extra should be a folder, but just excluded from the index and excluded from any qa/checkers"> <extra/ holds track.json {"demo":true} + lesson1-The Capability Map.html; engine1/engine2 honour window.OPEN; build-lessons, qa/track, qa/mapcheck, qa/batchcheck skip demo folders through qa/demo.mjs>
- [S1] ✔ done — engine1.js + engine2.js derive the repo root from the script's own `src` (`E1_SITE` / `SITE`), used for the index redirect, `lessons.json`, `tracks.json` and the injected `layout.js`.
- [S2] ✔ done — edit mode edits the authored page: `toggleEditMode` calls `EqualizeRows.clean(document)` on entry, holds the real `run` at a no-op, restores `eq-ready`, and puts both back on Done. Verified in headless Chrome.
- [S3] ✔ done — `extra/` is a folder holding `track.json` `{"demo":true}`; `qa/demo.mjs` is the one test of that marker, asked by `build-lessons.mjs`, `qa/track.mjs`, `qa/mapcheck.mjs` and `qa/batchcheck.mjs`. Verified: no `extra` key in lessons.json, no `extra` in tracks.json, absent from `TRACKS`, absent from a `batchcheck --all` run.
- [S4] ✔ done — `extra/lesson1-The Capability Map.html`: the map's content in the lesson shell (brand bar, control bar, content area, notebook, footer), `window.OPEN=true` so no gate and no server read or write, asset paths rewritten for one folder down. Verified in headless Chrome with no gate present: page loads and solves, ✏️ Edit appears, edit mode drops the solver's `flex: 0 0 824px` to the authored 560px, Done restores it.
- [S5] done — one copy. `qa/mapcheck.mjs`, `qa/cmcheck.mjs`, `qa/cssdiff.mjs`, `PEDAGOGY-MAP.md` and `FILESYSTEM.md` all read `extra/lesson1-The Capability Map.html`; the root `capability-map.html` is deleted. The map is edited in place like any other page (edit mode → 💾 Save to repo).
- [S6] open — flesh the page out so it demonstrates what a section is: one idea per section with its explanations, references, notes and the training built on them.

