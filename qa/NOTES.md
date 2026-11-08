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
delete the crowd sound. halve the volume of the buzzer sound. On miss AND on wrong target, play the gunshot and buzzer sounds together

### stackDrop

→ CONTENT_EXAMPLES.md §`stackDrop`
put the two answer choices on the right bottom, stacked vertically, 30px between.
move the correct answer stack items down 35px. Make each item in the stack consecutively 20px thinner, make the stack right-justify.
Once the stack is built, have the player do a mario-style run and jump to a flag, if all the answers are correct he hits the flag and a coin pops out. If score<max-score> he misses and falls on his face

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

### slotBlocks

→ CONTENT_EXAMPLES.md §`slotBlocks`
the idea of this onei want you to think a lot deeper on all of these : "how is this useful to the student? How is it BETTER than normal text/spoken explanations?" i dont see how this implementation is useful at all, especially not in this form. Can you also stop and explain to me why its only filling half the block?

### voiceSeesaw

→ CONTENT_EXAMPLES.md §`voiceSeesaw`
'move the word to the other side' doesnt really gain anything over just having words. Rethink the concept, preferably using actual motion and the subject moving behind a veil, if you can think of something else to use the seesaw for, separate it out

### levelGauge

→ CONTENT_EXAMPLES.md §`levelGauge`
the thermometer with vertically stacked words is kind of okay but it fits a lot better with intensity than certainty. Id like a much nicer looking thermometer if possible, and make the gradient cool-hot colors eg. blue to red instead of green. the second part of the activity is bad, come up with a new idea
