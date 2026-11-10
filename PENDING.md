# PENDING — Adherence.md [BATCHING] for current task

## [GUIDELINES]
- Requested changes are committed and pushed when done by default. For any changes that are not pushed, the user must be notified at Turn completion.
- Avoid rapid successive pushes when a single combined push would do — build markers, a live-site curl or a fixed sleep are tools reached for when the risk of an undetected deploy problem is real, not mandatory steps after every push.


## [HANDLING]
- For each completed [Sn], replace `[Sn]` with `[Sn] DONE - <date> - <which files it modified>` and begin work on the following `[Sn]` or the first `[Sn]` in the following `[Bn]`.
- For each completed [Bn] (or when all [Sn] within it are marked `DONE` and/or `STALE`, replace `[Bn]` with `[Bn]- DONE`.
- For any [n], [Bn], or [Sn] that no longer conforms to the current plan or user intent, or is otherwise judged as stale, it is marked `STALE`.
- At the start of each turn when its batches are written, any [n],[Bn],and or [Sn] remaining in [CURRENT] are read. For each that is not marked `DONE` or `STALE`, it is presented to the user as a choice to a) merge with current turn's batches, b) migrate to PAST_BATCHES.md, or c) delete.
- When all [Bn] within any [n] are [completed and/or marked `DONE` and/or `STALE`], all content within section [n] is cleared, and [n] is migrated and appended to PAST_BATCHES.md.
- For any [change in plans] or [deviation from the batching/order in pending.md] You must - Update any relevant [[n] and/or [Bn] and/or [Sn]] to reflect the change(s) and add `- UPDATED <The user's original plan for that item><Why the change occurred>` to each of them.
- Read only the active `### [Bn]` batch section unless [its completion] or [user instruction] mandates reading its siblings.

Author ([n]=(Prompt], [Bn]=(Batch),[Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [n] - <1 line summary of user prompt>` 
`### [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
`   - [Sn] - <the distinct goal unique to this step> <the File & Section name of the rules which are most relevant> <exit condition>`

# [CURRENT] Prompt - (Active batches, newest first)

## [17] - Make lesson 40 reachable, fix roadmapSpan, rewrite the pre-split rule, correct FORMAT.md's width classes
Open, not instructed, no step: "yeah we probably need to do a roadmap edit" - names no item and no target lesson, so it is asked in the reply, not acted on.
### [B1] - Close [16] and author this prompt's batches "im not seeing lesson 40 on the live site" PENDING.md [HANDLING] 13,17-20 DONE - 2026-10-11 - PAST_BATCHES.md, PENDING.md
   - [S1] - Migrate the finished [16] into PAST_BATCHES.md and clear it <PENDING [HANDLING] 13> <[CURRENT] holds only [17]> DONE
### [B2] - Lesson 40 is not on the live site "im not seeing lesson 40 on the live site" index.html, tracks.json, <track>/track.json DONE - 2026-10-11 - lessons.json, tracks.json, index.html
   - [S1] - Find what the landing reads to decide which lessons to link <index.html 364, build-lessons.mjs 103-133> <the page was served all along; lessons.json and tracks.json were stale at adult 22 with no n:40, so nothing linked it> DONE
   - [S2] - Apply the smallest correct fix and prove it locally <build-lessons.mjs> <adult 22 -> 23, lessons.json carries n:40, qa/landing.mjs green> DONE
### [B3] - roadmapSpan returns the span without blank stripping "change roadmapspan to just say the span" <qa/provenance.mjs 76-100> DONE - 2026-10-11 - qa/provenance.mjs
   - [S1] - End the span at the line before the next heading, with no blank-line stripping <qa/provenance.mjs 76-100> <the harness itself now reports adult/40 as 388-397> DONE
   - [S2] - Check the change cannot orphan the kids records already in the ledger <KIDS-ROADMAP.md 30, 31 spans> <kids/30 303-311 -> 303-312, kids/31 313-321 -> 313-322: stale, amended in [B4] [S2]> DONE
   - [S3] - Run the harness selftest if one exists <qa/provenance.mjs --selftest> <selftest green> DONE
### [B4] - Re-record adult/40 against the new span <PEDAGOGY-MAP [GENERATION] 5 (26-31)> DONE - 2026-10-11 - provenance.jsonl
   - [S1] - Append the record with range 388-397, then re-run lang and provenance for adult 40 <PEDAGOGY-MAP [GENERATION] 5> <green, but re-amended once more because [B6] changed FORMAT.md (format 0541db11 -> cc8bd663): doc edits had to precede the final record> DONE
   - [S2] - Added after [B3] [S2] changed the batch's result: amend the two kids records the same way, the formula being track-agnostic <provenance.jsonl, KIDS-ROADMAP.md> <both span-green; both stay red on PRE-EXISTING FORMAT.md / FUNCTION.md contract drift, which this prompt did not cause> DONE
### [B5] - Rewrite the pre-split rule in TOOL DISCIPLINE "lets update .clinerules rule 5" <.clinerules/.clinerules.md 3-14> DONE - 2026-10-11 - .clinerules/.clinerules.md
   - [S1] - Check no other file refers to these bullets by number, since the list is unnumbered <*.md, .clinerules> <none; "rule 5" matched only this file's own PENDING line, so the rule was placed by content> DONE
   - [S2] - Write the pre-split bullet beside the command-output bullet <".clinerules/.clinerules.md" 6> <third bullet, line 6; the insert first left a blank line that split the list, corrected> DONE
### [B6] - Name the half and third widths in FORMAT.md and drop .grid3 "correct it and name the 1/3 and 1/2 width options with a concise note" <FORMAT.md 38> DONE - 2026-10-11 - FORMAT.md
   - [S1] - Replace .grid3 with .itemsize-third and .itemsize-half plus the compare/contrast note <FORMAT.md 38> <no class advertised that style.css does not implement> DONE
### [B7] - Commit and push, then confirm the live page "im not seeing lesson 40 on the live site" <PENDING [GUIDELINES] 1-2> DONE - 2026-10-11 - 30c045a pushed to origin/main
   - [S1] - Stage, commit, push, and check what the deploy serves for lesson 40 <PENDING [GUIDELINES] 5> <live lessons.json adult = 1..22,40 and tracks.json adult count 23, so the selector now offers it> DONE 




