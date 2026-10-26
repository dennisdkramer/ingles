# FORMAT — site structure & formatting contract (source of truth: style.css)
Reference this file whenever a task touches site appearance or structure. The EXISTING components and their styling are stable — changing them needs owner sign-off — but NEW components and media may be ADDED when pedagogy calls for them, and are recorded here when introduced. Behaviour lives in FUNCTION.md; content handling in CONTENT.md.

## Site structure
- "Inglês Abre Portas" is a static English-teaching site — one teacher plus allow-listed students, three books (kids, business, adults/nsfw); every lesson is a standalone page. (Project GOALS are distributed: behaviour in FUNCTION.md, state/parameters in STATUS.md.)
- Page shell order: header.brand (English text, centered logo 120px, rose drop-shadow) → #controlbar .control-bar (the "control bar": account/session info + tools, English) → main#page → .page-container (PAGE AREA) → .content-area (CONTENT AREA).
- .page-container = PAGE AREA: fixed 1400px wide (never shrinks with the viewport), height GROWS with content (no min-height, no clipping). Paper bg, 2px solid ink border, no radius/shadow, position:absolute — taken out of the document flow and pinned at a fixed left offset (15px), so the page and its content never reflow when the viewport is resized, a mark is painted or the shared notebook grows below it. ALL page content — including the footer — lives inside it.
- .content-area = CONTENT AREA: fixed 1200px wide (never shrinks with the viewport), centered inside the page area → exactly 100px margin on each side. All body content (text, cards, buttons, feed) sits here and re-flows within this fixed box.

## Lesson page structure
- The mechanical skeleton (structural): doctype/head/title/stylesheet → #toast → header.brand → #controlbar → main#page → .page-container → .content-area → centered h1 → lesson sections → footer → closing script block (BACKPACK/SECRET/TRACK/L/COUNT + engine1.js/engine2.js + the engine-load guard) → #feed (shared notebook). The content-side list of mandatory page parts is in CONTENT.md.
- The lesson title (h1) is centered, and is written short enough to sit on ONE line at the fixed 38px size inside the 1200px content area — title-length guidance lives in CONTENT.md. Sizes stay fixed constants (never dynamic/variable to force a fit).

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
- All font sizes are fixed constants (no viewport-relative sizing): h1 38px, .script 38px, body 17px — so resizing the viewport never changes text size and print output is identical on any device.

### Available components — CATALOG (none is required; use only what the pedagogy needs; authored in the lesson HTML — content, see CONTENT.md)
- **Portuguese text is ALWAYS italic.** Mark it with `lang="pt"` (CSS `:lang(pt){font-style:italic}` italicizes it in any element), or use the legacy `<i>` / `.pt` / `.ptw` markers. A helper class that is not Portuguese-specific (`.thsub`, …) must NEVER carry `font-style` — italic comes only from a Portuguese marker.
- .pt = Portuguese explanation text: italic. .ptw = Portuguese word in exercises: italic, --ptw color, weight 600
- .ptpronounce (optional) = a tag available to mark Portuguese pronunciation text: tan (--ptw), italic, NOT bold. May carry `lang="pt"`. An option, never a required rule.
- .thsub = a chart-column-header subtitle (the second line under the main label): block, weight 400, smaller, reduced opacity.
- input.gap = fill-in blank: transparent, 2px tan bottom border, #fff8ea bg — a CONTIGUOUS line, never literal "___" underscores in the prompt
- fieldset = exercise block: dashed tan border, 12px radius
- details = collapsible block: #fff8ea, dashed tan border (generic element styling)
- .chart = structured data table (cognate rules, phrase translations, to-be chunks, false friends): paper, 2px ink frame + tan shadow, ink header row, tan grid
- .chips = wrapping keyword pills ("quase iguais" list)
- .grid3 = an available 3-column row of cards
- .ex-head = exercise-group sub-heading inside Treino/Quiz: serif (Playfair), dark blue, tan left bar
- .blanks = wrapping row of fill-in pairs (word + input.gap)
- .dialog = dialogue block: #fff8ea fill, rose frame, bold speaker labels
- .listen = compact ▶ audio chip placed inline beside what it speaks
- Pronunciation content types (business/lesson12–14) need NO new CSS: they reuse .chart, .grid3, .qgrid.stack, .blanks.sent and the ⏺ recording block as-is. The pronunciation key itself (bold/grey/schwa, two levels L1/L2) is rendered by `wirePron()` from `data-pron="word"` (L1) / `data-pron="word:2"` (L2) in engine2.js, not by any lesson-specific styling.
- Required prepositions (look AT, go TO, give TO) are visually marked — a distinct accent color (tan) and bold — so the verb+preposition pair reads as one unit
- A fill-in hint (Portuguese, italic) sits on its own line BELOW the input when inline placement would overflow the block or look cramped. Author it with the block fill-in layout (`.blanks.sent` / `.blanks.sent.cols`) so the line break actually renders — a `<br>` inside the default flex `.blanks` row is ignored.
- section headings (h2) carry a rose underline; exercise items are numbered 1..n under their group heading (no repeated section letter)
- @media print: hides header/#controlbar/#topbar/#feed/footer, strips container border/shadow

