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
- .ptw = Portuguese word in exercises: italic, --ptw color, weight 600
- input.gap = fill-in blank: transparent, 2px tan bottom border, #fff8ea bg
- fieldset = exercise block: dashed tan border, 12px radius
- details = collapsible block: #fff8ea, dashed tan border (generic element styling)
- .chart = structured data table (cognate rules, phrase translations, to-be chunks, false friends): paper, 2px ink frame + tan shadow, ink header row, tan grid
- .chips = wrapping keyword pills ("quase iguais" list)
- .grid3 = 3-up row of cards (the 3 discoveries, the a/an rules)
- .ex-head = exercise-group sub-heading inside Treino/Quiz: tan left bar
- .blanks = wrapping row of fill-in pairs (word + input.gap)
- .dialog = dialogue block: #fff8ea fill, rose frame, bold speaker labels
- .listen = compact ▶ audio chip placed inline beside what it speaks
- section headings (h2) carry a rose underline; exercise items are numbered 1..n under their group heading (no repeated section letter)
- @media print: hides header/#controlbar/#topbar/#feed/footer, strips container border/shadow

## Function-generated formatting → FUNCTION.md
- The selection popup, the note/recording marks, the highlight rectangles, the colour palette, the toast and the recording indicator/spinner exist only because a FUNCTION creates them at run time, so their formatting is specified as PART of that function — in FUNCTION.md, which is authoritative for those elements. style.css remains the single styling source for the whole site; this file defers to FUNCTION.md for them and no longer restates them.

## Sizing philosophy
- Controls/hotkey text/buttons: minimum size an average person comfortably sees, clicks, reads. Never enlarge "for beauty"; never shrink below comfortable.
- Control-bar text and header text are English on all 5 pages.
