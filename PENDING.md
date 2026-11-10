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

## [23] - Score five live pages, make the register govern every string, and audit what QA has been enforcing
### [B1] - Close [22] and author this prompt's batches "Apply that grading system to 5 random live pages" PENDING.md [HANDLING] 13,17-20 DONE - 2026-10-11 - PAST_BATCHES.md, PENDING.md
   - [S1] - Migrate the finished [22] into PAST_BATCHES.md and clear it <PENDING [HANDLING] 13> <[CURRENT] holds only [23]> DONE
### [B2] - Delete adult/40's stale records "just delete it now if youre gonna keep asking me about the rewrite" <provenance.jsonl> DONE - 2026-10-11 - provenance.jsonl
   - [S1] - Drop every adult/40 line, then report what the harness says for that page <provenance.jsonl, qa/provenance.mjs> <16 lines -> 12, all JSON valid; the page is now "no provenance record ... before the first line"> DONE
### [B3] - Put the precedence line into [AUTHORING] "5. good, put it in" <PEDAGOGY-MAP.md 54-55> DONE - 2026-10-11 - PEDAGOGY-MAP.md
   - [S1] - Insert it as the section preamble, before a)-n) <PEDAGOGY-MAP.md> <line 55, register wins over roadmap items> DONE
### [B4] - Score five random live pages "Apply that grading system to 5 random live pages and tell me what scores they get as a test" <PEDAGOGY-MAP.md [LEVEL] v, lessons.json> DONE - 2026-10-11 - none
   - [S1] - Draw five pages at random and outline each <lessons.json, <track>/lesson<N>.html> <business/14, kids/23, business/12, business/38, adult/21> DONE
   - [S2] - Score each against the four demands <PEDAGOGY-MAP.md [LEVEL] v> <30/10/17/41/23 against bands 9-19/18-28/7-17/33-43/16-26> DONE
### [B5] - Make the register govern every string and be applied "I want the whole content written in the correct register" <ADULT-REGISTER.md, PEDAGOGY-MAP.md [AUTHORING]> DONE - 2026-10-11 - none
   - [S1] - Draft the rule covering headings, explanations, stems, options, notes <PEDAGOGY-MAP.md> <two lines, register-neutral, awaiting sign-off> DONE
   - [S2] - Split the mechanical floor from the author's applied comparison <ADULT-REGISTER.md> <tripwires floor it, the persona question decides it> DONE
### [B6] - Answer the input-reordering question "roadmap adherence is... the LEAST important factor. What do you think about that?" <PEDAGOGY-MAP.md> DONE - 2026-10-11 - none
   - [S1] - Give the order I would defend, and what breaks when roadmap items drop <PEDAGOGY-MAP.md> <read order and authority order are two different orders; items demote, position does not> DONE
### [B7] - Audit QA for rules that belong in generation "i think there are other cases of this problem" <qa/*.mjs> DONE - 2026-10-11 - none
   - [S1] - Read each harness's stated purpose and list what it enforces that is really guidance <qa/register.mjs, qa/lang.mjs, qa/content.mjs> <lang.mjs's PT band, register.mjs's presence count, content.mjs's disclaimed widths; also data-move/data-recalls are lesson-40-only> DONE




