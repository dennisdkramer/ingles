# HANDOFF — context handoffs between sessions
A running note for handing context from one session/task to the next: where the work stands, what is in flight, and what to pick up next. Write here when a session ends mid-work, or when the next session needs context that is not obvious from the files themselves. (Not a task queue — see PENDING.md for the active plan and PARKED.md for the backlog.)

_(Cleared 2026-11-03 at the owner request — the next task starts from the block below.)_

---

## 2026-11-03 — handoff for the lessons 15-50 run (READ THIS FIRST, then PENDING.md → STATUS.md → HARNESS.md)

**State.** `business/` holds lessons **1-14** (each with `designs/lessonNN.design.md` and an identical `.edit.html`
sidecar). `lessons.json` business: 14, `index.html` COUNTS `0/14/0`. Engines: `engine1` (gate, selection popup,
notes/recordings), `engine2` (control bar, poll, `playSay`), `engine3` (Tier-1 games — `shootPair`; lesson 10 §1
is the only page using it: duck skin, `data-speed=95`, no countdown, misses replay). Audio: 541 clips rendered for
1-14 (`npm run audio:check` green). Harnesses: `qa/content.mjs` (structure + answer anchors), `qa/width.mjs`
(block model), `qa/overflow.mjs` (real-Chrome layout, incl. `ROWWRAP`), `qa/games.mjs` (engine3),
`qa/smoke.mjs` (engines), `qa/landing.mjs` (index).

**The owner's QA policy for this run — QA IS SUSPENDED BY INSTRUCTION.** Do not run the full suites per lesson and
do not report them as done. What runs, and when:
- **per page (free, <2 s):** tag-balance + jsdom child dump (commands below).
- **per batch of 3:** `node qa/content.mjs n n n` and `node qa/width.mjs n n n` (jsdom/markup, ~10 s).
- **every 3rd batch, or the first page of a new shape:** `node qa/overflow.mjs n n n` (real Chrome).
- **after any engine edit:** `qa/games.mjs` / scoped `qa/smoke.mjs`.
- **end of track:** full `overflow` sweep + `smoke` + audio render/`audio:check`, then the bug-fix pass
  (low-hanging first, pattern-by-pattern across pages).
Commit messages must say what was **not** verified (overflow/smoke/audio deferred) — the owner reads the pushes.

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
8. Copy the page to `business/lessonNN.edit.html` **after** the last edit.


**Free per-page checks.**
```
$t=Get-Content -Raw -Encoding utf8 business\lessonNN.html
'table ' + ([regex]::Matches($t,'<table')).Count + '/' + ([regex]::Matches($t,'</table>')).Count +
' tbody ' + ([regex]::Matches($t,'<tbody')).Count + '/' + ([regex]::Matches($t,'</tbody>')).Count +
' div '   + ([regex]::Matches($t,'<div')).Count   + '/' + ([regex]::Matches($t,'</div>')).Count
node -e "const {JSDOM}=require('jsdom');const d=new JSDOM(require('fs').readFileSync('business/lessonNN.html','utf8')).window.document;console.log([...d.querySelector('.content-area').children].map(e=>e.tagName).join(' '))"
```
Expect only `H1 H2 P DIV TABLE` — any `B`/`TR`/`TD` child is a hoisted element from a broken table.

**Known-failure signatures → cause.**
- hoisted `B/TR/TD` children **+** `… -20px BLOCKGAP between «…»` ⇒ unclosed `<table>`, a bare note row, or a
  chunk spliced into `<tbody>`. Confirm with the child dump, repair by script, never by guesswork.
- `N of M radios resolve no anchor` ⇒ radio outside `.qline > .qstem`.
- `(hint) N anchor(s) shared` ⇒ same stem twice in the page; rename one (keep the section name in the stem:
  `Entrevista 1`, `Som 2`, `Treino 3`).

**Non-negotiables per lesson** (PEDAGOGY-MAP §3-§5, unchanged): the opener states what the lesson installs (3-5
sentences, in target strings, never an activity list); explain → show → recognise → produce → test; the last
section is a **no-consultation quiz that never copies the training items**; ≥10 new vocabulary items, each
glossed inline before use; language and register follow ONE rule each (§4: PT in the explanation layer only while
`L < C`; §1: the context fixes the register); never teach a
neighbour's items (read that lesson's `Note:`/`Sequence:` lines) — recycle, don't re-teach; only
`input.gap` / `input[type=radio]` / a non-feed `textarea` persist, so a new vehicle must drive one of them;
`data-say` carries how a line is **said**. `business/` only — `kids/`, `adult/`, `lessons-archive/` are
gitignored and must never be read; `style.css` is implementation-only for content decisions.

