# HANDOFF — context handoffs between sessions
Write here when a session ends mid-work, or when a task handoff is requested. If a handoff is requested while  '## 2. Active Handoff' contains text, append the new handoff and inform the user of the prior contents.

## 1 Last change tag
_(Cleared 2026-11-04 at the owner's request.)_

## 2 Active Handoff 


### E. A lesson's filename is its number and its title (2026-11-14) — done, one ask left
- All 103 pages renamed `lesson<N>.html` → `lesson<N>-<Title>.html` (title verbatim, spaces kept; illegal Windows chars replaced by a space). `git mv`, no page content touched.
- `build-lessons.mjs` no longer reads a page: the title comes from the filename and `lessons.json` entries are now `{n, title, file}`. `extractTitle`/`decodeEntities` deleted.
- Every link is built from `file`: `index.html:461` (book menu, `encodeURIComponent`), `engine2.js:11-15` (`lessonHref`/`goLesson`, used by the ← Last / Next → buttons at `engine2.js:234`, `:239`, `:342-343` and the book selector at `engine2.js:334`).
- Every harness resolves a number to a file instead of concatenating: `qa/track.mjs:93` (`lessonFile`), used by `qa/content.mjs:56,160`, `qa/register.mjs:135,144`, `qa/lang.mjs:99`, `qa/overflow.mjs:311`, `qa/prose.mjs:230`, `qa/apply.mjs:49`, `qa/cssdiff.mjs:34`, `qa/live.mjs:63` (`PAGE_REL`); the discovery/rename regexes accept the new form (`qa/track.mjs:32`, `:87`, `:130`, `qa/overflow.mjs:173`).
- `PEDAGOGY-MAP.md:22` and `FILESYSTEM.md:11` state the new name. `touchedScope()` sees 23/49/31 renamed pages (it failed on 4 titles containing an apostrophe until `PAGE_PATH` stopped excluding `'`).
- Verified: `QA_ON=1` content/register/lang/overflow on business 1 exit 0 and print the new filename; `qa/landing.mjs` passes except its pre-existing `.vz-btn:focus-visible` ungated focus-ring check; `qa/examples.mjs` 8/8, `qa/liquid.mjs` 32/32. `qa/pending.mjs` is deleted (2026-11-14, owner's call): it guarded this file's own spine, not anything the site serves, and no owner request stood behind it.
- **Pared down, as asked**: `build-lessons.mjs` now holds the track table itself (name/label/icon/colour/order, the nine tracks as they were in `tracks.json`), reads no `track.json`, walks no folders to discover tracks, and writes no `count`. It warns when a folder has lesson pages but no table line. `tracks.json` is still written (index.html and engine2.js fetch it for label/icon/colour) but without `count`.
- **`COUNTS` is gone from `index.html`**: the const, its sync in the build, and its two readers are deleted; `trackLessons()` returns `LESSONS[t]||[]`. Behaviour change: with no `lessons.json` a track now shows no lessons instead of numbered blanks.

### B. Open thread — let lesson generation print a pronunciation key - IGNORE - PARKED FOR NOW

**Facts.** `pronkey.js:80-85` exports `words`, `lookup`, `render`, `ready`. `load(obj)` exists at `pronkey.js:59` and is not exported. `render()` (`pronkey.js:34`) splits a key on `-` (syllables joined with `·`), wraps letters in `<b>` and elided letters in `<span class="pr-g">`, and returns the display HTML. `dictionary.json` holds 28,075 entries; **0** contain a space. The page's own lookup (`engine1.js:420-423`) takes a multi-word selection, loops its words, and uses the **first** word that has a key.

**Two ways to let a build print a key:**
1. Add `load: load` to the export list (`pronkey.js:80`), then a tool reads `dictionary.json`, evaluates `pronkey.js` against a `{window:{}}` stub and calls `PronKey.load(dict)`. Synchronous, no new dependency, one added property that pages never call.
2. Leave the engine untouched and drive it with jsdom plus a `fetch` stub. New authoring-time dependency and an async wait before the first lookup.

Recommendation: 1. Implication of 1: the shipped engine carries one more exported function, inert unless called. Implication of 2: nothing in the shipped engine changes, and the build path gains jsdom.

**Phrases — the cost.** Printing one key per word is a loop in the tool, not an engine change. Three limits stand in the way of a phrase display: the dictionary is per word (28,075 entries, none with a space); `words()` (`pronkey.js:14`) drops tokens under two characters once edge apostrophes are stripped, so `a` and `I` disappear and a phrase cannot sit 1:1 under its words; and `engine1.js:420-423` shows one key for a whole selection. A phrase therefore needs the tool to tokenise the text itself and record which tokens carry a key — layout work in the page, not engine work.



