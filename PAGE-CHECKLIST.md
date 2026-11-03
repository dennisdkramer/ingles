# PAGE-CHECKLIST — reload me after every compaction (and before every page)

This file exists so that nothing here has to survive in an agent's memory. Read it after any compaction, and
before starting or resuming a lesson. It is the mechanical contract in one screen; FORMAT.md and FUNCTION.md win
on any conflict.

## Reload order (do this first, every time)
`HANDOFF.md` → `PENDING.md` (the `WHERE WE ARE` line) → this lesson's PEDAGOGY-MAP entry + `designs/lessonNN.design.md` → this file.

## Per lesson
1. **Shell** — copy the head/shell/scripts from `business/lesson1.html`. `<title>Business · Lesson NN — English Opens Doors</title>`, `L=NN`, identical `.edit.html` sidecar.
2. **Opener** — `<p class="card pt">`, 3-5 sentences: what the lesson installs (in target strings), the law / mental model, the PT→EN mapping where relevant. Never an activity list, never prose about the site's tools.
3. **Sections** — numbered `<h2>`, one idea each; every group sits in a block (`.panel` / `.chart` / `.card` / `.dialog` / `fieldset` / `.game`); halves/thirds only inside `.itemrow[data-cols="2"|"3"]`, with the width reason in the design file.
4. **MCQ** — `.qitem > .qline > (.qnum + .qstem)`, then `.qopts` **below** the prompt. One layout per block. Stems unique **across the page** (a duplicate stem = one saved answer for two controls).
5. **Note rows** — always `<tr class="note"><td colspan="N">…</td></tr>`.
6. **Fill-ins** — `.blanks.sent.cols`, `--gap-w` ≤ 11em, PT hint **below** the input via `<br>`, prompt short enough for one line.
7. **Audio** — every target line carries `.listen` with `data-say` = how the line is **said**.
8. **Vocabulary** — ≥10 new items, each glossed inline (PT) before it is used.
9. **No trespassing** — do not teach what a neighbour owns (roadmap `Note:` / `Sequence:` lines); recycle, don't re-teach.
10. **Quiz** — last section, labelled no-consultation, tests all core behaviours, **never reuses a training item**.
11. **TO-DO blocks** — allowed for a missing *vehicle* only (`<h3 class="ex-head">TO-DO — not built: <name></h3>`), and must name the primitive the student uses today. Never a TO-DO for teaching.
12. **Finish** — copy to `.edit.html`, run the two free structural checks, commit; push every 3 lessons and rewrite `WHERE WE ARE` in PENDING.md after **every** lesson.

## Failure signatures
- hoisted `B/TR/TD` children of `.content-area` **+** `-20px BLOCKGAP` ⇒ unclosed `<table>`, a bare note row, or a chunk spliced into `<tbody>`.
- `N of M radios resolve no anchor` ⇒ radio outside `.qline > .qstem`.
- `(hint) anchor(s) shared` ⇒ duplicate stem; rename in the section's vocabulary (`Som 2`, `Treino 3`).
