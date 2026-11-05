# IMPLEMENTATION — the build manual: what the page can do, and how to make it do it

## THIS FILE
1. **What it is.** The *how*. Everything the build pass (Pass B) needs to know about the machinery it is
   aiming at: which class or knob produces which visible result, which mechanics are already done for the
   author (tiling, print paths, paint layers, spacing) and which decisions are therefore NOT the author's.
   It is the file style.css points at, and the file that carries the owner specs and rationale that used to
   be buried in CSS comments.
2. **What it is not.** Not a contract and not a source of content or shape.
   - `FORMAT.md` = **what must be true** (shell, block vocabulary, sizing rules). If this file and FORMAT
     disagree about a rule, FORMAT wins and this file is the bug.
   - `FUNCTION.md` = **behaviour** (selection popup, marks, saving, edit mode, backend). Authoritative for
     any element a function creates; this file only records the mechanics behind it.
   - `PEDAGOGY-MAP.md` = **what is taught, in what order, in what shape**. Never decide content or shape from
     this file — no class list is a lesson plan.
   - `style.css` = **the one styling source**. This file documents it; it never replaces it. If the two
     disagree about *appearance*, style.css is the fact.
3. **Reading order for a build:** FORMAT (§2b shell → §"Layout STANDARDS") → this file (mechanics) →
   FUNCTION (behaviour) → the lesson's design file (shape). Nothing here overrides the design's shape.
4. `qa/*.mjs` are the executable half of these statements: §7 maps each check to the mistake it catches, so a
   generation can read a red line as "which rule did I violate" instead of guessing.


## 1. PAGE ASSEMBLY
1.1 **One shell.** `_shell.html` (repo root) is copied and its five placeholders filled:
   `{{TRACK_TITLE}}` (document title, e.g. `Adult`), `{{TRACK_UPPER}}` (h1 top line), `{{TRACK}}` (the
   `TRACK` constant), `{{L}}` (the lesson number), `{{LESSON_TITLE}}` (the content `<h1>`). A finished page's
   shell is NOT a template: copying it drags its `L`, title and build comment along.
1.2 **Fixed geometry.** `header.brand`, `.control-bar`, `.barhelp` and `main` are 1400px wide at a fixed 15px
   left offset; `.page-container` is `position:absolute` at the same offset (out of flow, so nothing reflows
   when the viewport changes or a mark is painted) and `.content-area` is 1200px centred inside it → 100px
   each side. Everything authored — and the footer — lives inside `.page-container`. Consequence for the
   author: a width that would fit at 1200px is a width that fits, always; nothing may rely on the viewport to
   wrap, and nothing in a block may overflow the block.
1.3 **Script block (bottom of the page, in this order):** `const BACKPACK=…; const SECRET=…, TRACK="…",
   L=n;` → `../pronkey.js` → `../engine1.js` → `../engine2.js` → **`../engine3.js` only when the page carries
   a Tier-1 game block** → the inline load guard that paints a red banner when `window.__A` / `window.__B` is
   missing. engine1 owns state/storage, engine2 owns answers + UI; the guard exists because a half-loaded
   page otherwise looks like an empty lesson.
1.4 **Build comment.** Published pages carry `<!-- build: <ISO timestamp> -->` on the second line (the
   deployment marker). The `.edit.html` twin keeps the same one.
1.5 **The edit twin.** Every lesson is published **twice**: `lessonN.html` and `lessonN.edit.html`, byte
   identical (a full copy — not a redirect, not a variant). `build-lessons.mjs` reads only the published copy
   for titles; QA (`qa/*.mjs`) audits the published copy. Copy, never hand-edit one twin.
1.6 **Audio.** A `.listen` chip is `<button class="listen" data-say="…">▶</button>`; `data-say` is **how the
   line is said**, never how it is written (no markup, no gloss, no parenthetical). Clips are pre-rendered by
   `build-audio.mjs` into `audio/<sha1>.mp3` + `audio/manifest.json` (Kokoro-82M, `af_heart`, neutral US
   female). The build defaults to `--dir business`, so another track needs `node build-audio.mjs --dir adult`
   and `--check --dir adult`. A missing clip plays nothing — the page does not fail, which is why the check is
   a separate step.
