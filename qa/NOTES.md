# Preview notes

Open requests: one `##` block per preview page, one `###` section per item. The note boxes on the
preview pages read and write this file directly (Chrome or Edge, click "link qa/NOTES.md" once), so
this file is the whole record and editing it here edits the boxes.

Every section opens with a pointer to the item's `###` heading in `CONTENT_EXAMPLES.md` — that
heading is the contract the request argues with. The request stays here and is never copied into
CONTENT_EXAMPLES.md. Emptying a box, or deleting a section here, removes the request; the record of
work done is the commit.

## preview-games4.html

### whackMole

→ CONTENT_EXAMPLES.md §`whackMole`
animate the moles to move up and down a little bit, try and make them slightly more lifelike

### skeetRange

→ CONTENT_EXAMPLES.md §`skeetRange`
wrong answer makes word flash red but it moves off the target, keep it anchored correctly. display bullets on the 'shot counter'

### wordleBoard

→ CONTENT_EXAMPLES.md §`wordleBoard`
score is correct words achieved (count up to total answers in block), reduce 'lives' to 2. lives = 0 is fail condition ffor all games

### mineGrid

→ CONTENT_EXAMPLES.md §`mineGrid`
make saloon doors 50% shorter, when snake appears, character should not move. flash screen red, character dies, character 1s fadeout, then 1s fade-in character at start position

### crosswordBoard

→ CONTENT_EXAMPLES.md §`crosswordBoard`
make the numbers within the grid 5pt bigger

### echoPads

→ CONTENT_EXAMPLES.md §`echoPads`
needs to start by generating a sensible phrase, and each round can only have one answer that is plausibly possible

### bingoCard

→ CONTENT_EXAMPLES.md §`bingoCard`
detatch countdount timer from curtain and move it to the left of the grid. Remove the activity header 'listen'.  after the curtain opens, a countdown timer (wth the same style) appears to the right of the curtain and counts down from 5, then the curtain closes, at which point the student loses a point and is marked wrong for that word

### ladderRun

→ CONTENT_EXAMPLES.md §`ladderRun`
we need to be very sure that there is only one correct answer for all of these games. The last question was "if it rains we stay/will stay inside". they are both plausible and correct grammatically

### bossRaid

→ CONTENT_EXAMPLES.md §`bossRaid`
i want much better sprites and/or better animation. Either you swing a sword and cut the boss with a right answer or you are a wizard and shoot a fireball which expodes on him. actually a variety of possibilities would be good.. we could even have the user select the appearance of their character. Boss can have more than one option too, either move towards and bite the player or shoot acid at him

### catchBasket

→ CONTENT_EXAMPLES.md §`catchBasket`
dont reload the flower visual after every answer. all games should show your final score when completed, make it persist when the loading screen comes back after youve played the first time

### flapGate

→ CONTENT_EXAMPLES.md §`flapGate`
reduce height gain per flap by 50% (again). correct answer grants a point, points reset when you lose a life., wrong answer grants no points. only hitting the wall resets the run, right or wrong answers you continue flying to the next question. score is the maximum points you got during any of your 'lives'. increase answer text by 4pt and make it dark grey but no transparency

### stackDrop

→ CONTENT_EXAMPLES.md §`stackDrop`
scramble the words better on the prompt and dont wrap it, give it a fixed width which can be double what it is now and make that a limitation for the phrase that it contains. correct answers should stack as blocks of the same size as the option blocks. treasure is on a platform above the character at a height which requires getting all the answers right to reach

## preview-blocks.html

### twoWordVerb

→ CONTENT_EXAMPLES.md §`twoWordVerb`
nothing with this amount of dead space should generate as a full width block...make the note/flavor text 'not count' and wrap width, then make the table collapse to half-width.. put the rule back in that IF there is a lone 1/2 or 1/3 width block, it gets centered.

### chunkBank

→ CONTENT_EXAMPLES.md §`chunkBank`
should collapse based on width fill

### connectedSpeech

→ CONTENT_EXAMPLES.md §`connectedSpeech`
should collapse based on width fill

### dictation

→ CONTENT_EXAMPLES.md §`dictation`
this should be restricted t lvl 15-20+

### sentenceSurgery

→ CONTENT_EXAMPLES.md §`sentenceSurgery`
instead of having fields with the words position,  we can have a line below the chunks to which they can be dragged an put in order. We can make an alternate form of this which is a sentence with extranneos words to be cut out

### registerContrast

→ CONTENT_EXAMPLES.md §`registerContrast`
this one is good but only if both forms of the phrase are really used/common. We dont need to teach softening languge for a phrase that doesnt need to be softened, nor vice versa

### questionBuilding

→ CONTENT_EXAMPLES.md §`questionBuilding`
need to be careful with difficulty on these, they might be more challenging/open/vague than they seem


