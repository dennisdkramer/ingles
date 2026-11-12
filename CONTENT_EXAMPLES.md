# CONTENT_EXAMPLES — A menu of **mechanisms** and skins for content authored in the page's HTML

### Build [Constraints] - Ignore this section for lesson generation
1. There is **no house style**. Look, palette, motion and mood are chosen per game.
2. **The page must still work if the engine never loads.** The authored `.qitem`s are ordinary radios: they render, save and print with no JS. That fallback is not optional.
3. **No network at run time.** Art is CSS, inline SVG, or a local file. Nothing fetched from another host, so a page that ships today still renders in two years.
4. **Fits its slot.** A vehicle or stage has a defined .itemsize or range of .itemsizes with which it is compatible and never overflows.
5. **Reduced motion is honoured** — `prefers-reduced-motion` removes travel and keeps the state change, so the game still tells the student what happened.
6. **Cheap frames.** Animate `transform` and `opacity`; avoid animating layout properties, which jank on a school laptop.
7. **Difficulty and content are data.** Every game reads its items from the page and its knobs from `data-*` attributes, so a teacher can add items or change difficulty without editing an engine.
8. **The content in the page.** Games drive authored `.qitem`s (stem + optional `.listen` + radios), `input.gap`, or a textarea — nothing else. Whatever the engine animates is presentation; the saved answer is always one of those controls. If a mechanism cannot end in one, it is not a vehicle, it is a decoration. 
    
## [INSTRUCTIONS] for selection and implementation
- **A menu, not a checklist.** Nothing here is required to be in any part of any lesson or in any order, order is not preference, vehicles are used if/when they are optimal for presenting generated content.
- Vehicle **shape** categorizes their use cases. Four atoms — `TEACH`, `TRAIN`, `SHOW`, `OPTION` — and any combination of them written with `|` (`TEACH|OPTION`, `TRAIN|OPTION`, `TEACH|TRAIN`, `SHOW|TEACH`, `SHOW|TRAIN`). A combination means exactly the union of its parts and carries no definition of its own. **Games are `TRAIN`**: a game is an activity that makes the student use what they already know, whatever else it also does.
	- `TEACH` -> Explains, elaborates , gives translations, or otherwise passes understanding or knowledge to the student.
	- `TRAIN` -> Any activity that makes the student utilize their knowledge.
	- `SHOW` -> Presents or demonstrates but does not 'teach' - must be combined with another vehicle that [explains or uses] it as a [teaching or training] example, which is why it is never a shape on its own.
	- `OPTION` -> Contains designated space to include any content type or combine with another vehicle within the same block. It says what a block may *also* hold; it is never a shape on its own.
