# HANDOFF — context handoffs between sessions
A running note for handing context from one session/task to the next: where the work stands, what is in flight, and what to pick up next. Write here when a session ends mid-work, or when the next session needs context that is not obvious from the files themselves. (Not a task queue — see PENDING.md for the active plan and PARKED.md for the backlog.)

---

## [2026-11-02] FORMAT layout rewrite — width slots, `.itemsize`, width math

One task. Scope: FORMAT.md layout section, the CSS that implements it, parking the two current pages into the archive (no migration), one new QA check. No lesson-content work.

### Decisions (settled 2026-11-02, owner)

1. The class is **`.itemsize`**; the smaller sizes are the mutually exclusive `.itemsize-half` / `.itemsize-third`; full is the default (no size class). Rows are `.itemrow[data-cols="2"|"3"]`.
2. **Flow:** FORMAT drives content generation → the generator sizes the content and **tags the block** → CSS defines and displays that size. The class is the output of the sizing decision, never a styling afterthought.
3. **`.panel` survives for now:** keep `.panel`, `.panel.full`, `.panel.centered` in the CSS untouched (they simply stop being generated; `.itemsize*` owns width). Retire only `.grid3`, `.panels`, `.dialog.half`, `.qgrid-4` and the fixed 5-column `.qgrid`.
4. Capacity constants and font ratios live in **FORMAT.md** as the single source.
5. `lessons-archive/` may break (reference only) — no compatibility shim.
6. Tolerance word = **saturate** (verb). Canonical wording for FORMAT: *"items generated in a block **saturate** their slot — the combined width gets as close as possible to, and never past, 95% / 45% / 30% of `.content-area`, with no loss of quality or utility; the only way of closing the gap that is not allowed is redundancy."*

### A. Delete from FORMAT.md "### Layout STANDARDS at generation"

(a) half-beside-half, (b) minimise dead space, (c) content-aware adjacency, (d) columns are free, (e) neighbour height analysis, (f) >50%-fill-or-half-width, and guidance entry **(k)** (the "centred narrow panel" rule). Also delete the *guidance* that a full block "shrinks to its content".
Note: this is the guidance only — the `.panel`, `.panel.full` and `.panel.centered` CSS rules stay in `style.css` (decision 3); they simply stop being generated.

### B. Keep in FORMAT.md (do not reword, do not move)

- The fixed canvas facts already in §2b: `.page-container` 1400px, `.content-area` 1200px, absolute, never reflows, all authored content inside `.content-area`.
- "Content within a block may never overflow the block."
- The layout gotchas now in the element guidance: a `<br>` is ignored inside the flex `.blanks`; a fill-in hint sits on its own line BELOW the input; `.panel > :not(.ex-head)` carries 10px side margins; `.panel .chart{width:calc(100% - 20px)}`; `.chart{width:100%}`; `.chart tr.note td` is the styled note row.
- (g) consecutive questions separated by a small consistent vertical gap.
- (i) a note applying to one chart row is a merged (colspan) `tr.note` row directly under it.
- (j) contrasting linguistic/phonetic/grammatical classes are made visually distinct.

### C. Write into FORMAT.md (structure; prose authored in the task)

1. **Canvas** — the 1400/1200 frame and the never-overflow rule (one short block, referencing §2b).
2. **Three block widths only.** Blocks tile a row evenly: 2 × half or 3 × third, no mixing, no single half/third. Block width is a *result* of the pedagogical grouping decision, never a dial; the block is then **tagged** with its `.itemsize*` class so the CSS can display it.
3. **Fill target — content inside the block.** Items generated in a block **saturate** their slot: the combined width gets as close as possible to, and never past, 95% (full) / 45% (half) / 30% (third) of `.content-area`, with no loss of quality or utility; the only way of closing the gap that is not allowed is redundancy. Fill by increasing or reducing the verbosity and/or quantity of strings/items, and by the width of items *within* the row (gaps, column widths, option counts) — with real teaching content only.
4. **Halves/thirds need a stated reason** (divide, contrast, compare, or any other articulated reason), are generated only as complete aligned rows, and the row's members are height-equalised by **adding** content to the shorter ones, never by trimming the taller.
5. **Fixed vs elastic.** `h1`, `h2`, `.ex-head`, `.qstem`, `.lead` and hints are fixed strings and are exempt: they are neither stretched nor padded. Elastic: options, items, cells, chips, gaps. The same measurement decides both how much content to generate and whether a fixed string fits its slot.
6. **Charts and grids carry no prescribed column count.** A `.chart` is a table whose columns are whatever the content needs, always 100% of its block. No suggested option counts; question options wrap.
7. **Short single blocks:** no rule for now (owner decision) — leave as-is.
8. **Reasons are recorded in the design pass** (`designs/lessonNN.design.md`), not in the page.

