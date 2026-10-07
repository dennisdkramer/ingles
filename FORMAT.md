# FORMAT — frozen site formatting contract (source of truth: style.css)
Reference this file whenever a task touches site appearance. Preserve everything here unless the owner explicitly asks to change it.

## Colors (CSS vars in :root)
- cream #f4eddd = page background
- paper #fdfaf2 = content surfaces
- ink #182136 = text, borders, buttons
- tan #b9854c = accents, hard shadows
- rose #d9c1ba · ok #177245 (green) · bad #a33327 (red)
- ptw #96601f (Portuguese words) · blue #1d4ed8 + bluebg #dbeafe (notes)

## Fonts
- Playfair Display 700/900 → h1, h2 (letter-spacing .14em)
- Caveat 700 → .script (handwritten accents, rotated -2deg)
- Public Sans 400/600/700 → body, base 17px/1.6

## Layout
- header.brand (centered logo 120px, rose drop-shadow) → main#page → .page-container (DRAWABLE AREA) → .content-area (CONTENT AREA)
- .page-container = DRAWABLE AREA: fixed 1400px wide, height GROWS with content (no min-height, no clipping). Paper bg, 2px solid ink border, no radius/shadow, position:relative (drawings anchor here). ALL page content — including the footer — lives inside it.
- .content-area = CONTENT AREA: 1200px wide, centered inside the drawable area → exactly 100px margin on each side. All body content (text, cards, buttons, feed) sits here; drawings (.nbImg/.nbHl) anchor to .page-container and may extend into the 100px side margins.
- (removed 2026-10-07: .page-fixed 1200x1200 exact canvas + container overflow:hidden/min-height — owner now requires content-dependent height and a 1400px drawable / 1200px content split)
- .card: paper bg, 2px ink border, 16px radius, 5px 5px 0 tan hard shadow
- Buttons: ink bg, cream text, 10px radius, 3px 3px 0 tan shadow, weight 600, 14px Public Sans
- Links: ink, weight 600. Dim text: #8a8072, 13px

## Component semantics
- .ptw = Portuguese word in exercises: italic, --ptw color, weight 600
- input.gap = fill-in blank: transparent, 2px tan bottom border, #fff8ea bg; .ok green tint / .bad red tint after grading
- fieldset = quiz block: dashed tan border, 12px radius; ok/bad tints as above
- details (gabarito) = #fff8ea, dashed tan border — answers always inside <details>
- mark.nb: has-rec = underline 2px --ok + 🎙 suffix; has-note = bluebg fill + blue text + 📝 suffix; no other mark styling
- .pop selection popup = fixed, paper, 2px ink border, 14px radius, tan hard shadow, max-width 380px; buttons small (12.5px, one line, English labels)
- #toast = fixed top-center pill, ink/cream; .recind recording indicator top-center
- .nbImg drawings: position:absolute INSIDE .page-container, border:0, pointer-events:none (interact only via global shift/ctrl handlers)
- @media print: hides header/#topbar/#feed/footer, strips container border/shadow

## Sizing philosophy
- Controls/hotkey text/buttons: minimum size an average person comfortably sees, clicks, reads. Never enlarge "for beauty"; never shrink below comfortable.
- Undo/back button floats top-right for teacher AND student; other controls + hotkey legend at top of each lesson.

## Header & Control Bar (updated 2026-10-07)
- All header text is ENGLISH. Brand header: `ENGLISH OPENS DOORS` (+ `Let's go` tagline on portal pages); lesson headers: `KIDS/BUSINESS/ADULTS — BOOK 1 · LESSON 1`. Page `<title>`s are English too.
- CONTROL BAR: the line directly below the header, `<div id="topbar" class="control-bar">` on lesson pages (populated by engine2.js). Portal pages show a static `.control-bar.placeholder` ("Loading…") since they have no session gate.
- Control bar contents (lesson pages, left→right): identity chip (🦺 email · track), Home link (→ portal.html), 🔄 Sync button, ↶ Undo button (hidden until undo stack non-empty; Ctrl+Z also works), keyboard-help hints, then teacher-only extras (student selector, mode selector, Kids aux-mute).
- The Undo button lives IN the control bar (the old fixed top-right floating button was removed).
