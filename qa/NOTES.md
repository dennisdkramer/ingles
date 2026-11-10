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
[done] the targets are spread way too much now, revert the positioning to how it was before
↳ reverted: every disc enters at the left edge again, a few px apart, on the lanes its options decide — the width-and-height spread is gone. Also in: the miss sound is half its level, the gunshot 30% quieter, the label plaques no longer truncate, and the rack caps at six discs.

### stackDrop

→ CONTENT_EXAMPLES.md §`stackDrop`
make the step down in size 10px greater per item added to the stack. remove the platform from the old version. Add a super mario style flagpole and animated flag
Once the stack is built, have the player run across the top answer card on the stack and jump towards the flag, if all the answers are correct he hits the flag and a coin pops out. If [score< max possible score] he misses and falls on his face
↳ done: the flag emoji is a real flagpole now (steel shaft, knob, waving pennant), the jump is measured to the pole instead of a fixed 112px, the coin pops from the knob, and the face-first fall already fires when the finished tower fell short (`placed < r.total`). The taper is 20px a block, i.e. the 10px-greater step you asked for.
  ? THE PLATFORM — which one goes? The yard holds TWO fixed slabs that read as a platform: `g4-ledge`, the 10px bar the chest rests on at the goal height, and `g4-roof`, the slab over the chest. The ledge is also the block-flight's centre line (its width is what a flying block is aimed at), so removing it means giving the flight a new target. Say which and I will take it out.

### bingoCard

→ CONTENT_EXAMPLES.md §`bingoCard`
[done] after game start,  the button that plays the audio should say "Next Round! - Listen to the Target Word"
[done] increase the second timer (after the curtain opens) to 7 seconds
↳ the label already read "Start Game - …" / "Next Round! - …" off the run's own progress; the card's countdown is 7·6·5·4·3·2·1 now.

### echoPads

→ CONTENT_EXAMPLES.md §`echoPads`
[done] Make prompt card not show on start screen.
[done] Make a hidden variable for 2 difficuly levels (lesson 20+ triggers level 2)
[done] level one stays as-is. Level 2 instead of having a hint to discern which answer is correct has NO hint, but authored options for each word MUST be NOT POSSIBLE to correctly use in that word's position (example " Yesterday I got too .. (for, far, fear, fore)" - ONLY 'for' is possible to use
[done] Make start game card text say "Build a sentence - Dont get distracted by similar words!"
↳ the sentence strip is hidden until the run starts; the level is `data-level`, else the page's own L, and 20+ means level 2, which prints no hint at all (neither "Next word:" nor the wrong-pad line). The authoring demand is in the plugin's own comment: at level 2 every other pad must be impossible in that position.

### flapGate

→ CONTENT_EXAMPLES.md §`flapGate`
[done] must be possible for wall to continue, second wall to come, game target is continuous flight through all the gates in one 'run'
↳ a wall is an object in flight now, not a state of the stage: each one is cut once, flies past the left edge and is retired, and the next question is cut into a wall behind it. Answering no longer stops the flight, so the wall he flew through keeps going and the next is already on its way.

### ladderRun

→ CONTENT_EXAMPLES.md §`ladderRun`
[done] remove the graffiti animation, instead when the student gets all the answers correct, make the character climb on top of the prompt card, walk to the center, and start throwing money out which falls and lands on the option cards below. If the game ends and the user missed a point, instead make a dog run past and knock over the ladder and the ladder/character fall to the ground.
[done] Change start game card text to "Get all the phrases right, climb to the top and get your Trump Ca$h!"
↳ the graffiti art, its overlay, its CSS and its animation are deleted. Every answer right: he climbs onto the prompt card, walks along it to its centre, and throws banknotes that fall and settle on the answer cards. A point missed at the end of the run: a dog runs in, the ladder topples and the climber goes down with it. The start line is the game's own now (a `startText` on the plugin that the runner prints on the card).

### crosswordBoard

