# PENDING — active batch plan (authored at Adherence.md [BATCHING] 3, summary and clearing at 6 and 7)

## [GUIDELINES]
- Requested changes are committed and pushed when done by default. For any changes that are not pushed, the user must be notified at Turn completion.
- Avoid rapid successive pushes when a single combined push would do — build markers, a live-site curl or a fixed sleep are tools reached for when the risk of an undetected deploy problem is real, not mandatory steps after every push.

## [HANDLING]
- Each completed `[Sn]` is marked `DONE - <date> - <which files it modified>` and triggers beginning work on the following `[Sn]` or the first `[Sn]` in the following `[Bn]`.
- Read only the `### [Bn]` batch section you are on. Don't read ahead without verifiable need or user instruction.
- An unfinished item is moved into `[PAST]` at the end of the turn, one line, newest first: `<date> — <the user's words> — <what remains>`. It is a record, not a queue: it is not read back as a mandatory step on later prompts, and its entries are not named unless asked.
- Heading depth is fixed per prompt, and every level is a real heading - never a bold line standing in for one, never a bullet:
	- `## [n]` - the Prompt line, directly under `# [CURRENT]`
	- `### [Bn]` - a batch
	- `#### [Sn]` - a step
- Author in the following format:

```markdown
## [n] <1 line summary of the user prompt; all of its batches sit beneath it> — this line is not one of the lines Adherence.md [PARSE] 1) and 2) put in the turn's first message: those are the per-element lines and the batch list.

### [Bn] <the purpose of batching its child steps - the overarching thing getting done> <the user's words it serves> <artifact produced> <exit condition> <the rule most likely to be broken in this batch, and how that would show>

#### [Sn] <the action or goal of the step> <the File & Section name of the rules which are most relevant> <any prerequisite items or actions> <exit condition>
```

# [CURRENT] Prompt - (Active batches, newest first)

## [1] Improve CONTENT_EXAMPLES.md visuals, starting with an animated tongue figure that shows the tongue travelling between two sounds

### [B1] Establish how a drawn element is declared, chosen, embedded and validated today - DONE - 2026-11-08 - read only, no edits

#### [S1] Read [VISUALS], mouthCut/plate markup, preview-visual.css, assets/README.md, overflow.mjs - DONE - 2026-11-08 - read only

#### [S2] Record the reference/selection mechanism as it exists - DONE - 2026-11-08 - read only; finding: A-J scoring had been deleted, so promotion was impossible

### [B2] Build the animated tongue figure - DONE - 2026-11-08 - qa/preview-visual.css, qa/preview-blocks.html

#### [S3] Two articulations and the path between them on the real plate - DONE - 2026-11-08

#### [S4] Animate with transform/opacity only plus a reduced-motion park - DONE - 2026-11-08; first build drew a tongue silhouette that missed the plate, replaced by tip marker + ghost + gap

### [B3] Make the figure referenceable and choosable - DONE - 2026-11-08 - CONTENT_EXAMPLES.md

#### [S5] Write the #### tonguePath entry, fits, scored control, generalisation - DONE - 2026-11-08

### [B4] Verify the figure renders, animates and holds geometry - DONE - 2026-11-08 - screenshots + harness run

#### [S6] qa/overflow.mjs against the page, screenshots inspected, harness re-run - DONE - 2026-11-08

-
### [B5] Correct the [VISUALS] rules the user struck down, then implement the phrase-level mark and POS marking - DONE - 2026-11-08 - CONTENT_EXAMPLES.md, qa/preview-visual.css, qa/preview-blocks.html, qa/pos.mjs

#### [S7] Control is now optional, CSS edits are explicitly in scope, and the paragraph enforcing the deleted score block is gone - DONE - 2026-11-08 - CONTENT_EXAMPLES.md

#### [S8] inlineMarks: eight display-only .mk-* span classes that ride on the phrase, with a page item under them - DONE - 2026-11-08 - qa/preview-visual.css, qa/preview-blocks.html

#### [S9] qa/pos.mjs: deterministic POS tagger plus markup emitter for long sentences; .pos-* underline classes with two channels (line style + colour), optional letters, one-line legend - DONE - 2026-11-08 - qa/pos.mjs, qa/preview-visual.css

#### [S10] POS section added to the preview page; the tonguePath rules and section removed instead of shipping motion that does not move - DONE - 2026-11-08 - qa/preview-blocks.html, qa/preview-visual.css
-
### [B6] Rebuild the tongue figure so the motion is real, and add parts-of-speech marking - DONE - 2026-11-08 - qa/preview-visual.css, qa/preview-blocks.html, qa/pos.mjs, CONTENT_EXAMPLES.md, qa/examples.mjs

#### [S11] tonguePath redrawn as inline SVG - the plate overlay could not be made to animate - with 44px of travel, a ghost of pose A, a walking dot, a gap arrow, and a reduced-motion/print park at pose B - DONE - 2026-11-08 - qa/preview-visual.css, qa/preview-blocks.html

#### [S12] pos.mjs corrected: auxiliary beats suffix rules, be takes a description not a verb, -ing nouns listed, verb form two words back - verified on five sentences - DONE - 2026-11-08 - qa/pos.mjs

#### [S13] duplicate item ids removed, the stale tonguePath section deleted, nav rebuilt to 13 blocks - DONE - 2026-11-08 - qa/preview-blocks.html

#### [S14] examples.mjs re-contracted to the file as it now is; the three new drafts link to their page anchors and the check verifies the ids exist - 6/6 - DONE - 2026-11-08 - qa/examples.mjs, CONTENT_EXAMPLES.md
