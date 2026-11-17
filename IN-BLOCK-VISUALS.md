# IN-BLOCK-VISUALS — what a block draws inside itself

The **host block** owns the container and the   control, and the figure is written to be dropped into a block that already exists. Every entry here takes the width of whatever host it lands in.

## [AUDIO] Plays a recording with lyrics and shows which line is being sung
- **markup**: a `.panel`; `<h3>` = the song's own title, never the vehicle's name; **`<h4>` = who performs it, and nothing else, italic because every `<h4>` is** — it is the block's credit line, and it is the last thing above the player. Inside: `figure.vz-play` with **no `figcaption`**, so nothing is printed above the `<audio>`; `<audio class="vz-audio" src="../assets/<name>.mp3" data-duration="<decoded length>" controls preload="metadata">`, `data-duration` being the length measured at authoring time, which the bar, the clock and `End` use (a browser's own `duration` for a VBR file is an estimate); the drawn controls — a `.vz-btn`, two `.vz-time` readouts, a `.vz-bar` with `.vz-fill` and `.vz-knob`, the bar `role="slider"` with `aria-valuenow`; `<ol class="vz-lyrics">`, one `<li>` per line, `data-t` in seconds on any line whose time is known. The native `controls` attribute is the floor: with no JavaScript the student still plays, pauses and scrubs, and `qa/player.js` removes it only after wiring the drawn bar, the keyboard (`←`/`→` five seconds, `Home`/`End`), click-a-line-to-seek and the lyric highlight. `data-kind="teach"`, no `load` — nothing is scored. At full width the same figure carries lines too long to hold at a half and the highlight still falls on one `<li>`. One optional `<p>` under the `<ol>` — content, not an introduction, so it is a paragraph and not an `<h4>` — one paragraph explaining the words and never the block, present only when the point is inside the words. **The `OPTION` slot sits inside this same `.panel`**: one `<h4>` naming what it holds, then any one content type — a `.chart`, an item list, a paragraph — omitted when the lesson has nothing to put in it, and never a `.panel` of its own.
- **source**: `qa/AUDIO.md` — the clip is cut by one command that prints this markup: the routes, the flags and their defaults, the steps, and the fix for a sync that is a second or two out are there. The song is chosen for the words the lesson needs, not for its title.

## [05] <SHOW|TRAIN> Street map for directions and relative locations < , > < , >
- **markup**: nothing but the drawing, inside the host block's own container — no `.panel`, no `<h3>`, no
  caption, no control of its own: the host's `input.gap` or `textarea` is the answer and the map is its stem.
  One inline `<svg>` in a `position:relative` wrapper; each place's tick is
  `<label><input type="checkbox" aria-label="the station"> 1</label>` in a `position:absolute` box at
  `transform:translateX(-50%)`, centred **under that place's own front, above the street it faces**, its
  `left`/`top` in `%` of the drawing. The tick marks the route as the student walks it and is **not saved**;
  the host's control carries the answer.
- **drawing — the standard it is held to** (a plan, the way a printed coursebook draws one):
  - **one ink, one paper, one accent.** Streets and outlines in `currentColor` at 2 units; block footprints
    filled at 8% of the ink; the accent appears once, on the route the student walks. Nothing else is
    coloured — which is also what makes it print.
  - **a street is a gap, not a wire**: a 10-unit stroke of paper under a 2-unit stroke of ink, so the street
    reads as the space between buildings; junctions closed with `stroke-linejoin:round`.
  - **two high streets crossed by two side streets** is the whole plan. Every street is named *in italic on
    the street itself*; a vertical street's name runs vertically down it.
  - **each place is drawn as the thing it is**, at one shared scale, flat: a platform under a canopy with a
    clock on the wall under a `STATION` board; a striped awning and a cup under `CAFÉ`; grass and two trees
    for the park; a pediment over four columns under `BANK`; a wall of book spines under `LIBRARY`; a postbox
    and an envelope over the door under `POST OFFICE`; a shelter on two posts with a bench; two striped
    awnings for the market. A name beside a rectangle is a diagram of the list under it; a sign inside the
    drawing is part of the place.
  - **no depth, no perspective, no shadow, no gradient** — a plan is flat on purpose
    (`CONTENT_EXAMPLES.md` `[VISUALS]`), and the only shading allowed is the 8% footprint fill.
  - **furniture at one corner**: a north arrow and a scale bar, in the same 2-unit ink, and nothing else.
  - **labels in HTML beside the drawing, never an `svg <text>`**, so they wrap and a screen reader reads them
    in order; only a one-word sign that must sit *at* a point lives inside the drawing.
