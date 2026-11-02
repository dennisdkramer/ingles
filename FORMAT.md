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
        - Lesson content is generated and organized without regard to formatting - following PEDAGOGICAL DIRECTIVES (PEDAGOGY.md) and Generation guidelines (CONTENT.md)- and formatted/cleaned up afterward.
        - Elements which exist because a FUNCTION creates them - their formatting is specified as PART of that function in FUNCTION.md, which is authoritative for those elements; this file defers to FUNCTION.md for them and does not restate them (Selection popup, note/recording marks, highlight rectangles, colour palette, toast, indicators/spinners, etc.). Style.css remains the single styling source for the whole site.

2. SITE CORE CHARACTERISTICS -
    a) The SITE/PLATFORM/PROJECT "Inglês Abre Portas" is a static English-teaching site — one teacher plus allow-listed students, three 'TRACKS' (kids, business, adult); every lesson is a standalone page. (Project GOALS are distributed: behaviour in FUNCTION.md, state/parameters in STATUS.md.)
    b) PAGE SHELL ORDER: doctype/head/title/stylesheet → #toast → header.brand (English text, centered logo 120px, rose drop-shadow) → #controlbar .control-bar (the "control bar": account/session info + tools, English) → main#page → [.page-container (PAGE AREA: fixed 1400px wide (never shrinks with the viewport). Paper bg, 2px solid ink border, no radius/shadow, position:absolute — taken out of the document flow and pinned at a fixed left offset (15px), so the page and its content never reflow when the viewport is resized or a mark is painted. ALL page content — including the footer — lives inside it.) → [.content-area (CONTENT AREA: fixed 1200px wide (never shrinks with the viewport), centered inside the page area → exactly 100px margin on each side. All **authored lesson content** — text, cards, exercise controls, and the shared notebook — sits here; the layout is **fixed at generation** (text wraps deterministically within the fixed width, never re-flowing at display time) → centered h1 → lesson sections → #feed (shared notebook))] → footer]→ closing script block (BACKPACK/SECRET/TRACK/L/COUNT + engine1.js/engine2.js + the engine-load guard).

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

#### Following are guidance **IF** relevant content used, not mandatory, not templates
- .ptsound (optional) = a tag available to mark the LESSON-12 vowel sound-map labels (English sounds rendered in PT characters, e.g. ei/ai/ə): tan (--ptw), italic, NOT bold. Scope: ONLY those chart labels until further notice — NOT part of the pronunciation key (data-pron / dictionary.json / PronKey) and NOT a general-purpose pronunciation tag. May carry `lang="pt"`. (Renamed from .ptpronounce 2026-10-27.)
- .thsub = a chart-column-header subtitle (the second line under the main label): block, weight 400, smaller, reduced opacity.
- input.gap = fill-in blank: transparent, 2px tan bottom border, #fff8ea bg — a CONTIGUOUS line, never literal "___" underscores in the prompt
- fieldset = exercise block: dashed tan border, 12px radius
- .chart = structured data table (cognate rules, phrase translations, to-be chunks, false friends): paper, 2px ink frame + tan shadow, ink header row, tan grid
- .chips = wrapping keyword pills ("quase iguais" list)
- .grid3 = an available 3-column row of cards
- .ex-head = exercise-group sub-heading inside Treino/Quiz: serif (Playfair), dark blue, tan left bar
- .blanks = wrapping row of fill-in pairs (word + input.gap)
- .dialog = dialogue block: #fff8ea fill, rose frame, bold speaker labels
- .listen = compact ▶ audio chip placed inline beside what it speaks
- A fill-in hint (Portuguese, italic) sits on its own line BELOW the input when inline placement would overflow the block or look cramped. Author it with the block fill-in layout (`.blanks.sent` / `.blanks.sent.cols`) so the line break actually renders — a `<br>` inside the default flex `.blanks` row is ignored.
- section headings (h2) carry a rose underline; exercise items are numbered 1..n under their group heading (no repeated section letter)
- @media print: hides header/#controlbar/#feed/footer, strips container border/shadow

### Sizing philosophy
- Minimum size an average person comfortably sees, clicks, reads.

## Lesson section/block formatting
- .card: paper bg, 2px ink border, 16px radius, 5px 5px 0 tan hard shadow
- Buttons: ink bg, cream text, 10px radius, 3px 3px 0 tan shadow, weight 600, 14px Public Sans
- Links: ink, weight 600. Dim text: #8a8072, 13px
- Lesson navigation: the control bar carries "← Last" / "Next →" buttons (always present, rendered by engine2.js from `L` and `COUNT`; the boundary button is greyed/disabled).

### Layout STANDARDS at generation (width & fill techniques; CSS stays fixed)
CSS uses fixed constants (no dynamic/viewport sizing and no CSS wrapping to force a fit). Layout is not pre-assigned: a block's width and column count are chosen to fit its content, and CSS only implements that choice — rarely rescales and never wraps content to force a fit. The width/fill/alignment techniques below are STANDARDS serving goals of "no dead space" and "professional-looking results":
a) Width: a block MAY sit half-width beside another block of the same width; a block left on its own CAN be widened with more content.
b) Priority is minimizing dead space.
c) Block width decisions are content-aware of what they contain AND context aware of adjacent blocks - If any block must be made half-width and an adjacent block COULD be made half width, do so and pair the two blocks horizontally per (a).
d) Columns are free - prioritize filling block width.
e) Adjacent blocks of different heights should be analysed to determine the quantity (and type) of (real, relevant) content that could be added to extend the shorter of the two and trigger a 'cleanup' generation step to do so.
f) Block contents and their child elements (eg. multiple choice options) should be generated (or shortened/lengthened in cleanup) so that the total length of [each item/option] OR [all items/options] fills >50% of its parent block's width. If <50% is filled, block should be made half-width.
g) Consecutive questions are separated by a small, consistent vertical gap.
h) A concise section explainer (a standalone introduction to the section) CAN be a sub-heading under the h2: serif (Playfair), ~1pt larger than body, italic — written (in portugues or english as appropriate for lesson level) only when it adds important context and does not restate anything that the lesson already says.
i) A note that applies to one chart row CAN be a merged (colspan) row directly under that row.
j) Contrasting [linguistic, phonetic, or grammatical] [classes, categories, or concepts] are made visually distinct (using columns, spacing, block separation, or colors as appropriate) so the contrast reads - **This does not supersede 'professional-looking results' goal of 'layout STANDARDS' or other formatting rules**. 
k) Only if strong, defensible, pedagogy-based reason for block to stay small it is kept narrow and centered (.panel.centered).