# Preview notes

Open requests: one `##` block per preview page, one `###` section per item. The note boxes on the
preview pages read and write this file directly (Chrome or Edge, click "link qa/NOTES.md" once), so
this file is the whole record and editing it here edits the boxes.

Every section opens with a pointer to the item's `###` heading in `CONTENT_EXAMPLES.md` — that
heading is the contract the request argues with, and reading the two against each other is the whole
job. The request stays here and is never copied into CONTENT_EXAMPLES.md. A section holding finished
text and new text together loses only the finished part — execute what remains.

How a request is worked, in the agent's own hand. When work on one starts, its text is tagged by
prefixing it with `(IN PROGRESS)` — `(IN PROGRESS) make both blocks half width` — so a box shows at a
glance what is under way and what is still untouched. The tag goes at the front of the line it applies
to, which also makes it findable as `^(IN PROGRESS)`. When the request is met — the shape changed, the
harness read — that text is deleted from this file: the section keeps its heading and its pointer and
is simply empty, ready for the next request, and the record of work done is the commit. A section
holding several requests is tagged and cleared one request at a time, never all at once, so the
untagged lines are the ones still owed.

The tag is the agent's to write, and only ever on work it has actually begun, so it never reads as a
promise. A request it cannot meet as written — a question waiting on an answer, a note to self, a line
that contradicts another in the same file — keeps its text, untagged, and the reply says what it waits
for: nothing is deleted that was not done. Emptying a box deletes nothing either. Only this file
removes a request: delete a `###` section here and its box empties within 2 s, so a request's text is
deleted only once it is met.

Two ways in. Best: `node qa/serve.mjs` (or double-click `qa/serve.cmd`) — it serves the repo on
127.0.0.1 and opens the preview page with `?notes=server`, and the boxes then read and write this file
through that server: nothing to pick, nothing to grant. Double-clicking the page on its own still
works — one click on "link qa/NOTES.md" grants the page file-system access — but that grant lapses
between sessions, so the server is the reliable way in. Either way the page re-reads this file every 2 s.
Text sitting directly under a `##` page heading is dropped the next time any box writes, so a block's
content belongs in its `###` sections.

## preview-blocks.html

**Deleted 2026-11-16.** Its specimens were folded into `capability-map.html` §4; the note boxes below are kept as the record of what each one was asked to show.

### [02]

→ CONTENT_EXAMPLES.md §`[02]`

### [03]

→ CONTENT_EXAMPLES.md §`[03]`

### [04]

→ CONTENT_EXAMPLES.md §`[04]`

### [05]

→ CONTENT_EXAMPLES.md §`[05]`

### [07]

→ CONTENT_EXAMPLES.md §`[07]`

### [12]

→ CONTENT_EXAMPLES.md §`[12]`

### [27]

→ CONTENT_EXAMPLES.md §`[27]`

### [36]

→ CONTENT_EXAMPLES.md §`[36]`

### [38]

→ CONTENT_EXAMPLES.md §`[38]`

### [30]

→ CONTENT_EXAMPLES.md §`[30]`

### [35]

→ CONTENT_EXAMPLES.md §`[35]`

### [31]

→ CONTENT_EXAMPLES.md §`[31]`

### [37]

→ CONTENT_EXAMPLES.md §`[37]`

### [41]

→ CONTENT_EXAMPLES.md §`[41]`

### [42]

→ CONTENT_EXAMPLES.md §`[42]`

### [43]

→ CONTENT_EXAMPLES.md §`[43]`

### [50]

→ CONTENT_EXAMPLES.md §`[50]`

### [55]

→ CONTENT_EXAMPLES.md §`[55]`

### [56]

→ CONTENT_EXAMPLES.md §`[56]`

### [57]

→ IN-BLOCK-VISUALS.md §`[57]`
the first thing is making the line something more than a 1px line with a arrow icon.  not a fixed length, we will give it a minimum length of 100px, so lets get started with an empty block and centered at the bottom (via html, not css) build a new timeline. I want a  2px line which has a small animated svg icon with the word NOW below it. To the left of the star, the line fades out on a log curve to 0 at the left end. On the right side of the star it becomes a dashed line, no fade, until the far right which has a double arrow icon and the word 'FUTURE' faint but visible behind the end of the line

### [58]

→ CONTENT_EXAMPLES.md §`[58]`

### [60]

→ CONTENT_EXAMPLES.md §`[60]`

### [61]

→ CONTENT_EXAMPLES.md §`[61]`

### [63]

→ CONTENT_EXAMPLES.md §`[63]`

### [64]

→ CONTENT_EXAMPLES.md §`[64]`

### [65]

→ CONTENT_EXAMPLES.md §`[65]`

### [66]

→ CONTENT_EXAMPLES.md §`[66]`

### [67]

→ CONTENT_EXAMPLES.md §`[67]`

### [40]

→ CONTENT_EXAMPLES.md §`[40]`

### [08]

→ CONTENT_EXAMPLES.md §`[08]`

### [09]

→ CONTENT_EXAMPLES.md §`[09]`

### [10]

→ CONTENT_EXAMPLES.md §`[10]`

### [11]

→ CONTENT_EXAMPLES.md §`[11]`

### [13]

→ CONTENT_EXAMPLES.md §`[13]`

### [14]

→ CONTENT_EXAMPLES.md §`[14]`

### [15]

→ CONTENT_EXAMPLES.md §`[15]`

### [16]

→ CONTENT_EXAMPLES.md §`[16]`

### [17]

→ CONTENT_EXAMPLES.md §`[17]`

### [18]

→ CONTENT_EXAMPLES.md §`[18]`

### [19]

→ CONTENT_EXAMPLES.md §`[19]`

### [20]

→ CONTENT_EXAMPLES.md §`[20]`

### [21]

→ CONTENT_EXAMPLES.md §`[21]`

### [22]

→ CONTENT_EXAMPLES.md §`[22]`

### [23]

→ CONTENT_EXAMPLES.md §`[23]`

### [24]

→ CONTENT_EXAMPLES.md §`[24]`

### [25]

→ CONTENT_EXAMPLES.md §`[25]`

### [26]

→ CONTENT_EXAMPLES.md §`[26]`

### [44]

→ CONTENT_EXAMPLES.md §`[44]`

### [45]

→ CONTENT_EXAMPLES.md §`[45]`

### [46]

→ CONTENT_EXAMPLES.md §`[46]`

### [47]

→ CONTENT_EXAMPLES.md §`[47]`

### [48]

→ CONTENT_EXAMPLES.md §`[48]`

### [49]

→ CONTENT_EXAMPLES.md §`[49]`

### [51]

→ CONTENT_EXAMPLES.md §`[51]`

### [52]

→ CONTENT_EXAMPLES.md §`[52]`

### [53]

→ CONTENT_EXAMPLES.md §`[53]`

### [54]

→ CONTENT_EXAMPLES.md §`[54]`

### [59]

→ CONTENT_EXAMPLES.md §`[59]`

### [62]

→ CONTENT_EXAMPLES.md §`[62]`

### [39]

→ CONTENT_EXAMPLES.md §`[39]`

## preview-menu.html

### [40]

→ CONTENT_EXAMPLES.md §`[40]`
delete