### D. Width math (write into FORMAT as a table + 3 formulas)

Baseline = body 17px Public Sans = ratio 1.0. One unit for everything: **baseline characters (ce)**.

| elementsize | usable content width | `C_slot` (ce) |
|---|---|---|
| full | 1180px (1200 − 10px × 2 margins) | 144 |
| half | 541px (593 − 16×2 padding − 10×2 margins) | 66 |
| third | 355px (390.7 − 18×2 card padding) | 43 |

`C_slot` = usable width ÷ 8.16px (baseline advance). Calibrate once with `qa/live.mjs` (real Chrome) rather than trusting the estimate.

| font | ratio `r` |
|---|---|
| body 17px | 1.00 |
| bold 17px (`.qstem`) | 1.08 |
| `.lead` 18px italic | 1.12 |
| `.ex-head` 19px Playfair | 1.28 |
| h1 / h2 38px + `.14em` spacing | 3.21 |

Control equivalents (add to the row sum): radio + label gap = 2.6 ce · `input.gap` at 9em = 19 ce · chip padding = 3.4 ce.

```
charsCap(slot, font) = C_slot / r(font)
fits(row)            = Σ(item chars × r) + Σ(control ce) ≤ C_slot
target(row)          = aim for C_slot, never exceed
```

Fixed-string exemption (same equation): a heading/stem fits its slot only if `chars × r ≤ C_slot`; if it does not, shorten the string or promote the block to the next itemsize — never pad the elastic row to cover it.

### E. CSS to add

```css
/* the sizing decision is displayed by CSS: the tag carries the size */
.itemsize{width:100%}                                   /* default: full */
.itemsize-half{width:calc(50% - 7px)}                    /* 14px row gap → 7px each side */
.itemsize-third{width:calc(33.3333% - 9.3333px)}
.itemrow{display:flex;gap:14px;margin:14px 0;align-items:stretch;flex-wrap:nowrap}
.itemrow>*{min-width:0;margin:0}
.itemrow[data-cols="2"]>*{width:calc(50% - 7px)}         /* row and tag agree */
.itemrow[data-cols="3"]>*{width:calc(33.3333% - 9.3333px)}
.qgrid{grid-template-columns:max-content minmax(0,1fr)}  /* number + stem only; options wrap on their own line */
.qgrid .qopts{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px 18px}
```

A standalone half/third is illegal (rule 2), so `.itemsize-half` / `.itemsize-third` only ever appear inside `.itemrow`; the duplicated width declaration exists so a misplaced block is visibly the wrong size instead of silently full width.

### F. CSS to remove / keep

Remove: `.grid3`, `.grid3 .card`, `.panels`, `.dialog.half`, `.qgrid.qgrid-4`, and `.qgrid`'s `repeat(3,max-content)` + `justify-content:space-around`.

Keep untouched: `.card`, `.chart`, `.panel`, `.panel.full`, `.panel.centered` (survive for now, no longer generated), `.chips`, `.blanks` (all variants), `.dialog`, `.listen`, `.ex-head`.

### G. Page state for this task (no migration)

**Step 0 — park the two generated pages** (they are regenerated after the next task, not migrated here):

```
git mv business/lesson1.html        lessons-archive/lesson1-new.html
git mv business/lesson1.edit.html   lessons-archive/lesson1-new.edit.html
git mv business/lesson10.html       lessons-archive/lesson10-new.html
git mv business/lesson10.edit.html  lessons-archive/lesson10-new.edit.html
node build-lessons.mjs      # business now reports 0 lessons — expected
```

Leave `lessons-archive/` otherwise untouched (those pages keep the old classes; reference only). `designs/lesson01.design.md` and `designs/lesson10.design.md` remain the design source for regeneration, and any "cannot saturate the slot" reason gets recorded there.

### H. New QA: `qa/width.mjs`

`node qa/width.mjs [lessonNumbers…]` — static markup audit, exit 1 on any finding:

1. every half/third block sits inside `.itemrow`;
2. every `.itemrow` is complete (2 children with `data-cols="2"`, 3 with `data-cols="3"`) and holds no mixed sizes;
3. no retired class remains (`.grid3`, `.panels`, `.dialog.half`, `.qgrid-4`);
4. no element carries both `itemsize-half` and `itemsize-third`;
5. no `.chart` declares a column count.

