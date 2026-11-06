# CONTENT_EXAMPLES — the vehicle menu

Applies to **every track**. This is a menu of **mechanisms**, not of sentences: a game here is a skin that
drives content already authored in the page's HTML. No entry carries lesson text, no entry is a script to copy.
Where a shape is needed it is written as `<placeholder>`.

## How to use this file

- **A menu, not a checklist.** Nothing here is required in any lesson, in any order, any number of times.
  Reaching for a vehicle because it is listed — rather than because that beat needs it — is a defect.
- **Choose per beat, and be able to say why not another.** The recorded justification (`PEDAGOGY-MAP.md`)
  is only honest if this file says what each vehicle *cannot* do. That is the `can't` field.
- **The content is already in the page.** Games drive authored `.qitem`s (stem + optional `.listen` + radios),
  `input.gap`, or a textarea — nothing else. Whatever the engine animates is presentation; the saved answer
  is always one of those controls. If a mechanism cannot end in one, it is not a vehicle, it is a decoration.
- **The tone of a lesson comes from the lesson's copy, never from here.** Every game below is track-neutral by
  construction, so the same `whackMole` works for a business page and a kids page. Silly or slangy *skins* are
  per-track data layered on top — never baked into the mechanism.
- **Two families.** Sections 1–4 are games, section 5 is drills, section 6 is **display**: blocks that teach
  without asking anything. A page that is all section 1–5 is a test with a theme.

## The key

