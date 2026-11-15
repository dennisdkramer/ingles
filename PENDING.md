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

## [B40] - The word classes split the verb into "verb" and "mode", six classes <"id like to differentiate between non-mode-carrying verb (incl. do, have) and 'mode' carrying (can, would, do/have/gonna as verb tenses)"> <style.css #94 POS; qa/pos.mjs; qa/preview-blocks.html; qa/preview-menu.html>
   - [S1] - `#94` gains `.pos-m`: the word that carries the mode/tense (be, have, do as auxiliaries, and every modal), on the thickness channel so six classes stay separable <style.css #94> <six classes render; `.pos-m` and `.pos-v` differ by line style, `.pos-n` by thickness>
   - [S2] - `qa/pos.mjs` emits `pos-m` for an auxiliary or modal used as one, `pos-v` for a lexical verb, and states the limitation that a be/have/do used as the main verb is tagged from the lexicon alone <qa/pos.mjs> <`--tags` names mode; a main-verb `have` is flagged in the header as the known miss>
   - [S3] - Both pages show a mode word in the specimen and the key <qa/preview-blocks.html #tlw; qa/preview-menu.html [65]> <each page has a pos-m word with a key item naming it>





































