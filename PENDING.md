# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user words that guide this task compressed to 1 sentence> <artifact produced>`
A batch and its steps must be removed from this file when all of the batch steps are completed. Any batch or step which is stale must be deleted.
---

# [CURRENT]

## [B1] - Give the h3 cool slate a dark-block version in steel blue <"give our new h3 font color a dark mode version, it can be steel blue or osmething like that"> <`style.css` — `--h3-ink` carries the slate, restated steel blue in `.block[data-look="dark"]`>
- [S1] token — `--h3-ink:oklch(38% .03 250)` in `:root`; h3 and h3::before read it; dark block restates `oklch(70% .075 250)`
- [S2] verify — computed colours in the light and dark blocks, contrast on the dark paper, restamp + `npm run map`



