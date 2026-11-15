# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
`   - [Sn] - <the distinct goal unique to this step> <the File & Section name of the rules which are most relevant> <exit condition>`

- For any [change in plans] or [deviation from the batching/order in pending.md], update any relevant [Bn] and/or [Sn]] to reflect the change(s)
- Execute one step per turn. When a step or batch is finished, dropped, skipped, or stale, it is deleted. A task ends with this file empty.
- **This file is edited in place, never rewritten**: an edit anchors on the `[CURRENT]` batches only. `# [HANDLING]` and `# [CURRENT]` are the file's spine.

# [CURRENT]

## [B4] - Both reading supports wired and pointed at for the builder <"wire up the portuguese gloss css option ... the ruby one is for english pronunciation - get them both wired up and give pointers to the builder"> <style.css #91/#92, preview.html §7, CONTENT_EXAMPLES.md [VISUALS]>
   - [S1] - The gloss opens beside its word: .glossbtn/.defcard leave `u` for a last layer and the popover takes its invoker as anchor <style.css #91, #99; FUNCTION.md [SITE]> <a real Chrome click puts the card against the button, not at the viewport centre>
   - [S2] - The key is legible over the word: rt at .85em sans, ruby-position over <style.css #92; CONTENT_EXAMPLES.md [67]> <computed rt ≥14px and the line box grows for it, nothing clipped>
   - [S3] - The demo divides them by job: a key in `rt`, a meaning behind the click <preview.html §7> <no Portuguese meaning inside an rt; one id per card>
   - [S4] - Pointers in the two places the builder reads <CONTENT_EXAMPLES.md [VISUALS]; style.css #91/#92> <`node qa/brief.mjs --css` prints both headers, and the [VISUALS] bullet states the literal≠use rule>
   - [S5] - Verify, commit, push <measure.mjs; qa/run.mjs check; .clinerules 8> <rows 0 ragged, gate ✅, pushed>

## [B3] - Lesson 30 authored on the adult track <"Generate lesson 30 on the adult track following pedagogy-map.md"> <adult/lesson30-Can You Manage — Ability, Favours, and Getting Away With It.html, lessons.json>
   - [S3] - Author §3-§7 (the frame and §1-§2 exist): every control is `class="gap" data-answer=` with no inherited `name` scheme, every bracket states a meaning, each row's sizes sum to 12 <ADULT-ROADMAP [30]; preview.css #50, #52, #53, #60, #61, #63, #64> <all 3 example lines and all 5 quoted vocabulary items appear verbatim; no control carries an attribute no allowed input declares>
   - [S4] - Run the gate and fix every fail <qa/check.mjs; preview.css #60, #76> <✅ adult/lesson30, items at or above `need`, zero fails>
   - [S5] - Run `npm run build:lessons`, measure the page's rows, commit and push <build-lessons.mjs; generation/checks/measure.mjs; .clinerules 8> <lessons.json lists n=30, 0 ragged rows on the page, pushed>