- **info**: legible at half width or wider; a drawing that could be any building leaves the student naming the
  place from its sign after all, so each one carries the feature that identifies it; the signs close the
  alternatives, so a route with more than one reasonable answer needs both accepted; and it is never chosen as
  a block of its own, because nothing in it saves.
## [42] <TRAIN> Wordless panels with a line under each <4|6> <1|1>
- **markup**: one `.panel`; a `table.chart` of two columns and two rows, each cell a `<img src="../assets/<name>.<ext>">` (or an inline `<svg>`) at `style="width:100%"` (element-as-plate: inline `<svg>`, `<img>` from `assets/`) with an `input.gap` under it at `--gap-w:100%` — the picture fixes the event and the gap carries the sentence, and the strip reads left to right, top to bottom, because that is how the event happened. Every image is a local file in `assets/` and its source is named in the caption: a hotlink breaks on the day the host moves. **The block opens with one instruction line naming the tense** (`Describe what is happening in each picture, using the past simple`) — the tense is the exercise, and a strip that does not name one collects four free sentences. `data-kind="train"`.
- **info**: four panels that could sit in any order teach nothing about sequence, so a panel that could be described a hundred ways needs a stated element ("use *while*") or the marking is arbitrary.

## [50] <TRAIN> Chunks in the wrong order, and one box the student rebuilds the sentence in <3|8> <1|1>
- **markup**: a `.panel`; the sub-header is the task's own words (`Unscramble the sentence:`); the pieces are a centred row of `.chip`s whose number badges are set **smaller than the word**, spread at least **20px** apart so the eye reads six pieces and not one string; then **one full-width, centred `input.gap`** — one box for the whole sentence. A field per position asks the student to do the block's work twice. `data-kind="train"`.
- **info**: only sequences with one defensible order — a sentence with two defensible orders is a broken item, not a harder one; and it tests assembly, not meaning, since a student can rebuild a sentence they cannot translate.

## [69] <SHOW|TRAIN> One time axis: where a claim sits, and whether it reaches now < , > < , >
- **markup**: one horizontal axis where the only two numbers are `--now` (where the speaker stands) and the
  extent of a claim. Four kinds of mark: a **span** whose end says what the form claims (open arrow = still
  true now, closed bar = the period is over), a **point** for a single moment, a **wall** for a deadline, and a
  **field** for time the event sits inside. Present perfect is the span that reaches `now`; simple past is the
  same span stopping early, with the leftover drawn as **the gap to `now`** — the gap is the lesson, because it
  is what the student hears when they say *I saw it twice* to mean *I've seen it twice*.
- **markup, continued**: pure CSS geometry on inline custom properties — no `<svg>`, no script, no frame:
  `.tl` (the axis and its `--now`), `.tl-axis`, `.tl-mark` (open or closed end), `.tl-band`, `.tl-dot`,
  `.tl-tick`, `.tl-wall`, `.tl-now`, `.tl-field` / `.tl-under` (a mark's *meaning* decides whether it sits on,
  above or below the line), and `.tl-say`, the sentence the marks belong to. One class family, four sizes:
  `.tl` full with labelled rows, `.tl--half`, `.tl--third`, and `.tl--stamp`, small enough to sit **inside an
  answer option**. Words are linked to their marks by a `data-k` letter drawn twice — a superscript on the word
  and the head of its mark — so the pairing survives greyscale, print and a screen reader; colour is the fast
  path, never the only one. The `[63]` names (`.tlx`, `.tlx-mark`, `.tlx-band`, `.tlx-dot`, `.tlx-wall`,
  `.tlx-field`, `.tlx-pick`, `.tlx-build`) fold into this family — one component, one set of names.
- **markup, the two modes that save**: `.tl-pick` — which **word** carries the claim, the radio inside the
  word's own label, so the answer is the word; and `.tl-build` — three candidate axes, one radio per shape, so
  the claim is decided before it has a name. Everything else is display and is answered by the host's own
  radios or gaps.
- **info**: all four sizes, and the size is the job: full for the comparison, half for a past inside a past
  (`was cooking` / `rang`) or a bar that must reach a deadline wall, third and stamp inside the options so the
  student picks a shape and reads its name second — a naming question that cannot be answered from memory.
  It separates *where* an event sits and *whether it reaches now* and nothing else: it cannot show register,
  frequency or modal choice, and it cannot separate two forms that would draw the same shape — when that
  happens the block is wrong and the judgement belongs in a sentence. It also separates `since` from `for`,
  which no translation distinguishes: one measures a length (a span), the other plants a mark (a point). Two
  shapes carry the two claims Portuguese collapses — **recent**: the bar reaches `now` and its left end
  *dissolves*, because *lately* names no start (`I've been sick lately`); **field**: a hatched band **above**
  the line spanning birth to now with the event as a dot inside it, because *in my life* is a container you
  are somewhere inside rather than a duration (`I've been to Disney World`) — drawn as a field it cannot be
  misread as *still happening*. A timeline that needs its own frame is a poster; the same axis unframed under
  the sentence it explains is the teaching tool.
