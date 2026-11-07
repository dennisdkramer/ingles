# 0. CONTENT_EXAMPLES — the vehicle menu

This is a menu of **mechanisms** and skins that drives content already authored in the page's HTML. 
No entry carries lesson text, no entry is a script to copy.
Where a shape is needed it is written as `<placeholder>`.

## How to use this file

- **A menu, not a checklist.** Nothing here is required in any lesson, nor required to be in any specific section/order when used. Reaching for a vehicle because it is listed — rather than because that beat needs it — is a defect.
- **Choose per beat, and be able to say why not another.** The recorded justification (`PEDAGOGY-MAP.md`) is only honest if this file says what each vehicle *cannot* do. That is the `can't` field.
- **The content in the page.** Games drive authored `.qitem`s (stem + optional `.listen` + radios), `input.gap`, or a textarea — nothing else. Whatever the engine animates is presentation; the saved answer is always one of those controls. If a mechanism cannot end in one, it is not a vehicle, it is a decoration. 
- **The tone of a lesson comes from the lesson's copy, never from here.** Every game below is track-neutral, *skins* may be per-track data layered on top — never baked into the mechanism.


## READ HEADINGS

### The Headline Key - (A3, B3, C1, D1, E0, F1, G0, H1, I1, J1)
**Step 1 — browse the headings, nothing else.** Every `###` heading is self-contained and contains a score on the following axes:

A) Presentational Utility "can cleanly display or utilize its contents for teaching".
B) Ambiguity -> Clarity "Student will understand how the information is presented or what they are supposed to do immediately" .
C) Utility for challenging and advanced Student .
D) Fun/Engaging .
E) Multi-Axis Comparative Utility - eg. contrast 3 tenses/parts of speech/verb-preposition pairs.
F) Utility for presenting/training Writing/Reading 
G) Utility for presenting/training Speech/Listening
 - To what degree its utility depends on or is limited by the student's:
H) Linguistic Level.
I) General Intellect.
J) Socio-Cultural/Life experiences.

Each score is **0–3**, the same scale this file already uses for `tests`, `fun` and `reuse`. On **A–G a higher number
is better**; on **H–J a higher number means the vehicle's utility is *more* limited by** that trait — `H0` is
level-proof, `H3` needs a prepared class — so H–J are read the opposite way round from the others.
```
Select-String -Path CONTENT_EXAMPLES.md -Pattern '^### '
```
That is the whole selection surface, and the scores are the whole of it. **Pick by the axes, never by the body:** a
beat that has to contrast three forms is an `E` beat, a beat that has to be heard is a `G` beat, a class whose level
you cannot rely on wants `H` low, a beat that must end in writing wants `F` high. `fits` (what kind of language the
block is for) and the width it needs are settled in step 2, from the body — so shortlist from the numbers, then open
the one entry you picked.

**Step 2 — read only the entry you chose.** Read that one `###` heading's line range, ending at the next `###`
(or the next `---`), and read it against the axis that shortlisted it. That body is the implementation contract:
`fits` (its width, and where in the page it sits — the `size` question lives here now, not in the heading),
`does`, `markup`/`skins` (which authoring markup it drives), `art`, `vary`, `can't`, `needs`. Nothing else in the
file is opened.



## The key

