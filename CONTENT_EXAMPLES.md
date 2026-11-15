# CONTENT_EXAMPLES — A menu of **mechanisms** and skins for content authored in the page's HTML

The menu this file used to be is now three files: **`VEHICLES.md`** (whole blocks, plus the `## [TIPS]` section),
**`IN-BLOCK-VISUALS.md`** (the figures a block draws inside itself), and this one — the build rules both read
from (`[GAMES]`, `[BLOCKS]`, `[VISUALS]`, `[INSTRUCTIONS]`) and the shapes not yet migrated.

## [BUILD] - Ignore this section for lesson generation

### [GAMES]
1. There is **no house style**. Look, palette, motion and mood are chosen per game.
2. **The page must still work if the engine never loads.** The authored `.qitem`s are ordinary radios: they render, save and print with no JS. That fallback is not optional.
3. **No network at run time.** Art is CSS, inline SVG, or a local file. Nothing fetched from another host, so a page that ships today still renders in two years.
4. **Fits its slot.** A vehicle or stage has a defined .itemsize or range of .itemsizes with which it is compatible and never overflows.
5. **Reduced motion is honoured** — `prefers-reduced-motion` removes travel and keeps the state change, so the game still tells the student what happened.
6. **Cheap frames.** Animate `transform` and `opacity`; avoid animating layout properties, which jank on a school laptop.
7. **Difficulty and content are data.** Every game reads its items from the page and its knobs from `data-*` attributes, so a teacher can add items or change difficulty without editing an engine.
8. **The content in the page.** Games drive authored `.qitem`s (stem + optional `.listen` + radios), `input.gap`, or a textarea — nothing else. Whatever the engine animates is presentation; the saved answer is always one of those controls. If a mechanism cannot end in one, it is not a vehicle, it is a decoration. 
    
### [BLOCKS]
- **A figure is optional.** The cheapest visual for a point inside a phrase is a class on the phrase, not a picture, and a picture that only repeats the sentence is worse than the sentence. Draw when the point is *where something is* or *how something moves*.
- **If the beat is scored, a control saves it.** `.qitem` radios, `input.gap` and an authored `textarea` are what the engine records; a slider, a hotspot, a hover-reveal or a `<details>` looks interactive and records nothing. A figure may illustrate an item and never stands in for the control — and an item with no figure at all is the normal case.
- **CSS is fair game.** `style.css` for anything a lesson page will use, `qa/preview-visual.css` while a shape is still a draft. A new **top-level block** class is not width-checked by anything today (`qa/overflow.mjs` was retired 2026-11-14), so open the page and look at it; an inline span needs no check, because it cannot widen a block.
- **Where a label lives is per figure.** An HTML label reflows, wraps at any width and is announced by a screen reader; an SVG `<text>` stays at a fixed point in the drawing but cannot wrap and is read out of order. Prose-length labels go in HTML beside the figure; a one-word mark that must sit *at* a point (a gap, a `1`) may live inside the drawing.
- **Every shape here is prototyped as real markup** in `qa/preview-blocks.html`, under its own `<section class="qa-item" id="item-NN">`, so a build copies a working thing rather than a description of one.

### [VISUALS]
- **Depth, in this order of importance.** **Occlusion** first — the near face painted over what is inside, so a ball in an open tin loses its bottom while a ball on the closed lid keeps its whole circle: this is the cue that separates *in* from *on*. Then **the opening** — an ellipse filled dark says you are looking into something, without a single perspective line. Then **a contact shadow** — an ellipse the object sits on, not a circle floating in space. The primitives are `.lid`, `.side`, `.cav`, `.shadow`, `.screen`, and every figure that needs depth draws its near face **last** for exactly that reason.
- **Flat on purpose** where depth would add noise: an abstract diagram (a decision tree, a single time axis, a gauge) and a true sagittal section, which is a genuinely 2-D object.
- **Inline marks — the phrase is the figure.** Most of what a lesson shows about pronunciation is a property of one or two letters inside a sentence: which syllable is loud, where the tune turns, which sound joins the next word, which letter is written and not said. That needs a `<span>` with a class and no figure at all — it fits a full panel and a `.third` column without a width decision, prints black and white, cannot overflow, stays glued to the word if the sentence is edited, and is the only visual that survives a screen reader with its meaning intact. All of it `.mk-*`, all of it due in `style.css`:

| class | draws | suits |
|---|---|---|
| `.mk-stress` | a filled dot above the syllable | stress placement, `RE-cord` against `re-CORD` |
| `.mk-rise` / `.mk-fall` | a small ↗ or ↘ at the point of the turn | intonation, statement against question |
| `.mk-link` | a dotted tie between two words | connected speech, `an_apple`, `go_on` |
| `.mk-drop` | a struck letter | a letter written and not said, `Wed(d)nesday`, `(h)our` |
| `.mk-syl` | a thin rule between syllables | syllable counting, `com|pu|ter` |
| `.mk-pair` | a highlight with an underline | the two letters that differ, `s(i)t` / `s(ea)t` |
| `.mk-slow` | opened letter-spacing | a sound held longer, `so(oo)n` |

