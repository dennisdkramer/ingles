# PENDING — Adherence.md [BATCHING] for current task


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

# [CURRENT] Prompt - (Active batches, newest first)


## [23] - FORMAT.md made publishable, audited whole, and PENDING.md pruned to what is still open (2026-11-10)
### [B1] - the raw-block fix <"format.md contains only changes from prior tasks, not mine. You can make the change"> <the five tokens at FORMAT.md:6 readable again on the published page> DONE - FORMAT.md:6
   - [S1] - the five closed tokens wrapped so Liquid copies them through instead of evaluating them <VERIFICATION.md, qa/liquid.mjs> DONE - one raw block around all five names: the live page now prints them instead of five blanks, and `qa/liquid.mjs` jumps the whole span, so 5 warns -> 0
### [B2] - the full-file audit <"sanity check the whole file for any ambiguity, conflict, or anything that might degrade the quality of lessons"> <findings, each anchored to a line, with what it costs a lesson> DONE - 67 lines read whole; 8 findings, reported in the turn's message, none repaired
   - [S1] - the whole of FORMAT.md read, not sampled <every section> DONE - lines 1-67 in three reads, nothing sampled
   - [S2] - ambiguity, self-contradiction and rules that cannot be checked, reported <not repaired: the fixes are policy> DONE - F1 m) vs the data and qa/examples.mjs; F2 the `load` numbers no entry carries; F3 "the only MUSTs" against five absolutes; F4 three ways to mark Portuguese, one read by the harness; F5 numbering; F6 the unmeasured 50%; F7 nothing forbids an item that gives away its answer; F8 nothing ties item text to the lesson level
   - [S3] - the lesson-40 failure modes tested against the file <uniqueness and difficulty: does FORMAT.md say anything that would have caught them> DONE - no: the only length rule is the h1 (9) and the only difficulty mechanism is the missing `load` (F2), so a lesson's difficulty falls to whatever its input material implies
### [B3] - PENDING.md pruned <"look at pending.md and delete any items that are done or known stale"> <a tracker holding only open work> DONE - 340 -> 143 lines, 11 sections deleted
   - [S1] - every [n] section read and classified <done, stale, open> DONE - done: [22] [21] [20] [19] [16] [15] [14] [13] [11] [2]; stale: [18]; open: [17] [12] [8] [7] [4] [3]
   - [S2] - done and stale sections deleted, open ones and the standing sections left intact <[GUIDELINES], [HANDLING], [CURRENT] stay> DONE - deleted, not migrated, on the owner's word; the one AWAITING USER conflict that lived only inside a deleted section is carried into [24], because pruning a stale host must not delete an open question
### [B4] - the summary <"give me a super brief summary of the rest of the items"> <what is open, one line each> DONE - 6 open sections + 2 uncommitted files, in the turn's message

## [24] - carried forward out of the sections [23 B3] pruned (2026-11-10)
- lesson 40 has no `provenance.jsonl` record and cannot get one while BUSINESS-ROADMAP.md is excluded: `qa/provenance.mjs` reads that lesson's `range`, its concept pids and its vocabulary coverage out of that file <survived [18] [S7], whose host section was STALE and is now deleted; the record's form is the owner's call> AWAITING USER



## [26] - the approved fixes executed: the marker set, the leak warning, and four FORMAT.md decisions (2026-11-10)
### [B1] - F4's plan, implemented and NOT verified <"the plan is good but do not run verification on this"> <`qa/lang.mjs` reads the class markers as well as `lang`, and no harness was run> DONE - qa/lang.mjs
   - [S1] - `isMarked(el)` added — `lang="pt"` or `.pt` or `.ptw` — and used at both counting sites, the explanation set and the table headers <the band stops depending on which marker an author reached for> DONE - `node --check` exit 0; no run, per instruction
   - [S2] - the limit recorded instead of silently changed: a classed span inside an English sentence is still judged by `isPT` alone, because the element measured is the sentence, not the span <this widens the marker set; it does not reclassify mixed prose> DONE
