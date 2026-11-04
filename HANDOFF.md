# HANDOFF — context handoffs between sessions
A running note for handing context from one session/task to the next: where the work stands, what is in flight, and what to pick up next. Write here when a session ends mid-work, or when the next session needs context that is not obvious from the files themselves. (Not a task queue — see PENDING.md for the active plan and PARKED.md for the backlog.)

_(Cleared 2026-11-03 at the owner request — the next task starts from the block below.)_

---


## Handoff — the three-track run (owner, 2026-11-03). Read this, then `PENDING.md`, then `BLUEPRINT.md`.

**Authoritative spec.** `PEDAGOGY-MAP.md` and `PAGE-CHECKLIST.md` are KING: read them, follow them, never restate
them into another file. Portuguese = `PEDAGOGY-MAP` §4 t); register = §4 u) with the three options per track in §1;
level = §5 v)-y) — STUDENT LEVEL is the lesson number, CONTENT LEVEL is **judged at the point of generation**, and
nothing is scored. If any other file disagrees with those two, those two win and the other file is wrong.

**QA IS OFF — owner instruction for this run.** Do not run `npm run qa`, `qa/content`, `qa/width`, `qa/overflow`,
`qa/smoke`, `qa/games`, `qa/landing`, `audio:check`, or any browser/Chrome harness; do not report them. What still
runs: the two free per-page structural checks (below, <2 s, they catch a broken table), `node build-lessons.mjs`
after each batch or track (it is the manifest/landing feed, not QA), and `git`. Commit messages say "QA disabled by
owner instruction for this run" instead of listing deferred checks.

**State.** `business/` lessons **1-50** built and pushed — the track is complete (batch hashes: `800259c` 36-38,
`d7837f4` 41-43, `6d2d29f` 44-46, `85c8181` 47-48, `c1233f3` 49-50); designs 1-50 exist. 39/40 are SKIP-TO-DO.
`kids/` and `adult/` are tracked and **empty** — the old pre-rewrite pages were moved into `lessons-archive/`, which
stays gitignored and must never be opened. `lessons.json`: business 48, kids 0, adult 0. `index.html` COUNTS `0/50/0` —
set COUNTS to the real total when a track completes. Audio: clips exist for 1-14 only; the rest carry `data-say`
and are rendered at the end of the whole run (never inside the loop).

**Write protocol — this cost a whole session, do not improvise.**
1. Append with `insert_line = <current line count> + 1`. Re-read the count before **every** chunk; never reuse a
   remembered number (a split chunk shifts everything and splices a block into a `<tbody>`).
2. After every page run the two free checks (below). A chunk spliced into a table is *silently repaired by the
   browser*, so the page looks fine — only these catch it.
3. Note rows are always `<tr class="note"><td colspan="N">…</td></tr>`. A bare `<tr class="note">text` hoists its
   content out of the table.
4. A `.qitem` needs `.qline > .qstem` (a radio with no stem resolves **no anchor** and never persists) and
   `.qopts` **below** the prompt. One layout per block (FORMAT rule 9).
5. Every stem unique **across the page** — two controls with the same stem share one saved answer.
6. Keep `.blanks` prompts short in `.cols`: hint below the input (`<br>`), `--gap-w` ≤ 11em. Prevents `ROWWRAP`
   by construction instead of by check.
7. Every group is a block (`.panel` / `.chart` / `.card` / `.dialog` / `fieldset` / `.game`); halves/thirds only
   inside `.itemrow[data-cols="2"|"3"]`, with the width reason written into the design file.
8. Copy the page to `<track>/lessonNN.edit.html` **after** the last edit.

**Free per-page checks.**
```
$t=Get-Content -Raw -Encoding utf8 <track>\lessonNN.html
'table ' + ([regex]::Matches($t,'<table')).Count + '/' + ([regex]::Matches($t,'</table>')).Count +
' tbody ' + ([regex]::Matches($t,'<tbody')).Count + '/' + ([regex]::Matches($t,'</tbody>')).Count +
' div '   + ([regex]::Matches($t,'<div')).Count   + '/' + ([regex]::Matches($t,'</div>')).Count
node -e "const {JSDOM}=require('jsdom');const d=new JSDOM(require('fs').readFileSync('<track>/lessonNN.html','utf8')).window.document;console.log([...d.querySelector('.content-area').children].map(e=>e.tagName).join(' '))"
```
Expect only `H1 H2 P DIV TABLE` — any `B`/`TR`/`TD` child is a hoisted element from a broken table.

**Known-failure signatures → cause.**
- hoisted `B/TR/TD` children **+** `… -20px BLOCKGAP between «…»` ⇒ unclosed `<table>`, a bare note row, or a
  chunk spliced into `<tbody>`. Confirm with the child dump, repair by script, never by guesswork.
- `N of M radios resolve no anchor` ⇒ radio outside `.qline > .qstem`.
- `(hint) N anchor(s) shared` ⇒ same stem twice in the page; rename one (keep the section name in the stem:
  `Entrevista 1`, `Som 2`, `Treino 3`).

**Non-negotiables per lesson** (PEDAGOGY-MAP §3-§5): the opener states what the lesson installs (3-5 sentences, in
target strings, never an activity list); explain → show → recognise → produce → test; the last section is a
**no-consultation quiz that never copies the training items**; ≥10 new vocabulary items, each glossed inline before
use; language and register are decided **at the point of generation** by §4 t) and §4 u) alone — no counts, no
quotas, no band of any kind, and no target PT ratio; never teach a neighbour's items (read that lesson's
`Note:`/`Sequence:` lines) — recycle, don't re-teach; only `input.gap` / `input[type=radio]` / a non-feed
`textarea` persist, so a new vehicle must drive one of them; `data-say` carries how a line is **said**.

