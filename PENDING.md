# PENDING — Adherence.md [BATCHING] for current task

# [CURRENT] Prompt - (Active batches, newest first)

## [38] - load curves authored onto every activity, replacing the beat and cost fields (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"delete the 'beat' and 'cost' values for the activities and put the load values there"> <the entry format, the `**load**` shape the file states, and every beat/cost line located> IN PROGRESS
   - [S1] - `CONTENT_EXAMPLES.md [INSTRUCTIONS]` read for the exact `**load**` shape the file prescribes <the shape is the contract; inventing a second one is the defect> IN PROGRESS
   - [S2] - every `**beat**` and `**cost**` line found and counted, and the activities that carry answers or fields counted separately <43 was the count from the last audit; it is re-derived, not remembered> IN PROGRESS
### [B2] - the authoring <"put the load curves onto the activities … doesnt have to be accurate"> <one `**load**` line per activity, shaped for fast tweaking, with beat/cost removed> NOT EXECUTED
   - [S1] - the numbers derived from each activity's own content shape (option count, item count, clock, one-chance) and stated as a baseline-to-ceiling multiplier <never from the lesson level> NOT EXECUTED
### [B3] - verify <the file's own parser must still read every entry> NOT EXECUTED
### [B4] - publish <commit-by-default; a push is not a publication> NOT EXECUTED

## [37] - PENDING.md cleared to the live work, with the casualties reported (2026-11-10)
### [B1] - what is deleted known before it is deleted <"clear everything else out of pending"> <every section read, not assumed from its heading> DONE - 300 lines, 19 sections, read whole
### [B2] - the clear done as an archive, not a deletion <the repo already has PAST_BATCHES.md for exactly this> DONE - 247 lines moved, one header line recording the instruction and the date; nothing lost, so a reminder can still be acted on
   - [S1] - the two blocks that survive identified and kept <`[36]` is the live plan, and `[GUIDELINES]`/`[HANDLING]` are standing rules, not items> DONE - 50 lines kept, byte-for-byte
   - [S2] - the file rebuilt in temp and swapped in whole <never by truncating in place> DONE - 300 lines to 51, structure now: header, [CURRENT], [36], [GUIDELINES], [HANDLING]
### [B3] - the important casualties reported <"if its something really important you can remind me about it but still clear it"> <what is worth returning to, and where it now lives> DONE - reported in the turn message, each with its PAST_BATCHES.md address
### [B4] - verify and publish <commit-by-default> NOT EXECUTED
   - [S1] - `node qa/liquid.mjs` green, then commit and push, then read the Pages run for the commit <a push is not a publication> NOT EXECUTED


## [36] - the style.css sweep: fold, clean, regroup, dedupe (handoff entry for a new task, 2026-11-10)
- THE PLAN IN ONE LINE: make `style.css` the home of the *mechanism* (indexed at the top), leave the *decisions* in FORMAT.md / PEDAGOGY-MAP.md, and move rules between categories only behind `qa/cssdiff.mjs`.
- THE GATE: `node qa/cssdiff.mjs --save` before any edit, `node qa/cssdiff.mjs` after it. Exit 0 = the cascade did not move anywhere the baseline covers. The baseline covers 3 pages / 5,781 elements and is gitignored, so it must be re-recorded in the new task before the first edit.
- THE ORDER OF THE FILE, decided in [35]: general appearance -> in-block visuals -> function -> site UI (landing + teacher panel together) -> games. Second axis inside every group: element defaults -> class -> component modifier -> state -> print.
### [B1] - step 1, the fold <"roll the core info into headers … merge in any CSS specific stuff from FORMAT.md FUNCTION.md and PEDAGOGY-MAP.md"> <`style.css` gains an index; FORMAT.md stops restating the mechanism> NOT EXECUTED
   - [S1] - the INDEX written at the top of `style.css`: one entry per region, each shaped for SELECTION — "read when deciding a block's width; do not read for option counts" — anchored on the banner's TEXT, never a line number, and carrying NO values <a copied number is a second source of truth; that defect already exists as 391 vs 395> NOT EXECUTED
   - [S2] - the six pure-rendering bullets of FORMAT.md 33-47 move here as minimal CSS comments (`.thsub` 34, `.chips` 39, `.blanks` 41, `.listen` 43, `@media print` 45, `.card` 46) and FORMAT keeps only the one-line class index that lets a build know the class exists <FORMAT.md 35 and 44 stay where they are: authorial, not CSS> NOT EXECUTED
   - [S3] - the boundary held: `data-answer` + Complete/Clear/lock (FORMAT 36), `lang="pt" data-why` + its `qa/lang.mjs` exemption (37), speaker names (42) are CONTENT contracts and move to `FUNCTION.md` / `PEDAGOGY-MAP [AUTHORING]`, not into a stylesheet <"inside a stylesheet no build will ever see them"> NOT EXECUTED
   - [S4] - `PEDAGOGY-MAP.md:14` amended, because it currently calls style.css "implementation only … ONLY IF defensibly necessary" while the fold makes it a first-class read <a file cannot be indexed as primary while the map calls it an exception> NOT EXECUTED
   - [S5] - the index harness on the `qa/liquid.mjs` pattern, three directions: every entry names a banner that exists; every banner above the games region has an entry; every selector an entry names appears in the file <text anchor; a line-anchored index fails on unrelated edits and is ignored within a week> NOT EXECUTED
