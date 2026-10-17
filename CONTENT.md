# CONTENT — content-handling contract: how lesson content is handled, structured and generated, plus the pending content tasks/batches
This file does NOT hold lesson content — the prose, sections, exercises and widgets of a lesson live in that lesson's OWN HTML page file. This file holds the CONTENT HANDLER/ARCHITECTURE (where content lives, how it is structured and generated) and the PENDING content tasks/batches; guidance ABOUT the content and ideas FOR generating content are welcome here. Layout/styling → FORMAT.md · behaviour → FUNCTION.md · server → BACKEND.md.

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-C<n>.)_

- [2026-10-13] NO exercise has an in-page self-check: a student can fill blanks, pick radios and write translations, and nothing ever tells them whether it is right. Owner to decide the MECHANISM (teacher review at the next class, or a real feature) — it would be a NEW decision, and it starts in this file (then FUNCTION.md, then engine wiring + qa/smoke.mjs).

## CONTENT MAP
- Lesson pages are content-only: config consts (TRACK, LESSON, SECRET, BACKPACK…) + the engine includes; every lesson's prose, sections, exercises and widgets live in the page file itself.
- Tracks: kids/ · business/ · nsfw/ — each lesson is a standalone page; business/lesson1.html is the current/ported build.
- `#trw` (the translation textarea in each quiz) is KEPT in all three pages: it is the student's own written work and exists to be persisted like every other exercise input (FUNCTION.md B-F1). It stays plain until field persistence ships.
- Exercise layout (the reusable template — mechanism in style.css): every exercise group is a bordered panel inside a two-per-row flow, and a group that needs full width (long options / a textarea / many items) spans the whole row. Inside a panel there are exactly two shapes: (1) multiple-choice → an aligned grid of [number][stem][one column per option], so the options line up vertically; (2) fill-in → an auto-flowing grid where the prompt sits in a fixed-width column so every gap lines up, and the number of pairs per row is whatever fits the group's item width. A page only declares a group's type and width — it never hand-tunes columns.
- Edit mode (teacher-only, in the "demo (you)" view): a ✏️ Edit toggle loads a separate unmarked, editable copy — the live page and its marks are never touched. Changes auto-save to the backend as a `type:"content"` row keyed to the teacher's email (staging only; students never see it), and ↩️ Revert discards them. Every lesson file is created with a sibling `<lesson>.edit.html` sidecar (one cumulative file) that holds the pending edit; on the owner's request the editor fetches the content row from the backend, writes it to the sidecar, and bakes it into the lesson HTML — no copy/paste.
