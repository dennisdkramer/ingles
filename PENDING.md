# PENDING — Adherence.md [BATCHING] for current task

## [GUIDELINES]
- Requested changes are committed and pushed when done by default. For any changes that are not pushed, the user must be notified at Turn completion.
- Avoid rapid successive pushes when a single combined push would do — build markers, a live-site curl or a fixed sleep are tools reached for when the risk of an undetected deploy problem is real, not mandatory steps after every push.


## [HANDLING]
- For each completed [Sn], replace `[Sn]` with `[Sn] DONE - <date> - <which files it modified>` and begin work on the following `[Sn]` or the first `[Sn]` in the following `[Bn]`.
- For each completed [Bn] (or when all [Sn] within it are marked `DONE` and/or `STALE`, replace `[Bn]` with `[Bn]- DONE`.
- For any [n], [Bn], or [Sn] that no longer conforms to the current plan or user intent, or is otherwise judged as stale, it is marked `STALE`.
- At the start of each turn when its batches are written, any [n],[Bn],and or [Sn] remaining in [CURRENT] are read. For each that is not marked `DONE` or `STALE`, it is presented to the user as a choice to a) merge with current turn's batches, b) migrate to PAST_BATCHES.md, or c) delete.
- When all [Bn] within any [n] are [completed and/or marked `DONE` and/or `STALE`], all content within section [n] is cleared, and [n] is migrated and appended to PAST_BATCHES.md.
- For any [change in plans] or [deviation from the batching/order in pending.md] You must - Update any relevant [[n] and/or [Bn] and/or [Sn]] to reflect the change(s) and add `- UPDATED <The user's original plan for that item><Why the change occurred>` to each of them.
- Read only the active `### [Bn]` batch section unless [its completion] or [user instruction] mandates reading its siblings.

Author ([n]=(Prompt], [Bn]=(Batch),[Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [n] - <1 line summary of user prompt>` 
`### [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
`   - [Sn] - <the distinct goal unique to this step> <the File & Section name of the rules which are most relevant> <exit condition>`

# [CURRENT] Prompt - (Active batches, newest first)

## [24] - Raise the level floor, install register-over-every-string, add the authority order and a two-thirds slot, and make Complete reveal the keys
### [B1] - Take [23] out of [CURRENT] "ok well the problem is that we are going to try to teach reduced speech very early on" PENDING.md [HANDLING] 13 DONE - 2026-10-11 - PENDING.md, PAST_BATCHES.md
   - [S1] - Delete the finished [23] block; its summary is in PAST_BATCHES.md <PENDING.md> <[CURRENT] holds only [24]> DONE
### [B2] - Raise the level floor and move difficulty into concepts and training "The lesson needs to be content level at LEAST = lesson level" <PEDAGOGY-MAP.md [LEVEL]> DONE - 2026-10-11 - PEDAGOGY-MAP.md
   - [S1] - t) a floor not a +-5 band; v) the four demands; w) difficulty in concepts and training <PEDAGOGY-MAP.md 89-93> DONE
### [B3] - Make the register govern every string "I want the whole content written in the correct register" <PEDAGOGY-MAP.md, ADULT-REGISTER.md> DONE - 2026-10-11 - PEDAGOGY-MAP.md, ADULT-REGISTER.md
   - [S1] - x)/y)/z) under a new [Register] heading <PEDAGOGY-MAP.md 95-98> DONE
   - [S2] - Every string, the per-string test, Portuguese is the teacher voice <ADULT-REGISTER.md 21-23> DONE
### [B4] - Add the authority list "how do we express this in the file? we dont currently have an authority list" <PEDAGOGY-MAP.md 1-6> DONE - 2026-10-11 - PEDAGOGY-MAP.md
   - [S1] - Precedence order plus reading-order-is-not-precedence <PEDAGOGY-MAP.md 5-6> DONE