### [B2] - F7's two approved items <"I approve your 1 and 2"> <the rule restated where a build reads it, and the literal case warned> DONE - FORMAT.md 19, qa/content.mjs
   - [S1] - FORMAT.md: one cross-reference bullet naming `PEDAGOGY-MAP.md [AUTHORING] e)` and `[LEVEL] w)`, in the slot the deleted 19 vacated <no rule duplicated, no wording drift> DONE
   - [S2] - qa/content.mjs warns when a stem contains its own keyed option: `data-a` -> the radio whose value matches -> that label's text, with a 4-character floor and a word boundary <only the literal case is checkable, so it is a warning; the implying case stays the author's> DONE - `node --check` exit 0, not run
### [B3] - the three approved wordings <"17. approved" "31. approved" "19. approved"> DONE - FORMAT.md 17, 19, 31, 44
   - [S1] - 17: "defensibly helpful to the student" replaced by the two checkable tests, exactly as proposed <the old text is in [25] [B3]> DONE
   - [S2] - 31: the mark named — but as `index.html` only, because `style.css` carries no `.todo` rule and the approved text said it did <DEVIATION, reported to the owner in the turn's message> DONE
   - [S3] - 19 deleted and its one unique fact (centring) merged into 44, so gloss placement is stated once <44 keeps its mechanism sentence word for word> DONE
### [B4] - recorded and pushed
   - [S1] - the owner's plan noted, no action taken: the syllable-count and emphasis vehicles are to be taken, because a stem of that kind can imply its own answer <a future batch, not this turn's> DONE
   - [S2] - commit + push, then the Pages run read for that commit <[GUIDELINES]> DONE - eaba5a9, Pages build concluded success


### [B1] - F4's recommendation, delivered and NOT applied <"f4 what do you recommend we do about that"> <one marking route, and the harness made to read that one> DONE - no edit; FORMAT.md line 2 requires sign-off
   - [S1] - the choice named: `lang="pt"` becomes the only semantic marker, `.pt`/`.ptw` stay as layout classes, `<i>` is dropped as a marker, and `qa/lang.mjs` reads exactly one thing <the measured Portuguese share can no longer move for a markup reason> DONE - reported
### [B2] - F5 retracted, and the real conflict named <"arent those the same thing?"> <14 and 55 do agree; 14 disagrees with the DOM> DONE - yes: `.qopts` is flex-wrap (across, then down) and `.qgrid.stack` is `grid-auto-flow:column` (down, then across), and 14 states only the second
### [B3] - F7 and F8 answered by rules that already exist <"check pedagogy-map.md, i thought there was a clause for that"> <no new rule needed: both are violations of existing ones> DONE - [AUTHORING] e) "Never show the answer in a prompt"; [LEVEL] w) "a phrase answer gets phrase distractors, never one-word ones". FORMAT.md restates neither and no harness reads either, which is why lesson 40 could break both
### [B4] - the typos repaired <"you can freely repair typos"> DONE - FORMAT.md 4 (filel) and 10 (portugues)
### [B5] - ADHERENCE.md committed <"commit adherence.md"> DONE - [8] [B3] closed by it
### [B6] - the widths and the loads, opened as the next task <"lets do the widths and loads for content_examples next"> <CONTENT_EXAMPLES.md: a `- **width** —` ladder per vehicle and a `- **load** —` curve per activity> NOT EXECUTED - [17] [B5] carries the plan both must agree with


## [17] - design A for block widths (narrow-first + structural measurement): the plan only (2026-11-10)

### [B1] - the decision recorded <"2. i said go with A" corrects "lets go with a", which had been read as the field question (a)> <design A is the chosen approach; whether the `**width**` field returns is [B2]'s question, not a settled removal> NOT EXECUTED - plan and question only, no edits
   - [S1] - A restated: a block starts at its narrowest allowed slot and grows one step only when a structural element does not fit; prose is excluded because it wraps <the three designs came from last turn's [B1]> NOT EXECUTED
