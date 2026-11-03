# Lesson 9 — design (Pass A)

## Core (what the student can do afterwards)
1. Say that something **exists** — and that it does not: *There's a fridge in the kitchen. · There are two chairs. · There isn't a printer here.*
2. **Ask** about it and answer short: *Is there a meeting room? — Yes, there is. · Are there any chairs? — No, there aren't.*
3. **Locate** anything with the place set: *in / on / at* plus *under, above, below, over, behind, in front of, next to, between*.
4. **Connect** what they say: *and · but · because · so* — one sentence, two facts, with a reason or a consequence.

## Teaching beats (per core item) and dependencies
- **there is / are announces that a thing exists** — it does not say whose it is and it does not describe it. *There's a fridge* ≠ *It's a fridge* ≠ *We have a fridge*. Brazilian students reach for *"have"* or a bare *"it is"*; the page names all three and shows what each one does.
- **Agreement is with the thing, not with the speaker**: *there is* + one thing (or an uncountable), *there are* + many. The test is the same one as lesson 4 — is the owner one or many?
- **The question and the negative reuse the same skeleton** (lesson 5): *Is there…? / There isn't. · Are there…? / There aren't.* Short answers stop at *there*: *Yes, there is.*
- **Place is one law with three faces**: **in** = inside a box, **on** = on a surface, **at** = at a point (a place treated as a point on the map). Portuguese *em* covers all three, so this is a mapping correction, not new vocabulary. Then the rest of the set is spatial geometry in words: *under/below, above/over, behind/in front of, next to, between*.
- **Connectors give the sentence a second half**: *and* adds, *but* contrasts, *because* explains, *so* concludes. Dependencies: each connector is taught with a sentence the student can already build from lessons 1-8, so no new grammar rides along.
- **The kitchen field is the carrier**: *kitchen, fridge, oven, stove, sink, counter, cabinet, drawer, shelf, cupboard, knife, spoon, fork, plate, bowl, glass, mug, bottle* — every one used inside *there is/are + place*.

## Situation
First week in a new flat or a new office kitchen: the student opens a cupboard, says what is there, asks where the glasses are, and answers a colleague's *"Is there a coffee machine?"* — then adds the small connection that makes it a conversation: *there's a kettle, but there isn't a machine.*

## Candidates (three channels)
- **Heard — the inventory call.** Someone lists what is in a room (audio only); the student ticks what exists and what does not.
- **Done — the empty kitchen.** A plan of a kitchen with numbered positions; the student writes *there is/are* sentences that place the objects.
- **Read — the flat advert.** A short rental advert describing a kitchen; the student turns its bare lists into *there is/are* sentences.

## Chosen
**Done (the empty kitchen), entered through Heard.** Existence and place are decided by *looking*, so the lesson is built on a plan with positions: the student places the object, says it exists, and locates it — three behaviours in one artefact. The advert is good reading practice but hides the positions in prose.

**First 30 seconds:** a voice says *"There's a fridge, there are two chairs…"* and a plan with numbered slots appears; the student clicks the slots in the order they hear them. No rule yet.

## What the student produces (evidence)

## Conflicts, and how I resolved them
- **`some/any` belong to lesson 16.** Resolution: they never appear as a rule here. Where a negative or a question would naturally use *any*, the page uses a number or a countable noun instead, and the one place *any* is unavoidable is **glossed inline as vocabulary of lesson 16** — the student meets it, but nothing is taught about it.
- **Prepositions of place overlap lesson 17 (time and movement).** Resolution: lesson 9 owns the **static** place set; lesson 17 owns time and movement prepositions and recaps the *at/on/in* trio as the same point/surface/box logic. Recorded so 17 does not re-teach the table.
- **`there is` vs `it is` vs `have` is a three-way confusion.** Resolution: the page shows all three side by side **once**, because a student who is only told "use there is" will keep producing *"have a fridge in my kitchen"*.

## Shape of the session (what is met, in what order)
1. **Existe** — the Heard entrance: an inventory, tick singular/plural, then *there is/are* beside *it is* and *have*.
2. **A lei do lugar** — the three faces of *in/on/at*, then the rest of the place set.
3. **Perguntar e negar** — *Is there…? / Are there…?* and the two negatives, with short answers.
4. **A cozinha** — the field inside a real plan: write what exists and where.
5. **Ligar as ideias** — *and / but / because / so*.
6. **Lab do som** — the voiced *th* of *there*, and how *there's a* and *there are* link.

## Pass B — build notes (2026-11-03, page generated)

Page: `business/lesson9.html` (+ identical `.edit.html` sidecar).
Sections: 1 Existe (Heard entrance + there is / it is / have) · 2 A lei do lugar (in/on/at + the rest of the set) · 3 Perguntar e negar · 4 A cozinha (field + plan) · 5 Ligar as ideias (and/but/because/so) · 6 Lab do som (the voiced *th*, *there's a*, *there are*) · 7 Treino · 8 Quiz.

### Decisions taken inside the design (Pass B, recorded per §4)
- **The three-way confusion is shown as a chart with three rows of the same fact** (*there's / it's / we have*), because a one-line rule would leave the *"have a fridge in the kitchen"* error alive.
- **`any` appears exactly twice — both times glossed as lesson 16's word** (once in a note, once inside a correct answer). The lesson never teaches it and never drills it.
- **The kitchen field is a single table where every row is already a full sentence** with existence + place, so the two halves of the lesson are never separated in the examples.
- **The connectors section reuses only lessons 1-8 sentence shapes** (*there's…, I like…, we stand*), so nothing new rides along with the connector.

### Width decisions
- §2 in/on/at and the place set, §4 the field, §5 connectors — full `.chart`.
- §6's sound lab is one full `.chart` plus one `.panel` (the listen-and-tick group).
- §7 B+C and Quiz B+C — `itemrow[data-cols="2"]`: adjacent compressible groups.

### QA
`node qa/content.mjs 9` ✅ (chart 7 · panel 17 · listen 33 · gap 38 · radio 67, no anchor hints) ·
`node qa/width.mjs 9` ✅ · `node qa/overflow.mjs 9` ✅ clean (25 blocks).

7. **Treino** — agreement, place, short answers, connectors, recording.
8. **Quiz — sem consulta.**

## Notes for the build pass
Portuguese for the explanation; every kitchen word glossed before use; existence sentences always carry a place (the two halves of the lesson never separate in the examples); the connectors are trained on sentences built only from lessons 1-8.

Ten existence decisions (*is/are*), six *there is/are + place* sentences written from the plan, six short answers, four connected sentences (*and/but/because/so*), a spoken description of their own kitchen, then a quiz on all four behaviours with no reused item.