Headings carry only the A–J scores, so none of the fields below is read off a heading: where a field is not stated
outright in the entry body (`needs`, `fits`), the entry's `does` and `can't` lines are the record of it.

| `evidence` | which persisted control carries the mark: `radio` · `gap` · `textarea` · `audio` · `none` |
| `tests` | 0 exposure · 1 recognise · 2 controlled produce · 3 free produce |
| `fun` | 0–3, engagement |
| `reuse` | 0–3, how many lessons it survives before going stale |
| `needs` | `none` (ships as markup today) or the engine it requires |
| `count` | **CountUp** — the score climbs from 0 with each correct answer, which is the default · **CountDown** —the score starts full and falls per error.
| `resource` | `<type>` - the shape spends a limited resource (lives, hearts, guesses),
| `<min-max>` | defines the minimum and/or maximum amount of questions or options the shape requires - `""` means no requirement for that particular parameter. 




## Constraints on every game (technical, not aesthetic)

There is **no house style**. Look, palette, motion and mood are chosen per game and per track — a kids page may
be loud and a business page sober, and neither is more correct. Only these hold, because they are mechanical:

1. **The page still works if the engine never loads.** The authored `.qitem`s are ordinary radios: they render,
   save and print with no JS. That fallback is not optional.
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

---

# 1. Games — arcade, reflex, puzzle, and logic

Interactive activities. Each one drives ordinary `.qitem`s, so the answer that saves is the same radio a plain page would have.

### `skeetRange - (A2, B2, C1, D3, E1, F1, G1, H3, I1, J1)`

- **does** — One flying target per option. Player aims with the cursor and takes **one shot**; a hit scores, a
  miss is spent. No spray, no endless retry — the constraint is what makes it feel like skill.
- **skins** — `.game > .game-list` of `.qitem`; the stem is the prompt line, the options are the targets — one
  disc each, so the item's own options (two to four) decide how many fly.
- **art** — one flat ring per option, the word on a plaque over the disc; a thin crosshair that is the cursor; a
  single puff on impact. Every disc takes the SAME line — one arc, one speed, no wobble, no sine wave — and the
  lanes are spread over the full height of the range, so the four words read as one rack, not a scatter.
- **pace** — the range carries a clock 30% slower than the block's own: `data-time` is stretched by 1.3 (the
  lever is `PLUGINS.skeetRange.timeScale`, applied by the runner), so the discs and the timer slow together and a
  word can be read before it has to be shot at. A block therefore writes the deadline it *wants minus 30%* — or
  simply leaves the default and takes the slower range as it comes.
- **can't** — no production, no spelling; one shot per item means a careless click can hide what the student knew.
- **needs** — nothing; `engine4.js` ships it.

### `whackMole - (A2, B2, C1, D3, E2, F1, G1, H3, I1, J1)`

- **does** — One drawn mole per option surfaces from a hole, stamped in stagger; the player hits the one that
  fits before the runner's timer bar empties. The rest duck away the instant an answer lands.
- **skins** — same `.qitem` list; the prompt sits on the HUD line, options become the moles' labels.
- **authoring the stem** — the prompt is the thing to FIND, so it is written as that thing and nothing more:
  `past`, `a place you sleep`, `sorry, say that again?` — never `which one is past`, because the moles are
  already the candidates and the sentence only restates the game.
- **art** — inline SVG mole + radial-gradient hole with a dirt rim, rise via `translateY`, reduced-motion path.
- **can't** — recognition only; speed pressure makes it a poor fit for anything needing reflection.
- **needs** — nothing; `engine4.js` ships it.


### `catchBasket - (A3, B3, C2, D3, E3, F1, G0, H2, I1, J1)`

- **does** — One word is shown at a time; the player **drags it into the pot that fits** (or taps a pot, or presses
  `1`/`2`). Dropping outside springs the word back, so a slipped finger costs time, not the item. A right drop tips
  water over that pot and **grows a flower in it**; the flowers stay for the rest of the run, one per right answer,
  so the block becomes a garden the class has grown rather than a score.
- **teaches** — sorting a form into a category: past vs now, one ending vs another, which pattern a word belongs
  to. The decision is made in one gesture, so hesitation is visible.
- **skins** — one word per item (`.qstem`), one pot per option (the radio labels); a correct drop checks that
  option's radio. The word card IS the prompt, so the stage does not print the same words again on the HUD line.
- **art** — inline SVG terracotta pot, water drops over the rim on a right drop, a flower grows out of the soil and
  stays there (six to a pot); the word lifts and tilts while held, a wrong drop shakes.
- **can't** — only two to four pots fit a row; fine distinctions don't fit, and a seventh flower would swamp the pot.

### `stackDrop - (A2, B2, C1, D3, E1, F1, G0, H2, I1, J1)`

- **does** — The question arrives as the next block of a tower and the player **puts the right answer on top of it**
  by picking it: the block flies up, lands and **stays in the tower**. A wrong answer tumbles off and the question
  stays exactly where it was, so the tower never loses what was earned and its height IS the progress. The climber
  climbs the tower itself to the chest at the top.
- **teaches** — accumulate-and-complete: the reward is the finished tower, so a long drill has a shape and an end.
  Every answer placed is one item answered, so the tower is the progress bar.
- **skins** — one `.qitem` per block; the question block is the stem, the buttons are the options. Six to ten items
  makes a climb: the tower is half the stage's width and each block's HEIGHT comes from the run's own length, so the
  whole stack stands inside the stage up to ten blocks (the most that keeps a word readable) and a longer run keeps
  that height and slides. The question block IS the prompt, so it is not printed a second time on the HUD line.
- **art** — flat blocks with hard edges, two ladder rails and a rung per answer, a drawn climber, a chest that
  lights up at the top. The tower slides down to keep the newest block in view once it outgrows the stage.
- **can't** — one item per block, so a two-item block has nowhere to climb; timing dominates, so keep the language
  load to a phrase per block.
- **needs** — nothing; `engine4.js` ships it.

### `flapGate - (A2, B1, C1, D3, E1, F1, G0, H3, I1, J1)`

- **does** — One-button flight. The bird holds its place and the wall scrolls at it; the wall has **real gaps**, one
  per option, and the gap the bird is inside when the wall arrives is the answer. A click on a gap answers at once
  (the honest "I know it" path, and the only one a keyboard or reduced-motion student has); a click anywhere else
  flaps.
- **the wall is the stake** — a right gap is a point and the flight carries on through it into the next question. A
  wrong word costs nothing: the flight continues. Flying into the **brick** costs one of three hearts *and the run* —
  the block starts again at its first question, in the same order, with what was already answered left as it was
  written. A restart is a second attempt, so the score a finished block shows is the **best attempt**, not the last.
- **skins** — gaps are options; the prompt is fixed on the HUD.
- **art** — a drawn bird that flaps its wings on every lift, including the one automatic flap as the round opens, so
  it is never falling before the student has touched anything; a brick wall with the words sitting in its gaps; sky
  as a flat fill. Fall is half what it was, lift unchanged.
- **can't** — recognition at speed only, and it is the most expensive of the arcade set.
- **needs** — shared runner + gravity loop.

### `wordleBoard - (A3, B3, C2, D3, E1, F2, G0, H3, I2, J1)`

- **does** — The student guesses the word and presses Enter; the board marks right letter/right place and right
  letter/wrong place. Five rows and the run is over. Hangman is the same engine with a different face (a revealed
  blank row instead of coloured tiles).
- **skins** — one target word per item, typed into a `gap` at the end, so the evidence is spelling the student
  produced rather than letters guessed. The stem is the clue, so it is not printed a second time on the HUD line.
- **art** — the stage reads left to right: the **clue on the left**, the tile grid and the box you type into as the
  centre pair, and a **message on the right** ("too many letters", "too few letters") that fades in over .5s, holds
  2s and fades out over .5s. The three are centred vertically and the board never grows, so nothing moves when a
  word lands — a wrong length costs a message, not a row.
- **can't** — only words of one fixed length; nothing for phrases, meaning or listening.
- **needs** — nothing; `engine4.js` ships it.

### `mineGrid - (A2, B2, C1, D3, E1, F1, G0, H1, I1, J1)`

- **does** — The options are planted as **pairs of batwing saloon doors along a street**, the word hung over the top
  where it can be read. Pick a door and **the figure walks to it**, which makes the choice a character's risk rather
  than a bare click; the door then swings open, because what is behind it IS the answer. **Right:** he goes in, a glass
  clinks on the bar, the street fades out and the next question fades in on an empty street. **Wrong:** a snake comes
  out of the dark and bites him — one of three lives gone, and his drawing changes as they go. Three bites end the run.
- **teaches** — commitment under stakes. Because he only gets three mistakes, a guess has a price, so the student
  reads before moving. Every wrong pick leaves its radio blank, so the blanks are the teacher's evidence.
- **skins** — four options is what the street holds: one door per option. The lives belong to the RUN, not to the item,
  so they are set on the way in and never between items — a life that came back with the next question would mean a
  miss cost nothing. The count is the HUD's, and the stage draws no second copy of it.
- **marking** — exact: on a right answer only the door he opened turns green; on a wrong one that door turns red with
  the snake in it and the right door is outlined, and nothing else on the street reacts.
- **art** — a street and a boardwalk, a signed doorframe per word with a drawn batwing door that swings on its hinge,
  a drawn snake, and a figure with hurt and down states.
- **can't** — one answer per door; a lesson that writes two or three options leaves the street short.

### `crosswordBoard - (A3, B3, C3, D2, E2, F2, G0, H3, I2, J1)`

- **does** — A **real generated crossword**. Each `.qitem` carries `data-answer` (the word) and its `.qstem` is the
  clue. The engine lays the whole set out at once: the first word across, every later word placed so it **crosses**
  an existing letter, anything that cannot cross dropped into its own row below. A shared letter is one cell, so
  typing it once fills both words and **solves both items** — that is the point of a crossword and why this is a
  board, not a drill. A full word typed wrongly is **answered**: it clears, shakes, and its item goes down as a
  miss with its radio left blank — one chance per word, because this board keeps no lives to pay for a second
  one. Its cells stay typeable, so a crossing word can still use those letters.
- **art** — the site's own grid: a flat block per gap, a small number in the corner of each word's first cell.
  The cells are sized to **fill the stage** (10px of margin all round, height and width each get a say), and the
  clue for the word you are typing sits in its own panel **beside the grid** — one clue on the stage, never the
  same clue twice.
- **can't** — the set must be spellable and the words short, or the grid gets fat; words with no shared letter can
  only sit in their own rows, so a lesson whose vocabulary shares nothing is a bad fit.
- **needs** — nothing; `engine4.js` ships it. Authoring: `data-answer` on each `.qitem`, clue in `.qstem`.

### `echoPads - (A3, B2, C2, D3, E1, F2, G1, H2, I1, J1)`

- **does** — Builds **one sentence, word by word**. `data-first` is the opening the student is given ("Yesterday
  I"); every `.qitem` after it is the next word of that sentence, and its options are the word that fits after
  what is already on the board plus **three that are close but do not fit the grammar** of the words placed. A
  right pad puts the word in the sentence, answers that item and moves on. A wrong pad costs one point and does
  **not** move on: a sentence cannot continue past a word that does not fit, so the student tries that same word
  again. At zero points the run is over.
- **teaches** — word order and collocation under a constraint the student can see: the sentence on the stage IS
  the question, so every choice is judged against the words already placed rather than against a rule recalled.
- **skins** — one `.qitem` per word of the sentence, `data-a` the word that fits, three near misses as the other
  pads. `data-first` the given opening, `data-lives` the countdown of points (default 10) — the HUD pair counts
  `left/start` down, one point per wrong pad. `data-time` does not apply: a board you fill at your own pace. The
  sentence and the hint line are the prompt, so nothing is printed a second time on the HUD line.
- **art** — a paper sentence strip that fills in as words land: the given words in a dashed tan chip, the placed
  words in green, a caret holding the next place; four word pads on the neon arcade scene; "Say the sentence"
  reads out the sentence as it stands.
- **can't** — one sentence per block and one word per item, so the wording has to be planned end to end; nothing
  here trains spelling or listening.
- **guardrail** — the sentence comes FIRST and the pads are generated second, one word at a time, LEFT TO
  RIGHT: for each `.qitem`, read the words already on the board (`data-first` plus every item before it), then
  write the one word that fits and check the three distractors against that same reading. A distractor that
  could follow what is placed is a broken item — the student is reading the sentence, not recalling a rule, so
  the pad that also fits is the pad that teaches nothing and scores a coin flip. Generating the three options
  before the phrase is written, or from the whole sentence at once, is what produces them.
- **needs** — nothing; `engine4.js` ships it (the voice is the built-in speech).

### `bingoCard - (A3, B2, C1, D3, E1, F0, G3, H3, I1, J1)`

- **does** — A 3×3 card is built from the item's own options **plus decoys drawn from the rest of the block**, so the
  card is never trivially small. The card arrives shut behind a velvet curtain and the voice **calls the correct
  answer's word exactly once** (the clip when the item has one, else the right option's text — never the question).
  There is no replay button: paying attention to the one chance IS the activity. A **3·2·1 countdown** in its own
  card at the grid's left edge runs while the caller speaks; at zero the curtain rises, and a **5·4·3·2·1 countdown**
  in a card at the right edge starts. Stamp the tile you heard and the item is answered. Let the second countdown
  reach zero and the curtain **falls on the item**: it is marked wrong and the point it was worth is gone.
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

### `ladderRun - (A2, B3, C2, D3, E1, F1, G1, H2, I1, J1)`

- **does** — A full-height rail with a climber and a chest at the top. One rung per right answer, a **safe rung every
  five**, and the height is **heard** as well as seen (a rising motif as you climb). A wrong answer slides the climber
  back to the last safe rung — so what was safely earned is kept, which is what makes a ladder a ladder and not a
  list. Longer lists make a taller climb, so the same block scales from a five-item drill to a full quiz.
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

### `bossRaid - (A2, B2, C1, D3, E1, F1, G0, H1, I1, J1)`

- **does** — The student **picks a fighter on the intro card** — sword, wizard or archer — and the choice is not
  decoration: it decides HOW the right answer lands. The swordsman steps in and cuts, the wizard throws a fireball that
  bursts on the boss, the archer's arrow flies straight and fast. So the hit is thrown by the character the student
  made, which is the whole appeal of a fight game.
- **the boss answers back** — a wrong answer is the boss's turn, and it does not repeat itself: it takes turns between
  a **bite** (it lunges at the fighter) and **acid** (it spits a drop that flies across the arena and lands on him).
  Three hits taken and the fighter goes down, so a long drill has an ending that belongs to the answers, not a timer.
- **teaches** — a long drill with a visible cost. The HP bar is the boss's health and it only moves when answers are
  right; the fighter's three hits are the only thing that shortens the run.
- **skins** — the `.qitem` list is the attack sequence; the options are the answer buttons. Nothing about the fighter
  is authored — the game offers its own three — so a lesson block is just a list of items.
- **art** — a torch-lit arena, three drawn fighters with their own weapons, a fireball, an arrow and an acid drop as
  separate sprites, a drawn boss with bite/hurt states, a slash arc, an HP bar.
- **can't** — ritual stakes can mask weak items; every item must still be defensible on its own.

---

# 2. Blocks — teaching shapes

	- Nearly all are markup-only (**cost A**)  No example wording appears here on purpose — the lesson supplies it.

## Rules:

1. **One control per item.** A drill that asks for a gap *and* a radio in the same item cannot be scored or
   printed, and the student answers neither carefully.
2. **The instruction is part of the block.** A drill with no verb ("Sentence surgery") is a riddle; the first line
   says what the student's hands do.

### `twoWordVerb - (A3, B3, C2, D1, E2, F1, G0, H2, I1, J1)`

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

### `contextFit - (A2, B2, C2, D1, E2, F1, G2, H2, I1, J2)`

- **does** — Whole fixed expressions taught as one unit with audio, then used: the student writes the chunk that fits
  a stated situation into the gap, or matches the chunk to what it answers.
- **markup** — column pair for the bank itself (chunk ↔ what it does), then an item list of situations with one
  `input.gap` each. The `.listen` chip carries the chunk, so the student hears it as one piece.
- **fits** — full only when its content fills the row; the bank plus its situations is usually a HALF, and it collapses to half width on width fill alone (its note and lead-in text do not count toward that fill). Best beside a `chatSample` that shows the chunks in their natural habitat.
- **vary** — start with the chunk fully given and gap only the situation; then invert. The real lever is *which*
  chunks are in the bank: same function, different politeness, is harder than more chunks of the same politeness.
- **can't** — a chunk whose parts can be swapped is not a chunk, so check it is said as one piece; and it never
  teaches the grammar inside it — that is the point, and also the limit.

### `sentenceSurgery - (A3, B3, C2, D3, E1, F2, G0, H2, I1, J1)`

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

### `registerContrast - (A3, B2, C2, D1, E3, F1, G0, H2, I1, J2)`

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

### `questionBuilding - (A2, B2, C2, D1, E1, F2, G1, H2, I1, J1)`

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

### `repairMoves - (A2, B2, C2, D1, E1, F1, G2, H2, I1, J2)`

- **does** — The fixed moves for when communication breaks: ask for a repeat, check a guess, restate.
- **markup** — item list: a short exchange with the break marked, then one `input.gap` holding the move that repairs
  it. The `.listen` chip carries the move so the student hears the tone, not just the words.
- **fits** — half, beside a `dialogueMoves` block — this is the emergency exit of the same conversation.
- **vary** — the move alone, then the move inside a longer exchange. What actually makes it harder is *whose* fault
  the break is: repairing your own sentence is a different move from rescuing someone else's.
- **can't** — teaches the move, not the conversation; needs a scene to mean anything, and a teacher to judge whether
  the student could actually say it under pressure.

### `pronLab - (A3, B2, C2, D1, E2, F1, G3, H3, I1, J1)`

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

### `minimalPairs - (A2, B3, C1, D2, E2, F0, G3, H3, I1, J1)`

- **does** — The target word beside its near-neighbours, each with audio, so the ear separates one phoneme by its
  minimal difference. Also covers homophones from a flap T or a silent letter.
- **markup** — item list of radios where the `.qstem` is silence and the answers are the words: the clip *is* the
  question, so `data-say` on the chip supplies the key and no answer is written into the page.
- **fits** — third or half; it is a beat, and it should sit immediately under whatever displays the pair.
- **vary** — two words → three → the pair inside a phrase at speed. Three options is the minimum for anything that
  matters, because two is a coin flip.
- **can't** — recognition only; it never shows the student can say it, and it deliberately uses words the student
  already knows, so it cannot carry new vocabulary.

### `listenIdentify - (A1, B3, C1, D1, E1, F0, G3, H2, I1, J1)`

- **does** — A binary or ternary recognition item: which sound, which ending, which stress pattern was heard.
- **markup** — item list of radios with the `.listen` chip doing the asking; the prompt only says what to listen for,
  because a prompt containing the answer makes the clip decoration.
- **fits** — third, or half. It is the cheapest listening block there is, which is also why two of them in a row is
  visible laziness.
- **vary** — three options, then the same three inside a phrase; then the same phrase at natural speed. More options
  beyond three adds guessing, not difficulty.
- **can't** — two options invites a coin flip, so three minimum for anything that matters; and it tells you the
  student heard *a difference*, not that they know what either word means.

### `errorCorrection - (A2, B3, C1, D1, E2, F1, G0, H2, I1, J1)`

- **does** — Pick the correct item among distractors that each encode the classic first-language error, at whatever
  granularity fits: one word or a whole sentence.
- **markup** — item list of radios. Every wrong option is a *real* error a Portuguese speaker makes, so the wrong
  answers are informative rather than random.
- **fits** — third, or half. Cheapest form check there is; it belongs right after the rule is displayed.
- **vary** — one distractor at a time before four; then the same error inside a longer sentence where the trigger is
  further away. Adding distractors that are merely odd (not wrong) is what makes it a trick question.
- **can't** — distractors must be real errors, or it becomes a spot-the-typo; and it never shows the student can
  *produce* the form, only refuse the wrong one — pair it with a gap drill in the same lesson.

### `syllableLab - (A3, B2, C2, D1, E2, F1, G2, H2, I1, J0)`

- **does** — The three pillars of rhythm: count the beats, place the stress, find the schwa.
- **markup** — three short item lists of `input.gap`s, one per pillar, so a wrong answer says *which* pillar failed.
  A single gap per word that asks for all three at once teaches nothing.
- **fits** — half. It is a beat, and it should sit under the `stressBar` or `soundGrid` that shows the pattern.
- **vary** — count only → stress only → schwa only → all three on a new word. Mixing pillars inside one item is how
  this becomes a memory game.
- **can't** — nothing about connected speech — counting beats tells you nothing about what happens when two words
  meet; pair it with `connectedFlow` if rhythm is the point.

### `errorHunt - (A3, B3, C3, D2, E1, F3, G0, H3, I2, J1)`

- **does** — A short text with a stated number of errors; the student types the corrections below. Saying how many
  there are is what makes it a task rather than a browse.
- **markup** — the text as prose, then a short item list of `input.gap`s — one per error, in no required order — with
  the stated count in the instruction line.
- **fits** — full width; it is a section, and it works best immediately after `ruleCard` has stated the rule it hunts.
- **vary** — the count is the lever: an unstated count is a different, much harder task. Then make the errors the ones
  the rule predicts, rather than the ones that merely look odd.
- **can't** — needs a self-contained text, so it is not a beat-sized vehicle; and a student who finds all the errors may
  still not know why they were errors — the debrief is the teacher's.

### `oddOneOut - (A2, B2, C3, D2, E3, F2, G0, H2, I2, J2)`

- **does** — One item doesn't belong; the student picks it **and says why** in a line.
- **markup** — item list of radios for the pick, plus **one block-level `<textarea>`** for the reasons. The textarea is
  deliberately shared, not per item: it is unmarked evidence, and a per-item textarea would break the one-control rule.
- **fits** — third or half; it opens a section well because the reason becomes the next block's subject.
- **vary** — the odd one out by meaning, then by form, then by usage. Four items → five. What genuinely makes it harder
  is when the odd item is odd for a *subtler* reason, not when the vocabulary is rarer.
- **can't** — if two items can be defended, the item is broken, so the justification is mandatory and the teacher reads
  it; and it never produces the target form.

### `spotTheDiff - (A3, B3, C2, D2, E2, F3, G0, H3, I2, J1)`

- **does** — Two versions of the same short text, chat or notice; find and state the differences.
- **markup** — worked pair: `.itemrow` of two `.panel`s side by side, then one gap per stated difference number. The two
  panels must be the same length, or the layout gives away where the changes are.
- **fits** — full width — two texts side by side is the whole mechanism, so it cannot be squeezed into a third.
- **vary** — the count stated (like `errorHunt`), then unstated; then a version where the difference is one of *tone*
  rather than of content, which is the interesting one.
- **can't** — the differences must be meaningful, not punctuation; and it does not say which version is right — that is
  the next block's job.

### `predictReveal - (A2, B3, C3, D3, E1, F3, G0, H2, I2, J2)`

- **does** — The scene stops mid-way; the student writes what happens next, then reveals the real ending.
- **markup** — open response: the scene as prose, one `<textarea>`, then the real ending inside `<details>` so the page
  hides it until the student has committed.
- **fits** — half or full. It is the cheapest way to make a student care about the next block's vocabulary.
- **vary** — a stated number of sentences, then free length; then give the ending first and ask for the beginning. The
  lever is how much of the situation is withheld, not the length of the writing.
- **can't** — no marking; it produces investment, not accuracy, so it must be followed by a block that does ask for a
  right answer — otherwise the page has no evidence at all.

### `miniProject - (A2, B2, C3, D3, E1, F3, G0, H3, I2, J3)`

- **does** — Build something in English: a plan, a poster, a set of rules, an order. Word bank plus textarea.
- **markup** — open response plus a `.panel` word bank. The brief is a **checklist**, not a paragraph: five things the
  thing must contain, so "done" is visible.
- **fits** — full width, and it wants the page's spine (section 8) built around it — a project in the middle of a quiz
  strand is a detour.
- **vary** — fewer required elements, then more; then a length limit, which is the harder constraint. Never raise the
  vocabulary as the difficulty lever — the point is producing with words they have.
- **can't** — free production only, so nothing here trains a form under control and it needs a drill beside it; and it
  cannot be auto-marked — the checklist is what the teacher marks against.

### `cheatSheet - (A1, B2, C2, D1, E1, F3, G0, H2, I2, J1)`

- **does** — The student writes their own summary of what they just learned, in their own words.
- **markup** — open response with **one** `<textarea>` and a short prompt naming the two or three things to include.
  A blank box labelled "summary" produces a blank box.
- **fits** — full width, at the end of the teaching run and *before* the quiz — a summary written after the test is a
  rewrite of the test.
- **vary** — "one line" → "three lines" → "as if explaining to a friend who missed it". The addressee is the lever; the
  word count is not.
- **can't** — evidence of effort, not of accuracy: a confident wrong summary looks identical to a confident right one,
  so the teacher must read it.

### `connectedFlow - (A2, B2, C2, D1, E2, F1, G3, H3, I1, J1)`

- **does** — Where two words meet: a consonant glides into a vowel (`<word> + <word>` → `/j/`), a sound is inserted
  (`<word> + <word>` → `/w/`), or one is dropped. The student marks the join, then hears it.
- **markup** — column pair showing the pair of words and what happens between them, then an item list of `input.gap`s
  asking for the join, and a `.listen` chip for the proof.
- **fits** — half. A written pair the ear hears as one needs only a narrow column to show the join.
- **vary** — one join per item before two; then the join inside a full sentence. The lever is how far apart the two
  words are printed, since distance is what the eye has to unlearn.
- **can't** — the ear only, and it is invisible to a written test: a student who marks every join can still say none of
  them. It also needs real recorded joins, never a guess about how a sentence "should" flow.

### `stressShift - (A3, B2, C3, D1, E3, F1, G3, H3, I1, J0)`

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

### `emphaticBeat - (A2, B2, C3, D2, E2, F1, G2, H3, I1, J1)`

- **does** — The same sentence stressed three ways, three meanings. The student is given the *intended meaning* and
  marks which word has to carry the beat.
- **markup** — item list: the meaning in the `.qstem`, the sentence printed once, and the student writes the stressed
  word into the gap. Radios per word would be tidier but would give away that exactly one word is marked.
- **fits** — half. It belongs beside `audienceRow` or `dialogueMoves`, where tone already matters.
- **vary** — three candidate words → five → a two-clause sentence where the beat can fall in either clause. The lever
  is the number of *plausible* hosts, not the length of the sentence.
- **can't** — only produces a marked word, never the sound; and it is genuinely hard for students whose first language
  marks emphasis with word order instead — that difficulty is the lesson, not a defect.

### `falseFix - (A2, B3, C3, D2, E1, F2, G0, H2, I1, J1)`

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

### `dictogloss - (A2, B2, C3, D2, E1, F3, G3, H3, I2, J1)`

- **does** — A short passage is heard twice at natural speed, then the student reconstructs it from memory in writing,
  then compares against the original. The gap between what they wrote and what was said is the whole lesson.
- **markup** — spoken pattern plus one `<textarea>`; the original sits inside `<details>` so it is only available after
  the attempt. Two `.listen` chips, marked as first and second hearing.
- **fits** — full width. It is the heaviest block in this section and it earns its space once per few lessons.
- **vary** — three sentences → five, and a familiar topic → a new one. Speed stays natural throughout: slowing the clip
  turns it into transcription and tests the wrong thing.
- **can't** — no key, so it needs a teacher; and it measures everything at once (listening, memory, spelling, grammar),
  which makes it a good diagnostic and a poor test.

### `wordFamily - (A3, B2, C2, D1, E3, F1, G0, H2, I1, J1)`

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

### `collocationGap - (A2, B2, C2, D1, E2, F1, G0, H2, I1, J2)`

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

### `scaleChoice - (A3, B2, C2, D1, E3, F1, G0, H2, I1, J1)`

- **does** — A meaning is given and the student picks which of the lesson's words sits at that point on a strength scale
  (`<weak>` … `<strong>`). Forces the realisation that words of a set are not interchangeable but ordered.
- **markup** — item list: the stated intensity in the `.qstem`, the candidate words as radios. The scale itself is shown
  once above as a `.chart` line, not repeated per item.
- **fits** — half, beside a `stanceScale` display block that draws the axis; full when the set has five or more members.
- **vary** — two options far apart → two neighbours on the scale → three where two are defensible and the deciding
  factor is stated in the prompt (who is speaking, how serious it is).
- **can't** — every item needs one defensible answer. Degree words blur under scrutiny, so the prompt must carry the
  deciding context or the item is an argument, not an exercise.

### `prepositionScene - (A3, B2, C2, D1, E3, F1, G0, H2, I1, J2)`

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

### `summarySqueeze - (A3, B2, C3, D2, E2, F3, G0, H3, I2, J1)`

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

### `sentenceCombine - (A2, B3, C2, D2, E2, F2, G0, H2, I1, J1)`

- **does** — Two short sentences given, one joined sentence required, with the joining word left as the gap. The student
  supplies the relationship (cause, contrast, condition, sequence), which is the part they cannot see in either half.
- **markup** — item list: two clauses printed in the `.qstem`, one `input.gap` for the joining word, and the required
  meaning stated in brackets so the relationship is fixed before the student chooses.
- **fits** — half; full when the clauses are long enough to wrap.
- **vary** — the relationship stated → the relationship implied by the pair → three clauses needing two joins, where the
  second join depends on the first.
- **can't** — the given meaning has to be implied by the content; if either relationship works, the item tests preference,
  not grammar.

### `expandCompress - (A3, B2, C3, D2, E2, F3, G0, H3, I1, J1)`

- **does** — One sentence, two directions: expand it by adding the detail the lesson's forms are for, then compress a
  longer one back to its skeleton. The pair of directions is what shows the student that detail is added *by* the grammar,
  not by adding words.
- **markup** — worked pair (`<bare>` panel · `<full>` panel) followed by item-list gaps in both directions, each stating
  which direction is wanted.
- **fits** — full; the compressed and expanded versions have to be seen together.
- **vary** — add one detail of a named type → add two of different types → compress a version that is deliberately
  overwritten, which is the direction students almost never get.
- **can't** — expansion invites padding; every added word must be a form the lesson taught, or the block teaches volume.

### `politeLadder - (A3, B2, C2, D1, E3, F1, G0, H2, I1, J2)`

- **does** — One request, said at three levels of politeness, all three correct, ordered. The student then writes the
  version that fits a stated hearer. Politeness here is a *choice of form*, not an adjective on a word.
- **markup** — column pair with three rungs as columns and the hearer as the row label, then item-list gaps: a hearer in
  the `.qstem`, one `input.gap` for the rung.
- **fits** — full; three rungs plus a hearer column does not fit a half.
- **vary** — two rungs → three → four where the top rung is right for one hearer and *wrong* (oily) for another. The last
  is the item that turns the ladder into a rule.
- **can't** — the rungs must be interchangeable in meaning, or the student is choosing content rather than tone; and it
  teaches no grammar — only which of several known forms to reach for.

### `infoGap - (A3, B2, C2, D3, E1, F2, G1, H2, I1, J2)`

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

### `roleCard - (A2, B2, C3, D3, E1, F2, G2, H3, I2, J3)`

- **does** — A card gives who the student is, who they are talking to, and what they need out of it — never what to say.
  The student produces the lines. This is the only block in the family that forces a whole turn rather than a form.
- **markup** — open response: one `.card` with three labelled lines (you · them · you need), and one `<textarea>` for the
  lines. Where a partner is available, two cards with a stated incompatibility.
- **fits** — half, in an `.itemrow` with a second card; a single card at full width wastes the row.
- **vary** — the need is stated → the need is implied by the role → the two roles want incompatible things, so the
  student has to negotiate rather than ask. The last is the version that teaches anything.
- **can't** — no key, so it needs a teacher or a partner; and a card that lists the target phrases turns the block into
  copying, which is the one thing it exists to avoid.

### `audienceShift - (A2, B2, C3, D2, E3, F3, G0, H3, I2, J3)`

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

### `pulseStress - (A3, B2, C3, D2, E1, F1, G2, H3, I1, J0)`

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

### `lyricGap - (A3, B3, C2, D3, E1, F1, G3, H3, I1, J1)`

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

### `lineRepair - (A3, B2, C3, D2, E2, F1, G3, H3, I1, J1)`

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

### `contourMatch - (A2, B2, C2, D2, E2, F0, G3, H3, I1, J1)`

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

### `placeScript - (A3, B3, C2, D2, E2, F2, G0, H3, I1, J3)`

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

### `directnessDial - (A3, B2, C3, D2, E3, F1, G0, H3, I1, J3)`

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

### `generationGap - (A2, B2, C3, D2, E3, F1, G0, H3, I1, J3)`

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

### `mediaSnippet - (A2, B2, C3, D3, E2, F3, G0, H3, I2, J3)`

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

---

# 3. Explanatory — blocks that teach without asking


### `contrastTable - (A3, B3, C1, D1, E3, F2, G0, H2, I1, J1)`

- **does** — Two columns, A and B, holding the same sentence said both ways, so the only thing that changes is
  the thing being taught. A note row under the table states the rule in one line.
- **markup** — `.chart` (a real `<table>`): a header row naming both sides, three or four rows, then
  `<tr class="note"><td colspan="N">` for the rule. Portuguese glosses in `lang="pt"`.
- **fits** — full, or half beside the block that makes the student choose between A and B.
- **can't** — shows the difference but never checks it; and if the two columns differ in more than one way, the
  contrast is unreadable and the rule is lost.

### `ruleCard - (A3, B3, C2, D1, E1, F2, G0, H2, I2, J1)`

- **does** — The mental model in three lines: the rule, one example that proves it, and the **boundary case** —
  the sentence that looks like it should follow the rule and doesn't. The boundary case is the part that stops
  the rule over-generalising, and the part a prose paragraph always loses.
- **markup** — `.card` with a heading line and three labelled lines. No table; a card with a table in it is a
  `contrastTable` wearing the wrong clothes.
- **fits** — third or half; pair with a practice block of the same width.
- **can't** — one card carries one rule. A card with three rules teaches none of them.

### `workedExample - (A3, B3, C1, D1, E1, F1, G0, H2, I1, J0)`

- **does** — One sentence assembled step by step, each step labelled with what changed and why
  (`<base>` → `<+ ending>` → `<final>`), so the student watches the form build instead of meeting it finished.
- **markup** — `.panel`, one step per line, real arrow characters, the label as text (never an image).
- **fits** — third; pair with `formulaFrame` at the same width.
- **can't** — only for forms that genuinely build in steps (tense forms, questions, negation). On a fixed
  phrase it is decoration.

### `annotatedExample - (A3, B2, C2, D1, E1, F2, G0, H2, I2, J1)`

- **does** — One real sentence with its working parts named: what carries the tense, the chunk that can be
  swapped, the piece that decides the meaning. Names sit beside or under the text.
- **markup** — `.panel`; the target part in `<b>` with a caption line under it; `lang="pt"` only where a word
  is genuinely new.
- **fits** — full (a labelled sentence needs horizontal room) or half with two labels only.
- **can't** — labels on everything mark nothing. Three labels maximum, or the student reads none of them.

### `formulaFrame - (A3, B3, C2, D1, E1, F1, G0, H2, I1, J0)`

- **does** — A pattern as a skeleton with named slots (`<I'd rather> ___ <than> ___`), then two or three filled
  versions. Teaches a shape to reuse rather than a conjugation table to stare at.
