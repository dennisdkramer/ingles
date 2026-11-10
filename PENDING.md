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

## [24] - Raise the level floor, install register-governs-every-string, and give the widths a two-thirds slot
### [B1] - Take [23] out of [CURRENT] "ok well the problem is that we are going to try to teach reduced speech very early on" PENDING.md [HANDLING] 13
   - [S1] - Delete the finished [23] block; its summary is already in PAST_BATCHES.md <PENDING.md, PAST_BATCHES.md> <[CURRENT] holds only [24]>
### [B2] - Raise the level floor and move difficulty into concepts and training "The lesson needs to be content level at LEAST = lesson level" <PEDAGOGY-MAP.md [LEVEL] 87-93>
   - [S1] - t) becomes a floor, not a +-5 band; v) scores the four demands; w) puts the difficulty in concepts and training, never in prose or one-word options <PEDAGOGY-MAP.md> <installed>
### [B3] - Make the register govern every string "I want the whole content written in the correct register" <PEDAGOGY-MAP.md [AUTHORING], ADULT-REGISTER.md>
   - [S1] - x)/y)/z) under a new [Register] heading <PEDAGOGY-MAP.md 95-98> <installed>
   - [S2] - Three bullets: every string, the per-string test, Portuguese is the teacher's voice <ADULT-REGISTER.md 21-23> <installed>
### [B4] - Add the authority list "how do we express this in the file? we dont currently have an authority list" <PEDAGOGY-MAP.md 1-6>
   - [S1] - Precedence order plus the reading-order-is-not-precedence clause, at the top of the Contract <PEDAGOGY-MAP.md 5-6> <installed>
### [B5] - Add the two-thirds slot and rewrite e) "maybe we need a 2/3 width option too" <style.css, FORMAT.md>
   - [S1] - .itemsize-twothird and the paired third <style.css 208-211> <a paired third is 395px, so 395+791+14 = 1200; the lone third stays 391>
   - [S2] - (a) now four widths; line 38 names the third+two-thirds pairing <FORMAT.md 38, 47> <installed>
   - [S3] - e) rewritten as pair -> measure -> never pad <FORMAT.md 51> <installed>
### [B6] - Answer whether register.mjs is register-neutral "so it checks against whatever the register should have" <qa/register.mjs>
   - [S1] - Read its mechanism <qa/register.mjs 39-48> <no: three hardcoded regexes and a hardcoded track map whose comment is already false>

