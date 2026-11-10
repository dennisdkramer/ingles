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

## [17] - Make lesson 40 reachable, fix roadmapSpan, rewrite the pre-split rule, correct FORMAT.md's width classes
Open, not instructed, no step: "yeah we probably need to do a roadmap edit" - names no item and no target lesson, so it is asked in the reply, not acted on.
### [B1] - Close [16] and author this prompt's batches "im not seeing lesson 40 on the live site" PENDING.md [HANDLING] 13,17-20
   - [S1] - Migrate the finished [16] into PAST_BATCHES.md and clear it <PENDING [HANDLING] 13> <[CURRENT] holds only [17]>
### [B2] - Lesson 40 is not on the live site "im not seeing lesson 40 on the live site" index.html, tracks.json, <track>/track.json
   - [S1] - Find what the landing reads to decide which lessons to link <index.html, tracks.json, adult/track.json> <the count or list named, and why 40 is outside it>
   - [S2] - Apply the smallest correct fix and prove it locally <pedagogy-map 4: links are track/lesson<n>.html> <adult lesson 40 reachable from the nav>
### [B3] - roadmapSpan returns the span without blank stripping "change roadmapspan to just say the span" <qa/provenance.mjs 76-94>
   - [S1] - End the span at the line before the next heading, with no blank-line stripping <qa/provenance.mjs 76-94> <lesson 40 spans 388-397, independent of blank lines>
   - [S2] - Check the change cannot orphan the kids records already in the ledger <KIDS-ROADMAP.md 30, 31 spans> <each either unchanged or named as now stale>
   - [S3] - Run the harness selftest if one exists <qa/provenance.mjs --selftest> <green, or the exact red>
### [B4] - Re-record adult/40 against the new span <PEDAGOGY-MAP [GENERATION] 5 (26-31)>
   - [S1] - Append the record with range 388-397, then re-run lang and provenance for adult 40 <PEDAGOGY-MAP [GENERATION] 5> <both green>
### [B5] - Rewrite the pre-split rule in TOOL DISCIPLINE "lets update .clinerules rule 5" <.clinerules/.clinerules.md 3-13>
   - [S1] - Check no other file refers to these bullets by number, since the list is unnumbered <*.md, .clinerules> <no numbered reference exists to break>
   - [S2] - Write the pre-split bullet beside the command-output bullet <".clinerules/.clinerules.md" 5> <a large write is split before the first send, not after a refusal>
### [B6] - Name the half and third widths in FORMAT.md and drop .grid3 "correct it and name the 1/3 and 1/2 width options with a concise note" <FORMAT.md 38>
   - [S1] - Replace .grid3 with .itemsize-third and .itemsize-half plus the compare/contrast note <FORMAT.md 38> <no class is named that style.css does not implement>
### [B7] - Commit and push, then confirm the live page "im not seeing lesson 40 on the live site" <PENDING [GUIDELINES] 1-2>
   - [S1] - Stage, commit, push, and check what the deploy serves for lesson 40 <PENDING [GUIDELINES] 5> <live page reachable, or the build state reported> 