`business/` is empty in this task, so the audit needs fixtures: add `qa/fixtures/width-ok.html` (one complete 2-row, one complete 3-row, correct tags) and `qa/fixtures/width-bad.html` (mixed row, lone third, retired class), and support `node qa/width.mjs --selftest` → exit 0 on the good fixture, exit 1 on the bad one.

Hook `width.mjs` (no args) after `build:lessons` in `npm run qa`.

### Done when

`npm run qa` green · `node qa/width.mjs --selftest` green · `node qa/content.mjs` and `node qa/overflow.mjs` run clean on whatever pages exist · `business/` empty with the two `-new` pages parked in `lessons-archive/` · FORMAT.md holds the model, the `saturate` wording, the constants table and the three formulas · CSS in place and `.panel*` untouched.

### Status 2026-11-03 — EXECUTED
A–H are in the tree and committed: FORMAT.md holds the three-width model, the `saturate` wording, the `C_slot`/ratio constants and the three formulas; style.css carries `.itemsize*`/`.itemrow` and no longer carries `.grid3`, `.panels`, `.dialog.half` or `.qgrid-4`; lessons 1 and 10 are parked as `lessons-archive/lesson1-new.*` / `lesson10-new.*` and `business/` is empty; `qa/width.mjs` (+ `qa/fixtures/`) is green under `--selftest` and hooked into `npm run qa`.
`qa/smoke.mjs` and `qa/content.mjs` now discover whatever pages exist — an empty `business/` passes, a named-but-missing lesson fails. The old two-level pronunciation-model material, and the items that still described the 1–34 numbering, were swept out of PARKED and ISSUES.
Next task: regenerate lesson 1 (then 10) from `designs/lesson01.design.md` / `designs/lesson10.design.md`. The parked `-new` pages are reference only — never a migration source.

---

## [2026-11-03] Business lesson 1 generated (first page in the new block model)

One task: Pass B for lesson 1 from `designs/lesson01.design.md`. No rule, CSS or harness change.