1.7 **Two print paths.**
   - *Plain print* (browser Ctrl+P, no JS): `@media print` hides `header.brand`, `#controlbar`, `#barhelp`,
     `#feed`, `footer`, strips the page frame, hides `#printRoot .listen`, and sets `break-inside:avoid` on
     `.panel`/`.chart`/`.card`. The lesson prints as prose.
   - *The site's Print button* (engine path): `body.printing` hides everything except `#printRoot`, a snapshot
     the engine builds (flat highlight fills, a real underline for recordings, `print-color-adjust:exact`,
     `.pr-gap` for blanks, `zoom:0.9`). The author never writes `#printRoot`.
1.8 **Two paint layers + the text DOM.** A recording is the ONLY mark that lives in the text DOM
   (`mark.nb.has-rec`, 2px blue underline); highlights (`#hlLayer .hlr`) and notes (`#noteLayer .ntr`) are
   absolutely-positioned rectangles measured from a text range. All three can overlap in any order and none of
   them can move the prose — that is the point of the split (§7).

## 2. BLOCKS AND THE SLOT MODEL
2.1 **A block is any content type that fills a slot.** `.card`, `.panel`, `.chart` (table), `.dialog`,
   `fieldset`, `.game` — and any future type. What makes an element a block is the **size class** it carries,
   not the tag. Full width is `.itemsize` (also the default when nothing is tagged); halves/thirds exist only
   inside a row.
2.2 **Rows.** `.itemrow[data-cols="2"|"3"]` is a flex row, `gap:14px`, `flex-wrap:nowrap`, members
   `margin:0;min-width:0`; each member carries exactly `.itemsize-half` or `.itemsize-third`, and the row's
   `data-cols` must agree with the member count (2 halves / 3 thirds, never mixed, never a lone half).
   Members never carry an inline width — the size class owns the width (§9).
2.3 **Slots.** half = `calc(50% - 7px)` of the 1200px column → ~593px; third = `calc(33.3333% - 9.3333px)`
   → ~390.7px. A chart or panel inside a slot takes the slot width automatically (`.panel .chart` is
   `calc(100% - 20px)` because the panel insets its children by 10px each side).
2.4 **Vertical rhythm.** `.card`, `.chart`, `.itemrow` and `.content-area > .panel` each carry a 14px block
   margin, so two stacked blocks never touch; row members carry no margin of their own (the row's gap spaces
   them); `.panel .ex-head` loses its top margin and `.panel > :not(.ex-head)` is inset 10px left/right.
   `qa/overflow.mjs` measures BLOCKGAP / ROWGAP / OPTGAP / CHARTPAD and prints the minimums.
2.5 **A group is never bare.** A `.qgrid` or `.blanks` emitted as a direct child of `.content-area` is an
   exercise with no block around it — wrap it in a `.panel` (or make the group itself a `.chart`/`.card`).
   `qa/width.mjs` rule 5 fails it. `.panel` / `fieldset` carry `min-width:0` on purpose: without it a
   browser's `min-inline-size:min-content` refuses to shrink a block into a half/third slot.
2.6 **What a block may contain.** Prose (`p`, `.lead`, `.pt`), a chart, a dialogue, controls, a `.qgrid`, a
   `.blanks`, another panel, a `.game`. A block never contains a row (rows hold blocks), and a chart never
   contains a block.
2.7 **Small half/full blocks centre their text** (`.card.center`) — a two-line card left-justified in a
   390px slot reads as an accident. A card that carries an exercise keeps its text left.

## 3. INSIDE A BLOCK — THE CONTENT DIVIDES ITSELF
Everything in this section is already implemented: the author names the content and, at most, one class.