- **markup** — `.panel`; the skeleton in `<b>` with `___` for slots; the filled versions below, slot content
  marked so the student sees which part moved.
- **fits** — half; pair with the drill that makes them fill the slots.
- **can't** — only for patterns that are actually fixed. A frame with moveable parts teaches a false shape, and
  the student will build sentences that look like the frame and are wrong.


### `signalTable - (A3, B3, C3, D1, E2, F2, G0, H3, I1, J0)`

- **does** — The cue in the sentence, the choice it forces, one example each: `<cue>` → `<form it demands>`. This
  is the display form of the condition that decides the item, and it is what makes a rule usable without
  remembering a list of cases.
- **markup** — `.chart`, three columns (`<cue>` · `<what it forces>` · `<example>`), four to six rows. A
  `<tr class="note">` under it names the one cue that is a trap.
- **fits** — half, if the cues are short; full when examples are sentences.
- **can't** — no cue is decisive on its own; a table that reads "always" when the language only mostly does this
  teaches a false rule.

### `exceptionBench - (A2, B2, C3, D1, E1, F1, G0, H3, I2, J0)`

- **does** — The exceptions, grouped **by why they behave that way**, not listed as a set of facts to memorise.
  Two or three items, each `<form>` — because `<reason>`.
- **markup** — `.panel` with a short heading per group; two groups maximum. No table: an exception has a reason,
  and a table cell is too narrow to hold it.
