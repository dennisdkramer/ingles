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


## [25] - Tier the register vocabulary by frequency, and stop the harness checking pages
### [B1] - Take [24] out of [CURRENT] "STOP checking against existing pages" PENDING.md [HANDLING] 13 DONE - 2026-10-11 - PENDING.md, PAST_BATCHES.md
   - [S1] - Delete [24]; summary appended to PAST_BATCHES.md <PENDING.md> <[CURRENT] holds only [25]> DONE
### [B2] - Tier the tells and give the generator the order "I dont want the generator to treat those words as if theyre all equal" <ADULT-REGISTER.md> DONE - 2026-10-11 - ADULT-REGISTER.md
   - [S1] - core/common/situational/rare, each stating what it licenses <ADULT-REGISTER.md 27-33> DONE
   - [S2] - Ten tiered keys holding the vocabulary <ADULT-REGISTER.md 35-45> DONE
   - [S3] - British profanity moved out of taboo into locale: bollocks tosser wanker arsehole twat shag <ADULT-REGISTER.md 45> DONE
   - [S4] - loud pack dropped for loud; wet dream demoted to rare; fricking freaking shoot stay out <ADULT-REGISTER.md> DONE
### [B3] - Delete the harness own word list and parse the tiers "register.mjs is register neutral right?" <qa/register.mjs> DONE - 2026-10-11 - qa/register.mjs
   - [S1] - Family-tier keys, byFam accumulation, DEFAULTS gone <qa/register.mjs 51-78> DONE
   - [S2] - --tells prints the parsed vocabulary and reads no page <qa/register.mjs 87-103> DONE
   - [S3] - Verified by --tells alone: taboo 36 in 2 tiers, street 174 in 4, sexual 92 in 3, formal 15, locale 36 <qa/register.mjs --tells> DONE
### [B4] - Point the author at the tiers "The words either need to be ordered or labeled as such with instructions to the generator" <PEDAGOGY-MAP.md 57> DONE - 2026-10-11 - PEDAGOGY-MAP.md
   - [S1] - One clause in Precedence: taught items from core then common, situational only when the scene is that scene, rare never to hit a target <PEDAGOGY-MAP.md 57> DONE