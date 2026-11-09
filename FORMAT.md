# [FORMAT] - The Lesson Page structure & formatting contract -
	- Changes to this file must follow [explicit user instructions] OR [explicit user sign-off] 
    - This file's guidelines are [Maximally generalised] to [apply to] but not [overly restrict the possibilities] of content generation. 
    - This filel drives content-aware formatting/organization/separation lesson pages.
    - Elements which exist because a FUNCTION creates them are styled by style.css and driven by FUNCTION.md guidelines.
	- PAGE SHELL:`_shell.html` (repo root) is copied and its five placeholders filled: `{{TRACK_TITLE}}` (document title, e.g. `Adult`), `{{TRACK_UPPER}}` (h1 top line), `{{TRACK}}` (the `TRACK` constant), `{{L}}` (the lesson number), `{{LESSON_TITLE}}` (the content `<h1>`). A finished page's shell is NOT a template.

## Standard [ELEMENT] formatting guidance
- The lesson title (h1) must be written short enough to sit on ONE line -(fixed 38px size inside the 1200px content area).
- When used, mark portugues text and make it italic with `lang="pt"` (CSS `:lang(pt){font-style:italic}`), `.pt`(explanations),`.ptw`(in exercises) or `<i>` as a fallback. 
- Items within a block must not overflow the block or overlap/touch each other.
- Lesson sections are numbered `1.`… (h2). 
- Blocks are lettered inside-top with [`A. `(h3)] , restarting at A in every section. **The header is the block's first line and sits above the block's content in every block of every lesson** — nothing a vehicle, script or stylesheet draws into the block may take that place, so a game that inserts its own stage inserts it BELOW the header and never above it.
- Exercise/activity/quiz items are numbered `1..n`, top to bottom then left to right, restarting in every block.
- **An item's option count is set by what it has to discriminate, never by habit.** Two or more options, always: 3–4 is the baseline, 2 is right when the pair is genuinely binary, and 5–6 belong to an item whose content supplies that many plausible candidates (a family of ten look-phrases, six tense forms). The vehicle's own maximum binds and is stated in its CONTENT_EXAMPLES entry (`whackMole` draws one mole per option: 3–6). Difficulty is the other limit — the count rises with the discrimination the lesson intends, not with the wish to fill a grid.
- For any section and/or block, a concise text below the header [[explains its contents] or [instructs the student what to do]] ONLY IF [[defensibly helpful to the student] AND [doesnt re-state anything else in the lesson]]. 
- An item may never ask for a judgement on an axis the page never defined before the item asks for it. the item and its column headers may not be labelled with a word invented for the table.
- Any fill-in hint/gloss sits below and center-aligned with the center of its respective input field.
- Font sizes are fixed constants (no viewport-relative sizing).
- Sizing philosophy: Minimum size an average person comfortably sees, clicks, reads.


### Mechanical [LIMITS] (the only MUSTs — each prevents an answer or a line from being lost)
- Every control that carries an answer (`input.gap`, radio, authored `textarea`) resolves exactly ONE anchor: an unanchored control is never saved, and two controls on the same anchor+place overwrite each other.
- Question stems are unique within a block — a repeated stem gives two controls one saved answer.
- A `textarea` inside `.content-area` is (`resize:none`). the page never reflows, no items are resizeable. 
- If unbuilt work occurs, it is marked, never faked.

