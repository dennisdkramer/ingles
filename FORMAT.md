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

## Layout
- header.brand (English text, centered logo 120px, rose drop-shadow) → #controlbar .control-bar (the "control bar": account/session info + tools, English — the ↶ Undo / ↷ Redo pair and its "Ctrl+Z=undo" legend were REMOVED, owner spec 2026-10-12, so the bar carries no hotkey legend any more) → main#page → .page-container (PAGE AREA) → .content-area (CONTENT AREA)
- .page-container = PAGE AREA: fixed 1400px wide, height GROWS with content (no min-height, no clipping). Paper bg, 2px solid ink border, no radius/shadow, position:relative. ALL page content — including the footer — lives inside it.
- .content-area = CONTENT AREA: 1200px wide, centered inside the page area → exactly 100px margin on each side. All body content (text, cards, buttons, feed) sits here.
- .card: paper bg, 2px ink border, 16px radius, 5px 5px 0 tan hard shadow
- Buttons: ink bg, cream text, 10px radius, 3px 3px 0 tan shadow, weight 600, 14px Public Sans
- Links: ink, weight 600. Dim text: #8a8072, 13px

## Component semantics (authored in the lesson HTML — content, see CONTENT.md)
- .ptw = Portuguese word in exercises: italic, --ptw color, weight 600
- input.gap = fill-in blank: transparent, 2px tan bottom border, #fff8ea bg
- fieldset = exercise block: dashed tan border, 12px radius
- details = collapsible block: #fff8ea, dashed tan border (generic element styling — no lesson page uses <details> any more)
- @media print: hides header/#controlbar/#topbar/#feed/footer, strips container border/shadow

## Function-generated formatting → FUNCTION.md
- `.pop` (selection popup), `mark.nb` (note/recording mark), `#hlLayer` + `.hlr-*` (highlight rectangles), `.hlpal` (colour palette), `#toast`, `.recind` and `.spin`/`.pulse` exist only because a FUNCTION creates them at run time (engine1.js `hlLayerEl`/`openPop`/`openNbPopup`/`nbPopHTML`/`markRecording`/`ensureMark`/`hlPalette`/`toast`/`rec`/`nbBtnSpinner`, plus engine2.js `renderLayer`), so their formatting is specified as PART of that function — in FUNCTION.md, which is authoritative for those elements. style.css remains the single styling source for the whole site; this file defers to FUNCTION.md for them and no longer restates them.

## Sizing philosophy
- Controls/hotkey text/buttons: minimum size an average person comfortably sees, clicks, reads. Never enlarge "for beauty"; never shrink below comfortable.
- There are NO Undo (↶) / Redo (↷) buttons and no "Ctrl+Z=undo" legend in the control bar any more (removed 2026-10-12): deleting a highlight (Ctrl+click), deleting a note/recording (🗑 Delete) and recolouring a highlight are FINAL — the page applies the change at once and the network write follows; re-doing an action takes one click. Control-bar text and header text are English on all 5 pages.
