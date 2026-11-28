# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user words that guide this task compressed to 1 sentence> <artifact produced>`
A batch and its steps must be removed from this file when all of the batch steps are completed. Any batch or step which is stale must be deleted.
---

# [CURRENT]

## [B1] - Rescue the translation demo into section 2, then delete section 6 and everything below it <"delete everything from section 6 and below because its redundant ... if there are any activity types that are in section 6 and below but not represented prior to that, bring the block with that activity ... delete everything that is left in section 6 and below, including its associated markup boxes"> <`extra/lesson1-The Capability Map.html` — the live translation block moves to the bottom of section 2; sections 6–16, the Quiz markup boxes and the notebook are deleted>
- [S1] translation — only `data-activity` below `:1747` with no live block above; copy its block from `:2041–2061` to the bottom of section 2, before `<h2>Verify</h2>` (`:1681`)
- [S2] delete — `<h2>Where a thing is…</h2>` (`:1747`) through `<textarea id="feed">` (`:2612`), including the three Quiz markup boxes (`:2559`, `:2580`, `:2597`)
- [S3] verify — `npm run map`, anchors from the kept page, commit and push


