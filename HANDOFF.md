# HANDOFF — context handoffs between sessions
Write here when a session ends mid-work, or when a task handoff is requested. If a handoff is requested while  '## 2. Active Handoff' contains text, append the new handoff and inform the user of the prior contents.

## 1 Last change tag
_(Cleared 2026-11-04 at the owner's request.)_

## 2 Active Handoff 


### A. `style.css` headers — the strip and the index are done (2026-11-14); two pointers left for the owner
- Stripped: AUDIO PLAYER keeps only the owner sentence (tag tree, the `qa/player.js` runtime sentence and the `[03]` line gone); BLOCK FRAME drops "the only shape label a build writes"; ANSWERS drops the "HOW AN ANSWER IS SAVED" narrative and keeps the `a<sec><block><item>` contract; PAGE SCAFFOLD keeps the heading rule with no vehicle clause; LANDING AND TEACHER and CONTROLS drop "confirm and stop" / "read this span only to confirm"; GAMES keeps the `engine4.js` include and drops the KNOBS line, which duplicates `engine4.js:16-27`.
- `node qa/brief.mjs --css` prints `style.css:LINE  ## text` read from the file (11 headers, one line each); the brief's step 5 prints the same scan; `PEDAGOGY-MAP.md:14` ([I/O] 7) names the command.
- Open, owner's call: `FILESYSTEM.md:3` still calls these headers "the lesson-facing contract in words: page order, classes, markup, appearance".
- Open, stale pointer found while confirming the names: `PEDAGOGY-MAP.md:66` cites `/* ## BLOCK WIDTH SLOTS`, a header that does not exist (the file has `## BLOCK WIDTHS`, `style.css:263`).

### B. Open thread — let lesson generation print a pronunciation key - IGNORE - PARKED FOR NOW

**Facts.** `pronkey.js:80-85` exports `words`, `lookup`, `render`, `ready`. `load(obj)` exists at `pronkey.js:59` and is not exported. `render()` (`pronkey.js:34`) splits a key on `-` (syllables joined with `·`), wraps letters in `<b>` and elided letters in `<span class="pr-g">`, and returns the display HTML. `dictionary.json` holds 28,075 entries; **0** contain a space. The page's own lookup (`engine1.js:420-423`) takes a multi-word selection, loops its words, and uses the **first** word that has a key.

**Two ways to let a build print a key:**
1. Add `load: load` to the export list (`pronkey.js:80`), then a tool reads `dictionary.json`, evaluates `pronkey.js` against a `{window:{}}` stub and calls `PronKey.load(dict)`. Synchronous, no new dependency, one added property that pages never call.
2. Leave the engine untouched and drive it with jsdom plus a `fetch` stub. New authoring-time dependency and an async wait before the first lookup.

Recommendation: 1. Implication of 1: the shipped engine carries one more exported function, inert unless called. Implication of 2: nothing in the shipped engine changes, and the build path gains jsdom.

**Phrases — the cost.** Printing one key per word is a loop in the tool, not an engine change. Three limits stand in the way of a phrase display: the dictionary is per word (28,075 entries, none with a space); `words()` (`pronkey.js:14`) drops tokens under two characters once edge apostrophes are stripped, so `a` and `I` disappear and a phrase cannot sit 1:1 under its words; and `engine1.js:420-423` shows one key for a whole selection. A phrase therefore needs the tool to tokenise the text itself and record which tokens carry a key — layout work in the page, not engine work.