- **The shape carries the meaning; colour only reinforces it.** A dot, an arrow, a tie, a strike and a rule are five different shapes, so a grey print, a projector or a red/green confusion still reads all five. `posMarks` adds the same rule to underlines: the line style separates the classes and the colour reinforces it.
- **The mark never replaces the control.** A marked sentence is still an item: `.qitem` radios whose stem carries the marks, or an `input.gap` sitting inside the phrase, which is the same insight as the mark. Display alone records nothing.
- Authoring is one span at the point of the mark, empty where the mark is the whole content:
```html
<p>I <span class="mk-stress">RE</span>cord it, then we
   <span class="mk-pair">s</span>it on the <span class="mk-pair">s</span>eat<span class="mk-rise"></span></p>
```
- **The element-as-plate list** — where the element itself is the teaching device, the element *is* the plate and needs no class: `ruby`/`rt` (the pronunciation key over a word, `[67]` and style.css `#92`), `figure`/`figcaption` (a picture and its line), `<s>` (a rejected line, an erasure), inline `<svg>` (a drawn map, timeline, mouth), `<img>` from `assets/` (a photograph, sign or form). An image is always a local file (`[GAMES] 3`), and a vehicle whose `markup` uses any of these names the ones it uses.
- **Two reading supports, two jobs — never the same one twice.** The **key** goes *over the word*: `<ruby>record<rp>(</rp><rt>ri-córd</rt><rp>)</rp></ruby>`, one word at a time, `rp` never omitted, `rt` in `dictionary.json`'s notation (`[67]`, style.css `#92`). The **meaning** goes *behind a click*: `<button type="button" class="glossbtn" popovertarget="d1">what does that mean?</button>` then `<div class="defcard" popover id="d1"><b>clock in</b>…</div>`, which opens beside the word with no script (style.css `#91`). Use the gloss for a **new word**, and above all where the **literal Portuguese is not its meaning or its use** — `clock in` is *bater o ponto*, not *entrar no relógio* — or where the author expects the phrase to be read wrong; a word whose translation is exact and obvious gets none. One card per word, one meaning per card, and neither support replaces the control that saves the answer.
- **Outside art: vendored, never hotlinked** (`[GAMES] 3`), so an outside picture means downloading the file into this repo, with provenance and licence in `assets/README.md`, referenced as `../assets/<name>.<ext>` and captioned with its source on the page that uses it. **The licence travels with the file** — a share-alike plate means a recoloured or highlighted derivative carries the same licence. And **a real anatomical plate teaches anatomy, not articulation**: nothing licensed shows where *this* student's tongue must go, so the arrow, the highlighted path and the Portuguese instruction line do that; draw the schematic and use outside art as the accuracy reference.
	
## [INSTRUCTIONS] for selection and implementation
- **A menu, not a checklist.** Nothing here is required in any lesson or in any order; a vehicle is used when it is the optimal way to present content the build already has.
- **Shape is the vehicle's use, in four atoms** joined by `|`. A combination means exactly the union of its parts and carries no definition of its own.
	- `TEACH` -> Explains, elaborates , gives translations, or otherwise passes understanding or knowledge to the student.
	- `TRAIN` -> Any activity that makes the student utilize their knowledge.
	- `SHOW` -> Presents or demonstrates but does not 'teach' - must be combined with another vehicle that [explains or uses] it as a [teaching or training] example, which is why it is never a shape on its own.
	- `OPTION` -> The block declares, in its **markup**, a designated slot *inside its own container* — the same `.panel` or `.card` — that may hold any one content type, or another vehicle's markup. The slot never becomes a container of its own.
- **Headings are the index.** Every `### ` heading reads `[NN] <shape> <itemsize> <what it is and/or does> <items> <options>`. `itemsize` is the block's default width as the stylesheet names it (`full`, `half`, `twothird`, `third`, `half->`, `third->`). In the counts, omit either number when it does not apply — `<3|>` is three or more with no ceiling, `<|4>` at most four — and write `< , >` when neither applies. The phrase is in the third person, naming **wha	t the vehicle does** and/or what the **student** does("the student ranks…", "…a box the student fills"), never left implied by an imperative, which reads equally as a build instruction and as a task. `node qa/brief.mjs` prints this index; the lines under a heading are read only **after** a shape is chosen (`qa/brief.mjs --section=NN` prints one).
- **The tone of a lesson comes from the lesson's copy, never from here.** Every vehicle is track-neutral.
- **`<h3>` and `<h4>`.** `<h3>` begins with a letter by its order in the section, and is followed by the text the vehicle's **markup** defines it to be — or, where markup defines none, a super-minimal phrase that names the block's function or contents, never filler. `<h4>` is mandatory when the vehicle's **markup** defines one, and otherwise an optional one-line explainer of the contents that never restates `<h3>`. **A block's introduction or explainer is an `<h4>` and never a `<p>`**: `<p>` inside a block always carries the block's own content, so the element alone says whether a line introduces the block or *is* the material.
- **The saved answer is always a control**: `.qitem` radios, `input.gap` or a `textarea`. A figure, a mark, a fold or a highlight shows; it never scores, and an entry that cannot end in one of the three is not a vehicle.
- **A figure with no item of its own is not a vehicle.** Where a drawing, a mark or a highlight has nothing that saves, the *host* block owns the container and the control and the figure is drawn inside it — `[INSIDE]` lists them, and it is the whole of that list. Such an entry carries `< , >` for both counts, is never chosen on its own, and is written to be dropped into a block that already exists.


