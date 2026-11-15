# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
`   - [Sn] - <the distinct goal unique to this step> <the File & Section name of the rules which are most relevant> <exit condition>`

- For any [change in plans] or [deviation from the batching/order in pending.md], update any relevant [Bn] and/or [Sn]] to reflect the change(s)
- Execute one step per turn. When a step or batch is finished, dropped, skipped, or stale, it is deleted. A task ends with this file empty.
- **This file is edited in place, never rewritten**: an edit anchors on the `[CURRENT]` batches only. `# [HANDLING]` and `# [CURRENT]` are the file's spine.

# [CURRENT]

## [B1] - The probe lives in the repo and the working tree ships <"move the new measure.mjs to a new folder in the repo called generation/checks/ ... Commit and push any pending files"> <generation/checks/measure.mjs, one commit>
   - [S1] - Copy the probe into `generation/checks/`, retitle it with the problem it measures, run it from the repo root, then commit and push the pending tree (.clinerules, PENDING.md, the probe) <generation/checks/measure.mjs; .clinerules 8> <it prints 0/7 and 0/12 from its new path; git status clean after the push>

## [B2] - Lesson 30 authored on the adult track <"Generate lesson 30 on the adult track following pedagogy-map.md"> <adult/lesson30-Can You Manage — Ability, Favours, and Getting Away With It.html, lessons.json>
   - [S2] - Copy `_shell.html` to the lesson-30 filename, fill TRACK/LESSON_TITLE, link `../preview.css` (the map's input is preview.css headers, lesson 29's precedent), and lay the seven-section scaffold in `.content-area` <_shell.html; PEDAGOGY-MAP 1-4> <one h1, the shell frame unchanged, 7 empty sections in place>
   - [S3] - Author sections 1-2: the favour across the wall (turns) + the four forms in one table <ADULT-ROADMAP [30]; preview.css #51, #52> <every form taught appears in prose before any drill uses it>
   - [S4] - Author sections 3-4: the politeness dial (pair, 4 rows a side) + permission and getting away with it <preview.css #53, #60; ADULT-ROADMAP [30] modal/could-polite, modal/permission> <each side has 4 children and --pair-rows:4 is set>
   - [S5] - Author sections 5-6: yes/no vocabulary (set) + ability under pressure (could vs managed to vs was able to) <preview.css #50, #64; ADULT-ROADMAP [30] vocabulary> <brackets state the meaning, never the word>
   - [S6] - Author section 7 (write + reveal + handoff to lesson 31) and close the page with #feed <PEDAGOGY-MAP 3; FUNCTION.md [CONTENT]> <all 6 vocabulary items and all 3 example lines appear verbatim>
   - [S7] - Run the gate and fix every fail <qa/check.mjs; FUNCTION.md [CONTENT]> <✅ adult/lesson30, items at or above `need`, zero fails>
   - [S8] - Run `npm run build:lessons`, measure the page's rows, commit and push <build-lessons.mjs; generation/checks/measure.mjs; .clinerules 8> <lessons.json lists n=30, 0 ragged rows on the page, pushed>


