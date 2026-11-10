# Preview notes

Open requests: one `##` block per preview page, one `###` section per item. The note boxes on the
preview pages read and write this file directly (Chrome or Edge, click "link qa/NOTES.md" once), so
this file is the whole record and editing it here edits the boxes.

Every section opens with a pointer to the item's `###` heading in `CONTENT_EXAMPLES.md` — that
heading is the contract the request argues with, and reading the two against each other is the whole
job. The request stays here and is never copied into CONTENT_EXAMPLES.md. A section holding finished
text and new text together loses only the finished part — execute what remains.

Only this file deletes a request: emptying a box leaves its section and its text untouched, and the
section reappears in the box on the next refresh. Delete a section here and its box empties within
2 s. Delete it only once it is tagged `[done]` — the tag marks work that is committed, and the record
of work done is the commit.

Two ways in. Best: `node qa/serve.mjs` (or double-click `qa/serve.cmd`) — it serves the repo on
127.0.0.1 and opens the preview page with `?notes=server`, and the boxes then read and write this file
through that server: nothing to pick, nothing to grant, nothing to re-grant. Double-clicking the page on
its own still works — one click on "link qa/NOTES.md" grants the page file-system access — but that grant
lapses between sessions, so the server is the reliable way in. Either way the page re-reads this file
every 2 s.
Text sitting directly under a `##` page heading is dropped the next time any box writes, so a block's
content belongs in its `###` sections.

## preview-games4.html

### skeetRange

→ CONTENT_EXAMPLES.md §`skeetRange`
reduce the volume of the miss sound by 50% and the gunshot by 30%, and make the targets min 2 max 6 and make sure that they are sufficiently spread out horizontally and vertically at the start so if there are 6 the overlap is still minimal or none at all. make sure the answer cards on the target dont have a maximum width so the text never gets truncated

### stackDrop

→ CONTENT_EXAMPLES.md §`stackDrop`
make the step down in size 10px greater per item added to the stack. remove the platform from the old version. Add a super mario style flagpole and animated flag
Once the stack is built, have the player run across the top answer card on the stack and jump towards the flag, if all the answers are correct he hits the flag and a coin pops out. If [score< max possible score] he misses and falls on his face

### bingoCard

→ CONTENT_EXAMPLES.md §`bingoCard`
button text not visible (black on dark blue?)
make grid items 15px less wide each

The first round, make the button text "Start Game - Listen to the Target Word"
the subsequent rounds make the text say "Next Round! - Listen to the Target Word"

### echoPads

→ CONTENT_EXAMPLES.md §`echoPads`
Make prompt card not show on start screen.
Make a hidden variable for 2 difficuly levels (lesson 20+ triggers level 2)
level one stays as-is. Level 2 instead of having a hint to discern which answer is correct has NO hint, but authored options for each word MUST be NOT POSSIBLE to correctly use in that word's position (example " Yesterday I got too .. (for, far, fear, fore)" - ONLY 'for' is possible to use
Make start game card text say "Build a sentence - Dont get distracted by similar words!"

### flapGate

→ CONTENT_EXAMPLES.md §`flapGate`
must be possible for wall to continue, second wall to come, game target is continuous flight through all the gates in one 'run'

### ladderRun

→ CONTENT_EXAMPLES.md §`ladderRun`
remove the graffiti animation, instead when the student gets all the answers correct, make the character climb on top of the prompt card, walk to the center, and start throwing money out which falls and lands on the option cards below. If the game ends and the user missed a point, instead make a dog run past and knock over the ladder and the ladder/character fall to the ground.

Change start game card text to "Get all the phrases right, climb to the top and get your Trump Ca$h!"

### crosswordBoard

→ CONTENT_EXAMPLES.md §`crosswordBoard`
wrong answers dont subtract points, there is no fail condition.

### mineGrid

→ CONTENT_EXAMPLES.md §`mineGrid`
make the graphics not disappear and reappear at the beginning of each round

### catchBasket

→ CONTENT_EXAMPLES.md §`catchBasket`
note a minimum of 2 and maximum of 4 items for this game (make sure all the games in content_examples.md have a min/max value attached)
at the end of the game make a girl in a dress come and pick whichever flower is the biggest (if more than one are the same she can pick one at random)

### whackMole

→ CONTENT_EXAMPLES.md §`whackMole`
make it always a 3x2 grid, min 2 max 6 options. improve the graphics so it looks like the moles are coming out of holes that are just a little bit wider than they are

### trainOrder

