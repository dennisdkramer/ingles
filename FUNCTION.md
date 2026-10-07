# FUNCTION — frozen site behavior contract
Reference this file whenever a task touches lesson functionality. Preserve everything here unless the owner explicitly asks to change it.

## Persistence & identity
- ALL user data persists server-side (Apps Script Sheet "IAP_backpack!layer" + Drive "IAP_uploads"), and is separate PER STUDENT AND PER BOOK (track). No cross-contamination between students or between tracks.
- Drawings, recordings, notes, filled-in fields, answered questions: all persistent.
- localStorage must never be a source of truth (ghost-data bug of Oct 2026); server is sole source.

## Drawing / annotation interactions (owner spec)
- Shift+click = draw; auto-save after each stroke; NO popup, NO Save/Cancel bar — seamless.
- Shift+right-click = delete. Deletion must hit only the actual drawn element (~5px proximity to the stroke), NOT a bounding box around it. One action, no popup, no delay.
- Ctrl+click = yellow highlighter; highlight sits on a layer BELOW the text. Highlight deletion merged with drawing deletion (same gesture).
- Touch: 2-finger tap = enter/stay in draw mode; 3-finger tap = highlight; 4-finger tap = delete mode (if natively detectable), one tap deletes instantly.
- Drawings are borderless and anchored to FIXED page positions (can point at specific words); they never interfere with text selection (pointer-events:none except during modifier gestures).

## Undo
- Ctrl+z reverts sequentially: deletions, drawings, typing, field selections.
- A back/undo button also exists, usable by teacher AND student, floating top-right of the page.
- Undo history covers both teacher and student actions sequentially.

## Teacher/student control
- 3-way toggle: off (no function) / limit (disable student draw + undo) / teacher-only (disable all student interaction).
- Toggle + hotkey legend at top of each lesson; sizing per FORMAT.md.

## Engines & pages
- engine1.js = gate (sessionStorage sig check), selection popup (▶ Hear / ⏺ Record / 📝 Note), recording (stops after 2s silence, 🎙 indicator, spinner), notes, anchors, send() to backend.
- engine2.js = topbar, layer sync (15s), quiz grading, drawing/highlight/delete, showAnchor (audio cache, "carregando…", 4s → "nao encontrado").
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
