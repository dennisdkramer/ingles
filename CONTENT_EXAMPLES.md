# CONTENT_EXAMPLES — A menu of **mechanisms** and skins for content authored in the page's HTML

## [INSTRUCTIONS]

- **A menu, not a checklist.** Nothing here is required to be in any lesson or in any order.
- **The content in the page.** Games drive authored `.qitem`s (stem + optional `.listen` + radios), `input.gap`, or a textarea — nothing else. Whatever the engine animates is presentation; the saved answer is always one of those controls. If a mechanism cannot end in one, it is not a vehicle, it is a decoration. 
- **The tone of a lesson comes from the lesson's copy, never from here.** Every game below is track-neutral, *skins* layered on top — never baked in

## Build [Constraints] - Ignore this section for lesson generation

There is **no house style**. Look, palette, motion and mood are chosen per game and per track — a kids page may be loud and a business page sober, and neither is more correct. Only these hold, because they are mechanical:
1. **The page must still work if the engine never loads.** The authored `.qitem`s are ordinary radios: they render, save and print with no JS. That fallback is not optional.
2. **No network at run time.** Art is CSS, inline SVG, or a local file. Nothing fetched from another host, so a
   page that ships today still renders in two years.
3. **Fits its slot.** The stage scales to the block's width (`.itemsize` / `-half` / `-third`) and never overflows
   it; no fixed pixel width that a half-width block cannot honour.
4. **Reduced motion is honoured** — `prefers-reduced-motion` removes travel and keeps the state change, so the
   game still tells the student what happened.
5. **Cheap frames.** Animate `transform` and `opacity`; avoid animating layout properties, which jank on a school
   laptop.
6. **Difficulty and content are data.** Every game reads its items from the page and its knobs from `data-*`
   attributes, so a teacher can add items or change difficulty without editing an engine.

- - - 


## [HEADLINES] 
**Step 1 — browse the headings, nothing else.** 


### `skeetRange - (best for: one-shot word recognition under a clock; arcade stakes that force a commitment; a fast read of what a student really knows · can't: teach production or spelling — one shot per item lets a careless click hide what they knew · purpose 9/10 · fun 9/10)`

- **does** — One flying target per option. Player aims with the cursor and takes **one shot**; a hit scores, a
  miss is spent. No spray, no endless retry — the constraint is what makes it feel like skill.
- **opts** — **2 to 6 discs per item**, one disc per option. Two is the least that is a choice at all; six is what the range's own lanes hold when they are spread over its full height — a seventh crowds the arc into a pile of plaques.
- **skins** — `.game > .game-list` of `.qitem`; the stem is the prompt line, the options are the targets — one
  disc each, so the item's own options (two to six) decide how many fly.
- **art** — one flat ring per option, the word on a plaque over the disc; a thin crosshair that is the cursor; a
  single puff on impact. Every disc takes the SAME line — one arc, one speed, no wobble, no sine wave — and the
  lanes are spread over the full height of the range, so the four words read as one rack, not a scatter.
- **pace** — the range carries a clock 30% slower than the block's own: `data-time` is stretched by 1.3 (the
  lever is `PLUGINS.skeetRange.timeScale`, applied by the runner), so the discs and the timer slow together and a
  word can be read before it has to be shot at. A block therefore writes the deadline it *wants minus 30%* — or
  simply leaves the default and takes the slower range as it comes.
- **can't** — no production, no spelling; one shot per item means a careless click can hide what the student knew.
- **needs** — nothing; `engine4.js` ships it.

### `whackMole - (best for: spotting which option fits among lookalikes; engagement in a restless class; exposing hesitation · can't: anything needing reflection — speed pressure is the whole mechanism; recognition only · purpose 9/10 · fun 8/10)`

- **does** — One drawn mole per option surfaces from a hole, stamped in stagger; the player hits the one that
  fits before the runner's timer bar empties. The rest duck away the instant an answer lands.
- **skins** — same `.qitem` list; the prompt sits on the HUD line, options become the moles' labels.
- **opts** — **2 to 6 per item**, one mole per option. The garden is **always six holes in a 3×2 grid**, so six options fill it exactly and the layout never reflows between items; below 2 there is nothing to spot among, above 6 there is no hole left for the seventh.
- **authoring the stem** — the prompt is the thing to FIND, so it is written as that thing and nothing more:
  `past`, `a place you sleep`, `sorry, say that again?` — never `which one is past`, because the moles are
  already the candidates and the sentence only restates the game.
- **art** — inline SVG mole + radial-gradient hole with a dirt rim, rise via `translateY`, reduced-motion path.
- **can't** — recognition only; speed pressure makes it a poor fit for anything needing reflection.
- **needs** — nothing; `engine4.js` ships it.


### `catchBasket - (best for: sorting a form into its category; making a rule decision a single physical gesture; showing hesitation in public · can't: more than two to four categories per row, and a seventh item swamps the pot · purpose 9/10 · fun 8/10)`

- **does** — One word is shown at a time; the player **drags it into the pot that fits** (or taps a pot, or presses
  `1`/`2`). Dropping outside springs the word back, so a slipped finger costs time, not the item. A right drop tips
  water over that pot and **grows a flower in it**; the flowers stay for the rest of the run, one per right answer,
  so the block becomes a garden the class has grown rather than a score.
- **teaches** — sorting a form into a category: past vs now, one ending vs another, which pattern a word belongs
  to. The decision is made in one gesture, so hesitation is visible.
- **opts** — **2 to 4 pots per item**, one pot per option. Two is the smallest sort; four pots is one row at a size the words still read at, and a fifth has no soil left — the same ceiling the `can't` below names.
- **skins** — one word per item (`.qstem`), one pot per option (the radio labels); a correct drop checks that
  option's radio. The word card IS the prompt, so the stage does not print the same words again on the HUD line.
- **art** — inline SVG terracotta pot, water drops over the rim on a right drop, a flower grows out of the soil and
  stays there (six to a pot); the word lifts and tilts while held, a wrong drop shakes.
- **can't** — only two to four pots fit a row; fine distinctions don't fit, and a seventh flower would swamp the pot.

### `stackDrop - (best for: giving a long drill a shape and an end; accumulate-and-complete motivation; the tower as progress bar · can't: run on a two-item block (nowhere to climb), and timing dominates, so one phrase per block · purpose 8/10 · fun 8/10)`

- **does** — The question arrives as the next block of a tower and the player **puts the right answer on top of it**
  by picking it: the block flies up, lands and **stays in the tower**. A wrong answer tumbles off and the question
  stays exactly where it was, so the tower never loses what was earned and its height IS the progress. The climber
  climbs the tower itself to the chest at the top.
- **teaches** — accumulate-and-complete: the reward is the finished tower, so a long drill has a shape and an end.
  Every answer placed is one item answered, so the tower is the progress bar.
- **opts** — **2 to 4 options per item**, and **6 to 10 items per block**. One item is one block of the tower, so the item count IS the height it climbs: under six there is nothing to climb, and past ten each block is too short to hold its own word.
- **skins** — one `.qitem` per block; the question block is the stem, the buttons are the options. Six to ten items
  makes a climb: the tower is half the stage's width and each block's HEIGHT comes from the run's own length, so the
  whole stack stands inside the stage up to ten blocks (the most that keeps a word readable) and a longer run keeps
  that height and slides. The question block IS the prompt, so it is not printed a second time on the HUD line.
- **art** — flat blocks with hard edges, two ladder rails and a rung per answer, a drawn climber, a chest that
  lights up at the top. The tower slides down to keep the newest block in view once it outgrows the stage.
- **can't** — one item per block, so a two-item block has nowhere to climb; timing dominates, so keep the language
  load to a phrase per block.
- **needs** — nothing; `engine4.js` ships it.

### `flapGate - (best for: recognition at speed; arcade engagement; a keyboard and reduced-motion path to answering · can't: anything beyond recognition at speed, and it is the most expensive of the arcade set · purpose 8/10 · fun 9/10)`

- **does** — One-button flight. The bird holds its place and the wall scrolls at it; the wall has **real gaps**, one
  per option, and the gap the bird is inside when the wall arrives is the answer. A click on a gap answers at once
  (the honest "I know it" path, and the only one a keyboard or reduced-motion student has); a click anywhere else
  flaps.
- **the stream** — walls are things in flight, not a state of the stage: each one is cut once, flies from the right
  edge to past the left one, and is retired while the next is already behind it. Answering does not stop the flight,
  so a run is **one continuous flight through every gate in it** — only the bricks end it.
- **the wall is the stake** — a right gap is a point and the flight carries on through it into the next question. A
  wrong word costs nothing: the flight continues. Flying into the **brick** costs one of three hearts *and the run* —
  the block starts again at its first question, in the same order, with what was already answered left as it was
  written. A restart is a second attempt, so the score a finished block shows is the **best attempt**, not the last.
- **opts** — **2 to 4 gaps per wall**, one gap per option. The wall is a fixed height and a gap is 65px, so four fill it; a fifth would have to be cut narrower than the word standing in it.
- **skins** — gaps are options; the prompt is fixed on the HUD.
- **art** — a drawn bird that flaps its wings on every lift, including the one automatic flap as the round opens, so
  it is never falling before the student has touched anything; a brick wall with the words sitting in its gaps; sky
  as a flat fill. Fall is half what it was, lift unchanged.
- **can't** — recognition at speed only, and it is the most expensive of the arcade set.
- **needs** — shared runner + gravity loop.

### `wordleBoard - (best for: spelling one word to a five-try limit; the deduction pleasure of letter feedback; repeated right-letter evidence · can't: run on phrases or on any word length but the fixed one; teaches no meaning and no listening · purpose 9/10 · fun 9/10)`

- **does** — The student guesses the word and presses Enter; the board marks right letter/right place and right
  letter/wrong place. Five rows and the run is over. Hangman is the same engine with a different face (a revealed
  blank row instead of coloured tiles).
- **opts** — **one target word per item**, the same length in every item of a block (the board is built from the answers, so the block must hold to one length), and **2 to 4 options** — the options only carry the evidence radio, because the word itself is typed. Five tries per word and two lives per run.
- **skins** — one target word per item, typed into a `gap` at the end, so the evidence is spelling the student
  produced rather than letters guessed. The stem is the clue, so it is not printed a second time on the HUD line.
- **art** — the stage reads left to right: the **clue on the left**, the tile grid and the box you type into as the
  centre pair, and a **message on the right** ("too many letters", "too few letters") that fades in over .5s, holds
  2s and fades out over .5s. The three are centred vertically and the board never grows, so nothing moves when a
  word lands — a wrong length costs a message, not a row.
- **can't** — only words of one fixed length; nothing for phrases, meaning or listening.
- **needs** — nothing; `engine4.js` ships it.

### `mineGrid - (best for: making a guess cost something; reading before moving; leaving blanks a teacher can read as evidence · can't: run on a lesson that writes two or three options — the street comes up short · purpose 8/10 · fun 7/10)`

- **does** — The options are planted as **pairs of batwing saloon doors along a street**, the word hung over the top
  where it can be read. Pick a door and **the figure walks to it**, which makes the choice a character's risk rather
  than a bare click; the door then swings open, because what is behind it IS the answer. **Right:** he goes in, a glass
  clinks on the bar, and the next question arrives on the same street, which never leaves the stage. **Wrong:** a snake comes
  out of the dark and bites him — one of three lives gone, and his drawing changes as they go. Three bites end the run.
- **teaches** — commitment under stakes. Because he only gets three mistakes, a guess has a price, so the student
  reads before moving. Every wrong pick leaves its radio blank, so the blanks are the teacher's evidence.
- **opts** — **exactly 4 per item**, one door per option: the street holds four doors, so four is both the floor and the ceiling — a lesson that writes two or three options leaves the street short.
- **skins** — four options is what the street holds: one door per option. The lives belong to the RUN, not to the item,
  so they are set on the way in and never between items — a life that came back with the next question would mean a
  miss cost nothing. The count is the HUD's, and the stage draws no second copy of it.
- **marking** — exact: on a right answer only the door he opened turns green; on a wrong one that door turns red with
  the snake in it and the right door is outlined, and nothing else on the street reacts.
- **art** — a street and a boardwalk, a signed doorframe per word with a drawn batwing door that swings on its hinge,
  a drawn snake, and a figure with hurt and down states.
- **can't** — one answer per door; a lesson that writes two or three options leaves the street short.

### `crosswordBoard - (best for: spelling a word to its clue; showing that words share letters; a board where one shared cell solves two items · can't: handle long or unspellable words, and a vocabulary sharing no letter can only sit in separate rows · purpose 9/10 · fun 8/10)`

- **does** — A **real generated crossword**. Each `.qitem` carries `data-answer` (the word) and its `.qstem` is the
  clue. The engine lays the whole set out at once: the first word across, every later word placed so it **crosses**
  an existing letter, anything that cannot cross dropped into its own row below. A shared letter is one cell, so
  typing it once fills both words and **solves both items** — that is the point of a crossword and why this is a
  board, not a drill. A full word typed wrongly costs **nothing**: nothing clears, nothing is scored and its cells
  stay as they were typed, so the student keeps at it until the word goes green. A right word is **a point**, and
  **five points wins the board**; under five it simply stays open with whatever it has, because there is no clock and
  no lives here.
- **opts** — **2 to 6 words per block**, and **2 or more options per item**. Each item's `data-answer` is the word (letters only, at least two of them) and its `.qstem` is the clue; every answer has to be spellable or the board refuses the run, and six short words is the ceiling — the grid sizes its cells to fill the stage down to an 18px floor, and a seventh word drops below it.
- **art** — the site's own grid: a flat block per gap, a small number in the corner of each word's first cell.
  The cells are sized to **fill the stage** (10px of margin all round, height and width each get a say), and the
  clue for the word you are typing sits in its own panel **beside the grid** — one clue on the stage, never the
  same clue twice.
- **can't** — the set must be spellable and the words short, or the grid gets fat; words with no shared letter can
  only sit in their own rows, so a lesson whose vocabulary shares nothing is a bad fit.
- **needs** — nothing; `engine4.js` ships it. Authoring: `data-answer` on each `.qitem`, clue in `.qstem`.

### `echoPads - (best for: word order and collocation one word at a time; a constraint the student can see on the stage; planning a sentence end to end · can't: cover more than one sentence per block, and trains neither spelling nor listening · purpose 9/10 · fun 7/10)`

