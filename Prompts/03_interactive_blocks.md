# INTERACTIVE DIRECTIVE PLACEHOLDERS

Do NOT write raw game DOM, audio players, or SVG code. Output clean semantic HTML comment blocks containing the raw pedagogical content so the downstream build pipeline can fetch assets and skin the widgets automatically.

## Pacing Rules
- **Explanations:** Write complete, thorough prose (`<p>`, `<h2>`, `<h3>`, `<ul>`) first. Do not truncate an explanation if a concept needs half a page to make the underlying pattern click.
- **Training:** A directive wherever the section it trains ends, and as many as the lesson's teaching needs — there is no count and no quota, and no lesson owes a game. Training is thorough and the student should be comfortable and well-practiced with the lesson concepts and vocabulary when they finish.
- **No game directive.** A game is a skin over an activity, never a type of its own: choose the activity, and the renderer reskins it where a game is materially better.

## Placeholder Formats

### 1. Training Activity
```html
<!-- TRAIN_HERE: type=fill
Q1: I ___ from Brazil. | am
Q2: She ___ tired. | is
-->
```
- `type` names what the student must do, and nothing else:
  - `mc` — one right answer among the wrong ones: a word, a form, a meaning or a fact.
  - `fill` — typing the exact form into the sentence that needs it.
  - `matching` — pairing each item with its meaning from one shared pool.
  - `chunks` — rebuilding a sentence from its pieces, word order under pressure.
  - `correction` — finding the one word that is wrong and writing the sentence again.
  - `translation` — the Portuguese into the English the lesson taught, or the English back into Portuguese.
  - `dictation` — hearing a sentence once and writing it down.
- Every directive carries its stems with their answers, whatever the type. What an answer looks like is the type's business — a letter for `matching`, an order for `chunks`, a sentence for `correction`, a spoken line for `dictation` — and `|` separates two accepted forms.
- An item never uses vocabulary the lesson has not taught.

### 2. Closing Quiz
```html
<!-- QUIZ_HERE:
Q1: ... | answer
Q2: ... | answer
-->
```
The same item format, gathered in one block at the lesson's end when the lesson wants one, drawing only on what the lesson taught.

### 3. Music Clip Hook (When teaching rhythm, reductions, contractions, or slang in the wild)
- **Song Selection:** Pick a **real, recognizable song** that genuinely contains the exact grammar rule, contraction, or connected-speech reduction being taught, matching the track's register (`kids` = clean pop/viral/gaming hits; `business` = clean mainstream pop/rock/soul; `adult` = hip-hop, R&B, rock, or unfiltered street tracks).
- **Pedagogical Integration:** Tie the song directly into the lesson's teaching prose—introduce why the line is a great example of the rule, show how the singer actually pronounces/reduces the words at speed (run that lyric through `PRONPARSE.md` and paste its answer), and place the `MUSIC_HERE` directive right where the clip should play.

```html
<!-- MUSIC_HERE:
SONG: Exact Song Title
ARTIST: Exact Artist Name
TARGET_LYRICS: Exact 1-2 lyric lines containing the target grammar/reduction
PRONPARSE_BREAKDOWN: Run the reduced/linked words of TARGET_LYRICS through PRONPARSE.md and paste its answer
EXPLANATION: One tight paragraph explaining the words, reductions, and rhythm in that specific lyric—never mention the UI player
-->
```

### 4. Map Reference (directions, prepositions of place, relative positions)
- There is **one map and its layout is fixed**: a 3×3 grid of nine places divided by four streets, drawn once and copied by pass 2 exactly as it stands. Write every spatial example against these names — never invent a place, a street, or a layout.
  - **The four streets:** *High Street* and *Low Street* run across, between the rows — High Street above the middle row, Low Street below it. *Mill Lane* and *Park Lane* run down, between the columns — Mill Lane between the left and middle columns, Park Lane between the middle and right.
  - **The nine places, by column and row:**

    | | left | middle | right |
    |---|---|---|---|
    | **top** | the station | the café | the park |
    | **middle** | the bank | the library | the post office |
    | **bottom** | the bus stop | the market | the hotel |

- `PLACES:` names the places the examples below use, taken from that grid; `TARGET_EXAMPLES:` carries the sentences. Pass 2 inserts the drawing verbatim and writes nothing inside it, so a lesson that needs a place the grid does not hold asks about one that it does.
- Tie the spatial examples directly into your lesson prose, then place the directive where the map should render:
```html
<!-- MAP_HERE:
PLACES: the café · the bank · the library
TARGET_EXAMPLES: 2-3 example sentences grounded in those places
-->
```



### 2. Music Clip Hook (When teaching rhythm, reductions, contractions, or slang in the wild)
- **Song Selection:** Pick a **real, recognizable song** that genuinely contains the exact grammar rule, contraction, or connected-speech reduction being taught, matching the track's register (`kids` = clean pop/viral/gaming hits; `business` = clean mainstream pop/rock/soul; `adult` = hip-hop, R&B, rock, or unfiltered street tracks).
- **Pedagogical Integration:** Tie the song directly into the lesson's teaching prose—introduce why the line is a great example of the rule, show how the singer actually pronounces/reduces the words at speed (run that lyric through `PRONPARSE.md` and paste its answer), and place the `MUSIC_HERE` directive right where the clip should play.

```html
<!-- MUSIC_HERE:
SONG: Exact Song Title
ARTIST: Exact Artist Name
TARGET_LYRICS: Exact 1-2 lyric lines containing the target grammar/reduction
PRONPARSE_BREAKDOWN: Run the reduced/linked words of TARGET_LYRICS through PRONPARSE.md and paste its answer
EXPLANATION: One tight paragraph explaining the words, reductions, and rhythm in that specific lyric—never mention the UI player
-->
```

### 3. Map Reference (For prepositions like `at` vs `in`, directions, relative positions)
- Tie the spatial examples directly into your lesson prose, then place the directive where the visual map should render:
```html
<!-- MAP_HERE:
SCENE: Brief description of the spatial layout/landmarks needed
TARGET_EXAMPLES: 2-3 example sentences grounded in that map scene
-->
```