### [B2] - the one new piece of data A needs: the width field <"im thinking we put a "width: #" field that appends to the markup line of each vehicles entry in CONTENT_EXAMPLES.md and corresponds to the AVAILABLE WIDTH OPTIONS for that vehicle">
   - [S1] - a `**width**` field on the `markup` line, per the owner <it belongs to the block, not to the vehicle> NOT EXECUTED
   - [S2] - the multi-block case: one vehicle may own 1..n blocks, so the value has to express a slot per block AND which blocks share a row <the owner's question "a lot of the vehicles are more than one block, how do you think we should deal with that?"> DONE - 40 vehicles, 65 blocks, 9 distinct shapes: `full` 18 · `half+half` 5 · `full | full` 5 · `half+half | full` 4 · `twothird+third` 3 · `third` 2 · `half` 1 · `third+twothird` 1 · `third+third+third | full` 1 (26 of 40 vehicles have no row at all, so the common value is one token)
   - [S4] - THE OWNER'S GRAMMAR: `+` joins the vehicle's blocks in order; a single slot or `<slot>->` per block; no per-row token <"twowordverb Im going to mark the vehicle as half+half. registercontrast full+full. pronlab half+half+full. infogap third+twothird. Formfill Im gonna mark half->">
   - [S4a] - WHY ONE OPERATOR SUFFICES: a row's slots must sum to the row (FORMAT [GENERATION] e), so the row breaks fall OUT of the arithmetic - a row is closed the moment its slots reach 100% <checked against the owner's five examples and against the page: `half+half` = one row (twoWordVerb) · `full+full` = two rows (registerContrast) · `half+half+full` = [half half][full] (pronLab) · `third+twothird` = one row (infoGap) · `third+third+third+full` = [third third third][full] (songStructure). All five parse correctly with no separator, which is the evidence the rule is right.> CONFIRMED BY OWNER
   - [S4b] - `<slot>->` = the default the page uses, and the block may grow in steps as far as full (100%) <"yeah the arrow means up to 100% in steps"> CONFIRMED BY OWNER
   - [S4c] - THE GRAMMAR IS WRITTEN DOWN in FORMAT.md [GENERATION] m), so the owner authors values against a spec and not against a chat message <text only; no entry carries a field yet> DONE
   - [S5] - the prose widths come OUT of the `markup` line once the field exists <"if its already in the markup, once i define it according to this plan, you take that part out"> CONFIRMED BY OWNER - not yet executed
   - [S6] - the pairing is BINDING and a lesson may NOT break a single block out; a lone block uses a single-block vehicle or a primitive <"i think its better if the lessons CANT break single blocks out. we will make sure to include single block vehicle primatives."> RESOLVED BY OWNER
   - [S6b] - primitives do not exist yet: the only single-block vehicles are the 21 that own one block by design, so a lesson needing a lone chart or a lone item list has no vehicle to call <needs a decision when the first lesson wants one> AWAITING USER
   - [S7] - awaiting the owner: the `**width**` value for each of the 40 block-bearing vehicles <the owner is authoring them; nothing is generated until they land> AWAITING USER
   - [S6a] - correction of record: 21 of the 40 vehicles own ONE block (not 22 multi-block) - `full` 18, `third` 2, `half` 1 - and 19 own more than one, so the field is authored per vehicle, never derived from block count <"They are conceptually different, which also allows them to default to completely different sizes"> 
   - [S3] - option ii (parse `fits`) and option iii (a ladder per category) retired <the owner has chosen the field> NOT EXECUTED
   - UPDATED the earlier "allowed slot range, source undecided (i/ii/iii)" → a field appended to the markup line, because the owner chose it and because a vehicle-level range cannot say what its second and third blocks are