| field | meaning |
|---|---|
| `size` | **beat** (one item's worth) · **section** (a whole activity) · **page** (a spine that spans sections) |
| `cost` | **A** markup only, no JS · **B** a plugin on the shared runner, ~40–80 lines · **C** new state or dictionary, ~100+ lines |
| `evidence` | which persisted control carries the mark: `radio` · `gap` · `textarea` · `audio` · `none` |
| `tests` | 0 exposure · 1 recognise · 2 controlled produce · 3 free produce |
| `fun` | 0–3, engagement |
| `reuse` | 0–3, how many lessons it survives before going stale |
| `needs` | `none` (ships as markup today) or the engine it requires |

Scales are four-point on purpose: 0–5 clusters at 3. `evidence: none` means the vehicle cannot stand alone —
it selects, reveals or decorates, and a real control must carry the answer alongside it.

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

# 1. Games — arcade and reflex

The player's hands do the work: aim, time, catch, dodge. Each one drives ordinary `.qitem`s, so the answer
that saves is the same radio a plain page would have.

### `skeetRange` — section · cost B · evidence radio — tests 2 · fun 3 · reuse 2 · **not shipped — cut; it did not carry its weight**

- **does** — One moving target per item. Player aims with the cursor and takes **one shot**; a hit scores, a
  miss is spent. No spray, no endless retry — the constraint is what makes it feel like skill.
- **skins** — `.game > .game-list` of `.qitem`; the stem is the prompt line, the options are the targets.
- **art** — one flat ring or disc per option, drifting on a slow eased arc; a thin crosshair; a single puff on
  impact. This is the intended replacement path for `shootPair`'s look, not another game beside it.
- **can't** — no production, no spelling; one shot per item means a careless click can hide what the student knew.
- **needs** — shared runner (or `shootPair` refactored into it).

### `whackMole` — section · cost B · evidence radio — tests 2 · fun 3 · reuse 2 · **built: engine4.js**

- **does** — One drawn mole per option surfaces from a hole, stamped in stagger; the player hits the one that
  fits before the runner's timer bar empties. The rest duck away the instant an answer lands.
- **skins** — same `.qitem` list; the prompt sits on the HUD line, options become the moles' labels.
- **art** — inline SVG mole + radial-gradient hole with a dirt rim, rise via `translateY`, reduced-motion path.
- **can't** — recognition only; speed pressure makes it a poor fit for anything needing reflection.
- **needs** — nothing; `engine4.js` ships it.

### `brickRight` — section · cost B · evidence radio — tests 2 · fun 3 · reuse 2 · **not shipped — cut; it did not carry its weight**

- **does** — Breakout. The paddle follows the pointer; the ball knocks out the brick carrying the right option.
  Wrong bricks cost a ball. A real game with real stakes, and the physics is two rectangles and a vector.
- **skins** — `.qitem` options become brick labels; the prompt stays on the HUD line.
- **art** — flat rounded rectangles, one accent colour per correct-state, dotted ball trail.
- **can't** — one hand is on the paddle, so the reading load must be tiny; long options break the geometry.
- **needs** — shared runner + a collision loop.

### `catchBasket` — section · cost B · evidence radio — tests 2 · fun 3 · reuse 3 · **built: engine4.js**

- **does** — One word is shown at a time; the player **drags it into the basket that fits** (or taps a basket, or
  presses `1`/`2`). Dropping outside springs the word back, so a slipped finger costs time, not the item. The
  runner's bar is the deadline for each word.
- **teaches** — sorting a form into a category: past vs now, one ending vs another, which pattern a word belongs
  to. The decision is made in one gesture, so hesitation is visible.
- **skins** — one word per item (`.qstem`), one basket per option (the radio labels); a correct drop checks that
  option's radio.
- **art** — inline SVG wicker basket, the word lifts and tilts while held, a correct drop flies it into the
  basket, a wrong drop shakes.
- **can't** — only two or three baskets fit a row; fine distinctions don't fit.

### `stackDrop` — section · cost B · evidence radio — tests 2 · fun 3 · reuse 2 · **built: engine4.js**

- **does** — A block carrying the question slides left and right above a tower; the answer buttons sit below. A
  correct answer locks the block in as a **rung** of the ladder; a wrong one makes it fall away and the rung stays
  empty. When every rung is built, the little climber walks up the ladder and takes the star at the top.
- **teaches** — accumulate-and-complete: the reward is the finished ladder, so a long drill has a shape and an end.
  Each rung is one item answered, so the tower *is* the progress bar.
- **skins** — one `.qitem` per rung; the block label is the stem, the buttons are the options.
- **art** — flat rectangles, a dashed empty rung for each unearned step, a climber figure that rises on completion.
- **can't** — one item per rung, so it wants six to ten items; a two-item block has nowhere to climb.
- **art** — flat rectangles, hard edges, a rising stack. Six levels, then an end screen.
- **can't** — timing dominates; keep the language load per level to a phrase.
- **needs** — shared runner.

### `flapGate` — section · cost C · evidence radio — tests 1 · fun 3 · reuse 2 · **built: engine4.js**

- **does** — One-button flight; the player passes through the gate labelled with the right option. Contact
  with a wrong gate costs a life.
- **skins** — gates are options; the prompt is fixed on the HUD.
- **art** — two flat rounded rectangles per gate, a square avatar, sky as a flat fill. Nothing else.
- **can't** — recognition at speed only, and it is the most expensive of the arcade set.
- **needs** — shared runner + gravity loop.

### `raceLane` — section · cost B · evidence radio — tests 2 · fun 3 · reuse 3 · **not shipped — cut; it did not carry its weight**

- **does** — Answer to accelerate. Correct answers push the avatar toward the finish; wrong ones stall it. The
  ghost of the student's best run is the opponent, so there is competition without a server.
- **skins** — any existing drill; the game only adds a track, two avatars and a timer.
- **art** — two flat bars, a finish line, a lap counter. Cheapest strong game in the list.
- **can't** — rewards speed, so it flatters a guesser; pair with a producing block.
- **needs** — shared runner + the existing `data-limit` timer.

---

# 2. Games — puzzle and logic

Slower, thinking games. No timer pressure; the tension is deduction.

### `lockCode` — page · cost B · evidence gap — tests 2 · fun 3 · reuse 3 · **not shipped — cut; it did not carry its weight**

- **does** — The section is an escape room. Each correct answer releases one digit; three digits open the next
  block. Turns loose exercises into one thing the student is trying to do.
- **skins** — `input.gap` per answer; the code display reads the gaps that are already there.
- **art** — three flat digit boxes that fill with a hard cut, then a bar that slides open once.
- **can't** — needs a section whose answers reduce to one character; housekeeping, not teaching.
- **needs** — `none` (markup + ~40 lines to read the gaps).

### `wordleBoard` — section · cost C · evidence gap — tests 3 · fun 3 · reuse 3 · **built: engine4.js**

- **does** — The student guesses letters; the board marks right letter/right place, right letter/wrong place.
  Hangman is the same engine with a different face (a revealed blank row instead of coloured tiles).
- **skins** — one target word per item, typed into a `gap` at the end, so the evidence is spelling the student
  produced rather than letters guessed.
- **art** — a flat 5×6 tile grid, two terminal colours and one absent colour; no drawn keyboard, use the native one.
- **can't** — only words of one fixed length; nothing for phrases, meaning or listening.
- **needs** — shared runner + a letter-state machine.

### `pairFlip` — section · cost B · evidence radio — tests 1 · fun 3 · reuse 2 · **built: engine4.js**

- **does** — Memory pairs: flip two cards, keep them if they belong together. Six pairs is one screen.
- **skins** — pairs are the `.qitem` stem↔option links; a match checks that radio.
- **art** — flat rounded rectangles with a hard flip, one accent edge, no motif on the backs.
- **can't** — recognition of a pair only; it teaches nothing about producing the form.
- **needs** — shared runner.

### `mineGrid` — section · cost B · evidence radio — tests 2 · fun 2 · reuse 2 · **built: engine4.js**

- **does** — The field is the options, face down. The student picks a tile and **a figure runs to it**. The right
  tile hands back the answer; a wrong one explodes under him. He survives two blasts and looks worse each time
  (singed, then bandaged); the third wrong pick ends the run.
- **teaches** — commitment under stakes. Because he only gets three mistakes, a guess has a price, so the student
  reads before moving. Every wrong pick leaves its radio blank, so the blanks are the teacher's evidence.
- **skins** — one tile per option; the prompt stays on the HUD line.
- **art** — dunes with warning stakes, a drawn figure with three hurt states, a blast, a life counter.
- **can't** — binary judgement per tile; four-way choice needs a different frame.

### `crosswordBoard` — section · cost C · evidence gap — tests 3 · fun 2 · reuse 2 · **built: engine4.js**

- **does** — A **real generated crossword**. Each `.qitem` carries `data-answer` (the word) and its `.qstem` is the
  clue. The engine lays the whole set out at once: the first word across, every later word placed so it **crosses**
  an existing letter, anything that cannot cross dropped into its own row below. A shared letter is one cell, so
  typing it once fills both words and **solves both items** — that is the point of a crossword and why this is a
  board, not a drill. A full word typed wrongly clears and shakes; its item stays blank, so the blank is the evidence.
- **art** — the site's own grid: a flat block per gap, a small number in the corner of each word's first cell, the
  current clue under the board and repeated on the HUD line.
- **can't** — the set must be spellable and the words short, or the grid gets fat; words with no shared letter can
  only sit in their own rows, so a lesson whose vocabulary shares nothing is a bad fit.
- **needs** — nothing; `engine4.js` ships it. Authoring: `data-answer` on each `.qitem`, clue in `.qstem`.

---

# 3. Games — memory and listening

The ear does the work. Both need the built-in voice, not a rendered clip.

### `echoPads` — section · cost B · evidence gap — tests 2 · fun 3 · reuse 2 · **built: engine4.js**

- **does** — Simon, in words. Four pads, one per option, **each with its own tone**. Round 1 plays one beat, round 2
  plays two, round *n* plays *n* — the whole pattern is replayed every round, so the student is echoing a growing
  sequence rather than guessing a single pad. Echo the full pattern and the item is answered; a wrong press ends the
  round honestly as a miss. "Say it again" replays the same pattern with no penalty — memory of a sound is not a guess.
- **skins** — pads are the item's options; the pattern is generated by the engine and grows with the round (capped at
  8 so late rounds stay winnable).
