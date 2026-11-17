# Preview notes

Open requests: one `##` block per preview page, one `###` section per item. The note boxes on the
preview pages read and write this file directly (Chrome or Edge, click "link qa/NOTES.md" once), so
this file is the whole record and editing it here edits the boxes.

Every section opens with a pointer to the item's `###` heading in `CONTENT_EXAMPLES.md` — that
heading is the contract the request argues with, and reading the two against each other is the whole
job. The request stays here and is never copied into CONTENT_EXAMPLES.md. A section holding finished
text and new text together loses only the finished part — execute what remains.

How a request is worked, in the agent's own hand. When work on one starts, its text is tagged by
prefixing it with `(IN PROGRESS)` — `(IN PROGRESS) make both blocks half width` — so a box shows at a
glance what is under way and what is still untouched. The tag goes at the front of the line it applies
to, which also makes it findable as `^(IN PROGRESS)`. When the request is met — the shape changed, the
harness read — that text is deleted from this file: the section keeps its heading and its pointer and
is simply empty, ready for the next request, and the record of work done is the commit. A section
holding several requests is tagged and cleared one request at a time, never all at once, so the
untagged lines are the ones still owed.

The tag is the agent's to write, and only ever on work it has actually begun, so it never reads as a
promise. A request it cannot meet as written — a question waiting on an answer, a note to self, a line
that contradicts another in the same file — keeps its text, untagged, and the reply says what it waits
for: nothing is deleted that was not done. Emptying a box deletes nothing either. Only this file
removes a request: delete a `###` section here and its box empties within 2 s, so a request's text is
deleted only once it is met.

Two ways in. Best: `node qa/serve.mjs` (or double-click `qa/serve.cmd`) — it serves the repo on
127.0.0.1 and opens the preview page with `?notes=server`, and the boxes then read and write this file
through that server: nothing to pick, nothing to grant. Double-clicking the page on its own still
works — one click on "link qa/NOTES.md" grants the page file-system access — but that grant lapses
between sessions, so the server is the reliable way in. Either way the page re-reads this file every 2 s.
Text sitting directly under a `##` page heading is dropped the next time any box writes, so a block's
content belongs in its `###` sections.

## preview-blocks.html

### [02]

→ IN-BLOCK-VISUALS.md §`[02]`

### [03]

→ VEHICLES.md §`[03]`

### [04]

→ VEHICLES.md §`[04]`

### [05]

→ IN-BLOCK-VISUALS.md §`[05]`

### [07]

→ CONTENT_EXAMPLES.md §`[07]`

### [12]

→ VEHICLES.md §`[12]`

### [27]

→ VEHICLES.md §`[27]`

### [36]

→ VEHICLES.md §`[36]`

### [38]

→ VEHICLES.md §`[38]`

### [30]

→ VEHICLES.md §`[30]`

### [35]

→ VEHICLES.md §`[35]`

### [31]

→ VEHICLES.md §`[31]`

### [37]

→ VEHICLES.md §`[37]`

### [41]

→ CONTENT_EXAMPLES.md §`[41]`

### [42]

→ IN-BLOCK-VISUALS.md §`[42]`

### [43]

→ CONTENT_EXAMPLES.md §`[43]`

### [50]

→ IN-BLOCK-VISUALS.md §`[50]`

### [55]

→ CONTENT_EXAMPLES.md §`[55]`

### [56]

→ CONTENT_EXAMPLES.md §`[56]`

### [57]

→ CONTENT_EXAMPLES.md §`[57]`

### [58]

→ CONTENT_EXAMPLES.md §`[58]`

### [60]

→ CONTENT_EXAMPLES.md §`[60]`

### [61]

→ IN-BLOCK-VISUALS.md §`[61]`

### [63]

→ CONTENT_EXAMPLES.md §`[63]`

### [64]

→ CONTENT_EXAMPLES.md §`[64]`

### [65]

→ IN-BLOCK-VISUALS.md §`[65]`

### [66]

→ IN-BLOCK-VISUALS.md §`[66]`

### [67]

→ IN-BLOCK-VISUALS.md §`[67]`

### [40]

→ CONTENT_EXAMPLES.md §`[40]`

