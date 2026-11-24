# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user words that guide this task compressed to 1 sentence> <artifact produced>`
A batch and its steps must be removed from this file when all of the batch steps are completed. Any batch or step which is stale must be deleted.
---

# [STATE] - what is already done. Read this before touching anything; do not redo or undo it.
- `extra/lesson1-The Capability Map.html` is the file under work. `qa/cmcheck.mjs` and `qa/mapcheck.mjs` are both green (exit 0) as of the last edit, and must stay green at every commit: `node qa/cmcheck.mjs` and `node qa/mapcheck.mjs`.
- The demo lesson is built and sits at the BOTTOM of the page, inside `.content-area`, as twelve real lesson `h2` sections: Where a thing is, and what shape you give it | One trip, two tenses | To, and the person at the end of it | The five phrases no rule decides | Coming back: go, get, come | Asking a stranger at the desk | The same walk in other voices | The town, drawn once | Both ends, and the way | Practice | Quiz | Caderno compartilhado. Block letters restart under each h2 (style.css h2{counter-reset:blk}).
- The lesson is 48 blocks. Every demo block carries one comment above its row naming what it trains and the element box that documents it (`<!-- demo · trains: … · box: #id -->`), and the pointer comment above the demo lists the twelve sections in their built order; a new block needs both.
- "The town, drawn once" is three blocks: the map with its tick question (item 1), the desk dialog retitled "What the question asks for, and what the answer names", and the four routes as one place-per-route multiple choice (items 2–5, reading the same drawing). The desk section keeps only "Write what you hear".
- The seven page sections are collapsed `<details>` with the old headings as summaries. The demo is NOT folded.
- Two recordings ship, provenance rows in `assets/README.md`: `country-roads.mp3` (opens the lesson, block "Listen first, before the rule") and `penny-lane.mp3` (section "Both ends, and the way"). Both were fetched with `node qa/audio.mjs --search=...`; the tool also prints the block markup and the provenance row.
- The flip deck is a game: `.flip-ask` holds one card's back as the prompt, a wrong card tints and turns back after 700ms, a right one clears the board and deals the next prompt after 1400ms; the `#flip` box carries the same script. Both timeline figures in "One trip, two tenses" carry `i.tln-link`. "The same movement, plus back" uses only sentences the lesson has already used (go back the way you came / get back to the office at six / come back to the office when you're done).
- `extra/_demo-draft.md` is deleted; the page is the only copy.
- `.ans` belongs to `engine2.js` (the answer pill it writes after a checked field, style.css:1283). A page never writes class="ans"; the line holding a gap is a plain `<p>`. A wrong `<p class="ans">` paints a full-width green pill behind the gap. This was fixed in 25 places and in the #chunks/#fill boxes; do not reintroduce it.
- Keys are copied from `dictionary.json` through `PronKey.render` (e.g. straight = s[t]raigh[t]). The rule is now written in the #key-sound box. Live pages fetch the dictionary for the 🔑 popup; file:// blocks that fetch, http does not.
- `PEDAGOGY-MAP.md` is never edited without the owner approving the exact words (it line 9 reword is still pending sign-off).

# [CURRENT]

## [B2] - Reflect every rule change where a builder reads it <"ALSO reflect the intent and/or markup of the changes in the instructions and/or markup boxes"> the instructions that match the built lesson
- [S1] The tint rule names the track-voice case: a block in another track voice wears `<div class="block t-kids" data-look="tint">` (or t-adult), so the hue comes from the track and not from the page.
- [S2] The dialog rule says a directions lesson puts the dialog beside the map, and the map questions under the drawing.
- [S3] The key rule keeps the copied-not-typed sentence, and adds that a word with no dictionary entry carries no key at all.
- [S4] The fill/chunks rules keep the plain `<p>` and the .ans reservation.
- [S5] The six looks keep their own rules inside themselves, tiny; the night block is the one dark example.

## [B3] - Index what the demo does not carry <"take whatever is left and put it as an index at the bottom of the section with the games index"> the element index beside the games table
- [S1] Leftover drawn elements keep their own drawing and box: the timeline family if it stays out, the parts-of-speech sentence, the pair, the recipient arrow, the pronunciation key, and the chart-as-item-list (row answered by a gap or a pair of options, matching with one shared pool, the grid 2x2 inside a row answer cell).
- [S2] The comic stays as an index entry marked not in use, with the note on what its drawings must do before it is offered again.
- [S3] The games table shrinks to the twelve presentations the demo does not use, one content shape, one line each.

## [B4] - Rebuild section 1 as Pass 1 whole input <"Pass 1 needs to know what it actually DOES when it chooses them"> the element catalogue
- [S1] One row per element: the student work, choose it when, what it cannot do, what it asks of the words, its cost, and the note form it declares in its p1 comment.
- [S2] The lookup that replaces judgement: produce a form -> fill; choose between forms that compete -> mc; fix a written form -> correction; recall a meaning with nothing written -> flip; write more than a line -> write.
- [S3] Counts: 5 controls per activity included, 20 in the quiz, per-type targets with no maximums.
- [S4] Draft the `PEDAGOGY-MAP.md` line 9 rewording for sign-off; that file is not edited before approval.

## [B5] - Prune and clean the page <"do the final cleanup of the page, markup, and place the instructions all in their own section/dropdown with pointers to the blocks or items that they reference"> the finished page
- [S1] Delete what the demo and the index replaced, every box checked against its drawing: stripgaps, --comic-h, --strip-h, --map-w, data-structure/caption/tr.note/.sides, the control gallery, and the matching chart-plus-letters markup.
- [S2] Move element-wide rules into their own section with pointers to the blocks they govern; instance notes stay as comments at their blocks.
- [S3] Move the build mechanisms to the top of Pass 2, each beside the element it describes; cut the stale data-span prose.
- [S4] Every page section stays collapsed; the demo stays open. Repoint the anchors, stub ids, table of contents and the demo pointer comment to the new section names in one pass.
- [S5] qa/cmcheck.mjs and qa/mapcheck.mjs green, then commit and push.

## [B6] - Wire the pronunciation key into generation <"i just want the dictionary and pronkey wired up for generation in the first place, not a post build rewrite"> the key step in the authoring process, and a check behind it
- [S1] Pass 1 names the words that carry a key; the build copies each key from `dictionary.json` through `PronKey.render` - copied, never typed, and a word with no entry carries no key.
- [S2] Add the check that makes S1 enforceable: a `<rt>` that reads as a key must equal `PronKey.render(dictionary[word])` for the word in front of it, and a mismatch fails the run.
- [S3] Record in the page own rules that the live 🔑 button needs the fetch, which file:// blocks and http allows, so a builder knows why the toast appears.

## [B7] - The edit-mode width buttons <"if we want to remove hand-authoring entirely ... the buttons shouldnt be there if they dont work"> either they stick or they go
- [S1] The width buttons in the edit panel do not survive leaving edit mode. Make the choice persist (localStorage, or written into the block markup), or remove the buttons and record that hand-authoring of widths is gone.