- **art** — four flat pads on the neon arcade scene, lit on press by its own tone.
- **can't** — memory span caps the useful round at about five or six; nothing written is involved, so it trains
  listening and recall, not spelling.
- **needs** — nothing; `engine4.js` ships it (tones are synthesised, no audio files).

### `bingoCard` — section · cost B · evidence radio — tests 1 · fun 3 · reuse 2 · **built: engine4.js**

- **does** — A 3×3 card is built from the item's own options **plus decoys drawn from the rest of the block**, so the
  card is never trivially small. The voice **calls the correct answer's word** (the clip when the item has one, else
  the right option's text — never the question). The student stamps the tile they hear; a wrong stamp is a real
  answer, taken honestly as a miss. "Call it again" repeats the word.
- **skins** — tiles are options, so the words on the card are the lesson's words.
- **art** — a bingo hall: red curtain, footlights, a stamped tile gets a hard double border.
- **can't** — recognition of the spoken form only; the card needs at least a few options across the block or the
  decoy pool runs dry.
- **needs** — nothing; `engine4.js` ships it (uses the built-in voice).

---

# 4. Games — quiz-show and stakes

No motion; the game is progression and risk. Cheapest of the set and they suit every track.

### `ladderRun` — page · cost B · evidence radio — tests 2 · fun 3 · reuse 2 · **built: engine4.js**

- **does** — A full-height rail with a climber and a chest at the top. One rung per right answer, a **safe rung every
  five**, and the height is **heard** as well as seen (a rising motif as you climb). A wrong answer slides the climber
  back to the last safe rung — so what was safely earned is kept, which is what makes a ladder a ladder and not a
  list. Longer lists make a taller climb, so the same block scales from a five-item drill to a full quiz.
- **skins** — the `.qitem` list is the ladder; the options are the buttons under it.
- **art** — the ladder is drawn to the run's length, the climber steps up on a right answer and slips on a wrong one,
  the chest lights when he reaches the top.
- **can't** — one continuous arc, so it wants to be the page's quiz, not a mid-lesson drill; and a fall back to the
  safe rung is deliberately harsh, so keep items fair.
- **needs** — nothing; `engine4.js` ships it.

### `boardQuiz` — page · cost A · evidence radio — tests 2 · fun 3 · reuse 3 · **not shipped — cut; it did not carry its weight**

- **does** — A grid of categories by difficulty; each cell opens one item. Points awarded, two players or teams
  alternate. The one structure that works offline with a teacher driving it.
- **skins** — a matrix of `.qitem`s; the cell is a jump link, the item is ordinary.
- **art** — a flat grid, one accent per column, hard flip in the cell.
- **can't** — the difficulty axis has to be real, or a column is just an arbitrary label.
- **needs** — `none` (markup + jump links).

### `spinPick` — beat · cost B · evidence none — tests 0 · fun 2 · reuse 3 · **not shipped — cut; it did not carry its weight**

- **does** — Chooses which item comes next: a wheel or a slot lever. Removes the "1, 2, 3" march and makes the
  order feel live. Two skins, one mechanism.
