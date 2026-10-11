# FUNCTION — frozen site behavior contract
Reference this file whenever a task touches lesson functionality. Preserve everything here unless the owner explicitly asks to change it.

## Persistence & identity
- ALL user data persists server-side (Apps Script Sheet "IAP_backpack!layer" + Drive "IAP_uploads"), and is separate PER STUDENT AND PER BOOK (track). No cross-contamination between students or between tracks.
- Recordings, notes, highlights, filled-in fields, answered questions: all persistent.
- localStorage must never be a source of truth (ghost-data bug of Oct 2026); server is sole source.

## Highlight (text range) — owner spec 2026-10-11
- Ctrl+hold while selecting text = create a highlight. The highlighted STRING is the anchor, so the mark is pegged to the text: it survives window resize, zoom, font changes and reflow. It may span several lines of the same block (paragraph, list item, cell, heading) but never crosses a block boundary.
- Ctrl+drag over an existing highlight MERGES: any highlight that overlaps or merely touches the new selection becomes part of one single highlight, extended to cover both. Overlaps never accumulate as separate marks.
- Ctrl+click inside a highlight = delete it. One action: no confirmation, no popup.
- While Ctrl is held (and for ~1s after release) the Hear / Record / Note popup is SUPPRESSED — Ctrl gestures only ever highlight. A normal selection (no Ctrl) still opens that popup exactly as before.
- Look: semi-transparent yellow fill that keeps the text readable, rounded ends on every line fragment, no border, no icon.
- After a highlight is created, a tiny colour palette pops 10px above the LAST highlighted character with three swatches: yellow / transparent red / transparent green. Clicking a swatch recolours the highlight and closes the palette; any click elsewhere or any key press closes it too.
- Coexistence: recording (underlined + 🎙), note (blue + 📝) and highlight can live on the SAME span — none of them replaces another.
- PC only: highlights have no touch gesture.
- Persistence: server row type "hl", anchor = the highlighted string, data = {"color":"yellow|red|green"}; a recolour is a "set" on the same id. No backend change needed (add/set/del already accept any type).
- DOM contract: mark.nb[data-a=<string>] carrying class has-hl + one of hl-yellow/hl-red/hl-green; dataset.hlid = server row id (used for set/del/undo).

## Undo
- Ctrl+z reverts sequentially: highlights (create / recolour / delete), deletions, typing, field selections.
- A back/undo button also exists, usable by teacher AND student, floating top-right of the page.
- Undo history covers both teacher and student actions sequentially.

## Teacher/student control
- 3-way toggle (id modeToggle) in the control bar: "visibility off" / "limited" / "teacher only". The selected value is sent to the server and — only if a stored row carries it — written back into the select on load. NO level is enforced by any code today: none of the three values changes what the student can do.
- Target contract (owner decision 2026-10-11), NOT enforced by any code yet: this toggle must become a MODE TOGGLE that disables every student page interaction — selection popup, highlight create/delete/recolour, typing in the gap inputs, quiz answering, recording, notes and undo — while the teacher keeps full function. "teacher only" remains the strictest level.
- Toggle + hotkey legend at top of each lesson; sizing per FORMAT.md.

## Engines & pages
- engine1.js = gate (sessionStorage sig check), selection popup (▶ Hear / ⏺ Record / 📝 Note), Ctrl text-range highlight gestures (create / merge / delete / colour palette), recording (stops after 2s silence, 🎙 indicator, spinner), notes, anchors, send() to backend.
- engine2.js = topbar, layer sync (15s), quiz grading, highlight render/delete (mark.nb.has-hl + colour class + dataset.hlid) and undo, showAnchor (audio cache, "carregando…", 4s → "nao encontrado").
- Lessons are content-only files: config consts (TRACK, LESSON, SECRET, BACKPACK…) + engine includes. Engines/style always ship as full files.
- Gate hash: h(s){let x=0;for(const c of s)x=(x*31+c.charCodeAt(0))|0;return x} applied to email+track+SECRET ("abreportas2025"); invalid/missing gate → redirect to portal.html.
- Backend actions: POST add/set/del; GET ping/layer/file/dbg. ?action=dbg returns server log.

## Pedagogy rules (do not break)
- NO improvised phonetic respellings; pronunciation audio ONLY via ▶ TTS.
- Portuguese only for translation/explanation. PT words in exercises: italic + colored (.ptw).
- Popup buttons: English, small, one line. ONE re-writable note per phrase.
- Recordings = underlined mark; notes = blue mark.
- L1 teaches "vowels have no fixed sound"; cognate suffix codes; Tense Truth (present simple = facts/habits ONLY); reductions (gonna/wanna/woulda) taught early; get = coringa; quiz honesty note; gabarito inside <details>.
- Three fully separate tracks/books: kids (casual/slang), business (formal), nsfw (18+, swearing, AAVE-aware). Own folder, own lesson order, own voice. Lessons ~60 min, solo-possible with PT explanations; quizzes comprehensive (10–15 min).