### [B3] - the measurement A's growth rule uses <"the rest of the content is tiny" is the case a line-based measure gets wrong> <NOT EXECUTED>
   - [S1] - structural content defined per vehicle kind (table cells, longest option, longest label, input count) and prose explicitly excluded <FORMAT.md [GENERATION] e already states the exclusion; A is what enforces it> NOT EXECUTED
   - [S2] - the measuring tool: headless Chrome over CDP, proven on this page on 2026-11-10, not a Node character-width table <the build calls it; the same call becomes the harness> NOT EXECUTED
### [B4] - apply, then enforce <NARROWED by [B2 S4]-[S6]: the ladder fixes every slot, so A is no longer a chooser - it may only grow a block the entry marks `->`, and only as far as 100%>
   - [S1] - preview-blocks.html rebuilt from the ladder in each entry, with a per-vehicle report of every block whose width moved <the 21 single-block vehicles and the 19 paired ones, each checked against its own value> NOT EXECUTED
   - [S2] - a harness that fails when the page disagrees with the ladder (a missing row, a block outside its stated slot, a row that does not sum to 100%), and that reports any `->` block whose content overflows its default <it no longer judges a width, it compares one against the authored value> NOT EXECUTED
   - [S3] - published lesson pages, as a separate pass after the preview page is approved <8 lesson files, untouched so far> NOT EXECUTED


### [B5] - the plan the files must agree with, and the values <"we recently changed our plans from default full-width blocks that get smaller depending on content to default small blocks that get bigger depending on content"> <every file states small-by-default and growth-by-content> NOT EXECUTED
   - [S1] - every place that states a default, read and reconciled: FORMAT.md a)/b)/c)/e)/m), PEDAGOGY-MAP.md, the 53 CONTENT_EXAMPLES entries, qa/preview-blocks.html, qa/examples.mjs <one plan, no leftover of the full-width default> NOT EXECUTED
   - [S2] - a `- **width** —` ladder authored on every block-bearing vehicle, and the width prose taken OUT of `markup`/`fits` once the field holds it <[S5]: the owner's own instruction for that removal> NOT EXECUTED
   - [S3] - a `- **load** —` curve authored on every activity, in the shape [INSTRUCTIONS] states, so `load = L × M` can be read off the entry <[7] [B2], the same numbers from the other side> NOT EXECUTED

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


## [8] - the word-for-word rule, in the owner's wording (2026-11-10)
### [B1] - insert the rule after "Do not assume." <"__FOR ANY EDIT THAT REPLACES TEXT__ of a file in the repo root, if a message proposed it, the proposed new text must be shown accompanied by every word of the old text that is to be altered. (APENDING.md/PAST_BATCHES.md exempt)"> <ADHERENCE.md [UNDERSTANDING] carries it> DONE - their words kept word for word, with APENDING.md -> PENDING.md as the only correction; NO scope clause added (lesson pages are not in the repo root, so the phrase already excludes them) and NO "whole passage, not only the words that differ" clause added, since rule 16 forbids adding to proposed wording. Standing instruction noted: finished text in qa/NOTES.md is DELETED, never replaced, so that file is outside this rule by construction
### [B2] - the showing has a PLACE <"it doesnt specify that it must be shown IN the message that proposed it, and specifically accompanying the proposal"> <the proposing message is the grammatical subject, so where it is shown is fixed> DONE - three words for three: "the proposed new text must be shown" -> "that message shows the proposed new text". Same length, no words added. The stronger variant (delete "if a message proposed it, " so a proposing message is mandatory and a silent edit is impossible) was OFFERED and NOT applied, because it is a scope change. Recorded for the owner's answer
### [B3] - commit and push <PENDING.md [GUIDELINES]> <origin/main at local HEAD> DONE - 2026-11-10, at the owner's instruction ("commit adherence.md")


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

