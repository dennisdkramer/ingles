# PENDING — Adherence.md [BATCHING] for current task


## [14] - block letters and horizontal pairing on preview-blocks.html, and the notes that landed after [13] (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"blocks in the same vehicle pair together horizontally if they are smaller widths. Make sure all these blocks get a letter header"> <the corpus convention, then the page's own block inventory>
   - [S1] - the lettered-block rule read at source <FORMAT.md:13> <how a block header is written and where it sits> DONE - `A. ` + title in an `<h3>`, inside-top, restarting at A in every section
   - [S2] - a built lesson read for the pairing markup <adult/lesson1.html:50-60, style.css:204-214> <`.itemrow[data-cols]` with `itemsize-*` children> DONE - third+twothird and half+half both already have CSS
### [B2] - letter and pair every block <the ask> <54 sections: 40 vehicles + 14 drafts>
   - [S1] - 65 letter headers on 40 vehicles, restarting at A per vehicle <a block with its own `<h3>` keeps that title and gains only the letter> <no block carries two headers>
   - [S2] - six vehicles paired on one row: twoWordVerb, contextFit, wordFamily, signScan, measureLocal, barCount <the sub-full blocks of a vehicle sit side by side>
   - [S3] - chart blocks wrapped in a `chartblock` div so the header has somewhere to sit <a `.chart` cannot hold an `<h3>`> <15 charts lettered, table width class moved to the wrapper>
   - [S4] - drafts left alone <their `dim` lines already annotate each panel with its width> <no clash with A./B.>
### [B3] - the notes written after [13]
   - [S1] - contextFit: both blocks half width <note> <bank + situations on one row; entry's `fits` rewritten>
   - [S2] - lineRepair: the dropped/blended block deleted <note> <the pair is the whole display; `best for` / `does` / `markup` rewritten>
   - [S3] - ruleCard: the three lines +4pt <note> <22px on each; entry's `markup` states it>
   - [S4] - formulaFrame: the frame becomes the header <note> <`<h3>A. I'd rather ___ than ___ .</h3>`; the duplicate line removed; entry rewritten>
   - [S5] - soundGrid: X and TI tagged Portuguese, no parenthesis <note> <`<b><i lang="pt">X</i></b>`; `:lang(pt)` italicises it; no colour, because that would recolour every Portuguese gloss in the corpus>
   - [S6] - chatSample renamed to `dialog` <note> <6 hits in CONTENT_EXAMPLES.md, 2 in qa/NOTES.md, 6 in the page, all counted before and after>
   - [S7] - infoGap: the `them` facts block deleted, the ask panel takes the `them` header <note> <A. you + B. them; entry rewritten>
   - [S8] - the stale `chunkBank → delete` note dropped <it named a vehicle that was renamed to contextFit, which this same batch asks to change, not delete> <reported, not silently applied>
### [B4] - verify
   - [S1] - order, balance, links <54/54 sections, divs 591/591, 0 dangling jump-links, 0 order mismatches> <qa/examples.mjs 6/6>

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


## [13] - the tags added while [12] was running (2026-11-10)
### [B1] - deletes: stressBar, spellingSoundMap, scaleAxis, falseFriendSplit, audienceRow, sceneCast, dialogueMoves, vocabField, storyStrip, beatGrid, stanceScale, routineMap
   - [S1] - twelve entries removed from the menu and the page, navs rebuilt <[12] carried six, [13] eight more> DONE - menu 70 -> 56 entries, page 70 -> 57 sections (43 blocks + 14 drafts)
   - [S2] - cross-references re-pointed rather than deleted: melodyContour->emphaticBeat, registerContrast's own fits line, emphaticBeat->registerContrast, questionBuilding and repairMoves->chatSample, literalSplit and ruleTree->no name, levelGauge->scaleChoice/politeLadder <the guard in the drop script refused to run while any backticked name survived> DONE
### [B2] - the tags that were changes, not deletes
   - [S1] - soundGrid: rows are X and TI (italic, português) and TH, no phonetic symbols; entry and page <"we dont use those other symbols in this project"> DONE
   - [S2] - collocationMatrix: half width, have and get added as rows <"make it a half-width block and include have and get"> DONE
   - [S3] - chatSample: the owner's question answered in its NOTES section, and the entry now says in `does` that it shares the `.dialog` container and differs by content <"isnt this just a normal dialog? answer by updating the text here"> DONE
   - [S4] - twoWordVerb: two half-width blocks, the second a matching exercise fed by the first block's everyday column <"make the blocks half-width and the second block into a matching exercise"> DONE