- **fits** — half; pair with the practice block that uses both the rule and its exception.
- **can't** — if the exceptions have no shared reason, this block is a list of things to memorise and should be
  cut in favour of teaching them as separate items.

### `errorGallery - (A3, B2, C3, D2, E2, F2, G0, H3, I1, J1)`

- **does** — Four or five sentences that **look** correct and aren't, each with the reason it fails. The fixes
  are not shown: the student meets those again in the practice that follows, so the gallery trains the mistake,
  not the correction.
- **markup** — `.panel`, one line per trap: the sentence in `<b>`, the reason under it in `lang="pt"` or plain
  English, numbered. Nothing else — a gallery with fixes in it is an answer key.
- **fits** — half, or full beside a `ruleCard`.
- **can't** — no production, and it is heavy with negatives; more than five traps in one gallery and the student
  remembers none of them.

### `beforeAfterStrip - (A3, B3, C2, D2, E2, F2, G0, H2, I1, J1)`

- **does** — One meaning written twice: the version a student at this level actually produces, then the version a
  native speaker would. Both are grammatical — the difference is naturalness, not correctness — and that is the
  whole point of the pair.
- **markup** — two stacked `.panel`s with `<before>` / `<after>` labels, or `.itemrow` with the two half-width.
  The natural version carries the changed chunk in `<b>`.