- **does** — Builds **one sentence, word by word**. `data-first` is the opening the student is given ("Yesterday
  I"); every `.qitem` after it is the next word of that sentence, and its options are the word that fits after
  what is already on the board plus **three that are close but do not fit the grammar** of the words placed. A
  right pad puts the word in the sentence, answers that item and moves on. A wrong pad costs one point and does
  **not** move on: a sentence cannot continue past a word that does not fit, so the student tries that same word
  again. At zero points the run is over.
- **teaches** — word order and collocation under a constraint the student can see: the sentence on the stage IS
  the question, so every choice is judged against the words already placed rather than against a rule recalled.
- **opts** — **exactly 4 pads per item**: the word that fits plus **three near misses**, and one item per word AFTER `data-first`, so the sentence's own word count is the item count. One sentence per block — a second sentence is a second block, not a longer run.
- **skins** — one `.qitem` per word of the sentence, `data-a` the word that fits, three near misses as the other
  pads. `data-first` the given opening, `data-lives` the countdown of points (default 10) — the HUD pair counts
  `left/start` down, one point per wrong pad. `data-time` does not apply: a board you fill at your own pace. The
  sentence and the hint line are the prompt, so nothing is printed a second time on the HUD line.
- **art** — a paper sentence strip that fills in as words land: the given words in a dashed tan chip, the placed
  words in green, a caret holding the next place; four word pads on the neon arcade scene; "Say the sentence"
  reads out the sentence as it stands.
- **levels** — **two of them, and neither is shown.** `data-level` on the block decides, else the lesson page's own
  `L`, and a lesson numbered 20 or above is level 2. Level 1 prints the hint line. **Level 2 prints no hint at all** —
  not "Next word:", not even the wrong-pad line — so the reading has to come off the sentence; every other pad in an
  item must then be **impossible** in that position, not merely unlikely, which is an authoring rule the engine cannot
  test. The start card is the game's own line: "Build a sentence - Dont get distracted by similar words!"
- **can't** — one sentence per block and one word per item, so the wording has to be planned end to end; nothing
  here trains spelling or listening.
- **guardrail** — the sentence comes FIRST and the pads are generated second, one word at a time, LEFT TO
  RIGHT: for each `.qitem`, read the words already on the board (`data-first` plus every item before it), then
  write the one word that fits and check the three distractors against that same reading. A distractor that
  could follow what is placed is a broken item — the student is reading the sentence, not recalling a rule, so
  the pad that also fits is the pad that teaches nothing and scores a coin flip. Generating the three options
  before the phrase is written, or from the whole sentence at once, is what produces them.
- **needs** — nothing; `engine4.js` ships it (the voice is the built-in speech).

### `bingoCard - (best for: recognising the spoken form of a word; one-chance attention with no replay; hearing under a countdown · can't: hear anything longer than a word, and it needs several options across the block or the decoy pool runs dry (the two countdowns are the game's own) · purpose 8/10 · fun 9/10)`

- **does** — A 3×3 card is built from the item's own options **plus decoys drawn from the rest of the block**, so the
  card is never trivially small. The card arrives shut behind a velvet curtain and the voice **calls the correct
  answer's word exactly once** (the clip when the item has one, else the right option's text — never the question).
  There is no replay button: paying attention to the one chance IS the activity. A **3·2·1 countdown** in its own
  card at the grid's left edge runs while the caller speaks; at zero the curtain rises, and a **7·6·5·4·3·2·1
  countdown** in a card at the right edge starts. Stamp the tile you heard and the item is answered. Let the second
  countdown reach zero and the curtain **falls on the item**: it is marked wrong and the point it was worth is gone.
- **opts** — **2 to 9 options per item**. The card is nine tiles: the item's own options first, then decoys drawn from the rest of the block to fill it — so a two-option item is padded to nine, a nine-option item has no room for decoys, and more than nine cannot be shown at all.
- **skins** — tiles are options, so the words on the card are the lesson's words. The instruction is the block's own
  `.game-how` and nothing else — nothing inside the stage prints "listen" as a second heading.
- **marking** — exact: the tile the student stamped turns green or red, and nothing else on the card reacts. The right
  tile is never revealed, so what the caller said is never shown.
- **art** — a bingo hall: red velvet curtain that drops away on an ease-in curve (it starts almost too slowly to
  notice, then falls), footlights, two countdown cards in the site's own paper-and-ink style, and a stamped tile
  that takes a hard double border.
- **can't** — recognition of the spoken form only, one word per item; the card needs a few options across the block
  or the decoy pool runs dry, and a lesson block cannot set the two countdowns — they are the game's own clock.
- **needs** — nothing; `engine4.js` ships it (uses the built-in voice). Leave `data-time` at 0.

### `ladderRun - (best for: the page's quiz rather than a drill; keeping what was safely earned; scaling one block from five items to a full test · can't: act as a mid-lesson beat — one continuous arc — and its fall to the safe rung is harsh, so items must be fair · purpose 9/10 · fun 8/10)`

- **does** — A full-height rail with a climber and a chest at the top. One rung per right answer, a **safe rung every
  five**, and the height is **heard** as well as seen (a rising motif as you climb). A wrong answer slides the climber
  back to the last safe rung — so what was safely earned is kept, which is what makes a ladder a ladder and not a
  list. Longer lists make a taller climb, so the same block scales from a five-item drill to a full quiz.
- **opts** — **2 to 4 options per item**, and **5 or more items per block**. One right answer is one rung and the safe rung is every fifth, so under five items there is no fall to catch; above five the length is free, the climber simply climbs further.
- **skins** — the `.qitem` list is the ladder; the options are the buttons under it.
- **art** — the ladder is drawn to the run's length, the climber steps up on a right answer and slips on a wrong one,
  the chest lights when he reaches the top.
- **can't** — one continuous arc, so it wants to be the page's quiz, not a mid-lesson drill; and a fall back to the
  safe rung is deliberately harsh, so keep items fair.
- **authoring the answer key** — **exactly one option may be defensible.** Two options that are both grammatical, or
  both true of the clue (a real answer and a close synonym, `stay` and `will stay` under `if it rains`), is a broken
  item: the student who reads carefully is the one who gets it wrong. Write the wrong option so it is wrong for a
  reason the lesson has taught, and read every item back as a picky teacher before shipping it.
- **needs** — nothing; `engine4.js` ships it.

### `bossRaid - (best for: a long drill with a visible cost; ritual stakes and a chosen fighter; an ending that belongs to the answers, not a timer · can't: rescue weak items — the stakes mask them, so every item must still be defensible on its own · purpose 8/10 · fun 10/10)`

- **does** — The student **picks a fighter on the intro card** — sword, wizard or archer — and the choice is not
  decoration: it decides HOW the right answer lands. The swordsman steps in and cuts, the wizard throws a fireball that
  bursts on the boss, the archer's arrow flies straight and fast. So the hit is thrown by the character the student
  made, which is the whole appeal of a fight game.
- **the boss answers back** — a wrong answer is the boss's turn, and it does not repeat itself: it takes turns between
  a **bite** (it lunges at the fighter) and **acid** (it spits a drop that flies across the arena and lands on him).
  Three hits taken and the fighter goes down, so a long drill has an ending that belongs to the answers, not a timer.
- **teaches** — a long drill with a visible cost. The HP bar is the boss's health and it only moves when answers are
  right; the fighter's three hits are the only thing that shortens the run.
- **opts** — **2 to 4 options per item**. The fighter's three hits are the run's only brake and the boss's HP is the item count, so length is free but the answer row is not: at five buttons the arena is all buttons.
- **skins** — the `.qitem` list is the attack sequence; the options are the answer buttons. Nothing about the fighter
  is authored — the game offers its own three — so a lesson block is just a list of items.
- **art** — a torch-lit arena, three drawn fighters with their own weapons, a fireball, an arrow and an acid drop as
  separate sprites, a drawn boss with bite/hurt states, a slash arc, an HP bar.
- **can't** — ritual stakes can mask weak items; every item must still be defensible on its own.

### `trainOrder - (best for: one fixed adjective order made physical; the two ways a sentence sounds wrong; a rule felt instead of memorised · can't: contrast two orders, teach a second rule, or produce anything — the sentence is built, never written or said · purpose 9/10 · fun 8/10)`

- **does** — The adjective slots are the flatbed cars of a train standing under a low bridge, and the student
  **loads the adjectives onto it**: every adjective waits on the loading dock at one size, and dropping one into a
  car makes it **grow to the height its own slot is allowed**. The load in the right car tops out on one level line
  just under the bridge; an adjective put a car too far back grows through the deck. The train then leaves: a clean
  one runs out under the bridge and is stamped CLEARED; a wrong one hits it, the plank over that car breaks, the car
  tips over and a heart goes with it. **An empty car is fine**, and an adjective placed too early only leaves a gap,
  though it still scores nothing, because the car it stands in was not its car.
- **ADJECTIVES ONLY** — this game teaches the adjective order and nothing else. Every item is one adjective; a block
  must not use it for verb order, for tense, for word classes it cannot place, or for anything whose correct place
  the eight slots do not name. **Difficulty is free**: generate at any level, because the order is the same rule at
  every one of them, and the block's level never widens what the game can test.
