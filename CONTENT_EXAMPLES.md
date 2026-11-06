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

## Art rules (binding on every game)

`shootPair` exists and its logic is fine; its **appearance** is the known failure. These rules are how the whole
set gets fixed at once, and why a new game must not be authored to look like that.

1. **One flat vector language.** Solid geometric shapes, 2px strokes, no gradients, no bevels, no shadow-blur,
   no emoji, no clip-art, no skeuomorphism. A circle and a rounded rectangle, used well, look intentional.
2. **One palette per track, three colours max** — two neutrals + one accent — declared once as CSS custom
   properties on `.game` so a skin changes colours, not code.
3. **Motion is `transform` + `opacity` only**, with real easing (`cubic-bezier`, never `linear`), and a
   reduced-motion path that removes travel and keeps the state change. No layout reflow, no `left/top` animation.
4. **Everything scales off the stage width**, so a `.itemsize-half` game looks the same as a full-width one.
5. **Shared stage + HUD**: every game reuses the same stage box, score line, timer and end-of-wave summary, so
   one art fix upgrades the whole set and no page grows a second visual dialect.
6. **The page must still teach if the engine fails to load.** The authored `.qitem`s are ordinary radios: they
   render and save with no JS at all. That is the fallback, and it is not optional.

---

# 1. Games — arcade and reflex

The player's hands do the work: aim, time, catch, dodge. Each one drives ordinary `.qitem`s, so the answer
that saves is the same radio a plain page would have.

### `skeetRange` — section · cost B · evidence radio — tests 2 · fun 3 · reuse 2

- **does** — One moving target per item. Player aims with the cursor and takes **one shot**; a hit scores, a
  miss is spent. No spray, no endless retry — the constraint is what makes it feel like skill.
- **skins** — `.game > .game-list` of `.qitem`; the stem is the prompt line, the options are the targets.
- **art** — one flat ring or disc per option, drifting on a slow eased arc; a thin crosshair; a single puff on
  impact. This is the intended replacement path for `shootPair`'s look, not another game beside it.
- **can't** — no production, no spelling; one shot per item means a careless click can hide what the student knew.
- **needs** — shared runner (or `shootPair` refactored into it).

### `whackMole` — section · cost B · evidence radio — tests 2 · fun 3 · reuse 2

- **does** — Targets pop up from holes on a timer; the player taps the one that fits the prompt before it drops.
- **skins** — same `.qitem` list; one pop per item, options distributed across holes so position never hints.
- **art** — flat circles in three rows of holes; pop is scale-up with a squash-back, nothing else moves.
- **can't** — recognition only; speed pressure makes it a poor fit for anything needing reflection.
- **needs** — shared runner.

### `brickRight` — section · cost B · evidence radio — tests 2 · fun 3 · reuse 2

- **does** — Breakout. The paddle follows the pointer; the ball knocks out the brick carrying the right option.
  Wrong bricks cost a ball. A real game with real stakes, and the physics is two rectangles and a vector.
- **skins** — `.qitem` options become brick labels; the prompt stays on the HUD line.
- **art** — flat rounded rectangles, one accent colour per correct-state, dotted ball trail.
- **can't** — one hand is on the paddle, so the reading load must be tiny; long options break the geometry.
- **needs** — shared runner + a collision loop.

### `catchBasket` — section · cost B · evidence radio — tests 2 · fun 3 · reuse 3

- **does** — Words fall; the player steers two or three labelled baskets and must catch each word in the
  category that fits. This is the *sorting* idea with real game pressure, which is what a bucket table lacks.
- **skins** — each `.qitem` option is a falling token; each basket is a radio; catching dispatches the same
  `input`/`change` a click would.
- **art** — flat trapezoids for baskets, small rounded tokens, one gravity curve, no bounce chaos.
- **can't** — only two or three categories survive the screen; fine distinctions don't fit.
- **needs** — shared runner.

### `stackDrop` — section · cost B · evidence radio — tests 2 · fun 3 · reuse 2

- **does** — A block slides left and right; the player drops it inside the marked gap. A drop in the gap earns
  the item; a miss narrows the gap. Timing skill, then the item is answered normally.
- **skins** — a `.qitem` per level; the label on the block is the stem.
- **art** — flat rectangles, hard edges, a rising stack. Six levels, then an end screen.
- **can't** — timing dominates; keep the language load per level to a phrase.
- **needs** — shared runner.

### `flapGate` — section · cost C · evidence radio — tests 1 · fun 3 · reuse 2

- **does** — One-button flight; the player passes through the gate labelled with the right option. Contact
  with a wrong gate costs a life.
- **skins** — gates are options; the prompt is fixed on the HUD.
- **art** — two flat rounded rectangles per gate, a square avatar, sky as a flat fill. Nothing else.
- **can't** — recognition at speed only, and it is the most expensive of the arcade set.
- **needs** — shared runner + gravity loop.

### `raceLane` — section · cost B · evidence radio — tests 2 · fun 3 · reuse 3

- **does** — Answer to accelerate. Correct answers push the avatar toward the finish; wrong ones stall it. The
  ghost of the student's best run is the opponent, so there is competition without a server.
- **skins** — any existing drill; the game only adds a track, two avatars and a timer.
- **art** — two flat bars, a finish line, a lap counter. Cheapest strong game in the list.
- **can't** — rewards speed, so it flatters a guesser; pair with a producing block.
- **needs** — shared runner + the existing `data-limit` timer.

---

# 2. Games — puzzle and logic

Slower, thinking games. No timer pressure; the tension is deduction.

### `lockCode` — page · cost B · evidence gap — tests 2 · fun 3 · reuse 3