- **fits** — half each, side by side.
- **can't** — must never show an ungrammatical "before", or it teaches an error as the starting point; and one pair
  makes one point — three pairs in a row is a lecture.

### `soundGrid - (A3, B3, C1, D1, E3, F1, G3, H2, I1, J0)`

- **does** — One contrast, shown in three positions: the same pair of sounds at the start, in the middle and at the
  end of a word, with a `.listen` chip on each example. Teaches that the contrast is a system, not two words.
- **markup** — `.chart`: rows are the two sounds, columns are the positions; each cell holds `<word>` plus a
  `.listen` chip. A `<tr class="note">` names the position where the student's own language interferes most.
- **fits** — full; it is three columns of examples plus labels.
- **can't** — it is listening and mouth-work only; no written form, and a grid with more than two sounds per row
  stops being a contrast and becomes a catalogue.

### `stressBar - (A3, B3, C2, D1, E1, F1, G2, H1, I1, J0)`

- **does** — The word broken into syllables with the stressed one marked, and **the rule that put the stress
  there** — which is what makes it transferable to the next word instead of a fact about this one.
- **markup** — `.panel`; syllables separated by a raised dot, the stressed syllable in `<b>`; one `.listen` chip for
  the whole word; the rule as one caption line under it.
- **fits** — third; two or three of them in an `.itemrow`.
- **can't** — English stress is only partly rule-governed, so a stress rule that has more exceptions than cases is
  worse than saying plainly that this one must be learned by ear.

