# PENDING — Adherence.md [BATCHING] for current task

## [HANDLING]
- For each completed [Sn], replace `[Sn]` with `[Sn] DONE - <date> - <which files it modified>` and begin work on the following `[Sn]` or the first `[Sn]` in the following `[Bn]`.
- For each completed [Bn] (or when all [Sn] within it are marked `DONE` and/or `STALE`), replace `[Bn]` with `[Bn]- DONE`.
- For any [n], [Bn], or [Sn] that no longer conforms to the current plan or user intent, or is otherwise judged as stale, it is marked `STALE`.
- At the start of each turn when its batches are written, any [n], [Bn], and/or [Sn] remaining in [CURRENT] are read. For each that is not marked `DONE` or `STALE`, it is presented to the user as a choice to a) merge with current turn's batches, b) migrate to PAST_BATCHES.md, or c) delete.
- When all [Bn] within any [n] are [completed and/or marked `DONE` and/or `STALE`], all content within section [n] is cleared, and [n] is migrated and appended to PAST_BATCHES.md.
- For any [change in plans] or [deviation from the batching/order in pending.md] You must - Update any relevant [[n] and/or [Bn] and/or [Sn]] to reflect the change(s) and add `- UPDATED <The user's original plan for that item><Why the change occurred>` to each of them.
- Read only the active `### [Bn]` batch section unless [its completion] or [user instruction] mandates reading its siblings.
- Never write an unclosed Liquid opener in this file or any other `.md` — two opening braces, or a brace plus a percent sign. Every `.md` here is rendered as a Jekyll page and Liquid parses it BEFORE Markdown, so a code span is no protection; a bare opener in this file killed the Pages build exactly this way on 2026-11-10, and the site kept serving the old list. To show a token, put it in a raw block or leave a character between the braces, and run `node qa/liquid.mjs` before the push that carries it.

Author ([n]=(Prompt), [Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [n] - <1 line summary of user prompt>`
`### [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
`   - [Sn] - <the distinct goal unique to this step> <the File & Section name of the rules which are most relevant> <exit condition>`

## [LESSON] GENERATION ONLY - at the beginning of any first step of every lesson generation:
**MUST READ** - [Contents of (PEDAGOGY-MAP.md [GENERATION]) until the first `## `] AND [(PEDAGOGY-MAP.md [I/O], [BUILD], [PORTUGUESE], [LEVEL], [AUTHORING], AND [PAGE])] - (files in memory are not sufficient, **a skipped re-read is a generation failure**).

# [CURRENT]

## [44] - clean up and reorder style.css: five groups, dedupe inside each, gated by qa/cssdiff
### [B0] DONE - 2026-11-11 - qa/cssdiff.mjs - a measurable render before any rule moves <"cleaning up and reordering style.css"> <baseline snapshot>
   - [S1] DONE - baseline written (3015 / 2359 / 409 elements). Determinism needed two harness fixes: the seeded Math.random pin became a constant (a seeded generator only reproduces a shuffle while its CALL ORDER is stable, and an async load reorders it), and the settle window went 400ms -> 2s (lesson40 inserts nodes about a second in, which read as 6 changed elements). 4 consecutive runs identical; selftest still sees a real change (994 elements) <qa/cssdiff.mjs> <identical on all three pages>
### [B1] - UPDATED the catalogue and the fold were authored directly by the owner as 21 `/* ## ` headers in style.css (that header set IS the scan list), so no separate catalogue is written here; the "every value carries a why" policy line is likewise absent — each header states `owner instruction 2026-11-09` in its place <readability comes before size> <style.css with a section catalogue>
   - [S1] - catalogue at the top, one line per section, shaped `§<what> — read when <decision>`; the decision only, never a value (391 vs 395 is what copying values into prose costs) <FORMAT.md 42-60 values, 27-39 class glossary, 14/16/17/23/9/7@38px> <every section listed, no number in any header>
   - [S2] - header policy: every value carries a why, no value changes without sign-off <style.css carries no modification policy today> <policy at the top of the file>
   - [S3] - `qa/cssdiff.mjs` identical — the proof that this batch was text <qa/cssdiff.mjs> <0 differences>
   - DEPENDS - the user is mid-edit in FORMAT.md/PEDAGOGY-MAP.md; the destination of every line is already fixed in [40] phase 2, so this waits for those to commit
### [B2] - cleanup <"reduce prose, nothing stale or conflicting, prune overlap"> <smaller style.css, same render>
   - [S1] - contradictions, comment-vs-comment and code-vs-code: 261/262 disagree on who decides a stack's tiling, 262's "dead space is the priority" was retired by FORMAT e)2, and no child may re-declare what it inherits <style.css:261-262> <no two statements disagree>
   - [S2] - prose: one why clause per non-obvious rule; cut who/when/provenance, praise, restated numbers, and all game and in-block-visual commentary <sweep points 4 and 5> <0 provenance lines, 0 restated values>
   - [S3] - `qa/cssdiff.mjs` identical <qa/cssdiff.mjs> <0 differences>
### [B3] - regroup into five groups in cascade order, one commit each <the four categories plus site UI> <style.css in five groups>
   - [S1] - general (columns, type, form defaults, focus, palette) · [S2] in-block visuals (chart, activity block, kind, rhythm, slots, qgrid, blanks, gloss, stack) · [S3] function (button, popup, highlight, note, confirm dialog — today split across 68-160 and inside the block region) · [S4] site UI (index.html landing, teacher panel, student rows, access toggles; style.css:301, 405) · [S5] games (189 bespoke .g4-* names; .g4-fx-petal at 519 and .g4-prompt at 558/1143 sit above the 900 boundary) · [S6] inside every group: element default -> class -> component modifier -> state -> print <FORMAT.md a) values> <each group committed alone, `qa/cssdiff.mjs` identical after each>
