

## Cleared from PENDING [CURRENT] — 2026-11-09

- `[11]` several access changes errored and a signed-in return waited seconds → `08b2fe5` (one `accessSet` carrying the desired set; the page paints before any request)
- `[11]` a second section under the same number: index behind a centred spiral, truncating identity line, one switch per track → `a188244`
- `[12]` continue-from-lesson-N had lost its data; `status` serves `progress` and `done` with the access list → `1c630bb`
- `[10]` a track is a folder: per-track `track.json` plus generated `tracks.json` replace every hardcoded list → `b44ca62`

All four had every `[Bn]` and `[Sn]` closed; they sat in `[CURRENT]` only because the old steps 6-7 were never run. Numbering anomaly found: two separate `[11]` sections existed.

## Lesson 40 - adult - 2026-10-11

- `40`, social context: a flat Monday standup, a landlord story delivered as a voice note to a group, and a roast traded between friends who are still laughing - register (a) throughout. Most difficult concept for the student: telling a roast from an insult, because the words are the same and the decision is audience, target and whether the person is still laughing.
- Files not re-read: none of the four MANDATORY inputs (ADULT-ROADMAP.md 388-396, FORMAT.md, FUNCTION.md [CONTENT] 4-11, ADULT-REGISTER.md) nor _shell.html - all read fresh this build, so no stale copy and no diff. Withheld and unopened: PEDAGOGY.md ([GENERATION] 3), CONTENT_EXAMPLES.md below its ### headings, every other lesson page, both other tracks - no diff to report because none was read.

## [15] migrated - 2026-10-11

- `[15]` adult lesson 40: page plus byte-identical sidecar, two provenance records (the second amends the fingerprint after the game beat was re-cast), lang / provenance / content all green; `[B7] [S3]` the two overflow ESCAPE findings on the game stage art carried to the games turn on the user instruction.

## [16] migrated - 2026-10-11

- `[16]` adult lesson 40: answered the six questions on the QA reds and pushed 3a571c8; `[B2]` no project file edited - the "tested" rule (this lesson's own - Vocabulary: list), roadmapSpan's formula, the absent 3000-char rule, .grid3 having no CSS rule, and input.gap's per-blank --gap-w were each named from the harness and style.css.

## [17] migrated - 2026-10-11

- `[17]` adult lesson 40 was live but unlinked: build-lessons.mjs regenerated lessons.json/tracks.json (adult 22->23) so the selector now offers it; roadmapSpan returns the span with no blank-line stripping (records amended - adult/40 388-397, kids/30 303-312, kids/31 313-322); FORMAT.md's unimplemented .grid3 replaced by .itemsize-half/.itemsize-third with a compare-contrast note; .clinerules gained the pre-split rule. Pushed 30c045a, 4356b59, 3b2d8eb. kids/30 and kids/31 stay red on pre-existing FORMAT.md/FUNCTION.md contract drift - found, reported, not touched.
