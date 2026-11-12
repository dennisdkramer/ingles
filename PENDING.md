# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
`   - [Sn] - <the distinct goal unique to this step> <the File & Section name of the rules which are most relevant> <exit condition>`

- For any [change in plans] or [deviation from the batching/order in pending.md], update any relevant [Bn] and/or [Sn]] to reflect the change(s)
- When a step or batch is finished, dropped, or stale, it is deleted.
- **This file is edited in place, never rewritten**: an edit anchors on the `[CURRENT]` batches only. `# [HANDLING]` and `# [CURRENT]` are the file's spine — an edit whose `old_text` spans or replaces them has destroyed the authoring format, which is how it was lost once.

# [CURRENT]

## [B3] - the transcript is the real cost and 68% of it is tool output <"the context should NOT include all your file edits and prose"> <a habit that shrinks each remembered result at its source>
   - [S1] - shrink results before they are remembered: 298,398 of 437,296 live chars are `tool_result`, and a result is now remembered whole up to 50,000 chars (`CLINE_MESSAGE_BUILDER_MAX_TOOL_RESULT_CHARS` raised from its 8,000 default, so what is shown and what is remembered no longer diverge), which makes the volume breadth — unfiltered greps, whole-file dumps, re-runs after a torn read; filter inside the command and print the count when the list is not needed <the live transcript in `~/.cline/data/sessions/<id>/<id>.messages.json`> <a later long task measures below 68% on its session file>
   - [S2] - keep state on disk rather than in context: `PENDING.md` already carries the plan across resets, which is why a finished batch can be deleted — extend that to any fact re-derivable by reading a file <`PENDING.md` [HANDLING] item 5> <no fact is carried in conversation that a file can be re-read for>
