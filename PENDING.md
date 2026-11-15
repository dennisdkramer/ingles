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

## [B43] - Each group gets its own visual: purple for mode and verbs, teal for adjectives, a teal-to-pale-blue noun ramp, pink wavy prepositions <"mode uses the background technique, draws an 80% opacity purple 1px underline and then gradient background behind the bottom of the word.. from 30% at the underline to 0% opacity at the top. normal verbs use a 2px 80% dotted line of the same color. adjectives have a 60% opacity 2px teal underline. subject nouns have 2px underline that goes from 100% opacity teal to 60% opacity pale blue, object nouns reverse the gradient, and other nouns, articles and demonstratives just get the 60% opacity pale blue underline. prepositions can get a wavy pinkish purple 50% opacity underline"> <style.css #94 POS>
   - [S1] - The four mark colours become tokens at the root, so a hue is changed in one line <style.css #10> <`--pos-purple --pos-teal --pos-pale --pos-pink` declared once>
   - [S2] - Each group's line is written to the spec: mode a 1px purple 80% line plus a 30%→0% wash behind the word, verbs 2px dotted purple 80%, adjectives 2px teal 60%, prepositions wavy pink 50%, nouns a 2px pale-blue 60% line with the teal ramp for subject and object <style.css #94> <the five computed decorations and the two gradients match the numbers in the request>





































