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



## [26] - Give the kids track the same tiered tells, item by item against a 14-year-old American in 2026
### [B1] - Take [25] out of [CURRENT] "ok so now that we have the track voice just about right" PENDING.md [HANDLING] 13 DONE - 2026-10-11 - PENDING.md, PAST_BATCHES.md
   - [S1] - Delete [25]; summary appended to PAST_BATCHES.md <PENDING.md> <[CURRENT] holds only [26]> DONE
### [B2] - Build the kids tells list "make the same kind of list for kids-register.md" <KIDS-REGISTER.md> DONE - 2026-10-11 - KIDS-REGISTER.md
   - [S1] - Five tiers, including text as a medium, each stating what it licenses <KIDS-REGISTER.md 26-33> DONE
   - [S2] - The lists, most-common-first inside every tier <KIDS-REGISTER.md 43-52> DONE
   - [S3] - Verified by --tells alone: taboo 30 in 3 tiers, street 128 in 5, formal 18, locale 33, no item twice <qa/register.mjs --tells> DONE