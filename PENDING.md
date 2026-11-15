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

## [B44] - Mark tweaks: mode 20%, other nouns opaque, subject/object 3px, adjectives dark pink, backgrounds down 1px <"reduce the mode gradient starting opacity to 20%, 'other noun' to 100% opacity, subject and object to 3px, adjective color to 80% opacity dark pink / all the ones that are done with borders, can we do y-1 to move them down and line up with the underlines"> <style.css #94 POS, #10>
   - [S1] - `--pos-darkpink` joins the mark tokens, since dark pink is a hue the four did not cover <style.css #10> <one new token declared at the root>
   - [S2] - The six numbers change as asked: mode wash starts at 20%, a plain noun's line is fully opaque, subject/object lines are 3px, the adjective is dark pink at 80% <style.css #94> <the computed values read 0.2 / 1.0 / 3px / darkpink 0.8>
   - [S3] - The two background-drawn marks drop 1px so their lines sit level with the text-decoration ones <style.css #94> <`.pos-n` at calc(100% - 1px), subject/object at calc(100% - 2px), `.pos-m` line at 100%>





































