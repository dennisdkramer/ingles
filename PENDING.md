# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
A batch and its steps must be removed from this file when all of the batch's steps are completed. Any batch or step which is stale must be deleted.
---

# [CURRENT]
## [B15] - one nine-place street map, drawn properly, that every lesson reuses "the reference was supposed to have nine ... make a decision - either make the svg place art MUCH better and more detailed, or fetch simple art ... make sure the markup on capability map makes it clear that the lessons will all use the same map and never draw their own map" <`capability-map.html`, `business/lesson4,8,12,16,20,24,25`, `PEDAGOGY-MAP.md`>
### [S1] the decision: the drawing is redrawn, nothing is fetched
- **Decision and its reason**: the map stays an inline SVG in the sheet's own palette (`--ink`, `--tan`, `--paper`, `--blue`, `--green`). A fetched picture adds a licence, a second file and colours the sheet does not control, and cannot be re-toned with the page. What is wrong is the drawing, not the technology, so the drawing is what is replaced.
- **Nine named places** on a four-street grid, each a recognisable frontage instead of a box: station (canopy, clock, platform edge), post office (postbox on the pavement), bank (columns and sign), café (awning and tables), library (tall windows), market (stalls), park (trees and railings), bus stop (shelter and bench), hotel (door canopy and windows). Kerbs, road markings, a zebra crossing, two cars, tree shadows, one 2px line weight throughout, and every name on a sign in the drawing, never text beside it.
- **One geometry table drives the drawing and the ticks**: each place's `%` left/top written once in the map's own comment, so a lesson cannot place a label off its building.

### [S2] the base map is built, and checked at both ends of its size range
- Drawn in `capability-map.html` as the single reference example and rendered at page width and at 360px to confirm the names stay legible, the ticks sit on their buildings and nothing overlaps. Nine places, nine labels, nothing decorative that could be read as a control.

### [S3] the map declares that a lesson imports it and never draws one
- The markup, its comment and a new `PEDAGOGY-MAP.md` rule all say the same thing: this drawing, its `viewBox`, its nine places and its coordinate table are the map every lesson imports verbatim; a lesson writes its own `qstem` and its own labels and nothing else, and never draws a street map of its own.
- The file carries the drawing twice on purpose - once as the map specimen (`#map`, `:225`) and once inside the `#mapq` block that shows the map carrying a `.qnum` item (`:747`) - and the two are kept **byte-identical**: one geometry table, one `viewBox`, one aria-label. The comment above both says so, and says a lesson copies the drawing verbatim and writes only its own `qstem` and labels.

### [S4] every page that draws a map is moved onto it
- `lesson4` (two maps, `:333` and `:405`), `lesson8` (`:243`), `lesson12` (`:286`), `lesson16` (`:220`), `lesson20` (`:260`), `lesson24` (`:251`), `lesson25` (`:299`). Each keeps its own question and answer; the drawing, the labels and their coordinates are the shared ones, and any item that named a place the old four- or eight-place drawing did not have now names one of the nine.
- A coordinate audit afterwards: every label's `%` equals its place's row in the table, and every tick lands inside its building's rect.

### [S5] QA and commit
- `check` on every touched page, `cmcheck`, `rowctx`, `mapcheck`, `liquid`, `build-lessons --check`, and a render of each map at page width; then commit and push.

## [B16] - the new lessons say literal English, hold one idea per section and size every field honestly "rewrite any prose that is not LITERAL ... the default number of teaching sections in a lesson should be 3 ... prose like 'Analyst is a noun, and a company has five of them' is a critical error ... the audio in 22.6.A is 7 seconds off ... 24.2a ... 24.6c, 24.7d gaps are being set way too wide ... 24.7c block was compressed ... sweep the roadmap one more time" <`PEDAGOGY-MAP.md`, `BUSINESS-ROADMAP.md`, `qa/batchcheck.mjs`, `business/lesson21-25`, `assets/thatway.mp3`>
### [S1] the guidelines take the four new rules, and no existing line contradicts them
- **Section count, in the user's words**, in `PEDAGOGY-MAP.md` under the section/flow rules: "The default number of teaching sections in a lesson should be 3. From 1 to 6 is totally acceptable with defensible utility, but more than that is probably an error rather than a good organization decision."
- **A section beyond the third is defended in the ledger**, one short teaching reason per extra section, as a `sep:` segment on the lesson's line (`sep:S4 - the map asks the student to locate a place, a different skill from asking for one`). The defence is about teaching, never about layout, and "it looked long" is not a defence.
- **Literal language is a rule**: prose states what is true of the language, never a metaphor, a figure of speech or a rhetorical question. `point back`, `holds the sentence together`, and any invented quantity (`a company has five analysts`) are banned. A question is written under the same rule as prose: no stem whose answer depends on one company's private vocabulary.
- **A field is as wide as its answer, and its default is fixed**: the field keeps its form (`input.gap`) and its rule (1.3x the longest accepted answer). What changes is the default and the ceiling: the widest field a half-row cell can hold is measured once against the row widths the sheet uses and written into the guide (34em at 16px), any answer that needs more is capped there and the item takes the row alone, one item per row. A field never spills its cell and never shrinks the block beside it; the neighbour that looks compressed is the symptom of a field that was allowed to grow.
- **A drawing has the number of things its questions need**: the street map is B15's nine-place drawing, imported and never redrawn; an item may only name a place that drawing shows.
- Reconcile with `:34` ("a section can contain multiple ideas ... division without need is not good organization") and `:41` (the four questions before a shape is chosen) so the count line reads as the same rule at a different scale; add the `sep:` requirement to `qa/batchcheck.mjs` as a warning when a lesson declares more than 3 sections and none carries a defence.

