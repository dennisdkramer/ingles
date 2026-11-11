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

- NOTE - the style.css cleanup/reorder plan that stood as [44] is superseded by [47] below and is not restored. It is in the transcript if ever wanted.

## [47] - re-plan style.css: 1 dedupe, 2 regroup, 3 clean the CSS, 4 audit the headers, 5 cut the prose to the floor
### [B0] DONE - 2026-11-11 - PENDING.md - PRE-PROMPT RESEARCH <which headers exist, how big each is, and what the CSS already says without them> <a measured header table, then cleared>
   - [S1] DONE - 21 headers, 13,025 chars = 9.9% of the 131,203-char file; 0 of them is one line, 8 run over 6 lines, the largest is BLOCK WIDTH SLOTS at 24 lines / 2,374 chars, then CHART 12L / 1,125c and BLOCK 9L / 882c. So the other comments hold 38,700 chars (29.5%) and no batch below touches them. Duplication found: PEDAGOGY-MAP [PAGE] states the small-first width rule AND points at `/* ## BLOCK WIDTH SLOTS`, so that rule has two owners; its second bullet ("relevant content is authored to extend the shorter one") is a live rule that step 4 must reconcile <style.css, PEDAGOGY-MAP.md [PAGE]> <every header sized, every duplicate named>
   - [S2] DONE - re-measured on the current file: 671 rules, 567 distinct declaration blocks, 39 identical-block groups covering 143 rules, 25 exact margin:0, 113 position:absolute, literals 28 / 17 / 13. `p.todo` has its rule <style.css> <numbers current, not inherited>
### [B1] - 1 DEDUPE <"first we 1 dedupe"> <fewer declarations, identical render>
   - [S1] - the three literal colours to custom properties (#2f9e44 x28, #e8f7ee x17, #1d4ed8 x13): a var() cannot fork, a repeated literal can <style.css palette> <one declaration each>
   - [S2] - the 39 identical declaration blocks, 143 rules down to 39, whole blocks only so no rule can be half-merged <style.css> <no identical block remains>
   - [S3] - single-property repeats (position:absolute x113, margin:0 x25, display:flex, opacity:0), refusing any merge where another rule setting the same property shares a class/tag/id token and sits between the two; never across @media or @keyframes; a rule carrying a why is exempt <style.css> <every refusal logged with its blocker>
   - [S4] - gate: `QA_ON=1 node qa/cssdiff.mjs` identical, then re-measure rules and characters <qa/cssdiff.mjs> <0 differences, both numbers reported>
### [B2] - 2 REGROUP <"then 2 regroup"> <style.css in five groups>
   - [S1] - general (columns, type, form defaults, focus, palette); [S2] in-block visuals (chart, activity block, kind, rhythm, slots, qgrid, blanks, gloss, stack, reflow); [S3] function (button, popup, highlight, note, confirm dialog — today split across the top of the file and inside the block region); [S4] site UI (index.html landing, teacher panel, student rows, access toggles); [S5] games <style.css> <one commit per group, cssdiff identical after each>
   - [S6] - inside every group the second axis is fixed: element default -> class -> component modifier -> state (:hover, .wide, [data-*]) -> print <style.css> <no group out of order>
### [B3] - 3 CLEAN THE CSS <"then 3 cleanup any remaining redundancy or conflict, in the actual CSS"> <fewer rules, same render>
   - [S1] - redundancy: a child re-declaring what it inherits, a declaration repeated inside one rule, `grid-template-columns:none` beside grid-auto-columns, and any rule whose selector matches no element on any of the 103 pages <style.css> <each deletion listed with why it was safe>
   - [S2] - conflict: two rules setting the same property on the same element where the later wins only by position, and any comment still contradicting the rule beneath it <style.css> <no pair disagrees>
   - [S3] - gate: cssdiff identical <qa/cssdiff.mjs> <0 differences>
### [B4] - 4 HEADER AUDIT, the big one <"all items that the generation step needs to know should be explained in headers and those headers should be analysed for where they should go"> <a routing table for every header>
   - [S1] - classify each header GREEDY-NEEDED (a build must DO or MUST NOT DO this), IMPLEMENTATION (readable from the CSS below it), or DEAD (nothing depends on it), naming the class or attribute it governs <style.css headers, PEDAGOGY-MAP [PAGE]> <all classified, none unjudged>
   - [S2] - route each: stay in style.css as a contract line, or move to PEDAGOGY-MAP [PAGE] because it decides what the page HAS, or be deleted because the CSS shows it. Every duplication with PEDAGOGY-MAP [PAGE] gets one owner <PEDAGOGY-MAP.md [PAGE]> <one owner per rule, no rule in two files>
   - [S3] - execute the routing, one commit per destination <style.css, PEDAGOGY-MAP.md> <no leftover pointer to a moved header>
### [B5] - 5 MINIMUM PROSE <"they should be made the absolute minimum prose possible to explain the intent or function"> <the header set at its floor>
   - [S1] - each surviving header reduced to intent or function alone: no restated values, no who/when, nothing the CSS already shows; a header that needs a paragraph is first questioned, not compressed <style.css> <every header one to three lines>
### [B6] - VERIFY AND PUBLISH <nothing ships on an unread run> <Pages build read>
   - [S1] - cssdiff identical, liquid clean, one content check on a real lesson, then the Pages run for that sha <VERIFICATION.md> <0 differences, build success stated only after reading the run>

