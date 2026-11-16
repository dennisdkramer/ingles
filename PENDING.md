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
## [B51] - The provisional timeline marks go <"those timeline marks were provisional. remove them from the test page and you can remove them from the css too unless theyre in use for something else"> <style.css #89 MARKS; qa/preview-blocks.html>
   - [S1] - `.uw` is deleted; `.an` keeps only its anchor role and paints nothing; the eight sentences lose their `uw` wrappers but keep `an` <style.css #89; qa/preview-blocks.html> <no `.uw` in the sheet or on the page; eight axes still land word centre = axis left + --point>
## [B58] - Subject and object nouns are tagged from position <"the last thing that the script needs to resolve is tagging subject and object nouns ... it will be very useful to see when a verb always requires an object noun to accompany it vs there just happens to be another noun after it"> <qa/pos.mjs>
   - [S1] - In each clause, the noun group before the first finite verb is the subject and a noun group after it is an object; they emit `pos-subj` and `pos-o`, and `--tags` says for each verb whether an object follows <qa/pos.mjs> <"I told him the truth" → I subj, him + truth objects; "She sings" → no object; "I saw it in 2019" → saw has an object, in 2019 does not>
   - [S2] - The eight sentences are re-painted from the tagger so the subject and object ramps show on the page <qa/preview-blocks.html> <anchors still land exactly; rows PASS>
## [B62] - The label mode says DO and IO <"instead of N I in the labels make direct DO and indirect IO and leave the fact that theyre nouns implicit"> <style.css #94 POS>
   - [S1] - `.pos-n.pos-o` prints `DO` and `.pos-n.pos-i` prints `IO` in `pos-labels` mode; every other noun keeps `N` <style.css #94> <labels mode prints DO and IO on the two specimens, N elsewhere>
   - [S2] - The direct object's ramp is dropped in `pos-labels` mode, since the word `DO` now carries the meaning <style.css #94> <neither object shows a line under it in labels mode>
## [B61] - The recipient takes an arrow from the direct object's side <"the arrow comes from the direction of the direct object and lands on the indirect object ... a static arrow that is not connected to the direct object is fine / the passive can wait / fix the ditransitive list"> <qa/pos.mjs; style.css #94 POS; qa/preview-blocks.html>
   - [S1] - `buy` and the other missing ditransitives join the list, so "I bought him a coat" marks him as the recipient and coat as the direct object <qa/pos.mjs> <bought him a coat → iobj him · dobj coat; the twelve earlier probes unchanged>
   - [S2] - An indirect object carries `data-side="left|right"` = the side its direct object sits on <qa/pos.mjs> <gave him the book → right; gave it to him → left>
   - [S3] - `.pos-i` paints a static arrow on that side, pointing into the recipient; no ramp (the ramp stays the direct object's) <style.css #94> <both orders show an arrow landing on the recipient; rows PASS>
   - [S4] - Two specimen lines, one per order, sit under the class legend so the arrow can be judged <qa/preview-blocks.html> <"I gave him the book." and "I gave it to him." render with arrows pointing opposite ways at the same role>
## [B60] - An empty block for the decision flow chart <"there was a flow chart vehicle that i told you to migrate over ... can you make an empty block for that on preview-menu.html and note the idea for us to work on later"> <qa/preview-menu.html>
   - [S1] - A `flow` section joins the in-block group beside `[55]`, with a note box keyed `[flow]` and an empty `.block` holding only its heading; the idea and its candidate uses are stated on the page <qa/preview-menu.html> <section present, note box binds, block renders empty at full width, rows PASS>
## [B59] - Direct and indirect objects are told apart, and a noun after a verb is not always an object <"i am leaning towards we continue building ourselves ... if you find that something is not working well, stop and give me an update"> <qa/pos.mjs>
   - [S1] - A ditransitive verb with two bare noun groups marks the first indirect and the second direct; a `to` phrase after such a verb, or a `for` phrase after a benefactive verb, is the indirect object; any other noun after the verb is oblique and is not marked at all <qa/pos.mjs> <gave the dog a bone → iobj dog · dobj bone; gave a bone to the dog → dobj bone · iobj dog; worked all day → obl, no object; walked home → obl, no object; felt sick for days → no object>




   - [S1] - `.tln-star` carries `opacity:.8`, which multiplies the beat's own .85–1 so the star now breathes .68–.8 <style.css #97> <one declaration; the pulse keeps its range, 20% lower>







































