# PAST BATCHES

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