### [B3] - melodyContour migrated out of the block list
   - [S1] - entry removed from CONTENT_EXAMPLES.md, written as a `####` draft in IN-BLOCK-VISUALS.md with the five fields <"migrate this to IN-BLOCK-VISUALS.md"> DONE - placed after levelGauge, before the Outside-art appendix
   - [S2] - its page section moved from the blocks region to the drafts region, dim line restated as an in-block element, `.listen` chip and one gap added so the preview shows what the draft says it does <a draft with no item of its own> DONE
### [B4] - verify and publish
   - [S1] - order 57/57 with 0 mismatches, 57/57 sections, 606/606 divs, no stale names, examples.mjs 6/6 DONE
### [B5] - refused on purpose
   - [S1] - a `### chunkBank` section asking for `delete` appeared after the rename to `contextFit` was done <a name that no longer exists, contradicting the rename from 20 minutes earlier> AWAITING USER: delete the vehicle now called contextFit, or delete only the stale section
   - [S2] - `wordFamily` ends mid-sentence ("this one is good but we can"), `pronLab` is a note-to-self, twoWordVerb adds "we may need to utilize checkboxes so you can confer with me" <nothing actionable yet>

## [12] - the remaining change tags in qa/NOTES.md, entry and preview (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"keep working on any other items that ive requested changes for"> <every tag that is not a delete, and where its vehicle stands>
   - [S1] - NOTES.md re-read at its 14:39 state <beforeAfterStrip's `d` had become `delete`> <the tag list> DONE - 3 change tags outstanding: formulaFrame, signalTable, contextFit
   - [S2] - the preview checked against the entries <ruleCard, lineRepair and mediaSnippet were rewritten in [9] but their page markup never was> <which pages disagree> DONE - 3 more items whose preview still showed the old shape
### [B2] - the entries and their previews brought back into agreement
   - [S1] - formulaFrame: `**markup**` one third width, `**fits**` third; page `itemsize-third`, "The frame holds" line gone <"remove 'the frame holds' line and make 1/3 width block"> DONE
   - [S2] - signalTable: `<colgroup>` at 16%, first column headed `The Cue`, `**fits**` half even with sentence examples <"make the first column thinner ... the header ... can be 'The Cue'"> DONE
   - [S3] - ruleCard preview: `Pattern:` / `Means:` / `Use when:`, centred, one third, explainer on the line below each <the entry change landed in [9]; the preview still showed the old card> DONE
   - [S4] - lineRepair preview: the two gap items removed for the label lines, dim line to `evidence none` <the entry was made teaching-only in [9], the preview kept the exercise> DONE
   - [S5] - mediaSnippet preview: a named concept, a second line showing it, the same two questions asked of both <the preview still showed one line and three questions> DONE
   - [S6] - `chunkBank` renamed `contextFit` on the page, in the nav, and in the NOTES section that keys on `data-item` <"call this vehicle 'contextFit'"> DONE
### [B3] - beforeAfterStrip deleted <its tag now reads `delete`>
   - [S1] - entry, page section and nav link removed; `humourFlag` re-pointed at `registerContrast`, two IN-BLOCK-VISUALS asides rewritten <no reference survives> DONE
### [B4] - verify and publish
   - [S1] - menu 70 -> 69 entries, page 70 -> 69 sections (56 blocks + 13 drafts), navs rebuilt <order index-by-index, balance, hrefs> DONE - 0 mismatches, 69/69 sections, 611/611 divs, 0 dangling links, examples.mjs 6/6
### [B5] - not done, reported
   - [S1] - `dictation`: its tag asks for a 15-20+ restriction, but no vehicle of that name exists in CONTENT_EXAMPLES.md, IN-BLOCK-VISUALS.md or any preview page <AWAITING USER: rebuild the entry, or drop the request>
   - [S2] - the seven preview-games4 tags (skeetRange, bingoCard, bossRaid, stackDrop, echoPads, flapGate) are engine4.js work, not entry text <untouched here>

## [11] - the delete tags added after [10]: annotatedExample, exceptionBench, errorGallery (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"im still seeing entries on the preview page that I marked for deletion"> <the tags as they stand on disk now>
   - [S1] - qa/NOTES.md re-read, not remembered <its LastWriteTime moved 14:19 -> 14:22 after [10]> <every section's text as it is now> DONE - the file now ends mid-word: `### beforeAfterStrip` holds a single `d`
   - [S2] - the delete tags differenced against both preview pages <qa/preview-blocks.html 73 items, qa/preview-games4.html 13> <the three still live, and where> DONE - annotatedExample, exceptionBench and errorGallery are the only delete tags still on a page (blocks page lines 64/104/117); the games page carries no delete tag
   - [S3] - cross-references to the three counted <CONTENT_EXAMPLES.md + IN-BLOCK-VISUALS.md> <none, so the deletion is clean> DONE - 0 references from any other entry or draft