3.1 **Charts.** `.chart` is a real `<table>`: paper fill, 2px ink frame + hard tan shadow, ink `thead`
   (`background:var(--ink);color:var(--cream)`), tan 1px grid, 8px/12px cell padding, alternating `#fff8ea`
   rows, `vertical-align:middle`. It is a BLOCK (3.1.1) whose columns and rows are decided by the content —
   never by `colgroup`/`col`/`data-cols`/inline column styles (`qa/width.mjs` rule 4 refuses them). Knobs:
   - `.chart.center` centres every cell (a table of forms/answers, not a table of prose).
   - `.vowels` is the legacy lesson-12 vowel-map preset (first two columns centred) — do not reuse it else.
   - `.thsub` is the second line of a column header: `<span class="thsub">` = block, weight 400, .78em,
     opacity .82. It never carries italic (italic is only ever Portuguese, §6).
   - a note that belongs to one row is `<tr class="note"><td colspan="N">…</td></tr>` directly under that
     row — never a bare row spliced into the `<tbody>`: it gets `#fff8ea`, italic, no top border.
   - `.chips b` = wrapping keyword pills (paper fill, 2px ink, 999px radius) inside a chart cell.
3.2 **Tiling — the author's "make it fill" move.** `.qgrid.stack` and `.blanks.sent` lay their items out with
   `grid-template-columns:repeat(auto-fill,minmax(28em,1fr))` and a 28px column gap. The slot therefore
   decides the column count by itself: **2 tiles at full width (~558px each), 1 tile inside a half/third.**
   No author decision, no class, no count. Consequences:
   - a short list can no longer leave the right half of the page blank (FORMAT rule 4) — it just tiles;
   - **an odd last item spans the whole row** (`:last-child:nth-child(odd){grid-column:1/-1}`), so 3 items
     read 2 + 1-wide, never 2 + a hole; an even count never matches. The rule is written as `1/-1` so it is
     right for 1 column and for 2;
   - `.qgrid.stack` items are `.qitem` blocks (16px bottom margin), the prompt is `.qline`
     (`.qnum` + `.qstem`, baseline-aligned, 8px gap) and the options are `.qopts` **below** the prompt;
   - `.blanks.sent` items are block lines (8px apart) with the gap inline in the sentence, so a hint or gloss
     after the gap stays on the same line.
3.3 **`.wide` — the one exception.** `.qgrid.stack.wide` / `.blanks.sent.wide` collapse to `display:block`:
   one item per line, for a block whose item is genuinely wider than a tile (~560px). Like every other width
   decision it is *stated with its reason in the design file* (FORMAT rule 8); it is never used to "make it
   look tidy". There is **no** `.blanks.wide` (the plain `.blanks` word-and-gap grid has no one-per-line
   variant): a word list that needs a wider cell is a `.blanks.sent`, which has one.
3.4 **`.cols` is retired.** It used to force a column count; tiling made it unnecessary and `qa/width.mjs`
   rule 3 fails a page that still carries `.qgrid.stack.cols` / `.blanks.sent.cols`. Same for `.grid3`,
   `.panels`, `.dialog.half`, `.qgrid-4`.
3.5 **Options.** `.qopts` is `display:flex;flex-wrap:wrap;justify-content:flex-start;gap:6px 30px` — options
   are left-justified and 30px apart, and a question may carry 2, 3, 5… of them (rule 6: the content decides;
   `.qgrid`/`.panel`/`.qopts` cap nothing). `label{margin-right:10px}` is the legacy spacing for the inline
   pattern; inside `.qopts` the gap does the work.
3.6 **Done for you, not by you:** the odd-last-item span, the tile minimum, the row margins, the panel inset,
   the chart's internal grid, the option gap. If a block looks empty on the right, the fix is *content*
   (§2/§3 tiling) — never a CSS edit, never an inline width.