**TO-DO sections (owner-approved).** When the best vehicle for a section does not exist, ship the section as
`<div class="panel itemsize"><h3 class="ex-head">TO-DO — not built: <name></h3><p>what it is, why it is the best
vehicle here, and what the student does <b>today</b> with a real primitive.</p></div>`
TO-DO replaces a **vehicle**, never the **teaching** (the five beats and the ≥10 vocab still stand); any number of
them is acceptable. `grep TO-DO` collects them for the final pass.

## Run order for this run (fixed — batches inside a step may be sized freely, the ORDER may not change)

**Steps 1-3 are done** (business 1-50 built, sidecars, pushed; the 1-35 sweep is PARKED by the owner). **The next run is
steps 4 → 9 below, in ONE run, with no stopping at a step or track boundary.** (Numbering: close is 9 here, 8 in
`PENDING.md`, which folds the bookkeeping item into each track step — same work, don't be confused by it.) **39 and 40
are SKIP-TO-DO in every track** (exam/checkpoint: format, item mix and scoring need an owner decision first) ⇒ **each
track is 48 lessons**, not 50: create no design and no page for them, and record them once as SKIP-TO-DO, never as
missing.

1. **Pass A, business 36-50.** One design per turn in `designs/lessonNN.design.md`, sequential, each with its
   `recycles:` / `must not re-teach:` line. No pages yet — clean context for shape invention.
2. **Language/level sweep of the built business pages 1-35.** Rapid, per lesson, no deep re-authoring: where an
   explanation/tip/headline is Portuguese and the content is not above the lesson number, put it back into English;
   where the prose sits far below or far above the lesson number, fix the worst offenders. Do not restructure
   sections, do not re-do quizzes, do not chase duplicate stems (parked for the end-of-run bug pass). Mark PT spans
   you touch (`lang="pt"` / `.pt` / `.ptw`) — unmarked PT renders as plain English.
3. **Pass B, business 36-50.** Page + sidecar + the two free checks per lesson, `build-lessons.mjs` per batch,
   push per batch.
4. **Pass A, kids 1-50.** Each design takes the **fundamental pedagogical idea** of the same-numbered business
   `designs/lessonNN.design.md` — the thing being taught and the teaching beats — and **re-imagines everything
   else**: context, situations, vocabulary, examples, vehicles, humour, stakes, and register (PEDAGOGY-MAP §1
   TRACK 2 KIDS). Not a translation, not a re-skin: the same idea taught to a 14-year-old. Written as
   `designs/kids/lessonNN.design.md`.
5. **Pass B, kids 1-50.** `kids/lessonNN.html` + `.edit.html`, two free checks, push per batch.
6. **Pass A, adult 1-50.** Same move, one track down: the **kids** design's fundamental idea, re-imagined for
   PEDAGOGY-MAP §1 TRACK 3 ADULT — culture, real life, self-expression, swearing taught as core content, register
   a/b/c. `designs/adult/lessonNN.design.md`.
7. **Pass B, adult 1-50.** `adult/lessonNN.html` + `.edit.html`, two free checks, push per batch.
8. **Track completion bookkeeping:** after each track, `node build-lessons.mjs`, set `index.html` COUNTS to the
   real total, commit and push, rewrite `PENDING.md` → `WHERE WE ARE`.
9. **Close of run:** a high-level QA report (what was built, what was never checked, known gaps, duplicate stems,
   TO-DO vehicles, audio not rendered) → then either stop and await instruction, or run the full QA + bug-fix pass
   if the owner says so. Never start the full suite unasked.

**Where we are:** business **1-50** built and pushed (track complete); designs 1-50 exist; `kids/` and `adult/` are
empty and no kids/adult design exists yet. Next action = **step 4, Pass A kids lesson 01**, then work steps 4 → 9
top-down without stopping: `designs/kids/lesson01.design.md` from `designs/lesson01.design.md`'s fundamental idea.

---

## Run policy (owner, 2026-11-03) — supersedes any earlier cadence

**Scope:** one task, all three tracks, in the order above. Nothing waits for an owner decision except a
PEDAGOGY-MAP §2 conflict or the close-of-run report.

**Failure policy (hang / timeout / error):** treat it as a **skip signal, not a blocker**. Retry once at most;
record it under `BLUEPRINT.md` → NOTES; then move on — next step → next lesson → next track. **Only 3 consecutive
systemic failures that prevent generation justify stopping.** Never leave a long command in the loop that can
hang: no audio render, no Chrome, no local servers, no `npm run qa`. The loop is: writes, the two free checks,
`build-lessons.mjs`, `git`.

**Re-read rhythm:** after **every lesson** re-read `PAGE-CHECKLIST.md` + the next lesson's roadmap entry and design
(~1.5k tokens, the anti-drift measure). After **every 3rd lesson** do the full reload —
`BLUEPRINT.md` → `PAGE-CHECKLIST.md` → `HANDOFF.md` (~4k).

**Push cadence:** every lesson-or-batch (a batch is 3 lessons unless the track is ending), **and** at every track
switch and every step boundary of the run order.

**Context discipline (the owner sets the window; the agent defends it):** one lesson costs ~9-11k tokens of live
work (≈1.6k of reads, ~6-7k of page text, ~1k of checks/log). Keep the *retained* window under ~150k; if the
client is about to compact, write `BLUEPRINT.md` first — the update trigger matters more than the summary.

**Designs for kids/adult live in `designs/kids/` and `designs/adult/`** so the business naming stays untouched;
`build-lessons.mjs` and the pages never read the designs, so the path is free.

