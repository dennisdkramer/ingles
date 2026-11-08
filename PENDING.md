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

## [1] Wire the repo for kids lesson generation: the three edits the user named, then commit and push — "yes, change all references to lessonNN.html to lesson<N>.html / clear out the status file / put engine4.js in the shells input list / then commit and push"

### [B1] Make the filename convention, the status file and the input list true across the repo, then land the work on origin [PEDAGOGY-MAP.md], [STATUS.md] — artifact: PEDAGOGY-MAP.md + STATUS.md on origin/main — exit: zero `lessonNN.html` references, STATUS.md carrying no stale state, `engine4.js` as an input-list item, `origin/main..HEAD` empty, tree clean — the rule at risk: a staged commit carrying files the request never named, showing as a commit message that describes three files while the commit contains eight

#### [S1] Rewrite every `lessonNN.html` reference to `lesson<N>.html` and confirm none remain [PEDAGOGY-MAP.md line 7 Output] — DONE - 2026-11-08 - PEDAGOGY-MAP.md (verified: `lessonNN` occurrences 0, `lesson<N>.html` present only there)

#### [S2] Clear the stale state section from STATUS.md and keep the live parameters [STATUS.md] — DONE - 2026-11-08 - STATUS.md (9 lines, state section gone)

#### [S3] Add `engine4.js` to the as-needed shells input list, commit and push [PEDAGOGY-MAP.md line 11 inputs] — DONE - 2026-11-08 - PEDAGOGY-MAP.md (`d)`, with PAST_BATCHES re-lettered `e)`), commit 3efd2b6, origin/main

## [PAST]

- 2026-11-08 — "i still dont see a tongue animation so get back to work on those items, especially the parts of speech labeling ... relatively subtle and not take up space" — remains: the tongue figure still measures as motionless (frame comparison A/B byte-identical), so the travel has never been shown to work; and `qa/pos.mjs` plus the `.pos-*` marks are in `edb72bc` but the generator's repair pass was never re-verified after its bug fix

