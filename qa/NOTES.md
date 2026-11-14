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

### [02]

→ CONTENT_EXAMPLES.md §`[02]`

### [03]

→ CONTENT_EXAMPLES.md §`[03]`

### [04]

→ CONTENT_EXAMPLES.md §`[04]`

### [05]

→ CONTENT_EXAMPLES.md §`[05]`
Make it a third-width block by default. improve the drawings for each location so they are either obviously recognizable OR a building with a sign that indicates what it is ($ BANK, for example) as part of the drawing. Remove the normal text names. put the check boxes centered at the bottom of each location (above the street). Put street names in italic on the streets - vertical streets get names running vertically.  Remove the questions portion below the map. Change the heading to "Street map for directions and relative locations"  and clear the min/max numbers

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
mark in the header "IGNORE - pending updates"

### [42]

→ CONTENT_EXAMPLES.md §`[42]`
mark in the header "IGNORE - pending updates"

### [43]

→ CONTENT_EXAMPLES.md §`[43]`
mark in the header "IGNORE - pending updates"

### [50]

→ CONTENT_EXAMPLES.md §`[50]`

### [55]

→ CONTENT_EXAMPLES.md §`[55]`
mark in the header "IGNORE - pending updates"

### [56]

→ CONTENT_EXAMPLES.md §`[56]`
mark in the header "IGNORE - pending updates"

### [57]

→ CONTENT_EXAMPLES.md §`[57]`
mark in the header "IGNORE - pending updates"

### [58]

→ CONTENT_EXAMPLES.md §`[58]`
mark in the header "IGNORE - pending updates"

### [60]

→ CONTENT_EXAMPLES.md §`[60]`
mark in the header "IGNORE - pending updates"

### [61]

→ CONTENT_EXAMPLES.md §`[61]`
mark in the header "IGNORE - pending updates"

### [63]

→ CONTENT_EXAMPLES.md §`[63]`
mark in the header "IGNORE - pending updates"

### [64]

→ CONTENT_EXAMPLES.md §`[64]`
mark in the header "IGNORE - pending updates"

### [65]

→ CONTENT_EXAMPLES.md §`[65]`
mark in the header "IGNORE - pending updates"

### [66]

→ CONTENT_EXAMPLES.md §`[66]`
mark in the header "IGNORE - pending updates"

### [67]

→ CONTENT_EXAMPLES.md §`[67]`
mark in the header "IGNORE - pending updates"

### [40]

→ CONTENT_EXAMPLES.md §`[40]`
mark in the header "IGNORE - pending updates"

### [08]

→ CONTENT_EXAMPLES.md §`[08]`
delete

### [09]

→ CONTENT_EXAMPLES.md §`[09]`
delete

### [10]

→ CONTENT_EXAMPLES.md §`[10]`
delete

### [11]

→ CONTENT_EXAMPLES.md §`[11]`
delete

### [13]

→ CONTENT_EXAMPLES.md §`[13]`
delete

### [14]

→ CONTENT_EXAMPLES.md §`[14]`
delete

### [15]

→ CONTENT_EXAMPLES.md §`[15]`
delete

### [16]

→ CONTENT_EXAMPLES.md §`[16]`
delete

### [17]

→ CONTENT_EXAMPLES.md §`[17]`
delete

### [18]

→ CONTENT_EXAMPLES.md §`[18]`
delete

### [19]

→ CONTENT_EXAMPLES.md §`[19]`
delete

### [20]

→ CONTENT_EXAMPLES.md §`[20]`
delete

### [21]

→ CONTENT_EXAMPLES.md §`[21]`
delete

### [22]

→ CONTENT_EXAMPLES.md §`[22]`
delete

### [23]

→ CONTENT_EXAMPLES.md §`[23]`
delete

### [24]

→ CONTENT_EXAMPLES.md §`[24]`
delete

### [25]

→ CONTENT_EXAMPLES.md §`[25]`
delete

### [26]

→ CONTENT_EXAMPLES.md §`[26]`
delete

### [44]

→ CONTENT_EXAMPLES.md §`[44]`
delete

### [45]

→ CONTENT_EXAMPLES.md §`[45]`
delete

### [46]

→ CONTENT_EXAMPLES.md §`[46]`
delete

### [47]

→ CONTENT_EXAMPLES.md §`[47]`
delete

### [48]

→ CONTENT_EXAMPLES.md §`[48]`
delete

### [49]

→ CONTENT_EXAMPLES.md §`[49]`
delete

### [51]

→ CONTENT_EXAMPLES.md §`[51]`
delete

### [52]

→ CONTENT_EXAMPLES.md §`[52]`
delete

### [53]

→ CONTENT_EXAMPLES.md §`[53]`
delete

### [54]

→ CONTENT_EXAMPLES.md §`[54]`
delete

### [59]

→ CONTENT_EXAMPLES.md §`[59]`
delete

### [62]

→ CONTENT_EXAMPLES.md §`[62]`
delete

### [39]

→ CONTENT_EXAMPLES.md §`[39]`
scramble the word order of the prompt