→ CONTENT_EXAMPLES.md §`crosswordBoard`
[done] there are no wrong answers. if they put the wrong letters in it doesnt do anything, they can just keep trying until it goes green. right answers gain points, the game is either won with 5 points or stays open permanently with whatever their score is
↳ a full word typed wrongly now does nothing at all — the letters stay where the student put them, nothing is scored and nothing clears, so they keep at it until it goes green. A right word is a point, and the fifth point closes the board as a win; under five it simply stays open, since this game has no clock and no lives.

### mineGrid

→ CONTENT_EXAMPLES.md §`mineGrid`
[done]

### catchBasket

→ CONTENT_EXAMPLES.md §`catchBasket`
[done] note a minimum of 2 and maximum of 4 items for this game (make sure all the games in content_examples.md have a min/max value attached)
[done] at the end of the game make a girl in a dress come and pick whichever flower is the biggest (if more than one are the same she can pick one at random)
↳ every one of the 13 games now states its floor and ceiling in its CONTENT_EXAMPLES entry (catchBasket: 2–4 pots). A later bloom in a pot is drawn bigger than the one before it, so "the biggest" exists; at the end of the run a girl in a dress walks in from the left of the tray, plucks the tallest bloom (a tie is settled at random), carries it in her hand and walks out.

### whackMole

→ CONTENT_EXAMPLES.md §`whackMole`
[done] the grid cards are fine, but make the moles coming out of little molehills directly under them
↳ each mole has its own molehill now: a soil mound with a dark opening at its crest, standing in FRONT of the mole (so he surfaces from it), with his word moved above his head where the hill cannot cover it. The cells draw nothing else, and the garden is a fixed six holes.

### trainOrder

→ CONTENT_EXAMPLES.md §`trainOrder`
[partly done] improve the train graphics, add a background that makes it look like the train is on some sort of ground and not just a beige flat background. Make it look like there are mountains off in the distance. The train caboose should be bigger than the cars, and the car wheels should all sit on the track. The platforms should start small like a flat bed, and get just a little bit bigger per car. The cars should not have labels. The amount of cars should depend on the amount of adjectives, and the prompt should be "That's a ____________________ [word]" . center the available adjectives on the bottom of the screen. the player will drag the adjectives to railway workers who at the beginning of each round will come and stand on platforms in front of each car. When the player has dragged all the words to the workers, they throw the words one by one onto the train cars. At that point the word cards grow in height according to their position. The total height of all given cars + their correct word is equal, and if all the words are used in order, the train will pass under the bridge without hitting it and the player gets a point. Each card's height is determined in that way regardless of where the player puts it, so if the player puts any of the words out of order, one will necessarily sit higher than it was supposed to and hit the bridge, causing a fail
↳ done so far: the sky, two hazed ridges of hills on the horizon and the ground plane under the rails (the beige field is gone), and no car carries a label — the plaque, its level lever (`data-labels` / `data-label-max`) and its CSS are deleted. The rest of the note changes what the dropping IS (a word goes to a worker now, not onto a car), so it is held for answers:
  ? 1) CARS FROM ADJECTIVES — when a sentence has five words, does the train stand the FIVE slots those words need (so a skipped slot shows up as a gap in the order, and the 6px-per-slot geometry stays honest), or five evenly-spaced cars with the same word→car map as today? I would build the five slots unless you say otherwise.
  ? 2) THE WORD ON THE DOCK CARD — with the stem becoming "That's a ____ [word]", where does the card's own word come from: `data-word` on the `.qitem`, or the text after the blank in the stem? (I would read `data-word` first and fall back to the text after the blank.) And is the stem printed anywhere on the stage, or only authored?
  ? 3) THE WORKERS — is each worker a drawn figure who stands on the platform in front of a car and is the drop target, with the platform only the stand? May a word be moved from one worker to another before the throwing starts?
  ? 4) THE THROWS — do the workers throw one word each in dock order with a beat between (~300ms) and the cards grow as each lands, or do all the cards land first and grow together?

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
