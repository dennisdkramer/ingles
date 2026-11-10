

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

## [22] migrated - 2026-10-11

- `[22]` the level rubric, register checking and voice precedence: the doc hunt found two adult register files - `ADULT_REGISTER.md` (underscore, 2102 bytes) orphaned, `ADULT-REGISTER.md` the one `qa/provenance.mjs:70` resolves - so the owner's "American" and "raunchy internet content" edits landed where nothing reads them. The reworded Portuguese rule invalidated three records (adult/40, kids/30, kids/31). Answers given: the rubric's fourth axis was unobservable during generation, "no checker can judge register" was too strong (the author can, and that comparison is a generation step), precedence had no home, and QA is post-hoc by definition so guidance cannot live there.

## [23] migrated - 2026-10-11

- `[23]` five live pages scored against the new four-demand rubric: business/12 = 17 (band 7-17), business/14 = 30 (9-19), business/38 = 41 (33-43), kids/23 = 10 (18-28), adult/21 = 23 (16-26) - three in band, business/14 eleven over, kids/23 eight under, so the misses are track-shaped rather than random. All five carry no `data-level`/`data-register`/`data-move` (lesson-40-only conventions), so a hard declaration check would fail ~100 existing pages. Register audit: `qa/register.mjs` is not register-neutral (three hardcoded regexes at 39-43, `TRACK_REGISTER` at 48 whose "business and kids have none on disk" is false now both files exist); `qa/lang.mjs`'s PT band contradicts the reworded e) - a lesson-40 page needing 30% Portuguese to carry a level-50 concept is correct by e) and red by the band; `qa/content.mjs:14-15` disclaims widths, so FORMAT e) had no owner. adult/40's records deleted (16 -> 12 lines). Pushed d3c2c20.

## [17] migrated - 2026-10-11

- `[17]` adult lesson 40 was live but unlinked: build-lessons.mjs regenerated lessons.json/tracks.json (adult 22->23) so the selector now offers it; roadmapSpan returns the span with no blank-line stripping (records amended - adult/40 388-397, kids/30 303-312, kids/31 313-322); FORMAT.md's unimplemented .grid3 replaced by .itemsize-half/.itemsize-third with a compare-contrast note; .clinerules gained the pre-split rule. Pushed 30c045a, 4356b59, 3b2d8eb. kids/30 and kids/31 stay red on pre-existing FORMAT.md/FUNCTION.md contract drift - found, reported, not touched.

## [18] migrated - 2026-10-11

- `[18]` .clinerules trimmed: eight TOOL DISCIPLINE bullets and one terminal bullet condensed to their instructions, the qa/overflow.mjs anecdote removed with its instruction kept, the heading's dangling dash dropped. All 13 rule groups, every threshold and every remedy survive the walk in `[B4]`; 5150 -> 4772 bytes (7.3%). Pushed 93f3fba.

## [19] migrated - 2026-10-11

- `[19]` adult lesson 40 reviewed block by block: 1A is A2 grammar carrying a B2 target and pre-explains its own joke; 1C keys nothing and saves by anchor text, not by input name; 3A's Portuguese card fails the only rule that governs it (CONTENT_EXAMPLES.md 831, lang=pt only where a word is genuinely new) and the page's term "booster" is invented; 3B is recognition-only; 4A is low-teens grammar in teen-meme register, not this track; 5B collapses three prompts to one unkeyed answer. Grade given C+, which the owner rejected as a fail - the grade was measured against the harnesses rather than the persona, which is the defect.
## [24] migrated - 2026-10-11
- `[24]` level floor raised: t) is at-or-above the lesson number (no upper band), w) puts difficulty in concepts and training, not prose or single-word options. Register governs every string (x/y/z). Authority order added at PEDAGOGY-MAP 5-6 as precedence, distinct from reading order. .itemsize-twothird + paired 395px third; e) rewritten as pair -> measure -> never pad. Complete reveals keys under the field, greens the correct label, locks; Clear empties. register.mjs parses each track own tells; lang.mjs lets a data-why gloss leave the band.
## [25] migrated - 2026-10-11
- `[25]` adult tells tiered core/common/situational/rare with each tier stated as instruction; British profanity moved to locale; the harness lost its own word list, gained --tells (reads no page) and reports an item listed under two keys. Five sorted-list errors found by the owner: five-o vs 5-0, guap/cheddar too low, the plug, parole/warrants as plain English.
