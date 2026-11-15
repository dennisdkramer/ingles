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

## [B41] - Groups regrouped: pronouns, articles and demonstratives join nouns; conjunctions become a join mark <"pronouns -> nouns / conjunctions split phrase so maybe instead of tagging them as individual words we tag them in some kind of way that shows that there are two contrasted or added etc.. clauses / object can just be a daughter tag of subject and use a different color"> <style.css #94 POS; qa/pos.mjs; qa/preview-blocks.html; qa/preview-menu.html>
   - [S1] - `qa/pos.mjs`: determiners, pronouns and pronominal wh-words emit `pos-n`; `him/me/us/them/whom` also carry `pos-o`; a conjunction emits `pos-join data-rel=` instead of a class <qa/pos.mjs> <`--text` shows n for the article and the pronoun, and a relation for each conjunction>
   - [S2] - `#94` renames `.pos-fn` to `.pos-prep`, adds the object daughter (`.pos-o`) and the join marks (one per relation), on tokens <style.css #94> <`.pos-prep` wavy; `pos-o` a different colour from `pos-n`; every `data-rel` value paints>
   - [S3] - Both pages remapped from the tagger's own output <qa/preview-blocks.html #tlw; qa/preview-menu.html [65], test-bed> <no `pos-fn` left; each page shows a joined sentence and an object pronoun>





































