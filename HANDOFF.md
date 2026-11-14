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

### C. Element contracts — chunked (2026-11-14): the answer key is done, the rest is here
- Done this session: `## ANSWER KEY` (`style.css:296`) states `data-a` (the `value` of the right option), `data-answer` (`|` between accepted forms), what Complete and Clear do with them (`.ans`, `.correct`), and that an item with no key is an item Complete cannot reveal. Behaviour cited from `engine2.js:246-269`; the restore path the header does not mention is `engine2.js:192-202`.
- C1 done in the CSS, one piece open: the item rule `.blanks>div{display:flex;align-items:center;gap:6px}` is deleted, so a phrase and its field now flow as ordinary text inside the item and the builder places the field with markup (`<br>` before it puts it on its own line). Four rules that only worked under that flex row went with it (`.blanks>div .ptw`, `.blanks>div input.gap`, `.blanks>div.has-ans`/`.blanks.glossdrop>div`), and `.glossdrop` itself is gone at the owner's word — its last two rules (`style.css:282-283` before the deletion) were the only ones left. Correcting an earlier claim: only the plain `.blanks` blocks were flex rows — 3 blocks in 2 pages (`adult/lesson11.html:134,143`, `business/lesson1.html:235`); `.blanks.sent`'s items were already `display:block;margin:8px 0` (`style.css:300`) with the field inline at `margin:0 .2em` (`style.css:301`), so the 321 `.blanks.sent` blocks never had the tie. Open: the header sentence naming the three containers, where a field may sit in each, and the gap's width (`--gap-w`, `style.css:161`, 9em unset) — the tag requirement in `style.css:300-301` is the only thing that makes an item a `<div>`.
- C2 partly done: `## LISTENING CHIP` (`style.css:199`, the owner's wording) and `## WORD BANK` (`style.css:183`) state both uses; `.chips > b` is one option and `.chips > span` is text in the row (italic, `style.css:185`), so `kids/lesson30.html:20`'s ten span options now read as text — turning them into `<b>` is a content decision for the owner. Still open: `--gap-w` (`style.css:161`, 382 uses); `input.gap` cannot wrap while `#feed` already uses `field-sizing:content` (`style.css:169`); a restored value is written without an `input` event (`engine2.js:201`), so any grower must re-measure on restore.
- C3 still open: `.panel` (`style.css:254`, 1079 uses, `data-kind` sets only the edge), `.card` (`style.css:74`, 285 uses, also in `index.html`), `.qline` (3001 uses, `adult/lesson20.html:44`) is in no header — `## ANSWERS` starts at `.qitem`. Decided: `fieldset` is not a block; its three rules are deleted and `## BLOCK FRAME` (`style.css:248`) forbids it.
- C4 pointers and scaffold: `style.css:184` cites `## PORTUGUESE TEXT` (the header is `## TEXT AND COLOURS`, `style.css:90`); `PEDAGOGY-MAP.md:66` cites `BLOCK WIDTH SLOTS` (`style.css:263` is `## BLOCK WIDTHS`); `style.css:4-5` defers the class vocabulary to PEDAGOGY-MAP.md while `PEDAGOGY-MAP.md:14` sends the build here; h4 is stated at `style.css:190` and `CONTENT_EXAMPLES.md:56`, not in `## PAGE SCAFFOLD`.
- Unresolved, owner's choice: "6. update it" (the h4 scaffold item) and "7. Remove that reference from style.css" (either `style.css:184` or `style.css:4-5`) were asked together; the second reading was never confirmed.
- `qa/brief.mjs` prints the two indexes separately (`--index` and `--css`); a combined `--indexes` was asked for and is not built.

### B. Open thread — let lesson generation print a pronunciation key - IGNORE - PARKED FOR NOW

**Facts.** `pronkey.js:80-85` exports `words`, `lookup`, `render`, `ready`. `load(obj)` exists at `pronkey.js:59` and is not exported. `render()` (`pronkey.js:34`) splits a key on `-` (syllables joined with `·`), wraps letters in `<b>` and elided letters in `<span class="pr-g">`, and returns the display HTML. `dictionary.json` holds 28,075 entries; **0** contain a space. The page's own lookup (`engine1.js:420-423`) takes a multi-word selection, loops its words, and uses the **first** word that has a key.

**Two ways to let a build print a key:**
1. Add `load: load` to the export list (`pronkey.js:80`), then a tool reads `dictionary.json`, evaluates `pronkey.js` against a `{window:{}}` stub and calls `PronKey.load(dict)`. Synchronous, no new dependency, one added property that pages never call.
2. Leave the engine untouched and drive it with jsdom plus a `fetch` stub. New authoring-time dependency and an async wait before the first lookup.

Recommendation: 1. Implication of 1: the shipped engine carries one more exported function, inert unless called. Implication of 2: nothing in the shipped engine changes, and the build path gains jsdom.

**Phrases — the cost.** Printing one key per word is a loop in the tool, not an engine change. Three limits stand in the way of a phrase display: the dictionary is per word (28,075 entries, none with a space); `words()` (`pronkey.js:14`) drops tokens under two characters once edge apostrophes are stripped, so `a` and `I` disappear and a phrase cannot sit 1:1 under its words; and `engine1.js:420-423` shows one key for a whole selection. A phrase therefore needs the tool to tokenise the text itself and record which tokens carry a key — layout work in the page, not engine work.



