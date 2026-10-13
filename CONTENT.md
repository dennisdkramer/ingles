# CONTENT — site content contract: what each lesson page says and offers (prose, sections, exercises, answer keys, in-page widgets)
Reference this file whenever a task touches lesson content. Layout/styling → FORMAT.md · behaviour → FUNCTION.md.

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-C<n>.)_

- [2026-10-11, migrated from ISSUES.md] Quiz sections B–F have no answer key anywhere: with the grading buttons removed as dead code the student cannot self-check them — add keys, or restore a check button.
- [2026-10-11, migrated from ISSUES.md] The `#trw` textarea in business/lesson1.html is inert (no send/grade code references it) — owner to decide keep / reword / remove.
- [2026-10-11, migrated from ISSUES.md] kids/lesson1.html and nsfw/lesson1.html still carry the pre-port wording that describes the removed widgets ("o texto vai para o caderno do professor", "o resto é corrigido automaticamente", "Treino (pode consultar ✅)") — port the business/lesson1.html wording when those pages start.

## CONTENT MAP
- Lesson pages are content-only: config consts (TRACK, LESSON, SECRET, BACKPACK…) + the engine includes; every lesson's prose, sections, exercises and widgets live in the page file itself.
- Tracks: kids/ · business/ · nsfw/ — each lesson is a standalone page; business/lesson1.html is the current/ported build.
- Removed 2026-10-11 as hallucinated dead UI (owner's call; grep-confirmed unreferenced by any engine): `#bPrac` "✔ Checar treino", `#bQuiz` "✔ Entregar quiz", `#sendTr` "💾 enviar ao caderno", `#done` "✅ Concluí esta lição", the `#modal` "Lição concluída ✅" block and its `#mNext`/`#mIndex` buttons.