- `business/lesson1.html` + the identical `business/lesson1.edit.html` sidecar are in the tree; `node build-lessons.mjs` re-derived `lessons.json` (business: 1, "First Talk & the Sentence Skeleton").
- Structure (all PT for explanation — the A0 checkpoint — targets in EN, `data-say` on every target line): **1** Quatro portas (the design's Heard entrance, transcript hidden in `<details>`) · **2** O seu crachá (the badge wall, the spine) · **3** O sujeito nunca se esconde (be am/is/are) · **4** a/an by sound · **5** O coringa it · **6** Sound Lab (letter≠sound · final consonant · p/t/k aspiration · 8 × /ɪ/ vs /æ/) · **7** Treino · **8** Quiz. 12 desk-object vocabulary items carry §4.
- **Width model exercised for the first time**: 2×half rows (§1 doorways, *compare*), 3×third rows (§2 badge *divide*, §3 be + §4 a/an *contrast*), everything else full `.panel itemsize`. The reasons, and the two saturation deviations (two-column `.blanks.sent.cols` for the long fill-in lists; the /ɪ/-/æ/ pair options moved into the `.qline` because `.qopts` spread a two-option pair over the full 1200px), are written into the design file.
- **Audio**: 7 new clips rendered with `npm run build:audio` (cat, cake, car, about / go, good, who / hit / did / pin / list / pitch); the other 30 strings reuse existing clips. `node build-audio.mjs --check` → "all clips present" (37 unique strings for business).
- **Verified**: `npm run qa` green (build:lessons + width + smoke), `qa/content.mjs 1` green (`chart=4 panel=14 listen=41 gap=43 radio=61 feed=1`, every radio resolves an anchor), `qa/width.mjs 1` green, `qa/overflow.mjs 1` green **but vacuous**, plus a real-Chrome probe (temporary `qa/_probe.mjs`, deleted after use) measuring every block: no internal overflow, no width-vs-slot violation, no `.blanks` cell overflow, nothing crossing `.content-area`; the four screenshots taken during authoring were used to fix the two-option spread and the blank widths.
- `qa/overflow.mjs` still measures only the retired `.panels > .panel` → recorded as **B-QA1** in ISSUES.md (owner decision whether to extend it).
- Next task: lesson 10 from `designs/lesson10.design.md`.

---

## [2026-11-03] QA: `qa/overflow.mjs` rewritten for the block model (+ two smaller QA fixes)

Follow-up to the lesson-1 run, whose layout verification needed a throwaway probe because the harness could not see the new markup. No engine, CSS or rule change.

- **`qa/overflow.mjs` rewritten** (B-QA1, now "believed fixed"). It measures every block of the current model — `.panel`, `.itemrow > *`, `.content-area > .card` / `p.card` / `.chart`, plus the legacy `.panels > .panel` — and fails on **OVERFLOW** (content wider than its block), **BALLOON** (block wider than its slot, honouring `data-cols` / `.itemsize*`), **ESCAPE** (any element crossing the fixed `.content-area` frame — this is the check that catches a right-aligned `.blanks` item spilling LEFT out of its panel) and **CELL** (a `.blanks` cell whose item cannot fit). DEADSPACE and HEIGHT stay as review-only hints. It also now DISCOVERS the pages that exist instead of sweeping a hard-coded 1–34, fails a named-but-missing page (same rule as `content.mjs` / `width.mjs`), and prints how much it measured (`canvas … · blocks N (full / half / third)`).
- **Fixture selftest added**: `node qa/overflow.mjs --selftest` passes only if `qa/fixtures/overflow-ok.html` is clean AND `qa/fixtures/overflow-bad.html` reports findings (balloon + overflow + escape + cell). The bad fixture deliberately reproduces the real failure mode (a `.ptw` gloss is `flex:0 0 auto`, so the item cannot shrink back into its 240px cell). This is the guard against the vacuous pass that bit lesson 1.
- **`qa/content.mjs`**: (a) non-failing `(hint)` for two distinct controls resolving the same answer anchor (a radio group counts as one control) — it immediately caught a real copy in lesson 1 ("She ___ the project manager." in both §3 practice and the quiz), now fixed; (b) the test server binds an ephemeral port instead of a fixed 8766, so a leftover or parallel run can no longer die with `EADDRINUSE`.
- `package.json` gains `npm run qa:layout` = overflow selftest + overflow sweep (a browser is required, so it is not part of `npm run qa`, which stays jsdom-only).
- Verified: `node qa/overflow.mjs --selftest` green · `node qa/overflow.mjs` green on lesson 1 (32 blocks: 19 full / 4 half / 9 third) · `node qa/overflow.mjs 2` fails "page not found" as intended · `node qa/content.mjs 1` green with no hint · `node qa/width.mjs 1` green · `npm run qa` green · `node build-audio.mjs --check` clean.
- Next task: lesson 10 from `designs/lesson10.design.md`.

---

## [2026-11-03] Lesson opener reframed (teaching intent + `be` = ser/estar) and site functions moved to the shell

Owner instruction: the opener must say WHAT the lesson teaches (here: `be` for the fixed facts that answer to *ser*, and the same verb for the states that answer to *estar*), the concept must be generalised into FORMAT, and site functions must be explained in the page header instead of the lesson opener.

- **Opener rewritten** (`business/lesson1.html`): it now opens with "O que esta aula instala:" — the three target strings, the law *the subject is never hidden*, the surprise *the same verb covers what is passing* (`I'm hungry` = *estou com fome*, one English verb where Portuguese has *ser* + *estar*), and the sound law. No activity menu, no tool explanation (the old `Abertura:`/`Caderno:` paragraph is gone).
- **The `be` = *ser*/*estar* contrast is now taught, not just mentioned**: §3's chart gained the row *Estou com fome. → I am hungry.* plus a merged `tr.note` row ("I am = sou e estou … o contexto decide: I am a designer / I am hungry"), the §3 gap list gained *We ___ hungry* and *It ___ cold today*, and Quiz C gained the item *Estou com fome.* (so the state use is trained and tested, not only read). New clip rendered: "I am hungry.".
- **Site functions moved to the shell**: new `#barhelp .barhelp` line directly under the control bar, above `main#page`, baked into the HTML (not engine-generated, per the owner), using the owner's wording with each feature in parentheses and the three highlight names shown as colour chips (`.hlk-y/.hlk-g/.hlk-r`). Hidden in print. CSS added; the rest of the page is unchanged.
- **FORMAT.md generalised** (the part that stops the next page inventing an opener): §2b shell order now names the opener block and `#barhelp`; new §2c defines the legend (the ONLY place the site's tools are explained); new subsection **"Lesson opener (abertura) — contract"** with three required contents — (1) what the student can DO, shown in the lesson's target strings, (2) the law/mental model named, (3) **where the lesson corrects a Portuguese→English mapping, that mapping stated explicitly with one example of each side** (`be` = ser + estar, `have` = ter + haver, to/for = para, live = morar/viver) — capped at 3–5 sentences, no activity list, no tool description.
- **QA**: `qa/overflow.mjs` gained `--shot <file> [--shot-h <px>]` (review aid — the new legend line needed an eyeball) and its option values are no longer parsed as lesson numbers.
- **PARKED**: B-I9 (the old "move the how-to-use into the control bar" item) is satisfied — closed, replaced by **B-I9b**: kids/ and adult/ still carry the old "Caderno:" opener and no `#barhelp`.
- Verified: `npm run qa` green · `qa/content.mjs 1` green (`chart=4 panel=14 listen=42 gap=45 radio=64 feed=1`) · `qa/width.mjs 1` green · `qa/overflow.mjs` green (spacing minimums unchanged) · `qa/overflow.mjs --selftest` green · `build-audio --check` clean (38 strings) · top-of-page screenshot reviewed (legend renders under the control bar, chips visible, page border clear of it).
- Next task: lesson 10 from `designs/lesson10.design.md`.

---

## [2026-11-03] Spacing between blocks: rule + check + CSS fix

Owner instruction: blocks must get a few pixels of space between them (vertically for full blocks), and the margins between row members and across the options must be confirmed.

- **The defect was real and measurable**: consecutive full panels were **glued** (0px) — the seven Treino/Quiz group panels — and a `p.lead` under a panel sat at 4px. `.panel` was the only block class with no vertical margin (`.card`, `.chart`, `.itemrow` all carry `margin:14px 0`).
- **CSS**: added `.content-area > .panel{margin:14px 0}` in `style.css` (scoped to top-level panels, so row members keep `.itemrow>*{margin:0}` + the row's 14px gap, and legacy `.panels` grids / kids / adult pages are untouched).
- **FORMAT.md**: the rule is now written into the contract ("Vertical rhythm", owner instruction 2026-11-03) — a block never touches the block above or below it; row members use the row's 14px gap; option pairs keep the `.qopts` / `.qline` gap; a chart cell keeps its 12px horizontal padding.
- **Checked, not just fixed**: `qa/overflow.mjs` gained the spacing family — **BLOCKGAP** (<8px between two stacked direct children of `.content-area`), **ROWGAP** (<8px between `.itemrow` members), **OPTGAP** (<4px between two option labels sharing a parent, so it covers both `.qopts` spread rows and the compact `.qline` pairs) and **CHARTPAD** (<8px horizontal padding on a chart cell). The run prints the measured minimums: lesson 1 now reads `between blocks 8px · between row members 14px · between options 18px · chart cell padding 24px` (the 8px is the intended `h3.ex-head` → its own explainer pair).
- **Fixtures extended** so the selftest covers the new family: `overflow-bad.html` now has glued panels, a zero-gap row, touching options and a padding-free chart cell (9 findings, every check kind firing), and `overflow-ok.html` has two stacked panels proving the 14px rhythm (clean).
- Verified after the CSS change: `npm run qa` green · `node qa/content.mjs 1` green · `node qa/width.mjs 1` green · `node qa/overflow.mjs` green (spacing minimums above) · `node qa/overflow.mjs --selftest` green. No screenshot was taken for this step: the check measures the exact property (px between the boxes), which is what the instruction asks for.
- Next task: lesson 10 from `designs/lesson10.design.md`.

---

## [2026-11-03] Free-text blocks are fixed size (no drag handle)

Owner instruction: the free-text input blocks (e.g. lesson 1 §7D) must not be drag-resizable.

- **Defect confirmed by measurement** before touching anything: `qa/overflow.mjs` (with the new RESIZE check) reported `❌ RESIZE drag-resizable textarea (resize:both) «trw»` — `#feed` was already `resize:none`, the authored `#trw` was not, so the browser gave the student a drag handle that could widen the box past its block and past the fixed canvas.
- **CSS**: `.content-area textarea{resize:none}` (scoped to authored content — the note editor inside the selection popup is untouched, it is not lesson content).
- **FORMAT.md**: the `textarea` bullet now states the rule — a free-text block is fixed size, never drag-resizable, because the layout is fixed at generation; `#feed` / `#trw` keep their ids (that is what persists).
- **QA**: new fatal check **RESIZE** in `qa/overflow.mjs` (any textarea inside `.content-area` whose computed `resize` is not `none`), documented in the header and in VERIFICATION.md, plus fixture coverage — `overflow-bad.html` hangs an inline `resize:both` on a textarea (fires), `overflow-ok.html` carries a normal authored textarea (clean under the rule).
- Verified: `npm run qa` green · `qa/content.mjs 1` green · `qa/overflow.mjs` green on lesson 1 · `qa/overflow.mjs --selftest` green (ok clean / bad 10 findings). No page content changed, so `lesson1.html` and its `.edit.html` sidecar remain identical.
- Next task: lesson 10 from `designs/lesson10.design.md`.
