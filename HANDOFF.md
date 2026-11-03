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

## [2026-11-03] BUG: radios did not accept input (engine2.js cancelled every click)

Owner report: "the radio buttons are not accepting inputs". Root cause found, fixed, and now guarded.

- **Cause**: engine2.js cancelled the click whenever the radio was `checked`, believing `checked` still held the pre-click state. It does not: the browser runs the radio's **pre-click activation** (checks it, unchecks its group) *before* dispatching `click`, so `checked` is always true inside the handler → **every first click was cancelled**, and the browser's canceled-activation revert put the group back on its previous option (which is exactly the older "the picked radio reverts to another option" report). Not a timing/poll issue, and not `renderAnswers`.
- **Fix** (`engine2.js`): the pre-click state is captured on `pointerdown` / `mousedown` / `keydown` (`ansRadioPre`, `ansRadioTarget`) — all of which run before the activation — and the "re-click to clear" unchecks **after** the click (`setTimeout(…,0)`), because cancelling the click would only make the browser restore the option being removed. First click stands, group switch works, re-click clears the value and deletes the answer row. Documented in FUNCTION.md ("A radio click is never cancelled") so it is not "simplified" back.
- **Why it survived QA**: `qa/smoke.mjs` set `radioEl.checked = true` programmatically and called `ansSaveEl`, so no click was ever dispatched. Added a real-click block: first click keeps the choice, another option moves it, re-click de-selects — verified to FAIL against the old handler (mutation-checked) and pass now.
- **Real-browser wiring sweep** (temporary `qa/_wire.mjs`, deleted afterwards; backend stubbed so nothing was written to the sheet) — 18 checks, all green: engines booted · control bar · `#barhelp` · radio first click · radio survives a 4s poll · answer row saved · group switch · re-click de-selects + clears the row · `.qline` pair anchor resolves · pair click · pair survives a poll · gap input saves typed text · `#trw` saves · `#trw` not drag-resizable · notebook saves its own row type · notebook text survives a poll · audio chip click raises no console error.
- Verified: `npm run qa` green (with the new radio regression test) · `qa/content.mjs 1`, `qa/width.mjs 1`, `qa/overflow.mjs` green · `qa/overflow.mjs --selftest` green.
- Next task: lesson 10 from `designs/lesson10.design.md`.

---

## [2026-11-03] Archived pages withheld + CSS declared off-limits + content-aware divisions (any N)

Owner instruction: (1) the archived/parked lesson files go into `.gitignore` and must never be used as a reference again; (2) a very strong rule at the top of `style.css` saying its contents must not be looked at or used to [infer, reference or guide] lesson content creation; (3) a lesson's shape is FREELY IMAGINED from PEDAGOGY-MAP §LESSON GENERATION 1 (Pass A); (4) any column-based layout or content division must be content- and layout-aware, using any number of columns or rows as appropriate.

