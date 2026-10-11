# FORMAT — frozen site formatting contract (source of truth: style.css)
Reference this file whenever a task touches site appearance. Preserve everything here unless the owner explicitly asks to change it.

## Colors (CSS vars in :root)
- cream #f4eddd = page background
- paper #fdfaf2 = content surfaces
- ink #182136 = text, borders, buttons
- tan #b9854c = accents, hard shadows
- rose #d9c1ba · ok #177245 (green) · bad #a33327 (red)
- ptw #96601f (Portuguese words) · blue #1d4ed8 + bluebg rgba(29,78,216,.16) (notes, very light blue)

## Fonts
- Playfair Display 700/900 → h1, h2 (letter-spacing .14em)
- Caveat 700 → .script (handwritten accents, rotated -2deg)
- Public Sans 400/600/700 → body, base 17px/1.6

## Layout
- header.brand (English text, centered logo 120px, rose drop-shadow) → #controlbar .control-bar (the "control bar": Undo button + account/session info + tools + hotkey legend, English) → main#page → .page-container (PAGE AREA) → .content-area (CONTENT AREA)
- .page-container = PAGE AREA: fixed 1400px wide, height GROWS with content (no min-height, no clipping). Paper bg, 2px solid ink border, no radius/shadow, position:relative. ALL page content — including the footer — lives inside it.
- .content-area = CONTENT AREA: 1200px wide, centered inside the page area → exactly 100px margin on each side. All body content (text, cards, buttons, feed) sits here.
- .card: paper bg, 2px ink border, 16px radius, 5px 5px 0 tan hard shadow
- Buttons: ink bg, cream text, 10px radius, 3px 3px 0 tan shadow, weight 600, 14px Public Sans
- Links: ink, weight 600. Dim text: #8a8072, 13px

## Component semantics
- .ptw = Portuguese word in exercises: italic, --ptw color, weight 600
- input.gap = fill-in blank: transparent, 2px tan bottom border, #fff8ea bg; .ok green tint / .bad red tint after grading
- fieldset = quiz block: dashed tan border, 12px radius; ok/bad tints as above
- details (gabarito) = #fff8ea, dashed tan border — answers always inside <details>
- mark.nb = note/recording layer — the ONLY layer that lives in the text DOM: has-rec = underline 2px --ok + 🎙 suffix; has-note = very light blue wash + blue text + 📝 suffix (the wash is a painted background, so a highlight over the same span never hides it)
- #hlLayer = highlight PAINT layer (never mark.nb, never an element inside the text): position:absolute, pointer-events:none, no z-index; its children are absolutely-positioned translucent rectangles div.hlr + hlr-yellow/hlr-red/hlr-green (rgba fills, 3px radius, no border/icon, no cursor or hover change) measured from the highlighted text range
- .hlpal = tiny 3-swatch colour palette (yellow/red/green; the swatch fills are declared in style.css as `.hlpal button[data-c=…]`) inside a .pop, shown after a highlight is created
- .pop selection popup = fixed, paper, 2px ink border, 14px radius, tan hard shadow, max-width 380px; buttons small (12.5px, one line, English labels)
- #toast = fixed top-center pill, ink/cream; .recind recording indicator top-center
- @media print: hides header/#controlbar/#topbar/#feed/footer, strips container border/shadow

## Sizing philosophy
- Controls/hotkey text/buttons: minimum size an average person comfortably sees, clicks, reads. Never enlarge "for beauty"; never shrink below comfortable.
- Undo button lives in the control bar (line below the header), hidden until there is something to undo; other controls + hotkey legend also in the control bar. All control-bar text is English. Header text is English on all 5 pages.
