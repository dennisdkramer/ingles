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

## [B17] - pos.mjs writes the spans for any timeline that sits under text "the lesson always calls pos.mjs to write the spans, but we should make it default to do so when attaching a timeline in-line with text" | artifact: an inline timeline whose anchor phrase is marked up by the script, never by hand
   - [S65] - the inline timeline's contract says the spans are generated: the block carries the sentence, `qa/pos.mjs` writes the POS spans, and the timeline pins to the generated `.an` — one worked example of the call and its output on the map, and no specimen anywhere showing hand-typed POS | IN-BLOCK-VISUALS.md §`[69]`, capability-map.html §4 `#axis`, qa/pos.mjs | the map's inline timeline renders spans the script produced, and the specimen shows the invocation plus its result

## [B18] - A timeline drawn on its own, as a tense's visual "we also want to show an example of an expanded timeline that is not connected with text, used as a simple visual in connection with teaching a verb tense" | artifact: one member of the timeline family with no sentence above it
   - [S66] - the expanded timeline: no anchor phrase, no pin, no connector — the axis with its words and the tense's own mark, sized to its block (`data-grow`), with one label line naming the tense; shown on the map beside the inline one with the rule for choosing between them | style.css `#89` `.tln*`, IN-BLOCK-VISUALS.md §`[69]`, capability-map.html §4 `#axis` | one member renders with no sentence and no pin, the map states when a tense is taught by the standalone figure and when by the inline one

## [B19] - DONE - Every look accounted for, with its job: tint for context and register, tape for what would sit on paper, float for a section's opening or closing and the higher-level view, stripes for activities (the grain pattern replaced), outline for the one critical element, dark for night and play, default shown as itself. All six are declared by the builder; the kind hue is quarantined to legacy. Recorded in capability-map.html §3c and §5

## [B20] - DONE - Width follows content: a frame is `flex:0 1 fit-content` with a quarter-area floor, `h3` no longer sizes a block, five spans exist and `qa/span.mjs` measures and writes them. Examples on the map, each with its case; `preview.html` retired

## [B22] - DONE - The shapes migrated as examples: picture block beside prose, plain dialog, dialog with blanks, option chart with radios/checkboxes/text, done-state, score-reactive surface with `.meter` and `.ring`, marks, and two flip cards (unassigned). Reading mode, the comparison block and the scroll reveal are dropped, each with its reason in §5, and their rules are out of the sheet

## [B25] - The section flows from its content, and a mosaic where a tall block would leave a hole "we need to test this ... how much content should a block have before it becomes just a note in another block? how much content justifies a full width?" · "blocks can flow two high beside a tall block too" | artifact: `section.flow` and `section.mosaic` in the sheet, and §0 of the map as the lab where the thresholds are measured
   - [S80] - DONE - §0 the test bed: ten items of measured content (3, 5, 17, 41, 84 and 141 words, a 4-item set, a 2×3 table, a 4×4 table, a 12-item set) rendered twice — once as a flow, once as a mosaic — with the lab printing words, max-content, flow size, grid columns×rows, every item's placed x/y, and the height each arrangement takes. Measured: flow 1028px, mosaic 848px, and the tall 12-item list sits in one column while five items pack beside it and under it | style.css `#41`/`#42`, capability-map.html §0 | the two labs render, the table prints, and the tall-block case packs instead of leaving a hole
   - [S81] - the thresholds the lab produced, written into §3b as the answer to "how much": ~37px per word of prose, so a quarter (~287px) holds about 8 words, a half about 16, a full line about 32; under ~8 words a line is a label and belongs inside a block or in a row of like items; 32+ words is the only width that justifies a full line; an element wider than ~900px takes the line whatever its word count | capability-map.html §3b, CONTENT_EXAMPLES.md [INSTRUCTIONS] | the rule states the numbers the lab measured, not an opinion
   - [S82] - the pass writes the grid, not the markup: `qa/span.mjs` grows into the lab's script — columns from max-content, rows from height over the 8px unit — and `.itemrow`/`data-span` retire with it | qa/span.mjs → the pass, style.css, the map's §3b–§3e | the same content always places the same way, and no page carries a span the pass did not write

## [B21] - The specimens become copyable, once the decisions above exist "we're gonna have to double check the markup indicated there because i can already see things that are wrong or misleading" | artifact: one form of specimen per entry, each one pasting into a page and rendering the component beside it
   - [S64] - the specimen rewrite, held until [B17]-[B20] settle what the markup is: one `<pre>` per entry, folds open by default, generated parts marked as generated, no vendor SVG, no elision a reader cannot rebuild, and the audio entry showing the drawn controls beside the native floor — with at least one live audio figure on the page | capability-map.html §4, VEHICLES.md / IN-BLOCK-VISUALS.md / CONTENT_EXAMPLES.md for the contracts, qa/pos.mjs for generated markup | every specimen pastes and renders; the pos vendor SVG, the axis elisions and the audio native-controls floor are gone, and the page plays a clip

## [B16] - A generation reads the map from its live URL "why dont we just put the capability map on the live site and read from its url? ... the only downside is that generation requires internet access" | artifact: one URL a generation is given
   - [S63] - the URL is the input: the page is already served at `https://dennisdkramer.github.io/ingles/capability-map.html` (200, 46,521 bytes, `Cache-Control: max-age=600`), unlinked from the login-gated index; record it as what a generation reads, and state what a generation must do about the ten-minute window a CDN keeps | PEDAGOGY-MAP.md [I/O] (the owner's file, his edit) | a generation given the URL reads the page a browser shows, and the window is stated rather than discovered

