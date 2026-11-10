

## Cleared from PENDING [CURRENT] — 2026-11-10

- `[6]` trainOrder: six adjectives in the test block; the crew coupled to its wagons at the start and left behind when the train pulls out → `df46dfe`, `b739fe3` (six items, opinion → origin; one `--shift` shared by `.g4-ttrain` and `.g4-tcrew`; each wagon centred on the pitch its loader stands on; `g4trun` clearing `-130% - var(--shift)` so the train still wholly leaves the stage; the crew a sibling row in the yard, never a child of the moving box). `[B1]`'s research carries no mark of its own: it is the reads that produced `[B3]` and `[B4]`.
- `[5]` trainOrder: "Play again" did not start the next round → `0422aeb` (view.reset re-arms the yard; `reset()` left as the per-train layout `next()` uses; the noun frame written in `show()` because `step()` wipes the prompt line first).

## Cleared from PENDING [CURRENT] — 2026-11-09

- `[11]` several access changes errored and a signed-in return waited seconds → `08b2fe5` (one `accessSet` carrying the desired set; the page paints before any request)
- `[11]` a second section under the same number: index behind a centred spiral, truncating identity line, one switch per track → `a188244`
- `[12]` continue-from-lesson-N had lost its data; `status` serves `progress` and `done` with the access list → `1c630bb`
- `[10]` a track is a folder: per-track `track.json` plus generated `tracks.json` replace every hardcoded list → `b44ca62`

All four had every `[Bn]` and `[Sn]` closed; they sat in `[CURRENT]` only because the old steps 6-7 were never run. Numbering anomaly found: two separate `[11]` sections existed.

## Lesson 40 - adult - 2026-10-11

- `40`, social context: a flat Monday standup, a landlord story delivered as a voice note to a group, and a roast traded between friends who are still laughing - register (a) throughout. Most difficult concept for the student: telling a roast from an insult, because the words are the same and the decision is audience, target and whether the person is still laughing.
- Files not re-read: none of the four MANDATORY inputs (ADULT-ROADMAP.md 388-396, FORMAT.md, FUNCTION.md [CONTENT] 4-11, ADULT-REGISTER.md) nor _shell.html - all read fresh this build, so no stale copy and no diff. Withheld and unopened: PEDAGOGY.md ([GENERATION] 3), CONTENT_EXAMPLES.md below its ### headings, every other lesson page, both other tracks - no diff to report because none was read.

## [15] migrated - 2026-10-11

- `[15]` adult lesson 40: page plus byte-identical sidecar, two provenance records (the second amends the fingerprint after the game beat was re-cast), lang / provenance / content all green; `[B7] [S3]` the two overflow ESCAPE findings on the game stage art carried to the games turn on the user instruction.

## [16] migrated - 2026-10-11

