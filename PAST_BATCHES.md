# PAST BATCHES

## 2026-11-19 — a chart in a cell is centred in it
## [B1] - Centre a figure.chartwrap that shares its cell with other content, and remove the pair chart's heading <"when a chart is inside another element it should be centered, correct me if im wrong but the only example of this is the chart 'Three words Portuguese folds together' right? center it, and remove 'What it pairs with' label"> <style.css:1484-1487 :is(.cols,.rows)>div>.chartwrap margin-inline:auto; capability-map.html: the h4 "What it pairs with" deleted, the chart cell now holds only the figure; Chrome: #chart cell 868 fig 689 left 89 right 89, #chart-pair 252=252, #chart-split 168=168 — the only chart with slack was the one named; 0 lessons use .cols/.rows so nothing shipped moves>

## 2026-11-19 — an in-block row fills the block, the sentence grows and the figure does not
## [B1] - Give .rows the sizing its rows were missing: cells share what is left, a cell that is only a heading and a figure keeps its own width <"the in-block content rows should be flowed with flex rows to fill the width ... that is the default, and if those elements are currently in columns instead of rows, they shouldnt be"> <style.css:907-908 .rows>* flex:1 1 0 and .rows>:not(:has(>p)) flex:0 1 auto; capability-map.html: 7 hand-written inline flex values deleted from §4, the row's markup spec added to the charts reveal; Chrome: three rows each 1146 wide, chart cells match their figures exactly (252=252, 168=168), no overflow>

## 2026-11-19 — the activity section reports only what an engine reads
## [B1] - Delete the score-reactive bar and the ring: nothing on a page counts answers, so 6B's premise was false <"Can it read the totality of all the questions on the page? if so, we will put it at the bottom of the lesson page above the completed button. if not, delete 6b"> <engine2.js:261-292 marks keys and toggles body.is-completed only; no writer of --score in engine1/2/4, player.js or pronkey.js; capability-map.html: 6B/6C/6D deleted, 6A kept at span 12, its "the engine writes it" claim replaced by the fact, Decisions bullet now records "No score bar, anywhere">
---
## [B2] - Give the three looks a coloured top edge and let an intro sit on the page's own row gap <"change the default styling of stripes so the top colored part of the border is 2px red, tint 2px track hue, tape 2px dark yellow" + "reduce the margin/padding so that it doesnt have huge gaps above and below it"> <style.css: stripes border-top var(--err), tape border-top a dark yellow mix, tint already var(--accent); .block[data-look="float"] padding 0 10px and its first child margin-top 0 — measured 35-38px above (22 of it the page row gap) and 23px below, was 61/49; Chrome: float intros 38/23, stripes top rgb(179,53,44), tape 2px oklab dark ochre>

## 2026-11-19 — §4 is one block of in-block features
## [B1] - Collapse §4 into one block: the join folded into the underline, "timeline" everywhere, the pair chart out of its frame, the split chart's caption gone, the picture and listening blocks deleted <"4e is already in 4a ... change the section header to In-Block Features"> <capability-map.html §4: h2 "In-Block Features", one 12-span block holding underline + poschart, timeline .tlgrid, bulk and pair charts, label prose and split chart, bar + gloss + key, and the recording; 5 reveals; mapping links re-pointed to #pos and relabelled timeline>
---
## [B2] - Verify the merged section and fix the lyric-list spacing it exposed <"take all the remaining items and put them into a single block"> <qa/cmcheck.mjs: 41 rows all 12, 0 dead links, 20 specimens; Chrome: no heading wraps, lyric margin 0px, no overflow, height 15053>

## 2026-11-19 — the section number is the heading
## [B1] - Print the section number at the heading's own size, so it reads as part of the heading <"make the generated h2 numbrs the same size as the text they accompany"> <style.css: h2::before, font-size and display face dropped — the prefix is now 28.67px Playfair like the h2, colour only differs; all 10 headings still one line, no overflow>

## 2026-11-19 — capability map is the markup contract
## [B1] - Number the sections in the sheet, un-justify headings and grid cells, hold markup specimens inside a reveal <"the sections are supposed to be auto-numbered too" + "you can apply that heading change, and the text align in tables/charts"> <style.css: h1/h2/h3 text-align, sec counter + h2::before + #feed exclusion, grid td text-align, details.reveal pre>
---
## [B2] - Stand the two charts that are their own frame as card-less figures <"i want charts to also be able to live as their own block with no card. Figures C&F were supposed to be like that"> <capability-map.html: #chart and #chart-split are figure.chartwrap with figcaption.chartcap, justify-self:start; chart rules moved into the reveal that carries the markup>
---
## [B3] - Swap the superseded now-centred axis for the pinned tense line, make the audio block a timed lyric page <"the timeline you used is a superseded one ... block M - the lyrics highlighting and timing is the core element"> <capability-map.html: two figure.tlw in a .tlgrid, tlx gone, .vz-lyrics with four data-t, california.mp3, Decisions bullet reversed>
---
## [B4] - Put the markup and its "when" inside every block that uses a component <"This page is going to be the new markup contract and show how and when that markup should be used"> <capability-map.html: 23 details.reveal, one per component>
---
## [B5] - Verify and commit <"as long as the heading fits on 1 line and is actually useful text"> <qa/cmcheck.mjs: 48 rows all 12, 50 blocks, 0 panels, 2 bare charts, 23 specimens, 0 dead links; Chrome: every h2/h3/chartcap one line, no overflow at 1440, page 11904px>

## 2026-11-19 — capability map rebuilt on the lesson frame
## [B1] - Rebuild the page on the lesson frame: h2 sections, .block frames, no .panel, no data-step, no hand-lettered headings <"clean up this page so that it actually follows the lesson conventions and looks somewhat good"> <capability-map.html: head, frame, h1, §1 "How a page gets built" incl. the span and look tables>
---
## [B2] - Write §2 prose and §3 tool choice, with every look used on the content it serves instead of demonstrated in a card <"it gives the visual elements as a list of possibilities rather than USING them on the blocks"> <capability-map.html: §2, §3>
---
## [B3] - Render every figure on the sentence it serves, and give each thin figure its own frame beside its panel <"thin charts that are supposed to be frame content of their own, NEXT to their associated panel"> <capability-map.html: §4 figures>
---
## [B4] - Render activities, state, motion and the three reference sections as lettered blocks <"it is messy, and gives the wrong idea on how things should be organized"> <capability-map.html: §5-§10, footer>
---
## [B5] - Verify in headless Chrome and replace the old page <"our rules need to prevent anything like that from happening"> <screenshots, structural greps, capability-map.html>

