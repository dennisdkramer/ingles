## THIS FILE
1. FORMAT - This file is the site structure & formatting contract -
    a) This file reflects high-level site appearance/structure goals and guides:
        - Style.css (eg. Portugues text must be italic).
        - High-level page element decisions.
        - Post-generation structuring of LESSON CONTENT and subsequent cleanup.
    b) This file's EXISTING guidelines, components, and their styling are stable — changes/additions/deletions ONLY:
        - [Following [explicit user instructions] OR [explicit user sign-off of proposed changes]].
        - Must be sanity checked, may not cause [redundancy or potential conflict] with other elements/guidelines.
    c) This file's guidelines (and the formatting tasks it is used for) must be [maximally generalised] to [apply to] but not [overly restrict the possibilities of] the following (and potential future incusions): 
        - Diverse content types (eg. embedded video/game, lesson-content-aware minigame, graph/research analysis).
        - Pedagogy-driven / content-aware formatting (eg. thin vertical word/translation list, embededded pictures).
        - EXCEPTIONS (eg. Exam Page, user-specific feedback/review pages).
    d) OUT OF SCOPE for this file:
        - [linguistics and/or pedagogy and/or teaching] analysis/decisions (PEDAGOGY.md) - This file must not influence.
        - **Lesson SHAPE.** Which sections a lesson has, in what order, and how its content divides into blocks / rows / columns is **FREELY IMAGINED** for every lesson per PEDAGOGY-MAP.md → LESSON GENERATION → **1. Pass A (design)**, from that lesson's own design file and roadmap entry. There is NO lesson template in this file and none anywhere else: what this file fixes is only the shell, the block vocabulary and the mechanical constraints (§2b, §"Layout STANDARDS"), never a page's shape. A lesson that repeats another lesson's section list because "that is how it is done" has been generated wrong.
        - **The archived / parked lesson pages (`lessons-archive/`) are DELIBERATELY WITHHELD**: untracked and gitignored (owner instruction 2026-11-03). They must never be opened, read, quoted, compared against, or used as a reference for content, structure or layout — Pass A is run without them by design, and Pass B must not reintroduce them as a model.
        - **`style.css` is implementation only** and is NOT a source for content decisions: it must not be read to [infer, reference or guide] lesson content or shape (the same prohibition is printed at the head of the file). Authoring vocabulary comes from THIS file; behaviour comes from FUNCTION.md.
        - Lesson content is generated and organized according to PEDAGOGY-MAP.md (its process, defaults and per-lesson entries). This file is the mechanical contract — shell, classes, sizing.
        - Elements which exist because a FUNCTION creates them - their formatting is specified as PART of that function in FUNCTION.md, which is authoritative for those elements; this file defers to FUNCTION.md for them and does not restate them (Selection popup, note/recording marks, highlight rectangles, colour palette, toast, indicators/spinners, etc.). Style.css remains the single styling source for the whole site.

2. SITE CORE CHARACTERISTICS -
    a) The SITE/PLATFORM/PROJECT "Inglês Abre Portas" is a static English-teaching site — one teacher plus allow-listed students, three 'TRACKS' (kids, business, adult); every lesson is a standalone page. (Project GOALS are distributed: behaviour in FUNCTION.md, state/parameters in STATUS.md.)
    b) PAGE SHELL ORDER: doctype/head/title/stylesheet → #toast → header.brand (English text, centered logo 120px, rose drop-shadow) → #controlbar .control-bar (the "control bar": account/session info + tools, English) → #barhelp .barhelp (the "site-functions legend": ONE baked-in line, c below) → main#page → [.page-container (PAGE AREA: fixed 1400px wide (never shrinks with the viewport). Paper bg, 2px solid ink border, no radius/shadow, position:absolute — taken out of the document flow and pinned at a fixed left offset (15px), so the page and its content never reflow when the viewport is resized or a mark is painted. ALL page content — including the footer — lives inside it.) → [.content-area (CONTENT AREA: fixed 1200px wide (never shrinks with the viewport), centered inside the page area → exactly 100px margin on each side. All **authored lesson content** — text, cards, exercise controls, and the shared notebook — sits here; the layout is **fixed at generation** (text wraps deterministically within the fixed width, never re-flowing at display time) → centered h1 → the opener block (§"Lesson opener (abertura)" below) → lesson sections → #feed (shared notebook))] → footer]→ closing script block (BACKPACK/SECRET/TRACK/L + engine1.js/engine2.js (+ engine3.js only when the page uses a Tier-1 game) + the engine-load guard).
    c) #barhelp — the site-functions legend: ONE line, in English, directly under the control bar and above main#page, identical on every lesson page and written into the HTML by hand (no engine renders it, so it never depends on a session or a login). Its text is: *Select text to **Hear Teacher Pronunciation** or **Record Your Own**, See the **Pronunciation Key**, or **Attach a Note** to the Text — (on PC) Hold **Ctrl** and Select Text to Highlight it in **Yellow**, **Green** or **Red***. It **demonstrates** the marks instead of describing them (owner instruction 2026-11-03): `.hb-rec` carries the recording's own blue underline (it is part of the `mark.nb.has-rec` rule, not a copy of it) and `.hb-note` carries the saved note's `--bluebg` wash, so the legend can never drift from what the marks really look like; the three highlight names keep their swatch colours (`.hlk-y` / `.hlk-g` / `.hlk-r`). It is the ONLY place the site's own tools are explained: an opener, a section lead or an exercise never describes them (an exercise may still say what to DO — "select the line and record ⏺"). The legend is inert: it sits outside `.content-area`, where the notebook's gestures do not exist at all (§FUNCTION.md "Scope").

