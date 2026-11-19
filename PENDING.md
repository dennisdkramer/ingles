# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
---

# [CURRENT]
---
## [B14] - Clean up the flash-card example at the bottom of capability-map 4B <"look at the bottom of 4b on the capability map and clean up the flash card section there"> <capability-map.html §4B: `#flip` and its reveal leave the `.rows` cell that squeezed them (the group is now a block-level wrapping flex row, `#comic` keeps the row alone), the reveal belongs to the cards again, card 1's two faces become one item and what it means like the other two, and the single 150-word note is split into mechanism / width / group-rule paragraphs — checked by jsdom: `#flip` is not a descendant of `.rows`, and `<h2>Dialogs and activities</h2>` is still a direct child of `.content-area` (no lost close)>
---
