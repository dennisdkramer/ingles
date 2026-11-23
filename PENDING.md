# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
A batch and its steps must be removed from this file when all of the batch's steps are completed. Any batch or step which is stale must be deleted.
---

# [CURRENT]

## [B1] - the capability map becomes a real page on a hidden "extra" track, with the engines and edit mode <"i want the engines on the capability map, i want it to reflect everything that a real page would have, and we can add a 'track' which is called 'Extra' and exclude it from the index but use it for this, call the capability map #1 on the track."> <capability-map.html loads engine1/2/4 with TRACK="extra", L=1; engine paths derived from the script's own address>
- [S1] ✔ done — engine1.js + engine2.js derive the repo root from the script's own `src` (`E1_SITE` / `SITE`), used for the index redirect, `lessons.json`, `tracks.json` and the injected `layout.js`: a page at the root and a page one folder down both resolve.
- [S2] ✔ done — edit mode edits the authored page: `toggleEditMode` calls `EqualizeRows.clean(document)` on entry, keeps the real `run` in `eqRun`, replaces it with a no-op so a late font cannot re-solve mid-drag, restores `eq-ready`, and puts both back on Done. Verified in headless Chrome on business 26: cell `data-eq` + `flex: 0 0 579.583px` → no attribute, no style, 587px (the grid's even share) → back again after Done.
- [S3] capability-map.html: the shell chrome a lesson has (toast, brand header, control bar, content area, notebook, footer), the constants block with `TRACK="extra"`/`L=1`, the four engines plus `player.js`/`equalize.js`/`pronkey.js`, and the load-check banner.
- [S4] flesh out the map so it demonstrates what a section is: one idea per section with its explanations, references, notes and the training built on them — then re-read its own rows against the new guidelines.
- [S5] keep the track out of the index: no `extra/` folder is created; confirm `build:check`, `mapcheck`, `cmcheck`, `batchcheck` and `align` still pass.

