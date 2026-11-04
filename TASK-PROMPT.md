# TASK PROMPT — paste this as the whole instruction for the run

> Owner-authored task prompt. It overrides any looser reading of `HANDOFF.md` / `PENDING.md` / `BLUEPRINT.md`.
> Where it conflicts with something in those files, this file wins and the conflict gets recorded, not debated.

---

## THE ONE RULE ABOUT STOPPING

**This task stops before completion only on a CATASTROPHIC FAILURE. Nothing else.**

A run that ends with "I did the first few and summarised" is a failed run. The deliverable is **the whole list of
pages built, committed and pushed** — not a sample of it, not a plan for it, not a report about why the rest is hard.

Catastrophic failure means, and only means:

1. **The repository is unrecoverable** — the working tree or the remote is lost/corrupted, or a push is rejected and
   cannot be resolved after a real attempt to resolve it.
2. **The owner's spec files contradict each other in a way that blocks EVERY lesson**, not one lesson, and no reading
   of them produces a buildable page.
3. **The toolchain is dead** — `node build-lessons.mjs` cannot run at all and cannot be repaired.
4. **The owner says stop.**

If one of those four happens: stop, write exactly what broke and what you tried in `PENDING.md`, push what exists,
and say so in one paragraph. Nothing else.

**These are NOT reasons to stop, and must not appear in a report as a blocker:**
- a lesson whose design left a gap (decide it, build it, note the decision in the page's design file);
- a missing audio file, an unrendered voice, a TO-DO vehicle (allowed: `TO-DO — not built: <name>` + the primitive
  the student uses today);
- duplicate stems, thin material, a lesson that turns out harder than expected (fix it and move on);
- "I'm not sure this is the register/level the owner wants" (the spec files answer it; if they really don't, decide
  and record the decision);
- running low on context — that is a **checkpoint**: commit, rewrite `WHERE WE ARE` and `HANDOFF.md` so the next
  session resumes mid-list, and **keep going**;
- anything already listed as SKIP in the roadmap (39 and 40 are SKIP — write nothing for them, say nothing about
  them, move to the next number).

Do not ask the owner a question mid-run. Do not ask for permission. Do not pause for approval between lessons.
Decisions are recorded in the design file (`designs/…`) or in `BLUEPRINT.md` NOTES and the run continues.

---

## SCOPE DISCIPLINE

Do exactly the step you are told. **Nothing else.** Explicitly forbidden, because it has happened:

- **No sweeping, rewriting or "improving" pages that are already built.** Lessons 1-35 are frozen. Their language,
  their registers, their layout, their Portuguese — not your task. The 1-35 sweep is **PARKED** (`PARKED.md`).
- **No new tooling.** No checker scripts, no diff helpers, no linters, no "free structural checks", no jsdom dumps,
  no ad-hoc `*.mjs` in the repo or in temp. If a page is wrong, the fix is reading the file.
- **No QA of any kind.** Owner instruction, still in force: no `npm run qa`, no `content`/`width`/`overflow`/
  `smoke`/`games`/`landing`/`audio:check`, no Chrome, no local server, no screenshots. The **only** commands this run
  may execute are `node build-lessons.mjs` and `git`. That is the complete allowed command list.
- **No refactors** of `engine*.js`, `style.css`, `index.html`, `build-lessons.mjs`, or the spec files, beyond the
  couple of lines a step explicitly requires (e.g. the final `COUNTS` in `index.html`).
- **No re-planning.** Do not rewrite `PEDAGOGY-MAP.md`, do not re-derive the roadmap, do not re-open parked items.

---

## WHERE THINGS STAND (facts, 2026-11-04)

- **Business lessons 1-35:** built, pushed, frozen. (The 1-35 language sweep is **PARKED**, `PARKED.md`: L34 and L35
  were rewritten to English and pushed before the park; 1-33 were never touched. Leave all of them exactly as they are.)
- **Pass A business 36-50:** designs written and pushed — 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50
  (`designs/lessonNN.design.md`). **39 and 40 are SKIP** — exam/checkpoint format is an open owner decision; build
  nothing for them.
- **Pass B business 36-50:** not started. This is the current step.
- **Kids and adult:** empty. Nothing built, nothing designed.
- `lessons.json`: `{"kids":0,"business":35,"adult":0}`; `index.html` COUNTS `0/35/0`.


---

## THE WORK, IN THIS ORDER — finish a step before touching the next

| # | Step | Output | Count |
|---|---|---|---|
| 3 | **Pass B — business 36-50** (skip 39, 40) | `business/lessonNN.html` + identical `.edit.html` | 13 |
| 4 | **Pass A — kids 1-50**, each from the *fundamental idea* of `designs/lessonNN.design.md` | `designs/kids/lessonNN.design.md` | 50 |
| 5 | **Pass B — kids 1-50** | `kids/lessonNN.html` + identical `.edit.html` | 50 |
| 6 | **Pass A — adult 1-50**, each from the *fundamental idea* of the **kids** design | `designs/adult/lessonNN.design.md` | 50 |
| 7 | **Pass B — adult 1-50** | `adult/lessonNN.html` + identical `.edit.html` | 50 |
| 8 | **Close** — the report below. Then stop. | report | — |

Never reorder. Never interleave two tracks. Never start step N+1 with step N unfinished.

**Batch = 3 lessons** (4 at a track boundary). Per batch: `node build-lessons.mjs`, then `git add` the batch,
commit, `git push`. Commit message states the step, the numbers and the track in one line. Do not accumulate more
than one batch of unpushed work.

---

## DEFINITION OF DONE, PER LESSON (the bar every single page must clear)

Read these before lesson 1 and do not re-litigate them afterwards: `PAGE-CHECKLIST.md` (the page contract),
`FORMAT.md` (structure/markup), `PEDAGOGY-MAP.md` (the pedagogy and the register/level statements),
`BLUEPRINT.md` (what each lesson teaches + NOTES), `HANDOFF.md` (run mechanics), and for business 36-50 the matching
`designs/lessonNN.design.md`.

A lesson is done when **all** of these are true:

1. **The design is honoured.** Every teaching beat, the situation, the three channels, the chosen vehicle and the
   evidence named in the design appear on the page. The `recycles:` line is respected: nothing is re-taught that the
   page must not re-teach.
2. **The page teaches, then drills, then quizzes.** The consultation-free quiz uses material the practice section did
   NOT use — no copied stems between practice and quiz.
3. **Language:** the page's own instruction to the student is readable by that track/level (`PEDAGOGY-MAP.md` §4/§5).
   Portuguese appears only as gloss/translation, never as the carrier of the lesson.
4. **The file is structurally valid by construction**: balanced tags, no bare note row outside a `<tbody>`, one
   `.content-area`, the standard head/footer/engine script block copied from a working page of the same track.
5. **`.edit.html` is byte-identical to the page.**
6. **`build-lessons.mjs` runs clean and the lesson appears in `lessons.json`.** (For business 36-50 the count moves
   without touching 1-35.)
7. **Committed and pushed.**

No page ships on the strength of "it looks fine". No page is skipped because it is hard.

---

## THE FINAL REPORT (step 8) — three sections, nothing else

1. **Built** — every lesson number, per track, with its commit hash. If a page is not in this list it does not exist.
2. **Never checked** — be blunt: QA was off for the whole run, so no page was ever rendered in a browser; no width,
   overflow, audio or interaction was observed. One sentence, once.
3. **Known gaps** — duplicate stems you could not remove, `TO-DO — not built:` vehicles, audio that is text-only,
   lessons 39/40 skipped and why. Concrete, per lesson number.

Then stop and wait. Do not propose the next run inside the report.