- **the question is the noun's frame** — the prompt card reads **`That's a _______ <noun>`**, taken from
  `data-noun` on the block. So a lesson generation **picks one noun and one to eight adjectives to describe it** and
  writes only the adjectives as items; the noun is never an item and never a load. Eight is the ceiling (there are
  eight slots, and no two adjectives may share one), and **the train stands one car per adjective** — a train of
  eight adjectives is an engine and eight flatbeds, a train of three is an engine and three.
- **teaches** — a SEQUENCE, with a consequence for breaking it. Opinion → Size → Age → Shape → Color → Origin →
  Material → Purpose is the whole content; the train is what makes the order physical instead of a rule to memorise,
  and the two ways of being wrong (through the bridge / a gap with the load short of it) are the two ways a sentence
  can sound wrong.
- **skins** — one `.qitem` per ADJECTIVE: the stem is the adjective, and the options are the eight slots, one radio
  per slot, `value` naming it (`opinion`, `size`, … or `1`–`8`). `data-a` on the item is the slot its adjective
  belongs in, so the answer that saves is the ordinary radio of the car the student chose. **No car carries a
  label**: the slots are read as positions, not as names. Author the adjectives in order so the dock reads like the
  sentence. No `data-train` any more: one block is one train.
- **opts** — **1 to 8 adjectives per block**, one per slot, and the options ARE the eight slots (one radio per slot).
  Eight is the ceiling because there are eight slots and a second adjective in one slot has no place to stand; one is
  the floor, though a lesson would rarely stop there.
- **levers** — `data-noun` (the noun the frame names, required in practice: without it the card shows the blank and
  nothing after it), `data-depart` (seconds the train waits on the dock before it leaves with whatever is loaded,
  default 30, `0` = wait for ever), `data-lives` (trains that may be wrecked before the run ends; absent = one per
  train, at most three), `data-slots` (replace the eight slot names, pipe separated).
- **art** — **a plain train**: a locomotive drawn from flat boxes (cab, boiler, chimney, dome) and one flatbed
  wagon per adjective, every deck the same height, wheels on the rail. What grows is the load on the deck. A lattice
  girder bridge in eight planks (one per car, so the collision breaks the piece the wrong car hits) and a
  slammed CLEARED / DERAILED stamp. Behind
  the yard: a sky, two hazed ridges of hills with snow on the two high peaks, and the ground the rails are laid on —
  the train is somewhere, not on a flat beige field.
- **fits** — full width only: eight cars cannot be read at a half.
- **can't** — one order, so it trains one rule: it cannot contrast two orders, and it is not a production exercise —
  the sentence is built, never written or said. Word-level vocabulary has to be known already, since the sentence is
  never spelled out beyond its own words.
- **needs** — nothing; `engine4.js` ships it. Author four to eight words per train, and put the ORDER on the page
  above the block (a chart or a one-line rule) — the game tests it, it never states it.


### `twoWordVerb - (best for: the register of a word already understood; producing the everyday form; proving the one-word twin means the same · can't: teach meaning, and it teaches a false equation whenever the pair is not genuinely interchangeable · purpose 8/10 · fun 5/10)`

- **does** — A chart puts the everyday two-word verb beside its one-word twin; the student then writes the everyday
  form into the gap (`<everyday verb>` ↔ `<one-word twin>`). Production is always the everyday form: it is the one
  they will be heard using, and the twin exists only to prove the meaning is unchanged.
- **markup** — column pair: `.chart` with the twin in the left column and `input.gap` in the right, then three to
  six item-list gaps that ask for the form from the other direction.
- **fits** — HALF, by width fill: a two-column chart of short pairs plus a few gaps does not fill a full row, so
  it collapses to half width and is centred when it is alone (its lead-in and notes wrap to that width and never
  count as fill). Pair with `registerContrast` when the lesson also has a stiff/spoken axis, or with
  `sentenceCombine` when the pair changes the rhythm of a whole sentence.
- **vary** — reverse the direction (twin → everyday) before widening the vocabulary; then move the verb into a
  sentence with a subject that forces agreement. Rarer verbs make it *unfairer*, not harder.
- **can't** — the pairing has to be genuinely interchangeable, or the chart teaches a false equation; and it is a
  vocabulary lesson, not a meaning lesson — the student learns the register of a word they already understand.

### `contextFit - (best for: whole fixed expressions used in a stated situation; matching a chunk to what it answers; teaching a chunk as one piece with audio · can't: teach the grammar inside the chunk, and a chunk whose parts can be swapped is not a chunk · purpose 8/10 · fun 5/10)`

- **does** — Whole fixed expressions taught as one unit with audio, then used: the student writes the chunk that fits
  a stated situation into the gap, or matches the chunk to what it answers.
- **markup** — column pair for the bank itself (chunk ↔ what it does), then an item list of situations with one
  `input.gap` each. The `.listen` chip carries the chunk, so the student hears it as one piece.
- **fits** — full only when its content fills the row; the bank plus its situations is usually a HALF, and it collapses to half width on width fill alone (its note and lead-in text do not count toward that fill). Best beside a `chatSample` that shows the chunks in their natural habitat.
- **vary** — start with the chunk fully given and gap only the situation; then invert. The real lever is *which*
  chunks are in the bank: same function, different politeness, is harder than more chunks of the same politeness.
- **can't** — a chunk whose parts can be swapped is not a chunk, so check it is said as one piece; and it never
  teaches the grammar inside it — that is the point, and also the limit.

### `sentenceSurgery - (best for: word and chunk order; assembly that reads wrong until it is right; holding a whole sentence in memory · can't: handle a sentence with two defensible orders, and it tests assembly, not meaning — the student can rebuild what they cannot translate · purpose 9/10 · fun 6/10)`

- **does** — A sentence or a whole exchange is cut into chunks and handed over out of order; the student rebuilds it.
  Word order, chunk order and linking all show up immediately, because a wrong order reads wrong.
- **markup** — the chunks are listed as a bank, and BELOW the bank there is one ORDER LINE the student drags them
  into: position comes from where a chunk is dropped, not from a number typed beside it, so the sentence is the
  thing being built and nothing is written twice. A keyboard path exists for every drag (a chunk picks up and
  drops on Space/Enter), because the line must not be pointer-only. **Alternate form** — the same block, cut the
  other way: the sentence arrives with EXTRA words in it and the student removes the ones that do not belong.
- **fits** — full, or half beside `dictogloss` when the lesson is also about holding a sentence in memory.
- **vary** — more chunks before longer chunks; then remove the numbered scaffold so the whole sentence must be typed.
  A sentence with two defensible orders is not a harder item, it is a broken one.
- **can't** — only sequences with one defensible order; and it tests assembly, not meaning — a student can rebuild a
  sentence they cannot translate.

### `registerContrast - (best for: choosing register for a named audience; showing stiff beside spoken; sharpening a choice the student half knows · can't: judge without a described audience, and it only ever chooses between wordings someone else wrote · purpose 7/10 · fun 4/10)`

- **does** — Two columns contrast a stiff wording with the spoken everyday one; the exercise picks which fits the
  stated audience. The audience is always named, or the item is unjudgeable.
- **markup** — column pair for the contrast (`<stiff wording>` ↔ `<spoken wording>`), then an item list where each
  `.qstem` names a person and a situation and the radios are the two wordings.
- **fits** — full; it wants `audienceRow` (display) above it, because the student cannot choose a register for an
  audience the page never described.
- **vary** — two clearly different audiences before two similar ones. The lever is how close the two audiences are
  (a teacher vs a head teacher vs a friend's parent), not how rude the options get.
- **can't** — needs a described situation; with no audience both columns are defensible. And both wordings must be
  ones people REALLY say or write: a softened form invented for a phrase that never needs softening (or a stiff form
  for a phrase that never has one) teaches a register the student will never meet, which is worse than teaching
  none. If one of the two forms is not genuinely in use, the contrast is not a contrast — pick another phrase.
  And it only ever *chooses* between wordings someone else wrote — it never produces one, which is why it pairs
  with `politeLadder`.

### `questionBuilding - (best for: forming the question from its answer; asking the follow-up a context needs; form practice with a reason · can't: teach turn-taking (a perfect question in the wrong place still fails) and it is only markable if the acceptable forms are stated · purpose 8/10 · fun 5/10)`

- **does** — Given an answer, form the question; given a context, ask the follow-up.
- **markup** — item list of `input.gap`s, one per answer. The prompt is the answer the student is talking to — never
  a grammar label, or they conjugate instead of ask.
- **fits** — full, or half directly under a `dialogueMoves` block so the question has a conversation to land in.
- **vary** — same tense with a stated word order before free order; then add the constraint that the question must
  begin with `<question word>`. Loading two new demands into one item is the standard way this drill becomes unfair.
- **can't** — graded on form only, or free answers become unmarkable, so state what counts as right; and it does not
  teach turn-taking — a perfect question in the wrong place is still a failed exchange, which is `roleCard`'s job.
- **difficulty** — the item is harder than it looks: one answer can often be asked two or three correct ways, and a
  context can be so open that the "right" question is a judgement the page never defined. So each item names ONE
  thing being asked (the tense, the question word, the subject) and accepts every form that fits that one thing, and
  the answer it is built from is specific enough that only one question really answers it. If two different questions
  would both be right and both natural, it is not a harder item — it is a broken one.

### `repairMoves - (best for: the fixed moves that repair a breakdown; hearing the tone of the repair; whose fault the break is · can't: teach the conversation — needs a scene, and a teacher to judge whether the student could say it under pressure · purpose 7/10 · fun 4/10)`

- **does** — The fixed moves for when communication breaks: ask for a repeat, check a guess, restate.
- **markup** — item list: a short exchange with the break marked, then one `input.gap` holding the move that repairs
  it. The `.listen` chip carries the move so the student hears the tone, not just the words.
- **fits** — half, beside a `dialogueMoves` block — this is the emergency exit of the same conversation.
- **vary** — the move alone, then the move inside a longer exchange. What actually makes it harder is *whose* fault
  the break is: repairing your own sentence is a different move from rescuing someone else's.
- **can't** — teaches the move, not the conversation; needs a scene to mean anything, and a teacher to judge whether
  the student could actually say it under pressure.

### `pronLab - (best for: one phoneme the first language lacks; mouth position beside a contrast table; testing the distinction after showing it · can't: justify its space without a real first-language error, and it covers one phoneme — never an accent · purpose 8/10 · fun 4/10)`

- **does** — For a sound the student's first language lacks: a mouth-position guide (in Portuguese) beside a
  first-language-vs-English contrast table, then items that test the distinction.
- **markup** — treated as a mini-page inside a section: `.chart` for the contrast, `.panel` for the mouth guide, then
  an item list of radios (which word was heard) or gaps (which spelling carries it).
- **fits** — full width — it is the most space-hungry block here, which is why it earns its place only once or twice
  in a course.
- **vary** — a contrast in isolation → the same contrast inside a word → the same inside a phrase. Adding a second
  contrast to the same lab is what destroys it.
- **can't** — needs a real first-language error to be worth the space, so generic "pronunciation" pages teach nothing;
  and it teaches *one* phoneme — never claim it fixes an accent.

### `minimalPairs - (best for: separating two near-identical sounds; homophones from a flap T or a silent letter; a quick ear beat under a display · can't: show that the student can say it, and it uses words they already know, so it carries no new vocabulary · purpose 9/10 · fun 6/10)`

- **does** — The target word beside its near-neighbours, each with audio, so the ear separates one phoneme by its
  minimal difference. Also covers homophones from a flap T or a silent letter.
- **markup** — item list of radios where the `.qstem` is silence and the answers are the words: the clip *is* the
  question, so `data-say` on the chip supplies the key and no answer is written into the page.
- **fits** — third or half; it is a beat, and it should sit immediately under whatever displays the pair.
- **vary** — two words → three → the pair inside a phrase at speed. Three options is the minimum for anything that
  matters, because two is a coin flip.
- **can't** — recognition only; it never shows the student can say it, and it deliberately uses words the student
  already knows, so it cannot carry new vocabulary.

### `listenIdentify - (best for: a ternary recognition beat (sound, ending, stress); the cheapest listening block; an ear check before production · can't: work on two options (a coin flip), and it proves a difference was heard, not that either word means anything · purpose 8/10 · fun 5/10)`

- **does** — A binary or ternary recognition item: which sound, which ending, which stress pattern was heard.
- **markup** — item list of radios with the `.listen` chip doing the asking; the prompt only says what to listen for,
  because a prompt containing the answer makes the clip decoration.
- **fits** — third, or half. It is the cheapest listening block there is, which is also why two of them in a row is
  visible laziness.
- **vary** — three options, then the same three inside a phrase; then the same phrase at natural speed. More options
  beyond three adds guessing, not difficulty.
- **can't** — two options invites a coin flip, so three minimum for anything that matters; and it tells you the
  student heard *a difference*, not that they know what either word means.

### `errorCorrection - (best for: refusing the classic first-language error; distractors that each encode one real error; word-sized or sentence-sized granularity · can't: show production — it only shows the wrong form was refused, so pair it with a gap drill · purpose 8/10 · fun 5/10)`

- **does** — Pick the correct item among distractors that each encode the classic first-language error, at whatever
  granularity fits: one word or a whole sentence.
- **markup** — item list of radios. Every wrong option is a *real* error a Portuguese speaker makes, so the wrong
  answers are informative rather than random.
- **fits** — third, or half. Cheapest form check there is; it belongs right after the rule is displayed.
- **vary** — one distractor at a time before four; then the same error inside a longer sentence where the trigger is
  further away. Adding distractors that are merely odd (not wrong) is what makes it a trick question.
- **can't** — distractors must be real errors, or it becomes a spot-the-typo; and it never shows the student can
  *produce* the form, only refuse the wrong one — pair it with a gap drill in the same lesson.

### `syllableLab - (best for: counting syllables; locating the beat the stress lands on · can't: anything yet — this file states no mechanism, no art and no limit for it, so nothing here is claimed · purpose 3/10 · fun 3/10)`

- **does** — 
- **markup** —
- **fits** — 
- **vary** — 
- **can't** 

### `errorHunt - (best for: proofreading a whole short text; a stated error count that turns browsing into a task; cumulative review of taught errors · can't: be beat-sized (it needs a self-contained text), and finding all the errors is not knowing why they were errors · purpose 9/10 · fun 6/10)`

- **does** — A short text with a stated number of errors; the student types the corrections below. Saying how many
  there are is what makes it a task rather than a browse.
- **markup** — the text as prose, then a short item list of `input.gap`s — one per error, in no required order — with
  the stated count in the instruction line.
- **fits** — full width; it is a section, and it works best immediately after `ruleCard` has stated the rule it hunts.
- **vary** — the count is the lever: an unstated count is a different, much harder task. Then make the errors the ones
  the rule predicts, rather than the ones that merely look odd.
- **can't** — needs a self-contained text, so it is not a beat-sized vehicle; and a student who finds all the errors may
  still not know why they were errors — the debrief is the teacher's.

### `oddOneOut - (best for: making a category decision that needs a reason; discrimination the student must justify; a discussion opener · can't: survive two defensible answers, so the justification is mandatory and the teacher must read it; it never produces the target form · purpose 7/10 · fun 6/10)`

- **does** — One item doesn't belong; the student picks it **and says why** in a line.
- **markup** — item list of radios for the pick, plus **one block-level `<textarea>`** for the reasons. The textarea is
  deliberately shared, not per item: it is unmarked evidence, and a per-item textarea would break the one-control rule.
- **fits** — third or half; it opens a section well because the reason becomes the next block's subject.
- **vary** — the odd one out by meaning, then by form, then by usage. Four items → five. What genuinely makes it harder
  is when the odd item is odd for a *subtler* reason, not when the vocabulary is rarer.
- **can't** — if two items can be defended, the item is broken, so the justification is mandatory and the teacher reads
  it; and it never produces the target form.

### `spotTheDiff - (best for: noticing what changed between two texts; close reading of a chat or a notice; finding the difference before naming the rule · can't: say which version is right, and it is wasted on differences that are only punctuation · purpose 7/10 · fun 6/10)`

- **does** — Two versions of the same short text, chat or notice; find and state the differences.
- **markup** — worked pair: `.itemrow` of two `.panel`s side by side, then one gap per stated difference number. The two
  panels must be the same length, or the layout gives away where the changes are.
- **fits** — full width — two texts side by side is the whole mechanism, so it cannot be squeezed into a third.
- **vary** — the count stated (like `errorHunt`), then unstated; then a version where the difference is one of *tone*
  rather than of content, which is the interesting one.
- **can't** — the differences must be meaningful, not punctuation; and it does not say which version is right — that is
  the next block's job.

### `predictReveal - (best for: investment before the answer arrives; writing what happens next; making a scene matter · can't: mark anything — it produces investment, not accuracy, and needs a right-answer block after it or the page has no evidence · purpose 8/10 · fun 8/10)`

- **does** — The scene stops mid-way; the student writes what happens next, then reveals the real ending.
- **markup** — open response: the scene as prose, one `<textarea>`, then the real ending inside `<details>` so the page
  hides it until the student has committed.
- **fits** — half or full. It is the cheapest way to make a student care about the next block's vocabulary.
- **vary** — a stated number of sentences, then free length; then give the ending first and ask for the beginning. The
  lever is how much of the situation is withheld, not the length of the writing.
- **can't** — no marking; it produces investment, not accuracy, so it must be followed by a block that does ask for a
  right answer — otherwise the page has no evidence at all.

### `miniProject - (best for: free production toward a real artefact; a word bank and a textarea; end-of-lesson synthesis · can't: train a form under control or be auto-marked — the checklist is what the teacher marks against · purpose 8/10 · fun 7/10)`

- **does** — Build something in English: a plan, a poster, a set of rules, an order. Word bank plus textarea.
- **markup** — open response plus a `.panel` word bank. The brief is a **checklist**, not a paragraph: five things the
  thing must contain, so "done" is visible.
- **fits** — full width, and it wants the page's spine (section 8) built around it — a project in the middle of a quiz
  strand is a detour.
- **vary** — fewer required elements, then more; then a length limit, which is the harder constraint. Never raise the
  vocabulary as the difficulty lever — the point is producing with words they have.
- **can't** — free production only, so nothing here trains a form under control and it needs a drill beside it; and it
  cannot be auto-marked — the checklist is what the teacher marks against.

### `cheatSheet - (best for: the student's own summary in their own words; recall of what was just taught; a revision artefact they keep · can't: prove accuracy — a confident wrong summary looks exactly like a confident right one · purpose 7/10 · fun 3/10)`

- **does** — The student writes their own summary of what they just learned, in their own words.
- **markup** — open response with **one** `<textarea>` and a short prompt naming the two or three things to include.
  A blank box labelled "summary" produces a blank box.
- **fits** — full width, at the end of the teaching run and *before* the quiz — a summary written after the test is a
  rewrite of the test.
- **vary** — "one line" → "three lines" → "as if explaining to a friend who missed it". The addressee is the lever; the
  word count is not.
- **can't** — evidence of effort, not of accuracy: a confident wrong summary looks identical to a confident right one,
  so the teacher must read it.

### `connectedFlow - (best for: marking where two words join; hearing a glide or a dropped sound; connected speech the printed page hides · can't: be seen by a written test, and it needs real recorded joins rather than a guess at how a line should flow · purpose 8/10 · fun 5/10)`

- **does** — Where two words meet: a consonant glides into a vowel (`<word> + <word>` → `/j/`), a sound is inserted
  (`<word> + <word>` → `/w/`), or one is dropped. The student marks the join, then hears it.
- **markup** — column pair showing the pair of words and what happens between them, then an item list of `input.gap`s
  asking for the join, and a `.listen` chip for the proof.
- **fits** — half. A written pair the ear hears as one needs only a narrow column to show the join.
- **vary** — one join per item before two; then the join inside a full sentence. The lever is how far apart the two
  words are printed, since distance is what the eye has to unlearn.
- **can't** — the ear only, and it is invisible to a written test: a student who marks every join can still say none of
  them. It also needs real recorded joins, never a guess about how a sentence "should" flow.

### `stressShift - (best for: stress that changes a word's job; choosing the reading the sentence needs; the pattern behind noun/verb pairs · can't: teach the sound — the student can pass every item and still stress both forms wrong · purpose 8/10 · fun 5/10)`

- **does** — The same written word carries its stress differently depending on the job it does (`<noun form>` vs
  `<verb form>`); the student picks which reading fits the sentence they were given.
- **markup** — item list: one short sentence in the `.qstem`, two readings of the same word as the radios, a `.listen`
  chip on the sentence's use. The word is identical in both options — only the meaning given by the stress differs.
- **fits** — third or half, directly under `stressBar` — the bar is what makes the difference visible before the item
  asks about it.
- **vary** — the pair alone, then inside a clause where the part of speech is not adjacent to the word. Two pairs in
  one item is unfair: the ear has nothing to anchor on.
- **can't** — it teaches the *pattern*, not the sound — the student can pass and still stress both wrong. Pair with
  `pronLab` for the mouth.

### `emphaticBeat - (best for: tying stress to intended meaning; showing one sentence has three readings; tone work beside a dialogue · can't: produce the sound (it marks a word), and it is genuinely hard where emphasis is marked by word order · purpose 7/10 · fun 6/10)`

- **does** — The same sentence stressed three ways, three meanings. The student is given the *intended meaning* and
  marks which word has to carry the beat.
- **markup** — item list: the meaning in the `.qstem`, the sentence printed once, and the student writes the stressed
  word into the gap. Radios per word would be tidier but would give away that exactly one word is marked.
- **fits** — half. It belongs beside `audienceRow` or `dialogueMoves`, where tone already matters.
- **vary** — three candidate words → five → a two-clause sentence where the beat can fall in either clause. The lever
  is the number of *plausible* hosts, not the length of the sentence.
- **can't** — only produces a marked word, never the sound; and it is genuinely hard for students whose first language
  marks emphasis with word order instead — that difficulty is the lesson, not a defect.

### `falseFix - (best for: fixing the one wrong word; testing words that have one defensible replacement; turning a statement of fact into an item · can't: handle a sentence two words would fix — that item has no single answer and must be rewritten · purpose 9/10 · fun 5/10)`

- **does** — Every sentence is **false**: exactly one word is wrong. The student types only the replacement word. The
  wrongness is the task, so there is no true/false judgement to hedge.
- **markup** — item list of `.qitem`s with one `input.gap` each, plus a `data-answer` attribute holding the right word
  so the page can be checked. One gap per item keeps the one-control rule intact.
- **fits** — full or half. It is the cheapest way to turn a statement of fact into a language item, and it pairs with
  `contrastTable` when the class has to see the true and false forms side by side before fixing anything.
- **vary** — the wrong word is from the same family (`<wrong form>` → `<right form>`), then from a different family.
  Making the wrong word merely rarer is not harder, it is unfair.
- **can't** — it can only test words with one defensible replacement; if two words fix the sentence, the item has no
  single answer and must be rewritten.

### `dictogloss - (best for: reconstructing heard text from memory; exposing the gap between what was heard and what was written; diagnosis · can't: be marked without a teacher, and it measures listening, memory, spelling and grammar at once — a good diagnostic, a poor test · purpose 8/10 · fun 6/10)`

- **does** — A short passage is heard twice at natural speed, then the student reconstructs it from memory in writing,
  then compares against the original. The gap between what they wrote and what was said is the whole lesson.
- **markup** — spoken pattern plus one `<textarea>`; the original sits inside `<details>` so it is only available after
  the attempt. Two `.listen` chips, marked as first and second hearing.
- **fits** — full width. It is the heaviest block in this section and it earns its space once per few lessons.
- **vary** — three sentences → five, and a familiar topic → a new one. Speed stays natural throughout: slowing the clip
  turns it into transcription and tests the wrong thing.
- **can't** — no key, so it needs a teacher; and it measures everything at once (listening, memory, spelling, grammar),
  which makes it a good diagnostic and a poor test.

### `wordFamily - (best for: one root's four jobs; showing that a family is not a set of synonyms; choosing a member by what the sentence needs · can't: run on a root with no distinct members in use — an invented member teaches a word nobody says · purpose 8/10 · fun 5/10)`

- **does** — One root, four jobs: the student takes `<root>` and puts the right member into each gap by what the sentence
  needs (the doer, the thing, the doing, the how). The lesson is that a family is not a set of synonyms — each member
  fills one slot and only one.
- **markup** — column pair for the family itself (member ↔ the job it does), then an item list of sentences with one
  `input.gap` each, deliberately including one sentence where the student's first instinct is the wrong member.
- **fits** — half, beside `collocationGap` at the same width; the two together are the whole story of a new word.
- **vary** — give the family in the box → withhold it and give only the root → include a member the family does *not*
  have, so the student has to reject it. The last is the only version that tests the mental model rather than the list.
- **can't** — only works on roots that really do have distinct members in use; inventing `<root>ness` to fill the grid
  teaches a word nobody says, and the student will use it confidently.

### `collocationGap - (best for: the partner word a noun or adjective takes; the pairing rather than the meaning; errors that survive knowing both words · can't: carry an answer that is not genuinely predictable — two natural partners make the item unfair · purpose 8/10 · fun 4/10)`

- **does** — The student writes the partner word: which verb goes with `<noun>`, which noun goes with `<adjective>`. What is
  tested is the pairing, not the meaning of either word — a student can know both words and still not know they go
  together, and that is the gap this block exists for.
- **markup** — column pair (the fixed word ↔ the partner that goes with it), then item-list gaps that ask for the partner
  from a stated meaning. Keep one gap per item.
- **fits** — half; full width only when the pairs are long phrases.
- **vary** — pairs that are near-synonyms → pairs whose partners are almost but not quite interchangeable → one item
  where the obvious partner is wrong for a reason the lesson has taught.
- **can't** — the answer has to be genuinely predictable; if two partners are natural, the item has no single answer and
  is unfair. Check by asking whether a native speaker would hesitate.

### `scaleChoice - (best for: ordering the words of one set by strength; matching a degree to a stated meaning; undoing the synonym assumption · can't: settle a blurred degree word — without deciding context in the prompt the item is an argument, not an exercise · purpose 7/10 · fun 5/10)`

- **does** — A meaning is given and the student picks which of the lesson's words sits at that point on a strength scale
  (`<weak>` … `<strong>`). Forces the realisation that words of a set are not interchangeable but ordered.
- **markup** — item list: the stated intensity in the `.qstem`, the candidate words as radios. The scale itself is shown
  once above as a `.chart` line, not repeated per item.
- **fits** — half, beside a `stanceScale` display block that draws the axis; full when the set has five or more members.
- **vary** — two options far apart → two neighbours on the scale → three where two are defensible and the deciding
  factor is stated in the prompt (who is speaking, how serious it is).
- **can't** — every item needs one defensible answer. Degree words blur under scrutiny, so the prompt must carry the
  deciding context or the item is an argument, not an exercise.

### `prepositionScene - (best for: function words learned by scene; the in/on/at cases a translation table gets wrong; writing the word a described picture needs · can't: get past the cases in the lesson's own set, and the general rule behind them is bigger than any block · purpose 8/10 · fun 5/10)`

- **does** — The same small set of function words placed against **pictures described in words**: the student writes
  which one the scene needs (in/on/at, to/for/with). Function words are learned by scene, not by translation, and a
  translation table gets `<in>` and `<on>` wrong for exactly the cases that matter.
- **markup** — column pair of scenes (a described place or moment ↔ the function word it takes), then item-list gaps
  that describe a *new* scene of the same type.
- **fits** — full; the scene column needs to be readable as a scene, not a list of nouns.
- **vary** — the scene given and one gap → two gaps in one scene → a scene where two function words are both possible
  and the difference is what changes the meaning.
- **can't** — it can only teach the cases in the lesson's own set; the general rule behind them is bigger than any block,
  so resist stating one.

### `summarySqueeze - (best for: writing the middle length between two versions; showing what gets dropped first; compression that still sounds like English · can't: be keyed unless several answers are accepted, and too tight a ceiling forces telegraphic English · purpose 7/10 · fun 4/10)`

- **does** — The same content written at two lengths, then the student writes the middle length. What gets dropped first is
  the lesson: function words go last, so a squeeze that only cuts content words is the version that still sounds like
  English.
- **markup** — worked pair: a long `.panel` and a short `.panel` side by side, then one `<textarea>` per task asking for
  the squeezed version at a stated word ceiling.
- **fits** — full; the two models need to be readable together or the comparison is lost.
- **vary** — squeeze by a third → by half → squeeze *up* (expand the short one) with the same ceiling rule. The reverse
  direction is much harder and is where most of the learning is.
- **can't** — no key unless the lesson accepts several good answers; and a word ceiling that is too tight forces
  telegraphic English, which teaches the wrong thing.

### `sentenceCombine - (best for: supplying the joining word; the relationship two halves imply; cause, contrast, condition and sequence in one decision · can't: work when either relationship is defensible — that item tests preference, not grammar · purpose 8/10 · fun 5/10)`

- **does** — Two short sentences given, one joined sentence required, with the joining word left as the gap. The student
  supplies the relationship (cause, contrast, condition, sequence), which is the part they cannot see in either half.
- **markup** — item list: two clauses printed in the `.qstem`, one `input.gap` for the joining word, and the required
  meaning stated in brackets so the relationship is fixed before the student chooses.
- **fits** — half; full when the clauses are long enough to wrap.
- **vary** — the relationship stated → the relationship implied by the pair → three clauses needing two joins, where the
  second join depends on the first.
- **can't** — the given meaning has to be implied by the content; if either relationship works, the item tests preference,
  not grammar.

### `expandCompress - (best for: adding detail by grammar rather than by piling on words; pairing expansion with compression; showing the skeleton under a sentence · can't: stop padding on its own — every added word must be a form the lesson taught, or it teaches volume · purpose 7/10 · fun 4/10)`

- **does** — One sentence, two directions: expand it by adding the detail the lesson's forms are for, then compress a
  longer one back to its skeleton. The pair of directions is what shows the student that detail is added *by* the grammar,
  not by adding words.
- **markup** — worked pair (`<bare>` panel · `<full>` panel) followed by item-list gaps in both directions, each stating
  which direction is wanted.
- **fits** — full; the compressed and expanded versions have to be seen together.
- **vary** — add one detail of a named type → add two of different types → compress a version that is deliberately
  overwritten, which is the direction students almost never get.
- **can't** — expansion invites padding; every added word must be a form the lesson taught, or the block teaches volume.

### `politeLadder - (best for: politeness as a choice of form for a stated hearer; three correct versions of one request; tone with no new grammar · can't: teach grammar, and the rungs must mean the same or the student is choosing content rather than tone · purpose 8/10 · fun 5/10)`

- **does** — One request, said at three levels of politeness, all three correct, ordered. The student then writes the
  version that fits a stated hearer. Politeness here is a *choice of form*, not an adjective on a word.
- **markup** — column pair with three rungs as columns and the hearer as the row label, then item-list gaps: a hearer in
  the `.qstem`, one `input.gap` for the rung.
- **fits** — full; three rungs plus a hearer column does not fit a half.
- **vary** — two rungs → three → four where the top rung is right for one hearer and *wrong* (oily) for another. The last
  is the item that turns the ladder into a rule.
- **can't** — the rungs must be interchangeable in meaning, or the student is choosing content rather than tone; and it
  teaches no grammar — only which of several known forms to reach for.

### `infoGap - (best for: writing the question that gets the missing piece; real asymmetry between two panels; question and answer as one pair · can't: be a speaking gap (everything must be answerable from the page), and a half holding the other half's answers kills it · purpose 8/10 · fun 6/10)`

- **does** — Two halves of one situation, each on its own panel, each missing what the other has. The student writes the
  question that gets the missing piece, then the answer that gives it. The information asymmetry is what makes the
  question genuine instead of an exercise.
- **markup** — worked pair: two `.panel`s side by side, one headed `<you>` and one `<them>`, each carrying facts the other
  lacks; then item-list gaps, one per missing fact, answered from the other panel.
- **fits** — full; the two halves must be visible at once or the gap is not a gap.
- **vary** — the fact needed is named in the prompt → only the category is named → both students must ask, and one item
  needs a follow-up question because the first answer is incomplete.
- **can't** — everything has to be answerable from the page, so it is a written information gap and not a speaking one;
  and a half that already contains the other half's answers kills it.

### `roleCard - (best for: producing a whole turn from a role; forcing the student to decide what to say; the only block here that demands a turn rather than a form · can't: be marked without a teacher or partner, and a card that lists the target phrases turns it into copying · purpose 8/10 · fun 8/10)`

- **does** — A card gives who the student is, who they are talking to, and what they need out of it — never what to say.
  The student produces the lines. This is the only block in the family that forces a whole turn rather than a form.
- **markup** — open response: one `.card` with three labelled lines (you · them · you need), and one `<textarea>` for the
  lines. Where a partner is available, two cards with a stated incompatibility.
- **fits** — half, in an `.itemrow` with a second card; a single card at full width wastes the row.
- **vary** — the need is stated → the need is implied by the role → the two roles want incompatible things, so the
  student has to negotiate rather than ask. The last is the version that teaches anything.
- **can't** — no key, so it needs a teacher or a partner; and a card that lists the target phrases turns the block into
  copying, which is the one thing it exists to avoid.

### `audienceShift - (best for: telling one event to a different hearer; selection — what you mention first and what you leave out; showing that telling is a choice · can't: be graded on wording — two students can both be right and sound different, so mark the shift · purpose 7/10 · fun 7/10)`

- **does** — One event, described to two different hearers, then the student writes the version for a third. What changes
  is not just formality but *selection* — what you mention first, what you leave out, what you admit to. The lesson is
  that telling is a choice.
- **markup** — worked pair: the same event in two `.panel`s with the hearer named above each, then gaps that ask for one
  stated element of the missing version (the opening, the part left out).
- **fits** — full; three versions need the width.
- **vary** — change only the hearer's age band → change the hearer's stake in the event → give the student a hearer who
  must not learn one of the facts, which is where the block stops being about grammar and starts being about judgement.
- **can't** — it grades badly: two students can both be right and sound different. Mark it for the *shift*, never for the
  wording; and it needs the event to be one the student has an opinion about.

### `pulseStress - (best for: finding which beat carries the main stress; hearing that English is stress-timed; counting beats instead of syllables · can't: produce the rhythm — every item can be right and the line still said unevenly; follow it with record-and-repeat · purpose 7/10 · fun 4/10)`

- **does** — A line printed under a row of numbered beats. The student writes **which beat** the main stress lands on, then
  beats the line out loud. English is stress-timed: the beats are roughly even and the unstressed syllables are squeezed
  between them, so counting beats is the only way to hear that.
- **markup** — column pair: the line split into beats, one cell per beat with the syllables inside it, then item-list gaps
  asking for the beat number. Real numbers, so the answer is checkable; no radios, which would give away the count.
- **fits** — full; a beat row needs the width or the beats stop looking even.
- **vary** — a line whose stress is on the first beat → a line where the stress moves because the meaning moves → a line
  where two beats are plausible and the stated meaning decides. That last one is the whole point: stress is not a property
  of the sentence, it is a choice.
- **can't** — it marks beats, never produces the rhythm; the student can answer every item and still not be able to say it
  evenly. Follow it with a record-and-repeat task if the rhythm is the goal.

### `lyricGap - (best for: the words a delivery swallows; dictation narrowed to what disappears; articles, `to` and auxiliaries instead of content words · can't: work without a real connected-speech clip — careful pronunciation leaves no gaps and nothing rescues the block · purpose 8/10 · fun 7/10)`

- **does** — One line, heard at speed, with the words that the delivery swallows left as gaps — the articles, the `to`, the
  auxiliary. It is `dictation` narrowed to exactly the words that disappear, which is the opposite of the usual drill that
  gaps the content words the student already hears.
- **markup** — spoken pattern: a `.listen` chip per line, the line printed with `input.gap` on the swallowed words only.
  A second chip with the same line slowed by the lesson, for the second pass.
- **fits** — half; a whole verse at full width is `dictation` again.
- **vary** — one gap per line → every swallowed word gapped → a line where the swallowed word changes the meaning and the
  student has to notice which one is missing.
- **can't** — it depends entirely on the clip being real connected speech; a clip that pronounces every word carefully has
  no gaps to find and the block cannot be rescued.

### `lineRepair - (best for: naming what a performer changed; the written form beside the performed one; building a small label vocabulary · can't: run without a genuinely performed clip, and the labels have to be taught once or the student guesses at your words · purpose 7/10 · fun 6/10)`

- **does** — Two versions of one line side by side: the written form and the performed form. The student writes what the
  performer changed — dropped, blended, moved the stress, added a word. Naming the change is the skill; knowing the line
  is not.
- **markup** — worked pair (`.itemrow` of two `.panel`s, `<written>` and `<heard>`) then one `input.gap` per change, asking
  for the operation (`dropped` / `blended` / `moved` / `added`) rather than the word.
- **fits** — full; the two panels must be read against each other.
- **vary** — one change per line → three → a line performed twice, differently, so the student has to say what is stable
  and what was the performer's choice.
- **can't** — the lesson has to supply a genuinely performed clip; and the labels are a small vocabulary of their own, so
  teach them once or the student is guessing at your words instead of at the language.

### `contourMatch - (best for: linking a pitch movement to its meaning; finished, not finished, asking, doubting; one hear-and-decide beat · can't: argue with a student who heard it differently — one hearing, one judgement, and real speech is messier than four labels · purpose 7/10 · fun 6/10)`

- **does** — A line is heard and the student picks which **movement** it made — up, down, up-then-down, flat-and-then-up —
  and what that movement means in this situation (finished · not finished · asking · doubting · listing). The pair of
  decisions is the lesson: intonation carries meaning that the words do not.
- **markup** — spoken pattern with three or four named contours as radios, the meanings printed beside them as the option
  labels. One `.listen` chip only; replaying is the student's, not the page's.
- **fits** — half; a contour drawing at the same width (see `melodyContour`) is the natural partner.
- **vary** — contours that are far apart → two that differ only in where they turn → the same line with the same contour but
  a different meaning, so the situation decides and the shape alone does not.
- **can't** — one hearing, one judgement, and real speech is messier than four labels; if the clip is ambiguous the item is
  unfair and there is no way to argue with a student who picked another one.

### `placeScript - (best for: the shape of a routine (open, ask, answer, close); order as the thing being taught; showing why the right words in the wrong order still sound wrong · can't: cover more than one routine in one setting, and it marks order and fit, never fluency · purpose 8/10 · fun 5/10)`

- **does** — A routine exchange written as a **sequence of moves** (open → ask → answer → close), each move a slot the
  student fills. What is being taught is the shape of the routine, not any one line in it: a student who knows all the
  words and not the order will still sound wrong, and this is the only block that shows the order.
- **markup** — `.chart` with a move per row (the move named in the left column, the line as `input.gap` on the right), in
  order, with the number of moves visible so the student sees where the exchange ends.
- **fits** — full; the sequence has to read top to bottom without wrapping.
- **vary** — every move given except one → only the moves named → two routine variants side by side where the same slot
  needs a different line, which is where the student learns the routine is a family, not a script.
- **can't** — it teaches one routine in one setting; the lesson supplies the setting and the lines, and a block that tries
  to cover "how people are here" covers nothing. Mark order and fit, never fluency.

### `directnessDial - (best for: the level of directness a hearer actually allows; showing that too direct is one of the options; choosing a level rather than the softest · can't: claim a universal scale — the setting must be stated or the block teaches a stereotype with a rubric · purpose 7/10 · fun 6/10)`

- **does** — One message, three ways of saying it, and a hearer. The student picks which level of directness the hearer
  takes — and, crucially, one option is **too** direct for that hearer, so the task is not "choose the softest" but "choose
  the level this relation actually allows".
- **markup** — item list: the hearer and the goal in the `.qstem`, the three versions as radios verbatim, in the same
  order every time so the student must read, not count.
- **fits** — full; three whole sentences as options do not fit a half without wrapping into soup.
- **vary** — hearers far apart (friend vs official) → hearers adjacent (colleague vs manager) → the same words to two
  hearers where only one option works for both and the rest work for exactly one. That is the item that stops the student
  memorising rungs.
- **can't** — directness is not a universal scale, so the lesson must state which setting it is talking about; a block that
  implies one right answer for all English users is teaching a stereotype with a rubric.

### `generationGap - (best for: which generation a line belongs to; pairing an older form with the newer one it replaced; register that moves · can't: last — every item whose answer depends on slang staying slang must be replaceable, or it expires in two years · purpose 6/10 · fun 7/10)`

- **does** — The same thing said by two generations, both correct, both current — an older form and a newer one with a
  stated speaker. The student decides which speaker the line belongs to. Slang ages, so the block pairs each newer form with
  the older one it replaced: the pair is what survives the decade.
- **markup** — column pair (`<older>` · `<newer>`, both inside `lang="pt"` glosses where the words are new), then item-list
  radios asking who is speaking.
- **fits** — half, beside a `chatSample` that shows the newer form in use.
- **vary** — pairs a generation apart → pairs a decade apart → a line that is not marked at all, so the correct answer is
  "either" — which is the real lesson and the item students get wrong.
- **can't** — everything here expires. Any item whose answer depends on slang staying slang must be replaceable without
  rewriting the block, or within two years the lesson teaches a rule that is no longer true.

### `mediaSnippet - (best for: reading a situation off one real line; who is speaking to whom and what they assume; catching what is not said · can't: stay current or be owned — quote a line, never a verse, and cut any item that does not stand alone · purpose 7/10 · fun 7/10)`

- **does** — One real line — a lyric, a headline, a line from a show — and three questions about the *speaker*: who they are
  talking to, what they assume the listener already knows, and what they are not saying. The language is real, so the
  lesson is about reading a situation off a line instead of reading a grammar off a sentence.
- **markup** — `.card` holding the line quoted (attributed, inside `<blockquote>`), then item-list radios on the speaker's
  situation. The line is short enough to sit whole on one line; a paragraph of it is `chatSample`.
- **fits** — half beside the rule it illustrates; full when it is the page's material.
- **vary** — three questions about the same line → one question where two readings are defensible and the surrounding
  lesson decides → a second snippet from the same source, so the student generalises across two lines rather than
  interpreting one.
- **can't** — it dates and it is somebody's property: quote a line, never a verse, and never build an item whose answer
  needs the student to know the source. If it does not stand alone, cut it.


### `contrastTable - (best for: displaying the one thing that changes; the same sentence said both ways; a one-line rule under the table · can't: check anything — it shows the difference and never tests it, and two differences in the columns make it unreadable · purpose 9/10 · fun 2/10)`

- **does** — Two columns, A and B, holding the same sentence said both ways, so the only thing that changes is
  the thing being taught. A note row under the table states the rule in one line.
- **markup** — `.chart` (a real `<table>`): a header row naming both sides, three or four rows, then
  `<tr class="note"><td colspan="N">` for the rule. Portuguese glosses in `lang="pt"`.
- **fits** — full, or half beside the block that makes the student choose between A and B.
- **can't** — shows the difference but never checks it; and if the two columns differ in more than one way, the
  contrast is unreadable and the rule is lost.

### `ruleCard - (best for: the rule, one proving example and the boundary case in three lines; stopping a rule from over-generalising; a model the student can hold · can't: carry more than one rule — a card with three teaches none · purpose 9/10 · fun 2/10)`

- **does** — The mental model in three lines: the rule, one example that proves it, and the **boundary case** —
  the sentence that looks like it should follow the rule and doesn't. The boundary case is the part that stops
  the rule over-generalising, and the part a prose paragraph always loses.
- **markup** — `.card` with a heading line and three labelled lines. No table; a card with a table in it is a
  `contrastTable` wearing the wrong clothes.
- **fits** — third or half; pair with a practice block of the same width.
- **can't** — one card carries one rule. A card with three rules teaches none of them.

### `workedExample - (best for: watching a form build step by step; labelled steps that name what changed; tense, question and negation forms · can't: work on a fixed phrase (it is decoration there) — only forms that genuinely build in steps · purpose 9/10 · fun 2/10)`

- **does** — One sentence assembled step by step, each step labelled with what changed and why
  (`<base>` → `<+ ending>` → `<final>`), so the student watches the form build instead of meeting it finished.
- **markup** — `.panel`, one step per line, real arrow characters, the label as text (never an image).
- **fits** — third; pair with `formulaFrame` at the same width.
- **can't** — only for forms that genuinely build in steps (tense forms, questions, negation). On a fixed
  phrase it is decoration.

### `annotatedExample - (best for: naming the working parts of a real sentence; three labels that carry meaning; showing what carries the tense · can't: label everything — labels on everything mark nothing, so three is the ceiling · purpose 8/10 · fun 3/10)`

- **does** — One real sentence with its working parts named: what carries the tense, the chunk that can be
  swapped, the piece that decides the meaning. Names sit beside or under the text.
- **markup** — `.panel`; the target part in `<b>` with a caption line under it; `lang="pt"` only where a word
  is genuinely new.
- **fits** — full (a labelled sentence needs horizontal room) or half with two labels only.
- **can't** — labels on everything mark nothing. Three labels maximum, or the student reads none of them.

### `formulaFrame - (best for: a pattern as a skeleton with named slots; filled versions beside the frame; patterns that really are fixed · can't: safely frame a pattern with moveable parts — the student then builds sentences that look like the frame and are wrong · purpose 8/10 · fun 3/10)`

- **does** — A pattern as a skeleton with named slots (`<I'd rather> ___ <than> ___`), then two or three filled
  versions. Teaches a shape to reuse rather than a conjugation table to stare at.
- **markup** — `.panel`; the skeleton in `<b>` with `___` for slots; the filled versions below, slot content
  marked so the student sees which part moved.
- **fits** — half; pair with the drill that makes them fill the slots.
- **can't** — only for patterns that are actually fixed. A frame with moveable parts teaches a false shape, and
  the student will build sentences that look like the frame and are wrong.


### `signalTable - (best for: the cue in the sentence and the form it forces; a rule usable without remembering a list of cases; the display form of the condition behind an item · can't: promise decisive cues — "always" where the language only mostly does this teaches a false rule · purpose 9/10 · fun 2/10)`

- **does** — The cue in the sentence, the choice it forces, one example each: `<cue>` → `<form it demands>`. This
  is the display form of the condition that decides the item, and it is what makes a rule usable without
  remembering a list of cases.
- **markup** — `.chart`, three columns (`<cue>` · `<what it forces>` · `<example>`), four to six rows. A
  `<tr class="note">` under it names the one cue that is a trap.
- **fits** — half, if the cues are short; full when examples are sentences.
- **can't** — no cue is decisive on its own; a table that reads "always" when the language only mostly does this
  teaches a false rule.

### `exceptionBench - (best for: exceptions grouped by why they behave that way; two or three items each carrying its reason; stopping a rule over-reaching · can't: help when the exceptions share no reason — then it is a list to memorise and should be cut · purpose 7/10 · fun 3/10)`

- **does** — The exceptions, grouped **by why they behave that way**, not listed as a set of facts to memorise.
  Two or three items, each `<form>` — because `<reason>`.
- **markup** — `.panel` with a short heading per group; two groups maximum. No table: an exception has a reason,
  and a table cell is too narrow to hold it.
- **fits** — half; pair with the practice block that uses both the rule and its exception.
- **can't** — if the exceptions have no shared reason, this block is a list of things to memorise and should be
  cut in favour of teaching them as separate items.

### `errorGallery - (best for: sentences that look right and are not; training the mistake rather than the correction; a striking opener · can't: produce anything, and it is heavy with negatives — more than five traps in one gallery and none are remembered · purpose 8/10 · fun 5/10)`

- **does** — Four or five sentences that **look** correct and aren't, each with the reason it fails. The fixes
  are not shown: the student meets those again in the practice that follows, so the gallery trains the mistake,
  not the correction.
- **markup** — `.panel`, one line per trap: the sentence in `<b>`, the reason under it in `lang="pt"` or plain
  English, numbered. Nothing else — a gallery with fixes in it is an answer key.
- **fits** — half, or full beside a `ruleCard`.
- **can't** — no production, and it is heavy with negatives; more than five traps in one gallery and the student
  remembers none of them.

### `beforeAfterStrip - (best for: naturalness rather than correctness; the version the student produces against a native one; one point per pair · can't: show an ungrammatical "before" (that teaches an error as the starting point), and three pairs in a row is a lecture · purpose 8/10 · fun 4/10)`

- **does** — One meaning written twice: the version a student at this level actually produces, then the version a
  native speaker would. Both are grammatical — the difference is naturalness, not correctness — and that is the
  whole point of the pair.
- **markup** — two stacked `.panel`s with `<before>` / `<after>` labels, or `.itemrow` with the two half-width.
  The natural version carries the changed chunk in `<b>`.
- **fits** — half each, side by side.
- **can't** — must never show an ungrammatical "before", or it teaches an error as the starting point; and one pair
  makes one point — three pairs in a row is a lecture.

### `soundGrid - (best for: one contrast in three positions; showing a contrast as a system rather than two words; listening and mouth work with audio on every example · can't: carry written form, and more than two sounds per row stops being a contrast and becomes a catalogue · purpose 8/10 · fun 4/10)`

- **does** — One contrast, shown in three positions: the same pair of sounds at the start, in the middle and at the
  end of a word, with a `.listen` chip on each example. Teaches that the contrast is a system, not two words.
- **markup** — `.chart`: rows are the two sounds, columns are the positions; each cell holds `<word>` plus a
  `.listen` chip. A `<tr class="note">` names the position where the student's own language interferes most.
- **fits** — full; it is three columns of examples plus labels.
- **can't** — it is listening and mouth-work only; no written form, and a grid with more than two sounds per row
  stops being a contrast and becomes a catalogue.

### `stressBar - (best for: the word's syllables with the stressed one marked; the rule that put the stress there; transfer to the next word · can't: promise a rule — English stress is only partly rule-governed, and a rule with more exceptions than cases is worse than "learn it by ear" · purpose 8/10 · fun 3/10)`

- **does** — The word broken into syllables with the stressed one marked, and **the rule that put the stress
  there** — which is what makes it transferable to the next word instead of a fact about this one.
- **markup** — `.panel`; syllables separated by a raised dot, the stressed syllable in `<b>`; one `.listen` chip for
  the whole word; the rule as one caption line under it.
- **fits** — third; two or three of them in an `.itemrow`.
- **can't** — English stress is only partly rule-governed, so a stress rule that has more exceptions than cases is
  worse than saying plainly that this one must be learned by ear.

### `spellingSoundMap - (best for: one sound and the several spellings that produce it; making reading predictable; the reverse direction of a sound grid · can't: promise rules — spelling is regular in patterns, and a claim that fails in the next paragraph is worse than "these four, no pattern" · purpose 8/10 · fun 3/10)`

- **does** — The reverse direction of `soundGrid`: one sound, and the several spellings that produce it (or one
  spelling and the sounds it makes), each with an example. Makes reading predictable instead of memorised.
- **markup** — `.chart`, two columns (`<spelling>` · `<example word with a listen chip>`), grouped by position if
  position changes the answer.
- **fits** — half.
- **can't** — English spelling is regular in patterns, not in rules; if the honest answer is "these four, and no
  pattern", write that, or the block teaches a rule that will fail in the next paragraph the student reads.
### `scaleAxis - (best for: placing the lesson's words on a named continuum; degree where a rule only gives two boxes; labelled ends · can't: be honest when two items could swap places — that axis is invented and must not ship · purpose 8/10 · fun 3/10)`

- **does** — Items placed along a named continuum (`<weak>` ⟶ `<strong>`, `<formal>` ⟶ `<casual>`,
  `<always>` ⟶ `<never>`), with the ends labelled. Teaches degree where a rule would only give two boxes.
- **markup** — `.chart` used as a strip (one row, one cell per step) or a `.panel` with the items separated by arrow
  characters and the two ends in `<b>`. Every item keeps its `lang="pt"` gloss if the word is new.
- **fits** — full; a continuum needs the width to read as a line.
- **can't** — it claims an order. If two items could swap places without changing meaning, the axis is invented and
  must not ship.

### `collocationMatrix - (best for: what actually goes together; stopping translation-shaped errors; rows and columns as a map of the set · can't: explain a blocked combination — ticks are not reasons, and the reason belongs in a ruleCard beside it · purpose 9/10 · fun 3/10)`

- **does** — Two sets of words as rows and columns, with ticks showing what actually goes together. This is the
  block that stops translation-shaped errors, because a pair that "means the same" in both languages lands in the
  wrong cell here.
- **markup** — `.chart`: `<set A>` down the side, `<set B>` across the top, `✓` and `✗` in the cells, and a
  `<tr class="note">` naming the one cell students always get wrong.
- **fits** — half if both sets are three items; full at four or more.
- **can't** — ticks are not explanations; if a combination is blocked for a reason (not just by convention), a
  matrix hides it and the reason belongs in a `ruleCard` beside it.

### `falseFriendSplit - (best for: one first-language word that splits into two in English; the test that decides which; errors that survive knowing both words · can't: help a word with one clean equivalent — presenting it here invents a difficulty the language does not have · purpose 8/10 · fun 4/10)`

- **does** — One word in the student's language that splits into two in English (or one English word that covers
  two things in the student's language), shown with **the test that decides which one** — a question the student can
  ask themselves in the moment.
- **markup** — `.panel`: the shared meaning on top, then each branch as `<English word> — <when it is the right one>`,
  a short example line under each, the drawing question pinned at the bottom in `<b>`.
- **fits** — half; pair with the drill that makes the student choose.
- **can't** — only for genuine splits; a word with one clean equivalent presented here invents a difficulty the
  language does not have.
### `audienceRow - (best for: one message at three distances; register as a choice with a reason; setting up the exercise that makes the student pick · can't: walk the ladder — it presents the rungs, so on its own it is a poster about register · purpose 8/10 · fun 3/10)`

- **does** — One message at three distances — a friend, an adult you know, an adult you don't — with **who you would
  say it to** as the label on each version. Teaches register as a choice with a reason, not as politeness points.
- **markup** — `.chart`: a `<when>` column naming the audience, a `<how it sounds>` column with the version. Two
  `<tr class="note">` rows if a form is wrong for one audience rather than merely odd.
- **fits** — full; three versions of one message do not fit across a half in readable type.
- **can't** — it presents the ladder without walking it; the student still needs a block that makes them pick the
  rung, or this is a poster about register.

### `sceneCast - (best for: who, where, what has happened and what is at stake; letting a dialogue be one scene instead of four items; predicting which language the scene will use · can't: supply any language at all — worth nothing without the scene it sets, and a cast list that only names people predicts nothing · purpose 7/10 · fun 5/10)`

- **does** — Who is talking, where, what has already happened between them, and what is at stake — the facts that
  predict which language the scene will use. This is the block that lets a dialogue or a roleplay be one thing
  instead of four disconnected items.
- **markup** — `.card` with four labelled lines (`who` · `where` · `what just happened` · `what's at stake`). No
  dialogue yet: this block sets the scene, the next one uses it.
- **fits** — third or half; pair with a dialogue at the same width.
- **can't** — no language at all, so it is worth nothing without the scene it sets; and a cast list that only names
  people ("Ana, her brother") predicts nothing — the stakes have to be social.

### `dialogueMoves - (best for: labelling each turn by what it does; showing that a conversation has parts; a phrase set per move · can't: produce a move — the labels are metalanguage, so a production drill must follow · purpose 8/10 · fun 4/10)`

- **does** — A short exchange where each turn is labelled by **what it is doing** (`open` · `hedge` · `push back` ·
  `concede` · `close`), so the student sees that a conversation has parts and that the parts have their own phrases.
- **markup** — `.dialog` for the exchange (speaker, turn), and beside or under each turn its move label. The move
  vocabulary must be named in the lesson before the labels appear.
- **fits** — full; two columns of text plus labels.
- **can't** — labels are metalanguage, not language; a student can label a hedge and still not produce one, so the
  block must be followed by a drill that makes them produce a move.
### `chatSample - (best for: the target form inside ordinary noise; meeting a form in the wild first; real threads with typos, emoji and ignored questions · can't: stay current, and a thread where every line is target language is a dialogue pretending to be a chat · purpose 7/10 · fun 7/10)`

- **does** — A short thread as it actually appears on a screen, with the target language in the middle of ordinary
  noise: a typo, an emoji, two messages in a row, a reply that ignores the question. The student meets the form in
  the wild before they are asked to use it.
- **markup** — `.dialog` with the thread (speaker bubble per line). A `<tr class="note">` or one caption line names
  what to look for — the block must say why it is on the page.
- **fits** — full or half; a thread is narrow, so half-width is natural beside the practice.
- **can't** — real material dates. If the lesson would break when the slang in it ages, use it as one example
  among several, never as the only presentation of a rule; and a thread whose every line is target language is a
  dialogue pretending to be a chat.

### `vocabField - (best for: arranging new words by the job they do in the situation; retrieval by meaning instead of a numbered list; a map a later block can point back to · can't: drill anything, and arbitrary headings make it a list with extra lines · purpose 7/10 · fun 4/10)`

- **does** — The lesson's new words arranged by **the job they do in the situation** (people · things · actions ·
  what you say · how it went), not as a numbered list with translations. A field is easier to use than a list
  because the student retrieves by meaning.
- **markup** — `.chart` with a `<when you need it>` column and the items in the cell; `lang="pt"` glosses only where
  the word is genuinely new. Ten items minimum across the clusters.
- **fits** — full; the columns are the teaching.
- **can't** — no drill, and a field with arbitrary headings is a list with extra lines; every cluster name has to be
  a situation the student will actually be in.

### `storyStrip - (best for: language carried inside a story; scenes that each teach something new; later blocks referring back by scene name · can't: use length as depth — if the scenes stop teaching, the strip is decoration that pushes practice below the fold · purpose 7/10 · fun 7/10)`

- **does** — Three or four short scenes carrying one continuous situation, with the target language embedded in
  each and getting slightly harder. The student learns the language *inside* a story instead of meeting it as
  examples, and later blocks can refer back to the scenes by name.
- **markup** — `.itemrow` of `.panel`s (or `.card`s), each with a scene number, two or three lines, and the target
  form in `<b>`. Sequential, so the order must read left to right and stack on a narrow screen.
- **fits** — full width, panels in an `.itemrow`; two or three per row.
- **can't** — a story is long, and length is not depth: if the scenes do not each teach something the previous one
  did not, it is decoration that pushes the practice below the fold.

### `melodyContour - (best for: putting intonation on a printed page; a drawn line showing where the voice moves; one-word labels for the shape · can't: prove anything on its own, and without the clip it is an abstraction · purpose 7/10 · fun 4/10)`

- **does** — One line of text with a **drawn line over it** showing where the voice rises and falls, and a one-word label
  under the shape (`finished` · `waiting` · `asking` · `doubt`). It is the only way to put intonation on a printed page:
  words describe a movement badly, a line describes it exactly.
- **markup** — `.panel` with an inline `<svg>` path (no image file, no network) and the text beneath it, one glyph per
  syllable so the line's turns line up with the words. One contour per block.
- **fits** — half, beside `contourMatch` or `stressBar`; third when it is only illustrating a single word.
- **can't** — it shows the shape and proves nothing; and a contour over a line the student cannot hear is an abstraction —
  the clip has to be there too, or this is decoration.

### `beatGrid - (best for: even beats with syllables squeezed between them; the thing prose cannot make students believe; one line at a time · can't: stack two lines — they invite the reading that both are equal length, the opposite of the point · purpose 8/10 · fun 3/10)`

- **does** — A sentence laid onto a row of even beats, unstressed syllables squeezed into the cells between them, with the
  stressed syllable marked. Shows the thing students never believe from prose: the beats are evenly spaced and the words
  are not.
- **markup** — `.chart` where each column is one beat and each cell holds what falls in it; stressed cells in `<b>`. Real
  columns, not aligned text, or the evenness is a claim rather than a picture.
- **fits** — full; a beat row that wraps is no longer a beat row.
- **can't** — one line per grid; two lines stacked invite the student to read them as equal length, which is the opposite
  of the point.

### `stanceScale - (best for: strength on one named axis; including the gaps where nothing sits; undoing a synonym assumption · can't: hold words that differ in kind rather than degree — the axis is then a lie and a matrix is the honest shape · purpose 8/10 · fun 3/10)`

- **does** — An axis, and the lesson's words placed on it (`<weak>` — `<neutral>` — `<strong>`), including the gaps where
  nothing sits. Position is the teaching: two words that looked like synonyms are shown to be neighbours or not.
- **markup** — `.chart` row with the ends named and the members placed in order; a cell holding `—` where a slot is empty.
  The empty slots are the useful part and must not be tidied away.
- **fits** — full or half; the axis needs to look continuous, so never a bulleted list.
- **can't** — an axis implies a single dimension; if two of the words differ in kind rather than degree, the axis is a lie
  and a `collocationMatrix` is the honest shape.

### `routineMap - (best for: a routine drawn as a path with branches; both routes and where each ends; the shape a script tests · can't: choose the route for the student — it shows the map, and the judgement belongs to the practice after it · purpose 8/10 · fun 4/10)`

- **does** — A routine drawn as a **path with branches** rather than a list: the moves in order, and at the points where the
  exchange can go two ways, both ways shown and where each ends. This is the shape `placeScript` tests and prose cannot
  hold.
- **markup** — `.chart` or a `.panel` with an inline `<svg>` of boxes and connectors; labels are moves, not lines of
  dialogue. Two branches maximum or the map stops being readable at a half-width.
- **fits** — full; a branch diagram at a third is a scribble.
- **can't** — it is a map of one routine in one setting; and it shows the route, never which route to take — that is the
  judgement the practice block after it has to test.


### `rhymeCoda - (best for: finding which lines rhyme; the same sound under different spellings; pattern-hunting in real text · can't: carry a sound the student cannot yet hear, and never rely on a rhyme that lives in a performance the page does not have · purpose 7/10 · fun 6/10)`

- **does** — Lines from one lyric are on the page; the student marks which two rhyme, then decides what letters spell
  the shared sound. Finding a pattern in real text is a different job from judging a supplied pair, and the second
  step is the one that transfers: same sound, different spelling.
- **markup** — item list: one `.qitem` per slot with the candidate lines in `.qopts` as radios; then a column pair
  asking for the spelling of the rhyme's coda.
- **fits** — full width (lines are long); pair with `barCount` when the lesson is rhythm-led, or `pronLab` when the
  sound needs drilling *after* it has been noticed.
- **vary** — move from "which two rhyme" to "which one does not rhyme although it is spelled the same". That
  reversal is the difficulty; rarer words are only unfairness.
- **can't** — it needs lines whose rhyme is visible in the spelling, so it cannot carry a sound the student cannot
  yet hear, and it must never be used with a lyric whose rhyme depends on a performance the page does not have.

### `songStructure - (best for: naming a lyric's parts by what they do; repetition as a decision rather than filler; the line that comes back changed · can't: be listening — there is no audio, so presenting it as listening is dishonest, and it assumes comprehension rather than teaching words · purpose 6/10 · fun 5/10)`

- **does** — A lyric laid out as text with its parts unlabelled; the student names each part by what it *does*
  (returns, turns, closes) and marks the line that comes back changed. Repetition is taught as a decision rather than
  as filler.
- **markup** — `.panel` per stanza with an `input.gap` for the part name, plus one `.chart` comparing the first and
  last appearance of the repeated line.
- **fits** — full width; pair with `summarySqueeze`, or with `moodTrack` when the lesson is about effect.
- **vary** — first ask only what comes back; then what changed inside it; then why that line and not another. Three
  steps, same artefact.
- **can't** — no audio and no song: this is the shape of a text, and presenting it as listening is dishonest. It also
  cannot teach vocabulary — it assumes the student already understands the lines.

### `barCount - (best for: counting the beats a line lands on; turning rhythm into a number the student can check; where the count breaks · can't: measure anything — a page carries no metronome, so the count is the lesson's judgement, and it says nothing about meaning · purpose 6/10 · fun 3/10)`

- **does** — Count the beats a line actually lands on, and where the count breaks. Rhythm becomes a number the
  student can check, which is what "say it with stress" fails to give them.
- **markup** — column pair: the line left, `input.gap` for the count right; a second row asks which word sits on the
  break.
- **fits** — beat or half; pair with `pulseStress` — count first, then mark the stress.
- **vary** — count beats, then move the count by one word, then keep the count identical and change the meaning. The
  third step is the whole point and it needs no new words.
- **can't** — speech only: a page cannot carry a metronome, so the count is the lesson's judgement and the block must
  not present itself as measuring anything. It teaches nothing about meaning.

### `moodTrack - (best for: justifying a mood in one written line; the vocabulary of how a track sounds; defending a judgement in language · can't: play anything — grading it as listening would be a lie, and it cannot teach genre names it never states · purpose 6/10 · fun 6/10)`

- **does** — A scene, plus three short descriptions of how a track sounds; the student picks the one that fits and
  defends it in one written line. The defence is the work: mood words are easy to guess and hard to justify.
- **markup** — `.qitem` with the scene as `.qstem` and the descriptions as `.opts` radios, then one `input.gap` for
  the "because…" clause.
- **fits** — half or full; pair with a production block (`freeWrite`) so the words are actually used.
- **vary** — narrow the distance between the three descriptions until all are plausible. Never raise the vocabulary.
- **can't** — nothing is played. It is vocabulary and justification, and grading it as a listening task would be a
  lie; it also cannot teach genre names it never states.

### `genreDoc - (best for: functional reading of a real artefact; questions only that table can answer; what it costs, excludes or requires · can't: test production, and an invented artefact teaches a convention that does not exist · purpose 8/10 · fun 4/10)`

- **does** — A real-world artefact rebuilt as a small table — a menu, a ticket, a timetable, a receipt, a form — plus
  questions only it can answer: what it costs, what it excludes, what happens if you are late, what you must bring.
  This is the block for functional reading, and nothing else in this file covers it.
- **markup** — `.chart` for the artefact itself, then a `.qgrid` of `.qitem`s whose stems ask where in it / what it
  means / what you do next.
- **fits** — full width, and it is a spine candidate (`material-led`) rather than a mid-lesson beat.
- **vary** — first a value that is printed on it; then a value that must be inferred (a total, an expiry); then what
  the artefact does *not* say — that third step is where real reading happens.
- **can't** — cannot test production, and the authoring cost is the real one: an invented artefact teaches a
  convention that does not exist. It also needs the lesson to name what the artefact is for, or the questions are
  guesswork.

### `signScan - (best for: what a notice does to you (forbids, permits, warns); naming the word doing the work; a set of notices from one place · can't: ask force and politeness at once — those are two axes and a block that merges them cannot be marked · purpose 8/10 · fun 4/10)`

- **does** — A set of notices from one place, each with a different force; the student matches each to what it does
  to them — forbids, permits, warns, requests — and then names the word doing the work.
- **markup** — column pair: notice left, radios for the force right; then one `input.gap` for the operative word.
- **fits** — half; pair with `registerContrast` when the lesson also has a soft/hard axis.
- **vary** — from "what does it mean" to "which two notices conflict". Conflict is the difficulty, not longer notices.
- **can't** — recognition only, and it must keep two axes apart: how hard a notice is and how polite it is are
  different questions, and a block that asks both at once cannot be marked.

### `formFill - (best for: the conventions of a form; details into the right boxes; a language-light slot in a course of sentences · can't: carry a lesson (near-zero language load), and it is only honest when the lesson stated the convention rather than assuming it · purpose 8/10 · fun 3/10)`

- **does** — The other direction from `genreDoc`: a blank artefact and a set of details to put in the right boxes —
  the shape of a name, an order for a date, a code, a signature. The conventions are the lesson; the language is
  nearly none, which is why it earns a slot in a course that otherwise only practises sentences.
- **markup** — `.chart` with the artefact's labels and an `input.gap` per field, plus one note row naming the
  convention the artefact uses.
- **fits** — half to full; must follow `genreDoc` or `measureLocal`, so the student has read what they now write.
- **vary** — give the details in the boxes' order, then in a different order, then include one detail that belongs in
  no box.
- **can't** — near-zero language load, so it cannot carry a lesson on its own, and it is only honest when the
  convention was stated by the lesson rather than assumed by the author.

### `measureLocal - (best for: date, clock, money, distance and temperature conventions; converting both ways; spotting an ambiguous reading · can't: keep language in front — arithmetic crowds it out past five rows, and it teaches nothing about how anyone speaks · purpose 7/10 · fun 4/10)`

- **does** — The units an artefact uses against the ones the student lives in: order of a date, clock convention,
  money, distance, size, temperature. The student converts both ways and then marks which reading is ambiguous.
- **markup** — column pair: `<as written>` left, `input.gap` right for the converted form; one extra row asking what
  the same notation could also mean.
- **fits** — beat; pair with `genreDoc`, which supplies the artefact that made it matter.
- **vary** — a value to convert; then a value that is ambiguous; then a value where the ambiguity changes the answer.
- **can't** — arithmetic crowds out language quickly — keep it to five rows — and it teaches nothing about how anyone
  actually speaks.

### `tabooMap - (best for: which question is off-limits in a given situation; rewriting one so it becomes askable; pragmatics as a boundary · can't: keep itself safe — given a people instead of a place and a person it writes a stereotype into the page and signs it · purpose 6/10 · fun 5/10)`

- **does** — Given situations the lesson has already written, the student marks which question is off-limits in each
  and rewrites one so it becomes askable. Pragmatics as a boundary rather than a list of polite phrases.
- **markup** — one `.qitem` per situation with the candidate questions as radios, then one `input.gap` for the
  rewrite.
- **fits** — half; it must follow the scene block that made the situation concrete. On its own it is abstract.
- **vary** — from "which is off-limits" to "which is fine here and not there". That second form needs two scenes, not
  stronger wording.
- **can't** — **this is the most dangerous block in the file.** It asserts nothing itself, but if the lesson supplies a
  scene as a national trait instead of a specific situation, the block writes a stereotype into a page and signs it.
  It is only usable when the scene is *a place and a person*, never a people.

### `accentVariant - (best for: tolerance of variation; matching a form to the material it came from; killing the question "which one is correct" · can't: come from one voice — variants must be reproduced in writing, and it must never be phrased as a correctness question · purpose 7/10 · fun 5/10)`

- **does** — The same word or line as it appears in material from different places; the student matches each form to
  the material it came from and marks that no form is an error. What a learner needs is tolerance, and tolerance is
  built by seeing variation as normal.
- **markup** — column pair: form left, the material it belongs to right, as radios; one note row stating that the
  differences are regional and not ranked.
- **fits** — half; it must come *before* `minimalPairs` in a lesson, so the student knows which differences carry
  meaning and which do not.
- **vary** — start with spelling, then sound, then a form that is old rather than regional.
- **can't** — cannot be built from the lesson's own voice: one speaker cannot carry variants, so the lesson must
  reproduce them in writing. And it must never be phrased as "which is correct" — the block exists to kill that
  question, not to ask it.

### `idiomOrigin - (best for: the idiom, its literal reading and its source together; making the literal trap stick; one lexical item at a time · can't: generalise, and the origin is often folk etymology — if the source is not certain it must say "one story is" · purpose 7/10 · fun 7/10)`

- **does** — Three things at once: the idiom, what it literally says, and where it came from. Then one line where the
  literal reading would be wrong. The origin is what makes the literal trap stick, which is why this is not
  `contextFit` with extra words.
- **markup** — `.card` with three labelled lines, then one `input.gap` sentence that has to use the idiom.
- **fits** — beat or third; pair with `contextFit` — origin first, then the bank that files it under what it does.
- **vary** — from producing the idiom to choosing between two that both look plausible.
- **can't** — origins are frequently folk etymology. If the source is not certain the block must say "one story is" —
  an invented origin is worse than none. It is also one lexical item at a time and never generalises.

### `humourFlag - (best for: naming what makes a line funny; what a joke loses in translation; one sharp moment in a lesson · can't: be a rule — funny is not generalisable and explaining a joke can kill it; never grade taste as accuracy · purpose 6/10 · fun 8/10)`

- **does** — A line that is meant to be funny, and the student marks what is doing the work — a pun, an
  understatement, a reversal, a pause — then names what it would lose if translated.
- **markup** — `.qitem` with the line as `.qstem` and the mechanisms as radios, then an `input.gap` for what it loses.
- **fits** — beat; pair with `contrastTable` when two mechanisms have to be told apart.
- **vary** — from naming the mechanism to predicting whether a second line will land.
- **can't** — funny is not a rule, and explaining a joke can kill it, so use it once per lesson at most. It must never
  be graded as though taste were accuracy.

---

# [VISUALS] - IN BLOCK elements for broad re-use  (DRAFTS, not in the menu yet)

**Built and on screen.** All nine are prototyped as real markup on `qa/preview-blocks.html` under their own
`<section class="qa-item" id="item-NAME">`, with the drawing CSS in `qa/preview-visual.css` (`.vz-*`, one file, so
it moves into `style.css` as a piece if a shape is kept). Geometry-checked by `qa/overflow.mjs --shot-url
qa/preview-blocks.html` (no OVERFLOW / ESCAPE), and every figure was inspected in a screenshot. Still drafts —
no A–J scores — but no longer paper.

## Depth: the rule every drawn figure now follows

A flat drawing cannot show *in*. Two panels of a 2-D box — a dot outside, a dot inside — are the same picture with the
dot in a slightly different place, so `spaceScene` was teaching nothing until its figures were redrawn axonometric.
Depth in a flat figure is carried by three cues, in this order of importance: **occlusion** (the near face is painted
over what is inside, so a ball in an open tin loses its bottom while a ball on the closed lid keeps its whole circle —
this is the cue that separates in from on), **the opening** (an ellipse filled dark says you are looking into
something, without a single perspective line), and **a contact shadow** (an ellipse the object sits on, not a circle
floating in space). The primitives are `.lid`, `.side`, `.cav`, `.shadow`, `.screen`; every figure that needs depth
draws its near face last for exactly that reason.

Redrawn on the second pass: `spaceScene` (a tin, closed and open), `massBasket` (books as boxes with top and side
faces, and a broken boundary for the mass), `slotBlocks` (bricks lit on top and dark underneath), `voiceSeesaw` (a beam
and a fulcrum, replacing a row of three boxes that showed no movement at all), and the two flat parallelograms in
`literalSplit` (the ice slab, and the tin of beans, now a tipped cylinder). What stays flat on purpose: `ruleTree`,
`timelineBridge` and `levelGauge` are abstract diagrams where depth would add noise, and `mouthCut` is a sagittal
section, which is a genuinely 2-D object.

## What every draft here must obey

- **A figure is optional.** Nothing here has to become a drawing. When a beat is about *where a sound sits in a word* —
  the stress, the linking, the letter nobody pronounces — the cheapest and clearest visual is a **class on the phrase**,
  and a picture that only repeats the sentence is worse than the sentence. Draw when the point is *where something is* in
  space or *how something moves*, which words cannot place.
- **If the beat is scored, the control saves it.** `.qitem` radios, `input.gap` and an authored `textarea` are what the
  engine records; a slider, a hotspot, a hover-reveal or a `<details>` looks interactive and records nothing. A figure may
  illustrate an item but never stands in for the control — and an item with no figure at all is the normal case.
- **CSS is fair game.** New classes are expected, not an exception: `style.css` for anything a lesson page will use,
  `qa/preview-visual.css` while a shape is still a draft. Phrase-level marks are the main use — see *Inline marks* below.
  One mechanical consequence remains: `qa/overflow.mjs` enumerates the block selectors, so a new **top-level block** class
  has to be added to that list or it is never width-checked. An inline span needs no entry, because it cannot widen a block.
- **Art is CSS, inline SVG, or a local file — never a URL** (Build Constraint 2). "A picture from outside" therefore
  means *downloaded into this repo*; the repo ships `logo.png` at the root (referenced as `../logo.png` from each track
  folder) and `assets/` — the two anatomy plates, provenance in `assets/README.md` — and that folder is the convention a
  new figure follows: `assets/<name>.<ext>`, referenced from a track page as `../assets/<name>.<ext>`.
- **Where the words live is a per-figure choice, not a rule.** An HTML label reflows, wraps at any width and is announced
  by a screen reader; an SVG `<text>` stays at a fixed point in a drawing but cannot wrap and is read out of order. So
  prose-length labels go in HTML beside the figure, a one-word mark that must sit *at* a point (a `gap`, a `1`) may live
  in the drawing, and an inline mark has no split at all — the mark **is** the span on the phrase. Pick per figure.

## Inline marks — the phrase is the figure

Most of what a lesson wants to *show* about pronunciation is a property of one or two letters inside a sentence: which
syllable is loud, where the tune turns, which sound joins the next word, which letter is written and not said. None of
that needs a figure. It needs a `<span>` with a class, because the mark then travels with the text — it fits a full-width
panel and a `.third` column without a width decision, it prints black and white, it cannot overflow, it stays glued to the
word if the sentence is edited, and it is the only form of visual that survives a screen reader with its meaning intact
(the mark is on the word, not beside it).

The vocabulary, all of it `.mk-*` and all of it due in `style.css`:

| class | draws | suits |
|---|---|---|
| `.mk-stress` | a filled dot above the syllable | stress placement, `RE-cord` against `re-CORD` |
| `.mk-rise` / `.mk-fall` | a small ↗ or ↘ at the point of the turn | intonation, statement against question |
| `.mk-link` | a dotted tie between two words | connected speech, `an_apple`, `go_on` |
| `.mk-drop` | a struck letter | a letter written and not said, `Wed(d)nesday`, `(h)our` |
| `.mk-syl` | a thin rule between syllables | syllable counting, `com|pu|ter` |
| `.mk-pair` | a highlight with an underline | the two letters that differ, `s(i)t` / `s(ea)t` |
| `.mk-slow` | opened letter-spacing | a sound held longer, `so(oo)n` |

Two rules, and they are the whole contract:

- **The shape carries the meaning.** Colour only reinforces it. A dot, an arrow, a tie, a strike and a rule are five
  different shapes; a student who prints in grey, or cannot separate red from green, still reads all five.
- **The mark never replaces the control.** A marked sentence is still an item: it takes radios, or a gap in the sentence
  itself (`input.gap` sits inside the phrase, which is the same insight as the mark). Display alone records nothing.

Authoring is one span at the point of the mark, empty where the mark is the whole content:

```html
<p>I <span class="mk-stress">RE</span>cord it, then we
   <span class="mk-pair">s</span>it on the <span class="mk-pair">s</span>eat<span class="mk-rise"></span></p>
```


#### `ruleTree` — the relative-pronoun decision tree (draft)

- **draws** — a root question, three yes/no nodes, leaves that are choices (`who` · `which/that` · `whose` · no pronoun
  at all), and one leaf that is deliberately "either — and here is what changes".
- **built from** — the `routineMap` shape at a larger scale: one `.panel`, one inline `<svg>` of boxes and connectors,
  labels as HTML beside the nodes.
- **ends in** — 3–5 `.qitem`s: a sentence pair as `.qstem`, the leaves as radios. The tree comes first, because FORMAT
  forbids asking for a judgement on an axis the page has not defined.
- **fits** — full only; `routineMap` already records that a branch diagram at a third is a scribble. Three levels max.
- **the risk** — a real `which`/`that` choice is register and rhythm, not logic. Any leaf that pretends it is binary
  teaches a rule that fails in the next paragraph the student reads.

#### `literalSplit` — an idiom as literal scene vs figurative meaning (draft)

- **draws** — one row, two halves: the absurd literal reading on the left, what it actually means plus one real usage on
  the right.
- **built from** — `.itemrow` of two `.panel`s (`beforeAfterStrip` already pairs panels this way) plus one small inline
  `<svg>` on the left; the literal reading is also written as a sentence, so the block still teaches if the drawing is cut.
- **ends in** — one `input.gap` per idiom, used correctly in a stated situation; or radios — which of two situations a
  speaker would say this in.
- **fits** — half each, side by side. Three idioms is one block; five is a catalogue.
- **the risk** — a drawing that has to be explained is a riddle, not a mnemonic, and the pun does not survive translation:
  the picture must carry the absurdity alone. `idiomOrigin` already owns idiom-plus-origin, so this must not repeat it.

#### `timelineBridge` — one axis, three sizes (draft → built in `qa/preview-blocks.html`)

- **draws** — one time axis placed by a single `--now` value, with four kinds of mark: a **span** whose end says what the
  form claims (open arrow = still true now, closed bar = the period is over), a **point** for a single moment, a **wall**
  for a deadline, and a **hatch** for time outside the sentence. Present perfect is the span that reaches `now`; simple
  past is the same span stopping early, with the leftover drawn as a gap to `now`. The gap is the lesson: it is what the
  student hears when they say `I saw it twice` to mean `I've seen it twice`.
- **built from** — pure CSS geometry on inline custom properties (`--now --a --b --at`), no `<svg>`: `.tl` (full, labelled
  rows), `.tl--half`, `.tl--third`, and `.tl--stamp`, which is small enough to sit **inside an answer option**. Nothing in
  the component is a control, so the radio or gap beside it is always what saves.
- **ends in** — two jobs the size decides. Full: radios choosing the form for scenes that differ only in whether the span
  reaches now. Third: the options **are** timelines (`a bar into now` / `a short closed bar` / `one dot`), so the student
  picks a shape and reads its name second — a naming question that cannot be answered by remembering a rule.
- **fits** — all three, and that is the point: full for the comparison, half for a past inside a past (`was cooking` /
  `rang`) or a bar that must reach a deadline wall, third inside the options.
- **the risk** — a timeline separates *where* an event sits and *whether* it reaches now, and nothing else. It cannot show
  register, frequency or modal choice, and it cannot separate two forms that would draw the same shape — when that
  happens the block is wrong and the gap belongs in a sentence.
- **also demonstrated on** — `since` vs `for`, which no translation distinguishes: one word measures a length (a span),
  the other plants a mark (a point).
- **built as a block, then rebuilt as an element** — the usable version is `inlineTimeline` below: the same
  axis with no frame and no heading, so it can sit *under one sentence* inside a block that already exists.
  A timeline that has to be its own block is a poster; a timeline that can be dropped under the sentence it
  explains is a teaching tool. This entry stays for the three-size demonstration.

#### `inlineTimeline` — the same axis as an IN-BLOCK element (built in `qa/preview-blocks.html`)

- **draws** — one horizontal axis where the only two numbers are `--now` (where the speaker stands) and the
  extent of a claim. Words in the sentence are *linked* to marks by a `data-k` letter, drawn twice: as a
  superscript on the word and at the head of its mark, so the pairing survives greyscale, print and a screen
  reader. Colour is the fast path, never the only one.
- **two shapes for the two claims that Portuguese collapses** — `recent`: the bar reaches `now` and its left
  end **dissolves**, because *lately* names no start (`I've been sick lately`); `field`: a hatched band
  **above** the line spanning birth to now, with the event as a dot inside it, because *in my life* is a
  container you are somewhere inside, not a duration (`I've been to Disney World`). Drawn as a field rather
  than a length, it cannot be misread as "still happening", which is the mistake.
- **built from** — `.tlx` + `.tlx-say` + `.tlx-axis`, marks placed by `--a --b --at`; `.tlx-mark`
  (open/closed end, `data-form="recent"` for the fade), `.tlx-band`, `.tlx-dot`, `.tlx-tick`, `.tlx-wall`,
  `.tlx-now`, plus `.tlx-field` / `.tlx-under` because a mark's *meaning* decides whether it sits on, above
  or below the line. No `<svg>`, no script, no frame, no width of its own.
- **ends in** — two interactive modes that both save: `.tlx-pick` (which **word** carries the claim? the
  radio lives inside the word's label, so the answer is the word) and `.tlx-build` (place the timeline
  yourself: three candidate axes, one radio on each shape, so the student decides what the sentence claims
  before they have a name for it). Everything else is display-only and answered by the block's own radios or gaps.
- **fits** — full, half **and third**: it takes the width of whatever host it is dropped into, which is why it
  is an element and not a block. Demonstrated inside a question stem, a dialogue line and a chart note.
- **the risk** — the same limit as last entry, and it is load-bearing: an axis separates *when* and *whether it
  reaches now* and nothing else. Two answers that would place the same shape teach nothing. The guard is a
  sentence in the block itself, not a hope.

#### `spaceScene` — at / on / in as a point, a surface, an enclosure (draft)

- **draws** — three scenes across one row: a dot at a junction (`at`), a marker sitting on a flat surface (`on`), a shape
  inside a closed outline (`in`). Then the motion pair as its own row: ball → box (`to`) beside ball → *inside* box (`into`).
- **built from** — `.itemrow[data-cols="3"]` of three `.itemsize-third` panels, one small inline `<svg>` each; the arrows
  are a `<path>` with a `<marker>`. `.itemsize-third` is already 391px, so three fit a row with no CSS change.
- **ends in** — radios pairing a sentence with the picture that matches it, then one `input.gap` per new scene of the
  same type.
- **fits** — three thirds, then the motion pair as two halves.
- **the risk** — `prepositionScene` covers this in words and warns that a translation table gets `in`/`on` wrong; the drawn
  version must show the concrete scene and never state at/on/in as a universal rule (at the corner / on the corner /
  in the corner all exist).

#### `mouthCut` — a real plate, marked on (draft → built in `qa/preview-blocks.html`)

- **draws** — a vendored public-domain anatomy engraving, not an authored silhouette, with our teaching drawn **on top** in
  the image's own pixel space: numbered pins for the four places that matter (ridge, hard roof, soft roof, throat wall),
  then the same mouth crop twice carrying one instruction each — the back of the tongue travelling up to the soft roof for
  pt-BR `rr`, and a **measurement across the gap** at the tip for English `r`. A mark lands on a feature because it is
  positioned in the file's coordinates, not by eye.
- **built from** — `assets/speech-organs.png` and `assets/speech-organs-mouth.png` (provenance and licence in
  `assets/README.md`), an `<img>` plus an absolutely-positioned `<svg class="ov">` whose `viewBox` equals the file's pixel
  size, and `.vz-pin` markers in HTML percentages so the key is real text. Every stroke is drawn twice — white halo,
  then colour — because a single line on an engraving is a line you have to hunt for.
- **ends in** — radios on *where the sound happens* (four scenes, including the diagnostic `very` → `veddy`) plus two gaps;
  the plate itself is never scored.
- **fits** — full width or two halves; the pins work at any rendered size because the two layers share a box.
- **the risk** — anatomy is not instruction. A correct label still does not tell a student what to do, so the arrow, the
  measurement and the find-it-yourself steps carry the teaching and the plate only supplies the truth of the ground.
- **generalises to** — any photograph or diagram a lesson wants to talk about: a street scene for prepositions, a menu, a
  chart. The primitive is *image + overlay + numbered key*, and it is the cheapest way to get a real-world visual into a
  block without drawing it badly.


#### `tonguePath` — the tongue travelling between two sounds (built)
- **seen in** — `qa/preview-blocks.html` `#item-tonguePath`; the markup there is the reference copy.


- **draws** — a side view of the mouth and one tongue that MOVES: pose A has the tip on the ridge
  behind the upper teeth (the pt-BR tap); pose B has pulled back so the tip touches nothing (the
  English r). A dashed ghost of pose A stays on screen, a dot walks the route, a green double arrow
  opens under the hard roof, and two numbered pins name the only two landmarks that matter. The
  contrast is one instruction — *leave the gap* — so the figure is not teaching two sounds, it is
  teaching the distance between them.
- **built from** — inline `<svg>` (no image, so nothing to fail to load), one `<g class="tp-tongue">`
  that animates as a body, and `transform`/`opacity` only. 44px of travel on a 520px drawing is what
  makes the motion visible; the first build moved 34px and read as static.
- **ends in** — radios ("what does the tip do at 1?") and a gap inside a sentence; the drawing is
  display, the item still saves.
- **fits** — a `.panel` at any width down to a `.third`, because the viewBox scales and no text sits
  inside the drawing except two pins and the word *gap*.
- **the risk** — a schematic is only honest when it is labelled one: this is not a photograph, and
  the drawn ridge is a position, not anatomy. Reduced motion, print and any paused screenshot park
  at pose B with pose A left as the ghost, so the state change survives losing the travel.
- **generalises to** — any pair that differs only in where contact stops: θ/s/t, /d/ vs /ð/, the
  affricate against its fricative; for vowels, the same figure with the tongue silhouette swapped
  and no ridge contact at all.

#### `inlineMarks` — the phrase is the figure (built in `qa/preview-blocks.html`)
- **seen in** — `qa/preview-blocks.html` `#item-inlineMarks`; the markup there is the reference copy.


- **draws** — nothing but the sentence. Seven phrase-level marks, each a `<span>` at the letters that carry the point:
  stress dot, ↗/↘ tune, dotted tie, struck letter, syllable rule, differing-letter highlight, opened spacing. The
  vocabulary table and the two rules are in *Inline marks* above.
- **built from** — `.mk-*` classes, in `qa/preview-visual.css` while a draft and in `style.css` once kept. A mark is
  `::before` / `::after`, `text-decoration` or `text-emphasis` — no container, no `<svg>`, no script, no width of its own,
  and nothing for `qa/overflow.mjs` to enumerate. `.mk-stress` uses `text-emphasis` because the browser centres the dot
  over the syllable itself; the absolutely positioned dot it replaced drifted right of the syllable in the first render,
  and survives only inside `@supports not (text-emphasis-style:dot)`.
- **ends in** — the marked sentence is still an item: `.qitem` radios whose stem carries the marks, or `input.gap` sitting
  inside the phrase. A mark is display and records nothing on its own.
- **fits** — full, half **and third**, because the mark travels with the text instead of taking a column. The only width
  risk is `.mk-slow`'s letter-spacing in a narrow third, and it opens the line rather than the block.
- **the risk** — two marks on one span collide above the text (a stress dot under a `.mk-pair` highlight), and a mark laid
  on text that already reads as UI — a chip, a button label — is read as interface, not as annotation. One mark per span;
  the shape carries the meaning and colour only reinforces it.
- **generalises to** — any point that lives inside a sentence rather than beside it: word stress, contrastive stress,
  intonation, linking, elision, syllable count, the letters that differ in a minimal pair, vowel length.

#### `posMarks` — parts of speech as an underline, generated (built in `qa/preview-blocks.html`)
- **seen in** — `qa/preview-blocks.html` `#item-posMarks`; the markup there is the reference copy.


- **draws** — nothing. The mark is the word's own **underline**, so it costs no layout at all: no column, no baseline
  shift, no chip, no `<svg>`, and it scales from a two-word answer to a forty-word sentence without a width decision.
  Eleven classes — noun, verb, adjective, adverb, determiner, pronoun, preposition, conjunction, auxiliary, wh-word,
  numeral — each an underline **style** plus a colour.
- **two channels, so colour is never the only one** — the line style separates the classes (solid noun, double verb,
  dotted adjective, dashed adverb, wavy auxiliary) and the colour reinforces it. A greyscale print, a projector and a
  colour-blind reader all still read the class from the style alone. This is the same rule the `.mk-*` marks follow.
- **built from** — `node qa/pos.mjs "<sentence>"` tags the sentence and emits the spans, so the marks are generated rather
  than hand-written: that is what makes a long sentence tractable and makes them consistent between lessons. The tagger
  handles the cases that break a naive lookup: `-ed`/`-ing` forms that are adjectives (`a tired student`), a determiner
  against a pronoun (`his` against `she`), an auxiliary against a main verb (`had finished`), and a wh-word starting a
  question against the same word linking a clause. Any word it cannot place is left unmarked and reported, never guessed.
- **ends in** — radios or a gap, as always: *which class is `quietly`*, or *the word `told` takes the ____ underline*. The
  marks are display. A marked stem **is** the question in the cheap form — the student reads the class off the underline
  they can see rather than parsing the sentence cold.
- **fits** — any width, including a `.third`. The only width risk is a superscript letter run in `.pos-labels`, which is
  opt-in for exactly that reason.
- **the risk** — a mark that is always on makes every sentence look annotated, and a student learns to read the underlines
  instead of the words. Use it on the sentence under discussion, not on every sentence in the lesson, and prefer the plain
  line styles so the page does not turn into a colour chart.
- **generalises to** — any label that belongs to a word rather than beside it: tense and aspect on the verb, `a`/`an`/`the`
  on the determiner, countable against mass on the noun, register on any word. The primitive is *class on the span + a
  legend line*, and a new axis is a new class, not a new figure.



#### `massBasket` — countable against mass, as objects you can see (draft)


- **draws** — left: two bounded units with `1` and `2` under them (books). Right: one amorphous block (water, luggage,
  advice) plus three container outlines, each labelled with the quantifier that divides it (`a bottle of`, `a piece of`,
  `a slice of`).
- **built from** — `.itemrow` of two halves; the mass is an inline `<svg>` blob or one CSS shape, the containers are
  outlines. `catchBasket` already exists as the *drill* (drag a word into a pot) — pair it, do not rebuild it.
- **ends in** — radios (countable / not) per word, then one `input.gap` per quantifier. `collocationMatrix` is the stricter
  version when two quantifiers compete for one noun.
- **fits** — half each, side by side; a full-width diagram of two boxes is dead space.
- **the risk** — the picture shows a *tendency*: coffee, paper and experience are both, and `luggage` has no clean
  Portuguese counterpart. The panel shows the item, never the category name as a rule.

#### `slotBlocks` — a clause as colour-coded bricks (draft)

- **draws** — the sentence as bricks, one per function, with a legend line directly above it (`S` subject · `V` verb ·
  `O` object) and the letter inside each brick as well as the colour.
- **built from** — inline `<span>`s with an inline `style` for the fill inside a `.panel` (`.chips` is the wrapping-pill
  shape if the bricks must wrap). Colour comes from the block, so there is no stylesheet edit and no per-track palette drift.
- **ends in** — gaps for the missing brick's word, or radios for which brick is the subject. `formulaFrame` is the same
  shape without colour, so this earns its slot only where the *category* is what the lesson teaches.
- **fits** — half; one clause plus a legend does not fill a full row.
- **the risk** — colour alone fails accessibility and dies in the `@media print` path, which is why every brick carries its
  letter; and the letters must match whatever the lesson's grammar section already used.

#### `voiceSeesaw` — active to passive as positions, not as two sentences (draft)

- **draws** — one bar, two rows. Active row: the actor large on the left, an arrow running to the small object on the right.
  Passive row: the object has moved to the left, a `be + V3` helper has appeared over the verb, and the actor sits at the far
  right behind a translucent `by` screen.
- **built from** — two stacked `.panel`s with the changed element drawn in both rows and a dashed leader between its two
  positions (or one inline `<svg>`). `beforeAfterStrip` is the pair without the movement, so the leader line is the whole
  difference between them.
- **ends in** — `input.gap`s converting a given sentence, plus one item where the passive is the *wrong* choice — that
  judgement is the lesson, not the transformation.
- **fits** — full; three positions plus a helper need the width.
- **the risk** — a seesaw implies the conversion is always available, when the real content is "passive when the actor is
  unknown or unwanted". Without that item the block teaches a transformation nobody asked for.

#### `levelGauge` — a filled gauge in front of an existing scale (draft)

- **draws** — the same axis `scaleAxis` and `stanceScale` already draw, with a filled level or a marker instead of a bare row
  of cells: modal certainty, adverb frequency, or a register gradient from faint disagreement up to open contempt.
- **built from** — an inline `<svg>` track plus one filled bar plus an optional marker; the fill is authored data. A real
  `input type="range"` cannot ship: only radios, `input.gap` and `textarea` save, so a slider would look interactive and score
  nothing.
- **ends in** — radios ("which rung fits this hearer") with the hearer in the `.qstem`; that is `directnessDial`'s shape, so
  the gauge is its display half.
- **fits** — full; a continuum needs the width, as `scaleAxis` already says.
- **the risk** — this is the idea on the list that is mostly already built (`scaleAxis`, `stanceScale`, `scaleChoice`, plus
  `politeLadder` and `directnessDial`), so the honest version is a level field on `scaleAxis`, never a ninth scale block. And
  a disagreement gradient's top rungs are register and risk, not vocabulary: they belong to a track whose persona allows them,
  and the block has to show *who you may say it to*, not how far up the scale it sits.

## Outside art — what exists, and the three conditions on it

- **Vendored, never hotlinked.** Build Constraint 2 forbids a run-time fetch, so an outside picture means download the file
  into this repo. `assets/` now holds the two anatomy plates, with provenance and licence in `assets/README.md`; the
  convention they set is `assets/<name>.<ext>`, referenced from a track page as `../assets/<name>.<ext>`, with a caption
  carrying the source on the page that uses it.
- **The licence travels with the file.** Checked against the Wikimedia Commons API while drafting: `File:Adultvocaltract.jpeg`
  — mid-sagittal section with the tongue labelled `T`, CC BY-SA 4.0, attribution "Cengst"; `File:Tract.gif` — constriction
  areas of the vocal tract, CC BY-SA 3.0, attribution "Megsmith". Both require attribution *and* a licence link on the page,
  and share-alike means a recoloured or highlighted derivative must be released under the same licence — which is exactly
  what `mouthCut` wants to do to it. An old public-domain plate of the same region avoids the share-alike at the cost of an
  anatomically dated drawing.
- **A real anatomical plate teaches anatomy, not articulation.** Nothing licensed shows where *this* student's tongue must
  go; the arrow, the highlighted path and the Portuguese instruction line do that. So draw the schematic and use outside art
  as the accuracy reference — or as one optional full-width plate if the schematic proves unreadable at full width.

