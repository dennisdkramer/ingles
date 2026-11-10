# CONTENT_EXAMPLES — A menu of **mechanisms** and skins for content authored in the page's HTML

## [INSTRUCTIONS]

- **A menu, not a checklist.** Nothing here is required to be in any lesson or in any order.
- **The content in the page.** Games drive authored `.qitem`s (stem + optional `.listen` + radios), `input.gap`, or a textarea — nothing else. Whatever the engine animates is presentation; the saved answer is always one of those controls. If a mechanism cannot end in one, it is not a vehicle, it is a decoration. 
- **The tone of a lesson comes from the lesson's copy, never from here.** Every game below is track-neutral, *skins* layered on top — never baked in
- **Every activity that carries answers or fields declares its own multiplier.** Its `###` entry carries `**load**`: the number a build multiplies the block's content level by for the work the block is given, in the shape `qty ×1.0 at <the count it is normally used at> → ×<N> at <its ceiling> · pace ×<N> when data-time · risk ×<N> at data-retry="0"`. **That is a curve across two points, not a ceiling:** the stated baseline is where the activity is ×1.0, the ceiling is where it is ×N, and a block authored *below* the baseline sits *below* ×1.0 — four items is ×1.0 and two is less, because two is half the searching. The arithmetic is in `PEDAGOGY-MAP.md [LEVEL] x` — `load = L × M` with `M = qty × pace × risk`; L is the block's content level on the 1–50 scale and the product is **not** capped, so a deliberately hard block is just a high load — and the activity states the numbers, because only it knows what its own ceiling costs. A build reads that line and never estimates one; an entry with no `**load**` line can be authored at its baseline count and nowhere else.

### Build [Constraints] - Ignore this section for lesson generation

1. There is **no house style**. Look, palette, motion and mood are chosen per game and per track — a kids page may be loud and a business page sober, and neither is more correct. Only these hold, because they are mechanical:
2. **The page must still work if the engine never loads.** The authored `.qitem`s are ordinary radios: they render, save and print with no JS. That fallback is not optional.
3. **No network at run time.** Art is CSS, inline SVG, or a local file. Nothing fetched from another host, so a
   page that ships today still renders in two years.
4. **Fits its slot.** The stage scales to the block's width (`.itemsize` / `-half` / `-third`) and never overflows
   it; no fixed pixel width that a half-width block cannot honour.
5. **Reduced motion is honoured** — `prefers-reduced-motion` removes travel and keeps the state change, so the
   game still tells the student what happened.
6. **Cheap frames.** Animate `transform` and `opacity`; avoid animating layout properties, which jank on a school
   laptop.
7. **Difficulty and content are data.** Every game reads its items from the page and its knobs from `data-*`
   attributes, so a teacher can add items or change difficulty without editing an engine.

- - - 


# [VEHICLES] 
**Step 1 — browse the headings, nothing else.** 

## [TEACHING]

### `lineRepair - (best for: naming what a performer changed; the written form beside the performed one; teaching a small label vocabulary · can't: run without a genuinely performed clip, and it produces no evidence — the labels are taught here, so a practice block has to use them · purpose 7/10 · fun 6/10)`

- **does** — Two versions of one line side by side: the written form and the performed form, with the change named beside
  it — dropped, blended, moved the stress, added a word. Naming the change is the skill the student is being shown;
  knowing the line is not.
- **markup** — worked pair (`.itemrow` of two `.panel`s, `<written>` and `<heard>`), then one label line per change naming
  the operation (`dropped` / `blended` / `moved` / `added`) rather than the word. **Teaching only**: there is no gap and
  no marked item, because the labels are a small vocabulary of their own, and a label the student has to guess at teaches
  nothing.
- **fits** — full; the two panels must be read against each other. Pair it with the block that makes the student produce
  these labels — this one states them.
- **vary** — one change per line → three → a line performed twice, differently, so the pair itself shows what is stable
  and what was the performer's choice.
- **can't** — the lesson has to supply a genuinely performed clip; and it produces no evidence on its own, so a lesson
  that teaches these labels and never asks for one has taught a vocabulary nobody used.

### `ruleCard - (best for: the rule in three labelled lines — the pattern, what it means, the situation it is for; stopping a rule from over-generalising; a model the student can hold · can't: carry more than one rule — a card with three teaches none · purpose 9/10 · fun 2/10)`

- **does** — The mental model in three categories, each with its explainer on the line below it: **`Pattern:`** the form
  itself, **`Means:`** what it says, **`Use when:`** the situation that calls for it. The boundary case — the sentence
  that looks like it should follow the rule and doesn't — sits inside `Use when:`, because the situation it rules out is
  the situation named there; that line is what stops the pattern over-generalising, and what a prose paragraph loses.
- **markup** — `.card` at **one third width**, its content **centred**: three categories as `<b>Pattern:</b>`,
  `<b>Means:</b>`, `<b>Use when:</b>`, each followed by its explainer as ordinary text on the next line, so a label and
  its sentence never share a line. No table; a card with a table in it is a `signalTable` wearing the wrong clothes.
- **fits** — third only; it is built for a third, and pairs with a practice block of the same width. At a half it is a
  card with room it does not use.
- **can't** — one card carries one rule. A card with three rules teaches none of them.

### `formulaFrame - (best for: a pattern as a skeleton with named slots; filled versions beside the frame; patterns that really are fixed · can't: safely frame a pattern with moveable parts — the student then builds sentences that look like the frame and are wrong · purpose 8/10 · fun 3/10)`

- **does** — A pattern as a skeleton with named slots (`<I'd rather> ___ <than> ___`), then two or three filled
  versions. Teaches a shape to reuse rather than a conjugation table to stare at.
- **markup** — `.panel` at **one third width**; the skeleton in `<b>` with `___` for slots; the filled versions
  below, slot content marked so the student sees which part moved. The skeleton and the filled versions are the
  whole display — no line saying that the frame holds, because the filled versions say it.
- **fits** — third; it is built for a third, and pairs with the drill that makes them fill the slots at the same
  width. At a half it is a frame with room it does not use.
- **can't** — only for patterns that are actually fixed. A frame with moveable parts teaches a false shape, and
  the student will build sentences that look like the frame and are wrong.

### `signalTable - (best for: the cue in the sentence and the form it forces; a rule usable without remembering a list of cases; the display form of the condition behind an item · can't: promise decisive cues — "always" where the language only mostly does this teaches a false rule · purpose 9/10 · fun 2/10)`

- **does** — The cue in the sentence, the choice it forces, one example each: `<cue>` → `<form it demands>`. This
  is the display form of the condition that decides the item, and it is what makes a rule usable without
  remembering a list of cases.
- **markup** — `.chart`, three columns (`<cue>` · `<what it forces>` · `<example>`), four to six rows, with
  column one pinned narrow — a `<colgroup>` at about 16% — and headed **`The Cue`**. The cue is always the
  shortest cell in its row, so every pixel it does not take is a pixel the example gets, and the examples can
  then be full sentences at a half width. A `<tr class="note">` under it names the one cue that is a trap.
- **fits** — half, even when the examples are sentences, because column one no longer eats the row; full only
  when the examples have to be read against each other line by line.
- **can't** — no cue is decisive on its own; a table that reads "always" when the language only mostly does this
  teaches a false rule.

