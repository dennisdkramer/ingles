# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user words that guide this task compressed to 1 sentence> <artifact produced>`
A batch and its steps must be removed from this file when all of the batch steps are completed. Any batch or step which is stale must be deleted.
---

# [CURRENT]

## [B1] - Index the activity types under section 1a's table, and pin every block headline to the same height <"clean up the index in section 1 and add another index of our activity types ... put it below the table in 1a ... the h3 in 2b is sitting way too low, make sure the h3 position is universal and does not move depending on the text inside its cell or block"> <`extra/lesson1-The Capability Map.html` §1a — the strip row leaves the visual index; a 12-row activity table (best-for → activity, linked) sits under it; `#translation` gets an id; all blocks' h3 land on one top edge (`style.css` spacing rule; `equalize.js` stops centring a heading-first cell)>
- [S1] §1a clean up — remove the `#stripgaps` row from the visual index (`:53`)
- [S2] §1a activity index — the 12 `data-activity` types, page order, 2 columns, links to their demos (`:41–56`; `#translation` has no id, `:2009`)
- [S3] h3 top edge — `.rows>.block>h3:first-child` gets the frame's `--level-gap` (`style.css:3208`) and `equalize.js:300–305` skips a cell whose first child is a heading
- [S4] extra/lesson1-The Capability Map.html — dead anchor: #recipient (`check2` · `dead-anchor` · fix)
- [S5] extra/lesson1-The Capability Map.html — stub label points at nothing: #recipient (`check2` · `stub-label-points-at-nothing` · fix)

