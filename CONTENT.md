# CONTENT — content-handling contract: how lesson content is handled, structured and generated, plus the pending content tasks/batches
This file does NOT hold lesson content — the prose, sections, exercises and widgets of a lesson live in that lesson's OWN HTML page file. This file holds the CONTENT HANDLER/ARCHITECTURE (where content lives, how it is structured and generated) and the PENDING content tasks/batches; guidance ABOUT the content and ideas FOR generating content are welcome here. Layout/styling → FORMAT.md · behaviour → FUNCTION.md · server → BACKEND.md.

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-C<n>.)_



- [2026-10-13] NO exercise has an in-page self-check: a student can fill blanks, pick radios and write translations, and nothing ever tells them whether it is right. Owner to decide the MECHANISM (teacher review at the next class, or a real feature) — it would be a NEW decision, and it starts in this file (then FUNCTION.md, then engine wiring + qa/smoke.mjs).

## CONTENT MAP
- Lesson pages are content-only: config consts (TRACK, LESSON, SECRET, BACKPACK…) + the engine includes; every lesson's prose, sections, exercises and widgets live in the page file itself.
- Tracks: kids/ · business/ · nsfw/ — each lesson is a standalone page; business/lesson1.html–lesson10.html are the current build (Book 1), each with a `<lesson>.edit.html` sidecar.
- A translation textarea (the `#trw`-style box) is the student's own written work and is persisted like every other exercise input. It is a REUSABLE exercise shape, not a fixed one-per-page slot: a lesson includes as many as appropriate, in Treino and/or Quiz.
- Exercise layout (the reusable template — mechanism in style.css): every exercise group is a bordered panel inside a two-per-row flow, and a group that needs full width (long options / a textarea / many items) spans the whole row. Inside a panel there are exactly two shapes: (1) multiple-choice → an aligned grid of [number][stem][one column per option], so the options line up vertically; (2) fill-in → an auto-flowing grid where the prompt sits in a fixed-width column so every gap lines up, and the number of pairs per row is whatever fits the group's item width. A page only declares a group's type and width — it never hand-tunes columns.
- Edit mode (teacher-only, in the "demo (you)" view): a ✏️ Edit toggle loads a separate unmarked, editable copy — the live page and its marks are never touched. Changes auto-save to the backend as a `type:"content"` row holding the FULL page HTML, keyed to the teacher's email (staging only; students never see it), and ↩️ Revert discards them. Every lesson file is created with a sibling `<lesson>.edit.html` sidecar that is a full copy of the lesson. "Baking in" is a pure rename: the editor fetches the saved HTML from the backend, writes it over the sidecar, deletes the original lesson file, and renames the sidecar to the lesson name — no copy/paste and no content editing.

## Content generation process (every block)
Content is produced by a loop; layout is never pre-assigned and never forced by CSS — a block BECOMES full-width, half-width, one column or several columns as a RESULT of this loop.

1. **Pedagogical assessment.** Decide what the block teaches, how central it is, and where it sits in the course (the earlier, the shorter and simpler the phrases must stay). → PEDAGOGY.md.
2. **Initial generation.** Write the items — questions, phrases, vocabulary, dialogue lines. Their length and count are only the starting point.
3. **Visual/structural analysis.** Look at the block in its surroundings and decide its layout and whether more content is needed, specifically:
   - a lone item leaves a lot of blank space on its horizontal line → add items or columns;
   - a block has no adjacent block of the same width to sit beside → generate more content (more items, more columns, longer phrases, more dialogue lines) so it genuinely earns its width — or, only if pedagogy insists it stay small, keep it small and center it;
   - a block's content fills well under its width → generate more content in the block's natural shape: more items, more columns (item grids), or more dialogue/example lines (prose such as dialogues);
   - two adjacent blocks are visibly different heights → extend the shorter one (more questions, examples, vocabulary, or dialogue lines, inserted wherever they read most naturally) so the pair balances;
   - a prose line ends with a single stranded word → reword the phrase (a lone label or sub-heading word is fine).
4. **Alter / extend.** Generate the extra content step 3 called for, chosen for teaching value — never filler.
5. **Re-check.** Verify the step-3 goals are met; if not, repeat steps 4–5. Five consecutive failures on one block: log it as an open problem, move to the next block or page, and report all logged problems at the end for the owner.

Pedagogical fit outranks space-filling at every step: if the right presentation is a single short column, keep it that way and make the spacing work around it.

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
- **Group sizes (strong preference, not a hard rule).** When generating a lesson's HTML, generate a number of questions / amount of content that FILLS the rows — prefer 4 or 8 items per grid so no row is left with a single lone question. Add or trim items by pedagogical value (see PEDAGOGY), never by padding with filler.
- **Options are authored to fit their line — never wrapped by CSS.** Short options sit on one line; long options (whole sentences, as in translation or listening) are laid out stacked under the stem. The page never relies on CSS text wrapping to squeeze over-long options into a row.
- **No hanging words.** A wrapped paragraph must not leave a single word stranded on its own line — reword the phrase to avoid it. A lone word is fine when it is a deliberate label or sub-heading (e.g. "Consequências:") that introduces what follows; the distinction is intent, not length.



