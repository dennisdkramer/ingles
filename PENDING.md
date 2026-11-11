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

## [46] - fix the stack sentence in style.css: it mis-describes its own class and restates a retired priority
- NOTE - the style.css cleanup/reorder plan that stood as [44] is no longer in this file (cleared this turn). Its remaining batches -- cleanup, regroup, dedupe -- are not recorded anywhere but the transcript. Restore on request.
### [B1] DONE - 2026-11-11 - PENDING.md - the entry itself <"ok so fix it"> <a plan in [CURRENT]>
   - [S1] - measured before editing: `.qgrid` (no `.stack`) is one item per row; `.qgrid.stack` is `grid-auto-flow:column` + `--rows` (items run down a column, columns tiled across); `.qgrid.stack.wide` is `display:block` (one full-width column). 605 uses across 103 pages, so no declaration is removed -- the defect is the comment <style.css:395-396> <the three forms named before editing>
### [B2] DONE - 2026-11-11 - style.css - rewrite the comment, leave every rule alone <"just remove the rules and let the css work naturally" -- the rules work; the prose does not> <an accurate comment over unchanged CSS>
   - [S1] - drop "a stack is ONE column unless the page asks to tile it (.cols / .sent / .stack)" because `.stack` IS the tiling and `.stack.wide` is the one column; drop "it tiles to fill its block, because dead space is the priority to avoid" because it contradicts "the page decides, not the CSS" in the same sentence and restates the priority retired by the small-first width rule <style.css:395-396> <three forms and the numbering order stated, no false claim left>
### [B3] DONE - 2026-11-11 - no file changed - prove it was prose <"fix it"> <unchanged render>
   - [S1] - `QA_ON=1 node qa/cssdiff.mjs` identical on all three pages, and `node qa/liquid.mjs` clean <qa/cssdiff.mjs, qa/liquid.mjs> <0 differences, 33 clean>
### [B4] DONE - 2026-11-11 - PENDING.md, commit b06ed3d - publish <nothing ships on an unread run> <Pages build read>
   - [S1] DONE - commit, push, then the Pages run for that sha. No run appeared for b06ed3d in the API, but the served style.css carries the new sentence and no longer carries the old claim, so publication was verified by content rather than by the run list <VERIFICATION.md> <build success stated only after reading the run>
