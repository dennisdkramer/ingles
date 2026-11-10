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

## [18] - Trim TOOL DISCIPLINE prose without changing any rule's behaviour
### [B1] - Close [17] and author this prompt's batches "look at the rest of .clinerules and see if there is any other prose you can trim" PENDING.md [HANDLING] 13,17-20 DONE - 2026-10-11 - PAST_BATCHES.md, PENDING.md
   - [S1] - Migrate the finished [17] into PAST_BATCHES.md and clear it <PENDING [HANDLING] 13> <[CURRENT] holds only [18]> DONE
### [B2] - Fix the reference set a trim is checked against "while maintaining the rule's function exactly the same" <.clinerules/.clinerules.md 1-24, ADHERENCE.md> DONE - 2026-10-11 - none
   - [S1] - Enumerate every operative instruction, threshold and prohibition in the rules file <".clinerules/.clinerules.md" 1-24> <13 rule groups, walked one by one in [B4]> DONE
   - [S2] - Find any file that quotes these bullets by wording <ADHERENCE.md, *.md> <none: ADHERENCE.md zero hits; the two CONTENT_EXAMPLES.md hits are the words "truncation"/"restate" in content guidance, not references> DONE
### [B3] - Cut prose, keep behaviour <.clinerules/.clinerules.md 3-24> DONE - 2026-10-11 - .clinerules/.clinerules.md
   - [S1] - Trim the TOOL DISCIPLINE bullets to their instruction <".clinerules/.clinerules.md" 3-15> <bullets 4,5,7,8,10,11,12,14 trimmed, plus the dangling " - " in the heading; 6,9,13 already one-clause and left untouched> DONE
   - [S2] - Trim the TOOL / TERMINAL PARAMETERS bullets the same way <".clinerules/.clinerules.md" 16-24> <only bullet 21 carried slack; the other six are a single instruction each> DONE
### [B4] - Prove no rule changed meaning <.clinerules/.clinerules.md 1-24> DONE - 2026-10-11 - none
   - [S1] - Walk the [B2] list against the trimmed file <".clinerules/.clinerules.md" 1-24> <13/13 groups present with every trigger, threshold and remedy; only the qa/overflow.mjs anecdote was cut, its instruction kept> DONE
### [B5] - Commit and push <PENDING [GUIDELINES] 1-2> DONE - 2026-10-11 - .clinerules/.clinerules.md, PENDING.md
   - [S1] - Stage, commit, push <PENDING [GUIDELINES] 1-2> <pushed; 5150 -> 4772 bytes, a 7.3% cut> 