- **skins** — the `.qitem` order; the chosen item is answered normally right after.
- **art** — flat wheel with even segments and a hard stop, or three reels that land together.
- **can't** — carries no answer at all; always a companion to a real block.
- **needs** — `none`.

### `bossRaid` — page · cost C · evidence radio — tests 2 · fun 3 · reuse 2 · **built: engine4.js**

- **does** — A drawn hero stands in front of the boss. A correct answer makes him **step in and swing** — the boss
  loses HP with a flash. A wrong answer and the boss swings back: the hero recoils and loses one of three hearts.
  No hearts, he goes down and the raid is over.
- **teaches** — a long drill with a visible cost. Every item is a swing, so the class can see the health bar move
  and knows how much of the drill is left. Wrong answers are the only thing that shortens it.
- **skins** — the `.qitem` list is the attack sequence; the options are the answer buttons.
- **art** — a torch-lit arena, a hero with lunge/recoil/down states, a ringed geometric boss, an HP bar, hearts.
- **can't** — ritual stakes can mask weak items; every item must still be defensible on its own.

- **does** — A boss with an HP bar; each correct answer lands a hit, each wrong one costs the student a heart.
  Waves get harder. Gives a long drill a reason to exist and an ending.
- **skins** — the `.qitem` list is the attack sequence.
- **art** — one flat geometric boss (a ringed hexagon beats a drawn monster), a thin HP bar, a hard flash.
  **This vehicle lives or dies on art quality; never ship it in the `shootPair` visual style.**
- **can't** — ritual stakes can mask weak items; every item must still be defensible on its own.
- **needs** — shared runner + HP state.

---

# 5. Blocks — teaching shapes

Not games: the page itself is the vehicle. All are markup-only (**cost A**) and every one is reusable in every
track. No example wording appears here on purpose — the lesson supplies it.

### `twoWordVerb` — section · cost A · evidence gap — tests 2 · fun 1 · reuse 3

- **does** — A chart puts the everyday two-word verb beside its one-word twin; the exercise asks for the everyday
  form (`<everyday verb>` ↔ `<one-word twin>`). The everyday form is what the student produces; the twin maps meaning.
- **can't** — the pairing has to be genuinely interchangeable, or the chart teaches a false equation.

### `chunkBank` — section · cost A · evidence gap — tests 2 · fun 1 · reuse 3

- **does** — Whole fixed expressions taught as one unit with audio, then a matching or translation exercise.
- **can't** — a chunk whose parts can be swapped is not a chunk; check it is said as one piece.

### `connectedSpeech` — section · cost A · evidence gap — tests 1 · fun 2 · reuse 2

- **does** — Full form beside its spoken form (`want to` → `wanna`, `going to` → `gonna`), with audio, then a
  listen-and-choose "what did you hear?". These spellings are the real ones, never improvised.
- **can't** — trains the ear only; nothing about meaning.

### `dictation` — beat · cost A · evidence textarea — tests 3 · fun 1 · reuse 3

- **does** — A short sentence plays at natural speed; the student types exactly what was heard, then compares.
- **can't** — one playing is a memory test; allow replays or it measures recall, not listening.

### `sentenceSurgery` — section · cost B · evidence gap — tests 2 · fun 3 · reuse 3

- **does** — A sentence or a whole exchange is cut into chunks and handed over out of order; the student rebuilds
  it. Word order, chunk order and linking all show up immediately, because a wrong order reads wrong.
- **skins** — the chunks are buttons; the rebuilt order is typed as numbers into consecutive `gap`s, so the
  evidence is the student's own sequence. A drag version is the same engine with pointer events.
- **art** — flat chips in one accent, a hard snap when a chip lands, no card shadows.
- **can't** — only sequences with one defensible order; if two orders both work, the item is broken.

### `registerContrast` — section · cost A · evidence radio — tests 2 · fun 1 · reuse 3

- **does** — Two columns contrast a stiff wording with the spoken everyday one; the exercise picks which fits the
  stated audience. The audience is always named, or the item is unjudgeable.
- **can't** — needs a described situation; with no audience both columns are defensible.

### `questionBuilding` — beat · cost A · evidence gap — tests 3 · fun 1 · reuse 3

- **does** — Given an answer, form the question; given a context, ask the follow-up.
- **can't** — graded on form only, or free answers become unmarkable; state what counts as right.

### `repairMoves` — beat · cost A · evidence gap — tests 2 · fun 1 · reuse 2

- **does** — The fixed moves for when communication breaks: ask for a repeat, check a guess, restate.
- **can't** — teaches the move, not the conversation; needs a scene to mean anything.

### `shadowRecord` — section · cost A · evidence audio — tests 3 · fun 2 · reuse 2

- **does** — A short linked passage is played, then recorded by the student. The prompt stays complete and
  read-aloud-able.
- **can't** — no automatic feedback; the teacher's ear is the only judge.

### `pronLab` — section · cost A · evidence radio/gap — tests 2 · fun 1 · reuse 3

