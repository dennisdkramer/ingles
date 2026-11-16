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
## [B46] - The mode-carrying-verb and substantive-phrase parser <"can you build the 'mode-carrying-verb' and 'substantive phrase' parser"; answer to my question: one pos-n span around the whole phrase, inner words unmarked> <qa/pos.mjs>
   - [S1] - The auxiliary chain survives an adverb (`not`), and be/have/do become the verb itself when no verb follows them <qa/pos.mjs> <"I do not know" → know = v; "I have a car" → have = v; "I have finished" → m; "I do the dishes" → do = v; "He does like it" → m; "He is happy" → is = v; "She is working" → m>
   - [S2] - A substantive phrase emits one `pos-n` span with nothing marked inside it: that/whether/if-clause, free relative, substantival infinitive, gerund subject <qa/pos.mjs> <"That he left surprised me" → ⟨That he left⟩ that-clause + surprised v; "What she said was true" → ⟨What she said⟩ + was v; "I told him to leave" → ⟨to leave⟩ infinitive; "Swimming is fun" → ⟨Swimming⟩ gerund>
   - [S3] - Re-run the twelve probe sentences, confirm the two preview pages' hand-written samples are untouched, commit and push <qa/pos.mjs> <all twelve read correctly; gate ✅; only qa/pos.mjs in the diff>
## [B47] - The star's opacity comes down 20% <"going back to the timeline, reduce the opacity of the star by 20%"> <style.css #97 TLN>
## [B48] - The star and the arrow shrink 30% and dim 10% <"redyce the max size by 30% and reduce the opacity of the star and the arrows by 10%"; answer: the star and the arrow both: 30px → 21px and 30.8px → 21.6px> <style.css #97 TLN>
   - [S1] - The star is 21px and floats at 70%, so its beat runs .595–.7 <style.css #97> <`.tln-star` 21px, opacity .7>
## [B49] - The anchored sentences wear page type, painted with parts of speech <"apply the normal page font style to the texts that the timelines are anchored to in the test block, then how do i call the tool that paints the parts of speech? do it on those strings"> <style.css #97 TLN; qa/pos.mjs; qa/preview-blocks.html>
   - [S1] - `.tlw-say` drops its own font shorthand so the sentence inherits the page's body type <style.css #97> <computed font-size 17px, family the page serif>
## [B50] - The legend is the class names themselves <"Below the timelines, can you remove those 4 lines and just style the class names: Noun (Subject, Object) - Mode Carrier - Verb - Adverb - Preposition - Adjective - Conjunction"> <qa/preview-blocks.html>
   - [S1] - The specimen sentence, its key, the composition line and its caption go; one legend line takes their place, each item wearing the class it names <qa/preview-blocks.html> <one row: Noun (Subject, Object) · Mode Carrier · Verb · Adverb · Preposition · Adjective · Conjunction, each painted by its own class>

   - [S2] - `pos.mjs` splits a contraction into pronoun + clitic, and knows gonna/wanna/gotta, so `I've …` is a pronoun and a mode word rather than one unplaced noun <qa/pos.mjs> <"I've been feeling sick" → I pron + 've m; "I'm gonna hit" → I pron + 'm m + gonna m; "He'll have done" → He pron + 'll m>
   - [S3] - The eight anchored sentences are rebuilt from the tagger, with `uw` on the verb group and `an` on the pinned word, so both the paint and the anchor survive <qa/preview-blocks.html> <each sentence paints its parts of speech; eight anchors still land word centre = axis left + --point>

   - [S2] - The arrow glyph is 21.6px and its breathe runs .675–.9, which is the same 10% off in both directions <style.css #97> <`.tln-end svg` 21.6px; `tln-nudge` opacities .675 and .9; base opacity .9 for reduced motion>

   - [S1] - `.tln-star` carries `opacity:.8`, which multiplies the beat's own .85–1 so the star now breathes .68–.8 <style.css #97> <one declaration; the pulse keeps its range, 20% lower>







































