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




## [27] - Get engine4 running and fix the train game
### [B1] - Take [26] out of [CURRENT] "lets get engine 4 running, and fix the train game" PENDING.md [HANDLING] 13 DONE - 2026-10-11 - PENDING.md, PAST_BATCHES.md
   - [S1] - Delete [26]; summary appended <PENDING.md> <[CURRENT] holds only [27]> DONE
### [B2] - Make the overflow check mean something "lets get engine 4 running" <qa/overflow.mjs> DONE - 2026-10-11 - qa/overflow.mjs
   - [S1] - Name SVG elements instead of [object SVGAnimatedString]; skip what a clipping ancestor clips <qa/overflow.mjs 113-140> DONE
   - [S2] - adult/40 and kids/23 measured clean; selftest still fails the bad fixture <qa/overflow.mjs> DONE
### [B3] - Diagnose the train game "fix the train game" <engine4.js, kids/lesson23.html 105> DONE - 2026-10-11 - none
   - [S1] - trainOrder has scene, poster, CSS and sounds but no PLUGINS entry, so boot() skips it <engine4.js 13-15, 3483-3490> DONE
   - [S2] - Both harnesses called the dead block clean; content.mjs gains the g4-ready predicate <qa/content.mjs 107-113> DONE
### [B4] - Implement PLUGINS.trainOrder "fix the train game" <engine4.js, style.css> DONE - 2026-10-11 - engine4.js, style.css
   - [S1] - Yard, bridge, one car per step, block height = its own slot clearance, finale runs the train out or wrecks it <engine4.js 3505-3654> DONE
   - [S2] - noShuffle: the order IS the content <engine4.js 3655-3657> DONE
   - [S3] - Depot option buttons <style.css 1252-1257> DONE
### [B5] - Play it headlessly "fix the train game" <qa/_train2.tmp.mjs, deleted> DONE - 2026-10-11 - none
   - [S1] - 15 assertions: wiring, four cars, a correct run to ALL CLEAR, a wrong order to WRONG ORDER + wreck <qa/_train2.tmp.mjs> DONE
   - [S2] - Regression: adult 3 and 21, kids 23 load; overflow selftest green <qa/content.mjs, qa/overflow.mjs> DONE