### [B2] - step 2, the cleanup <"be very aggressive, but anything youre not sure about you can ask me"> <prose down, intent intact> NOT EXECUTED
   - [S1] - the five defect classes hunted in order: contradiction between two comments on one rule (`261`/`262` is the known case), staleness (dashed edges, dead-space priority, the retired full-width default), a value restated in prose, provenance, and art narration <the poster case: 261 says the page decides, 262 says the CSS tiles> NOT EXECUTED
   - [S2] - the why compressed to "the minimum characters that keeps 100% of the intent", with who/when removed <"leave the why … remove the 'who' and 'when' info"> NOT EXECUTED
   - [S3] - game and in-block-visual commentary pruned aggressively, the reasons that stop a later cleanup deleting a deliberate rule KEPT (the multiply tint below the ink; the `data-cols` gap budget; the "qgrid caps nothing" note) <"one clause of reason per non-obvious rule — keep it; history, praise and restated numbers — cut them"> NOT EXECUTED
   - [S4] - the modification policy at the top of the file, which `style.css` has never had: every value has a why and cannot be changed without user input and a check of what it affects <FORMAT.md:2 and PEDAGOGY-MAP.md:1 already carry such a policy; the stylesheet carries none> NOT EXECUTED
### [B3] - step 3, the regroup <"regrouping into … a) Global site appearance b) In-Block-Visuals appearance b) Function appearance c) Game appearance"> <five header bands, rules physically moved, ONE CATEGORY PER COMMIT> NOT EXECUTED
   - [S1] - general appearance first, since base foundation is the most universal thing in a sheet and universality already orders the groups correctly <the order above is the cascade's own order: nothing later may be beaten by something earlier at equal specificity> NOT EXECUTED
   - [S2] - the component layer split apart: buttons and the dialog sit at 68-160 ABOVE the block system at 169-280, so a block rule beats a component it should lose to. This is the file's one real ordering defect <the reported symptom ("button, card, popup at the top will supersede") is real; the direction is inverted — they lose, because they are early> NOT EXECUTED
   - [S3] - game rules that leak above the games region pulled back into it: `.g4-fx-petal` at 519, `.g4-prompt` at 558 and again at 1143 <the boundary at 900 is already untrue; `.g4-prompt` is one of only 24 selectors in the sheet declared twice> NOT EXECUTED
   - [S4] - `qa/cssdiff.mjs` run after EVERY category move, before the next one <a moved rule changes no declaration, so a text diff cannot show the damage> NOT EXECUTED