### [08]

→ CONTENT_EXAMPLES.md §`[08]`

### [09]

→ CONTENT_EXAMPLES.md §`[09]`

### [10]

→ CONTENT_EXAMPLES.md §`[10]`

### [11]

→ CONTENT_EXAMPLES.md §`[11]`

### [13]

→ CONTENT_EXAMPLES.md §`[13]`

### [14]

→ CONTENT_EXAMPLES.md §`[14]`

### [15]

→ CONTENT_EXAMPLES.md §`[15]`

### [16]

→ CONTENT_EXAMPLES.md §`[16]`

### [17]

→ CONTENT_EXAMPLES.md §`[17]`

### [18]

→ CONTENT_EXAMPLES.md §`[18]`

### [19]

→ CONTENT_EXAMPLES.md §`[19]`

### [20]

→ CONTENT_EXAMPLES.md §`[20]`

### [21]

→ CONTENT_EXAMPLES.md §`[21]`

### [22]

→ CONTENT_EXAMPLES.md §`[22]`

### [23]

→ CONTENT_EXAMPLES.md §`[23]`

### [24]

→ CONTENT_EXAMPLES.md §`[24]`

### [25]

→ CONTENT_EXAMPLES.md §`[25]`

### [26]

→ CONTENT_EXAMPLES.md §`[26]`

### [44]

→ CONTENT_EXAMPLES.md §`[44]`

### [45]

→ CONTENT_EXAMPLES.md §`[45]`

### [46]

→ CONTENT_EXAMPLES.md §`[46]`

### [47]

→ CONTENT_EXAMPLES.md §`[47]`

### [48]

→ CONTENT_EXAMPLES.md §`[48]`

### [49]

→ CONTENT_EXAMPLES.md §`[49]`

### [51]

→ CONTENT_EXAMPLES.md §`[51]`

### [52]

→ CONTENT_EXAMPLES.md §`[52]`

### [53]

→ CONTENT_EXAMPLES.md §`[53]`

### [54]

→ CONTENT_EXAMPLES.md §`[54]`

### [59]

→ CONTENT_EXAMPLES.md §`[59]`

### [62]

→ CONTENT_EXAMPLES.md §`[62]`

### [39]

→ VEHICLES.md §`[39]`

## preview-menu.html

### [27]

→ VEHICLES.md §`[27]`
make the targeting reticule disappear when the mouse moves out of the game /when the cursor reappears
turn the targets into ducks, leave the word labels the same. 
fetch an asset for a simple  animated cartoon  flying duck
make the frame height 100px taller at the game class root
for all the games, when you select the wrong answer, instead of a card behind the correct answer, make it a green translucent glow

→ done: reticule hides on mouseleave/pointerleave/window blur (engine4.js `lower()`); targets draw an inline
  duck (`ART.duck`, `ART.duck` + `.g4-duck*`) with the word on its plaque, flapping wings and a bobbing tail;
  `.game[data-game="skeetRange"] .g4-stage{height:380px}`; every `reveal` rule now shows a pulsing green glow
  (`@keyframes g4pulse`) instead of a dashed border or a card.
  → follow-up: EVERY frame is 100px taller, not one — measured `.g4-stage` 380 in all ten games (27-36), from
    280 before. The wings flap about an attachment point on their body side rather than the shoulder, which is
    what made them read backwards; `.g4-duck-flap` groups now carry the origin so the feather sweeps away from
    the body, and the near wing paints over the far one.

### [28]

→ VEHICLES.md §`[28]`
the option for the next question appears behind the current answer when you click it. make sure the options only appear when their question appears. for the transition to a new question, wipe or fade the old question/prompt card out and the new one in

→ done: the handover is choreographed in the runner (`Runner.prototype.step` / `resolve`), so it holds for every
  game at once. `PROMISE_OUT` (240ms) takes the old prompt off the stage before the item is stepped past, and
  `PROMISE_IN` (180ms) holds the new options back until their question is up — the item clock now starts with
  the options, not before them. Nothing from the old item is ever on screen under the new one.

### [29]

→ VEHICLES.md §`[29]`
move the pots and and their answer cards up 20px. make the flowers start size and growth % twice as big and re-align their bottom with the top of the pots