### [B4] - dedupe by value, inside a group only <"grouping by value instead of by rule"> <smaller style.css, same render>
   - [S1] - literal colours to custom properties: #2f9e44 x25, #e8f7ee x15, #1d4ed8 x13 (the only real drift risk — a var() cannot fork, a literal can) <style.css palette> <one declaration each>
   - [S2] - the 52 identical whole-block groups (195 rules -> 52) <measured 847 rules / 3085 declarations> <no identical block remains>
   - [S3] - selector grouping on single-property repeats (position:absolute x147, display:flex x63, opacity:0 x55, left:0 x46), refusing any merge where another rule setting the same property shares a class/tag/id token; never across @media or @keyframes; rules carrying a why are exempt <style.css> <every refusal logged with its blocker>
   - [S4] - `qa/cssdiff.mjs` identical, then re-measure size and rule count <qa/cssdiff.mjs> <0 differences, both numbers reported>
### [B5] - verify and publish <nothing ships on an unread run> <Pages build read for the pushed sha>
   - [S1] - `qa/liquid.mjs` clean, `qa/examples.mjs` 8/8, one `qa/content.mjs` lesson, `qa/cssdiff.mjs` identical, then the Pages run for that commit <VERIFICATION.md> <build success, stated as such only after reading the run>

## [45] - commit the dirty tree, switch the liquid check back on, begin [44]
### [B0] DONE - 2026-11-11 - PENDING.md - PRE-PROMPT RESEARCH <what is dirty, and how the QA switch works> <a research result, then cleared>
   - [S1] DONE - 27 files dirty (not the 5 named): FORMAT.md deleted, PEDAGOGY-MAP.md rewritten, style.css +186 (the fold), every qa/*.mjs carrying a qaOff() call, and untracked qa/off.mjs. The switch is qa/off.mjs: `QA_ON=1` per run, or delete the call to re-enable one for good <qa/run.mjs, qa/liquid.mjs> <both known before any commit>
### [B1] DONE - 2026-11-11 - 27 files, commit f84eb08 - commit the working tree <"commit those files"> <clean tree, one commit>
   - [S1] DONE - committed as-is so the baseline starts from a committed tree. Known consequence named in the commit message: qa/provenance.mjs:69 still lists ['format','FORMAT.md'] in CONTRACT and :759 plants a FORMAT.md stub, so provenance throws ENOENT the moment it runs again <git status> <nothing dirty but known strays>
### [B2] DONE - 2026-11-11 - qa/liquid.mjs, commit 987400b - re-enable the liquid scanner <"you can re-enable liquid.mjs"> <the guard active again>
   - [S1] DONE - kill-switch line removed; real scan of 33 tracked .md (34 minus the deleted FORMAT.md), 0 warnings; selftest 6/6. One accident, caught and fixed in the same step: the removal script's CRLF split ate the `spawnSync` import beside it (reported 1 line, removed 2); restored before running <qa/liquid.mjs> <a real scan, not a QA OFF line>
### [B3] DONE - 2026-11-11 - qa/cssdiff.mjs - begin [44] [B0] <"go"> <baseline snapshot>
   - [S1] DONE - run under the documented per-run switch (`QA_ON=1`), since qa/cssdiff.mjs:19 is still off by default: every [44] gate below needs that prefix <qa/cssdiff.mjs> <identical on all three pages>