- **does** — The section is an escape room. Each correct answer releases one digit; three digits open the next
  block. Turns loose exercises into one thing the student is trying to do.
- **skins** — `input.gap` per answer; the code display reads the gaps that are already there.
- **art** — three flat digit boxes that fill with a hard cut, then a bar that slides open once.
- **can't** — needs a section whose answers reduce to one character; housekeeping, not teaching.
- **needs** — `none` (markup + ~40 lines to read the gaps).

### `wordleBoard` — section · cost C · evidence gap — tests 3 · fun 3 · reuse 3

- **does** — The student guesses letters; the board marks right letter/right place, right letter/wrong place.
  Hangman is the same engine with a different face (a revealed blank row instead of coloured tiles).
- **skins** — one target word per item, typed into a `gap` at the end, so the evidence is spelling the student
  produced rather than letters guessed.
- **art** — a flat 5×6 tile grid, two terminal colours and one absent colour; no drawn keyboard, use the native one.
- **can't** — only words of one fixed length; nothing for phrases, meaning or listening.
- **needs** — shared runner + a letter-state machine.

### `pairFlip` — section · cost B · evidence radio — tests 1 · fun 3 · reuse 2

- **does** — Memory pairs: flip two cards, keep them if they belong together. Six pairs is one screen.
- **skins** — pairs are the `.qitem` stem↔option links; a match checks that radio.
- **art** — flat rounded rectangles with a hard flip, one accent edge, no motif on the backs.
- **can't** — recognition of a pair only; it teaches nothing about producing the form.
- **needs** — shared runner.

### `mineGrid` — section · cost B · evidence radio — tests 2 · fun 2 · reuse 2

- **does** — A grid of tiles; opening one reveals a claim and the student judges whether it is sound. One tile
  hides a trap. Reveal the field without setting it off.
- **skins** — tiles are options; the judgement is the radio.
- **art** — flat squares, one accent on open tiles, a hard crack on the trap. No numbers, no flags.
- **can't** — binary judgement only; four-way choices need a different frame.
- **needs** — shared runner.

### `crosswordBoard` — section · cost C · evidence gap — tests 3 · fun 2 · reuse 2

- **does** — A small authored crossword; clues are the stems, answers are the gaps.
- **art** — flat grid, black blocks, one accent on the current word.
- **can't** — the most expensive vehicle here, and Portuguese/English letter counts rarely cross cleanly; worth
  building only for a lesson whose vocabulary is the point.
- **needs** — a grid renderer plus a layout check.

---

# 3. Games — memory and listening

The ear does the work. Both need the built-in voice, not a rendered clip.

### `echoPads` — section · cost B · evidence gap — tests 2 · fun 3 · reuse 2

- **does** — Four pads, each tied to one item's audio. The engine plays a sequence; the student repeats it by
  pressing the pads in order. Sequences grow each round. Simon, with language instead of tones.
- **skins** — pads are the `.qitem`s; the order the student pressed is written into consecutive `gap`s.
- **art** — four flat squares that light on press, one colour per pad; nothing else on screen.
- **can't** — memory span caps the round at about five; no written form involved.
- **needs** — shared runner + `playSay`.

### `bingoCard` — section · cost B · evidence radio — tests 1 · fun 3 · reuse 2

- **does** — The voice calls items in random order; the student taps them on a 3×3 card. Lines win.
- **skins** — a 3×3 slice of a `.qitem` set; every tile is the radio that records the call.
- **art** — a flat 3×3 grid, a hard stamp on a marked tile, one animated line when a row completes.
- **can't** — recognition only, and it needs nine items to fill a card.
- **needs** — shared runner + `playSay`.

---

# 4. Games — quiz-show and stakes

No motion; the game is progression and risk. Cheapest of the set and they suit every track.

### `ladderRun` — page · cost B · evidence radio — tests 2 · fun 3 · reuse 2

- **does** — A ladder of questions with rising stakes, a safe rung every five, and two lifelines: drop two wrong
  options, and ask the audience (shows the class's own tally). A wrong answer drops to the last safe rung.
- **skins** — a `.qitem` list plus one `gap` for the final typed answer.
- **art** — a flat vertical ladder, two colours, a moving marker. No currency icons.
- **can't** — one long arc, so it wants to be the page's quiz, not a mid-lesson drill.
- **needs** — shared runner.

### `boardQuiz` — page · cost A · evidence radio — tests 2 · fun 3 · reuse 3

- **does** — A grid of categories by difficulty; each cell opens one item. Points awarded, two players or teams
  alternate. The one structure that works offline with a teacher driving it.
- **skins** — a matrix of `.qitem`s; the cell is a jump link, the item is ordinary.
- **art** — a flat grid, one accent per column, hard flip in the cell.
- **can't** — the difficulty axis has to be real, or a column is just an arbitrary label.
- **needs** — `none` (markup + jump links).

### `spinPick` — beat · cost B · evidence none — tests 0 · fun 2 · reuse 3

- **does** — Chooses which item comes next: a wheel or a slot lever. Removes the "1, 2, 3" march and makes the
  order feel live. Two skins, one mechanism.
- **skins** — the `.qitem` order; the chosen item is answered normally right after.
- **art** — flat wheel with even segments and a hard stop, or three reels that land together.
- **can't** — carries no answer at all; always a companion to a real block.
- **needs** — `none`.

### `bossRaid` — page · cost C · evidence radio — tests 2 · fun 3 · reuse 2

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

# 6. Spines

A page fails when every lesson is the same order of the same blocks. A spine is the one thing the page is *about*,
chosen before any block is written; these are shapes that hold, not templates to rotate.

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
