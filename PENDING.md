# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
`   - [Sn] - <the distinct goal unique to this step> <the File & Section name of the rules which are most relevant> <exit condition>`

- For any [change in plans] or [deviation from the batching/order in pending.md], update any relevant [Bn] and/or [Sn]] to reflect the change(s)
- Execute one step per turn. When a step or batch is finished, dropped, skipped, or stale, it is deleted. A task ends with this file empty.
- **This file is edited in place, never rewritten**: an edit anchors on the `[CURRENT]` batches only. `# [HANDLING]` and `# [CURRENT]` are the file's spine.

# [CURRENT]

## [B0] - Clear the working tree of experiment debris "cleanup of the project structure": a list first, a delete only after sign-off | artifact: a clean `git status`
   - [S1] - List every untracked `_tmp-*` file and every asset the sheet no longer references, with the file that used it | FILESYSTEM.md [LAYOUT] | the list is shown and nothing is deleted
   - [S2] - Delete the approved list only, `-LiteralPath`, one command per group | FILESYSTEM.md [LAYOUT] | `git status` carries no `_tmp-*` and no orphan asset
   - [S3] - Prune what the map calls superseded — the older axis-with-marks family and the draft plot of claim spans, plus the audio block arrangement the mini player replaces — after the owner confirms each | capability-map.html section 6 | each pruned family is gone from the sheet, and the map says so

## [B1] - Make the capability set complete and findable "nothing should depend on it noticing or not": the generator can only choose what it has been shown | artifact: `capability-map.html` — the inventory, the mapping and the specimens on one unlinked page
   - [S3] - Keep the page honest as elements land or are pruned: a row moves between "what exists", "documented" and "superseded" only when its specimen does | capability-map.html | no row claims "built" without a rendering above it

## [B2] - One card schema for every capability "it should know what capabilities it has and exactly how to use them" | artifact: every menu entry answering the same fields
   - [S4] - Define the card fields (`job` / `use when` / `skip when` / `cannot` / `dose` / `level` / `cost` / `pairs` / `tool` / `specimen`) under CONTENT_EXAMPLES [INSTRUCTIONS] | CONTENT_EXAMPLES.md:52-63 | the field list is written and the index lists it
   - [S5] - Convert `[69]` timeline to the reference card (its info already names what it cannot show) | IN-BLOCK-VISUALS.md:48-80 | `[69]` carries all fields and reads as the template
   - [S6] - Convert `[65]` pos, `[66]` contour, `[05]` map | IN-BLOCK-VISUALS.md:9-39,97-107 | three cards complete, each naming its tool or drawing and its dose
   - [S7] - Convert the remaining in-block entries and the VEHICLES blocks; write the missing fields on `[39]/[55]/[56]/[60]/[64]` and retire their IGNORE mark | VEHICLES.md; CONTENT_EXAMPLES.md:66-90 | `--index=raw` lists every capability and none carries IGNORE

## [B3] - A policy of justified use, not quotas "we cannot [set ceilings] without handicapping the possibilities ... but we can't allow that level of freedom either" | artifact: the tests a use must pass, plus a per-instrument note on when a repeat earns its place
   - [S9] - Write each instrument's repeatability in plain reasoning tied to the concept's own difficulty: the underline parses structure, so it repeats as a lens; the time axis is one-dimensional, so it repeats where Portuguese does not carry the tense and adds nothing where it does | B2 entries | every entry names a case where twice is right and a case where once is too many

## [B4] - Level-gated licensing "it must know ... how that relates to the level of a given lesson" | artifact: a concept→figure mapping, and a rule for what a page must supply before it shows a figure
   - [S12] - Audit for figures and tools doing one job; either merge their descriptions or declare which one supersedes the other | the catalogue | every near-duplicate pair is named, with one of the two chosen

## [B5] - Resume the element polish, deferred until B1-B4 land (arrow, wave marks, preposition blue)
   - [S15] - Re-open the element list the owner holds and finish it against the new entry schema | style.css `#94 POS` | no element is finished before the entry that licenses it exists

## [B6] - The games' last open questions "make sure the options only appear when their question appears ... dont stop until everything is working" | artifact: one answer each, so nothing is guessed
   - [S28] - `echoPads` [35]: removing the hint line as asked also removed the "Not that one — 2 lives left" sentence that followed a wrong pad (the hearts and the red pad still show it). Restore that sentence in its own element, or leave the hint gone? | engine4.js `PLUGINS.echoPads`; style.css `.g4-echo-hint` | the owner says which, and the rule matches

## [B12] - The map and the music player, ready to be put into lessons "start working on the embedded map and music player shown on preview-menu.html ... the map image should be scalable for the builder, but its default size can be its current size ... make the location graphics show the places visually" | artifact: a map a builder can size, drawn as eight places, and a player whose every preview is the primitive
   - [S54] - the eight places drawn as the thing they are, to the standard already written for them: streets as gaps (paper under ink), footprints at 8% of the ink, each place carrying its one identifying feature and its name on a sign, the north arrow and scale bar in a corner, nothing coloured but ink/paper/accent | qa/preview-menu.html §`[05]` drawing; IN-BLOCK-VISUALS.md §`[05]` drawing | read off a Chrome screenshot and the DOM: each place's box holds its own feature paths, no `fill` but the paper, the 8% footprint and the accent, and the map still reads at 420px

## [B16] - A generation reads the map from its live URL "why dont we just put the capability map on the live site and read from its url? ... the only downside is that generation requires internet access" | artifact: one URL a generation is given, and specimens that can be copied as written
   - [S63] - the URL is the input: the page is already served at `https://dennisdkramer.github.io/ingles/capability-map.html` (200, 46,521 bytes, `Cache-Control: max-age=600`), unlinked from the login-gated index; record it as what a generation reads, and state what a generation must do about the ten-minute window a CDN keeps | PEDAGOGY-MAP.md [I/O] (the owner's file, his edit) | a generation given the URL reads the page a browser shows, and the window is stated rather than discovered
   - [S64] - the specimens audited and made copyable: one form per entry, folds open by default, no vendor SVG printed as if a lesson types it, no `…elided…` a reader cannot rebuild — each specimen checked against the rendered component above it and against the file that owns that contract | capability-map.html §4; VEHICLES.md / IN-BLOCK-VISUALS.md / CONTENT_EXAMPLES.md for the contracts; qa/pos.mjs for the markup a script generates | each specimen pastes into a page and renders the component beside it, and the three shapes there today (pos's vendor SVG, the axis's elisions, the audio entry's native-controls floor) are gone
