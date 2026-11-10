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

## [1] - delete trainSteps and update the remaining games per the notes comments
### [B1] - PRE-PROMPT RESEARCH <"delete trainsteps ... updating the rest of the games according to my comments in notes.md"> <notes.md = qa/NOTES.md (only notes file tracked); 11 game sections on preview-games4.html; trainSteps inventory> DONE - 2026-11-10 - none
   - [S1] - notes file resolved and every game comment enumerated <ADHERENCE [ANALYSE] a)> <skeetRange, stackDrop, bingoCard, echoPads, flapGate, ladderRun, crosswordBoard, mineGrid, catchBasket, whackMole, trainOrder> DONE
   - [S2] - trainSteps-only vs shared inventoried <engine4.js yardGame 3508-3745> <only the !order branches, the two PLUGINS lines, preview-games4.html item-trainSteps, kids/lesson23 block> DONE
   - [S3] - clear [B1]; user answered the lesson23 question: delete the block, lesson keeps no game; CONTENT_EXAMPLES.md must state purpose/limits/min-max per game <ADHERENCE [BATCHING] 1)> <batches below> DONE
### [B2] - delete trainSteps and the code only it needed <"delete trainsteps and anything that ONLY IT needed"> <trainOrder is the only yard mode> DONE - 2026-11-10 - engine4.js, kids/lesson23.html, kids/lesson23.edit.html, qa/preview-games4.html
   - [S1] - drop the `mode` argument and every `!order` branch in yardGame; delete PLUGINS.trainSteps, its ownSound and noShuffle; shuffle() stays (runner 716, whackMole 1223) <engine4.js 3508-3745> <yardGame single-mode, no trainSteps symbol in engine4.js> DONE
   - [S2] - remove the kids/lesson23 game block from both the page and its .edit twin <"Delete the game block from kids/lesson23"> <no data-game="trainSteps" in either file> DONE
   - [S3] - remove the trainSteps section from the games preview <qa/preview-games4.html item-trainSteps> <its note box is gone> DONE
   - [S4] - harnesses green after the removal <qa/content.mjs, qa/games4.mjs, qa/overflow.mjs> <games4 147/15 - the same pre-existing 15; kids/lesson23 loads; nothing overflows> DONE
### [B3] - CONTENT_EXAMPLES.md: every game states purpose, limits and min/max <user answer to the lesson23 question> <one line per game with a deduced min/max> - UPDATED runs after [B5] <the min/max of each game is read off its implementation, and [B5] changes four of those implementations, so the numbers are written once, after>
   - [S1] - read every game `###` heading in CONTENT_EXAMPLES.md and record what each already says <CONTENT_EXAMPLES.md game sections 31-240, the 13 games; each heading already carries best-for/can't/purpose/fun> <gap list: min/max only>
   - [S2] - write the missing limits and min/max, deduced from the implementation and the pedagogy doc <CONTENT_EXAMPLES.md> <every game has purpose, can't, min/max>
### [B4] - trainOrder per its notes <"the rest of the games according to my comments in notes.md"> <the new yard presentation>
   - [S1] - ground and distant mountains behind the rails <qa/NOTES.md 92> <no flat beige background>
   - [S2] - caboose larger than the cars; every wheel flush on the track <qa/NOTES.md 92> <geometry checks>
   - [S3] - platforms grow from a flat bed per car; no car labels; car count follows the adjectives <qa/NOTES.md 92> <labels gone, count derived>
   - [S4] - dock centred at the bottom; drag words onto workers standing at each platform, workers throw them aboard <qa/NOTES.md 92> <drag works, throw animation runs>
   - [S5] - card height set by its own slot, so a wrong order necessarily hits the bridge <qa/NOTES.md 92> <bridge fail on disordered train>
### [B5] - the simpler game notes <"the rest of the games"> <each note executed and verified>
   - [S1] - crosswordBoard: wrong answers cost nothing, no fail condition <qa/NOTES.md 71> <already true in the code - scoreBoard never decrements and no lives() is exposed; three assertions added to qa/games4.mjs proving score 0, phase play, radio blank> DONE
   - [S2] - whackMole: always 3x2, min 2 max 6, holes just wider than the moles <qa/NOTES.md 87> <n fixed at 6; mole inset 6px->3px a side so the burrow hugs it> DONE - 2026-11-10 - engine4.js, style.css
   - [S3] - mineGrid: the art does not blink out at round start <qa/NOTES.md 76> <the away/settle fade pair removed from goIn/show and their CSS dropped; the street never leaves the stage> DONE - 2026-11-10 - engine4.js, style.css
   - [S4] - bingoCard: button text visible, items 15px narrower, two round labels <qa/NOTES.md 42-46> <button paper-on-ink so it cannot vanish, card width -45px (15px a column), labels read off r.answered> DONE - 2026-11-10 - engine4.js, style.css
   - [S5] - skeetRange: miss -50%, gunshot -30%, 2-6 targets spread on two axes, answer cards unclipped <qa/NOTES.md 31> <measurements check>
   - [S6] - catchBasket: min 2 max 4, and a girl picks the biggest flower at the end <qa/NOTES.md 81-82> <ending check>
### [B6] - the heavier game notes <"the rest of the games"> <each note executed and verified>
   - [S1] - stackDrop: 10px steeper step, no platform, flagpole and animated flag, run-and-jump onto the flag with a coin, face-plant on a miss <qa/NOTES.md 36-37> <both endings run>
   - [S2] - echoPads: no prompt card on the start screen, hidden two-level difficulty at lesson 20, level 2 with no hint and impossible decoys, new start text <qa/NOTES.md 51-54> <both levels check>
   - [S3] - ladderRun: graffiti gone; money thrown from the top on a clean run, dog knocks the ladder over otherwise; new start text <qa/NOTES.md 64-66> <both endings run>
   - [S4] - flapGate: walls continue and a second wall follows, one continuous flight through every gate <qa/NOTES.md 59> <continuous run check>
### [B7] - record and publish <PENDING.md [GUIDELINES] commit-by-default; qa/NOTES.md 12-15 [done] tag> <committed, pushed>
   - [S1] - tag each executed notes section `[done]` (the tag that lets a section be deleted) <qa/NOTES.md 12-15> <only finished ones tagged>
   - [S2] - run the harnesses and commit the turn's work <qa/content.mjs, qa/games4.mjs, qa/overflow.mjs> <green, committed>
   - [S3] - push <PENDING.md [GUIDELINES] one combined push> <origin/main at local HEAD>