## HTML/CSS formatting
### Colors (CSS vars in :root)
- cream #f4eddd = page background
- paper #fdfaf2 = content surfaces
- ink #182136 = text, borders, buttons
- tan #b9854c = accents, hard shadows
- rose #d9c1ba
- ptw #96601f (Portuguese words) · blue #1d4ed8 + bluebg rgba(29,78,216,.16) (notes, very light blue)

### Fonts
- Playfair Display 700/900 → h1, h2 (letter-spacing .14em)
- Caveat 700 → .script (handwritten accents, rotated -2deg)
- Public Sans 400/600/700 → body, base 17px/1.6
- All font sizes are fixed constants (no viewport-relative sizing): h1 38px, .script 38px, body 17px 
- Resizing the viewport never changes text size and print output is identical on any device

### Standard element formatting guidance
- The lesson title (h1) must be written short enough to sit on ONE line at the fixed 38px size inside the 1200px content area 
- **Portuguese text is ALWAYS italic.** Mark it with `lang="pt"` (CSS `:lang(pt){font-style:italic}` italicizes it in any element), or use the legacy `<i>` / `.pt` / `.ptw` markers. A helper class that is not Portuguese-specific (`.thsub`, …) must NEVER carry `font-style` — italic comes only from a Portuguese marker.
- .pt = Portuguese explanation text: italic. .ptw = Portuguese word in exercises: italic, --ptw color, weight 600
- Content within a block may never overflow the block.
- Content within a block should not look cramped or contain unnecessary space
- **Vertical rhythm** (owner instruction 2026-11-03): a block never touches the block above or below it — `.card`, `.chart`, `.itemrow` and `.content-area > .panel` all carry a 14px vertical margin, so two stacked full blocks (a Treino/Quiz group, a panel and a chart, a row and a panel) keep the same breathing space. Members of an `.itemrow` are separated by the row's own 14px gap (a half/third never needs its own margin), the options of one question keep the `.qopts` gap or the `.qline` gap when they sit compact beside the stem, and a chart cell keeps its 12px horizontal padding. `qa/overflow.mjs` enforces this (BLOCKGAP / ROWGAP / OPTGAP / CHARTPAD) and prints the measured minimums. 