### `spellingSoundMap - (A3, B3, C2, D1, E3, F3, G2, H2, I1, J0)`

- **does** — The reverse direction of `soundGrid`: one sound, and the several spellings that produce it (or one
  spelling and the sounds it makes), each with an example. Makes reading predictable instead of memorised.
- **markup** — `.chart`, two columns (`<spelling>` · `<example word with a listen chip>`), grouped by position if
  position changes the answer.
- **fits** — half.
- **can't** — English spelling is regular in patterns, not in rules; if the honest answer is "these four, and no
  pattern", write that, or the block teaches a rule that will fail in the next paragraph the student reads.
### `scaleAxis - (A3, B3, C2, D2, E3, F1, G0, H1, I1, J0)`

- **does** — Items placed along a named continuum (`<weak>` ⟶ `<strong>`, `<formal>` ⟶ `<casual>`,
  `<always>` ⟶ `<never>`), with the ends labelled. Teaches degree where a rule would only give two boxes.
- **markup** — `.chart` used as a strip (one row, one cell per step) or a `.panel` with the items separated by arrow
  characters and the two ends in `<b>`. Every item keeps its `lang="pt"` gloss if the word is new.
- **fits** — full; a continuum needs the width to read as a line.
- **can't** — it claims an order. If two items could swap places without changing meaning, the axis is invented and
  must not ship.