### [B5] - Add the two-thirds slot and rewrite e) "maybe we need a 2/3 width option too" <style.css, FORMAT.md> DONE - 2026-10-11 - style.css, FORMAT.md
   - [S1] - .itemsize-twothird and the paired third <style.css 208-211> <a paired third is 395px, so 395+791+14 = 1200> DONE
   - [S2] - (a) four widths; line 38 names the pairing <FORMAT.md 38, 47> DONE
   - [S3] - e) as pair -> measure -> never pad <FORMAT.md 51-55> DONE
### [B6] - Answer whether register.mjs is register-neutral "so it checks against whatever the register should have" <qa/register.mjs> DONE - 2026-10-11 - none
   - [S1] - Read its mechanism <qa/register.mjs 37-54> <no: three hardcoded regexes and a track map whose comment was already false> DONE
### [B7] - Take content-example sample text out of precedence "i dont think the content examples sample text needs to have ANY precedence" <PEDAGOGY-MAP.md 5, 57> DONE - 2026-10-11 - PEDAGOGY-MAP.md
   - [S1] - Dropped from the order; the vehicle is borrowed, the content is written for this lesson <PEDAGOGY-MAP.md 5, 57> DONE
### [B8] - Complete reveals the key and locks, Clear empties and unlocks "i want the revealed answers to be below the input fields" <engine2.js, style.css, FORMAT.md> DONE - 2026-10-11 - engine2.js, style.css, FORMAT.md
   - [S1] - ansKeyText + applyCompleted, called from renderCompleteBtn; the wipe empties and unlocks <engine2.js 237-275, 337-341> DONE
   - [S2] - .ans under the field, .has-ans wraps the row, label.correct greens <style.css 228-231> DONE
   - [S3] - data-answer and the item-number convention documented <FORMAT.md 36-37> DONE
   - [S4] - The real function exercised against a keyed DOM, 10/10 <qa/_reveal.tmp.mjs, deleted after the run> DONE
### [B9] - Make register.mjs test the track own tells "2 tells the checker what exactly?" <qa/register.mjs, ADULT-REGISTER.md> DONE - 2026-10-11 - qa/register.mjs, ADULT-REGISTER.md
   - [S1] - A Tells block in the register file <ADULT-REGISTER.md 26-31> DONE
   - [S2] - The harness parses it; owes is true only when a block declares a floor <qa/register.mjs 49-72, 112-115> DONE
   - [S3] - Ran it: adult/40 flagged mate flat queue lift; --all is 19 warnings 0 fails <qa/register.mjs> DONE
### [B10] - Let a justified gloss leave the PT band "the register.mjs and lang.mjs changes" <qa/lang.mjs, FORMAT.md> DONE - 2026-10-11 - qa/lang.mjs, FORMAT.md
   - [S1] - data-why removes an element from the share and the denominator <qa/lang.mjs 99-106, 129, 156> DONE
   - [S2] - No page carries data-why yet, so the change is a no-op on the 102 existing pages <grep data-why = 0> DONE
### [B11] - Make the tells a real vocabulary floor "i think we want a much longer list of swears and street words if we're gonna say the track needs them, and 'fricking' isnt taboo" <ADULT-REGISTER.md, qa/register.mjs> DONE - 2026-10-11 - ADULT-REGISTER.md, qa/register.mjs
   - [S1] - Lists by domain: profanity, police, money, drugs, people, approval, violence, AAVE and reductions, bedroom, formal, locale <ADULT-REGISTER.md 26-42> <218 street items>
   - [S2] - Euphemisms out of MASKED: freaking, fricking and shoot are a costume, not evidence <qa/register.mjs 46-49> DONE
   - [S3] - A repeated key accumulates; sexual is a third presence category alongside taboo and street <qa/register.mjs 58-83, 115-127> DONE
   - [S4] - False-positive audit over all 23 adult pages, then fixed the list: fam matched "familia", plus loud, broke, fly, twelve, bread, za, drank, cap, facts, beef, scrap, jumped <ADULT-REGISTER.md 31-36> <24 distinct markers remain and every one is genuine> DONE
   - [S5] - Coverage measured, and it is the finding: adult is taboo 43%, colloquial 39%, bedroom 9% <qa/register.mjs --track=adult> <the corpus is the gap, not the list> DONE

