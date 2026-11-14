# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
`   - [Sn] - <the distinct goal unique to this step> <the File & Section name of the rules which are most relevant> <exit condition>`

- For any [change in plans] or [deviation from the batching/order in pending.md], update any relevant [Bn] and/or [Sn]] to reflect the change(s)
- When a step or batch is finished, dropped, or stale, it is deleted.
- **This file is edited in place, never rewritten**: an edit anchors on the `[CURRENT]` batches only. `# [HANDLING]` and `# [CURRENT]` are the file's spine — an edit whose `old_text` spans or replaces them has destroyed the authoring format, which is how it was lost once.

# [CURRENT]

## [B1] - The audio pipeline closed out: the CSS header says only what the owner wrote, a cue shift can be rebuilt from a command, and the remaining pipeline gaps are named «"you can build the --cue-shift" · "tell me if there is anything else missing"» qa/AUDIO.md + qa/audio.mjs + the audit below
   - [S1] - `## AUDIO PLAYER` carries the owner sentence and names no vehicle .clinerules 9 (wording unsoftened) the header reads the owner line and no `[02]`/`[03]` appears in it
   - [S2] - `--cue-shift=<s>` moves every `data-t` and touches no audio; Wrecking Ball rebuilt from the local master so the page matches one command rule 8 (tight QA) 1.012/5.362/8.992/13.012 printed at 18.85 s, and the demo and the provenance row carry the flag
   - [S3] - audit the generation pipeline minus pronkey and say what is missing .clinerules 15 (what the user must know or decide) a list, every item with path:line, nothing executed

## [B2] - The block and class contracts state their use and stop deciding layout «\"the styling is supposed to be the minimum necessary to help the model with formatting ... it is not supposed to DECIDE formatting\"» style.css `## ` headers + HANDOFF.md §C
   - [S2] - every rule the builder can reach states its use: `.blank` and `.prep` `## ANSWERS` / `## TEXT AND COLOURS` `node qa/brief.mjs --css` prints a use for each and no named class is left without one
   - [S3] - a block reads as one frame: `.card` and `.panel` either merge into one rule set or keep two stated roles, and `data-kind` shows on whichever is a block `## BLOCK FRAME` `node qa/brief.mjs --css` prints a block contract that is true of every `.card` and `.panel` in the tree (owner decides which way)
   - [S4] - one authority for the class vocabulary: `style.css:4-5` stops deferring it to PEDAGOGY-MAP.md while `PEDAGOGY-MAP.md:14` sends the build to these headers `style.css:2-8`, `PEDAGOGY-MAP.md:14` the note and the map name the same owner and no stale `## ` name is left in the tree
   - [S5] - `qa/brief.mjs` prints the indexes on request `qa/brief.mjs` usage `--indexes` prints both scans in one run and the usage line names it
