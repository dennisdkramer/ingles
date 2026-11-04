# TASK PROMPT — paste this as the whole instruction for the run

> Directives only. The **details live in the spec files** (`PAGE-CHECKLIST.md`, `FORMAT.md`, `PEDAGOGY-MAP.md`,
> `BLUEPRINT.md`, `designs/`, `HANDOFF.md`, `PENDING.md`) — read them, do not restate them here or re-derive them.

## 1. This run ends only on a catastrophic failure

**Nothing else stops it.** A run that ends with a few lessons done and a summary is a failed run. The deliverable is
the **whole list** built, committed and pushed — not a sample, not a plan, not a report on why the rest is hard.

Catastrophic means only: (a) the repo/remote is unrecoverable or a push cannot be resolved; (b) the spec files
contradict each other in a way that blocks **every** lesson; (c) `node build-lessons.mjs` cannot run and cannot be
repaired; (d) the owner says stop. Then: stop, write what broke and what you tried in `PENDING.md`, push what exists,
one paragraph.

**Not reasons to stop, and never reportable as blockers:** a gap in a design (decide it, note it in the design file);
missing audio or an unbuilt vehicle (use `TO-DO — not built: <name>` + the primitive used today); duplicate stems or
thin material (fix it, move on); uncertainty about register/level (the spec files answer it — if they truly don't,
decide and record it); low context (commit, rewrite `WHERE WE ARE`, **keep going**); lessons 39/40 are SKIP (write
nothing, say nothing, move on). Never ask the owner a question or permission mid-run.

## 2. Scope — do the current step and nothing else

- **Built pages are frozen.** No sweeping, re-leveling or "improving" lessons 1-35; that sweep is PARKED.
- **No new tooling.** No checker, diff, lint or jsdom scripts — not in the repo, not in temp. Read the file instead.
  (Where that instinct came from: `PAGE-CHECKLIST.md` item 12 used to order it; it now doesn't.)
- **No QA.** No `npm run qa`, no Chrome, no server, no screenshots. **The only commands allowed are
  `node build-lessons.mjs` and `git`.** File reads and searches are not commands.
- **No refactors, no re-planning.** `engine*.js`, `style.css`, `index.html`, `build-lessons.mjs` and the spec files
  stay untouched, except the `COUNTS` line when a track completes.

## 3. What to build, and how it is judged

- Order = `PENDING.md` steps **3 → 8**, never reordered, never interleaved. **Begin at step 3 (business 36-50).**
- Batch of 3 lessons: `node build-lessons.mjs`, commit, push. Rewrite `WHERE WE ARE` after **every** lesson.
- Per-lesson bar = **`PAGE-CHECKLIST.md`** (12 items, follow them exactly). Content from `BLUEPRINT.md` +
  `designs/lessonNN.design.md`; markup from `FORMAT.md`; register/level from `PEDAGOGY-MAP.md` §4/§5.
- 39 and 40 are SKIP ⇒ step 3 is **13 pages**, not 15.

## 4. Close

Three sections, nothing else: **Built** (every number + commit hash — if it isn't listed it doesn't exist) ·
**Never checked** (one sentence: QA was off, nothing was ever rendered) · **Known gaps** (per lesson number).
Then stop.