- **does** — For a sound the student's first language lacks: a mouth-position guide (in Portuguese) beside a
  first-language-vs-English contrast table, then items that test the distinction.
- **can't** — needs a real first-language error to be worth the space; generic "pronunciation" pages teach nothing.

### `minimalPairs` — beat · cost A · evidence radio — tests 1 · fun 2 · reuse 3

- **does** — The target word beside its near-neighbours, each with audio, so the ear separates one phoneme by its
  minimal difference. Also covers homophones from a flap T or a silent letter.
- **can't** — recognition only; never shows the student can say it.

### `listenIdentify` — beat · cost A · evidence radio — tests 1 · fun 1 · reuse 2

- **does** — A binary or ternary recognition item: which sound, which ending, which stress pattern was heard.
- **can't** — two options invites a coin flip; three minimum for anything that matters.

### `errorCorrection` — beat · cost A · evidence radio — tests 2 · fun 1 · reuse 3

- **does** — Pick the correct item among distractors that each encode the classic first-language error, at whatever
  granularity fits: one word or a whole sentence.
- **can't** — distractors must be real errors, or it becomes a spot-the-typo.

### `syllableLab` — beat · cost A · evidence gap — tests 2 · fun 1 · reuse 3

- **does** — The three pillars of rhythm: count the beats, place the stress, find the schwa.
- **can't** — nothing about connected speech; pair it with `connectedSpeech` if rhythm is the point.

### `errorHunt` — section · cost A · evidence gap — tests 3 · fun 2 · reuse 2

- **does** — A short text with a stated number of errors; the student types the corrections below. Saying how many
  there are is what makes it a task rather than a browse.
- **can't** — needs a self-contained text, so it is not a beat-sized vehicle.

### `oddOneOut` — beat · cost A · evidence radio + textarea — tests 2 · fun 2 · reuse 3

- **does** — One item doesn't belong; the student picks it **and says why** in a line.
- **can't** — if two items can be defended, the item is broken; the justification is mandatory.

### `spotTheDiff` — section · cost A · evidence gap — tests 3 · fun 2 · reuse 2

- **does** — Two versions of the same short text, chat or notice; find and state the differences.
- **can't** — the differences must be meaningful, not punctuation.

### `predictReveal` — beat · cost A · evidence textarea — tests 3 · fun 3 · reuse 2

- **does** — The scene stops mid-way; the student writes what happens next, then reveals the real ending.
- **can't** — no marking; it produces investment, not accuracy.

### `miniProject` — page · cost A · evidence textarea — tests 3 · fun 3 · reuse 2

- **does** — Build something in English: a plan, a poster, a set of rules, an order. Word bank plus textarea.
- **can't** — free production only; nothing here trains a form under control, so it needs a drill beside it.

### `cheatSheet` — section · cost A · evidence textarea — tests 1 · fun 1 · reuse 3

- **does** — The student writes their own summary of what they just learned, in their own words.
- **can't** — evidence of effort, not of accuracy.

---

# 6. Display — blocks that teach without asking

The page has to teach before it tests. Every block in section 5 ends in a control; these end in **nothing** —
no radio, no gap, no textarea. They are how the rule, the mental model, the scene and the useful subset get
onto the page at all, so `evidence` is `none` for all of them and each one must sit beside a block that does ask
something. The mark for any of them is the block that follows.

Three rules for this family:

1. **Never a restatement.** If the lesson already says it in prose, the block has to add a *shape* the prose
   cannot: a comparison, a position on an axis, a branch, a sequence, a boundary case.
2. **One per teaching beat.** Two display blocks in a row is a lecture and the student stops reading. Display →
   practice → display → practice.
3. **Earned by what follows.** A display block carries the rule that the next block tests. If nothing later
   needs it, cut it.

Fields: `does` — what it puts on the page · `markup` — the classes that build it (all exist today) ·
`fits` — natural width and what to put beside it · `can't` — its failure mode.

| family | what it puts on the page | blocks |
|---|---|---|
| **rule & boundary** | the mental model, and where it stops working | `contrastTable` `ruleCard` `signalTable` `exceptionBench` `errorGallery` `beforeAfterStrip` |
| **form & sound** | how the thing is built, and what it sounds like | `workedExample` `annotatedExample` `formulaFrame` `soundGrid` `stressBar` `spellingSoundMap` |
| **meaning & degree** | where a word sits, and what it goes with | `scaleAxis` `collocationMatrix` `falseFriendSplit` |
| **people & place** | who is talking, to whom, and what that predicts | `audienceRow` `sceneCast` `dialogueMoves` `chatSample` `vocabField` `storyStrip` |

The families are a reading order, not a sequence: most lessons need one from the first row and one from the
fourth, and the middle rows only when the lesson is specifically about form or meaning.

### `contrastTable` — section · cost A · evidence none — tests 0 · fun 1 · reuse 3

- **does** — Two columns, A and B, holding the same sentence said both ways, so the only thing that changes is
  the thing being taught. A note row under the table states the rule in one line.
