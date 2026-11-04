# PENDING — active subtask batch plan (HARNESS.md RULE 7 step 1)
The live working plan for the CURRENT task. When a prompt is decomposed into subtask batches (RULE 7), they are written here, executed in order, and cleared here once done AND committed. Deferred / not-yet-started work stays in PARKED.md — move an item from PARKED.md here when you actually begin it, and clear it there once it is done and committed. Cross-session handoffs live in HANDOFF.md.

_(Active batches, newest first. Cleared once done AND committed.)_

`WHERE WE ARE` — business **1-35** built and pushed (`a23f924`); `designs/lesson01-35.design.md` exist. `kids/` and
`adult/` are tracked and empty (their old pre-rewrite pages moved to `lessons-archive/`, never to be read).
**Step 1 in flight: Pass A business.** Designs **36-38** (batch 8) and **41, 42, 43** (batch 9) written. **39 and 40 are
SKIP** — the roadmap says *Generation: SKIP — do not build this page yet* for both (exam/checkpoint format must be
planned with the owner first); recorded in `BLUEPRINT.md` NOTES, not generated. Next action = **Pass A for lesson 44**.
`lessons.json`: business 35 / kids 0 / adult 0; `index.html` COUNTS `0/35/0`.

## The run order (owner, 2026-11-03 — the ORDER is fixed; batch sizes inside a step are free)

| # | Step | Output | Push |
|---|---|---|---|
| 1 | **Pass A — business 36-50** (15 designs, one per turn, sequential) | `designs/lessonNN.design.md` | per batch |
| 2 | **Sweep business 1-35** — language + level adherence, rapid, no re-authoring | edits + re-copied sidecars | per batch |
| 3 | **Pass B — business 36-50** | `business/lessonNN.html` + `.edit.html` | per batch |
| 4 | **Pass A — kids 1-50**, each from the *fundamental idea* of `designs/lessonNN.design.md` | `designs/kids/lessonNN.design.md` | per batch |
| 5 | **Pass B — kids 1-50** | `kids/lessonNN.html` + `.edit.html` | per batch |
| 6 | **Pass A — adult 1-50**, each from the *fundamental idea* of the **kids** design | `designs/adult/lessonNN.design.md` | per batch |
| 7 | **Pass B — adult 1-50** | `adult/lessonNN.html` + `.edit.html` | per batch |
| 8 | **Close** — high-level QA report, then await instruction (or full QA + bug-fix if the owner says go) | report | — |

A batch is **3 lessons** (4 allowed at a track boundary). Never reorder the steps, never interleave a track.

**Per lesson:** Pass A → the design file with `recycles:` / `must not re-teach:`; Pass B → the page + identical
`.edit.html`. Then the two free structural checks (tag balance + child dump, `HANDOFF.md`), `node build-lessons.mjs`
per batch, `git` per batch, `WHERE WE ARE` rewritten here after **every** lesson.

**QA is OFF for this run** (owner): no `npm run qa`, no `content` / `width` / `overflow` / `smoke` / `games` /
`landing` / `audio:check`, no Chrome, no local server — do not run them and do not report them. Commit messages say
"QA disabled by owner instruction for this run".

**Kids/adult derivation rule.** Take the same-numbered parent design's *fundamental pedagogical idea* — what is being
taught, and the teaching beats that install it — and rebuild everything else for the track persona: contexts,
situations, vocabulary, examples, vehicles, stakes, humour, and register (`PEDAGOGY-MAP` §1). Not a translation and
not a re-skin; never a find-replace of another track's page.

**Language and register:** decided at the point of generation by `PEDAGOGY-MAP` §4 t) and §4 u) alone. No counts, no
quotas, no target share, no band. Mark every PT span you write (`lang="pt"` / `.pt` / `.ptw`) — unmarked PT renders as
plain English.

## NOTES / parked (never a reason to stop)
- **Duplicate stems** in business 33 (3), 34 (2), 35 (5) — rename in the quiz instance (`· quiz`); fix in the
  close-of-run bug pass, not during generation.
- **Unmarked Portuguese** in the 1-35 pages is widespread (measured with a throwaway script on 2026-11-03: L1 ~509
  words of PT rendered as English). The step-2 sweep marks what it touches; a full marking pass is a bug-pass item.
- **Audio:** clips exist for 1-14 only; every target line carries `data-say`; render + `audio:check` at the very end,
  outside the loop.
- **Pronunciation dictionary**: `dictionary.json` lacks some business keys (`stakeholder`, `onboarding`); inline
  pronunciation is not in the spec — deferred, not blocking.
- **`lessons-archive/`** is gitignored and withheld: never open it for content, shape or inspiration.
