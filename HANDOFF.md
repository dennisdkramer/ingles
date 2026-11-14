# HANDOFF — context handoffs between sessions
Write here when a session ends mid-work, or when a task handoff is requested. If a handoff is requested while  '## 2. Active Handoff' contains text, append the new handoff and inform the user of the prior contents.

## 1 Last change tag
_(Cleared 2026-11-04 at the owner's request.)_

## 2 Active Handoff 


### A. `style.css` headers — the strip and the index are done (2026-11-14); two pointers left for the owner
- Stripped: AUDIO PLAYER keeps only the owner sentence (tag tree, the `qa/player.js` runtime sentence and the `[03]` line gone); BLOCK FRAME drops "the only shape label a build writes"; ANSWERS drops the "HOW AN ANSWER IS SAVED" narrative and keeps the `a<sec><block><item>` contract; PAGE SCAFFOLD keeps the heading rule with no vehicle clause; LANDING AND TEACHER and CONTROLS drop "confirm and stop" / "read this span only to confirm"; GAMES keeps the `engine4.js` include and drops the KNOBS line, which duplicates `engine4.js:16-27`.
- `node qa/brief.mjs --css` prints `style.css:LINE  ## text` read from the file (15 headers, one line each); the brief's step 5 prints the same scan; `PEDAGOGY-MAP.md:14` ([I/O] 7) names the command.
- Closed 2026-11-14: `FILESYSTEM.md:3` now reads "page order, blocks, classes, markup" and names `--css` as the index.
- Closed 2026-11-14: `PEDAGOGY-MAP.md:66` cites the header that exists (BLOCK WIDTHS, `style.css:261`); the handoff note that it cited BLOCK WIDTH SLOTS was stale.

### C. Element contracts — chunked (2026-11-14): the answer key is done, the rest is here
- Done this session: `## ANSWER KEY` (`style.css:296`) states `data-a` (the `value` of the right option), `data-answer` (`|` between accepted forms), what Complete and Clear do with them (`.ans`, `.correct`), and that an item with no key is an item Complete cannot reveal. Behaviour cited from `engine2.js:246-269`; the restore path the header does not mention is `engine2.js:192-202`.
- C1 done: `## BLANKS` (`style.css:271`) names the three containers, the field's placement in each, the `<br>` route to a field below its phrase, `.blank`, and the gap's width. The item rule `.blanks>div{display:flex;align-items:center;gap:6px}` is deleted, so text and field flow as ordinary text inside an item, and four flex-only rules went with it; `.blanks.sent>div` became `.blanks.sent>*` (`style.css:297-298`), so an item need not be a `<div>`; `.glossdrop` is deleted at the owner's word. Only the plain `.blanks` blocks were ever flex rows — 3 blocks in 2 pages (`adult/lesson11.html:134,143`, `business/lesson1.html:235`); `.blanks.sent`'s items were already `display:block`, so the 321 `.blanks.sent` blocks never had the tie. Closed: `## ANSWERS` (`style.css:283`) cites `.blanks.sent input.gap`, and `.blanks.sent>*` (`style.css:297-298`) means an item need not be a `<div>`.
- C2 partly done: `## LISTENING CHIP` (`style.css:195`, the owner's wording) and `## WORD BANK` (`style.css:180`) state both uses; `.chips > b` (`style.css:181`) is one option and `.chips > span` (`style.css:182`) is text in the row (italic), so `kids/lesson30.html:20`'s ten span options now read as text — turning them into `<b>` is a content decision for the owner. Closed: `--gap-w` is stated in `## BLANKS`. Open notes, not tasks: `input.gap` cannot wrap while `#feed` already uses `field-sizing:content` (`style.css:169`); a restored value is written without an `input` event (`engine2.js:201`), so any grower must re-measure on restore.
- C2 closed for `.blank` and `.prep`: `.blank` (the drawn underline with no field) is stated in `## BLANKS` (`style.css:271`); `.prep` (a word in tan bold, `style.css:280`) is stated in `## TEXT AND COLOURS` (`style.css:87`), which now names `.prep` in place of the bare names `.chips` and `.listen` — those two have headers of their own.

- C3 done, owner's choice: merge. `.panel,.card` share one frame (`style.css:247`: tan edge, radius 12, shadow 4, padding 12/16, `margin:14px 0`), so the teach/train edge `data-kind` sets is visible on both; `.panel h3,.card h3`, `.panel .chart,.card .chart` and `.panel > :not(h3),.card > :not(h3)` were widened to match, `.panel.center,.card.center` (`style.css:363`) too, and the now-redundant `.content-area > .panel{margin:14px 0}` is deleted. 296 card uses (197 `<div>` blocks, 99 `<p class="card pt">` quotes) change frame: they were ink edge, radius 16, shadow 5, padding 14/18.
- C4 pointers and scaffold, done 2026-11-14: `style.css:181` now cites TEXT AND COLOURS; `engine4.js:636` cited a header named BLOCK HEADER that has never existed and now cites PAGE SCAFFOLD (that file is left uncommitted — it also holds the owner's bossRaid score change); h4 is now stated in `## PAGE SCAFFOLD` (`style.css:308`) as an optional, at-most-one introduction directly under the `h3`, italic by the rule. A scan of every `.md`, `.js`, `.mjs` and `.html` for inline `## <CAPS>` citations returns none that a `--css` run does not print; the only other hits are markdown headings of ISSUES.md and ROADMAP-GENERATOR.md.
- Item 6 (the h4 scaffold item) is done at `style.css:304`. Item 7 was read as the PORTUGUESE TEXT pointer, fixed at `style.css:181`; the sentence that deferred the class vocabulary to PEDAGOGY-MAP.md — `style.css:4-5` — is deleted at the owner's word, so these headers are the one stated vocabulary.
- `qa/brief.mjs --indexes` prints both indexes in one run (`qa/brief.mjs:67-78`): the menu index as the same JSON `--index` prints, then the `--css` lines. Both single-flag paths are unchanged.

### B. Open thread — let lesson generation print a pronunciation key - IGNORE - PARKED FOR NOW

**Facts.** `pronkey.js:80-85` exports `words`, `lookup`, `render`, `ready`. `load(obj)` exists at `pronkey.js:59` and is not exported. `render()` (`pronkey.js:34`) splits a key on `-` (syllables joined with `·`), wraps letters in `<b>` and elided letters in `<span class="pr-g">`, and returns the display HTML. `dictionary.json` holds 28,075 entries; **0** contain a space. The page's own lookup (`engine1.js:420-423`) takes a multi-word selection, loops its words, and uses the **first** word that has a key.

**Two ways to let a build print a key:**
1. Add `load: load` to the export list (`pronkey.js:80`), then a tool reads `dictionary.json`, evaluates `pronkey.js` against a `{window:{}}` stub and calls `PronKey.load(dict)`. Synchronous, no new dependency, one added property that pages never call.
2. Leave the engine untouched and drive it with jsdom plus a `fetch` stub. New authoring-time dependency and an async wait before the first lookup.

Recommendation: 1. Implication of 1: the shipped engine carries one more exported function, inert unless called. Implication of 2: nothing in the shipped engine changes, and the build path gains jsdom.

**Phrases — the cost.** Printing one key per word is a loop in the tool, not an engine change. Three limits stand in the way of a phrase display: the dictionary is per word (28,075 entries, none with a space); `words()` (`pronkey.js:14`) drops tokens under two characters once edge apostrophes are stripped, so `a` and `I` disappear and a phrase cannot sit 1:1 under its words; and `engine1.js:420-423` shows one key for a whole selection. A phrase therefore needs the tool to tokenise the text itself and record which tokens carry a key — layout work in the page, not engine work.



