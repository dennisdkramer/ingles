## THIS FILE
1. FORMAT - This file is the site structure & formatting contract -
    a) This file reflects high-level site appearance/structure goals and guides:
        - Style.css (eg. Portugues text must be italic).
        - High-level page element decisions.
        - Post-generation structuring of LESSON CONTENT and subsequent cleanup.
    b) This file's EXISTING guidelines, components, and their styling are stable — changes/additions/deletions MUST:
        - Follow [explicit user instructions] OR [explicit user sign-off of proposed changes] AND
        - Must be sanity checked - may not cause [redundancy or potential conflict] with other elements/guidelines.
    c) This file's guidelines (and the formatting tasks it is used for) must be [maximally generalised] to [apply to] but not [overly restrict the possibilities] of generation, including but not limited to: 
        - Inclusion of diverse content types (eg. embedded video/game, lesson-content-aware minigame, graph/research analysis, embededded pictures).
        - Pedagogy-driven / content-aware formatting (eg. vertical word/translation lists, organization/separation of content).
        - EXCEPTIONS (eg. Exam Page, user-specific feedback/review pages).
    d) OUT OF SCOPE for this file:
        - [linguistics and/or pedagogy and/or teaching] analysis/decisions (PEDAGOGY.md) - This file must not influence.
        - Lesson content is generated and organized according to PEDAGOGY-MAP.md and the files it references. This file is the mechanical contract — shell, classes, sizing.
        - Elements which exist because a FUNCTION creates them (Selection popup, note/recording marks, highlight rectangles, colour palette, toast, indicators/spinners, etc.) are styled by style.css, which remains the single styling source for the whole site.

2. SITE CORE CHARACTERISTICS -
    a) The SITE/PLATFORM/PROJECT "Inglês Abre Portas" is a static English-teaching site — one teacher plus allow-listed students, three 'TRACKS' (kids, business, adult); every lesson is a standalone page. (Project GOALS are distributed: behaviour in FUNCTION.md, state/parameters in STATUS.md.)
    b) PAGE SHELL:`_shell.html` (repo root) is copied and its five placeholders filled: `{{TRACK_TITLE}}` (document title, e.g. `Adult`), `{{TRACK_UPPER}}` (h1 top line), `{{TRACK}}` (the `TRACK` constant), `{{L}}` (the lesson number), `{{LESSON_TITLE}}` (the content `<h1>`). A finished page's shell is NOT a template.



### Standard element formatting guidance
- The lesson title (h1) must be written short enough to sit on ONE line at the fixed 38px size inside the 1200px content area.
- **Portuguese text is ALWAYS italic.** Mark it with `lang="pt"` (CSS `:lang(pt){font-style:italic}` italicizes it in any element), or use the legacy `<i>` / `.pt` / `.ptw` markers. 
- .pt = Portuguese explanation text: it	alic. .ptw = Portuguese word in exercises: italic, --ptw color, weight 600.
- Content within a block may never overflow the block, and items within a block should not touch or overlap.
- Lesson sections are numbered `1.`… (h2). 
- Blocks inside a section are lettered `A.`… (h3), restarting at A in every section .
- Exercise items are numbered `1..n`, top to bottom then left to right, restarting in every block.
- A concise, standalone explainer follows the header of a section or block ONLY IF [it is defensibly helpful (use your judgement) for the student to understand the contents or task] AND [it is not restate anything that the lesson already says]. 
- An item may never ask for a judgement on an axis the page never defined before the item asks for it. the item and its column headers may not be labelled with a word invented for the table.


#### Mechanical limits (the only MUSTs — each prevents an answer or a line from being lost)
- The `#barhelp` legend under the title is hand-baked shell chrome, one Portuguese line: no `lang="pt"`/`.pt` (the always-italic rule is for authored content) and inert — it sits outside `.content-area`, where the notebook gestures do not exist.
- Every control that carries an answer (`input.gap`, radio, authored `textarea`) resolves exactly ONE anchor: an unanchored control is never saved, and two controls on the same anchor+place overwrite each other.
- Question stems are unique within a block — a repeated stem gives two controls one saved answer.
- A `textarea` inside `.content-area` is fixed size (`resize:none`): the page never reflows and a drag handle could push the box past its block.
- Unbuilt work is marked, never faked: `<h3>TO-DO — not built: <name></h3>`, naming the primitive the student uses today. Never a TO-DO for teaching.

#### Following are guidance **IF** relevant content used, not mandatory, not templates
- .thsub = a chart-column-header subtitle (the second line under the main label): block, weight 400, smaller, reduced opacity.
- input.gap = fill-in blank: transparent, 2px tan bottom border, #fff8ea bg — a CONTIGUOUS line, never literal "___" underscores in the prompt
- .chart = structured data table (cognate rules, phrase translations, to-be chunks, false friends): paper, 2px ink frame + tan shadow, ink header row, tan grid
- .chips = wrapping keyword pills ("quase iguais" list)
- .grid3 = an available 3-column row of cards
- .blanks = wrapping row of fill-in pairs (word + input.gap)
- .dialog = dialogue block: #fff8ea fill, rose frame, bold speaker labels
- .listen = compact ▶ audio chip placed inline beside what it speaks
- A fill-in hint/gloss (Portuguese, italic) sits on its own line BELOW the input. Author it with the block fill-in layout (`.blanks.sent` / `.blanks.sent.cols`) so the line break actually renders — a `<br>` inside the default flex `.blanks` row is ignored.
- @media print: hides header/#controlbar/#feed/footer, strips container border/shadow

### Text and visual sizing philosophy
- Minimum size an average person comfortably sees, clicks, reads.
- Font sizes are fixed constants (no viewport-relative sizing).


## Lesson section/block formatting
- .card: paper bg, 2px ink border, 16px radius, 5px 5px 0 tan hard shadow
- Buttons: ink bg, cream text, 10px radius, 3px 3px 0 tan shadow, weight 600, 14px Public Sans
- Links: ink, weight 600. Dim text: #8a8072, 13px
- Lesson navigation: the control bar carries "← Last" / "Next →" buttons (always present, rendered by engine2.js from `L` alone — there is no lesson count: "Next →" is always enabled and goes to `lesson{L+1}`, "← Last" is disabled on lesson 1).

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
