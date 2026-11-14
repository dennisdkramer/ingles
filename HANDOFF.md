# HANDOFF — context handoffs between sessions
Write here when a session ends mid-work, or when a task handoff is requested. If a handoff is requested while  '## 2. Active Handoff' contains text, append the new handoff and inform the user of the prior contents.

## 1 Last change tag
_(Cleared 2026-11-04 at the owner's request.)_

## 2 Active Handoff 

_2026-11-13, mid-planning. Owner has updated `.clinerules/.clinerules.md` and is restarting VS Code before the next task. Three threads: A is the next task, B is planning only, C is resolved._

### A. Next task — strip vehicle-specific instructions out of `style.css`

**Owner's words:** "getting to the task of stripping specific vehicle instructions out of style.css and putting them into their vehicle or just deleting them if theyre redundant to whatever will naturally be executed by applying the markup. Then clean up inputs in pedagogy-map.md - reference js brief for style.css and content_example headers instead of file inputs?"

**Headers present at handoff** (`Select-String -Path style.css -Pattern '^/\* ## '`):
- `style.css:90` TEXT AND COLOURS
- `style.css:133` CONTROLS — NOT LESSON-FACING
- `style.css:178` TEACHING DISPLAYS
- `style.css:215` AUDIO PLAYER — line 1 is the owner's own sentence (`figure.vz-play` → `<script src="../qa/player.js">` in the `_shell.html` slot) and names no vehicle; `Build it:` is gone. Still to strip: the tag tree at 216-223, which duplicates the markup in `CONTENT_EXAMPLES.md` `[02]`/`[03]`; the `.is-enhanced` / `qa/player.js` runtime sentence at 224-226, which describes engine behaviour rather than the block; and the `[03]` sentence at 223.
- `style.css:265` BLOCK FRAME — "the only shape label a build writes"
- `style.css:275` BLOCK WIDTHS
- `style.css:306` REFLOW
- `style.css:307` ANSWERS — "HOW AN ANSWER IS SAVED … never author one": the save contract is engine behaviour plus the entry
- `style.css:326` PAGE SCAFFOLD
- `style.css:446` LANDING AND TEACHER — NOT LESSON-FACING
- `style.css:843` GAMES — keep the `<script src="../engine4.js">` include (that is the mandate); the KNOBS line describes `engine4.js` behaviour

**Open decisions this task must resolve:**
- Header index: a contiguous block at the top of `style.css`, or `brief.mjs --css` printing `style.css:LINE  ## text` read from the file. A stored index with line numbers is wrong after the next insert; the printer holds no stored copy.
- A check (`qa/css.mjs`) asserting that no `## ` header line names an entry `[NN]` or addresses a build. Proposed, not approved.
- `FILESYSTEM.md:3` still describes these headers as "the lesson-facing contract in words: page order, classes, markup, appearance". That sentence is the permission the strip removes; change it in the same batch.

**Verification available:** `style.css` braces 914/914; 1368 CRLF, 0 LF-only; `node qa/examples.mjs` 8/8 (66 entries, `[02]`–`[67]`). No CSS check exists.

### B. Open thread — let lesson generation print a pronunciation key

**Facts.** `pronkey.js:80-85` exports `words`, `lookup`, `render`, `ready`. `load(obj)` exists at `pronkey.js:59` and is not exported. `render()` (`pronkey.js:34`) splits a key on `-` (syllables joined with `·`), wraps letters in `<b>` and elided letters in `<span class="pr-g">`, and returns the display HTML. `dictionary.json` holds 28,075 entries; **0** contain a space. The page's own lookup (`engine1.js:420-423`) takes a multi-word selection, loops its words, and uses the **first** word that has a key.

**Two ways to let a build print a key:**
1. Add `load: load` to the export list (`pronkey.js:80`), then a tool reads `dictionary.json`, evaluates `pronkey.js` against a `{window:{}}` stub and calls `PronKey.load(dict)`. Synchronous, no new dependency, one added property that pages never call.
2. Leave the engine untouched and drive it with jsdom plus a `fetch` stub. New authoring-time dependency and an async wait before the first lookup.

Recommendation: 1. Implication of 1: the shipped engine carries one more exported function, inert unless called. Implication of 2: nothing in the shipped engine changes, and the build path gains jsdom.

**Phrases — the cost.** Printing one key per word is a loop in the tool, not an engine change. Three limits stand in the way of a phrase display: the dictionary is per word (28,075 entries, none with a space); `words()` (`pronkey.js:14`) drops tokens under two characters once edge apostrophes are stripped, so `a` and `I` disappear and a phrase cannot sit 1:1 under its words; and `engine1.js:420-423` shows one key for a whole selection. A phrase therefore needs the tool to tokenise the text itself and record which tokens carry a key — layout work in the page, not engine work.



