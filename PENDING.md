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

# [PAST] Prompts  