### [S2] lesson 21 is three teaching sections, not six, and its quiz is one block
- Merge the six sections into three, each holding the ideas that belong to one teaching concept: **(1)** a role is a noun phrase - a head word and what hangs off it (the chart, the fill, the MC, the apposition prose); **(2)** the phrases that say what you do (gloss, cards, flip, the matching and the decide/do/keep chart); **(3)** the first minute (the dialog, its gapped version, the game, the return-the-question prose, the translations and the chunks).
- The quiz keeps its four kinds of item but becomes **one block with rows**, the row spacing carrying the separation the user approved, so the page has 4 blocks where it had 12.
- Nothing is deleted in the merge: every item, key, chart and example survives; only the `h2` boundaries and the block wrappers change.

### [S3] every line of prose on 21-25 is rewritten to literal English
- Sweep the five pages for prose that is not a plain statement about English: the "points back" family, `holds`, `carries`, `lives on`, any metaphor for grammar, and every stem or option that implies a fact about one company. Each is replaced with the literal statement - what the word replaces, what the form is called, what the sentence says.
- Generalise the examples that only work inside one company: `I'm the analyst who owns pricing` and `the two APIs nobody wants to touch` become sentences that hold in any office, while the structure being taught (head word + what hangs off it) is unchanged. The roadmap's `Examples` lines are sample sentences, not a licence to copy one office's vocabulary into a general course; the pages stop citing them verbatim, and S6 sweeps the roadmap lines they came from so the two cannot drift again.
- Check the questions and the options under the same rule, and re-read each lesson's `Focus` and `Real-world relevance` line for a claim that reached the page as a fact.
- Portuguese stays exactly where it is, marked `.pt`; this is an English-side rewrite only.

### [S4] the formatting faults on 21-25, each one measured before and after
- **24.2a**: one row, one cell per question, the authored question line given the width it needs; no arbitrary splitting of six items into two cells of three.
- **24.5b**: handled by B15 - the page imports the nine-place drawing, and its item names a place on it. `PEDAGOGY-MAP.md` states the import rule.
- **24.6c, 24.7d**: the fields come back inside the 34em default and 1.3x rule, and any item whose answer cannot fit a half-row is given its own row (S1's rule). **24.7c** then un-compresses, because the field stealing its width is gone.
- Then the same four faults are looked for on 21, 22, 23 and 25 - a long question split across cells instead of given the width it needs, a drawing with fewer parts than its items need, a field wider than its cell, a block compressed by a neighbour - and fixed the same way.

### [S5] the recording and its timestamps come from one run
- `assets/thatway.mp3` is regenerated with `qa/audio.mjs --out=thatway --lines=5,5` and the player figure it prints is pasted into 22 as printed, so the clip, `data-duration` and every `data-t` are one artefact. The 7-second offset means the file in `assets/` and the block on the page came from two different runs; after this they cannot.
- `wheregoing.mp3` in lesson 24 is checked the same way, and both `assets/README.md` rows are rewritten from the run that produced the file that ships.

### [S6] the roadmap is swept for the same faults, and the five new titles follow it
- `BUSINESS-ROADMAP.md` read lesson by lesson (50 of them) with two questions: **is the title direct, literal and explanatory** - does it say what the student will be able to do - and **is each example the most useful, most universal phrase for that concept** rather than one company's sentence. Every title and every `Examples` line rewritten to that standard, the `Vocabulary` lines swept for a phrase that only works in one office.
- The five new pages then take their `h1` from the swept roadmap, so the dropdown name and the roadmap agree, and any example on 21-25 that came from a roadmap line is rewritten in the same pass so the two cannot drift again.

### [S7] the ledger tells the truth about the new shapes, and the gate passes
- The five L21-L25 lines are rewritten: the section lists match the pages after S2, the element lists match the blocks after S2 and S4, and any lesson with more than three sections carries its `sep:` defence.
- `build-lessons --check`, `check` 21-25, `rowctx`, `cmcheck`, `mapcheck`, `batchcheck`, `liquid`, a gap audit (no gap over 34em, every gap at least 1.3x its answer) and a div-balance read of all five pages. Then commit and push.


