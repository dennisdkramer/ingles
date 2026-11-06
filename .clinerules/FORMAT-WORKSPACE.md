### Layout STANDARDS at generation (width & fill techniques; CSS stays fixed)
a) Width: a block takes ONE of THREE slot widths inside the fixed 1200px content area, with a 14px row gap — full 1200 · half (1200 − 14)/2 = 593 · third (1200 − 2×14)/3 = 391 (CSS implements exactly that: `.itemsize` 100%, `.itemsize-half` `calc(50% - 7px)`, `.itemsize-third` `calc(33.3333% - 9.3333px)`, equal siblings in one `.itemrow`). A block MAY sit half-width beside another block of the same width; a block left on its own CAN be widened with more content.
b) Priority is minimizing dead space.
c) Block width decisions are content-aware of what they contain AND context aware of adjacent blocks - If any block must be made half-width and an adjacent block COULD be made half width, do so and pair the two blocks horizontally per (a).
d) Adjacent blocks of different heights should be analysed to determine the quantity (and type) of (real, relevant) content that could be added to extend the shorter of the two and trigger a 'cleanup' generation step to do so.
e) Block contents and their child elements (eg. multiple choice options) should be generated (or shortened/lengthened in cleanup) so that the total length of [each item/option] OR [all items/options] fills >50% of its parent block's width. If <50% is filled, block should be made half-width. Between 50%-70% filled is acceptable but reflow/tiling is preferred if it achieves better width fill. If reflowed to columns, sequential/numbered items must preserve their order top to bottom per column, sequence continuing in the next column (left to right))
f) Consecutive questions are separated by a small, consistent vertical gap.
g) A note that applies to one chart row CAN be a merged row directly under it: `<tr class="note"><td colspan="N">…</td></tr>` — a bare row spliced into `<tbody>` will not span.
h) Contrasting [linguistic, phonetic, or grammatical] [classes, categories, or concepts] are made visually distinct (using columns, spacing, block separation, or colors as appropriate) so the contrast reads - **This does not supersede 'professional-looking results' goal of 'layout STANDARDS' or other formatting rules**. 
i) A chart is a BLOCK when it stands alone — it then takes any of the three widths in (a) — and a CHILD of a block when it sits inside one (`.panel .chart` = the block’s width minus its 20px side margin). Its column count and row shapes are content-aware, never fixed by CSS.
j) Activity and quiz items are numbered
k) Reflow: a reflowed block states `--rows` (items per column, e.g. `--rows:2`) in its own style attribute — never on a section or wrapper, so a section can never be split into columns; the column count follows from the item count.
l) A lettered block is a VISIBLE block: its content sits inside a framed container — `.panel` (or `.card`) when the inside is `.qgrid` / `.blanks` / `.chips`, or the block IS `.chart` / `.game` / `.dialog` / `.card`. `.qgrid` and `.blanks` carry no frame in CSS, so unwrapped they read as loose page text instead of a block.

- Blocks inside a section are lettered `A.`… (h3), restarting at A in every section .
- Exercise items are numbered `1..n`, top to bottom then left to right, restarting in every block.
- A concise, standalone explainer follows the header of a section or block ONLY IF [it is defensibly helpful (use your judgement) for the student to understand the contents or task] AND [it is not restate anything that the lesson already says]. 
- An item may never ask for a judgement on an axis the page never defined before the item asks for it. the item and its column headers may not be labelled with a word invented for the table.

- Every control that carries an answer (`input.gap`, radio, authored `textarea`) resolves exactly ONE anchor: an unanchored control is never saved, and two controls on the same anchor+place overwrite each other.
- Question stems are unique within a block — a repeated stem gives two controls one saved answer.
- A `textarea` inside `.content-area` is fixed size (`resize:none`): the page never reflows and a drag handle could push the box past its block.
- Unbuilt work is marked, never faked: `<h3>TO-DO — not built: <name></h3>`, naming the primitive the student uses today. Never a TO-DO for teaching.
