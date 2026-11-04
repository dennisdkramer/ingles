# PENDING — active subtask batch plan (HARNESS.md RULE 7 step 1)
The live working plan for the CURRENT task. When a prompt is decomposed into subtask batches (RULE 7), they are written here, executed in order, and cleared here once done AND committed. Deferred / not-yet-started work stays in PARKED.md — move an item from PARKED.md here when you actually begin it, and clear it there once it is done and committed. Cross-session handoffs live in HANDOFF.md.

_(Active batches, newest first. Cleared once done AND committed.)_

`WHERE WE ARE` — **step 4 (Pass A kids) is in progress and step 5 (Pass B kids) has started**: `designs/kids/lesson01.design.md`, `lesson02.design.md`, `lesson03.design.md` exist, and `kids/lesson1.html`, `kids/lesson2.html` (The Words You Already Know), `kids/lesson3.html` (Six Words & the Polite Question) are written **with byte-identical `.edit.html` sidecars**. Commit `2ea35cf` (kids 1-3, pushed). Kids 1-3 keep the same-numbered business page's fundamental idea (profile skeleton / cognate fast lane / six wh- words + polite embed + repair) rebuilt for the kids persona.
`WHERE WE ARE` — **kids 1-27 built and sidecarred**; next is **kids lesson 28**. Commits: `2ea35cf` (1-3), `2f83543` (4-6), `c5368e2` (7-9), `99b5f24` (10-12), `b0ed1e7` (13-15), `f24fa3c` (16-18), `b43722c` (19-22), `ea9d8da` (22-24), kids 25-27 (see git log). `designs/kids/lessonNN.design.md` and `kids/lessonN.html` + `.edit.html` exist for 01-27.
**Step 4 + step 5 run together, in numeric order** (Pass A design → Pass B page → sidecar → `node tmp-check.cjs` → build → commit → push every 3). No QA in this run (owner).
`lessons.json`: kids 27 / business 48 (39/40 skipped) / adult 0; `index.html` COUNTS still `0/50/0` until the kids track ends.
39/40 are SKIP-TO-DO in every track, so each track is 48 lessons. Steps 1-3 are done (step 2 is PARKED by the owner); do not rebuild or re-open a business page.
Audio is **not rendered** in this run: every target line carries `data-say`; rendering happens at the very end.

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
