# TASK PROMPT — paste this as the whole instruction for the run

> Directives only. The **details live in the spec files** (`PAGE-CHECKLIST.md`, `FORMAT.md`, `PEDAGOGY-MAP.md`,
> `BLUEPRINT.md`, `designs/`, `HANDOFF.md`, `PENDING.md`) — read them, do not restate them here or re-derive them.

## 1. This run ends only on a catastrophic failure

**Nothing else stops it.** A run that ends with a few lessons done and a summary is a failed run. The deliverable is
the **whole list** built, committed and pushed — not a sample, not a plan, not a report on why the rest is hard.

**The list is every remaining step of the run order — `PENDING.md` steps 4 → 8 — in ONE run:** Pass A kids 1-50,
Pass B kids 1-50, Pass A adult 1-50, Pass B adult 1-50, then the close report. A finished track, a finished pass or a
clean commit is **not** an ending: commit, push, rewrite `WHERE WE ARE`, and start the next step in the same run.

Catastrophic means only: (a) the repo/remote is unrecoverable or a push cannot be resolved; (b) the spec files
contradict each other in a way that blocks **every** lesson; (c) `node build-lessons.mjs` cannot run and cannot be
repaired; (d) the owner says stop. Then: stop, write what broke and what you tried in `PENDING.md`, push what exists,
one paragraph.

**Not reasons to stop, and never reportable as blockers:** a gap in a design (decide it, note it in the design file);
missing audio or an unbuilt vehicle (use `TO-DO — not built: <name>` + the primitive used today); duplicate stems or
thin material (fix it, move on); uncertainty about register/level (the spec files answer it — if they truly don't,
decide and record it); low context (commit, rewrite `WHERE WE ARE`, **keep going**); a step boundary or a finished
track (commit, push, continue); lessons 39/40 in **any** track (SKIP — create nothing, say nothing, move on).
Never ask the owner a question or permission mid-run.

## 2. Scope — every remaining step, and nothing invented

- **Remaining = `PENDING.md` steps 4 → 8.** Nothing else. Steps 1 → 3 are done (business is built to lesson 50);
  step 2's sweep is PARKED by the owner.
- **Built pages are frozen.** No sweeping, re-leveling or "improving" business 1-50; no revisiting a page from an
  earlier track to fix its language.
- **No new tooling.** The only scripts allowed are the two free per-page structural checks in `HANDOFF.md` (kept in
  `%TEMP%`, never in the repo). No other checker, diff, lint or jsdom script — read the file instead.
- **No QA.** No `npm run qa`, no Chrome, no server, no screenshots. Commands allowed: the two free checks,
  `node build-lessons.mjs` (the manifest/landing feed, per batch and per track), and `git`.
- **No refactors, no re-planning.** `engine*.js`, `style.css`, `index.html`, `build-lessons.mjs` and the spec files
  stay untouched, except the `COUNTS` line when a track completes.

## 3. What to build, and how it is judged

- Order = `PENDING.md` steps **4 → 8**: kids Pass A → kids Pass B → adult Pass A → adult Pass B → close. Never
  reordered, never interleaved, never left unfinished. **39 and 40 are SKIP in every track** ⇒ each track is
  **48 lessons**, not 50.
- Per lesson: **Pass A** writes `designs/<track>/lessonNN.design.md` (kids derives from the same-numbered business
  design's fundamental idea; adult from the kids one). **Pass B** writes `<track>/lessonNN.html` + a byte-identical
  `.edit.html`. Never both passes of the same number in the same breath — the barrier in `PEDAGOGY-MAP` §1 is real.
- Batch of 3 lessons: two free checks, `node build-lessons.mjs`, commit, push — then straight into the next batch.
  Rewrite `WHERE WE ARE` in `PENDING.md` after **every** lesson. At a track's end: `COUNTS`, manifest, commit, push,
  then the next track in the same run.
- Pass B bar = **`PAGE-CHECKLIST.md`** (12 items, follow them exactly). Content from `PEDAGOGY-MAP` §1 persona + the
  parent design; markup from `FORMAT.md`; level from `PEDAGOGY-MAP.md` §5.
- Bookkeeping: at the end of the run `lessons.json` and `index.html` COUNTS carry the real totals (business 50,
  kids 48, adult 48) and 39/40 are recorded as SKIP-TO-DO, never as missing.

## 4. Close — the last step, then stop

Three sections, nothing else: **Built** (every lesson number + commit hash, grouped by step — if it isn't listed it
doesn't exist) · **Never checked** (one sentence: QA was off, nothing was ever rendered) · **Known gaps** (per lesson
number; plus 39/40 as SKIP-TO-DO in each track, audio still unrendered). Then stop and await instruction — the full
QA + bug-fix pass starts only if the owner says so.
