# CONTENT — content-handling contract: how lesson content is handled, structured and generated, plus the pending content tasks/batches
This file does NOT hold lesson content — the prose, sections, exercises and widgets of a lesson live in that lesson's OWN HTML page file. This file holds the CONTENT HANDLER/ARCHITECTURE (where content lives, how it is structured and generated) and the PENDING content tasks/batches; guidance ABOUT the content and ideas FOR generating content are welcome here. Layout/styling → FORMAT.md · behaviour → FUNCTION.md · server → BACKEND.md.

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-C<n>.)_



- [2026-10-13] NO exercise has an in-page self-check: a student can fill blanks, pick radios and write translations, and nothing ever tells them whether it is right. Owner to decide the MECHANISM (teacher review at the next class, or a real feature) — it would be a NEW decision, and it starts in this file (then FUNCTION.md, then engine wiring + qa/smoke.mjs).

## CONTENT MAP
- Lesson pages are content-only: config consts (TRACK, LESSON, SECRET, BACKPACK…) + the engine includes; every lesson's prose, sections, exercises and widgets live in the page file itself.
- Tracks: kids/ · business/ · nsfw/ — each lesson is a standalone page; business/lesson1.html–lesson36.html are the current build (Book 1 lessons 1–18, Book 2 lessons 19–36), each with a `<lesson>.edit.html` sidecar.
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
   - a block's content fills well under ~30% of its width → generate more content in the block's natural shape: more items, more columns (item grids), or more dialogue/example lines (prose such as dialogues);
   - a full-width block that is only half-filled (a big stretch of empty space) → fill the empty half (more content, or split the block's lines into a second column) or reduce it to half-width — a full-width block must never sit half-empty for no reason;
   - a multiple-choice / listening group whose stem+options row is too wide for half a panel → make it FULL-WIDTH (its inline row must actually fit);
   - two adjacent half-width blocks of visibly different HEIGHTS → when it can be done with real teaching content (never filler), extend the shorter one during step 4 so the pair is reasonably aligned — this is about the rendered VISUAL HEIGHT of the blocks, never about matching item counts (two blocks can have different item counts yet match in height, or the same count yet differ); a GENERAL rule for any block type or section;
   - a prose line ends in a dangling fragment (a stray word, punctuation, or a split pair) → reword so the line ends complete (a lone label or sub-heading is fine).
4. **Alter / extend.** Generate the extra content step 3 called for, chosen for teaching value — never filler.
5. **Re-check (visual pass).** Re-render the block and confirm the step-3 goals are met — explicitly including: no line overflows its block, no block is left with massive empty space or a big dead space on the right of a row (short options clustered left), consecutive questions have breathing room, and no ugly, broken-looking line (a stranded lone ▶, a half-empty full-width block, a dangling fragment, a single orphan word left alone at the end of a wrapped line). If not, repeat steps 4–5. Five consecutive failures on one block: log it as an open problem, move to the next block or page, and report all logged problems at the end for the owner.

A reported issue is a CLASS, not a single case: when the owner flags one block (e.g. "not centered"), understand the intent; when execution is requested, the step 4–5 pass sweeps and resolves that SAME issue in every block within the requested scope — never just the named one.

Pedagogical fit outranks space-filling at every step: if the right presentation is a single short column, keep it that way and make the spacing work around it.

## Content quantity
- **Explanatory content (everything before the quiz)** is included **as appropriate** — only as much as is necessary to confirm the student understands the primary idea of the lesson. No fixed section count and no fixed length per section.
- **Exercise shapes** (fill-in blanks, multiple-choice, translation boxes, recording prompts, dialogues, charts…) are each used **as many times as appropriate** — never exactly one per page unless the lesson genuinely needs only one. There is no one-translation-box or one-recording-prompt rule.
- **The quiz** is sized so it **ideally takes about 20 minutes** to complete, but the priority for quantity is **"as appropriate"** — enough to fully test the student's understanding of the explanatory content, no more and no less.
- **The lesson title (h1)** is centered and kept to roughly one short line — ≈ 50 characters or fewer at the fixed 38px heading size inside the 1200px content area (shorter when uppercase-heavy).

## Content shape (authoring rules)
- **Explainers vs notes.** A one-liner that explains a whole section is a sub-heading (serif, slightly larger), written only when it adds what the chart/dialog does not already state. A note about a single item (one vocab row) is a merged row inside that block, directly under the item.
- **No redundancy.** Never restate in prose what the very next chart already shows; never repeat a block's title twice (a section heading plus the block's own sub-title) — state it once.
- **Contrast is visible.** Two versions/conjugations/uses of a concept, or two concepts, are always separated — columns or clear spacing.
- **Choose the natural input.** "word → answer" facts (e.g. person → people) are fill-in text fields; recognition / "pick the right one" is multiple choice.
- **Blanks are contiguous lines** (the input.gap), never literal "___" underscores in the prompt.
- **Group sizes (strong preference, not a hard rule).** When generating a lesson's HTML, generate a number of questions / amount of content that FILLS the rows — prefer 4 or 8 items per grid so no row is left with a single lone question. Add or trim items by pedagogical value (see PEDAGOGY), never by padding with filler.
- **Options are authored to fit their line — never wrapped by CSS.** Short options sit on one line; long options (whole sentences, as in translation or listening) are laid out stacked under the stem. Inline is only correct when the whole stem+options row fits the block's width — a group whose row is too wide for half a panel is made FULL-WIDTH, never squeezed into half-width. The page never relies on CSS text wrapping to squeeze over-long options into a row.
- **Listening items stay inline.** In a listen-and-choose item the ▶ button and the answer options sit on the same line — an audio-only stem is never stacked, because a lone ▶ above the options looks broken. A listening group is a full-width block, and its options are authored short enough to fit that one line.
- **Recording prompts carry only their text — and no blanks.** A ⏺ recording block shows only the sentence(s) to record — the header already names the activity ("F. Grave ⏺"), so the body does not repeat "Grave", and it never says "record line N of the dialogue". The sentence is complete and read-aloud-able: it never contains a fill-in blank (___); a blank is filled with a concrete name, city, place or brand as appropriate.
- **No repeated labels.** A block whose header already names the activity (e.g. "F. Grave ⏺", "Diálogo — leia em voz alta") does not repeat that wording in its body or a nested title.
- **Small half-full blocks are centered.** When a small block's text leaves its right half empty, center the text — judged case-by-case in the visual pass (ugliness), not as a blanket rule.
- **Nothing looks accidental or broken.** If a rendered line ends in a dangling fragment — a stray punctuation mark, a lone trailing word, or a split pair like "word · word" — reword so the line ends complete. A fragment is fine only when it is a deliberate label or sub-heading (e.g. "Consequências:") that introduces what follows. The test is visual: does it look deliberate, or does it look like the text broke?