**TO-DO sections (owner-approved).** When the best vehicle for a section does not exist, ship the section as
`<div class="panel itemsize"><h3 class="ex-head">TO-DO — not built: <name></h3><p>what it is, why it is the best
vehicle here, and what the student does <b>today</b> with a real primitive.</p></div>`
TO-DO replaces a **vehicle**, never the **teaching** (the five beats and the ≥10 vocab still stand); any number of
them is acceptable. `grep TO-DO` collects them for the final pass.

**Sequence for the new task.** Pass A for 15-20 (sequential, one design per turn, compact after each) → build
**15-17** → Pass A for 21-23 → build **18-20** → … one batch of 3 at a time, push per batch. Each design carries a
`recycles:` / `must not re-teach:` line so later batches cannot drift. After 50: kids, then adult, built **from
the design files** (same shapes, new situations/registers/examples) — never by find-replacing business pages;
swap the business-specific slots (e-mail/meeting/invoice lessons) for track-native ones.


## Break points — when a task hands back (NOT context-based)

Context is not a stop reason: **agentic compaction preserves intent and position**, and everything mechanical is
re-derivable from files. After any compaction, run the reload order in `PAGE-CHECKLIST.md` and continue.

**Standing order (goes into PENDING.md; survives compaction):** work the queue top-down without asking. Per
lesson: **update `BLUEPRINT.md` before any heavy edit or long command** (progress · the decision taken · next
immediate step), then reload (`BLUEPRINT` → `PAGE-CHECKLIST` → roadmap entry + design), build, run the two free
structural checks, copy the sidecar, push every 3. Hand back **only** when: (a) the slice assigned to this task is
done, (b) a PEDAGOGY-MAP §2 conflict appears, or (c) two consecutive structural-check failures share a cause you
cannot explain. Style doubts go into `BLUEPRINT.md` → NOTES — they never stop the run.

**Per-lesson delta line (redundancy tripwire):** in `BLUEPRINT.md`, write one sentence naming what is *new* in this
lesson versus the previous one. If that sentence is hard to write, the lesson is probably repeating the last one —
stop and re-read the design before continuing.


| Break | Slice | Why |
|---|---|---|
| 1 | **now** → Pass A 15-20 | clean context for shape invention (no built pages in view) |
| 2 | builds **15-26** (12 lessons, 4 pushes) | one phase; atomic per lesson so a compaction can't strand a page |
| 3 | builds **27-38** | A2→B1 ramp checkpoint at 30 |
| 4 | builds **39-50** | B1→B2 checkpoint at 40 |
| 5 | **end-of-business QA/bug-fix** + audio render | fresh eyes, no authoring context |
| 6 | kids — **4 slices** (1-12, 13-24, 25-36, 37-50), from the design files | new register; 50 pages is too much for one task even with compaction |
| 7 | adult — **4 slices** (same) | new register |
| 8 | final cross-track QA + publish gate (audio render + `audio:check`) | — |

**Where we are:** business lessons **1-35** built and pushed (batch 7 = `a23f924`); next action = **Pass A for lesson 36**.
Language and register are now one rule each (`PEDAGOGY-MAP.md` §4, §1) and `qa/lang.mjs` is the only language gate;
pages 1-35 predate the rule, and the retrofit is queued in `PENDING.md`.

---

## Run policy for the unattended run (owner, 2026-11-03) — supersedes any earlier cadence above

**Scope:** one task, all tracks, all remaining lessons — business 15-50 → kids 1-50 → adult 1-50. Nothing waits
for an owner decision except a PEDAGOGY-MAP §2 conflict.

**Failure policy (hang / timeout / error):** treat it as a **skip signal, not a blocker**. Retry once at most;
record it under `BLUEPRINT.md` → NOTES; then move on in this order — next step → next lesson → next track. **Only
3 consecutive systemic failures that prevent page generation justify stopping.** Never leave a long command in the
loop that can hang: no audio render, no Chrome/`overflow.mjs`, no local servers, no `npm run qa`. The build loop
is: writes, the two free structural checks, `git`.

**Re-read rhythm:** after **every lesson** re-read `PAGE-CHECKLIST.md` + the next lesson's roadmap entry and
design (~1.5k tokens, the anti-drift measure). After **every 3rd lesson** do the full reload —
`BLUEPRINT.md` → `PAGE-CHECKLIST.md` → `HANDOFF.md` (~4k).

**Push cadence:** every 3 lessons **and** at every track switch; commit messages state what was not verified.

**Context discipline (the owner sets the window; the agent defends it):** one lesson costs ~9-11k tokens of live
work (≈1.6k of reads, ~6-7k of page text, ~1k of checks/log). Keep the *retained* window under ~150k; if the
client is about to compact, write `BLUEPRINT.md` first — the update trigger matters more than the summary.