- **markup** — `.chart` (a real `<table>`): a header row naming both sides, three or four rows, then
  `<tr class="note"><td colspan="N">` for the rule. Portuguese glosses in `lang="pt"`.
- **fits** — full, or half beside the block that makes the student choose between A and B.
- **can't** — shows the difference but never checks it; and if the two columns differ in more than one way, the
  contrast is unreadable and the rule is lost.

### `ruleCard` — beat · cost A · evidence none — tests 0 · fun 1 · reuse 3

- **does** — The mental model in three lines: the rule, one example that proves it, and the **boundary case** —
  the sentence that looks like it should follow the rule and doesn't. The boundary case is the part that stops
  the rule over-generalising, and the part a prose paragraph always loses.
- **markup** — `.card` with a heading line and three labelled lines. No table; a card with a table in it is a
  `contrastTable` wearing the wrong clothes.
- **fits** — third or half; pair with a practice block of the same width.
- **can't** — one card carries one rule. A card with three rules teaches none of them.

### `workedExample` — beat · cost A · evidence none — tests 0 · fun 1 · reuse 3

- **does** — One sentence assembled step by step, each step labelled with what changed and why
  (`<base>` → `<+ ending>` → `<final>`), so the student watches the form build instead of meeting it finished.
- **markup** — `.panel`, one step per line, real arrow characters, the label as text (never an image).
- **fits** — third; pair with `formulaFrame` at the same width.
- **can't** — only for forms that genuinely build in steps (tense forms, questions, negation). On a fixed
  phrase it is decoration.

### `annotatedExample` — section · cost A · evidence none — tests 0 · fun 1 · reuse 3

- **does** — One real sentence with its working parts named: what carries the tense, the chunk that can be
  swapped, the piece that decides the meaning. Names sit beside or under the text.
- **markup** — `.panel`; the target part in `<b>` with a caption line under it; `lang="pt"` only where a word
  is genuinely new.
- **fits** — full (a labelled sentence needs horizontal room) or half with two labels only.
- **can't** — labels on everything mark nothing. Three labels maximum, or the student reads none of them.

### `formulaFrame` — beat · cost A · evidence none — tests 0 · fun 1 · reuse 3

- **does** — A pattern as a skeleton with named slots (`<I'd rather> ___ <than> ___`), then two or three filled
  versions. Teaches a shape to reuse rather than a conjugation table to stare at.
- **markup** — `.panel`; the skeleton in `<b>` with `___` for slots; the filled versions below, slot content
  marked so the student sees which part moved.
- **fits** — half; pair with the drill that makes them fill the slots.
- **can't** — only for patterns that are actually fixed. A frame with moveable parts teaches a false shape, and
  the student will build sentences that look like the frame and are wrong.


### `signalTable` — beat · cost A · evidence none — tests 0 · fun 1 · reuse 3

- **does** — The cue in the sentence, the choice it forces, one example each: `<cue>` → `<form it demands>`. This
  is the display form of the condition that decides the item, and it is what makes a rule usable without
  remembering a list of cases.
- **markup** — `.chart`, three columns (`<cue>` · `<what it forces>` · `<example>`), four to six rows. A
  `<tr class="note">` under it names the one cue that is a trap.
- **fits** — half, if the cues are short; full when examples are sentences.
- **can't** — no cue is decisive on its own; a table that reads "always" when the language only mostly does this
  teaches a false rule.

### `exceptionBench` — beat · cost A · evidence none — tests 0 · fun 1 · reuse 2

- **does** — The exceptions, grouped **by why they behave that way**, not listed as a set of facts to memorise.
  Two or three items, each `<form>` — because `<reason>`.
- **markup** — `.panel` with a short heading per group; two groups maximum. No table: an exception has a reason,
  and a table cell is too narrow to hold it.
- **fits** — half; pair with the practice block that uses both the rule and its exception.
- **can't** — if the exceptions have no shared reason, this block is a list of things to memorise and should be
  cut in favour of teaching them as separate items.

### `errorGallery` — section · cost A · evidence none — tests 0 · fun 2 · reuse 3

- **does** — Four or five sentences that **look** correct and aren't, each with the reason it fails. The fixes
  are not shown: the student meets those again in the practice that follows, so the gallery trains the mistake,
  not the correction.
- **markup** — `.panel`, one line per trap: the sentence in `<b>`, the reason under it in `lang="pt"` or plain
  English, numbered. Nothing else — a gallery with fixes in it is an answer key.
- **fits** — half, or full beside a `ruleCard`.
- **can't** — no production, and it is heavy with negatives; more than five traps in one gallery and the student
  remembers none of them.

### `beforeAfterStrip` — section · cost A · evidence none — tests 0 · fun 2 · reuse 3

- **does** — One meaning written twice: the version a student at this level actually produces, then the version a
  native speaker would. Both are grammatical — the difference is naturalness, not correctness — and that is the
  whole point of the pair.