### Sizing philosophy
- Controls/hotkey text/buttons: minimum size an average person comfortably sees, clicks, reads. Never enlarge "for beauty"; never shrink below comfortable.
- Control-bar text and header text are English on all 5 pages.

## Lesson section/block formatting
- .card: paper bg, 2px ink border, 16px radius, 5px 5px 0 tan hard shadow
- Buttons: ink bg, cream text, 10px radius, 3px 3px 0 tan shadow, weight 600, 14px Public Sans
- Links: ink, weight 600. Dim text: #8a8072, 13px
- Lesson navigation: the control bar carries "← Last lesson" / "Next lesson →" buttons (always present, rendered by engine2.js from `L` and `COUNT`; the boundary button is greyed/disabled).

### Layout OPTIONS at generation (NON-BINDING — available techniques; CSS stays fixed)
CSS uses fixed constants (no dynamic/viewport sizing and no text wrapping). Layout is NOT pre-assigned and none of the following is required: a block's width and column count are chosen to fit its content, and CSS only implements that choice — it never rescales or wraps content to force a fit. The techniques below are available and applied only when they help:
- Width: a block MAY sit half-width beside another block of the same width; a block left on its own CAN be widened with more content, or — only if pedagogy insists it stay small — kept narrow and centered (.panel.centered).
- Fill the width by judgment, not by a fixed count: you CAN generate enough content that a block fills its width with no dead space; never pad with filler.
- Small narrow blocks CAN be centered when their text leaves one side empty.
- A multiple-choice / listening group whose stem+options row is too wide for a narrow block CAN be widened so its row fits.
- A narrow block CAN pair with the block beside it; a narrow block left on its own can be centered.
- Columns are free: short items CAN flow into more columns when that reads better.
- Adjacent blocks of different heights CAN be balanced by extending the shorter with real content — only when alignment matters there.
- Multiple-choice options never wrap mid-option (no CSS text wrapping). Short options CAN sit on one line; long options (whole sentences) CAN be stacked under the stem.
- Listen-and-choose items CAN keep the ▶ audio chip inline with their options. A recording prompt states the exact text to record inline.
- Consecutive questions are separated by a small, consistent vertical gap.
- A section explainer (a standalone PT sentence that introduces a section) CAN be a sub-heading under the h2: serif (Playfair), ~1pt larger than body, italic — written only when it adds what the block below does not already say.
- A note that applies to one chart row CAN be a merged (colspan) row directly under that row.
- Paired content CAN be placed side-by-side, with the Portuguese below the English.
- Contrasting versions/concepts are made visually distinct — columns or clear spacing — so the contrast reads.

## Function-generated formatting → FUNCTION.md
- The selection popup, the note/recording marks, the highlight rectangles, the colour palette, the toast and the recording indicator/spinner exist only because a FUNCTION creates them at run time, so their formatting is specified as PART of that function — in FUNCTION.md, which is authoritative for those elements. style.css remains the single styling source for the whole site; this file defers to FUNCTION.md for them and no longer restates them.