### [07] <TEACH> <FULL> One contrast across three word positions <2|4> <3|3>
- **markup**: one `.chart` whose first column is the written form and whose other columns are the positions (start, middle, end), each cell a word with its own `.listen` chip. Where a written form belongs to Portuguese rather than to English — `x`, `ti`, `ão` — the marker carries **both** `class="pt"` and `lang="pt"`, so it is italic and in the Portuguese colour: the reader sees at a glance that the row is their first language, and no cell ever says so in parentheses. `data-kind="teach"`.
- **info**: it is listening and mouth-work only, it never hands the student a phonetic symbol this project does not use, and a grid with more than two sounds per row stops being a contrast and becomes a catalogue.

### [55] <SHOW|TRAIN> <FULL> IGNORE - pending updates — Draws a relative-pronoun decision tree the student answers from <3|5> <4|5>
- **markup**: a root question, three yes/no nodes, leaves that are choices (`who` · `which/that` · `whose` · no pronoun at all), and one leaf that is deliberately "either — and here is what changes". One `.panel`, one inline `<svg>` of boxes and connectors, labels as HTML beside the nodes. Three to five `.qitem`s: a sentence pair as `.qstem`, the leaves as radios. The tree comes first: a judgement cannot be asked for on an axis the page has not defined.
- **info**: full only — a branch diagram at a third is a scribble, and three levels is the maximum. A real `which`/`that` choice is register and rhythm, not logic, so any leaf that pretends it is binary teaches a rule that fails in the next paragraph the student reads.

### [56] <SHOW|TRAIN> <HALF-> IGNORE - pending updates — Shows an idiom as an absurd literal scene beside what it means <3|5> <|2>
- **markup**: one row, two halves: the absurd literal reading on the left, what it actually means plus one real usage on the right. `.itemrow` of two `.panel`s plus one small inline `<svg>` on the left; the literal reading is also written as a sentence, so the block still teaches if the drawing is cut. One `input.gap` per idiom, used correctly in a stated situation; or two radios — which of two situations a speaker would say this in.
- **info**: half each, side by side. Three idioms is one block; five is a catalogue. A drawing that has to be explained is a riddle, not a mnemonic, and the pun does not survive translation, so the picture must carry the absurdity alone. It carries no etymology: a word's history is different content, stated by a block that does that and nothing else.

### [60] <SHOW|TRAIN> <THIRD-> IGNORE - pending updates — Colour-codes each clause function as a brick <2|5> <3|6>
- **markup**: the sentence as bricks, one per function, with a legend line directly above it (`S` subject · `V` verb · `O` object) and the letter inside each brick as well as the colour. inline `<span>`s with an inline `style` for the fill inside a `.panel` (`.chips` is the wrapping-pill shape if the bricks must wrap). Colour comes from the block, so there is no stylesheet edit and no per-track palette drift. gaps for the missing brick's word, or radios for which brick is the subject.
- **info**: half; one clause plus a legend does not fill a full row. The same shape without colour is a pattern frame, so this earns its slot only where the *category* is what the lesson teaches. Colour alone fails accessibility and dies in the `@media print` path, which is why every brick carries its letter; and the letters must match whatever the lesson's grammar section already used.

## [INSIDE] — figures a host block draws inside itself, so the host owns the container and the control


### [64] <SHOW|TRAIN> <THIRD-> IGNORE - pending updates — Marks up to seven phrase-level features on one sentence < , > < , >
- **markup**: nothing but the sentence. Seven phrase-level marks, each a `<span>` at the letters that carry the point: a stress dot, ↗/↘ tune, a dotted tie, a struck letter, a syllable rule, a differing-letter highlight and opened spacing (`.mk-stress`, `.mk-rise` / `.mk-fall`, `.mk-link`, `.mk-drop`, `.mk-syl`, `.mk-pair`, `.mk-slow`). A mark is `::before` / `::after`, `text-decoration` or `text-emphasis` — no container, no `<svg>`, no script, no width of its own, and nothing to enumerate for a width check. `.mk-stress` uses `text-emphasis` because the browser centres the dot over the syllable itself; the absolutely positioned dot it replaced drifted right of the syllable in the first render and survives only inside `@supports not (text-emphasis-style:dot)`. The marked sentence is still an item: `.qitem` radios whose stem carries the marks, or an `input.gap` sitting inside the phrase — a mark is display and records nothing on its own.
- **info**: full, half and third, because the mark travels with the text instead of taking a column; the only width risk is `.mk-slow`'s letter-spacing in a narrow third, and it opens the line rather than the block. Two marks on one span collide above the text (a stress dot under a `.mk-pair` highlight), and a mark laid on text that already reads as UI — a chip, a button label — is read as interface rather than annotation. One mark per span; the shape carries the meaning and colour only reinforces it.
