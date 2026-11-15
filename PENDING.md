# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
`   - [Sn] - <the distinct goal unique to this step> <the File & Section name of the rules which are most relevant> <exit condition>`

- For any [change in plans] or [deviation from the batching/order in pending.md], update any relevant [Bn] and/or [Sn]] to reflect the change(s)
- When a step or batch is finished, dropped, or stale, it is deleted.
- **This file is edited in place, never rewritten**: an edit anchors on the `[CURRENT]` batches only. `# [HANDLING]` and `# [CURRENT]` are the file's spine — an edit whose `old_text` spans or replaces them has destroyed the authoring format, which is how it was lost once.

# [CURRENT]

## [B1] - Lesson-page row alignment: the void under the shorter block of a row <"section 2 and 5 have this really ugly and pointless gap between the two blocks"> <preview.css #40; lesson 29 render>
   - [S1] - Settle row height: frames equal (stretch) or frames sized to content (start) <preview.css #40 LAYOUT; .clinerules 11b> <owner names one>
   - [S2] - Apply that one side only, prefer deletion <preview.css #40; .clinerules 2> <no other rule changes in the diff>
   - [S3] - Render lesson 29 and report per-row frame delta <preview.css; .clinerules 7> <every row's blocks report one delta number>