## 4. THE CONTROLS THAT CARRY AN ANSWER
Only three things persist (FUNCTION.md): `input.gap`, `input[type=radio]`, and an authored `textarea`
(`#feed` is the notebook and is persisted separately). Everything else on the page is decoration and will not
survive a reload — so an exercise that teaches nothing else must still land on one of these three.

4.1 **`input.gap`** — a fill-in blank. Transparent, 2px tan bottom border, `#fff8ea` fill, `font:inherit`,
   width `var(--gap-w,9em)`. The width knob is set **once, on the container**: `<div class="blanks sent"
   style="--gap-w:5.5em">` (5.5em for a word/verb, 9em default for a short phrase, 14–18em for a written
   sentence). A contiguous line, never literal `___` underscores in the prompt text.
4.2 **`.blanks`** (the flex row: `grid` of cells, each `display:flex;justify-content:flex-end` so the word and
   its gap sit as a right-aligned pair) = *word + blank* lists, e.g. article choice or verb form. **A `<br>`
   inside it is ignored** — it is a row of items, not prose.
4.3 **`.blanks.sent`** = the same list as whole sentences with the gap inline; a Portuguese hint after the gap
   stays on the same line. This is the only layout in which a hint "on its own line below the input" renders.
4.4 **MCQ anatomy** (flat and stacked): `.qitem > .qline > (.qnum + .qstem)` then `.qopts` **below** the
   prompt. The flat `.qgrid` template is `max-content minmax(0,1fr)` (number column | content column) with
   14px column / 12px row gaps — that is a *layout*, not an option count. `.qstem` is bold; `.qnum` is bold.
   One layout per block, and **stems are unique across the page** (4.7).
4.5 **Radio groups.** One `name` per question (`q1`, `q2`, … `t1`, `z1` — any unique string; the *name*, not
   the value, is the group), each option a `<label><input type="radio" name="…" value="a">text</label>`.
   Options are shuffled by the author so the right answer is not always in the same slot, and a group may
   carry 2..n options (§3.5). `value` is the letter; the text is what the student reads.
4.6 **Textareas.** Authored free-text blocks are **fixed size**: `.content-area textarea{resize:none}` — the
   layout is fixed at generation and a drag handle would let a student widen the block past its slot.
   `qa/overflow.mjs` fails a draggable one (RESIZE). `#feed` (the shared notebook, always present) and `#trw`
   (at most one, the translation box) keep their ids — that is what persists. `#feed` is
   `field-sizing:content` with a 9em minimum, so it grows with what the student writes.
4.7 **How an answer is keyed, and why the author should care.** engine2 saves each answer under a key derived
   from the control's **anchor** — the nearest ancestor text — plus a `{block, place}` tie-breaker. A control
   with no anchor text is never saved at all (typed into nothing), and two controls that resolve the *same*
   anchor and the same place overwrite each other. `qa/content.mjs` fails both, seeds every gap with its own
   value and requires `renderAnswers` to give that value back.
   - Practical rule: **give every field its own prompt text.** In a chart row with two blanks, put a word in
     front of each; a row of bare `<td><input class="gap"></td>` gaps is exactly the case the ordinal
     tie-breaker had to be added for, and a reorder can still swap them.
   - The same is why a repeated `.qstem` is a defect (`qa/overflow.mjs` reports `anchor(s) shared`).
4.8 **The gloss standard, mechanically.** `.ptw` is the Portuguese after an English word (italic, `--ptw`,
   weight 600). A block chooses ONE placement for all of its cells: inline after the word
   (`.blanks > div .ptw{flex:0 0 auto}`, `.chart td .ptw` inline), or — when any ONE gloss of the block cannot
   fit its cell — its own line in **every** cell: `glossdrop` on the `.blanks` / `.chart`
   (`.blanks.glossdrop>div{flex-wrap:wrap}` + `.ptw{flex:1 1 100%;text-align:right}`,
   `.chart.glossdrop .ptw{display:block}`). A single cell never decides; a list that shows one gloss inline and
   the next one wrapped looks broken even when each cell is right on its own.
