# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
---

# [CURRENT]
---
## [B13] - Rebuild adult lessons 1-10 from scratch through the new process <"delete adult lessons 1-10 and then regenerate them following the new process and pedagogy-map.md - do not read the old lessons, do not read any other files than the ones the pedagogy map tells you to"> <S1: `git rm` adult/lesson1-10*.html, so no old page exists to be read or copied. S2-S11: one lesson per step, each built only from ADULT-ROADMAP.md §its own lesson, ADULT-REGISTER.md, capability-map.html and `_shell.html` — copy the shell, name the file for its teaching point, PASS 1 content then PASS 2 arrangement, run `qa/pos.mjs` for the marks and `PronKey.render` for the keys, [CHECK] against the map. S12: `npm run build:lessons`, commit, push>
---
