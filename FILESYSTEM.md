# FILESYSTEM — repository map

- SPEC/RULE FILES: .clinerules/.clinerules.md · FUNCTION.md (behaviour + backend + edit mode) · style.css `## ` headers (the lesson-facing contract in words: page order, classes, markup, appearance) · STATUS.md (state & shared parameters) · VERIFICATION.md (how to QA) · FILESYSTEM.md (this map)

- WORKING PLAN: PENDING.md (the active subtask batch plan, HANDOFF.md (new task handoffs (when requested)

- LESSON GENERATION: PEDAGOGY-MAP.md (generation process and rules) , `qa/brief.mjs` (indexes for inputs), `qa/AUDIO.md` (the audio cut: routes, flags, steps, and the fix for a sync that is off) , `<TRACK>-ROADMAP.md` (one `##` section per lesson) · `<TRACK>-REGISTER.md` (the persona) · CONTENT_EXAMPLES.md (the vehicle menu: the `###` lines are the index, one section is read only after a shape is chosen) · `_shell.html` (the page a build fills) · 

- TRACK ROADMAPS: ROADMAP-GENERATOR.md (produces the roadmaps — a separate pipeline)

- LESSON TRACKS/PAGES: one folder per track (kids/ · business/ · adult/ today, plus six empty test tracks: advanced-stem/ · advanced-aave/ · memelord-mogger/ · english-basic-portuguese/ · gramatica-redacao/ · linguagem-figurativa-giria/) — a track folder holds lesson*.html plus an optional track.json {label, icon, color, order}; `label` is the display name and `icon` its emoji

— BACKEND: Code.gs — qa/landing.mjs (index.html / student index structure, jsdom) — qa/content.mjs (structure) — qa/overflow.mjs (layout, real Chrome) — qa/games4.mjs (engine4.js / the game runner's state machine, jsdom) — qa/live.mjs (real-Chrome CDP harness, run with `node qa/live.mjs`) — qa/track.mjs (the one place a harness learns its SCOPE: the track list is DISCOVERED from the folders — no `--track` = every track that has pages, `--track=<any track folder>` narrows it) — qa/off.mjs (the kill switch: every harness on this line except qa/liquid.mjs prints one line and exits 0 unless `QA_ON=1` is set — owner instruction 2026-11-10, ISSUES.md) — qa/lang.mjs (the one check a build runs on its own page) — node_modules/ (untracked, gitignored)