4.9 **Recording is not a control.** The student selects text and records through the selection popup
   (FUNCTION.md); the page only says what to record (an `.ex-head` + a `.lead`). `mark.nb.has-rec` is painted
   by the engine — the author never writes it.

## 5. APPEARANCE KNOBS — type, colour, the small classes
5.1 **Palette** (`:root` variants; `style.css` is the source):
   `--cream #f4eddd` page background · `--paper #fdfaf2` every content surface · `--ink #182136` text,
   borders, buttons · `--tan #b9854c` accents, the hard 5px/3px shadows, dashed panel frames ·
   `--rose #d9c1ba` dialog frames and the h2 underline · `--ptw #96601f` Portuguese words ·
   `--blue #1d4ed8` + `--bluebg rgba(29,78,216,.16)` the recording underline and the note wash.
   Nothing else is a colour decision the author makes: a "colour that helps the contrast read" (FORMAT j) is
   `--ptw`, `--tan`, `--dkblue` (the `.ex-head`) or a `.chips` pill — never a new inline colour.
5.2 **Type.** Playfair Display 700/900 → `h1`, `h2`, `.ex-head`, `.lead`, dialog titles. Caveat 700 → `.script`
   (a handwritten accent, rotated -2deg). Public Sans 400/600/700 → everything else, base 17px/1.6.
   **Every size is a fixed px constant** (h1/`.script` 38px, body 17px, `.lead` 18px, `.ex-head` 19px): no
   viewport units, no `clamp()`, so a resized window changes nothing and print equals screen.
   `h1` is 38px with `.14em` tracking; `h1 span` is the second line (`LESSON N`) at `.42em` size / `.5em`
   spacing. `h2` carries a 2px rose bottom border and `.h2sub` (`<span class="h2sub">`, Public Sans .55em,
   weight 400) for a small trailing note on the same line.
5.3 **Portuguese markers.** `:lang(pt){font-style:italic;font-weight:400}` is the only automatic italic, so a
   helper class never carries `font-style` (FORMAT §"Standard element formatting guidance"). The markers:
   `.pt` (Portuguese explanation prose), `.ptw` (a Portuguese gloss word — italic + `--ptw` + weight 600),
   `<i class="ptw">` for one word inside a bold line, `lang="pt"` for a phrase in an element that is not
   already a Portuguese marker. Inside `.pt`/`.lead`, a `<b>` holding English is `font-style:normal` — that is
   how English sits inside an italic Portuguese sentence.