### [B4] - step 4, dedupe by value inside each group <"very likely that we can drastically compress by grouping by value instead of by rule"> <25.7% upper bound measured; the real figure re-measured after the prune> NOT EXECUTED
   - [S1] - literal colours to custom properties FIRST: `#2f9e44` 25x, `#e8f7ee` 15x, `#1d4ed8` 13x <`var(--ink)` repeated 40 times cannot drift; a hex repeated 25 times can, and one edit forks the palette> NOT EXECUTED
   - [S2] - the 52 identical whole-declaration-block groups collapsed (195 rules -> 52), the safest mechanical win because a whole block cannot be half-overridden <`{opacity:1}` 26x, `{display:none}` 12x, `{display:block;width:100%;height:100%}` 10x> NOT EXECUTED
   - [S3] - single-property selector grouping LAST, after the prune, and NEVER across groups: `position:absolute` 147x, `display:flex` 63x, `left:0` 46x <grouping by value and grouping by category pull opposite ways; the cross-category merges are exactly the cascade-unsafe ones, so the organisational rule IS the safety rule> NOT EXECUTED
   - [S4] - the refusal test implemented: refuse any merge where another rule declaring the same property shares a class/tag/id token with a member selector, and refuse across `@media`/`@keyframes` <each selector keeps its own specificity, so only ORDER can change, and only those rules can flip> NOT EXECUTED
   - [S5] - rules carrying a why are exempt from merging unless the why is rewritten for the whole group <a comment written for one selector becomes a lie on a 26-selector rule> AWAITING USER

## [GUIDELINES]
- Requested changes are committed and pushed when done by default. For any changes that are not pushed, the user must be notified at Turn completion.
- Avoid rapid successive pushes when a single combined push would do — build markers, a live-site curl or a fixed sleep are tools reached for when the risk of an undetected deploy problem is real, not mandatory steps after every push.
- A push is not a publication: GitHub builds the site after it, and a build that fails leaves the PREVIOUS deployment serving while the push reports success. Before any push that touches a `.md`, run `node qa/liquid.mjs` (the pre-push hook runs it too, and `--no-verify` is how that guard was skipped on 2026-11-10). After any push that changes what the site serves, read the Pages run for that commit — `https://api.github.com/repos/dennisdkramer/ingles/commits/<sha>/check-runs` — and a `failure` at the step "Build with Jekyll" means the change is not live, whatever `git push` said.

## [HANDLING]
- For each completed [Sn], replace `[Sn]` with `[Sn] DONE - <date> - <which files it modified>` and begin work on the following `[Sn]` or the first `[Sn]` in the following `[Bn]`.
- For each completed [Bn] (or when all [Sn] within it are marked `DONE` and/or `STALE`, replace `[Bn]` with `[Bn]- DONE`.
- For any [n], [Bn], or [Sn] that no longer conforms to the current plan or user intent, or is otherwise judged as stale, it is marked `STALE`.
- At the start of each turn when its batches are written, any [n],[Bn],and or [Sn] remaining in [CURRENT] are read. For each that is not marked `DONE` or `STALE`, it is presented to the user as a choice to a) merge with current turn's batches, b) migrate to PAST_BATCHES.md, or c) delete.
- When all [Bn] within any [n] are [completed and/or marked `DONE` and/or `STALE`], all content within section [n] is cleared, and [n] is migrated and appended to PAST_BATCHES.md.
- For any [change in plans] or [deviation from the batching/order in pending.md] You must - Update any relevant [[n] and/or [Bn] and/or [Sn]] to reflect the change(s) and add `- UPDATED <The user's original plan for that item><Why the change occurred>` to each of them.
- Read only the active `### [Bn]` batch section unless [its completion] or [user instruction] mandates reading its siblings.
- Never write an unclosed Liquid opener in this file or any other `.md` — two opening braces, or a brace plus a percent sign. Every `.md` here is rendered as a Jekyll page and Liquid parses it BEFORE Markdown, so a code span is no protection; a bare opener in this file killed the Pages build exactly this way on 2026-11-10, and the site kept serving the old list. To show a token, put it in a raw block or leave a character between the braces, and run `node qa/liquid.mjs` before the push that carries it.

Author ([n]=(Prompt], [Bn]=(Batch),[Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [n] - <1 line summary of user prompt>` 
`### [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
`   - [Sn] - <the distinct goal unique to this step> <the File & Section name of the rules which are most relevant> <exit condition>`