- **Archive withheld**: `lessons-archive/` is now in `.gitignore` and was **untracked** (`git rm -r --cached`; the 44 files stay on the owner's disk, recoverable from git history). FILESYSTEM.md, STATUS.md, FORMAT.md and PEDAGOGY-MAP.md all now say it is withheld and must never be read; HANDOFF's old "reference only" lines are superseded by this entry.
- **`style.css` declared off-limits for content**: a loud banner at the head of the file (before `@import`) — do not read, infer, reference or use it for lesson content creation; shape comes from PEDAGOGY-MAP Pass A, authoring vocabulary from FORMAT.md, behaviour from FUNCTION.md.
- **FORMAT.md**: new out-of-scope rules — lesson SHAPE is freely imagined per Pass A (no template anywhere; reusing another lesson's section list is a generation error), archives withheld, `style.css` is implementation only. PEDAGOGY-MAP §1 gained **"The shape is IMAGINED, not inherited."**
- **Column model rewritten to be content-aware (any N)**: `.itemrow` is now a grid (`grid-auto-flow:column; grid-auto-columns:minmax(0,1fr)`), so it divides into exactly as many columns as it has members — no 2/3 grid, no mixing rules. A member whose content is genuinely wider takes more than one share with `data-span="K"` (2..4). `.itemsize-half` / `.itemsize-third` are **retired** (a member never sets its own width); `.itemsize` (full block, no row) stays. `data-cols="N"` documents the row's column total.
- **FORMAT's width rules + width math generalized**: the "three block widths only" rule became "a row divides; the division follows the content (any N)"; the slot constants became one formula `share_px(N, span) = (1180 − 14 × (N−1)) × span / N` with a table for N=2..4 and span weighting; the fill target is now "95% of the slot the block owns".
- **QA follows the model**: `qa/width.mjs` now checks ≥2 members per row, `data-cols` equal to the real column total, `data-span` in 2..4 and within the row, no self-declared member width (retired size classes + inline width), plus the old retired-class and chart-column rules; fixtures rewritten (a 4-column row and a weighted `data-span="2"` row are in the OK fixture). `qa/overflow.mjs` computes a member's slot from the row itself (`(canvas − 14×(N−1)) × span/N`), so BALLOON works for any N.
- **Lesson 1 updated mechanically**: 13 row members dropped `.itemsize-half`/`.itemsize-third`; nothing else changed (screenshot reviewed — the 2- and 3-column rows render identically to before).
- Verified: `npm run qa` green · `qa/content.mjs 1` green · `qa/width.mjs 1` + `--selftest` green · `qa/overflow.mjs` green (`blocks 32 · full 19 / dividing a row 13`, spacing minimums unchanged) + `--selftest` green · `build-audio --check` clean · `business/lesson1.edit.html` re-copied.
- Next task: lesson 10 from `designs/lesson10.design.md`.

---

## [2026-11-03] Default button interaction (hover highlight + press animation) for the whole site

Owner instruction: all site buttons get a standard mouseover highlight and a click animation by default.

- **`style.css`** (after the base `button` rule, so every per-element rule still wins): `button{transition:transform .09s,filter .12s}` · `:hover:not(:disabled):not(.locked){filter:brightness(1.14);transform:translateY(-1px)}` · `:active:not(:disabled):not(.locked){filter:brightness(1.04);transform:translate(2px,2px)}` · `:focus-visible{outline:3px solid var(--tan)}` · a `prefers-reduced-motion` block that drops the movement.
- **Why modulate instead of recolour**: the rules never set `background` or `box-shadow`, so buttons that carry their own colour/shadow keep them — `.listen` (tan), the highlight palette swatches (`.hlpal button[data-c]`, no shadow), `.complete-btn` (teal/slate), `.remlink` (transparent), `.bookmenu button` (paper) and its existing `:hover` tint. The press moves the button 2px into its own hard shadow, which is the site's offset-shadow idiom.
- **`FORMAT.md`** buttons bullet now documents the shared interaction (and that no page writes its own hover/press CSS).
- **Verified in real Chrome** (temporary `qa/_hover.mjs`, deleted after use; backend not involved): at rest no filter/transform · hover `brightness(1.14)` + `matrix(1,0,0,1,0,-1)` · the tan background and the ink shadow are unchanged · press `matrix(1,0,0,1,2,2)` with the shadow unchanged · an engine-rendered control-bar button highlights too · a disabled button (`← Last` on lesson 1) does not react · `prefers-reduced-motion: reduce` leaves `transform: none`. A 2× crop of the pressed `.listen` button was eyeballed: the button sits 2px into its shadow.
- Also fixed a self-inflicted slip during the edit: the first pass replaced the base `button` rule instead of adding after it; the base declarations were restored before any verification.
- Verified: `npm run qa` green · `qa/content.mjs 1`, `qa/width.mjs 1`, `qa/overflow.mjs` (+ both selftests) green · lesson rendering unchanged elsewhere.
- Next task: lesson 10 from `designs/lesson10.design.md`.

---

## [2026-11-03] Legend text rewritten with live mark demos + notebook gated to .content-area

Owner instruction: (1) the `#barhelp` line takes new wording, with "Hear Teacher Pronunciation" underlined in the **recording** style and "Attach a Note" washed in the **note** style (colour names unchanged); (2) the popup, its functions and its toasts are disabled outside `.content-area`.

- **Legend rewritten** (`business/lesson1.html`): `Select text to Hear Teacher Pronunciation or Record Your Own, See the Pronunciation Key, or Attach a Note to the Text — (on PC) Hold Ctrl and Select Text to Highlight it in Yellow, Green, or Red`. `.hb-rec` was **added to the existing `mark.nb.has-rec` selector** (so the underline is literally the recording's declaration, not a copy) and `.hb-note` uses the note's `var(--bluebg)` wash; the Yellow/Green/Red chips are untouched. It now fits on one line.
- **Notebook scoped to the lesson content** (`engine1.js`): new `inContentArea(node)` gate at the two gesture entry points — `trySelPopup()` (which bails before the size and one-block toasts, so the shell can no longer produce *any* toast) and `hlFromSelection()` (Ctrl+drag outside content creates nothing). Root cause of the leak: `HL_BLOCKSEL` includes `h1`/`div`, so the header's `<h1>` and the `#barhelp` div both resolved a "block" and opened the popup. The gate is deliberately **not** applied to `hlBlocks()`, which is the offset ruler saved highlight rows are keyed against.
- **`FORMAT.md` §2c** now quotes the exact legend text, states that it demonstrates the marks (and why they must stay the same declarations), and says the legend is inert. **`FUNCTION.md`** gained the "Scope: `.content-area` only" rule with the two entry points and the `hlBlocks()` caveat.
- **Why a test was needed**: the suite's generic "popup appears on text selection" test selected the FIRST `p`/`span` in the document — which is the header's `<span>LESSON 1</span>` — so it had been passing *because* the shell was leaky. It now selects inside `.content-area` within the real 3..200-char limit, and a new block asserts (a) `inContentArea()` is false for the shell and true for content, (b) a selection in the header/legend opens no popup and raises no toast.
- Verified: `npm run qa` green (incl. the two new assertions) · `qa/content.mjs 1`, `qa/width.mjs 1`, `qa/overflow.mjs` (+ both selftests) green · top-of-page screenshot reviewed (one line: blue-underlined "Hear Teacher Pronunciation", blue-washed "Attach a Note", colour chips unchanged) · `.edit.html` re-copied.
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

---

## [2026-11-03] Pass A/B exclusions re-thought (D1–D5) + legend styling + inert shell

Owner review of the exclusion list in PEDAGOGY-MAP §1. Resolutions applied, plus the two shell/legend items.

**Spec changes (PEDAGOGY-MAP §1 + FORMAT §1d + the style.css banner)**
- **D1 — the shape now has an owner.** Pass A's output list gained **"the shape of the session"**: what the student meets first/second/third, how many sections, their order, where content sits side by side, and which content type each section wants. Guardrail (owner): the shape must still be *recognisably a lesson page of this site* (one column of sections under one title, an opener that states what the lesson installs, practice, a no-consultation quiz) and is free inside that — a shape that cannot be built on the shell is a defect of the design pass, not the build. Pass A **may recommend content types** (a comparison table, a dialogue, a listen-and-tick, a recording) — the old framing line "You have no tables, no charts…" was replaced with "no page, no classes and no build mechanics".
- **D2 — PEDAGOGY-MAP is now a Pass B input.** §3–§7 (non-negotiables, content-authoring rules, level checkpoints, vehicles, site contract) are build inputs, not background; this lesson's roadmap entry too.
- **D3 — the build is a synthesis, not obedience** (the resolution I proposed and applied): three-tier feedback — (i) a purely mechanical realisation is Pass B's call, no escalation; (ii) a change that alters the shape or a teaching beat is made and **written back into the design file** (§4); (iii) what cannot be resolved that way is escalated (§2).
- **D4 — no other lesson's PAGE is read.** Redundancy/flow is checked against structured extracts only: neighbouring roadmap entries (`Content:` / `Key vocabulary:` / `Focus:`) and the concept inventory (`VOCABULARY.md`, which carries a Lesson column). A page read is a shape absorbed and cannot be un-read.
- **D5 — style.css readings clarified**: legitimate for an *implementation* question during the build (which class/knob does what); forbidden as a source of content or shape. FORMAT §1d and the CSS banner updated.
- **Change 4 weakened** as instructed: Pass B "may not replace the design's shape on its own authority — only when the user instructs it, or after repeated failure to generate or implement that shape (it then proceeds, records the change in the design file, and does not escalate)". Copying a shape is explicitly allowed **when the owner asks for it**.

**Legend + shell (owner instruction)**
- `#barhelp` text: "Record Your Own" and "Pronunciation Key" unbolded; `.barhelp` colour `#8a8072` → `var(--ink)` (ungreyed) and `13px → 14px`. The recording underline (`Hear Teacher Pronunciation`), the note wash (`Attach a Note`) and the three colour chips are unchanged.
- **The shell is inert**: `header.brand, .control-bar, .barhelp, footer { user-select:none }` — the notebook only exists inside `.content-area`, so no selection can start there.
- New fatal check **SELECT** in `qa/overflow.mjs` (any of those shell elements computing a `user-select` other than `none`), documented in the header + VERIFICATION, with fixture coverage (`overflow-bad.html` forces `user-select:auto`/`text` on header, legend and footer; `overflow-ok.html` carries a header + footer that must compute none).
- Verified: `npm run qa` green · `qa/content.mjs 1` green · `qa/width.mjs 1` + `--selftest` green · `qa/overflow.mjs` green on lesson 1 (SELECT clean) + `--selftest` green (bad fixture 15 findings incl. SELECT) · screenshot reviewed (legend one line, 14px, ink, two words unbolded, underline/wash/chips intact) · `.edit.html` re-copied.
- Next task: lesson 10 from `designs/lesson10.design.md`.


---

## [2026-11-03] REVERTED: `.itemsize-half` / `.itemsize-third` are back — block layout is fixed 2/3, content inside a block is what becomes content-aware

Owner correction: "undo the removal of .itemsize-half/third, and any related elements, we DO need those. Content-aware division and column count applies to the content IN the blocks/charts."

- **`style.css`**: restored `.itemsize{width:100%}`, `.itemsize-half{width:calc(50% - 7px)}`, `.itemsize-third{width:calc(33.3333% - 9.3333px)}`, `.itemrow{display:flex;gap:14px}` and `.itemrow[data-cols="2"|"3"]>*{width:…}`. The grid auto-columns model and the `data-span="2..4"` weighting rules are **gone**. A comment in the file now states the split: the block layout is the fixed 2/3 slot model; the content-aware rule (any number of columns/rows the content needs) applies inside a block — `.chart`, table, option row, `.blanks` list — never to the blocks.
- **`business/lesson1.html`**: the 13 row members got their size classes back (4 × `itemsize-half` in §1's two doorway rows, 9 × `itemsize-third` in the badge / be / a-an rows); `.edit.html` re-copied.
- **`qa/width.mjs`**: back to the 2/3 audit — every half/third inside a row and never both classes; `data-cols="2"` = exactly 2 halves, `"3"` = exactly 3 thirds, no mixing, `data-cols` required; a row member carrying an inline width is still a finding (that part of the content-aware change was kept: the size class owns the width); retired classes and chart column counts unchanged. The `data-span` rule is gone. Fixtures rewritten to the 2/3 model (the OK fixture now also carries a 3-column and a 2-column chart, proving the inside-a-block freedom is what varies).
- **`qa/overflow.mjs`**: slot computation and the full/half/third tally restored (slot from the row's `data-cols` + the member's size class); `BALLOON` header comment updated.
- **`FORMAT.md`**: rule 2 back to **"Three block widths only"** (with a parenthetical that the content-aware freedom belongs inside a block), the fill target back to 95 % / 45 % / 30 %, rule 4 back to "halves/thirds need a stated reason", the width-math table back to full/half/third, and rule 6 strengthened into **"CONTENT is content-aware: no prescribed column or row count"** — a chart may take 2, 3, 4+ columns, a `.blanks` list or option row takes as many cells/options per line as its items need, lists as long as the teaching needs; nothing in the file caps those numbers.
- **`VERIFICATION.md`** updated to describe the restored audit and to say that the inside-a-block freedom is deliberately not column-count-checked.
- Verified: `npm run qa` green · `qa/content.mjs 1` green · `qa/width.mjs 1` + `--selftest` green (bad fixture: 8 findings, mixed row / lone third / inline width / incomplete row / missing data-cols / .grid3 / chart count) · `qa/overflow.mjs` green (`blocks 32 · full 19 / half 4 / third 9`, spacing minima unchanged) · screenshot reviewed — the 2- and 3-column rows render exactly as before.
- Next task: lesson 10 from `designs/lesson10.design.md`.

---

## [2026-11-03] Legend in Portuguese; "a chart IS a block" made explicit in FORMAT + CSS; CSS aligned with the edited FORMAT

Owner instruction: translate the site-functions line to Portuguese with the same styling; make FORMAT.md and style.css clear that a chart (or any future content type) can BE a block and take the block width class; then read the owner-edited FORMAT.md and bring the CSS code/comments into line with it.

- **Legend translated** (`business/lesson1.html`, `.edit.html` re-copied): *"Selecione um texto para **Ouvir a Pronúncia do Professor** ou Gravar a Sua, Ver a Chave de Pronúncia, ou **Anexar uma Nota** ao Texto — (no PC) Segure **Ctrl** e Selecione o Texto para Destacá-lo em **Amarelo**, **Verde** ou **Vermelho**"* — same styling: `.hb-rec` keeps the recording's blue underline, `.hb-note` the note wash, the three colours keep their chips, "Gravar a Sua" / "Ver a Chave de Pronúncia" stay plain. It wraps to two lines now (PT is longer) — accepted, the layout has room. FORMAT §2c updated: the legend is **Portuguese**, and it is **shell chrome, not lesson prose**, so it must NOT be italic (no `lang="pt"`/`.pt` on it — that is why the always-italic rule does not apply here).
- **"A chart is a block" is now stated in three places**: FORMAT §"Following are guidance…" `.chart` bullet ("a chart is a BLOCK like any other content type … the width class is what makes it a block"), FORMAT rule 2 ("**a block is any content type that fills a slot** — `.card`, `.panel`, `.chart`/table, `.dialog`, `fieldset`, or a future type"), and `style.css` in the block-scale comment. CSS-wise the intent is now order-proof: added `.chart.itemsize-half` / `.chart.itemsize-third` companions (a table's own `width:100%` is only the default of an untagged full block), so a chart tagged half/third is sized by its class regardless of rule order. Fixture coverage: `qa/fixtures/width-ok.html` now contains a 2-row made of a `.card.itemsize-half` **and a `.chart.itemsize-half`** (audit clean).
- **CSS read against the owner-edited FORMAT and corrected where it disagreed**:
  - FORMAT says "@media print: hides header/#controlbar/#feed/footer, strips container border/shadow". The CSS only did that on the app's `body.printing` snapshot path, so a plain browser print kept the shell. Added a plain `@media print` block: hides `header.brand`, `#controlbar`, `#barhelp`, `#feed`, `footer`, strips `.page-container` border/shadow and keeps `.panel/.chart/.card` from breaking across pages. `body.printing` behaviour untouched.
  - Confirmed already-conforming and left alone: `.ptsound` (tan/italic/not bold, with its scope comment), `.thsub` (block, weight 400, `.78em`, opacity .82, no `font-style`), `:lang(pt){font-style:italic;font-weight:400}`, `input.gap` (2px tan bottom border, #fff8ea, contiguous — no `___`), `.content-area textarea{resize:none}`, `fieldset` (dashed tan, 12px radius), `.chart` (paper, 2px ink frame, tan shadow, ink header row, tan grid, `.chart tr.note td`), `.chips`, `.itemrow` 2/3 + `.itemsize*`, `.ex-head`, `.blanks` + `.sent` / `.sent.cols` / `.line` / `--long`, `.dialog`, `.listen`, `.panel*`, vertical rhythm, buttons.
- Verified: `npm run qa` green · `qa/content.mjs 1` green · `qa/width.mjs 1` + `--selftest` green (ok fixture now includes the chart-as-block row) · `qa/overflow.mjs 1` green (`blocks 32 · full 19 / half 4 / third 9`) + `--selftest` green · `build-audio --check` clean · screenshot reviewed (PT legend: underline, blue wash, chips, two lines).
- Next task: lesson 10 from `designs/lesson10.design.md`.
