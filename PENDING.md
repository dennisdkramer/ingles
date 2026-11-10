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

## [16] - Answer the six questions on lesson 40's QA reds and push the page
### [B1] - Close [15] and author this prompt's batches "commit and push what you have for lesson 40" PENDING.md [HANDLING] 13,17-20
   - [S1] - Append the two PAST_BATCHES.md lines for lesson 40 and migrate [15] into that ledger <PEDAGOGY-MAP [GENERATION] 5 (24-25), PENDING [HANDLING] 13> <the ledger holds lesson 40 and [15]>
   - [S2] - Clear [15] out of [CURRENT] <PENDING [HANDLING] 13> <[CURRENT] holds only [16]>
### [B2] - Answer (a),(c),(d),(e),(f) "isnt 'not even' a simple vocabulary item... range corrections... output chars... 1/3 itemwidth block... why input.gap fixed" six answers, no project file edited
   - [S1] - Q1: what makes an item "tested" in the coverage check <qa/provenance.mjs 102-115, 417-466> <the rule named and whose mistake it was>
   - [S2] - Q7: roadmapSpan's actual formula against PEDAGOGY-MAP 5's wording <qa/provenance.mjs 76-94> <the durable correction offered, sign-off gated>
   - [S3] - Q12: search the rules files for a 3000-character split <ADHERENCE.md, .clinerules> <present or absent, stated plainly>
   - [S4] - Q13: .grid3 against the third-width implementation <FORMAT.md 38, style.css itemsize> <which block it actually was>
   - [S5] - Q14: how input.gap gets its width <style.css 155, 249> <the knob, its default, and what I did with it>
### [B3] - Commit and push lesson 40 "commit and push what you have for lesson 40" <PENDING [GUIDELINES] 1>
   - [S1] - Stage lesson, sidecar and ledgers; commit; push <PENDING [GUIDELINES] 1-2> <pushed, hash reported>




