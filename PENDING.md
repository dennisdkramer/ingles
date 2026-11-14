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
   - [S1] - the header names the three `.blanks` containers and where a field may sit in each (the flex item rule is gone) `## ANSWERS` `node qa/brief.mjs --css` prints a line naming `.blanks`, `.blanks.sent` and `.blanks.cols` and the field placement each allows
   - [S2] - every rule the builder can reach states its use: `--gap-w` and the field that grows to its text, `.blank`, `.prep` `## TEXT AND COLOURS` / `## ANSWERS` `node qa/brief.mjs --css` prints a use for each and no named class is left without one
   - [S3] - one block contract covers `.panel` and `.card`, and `.qline` joins the item shape `## BLOCK FRAME` / `## ANSWERS` a new block is written from the header alone, whichever of the two it is
   - [S4] - every pointer names a header that exists and h4 is stated as an optional scaffold item `style.css:184`, `style.css:4-5`, `PEDAGOGY-MAP.md:66`, `## PAGE SCAFFOLD` no `## ` citation in the tree names a header the scan does not print
   - [S5] - `qa/brief.mjs` prints the indexes on request `qa/brief.mjs` usage `--indexes` prints both scans in one run and the usage line names it
