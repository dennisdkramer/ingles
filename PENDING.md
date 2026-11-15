# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
`   - [Sn] - <the distinct goal unique to this step> <the File & Section name of the rules which are most relevant> <exit condition>`

- For any [change in plans] or [deviation from the batching/order in pending.md], update any relevant [Bn] and/or [Sn]] to reflect the change(s)
- Execute one step per turn. When a step or batch is finished, dropped, skipped, or stale, it is deleted. A task ends with this file empty.
- **This file is edited in place, never rewritten**: an edit anchors on the `[CURRENT]` batches only. `# [HANDLING]` and `# [CURRENT]` are the file's spine.

# [CURRENT]

## [B3] - Lesson 30 authored on the adult track <"Generate lesson 30 on the adult track following pedagogy-map.md"> <adult/lesson30-Can You Manage — Ability, Favours, and Getting Away With It.html, lessons.json>
   - [S3] - Author §3-§7 (the frame and §1-§2 exist): every control is `class="gap" data-answer=` with no inherited `name` scheme, every bracket states a meaning, each row's sizes sum to 12 <ADULT-ROADMAP [30]; preview.css #50, #52, #53, #60, #61, #63, #64> <all 3 example lines and all 5 quoted vocabulary items appear verbatim; no control carries an attribute no allowed input declares>
   - [S4] - Run the gate and fix every fail <qa/check.mjs; preview.css #60, #76> <✅ adult/lesson30, items at or above `need`, zero fails>
   - [S5] - Run `npm run build:lessons`, measure the page's rows, commit and push <build-lessons.mjs; generation/checks/measure.mjs; .clinerules 8> <lessons.json lists n=30, 0 ragged rows on the page, pushed>

## [B39] - The POS marks collapse to five and compose with the timeline's word marks <"you can collapse the list, merge over the css from preview-visual, and dothet uw/an change"> <style.css #94 POS, #89 MARKS; qa/preview-visual.css; qa/preview-blocks.html; qa/preview-menu.html>
   - [S1] - `#94` keeps five classes only (`pos-v pos-n pos-adj pos-adv pos-fn`) on tokens, and the label mode comes over from `qa/preview-visual.css`, whose duplicate `.pos*`/`.l-*` rules are then deleted <style.css #94; qa/preview-visual.css> <five classes style the line; `preview-visual.css` has no `.pos` rule left>
   - [S2] - `.uw`/`.an` paint with `text-decoration` driven by `--mk-w`/`--mk-c`, so one word can carry a mark and a POS class at once <style.css #89 MARKS, #94> <a word with both shows one line: the mark's thickness and colour, the class's style>
   - [S3] - Both pages remapped onto the five classes <qa/preview-blocks.html #tlw; qa/preview-menu.html [65]> <no old class name survives in either page>
   - [S4] - Re-verify the eight pins and the 2px star gap, then rows and gate <generation/checks/measure.mjs; qa/check.mjs> <word centre = axis left + --point ×8, gap 2px, rows 0 ragged, gate ✅>





