#### Following are guidance **IF** relevant content used, not mandatory, not templates
- .ptsound (optional) = a tag available to mark the LESSON-12 vowel sound-map labels (English sounds rendered in PT characters, e.g. ei/ai/ə): tan (--ptw), italic, NOT bold. Scope: ONLY those chart labels until further notice — NOT part of the pronunciation key (data-pron / dictionary.json / PronKey) and NOT a general-purpose pronunciation tag. May carry `lang="pt"`. (Renamed from .ptpronounce 2026-10-27.)
- .thsub = a chart-column-header subtitle (the second line under the main label): block, weight 400, smaller, reduced opacity.
- input.gap = fill-in blank: transparent, 2px tan bottom border, #fff8ea bg — a CONTIGUOUS line, never literal "___" underscores in the prompt
- `textarea` = a free-text block (a translation box, an authored answer box). **Fixed size, never drag-resizable** (owner instruction 2026-11-03): every authored textarea carries `resize:none`, because the layout is fixed at generation and a drag handle lets the student widen the block past its own slot and past the canvas. `qa/overflow.mjs` fails a page whose textarea can be dragged (RESIZE). `#feed` and `#trw` keep their ids — that is what persists.
- fieldset = exercise block: dashed tan border, 12px radius
- .chart = structured data table (cognate rules, phrase translations, to-be chunks, false friends): paper, 2px ink frame + tan shadow, ink header row, tan grid
- .chips = wrapping keyword pills ("quase iguais" list)
- .itemrow = a row of 2 (`data-cols="2"`) or 3 (`data-cols="3"`) equally-sized blocks; each block inside it is tagged `.itemsize-half` / `.itemsize-third` (`.itemsize` = full, the default, and takes no row). A half or third is never generated outside a row.
- .ex-head = exercise-group sub-heading inside Treino/Quiz: serif (Playfair), dark blue, tan left bar
- .blanks = wrapping row of fill-in pairs (word + input.gap)
- .dialog = dialogue block: #fff8ea fill, rose frame, bold speaker labels
- .listen = compact ▶ audio chip placed inline beside what it speaks
- A fill-in hint (Portuguese, italic) sits on its own line BELOW the input. Author it with the block fill-in layout (`.blanks.sent` / `.blanks.sent.cols`) so the line break actually renders — a `<br>` inside the default flex `.blanks` row is ignored.
- section headings (h2) carry a rose underline; exercise items are numbered 1..n under their group heading (no repeated section letter)
- @media print: hides header/#controlbar/#feed/footer, strips container border/shadow

### Text and visual sizing philosophy
- Minimum size an average person comfortably sees, clicks, reads.

## Lesson section/block formatting
### Lesson opener (abertura) — contract
Every lesson page opens with exactly ONE full-width block (`.card`, `pt` prose) directly under the `<h1>` and before the first `h2`. Its job is to state the lesson's **teaching intent** in the student's own language:

1. **What the student will be able to DO by the end**, shown in the lesson's own target strings rather than named as a topic (*I am Ana. I am from Recife. I am a designer.* — not "the verb to be").
2. **The mental model / law the lesson installs**, named in one clause — the rule that makes those strings true (*"the subject is never hidden"*, *"the letter does not command the sound"*), not the name of a grammar chapter.
3. **Where the lesson corrects a Portuguese→English mapping, that mapping stated explicitly**: one English form covering two Portuguese ones must be named with one example of each side. This is the part a generic grammar opener never says and the part a Brazilian student most needs — `be` = *ser* **and** *estar* (*I am a designer* / *I am hungry*), `have` = *ter* + *haver*, `to`/`for` = *para*, `live` = *morar*/*viver*. (Which mapping the lesson owns is PEDAGOGY-MAP's decision; this block fixes only that it must be said here.)

Then the opener stops: **3–5 sentences, no activity list, no table of contents, and never a description of the site's tools** — those live once, in `#barhelp` (§2c). If an opener needs a second paragraph to explain a button, the wrong block is being written.

### Blocks
- .card: paper bg, 2px ink border, 16px radius, 5px 5px 0 tan hard shadow
- Buttons: ink bg, cream text, 10px radius, 3px 3px 0 tan shadow, weight 600, 14px Public Sans. **Every button shares one default interaction** (owner instruction 2026-11-03) — lesson buttons and the engine's control-bar / popup / swatch buttons alike: on hover it brightens (`filter:brightness(1.14)`) and lifts 1px; on press it moves 2px into its own hard shadow; `:focus-visible` gets a 3px tan outline; `prefers-reduced-motion` removes the movement. The rules only modulate brightness and position — they never set `background` or `box-shadow` — so a button that carries its own colour (`.listen` tan, the highlight swatches, `.complete-btn`, `.remlink`) keeps it. Disabled and `.locked` buttons do not react. No page or section ever writes its own hover/press styling.
- Links: ink, weight 600. Dim text: #8a8072, 13px
- Lesson navigation: the control bar carries "← Last" / "Next →" buttons (always present, rendered by engine2.js from `L` alone — there is no lesson count: "Next →" is always enabled and goes to `lesson{L+1}`, "← Last" is disabled on lesson 1).

### Layout STANDARDS at generation (width & fill techniques; CSS stays fixed)
CSS uses fixed constants (no dynamic/viewport sizing and no CSS wrapping to force a fit). A block's width is a *result* of the pedagogical grouping decision — never a dial — and the CSS displays whatever division the content needed.

1. **Canvas.** Every block sits inside `.content-area` — the fixed 1200px column inside the 1400px `.page-container` (§2b). The layout is fixed at generation, nothing reflows at display time, and content within a block may never overflow the block.
2. **A row divides; the division follows the content (any N).** Content that is better read side by side goes in a `.itemrow`, which divides the full band into **as many columns as that content needs — no fixed 2/3 grid, no "allowed" column counts**. Each member takes an equal share of the row minus the 14px gaps; a member whose content is genuinely the wider one asks for more than one share with `data-span="K"` (K = 2..4, i.e. K of the row's columns). `data-cols="N"` on the row documents the column total and must be truthful (members + their extra spans). A block that stands on its own is full width (`.itemsize`, the default) and gets **no** row. Width is never a dial and never set on the member: no size class and no inline width, ever — the row decides, and `qa/width.mjs` fails a page that tries.
3. **Fill target — content inside the block.** Items generated in a block **saturate** their slot — the combined width gets as close as possible to, and never past, 95% of the slot a block owns (the full canvas, or that member's share of its row), with no loss of quality or utility; the only way of closing the gap that is not allowed is redundancy. Fill by increasing or reducing the verbosity and/or quantity of strings/items, and by the width of items *within* the row (gaps, column widths, option counts) — with real teaching content only.
4. **A division needs a stated reason** (divide, contrast, compare, sequence, or any other articulated reason). A row's members are height-equalised by **adding** content to the shorter ones, never by trimming the taller.
5. **Fixed vs elastic.** `h1`, `h2`, `.ex-head`, `.qstem`, `.lead` and hints are fixed strings and are exempt: they are neither stretched nor padded. Elastic: options, items, cells, chips, gaps. The same measurement decides both how much content to generate and whether a fixed string fits its slot.
6. **Charts and grids carry no prescribed column count.** A `.chart` is a table whose columns are whatever the content needs, always 100% of its block. No suggested option counts; question options wrap.
7. **Short single blocks:** no rule for now (owner decision) — leave as-is.
8. **Reasons are recorded in the design pass** (`designs/lessonNN.design.md`), not in the page.

#### Width math
Baseline = body 17px Public Sans = ratio 1.0. One unit for everything: **baseline characters (ce)**.

A row divides the 1180px of usable canvas into `N` columns separated by 14px gaps, so a member owning `span` of them has:

```
share_px(N, span) = (1180 − 14 × (N − 1)) × span / N          # equal shares, span = 1 by default
C_slot(N, span)   = share_px(N, span) ÷ 8.16                  # baseline chars the slot holds
```

| slot | share_px | `C_slot` (ce) |
|---|---|---|
| full block (no row) | 1180 | 144 |
| N=2, span 1 | 583 | 71 |
| N=3, span 1 | 384 | 47 |
| N=4, span 1 | 284 | 34 |
| N=3, span 2 | 777 | 95 |

`C_slot` = usable width ÷ 8.16px (baseline advance). Card and panel padding are already inside `share_px`'s budget by these constants (`.card` 18px side padding, `.panel` 16px + its 10px child margins) — subtract them from `share_px` when a block uses a class with different padding. Calibrate once with `qa/live.mjs` (real Chrome) rather than trusting the estimate.

| font | ratio `r` |
|---|---|
| body 17px | 1.00 |
| bold 17px (`.qstem`) | 1.08 |
| `.lead` 18px italic | 1.12 |
| `.ex-head` 19px Playfair | 1.28 |
| h1 / h2 38px + `.14em` spacing | 3.21 |

Control equivalents (add to the row sum): radio + label gap = 2.6 ce · `input.gap` at 9em = 19 ce · chip padding = 3.4 ce.

```
charsCap(slot, font) = C_slot / r(font)
fits(row)            = Σ(item chars × r) + Σ(control ce) ≤ C_slot
target(row)          = aim for C_slot, never exceed
```

Fixed-string exemption (same equation): a heading/stem fits its slot only if `chars × r ≤ C_slot`; if it does not, shorten the string or promote the block to the next itemsize — never pad the elastic row to cover it.
g) Consecutive questions are separated by a small, consistent vertical gap.
h) A concise section explainer (a standalone introduction to the section) CAN be a sub-heading under the h2: serif (Playfair), ~1pt larger than body, italic — written (in portugues or english as appropriate for lesson level) only when it adds important context and does not restate anything that the lesson already says.
i) A note that applies to one chart row CAN be a merged (colspan) row directly under that row.
j) Contrasting [linguistic, phonetic, or grammatical] [classes, categories, or concepts] are made visually distinct (using columns, spacing, block separation, or colors as appropriate) so the contrast reads - **This does not supersede 'professional-looking results' goal of 'layout STANDARDS' or other formatting rules**. 