### [B2] - remove the three from both files <"im still seeing entries on the preview page that I marked for deletion"> <menu and page agree again: 70 items>
   - [S1] - drop the three entries from CONTENT_EXAMPLES.md <[TEACHING] 24 -> 21> <no `### ` heading and no backticked name left>
   - [S2] - drop the three sections from qa/preview-blocks.html <60 blocks -> 57> <no id, no href, both navs rebuilt>
### [B3] - verify and publish
   - [S1] - qa/examples.mjs green <the draft -> item check> <6/6>
   - [S2] - page balanced and in menu order <sections, divs, ids, hrefs> <counts match>
   - [S3] - commit and push <PENDING.md [GUIDELINES]> <origin/main at local HEAD>
### [B4] - the open question, not acted on <"d" under `### beforeAfterStrip`> <asked, not assumed>

## [8] - the word-for-word rule, in the owner's wording (2026-11-10)
### [B1] - insert the rule after "Do not assume." <"__FOR ANY EDIT THAT REPLACES TEXT__ of a file in the repo root, if a message proposed it, the proposed new text must be shown accompanied by every word of the old text that is to be altered. (APENDING.md/PAST_BATCHES.md exempt)"> <ADHERENCE.md [UNDERSTANDING] carries it> DONE - their words kept word for word, with APENDING.md -> PENDING.md as the only correction; NO scope clause added (lesson pages are not in the repo root, so the phrase already excludes them) and NO "whole passage, not only the words that differ" clause added, since rule 16 forbids adding to proposed wording. Standing instruction noted: finished text in qa/NOTES.md is DELETED, never replaced, so that file is outside this rule by construction
### [B2] - the showing has a PLACE <"it doesnt specify that it must be shown IN the message that proposed it, and specifically accompanying the proposal"> <the proposing message is the grammatical subject, so where it is shown is fixed> DONE - three words for three: "the proposed new text must be shown" -> "that message shows the proposed new text". Same length, no words added. The stronger variant (delete "if a message proposed it, " so a proposing message is mandatory and a silent edit is impossible) was OFFERED and NOT applied, because it is a scope change. Recorded for the owner's answer
### [B3] - commit and push <PENDING.md [GUIDELINES]> <origin/main at local HEAD>

## [7] - the load formula: an activity multiplier against the content level (2026-11-10)
### [B1] - build the formula <"each 'activity' with answers or fields needs a multiplier ... multiplied by the content level that the generator chooses"> <load = L × M, M = qty × pace × risk> DONE - 2026-11-10 - PEDAGOGY-MAP.md [LEVEL] x-aa, CONTENT_EXAMPLES.md [INSTRUCTIONS], FORMAT.md 15
   - [S1] - state the formula and its guardrails beside the 1-50 content scale it acts on <PEDAGOGY-MAP.md [LEVEL]> <x-aa added after v, before [Register]> DONE - four rules: the product, M declared by the activity, load-not-kind plus both directions, and a LENGTH guard (not a cap) at ~70
   - [S2] - state the field every activity must carry <CONTENT_EXAMPLES.md [INSTRUCTIONS]> <the **load** line and its shape> DONE - one bullet with the shape `qty ×1.0 at <baseline> → ×<N> at <ceiling> · pace ×<N> when data-time · risk ×<N> at data-retry="0"`
   - [S3] - point the block option-count rule at it <FORMAT.md 15> <one clause, no second definition> DONE - the clause names the multiplier and points at x; no arithmetic restated
### [B2] - the per-activity numbers <"then i will go into the blocks and define them for you to extract out of notes.md"> <every entry's **load** line filled> AWAITING USER - the 91 entries carry none yet; the numbers come out of qa/NOTES.md when the owner defines them
### [B2b] - drop the invented word, and stop capping load <"whats the point of defining 'band' at all? I dont remember defining or using the term anywhere"; "clamping to 50 and splitting is probably not the right idea. Maybe split at 70"> <[LEVEL] uses only the project's own vocabulary: content level (v) and load, with no clamp on the product> DONE - 2026-11-10 - "band" removed from t/x/z/aa (it is `qa/lang.mjs`'s word for the Portuguese-share window, a different thing entirely); `load = L × M` uncapped, only L capped at 50; aa is now a LENGTH guard at ~70 rather than a difficulty cap; CONTENT_EXAMPLES.md [INSTRUCTIONS] points at the uncapped formula. Note for the owner: no +/-5 tolerance exists anywhere in the docs - the only slack in the project is `qa/lang.mjs`'s one-element slack
### [B3] - commit and push <PENDING.md [GUIDELINES]> <origin/main at local HEAD> DONE - f32a04e (docs), 2d9ed45 (the engine work that was still uncommitted from [4])

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



