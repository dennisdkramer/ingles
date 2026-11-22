# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
A batch and its steps must be removed from this file when all of the batch's steps are completed. Any batch or step which is stale must be deleted.
---

# [CURRENT]
## [B16] - the roadmap is read line by line and its titles and examples are made literal and universal "sweep the roadmap one more time for any of this type of language that we dont want and update. The lesson titles should be direct, literal and explanatory, and examples should be the most important, useful, and *universally* phrases relevant to the context and concepts" <`BUSINESS-ROADMAP.md`, `business/lesson2,3,7,13` and their `lessons.json` entries, `business/BATCH-RECORD.md`>
### [S1] every title of the 50 is read against one question: does it say what the student can do?
- L21-L25 are already literal (`:206`, `:217`, `:228`, `:238`, `:248`). The remaining metaphorical headings are rewritten: **L2** "The sentence you already own" → *Word order and be: the three parts of an English sentence*; **L3** "the subject English refuses to drop" → *It and there: the subject every English sentence needs*; **L7** "get, the word that does everything" → *Gonna, wanna, woulda - and the six jobs of get*; **L13** "Verb + preposition is one word in your head" → *Verb + preposition: one meaning learned as a pair*. Every other heading is read and left when it already names the teaching point.
- A renamed title is carried through all three places at once or not at all: the roadmap heading, the page's `<h1>`, and the filename `lessons.json` reads the dropdown name from. The old filename goes in the same commit and `build-lessons --check` proves the dropdown and the `h1` agree.

### [S2] every `Examples` line carries phrases that work in any office
- The test per line: would this sentence be said, unchanged, in a company that is not this one? A phrase that only works inside one firm's vocabulary (`the two pricing APIs`, `the revenue side`) becomes the general pair that teaches the same point (`I'm the analyst who prepares the forecast`, `I work with the sales team`).
- L21's line (`:213`) is the one known to fail today; the other 49 are read against the same test before they are left alone. The `Vocabulary` lines are read with them, so a page cannot pick up a phrase its examples no longer carry.

### [S3] the ledger and the gate, on the authored lessons only
- The five L21-L25 rows in `business/BATCH-RECORD.md` are re-read against the pages as they now stand (sections, blocks, elements, `qel:`), and any row whose section list no longer matches its page is corrected in place.
- `node qa/check.mjs --track=business` and `node qa/batchcheck.mjs` in their default scope (the lessons this task touches, plus the last commit - never the track's history), `qa/rowctx.mjs`, `qa/cmcheck.mjs`, `qa/mapcheck.mjs`, `qa/liquid.mjs`, `node build-lessons.mjs --check`, and `qa/_gapfit.mjs`: no gap over 34em, every gap at least 1.3x its answer, no block narrower than its content.