5.4 **Section furniture.** `.lead` (Playfair 18px italic, #5c5347) = the section explainer under an `h2`;
   `.ex-head` (Playfair 19px, dark blue, 4px tan left bar) = one exercise group inside a `.panel`; `.dim`
   (13px, #8a8072) = small print; `.script` = a handwritten accent line; `.h2sub` = the trailing h2 note.
5.5 **Small classes that are only ever decoration.** `.chips b` = keyword pills. `.blank` = a 3.2em underline
   used in prose that is *not* answered (a "fill this" cue in a model), never a substitute for `input.gap`.
   `.prep` = a highlighted preposition; `#nbKey .pr-g` = greyed part of the pronunciation key; `.ptsound` =
   **lesson 12's vowel-map labels only** (English sounds written in PT letters, e.g. ei/ai/ə) — not part of
   the pronunciation key (`data-pron` / `dictionary.json` / PronKey) and not a general pronunciation tag
   (renamed from `.ptpronounce` 2026-10-27).
5.6 **`details`** = the dashed tan reveal box (`<details><summary>ver o que ela disse</summary>…</details>`),
   used for "listen first, read after". `.dialog` = a written dialogue block: `#fff8ea` fill, rose frame,
   `.dialog-title` for the bold speaker line.
5.7 **Buttons.** One shared interaction for every button on the site (owner instruction 2026-11-03): hover
   brightens (`filter:brightness(1.14)`) and lifts 1px, press moves 2px into its own hard shadow,
   `:focus-visible` gets a 3px tan outline, reduced-motion removes the movement. The rules modulate brightness
   and position only — they never set `background` or `box-shadow` — so a button that carries its own colour
   (`.listen` tan, the highlight swatches, `.complete-btn`, `.remlink`, `.bookmenu` buttons) keeps it.
   Disabled/`.locked` buttons do not react. **No page writes its own hover/press styling.**

## 6. MARKS, MODES, SHELL CHROME, GAME
6.1 **The recording underline is painted, not bordered.** `mark.nb.has-rec` uses
   `background-image:linear-gradient(--blue,--blue)` with `background-size:calc(100% - 4px) 2px` and
   `background-position:2px 100%` (owner spec 2026-10-12). The 2px inset comes from the *background*, never
   from padding, because padding would shift the prose and lesson content must never move; two abutting
   recordings therefore leave a paper gap between them without moving a letter.
6.2 **Highlights and notes are separate paint layers.** `#hlLayer` and `#noteLayer` are
   `position:absolute;pointer-events:none`, no `z-index` (so they create no stacking context and stay under
   `.pop`/`#toast`), children `mix-blend-mode:multiply` so black ink stays black and the tint only shows
   through paper — visually the wash sits *below* the text with zero DOM change (owner spec 2026-10-12).
   Palette: `.hlr-yellow rgba(255,233,112,.55)`, `.hlr-red rgba(255,64,64,.34)`,
   `.hlr-green rgba(64,200,96,.34)`; the swatch buttons `.hlpal button[data-c]` are the same three values at
   higher opacity. The `.hlpal` swatch buttons are 14px squares with no shadow — the palette is defined here,
   never inline in the engine.
6.3 **The legend demonstrates, it does not describe** (owner instruction 2026-11-03). `.hb-rec` is part of the
   `mark.nb.has-rec` rule itself, `.hb-note{background:var(--bluebg)}` is the note wash, and
   `.hlk-y/.hlk-g/.hlk-r` are the three highlight swatch colours. Never restyle these separately — then the
   legend starts lying about the site. The shell (`header.brand`, `.control-bar`, `.barhelp`, `footer`) is
   `user-select:none`: the notebook only exists inside `.content-area`, so selecting the shell did nothing
   anyway; the rule stops the selection from ever starting.
6.4 **Edit mode** (`body.editing`): both paint layers hidden, `mark.nb.has-rec` loses its underline, and
   `.content-area` gets a dashed blue outline. That is the whole visual contract — the engine adds the tools.
6.5 **Shell chrome.** `header.brand`: centred logo 120px with `drop-shadow(3px 4px 0 var(--rose))` and the
   English track/lesson `h1`; `#controlbar` is filled by engine2 (Last/Next, account, tools); `#barhelp` is
   the baked-in Portuguese legend (FORMAT §2c — one line, `qa/overflow.mjs` fails a wrap: LEGEND);
   `footer` is 11px, `.3em` tracking, #8a8072.
6.6 **`index.html` (the landing page) is not a lesson** — it is login-gated and built from `COUNTS` /
   `lessons.json`: `body.landing` card, `.tracks3` = three equal track columns, `.track-card` per track with
   the continue button at the top, each lesson entry `NN. Title` on ONE line (ellipsis, full text as a
   tooltip), a finished lesson teal (`.row.done`), an ungranted track greyscale and inert (`.locked`). A track
   with no pages has nothing to show: `COUNTS` is the fallback list for a track whose `lessons.json` entry is
   empty, so an unwired track looks empty rather than broken.
6.7 **The teacher area** (same page): `.tadmin-books` row of book buttons, `.tadmin-cols` two half columns
   (pending / approved), `.bookmenu` the scrolling book dropdown, `.complete-btn` the per-lesson completion
   button (grey → teal), `.trow` a name/e-mail row that truncates instead of wrapping.
6.8 **The Tier-1 game block** (`engine3.js`, added ONLY when the page has a game). `.game` is a block like any
   other (so it takes `.itemsize*` inside a row). `.game-stage` is hidden until the engine adds `.is-on`; the
   authored `.game-list` of radios is what persists, prints and shows if the engine never runs (`.game.is-on
   .game-list{display:none}` is the only thing hidden). `.target` is an absolutely positioned 118×104 button
   with an SVG plus a `.plaque` label; `.hit`/`.miss` recolour it; `.game-hud`, `.game-prompt`, `.game-fade`
   and `.game-start`/`.game-how`/`.game-score-line` are the engine's own furniture. Print shows the list.

## 7. ENFORCEMENT MAP — READ A RED LINE AS A RULE
| harness | scope | catches |
|---|---|---|
| `qa/content.mjs` | jsdom, engines inlined | `__A`/`__B` not set, `#feed` missing/duplicated or not a textarea, more than one `#trw`, any `.listen` without `data-say`, a leftover `<!-- MORE -->`, a control that resolves **no anchor** (never saved), two controls sharing anchor **and** `{block,place}` (they overwrite), a gap that does not get its own value back through `renderAnswers`, a stacked radio that does not restore. Non-failing `(hint)`: two controls sharing one anchor. |
| `qa/width.mjs` | markup | a half/third outside a row, both size classes, an incomplete/ mixed row, an inline width on a row member, a retired class (`.cols`, `.grid3`, `.panels`, `.dialog.half`, `.qgrid-4`), a chart declaring its own columns, a `.qgrid`/`.blanks` emitted bare into `.content-area`. Has `--selftest`. |
| `qa/overflow.mjs` | **real Chrome** | OVERFLOW (content wider than its block), BALLOON (block wider than its slot), ESCAPE (anything crossing the `.content-area` frame), CELL (a `.blanks` item that cannot fit), RESIZE (a draggable textarea), SELECT (a selectable shell element), LEGEND (the legend wraps), and the spacing minimums BLOCKGAP / ROWGAP / OPTGAP / CHARTPAD; TILEHOLE / DEADSPACE / HEIGHT are review-only hints. This is also where **ROWWRAP** (FORMAT rule 9) lives. `--shot` saves a picture. |
| `qa/smoke.mjs` | jsdom | JS syntax, engine init, the selection popup, highlight paint separation, the palette, Ctrl+click delete, layer independence, and each page's interactive features. |
| `qa/landing.mjs` | jsdom | `index.html`: three track columns, title-as-link, continue button, locked tracks, the `go()` gate, teacher grant/remove. It mocks `LESSONS`, so its green is NOT evidence that a track is wired. |
| `qa/games.mjs` | jsdom | the `shootPair` state machine (engine3). |
| `qa/live.mjs` | real Chrome / CDP | timing and real input bugs jsdom cannot see (`Input.dispatchMouseEvent`/`KeyEvent`, `getBoundingClientRect`). |

Scope is a property of the harness, not an argument: no `--track` sweeps every track that has pages;
`--track=kids|business|adult` narrows it; a named lesson that exists in no track in scope is a **hard error**
(so a typo can never pass as "nothing to audit"), and a named lesson missing inside a named track fails.
**Consequence for generation:** always name the lessons you just wrote (`node qa/content.mjs --track=adult 1 2
3`) — an empty or mis-foldered track otherwise passes every harness.

## 8. HARD LIMITS — WHAT A BUILD MAY NEVER DO
1. Never edit `style.css` from a generation. If a page needs a look the CSS cannot produce, that is an
   escalation (PEDAGOGY-MAP §2), not a stylesheet change.
2. Never give a row member an inline width, and never make a block its own width outside the `.itemsize*` +
   `.itemrow[data-cols]` model.
3. Never prescribe a chart's columns (no `colgroup`, `col`, `data-cols`, inline column styles) — the content
   decides.
4. Never emit a `.qgrid`/`.blanks` outside a block, never a lone half/third, never `.cols`.
5. Never put a literal `___` in a prompt: a blank is `input.gap` (the only thing that persists).
6. Never make an authored `textarea` draggable, and never give one an id other than `#trw`/`#feed`.
7. Never let two fields share one prompt text (they overwrite), and never leave a field with no prompt at all
   (it is never saved).
8. Never write a `.listen` without `data-say`, and never let `data-say` carry markup, glosses or parentheses —
   it is how the line is *said*.
9. Never restyle the legend's demo marks, the palette or the button interaction in a page.
10. Never copy a shell or a shape from another lesson uninvited (FORMAT §1d, PEDAGOGY-MAP §1 Pass A).

## 9. OWNER-SPEC LEDGER (the dated decisions that used to live in style.css)
| date | decision | where it is now |
|---|---|---|
| 2026-10-12 | recording = 2px blue underline, no trailing icon, painted by the background with a 2px inset so the prose never moves | §6.1 |
| 2026-10-12 | the highlight sits *below* the text via `multiply`, on its own layer, never in the text DOM | §6.2 |
| 2026-10-12 | a note is its own paint layer (light-blue wash), independent of a recording | §6.2 |
| 2026-10-15 | the site's Print button prints a snapshot only (`body.printing`/#printRoot), flat fills + real underline + `print-color-adjust:exact` | §1.7 |
| 2026-10-17 | content-shape styles: `.lead`, merged chart note row, stacked MCQ, sentence fill-ins, non-italic English inside italic PT | §3.1, §5.3–5.4 |
| 2026-10-20 | teacher admin area (books row + pending/approved half columns) | §6.7 |
| 2026-10-27 | `.ptpronounce` renamed `.ptsound`, scope limited to lesson 12's vowel map | §5.5 |
| 2026-11-03 | the site-functions legend is ONE baked-in line that *demonstrates* the marks | §6.3 |
| 2026-11-03 | the shell is not selectable; the notebook only exists inside `.content-area` | §6.3 |
| 2026-11-03 | every button shares one hover/press interaction that modulates only brightness and position | §5.7 |
| 2026-11-03 | authored `textarea` is fixed size (no drag handle) | §4.6 |
| 2026-11-03 | vertical rhythm: a block never touches the block above or below it | §2.4 |
| 2026-11-03 | fixed 2/3-slot block model; the content-aware freedom is *inside* a block | §2.1–2.3, §3 |
| 2026-11-03 | landing page: three track columns, the title is the link, continue at the top, one-line entries, locked tracks inert | §6.6 |
| 2026-11-03 | `style.css` is implementation only; content/shape come from FORMAT + the design pass | §THIS FILE 2 |

## 10. QUICK INDEX — REACH FOR THESE
- **Slots:** `.itemsize` (full) · `.itemsize-half` / `.itemsize-third` + `.itemrow[data-cols="2"|"3"]`.
- **Blocks:** `.card` · `.panel` · `.chart` (table) · `.dialog` · `fieldset` · `.game`.
- **Inside a block:** `.lead` · `.ex-head` · `.qgrid.stack` · `.qitem`/`.qline`/`.qnum`/`.qstem`/`.qopts` ·
  `.blanks` / `.blanks.sent` · `.wide` · `.glossdrop` · `.chips` · `.chart.center` · `.thsub` · `tr.note` ·
  `.card.center`.
- **Controls:** `input.gap` (+ `--gap-w` on the container) · `input[type=radio]` (+ one `name` per question) ·
  `textarea` (`#trw` once, `#feed` always).
- **Audio / reveal:** `.listen[data-say]` · `details`/`summary`.
- **Portuguese:** `lang="pt"` · `.pt` · `.ptw` · `<i class="ptw">` · `.prep` · `.ptsound` (lesson 12 only).
- **Never authored:** `mark.nb`, `#hlLayer`, `#noteLayer`, `.hlr-*`, `.ntr`, `#printRoot`, `body.printing`,
  `body.editing`, `.pop`, `#toast`, the control bar, the legend.







