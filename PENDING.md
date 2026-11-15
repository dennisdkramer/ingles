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

## [B31] - The line of time gets words over it: one clause's verbs underlined into pointers at BEFORE / NOW / THEN <"underline the verb elements of one clause ... have those underlines flow as a pointer"> <style.css #97, qa/preview-blocks.html>
   - [S1] - `--now` places the star and both runs hang off it, so either side of the axis can stretch <style.css #97> <`--now:50%` renders exactly as before; 0-100% moves the star>
   - [S2] - `.tlw` words layer: `.tw[data-to]` underline drops into an elbow and an arrowhead that lands on its zone <style.css #97> <the pointer's foot is on the axis line, `data-to` flips the tick's direction>
   - [S3] - Four figures — perfect present, perfect past, going-to, future perfect — each with a phrase above a 200px axis <qa/preview-blocks.html> <four figures render, page parses, note box keyed `[69-words]`>
   - [S4] - Screenshot the figures and correct the placement numbers until each pointer lands on its zone <_tmp probe> <every pointer's foot within a few px of its target>






























