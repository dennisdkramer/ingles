# FUNCTION — frozen site behavior contract
Reference this file whenever a task touches lesson functionality. Preserve everything here unless the owner explicitly asks to change it.

## Persistence & identity
- ALL user data persists server-side (Apps Script Sheet "IAP_backpack!layer" + Drive "IAP_uploads"), and is separate PER STUDENT AND PER BOOK (track). No cross-contamination between students or between tracks.
- Recordings, notes, highlights, filled-in fields, answered questions: all persistent.
- localStorage must never be a source of truth (ghost-data bug of Oct 2026); server is sole source.

## Highlight (text range) — owner spec 2026-10-11
- Gesture: Ctrl must be held at MOUSEDOWN over the selection; if Ctrl is ALSO held at MOUSEUP, that release creates the highlight. Nothing else creates one (no keyboard-only path, no touch gesture, no automatic path).
- Ctrl at mousedown SUPPRESSES the other selection-based functions for the whole gesture (and ~1.2s after it ends): the Hear / Record / Note popup never opens for a Ctrl gesture, whether or not a highlight ends up being created. A normal selection (no Ctrl at mousedown) still opens that popup exactly as before.
- Ctrl+click ON a painted highlight = delete it. One action: no confirmation, no popup. That deletion is the ONLY interaction a highlight has.
- A highlight never makes the text clickable and never changes mouseover or the cursor: no click behaviour of its own (a plain click on highlighted text does nothing) and no hover state.
- Ctrl+drag over an existing highlight MERGES HIGHLIGHTS ONLY: any highlight of the same block that overlaps or merely touches the new selection becomes one single highlight, extended to cover both. Overlaps never accumulate as separate highlights. Notes and recordings are never merged, extended, moved or recoloured by a highlight gesture.
- LAYER SEPARATION (owner rule, rework #2): highlights are PAINTED ON THEIR OWN LAYER (`#hlLayer`) — a div of absolutely-positioned translucent rectangles (`.hlr` + `hlr-yellow`/`hlr-red`/`hlr-green`) measured from the text range. A highlight is therefore NOT an element of the text at all; the text DOM belongs to the note/recording layer (mark.nb) alone. Consequence: a highlight may intersect or cross a note/recording in ANY way and both stay whole — nothing is ever refused, split, cloned, moved, hidden or suppressed in either direction, and creating or deleting one never changes the other. `#hlLayer` is `pointer-events:none` (it can never block a click, a drag or a text selection) and carries no z-index (so it creates no stacking context and stays below `.pop`/`#toast`).
- Anchor: the highlighted STRING + (block index, character offset). The offsets are the ruler, so a highlight keeps its place across resize, zoom, font changes and reflow — even while notes/recordings are wrapped around the same characters. Block+offset wins over the text alone, so two identical strings in the same paragraph keep their own places; if that no longer matches (page edited) it falls back to the anchor text, then to nothing.
- The layer may be re-measured (reflow) at any time: window resize/zoom, web-font load, `<details>` open/close and any mouseup repaint the rectangles from the anchors.
- It may span several lines of the same block (paragraph, list item, cell, heading) but never crosses a block boundary (refused with a toast).
- Look: semi-transparent yellow fill that keeps the text readable, rounded ends on every line fragment, no border, no icon.
- After a highlight is created, a tiny colour palette pops above the LAST painted rectangle with three swatches: yellow / transparent red / transparent green. Clicking a swatch recolours the highlight and closes the palette; any click elsewhere closes it too, and so does any other key press. Ctrl and Meta are the exception and never close it: the palette is born while the gesture's own Ctrl is still held down, so that key's keydown (including the auto-repeat the keyboard keeps sending while it stays held) must not close the popup the gesture just opened.
- Coexistence: recording (underlined + 🎙), note (very light blue + 📝) and highlight are three separate layers; all three can cover the same span and none of them replaces or triggers another.
- PC only: highlights have no touch gesture.
- Persistence: server row type "hl", anchor = the highlighted string, data = {"color":"yellow|red|green","b":<block index>,"o":<char offset>}; a recolour is a "set" on the same id. Old rows without b/o still restore by anchor text. No backend change needed (add/set/del already accept any type).
- DOM contract: NO highlight element exists in the page text. The only highlight DOM lives inside `#hlLayer`: `div.hlr.hlr-<colour>[data-hlid=<server row id>]`. Notes/recordings stay on mark.nb (has-note / has-rec). The two element sets are never mixed and never nest.

## Undo
- Ctrl+z reverts sequentially: highlights (create / recolour / delete), deletions, typing, field selections.
- A back/undo button also exists, usable by teacher AND student, floating top-right of the page.
- Undo history covers both teacher and student actions sequentially.

## Teacher/student control
- There is NO per-student permission level and no visibility toggle anywhere in the code (removed 2026-10-11 as dead code: its value was sent to the server but never read, so it never changed behaviour). Teacher and student see the same page functionality.
- The only teacher-only control is the student selector in the control bar ("demo (you)" + students of the current track); changing it switches which student's layer is loaded and shown.
- Hotkey legend at top of each lesson; sizing per FORMAT.md.

## Engines & pages
- engine1.js = gate (sessionStorage sig check), selection popup (▶ Hear / ⏺ Record / 📝 Note), Ctrl text-range highlight gestures painted on their own layer (#hlLayer: create on Ctrl+mouseup / merge / delete / colour palette, popup suppressed for the whole Ctrl gesture), recording (stops after 2s silence, 🎙 indicator, spinner), notes, anchors, send() to backend.
- engine2.js = topbar, layer sync (15s), quiz grading, highlight render/delete (#hlLayer rectangles rebuilt from the server rows: hlRestore/hlDrop/hlReflow) and undo, showAnchor (audio cache, "carregando…", 4s → "nao encontrado").
- Lessons are content-only files: config consts (TRACK, LESSON, SECRET, BACKPACK…) + engine includes. Engines/style always ship as full files.
- Gate hash: h(s){let x=0;for(const c of s)x=(x*31+c.charCodeAt(0))|0;return x} applied to email+track+SECRET ("abreportas2025"); invalid/missing gate → redirect to portal.html.
- Backend actions: POST add/set/del; GET ping/layer/file/dbg. ?action=dbg returns server log.

## Pedagogy rules (do not break)
- NO improvised phonetic respellings; pronunciation audio ONLY via ▶ TTS.
- Portuguese only for translation/explanation. PT words in exercises: italic + colored (.ptw).
- Popup buttons: English, small, one line. ONE re-writable note per phrase.
- Recordings = underlined mark; notes = very light blue mark (mark.nb layer, separate from highlights).
- L1 teaches "vowels have no fixed sound"; cognate suffix codes; Tense Truth (present simple = facts/habits ONLY); reductions (gonna/wanna/woulda) taught early; get = coringa; quiz honesty note; gabarito inside <details>.
- Three fully separate tracks/books: kids (casual/slang), business (formal), nsfw (18+, swearing, AAVE-aware). Own folder, own lesson order, own voice. Lessons ~60 min, solo-possible with PT explanations; quizzes comprehensive (10–15 min).