- **markup** — two stacked `.panel`s with `<before>` / `<after>` labels, or `.itemrow` with the two half-width.
  The natural version carries the changed chunk in `<b>`.
- **fits** — half each, side by side.
- **can't** — must never show an ungrammatical "before", or it teaches an error as the starting point; and one pair
  makes one point — three pairs in a row is a lecture.

### `soundGrid` — beat · cost A · evidence none — tests 0 · fun 1 · reuse 3

- **does** — One contrast, shown in three positions: the same pair of sounds at the start, in the middle and at the
  end of a word, with a `.listen` chip on each example. Teaches that the contrast is a system, not two words.
- **markup** — `.chart`: rows are the two sounds, columns are the positions; each cell holds `<word>` plus a
  `.listen` chip. A `<tr class="note">` names the position where the student's own language interferes most.
- **fits** — full; it is three columns of examples plus labels.
- **can't** — it is listening and mouth-work only; no written form, and a grid with more than two sounds per row
  stops being a contrast and becomes a catalogue.

### `stressBar` — beat · cost A · evidence none — tests 0 · fun 1 · reuse 2

- **does** — The word broken into syllables with the stressed one marked, and **the rule that put the stress
  there** — which is what makes it transferable to the next word instead of a fact about this one.
- **markup** — `.panel`; syllables separated by a raised dot, the stressed syllable in `<b>`; one `.listen` chip for
  the whole word; the rule as one caption line under it.
- **fits** — third; two or three of them in an `.itemrow`.
- **can't** — English stress is only partly rule-governed, so a stress rule that has more exceptions than cases is
  worse than saying plainly that this one must be learned by ear.

### `spellingSoundMap` — section · cost A · evidence none — tests 0 · fun 1 · reuse 2

- **does** — The reverse direction of `soundGrid`: one sound, and the several spellings that produce it (or one
  spelling and the sounds it makes), each with an example. Makes reading predictable instead of memorised.
- **markup** — `.chart`, two columns (`<spelling>` · `<example word with a listen chip>`), grouped by position if
  position changes the answer.
- **fits** — half.
- **can't** — English spelling is regular in patterns, not in rules; if the honest answer is "these four, and no
  pattern", write that, or the block teaches a rule that will fail in the next paragraph the student reads.
### `scaleAxis` — beat · cost A · evidence none — tests 0 · fun 2 · reuse 3

- **does** — Items placed along a named continuum (`<weak>` ⟶ `<strong>`, `<formal>` ⟶ `<casual>`,
  `<always>` ⟶ `<never>`), with the ends labelled. Teaches degree where a rule would only give two boxes.
- **markup** — `.chart` used as a strip (one row, one cell per step) or a `.panel` with the items separated by arrow
  characters and the two ends in `<b>`. Every item keeps its `lang="pt"` gloss if the word is new.
- **fits** — full; a continuum needs the width to read as a line.
- **can't** — it claims an order. If two items could swap places without changing meaning, the axis is invented and
  must not ship.

### `collocationMatrix` — section · cost A · evidence none — tests 0 · fun 2 · reuse 3

- **does** — Two sets of words as rows and columns, with ticks showing what actually goes together. This is the
  block that stops translation-shaped errors, because a pair that "means the same" in both languages lands in the
  wrong cell here.
- **markup** — `.chart`: `<set A>` down the side, `<set B>` across the top, `✓` and `✗` in the cells, and a
  `<tr class="note">` naming the one cell students always get wrong.
- **fits** — half if both sets are three items; full at four or more.
- **can't** — ticks are not explanations; if a combination is blocked for a reason (not just by convention), a
  matrix hides it and the reason belongs in a `ruleCard` beside it.

### `falseFriendSplit` — beat · cost A · evidence none — tests 0 · fun 2 · reuse 3

- **does** — One word in the student's language that splits into two in English (or one English word that covers
  two things in the student's language), shown with **the test that decides which one** — a question the student can
  ask themselves in the moment.
- **markup** — `.panel`: the shared meaning on top, then each branch as `<English word> — <when it is the right one>`,
  a short example line under each, the drawing question pinned at the bottom in `<b>`.
- **fits** — half; pair with the drill that makes the student choose.
- **can't** — only for genuine splits; a word with one clean equivalent presented here invents a difficulty the
  language does not have.
### `audienceRow` — section · cost A · evidence none — tests 0 · fun 2 · reuse 3

- **does** — One message at three distances — a friend, an adult you know, an adult you don't — with **who you would
  say it to** as the label on each version. Teaches register as a choice with a reason, not as politeness points.
- **markup** — `.chart`: a `<when>` column naming the audience, a `<how it sounds>` column with the version. Two
  `<tr class="note">` rows if a form is wrong for one audience rather than merely odd.
- **fits** — full; three versions of one message do not fit across a half in readable type.
- **can't** — it presents the ladder without walking it; the student still needs a block that makes them pick the
  rung, or this is a poster about register.

### `sceneCast` — beat · cost A · evidence none — tests 0 · fun 2 · reuse 3

