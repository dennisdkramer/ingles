# FILESYSTEM — repository map
- root: index.html · style.css · engine1.js · engine2.js · engine3.js · dictionary.json · pronkey.js · build-dictionary.js · logo.png · access.json · .gitignore · package.json · _shell.html 
- spec/rule files: HARNESS.md (read-first hub + rules) · HANDOFF.md (session handoffs) · FUNCTION.md (behaviour + backend + edit mode) · FORMAT.md (site structure & formatting) · PEDAGOGY-MAP.md (generation process + defaults — rules only) · STATUS.md (state & shared parameters) · VERIFICATION.md (how to QA) · FILESYSTEM.md (this map)
- working plan: PENDING.md (the active subtask batch plan of global RULE 0, item 6 — batches written here, executed in order, cleared once done)
- pages: kids/ · business/ · adult/ 
— backend/Code.gs — qa/landing.mjs (index.html / student index structure, jsdom) — qa/content.mjs (structure) — qa/overflow.mjs (layout, real Chrome) — qa/games.mjs (engine3.js / shootPair state machine, jsdom) — qa/live.mjs (real-Chrome CDP harness, run with `node qa/live.mjs`) — qa/track.mjs (the one place a harness learns its SCOPE: no `--track` = every track that has pages, `--track=kids|business|adult` narrows it) — node_modules/ (untracked, gitignored)
- A file that the current batch does not reference is assumed fully functional; only a verification step proves otherwise.
