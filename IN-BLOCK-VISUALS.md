# IN-BLOCK-VISUALS — IN BLOCK elements for broad re-use (DRAFTS, not in the menu yet)

Moved here from `CONTENT_EXAMPLES.md`, which now holds the vehicles only: these are the figures that sit *inside*
a block, with the rule every one of them follows.

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
- **built from** — one `.panel`, one inline `<svg>` of boxes and connectors,
  labels as HTML beside the nodes.
- **ends in** — 3–5 `.qitem`s: a sentence pair as `.qstem`, the leaves as radios. The tree comes first, because FORMAT
  forbids asking for a judgement on an axis the page has not defined.
- **fits** — full only; a branch diagram at a third is a scribble. Three levels max.
- **the risk** — a real `which`/`that` choice is register and rhythm, not logic. Any leaf that pretends it is binary
  teaches a rule that fails in the next paragraph the student reads.

#### `literalSplit` — an idiom as literal scene vs figurative meaning (draft)

- **draws** — one row, two halves: the absurd literal reading on the left, what it actually means plus one real usage on
  the right.
- **built from** — `.itemrow` of two `.panel`s plus one small inline
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
- **the risk** — a translation table gets `in`/`on` wrong; the drawn
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
  positions (or one inline `<svg>`). Two panels alone would be two states; the leader line between them is the whole
  difference.
- **ends in** — `input.gap`s converting a given sentence, plus one item where the passive is the *wrong* choice — that
  judgement is the lesson, not the transformation.
- **fits** — full; three positions plus a helper need the width.
- **the risk** — a seesaw implies the conversion is always available, when the real content is "passive when the actor is
  unknown or unwanted". Without that item the block teaches a transformation nobody asked for.

#### `levelGauge` — a filled gauge in front of an existing scale (draft)

- **draws** — the same axis `politeLadder` already draws, with a filled level or a marker instead of a bare row
  of cells: modal certainty, adverb frequency, or a register gradient from faint disagreement up to open contempt.
- **built from** — an inline `<svg>` track plus one filled bar plus an optional marker; the fill is authored data. A real
  `input type="range"` cannot ship: only radios, `input.gap` and `textarea` save, so a slider would look interactive and score
  nothing.
- **ends in** — radios ("which rung fits this hearer") with the hearer in the `.qstem`; the gauge is then the display half
  of that choice.
- **fits** — full; a continuum needs the width.
- **the risk** — this is the idea on the list that is mostly already built (`politeLadder`, plus the register pair in
  `registerContrast`), so the honest version is a level field on `politeLadder`, never a ninth scale block. And
  a disagreement gradient's top rungs are register and risk, not vocabulary: they belong to a track whose persona allows them,
  and the block has to show *who you may say it to*, not how far up the scale it sits.

#### `melodyContour` — the voice's movement drawn over the line (draft)

- **draws** — one line of text with a line over it tracing where the voice rises and falls, and a one-word label under the
  shape (`finished` · `waiting` · `asking` · `doubt`): words describe a movement badly, a line describes it exactly.
- **built from** — an inline `<svg>` path (no image file, no network) and the text beneath it, one glyph per syllable so
  the line's turns line up with the words. One contour at a time — two on one page are two different sentences.
- **ends in** — a `.listen` chip on the line itself plus one `input.gap` per turn asking which way the voice went
  (`up` · `down` · `up then down`), because a contour over a line the student cannot hear is an abstraction.
- **fits** — third or half inside a host block; full only when the sentence is the page's material. It sits here rather
  than in the block list because it has no item of its own — the host block asks the questions.
- **the risk** — it shows the shape and proves nothing. Without the clip beside it this is decoration, and a contour drawn
  for a pattern the lesson never named teaches a movement the student has no name for.

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