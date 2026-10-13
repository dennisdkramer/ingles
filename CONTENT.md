# CONTENT — content-handling contract: how lesson content is handled, structured and generated, plus the pending content tasks/batches
This file does NOT hold lesson content — the prose, sections, exercises and widgets of a lesson live in that lesson's OWN HTML page file. This file holds the CONTENT HANDLER/ARCHITECTURE (where content lives, how it is structured and generated) and the PENDING content tasks/batches; guidance ABOUT the content and ideas FOR generating content are welcome here. Layout/styling → FORMAT.md · behaviour → FUNCTION.md · server → BACKEND.md.

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-C<n>.)_

- [2026-10-13] With grading and every answer key now gone from the site (see CONTENT MAP below) NO exercise has an in-page self-check any more: a student can fill blanks, pick radios and write translations, and nothing ever tells them whether it is right. Owner to decide the MECHANISM (teacher review at the next class, or a real feature) — a key or a press-to-check would be a NEW decision, not a restoration, and it starts in this file (then FUNCTION.md, then engine wiring + qa/smoke.mjs).

## CONTENT MAP
- Lesson pages are content-only: config consts (TRACK, LESSON, SECRET, BACKPACK…) + the engine includes; every lesson's prose, sections, exercises and widgets live in the page file itself.
- Tracks: kids/ · business/ · nsfw/ — each lesson is a standalone page; business/lesson1.html is the current/ported build.
- Removed 2026-10-11 as hallucinated dead UI (owner's call; grep-confirmed unreferenced by any engine): `#bPrac` "✔ Checar treino", `#bQuiz` "✔ Entregar quiz", `#sendTr` "💾 enviar ao caderno", `#done` "✅ Concluí esta lição", the `#modal` "Lição concluída ✅" block and its `#mNext`/`#mIndex` buttons.
- NO grading and NO answer key — not in a page and not in an engine (owner decision 2026-10-13, swept in all three lesson pages): every `input.gap` lost its `data-a` answer, every `fieldset` lost its `data-c`/`data-q` key, the end-of-quiz key block and every phrase that pointed at one or promised automatic correction are gone, and no page carries a check/submit widget (qa/smoke.mjs keeps the removed control ids out). The fields themselves stay plain content the student fills in; grading is a CONTENT concern, so if it ever returns the decision starts here, then FUNCTION.md, then engine wiring + QA.
- `#trw` (the translation textarea in each quiz) is KEPT in all three pages: it is the student's own written work and exists to be persisted like every other exercise input (FUNCTION.md B-F1). It stays plain until field persistence ships.