### [72] <SHOW|TRAIN> Shows at / on / in as a junction, a wall and an enclosure, then to / into / onto <3|3> <1|1>
- **markup**: one row of three `.panel`s, one small inline `<svg>` each, and the label under the drawing in
  HTML: `at` a dot standing on the junction itself; **`on` a poster stuck to a vertical wall** — contact with a
  face, seen from the side, because a thing on top of a thing is *em cima* and teaches the wrong picture; `in`
  a shape inside a closed outline. Then one row of three for the motion: `to` an arrow that stops short of a
  place, `into` an arrow crossing the outline, `onto` an arrow meeting the wall's face. Controls: radios
  pairing a sentence with the picture that matches it, then one `input.gap` per new scene of the same kind.
- **info**: a translation table gets `in`/`on` wrong, and the drawn version must show the concrete scene and
  never state one of them as a universal rule — *at the corner*, *on the corner*, *in the corner* all exist,
  so the block shows the three pictures and lets the sentence decide. `on` drawn on the side is the whole
  fix: with the object on top the student learns *em cima* and cannot use `on` for a wall, a page or a screen.
  Six scenes is one block; a ninth is a catalogue.
### [61] <SHOW|TRAIN> Moves active to passive as positions, not as two sentences <3|6> <1|1>
- **markup**: one bar, two rows. Active row: the actor large on the left, an arrow running to the small object on the right. Passive row: the object has moved to the left, a `be + V3` helper has appeared over the verb, and the actor sits at the far right behind a translucent `by` screen. two stacked `.panel`s with the changed element drawn in both rows and a dashed leader between its two positions (or one inline `<svg>`). Two panels alone would be two states; the leader line between them is the whole difference. `input.gap`s converting a given sentence, plus one item where the passive is the *wrong* choice — that judgement is the lesson, not the transformation.
- **info**: full; three positions plus a helper need the width. A seesaw implies the conversion is always available, when the real content is "passive when the actor is unknown or unwanted", so without that one item the block teaches a transformation nobody asked for.

## Underline each word's part of speech, generated from the sentence - `node qa/pos.mjs "<sentence>"` emits the spans

### [66] <SHOW|TRAIN> Draws the voice's rise and fall over the line it belongs to < , > < , >
- **markup**: one line of text with a contour over it tracing where the voice rises and falls, and a one-word label under the shape (`finished` · `waiting` · `asking` · `doubt`), because words describe a movement badly and a line describes it exactly. An inline `<svg>` path — no image file, no network — and the text beneath it, one glyph per syllable so the line's turns line up with the words. One contour at a time: two on one page are two different sentences. The contour is drawn inside the host block's item — the `.listen` chip on the line and the `input.gap` that asks which way the voice went (`up` · `down` · `up then down`) belong to that item, which is why the figure carries no counts of its own — because a contour over a line the student cannot hear is an abstraction.
- **info**: third or half inside a host block, full only when the sentence is the page's material. It shows the shape and proves nothing: without the clip beside it this is decoration, and a contour drawn for a pattern the lesson never named teaches a movement the student has no name for.

- **rhythm too**: the contour is the page's only drawing of the beat — where the voice lifts, where it lands
  and how long it holds. Paired with the key (`[67]`) it shows a word's tune *and* its sounds, and paired with
  `.mk-stress` (`[64]`) the loud syllable under the rise is one picture, not two. Draw one contour per
  sentence; a second on the same page is a second sentence, and a page of contours teaches nothing.

### Sets a pronunciation key above the words of a line -`<p>` (element-as-plate: `ruby`/`rt`); each word wrapped as `<ruby>thought<rp>(</rp><rt>thawt</rt><rp>)</rp></ruby>` — key is copied from `dictionary.json`

- **the dictionary is the source and the `rt` is a copy of it**: the popup's 📖 Pronunciation 🔑 calls
  `PronKey.lookup` on the selection; `rt` is that key set inline.
`PronKey.render`
  expands the compact notation for the popup (`-` a syllable break, `[x]` a letter written and not said, `ə`
  schwa); the same three conventions apply inside `rt`, so a reader who has seen the popup recognises the key
  on the page. What the two do differently: the popup keys **any selection and saves it for the student** and
  shows the full notation; `rt` keys **one word in the line it is teaching**, prints with the sentence and
  survives a copy. Neither marks stress, so a syllable pattern needs `[64]` or `[69]`.