### `collocationMatrix - (A3, B3, C3, D2, E3, F2, G0, H2, I2, J1)`

- **does** — Two sets of words as rows and columns, with ticks showing what actually goes together. This is the
  block that stops translation-shaped errors, because a pair that "means the same" in both languages lands in the
  wrong cell here.
- **markup** — `.chart`: `<set A>` down the side, `<set B>` across the top, `✓` and `✗` in the cells, and a
  `<tr class="note">` naming the one cell students always get wrong.
- **fits** — half if both sets are three items; full at four or more.
- **can't** — ticks are not explanations; if a combination is blocked for a reason (not just by convention), a
  matrix hides it and the reason belongs in a `ruleCard` beside it.

### `falseFriendSplit - (A3, B3, C2, D2, E2, F1, G0, H2, I1, J1)`

- **does** — One word in the student's language that splits into two in English (or one English word that covers
  two things in the student's language), shown with **the test that decides which one** — a question the student can
  ask themselves in the moment.
- **markup** — `.panel`: the shared meaning on top, then each branch as `<English word> — <when it is the right one>`,
  a short example line under each, the drawing question pinned at the bottom in `<b>`.
- **fits** — half; pair with the drill that makes the student choose.
- **can't** — only for genuine splits; a word with one clean equivalent presented here invents a difficulty the
  language does not have.
### `audienceRow - (A3, B3, C2, D2, E3, F1, G0, H2, I1, J2)`

- **does** — One message at three distances — a friend, an adult you know, an adult you don't — with **who you would
  say it to** as the label on each version. Teaches register as a choice with a reason, not as politeness points.
- **markup** — `.chart`: a `<when>` column naming the audience, a `<how it sounds>` column with the version. Two
  `<tr class="note">` rows if a form is wrong for one audience rather than merely odd.
- **fits** — full; three versions of one message do not fit across a half in readable type.
- **can't** — it presents the ladder without walking it; the student still needs a block that makes them pick the
  rung, or this is a poster about register.

### `sceneCast - (A3, B3, C2, D2, E0, F1, G0, H1, I2, J3)`

- **does** — Who is talking, where, what has already happened between them, and what is at stake — the facts that
  predict which language the scene will use. This is the block that lets a dialogue or a roleplay be one thing
  instead of four disconnected items.
- **markup** — `.card` with four labelled lines (`who` · `where` · `what just happened` · `what's at stake`). No
  dialogue yet: this block sets the scene, the next one uses it.
- **fits** — third or half; pair with a dialogue at the same width.
- **can't** — no language at all, so it is worth nothing without the scene it sets; and a cast list that only names
  people ("Ana, her brother") predicts nothing — the stakes have to be social.

### `dialogueMoves - (A3, B2, C2, D2, E2, F2, G1, H3, I2, J2)`

- **does** — A short exchange where each turn is labelled by **what it is doing** (`open` · `hedge` · `push back` ·
  `concede` · `close`), so the student sees that a conversation has parts and that the parts have their own phrases.
- **markup** — `.dialog` for the exchange (speaker, turn), and beside or under each turn its move label. The move
  vocabulary must be named in the lesson before the labels appear.
- **fits** — full; two columns of text plus labels.
- **can't** — labels are metalanguage, not language; a student can label a hedge and still not produce one, so the
  block must be followed by a drill that makes them produce a move.
### `chatSample - (A3, B2, C2, D3, E1, F3, G0, H3, I1, J3)`

- **does** — A short thread as it actually appears on a screen, with the target language in the middle of ordinary
  noise: a typo, an emoji, two messages in a row, a reply that ignores the question. The student meets the form in
  the wild before they are asked to use it.
- **markup** — `.dialog` with the thread (speaker bubble per line). A `<tr class="note">` or one caption line names
  what to look for — the block must say why it is on the page.
- **fits** — full or half; a thread is narrow, so half-width is natural beside the practice.
- **can't** — real material dates. If the lesson would break when the slang in it ages, use it as one example
  among several, never as the only presentation of a rule; and a thread whose every line is target language is a
  dialogue pretending to be a chat.

### `vocabField - (A3, B3, C1, D2, E3, F1, G0, H2, I1, J2)`

- **does** — The lesson's new words arranged by **the job they do in the situation** (people · things · actions ·
  what you say · how it went), not as a numbered list with translations. A field is easier to use than a list
  because the student retrieves by meaning.
- **markup** — `.chart` with a `<when you need it>` column and the items in the cell; `lang="pt"` glosses only where
  the word is genuinely new. Ten items minimum across the clusters.
- **fits** — full; the columns are the teaching.
- **can't** — no drill, and a field with arbitrary headings is a list with extra lines; every cluster name has to be
  a situation the student will actually be in.

### `storyStrip - (A3, B3, C2, D3, E1, F3, G0, H3, I1, J2)`

- **does** — Three or four short scenes carrying one continuous situation, with the target language embedded in
  each and getting slightly harder. The student learns the language *inside* a story instead of meeting it as
  examples, and later blocks can refer back to the scenes by name.
- **markup** — `.itemrow` of `.panel`s (or `.card`s), each with a scene number, two or three lines, and the target
  form in `<b>`. Sequential, so the order must read left to right and stack on a narrow screen.
- **fits** — full width, panels in an `.itemrow`; two or three per row.
- **can't** — a story is long, and length is not depth: if the scenes do not each teach something the previous one
  did not, it is decoration that pushes the practice below the fold.

### `melodyContour - (A3, B3, C2, D2, E1, F1, G2, H2, I1, J0)`

- **does** — One line of text with a **drawn line over it** showing where the voice rises and falls, and a one-word label
  under the shape (`finished` · `waiting` · `asking` · `doubt`). It is the only way to put intonation on a printed page:
  words describe a movement badly, a line describes it exactly.