- **Headings are the index** Every `### ` heading reads `[#] <shape> <itemsize> — What it is and/or does [<n|n> (min|max items in activity) - <n|n> (min|max options/fields per item)]`. `itemsize` is the block's default width as the stylesheet already names it: `full`, `half`, `third`, `half->`. In the counts, **omit either number when it does not apply** — `<3|>` is three or more with no ceiling, `<|4>` at most four, `<3|4>` both — and omit the whole bracket when neither applies. `node qa/brief.mjs` prints the menu for (PEDAGOGY-MAP.md [I/O] 5). The lines under a heading are ONLY read **after** a shape is chosen by (PEDAGOGY-MAP.md [I/O] 5) - (`qa/brief.mjs --section=<name>` prints one). 
- **The element-as-plate list** — where the element itself is the teaching device, the element *is* the plate and needs no class: `ruby`/`rt` (a key over a word), `figure`/`figcaption` (a picture and its line), `<s>` (a rejected line, an erasure), inline `<svg>` (a drawn map, timeline, mouth), `<img>` from `assets/` (a photograph, sign or form). An image is always a local file — `[Constraints] 2` forbids a fetch at run time — and a vehicle whose **markup** uses any of these names the ones it uses.
- **The tone of a lesson comes from the lesson's copy, never from here.** Every vehicle is track-neutral.
- <h3> begins with a letter depending on its order in the section, and must be followed by text which is [[defined in the vehicle's **markup**] ELSE  [a super-minimal phrase (which must have some value in explaining the function/utility/contents of the block, never flavor text or filler) authored by the build]]. <h4> is [mandatory if defined in **markup**] ELSE [an optional brief introduction/explainer of the block contents (never redundant with <h3>)].

### `musicPlayer — a track, a scrub bar, and the words lit as they are sung (mixed)`

- **does** — The recording, a control that starts and stops it, a bar that can be dragged to any point in it, and
  the words underneath, with the line being sung marked. It is the only block that lets a student *sit on one line
  of a real voice* — play the phrase, drag back, hear it again — which is what a lesson about rhythm, linking or
  reduced forms needs and what a transcript cannot give.
- **markup** — one `.panel` whose `<h3>` is **the song's own title, never the vehicle's name**: this block exists for one
  recording, so its header names the recording, and a header reading `musicPlayer` would tell the student nothing about
  the thing in front of them. The performer, the licence and the excerpt length are the first thing under it. Inside,
  a `figure.vz-play` with a `figcaption` first (**element-as-plate: `figure`/`figcaption`**) — the figure is the
  plate and carries no class of its own beyond the block's — and **the figcaption is a credit
  line, not a build log** — it opens `Performed by` and gives who performs it, under what licence, and, when the clip is shorter than the song,
  that it is an excerpt and how long it runs (`assets/README.md` requires the credit on the page, because a
  printed page travels without that file). How the file was cut, at what second and by what method, is
  maintenance detail and lives in the README row: a student reading "cut at a frame boundary" is reading
  someone else's working notes. Then
  `<audio class="vz-audio" src="../assets/<name>.mp3" data-duration="<decoded length>" controls preload="metadata">`,
  where `data-duration` is the length measured at authoring time and is what the bar, the clock and `End` use — a
  browser's own `duration` for a VBR file is an estimate; then the drawn controls —
  a `.vz-btn`, two `.vz-time` readouts and a `.vz-bar` with `.vz-fill` and `.vz-knob`, the bar being
  `role="slider"` with `aria-valuenow`; then `<ol class="vz-lyrics">` with one `<li>` per line, `data-t` in
  seconds on any line whose time is known. **The native `controls` attribute is the floor**: with no JavaScript the
  student still plays, pauses and scrubs. `qa/player.js` removes it only after wiring the drawn bar, the keyboard
  (`←`/`→` five seconds, `Home`/`End`), click-a-line-to-seek and the lyric highlight. `data-kind="mixed"`, no
  `data-move`, no `load`: nothing is scored. **At full width** the same figure carries lines too long to hold at a
  half — a ballad couplet, a psalm — and the highlight still falls on one `<li>`; the width changes what fits on the
  line, never what the block is. **One optional explainer line under the `<ol>`**, in `.dim`, for what the recording
  teaches and the lyrics cannot say themselves (where a word comes from, what an archaic form means): present only
  when the lesson's point is inside the words, and one paragraph, never a commentary on the block.
- **how it is made** — **the build sources it, through one tool and no other**: `node qa/audio.mjs
  --file="File:<name>.ogg" --lyrics="line|line|line" --out=<name>` — fetch the licence, refuse anything outside
  **public domain / CC0 / CC BY**, download Wikimedia's MP3 transcode (MP3 plays where Ogg does not), cut, measure,
  and print the markup, the provenance row and the things to check. A build never curls a URL itself and never types
  a timing by hand: the tool is the only path from a song to a block, because it is the only thing that holds the
  licence gate and the arithmetic. What it does, in order: (1) **the licence first** — the Commons API, before a byte
  of audio, so a commercial track cannot enter `assets/`; (2) **the sung phrases** — 20 ms RMS windows, a silence is
  240 ms or longer under 2% of peak, and the sound between two silences is one phrase; (3) **cut after the last line
  given**, inside that silence, at a frame boundary, no re-encode; (4) **rewrite the cut's VBR header** — an MP3 that
  still carries the original `Xing`/`Info` frame reports the *original* duration and lets the student scrub into
  silence, and one with the frame deleted is guessed at from average bitrate (6% long on this demo's file): the frame
  count, the byte count and the 100-entry seek table are recomputed for the cut; (5) **prove the line times by
  energy** — for every `data-t`, the sound in the 0.5 s after it must be at least 1.5× the sound in the 0.25 s before
  it, because a line starts where silence becomes singing; a time that lands in silence or inside a held note fails the
  run. (A first version re-segmented the cut instead, and refused a correct choir because the cut's loudest moment
  differs and the 2% silence threshold moves with it — the timings come from the recording, and are judged by
  energy.) `data-duration` is the decoded length of the cut, which the tool prints. The words are the build's; the
  audio is one command; and the pair is checked before it can be pasted. `--scan=1` auditions a file without cutting
  it, printing where its phrases start, how long each lasts and whether that shape could be a line at all — the cheap
  way to reject a band recording before the expensive way does.
- **fits** — half->, wherever the lesson's material is a recording: a chorus whose stress falls on the beat, a verse
  whose contractions are pushed together, a listening task that needs three goes at one line. Not `mediaSnippet`,
  which is a transcript of a clip with questions against it, and not `dialog`, which is a script nobody performs:
  here the audio is the material and the words are the aid. A recording shorter than thirty seconds does not need
  the bar — a `.listen` chip plays it.
- **width** — half-> (the frame, the bar and six to eight lines; full when the lines are long enough to wrap). Full
  width is not a bigger version of the block: it is the same block for material whose unit is a long line, and it
  holds a slow air as honestly as a nursery rhyme — the span follows the lines, so 60 seconds and a 20-second intro
  are the content's business, not the block's.
- **vary** — lyrics with no `data-t` at all (display only, nothing to jump to) → `data-t` on every line (jump and
  highlight) → one line per row with a gap beside it, which turns it into a listening exercise and no longer this.
- **can't** — the file must be **public domain or CC0 and credited in the `figcaption`**, or the page ships a rights
  problem into a printed copy; the `figcaption` never carries the build log (the cut point, the measurement method —
  those are maintenance notes, and the student is not maintaining anything); it is never streamed from another host,
  because `[Constraints] 2` forbids a fetch at
  run time and a hotlink dies with the host; a `data-t` is measured from the recording, never guessed, and a line
  whose time is unknown is written without one; and the block never carries the *answer* — a lyric under the line
  is a transcript of the thing being tested. A song whose point only arrives after three minutes is a listening task,
  not this block: cut the thirty seconds that carry the teaching and let the rest go.

### `lyricSheet — the same player full width, where a lyric line is too long to sit in a column, and one clause under the words says what they do (mixed)`

- **does** — A song's words, one line per row, at the width that keeps each line on one row, with the line being sung
  marked and one paragraph under the sheet explaining what the words are doing. It exists because the highlight is
  honest only while a line and a row are the same thing: in a half-width column a long ballad line wraps into two or
  three rows, and the mark then sits on a fragment of the line it is supposed to be singing.
- **markup** — exactly `musicPlayer`'s figure at `itemsize` (full), **including its header rule**: the `<h3>` is the
  song's title and the caption opens `Performed by`. Then the `audio` element with `data-duration`, the drawn
  controls, `ol.vz-lyrics` with one `li` and one `data-t` per line, and then the one thing this block adds — a
  `<p class="dim">` **inside the figure, after the `<ol>`**, carrying the explanation: what an archaic form means,
  where a word comes from, how the line is built. One paragraph, and it explains the words, never the block. `data-kind="mixed"`, no `data-move`, no `load`.
- **fits** — full only. It is the same vehicle as `musicPlayer` and would be a waste of a third: separate because the
  width decides whether the block works at all. Not `mediaSnippet` (a transcript with questions against it) and not
  `readText` (the words without the voice): here the recording is the lesson and the paragraph is the only prose.
- **width** — full (the line is the unit; a half width breaks the one-line-one-row contract the highlight depends on)
- **vary** — four long lines with an explainer → the same four with two words glossed individually rather than the
  whole clause → the explanation withheld to the end of the section, when the words are the test.
- **can't** — the same licence and provenance rules as `musicPlayer`, through the same tool, and the same rule for the
  `figcaption`: credit, not build log. The explainer never
  becomes a commentary on the song's quality, and never more than one paragraph — a second turns the transcript into a
  reading lesson; and it is not a place to hide the answer, since a lyric printed under the line being tested is the
  answer.
- **scores** — purpose 8/10 · fun 6/10 — singing is the most engaging material on the page, and a printed lyric is
  worth less than a heard one.
    
 ### [03] <|TEACH|OPTION> <FULL> Music Player with 4 lines of lyrics and a paragraph of explainer 
- **markup**:<h3> = `<the song's title>`, a `.panel` that contains `figure.vz-play`, <h4> = `<who performs it> from `figcaption``, `<audio class="vz-audio" src="../assets/<name>.mp3" data-duration="<decoded length>" controls preload="metadata">`, where `data-duration` is the length measured at authoring time and is what the bar, the clock and `End` use — a browser's own `duration` for a VBR file is an estimate; then the drawn controls — a `.vz-btn`, two `.vz-time` readouts and a `.vz-bar` with `.vz-fill` and `.vz-knob`, the bar being `role="slider"` with `aria-valuenow`; then `<ol class="vz-lyrics">` with one `<li>` per line, `data-t` in seconds on any line whose time is known.; - 2 columns below: 
	1. `ol.vz-lyrics` with one `li` and one `data-t` per line. Row contents never wrapped or truncated, column expands to fit, column 2 shrunk or skipped if necessary.
	2. One paragraph explains the words (never the block) or points out the connection to the lesson (eg. what an  archaic form means, where a word comes from, how the line is built, etc..).`data-kind="mixed"`, no `data-move`.
- another `.panel` below 
- **source**: audio sourced only through `node qa/audio.mjs
  --file="File:<name>.ogg" --lyrics="line|line|line" --out=<name>` — fetch the licence, refuse anything outside
  **public domain / CC0 / CC BY**, download Wikimedia's MP3 transcode (MP3 plays where Ogg does not), cut, measure,
  and print the markup, the provenance row and the things to check. A build never curls a URL itself and never types
  a timing by hand: the tool is the only path from a song to a block, because it is the only thing that holds the
  licence gate and the arithmetic. What it does, in order: (1) **the licence first** — the Commons API, before a byte
  of audio, so a commercial track cannot enter `assets/`; (2) **the sung phrases** — 20 ms RMS windows, a silence is
  240 ms or longer under 2% of peak, and the sound between two silences is one phrase; (3) **cut after the last line
  given**, inside that silence, at a frame boundary, no re-encode; (4) **rewrite the cut's VBR header** — an MP3 that
  still carries the original `Xing`/`Info` frame reports the *original* duration and lets the student scrub into
  silence, and one with the frame deleted is guessed at from average bitrate (6% long on this demo's file): the frame
  count, the byte count and the 100-entry seek table are recomputed for the cut; (5) **prove the line times by
  energy** — for every `data-t`, the sound in the 0.5 s after it must be at least 1.5× the sound in the 0.25 s before
  it, because a line starts where silence becomes singing; a time that lands in silence or inside a held note fails the
  run. (A first version re-segmented the cut instead, and refused a correct choir because the cut's loudest moment
  differs and the 2% silence threshold moves with it — the timings come from the recording, and are judged by
  energy.) `data-duration` is the decoded length of the cut, which the tool prints. The words are the build's; the
  audio is one command; and the pair is checked before it can be pasted. `--scan=1` auditions a file without cutting
  it, printing where its phrases start, how long each lasts and whether that shape could be a line at all — the cheap
  way to reject a band recording before the expensive way does.
  
### `lexiconEntry — one word's record: headword, key above it, labels, one sense, one example (teaching)`

- **does** — A word's record, set the way a dictionary sets one: the headword, the key under it, its labels, one
  sense in one sentence, and one example that uses it. It is the only block in this menu that shows how a word is
  *said* without a clip — a word is taught with its sound, or the sound is a lesson of its own.
- **markup** — one `.panel`; the `<h3>` IS the headword (the build letters it, as `formulaFrame` does with its
  skeleton), and the key under it is written by hand in `dictionary.json`'s notation — syllables separated by `·`,
  each set in `<b>`, hanging letters in `<span class="pr-g">` — so it reads exactly as `PronKey.render` would set it
  and the page needs no JS to show it. Then one to three labels in `.chips`, each a word the page uses elsewhere
  (`formal`, `mostly spoken`, `US`) and never a scale the page invented; then the sense; then the example with a
  `.listen` chip carrying `data-say` for the word. `data-kind="teaching"`, no `data-move`.
- **fits** — a third beside a `refTable` of the section's words, half when the example is a sentence; at the head of
  the section that will drill the word, never after it. Not `idiomOrigin`, which is an idiom and its literal trap,
  not `wordFamily`, which is one root's several jobs, and not `formulaFrame`, which is a pattern: this is the record
  of one word, and it is the only one that shows the key.
- **width** — third-> (a record reads narrow; half when the example is a sentence)
- **vary** — one sense → two where they are genuinely different uses → the entry with its labels withheld for the
  student to judge, which is `registerContrast` and no longer this.
- **can't** — one word per block, so eight new words are eight of these or a `refTable` plus these for the three that
  carry a trap; and the key is copied from `dictionary.json` rather than written from the author's ear, because a
  hand-made key here contradicts the key the student gets from the popup on the same word.

- **when it pays** — one word introduced whole — how it is said, where it is used, what it means, one true example; the word a drill below is built on; a written key on a page that has no clip
- **scores** — purpose 8/10 · fun 3/10

### `correctionPlate — a wrong line struck, the right line under it, the change bold in both (teaching)`

- **does** — The line as people say it wrong, the line as it is said right, the changed words marked in both, and one
  clause naming the rule the change follows. Nothing is being looked for: the block *is* the answer, which is why it
  belongs immediately above the block that asks the student to do the same thing themselves.
- **markup** — one `.panel`; the rejected line in `<s>` (**element-as-plate: `<s>`** — the browser's own strike, no class needed), the corrected
  line under it in plain text, the changed words in `<b>` in both, and ✗ / ✓ in `.dim` at the end of each line so the
  pair still reads if the colour is lost to a photocopy. The rule is one sentence in `.dim` under the pair, never a
  second paragraph. `data-kind="teaching"`, no `data-move`, no control anywhere in the block.
- **fits** — directly above the block that asks for the correction (`errorCorrection`, or a `gapList` of the same
  error), never beside it and never after it — a plate that arrives after the answers teaches nothing the student has
  not already done. Not `spotTheDiff`, which hides two versions and makes finding the change the task, and not
  `lineRepair`, which sets the written form against a performed clip: nothing here is hidden and nothing is spoken.
- **width** — half-> (two lines and one clause; full when the lines are long)
- **vary** — one change → two in the same line → the same pair where both versions are correct and the situation
  decides, which is `registerContrast` and not a correction at all.
- **can't** — it shows and never asks, so a section made of plates holds no evidence; and the rejected line has to be
  something people actually say, or the block teaches a mistake the student never made and corrects an imaginary one.

- **when it pays** — showing a correction instead of asking for one; the one error a section is built on, marked and then named; a pair where the change IS the lesson
- **scores** — purpose 8/10 · fun 2/10

### `figurePlate — one drawing and one caption naming what to look at (teaching)`

- **does** — One drawing and its caption. It is the block that owns a picture: the figures themselves are the `####`
  drafts in `IN-BLOCK-VISUALS.md` — depth carried by occlusion, opening and contact shadow, a figure drawn only when
  the point is spatial — and until this entry existed those drafts had no block to sit in.
- **markup** — one `.panel`; the `<h3>` names what the figure is, the figure is an inline `<svg>` whose paint is in
  its own attributes or an `<img>` from `assets/` referenced as `../assets/<name>.<ext>` (**element-as-plate: inline
  `<svg>`, `<img>` from `assets/`**), and then one
  `<p class="dim">` caption naming what to look at in it. Nothing else: no legend table and no label column, because
  a key belongs inside the drawing or inside the caption, and a third element is a second thing the reader has to
  match up. The `.vz-*` drawing CSS lives in `qa/preview-visual.css` and is not lesson-facing, and no new class is
  introduced here, so `qa/overflow.mjs`'s block list needs no entry. `data-kind="teaching"`, no `data-move`.
- **fits** — a half beside the words it illustrates; full only when the drawing is the section's material. Not
  `refTable`, whose content is written, and not `workedItem`, which shows an answer: this is for the figure the lesson
  would otherwise have no place for.
- **width** — half-> (a figure and one caption line; full when the drawing is the material)
- **vary** — one figure → the same object twice, closed and open, so the pair carries the contrast → the figure with
  its labels removed, which asks the student to place them and is a different block.
- **can't** — a figure that only repeats the sentence is worse than the sentence; it may illustrate an item but never
  stands in for the control, since a `<details>`, a hotspot or a hover records nothing and the answer is still a
  radio, a gap or a textarea; and depth improvised rather than drawn from the three cues of `IN-BLOCK-VISUALS.md`
  produces a flat picture that teaches the wrong thing, which is the failure that file exists to stop.

- **when it pays** — the one thing on the page that is drawn rather than written; a point about where something is or how it moves, which words cannot place; giving a passage its picture, with a caption that says what to look at
- **scores** — purpose 8/10 · fun 4/10

### `rubricGrid — criteria down the side, bands across, what to look for in each cell (teaching)`

- **does** — The standards a written answer is judged by: the criteria down the side, the bands across the top, and in
  each cell what that band *looks like in this task*. It is not an exercise — it is read with the student's own text
  in hand, after they have written it, and it is the only block in this menu that judges an answer instead of asking
  for one.
- **markup** — one `.panel` holding one `.chart`; the criteria in the first column, pinned with `<colgroup>`, the band
  names as `<th>` with each band's short descriptor in `.thsub` beneath it, and the top band's cells written as what
  to look for rather than as praise (`uses "yet" twice, both correct`), with a `tr.note` row for the criterion that
  decides a tie. `data-kind="teaching"`, no `data-move`; nothing in it saves a control, so its entry declares no
  multiplier.
- **fits** — directly under the block it judges, at half or wider: the student holds it against their own answer while
  that answer is on screen, so the two never sit in different sections. Not `refTable`, whose rows are the lesson's
  facts, and not `miniProject`'s checklist, which says whether something is there at all: this says how well it is
  done, and a checklist that grew bands has become this block.
- **width** — half-> (criteria plus three bands; full when a cell carries a sentence)
- **vary** — two bands (did / not yet) → three → four where the middle two do the work; the real lever is how much of
  the judgement the descriptor leaves to the reader, not the number of criteria.
- **can't** — it marks nothing, so a rubric with no answer to read against is a wall of adjectives; descriptors have to
  name behaviour a reader can point at in the text, because "clear" and "accurate" describe every answer; and it does
  its work only when the section's copy sends the student back to their own words, since the judge in that sentence
  is the student and not this block.

- **when it pays** — reading a written answer against standards the student can see; the band between "did it" and "did it well"; the mark scheme a `writeBox` or a `miniProject` checklist is too blunt to be
- **scores** — purpose 8/10 · fun 2/10

### `refTable — the lesson's facts as rows, the exception carried in a note row (teaching)`

- **does** — The lesson's facts on the page as a table, arranged so that one row is one case: the thing, its form,
  its example. It is the content with nothing added, and it exists so a section can state something without a
  vehicle inventing a task around the statement.
- **markup** — one `.panel`; the `<h3>` names the set, a `.dim` caption under it names what to do with the table, and
  then the `.chart` — a chart sits in a block, never where a block belongs. A `<colgroup>` pins the short column so
  the cases line up under each other, the header cells name the axis rather than the lesson's topic, a
  `<tr class="note">` carries the exception as one sentence across the full width, and a column of numbers is
  `.chart.center` rather than hand-spaced. `data-kind="teaching"`, no `data-move`, no control anywhere in the block.
- **fits** — half, beside the block that drills it at the same width; full only when the examples are sentences the
  student reads against each other line by line. Three entries in this menu are already a panel round one chart —
  `signalTable`, `collocationMatrix`, `soundGrid` — and each makes a claim it then has to defend (a cue forces a
  form; a tick means the pair is used together; a sound belongs to a position). This one makes none: the columns are
  whatever the content has, which is the case those three would answer by asserting a rule the lesson is not
  making.
- **width** — half-> (full only when the examples must be read across)
- **vary** — two columns → three → four, where the fourth is the exception; then the same table with one cell left
  blank, which is no longer this primitive — an unfilled cell is a drill.
- **can't** — a table asks nothing, so it produces no evidence and needs a block after it that does; and it states
  rows, never the boundary of the set, so a student can leave believing the table is the whole list. If the claim
  is "this cue forces this form", that is `signalTable` — the entry that states the condition rather than the cases.

- **when it pays** — the facts of the lesson laid out as cases; a set small enough to be read at a glance; the reference a later block drills
- **scores** — purpose 7/10 · fun 1/10

### `readText — a passage in one voice with nothing asked of it (teaching)`

- **does** — Ordinary text in a block: a short passage, a notice written out, a numbered method. The student reads
  it, the sentence that carries the point marked in `<b>` so it can be found again, and nothing is asked of them —
  the reading load is the whole of what the block does.
- **markup** — one `.panel`; the `<h3>` names the text and one `.dim` line under it says what the text is for, then
  prose paragraphs, or an `<ol>` where the text is a sequence of steps. One sentence bolded, never a paragraph. The
  panel sets its own measure: a passage stops at the half slot, because prose past it is a line the eye loses — a
  text that will not fit a half is two paragraphs or a different block. `data-kind="teaching"`, no `data-move`, no
  control anywhere in the block.
- **fits** — a half beside the block that uses the text, so the student reads it and acts on it without turning a
  page; full when the text is the section's material rather than a lead-in to it. It is not `dialog`, which is
  several voices with the noise left in, nor `mediaSnippet`, which brings one real line and the questions that go
  with it: this block is written by the lesson, in one voice, and it asks for nothing.
- **width** — half-> (a text is read by the line, so it steps up only when the text is the material)
- **vary** — shorter before longer; then the same text with its marked sentence unmarked, which stops being this
  primitive and becomes the block that asks the student to find it.
- **can't** — it marks nothing and moves nothing, so a page built only of these has asked the student for nothing;
  and anything the student must *notice* rather than *read* belongs in the block that asks about it.

- **when it pays** — the text the lesson is about; a numbered method the student will follow; a passage whose point sits in one sentence
- **scores** — purpose 7/10 · fun 2/10

### `workedItem — one item of the exercise below, solved, with the reason under it (teaching)`

- **does** — One item of the exercise that follows, solved in full: the stem as the block below asks it, the answer
  marked, and one clause saying why that is the answer. It is the model answer without the exercise, and its whole
  job is that the student sees what is being asked of them before they are asked.
- **markup** — one `.panel` holding one item in the same markup as the exercise it precedes, so the model and the
  task are visibly the same object; the correct option in `<b>` where the exercise has options, a filled `input.gap`
  where it has gaps, and the reason in `.dim` beneath so it reads as annotation rather than as part of the answer. No
  `input` in the block at all — a model that saved would be answered by the page. `data-kind="teaching"`, no
  `data-move`.
- **fits** — directly above the items it models, never on another row and never in another section; a model the
  student has to go looking for is not a model. It is not `formulaFrame`, which shows a pattern's slots and fills
  them in turn, nor `predictReveal`, which hides its answer behind `details`: this block shows one item of the
  exercise the student is about to do, solved, and there is nothing to have hidden.
- **width** — third-> (one solved item, above the list it models)
- **vary** — the answer marked with its reason → the answer marked alone → two solved items, one right and one
  wrong, with the wrongness named in the same clause. The last is the only version that shows the boundary.
- **can't** — it shows that a case works, never why, so a lesson that has a rule still states the rule; and it
  models only the cases it contains, so an exercise that will ask something the model never showed is asking for a
  guess.

- **when it pays** — the shape of an answer shown before one is asked for; one item of the exercise below, solved; a written answer in a format the student has never met
- **scores** — purpose 8/10 · fun 2/10

### `hintLadder — three folds of help over one item, the answer inside the last (teaching)`

- **does** — The task stays in the block that asks for it; this block is the *help*, stacked, one fold per step: a
  nudge, the thing to look at, then the worked step, and the answer last. The student opens exactly as far as they
  need. It is the only block in this menu whose content makes another block *easier*, and the only one that lets a
  single exercise be the right exercise for both ends of a class.
- **markup** — one `.panel`; the `<h3>` names the step it belongs to ("if item 4 won't come"), then a `.dim` caption
  saying how many rungs there are and that the answer is the last one, then one `details` per rung — `details` is the
  stylesheet's own fold, dashed and self-contained, so nothing is introduced. The `<summary>` is a label the student
  reads ("step 1 · which form takes a period of time") and never the hint itself; the hint is the `<p>` inside it,
  one sentence. Three rungs by default — nudge, focus, worked step — with the answer *inside* the third rather than a
  fourth, so a student who opens everything has opened the answer once and cannot read it before the steps.
  `data-kind="teaching"`, no `data-move`, no control anywhere in the block.
- **fits** — directly under the block it helps, half; full when the ladder serves a whole section. Not `workedItem`,
  which solves one item *before* the exercise and for everybody, and not `predictReveal`, whose fold holds a story's
  ending: this folds the help, and its position is the tell — it sits after the question, never before it.
- **width** — half-> (a stack of three short folds; full when it serves a section)
- **vary** — three rungs → two, where the middle one is the answer because the task is short → a rung that restates
  the rule, which is the version for a section the class will revise from the page rather than from a notebook.
- **can't** — it holds the answer, so it is never evidence on its own, and a class that opens every rung at once has
  answered for itself; a first rung that already says what to do is a reveal with extra clicks; and a ladder of five
  rungs is a lesson the student reads instead of doing.

- **when it pays** — one task that has to serve a class of mixed ability; support the student can take as far as they need and no further; the step between "no idea" and "the answer"
- **scores** — purpose 9/10 · fun 4/10

### `memoryHook — letters down the page and the word they spell (teaching)`

- **does** — The one artefact that makes a list stick: the letters down the side, the word each stands for, and the
  picture that welds them together. It does not pretend to be an explanation — it is for the list whose only
  available teaching *is* memory, and it says so by being shorter than the thing it stands for.
- **markup** — one `.panel`; the `<h3>` IS the hook (`A-B-E-T`), then one `<p>` per letter — the letter in `<b>`, an
  em dash, the word it stands for — so it reads down the page as a column, which a table would rule into cells and
  break. One `.dim` line carries the picture ("a **b**ig **e**lephant **a**te **t**wo"), which is the part that does
  the work; a second `.dim` line, only when it exists, carries where the hook fails ("it says nothing about the
  -ing form"). `data-kind="teaching"`, no `data-move`, no control anywhere in the block.
- **fits** — third or half, after the rule it abbreviates and never instead of it. Not `formulaFrame`, which marks
  the moveable slots of a pattern the student then fills, and not `refTable`, which sets out cases to be read: this
  is one string to be memorised, and it is only worth its ink where the alternative is not remembering the list.
- **width** — third-> (a column of letters and two captions; half when the picture line is a sentence)
- **vary** — the author's hook → the class's own, letters given and words left as gaps, which is a `gapList` with a
  mnemonic in it; then the hook with one letter blanked, recalled aloud in class.
- **can't** — it is not a rule, so it never arrives instead of one; a hook whose letters spell the answer teaches
  nothing to remember; and no hook survives translation — the words it stands for are English, so a student who
  memorises a string they cannot unpack has learnt a word they cannot use.

- **when it pays** — a list that has to be held rather than understood — an arbitrary order, a set with no reason inside it; the thing a section will be recalled under pressure for; a class that keeps losing one item
- **scores** — purpose 8/10 · fun 6/10

### `falseFriend — the Portuguese instinct, the English meaning, the sentence it ruins (teaching)`

- **does** — The word the student brings from Portuguese, the English word it looks like, and what the English one
  actually means, with one sentence where the instinct produces something nobody says. `PEDAGOGY-MAP.md`
  [AUTHORING] requires a false cognate to be presented together with its pair, and this is the block that presents
  it: the instinct is named as an instinct, never as an error, because it is the student's first language working
  correctly on the wrong word.
- **markup** — one `.panel`; the `<h3>` is the English word — the block is about *that* word, as `lexiconEntry`'s
  headword is — then two labelled lines, the instinct in `<span class="pt" lang="pt">` (the stylesheet already sets
  Portuguese and says so to a screen reader) and the English meaning in plain text; then the trap sentence in `<b>`;
  then one `.dim` clause on why the two words diverged — a shared Latin root, a borrowed meaning. `data-kind="teaching"`,
  no `data-move`, no control anywhere in the block.
- **fits** — directly under the `lexiconEntry` for the same word, or as the section's second block where the word is
  already met; half. Not `correctionPlate`, which corrects a form the student produced and stops at the sentence, and
  not `minimalPairs`, which is two sounds: this is two languages, and the error it kills lives in the meaning.
- **width** — half-> (two labelled lines, the trap sentence and one clause)
- **vary** — one pair → the pair where both words are correct and mean different things, in a sentence the student
  can already read → the English meaning withheld for the student to supply, which turns the plate into an exercise
  and is `itemList`.
- **can't** — one word per plate, because the block's value is the moment of feeling the pull, and a list of five
  removes the moment; the instinct has to be one this student's first language really produces, never a near-miss
  invented by the author; and it never presents Portuguese as broken — the line says the words diverged, not that
  one of them is wrong.

- **when it pays** — a word the student already "knows" and knows wrongly; the Portuguese word that pulls the English one out of place; the one meaning error no amount of grammar can fix
- **scores** — purpose 9/10 · fun 5/10

### `concordance — six real lines with one word down the middle (teaching)`

- **does** — Six to eight lines of real English with the same word down the middle of each, so the company that word
  keeps becomes visible before anyone names it. It is data-driven learning in the sense Tim Johns gave the term: the
  student is the researcher and the page is the printout, and what is being taught is that a habit can be *found*
  rather than be told.
- **markup** — one `.panel`; a `table.chart` of three columns — the words before the word, the word in `<b>`, the
  words after it — the middle column pinned narrow by `<colgroup>` so the eye runs down one axis, which is the whole
  point of the display. No `tr.note` holds the rule: a note row, where there is one, marks an outlier line ("this one
  is here on purpose"). Lines are short enough to read at a glance at half width. `data-kind="teaching"`, no
  `data-move`, no control anywhere in the block.
- **fits** — after the form has been met and before the rule is stated, or instead of stating it; half. Not
  `collocationMatrix`, which pairs words the lesson chose and asks for a tick, and not `refTable`, which asserts
  cases: this asserts nothing, and the rule it teaches is the student's own sentence.
- **width** — half-> (a column of short lines; full when the lines are long enough that the middle word stops
  standing out)
- **vary** — six lines → three, enough for a small word and not for a big one → two words in one table, where the
  difference between their patterns is the lesson.
- **can't** — it is evidence and not a rule, so a rule written above it has spent the block; six lines invented by the
  author only *look* like data, so each has to be a line somebody could have said; and if the pattern is not visible
  in six lines the content is not ready for this block — write the rule and use `refTable`.

- **when it pays** — letting a pattern be seen instead of asserted; the small words whose behaviour is a habit rather than a rule; a class that asks "but why?" about a form nobody can explain
- **scores** — purpose 9/10 · fun 5/10

### `rubyLine — a line with a key set above each word (teaching)`

- **does** — The line with a key set above each word, the way East Asian text carries its reading above the
  characters: ruby annotation, `ruby` and `rt`, which is the browser's own device and needs no CSS. It is the only
  block that keys an entire line, and the only one where the key and the word are read in one glance.
- **markup** — one `.panel`; the line as one `<p>` (**element-as-plate: `ruby`/`rt`**), each word wrapped as
  `<ruby>thought<rp>(</rp><rt>thawt</rt><rp>)</rp></ruby>` — the `rp` pairs are what a reader without ruby support
  sees instead of a lost key, so they are never omitted. The `rt` is set above the browser's default (about `.8em`, so
  the key is legible at arm's length rather than small print), and its text is written in `dictionary.json`'s notation,
  one word at a time. A `.dim` caption says in words what the keys are for, since `rt` text does not survive a copy or
  a screen reader. `data-kind="teaching"`, no `data-move`.
- **fits** — the line the section will then drill, before the drilling; half. Not `lexiconEntry`, which is one word's
  whole record, not `syllableLab`, which divides one word, and not `soundGrid`, which places one sound: the unit here
  is the word inside a line.
- **width** — half-> (a line and its keys — the keys double its height, so a long line is two lines or full width)
- **vary** — every word keyed → only the four that are hard, which is what a real reader needs → the keys given and
  the words withheld, which is a gap set and a different block.
- **can't** — a key over every word is unreadable in a narrow box, so it is never squeezed; the key is copied from
  `dictionary.json` rather than written from the author's ear, or it contradicts the popup on the same word; and
  because `rt` cannot mark a syllable, a stress pattern inside a word still needs its own block.

- **when it pays** — keying a whole line at once, above the words; a line that will be said aloud and has four sounds nobody expects; the moment a student needs every word's key at the same time and a column of entries will not fit
- **scores** — purpose 8/10 · fun 6/10

### `backChain — the tail of a line, then longer tails, then the whole line (teaching)`

- **does** — The line built from its end: the last word, then the last two, then the last three, out to the whole
  phrase. Back-chaining is what fixes a tail, and English puts its trouble at the end of the sentence — a student who
  starts at the beginning arrives at the tail with nothing left. Not one word is new; only the order is.
- **markup** — one `.panel`; a right-justified staircase of `<p>`s with no margin between them — shortest first, so
  six rungs fit one line each inside a third-width block — each a *tail* of the same line and each carrying its own
  `.listen` chip whose `data-say` is exactly that fragment, so the student hears the rung and not the sentence; the
  last `<p>` is the whole line. The `<h3>` names the line's job ("the ending, not the start"), and one `.dim` line says
  what to do: say each rung twice before moving down. `data-kind="teaching"`, no `data-move`, nothing saved.
- **fits** — beside the line itself, once its meaning is settled; third or half. Not `emphaticBeat`, which decides
  *which word* carries the stress, not `syllableLab`, which divides one word, not `minimalPairs`, which is two sounds:
  this is the tail of a phrase, and its mechanism is the order the fragments are said in.
- **width** — third-> (a staircase of fragments; half when the fragments are long)
- **vary** — five rungs → three, for a short line → the rungs given and the final word withheld, which makes it a gap
  set and no longer this.
- **can't** — it cannot teach meaning and is no substitute for one; every rung has to be a tail of *that* line and
  not a new sentence, or the staircase becomes five phrases; and the clips are one voice, so a back-chain teaches
  that voice's tail and no other.

- **when it pays** — a line whose ending collapses when it is said; the rhythm at the end of a phrase; a student who can start a sentence and cannot finish it
- **scores** — purpose 8/10 · fun 6/10

### `etymologyTrail — a word's stops: language, form, date, meaning then; used only once the lesson has made the word strange (teaching)`

- **does** — The word's journey, stop by stop: the language it came from, the form it had there, the date it entered
  English, and what it meant on the way. It answers the one question a rule cannot — why a word is spelled and used
  the way it is — and it answers it with a story, which is why it is the one explanation students repeat.
- **markup** — one `.panel`; a `dl` — a `<dt>` per stop carrying the date and the language, a `<dd>` under it
  carrying the form and what it meant then — because a list of stops is a definition list, and a table would rule the
  journey into separate boxes. One `.dim` line at the end carries the payoff ("the spelling froze around 1400; the
  sound kept moving"), which is the sentence the student should leave with. `data-kind="teaching"`, no `data-move`.
- **fits** — beside the `lexiconEntry` for a word with an odd spelling or a doubled sense; third or half. Not
  `idiomOrigin`, which is an idiom's literal reading against its figurative one, and not `falseFriend`, which is two
  languages pulling one word: this is one word's own past, and its value is that it makes an exception explicable
  instead of arbitrary.
- **width** — third-> (four stops and the payoff line; half when the dates need the room)
- **vary** — four stops → two, for a word borrowed once → the stops given and the dates withheld for the student to
  order, which is a sequencing task and a different block.
- **can't** — it is never reached for a word the lesson has not already put in front of the class: an etymology whose
  oddity nobody has met answers a question nobody asked, and a class learns to skip the block. Every date and form is
  checked, because a made-up etymology is an error the student keeps for life; it
  never explains present usage, only present oddity; and two trails on a page is the ceiling — the third turns the
  lesson into a history of English.

- **when it pays** — a spelling the student has just asked about; a word whose sense drifted and left the old one behind; the question "why is it like that" that no rule answers
- **scores** — purpose 7/10 · fun 7/10

### `itemList — numbered items, one option set each, nothing else (training)`

- **does** — Numbered items with options, one answer each, and nothing else: no clock, no sorting, no score beyond
  right and wrong. The block is the exercise instead of a mechanism containing one, which is the whole reason it
  exists — a lesson whose single block needed nothing added had no vehicle to call.
- **markup** — `.qgrid > .qitem` with `.qnum`, `.qstem` and `.qopts` of `label > input[type=radio]`, two to six
  options set by what the item has to discriminate; `name` is `a<sec>c<block><item>`, and `style="--rows:N"` on the
  block tiles the items down a column. The grid is the presentation, so it is never worked around: `.qnum` sits in
  its own column and the stems line up under each other without a single space written for alignment, and `.qopts`
  wraps its own row under the stem — a `padding-left` that fakes the indent breaks both at the first long option.
  `data-kind="training"`, `data-move="spot"` or `"choose"`, `data-level` at or above the lesson number. No gap and
  no textarea anywhere in it, so this block can never be `produce`.
- **fits** — third when the options are words, half when an option is a phrase, and never full: a full-width row of
  four radios is a row with three quarters of it empty. It is the substrate every training vehicle here already
  contains, which is the point — but a list that is meant to be answered under a clock is `skeetRange` or
  `whackMole`, one that is meant to be sorted is `catchBasket`, and one that must be remembered is `stackDrop`: those
  are this block plus the thing that made them worth choosing.
- **width** — third-> (half when an option is a phrase)
- **vary** — more items before longer options; then an item whose two options are both grammatical, which is the
  `contrast` move in the same markup.
- **can't** — it never produces language, and it carries no memory aid, no clock and no stake, so a page of these
  and nothing else is a quiz pretending to be a lesson.
- **load** — qty ×1.0 at 4 → ×2.0 at 8

- **when it pays** — the plainest marked block — pick the option that fits, item after item; a single block of recall with no mechanism; the exercise a section needs when no vehicle's mechanism is what the content is
- **scores** — purpose 6/10 · fun 3/10

### `gapList — whole sentences with one word missing from each (training)`

- **does** — Whole sentences with one word missing each, and the student writes it in. The sentence around the gap is
  the evidence that decides the answer, so the item is the frame and not a vocabulary test.
- **markup** — `.blanks.sent` inside the `.panel`, one `input.gap` per sentence and the sentence written whole
  around it — never a label with a gap hung after it, because the sentence is the content and a label is a heading
  the student has to guess from. `name` is `a<sec>c<block><item>g1`, and `style="--rows:N"` on the block tiles the
  sentences so the set reads as a column of frames rather than a wall. `data-kind="training"`, `data-move="produce"`,
  `data-level` at or above the lesson number.
- **fits** — half, under the primitive that presents the form; the rule and the sentence it decides sit on one
  screen, or the student is guessing from memory between two of them. It is not `wordFamily`, `contextFit` or
  `questionBuilding`, each of which is these gaps and then the thing that makes them a lesson (a family's members, a
  chunk in its situation, a question built from its answer): this block is the sentences alone, for the section whose
  content is the sentences.
- **width** — half-> (a sentence a line; full only when the sentences are long)
- **vary** — the options given beside the gaps → withheld; then two gaps in one sentence, which is where the
  student stops reading the frame and starts fitting words to whatever the blanks have left.
- **can't** — the answer is a string, so a synonym that fits is wrong on the page's terms: put the rule beside it as
  a `refTable` and mark it exactly, or leave it unmarked and read it — nothing in between; and it tests the word in
  a frame, never a sentence built from nothing.
- **load** — qty ×1.0 at 4 → ×2.0 at 8

- **when it pays** — writing one word or phrase into a sentence that is otherwise complete; a form practised inside the sentence it belongs to; the plainest production block
- **scores** — purpose 7/10 · fun 3/10

### `writeBox — one prompt and a box the size of the answer asked for (training)`

- **does** — One prompt and one box: the student answers in their own words to a stated length. It is the block for
  production no key can hold, and the length is stated because a box with no length is a box the student fills with
  any amount of anything.
- **markup** — the prompt in the block, one `<textarea>` below it, and the length written into the prompt where the
  student reads it (`three sentences`, `40–60 words`). The box is the block's item 1, so it is numbered
  `name="a<sec>c<block>1"` like any other control; a box carrying no number falls back to the legacy key, which is
  the text of its parent, so the prompt and the box share one wrapper either way. Set the box's `rows` to the length
  asked for, not to a default — a `rows="12"` box under "two sentences" is the page telling the student to write six.
  `data-kind="training"`, `data-move="produce"`.
- **fits** — half, beside its own model (`workedItem`) where the lesson has one, or beside `rubricGrid` when the
  answer is judged rather than checked, or beside `miniProject` when the lesson builds an artefact. It is not any of
  those: `miniProject` brings a brief, a checklist and a word bank, `predictReveal` brings a scene and a hidden
  ending, `infoGap` brings two panels and a missing piece — this is one prompt and one box, with nothing around it.
- **width** — half-> (one prompt and the box under it)
- **vary** — a stated length → a stated number of required elements → both at once, which is a different demand
  from either alone.
- **can't** — nothing in it is checked by the page, so the prompt must name something a reader can check (the form
  used, the elements present) or the block produces writing that answers no question.
- **load** — qty ×1.0 at 1 → ×2.5 at 3

- **when it pays** — answering in writing where no options exist; one prompt, a stated length, and a teacher's eye; a written answer in the middle of a page of marked items
- **scores** — purpose 7/10 · fun 4/10

### `errorLog — the student's own repeated error as a chart they fill in (training)`

- **does** — A table the student completes and keeps: what they wrote, what it should have been, and the rule in
  three words of their own. Every other block on this page is spent when the lesson ends; this one accumulates, and
  the act of putting the rule into their own three words is the part that works — a copied rule is a rule they will
  look up again.
- **markup** — one `.panel`; a `table.chart` of three columns — `what I wrote`, `the fix`, `the rule` — and one
  `input.gap` per cell, `--gap-w` set per column so the three do not fight each other, one row per logged error. A
  `tr.note` row carries the instruction ("one row per error; the same error twice is the row that matters"). The
  table style is the stylesheet's own and a gap is `[ANSWERS]`' own shape, so a chart of answers introduces nothing
  new. `data-kind="training"`, `data-move="produce"`, `data-level` at or above the lesson number.
- **fits** — the last block of the section the student has just got wrong, or of the lesson after the quiz; half.
  Not `errorCorrection`, which gives five errors and their fixes to the whole class, and not `errorHunt`, which is a
  reading task: this asks for the student's own, and the page supplies none of them.
- **width** — half-> (three columns of gaps; full when the rule column carries a clause)
- **vary** — three rows → six, which is the honest ceiling for one lesson; then the rule column withheld, which
  leaves a correction the student will make again.
- **can't** — nothing in it is checked, so it never counts as evidence that an error is fixed; a log the teacher
  fills in is `correctionPlate` six times and teaches nobody ownership; and the row has to come from a sentence the
  student actually produced, or the page holds a list of errors that belong to no one.
- **load** — qty ×1.0 at 3 rows → ×2.0 at 6

- **when it pays** — the mistake one student makes and makes again; handing the record of an error back to the person who made it; a list that outlives the lesson that produced it
- **scores** — purpose 8/10 · fun 4/10

### `exitTicket — two stems at the end: what I can do, what I still cannot (training)`

- **does** — Two fixed lines and two boxes: one thing the student can do now, one thing they still cannot. The second
  is next lesson's plan, which is the reason it exists — it is the only block here whose content is written by the
  student *for the teacher*, and the only one that is worth more the worse the lesson went.
- **markup** — one `.panel`; two stems, each a plain `<p>` naming its line ("one thing I can do now"), each with its
  own `<textarea rows="2">` under it — the box's height *is* the ticket, and six rows gets an essay from the student
  who has nothing to say. `name` is `a<sec>c<block>1` and `…2`; the stems are short enough that neither box needs a
  wrapper of its own. One `.dim` line says where the second answer goes, in plain words. `data-kind="training"`,
  `data-move="produce"`.
- **fits** — the last block of the page, or of a long lesson's last section; half. Not `writeBox`, whose prompt is
  the lesson's content and whose answer is judged, and not `miniProject`, which asks for an artefact: this asks for
  two sentences about the student's own state, and nothing in it can be marked.
- **width** — half (two stems and two short boxes)
- **vary** — two lines → three, the third being what they would tell a classmate who missed it → the same two lines
  written before the lesson's last section, which is a prediction and no longer this block.
- **can't** — it collects and never teaches; the stems have to be about the student's own state, because "what did
  you learn" gets the section heading copied back; and it is never the page's only evidence, since nothing in it can
  be marked.
- **load** — qty ×1.0 at 2 lines → ×1.5 at 3

- **when it pays** — the last ninety seconds of a lesson; finding out what to start the next lesson with; a class of thirty whose questions never get asked out loud
- **scores** — purpose 8/10 · fun 5/10

### `findSomeoneWho — a trait, who has it, what they said - a room-wide survey (training)`

- **does** — A grid of things other people have done, a column for who, and a column for what they said. The student
  walks, asks, writes a name, then has to say it back — and that last part is the reason it exists: the target form
  is third person, which cannot be produced from a grid about yourself.
- **markup** — one `.panel`; a `table.chart` of three columns — `someone who…` (the trait, written as a full clause
  the student can read out), `who` (an `input.gap` at `--gap-w:7em`, wide enough for a name and no wider), `what they
  said` (a wider gap, `--gap-w:14em`, because the cell holds a phrase) — with one `tr.note` row carrying the rule of
  the room ("ask the question, then write the person and one true sentence about them"). A label in the first column
  ("has travelled") is not something anyone can ask, so the trait is a clause or the block does not work.
  `data-kind="training"`, `data-move="produce"` — the reported phrase is the gap that makes it `produce`, while the
  name column is a field and not language — `data-level` at or above the lesson number.
- **fits** — half, early in the section that will then drill the third person; full when the grid is the section's
  material. Not `infoGap`, which is two panels of asymmetric information exchanged in pairs, and not `measureLocal`,
  which is a chart of conventions: this needs six or more people, and its output is a sentence about someone else.
- **width** — half-> (three columns; full when the traits are clauses rather than words)
- **vary** — traits in the present perfect → traits in the past simple, which is the same grid and a different
  lesson; then the name column withheld and only the reported sentence asked for, which stops the student writing a
  name they never asked about.
- **can't** — it needs a room, so used alone it holds no evidence at all; a trait the whole class shares fills one
  name into every row; and the follow-up sentence has to be demanded in the note, or the grid fills and the third
  person is never produced.
- **load** — qty ×1.0 at 4 rows → ×2.5 at 8 · each extra row is another conversation, not another gap.

- **when it pays** — getting a class on its feet; the third person, produced because someone else did the thing; a form that cannot be practised from a page about yourself
- **scores** — purpose 8/10 · fun 9/10

### `classVote — one item, its options, the truth behind a fold (training)`

- **does** — One question with the answers it deserves, a hand up for each, then the truth behind a fold with what a
  class usually picks written beside it. The block's content is not the question — that could sit anywhere — it is
  that the room committed before it knew, and that the note names how often the room is wrong.
- **markup** — one `.panel`; the question in one `<p>`, then `.qgrid.stack` with one `.qitem` per option (the
  `[ANSWERS]` radio shape, `name="a<sec>c<block><item>"`), then one `details` whose `<summary>` is "the answer" and
  whose body is the answer plus one `.dim` clause on the usual split ("most classes pick *b*, because…"). Options are
  whole sentences where the point is a sentence: a vote between two bare words measures nothing.
  `data-kind="training"`, `data-move="choose"`.
- **fits** — early in the section, before the rule, so the vote is a real guess; half. Not `itemList`, which asks and
  then marks, and not `predictReveal`, whose fold holds a story's ending: nothing here is marked, and the fold holds
  the answer *and* the class's usual mistake.
- **width** — half (question, options and one fold)
- **vary** — three options → five, which is where a vote stops being a majority; then the fold withheld until after
  the section's rule, which turns the same block into a second vote and shows the change.
- **can't** — it marks nothing, so the page's evidence is still elsewhere; an option nobody would pick makes the vote
  unanimous and pointless; and a fold opened at the start is a statement of fact and not a vote.
- **load** — qty ×1.0 at 3 options → ×2.0 at 5

- **when it pays** — a point most of the class gets wrong; committing in public before the answer lands; teaching that being in the majority is not evidence
- **scores** — purpose 8/10 · fun 9/10

### `translateBack — the line, then Portuguese, then the line again in a box (training)`

- **does** — Three stages on one line: the English as given, the same thing in the student's Portuguese, then back
  into English without looking. Comparing stage 1 with stage 3 *is* the evidence — whatever did not survive the round
  trip is what the student has not learnt — and no other block on the page can show that, because every other one
  lets the student answer with the words in front of them.
- **markup** — one `.panel`; stage 1 is the given line in `<b>` under a plain label; stage 2 is a `<p>` label ("in
  Portuguese, however you'd say it") with a `<textarea rows="2">` beneath it; stage 3 is a label ("now back into
  English, without looking up") with a second `<textarea rows="2">`; then one `.dim` line saying what to compare.
  Stage 2 is Portuguese the *student* writes, so it carries no `.pt` — that class is for Portuguese the page supplies.
  `data-kind="training"`, `data-move="produce"`, `name` = `a<sec>c<block>1` and `…2`.
- **fits** — after the line has been met and understood, never before: it tests recall of a line just read, half. Not
  `writeBox`, which asks for the student's own content, and not `dialog`, which is the material itself: this needs a
  given line, and it produces two boxes of which the second is the one that matters.
- **width** — half-> (three stages stacked; full when the line is long)
- **vary** — one line → three in sequence, where the student stops translating word for word; then stage 2 withheld,
  which leaves a plain retelling and loses the point.
- **can't** — the Portuguese stage is not the lesson's content, so nothing is marked on it; a line whose Portuguese
  is a word-for-word map teaches nothing, since the whole point is a line that does *not* map; and stage 3 has to be
  written before stage 1 is re-read, or the student copies.
- **load** — qty ×1.0 at 1 line → ×2.0 at 3

- **when it pays** — showing that a line was recognised and not learnt; the gap between "I understand it" and "I can say it"; a line the student will need under pressure
- **scores** — purpose 8/10 · fun 6/10

### `spacedRecall — cold prompts from an earlier lesson, answers behind a fold (training)`

- **does** — Three things from an earlier lesson, asked cold, with the answers behind a fold: a form, a word, and the
  rule in the student's own words. Everything else on the page is about today; this is the only block whose content
  is not on the page at all, which is exactly what makes it the block that finds out whether a lesson stuck.
- **markup** — one `.panel`; three numbered prompts, each written as a question rather than a label ("the past of
  *take*, in a sentence about last night"), each with one `input.gap` at `--gap-w` sized to its answer, or a
  `<textarea rows="1">` where the answer is a sentence; then one `details` whose `<summary>` is "the answers".
  `data-recalls="<pid>"` carries the roadmap pids it reaches back to — that attribute is what makes this a recorded
  retrieval rather than a warm-up — and the answers sit at the level of the lesson that *taught* them, never today's.
  `data-kind="training"`, `data-move="recall"`, `data-level` at or above the lesson number.
- **fits** — the first block after the introduction, or the block before the quiz; half. Not `gapList`, which tests
  today's form in today's sentences, and not `miniProject`, which is production: this is retrieval, and it is the
  only block a lesson uses to keep an older lesson alive.
- **width** — half-> (three prompts and a fold)
- **vary** — three items → five, the ceiling before it becomes another quiz; then one item from three lessons ago
  beside two from last week, which is the version that finds the real gap.
- **can't** — it finds out and never teaches, so every item it fails needs a teaching block beneath it; it must not
  ask for today's material, since that is not retrieval; and the fold is a check, never a crutch — the answers are
  read after all three are written, not opened first.
- **load** — qty ×1.0 at 3 items → ×2.0 at 5

- **when it pays** — the third lesson in a row that needs last week's form; a class that "did" it and cannot do it; evidence of what survived a week
- **scores** — purpose 9/10 · fun 5/10

### `noticeCard — three places outside the page, one gap each (training)`

- **does** — Three places to listen or look and a line to write down what was caught in each, filled in after the
  lesson and brought back. It is the only block in this menu completed *away* from the page, and the only one whose
  content is the student's own week rather than the lesson's material.
- **markup** — one `.panel`; three lines, each a place named whole ("on a bus, at the front", "a shop sign in the
  centre", "the subtitles on one song") with an `input.gap` after it at `--gap-w:12em` for the line caught, then one
  `.dim` line saying what happens to it next lesson ("say the line, and say where it came from"). The places have to
  be places this student actually goes — a museum in a town that has none is a homework that cannot be done, and the
  block is then a lie about the week. `data-kind="training"`, `data-move="produce"`, `data-level` at or above the
  lesson number.
- **fits** — the last block of a lesson, half, once — at the end of a section whose point was that the language is
  outside the room. Not every lesson: a card filled in weekly stops being collected and starts being performed. Not
  `measureLocal`, which is a chart of conventions read on the page, and not `miniProject`, which is an artefact built
  from a word bank: this one returns with the student's own material and no key.
- **width** — half (three places and three short gaps)
- **vary** — three places in the same week → one place and a stated kind of line ("an apology you overheard"); then
  the place column withheld and only the line asked for, which loses the *where* and with it the point.
- **can't** — nothing in it can be checked, so a student who invents three lines is indistinguishable from one who
  heard them; the places must be reachable; and it must never come back to nobody — a card nobody reads is the last
  one that gets filled in.
- **load** — qty ×1.0 at 3 places → ×2.0 at 5

- **when it pays** — taking the lesson out of the room; a class that hears no English outside it; material the page cannot supply because only the student's week has it
- **scores** — purpose 7/10 · fun 6/10

### `comicStrip — wordless panels with a line under each (training)`

- **does** — Four wordless panels and a line under each. The events are decided by the pictures, so the only work
  left is the language — which is exactly what a student who freezes at "write a story" needs. The sequence is the
  scaffold: nothing has to be invented, only said.
- **markup** — one `.panel`; a `table.chart` of two columns and two rows, each cell a `<img src="../assets/<name>.<ext>">`
  (or an inline `<svg>`) at `style="width:100%"` (**element-as-plate: inline `<svg>`, `<img>` from `assets/`**) with an `input.gap` under it at `--gap-w:100%` — the picture fixes the
  event and the gap carries the sentence, and the strip reads left to right, top to bottom, because that is how the
  event happened. Every image is a local file in `assets/` and its source is named in the caption: a hotlink breaks on
  the day the host moves. **The block opens with one instruction line naming the tense** (`Describe what is happening in
  each picture, using the past simple`) — the tense is the exercise, and a strip that does not name one collects four
  free sentences. `data-kind="training"`, `data-move="produce"`.
- **fits** — half-> (two by two; full when the pictures are the section's material); after the narrative tense has
  been taught and before free writing. Not `figurePlate`, which is one drawing and a caption the page supplies, and
  not `predictReveal`, whose story has a hidden ending: here every event is on the page and the words are not.
- **width** — half-> (a two-by-two strip and four captions)
- **vary** — four panels → six, where cohesion between them becomes the work → the panels out of order with numbers to
  write in, which is a sorting task and no longer this.
- **can't** — the pictures decide the answer, so a panel that could be described a hundred ways needs a stated element
  ("use *while*") or the marking is arbitrary; four panels that could sit in any order teach nothing about sequence;
  and the images are never remote.
- **load** — qty ×1.0 at 4 panels → ×2.0 at 6

- **when it pays** — a sequence of events with no words in it; narrative tense practised where the order is given; a class that writes nothing when asked to write a story
- **scores** — purpose 8/10 · fun 9/10

### `dataBar — bars whose length is the value, then the sentence about them (training)`

- **does** — Two to four real figures, each drawn as a bar whose length *is* the value, and one gap for the sentence
  that reports the comparison. Grammar arrives attached to a number, which is the one kind of content a student cannot
  bluff: "twice as many" is either true of the bars or it is not.
- **markup** — one `.panel`; the labels and figures as plain text, each bar a `<p>` whose `style` carries its width as
  a percentage of the largest value (`style="width:62%;height:14px;background:var(--blue);margin:0 0 .8em 15px"`) — a
  bar's length is one number, so it is set in `style` and needs no class — then one `input.gap` per sentence at
  `--gap-w:100%`, and one `.dim` line crediting the figures ("2019 census"), because a number with no source is a number
  the student may repeat. **Every bar carries the same 15px inset** (`margin-left`), so the bars stand apart from the
  labels as a column: an uneven inset changes the length a student reads, and a length that lies is worse than no bar.
  `data-kind="training"`, `data-move="produce"`.
- **fits** — half, beside the section on comparatives or quantities; after the forms, never before. Not `measureLocal`,
  which converts a unit, and not `refTable`, which sets out cases: here the bars are *facts* and the work is the
  sentence that says what they show.
- **width** — half-> (two to four bars and one sentence each)
- **vary** — two bars → three, which forces "the least" as well as "more" → the figures withheld and only the widths
  given, which is a guess and no longer a fact.
- **can't** — the number must be real and sourced, or the page teaches false content in correct English; a bar that
  does not match its own label is worse than no bar; and four bars is the ceiling — a fifth turns a grammar block into a
  reading task.
- **load** — qty ×1.0 at 2 bars → ×1.6 at 4

- **when it pays** — a fact that is easier to see than to say; comparatives and quantities attached to a number the student cannot guess; the sentence a chart is asking for
- **scores** — purpose 8/10 · fun 6/10

### `mapRoute — a drawn map, numbered places, one checkbox each (training)`

- **does** — A drawn map with four or five named places, and a route to write across it. Directions are the one
  everyday task where a student who knows every word still cannot do the thing, because the words are useless without
  the order — and the map is what supplies the order.
- **markup** — one `.panel`; an inline `<svg>` street map (**element-as-plate: inline `<svg>`, `<img>` from `assets/`**)
  with **no depth and no art** but enough of a town to route
  through — two high streets crossed by two side streets, the streets named in small text, and each place a rectangle
  carrying **a numbered disc** and its name, the number being the only thing that links the drawing to the task under it.
  Below the map, **one checkbox per place** (`<label><input type="checkbox"> 3 Park</label>`), because ticking a place as
  it is passed is what turns a route into a sequence rather than a paragraph; then one `input.gap` per leg at
  `--gap-w:100%`, each naming its two ends by number and name ("from the station to the post office: …"); and one
  `.dim` line limiting the student to the place and street names on the map. An `<img>` from `assets/` is allowed where
  a real map is the material, and is never remote. `data-kind="training"`, `data-move="produce"`.
- **fits** — half-> (a map and two legs; full when the map is the section's material); after the imperative and the
  prepositions of place have been taught. Not `figurePlate`, which is a figure and a caption, not `spaceScene` (a
  draft), which places *at / on / in* as point, surface and enclosure, and not `measureLocal`: here the drawing is the
  material for instructions.
- **width** — half-> (a map and the legs under it)
- **vary** — two legs → four, which forces "carry on past"; then the destination given and the start withheld, so the
  student has to ask the question before writing the answer.
- **can't** — the map has to be legible at half width or the block is a full-width figure; a route with more than one
  reasonable answer needs both accepted, so the place names are chosen to close the alternatives; and it teaches
  directions, never prepositions in general.
- **load** — qty ×1.0 at 2 legs → ×2.0 at 4

## [TEACHING]

- **when it pays** — telling someone how to get from one place to another; imperatives and prepositions of place used for a purpose; the one real-world skill a course keeps leaving out
- **scores** — purpose 8/10 · fun 7/10

### `lineRepair — the written line beside the heard line, the difference unmarked (teaching)`

- **does** — Two versions of one line side by side: the written form and the performed form. What changed between them
  is the thing the student is being shown — dropped, blended, moved the stress, added a word — and hearing the pair is
  what names it.
- **markup** — `.itemrow` of two `.panel`s, `<written>` and `<heard>`, the heard one carrying a `.listen` chip. Nothing
  else in the block. **Teaching only**: there is no gap and no marked item, and no label list either — the pair is the
  whole display, because a label the student has to guess at teaches nothing.
- **fits** — full; the two panels must be read against each other. Pair it with the block that makes the student produce
  the same reduction — this one shows it.
- **width** — half+half (two panels read against each other)
- **vary** — one change per line → three → a line performed twice, differently, so the pair itself shows what is stable
  and what was the performer's choice.
- **can't** — the lesson has to supply a genuinely performed clip; and it produces no evidence on its own, so a lesson
  that only shows the pair has asked the student for nothing.

- **when it pays** — the written form beside the performed one; hearing exactly what a performer changed; a pair that needs no exercise to make its point
- **scores** — purpose 7/10 · fun 6/10

### `ruleCard — one rule in three labelled lines: pattern, meaning, use when (teaching)`

- **does** — The mental model in three categories, each with its explainer on the line below it: **`Pattern:`** the form
  itself, **`Means:`** what it says, **`Use when:`** the situation that calls for it. The boundary case — the sentence
  that looks like it should follow the rule and doesn't — sits inside `Use when:`, because the situation it rules out is
  the situation named there; that line is what stops the pattern over-generalising, and what a prose paragraph loses.
- **markup** — `.card` at **one third width**, its **heading left-justified** and only the content under it
  **centred** — the heading is a label, not a title, and a centred heading makes the card look like a poster. Three
  categories as `<b>Pattern:</b>`, `<b>Means:</b>`, `<b>Use when:</b>`, each followed by its explainer as ordinary text
  on the next line, so a label and its sentence never share a line. **Body size throughout**: the labels are bold
  rather than enlarged, because a rule set 4pt bigger is a rule the student reads as decoration. No table; a card
  with a table in it is a `signalTable` wearing the wrong clothes.
- **fits** — third only; it is built for a third, and pairs with a practice block of the same width. At a half it is a
  card with room it does not use.
- **width** — third (built for a third, and it pairs with a practice block of the same width)
- **can't** — one card carries one rule. A card with three rules teaches none of them.

- **when it pays** — the rule in three labelled lines — the pattern, what it means, the situation it is for; stopping a rule from over-generalising; a model the student can hold
- **scores** — purpose 9/10 · fun 2/10

### `formulaFrame — a skeleton with named slots, filled versions under it (teaching)`

- **does** — A pattern as a skeleton with named slots (`<I'd rather> ___ <than> ___`), then two or three filled
  versions. Teaches a shape to reuse rather than a conjugation table to stare at.
- **markup** — `.panel` at **one third width**. The skeleton **is the block's header** — `<h3>` reading
  `I'd rather ___ than ___ .` — not a line inside the block: the frame is the title, so the header names the shape
  the block teaches. The filled versions sit below it, slot content in `<b>` so the student sees which part moved.
  The skeleton and the filled versions are the whole display — no line saying that the frame holds, because the
  filled versions say it.
- **fits** — third; it is built for a third, and pairs with the drill that makes them fill the slots at the same
  width. At a half it is a frame with room it does not use.
- **width** — third (built for a third, and pairs with the drill that fills its slots)
- **can't** — only for patterns that are actually fixed. A frame with moveable parts teaches a false shape, and
  the student will build sentences that look like the frame and are wrong.

- **when it pays** — a pattern as a skeleton with named slots; filled versions beside the frame; patterns that really are fixed
- **scores** — purpose 8/10 · fun 3/10

### `signalTable — cue, the form it forces, an example, then the one trap row (teaching)`

- **does** — The cue in the sentence, the choice it forces, one example each: `<cue>` → `<form it demands>`. This
  is the display form of the condition that decides the item, and it is what makes a rule usable without
  remembering a list of cases.
- **markup** — a `.panel` whose content is one `.chart`, three columns (`<cue>` · `<what it forces>` · `<example>`), four
  to six rows, column one pinned at **about 12%** by a `<colgroup>` and headed **`The Cue`**. The cue is always the
  shortest cell in its row, so every pixel it does not take is a pixel the example gets, and the examples can then
  be full sentences at a half width. A `<tr class="note">` under it names the one cue that is a trap.
- **fits** — half, even when the examples are sentences, because column one no longer eats the row; full only
  when the examples have to be read against each other line by line.
- **width** — half-> (three columns; it grows only when the examples are sentences)
- **can't** — no cue is decisive on its own; a table that reads "always" when the language only mostly does this
  teaches a false rule.

- **when it pays** — the cue in the sentence and the form it forces; a rule usable without remembering a list of cases; the display form of the condition behind an item
- **scores** — purpose 9/10 · fun 2/10

### `soundGrid — one contrast across three word positions (teaching)`

- **does** — One contrast, written three ways the student already reads: **X** and **TI**, the two Portuguese
  substitutions, and **TH**, the English one — each at the start, in the middle and at
  the end of a word, with a `.listen` chip on every example. Teaches that the contrast is a system, not two words, and
  it never hands the student a phonetic symbol this project does not use.
- **markup** — one `.chart` whose first column is the written form and whose other columns are the positions (start,
  middle, end), each cell a word with its own `.listen` chip. Where a written form belongs to Portuguese rather than
  to English — `x`, `ti`, `ão` — the marker carries **both** `class="pt"` and `lang="pt"`, so it is italic and in
  the Portuguese colour: the reader sees at a glance that the row is their first language, and no cell ever says so
  in parentheses.
- **fits** — full; it is three columns of examples plus labels.
- **width** — full (three columns of examples plus row labels)
- **can't** — it is listening and mouth-work only; no written form, and a grid with more than two sounds per row
  stops being a contrast and becomes a catalogue.

- **when it pays** — one contrast in three positions; showing a contrast as a system rather than two words; listening and mouth work with audio on every example
- **scores** — purpose 8/10 · fun 4/10

### `collocationMatrix — two word sets as rows and columns, ticks where they combine (teaching)`

- **does** — Two sets of words as rows and columns, with ticks showing what actually goes together. This is the
  block that stops translation-shaped errors, because a pair that "means the same" in both languages lands in the
  wrong cell here — the verbs that split one first-language word (`make` · `take` · `do` · `have` · `get` against
  `a photo` · `a shower` · `a decision`) are the canonical set.
- **markup** — a `.panel.itemsize-half` whose content is one `.chart.center`: `<set A>` down the side, `<set B>` across
  the top, `✓` and `✗` in the cells. The article belongs with the verb, not with the noun — rows read `make a` ·
  `take a` · `do a`, heads read `photo` · `shower` · `decision` — so a column of `a`s is not repeated down the table
  and the row is the thing that can be said. Column heads are set **2pt below body size**, since they are labels
  over a grid rather than text to read, and the whole chart is centred because a tick matrix is a picture, not a
  paragraph.
- **fits** — half; three items in each set is what a half holds, and five rows still fit its height. Full only when
  both sets go past four.
- **width** — half-> (three items per set is what a half holds; full past that)
- **can't** — ticks are not explanations; if a combination is blocked for a reason (not just by convention), a
  matrix hides it and the reason belongs in a `ruleCard` beside it.

- **when it pays** — what actually goes together; stopping translation-shaped errors; rows and columns as a map of the set
- **scores** — purpose 9/10 · fun 3/10

### `dialog — a scripted exchange with the target form inside the noise (teaching)`

- **does** — A short thread as it actually appears on a screen, with the target language in the middle of ordinary
  noise: a typo, an emoji, two messages in a row, a reply that ignores the question. The student meets the form in
  the wild before they are asked to use it. The container is a plain `.dialog`, the frame any scripted exchange uses —
  what makes it this block is the noise, and the fact that it exists to show one form rather than to model a
  conversation.
- **markup** — a `.dialog` frame: a `<h3>`, then the **baked-in sub-header** `<p><b>Read out-loud with a friend or
  teacher.</b></p>` — every `dialog` carries that line, because the block is a script and silently one is not — then
  the lines with the speaker's name in `<b>` and no other marking. One `.dim` caption under the frame points at
  what to notice; it never explains the whole exchange.
- **fits** — full or half; a thread is narrow, so half-width is natural beside the practice.
- **width** — half-> (a thread is narrow, so it sits beside its practice)
- **can't** — real material dates. If the lesson would break when the slang in it ages, use it as one example
  among several, never as the only presentation of a rule; and a thread whose every line is target language is a
  dialogue pretending to be a chat.

## [MIXED] TEACHING/training

- **when it pays** — the target form inside ordinary noise; meeting a form in the wild first; real threads with typos, emoji and ignored questions
- **scores** — purpose 7/10 · fun 7/10

### `twoWordVerb — everyday verb beside its one-word twin, then the twins matched (mixed)`

- **does** — A chart puts the everyday two-word verb beside its one-word twin, then the student matches the everyday
  column back to the twins it replaces. Production is always the everyday form: it is the one they will be heard
  using, and the twin exists only to prove the meaning is unchanged.
- **markup** — two **half-width** blocks. The first is a `.chart` with the twin in the left column and the everyday form
  filled in the right — it is the source list. The second is a **letter bank**: the everyday forms from that right
  column, numbered, an `input.gap` of one character beside each (`--gap-w:3em`), and the twins lettered `a.`–`f.` in
  one line beneath, so **every answer is a single letter** and the two blocks are the same set twice. Not
  checkboxes: a letter per line cannot be half-right, and a row of ticked boxes records nothing the student can read
  back.
- **fits** — HALF, by width fill: a two-column chart of short pairs plus a few gaps does not fill a full row, so
  it collapses to half width and is centred when it is alone (its lead-in and notes wrap to that width and never
  count as fill). Pair with `registerContrast` when the lesson also has a stiff/spoken axis, or with
  `sentenceSurgery` when the pair changes the order of a whole sentence.
- **width** — half+half (the source chart and the matching exercise, side by side)
- **vary** — reverse the direction (twin → everyday) before widening the vocabulary; then move the verb into a
  sentence with a subject that forces agreement. Rarer verbs make it *unfairer*, not harder.
- **can't** — the pairing has to be genuinely interchangeable, or the chart teaches a false equation; and it is a
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  vocabulary lesson, not a meaning lesson — the student learns the register of a word they already understand.

- **when it pays** — the register of a word already understood; producing the everyday form; proving the one-word twin means the same
- **scores** — purpose 8/10 · fun 5/10

### `contextFit — fixed chunks and what each does, then one situation per gap (mixed)`

- **does** — Whole fixed expressions taught as one unit with audio, then used: the student writes the chunk that fits
  a stated situation into the gap, or matches the chunk to what it answers.
- **markup** — column pair for the bank itself (chunk ↔ what it does), then an item list of situations with one
  `input.gap` each. The `.listen` chip carries the chunk, so the student hears it as one piece.
- **fits** — **two halves on one row**: the bank is `.itemsize-half` and the situations are `.itemsize-half`, because
  the student reads the chunk and writes it without looking away, and neither half fills a full row on its own. A
  `dialog` that shows the chunks in their natural habitat is the other natural neighbour, above or below the row.
- **width** — half+half (the bank and the situations, read without looking away)
- **vary** — start with the chunk fully given and gap only the situation; then invert. The real lever is *which*
  chunks are in the bank: same function, different politeness, is harder than more chunks of the same politeness.
- **can't** — a chunk whose parts can be swapped is not a chunk, so check it is said as one piece; and it never
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  teaches the grammar inside it — that is the point, and also the limit.

- **when it pays** — whole fixed expressions used in a stated situation; matching a chunk to what it answers; teaching a chunk as one piece with audio
- **scores** — purpose 8/10 · fun 5/10

### `registerContrast — two correct versions of one message for a named hearer (mixed)`

- **does** — Two columns contrast a stiff wording with the spoken everyday one; the exercise picks which fits the
  stated audience. The audience is always named, or the item is unjudgeable.
- **markup** — two `.panel.itemsize` blocks: the stiff/loose chart, then the audience task that uses it. The merged
  `tr.note` row — one line held up as both registers at once — is **an option, never a default**: it is included only
  when the lesson's point is that a sentence can be unstuck from its audience, and a build that always emits it is
  teaching that two registers are one.
- **fits** — full; the audience is named in every item, or in a display block above it, because the student cannot choose a
  register for an audience the page never described.
- **width** — half+half (the contrast, then the audience items that use it)
- **vary** — two clearly different audiences before two similar ones. The lever is how close the two audiences are
  (a teacher vs a head teacher vs a friend's parent), not how rude the options get.
- **can't** — needs a described situation; with no audience both columns are defensible. And both wordings must be
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  ones people REALLY say or write: a softened form invented for a phrase that never needs softening (or a stiff form
  for a phrase that never has one) teaches a register the student will never meet, which is worse than teaching
  none. If one of the two forms is not genuinely in use, the contrast is not a contrast — pick another phrase.
  And it only ever *chooses* between wordings someone else wrote — it never produces one, which is why it pairs
  with `politeLadder`.

- **when it pays** — choosing register for a named audience; showing stiff beside spoken; sharpening a choice the student half knows
- **scores** — purpose 7/10 · fun 4/10

### `pronLab — a phoneme beside a mouth position and a contrast table (mixed)`

- **does** — For a sound the student's first language lacks: a mouth-position guide (in Portuguese) beside a
  first-language-vs-English contrast table, then items that test the distinction.
- **markup** — treated as a mini-page inside a section: `.chart` for the contrast, `.panel` for the mouth guide, then
  an item list of radios (which word was heard) or gaps (which spelling carries it).
- **fits** — full width — it is the most space-hungry block here, which is why it earns its place only once or twice
  in a course.
- **width** — half+half+full (the chart and the mouth guide paired, the items full)
- **vary** — a contrast in isolation → the same contrast inside a word → the same inside a phrase. Adding a second
  contrast to the same lab is what destroys it.
- **can't** — needs a real first-language error to be worth the space, so generic "pronunciation" pages teach nothing;
- **load** — qty ×1.0 at 4 → ×2.0 at 8
  and it teaches *one* phoneme — never claim it fixes an accent.

- **when it pays** — one phoneme the first language lacks; mouth position beside a contrast table; testing the distinction after showing it
- **scores** — purpose 8/10 · fun 4/10

### `wordFamily — one root's forms in columns by the job each does (mixed)`

- **does** — One root, its jobs: the student takes `<root>` and puts the right member into each gap by what the sentence
  needs (the doer, the thing, the second noun where the language has one, the how). The lesson is that a family is not a
  set of synonyms — each member fills one slot and only one.
- **markup** — a five-column `.chart` for the family itself (verb · person · thing · **thing2** · description), then an
  item list of sentences with one `input.gap` each, deliberately including one sentence where the student's first
  instinct is the wrong member. `thing2` earns its column because it is where the words that are neither the object nor
  a person land (`production`, `explainer`), and leaving it out pushes them into a cell that is already wrong.
- **fits** — half, beside `collocationMatrix` at the same width; the family and the company it keeps are the whole story
  of a new word.
- **width** — half+half (the five-column chart, then the item list that drills it)
- **vary** — give the family in the box → withhold it and give only the root → include a member the family does *not*
  have, so the student has to reject it. The last is the only version that tests the mental model rather than the list.
- **can't** — only works on roots that really do have distinct members in use; inventing `<root>ness` to fill the grid
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  teaches a word nobody says, and the student will use it confidently.

- **when it pays** — one root's several jobs; showing that a family is not a set of synonyms; choosing a member by what the sentence needs; the second noun a family sometimes has
- **scores** — purpose 8/10 · fun 5/10

### `politeLadder — one request at three degrees of distance for a stated hearer (mixed)`

- **does** — One request, said at three levels of politeness, all three correct, ordered. The student then writes the
  version that fits a stated hearer. Politeness here is a *choice of form*, not an adjective on a word.
- **markup** — block A is one `.chart` of three columns whose **heads are generated from the content** (`Casual` ·
  `Polite` · `Gentle`, or whatever the lesson's three points on the axis are called) with one real line per cell; the
  word *rung* appears nowhere, because a vertical metaphor makes a horizontal table read wrong. Block B is a reword
  task: the line to change, the tone it must arrive in, and one `input.gap` at `--gap-w:100%` — never a multiple
  choice, since choosing a tone is not the skill. The three heads come from a classifier written once and reused by
  any block that needs shades of a quality, because the value of the block is that the axis is shared, not that the
  examples are.
- **fits** — full; three rungs plus a hearer column does not fit a half.
- **width** — twothird (three rungs plus a hearer column will not sit in a half)
- **vary** — two rungs → three → four where the top rung is right for one hearer and *wrong* (oily) for another. The last
  is the item that turns the ladder into a rule.
- **can't** — the rungs must be interchangeable in meaning, or the student is choosing content rather than tone; and it
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  teaches no grammar — only which of several known forms to reach for.

- **when it pays** — politeness as a choice of form for a stated hearer; three correct versions of one request; tone with no new grammar
- **scores** — purpose 8/10 · fun 5/10

### `infoGap — a table with holes and the questions that fill them (mixed)`

- **does** — One half of a situation on a panel, holding the facts and naming what it does not have. The student writes
  the request that gets the missing pieces, in their own words, into the panel marked `<them>`. The information
  asymmetry is what makes the question genuine instead of an exercise.
- **markup** — two `.panel.itemsize-half` blocks. **B's `<h3>` is the instruction itself** — `Ask for the missing
  information from A.` — because a block that needs something from the other student should say so in the one place a
  student's eye lands; its body is then only the form with its gaps, and there is no further caption. A's header names
  what A holds. Neither block carries a `tr.note`: the exchange is the block.
- **fits** — the facts are a **third** and the questions are **two thirds**, on one row, so the unknowns and the fields
  that answer them stay in view together.
- **width** — third+twothird (the facts in the third, the fields in the two-thirds)
- **vary** — the fact needed is named in the prompt → only the category is named → both students must ask, and one item
  needs a follow-up question because the first answer is incomplete.
- **can't** — everything has to be answerable from the page, so it is a written information gap and not a speaking one;
- **load** — qty ×1.0 at 4 → ×2.0 at 8
  and a half that already contains the other half's answers kills it.

- **when it pays** — writing the question that gets the missing piece; real asymmetry between two panels; question and answer as one pair
- **scores** — purpose 8/10 · fun 6/10

### `genreDoc — a real document read for what its parts do (mixed)`

- **does** — A real-world artefact rebuilt as a small table — a menu, a ticket, a timetable, a receipt, a form — plus
  questions only it can answer: what it costs, what it excludes, what happens if you are late, what you must bring.
  This is the block for functional reading, and nothing else in this file covers it.
- **markup** — a `.panel` whose content is one `.chart`, with a `<colgroup>` that **pins columns 1 and 3 to their
  content** (`width:1%` with `white-space:nowrap`) and lets the middle column take the rest: the label and the
  fixed words are short and predictable, the free text is not, so the free column is the only one that should
  stretch. A `<tr class="note">` may carry the one convention that no column header can.
- **fits** — full width, and it is a spine candidate (`material-led`) rather than a mid-lesson beat.
- **width** — full+full (the artefact, then the item grid that asks where in it)
- **vary** — first a value that is printed on it; then a value that must be inferred (a total, an expiry); then what
  the artefact does *not* say — that third step is where real reading happens.
- **can't** — cannot test production, and the authoring cost is the real one: an invented artefact teaches a
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  convention that does not exist. It also needs the lesson to name what the artefact is for, or the questions are
  guesswork.

- **when it pays** — functional reading of a real artefact; questions only that table can answer; what it costs, excludes or requires
- **scores** — purpose 8/10 · fun 4/10

### `signScan — notices, the options each offers, the word doing the work (mixed)`

- **does** — A set of notices from one place, each with a different force; the student matches each to what it does
  to them — forbids, permits, warns, requests — and then names the word doing the work.
- **markup** — **one block only**, the chart: a `<tr class="note">` naming the sign, then four rows whose second
  column holds the same four options **in the same order down every row** — a column whose order changes row by row
  is a second puzzle laid over the first. Radios are grouped per row, so one choice is recorded per sign.
- **fits** — half; pair with `registerContrast` when the lesson also has a soft/hard axis.
- **width** — half+half (notice left, force right; then the operative gap)
- **vary** — from "what does it mean" to "which two notices conflict". Conflict is the difficulty, not longer notices.
- **can't** — recognition only, and it must keep two axes apart: how hard a notice is and how polite it is are
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  different questions, and a block that asks both at once cannot be marked.

- **when it pays** — what a notice does to you (forbids, permits, warns); naming the word doing the work; a set of notices from one place
- **scores** — purpose 8/10 · fun 4/10

### `formFill — a form's fields, one item in each (mixed)`

- **does** — The other direction from `genreDoc`: a blank artefact and a set of details to put in the right boxes —
  the shape of a name, an order for a date, a code, a signature. The conventions are the lesson; the language is
  nearly none, which is why it earns a slot in a course that otherwise only practises sentences.
- **markup** — a half-width `.panel` whose `<h3>` is the document's own title in title case (`Library Card
  Application`), then one `.chart` of label and gap. **The details sit under the chart, not inside it** — a
  `tr.note` in a chart a student must fill in reads as another row to complete; the answers given are one `.dim`
  caption beneath the frame, where a specimen of the completed form belongs.
- **fits** — half to full; must follow `genreDoc` or `measureLocal`, so the student has read what they now write.
- **width** — half-> (the form grows with its own field count)
- **vary** — give the details in the boxes' order, then in a different order, then include one detail that belongs in
  no box.
- **can't** — near-zero language load, so it cannot carry a lesson on its own, and it is only honest when the
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  convention was stated by the lesson rather than assumed by the author.

- **when it pays** — the conventions of a form; details into the right boxes; a language-light slot in a course of sentences
- **scores** — purpose 8/10 · fun 3/10

### `measureLocal — local conventions of number, date, money and measure, both ways (mixed)`

- **does** — The units an artefact uses against the ones the student lives in: order of a date, clock convention,
  money, distance, size, temperature. The student converts both ways and then marks which reading is ambiguous.
- **markup** — one `.panel.itemsize-half` whose content is a `.chart` of two columns headed **`Info`** and **`Write a
  phrase for each:`** — the second head is an instruction because the column is a task, and a task needs its verb — with
  one `input.gap` at `--gap-w:100%` per row. No `tr.note`: a worked example row at the foot of a task table is
  completed by students who read it as row five. One block, never two.
- **fits** — pair with `genreDoc`, which supplies the artefact that made it matter.
- **width** — half-> (the pair plus the ambiguity row, and no further)
- **vary** — a value to convert; then a value that is ambiguous; then a value where the ambiguity changes the answer.
- **can't** — arithmetic crowds out language quickly — keep it to five rows — and it teaches nothing about how anyone
- **load** — qty ×1.0 at 3 → ×2.5 at 6 · pace ×1.5 when data-time · risk ×1.6 at data-retry="0"
  actually speaks.

- **when it pays** — date, clock, money, distance and temperature conventions; converting both ways; spotting an ambiguous reading
- **scores** — purpose 7/10 · fun 4/10

### `accentVariant — a form beside the region it comes from, none of them ranked (mixed)`

- **does** — The same word or line as it appears in material from different places; the student matches each form to
  the material it came from and marks that no form is an error. What a learner needs is tolerance, and tolerance is
  built by seeing variation as normal.
- **markup** — column pair: form left, the material it belongs to right, as radios; one note row stating that the
  differences are regional and not ranked.
- **fits** — half; it must come *before* `minimalPairs` in a lesson, so the student knows which differences carry
  meaning and which do not.
- **width** — half (a form beside the material it belongs to)
- **vary** — start with spelling, then sound, then a form that is old rather than regional.
- **can't** — cannot be built from the lesson's own voice: one speaker cannot carry variants, so the lesson must
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  reproduce them in writing. And it must never be phrased as "which is correct" — the block exists to kill that
  question, not to ask it.

- **when it pays** — tolerance of variation; matching a form to the material it came from; killing the question "which one is correct"
- **scores** — purpose 7/10 · fun 5/10

### `idiomOrigin — the idiom, its literal reading, its source (mixed)`

- **does** — Three things at once: the idiom, what it literally says, and where it came from. Then one line where the
  literal reading would be wrong. The origin is what makes the literal trap stick, which is why this is not
  `contextFit` with extra words.
- **markup** — `.card` with three labelled lines, then one `input.gap` sentence that has to use the idiom.
- **fits** — pair with `contextFit` — origin first, then the bank that files it under what it does.
- **width** — third-> (three labelled lines and one gap)
- **vary** — from producing the idiom to choosing between two that both look plausible.
- **can't** — origins are frequently folk etymology. If the source is not certain the block must say "one story is" —
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  an invented origin is worse than none. It is also one lexical item at a time and never generalises.

## [TRAINING]

- **when it pays** — the idiom, its literal reading and its source together; making the literal trap stick; one lexical item at a time
- **scores** — purpose 7/10 · fun 7/10

### `sentenceSurgery — chunks in the wrong order, one box for the sentence (training)`

- **does** — A sentence or a whole exchange is cut into chunks and handed over out of order; the student rebuilds it.
  Word order, chunk order and linking all show up immediately, because a wrong order reads wrong.
- **markup** — a `.panel`; the sub-header is the task's own words (`Unscramble the sentence:`); the pieces are a
  centred row of `.chip`s whose number badges are set **smaller than the word**, spread at least **20px** apart so the
  eye reads six pieces and not one string; then **one full-width, centred `input.gap`** — one box for the whole
  sentence. A field per position asks the student to do the block's work twice.
- **fits** — full, or half; a bank of short chunks and the order line still read at half, and holding the whole
  sentence in memory is the load at either width.
- **width** — half-> (the bank and the order line it feeds)
- **vary** — more chunks before longer chunks; then remove the numbered scaffold so the whole sentence must be typed.
  A sentence with two defensible orders is not a harder item, it is a broken one.
- **can't** — only sequences with one defensible order; and it tests assembly, not meaning — a student can rebuild a
  sentence they cannot translate.

- **when it pays** — word and chunk order; assembly that reads wrong until it is right; holding a whole sentence in memory
- **scores** — purpose 9/10 · fun 6/10

### `questionBuilding — the answer given, the question to write (training)`

- **does** — Given an answer, form the question; given a context, ask the follow-up.
- **markup** — item list of `input.gap`s, one per answer. The prompt is the answer the student is talking to — never
  a grammar label, or they conjugate instead of ask.
- **fits** — full, or half directly under a `dialog` thread so the question has a conversation to land in.
- **width** — half-> (one gap per answer, in a single column)
- **vary** — same tense with a stated word order before free order; then add the constraint that the question must
  begin with `<question word>`. Loading two new demands into one item is the standard way this drill becomes unfair.
- **can't** — graded on form only, or free answers become unmarkable, so state what counts as right; and it does not
  teach turn-taking — a perfect question in the wrong place is still a failed exchange, and carrying a whole exchange
  is a different block's job (`dialog`).
- **difficulty** — the item is harder than it looks: one answer can often be asked two or three correct ways, and a
  context can be so open that the "right" question is a judgement the page never defined. So each item names ONE
  thing being asked (the tense, the question word, the subject) and accepts every form that fits that one thing, and
  the answer it is built from is specific enough that only one question really answers it. If two different questions
  would both be right and both natural, it is not a harder item — it is a broken one.
- **load** — qty ×1.0 at 3 → ×2.5 at 6

- **when it pays** — forming the question from its answer; asking the follow-up a context needs; form practice with a reason
- **scores** — purpose 8/10 · fun 5/10

### `repairMoves — the moves that repair a breakdown, with the tone of each (training)`

- **does** — The fixed moves for when communication breaks: ask for a repeat, check a guess, restate.
- **markup** — item list: a short exchange with the break marked, then one `input.gap` holding the move that repairs
  it. The `.listen` chip carries the move so the student hears the tone, not just the words.
- **fits** — half, beside a `dialog` thread — this is the emergency exit of the same conversation.
- **width** — half (the broken exchange, then the move that repairs it)
- **vary** — the move alone, then the move inside a longer exchange. What actually makes it harder is *whose* fault
  the break is: repairing your own sentence is a different move from rescuing someone else's.
- **can't** — teaches the move, not the conversation; needs a scene to mean anything, and a teacher to judge whether
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  the student could actually say it under pressure.

- **when it pays** — the fixed moves that repair a breakdown; hearing the tone of the repair; whose fault the break is
- **scores** — purpose 7/10 · fun 4/10

### `minimalPairs — two near-identical sounds and a forced choice (training)`

- **does** — The target word beside its near-neighbours, each with audio, so the ear separates one phoneme by its
  minimal difference. Also covers homophones from a flap T or a silent letter.
- **markup** — item list of radios where the `.qstem` is silence and the answers are the words: the clip *is* the
  question, so `data-say` on the chip supplies the key and no answer is written into the page.
- **fits** — it should sit immediately under whatever displays the pair.
- **width** — third-> (the clip is the stem and the answers are single words)
- **vary** — two words → three → the pair inside a phrase at speed. Three options is the minimum for anything that
  matters, because two is a coin flip.
- **can't** — recognition only; it never shows the student can say it, and it deliberately uses words the student
- **load** — qty ×1.0 at 4 → ×2.0 at 8
  already knows, so it cannot carry new vocabulary.

- **when it pays** — separating two near-identical sounds; homophones from a flap T or a silent letter; a quick ear beat under a display
- **scores** — purpose 9/10 · fun 6/10

### `listenIdentify — one clip, three ternary decisions (training)`

- **does** — A binary or ternary recognition item: which sound, which ending, which stress pattern was heard.
- **markup** — item list of radios with the `.listen` chip doing the asking; the prompt only says what to listen for,
  because a prompt containing the answer makes the clip decoration.
- **fits** — third, or half. It is the cheapest listening block there is, which is also why two of them in a row is
  visible laziness.
- **width** — third-> (the chip does the asking; the prompt only says what to listen for)
- **vary** — three options, then the same three inside a phrase; then the same phrase at natural speed. More options
  beyond three adds guessing, not difficulty.
- **can't** — two options invites a coin flip, so three minimum for anything that matters; and it tells you the
- **load** — qty ×1.0 at 4 → ×2.0 at 8
  student heard *a difference*, not that they know what either word means.

- **when it pays** — a ternary recognition beat (sound, ending, stress); the cheapest listening block; an ear check before production
- **scores** — purpose 8/10 · fun 5/10

### `errorCorrection — a line carrying the classic error, the fix in a box (training)`

- **does** — Pick the correct item among distractors that each encode the classic first-language error, at whatever
  granularity fits: one word or a whole sentence.
- **markup** — item list of radios. Every wrong option is a *real* error a Portuguese speaker makes, so the wrong
  answers are informative rather than random.
- **fits** — third, or half. Cheapest form check there is; it belongs right after the rule is displayed.
- **width** — third-> (the cheapest form check there is)
- **vary** — one distractor at a time before four; then the same error inside a longer sentence where the trigger is
  further away. Adding distractors that are merely odd (not wrong) is what makes it a trick question.
- **can't** — distractors must be real errors, or it becomes a spot-the-typo; and it never shows the student can
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  *produce* the form, only refuse the wrong one — pair it with a gap drill in the same lesson.

- **when it pays** — refusing the classic first-language error; distractors that each encode one real error; word-sized or sentence-sized granularity
- **scores** — purpose 8/10 · fun 5/10

### `syllableLab — a word's beats counted, then the stressed one marked (training)`

- **does** — 
- **markup** —
- **fits** — 
- **vary** — 
- **can't**

- **when it pays** — counting syllables; locating the beat the stress lands on
- **scores** — purpose 3/10 · fun 3/10

### `errorHunt — a short text and a stated number of errors to find (training)`

- **does** — A short text with a stated number of errors; the student types the corrections below. Saying how many
  there are is what makes it a task rather than a browse.
- **markup** — the text as prose, then a short item list of `input.gap`s — one per error, in no required order — with
  the stated count in the instruction line.
- **fits** — full width; it is a section, and it works best immediately after `ruleCard` has stated the rule it hunts.
- **width** — full (it is a section, and a whole text is its content)
- **vary** — the count is the lever: an unstated count is a different, much harder task. Then make the errors the ones
  the rule predicts, rather than the ones that merely look odd.
- **can't** — needs a self-contained text, so it is not a beat-sized vehicle; and a student who finds all the errors may
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  still not know why they were errors — the debrief is the teacher's.

- **when it pays** — proofreading a whole short text; a stated error count that turns browsing into a task; cumulative review of taught errors
- **scores** — purpose 9/10 · fun 6/10

### `oddOneOut — four items, one from another category, with the reason (training)`

- **does** — One item doesn't belong; the student picks it **and says why** in a line.
- **markup** — item list of radios for the pick, plus **one block-level `<textarea>`** for the reasons. The textarea is
  deliberately shared, not per item: it is unmarked evidence, and a per-item textarea would break the one-control rule.
- **fits** — third or half; it opens a section well because the reason becomes the next block's subject.
- **width** — third-> (the pick, then the reasons it asks for)
- **vary** — the odd one out by meaning, then by form, then by usage. Four items → five. What genuinely makes it harder
  is when the odd item is odd for a *subtler* reason, not when the vocabulary is rarer.
- **can't** — if two items can be defended, the item is broken, so the justification is mandatory and the teacher reads
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  it; and it never produces the target form.

- **when it pays** — making a category decision that needs a reason; discrimination the student must justify; a discussion opener
- **scores** — purpose 7/10 · fun 6/10

### `spotTheDiff — two versions of one text, and what changed (training)`

- **does** — Two versions of the same short text, chat or notice; find and state the differences.
- **markup** — worked pair: `.itemrow` of two `.panel`s side by side, then one gap per stated difference number. The two
  panels must be the same length, or the layout gives away where the changes are.
- **fits** — full width — two texts side by side is the whole mechanism, so it cannot be squeezed into a third.
- **width** — full (two texts side by side is the whole mechanism)
- **vary** — the count stated (like `errorHunt`), then unstated; then a version where the difference is one of *tone*
  rather than of content, which is the interesting one.
- **can't** — the differences must be meaningful, not punctuation; and it does not say which version is right — that is
  the next block's job.

- **when it pays** — noticing what changed between two texts; close reading of a chat or a notice; finding the difference before naming the rule
- **scores** — purpose 7/10 · fun 6/10

### `predictReveal — the setup, a written guess, then the end behind a fold (training)`

- **does** — The scene stops mid-way; the student writes what happens next, then reveals the real ending.
- **markup** — open response: the scene as prose, one `<textarea>`, then the real ending inside `<details>` so the page
  hides it until the student has committed.
- **fits** — half or full. It is the cheapest way to make a student care about the next block's vocabulary.
- **width** — half-> (scene, textarea and the revealed ending)
- **vary** — a stated number of sentences, then free length; then give the ending first and ask for the beginning. The
  lever is how much of the situation is withheld, not the length of the writing.
- **can't** — no marking; it produces investment, not accuracy, so it must be followed by a block that does ask for a
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  right answer — otherwise the page has no evidence at all.

- **when it pays** — investment before the answer arrives; writing what happens next; making a scene matter
- **scores** — purpose 8/10 · fun 8/10

### `miniProject — a brief, a word bank and a box: one artefact to make (training)`

- **does** — Build something in English: a plan, a poster, a set of rules, an order. Word bank plus textarea.
- **markup** — open response plus a `.panel` word bank. The brief is a **checklist**, not a paragraph: five things the
  thing must contain, so "done" is visible.
- **fits** — full width, and it wants the page's spine (section 8) built around it — a project in the middle of a quiz
  strand is a detour.
- **width** — full (a spine block, with the page built around it)
- **vary** — fewer required elements, then more; then a length limit, which is the harder constraint. Never raise the
  vocabulary as the difficulty lever — the point is producing with words they have.
- **can't** — free production only, so nothing here trains a form under control and it needs a drill beside it; and it
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  cannot be auto-marked — the checklist is what the teacher marks against.

- **when it pays** — free production toward a real artefact; a word bank and a textarea; end-of-lesson synthesis
- **scores** — purpose 8/10 · fun 7/10

### `emphaticBeat — one sentence and the three readings its stress creates (training)`

- **does** — The same sentence stressed three ways, three meanings. The student is given the *intended meaning* and
  marks which word has to carry the beat.
- **markup** — worked pair, a **half** each: an explainer `.card` that states the pattern and shows the sentence twice
  with the beat marked in `<b>` on each reading, then the item list — the intended meaning in the stem, the stressed
  word written into the gap. The explainer is not optional: a student cannot mark a beat for a pattern the page never
  stated. Radios per word would be tidier but would give away that exactly one word is marked.
- **fits** — half, beside its explainer on one row. It belongs near `registerContrast`, where tone already matters.
- **width** — half+half (the explainer beside the items it explains)
- **vary** — three candidate words → five → a two-clause sentence where the beat can fall in either clause. The lever
  is the number of *plausible* hosts, not the length of the sentence.
- **can't** — only produces a marked word, never the sound; and it is genuinely hard for students whose first language
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  marks emphasis with word order instead — that difficulty is the lesson, not a defect.

- **when it pays** — tying stress to intended meaning; showing one sentence has three readings; tone work beside a dialogue
- **scores** — purpose 7/10 · fun 6/10

### `mediaSnippet — one real line, one named concept, and its questions (training)`

- **concept** — one block, **one named concept**, fixed before the lines are chosen: an apology that is not an apology, a
  compliment with a condition under it, an invitation that expects a no. The tag is what makes two lines a pair instead
  of two interesting quotations.
- **does** — Two real lines that show the **same** concept — a lyric, a headline, a line from a show — each asked the
  same **one** question: who the speaker is talking to. The language is real, so the lesson is
  about reading a situation off a line instead of reading a grammar off a sentence, and the second line of the same
  concept is what turns it into a pattern rather than an anecdote.
- **markup** — two `.card`s, each holding one line quoted (attributed, inside `<blockquote>`), then item-list radios on
  the speaker's situation — one question across both lines, never a second. Each line is short enough to sit whole on one
  line; a paragraph of it is `dialog`.
- **fits** — half beside the rule it illustrates; full when it is the page's material.
- **width** — half-> (beside the rule it illustrates; full only when it is the material)
- **vary** — the second line of the same concept, so the student generalises across two rather than interpreting one; then
  a third from a different medium.
- **can't** — it dates and it is somebody's property: quote a line, never a verse, and never build an item whose answer
- **load** — qty ×1.0 at 4 → ×2.0 at 8
  needs the student to know the source. If it does not stand alone, cut it.

- **when it pays** — reading a situation off one real line; one named concept shown twice; catching what is not said
- **scores** — purpose 7/10 · fun 7/10

### `rhymeCoda — lines whose endings rhyme, marked and named (training)`

- **does** — Lines from one lyric are on the page; the student marks which two rhyme, then decides what letters spell
  the shared sound. Finding a pattern in real text is a different job from judging a supplied pair, and the second
  step is the one that transfers: same sound, different spelling.
- **markup** — item list: one `.qitem` per slot with the candidate lines in `.qopts` as radios; then a column pair
  asking for the spelling of the rhyme's coda.
- **fits** — full width (lines are long); pair with `barCount` when the lesson is rhythm-led, or `pronLab` when the
  sound needs drilling *after* it has been noticed.
- **width** — full (the candidate lines are long)
- **vary** — move from "which two rhyme" to "which one does not rhyme although it is spelled the same". That
  reversal is the difficulty; rarer words are only unfairness.
- **can't** — it needs lines whose rhyme is visible in the spelling, so it cannot carry a sound the student cannot
- **load** — qty ×1.0 at 4 → ×2.0 at 8 · risk ×1.6 at data-retry="0"
  yet hear, and it must never be used with a lyric whose rhyme depends on a performance the page does not have.

- **when it pays** — finding which lines rhyme; the same sound under different spellings; pattern-hunting in real text
- **scores** — purpose 7/10 · fun 6/10

### `songStructure — a lyric's parts named by what each does (training)`

- **does** — A lyric laid out as text with its parts unlabelled; the student names each part by what it *does*
  (returns, turns, closes) and marks the line that comes back changed. Repetition is taught as a decision rather than
  as filler.
- **markup** — `.panel` per stanza with an `input.gap` for the part name, plus one `.chart` comparing the first and
  last appearance of the repeated line.
- **fits** — full width; pair with `moodTrack` when the lesson is about effect.
- **width** — third+third+third+full (a panel per stanza, then the comparison chart)
- **vary** — first ask only what comes back; then what changed inside it; then why that line and not another. Three
  steps, same artefact.
- **can't** — no audio and no song: this is the shape of a text, and presenting it as listening is dishonest. It also
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  cannot teach vocabulary — it assumes the student already understands the lines.

- **when it pays** — naming a lyric's parts by what they do; repetition as a decision rather than filler; the line that comes back changed
- **scores** — purpose 6/10 · fun 5/10

### `barCount — the beats a line lands on, as a number (training)`

- **does** — Count the beats a line actually lands on, and where the count breaks. Rhythm becomes a number the
  student can check, which is what "say it with stress" fails to give them.
- **markup** — column pair: the line left, `input.gap` for the count right; a second row asks which word sits on the
  break.
- **fits** — the count comes first, then the line is laid onto it.
- **width** — half (the line and the count it is laid onto)
- **vary** — count beats, then move the count by one word, then keep the count identical and change the meaning. The
  third step is the whole point and it needs no new words.
- **can't** — speech only: a page cannot carry a metronome, so the count is the lesson's judgement and the block must
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  not present itself as measuring anything. It teaches nothing about meaning.

- **when it pays** — counting the beats a line lands on; turning rhythm into a number the student can check; where the count breaks
- **scores** — purpose 6/10 · fun 3/10

### `moodTrack — a clip and the one line that justifies its mood (training)`

- **does** — A scene, plus three short descriptions of how a track sounds; the student picks the one that fits and
  defends it in one written line. The defence is the work: mood words are easy to guess and hard to justify.
- **markup** — `.qitem` with the scene as `.qstem` and the descriptions as `.opts` radios, then one `input.gap` for
  the "because…" clause.
- **fits** — half or full; pair with a production block (`freeWrite`) so the words are actually used.
- **width** — half-> (the scene, the description and the one gap)
- **vary** — narrow the distance between the three descriptions until all are plausible. Never raise the vocabulary.
- **can't** — nothing is played. It is vocabulary and justification, and grading it as a listening task would be a
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  lie; it also cannot teach genre names it never states.

- **when it pays** — justifying a mood in one written line; the vocabulary of how a track sounds; defending a judgement in language
- **scores** — purpose 6/10 · fun 6/10

### `tabooMap — questions ranked by where they are off-limits, then rewritten (training)`

- **does** — Given situations the lesson has already written, the student marks which question is off-limits in each
  and rewrites one so it becomes askable. Pragmatics as a boundary rather than a list of polite phrases.
- **markup** — one `.qitem` per situation with the candidate questions as radios, then one `input.gap` for the
  rewrite.
- **fits** — half; it must follow the scene block that made the situation concrete. On its own it is abstract.
- **width** — half (the situation and the question it allows)
- **vary** — from "which is off-limits" to "which is fine here and not there". That second form needs two scenes, not
  stronger wording.
- **can't** — **this is the most dangerous block in the file.** It asserts nothing itself, but if the lesson supplies a
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  scene as a national trait instead of a specific situation, the block writes a stereotype into a page and signs it.
  It is only usable when the scene is *a place and a person*, never a people.

- **when it pays** — which question is off-limits in a given situation; rewriting one so it becomes askable; pragmatics as a boundary
- **scores** — purpose 6/10 · fun 5/10

### `humourFlag — a funny line and the flag on what makes it work (training)`

- **does** — A line that is meant to be funny, and the student marks what is doing the work — a pun, an
  understatement, a reversal, a pause — then names what it would lose if translated.
- **markup** — `.qitem` with the line as `.qstem` and the mechanisms as radios, then an `input.gap` for what it loses.
- **fits** — pair with `registerContrast` when two mechanisms have to be told apart.
- **width** — third-> (the line, the mechanism and what the joke loses)
- **vary** — from naming the mechanism to predicting whether a second line will land.
- **can't** — funny is not a rule, and explaining a joke can kill it, so use it once per lesson at most. It must never
- **load** — qty ×1.0 at 3 → ×2.5 at 6
  be graded as though taste were accuracy.

## [GAMES]

- **when it pays** — naming what makes a line funny; what a joke loses in translation; one sharp moment in a lesson
- **scores** — purpose 6/10 · fun 8/10

### `skeetRange — words crossing the screen, shot inside a clock (games)`

- **does** — One flying target per option. Player aims with the cursor and takes **one shot**; a hit scores, a
  miss is spent. No spray, no endless retry — the constraint is what makes it feel like skill.
- **opts** — **2 to 6 discs per item**, one disc per option. Two is the least that is a choice at all; six is what the range's own lanes hold when they are spread over its full height — a seventh crowds the arc into a pile of plaques.
- **width** — full (the range is the content: lanes, arc and clock)
- **skins** — `.game > .game-list` of `.qitem`; the stem is the prompt line, the options are the targets — one
  disc each, so the item's own options (two to six) decide how many fly.
- **art** — one flat ring per option, the word on a plaque over the disc; a thin crosshair that is the cursor; a
  single puff on impact. Every disc takes the SAME line — one arc, one speed, no wobble, no sine wave — and the
  lanes are spread over the full height of the range, so the four words read as one rack, not a scatter.
- **pace** — the range carries a clock 30% slower than the block's own: `data-time` is stretched by 1.3 (the
  lever is `PLUGINS.skeetRange.timeScale`, applied by the runner), so the discs and the timer slow together and a
  word can be read before it has to be shot at. A block therefore writes the deadline it *wants minus 30%* — or
  simply leaves the default and takes the slower range as it comes.
- **can't** — no production, no spelling; one shot per item means a careless click can hide what the student knew.
- **needs** — nothing; `engine4.js` ships it.
- **load** — qty ×1.0 at 4 → ×2.0 at 8 · pace ×1.5 when data-time

- **when it pays** — one-shot word recognition under a clock; arcade stakes that force a commitment; a fast read of what a student really knows
- **scores** — purpose 9/10 · fun 9/10

### `whackMole — lookalike options surfacing, the fitting one struck (games)`

- **does** — One drawn mole per option surfaces from a hole, stamped in stagger; the player hits the one that
  fits before the runner's timer bar empties. The rest duck away the instant an answer lands.
- **skins** — same `.qitem` list; the prompt sits on the HUD line, options become the moles' labels.
- **opts** — **2 to 6 per item**, one mole per option. The garden is **always six holes in a 3×2 grid**, so six options fill it exactly and the layout never reflows between items; below 2 there is nothing to spot among, above 6 there is no hole left for the seventh.
- **width** — full (the garden is a fixed 3x2 of holes)
- **authoring the stem** — the prompt is the thing to FIND, so it is written as that thing and nothing more:
  `past`, `a place you sleep`, `sorry, say that again?` — never `which one is past`, because the moles are
  already the candidates and the sentence only restates the game.
- **art** — inline SVG mole + radial-gradient hole with a dirt rim, rise via `translateY`, reduced-motion path.
- **can't** — recognition only; speed pressure makes it a poor fit for anything needing reflection.
- **needs** — nothing; `engine4.js` ships it.
- **load** — qty ×1.0 at 3 → ×2.5 at 6 · pace ×1.5 when data-time

- **when it pays** — spotting which option fits among lookalikes; engagement in a restless class; exposing hesitation
- **scores** — purpose 9/10 · fun 8/10

### `catchBasket — items falling, sorted into two to four baskets (games)`

- **does** — One word is shown at a time; the player **drags it into the pot that fits** (or taps a pot, or presses
  `1`/`2`). Dropping outside springs the word back, so a slipped finger costs time, not the item. A right drop tips
  water over that pot and **grows a flower in it**; the flowers stay for the rest of the run, one per right answer,
  so the block becomes a garden the class has grown rather than a score.
- **teaches** — sorting a form into a category: past vs now, one ending vs another, which pattern a word belongs
  to. The decision is made in one gesture, so hesitation is visible.
- **opts** — **2 to 4 pots per item**, one pot per option. Two is the smallest sort; four pots is one row at a size the words still read at, and a fifth has no soil left — the same ceiling the `can't` below names.
- **width** — full (the pots sit in a row on the stage)
- **skins** — one word per item (`.qstem`), one pot per option (the radio labels); a correct drop checks that
  option's radio. The word card IS the prompt, so the stage does not print the same words again on the HUD line.
- **art** — inline SVG terracotta pot, water drops over the rim on a right drop, a flower grows out of the soil and
  stays there (six to a pot); the word lifts and tilts while held, a wrong drop shakes.
- **can't** — only two to four pots fit a row; fine distinctions don't fit, and a seventh flower would swamp the pot.
- **load** — qty ×1.0 at 4 → ×2.0 at 8

- **when it pays** — sorting a form into its category; making a rule decision a single physical gesture; showing hesitation in public
- **scores** — purpose 9/10 · fun 8/10

### `stackDrop — a drill answered item by item, the stack built as it is earned (games)`

- **does** — The question arrives as the next block of a tower and the player **puts the right answer on top of it**
  by picking it: the block flies up, lands and **stays in the tower**. A wrong answer tumbles off and the question
  stays exactly where it was, so the tower never loses what was earned and its height IS the progress. The climber
  climbs the tower itself to the chest at the top.
- **teaches** — accumulate-and-complete: the reward is the finished tower, so a long drill has a shape and an end.
  Every answer placed is one item answered, so the tower is the progress bar.
- **opts** — **2 to 4 options per item**, and **6 to 10 items per block**. One item is one block of the tower, so the item count IS the height it climbs: under six there is nothing to climb, and past ten each block is too short to hold its own word.
- **width** — full (the tower is as tall as the item count)
- **skins** — one `.qitem` per block; the question block is the stem, the buttons are the options. Six to ten items
  makes a climb: the tower is half the stage's width and each block's HEIGHT comes from the run's own length, so the
  whole stack stands inside the stage up to ten blocks (the most that keeps a word readable) and a longer run keeps
  that height and slides. The question block IS the prompt, so it is not printed a second time on the HUD line.
- **art** — flat blocks with hard edges, two ladder rails and a rung per answer, a drawn climber, a chest that
  lights up at the top. The tower slides down to keep the newest block in view once it outgrows the stage.
- **can't** — one item per block, so a two-item block has nowhere to climb; timing dominates, so keep the language
  load to a phrase per block.
- **needs** — nothing; `engine4.js` ships it.
- **load** — qty ×1.0 at 4 → ×2.0 at 8

- **when it pays** — giving a long drill a shape and an end; accumulate-and-complete motivation; the tower as progress bar
- **scores** — purpose 8/10 · fun 8/10

### `flapGate — recognition at speed, one gate per right answer (games)`

- **does** — One-button flight. The bird holds its place and the wall scrolls at it; the wall has **real gaps**, one
  per option, and the gap the bird is inside when the wall arrives is the answer. A click on a gap answers at once
  (the honest "I know it" path, and the only one a keyboard or reduced-motion student has); a click anywhere else
  flaps.
- **the stream** — walls are things in flight, not a state of the stage: each one is cut once, flies from the right
  edge to past the left one, and is retired while the next is already behind it. Answering does not stop the flight,
  so a run is **one continuous flight through every gate in it** — only the bricks end it.
- **the wall is the stake** — a right gap is a point and the flight carries on through it into the next question. A
  wrong word costs nothing: the flight continues. Flying into the **brick** costs one of three hearts *and the run* —
  the block starts again at its first question, in the same order, with what was already answered left as it was
  written. A restart is a second attempt, so the score a finished block shows is the **best attempt**, not the last.
- **opts** — **2 to 4 gaps per wall**, one gap per option. The wall is a fixed height and a gap is 65px, so four fill it; a fifth would have to be cut narrower than the word standing in it.
- **width** — full (the wall is a fixed height in 65px gaps)
- **skins** — gaps are options; the prompt is fixed on the HUD.
- **art** — a drawn bird that flaps its wings on every lift, including the one automatic flap as the round opens, so
  it is never falling before the student has touched anything; a brick wall with the words sitting in its gaps; sky
  as a flat fill. Fall is half what it was, lift unchanged.
- **can't** — recognition at speed only, and it is the most expensive of the arcade set.
- **needs** — shared runner + gravity loop.
- **load** — qty ×1.0 at 4 → ×2.0 at 8

- **when it pays** — recognition at speed; arcade engagement; a keyboard and reduced-motion path to answering
- **scores** — purpose 8/10 · fun 9/10

### `wordleBoard — a word guessed to a five-try limit, letter feedback each try (games)`

- **does** — The student guesses the word and presses Enter; the board marks right letter/right place and right
  letter/wrong place. Five rows and the run is over. Hangman is the same engine with a different face (a revealed
  blank row instead of coloured tiles).
- **opts** — **one target word per item**, the same length in every item of a block (the board is built from the answers, so the block must hold to one length), and **2 to 4 options** — the options only carry the evidence radio, because the word itself is typed. Five tries per word and two lives per run.
- **width** — full (the board is built from the answers)
- **skins** — one target word per item, typed into a `gap` at the end, so the evidence is spelling the student
  produced rather than letters guessed. The stem is the clue, so it is not printed a second time on the HUD line.
- **art** — the stage reads left to right: the **clue on the left**, the tile grid and the box you type into as the
  centre pair, and a **message on the right** ("too many letters", "too few letters") that fades in over .5s, holds
  2s and fades out over .5s. The three are centred vertically and the board never grows, so nothing moves when a
  word lands — a wrong length costs a message, not a row.
- **can't** — only words of one fixed length; nothing for phrases, meaning or listening.
- **needs** — nothing; `engine4.js` ships it.
- **load** — qty ×1.0 at 3 → ×2.5 at 6 · risk ×1.6 at data-retry="0"

- **when it pays** — spelling one word to a five-try limit; the deduction pleasure of letter feedback; repeated right-letter evidence
- **scores** — purpose 9/10 · fun 9/10

### `mineGrid — a grid where a wrong move costs a mark (games)`

- **does** — The options are planted as **pairs of batwing saloon doors along a street**, the word hung over the top
  where it can be read. Pick a door and **the figure walks to it**, which makes the choice a character's risk rather
  than a bare click; the door then swings open, because what is behind it IS the answer. **Right:** he goes in, a glass
  clinks on the bar, and the next question arrives on the same street, which never leaves the stage. **Wrong:** a snake comes
  out of the dark and bites him — one of three lives gone, and his drawing changes as they go. Three bites end the run.
- **teaches** — commitment under stakes. Because he only gets three mistakes, a guess has a price, so the student
  reads before moving. Every wrong pick leaves its radio blank, so the blanks are the teacher's evidence.
- **opts** — **exactly 4 per item**, one door per option: the street holds four doors, so four is both the floor and the ceiling — a lesson that writes two or three options leaves the street short.
- **width** — full (the street holds four doors)
- **skins** — four options is what the street holds: one door per option. The lives belong to the RUN, not to the item,
  so they are set on the way in and never between items — a life that came back with the next question would mean a
  miss cost nothing. The count is the HUD's, and the stage draws no second copy of it.
- **marking** — exact: on a right answer only the door he opened turns green; on a wrong one that door turns red with
  the snake in it and the right door is outlined, and nothing else on the street reacts.
- **art** — a street and a boardwalk, a signed doorframe per word with a drawn batwing door that swings on its hinge,
  a drawn snake, and a figure with hurt and down states.
- **can't** — one answer per door; a lesson that writes two or three options leaves the street short.
- **load** — qty ×1.0 at 4 → ×2.0 at 8 · risk ×1.6 at data-retry="0"

- **when it pays** — making a guess cost something; reading before moving; leaving blanks a teacher can read as evidence
- **scores** — purpose 8/10 · fun 7/10

### `crosswordBoard — a board of crossing words, one clue per word (games)`

- **does** — A **real generated crossword**. Each `.qitem` carries `data-answer` (the word) and its `.qstem` is the
  clue. The engine lays the whole set out at once: the first word across, every later word placed so it **crosses**
  an existing letter, anything that cannot cross dropped into its own row below. A shared letter is one cell, so
  typing it once fills both words and **solves both items** — that is the point of a crossword and why this is a
  board, not a drill. A full word typed wrongly costs **nothing**: nothing clears, nothing is scored and its cells
  stay as they were typed, so the student keeps at it until the word goes green. A right word is **a point**, and
  **five points wins the board**; under five it simply stays open with whatever it has, because there is no clock and
  no lives here.
- **opts** — **2 to 6 words per block**, and **2 or more options per item**. Each item's `data-answer` is the word (letters only, at least two of them) and its `.qstem` is the clue; every answer has to be spellable or the board refuses the run, and six short words is the ceiling — the grid sizes its cells to fill the stage down to an 18px floor, and a seventh word drops below it.
- **width** — full (the grid sizes its cells to fill the stage)
- **art** — the site's own grid: a flat block per gap, a small number in the corner of each word's first cell.
  The cells are sized to **fill the stage** (10px of margin all round, height and width each get a say), and the
  clue for the word you are typing sits in its own panel **beside the grid** — one clue on the stage, never the
  same clue twice.
- **can't** — the set must be spellable and the words short, or the grid gets fat; words with no shared letter can
  only sit in their own rows, so a lesson whose vocabulary shares nothing is a bad fit.
- **needs** — nothing; `engine4.js` ships it. Authoring: `data-answer` on each `.qitem`, clue in `.qstem`.
- **load** — qty ×1.0 at 3 → ×2.5 at 6 · pace ×1.5 when data-time · risk ×1.6 at data-retry="0"

- **when it pays** — spelling a word to its clue; showing that words share letters; a board where one shared cell solves two items
- **scores** — purpose 9/10 · fun 8/10

### `echoPads — a sentence built one word at a time from pads (games)`

- **does** — Builds **one sentence, word by word**. `data-first` is the opening the student is given ("Yesterday
  I"); every `.qitem` after it is the next word of that sentence, and its options are the word that fits after
  what is already on the board plus **three that are close but do not fit the grammar** of the words placed. A
  right pad puts the word in the sentence, answers that item and moves on. A wrong pad costs one point and does
  **not** move on: a sentence cannot continue past a word that does not fit, so the student tries that same word
  again. At zero points the run is over.
- **teaches** — word order and collocation under a constraint the student can see: the sentence on the stage IS
  the question, so every choice is judged against the words already placed rather than against a rule recalled.
- **opts** — **exactly 4 pads per item**: the word that fits plus **three near misses**, and one item per word AFTER `data-first`, so the sentence's own word count is the item count. One sentence per block — a second sentence is a second block, not a longer run.
- **width** — full (the sentence strip and the word pads)
- **skins** — one `.qitem` per word of the sentence, `data-a` the word that fits, three near misses as the other
  pads. `data-first` the given opening, `data-lives` the countdown of points (default 10) — the HUD pair counts
  `left/start` down, one point per wrong pad. `data-time` does not apply: a board you fill at your own pace. The
  sentence and the hint line are the prompt, so nothing is printed a second time on the HUD line.
- **art** — a paper sentence strip that fills in as words land: the given words in a dashed tan chip, the placed
  words in green, a caret holding the next place; four word pads on the neon arcade scene; "Say the sentence"
  reads out the sentence as it stands.
- **levels** — **two of them, and neither is shown.** `data-level` on the block decides, else the lesson page's own
  `L`, and a lesson numbered 20 or above is level 2. Level 1 prints the hint line. **Level 2 prints no hint at all** —
  not "Next word:", not even the wrong-pad line — so the reading has to come off the sentence; every other pad in an
  item must then be **impossible** in that position, not merely unlikely, which is an authoring rule the engine cannot
  test. The start card is the game's own line: "Build a sentence - Dont get distracted by similar words!"
- **can't** — one sentence per block and one word per item, so the wording has to be planned end to end; nothing
  here trains spelling or listening.
- **guardrail** — the sentence comes FIRST and the pads are generated second, one word at a time, LEFT TO
  RIGHT: for each `.qitem`, read the words already on the board (`data-first` plus every item before it), then
  write the one word that fits and check the three distractors against that same reading. A distractor that
  could follow what is placed is a broken item — the student is reading the sentence, not recalling a rule, so
  the pad that also fits is the pad that teaches nothing and scores a coin flip. Generating the three options
  before the phrase is written, or from the whole sentence at once, is what produces them.
- **needs** — nothing; `engine4.js` ships it (the voice is the built-in speech).
- **load** — qty ×1.0 at 3 → ×2.5 at 6 · pace ×1.5 when data-time · risk ×1.6 at data-retry="0"

- **when it pays** — word order and collocation one word at a time; a constraint the student can see on the stage; planning a sentence end to end
- **scores** — purpose 9/10 · fun 7/10

### `bingoCard — a card of words with the spoken form called (games)`

- **does** — A 3×3 card is built from the item's own options **plus decoys drawn from the rest of the block**, so the
  card is never trivially small. The card arrives shut behind a velvet curtain and the voice **calls the correct
  answer's word exactly once** (the clip when the item has one, else the right option's text — never the question).
  There is no replay button: paying attention to the one chance IS the activity. A **3·2·1 countdown** in its own
  card at the grid's left edge runs while the caller speaks; at zero the curtain rises, and a **7·6·5·4·3·2·1
  countdown** in a card at the right edge starts. Stamp the tile you heard and the item is answered. Let the second
  countdown reach zero and the curtain **falls on the item**: it is marked wrong and the point it was worth is gone.
- **opts** — **2 to 9 options per item**. The card is nine tiles: the item's own options first, then decoys drawn from the rest of the block to fill it — so a two-option item is padded to nine, a nine-option item has no room for decoys, and more than nine cannot be shown at all.
- **width** — full (nine tiles plus a drawn card)
- **skins** — tiles are options, so the words on the card are the lesson's words. The instruction is the block's own
  `.game-how` and nothing else — nothing inside the stage prints "listen" as a second heading.
- **marking** — exact: the tile the student stamped turns green or red, and nothing else on the card reacts. The right
  tile is never revealed, so what the caller said is never shown.
- **art** — a bingo hall: red velvet curtain that drops away on an ease-in curve (it starts almost too slowly to
  notice, then falls), footlights, two countdown cards in the site's own paper-and-ink style, and a stamped tile
  that takes a hard double border.
- **can't** — recognition of the spoken form only, one word per item; the card needs a few options across the block
  or the decoy pool runs dry, and a lesson block cannot set the two countdowns — they are the game's own clock.
- **needs** — nothing; `engine4.js` ships it (uses the built-in voice). Leave `data-time` at 0.
- **load** — qty ×1.0 at 4 → ×2.0 at 8 · pace ×1.5 when data-time · risk ×1.6 at data-retry="0"

- **when it pays** — recognising the spoken form of a word; one-chance attention with no replay; hearing under a countdown
- **scores** — purpose 8/10 · fun 9/10

### `ladderRun — a quiz run that carries the score already earned (games)`

- **does** — A full-height rail with a climber and a chest at the top. One rung per right answer, a **safe rung every
  five**, and the height is **heard** as well as seen (a rising motif as you climb). A wrong answer slides the climber
  back to the last safe rung — so what was safely earned is kept, which is what makes a ladder a ladder and not a
  list. Longer lists make a taller climb, so the same block scales from a five-item drill to a full quiz.
- **opts** — **2 to 4 options per item**, and **5 or more items per block**. One right answer is one rung and the safe rung is every fifth, so under five items there is no fall to catch; above five the length is free, the climber simply climbs further.
- **width** — full (the climb is drawn against its own height)
- **skins** — the `.qitem` list is the ladder; the options are the buttons under it.
- **art** — the ladder is drawn to the run's length, the climber steps up on a right answer and slips on a wrong one,
  the chest lights when he reaches the top.
- **can't** — one continuous arc, so it wants to be the page's quiz, not a mid-lesson drill; and a fall back to the
  safe rung is deliberately harsh, so keep items fair.
- **authoring the answer key** — **exactly one option may be defensible.** Two options that are both grammatical, or
  both true of the clue (a real answer and a close synonym, `stay` and `will stay` under `if it rains`), is a broken
  item: the student who reads carefully is the one who gets it wrong. Write the wrong option so it is wrong for a
  reason the lesson has taught, and read every item back as a picky teacher before shipping it.
- **needs** — nothing; `engine4.js` ships it.
- **load** — qty ×1.0 at 3 → ×2.5 at 6

- **when it pays** — the page's quiz rather than a drill; keeping what was safely earned; scaling one block from five items to a full test
- **scores** — purpose 9/10 · fun 8/10

### `bossRaid — a drill with a visible cost for every miss (games)`

- **does** — The student **picks a fighter on the intro card** — sword, wizard or archer — and the choice is not
  decoration: it decides HOW the right answer lands. The swordsman steps in and cuts, the wizard throws a fireball that
  bursts on the boss, the archer's arrow flies straight and fast. So the hit is thrown by the character the student
  made, which is the whole appeal of a fight game.
- **the boss answers back** — a wrong answer is the boss's turn, and it does not repeat itself: it takes turns between
  a **bite** (it lunges at the fighter) and **acid** (it spits a drop that flies across the arena and lands on him).
  Three hits taken and the fighter goes down, so a long drill has an ending that belongs to the answers, not a timer.
- **teaches** — a long drill with a visible cost. The HP bar is the boss's health and it only moves when answers are
  right; the fighter's three hits are the only thing that shortens the run.
- **opts** — **2 to 4 options per item**. The fighter's three hits are the run's only brake and the boss's HP is the item count, so length is free but the answer row is not: at five buttons the arena is all buttons.
- **width** — full (fighter, boss and the hit count)
- **skins** — the `.qitem` list is the attack sequence; the options are the answer buttons. Nothing about the fighter
  is authored — the game offers its own three — so a lesson block is just a list of items.
- **art** — a torch-lit arena, three drawn fighters with their own weapons, a fireball, an arrow and an acid drop as
  separate sprites, a drawn boss with bite/hurt states, a slash arc, an HP bar.
- **can't** — ritual stakes can mask weak items; every item must still be defensible on its own.
- **load** — qty ×1.0 at 3 → ×2.5 at 6 · pace ×1.5 when data-time

- **when it pays** — a long drill with a visible cost; ritual stakes and a chosen fighter; an ending that belongs to the answers, not a timer
- **scores** — purpose 8/10 · fun 10/10

### `trainOrder — adjective order made physical in one sentence (games)`

- **does** — The adjective slots are the flatbed cars of a train standing under a low bridge, and the student
  **loads the adjectives onto it**: every adjective waits on the loading dock at one size, and dropping one into a
  car makes it **grow to the height its own slot is allowed**. The load in the right car tops out on one level line
  just under the bridge; an adjective put a car too far back grows through the deck. The train then leaves: a clean
  one runs out under the bridge and is stamped CLEARED; a wrong one hits it, the plank over that car breaks, the car
  tips over and a heart goes with it. **An empty car is fine**, and an adjective placed too early only leaves a gap,
  though it still scores nothing, because the car it stands in was not its car.
- **ADJECTIVES ONLY** — this game teaches the adjective order and nothing else. Every item is one adjective; a block
  must not use it for verb order, for tense, for word classes it cannot place, or for anything whose correct place
  the eight slots do not name. **Difficulty is free**, and **the number of adjectives is the level's lever**: two at the
  lowest levels, rising to eight once the student is expected to hold the whole order in mind. The block's level never
  widens what the game can test — a harder block is a longer train, not a different question.
- **the question is the noun's frame** — the prompt card reads **`That's a _______ <noun>`**, taken from
  `data-noun` on the block. So a lesson generation **picks one noun and two to eight adjectives to describe it** and
  writes only the adjectives as items; the noun is never an item and never a load. Eight is the ceiling (there are
  eight slots, and no two adjectives may share one), two is the floor, and **the train stands one car per adjective** —
  a train of eight adjectives is an engine and eight flatbeds, a train of two is an engine and two. **The train is
  centred in the yard at every length**, so a short train is a bigger train rather than a short one stuck to the left.
- **teaches** — a SEQUENCE, with a consequence for breaking it. Opinion → Size → Age → Shape → Color → Origin →
  Material → Purpose is the whole content; the train is what makes the order physical instead of a rule to memorise,
  and the two ways of being wrong (through the bridge / a gap with the load short of it) are the two ways a sentence
  can sound wrong.
- **skins** — one `.qitem` per ADJECTIVE: the stem is the adjective, and the options are the eight slots, one radio
  per slot, `value` naming it (`opinion`, `size`, … or `1`–`8`). `data-a` on the item is the slot its adjective
  belongs in, so the answer that saves is the ordinary radio of the car the student chose. **No car carries a
  label**: the slots are read as positions, not as names. Author the adjectives in order so the dock reads like the
  sentence. No `data-train` any more: one block is one train.
- **opts** — **2 to 8 adjectives per block**, one per slot, and the options ARE the eight slots (one radio per slot).
  Eight is the ceiling because there are eight slots and a second adjective in one slot has no place to stand; two is
  the floor, because one adjective is not an order — there is nothing for it to be before or after. **Where in the
  range a block sits is a level decision**, not a template default: the game is unchanged by it, and the cars, the
  crew, the dock and the drive all follow the count.
- **levers** — `data-noun` (the noun the frame names, required in practice: without it the card shows the blank and
  nothing after it), `data-depart` (seconds the train waits on the dock before it leaves with whatever is loaded,
  default 30, `0` = wait for ever), `data-lives` (trains that may be wrecked before the run ends; absent = one per
  train, at most three), `data-slots` (replace the eight slot names, pipe separated).
- **art** — **a plain train**: a locomotive drawn from flat boxes (cab, boiler, chimney, dome) and one flatbed
  wagon per adjective, every deck the same height, wheels on the rail. What grows is the load on the deck. A lattice
  girder bridge in eight planks (one per car, so the collision breaks the piece the wrong car hits) and a
  slammed CLEARED / DERAILED stamp. Behind
  the yard: a sky, two hazed ridges of hills with snow on the two high peaks, and the ground the rails are laid on —
  the train is somewhere, not on a flat beige field.
- **fits** — full width only: eight cars cannot be read at a half.
- **width** — full (eight cars cannot be read at a half)
- **can't** — one order, so it trains one rule: it cannot contrast two orders, and it is not a production exercise —
  the sentence is built, never written or said. Word-level vocabulary has to be known already, since the sentence is
  never spelled out beyond its own words.
- **needs** — nothing; `engine4.js` ships it. Author four to eight words per train, and put the ORDER on the page
- **load** — qty ×1.0 at 3 → ×2.5 at 6 · pace ×1.5 when data-time · risk ×1.6 at data-retry="0"
  above the block (a chart or a one-line rule) — the game tests it, it never states it.

- **when it pays** — one fixed adjective order made physical; the two ways a sentence sounds wrong; a rule felt instead of memorised
- **scores** — purpose 9/10 · fun 8/10
