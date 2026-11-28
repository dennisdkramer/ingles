# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user words that guide this task compressed to 1 sentence> <artifact produced>`
A batch and its steps must be removed from this file when all of the batch steps are completed. Any batch or step which is stale must be deleted.
---

# [CURRENT]

## [B1] - strip the frames the page teaches <"i dont want any box containers around elements at all"> <style.css: .viz paint + chartwrap paint gone, the vlab room moves to the cell>
- [S1] style.css: delete `.viz`, `.seq.viz`, `.vz-map.viz`; neutralise `.chartwrap`; move the 48px vlab inset onto the cell
- [S2] restamp style.css across every page that links it

## [B2] - the map draws its elements bare <same> <map: charts, dialog, player, map sit straight in their cells>
- [S3] charts: no figure, no empty wrappers, `#matching` on the table
- [S4] dialog, player, map: `viz` off

## [B3] - one block per activity type <"still confused what is empty and broken"; "the other 3 boxes can go away"> <map: 8 types split, 3 boxes deleted, game kept>
- [S5] delete `#comic`, `#stripgaps`, `#chartanswer` boxes; move the bare-radios rule into the controls box
- [S6] split the grab-bag block into one block per type; drop `id="translation"` and the stale `data-activity`

## [B4] - the standing rules in one place <"the paragraphs in this block should go into the markup boxes"> <map: L prose cut, controls box carries 5 rules>
- [S7] `markup-controls` gains the four controls, gap-vs-write, qitem, numbering, gap sizing; duplicates deleted
- [S8] the three prose paragraphs that stay, tightened

## [B5] - what a block is, and how many items <"content doesnt merit a new block until it is thick enough"> <map: contract + look + templates>
- [S9] section-2 contract: free vs in-block, width from the cell, block thickness
- [S10] `#flip` back to stripes, `:64` widened, templates bare, `#audio` without `controls`

## [B6] - flip behaviour on an engine <"we can put the flash card behavior on an engine"> <engine5.js + 13 pages de-scripted>
- [S11] engine5.js; shell line on 129 lesson pages + the map; 13 inline scripts deleted

## [B7] - the directives know a flip card <"every lesson has vocabulary"> <Prompts/03 + 01>
- [S12] `03`: add `flip`; `01` §5: the vocabulary gate and the block-thickness rule

## [B8] - verified <"go for it"> <check2 + anchors + Chrome>
- [S13] check2, anchors, vlab label, map ticks, one transport, cards from engine5 on a lesson page
- [S2] extra/lesson1-The Capability Map.html — tag: a closer with nothing to close: </div> (`check2` · `tag` · fix)
- [S3] extra/lesson1-The Capability Map.html — tag: <div> is never closed (`check2` · `tag` · fix)
- [S4] extra/lesson1-The Capability Map.html — wrap: a .rows holds a .rows directly — a row is a cell's child, never a row's (`check2` · `wrap` · fix)
- [S5] extra/lesson1-The Capability Map.html — wrap: a .rows holds a .rows directly — a row is a cell's child, never a row's (`check2` · `wrap` · fix)
- [S6] extra/lesson1-The Capability Map.html — wrap: a .rows holds a .rows directly — a row is a cell's child, never a row's (`check2` · `wrap` · fix)
- [S7] extra/lesson1-The Capability Map.html — wrap: … and 16 more rows inside rows (`check2` · `wrap` · fix)