→ CONTENT_EXAMPLES.md §`trainOrder`
improve the train graphics, add a background that makes it look like the train is on some sort of ground and not just a beige flat background. Make it look like there are mountains off in the distance.

## preview-blocks.html

### chunkBank

→ CONTENT_EXAMPLES.md §`chunkBank`
call this vehicle 'contextFit'

### connectedSpeech

→ CONTENT_EXAMPLES.md §`connectedSpeech`
delete this vehicle

### sentenceSurgery

→ CONTENT_EXAMPLES.md §`sentenceSurgery`
instead of having fields with the words position,  we can have a line below the chunks to which they can be dragged an put in order. make an alternate form of this which is a sentence with extranneos words to be cut out

### registerContrast

→ CONTENT_EXAMPLES.md §`registerContrast`
use only if both forms of the phrase are *really* used/common. We dont need to teach softening languge for a phrase that doesnt need to be softened, nor vice versa

### questionBuilding

→ CONTENT_EXAMPLES.md §`questionBuilding`
lvl 10+, used during a lesson that touches questions

### dictation

→ CONTENT_EXAMPLES.md §`dictation`
simple transcription doesnt need a special activity for one item. delete vehicle

### repairMoves

→ CONTENT_EXAMPLES.md §`repairMoves`
very useful for low-intermediate lesson about realistic day-to-day conversation. rephrase 'repair' and 'come apart'  to  'interjecting'

### shadowRecord

→ CONTENT_EXAMPLES.md §`shadowRecord`
delete

### ruleTree

→ CONTENT_EXAMPLES.md §`ruleTree`

### literalSplit

→ CONTENT_EXAMPLES.md §`literalSplit`

### timelineBridge

→ CONTENT_EXAMPLES.md §`timelineBridge`
↳ rebuilt: one `--now`-driven axis, three sizes, and the size decides the job. Full = three shapes on one film (`have seen` open into now, `saw` closed bar, `saw` with no time = closed bar plus a gap to now). Half = a dot inside a bar (`was cooking`/`rang`) and a bar that reaches a deadline wall (`will have sent`). Third = the timelines move inside the answer options, so the option is a shape and the tense name is the label. Nothing in it is a control: the radio beside it saves.

### inlineTimeline

→ CONTENT_EXAMPLES.md §`inlineTimeline`
↳ new: the same axis as an IN-BLOCK element rather than a block — no frame, no heading, no width of its own, so it drops under one sentence inside a panel / dialog / chart note / question stem and takes whatever slot it is given. Two shapes carry the two meanings that trip pt-BR speakers: `recent` (bar fades into the past — "have been sick lately") and `field` (hatched band above the line + a dot inside it — "have been to Disney World in my life"). Words link to marks by `data-k` letter, drawn as a superscript on the word and again at the head of its mark, so the pairing survives greyscale and print. Two interactive modes: pick the WORD that carries the claim (`.tlx-pick`), or place the timeline yourself (`.tlx-build`, three candidate axes, one radio each). Both save through real radios.

### spaceScene

→ CONTENT_EXAMPLES.md §`spaceScene`
this one is good for now

### mouthCut

→ CONTENT_EXAMPLES.md §`mouthCut`
this one is terrible. we need to pull in an existing image and ideally be able to mark on top of images
↳ rebuilt that way. Two vendored public-domain plates in `assets/` (provenance table in `assets/README.md`): the head-and-neck plate with four numbered pins and a key, then the mouth alone twice — one instruction drawn per version, in the image's own pixel space, so a mark lands on a feature. pt-BR = arrow from tongue body up to the soft roof + air forced through the slit; English = a measurement across the gap at the tip. Still one control: radios on where the sound happens, two gaps.

### massBasket

→ CONTENT_EXAMPLES.md §`massBasket`
improve and generalize visuals so they arent showing individual items but concepts

### slotBlocks

→ CONTENT_EXAMPLES.md §`slotBlocks`
getting better, but work on something that can be applied to individual sentences within their blocks without seeming like its own exercise. remember these are supposed to be tools and elements that implement INSIDE existing content blocks

### voiceSeesaw

→ CONTENT_EXAMPLES.md §`voiceSeesaw`
the idea is getting better, but its still basically its own block type. Try something that can take a normal sentence which is tagged as passive and put the subject behind a veil and then go from there

### levelGauge

→ CONTENT_EXAMPLES.md §`levelGauge`
the third block is terrible and in general i want some kind of marker that can go below individual words or phrases, since having a vertical thermometer next to a clumn of words doesnt really add anything that just puitting them in order wouldnt be able to explain