→ done: `.g4-tray` bottom 10px → 30px (the pots and their labels move up together); blooms 18x46 → 36x54 (twice
  the width, and now the art's own 40:60 proportion rather than a squashed box) hanging off
  `--pot-sit + --pot-h`, which IS the pot's rim, so their bottoms sit on the top of the pot. The pot itself is
  sized by `--pot-w:104px` with `height:auto`, so it keeps its drawn 120:84 shape.

### [30]

→ VEHICLES.md §`[30]`
the question cards should have a single line or text with no wrapping  so their cards are the same height as the answer card stack. animate their width change as they move onto the stack - right now they move over and then just instantly get bigger

→ done: the option cards already held one line; the missing part was the size. `fitBlocks()` publishes the block
  height as `--ah`, and `.g4-towerpads .g4-padbtn{height:var(--ah)}` makes every option exactly one tower block
  tall. The flying card now leaves at the option's own width and height and lands at the block's (the ledge width
  less 20px per level), with `width`/`height` in the transition — so the size change happens during the flight
  instead of on landing.

### [31]

→ VEHICLES.md §`[31]`
the bird stil resets position after a right or wrong anser - it needs to be one continuous flight/game with no reset other than hitting the wall

→ done: `flapGate.clear()` no longer resets mid-run. When the run is continuing (`r.phase === 'done'` with items
  still in the queue) it only drops the pending target — the bird keeps its height and its climb, and the wall it
  just flew through keeps flying while the next question is cut into a wall behind it. The only resets left are
  hitting a brick and the run ending.

### [32]

→ VEHICLES.md §`[32]`
the two background layers should align better, or you can try a different background.
put a shadow on the text and an edge shadow on the letter card backgrounds so they seem slightly 3d

→ done: the wall was an SVG pattern laid out in a 400x240 `viewBox` and then stretched to the stage, so every tile
  came out about three times wider than it was tall. It is now a CSS grid at 46px square (`background-size`), which
  is square at any stage size and aligns with itself. The letter cards carry an inset light top edge, an inset dark
  bottom edge and a soft drop (`box-shadow`), plus a two-way `text-shadow`, so they read as raised tiles. The clue
  card took the same text shadow.

### [33]

→ VEHICLES.md §`[33]`
make the guy 2x taller/bigger. when you get the answer right and he goes in the door dont make him shrink, just fade. When you get it wrong, animate him falling over before he disappears and resets

→ done: `.g4-runner` 60x92 → 120x184. `.enter` is a step up into the doorway with a fade and no scale, so he is
  never shrunk. A wrong answer reels him (`g4reel`), drops him at the door he chose (`.down`: translate down and
  rotate 84deg, built on his own `--dx`) and then fades him out (`.down.gone`).

### [34]

→ VEHICLES.md §`[34]`
instead of being normal text fields, make it so clicking a field highlights it and typing overwrites any letter thats in it - correct words - when they turn the boxes green - lock the letters so they cant be overwritten

→ done: `maxlength="1"` is gone (it stopped a filled square taking a new letter at all); the value is clamped in
  `type()` instead, and focus selects what is there so the next keystroke replaces it. The focused square wears an
  accent ring and a tinted fill (`.g4-gap:focus`), green once solved. A solved word is `readOnly` and `type()`
  refuses to write into a locked square.

### [35]

→ VEHICLES.md §`[35]`
remove the audio and its button, remove the hint text,  and move the prompt and options down by 30px

→ done: the `🔊 Say the sentence` button and the `.g4-echo-hint` line are both gone (the element is no longer
  built, so nothing can write into it), and `.g4-echo` starts 30px lower (`top:44px` → `74px`).
  → open question, recorded rather than guessed: removing the hint also removed the "Not that one — 2 lives
    left" line that followed a wrong pad. The hearts still show the lives and the pad still flashes red, so
    nothing is silent — but if that sentence was meant to stay, it needs its own element and it is one line
    to restore.

### [36]

→ VEHICLES.md §`[36]`
for the answer/option buttons, leave the container the same size so the curtain and positions stay exactly the same, just add 10px padding so the button cards are smaller
