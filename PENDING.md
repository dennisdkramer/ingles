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

## [B32] - The line of time is pinned to one word: the axis gets a minimum 200px, one point sits under one word, and each tense is a preset <"its always one point on the timeline anchors to one word in the string"> <style.css #97, qa/preview-blocks.html>
   - [S1] - Replace the `.tlw` words layer with `.tn`: verb words underlined, one `.an` word pinned to the axis by `anchor(center)`, axis pinned to it by `--pin` <style.css #97> <the axis's pinned point sits under the word's centre at every width>
   - [S2] - Marks: dot, fading span, dotted tail, dotted future, and the future-perfect elbow <style.css #97> <each mark lands on the line, fades at both ends>
   - [S3] - One preset per tense — past perfect, simple past, past continuous, present perfect, simple present, present continuous, going-to, future perfect — and the figures on the page, sentences centred <qa/preview-blocks.html> <eight figures render, each pinned word's mark aligned>
   - [S4] - Screenshot, correct the pin/drop numbers, commit <_tmp probe> <every drop reaches its mark, no label collides>































