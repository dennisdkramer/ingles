# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
A batch and its steps must be removed from this file when all of the batch's steps are completed. Any batch or step which is stale must be deleted.
---

# [CURRENT]

## [B1] - Write the demo lesson, spine first then its text <"a demo roadmap entry which is a coherent lesson" / "destination takes to"> the demo lesson's sections, items, keys and element notes
- [S1] State the concept as one rule (destination takes to; at/in is where it already is) and the target output the lesson trains.
- [S2] Write the beats as sections in order, each naming its element and its count; half the training sits inline, 3-5 controls at the end of each teaching section, and the practice section holds the other half.
- [S3] Write 20 quiz controls with keys, and 5 controls in each activity that is included.
- [S4] Write the business base voice plus the kid and adult alternates at the block where each first appears, one line of track intro above each and a colour to tell them apart.
- [S5] Place the extras: one timeline (simple present as general against now), the recipient arrow sentence (which carries .pos in that one line), three ruby glosses (the way / how to get / bus stop), and keys on directions, corner, straight, station.
- [S6] Write the song as section 6 and roll it in: its line carries from ... to and the way, and the sections after it reuse that wording. Route 66 first, then Take Me to Church or I am Gonna Be (500 Miles); --finds proves the line or the link variant ships instead.

## [B2] - Build the demo into the top of Pass 2 <"generate everything as is into the page" / "our demo lesson is 100% done before we start pruning"> the demo built, its markup boxes closed by default
- [S1] Build the blocks from B1, each element in its commonest use, at full size, with real keys (--gap-w is 1.3x the shipped answer).
- [S2] One markup box per element, closed by default, its summary naming what it holds, its pre holding escaped tags only; instance notes as HTML comments at their blocks.
- [S3] The grid only where mc options are one or two words; .write only for an answer of several sentences, with a model answer instead of a key.
- [S4] The map: one drawing only, in its own block, and every question points at it - mc items whose options are place names, one tick, or several ticks keyed data-a="a|b".
- [S5] Green before committing: qa/cmcheck.mjs (data-span 12, no .panel, h3 <= 60, anchors resolve, img/audio exist, pre escaped) and qa/mapcheck.mjs (stub ids resolve, div balance, no nested block, qitem keys, no empty data-answer).

## [B3] - Index what the demo does not carry <"take whatever is left and put it as an index at the bottom of the section with the games index"> the element index beside the games table
- [S1] The leftover drawn elements keep their own drawing and box: the timeline family if it stays out, the parts-of-speech sentence, the pair, the recipient arrow, the pronunciation key, and the chart-as-item-list, whose entry carries its three uses - a row answered by a gap or a pair of options, matching with one shared pool of meanings, and the grid 2x2 inside a row answer cell.
- [S2] The comic stays as an index entry marked not in use, with the note on what its drawings must do before it is offered again.
- [S3] The games table is reduced to the twelve presentations the demo does not use, one content shape, one line each.

## [B4] - Rebuild section 1 as Pass 1 whole input <"Pass 1 should be AWARE that it can include music, games, a street map" / "Pass 1 needs to know what it actually DOES when it chooses them"> the element catalogue
- [S1] One row per element: the student work, choose it when, what it cannot do, what it asks of the words, its cost, and the note form it declares in its p1 comment.
- [S2] The lookup that replaces judgement: produce a form -> fill; choose between forms that compete -> mc; fix a written form -> correction; recall a meaning with nothing written -> flip; write more than a line -> write.
- [S3] Counts: 5 controls per activity that is included, 20 controls in the quiz, per-type targets with no maximums.

## [B5] - Prune, move and clean <"do the final cleanup of the page, markup, and place the instructions all in their own section/dropdown with pointers to the blocks or items that they reference"> the finished page
- [S1] Delete what the demo and the index replaced, every box checked against its drawing; cut stripgaps, --comic-h, --strip-h, --map-w, data-structure/caption/tr.note/.sides, the control gallery, and matching chart-plus-letters markup.
- [S2] Fold every box but the demo lesson own; keep the six looks tiny, each stating its rule inside itself.
- [S3] Move element-wide rules into their own section with pointers to the blocks they govern; instance notes stay as comments at their blocks.
- [S4] Move the build mechanisms to the top of Pass 2, each beside the element it describes; cut the stale data-span prose.
- [S5] qa/cmcheck.mjs and qa/mapcheck.mjs green, then commit and push.
