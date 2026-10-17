# CONTENT — content-handling contract: how lesson content is handled, structured and generated, plus the pending content tasks/batches
This file does NOT hold lesson content — the prose, sections, exercises and widgets of a lesson live in that lesson's OWN HTML page file. This file holds the CONTENT HANDLER/ARCHITECTURE (where content lives, how it is structured and generated) and the PENDING content tasks/batches; guidance ABOUT the content and ideas FOR generating content are welcome here. Layout/styling → FORMAT.md · behaviour → FUNCTION.md · server → BACKEND.md.

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-C<n>.)_

- [2026-10-17] CONTENT CLEANUP (owner layout guidelines, see "Content shape"): across all business lessons — (a) section explainers → serif sub-headings, drop redundant ones (7.1); (b) per-row notes → merged chart rows (6.2); (c) overflowing half-width panels → stack-small / full-width-large (7.5.A/B); (d) paired content side-by-side with PT under EN (7.3/7.4); (e) replace literal "___" with contiguous input.gap lines; (f) make "person → people" a text-entry field instead of MCQ (6C); (g) balance grid groups to 4/8.

- [2026-10-13] NO exercise has an in-page self-check: a student can fill blanks, pick radios and write translations, and nothing ever tells them whether it is right. Owner to decide the MECHANISM (teacher review at the next class, or a real feature) — it would be a NEW decision, and it starts in this file (then FUNCTION.md, then engine wiring + qa/smoke.mjs).

## CONTENT MAP
- Lesson pages are content-only: config consts (TRACK, LESSON, SECRET, BACKPACK…) + the engine includes; every lesson's prose, sections, exercises and widgets live in the page file itself.
- Tracks: kids/ · business/ · nsfw/ — each lesson is a standalone page; business/lesson1.html–lesson10.html are the current build (Book 1), each with a `<lesson>.edit.html` sidecar.
- A translation textarea (the `#trw`-style box) is the student's own written work and is persisted like every other exercise input. It is a REUSABLE exercise shape, not a fixed one-per-page slot: a lesson includes as many as appropriate, in Treino and/or Quiz.
- Exercise layout (the reusable template — mechanism in style.css): every exercise group is a bordered panel inside a two-per-row flow, and a group that needs full width (long options / a textarea / many items) spans the whole row. Inside a panel there are exactly two shapes: (1) multiple-choice → an aligned grid of [number][stem][one column per option], so the options line up vertically; (2) fill-in → an auto-flowing grid where the prompt sits in a fixed-width column so every gap lines up, and the number of pairs per row is whatever fits the group's item width. A page only declares a group's type and width — it never hand-tunes columns.
- Edit mode (teacher-only, in the "demo (you)" view): a ✏️ Edit toggle loads a separate unmarked, editable copy — the live page and its marks are never touched. Changes auto-save to the backend as a `type:"content"` row holding the FULL page HTML, keyed to the teacher's email (staging only; students never see it), and ↩️ Revert discards them. Every lesson file is created with a sibling `<lesson>.edit.html` sidecar that is a full copy of the lesson. "Baking in" is a pure rename: the editor fetches the saved HTML from the backend, writes it over the sidecar, deletes the original lesson file, and renames the sidecar to the lesson name — no copy/paste and no content editing.

## Content quantity
- **Explanatory content (everything before the quiz)** is included **as appropriate** — only as much as is necessary to confirm the student understands the primary idea of the lesson. No fixed section count and no fixed length per section.
- **Exercise shapes** (fill-in blanks, multiple-choice, translation boxes, recording prompts, dialogues, charts…) are each used **as many times as appropriate** — never exactly one per page unless the lesson genuinely needs only one. There is no one-translation-box or one-recording-prompt rule.
- **The quiz** is sized so it **ideally takes about 20 minutes** to complete, but the priority for quantity is **"as appropriate"** — enough to fully test the student's understanding of the explanatory content, no more and no less.
- **The lesson title (h1)** is centered and kept to roughly one short line — ≈ 50 characters or fewer at the fixed 38px heading size inside the 1200px content area (shorter when uppercase-heavy).

## Content shape (authoring rules)
- **Explainers vs notes.** A one-liner that explains a whole section is a sub-heading (serif, slightly larger), written only when it adds what the chart/dialog does not already state. A note about a single item (one vocab row) is a merged row inside that block, directly under the item.
- **No redundancy.** Never restate in prose what the very next chart already shows.
- **Contrast is visible.** Two versions/conjugations/uses of a concept, or two concepts, are always separated — columns or clear spacing.
- **Choose the natural input.** "word → answer" facts (e.g. person → people) are fill-in text fields; recognition / "pick the right one" is multiple choice.
- **Blanks are contiguous lines** (the input.gap), never literal "___" underscores in the prompt.
- **Group sizes.** Prefer 4 or 8 items per group; avoid leaving one lone question on its own line.