### Following are guidance **IF** relevant content used
- .thsub = a chart-column-header subtitle (the second line under the main label): block, weight 400, smaller, reduced opacity.
- input.gap = fill-in blank: transparent, 2px tan bottom border, #fff8ea bg — a CONTIGUOUS line, never literal "___" underscores in the prompt
- .chart = structured data table (cognate rules, phrase translations, to-be chunks, false friends): paper, 2px ink frame + tan shadow, ink header row, tan grid
- .chips = wrapping keyword pills ("quase iguais" list)
- .grid3 = an available 3-column row of cards
- .blanks = wrapping row of fill-in pairs (word + input.gap)
- .dialog = dialogue block: #fff8ea fill, rose frame, bold speaker labels. **Speaker names are English given names** (Josh, Maya, Leo, Sam, Ash, Dee) — never Portuguese or Brazilian ones (Téo, Guh, Thiago, Luiz, Bia), whatever the scene is about: the student is learning English in an English world, so a name that only exists in Portuguese makes the scene Portuguese again.
- .listen = compact ▶ audio chip placed inline beside what it speaks
- A fill-in hint/gloss (Portuguese, italic) sits on its own line BELOW the input. Author it with the block fill-in layout (`.blanks.sent` / `.blanks.sent.cols`) so the line break actually renders — a `<br>` inside the default flex `.blanks` row is ignored.
- @media print: hides header/#controlbar/#feed/footer, strips container border/shadow
- .card: paper bg, 2px ink border, 16px radius, 5px 5px 0 tan hard shadow

## [GENERATION] (width & fill techniques; CSS stays fixed)
a) Width: a block takes ONE of THREE slot widths inside the fixed 1200px content area, with a 14px row gap — full 1200 · half (1200 − 14)/2 = 593 · third (1200 − 2×14)/3 = 391 (CSS implements exactly that: `.itemsize` 100%, `.itemsize-half` `calc(50% - 7px)`, `.itemsize-third` `calc(33.3333% - 9.3333px)`, equal siblings in one `.itemrow`). A block MAY sit half-width beside another block of the same width. A lone half- or third-width block is CENTERED in the content area — it never sits against the left edge with the dead space all on one side.
b) Priority is minimizing dead space.
c) Block width decisions are content-aware of what they contain AND context aware of adjacent blocks - If any block must be made half-width and an adjacent block COULD be made half width, do so and pair the two blocks horizontally per (a).
d) Adjacent blocks of different heights should be analysed to determine the quantity (and type) of (real, relevant) content that could be added to extend the shorter of the two and trigger a 'cleanup' generation step to do so.
e) Block contents and their child elements (eg. multiple choice options) should be generated (or shortened/lengthened in cleanup) so that the total length of [each item/option] OR [all items/options] fills >50% of its parent block's width. If <50% is filled, block should be made half-width. Between 50%-70% filled is acceptable but reflow/tiling is preferred if it achieves better width fill. If reflowed to columns, sequential/numbered items must preserve their order top to bottom per column, sequence continuing in the next column (left to right)). **Fill is judged on the block's CONTENT** — its chart, table, item list, options. Explanatory or flavour text (an intro line, a note, a gloss, a `.thsub`) does NOT count: it wraps to whatever width the block is given, so it can never be the reason a block stays full width. A block whose content alone would not fill half a full-width row collapses to half width (or to third, if that is what its content needs) and, if it is alone on its row, is centred per (a).
f) Consecutive questions are separated by a small, consistent vertical gap.
g) A note that applies to one chart row CAN be a merged row directly under it: `<tr class="note"><td colspan="N">…</td></tr>` — a bare row spliced into `<tbody>` will not span.
h) Contrasting [linguistic, phonetic, or grammatical] [classes, categories, or concepts] are made visually distinct (using columns, spacing, block separation, or colors as appropriate) so the contrast reads - **This does not supersede 'professional-looking results' goal of 'layout STANDARDS' or other formatting rules**. 
i) A chart may be a child inside any block (`.panel .chart` = the block’s width minus its 20px side margin), else it is a BLOCK and takes one of the three widths in (a). In both cases, column count and row shapes are content-aware, never fixed by CSS.
j) Reflow: a reflowed block states `--rows` (items per column, e.g. `--rows:2`) in its own style attribute — never on a section or wrapper, so a section can never be split into columns; the column count follows from the item count.
k) A lettered block is a VISIBLE block: its content sits inside a framed container — `.panel` (or `.card`) when the inside is `.qgrid` / `.blanks` / `.chips`, or the block IS `.chart` / `.game` / `.dialog` / `.card`. `.qgrid` and `.blanks` carry no frame in CSS, so unwrapped they read as loose page text instead of a block.