### `soundGrid - (best for: one contrast in three positions; showing a contrast as a system rather than two words; listening and mouth work with audio on every example · can't: carry written form, and more than two sounds per row stops being a contrast and becomes a catalogue · purpose 8/10 · fun 4/10)`

- **does** — One contrast, written three ways the student already reads: **X** and **TI**, the two Portuguese
  substitutions (tagged *português*, in italic), and **TH**, the English one — each at the start, in the middle and at
  the end of a word, with a `.listen` chip on every example. Teaches that the contrast is a system, not two words, and
  it never hands the student a phonetic symbol this project does not use.
- **markup** — `.chart`: rows are the three spellings, columns are the positions; the row header is `<b>X</b>
  <i>(português)</i>`, `<b>TI</b> <i>(português)</i>` and `<b>TH</b>`, so the two the student says instead are labelled
  as the first language and the target is not; each cell holds `<word>` plus a `.listen` chip. A `<tr class="note">`
  names the position where the student's own language interferes most.
- **fits** — full; it is three columns of examples plus labels.
- **can't** — it is listening and mouth-work only; no written form, and a grid with more than two sounds per row
  stops being a contrast and becomes a catalogue.

### `collocationMatrix - (best for: what actually goes together; stopping translation-shaped errors; rows and columns as a map of the set · can't: explain a blocked combination — ticks are not reasons, and the reason belongs in a ruleCard beside it · purpose 9/10 · fun 3/10)`

- **does** — Two sets of words as rows and columns, with ticks showing what actually goes together. This is the
  block that stops translation-shaped errors, because a pair that "means the same" in both languages lands in the
  wrong cell here — the verbs that split one first-language word (`make` · `take` · `do` · `have` · `get` against
  `a photo` · `a shower` · `a decision`) are the canonical set.
- **markup** — `.chart` at **half width**: `<set A>` down the side, `<set B>` across the top, `✓` and `✗` in the cells,
  and a `<tr class="note">` naming the one cell students always get wrong.
- **fits** — half; three items in each set is what a half holds, and five rows still fit its height. Full only when
  both sets go past four.
- **can't** — ticks are not explanations; if a combination is blocked for a reason (not just by convention), a
  matrix hides it and the reason belongs in a `ruleCard` beside it.

### `chatSample - (best for: the target form inside ordinary noise; meeting a form in the wild first; real threads with typos, emoji and ignored questions · can't: stay current, and a thread where every line is target language is a dialogue pretending to be a chat · purpose 7/10 · fun 7/10)`

- **does** — A short thread as it actually appears on a screen, with the target language in the middle of ordinary
  noise: a typo, an emoji, two messages in a row, a reply that ignores the question. The student meets the form in
  the wild before they are asked to use it. The container is the same `.dialog` any scripted exchange uses — what
  makes it this block is the noise, and the fact that it exists to show one form rather than to model a conversation.
- **markup** — `.dialog` with the thread (speaker bubble per line). A `<tr class="note">` or one caption line names
  what to look for — the block must say why it is on the page.
- **fits** — full or half; a thread is narrow, so half-width is natural beside the practice.
- **can't** — real material dates. If the lesson would break when the slang in it ages, use it as one example
  among several, never as the only presentation of a rule; and a thread whose every line is target language is a
  dialogue pretending to be a chat.

### `twoWordVerb - (best for: the register of a word already understood; producing the everyday form; proving the one-word twin means the same · can't: teach meaning, and it teaches a false equation whenever the pair is not genuinely interchangeable · purpose 8/10 · fun 5/10)`

- **does** — A chart puts the everyday two-word verb beside its one-word twin, then the student matches the everyday
  column back to the twins it replaces. Production is always the everyday form: it is the one they will be heard
  using, and the twin exists only to prove the meaning is unchanged.
- **markup** — two **half-width** blocks. The first is a `.chart` with the twin in the left column and the everyday form
  filled in the right — it is the source list. The second is a matching exercise built from that right column: the
  everyday verbs numbered, an `input.gap` beside each, and the twins lettered in one line beneath, so every answer is a
  single letter.
- **fits** — HALF, by width fill: a two-column chart of short pairs plus a few gaps does not fill a full row, so
  it collapses to half width and is centred when it is alone (its lead-in and notes wrap to that width and never
  count as fill). Pair with `registerContrast` when the lesson also has a stiff/spoken axis, or with
  `sentenceSurgery` when the pair changes the order of a whole sentence.
- **vary** — reverse the direction (twin → everyday) before widening the vocabulary; then move the verb into a
  sentence with a subject that forces agreement. Rarer verbs make it *unfairer*, not harder.
- **can't** — the pairing has to be genuinely interchangeable, or the chart teaches a false equation; and it is a
  vocabulary lesson, not a meaning lesson — the student learns the register of a word they already understand.

### `contextFit - (best for: whole fixed expressions used in a stated situation; matching a chunk to what it answers; teaching a chunk as one piece with audio · can't: teach the grammar inside the chunk, and a chunk whose parts can be swapped is not a chunk · purpose 8/10 · fun 5/10)`

- **does** — Whole fixed expressions taught as one unit with audio, then used: the student writes the chunk that fits
  a stated situation into the gap, or matches the chunk to what it answers.
- **markup** — column pair for the bank itself (chunk ↔ what it does), then an item list of situations with one
  `input.gap` each. The `.listen` chip carries the chunk, so the student hears it as one piece.
- **fits** — full only when its content fills the row; the bank plus its situations is usually a HALF, and it collapses to half width on width fill alone (its note and lead-in text do not count toward that fill). Best beside a `chatSample` that shows the chunks in their natural habitat.
- **vary** — start with the chunk fully given and gap only the situation; then invert. The real lever is *which*
  chunks are in the bank: same function, different politeness, is harder than more chunks of the same politeness.
- **can't** — a chunk whose parts can be swapped is not a chunk, so check it is said as one piece; and it never
  teaches the grammar inside it — that is the point, and also the limit.

### `registerContrast - (best for: choosing register for a named audience; showing stiff beside spoken; sharpening a choice the student half knows · can't: judge without a described audience, and it only ever chooses between wordings someone else wrote · purpose 7/10 · fun 4/10)`

- **does** — Two columns contrast a stiff wording with the spoken everyday one; the exercise picks which fits the
  stated audience. The audience is always named, or the item is unjudgeable.
- **markup** — column pair for the contrast (`<stiff wording>` ↔ `<spoken wording>`), then an item list where each
  `.qstem` names a person and a situation and the radios are the two wordings.
- **fits** — full; the audience is named in every item, or in a display block above it, because the student cannot choose a
  register for an audience the page never described.
