# FILESYSTEM — repository map

- SPEC/RULE FILES: .clinerules/.clinerules.md · FUNCTION.md (behaviour + backend + edit mode) · style.css `/* #` headers (the lesson-facing contract in words: page order, blocks, classes, markup) · STATUS.md (state & shared parameters) · VERIFICATION.md (how to QA) · FILESYSTEM.md (this map)

- WORKING PLAN: PENDING.md (the active subtask batch plan, HANDOFF.md (new task handoffs (when requested)

- LESSON GENERATION: PEDAGOGY-MAP.md (generation process and rules) , `qa/AUDIO.md` (the audio cut: routes, flags, steps, and the fix for a sync that is off) and `qa/pos.mjs` (the tagger that emits the `.pos-*` marks a page pastes) , `<TRACK>-ROADMAP.md` (one `##` section per lesson) · `<TRACK>-REGISTER.md` (the persona) · `extra/lesson1-The Capability Map.html` (the map: every shape a page is built from — §1 the three passes, §2 prose, §3 the visual index, §4 the in-block elements, §5 the activities; its open `details.reveal` specimens are the markup contract) · `_shell.html` (the frame every lesson page starts as: a generation copies it into the track folder and authors into it) · VEHICLES.md, IN-BLOCK-VISUALS.md and CONTENT_EXAMPLES.md remain in the repo but are no longer generation inputs

- TRACK ROADMAPS: ROADMAP-GENERATOR.md (produces the roadmaps — a separate pipeline)

- LESSON TRACKS/PAGES: one folder per track (kids/ · business/ · adult/ today, plus six empty test tracks: advanced-stem/ · advanced-aave/ · memelord-mogger/ · english-basic-portuguese/ · gramatica-redacao/ · linguagem-figurativa-giria/) — a track folder holds `lesson<N>-<Title>.html` (the filename carries the lesson's number AND its title, spaces and all; nothing reads a page to learn its title) plus an optional track.json {label, icon, color, order}; `label` is the display name and `icon` its emoji

— BACKEND: Code.gs — qa/landing.mjs (index.html / student index structure, jsdom) — qa/check.mjs (the lesson gate: the page works, every answer saves, roadmap coverage and the register printed for reading) — qa/games4.mjs (engine4.js / the game runner's state machine, jsdom) — qa/live.mjs (real-Chrome CDP harness, run with `node qa/live.mjs`) — qa/track.mjs (the one place a harness learns its SCOPE: the track list is DISCOVERED from the folders — no `--track` = every track that has pages, `--track=<any track folder>` narrows it) — qa/off.mjs (the kill switch: every harness on this line except qa/liquid.mjs prints one line and exits 0 unless `QA_ON=1` is set — owner instruction 2026-11-10, ISSUES.md) — node_modules/ (untracked, gitignored)