- `[16]` adult lesson 40: answered the six questions on the QA reds and pushed 3a571c8; `[B2]` no project file edited - the "tested" rule (this lesson's own - Vocabulary: list), roadmapSpan's formula, the absent 3000-char rule, .grid3 having no CSS rule, and input.gap's per-blank --gap-w were each named from the harness and style.css.

## [22] migrated - 2026-10-11

- `[22]` the level rubric, register checking and voice precedence: the doc hunt found two adult register files - `ADULT_REGISTER.md` (underscore, 2102 bytes) orphaned, `ADULT-REGISTER.md` the one `qa/provenance.mjs:70` resolves - so the owner's "American" and "raunchy internet content" edits landed where nothing reads them. The reworded Portuguese rule invalidated three records (adult/40, kids/30, kids/31). Answers given: the rubric's fourth axis was unobservable during generation, "no checker can judge register" was too strong (the author can, and that comparison is a generation step), precedence had no home, and QA is post-hoc by definition so guidance cannot live there.

## [23] migrated - 2026-10-11

- `[23]` five live pages scored against the new four-demand rubric: business/12 = 17 (band 7-17), business/14 = 30 (9-19), business/38 = 41 (33-43), kids/23 = 10 (18-28), adult/21 = 23 (16-26) - three in band, business/14 eleven over, kids/23 eight under, so the misses are track-shaped rather than random. All five carry no `data-level`/`data-register`/`data-move` (lesson-40-only conventions), so a hard declaration check would fail ~100 existing pages. Register audit: `qa/register.mjs` is not register-neutral (three hardcoded regexes at 39-43, `TRACK_REGISTER` at 48 whose "business and kids have none on disk" is false now both files exist); `qa/lang.mjs`'s PT band contradicts the reworded e) - a lesson-40 page needing 30% Portuguese to carry a level-50 concept is correct by e) and red by the band; `qa/content.mjs:14-15` disclaims widths, so FORMAT e) had no owner. adult/40's records deleted (16 -> 12 lines). Pushed d3c2c20.

## [17] migrated - 2026-10-11

- `[17]` adult lesson 40 was live but unlinked: build-lessons.mjs regenerated lessons.json/tracks.json (adult 22->23) so the selector now offers it; roadmapSpan returns the span with no blank-line stripping (records amended - adult/40 388-397, kids/30 303-312, kids/31 313-322); FORMAT.md's unimplemented .grid3 replaced by .itemsize-half/.itemsize-third with a compare-contrast note; .clinerules gained the pre-split rule. Pushed 30c045a, 4356b59, 3b2d8eb. kids/30 and kids/31 stay red on pre-existing FORMAT.md/FUNCTION.md contract drift - found, reported, not touched.

## [18] migrated - 2026-10-11

- `[18]` .clinerules trimmed: eight TOOL DISCIPLINE bullets and one terminal bullet condensed to their instructions, the qa/overflow.mjs anecdote removed with its instruction kept, the heading's dangling dash dropped. All 13 rule groups, every threshold and every remedy survive the walk in `[B4]`; 5150 -> 4772 bytes (7.3%). Pushed 93f3fba.

## [19] migrated - 2026-10-11

- `[19]` adult lesson 40 reviewed block by block: 1A is A2 grammar carrying a B2 target and pre-explains its own joke; 1C keys nothing and saves by anchor text, not by input name; 3A's Portuguese card fails the only rule that governs it (CONTENT_EXAMPLES.md 831, lang=pt only where a word is genuinely new) and the page's term "booster" is invented; 3B is recognition-only; 4A is low-teens grammar in teen-meme register, not this track; 5B collapses three prompts to one unkeyed answer. Grade given C+, which the owner rejected as a fail - the grade was measured against the harnesses rather than the persona, which is the defect.
## [24] migrated - 2026-10-11
- `[24]` level floor raised: t) is at-or-above the lesson number (no upper band), w) puts difficulty in concepts and training, not prose or single-word options. Register governs every string (x/y/z). Authority order added at PEDAGOGY-MAP 5-6 as precedence, distinct from reading order. .itemsize-twothird + paired 395px third; e) rewritten as pair -> measure -> never pad. Complete reveals keys under the field, greens the correct label, locks; Clear empties. register.mjs parses each track own tells; lang.mjs lets a data-why gloss leave the band.
## [25] migrated - 2026-10-11
- `[25]` adult tells tiered core/common/situational/rare with each tier stated as instruction; British profanity moved to locale; the harness lost its own word list, gained --tells (reads no page) and reports an item listed under two keys. Five sorted-list errors found by the owner: five-o vs 5-0, guap/cheddar too low, the plug, parole/warrants as plain English.
## [26] migrated - 2026-10-11
- `[26]` kids register given a tiered tells list on the adult contract: core/common/situational/rare plus text as a written medium, 209 items, most-common-first inside every tier, no item twice. taboo-strong tier proposed and then removed on request; taboo is two tiers.

## [28] migrated - 2026-10-11

- `[28]` the train game was never one game: the surviving spec (`qa/games4.mjs:325-472`) is ADJECTIVE ORDER on rails - eight fixed slots, a dock, and a burst only when a word is put too far BACK - while the live page needed any sequence at all. `engine4.js` now shares one yard between two presentations: `trainOrder` (eight cars, roofs level and each opening 6px smaller than the one in front, slot labels a level lever at L<=30 or `data-labels="1"`, a wreck costing one heart, one broken plank and a DERAILED stamp) and `trainSteps` (one flatbed per step, the dock shuffled because the sequence IS the answer, no burst). `qa/games4.mjs` trainOrder block 20/20; the suite is 144 passed / 15 failed and those 15 are the pre-existing bingoCard/mineGrid/bossRaid/stackDrop/ladderRun/graffiti/lives-0 set already in ISSUES.md. `kids/lesson23` moved to `trainSteps` and its how-to now says tap rather than drag. Both demos sit on `qa/preview-games4.html`.

## [2] migrated - 2026-11-10