- **vary** — two clearly different audiences before two similar ones. The lever is how close the two audiences are
  (a teacher vs a head teacher vs a friend's parent), not how rude the options get.
- **can't** — needs a described situation; with no audience both columns are defensible. And both wordings must be
  ones people REALLY say or write: a softened form invented for a phrase that never needs softening (or a stiff form
  for a phrase that never has one) teaches a register the student will never meet, which is worse than teaching
  none. If one of the two forms is not genuinely in use, the contrast is not a contrast — pick another phrase.
  And it only ever *chooses* between wordings someone else wrote — it never produces one, which is why it pairs
  with `politeLadder`.

### `pronLab - (best for: one phoneme the first language lacks; mouth position beside a contrast table; testing the distinction after showing it · can't: justify its space without a real first-language error, and it covers one phoneme — never an accent · purpose 8/10 · fun 4/10)`

- **does** — For a sound the student's first language lacks: a mouth-position guide (in Portuguese) beside a
  first-language-vs-English contrast table, then items that test the distinction.
- **markup** — treated as a mini-page inside a section: `.chart` for the contrast, `.panel` for the mouth guide, then
  an item list of radios (which word was heard) or gaps (which spelling carries it).
- **fits** — full width — it is the most space-hungry block here, which is why it earns its place only once or twice
  in a course.
- **vary** — a contrast in isolation → the same contrast inside a word → the same inside a phrase. Adding a second
  contrast to the same lab is what destroys it.
- **can't** — needs a real first-language error to be worth the space, so generic "pronunciation" pages teach nothing;
  and it teaches *one* phoneme — never claim it fixes an accent.

### `wordFamily - (best for: one root's several jobs; showing that a family is not a set of synonyms; choosing a member by what the sentence needs; the second noun a family sometimes has · can't: run on a root with no distinct members in use — an invented member teaches a word nobody says · purpose 8/10 · fun 5/10)`

- **does** — One root, its jobs: the student takes `<root>` and puts the right member into each gap by what the sentence
  needs (the doer, the thing, the second noun where the language has one, the how). The lesson is that a family is not a
  set of synonyms — each member fills one slot and only one.
- **markup** — a five-column `.chart` for the family itself (verb · person · thing · **thing2** · description), then an
  item list of sentences with one `input.gap` each, deliberately including one sentence where the student's first
  instinct is the wrong member. `thing2` earns its column because it is where the words that are neither the object nor
  a person land (`production`, `explainer`), and leaving it out pushes them into a cell that is already wrong.
- **fits** — half, beside `collocationMatrix` at the same width; the family and the company it keeps are the whole story
  of a new word.
- **vary** — give the family in the box → withhold it and give only the root → include a member the family does *not*
  have, so the student has to reject it. The last is the only version that tests the mental model rather than the list.
- **can't** — only works on roots that really do have distinct members in use; inventing `<root>ness` to fill the grid
  teaches a word nobody says, and the student will use it confidently.

### `politeLadder - (best for: politeness as a choice of form for a stated hearer; three correct versions of one request; tone with no new grammar · can't: teach grammar, and the rungs must mean the same or the student is choosing content rather than tone · purpose 8/10 · fun 5/10)`

- **does** — One request, said at three levels of politeness, all three correct, ordered. The student then writes the
  version that fits a stated hearer. Politeness here is a *choice of form*, not an adjective on a word.
- **markup** — column pair with three rungs as columns and the hearer as the row label, then item-list gaps: a hearer in
  the `.qstem`, one `input.gap` for the rung.
- **fits** — full; three rungs plus a hearer column does not fit a half.
- **vary** — two rungs → three → four where the top rung is right for one hearer and *wrong* (oily) for another. The last
  is the item that turns the ladder into a rule.
- **can't** — the rungs must be interchangeable in meaning, or the student is choosing content rather than tone; and it
  teaches no grammar — only which of several known forms to reach for.

### `infoGap - (best for: writing the question that gets the missing piece; real asymmetry between two panels; question and answer as one pair · can't: be a speaking gap (everything must be answerable from the page), and a half holding the other half's answers kills it · purpose 8/10 · fun 6/10)`

- **does** — Two halves of one situation, each on its own panel, each missing what the other has. The student writes the
  question that gets the missing piece, then the answer that gives it. The information asymmetry is what makes the
  question genuine instead of an exercise.
- **markup** — worked pair: two `.panel`s side by side, one headed `<you>` and one `<them>`, each carrying facts the other
  lacks; then item-list gaps, one per missing fact, answered from the other panel.
- **fits** — the worked pair sits at a **third**, with the items below it at full width; both halves stay in one view,
  because a half you have to scroll to is no longer the other half's other half.
- **vary** — the fact needed is named in the prompt → only the category is named → both students must ask, and one item
  needs a follow-up question because the first answer is incomplete.
- **can't** — everything has to be answerable from the page, so it is a written information gap and not a speaking one;
  and a half that already contains the other half's answers kills it.

### `genreDoc - (best for: functional reading of a real artefact; questions only that table can answer; what it costs, excludes or requires · can't: test production, and an invented artefact teaches a convention that does not exist · purpose 8/10 · fun 4/10)`

- **does** — A real-world artefact rebuilt as a small table — a menu, a ticket, a timetable, a receipt, a form — plus
  questions only it can answer: what it costs, what it excludes, what happens if you are late, what you must bring.
  This is the block for functional reading, and nothing else in this file covers it.
- **markup** — `.chart` for the artefact itself, then a `.qgrid` of `.qitem`s whose stems ask where in it / what it
  means / what you do next.
- **fits** — full width, and it is a spine candidate (`material-led`) rather than a mid-lesson beat.
- **vary** — first a value that is printed on it; then a value that must be inferred (a total, an expiry); then what
  the artefact does *not* say — that third step is where real reading happens.
- **can't** — cannot test production, and the authoring cost is the real one: an invented artefact teaches a
  convention that does not exist. It also needs the lesson to name what the artefact is for, or the questions are
  guesswork.

### `signScan - (best for: what a notice does to you (forbids, permits, warns); naming the word doing the work; a set of notices from one place · can't: ask force and politeness at once — those are two axes and a block that merges them cannot be marked · purpose 8/10 · fun 4/10)`

- **does** — A set of notices from one place, each with a different force; the student matches each to what it does
  to them — forbids, permits, warns, requests — and then names the word doing the work.
- **markup** — column pair: notice left, radios for the force right; then one `input.gap` for the operative word.
- **fits** — half; pair with `registerContrast` when the lesson also has a soft/hard axis.
- **vary** — from "what does it mean" to "which two notices conflict". Conflict is the difficulty, not longer notices.
- **can't** — recognition only, and it must keep two axes apart: how hard a notice is and how polite it is are
  different questions, and a block that asks both at once cannot be marked.

### `formFill - (best for: the conventions of a form; details into the right boxes; a language-light slot in a course of sentences · can't: carry a lesson (near-zero language load), and it is only honest when the lesson stated the convention rather than assuming it · purpose 8/10 · fun 3/10)`

- **does** — The other direction from `genreDoc`: a blank artefact and a set of details to put in the right boxes —
  the shape of a name, an order for a date, a code, a signature. The conventions are the lesson; the language is
  nearly none, which is why it earns a slot in a course that otherwise only practises sentences.
- **markup** — `.chart` with the artefact's labels and an `input.gap` per field, plus one note row naming the
  convention the artefact uses.
- **fits** — half to full; must follow `genreDoc` or `measureLocal`, so the student has read what they now write.
- **vary** — give the details in the boxes' order, then in a different order, then include one detail that belongs in
  no box.
- **can't** — near-zero language load, so it cannot carry a lesson on its own, and it is only honest when the
  convention was stated by the lesson rather than assumed by the author.

### `measureLocal - (best for: date, clock, money, distance and temperature conventions; converting both ways; spotting an ambiguous reading · can't: keep language in front — arithmetic crowds it out past five rows, and it teaches nothing about how anyone speaks · purpose 7/10 · fun 4/10)`

- **does** — The units an artefact uses against the ones the student lives in: order of a date, clock convention,
  money, distance, size, temperature. The student converts both ways and then marks which reading is ambiguous.
- **markup** — column pair: `<as written>` left, `input.gap` right for the converted form; one extra row asking what
  the same notation could also mean.
- **fits** — beat; pair with `genreDoc`, which supplies the artefact that made it matter.
- **vary** — a value to convert; then a value that is ambiguous; then a value where the ambiguity changes the answer.
- **can't** — arithmetic crowds out language quickly — keep it to five rows — and it teaches nothing about how anyone
  actually speaks.

### `accentVariant - (best for: tolerance of variation; matching a form to the material it came from; killing the question "which one is correct" · can't: come from one voice — variants must be reproduced in writing, and it must never be phrased as a correctness question · purpose 7/10 · fun 5/10)`

- **does** — The same word or line as it appears in material from different places; the student matches each form to
  the material it came from and marks that no form is an error. What a learner needs is tolerance, and tolerance is
  built by seeing variation as normal.
- **markup** — column pair: form left, the material it belongs to right, as radios; one note row stating that the
  differences are regional and not ranked.
- **fits** — half; it must come *before* `minimalPairs` in a lesson, so the student knows which differences carry
  meaning and which do not.
- **vary** — start with spelling, then sound, then a form that is old rather than regional.
- **can't** — cannot be built from the lesson's own voice: one speaker cannot carry variants, so the lesson must
  reproduce them in writing. And it must never be phrased as "which is correct" — the block exists to kill that
  question, not to ask it.

### `idiomOrigin - (best for: the idiom, its literal reading and its source together; making the literal trap stick; one lexical item at a time · can't: generalise, and the origin is often folk etymology — if the source is not certain it must say "one story is" · purpose 7/10 · fun 7/10)`

- **does** — Three things at once: the idiom, what it literally says, and where it came from. Then one line where the
  literal reading would be wrong. The origin is what makes the literal trap stick, which is why this is not
  `contextFit` with extra words.
- **markup** — `.card` with three labelled lines, then one `input.gap` sentence that has to use the idiom.
- **fits** — beat or third; pair with `contextFit` — origin first, then the bank that files it under what it does.
- **vary** — from producing the idiom to choosing between two that both look plausible.
- **can't** — origins are frequently folk etymology. If the source is not certain the block must say "one story is" —
  an invented origin is worse than none. It is also one lexical item at a time and never generalises.

## [TRAINING]

### `sentenceSurgery - (best for: word and chunk order; assembly that reads wrong until it is right; holding a whole sentence in memory · can't: handle a sentence with two defensible orders, and it tests assembly, not meaning — the student can rebuild what they cannot translate · purpose 9/10 · fun 6/10)`

- **does** — A sentence or a whole exchange is cut into chunks and handed over out of order; the student rebuilds it.
  Word order, chunk order and linking all show up immediately, because a wrong order reads wrong.
- **markup** — the chunks are listed as a bank, and BELOW the bank there is one ORDER LINE the student drags them
  into: position comes from where a chunk is dropped, not from a number typed beside it, so the sentence is the
  thing being built and nothing is written twice. A keyboard path exists for every drag (a chunk picks up and
  drops on Space/Enter), because the line must not be pointer-only. **Alternate form** — the same block, cut the
  other way: the sentence arrives with EXTRA words in it and the student removes the ones that do not belong.
- **fits** — full, or half; a bank of short chunks and the order line still read at half, and holding the whole
  sentence in memory is the load at either width.
- **vary** — more chunks before longer chunks; then remove the numbered scaffold so the whole sentence must be typed.
  A sentence with two defensible orders is not a harder item, it is a broken one.
- **can't** — only sequences with one defensible order; and it tests assembly, not meaning — a student can rebuild a
  sentence they cannot translate.

### `questionBuilding - (best for: forming the question from its answer; asking the follow-up a context needs; form practice with a reason · can't: teach turn-taking (a perfect question in the wrong place still fails) and it is only markable if the acceptable forms are stated · purpose 8/10 · fun 5/10)`

- **does** — Given an answer, form the question; given a context, ask the follow-up.
- **markup** — item list of `input.gap`s, one per answer. The prompt is the answer the student is talking to — never
  a grammar label, or they conjugate instead of ask.
- **fits** — full, or half directly under a `chatSample` thread so the question has a conversation to land in.
- **vary** — same tense with a stated word order before free order; then add the constraint that the question must
  begin with `<question word>`. Loading two new demands into one item is the standard way this drill becomes unfair.
- **can't** — graded on form only, or free answers become unmarkable, so state what counts as right; and it does not
  teach turn-taking — a perfect question in the wrong place is still a failed exchange, and carrying a whole exchange
  is a different block's job (`chatSample`).
- **difficulty** — the item is harder than it looks: one answer can often be asked two or three correct ways, and a
  context can be so open that the "right" question is a judgement the page never defined. So each item names ONE
  thing being asked (the tense, the question word, the subject) and accepts every form that fits that one thing, and
  the answer it is built from is specific enough that only one question really answers it. If two different questions
  would both be right and both natural, it is not a harder item — it is a broken one.

### `repairMoves - (best for: the fixed moves that repair a breakdown; hearing the tone of the repair; whose fault the break is · can't: teach the conversation — needs a scene, and a teacher to judge whether the student could say it under pressure · purpose 7/10 · fun 4/10)`

- **does** — The fixed moves for when communication breaks: ask for a repeat, check a guess, restate.
- **markup** — item list: a short exchange with the break marked, then one `input.gap` holding the move that repairs
  it. The `.listen` chip carries the move so the student hears the tone, not just the words.
- **fits** — half, beside a `chatSample` thread — this is the emergency exit of the same conversation.
- **vary** — the move alone, then the move inside a longer exchange. What actually makes it harder is *whose* fault
  the break is: repairing your own sentence is a different move from rescuing someone else's.
- **can't** — teaches the move, not the conversation; needs a scene to mean anything, and a teacher to judge whether
  the student could actually say it under pressure.

### `minimalPairs - (best for: separating two near-identical sounds; homophones from a flap T or a silent letter; a quick ear beat under a display · can't: show that the student can say it, and it uses words they already know, so it carries no new vocabulary · purpose 9/10 · fun 6/10)`

- **does** — The target word beside its near-neighbours, each with audio, so the ear separates one phoneme by its
  minimal difference. Also covers homophones from a flap T or a silent letter.
- **markup** — item list of radios where the `.qstem` is silence and the answers are the words: the clip *is* the
  question, so `data-say` on the chip supplies the key and no answer is written into the page.
- **fits** — third or half; it is a beat, and it should sit immediately under whatever displays the pair.
- **vary** — two words → three → the pair inside a phrase at speed. Three options is the minimum for anything that
  matters, because two is a coin flip.
- **can't** — recognition only; it never shows the student can say it, and it deliberately uses words the student
  already knows, so it cannot carry new vocabulary.

### `listenIdentify - (best for: a ternary recognition beat (sound, ending, stress); the cheapest listening block; an ear check before production · can't: work on two options (a coin flip), and it proves a difference was heard, not that either word means anything · purpose 8/10 · fun 5/10)`

- **does** — A binary or ternary recognition item: which sound, which ending, which stress pattern was heard.
- **markup** — item list of radios with the `.listen` chip doing the asking; the prompt only says what to listen for,
  because a prompt containing the answer makes the clip decoration.
- **fits** — third, or half. It is the cheapest listening block there is, which is also why two of them in a row is
  visible laziness.
- **vary** — three options, then the same three inside a phrase; then the same phrase at natural speed. More options
  beyond three adds guessing, not difficulty.
- **can't** — two options invites a coin flip, so three minimum for anything that matters; and it tells you the
  student heard *a difference*, not that they know what either word means.

### `errorCorrection - (best for: refusing the classic first-language error; distractors that each encode one real error; word-sized or sentence-sized granularity · can't: show production — it only shows the wrong form was refused, so pair it with a gap drill · purpose 8/10 · fun 5/10)`

- **does** — Pick the correct item among distractors that each encode the classic first-language error, at whatever
  granularity fits: one word or a whole sentence.
- **markup** — item list of radios. Every wrong option is a *real* error a Portuguese speaker makes, so the wrong
  answers are informative rather than random.
- **fits** — third, or half. Cheapest form check there is; it belongs right after the rule is displayed.
- **vary** — one distractor at a time before four; then the same error inside a longer sentence where the trigger is
  further away. Adding distractors that are merely odd (not wrong) is what makes it a trick question.
- **can't** — distractors must be real errors, or it becomes a spot-the-typo; and it never shows the student can
  *produce* the form, only refuse the wrong one — pair it with a gap drill in the same lesson.

### `syllableLab - (best for: counting syllables; locating the beat the stress lands on · can't: anything yet — this file states no mechanism, no art and no limit for it, so nothing here is claimed · purpose 3/10 · fun 3/10)`

- **does** — 
- **markup** —
- **fits** — 
- **vary** — 
- **can't** 

### `errorHunt - (best for: proofreading a whole short text; a stated error count that turns browsing into a task; cumulative review of taught errors · can't: be beat-sized (it needs a self-contained text), and finding all the errors is not knowing why they were errors · purpose 9/10 · fun 6/10)`

- **does** — A short text with a stated number of errors; the student types the corrections below. Saying how many
  there are is what makes it a task rather than a browse.
- **markup** — the text as prose, then a short item list of `input.gap`s — one per error, in no required order — with
  the stated count in the instruction line.
- **fits** — full width; it is a section, and it works best immediately after `ruleCard` has stated the rule it hunts.
- **vary** — the count is the lever: an unstated count is a different, much harder task. Then make the errors the ones
  the rule predicts, rather than the ones that merely look odd.
- **can't** — needs a self-contained text, so it is not a beat-sized vehicle; and a student who finds all the errors may
  still not know why they were errors — the debrief is the teacher's.

### `oddOneOut - (best for: making a category decision that needs a reason; discrimination the student must justify; a discussion opener · can't: survive two defensible answers, so the justification is mandatory and the teacher must read it; it never produces the target form · purpose 7/10 · fun 6/10)`

- **does** — One item doesn't belong; the student picks it **and says why** in a line.
- **markup** — item list of radios for the pick, plus **one block-level `<textarea>`** for the reasons. The textarea is
  deliberately shared, not per item: it is unmarked evidence, and a per-item textarea would break the one-control rule.
- **fits** — third or half; it opens a section well because the reason becomes the next block's subject.
- **vary** — the odd one out by meaning, then by form, then by usage. Four items → five. What genuinely makes it harder
  is when the odd item is odd for a *subtler* reason, not when the vocabulary is rarer.
- **can't** — if two items can be defended, the item is broken, so the justification is mandatory and the teacher reads
  it; and it never produces the target form.

### `spotTheDiff - (best for: noticing what changed between two texts; close reading of a chat or a notice; finding the difference before naming the rule · can't: say which version is right, and it is wasted on differences that are only punctuation · purpose 7/10 · fun 6/10)`

- **does** — Two versions of the same short text, chat or notice; find and state the differences.
- **markup** — worked pair: `.itemrow` of two `.panel`s side by side, then one gap per stated difference number. The two
  panels must be the same length, or the layout gives away where the changes are.
- **fits** — full width — two texts side by side is the whole mechanism, so it cannot be squeezed into a third.
- **vary** — the count stated (like `errorHunt`), then unstated; then a version where the difference is one of *tone*
  rather than of content, which is the interesting one.
- **can't** — the differences must be meaningful, not punctuation; and it does not say which version is right — that is
  the next block's job.

### `predictReveal - (best for: investment before the answer arrives; writing what happens next; making a scene matter · can't: mark anything — it produces investment, not accuracy, and needs a right-answer block after it or the page has no evidence · purpose 8/10 · fun 8/10)`

- **does** — The scene stops mid-way; the student writes what happens next, then reveals the real ending.
- **markup** — open response: the scene as prose, one `<textarea>`, then the real ending inside `<details>` so the page
  hides it until the student has committed.
- **fits** — half or full. It is the cheapest way to make a student care about the next block's vocabulary.
- **vary** — a stated number of sentences, then free length; then give the ending first and ask for the beginning. The
  lever is how much of the situation is withheld, not the length of the writing.
- **can't** — no marking; it produces investment, not accuracy, so it must be followed by a block that does ask for a
  right answer — otherwise the page has no evidence at all.

### `miniProject - (best for: free production toward a real artefact; a word bank and a textarea; end-of-lesson synthesis · can't: train a form under control or be auto-marked — the checklist is what the teacher marks against · purpose 8/10 · fun 7/10)`

- **does** — Build something in English: a plan, a poster, a set of rules, an order. Word bank plus textarea.
- **markup** — open response plus a `.panel` word bank. The brief is a **checklist**, not a paragraph: five things the
  thing must contain, so "done" is visible.
- **fits** — full width, and it wants the page's spine (section 8) built around it — a project in the middle of a quiz
  strand is a detour.
- **vary** — fewer required elements, then more; then a length limit, which is the harder constraint. Never raise the
  vocabulary as the difficulty lever — the point is producing with words they have.
- **can't** — free production only, so nothing here trains a form under control and it needs a drill beside it; and it
  cannot be auto-marked — the checklist is what the teacher marks against.

### `emphaticBeat - (best for: tying stress to intended meaning; showing one sentence has three readings; tone work beside a dialogue · can't: produce the sound (it marks a word), and it is genuinely hard where emphasis is marked by word order · purpose 7/10 · fun 6/10)`

- **does** — The same sentence stressed three ways, three meanings. The student is given the *intended meaning* and
  marks which word has to carry the beat.
- **markup** — item list: the meaning in the `.qstem`, the sentence printed once, and the student writes the stressed
  word into the gap. Radios per word would be tidier but would give away that exactly one word is marked.
- **fits** — half. It belongs beside `registerContrast`, where tone already matters, and directly under
  an explainer block that shows the pattern and a couple of examples of it (`ruleCard` or `formulaFrame`) — a student
  cannot mark a beat for a pattern the page never stated.
- **vary** — three candidate words → five → a two-clause sentence where the beat can fall in either clause. The lever
  is the number of *plausible* hosts, not the length of the sentence.
- **can't** — only produces a marked word, never the sound; and it is genuinely hard for students whose first language
  marks emphasis with word order instead — that difficulty is the lesson, not a defect.

### `mediaSnippet - (best for: reading a situation off one real line; one named concept shown twice; catching what is not said · can't: stay current or be owned — quote a line, never a verse, and cut any item that does not stand alone · purpose 7/10 · fun 7/10)`

- **concept** — one block, **one named concept**, fixed before the lines are chosen: an apology that is not an apology, a
  compliment with a condition under it, an invitation that expects a no. The tag is what makes two lines a pair instead
  of two interesting quotations.
- **does** — Two real lines that show the **same** concept — a lyric, a headline, a line from a show — each asked the
  same two questions: who the speaker is talking to, and what they are not saying. The language is real, so the lesson is
  about reading a situation off a line instead of reading a grammar off a sentence, and the second line of the same
  concept is what turns it into a pattern rather than an anecdote.
- **markup** — two `.card`s, each holding one line quoted (attributed, inside `<blockquote>`), then item-list radios on
  the speaker's situation — the same two questions for both lines. Each line is short enough to sit whole on one line; a
  paragraph of it is `chatSample`.
- **fits** — half beside the rule it illustrates; full when it is the page's material.
- **vary** — the second line of the same concept, so the student generalises across two rather than interpreting one; then
  a third from a different medium.
- **can't** — it dates and it is somebody's property: quote a line, never a verse, and never build an item whose answer
  needs the student to know the source. If it does not stand alone, cut it.

### `rhymeCoda - (best for: finding which lines rhyme; the same sound under different spellings; pattern-hunting in real text · can't: carry a sound the student cannot yet hear, and never rely on a rhyme that lives in a performance the page does not have · purpose 7/10 · fun 6/10)`

- **does** — Lines from one lyric are on the page; the student marks which two rhyme, then decides what letters spell
  the shared sound. Finding a pattern in real text is a different job from judging a supplied pair, and the second
  step is the one that transfers: same sound, different spelling.
- **markup** — item list: one `.qitem` per slot with the candidate lines in `.qopts` as radios; then a column pair
  asking for the spelling of the rhyme's coda.
- **fits** — full width (lines are long); pair with `barCount` when the lesson is rhythm-led, or `pronLab` when the
  sound needs drilling *after* it has been noticed.
- **vary** — move from "which two rhyme" to "which one does not rhyme although it is spelled the same". That
  reversal is the difficulty; rarer words are only unfairness.
- **can't** — it needs lines whose rhyme is visible in the spelling, so it cannot carry a sound the student cannot
  yet hear, and it must never be used with a lyric whose rhyme depends on a performance the page does not have.

### `songStructure - (best for: naming a lyric's parts by what they do; repetition as a decision rather than filler; the line that comes back changed · can't: be listening — there is no audio, so presenting it as listening is dishonest, and it assumes comprehension rather than teaching words · purpose 6/10 · fun 5/10)`

- **does** — A lyric laid out as text with its parts unlabelled; the student names each part by what it *does*
  (returns, turns, closes) and marks the line that comes back changed. Repetition is taught as a decision rather than
  as filler.
- **markup** — `.panel` per stanza with an `input.gap` for the part name, plus one `.chart` comparing the first and
  last appearance of the repeated line.
- **fits** — full width; pair with `moodTrack` when the lesson is about effect.
- **vary** — first ask only what comes back; then what changed inside it; then why that line and not another. Three
  steps, same artefact.
- **can't** — no audio and no song: this is the shape of a text, and presenting it as listening is dishonest. It also
  cannot teach vocabulary — it assumes the student already understands the lines.

### `barCount - (best for: counting the beats a line lands on; turning rhythm into a number the student can check; where the count breaks · can't: measure anything — a page carries no metronome, so the count is the lesson's judgement, and it says nothing about meaning · purpose 6/10 · fun 3/10)`

- **does** — Count the beats a line actually lands on, and where the count breaks. Rhythm becomes a number the
  student can check, which is what "say it with stress" fails to give them.
- **markup** — column pair: the line left, `input.gap` for the count right; a second row asks which word sits on the
  break.
- **fits** — beat or half; the count comes first, then the line is laid onto it.
- **vary** — count beats, then move the count by one word, then keep the count identical and change the meaning. The
  third step is the whole point and it needs no new words.
- **can't** — speech only: a page cannot carry a metronome, so the count is the lesson's judgement and the block must
  not present itself as measuring anything. It teaches nothing about meaning.

### `moodTrack - (best for: justifying a mood in one written line; the vocabulary of how a track sounds; defending a judgement in language · can't: play anything — grading it as listening would be a lie, and it cannot teach genre names it never states · purpose 6/10 · fun 6/10)`

- **does** — A scene, plus three short descriptions of how a track sounds; the student picks the one that fits and
  defends it in one written line. The defence is the work: mood words are easy to guess and hard to justify.
- **markup** — `.qitem` with the scene as `.qstem` and the descriptions as `.opts` radios, then one `input.gap` for
  the "because…" clause.
- **fits** — half or full; pair with a production block (`freeWrite`) so the words are actually used.
- **vary** — narrow the distance between the three descriptions until all are plausible. Never raise the vocabulary.
- **can't** — nothing is played. It is vocabulary and justification, and grading it as a listening task would be a
  lie; it also cannot teach genre names it never states.

### `tabooMap - (best for: which question is off-limits in a given situation; rewriting one so it becomes askable; pragmatics as a boundary · can't: keep itself safe — given a people instead of a place and a person it writes a stereotype into the page and signs it · purpose 6/10 · fun 5/10)`

- **does** — Given situations the lesson has already written, the student marks which question is off-limits in each
  and rewrites one so it becomes askable. Pragmatics as a boundary rather than a list of polite phrases.
- **markup** — one `.qitem` per situation with the candidate questions as radios, then one `input.gap` for the
  rewrite.
- **fits** — half; it must follow the scene block that made the situation concrete. On its own it is abstract.
- **vary** — from "which is off-limits" to "which is fine here and not there". That second form needs two scenes, not
  stronger wording.
- **can't** — **this is the most dangerous block in the file.** It asserts nothing itself, but if the lesson supplies a
  scene as a national trait instead of a specific situation, the block writes a stereotype into a page and signs it.
  It is only usable when the scene is *a place and a person*, never a people.

### `humourFlag - (best for: naming what makes a line funny; what a joke loses in translation; one sharp moment in a lesson · can't: be a rule — funny is not generalisable and explaining a joke can kill it; never grade taste as accuracy · purpose 6/10 · fun 8/10)`

- **does** — A line that is meant to be funny, and the student marks what is doing the work — a pun, an
  understatement, a reversal, a pause — then names what it would lose if translated.
- **markup** — `.qitem` with the line as `.qstem` and the mechanisms as radios, then an `input.gap` for what it loses.
- **fits** — beat; pair with `registerContrast` when two mechanisms have to be told apart.
- **vary** — from naming the mechanism to predicting whether a second line will land.
- **can't** — funny is not a rule, and explaining a joke can kill it, so use it once per lesson at most. It must never
  be graded as though taste were accuracy.

## [GAMES]

### `skeetRange - (best for: one-shot word recognition under a clock; arcade stakes that force a commitment; a fast read of what a student really knows · can't: teach production or spelling — one shot per item lets a careless click hide what they knew · purpose 9/10 · fun 9/10)`

- **does** — One flying target per option. Player aims with the cursor and takes **one shot**; a hit scores, a
  miss is spent. No spray, no endless retry — the constraint is what makes it feel like skill.
- **opts** — **2 to 6 discs per item**, one disc per option. Two is the least that is a choice at all; six is what the range's own lanes hold when they are spread over its full height — a seventh crowds the arc into a pile of plaques.
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

### `whackMole - (best for: spotting which option fits among lookalikes; engagement in a restless class; exposing hesitation · can't: anything needing reflection — speed pressure is the whole mechanism; recognition only · purpose 9/10 · fun 8/10)`

- **does** — One drawn mole per option surfaces from a hole, stamped in stagger; the player hits the one that
  fits before the runner's timer bar empties. The rest duck away the instant an answer lands.
- **skins** — same `.qitem` list; the prompt sits on the HUD line, options become the moles' labels.
- **opts** — **2 to 6 per item**, one mole per option. The garden is **always six holes in a 3×2 grid**, so six options fill it exactly and the layout never reflows between items; below 2 there is nothing to spot among, above 6 there is no hole left for the seventh.
- **authoring the stem** — the prompt is the thing to FIND, so it is written as that thing and nothing more:
  `past`, `a place you sleep`, `sorry, say that again?` — never `which one is past`, because the moles are
  already the candidates and the sentence only restates the game.
- **art** — inline SVG mole + radial-gradient hole with a dirt rim, rise via `translateY`, reduced-motion path.
- **can't** — recognition only; speed pressure makes it a poor fit for anything needing reflection.
- **needs** — nothing; `engine4.js` ships it.

### `catchBasket - (best for: sorting a form into its category; making a rule decision a single physical gesture; showing hesitation in public · can't: more than two to four categories per row, and a seventh item swamps the pot · purpose 9/10 · fun 8/10)`

- **does** — One word is shown at a time; the player **drags it into the pot that fits** (or taps a pot, or presses
  `1`/`2`). Dropping outside springs the word back, so a slipped finger costs time, not the item. A right drop tips
  water over that pot and **grows a flower in it**; the flowers stay for the rest of the run, one per right answer,
  so the block becomes a garden the class has grown rather than a score.
- **teaches** — sorting a form into a category: past vs now, one ending vs another, which pattern a word belongs
  to. The decision is made in one gesture, so hesitation is visible.
- **opts** — **2 to 4 pots per item**, one pot per option. Two is the smallest sort; four pots is one row at a size the words still read at, and a fifth has no soil left — the same ceiling the `can't` below names.
- **skins** — one word per item (`.qstem`), one pot per option (the radio labels); a correct drop checks that
  option's radio. The word card IS the prompt, so the stage does not print the same words again on the HUD line.
- **art** — inline SVG terracotta pot, water drops over the rim on a right drop, a flower grows out of the soil and
  stays there (six to a pot); the word lifts and tilts while held, a wrong drop shakes.
- **can't** — only two to four pots fit a row; fine distinctions don't fit, and a seventh flower would swamp the pot.

### `stackDrop - (best for: giving a long drill a shape and an end; accumulate-and-complete motivation; the tower as progress bar · can't: run on a two-item block (nowhere to climb), and timing dominates, so one phrase per block · purpose 8/10 · fun 8/10)`

- **does** — The question arrives as the next block of a tower and the player **puts the right answer on top of it**
  by picking it: the block flies up, lands and **stays in the tower**. A wrong answer tumbles off and the question
  stays exactly where it was, so the tower never loses what was earned and its height IS the progress. The climber
  climbs the tower itself to the chest at the top.
- **teaches** — accumulate-and-complete: the reward is the finished tower, so a long drill has a shape and an end.
  Every answer placed is one item answered, so the tower is the progress bar.
- **opts** — **2 to 4 options per item**, and **6 to 10 items per block**. One item is one block of the tower, so the item count IS the height it climbs: under six there is nothing to climb, and past ten each block is too short to hold its own word.
- **skins** — one `.qitem` per block; the question block is the stem, the buttons are the options. Six to ten items
  makes a climb: the tower is half the stage's width and each block's HEIGHT comes from the run's own length, so the
  whole stack stands inside the stage up to ten blocks (the most that keeps a word readable) and a longer run keeps
  that height and slides. The question block IS the prompt, so it is not printed a second time on the HUD line.
- **art** — flat blocks with hard edges, two ladder rails and a rung per answer, a drawn climber, a chest that
  lights up at the top. The tower slides down to keep the newest block in view once it outgrows the stage.
- **can't** — one item per block, so a two-item block has nowhere to climb; timing dominates, so keep the language
  load to a phrase per block.
- **needs** — nothing; `engine4.js` ships it.

### `flapGate - (best for: recognition at speed; arcade engagement; a keyboard and reduced-motion path to answering · can't: anything beyond recognition at speed, and it is the most expensive of the arcade set · purpose 8/10 · fun 9/10)`

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
- **skins** — gaps are options; the prompt is fixed on the HUD.
- **art** — a drawn bird that flaps its wings on every lift, including the one automatic flap as the round opens, so
  it is never falling before the student has touched anything; a brick wall with the words sitting in its gaps; sky
  as a flat fill. Fall is half what it was, lift unchanged.
- **can't** — recognition at speed only, and it is the most expensive of the arcade set.
- **needs** — shared runner + gravity loop.

### `wordleBoard - (best for: spelling one word to a five-try limit; the deduction pleasure of letter feedback; repeated right-letter evidence · can't: run on phrases or on any word length but the fixed one; teaches no meaning and no listening · purpose 9/10 · fun 9/10)`

- **does** — The student guesses the word and presses Enter; the board marks right letter/right place and right
  letter/wrong place. Five rows and the run is over. Hangman is the same engine with a different face (a revealed
  blank row instead of coloured tiles).
- **opts** — **one target word per item**, the same length in every item of a block (the board is built from the answers, so the block must hold to one length), and **2 to 4 options** — the options only carry the evidence radio, because the word itself is typed. Five tries per word and two lives per run.
- **skins** — one target word per item, typed into a `gap` at the end, so the evidence is spelling the student
  produced rather than letters guessed. The stem is the clue, so it is not printed a second time on the HUD line.
- **art** — the stage reads left to right: the **clue on the left**, the tile grid and the box you type into as the
  centre pair, and a **message on the right** ("too many letters", "too few letters") that fades in over .5s, holds
  2s and fades out over .5s. The three are centred vertically and the board never grows, so nothing moves when a
  word lands — a wrong length costs a message, not a row.
- **can't** — only words of one fixed length; nothing for phrases, meaning or listening.
- **needs** — nothing; `engine4.js` ships it.

### `mineGrid - (best for: making a guess cost something; reading before moving; leaving blanks a teacher can read as evidence · can't: run on a lesson that writes two or three options — the street comes up short · purpose 8/10 · fun 7/10)`

- **does** — The options are planted as **pairs of batwing saloon doors along a street**, the word hung over the top
  where it can be read. Pick a door and **the figure walks to it**, which makes the choice a character's risk rather
  than a bare click; the door then swings open, because what is behind it IS the answer. **Right:** he goes in, a glass
  clinks on the bar, and the next question arrives on the same street, which never leaves the stage. **Wrong:** a snake comes
  out of the dark and bites him — one of three lives gone, and his drawing changes as they go. Three bites end the run.
- **teaches** — commitment under stakes. Because he only gets three mistakes, a guess has a price, so the student
  reads before moving. Every wrong pick leaves its radio blank, so the blanks are the teacher's evidence.
- **opts** — **exactly 4 per item**, one door per option: the street holds four doors, so four is both the floor and the ceiling — a lesson that writes two or three options leaves the street short.
- **skins** — four options is what the street holds: one door per option. The lives belong to the RUN, not to the item,
  so they are set on the way in and never between items — a life that came back with the next question would mean a
  miss cost nothing. The count is the HUD's, and the stage draws no second copy of it.
- **marking** — exact: on a right answer only the door he opened turns green; on a wrong one that door turns red with
  the snake in it and the right door is outlined, and nothing else on the street reacts.
- **art** — a street and a boardwalk, a signed doorframe per word with a drawn batwing door that swings on its hinge,
  a drawn snake, and a figure with hurt and down states.
- **can't** — one answer per door; a lesson that writes two or three options leaves the street short.

### `crosswordBoard - (best for: spelling a word to its clue; showing that words share letters; a board where one shared cell solves two items · can't: handle long or unspellable words, and a vocabulary sharing no letter can only sit in separate rows · purpose 9/10 · fun 8/10)`

- **does** — A **real generated crossword**. Each `.qitem` carries `data-answer` (the word) and its `.qstem` is the
  clue. The engine lays the whole set out at once: the first word across, every later word placed so it **crosses**
  an existing letter, anything that cannot cross dropped into its own row below. A shared letter is one cell, so
  typing it once fills both words and **solves both items** — that is the point of a crossword and why this is a
  board, not a drill. A full word typed wrongly costs **nothing**: nothing clears, nothing is scored and its cells
  stay as they were typed, so the student keeps at it until the word goes green. A right word is **a point**, and
  **five points wins the board**; under five it simply stays open with whatever it has, because there is no clock and
  no lives here.
- **opts** — **2 to 6 words per block**, and **2 or more options per item**. Each item's `data-answer` is the word (letters only, at least two of them) and its `.qstem` is the clue; every answer has to be spellable or the board refuses the run, and six short words is the ceiling — the grid sizes its cells to fill the stage down to an 18px floor, and a seventh word drops below it.
- **art** — the site's own grid: a flat block per gap, a small number in the corner of each word's first cell.
  The cells are sized to **fill the stage** (10px of margin all round, height and width each get a say), and the
  clue for the word you are typing sits in its own panel **beside the grid** — one clue on the stage, never the
  same clue twice.
- **can't** — the set must be spellable and the words short, or the grid gets fat; words with no shared letter can
  only sit in their own rows, so a lesson whose vocabulary shares nothing is a bad fit.
- **needs** — nothing; `engine4.js` ships it. Authoring: `data-answer` on each `.qitem`, clue in `.qstem`.

### `echoPads - (best for: word order and collocation one word at a time; a constraint the student can see on the stage; planning a sentence end to end · can't: cover more than one sentence per block, and trains neither spelling nor listening · purpose 9/10 · fun 7/10)`

- **does** — Builds **one sentence, word by word**. `data-first` is the opening the student is given ("Yesterday
  I"); every `.qitem` after it is the next word of that sentence, and its options are the word that fits after
  what is already on the board plus **three that are close but do not fit the grammar** of the words placed. A
  right pad puts the word in the sentence, answers that item and moves on. A wrong pad costs one point and does
  **not** move on: a sentence cannot continue past a word that does not fit, so the student tries that same word
  again. At zero points the run is over.
- **teaches** — word order and collocation under a constraint the student can see: the sentence on the stage IS
  the question, so every choice is judged against the words already placed rather than against a rule recalled.
- **opts** — **exactly 4 pads per item**: the word that fits plus **three near misses**, and one item per word AFTER `data-first`, so the sentence's own word count is the item count. One sentence per block — a second sentence is a second block, not a longer run.
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

### `bingoCard - (best for: recognising the spoken form of a word; one-chance attention with no replay; hearing under a countdown · can't: hear anything longer than a word, and it needs several options across the block or the decoy pool runs dry (the two countdowns are the game's own) · purpose 8/10 · fun 9/10)`

- **does** — A 3×3 card is built from the item's own options **plus decoys drawn from the rest of the block**, so the
  card is never trivially small. The card arrives shut behind a velvet curtain and the voice **calls the correct
  answer's word exactly once** (the clip when the item has one, else the right option's text — never the question).
  There is no replay button: paying attention to the one chance IS the activity. A **3·2·1 countdown** in its own
  card at the grid's left edge runs while the caller speaks; at zero the curtain rises, and a **7·6·5·4·3·2·1
  countdown** in a card at the right edge starts. Stamp the tile you heard and the item is answered. Let the second
  countdown reach zero and the curtain **falls on the item**: it is marked wrong and the point it was worth is gone.
- **opts** — **2 to 9 options per item**. The card is nine tiles: the item's own options first, then decoys drawn from the rest of the block to fill it — so a two-option item is padded to nine, a nine-option item has no room for decoys, and more than nine cannot be shown at all.
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

### `ladderRun - (best for: the page's quiz rather than a drill; keeping what was safely earned; scaling one block from five items to a full test · can't: act as a mid-lesson beat — one continuous arc — and its fall to the safe rung is harsh, so items must be fair · purpose 9/10 · fun 8/10)`

- **does** — A full-height rail with a climber and a chest at the top. One rung per right answer, a **safe rung every
  five**, and the height is **heard** as well as seen (a rising motif as you climb). A wrong answer slides the climber
  back to the last safe rung — so what was safely earned is kept, which is what makes a ladder a ladder and not a
  list. Longer lists make a taller climb, so the same block scales from a five-item drill to a full quiz.
- **opts** — **2 to 4 options per item**, and **5 or more items per block**. One right answer is one rung and the safe rung is every fifth, so under five items there is no fall to catch; above five the length is free, the climber simply climbs further.
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

### `bossRaid - (best for: a long drill with a visible cost; ritual stakes and a chosen fighter; an ending that belongs to the answers, not a timer · can't: rescue weak items — the stakes mask them, so every item must still be defensible on its own · purpose 8/10 · fun 10/10)`

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
- **skins** — the `.qitem` list is the attack sequence; the options are the answer buttons. Nothing about the fighter
  is authored — the game offers its own three — so a lesson block is just a list of items.
- **art** — a torch-lit arena, three drawn fighters with their own weapons, a fireball, an arrow and an acid drop as
  separate sprites, a drawn boss with bite/hurt states, a slash arc, an HP bar.
- **can't** — ritual stakes can mask weak items; every item must still be defensible on its own.

### `trainOrder - (best for: one fixed adjective order made physical; the two ways a sentence sounds wrong; a rule felt instead of memorised · can't: contrast two orders, teach a second rule, or produce anything — the sentence is built, never written or said · purpose 9/10 · fun 8/10)`

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
- **can't** — one order, so it trains one rule: it cannot contrast two orders, and it is not a production exercise —
  the sentence is built, never written or said. Word-level vocabulary has to be known already, since the sentence is
  never spelled out beyond its own words.
- **needs** — nothing; `engine4.js` ships it. Author four to eight words per train, and put the ORDER on the page
  above the block (a chart or a one-line rule) — the game tests it, it never states it.