- **markup** — `.panel` with an inline `<svg>` path (no image file, no network) and the text beneath it, one glyph per
  syllable so the line's turns line up with the words. One contour per block.
- **fits** — half, beside `contourMatch` or `stressBar`; third when it is only illustrating a single word.
- **can't** — it shows the shape and proves nothing; and a contour over a line the student cannot hear is an abstraction —
  the clip has to be there too, or this is decoration.

### `beatGrid - (A3, B2, C2, D1, E1, F1, G2, H2, I1, J0)`

- **does** — A sentence laid onto a row of even beats, unstressed syllables squeezed into the cells between them, with the
  stressed syllable marked. Shows the thing students never believe from prose: the beats are evenly spaced and the words
  are not.
- **markup** — `.chart` where each column is one beat and each cell holds what falls in it; stressed cells in `<b>`. Real
  columns, not aligned text, or the evenness is a claim rather than a picture.
- **fits** — full; a beat row that wraps is no longer a beat row.
- **can't** — one line per grid; two lines stacked invite the student to read them as equal length, which is the opposite
  of the point.

### `stanceScale - (A3, B3, C2, D1, E3, F1, G0, H1, I1, J0)`

- **does** — An axis, and the lesson's words placed on it (`<weak>` — `<neutral>` — `<strong>`), including the gaps where
  nothing sits. Position is the teaching: two words that looked like synonyms are shown to be neighbours or not.
- **markup** — `.chart` row with the ends named and the members placed in order; a cell holding `—` where a slot is empty.
  The empty slots are the useful part and must not be tidied away.
- **fits** — full or half; the axis needs to look continuous, so never a bulleted list.
- **can't** — an axis implies a single dimension; if two of the words differ in kind rather than degree, the axis is a lie
  and a `collocationMatrix` is the honest shape.

### `routineMap - (A3, B2, C2, D1, E2, F1, G0, H2, I2, J2)`

- **does** — A routine drawn as a **path with branches** rather than a list: the moves in order, and at the points where the
  exchange can go two ways, both ways shown and where each ends. This is the shape `placeScript` tests and prose cannot
  hold.
- **markup** — `.chart` or a `.panel` with an inline `<svg>` of boxes and connectors; labels are moves, not lines of
  dialogue. Two branches maximum or the map stops being readable at a half-width.
- **fits** — full; a branch diagram at a third is a scribble.
- **can't** — it is a map of one routine in one setting; and it shows the route, never which route to take — that is the
  judgement the practice block after it has to test.

---

### `rhymeCoda - (A2, B2, C2, D2, E2, F2, G2, H2, I1, J1)`

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

### `songStructure - (A3, B2, C3, D2, E2, F3, G0, H3, I2, J2)`

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

### `barCount - (A3, B2, C2, D2, E1, F1, G2, H2, I1, J0)`

- **does** — Count the beats a line actually lands on, and where the count breaks. Rhythm becomes a number the
  student can check, which is what "say it with stress" fails to give them.
- **markup** — column pair: the line left, `input.gap` for the count right; a second row asks which word sits on the
  break.
- **fits** — beat or half; pair with `pulseStress` — count first, then mark the stress.
- **vary** — count beats, then move the count by one word, then keep the count identical and change the meaning. The
  third step is the whole point and it needs no new words.
- **can't** — speech only: a page cannot carry a metronome, so the count is the lesson's judgement and the block must
  not present itself as measuring anything. It teaches nothing about meaning.

### `moodTrack - (A2, B2, C3, D3, E2, F2, G0, H3, I2, J3)`

- **does** — A scene, plus three short descriptions of how a track sounds; the student picks the one that fits and
  defends it in one written line. The defence is the work: mood words are easy to guess and hard to justify.
- **markup** — `.qitem` with the scene as `.qstem` and the descriptions as `.opts` radios, then one `input.gap` for
  the "because…" clause.
- **fits** — half or full; pair with a production block (`freeWrite`) so the words are actually used.
- **vary** — narrow the distance between the three descriptions until all are plausible. Never raise the vocabulary.
- **can't** — nothing is played. It is vocabulary and justification, and grading it as a listening task would be a
  lie; it also cannot teach genre names it never states.

### `genreDoc - (A3, B2, C3, D2, E2, F3, G0, H3, I2, J3)`

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

### `signScan - (A3, B2, C2, D1, E2, F3, G0, H3, I1, J3)`

- **does** — A set of notices from one place, each with a different force; the student matches each to what it does
  to them — forbids, permits, warns, requests — and then names the word doing the work.
- **markup** — column pair: notice left, radios for the force right; then one `input.gap` for the operative word.
- **fits** — half; pair with `registerContrast` when the lesson also has a soft/hard axis.
- **vary** — from "what does it mean" to "which two notices conflict". Conflict is the difficulty, not longer notices.
- **can't** — recognition only, and it must keep two axes apart: how hard a notice is and how polite it is are
  different questions, and a block that asks both at once cannot be marked.

### `formFill - (A3, B2, C2, D2, E1, F3, G0, H3, I1, J3)`

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

### `measureLocal - (A3, B3, C2, D1, E2, F2, G0, H2, I2, J3)`

- **does** — The units an artefact uses against the ones the student lives in: order of a date, clock convention,
  money, distance, size, temperature. The student converts both ways and then marks which reading is ambiguous.
- **markup** — column pair: `<as written>` left, `input.gap` right for the converted form; one extra row asking what
  the same notation could also mean.
- **fits** — beat; pair with `genreDoc`, which supplies the artefact that made it matter.
- **vary** — a value to convert; then a value that is ambiguous; then a value where the ambiguity changes the answer.
- **can't** — arithmetic crowds out language quickly — keep it to five rows — and it teaches nothing about how anyone
  actually speaks.

### `tabooMap - (A2, B2, C3, D2, E2, F1, G0, H3, I1, J3)`

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

### `accentVariant - (A3, B2, C2, D2, E3, F2, G1, H3, I1, J3)`

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

### `idiomOrigin - (A2, B2, C3, D3, E1, F1, G0, H3, I1, J3)`

- **does** — Three things at once: the idiom, what it literally says, and where it came from. Then one line where the
  literal reading would be wrong. The origin is what makes the literal trap stick, which is why this is not
  `contextFit` with extra words.
- **markup** — `.card` with three labelled lines, then one `input.gap` sentence that has to use the idiom.
- **fits** — beat or third; pair with `contextFit` — origin first, then the bank that files it under what it does.
- **vary** — from producing the idiom to choosing between two that both look plausible.
- **can't** — origins are frequently folk etymology. If the source is not certain the block must say "one story is" —
  an invented origin is worse than none. It is also one lexical item at a time and never generalises.

### `humourFlag - (A2, B2, C3, D3, E2, F1, G0, H3, I2, J3)`

- **does** — A line that is meant to be funny, and the student marks what is doing the work — a pun, an
  understatement, a reversal, a pause — then names what it would lose if translated.
- **markup** — `.qitem` with the line as `.qstem` and the mechanisms as radios, then an `input.gap` for what it loses.
- **fits** — beat; pair with `contrastTable` when two mechanisms have to be told apart.
- **vary** — from naming the mechanism to predicting whether a second line will land.
- **can't** — funny is not a rule, and explaining a joke can kill it, so use it once per lesson at most. It must never
  be graded as though taste were accuracy.