- **does** — Who is talking, where, what has already happened between them, and what is at stake — the facts that
  predict which language the scene will use. This is the block that lets a dialogue or a roleplay be one thing
  instead of four disconnected items.
- **markup** — `.card` with four labelled lines (`who` · `where` · `what just happened` · `what's at stake`). No
  dialogue yet: this block sets the scene, the next one uses it.
- **fits** — third or half; pair with a dialogue at the same width.
- **can't** — no language at all, so it is worth nothing without the scene it sets; and a cast list that only names
  people ("Ana, her brother") predicts nothing — the stakes have to be social.

### `dialogueMoves` — section · cost A · evidence none — tests 0 · fun 2 · reuse 3

- **does** — A short exchange where each turn is labelled by **what it is doing** (`open` · `hedge` · `push back` ·
  `concede` · `close`), so the student sees that a conversation has parts and that the parts have their own phrases.
- **markup** — `.dialog` for the exchange (speaker, turn), and beside or under each turn its move label. The move
  vocabulary must be named in the lesson before the labels appear.
- **fits** — full; two columns of text plus labels.
- **can't** — labels are metalanguage, not language; a student can label a hedge and still not produce one, so the
  block must be followed by a drill that makes them produce a move.
### `chatSample` — section · cost A · evidence none — tests 0 · fun 3 · reuse 2

- **does** — A short thread as it actually appears on a screen, with the target language in the middle of ordinary
  noise: a typo, an emoji, two messages in a row, a reply that ignores the question. The student meets the form in
  the wild before they are asked to use it.
- **markup** — `.dialog` with the thread (speaker bubble per line). A `<tr class="note">` or one caption line names
  what to look for — the block must say why it is on the page.
- **fits** — full or half; a thread is narrow, so half-width is natural beside the practice.
- **can't** — real material dates. If the lesson would break when the slang in it ages, use it as one example
  among several, never as the only presentation of a rule; and a thread whose every line is target language is a
  dialogue pretending to be a chat.

### `vocabField` — section · cost A · evidence none — tests 0 · fun 2 · reuse 3

- **does** — The lesson's new words arranged by **the job they do in the situation** (people · things · actions ·
  what you say · how it went), not as a numbered list with translations. A field is easier to use than a list
  because the student retrieves by meaning.
- **markup** — `.chart` with a `<when you need it>` column and the items in the cell; `lang="pt"` glosses only where
  the word is genuinely new. Ten items minimum across the clusters.
- **fits** — full; the columns are the teaching.
- **can't** — no drill, and a field with arbitrary headings is a list with extra lines; every cluster name has to be
  a situation the student will actually be in.

### `storyStrip` — section · cost A · evidence none — tests 0 · fun 3 · reuse 2

- **does** — Three or four short scenes carrying one continuous situation, with the target language embedded in
  each and getting slightly harder. The student learns the language *inside* a story instead of meeting it as
  examples, and later blocks can refer back to the scenes by name.
- **markup** — `.itemrow` of `.panel`s (or `.card`s), each with a scene number, two or three lines, and the target
  form in `<b>`. Sequential, so the order must read left to right and stack on a narrow screen.
- **fits** — full width, panels in an `.itemrow`; two or three per row.
- **can't** — a story is long, and length is not depth: if the scenes do not each teach something the previous one
  did not, it is decoration that pushes the practice below the fold.

---

# 7. Spines — how a page is shaped

A page fails when every lesson is the same order of the same blocks. A spine is the one thing the page is
*about*, chosen before any block is written; these are shapes that hold, not templates to rotate.

| spine | the page is… | beats | suits |
|---|---|---|---|
| **game-led** | one run through a single game, with the teaching pushed into the run itself | teach in the HUD → one game → debrief | a lesson with one clean binary distinction |
| **material-led** | built on one real thing (chat, clip, poster, sign) the student analyses | see the whole → find the pattern → reuse it | lessons about how language is actually used |
| **project-led** | the student makes something and learns what building it requires | the task → the pieces it needs → assemble | lessons whose vocabulary is a field, not a rule |
| **puzzle-led** | a lock, a grid or a text with holes that closes the section | the puzzle → the tools it needs → open it | revision, and any lesson that must consolidate |
| **interrogation-led** | the page keeps asking why, and each answer earns the next question | claim → counter-claim → rule | grammar that students think they already know |

The `reuse` scores above are the other half of the same fix: a vehicle at 2 or 3 can appear in consecutive
lessons, a vehicle at 1 or 2 cannot, and no lesson should be built from the same row twice running.

---

# What is not in this file

- **No lesson content.** Games skin authored HTML; the text lives in the lesson, never here.
- **No track voice.** Nothing here is silly, corporate or childish. A track's register (and its slang) belongs to
  the lesson, and to its own `<TRACK>-REGISTER.md`. A skin may be track-specific data; a mechanism never is.
- **No data contracts.** Element markup, anchors, persistence and engine contracts are in `FUNCTION.md`; layout and
  sizing are in `FORMAT.md`. This file only says which vehicle to reach for, and why not another.
