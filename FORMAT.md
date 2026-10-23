# FORMAT — frozen site formatting contract (source of truth: style.css)
Reference this file whenever a task touches site appearance. Preserve everything here unless the owner explicitly asks to change it.
## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-FM<n>.)_

_(none queued.)_

## Colors (CSS vars in :root)
- cream #f4eddd = page background
- paper #fdfaf2 = content surfaces
- ink #182136 = text, borders, buttons
- tan #b9854c = accents, hard shadows
- rose #d9c1ba
- ptw #96601f (Portuguese words) · blue #1d4ed8 + bluebg rgba(29,78,216,.16) (notes, very light blue)

## Fonts
- Playfair Display 700/900 → h1, h2 (letter-spacing .14em)
- Caveat 700 → .script (handwritten accents, rotated -2deg)
- Public Sans 400/600/700 → body, base 17px/1.6
- All font sizes are fixed constants (no viewport-relative sizing): h1 38px, .script 38px, body 17px — so resizing the viewport never changes text size and print output is identical on any device.
- The lesson title (h1) is centered, and is written short enough to sit on ONE line at the fixed 38px size inside the 1200px content area — title-length guidance lives in CONTENT.md. Sizes stay fixed constants (never dynamic/variable to force a fit).

## Layout
- header.brand (English text, centered logo 120px, rose drop-shadow) → #controlbar .control-bar (the "control bar": account/session info + tools, English) → main#page → .page-container (PAGE AREA) → .content-area (CONTENT AREA)
- .page-container = PAGE AREA: fixed 1400px wide (never shrinks with the viewport), height GROWS with content (no min-height, no clipping). Paper bg, 2px solid ink border, no radius/shadow, position:absolute — taken out of the document flow and pinned at a fixed left offset (15px), so the page and its content never reflow when the viewport is resized, a mark is painted or the shared notebook grows below it. ALL page content — including the footer — lives inside it.
- .content-area = CONTENT AREA: fixed 1200px wide (never shrinks with the viewport), centered inside the page area → exactly 100px margin on each side. All body content (text, cards, buttons, feed) sits here and re-flows within this fixed box.
- .card: paper bg, 2px ink border, 16px radius, 5px 5px 0 tan hard shadow
- Buttons: ink bg, cream text, 10px radius, 3px 3px 0 tan shadow, weight 600, 14px Public Sans
- Links: ink, weight 600. Dim text: #8a8072, 13px
- Lesson navigation: the control bar carries "← Last lesson" / "Next lesson →" buttons (always present, rendered by engine2.js from `L` and `COUNT`; the boundary button is greyed/disabled).

## Component semantics (authored in the lesson HTML — content, see CONTENT.md)
- .pt = Portuguese explanation text: italic (ALL authored Portuguese text is italic). .ptw = Portuguese word in exercises: italic, --ptw color, weight 600
- input.gap = fill-in blank: transparent, 2px tan bottom border, #fff8ea bg — a CONTIGUOUS line, never literal "___" underscores in the prompt
- fieldset = exercise block: dashed tan border, 12px radius
- details = collapsible block: #fff8ea, dashed tan border (generic element styling)
- .chart = structured data table (cognate rules, phrase translations, to-be chunks, false friends): paper, 2px ink frame + tan shadow, ink header row, tan grid
- .chips = wrapping keyword pills ("quase iguais" list)
- .grid3 = 3-up row of cards (the 3 discoveries, the a/an rules)
- .ex-head = exercise-group sub-heading inside Treino/Quiz: serif (Playfair), dark blue, tan left bar
- .blanks = wrapping row of fill-in pairs (word + input.gap)
- .dialog = dialogue block: #fff8ea fill, rose frame, bold speaker labels
- .listen = compact ▶ audio chip placed inline beside what it speaks
- Required prepositions (look AT, go TO, give TO) are visually marked — a distinct accent color (tan) and bold — so the verb+preposition pair reads as one unit
- A fill-in hint (Portuguese, italic) sits on its own line BELOW the input when inline placement would overflow the block or look cramped. Author it with the block fill-in layout (`.blanks.sent` / `.blanks.sent.cols`) so the line break actually renders — a `<br>` inside the default flex `.blanks` row is ignored.
- section headings (h2) carry a rose underline; exercise items are numbered 1..n under their group heading (no repeated section letter)
- @media print: hides header/#controlbar/#topbar/#feed/footer, strips container border/shadow

## Layout at generation (blocks vary at authoring time; CSS stays fixed)
- CSS uses fixed constants (no dynamic/viewport sizing and no text wrapping). Layout is not pre-assigned: a block's width and column count are the OUTCOME of the generation loop in CONTENT.md, and CSS only implements that outcome — it never rescales or wraps content to force a fit.
- Width: a block is half-width when it sits beside another half-width block on the same row. A block left on its own earns full width by generating more content (more items, more columns, longer phrases); only when pedagogy insists it stay small is it kept half-width and centered (.panel.centered).
- A multiple-choice / listening group is full-width whenever its stem+options row is too wide for half a panel; half-width is only for a group whose row is short (short stem + one-word options).
- A half-width block must PAIR with the half-width block beside it. If its row-mate was made full-width, re-pair them (make the mate half-width when its content is small) or center the lone half-width block (.panel.centered).
- Columns: when a block's items fill only a sliver of its width (roughly a quarter or less), they flow into more columns — two normally, four when the items are very short.
- Height: two adjacent half-width blocks are balanced by extending the shorter one (more questions, examples, vocabulary, or dialogue lines).
- Multiple-choice options never wrap mid-option (no CSS text wrapping). Short options sit on one horizontal line, distributed with even spacing (space-around) and indented ~10px from the question; long options (whole sentences) are stacked under the stem.
- Listen-and-choose items keep the ▶ audio chip inline with their answer options (never on its own line above them). A recording prompt states the exact text to record inline — never a reference to another block.
- Consecutive questions are separated by a small, consistent vertical gap (breathing room between questions).
- A section explainer (a standalone PT sentence that introduces a section) is a sub-heading under the h2: serif (Playfair), ~1pt larger than body, italic — written only when it adds what the chart below does not already say.
- A note that applies to one chart row is a merged (colspan) row directly under that row — not a floating paragraph.
- Paired content (e.g. a phrase chart and a dialogue) is placed side-by-side half-width, with the Portuguese below the English (a line break in the same cell, not a separate column).
- Contrasting versions/concepts (two columns, two uses, two conjugations) are always visually distinct — columns or clear spacing.


## Function-generated formatting → FUNCTION.md
- The selection popup, the note/recording marks, the highlight rectangles, the colour palette, the toast and the recording indicator/spinner exist only because a FUNCTION creates them at run time, so their formatting is specified as PART of that function — in FUNCTION.md, which is authoritative for those elements. style.css remains the single styling source for the whole site; this file defers to FUNCTION.md for them and no longer restates them.

## Sizing philosophy
- Controls/hotkey text/buttons: minimum size an average person comfortably sees, clicks, reads. Never enlarge "for beauty"; never shrink below comfortable.
- Control-bar text and header text are English on all 5 pages.
