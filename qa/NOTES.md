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

## preview-games4.html

### [71]

→ CONTENT_EXAMPLES.md §`[71]`
delete the crowd sound. halve the volume of the buzzer sound. On miss AND on wrong target, play the gunshot and buzzer sounds together

### [80]

→ CONTENT_EXAMPLES.md §`[80]`
make each word card twice as big. grid anchored to center, never moves. 321 countdown centered over grid/curtain. 54321 countdown card 30px right of grid, vertically centered. improve curtain graphics is possible without affecting anything else.
add *Begin Round - Hear Word* button 15px below the grid which initiates each round and starts the 321 countdown

### [82]

→ CONTENT_EXAMPLES.md §`[82]`
score is countdown, hidden during play
each heart lost subtracts 1 from score, boss should take [total # questions]-2 hits to kill

### [74]

→ CONTENT_EXAMPLES.md §`[74]`
put the two answer choices on the right bottom, stacked vertically, 30px between.
move the correct answer stack items down 35px. Make each item in the stack consecutively 20px thinner, make the stack right-justify.
Once the stack is built, have the player do a mario-style run and jump to a flag, if all the answers are correct he hits the flag and a coin pops out. If score<max-score> he misses and falls on his face

### [80]

→ CONTENT_EXAMPLES.md §`[80]`
button text not visible (black on dark blue?)
make grid items 15px less wide each

### [79]

→ CONTENT_EXAMPLES.md §`[79]`
is showing prompt card on game start screen
make hint text white
(answer must have three distractors per word that never fit the words already placed)

### [75]

→ CONTENT_EXAMPLES.md §`[75]`
must be possible for wall to continue, second wall to come, game target is continuous flight through all the gates in one 'run'

## preview-blocks.html

### [02]

→ CONTENT_EXAMPLES.md §`[02]`
make 1/3 width

### [03]

→ CONTENT_EXAMPLES.md §`[03]`

### [03]

→ CONTENT_EXAMPLES.md §`[03]`
delete the first exm

### [15]

→ CONTENT_EXAMPLES.md §`[15]`

### [16]

→ CONTENT_EXAMPLES.md §`[16]`

### [17]

→ CONTENT_EXAMPLES.md §`[17]`

### [28]

→ CONTENT_EXAMPLES.md §`[28]`

### [29]

→ CONTENT_EXAMPLES.md §`[29]`

### [30]

→ CONTENT_EXAMPLES.md §`[30]`

### [11]

→ CONTENT_EXAMPLES.md §`[11]`

### [12]

→ CONTENT_EXAMPLES.md §`[12]`

### [13]

→ CONTENT_EXAMPLES.md §`[13]`

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

### [27]

→ CONTENT_EXAMPLES.md §`[27]`

### [04]

→ CONTENT_EXAMPLES.md §`[04]`

### [05]

→ CONTENT_EXAMPLES.md §`[05]`
what is the purpose of this, other than just to show that something is wrong? if nothing else, delete

### [06]

→ CONTENT_EXAMPLES.md §`[06]`

### [07]

→ CONTENT_EXAMPLES.md §`[07]`

### [08]

→ CONTENT_EXAMPLES.md §`[08]`

### [09]

→ CONTENT_EXAMPLES.md §`[09]`

### [10]

→ CONTENT_EXAMPLES.md §`[10]`

### [18]

→ CONTENT_EXAMPLES.md §`[18]`

### [19]

→ CONTENT_EXAMPLES.md §`[19]`

### [20]

→ CONTENT_EXAMPLES.md §`[20]`

### [39]

→ CONTENT_EXAMPLES.md §`[39]`

### connectedSpeech

→ CONTENT_EXAMPLES.md §`connectedSpeech`
delete this vehicle

### dictation

→ CONTENT_EXAMPLES.md §`dictation`
this should be restricted t lvl 15-20+

### [51]

→ CONTENT_EXAMPLES.md §`[51]`

### [40]

→ CONTENT_EXAMPLES.md §`[40]`

### [52]

→ CONTENT_EXAMPLES.md §`[52]`

### cheatSheet

→ CONTENT_EXAMPLES.md §`cheatSheet`
delete

### connectedFlow

→ CONTENT_EXAMPLES.md §`connectedFlow`
delete

### stressShift

→ CONTENT_EXAMPLES.md §`stressShift`
delete

### [63]

→ CONTENT_EXAMPLES.md §`[63]`

### falseFix

→ CONTENT_EXAMPLES.md §`falseFix`
delete

### summarySqueeze

→ CONTENT_EXAMPLES.md §`summarySqueeze`
delete

### sentenceCombine

→ CONTENT_EXAMPLES.md §`sentenceCombine`
delete

### expandCompress

→ CONTENT_EXAMPLES.md §`expandCompress`
delete

### roleCard

→ CONTENT_EXAMPLES.md §`roleCard`
delete

### audienceShift

→ CONTENT_EXAMPLES.md §`audienceShift`
delete

### pulseStress

→ CONTENT_EXAMPLES.md §`pulseStress`
delete

### lyricGap

→ CONTENT_EXAMPLES.md §`lyricGap`
delete

### [31]

→ CONTENT_EXAMPLES.md §`[31]`

### contourMatch

→ CONTENT_EXAMPLES.md §`contourMatch`
delete

### placeScript

→ CONTENT_EXAMPLES.md §`placeScript`
delete

### directnessDial

→ CONTENT_EXAMPLES.md §`directnessDial`
delete

### generationGap

→ CONTENT_EXAMPLES.md §`generationGap`
delete

### [64]

→ CONTENT_EXAMPLES.md §`[64]`

### contrastTable

→ CONTENT_EXAMPLES.md §`contrastTable`
delete

### [32]

→ CONTENT_EXAMPLES.md §`[32]`

### workedExample

→ CONTENT_EXAMPLES.md §`workedExample`
delete

### annotatedExample

→ CONTENT_EXAMPLES.md §`annotatedExample`
delete

### [33]

→ CONTENT_EXAMPLES.md §`[33]`

### [34]

→ CONTENT_EXAMPLES.md §`[34]`

### exceptionBench

→ CONTENT_EXAMPLES.md §`exceptionBench`
delete

### errorGallery

→ CONTENT_EXAMPLES.md §`errorGallery`
delete

### beforeAfterStrip

→ CONTENT_EXAMPLES.md §`beforeAfterStrip`
delete

### [35]

→ CONTENT_EXAMPLES.md §`[35]`

### stressBar

→ CONTENT_EXAMPLES.md §`stressBar`
delete

### spellingSoundMap

→ CONTENT_EXAMPLES.md §`spellingSoundMap`
delete

### scaleAxis

→ CONTENT_EXAMPLES.md §`scaleAxis`
delete

### [36]

→ CONTENT_EXAMPLES.md §`[36]`

### falseFriendSplit

→ CONTENT_EXAMPLES.md §`falseFriendSplit`
delete

### audienceRow

→ CONTENT_EXAMPLES.md §`audienceRow`
delete

### sceneCast

→ CONTENT_EXAMPLES.md §`sceneCast`
delete

### dialogueMoves

→ CONTENT_EXAMPLES.md §`dialogueMoves`
delete

### [37]

→ CONTENT_EXAMPLES.md §`[37]`

### vocabField

→ CONTENT_EXAMPLES.md §`vocabField`
delete

### storyStrip

→ CONTENT_EXAMPLES.md §`storyStrip`
delete

### melodyContour

→ CONTENT_EXAMPLES.md §`melodyContour`

### beatGrid

→ CONTENT_EXAMPLES.md §`beatGrid`
delete

### stanceScale

→ CONTENT_EXAMPLES.md §`stanceScale`
delete

### routineMap

→ CONTENT_EXAMPLES.md §`routineMap`
delete

### [38]

→ CONTENT_EXAMPLES.md §`[38]`

### [41]

→ CONTENT_EXAMPLES.md §`[41]`
This one is useful but I need to make some tweaks, leaving a note for myself to remember later

### [42]

→ CONTENT_EXAMPLES.md §`[42]`

### collocationGap

→ CONTENT_EXAMPLES.md §`collocationGap`
delete

### scaleChoice

→ CONTENT_EXAMPLES.md §`scaleChoice`
delete

### prepositionScene

→ CONTENT_EXAMPLES.md §`prepositionScene`
delete

### [44]

→ CONTENT_EXAMPLES.md §`[44]`

### [45]

→ CONTENT_EXAMPLES.md §`[45]`

### [43]

→ CONTENT_EXAMPLES.md §`[43]`

### [46]

→ CONTENT_EXAMPLES.md §`[46]`

### [47]

→ CONTENT_EXAMPLES.md §`[47]`

### [48]

→ CONTENT_EXAMPLES.md §`[48]`

### dictogloss

→ CONTENT_EXAMPLES.md §`dictogloss`
fix the margins on the text entry box

### blackoutLine

→ CONTENT_EXAMPLES.md §`blackoutLine`
what is the purpose of this
