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

## [6] - trainOrder: six adjectives, and the crew coupled to the cars at the start (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"try changing the html to 6 adjectives"> <every HTML file that carries a trainOrder block, and the train/crew geometry>
   - [S1] - find the data-game="trainOrder" blocks <kids/*.html, adult/*.html, business/*.html, qa/preview-games4.html> <which file the eight adjectives live in>
   - [S2] - read the yard, train and crew rules <style.css .g4-yard/.g4-ttrain/.g4-tcrew> <why the men do not line up with the cars>
   - [S3] - clear [B1] and batch the two edits <ADHERENCE [BATCHING] 1)> <one block edit, one geometry edit>
### [B2] - six adjectives in the block <"try changing the html to 6 adjectives"> <six items in the test block> DONE - qa/preview-games4.html: lovely, little, old, square, red, French (opinion → origin), the two-train split gone, one train of six
### [B3] - crew coupled at the start, decoupled on departure <"coupled and aligned with the train cars at the beginning, just not at the end when the train moves"> <men under their own cars until the train pulls out> DONE - one `--shift:80px` on `.g4-yard` used by BOTH `.g4-ttrain` and `.g4-tcrew` (the train's left was a hardcoded 80px the crew did not share, so the men sat 80px left of their wagons); `.g4-tcar` keeps its 4px gutter but puts 2px back on the left, so each wagon is centred on the same pitch its loader stands on; `g4trun` now clears `-130% - var(--shift)` so the train still wholly leaves the stage; the crew is a sibling row in the yard, never a child of the train box
### [B4] - verify the coupling and the departure <PENDING.md [GUIDELINES]> <screenshots: aligned at the start, men still standing after the train has gone> DONE - measured in headless Chrome, not eyeballed: cars 6 / guys 6, per-car delta `[-0.01 ×6]`, worst 0.01px, trainRight 148 ≤ stageLeft 246 (fullyOff), guysBefore === guysAfter (decoupled); start screenshot shows six men standing under six wagons. The `body{min-width:1415px}` sideways scroll seen at 1000px is the site's own documented layout (style.css 13/35), not this game
### [B5] - commit and push <git> <origin/main at local HEAD> DONE

## [5] - trainOrder: Play again does not start the next round (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"the play again button doesnt work to start the next round"> <why a second run never begins>
   - [S1] - read the button's handler and start()/finish() <engine4.js Runner> <what a restart resets and what it keeps>
   - [S2] - read yardGame's show/reset/finale gates <engine4.js yardGame> <which flag blocks the second run>
   - [S3] - clear [B1] and batch the fix <ADHERENCE [BATCHING] 1)> <one fix, one verification>
### [B2] - the second run actually starts <"doesnt work to start the next round"> <the yard rebuilds and the run begins> DONE - view.reset is now `rearm()` (ti=0, lives=2, done=false, built) and `reset()` is left as the per-train layout that `next()` uses; the frame is written in show() because step() wipes the prompt line first
### [B3] - verify a restart end to end <PENDING.md [GUIDELINES]> <a screenshot of the second run playing> DONE - headless Chrome: R1 8/8 → Play again → R2 laid 8 cards, 8 men, frame "That's a  car." → R2 played to 8/8, ERR=none
### [B4] - commit and push <git> <origin/main at local HEAD> DONE

## [4] - trainOrder teardown: no train graphics, a normal train, the noun frame (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"remove all the train graphics ... just a normal looking train with 8 flatbed cars behind it"> <what "train graphics" covers, and how a block declares its own words>
   - [S1] - read yardGame's train construction and ART.loco <engine4.js> <every element the train draws is enumerated>
   - [S2] - read the .g4-t* train rules <style.css> <which rules belong to the train and which to the yard/bridge>
   - [S3] - read the preview-games4 trainOrder block and the engine's prompt card <qa/preview-games4.html, engine4.js Runner> <the prompt element and how a block carries data>
   - [S4] - clear [B1] and batch the writes <ADHERENCE [BATCHING] 1)> <batches below>
### [B2] - strip the train graphics and build a normal train <"remove all the train graphics ... just a normal looking train ... behind it"> <no drawn locomotive, plain flatbeds> DONE - ART.loco deleted, the ornamented car body deleted, the old flex train CSS + crew/depot/ram/boom/fail CSS deleted, plain cab-and-boiler engine and equal-height flatbeds, poster rebuilt to match
### [B3] - the cars come from the adjectives <"The train will spawn with that many cars"> <N adjectives, N cars, 8 max> DONE - build() reads this train's items, one car per distinct slot in slot order, capped at 8; place()/depart() now speak in slots
### [B4] - the prompt card is the noun's frame <"make the top prompt card ... say \"That's a _______ [noun]\""> <the card reads the frame once> DONE - `data-noun`, the game owns the prompt (ownsPrompt), the frame is written once per run
### [B5] - a real test block <"generate a noun and 8 random adjectives in the html for our test run"> <noun + 8 adjectives in the page> DONE - data-noun="car", eight adjectives covering all eight slots, single train
### [B6] - the description says adjectives only <"only for adjectives ... make sure that is in its description"> <CONTENT_EXAMPLES states it> DONE - ADJECTIVES ONLY bullet, the noun frame bullet, 1-8 adjectives, cars follow the adjectives, plain-train art
### [B7] - publish
   - [S1] - commit and push <git> <origin/main at local HEAD>
   - [S2] - four re-implementation questions recorded in qa/NOTES.md §trainOrder <"if you have questions ... put the question in the notes and move to the next one"> <Q1 verdict, Q2 gesture, Q3 labels, Q4 wreck> AWAITING USER

## [3] - all game notes in qa/NOTES.md (2026-11-10)
### [B1] - notes inventoried against the code <"keep working on the games until all of the instructions in my notes are implemented"> <every section read, every clause mapped to a game> DONE
### [B2] - the small notes: skeetRange, whackMole, catchBasket DONE - engine4.js, style.css, qa/NOTES.md
   - [S1] - skeetRange: rack REVERTED to the old positioning (left edge, lanes 12–64%), cap six discs, miss sound halved (buzzer 0.125), gunshot −30% (0.42), answer plaques unclipped <qa/NOTES.md 31> DONE
   - [S2] - whackMole: a molehill in front of each mole, word above his head so the hill cannot cover it, bare cells <qa/NOTES.md 90> DONE
   - [S3] - catchBasket: 2–4 pots; a later bloom is drawn bigger so "the biggest" exists; a girl in a dress walks in and plucks it (a tie is random) <qa/NOTES.md 84> DONE
### [B3] - the medium notes: crosswordBoard, ladderRun, stackDrop DONE
   - [S1] - crosswordBoard: a wrong full word does nothing at all; a right word is a point; five points closes the board <qa/NOTES.md 74> DONE
   - [S2] - ladderRun: graffiti art/overlay/CSS deleted; a perfect run climbs onto the prompt card and throws banknotes onto the answer cards; a missed point brings the dog and topples the ladder; startText set <qa/NOTES.md 67> DONE
   - [S3] - stackDrop: Mario flagpole with waving pennant, the jump measured to the pole, coin from the knob, faceplant already fired on a short tower <qa/NOTES.md 37> PART — "the platform from the old version" is a question in the notes (two slabs read as one, and the ledge is the block flight's target)
### [B4] - echoPads and flapGate DONE
   - [S1] - echoPads: strip hidden until the run starts; level = `data-level` else the page's L, 20+ means no hint at all; startText set <qa/NOTES.md 52> DONE
   - [S2] - flapGate: a wall is an object in flight (cut, fly, retire) so the next is already behind the one he flew through and the flight never stops <qa/NOTES.md 61> DONE
### [B5] - trainOrder PART - the four open clauses are questions in qa/NOTES.md 90–94
   - [S1] - sky, two hazed ridges of hills and a real ground plane; no car labels (plaque, `data-labels` lever, `data-label-max`, SLOT_LABEL and the CSS deleted) <qa/NOTES.md 89> DONE
   - [S2] - the caboose bigger than the cars OPEN
   - [S3] - wheels flush on the track; platforms growing from a flat bed per car OPEN
   - [S4] - car count from the adjectives, dock centred, workers as the drop targets with a throw sequence OPEN
   - [S5] - a card's height still comes from its own slot (`OPEN0 - 6 * home`), so a disordered train bursts through the deck <already the rule> KEPT
### [B6] - publish
   - [S1] - every note tagged `[done]` or answered with a written question <qa/NOTES.md> <nothing silently dropped> DONE
   - [S2] - no QA harness run <"stop doing QA that isnt asked for"> <`node --check engine4.js` only, which is a syntax check on the edited file, not a test> DONE
   - [S3] - CONTENT_EXAMPLES.md entries rewritten where a game changed (bingoCard 7s, crosswordBoard, flapGate stream, echoPads levels, ladderRun, trainOrder labels) DONE
   - [S4] - commit and push

## [2] - CONTENT_EXAMPLES.md: purpose, limits and min/max for every game - MIGRATED 2026-11-10
### [B1] - PRE-PROMPT RESEARCH <"delete trainsteps ... updating the rest of the games according to my comments in notes.md"> <notes.md = qa/NOTES.md (only notes file tracked); 11 game sections on preview-games4.html; trainSteps inventory> DONE - 2026-11-10 - none
   - [S1] - notes file resolved and every game comment enumerated <ADHERENCE [ANALYSE] a)> <skeetRange, stackDrop, bingoCard, echoPads, flapGate, ladderRun, crosswordBoard, mineGrid, catchBasket, whackMole, trainOrder> DONE
   - [S2] - trainSteps-only vs shared inventoried <engine4.js yardGame 3508-3745> <only the !order branches, the two PLUGINS lines, preview-games4.html item-trainSteps, kids/lesson23 block> DONE
   - [S3] - clear [B1]; user answered the lesson23 question: delete the block, lesson keeps no game; CONTENT_EXAMPLES.md must state purpose/limits/min-max per game <ADHERENCE [BATCHING] 1)> <batches below> DONE
### [B2] - delete trainSteps and the code only it needed <"delete trainsteps and anything that ONLY IT needed"> <trainOrder is the only yard mode> DONE - 2026-11-10 - engine4.js, kids/lesson23.html, kids/lesson23.edit.html, qa/preview-games4.html
   - [S1] - drop the `mode` argument and every `!order` branch in yardGame; delete PLUGINS.trainSteps, its ownSound and noShuffle; shuffle() stays (runner 716, whackMole 1223) <engine4.js 3508-3745> <yardGame single-mode, no trainSteps symbol in engine4.js> DONE
   - [S2] - remove the kids/lesson23 game block from both the page and its .edit twin <"Delete the game block from kids/lesson23"> <no data-game="trainSteps" in either file> DONE
   - [S3] - remove the trainSteps section from the games preview <qa/preview-games4.html item-trainSteps> <its note box is gone> DONE
   - [S4] - harnesses green after the removal <qa/content.mjs, qa/games4.mjs, qa/overflow.mjs> <games4 147/15 - the same pre-existing 15; kids/lesson23 loads; nothing overflows> DONE
### [B3] - CONTENT_EXAMPLES.md answer ranges <carried out as [2]> DONE - 2026-11-10 - CONTENT_EXAMPLES.md, FORMAT.md, ISSUES.md
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



