# Lesson 7 — design (Pass A)

## Core (what the student can do afterwards)
1. Pick the right verb of saying by its **structure**: *tell someone · say something (to someone) · talk to someone about something · speak a language*.
2. Stop translating *esperar / achar / pagar / gastar / faltar* word for word — each one is **two or three English verbs**, decided by context.
3. Tell the same story in the past: *said, told, spoke, thought, found, paid, spent, waited, hoped*.
4. Give an instruction that works: *Boil the water. Don't overcook it.* (the imperative, at home in the kitchen).

## Teaching beats (per core item) and dependencies
- **The verb of saying is chosen by the slot that follows it.** *tell* needs a person before the thing (*tell me*); *say* takes the thing without a person (*say something*); *talk* needs *to* + person and *about* + topic; *speak* takes a language or a formal person. This is a structural decision, not a synonym list.
- **Five Portuguese verbs that split.** *esperar* = **wait** (stay until), **expect** (anticipate), **hope** (wish); *achar* = **think** (opinion), **find** (locate, and "find it easy"); *pagar* = **pay** (the bill), **cover** (pay for someone), **charge** (what a vendor asks); *gastar* = **spend** (money/time), **waste** (squander); *faltar* = **miss** (a session), **be missing** (a part), **be short of** (money/time).
- **Each item carries the condition that decides it** — a gloss that could go either way is not an item, so every entry shows the frame (*wait **for** the client*, *expect **to** hear*, *hope **that**…*).
- **The past arrives with the verb again** (lesson 6's rule): *said, told, spoke, thought, found, paid, spent, waited, hoped* — and the *-ed* three sounds are revised on the regular ones (*asked, called, waited*).
- **The imperative is the second person with no subject** — and it is the native form of a recipe and of an instruction at work: *Boil the water. Mix the eggs. Don't overcook it.*
- **The grocery/money field is the carrier** for *pay / charge / spend / cover*: *grocery, cart, aisle, product, price, cashier, checkout, receipt, coupon, discount, sale*.

## Situation
A week of ordinary work: a colleague tells you what the client said, you find out you are short of time before a deadline, and on the way home you shop — where the receipt shows what you paid, what they charged and what you spent.

## Candidates (three channels)
- **Heard — the handover call.** Six lines (audio only) where one person reports what someone said; the student ticks **who** said it and **to whom**.
- **Done — the four-column split.** A table with the Portuguese verb on the left and two or three empty frames to fill (*esperar → wait for / expect / hope*), each with one real sentence.
- **Read — the receipt.** A grocery receipt plus a short note about the purchase; the student writes what was paid, charged and spent.

## Chosen
**Done (the four-column split), entered through Heard.** The whole difficulty of this lesson is that one Portuguese word has several English ones — and only writing the frames side by side makes the split visible. The handover call is the entrance because it is the situation where *say/tell* are chosen in real time. The receipt is the best carrier for *pay/charge/spend* and is used as such, not as the entrance.

**First 30 seconds:** two short audio lines play — one with *tell*, one with *say* — and the student chooses which one names the person. The four verbs are named only after that.

## What the student produces (evidence)
Eight sentence frames completed with the right verb of saying, six split-verb choices, eight past forms, a four-line recipe written with the imperative, a grocery receipt reconstructed, three recorded instructions, then a quiz on all four behaviours with no reused item.

## Conflicts, and how I resolved them
- **say/tell/talk/speak were seeded in `VOCABULARY.md` for lesson 7** — this lesson is their home; the same goes for *esperar, achar, faltar, pagar, gastar*. Rule followed as written.
- **The cooking imperative could be its own lesson.** Resolution: it gets **one section**, not a tense chapter — the recipe is the frame that makes commands natural, and modal obligation (should/must/have to) stays in lesson 15.
- **The participle primer must be completed here** without teaching the present perfect. Resolution: the third column is filled (*said, told, spoken, thought, found, paid, spent*) and shown in **one** recognition contrast (*I paid / I've paid*); no production of the perfect.

## Shape of the session (what is met, in what order)
1. **Dizer e contar** — the entrance: two audio lines, who is named?; then the four verbs of saying by frame.
2. **As palavras que se dividem** — esperar / achar / pagar / gastar / faltar, each with its frames.
3. **O passado desses verbos** — the table, plus the -ed three sounds revised.
4. **No mercado** — the grocery/money field inside a real checkout.
5. **A cozinha manda** — the imperative and the cooking verbs.
6. **Treino** — frames, splits, past, recipe, recording.
7. **Quiz — sem consulta.**

## Notes for the build pass
Portuguese for the explanation; every split-verb item shows the **frame** (the word that follows) and not just a translation; all food/grocery words glossed before use; the imperative section is written as a recipe, not as a rule list.


## Pass B — build notes (2026-11-03, page generated)

Page: `business/lesson7.html` (+ identical `.edit.html` sidecar).
Sections: 1 Dizer e contar (entrance + the four verbs by frame) · 2 As palavras que se dividem (esperar/achar · pagar/gastar/faltar) · 3 O passado desses verbos · 4 No mercado (field + checkout dialogue) · 5 A cozinha manda (imperative) · 6 Treino · 7 Quiz.

### Decisions taken inside the design (Pass B, recorded per §4)
- **The three split tables are grouped by concept, not by page order**: *esperar/achar* share one table (both are "opinion vs fact"), *pagar/gastar/faltar* share the second (money, time and absence) — the grouping is what makes the splits memorable.
- **The past table comes before the grocery section**, reversing the design's order: the past belongs to the verbs of §2 and must land while they are fresh; the market then re-uses it (*they charged / I paid / we spent*).
- **The kitchen imperative is presented as a recipe** (affirmative | negative | what it means) with the remaining eight cooking verbs in a merged note, not as a grammar list.
- **The quiz keeps a written group** so the split verbs are produced, not only recognised.

### Width decisions
- §2's two split tables and §3's past table — full `.chart` (5 columns).
- §4's field table and dialogue — full blocks (one teaching object each).
- §6 B+C and Quiz B+C — `itemrow[data-cols="2"]`: adjacent compressible groups.

### QA
`node qa/content.mjs 7` ✅ (chart 6 · panel 15 · listen 45 · gap 46 · radio 48, no anchor hints) ·
`node qa/width.mjs 7` ✅ · `node qa/overflow.mjs 7` ✅ clean (25 blocks).