- `[2]` CONTENT_EXAMPLES.md answer ranges: all 13 games now carry an `opts` bullet stating the floor and ceiling a lesson generation must stay inside — each number read off the vehicle that draws it, not chosen: skeetRange 2-6 discs on lanes spread over the range's height, whackMole 2-6 (six fixed holes in a 3x2 grid after `[1][B5][S2]`), catchBasket 2-4 pots, stackDrop 2-4 options over 6-10 items, flapGate 2-4 gaps at 65px each, wordleBoard one fixed-length word per item with 2-4 evidence options, mineGrid exactly 4 doors, crosswordBoard 2-6 words of 2+ letters or the board refuses the run, echoPads exactly 4 pads (3 near misses), bingoCard 2-9 across nine tiles, ladderRun 2-4 options over 5+ items (safe rung every fifth), bossRaid 2-4, trainOrder 4-8 words into the eight cars. Every heading already stated its use (`best for`) and its limit (`can't`); the gap was the numbers alone. `FORMAT.md` 15 — the rule that requires a vehicle's maximum to be stated in its CONTENT_EXAMPLES entry — cited `whackMole ... 3-6` and now says 2-6. `qa/examples.mjs` 6/6 (91 entries, 13 drafts, five shared fields each). A FORMAT.md edit re-hashes that contract input for every record, so `qa/provenance.mjs` is 102/102 red on it — but the committed blob already hashed `73d7d037` against a recorded `120eb47a`, so the drift predates this fix (549074e, 9f60cf7, 30c045a) and is now logged in ISSUES.md. Committed `9d1c7b4`. `[1][B3]` was this same work under the earlier prompt and is closed by it.

## [1] migrated - 2026-11-10

- `[1]` "commit and push all our files": four documents committed as `ab8f2ed` - ADULT-REGISTER street list re-tiered (side piece and word into street-common, say word out of street-rare), Adherence `[DEVIATION]`/`[UNDERSTANDING]` restated as rules, PEDAGOGY Factuality now bans unverified assertions and invented terms (boosters named as the example), qa/NOTES.md respec'd skeetRange and stackDrop and added crosswordBoard, mineGrid, catchBasket, whackMole and trainOrder. No project code touched. `[27]` had been dropped from [CURRENT] by the owner before this turn and has no section here; its plan survives in `5848ced`. qa/NOTES.md was being written throughout the turn: the trainOrder background, mountains, caboose, car-growth, wheel and prompt lines landed in `02bd066`, `a16311b` and `8555c35`, the bookkeeping in `da21c20`, and all five commits are pushed to `origin/main` at `8555c35`.

## [9] migrated - 2026-11-10

- `[9]` CONTENT_EXAMPLES.md: qa/NOTES.md's tags executed — 18 vehicles deleted (cheatSheet, connectedFlow, stressShift, falseFix, dictogloss, summarySqueeze, sentenceCombine, expandCompress, roleCard, audienceShift, pulseStress, lyricGap, contourMatch, placeScript, directnessDial, generationGap, contrastTable, workedExample), 4 entries rewritten (lineRepair teaching-only; mediaSnippet a `**concept**` tag, two lines of it and question 2 dropped; ruleCard a third wide with `Pattern:` / `Means:` / `Use when:` centred and the explainer under each; emphaticBeat paired with an explainer above it), and the 3 notes already reflected in the text left alone (registerContrast, questionBuilding, sentenceSurgery). 11 pointers at deleted names repaired, each asserted to match exactly once. `# [VISUALS]` moved verbatim to IN-BLOCK-VISUALS.md (341 lines, 13 drafts, its two `directnessDial` mentions repaired) and the 60 surviving blocks sorted into [TEACHING] 24 / [MIXED] 16 / [TRAINING] 20 with [GAMES]' 13 left in place. qa/examples.mjs reads entries from one file and drafts from the other, and names `### Build [Constraints]` as the one scaffolding heading it skips — the owner's `##`→`###` edit had turned it into a heading the harness called unparsed. 6/6 pass. Committed `6c909ab` and pushed.

## [10] migrated - 2026-11-10

- `[10]` qa/preview-blocks.html put in CONTENT_EXAMPLES.md's order and stripped of every item the menu no longer has: 98 sections → 73 (60 blocks in menu order — [TEACHING] 24 first, then [MIXED] 16, [TRAINING] 20 — then the 13 drafts in IN-BLOCK-VISUALS.md order). 25 removed: the 18 vehicles `[9]` deleted, plus 7 items that never had a menu entry (connectedSpeech, dictation, shadowRecord, rubricCard, errorLog, choiceBoard, freeWrite). Both jump-tables rebuilt ("60 items", "13 visual blocks"). `item-chunkBank` was kept, because it is the menu's `contextFit` under its old name — renaming it also renames a qa/NOTES.md section, so it was offered rather than done. Page order checked index by index against the menu (0 mismatches), 73/73 sections and 621/621 divs balanced, every note box matched to its section, qa/examples.mjs 6/6. Left stale and reported: the page's title and intro still say `CONTENT_EXAMPLES §2–§8`, "eighty-five shapes", and "the `####` drafts in CONTENT_EXAMPLES.md §4 Visual". Committed `3fbc7e7`, pushed.
