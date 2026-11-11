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

- NOTE - the style.css cleanup/reorder plan that stood as [44] is no longer in this file (cleared this turn). Its remaining batches -- cleanup, regroup, dedupe -- are not recorded anywhere but the transcript. Restore on request.
