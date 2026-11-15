# HANDOFF — context handoffs between sessions
Write here when a session ends mid-work, or when a task handoff is requested. If a handoff is requested while  '## 2. Active Handoff' contains text, append the new handoff and inform the user of the prior contents.

## 1 Last change tag
_(Cleared 2026-11-04 at the owner's request.)_

## 2 Active Handoff 



### B. Open thread — let lesson generation print a pronunciation key - IGNORE - PARKED FOR NOW

**Facts.** `pronkey.js:80-85` exports `words`, `lookup`, `render`, `ready`. `load(obj)` exists at `pronkey.js:59` and is not exported. `render()` (`pronkey.js:34`) splits a key on `-` (syllables joined with `·`), wraps letters in `<b>` and elided letters in `<span class="pr-g">`, and returns the display HTML. `dictionary.json` holds 28,075 entries; **0** contain a space. The page's own lookup (`engine1.js:420-423`) takes a multi-word selection, loops its words, and uses the **first** word that has a key.

**Two ways to let a build print a key:**
1. Add `load: load` to the export list (`pronkey.js:80`), then a tool reads `dictionary.json`, evaluates `pronkey.js` against a `{window:{}}` stub and calls `PronKey.load(dict)`. Synchronous, no new dependency, one added property that pages never call.
2. Leave the engine untouched and drive it with jsdom plus a `fetch` stub. New authoring-time dependency and an async wait before the first lookup.

Recommendation: 1. Implication of 1: the shipped engine carries one more exported function, inert unless called. Implication of 2: nothing in the shipped engine changes, and the build path gains jsdom.

**Phrases — the cost.** Printing one key per word is a loop in the tool, not an engine change. Three limits stand in the way of a phrase display: the dictionary is per word (28,075 entries, none with a space); `words()` (`pronkey.js:14`) drops tokens under two characters once edge apostrophes are stripped, so `a` and `I` disappear and a phrase cannot sit 1:1 under its words; and `engine1.js:420-423` shows one key for a whole selection. A phrase therefore needs the tool to tokenise the text itself and record which tokens carry a key — layout work in the page, not engine work.

### C. CSS re-imagining — base layer first, vehicles on top (requested 2026-11-14)

**Why.** The lesson-facing half of `style.css` (lines 1-423) contains 1 gradient, 3 `@keyframes`, 4 transitions, and no `:checked`, `:has()`, `clamp()` or `color-mix()`. The landing + game half (424-1346) contains 42 gradients, 55 keyframes, 56 transitions and 312 `var(--)` uses. Every lesson block renders through one frame with one shadow (`style.css:247`) and one edge colour per kind (`:249-253`), so blocks read alike, and every vehicle carries its own CSS because the base does no visual work.

**Step 1 — role tokens.** `--surface`, `--surface-2`, `--ink`, `--ink-soft`, `--line`, `--kind-teach`, `--kind-train`, `--kind-show`, `--kind-game`, `--ok`, `--err`, `--r1`, `--r2`, `--shadow-1`, `--shadow-2`, `--step`. The 13 flat tokens at `style.css:44` stay as aliases for one release. Each kind derives tint, edge and ink with `color-mix()`.

**Step 2 — one block component.** `.panel` / `.card` remain (one container, two class names, `style.css:247`); `data-kind` keeps setting `--edge`; a new `data-look="paper|tint|outline|grain|ruled|grid|tape"` gives identity in 3-8 lines each, with no markup change and no per-vehicle CSS.

**Step 3 — generated structure.** CSS counters draw `h2` as `1.` and `h3` as `A.` in a badge tinted by the kind; no page types its own number, so reordering or inserting a section costs nothing.

**Step 4 — state without JS.** `input.gap:not(:placeholder-shown)` fills its underline; `.qitem:has(input:checked)` tints the row; `label:has(input:checked)` fills the option; `.panel:has(input:checked)` shows a completion dot; `.correct` / `.ans` inherit `--ok`.

**Step 5 — default visual set.** Layered paper background (dot grid + warm wash); a 3px kind-coloured top rule on every block; `h2` hairline with a number chip; zebra rows and a styled `caption` for `table.chart`; speech tails for `.dialog` via `::before`; pill `.chips` with hover; a gap field that fills on focus; one 120ms block entrance under the existing reduced-motion branch; the print path (`#printRoot` hidden at `style.css:165`, print rules `:311-325`) checked for each new look.

**Step 6 — containers and guards.** `container-type:inline-size` on every block, so a vehicle adapts to its `.itemsize` slot; `@supports` guards for `color-mix()` and `:has()` with the flat token as fallback. The fixed 1400/1200 page (`style.css:17-28`, `:304`) is unchanged — the block is the container, not the viewport.

**Batch order.** 1 tokens + base elements · 2 block frame + looks + counters · 3 answers and states · 4 vehicle hooks (`chart`, `dialog`, `chips`, `listen`, `.vz-play`, `.game`) shrink to their geometry · 5 headers rewritten last: ten ids, four fields each (when to use, markup required, look, what toggles), and no inventories.

**Open choices.** (i) the token names; (ii) generated `h2`/`h3` numbering or typed numbers; (iii) the four kind colours; (iv) a dark variant or paper only.

### D. Modern CSS research — what is worth taking (2026-11-14)

Sources: `https://allahabadi.dev/blogs/css/20-modern-css-features/` (20-feature inventory with support levels), `https://moderncss.dev/` (technique series), `https://www.joshwcomeau.com/css/subgrid/` (subgrid mechanics and gotchas). Support statements below are the sources' own, as recorded today.

**(a) Making the site come alive / look good**

1. `@property` — typed custom properties with `initial-value`. Two gains: colours and numbers become transitionable, and a missing token can no longer make a declaration invalid at computed-value time. That failure is exactly what the comment at `style.css:17-28` guards against: a `var()` that fails inside `grid-template-columns` computes to `none`, i.e. one column. A typed `--edge` with an initial value removes the class of bug rather than documenting it. Source: moderncss.dev, "Providing Type Definitions for CSS with @property".
2. `color-mix()` and relative colour (`oklch(from var(--c) …)`) — derive hover, tint, edge and disabled states from one kind colour, instead of keeping 13 flat hex values. One kind colour paints edge, badge, tint and state.
3. `dialog` + `::backdrop` + `backdrop-filter` — the site's confirm (`FUNCTION.md:85`, `eodConfirm`, duplicated byte-identically in `engine1.js` and `index.html`) can be a native `<dialog>`: `showModal()` supplies focus containment, Escape and top-layer stacking that the current code hand-rolls, and `::backdrop` gives the frosted background.
4. `@starting-style` + `transition-behavior:allow-discrete` — animate an element in from `display:none`. The note/recording popup and the toasts currently appear with no transition.
5. `text-wrap: balance` on `h1`/`h2`/`h3`, `text-wrap: pretty` on prose — balanced headlines and no orphan line. One declaration each (moderncss.dev, "12 Modern CSS One-Line Upgrades").
6. Container query units (`cqi`) — type that scales to the block's slot (third / half / full) rather than the viewport, which keeps the fixed page intact.
7. `position: sticky` + `scroll-behavior: smooth` — a sticky section label or control bar; `scroll-snap` for a horizontally scrolling word bank.
8. Shapes with no assets — layered gradients, `clip-path`, and stacked `box-shadow`/`border-radius` (moderncss.dev, "Pure CSS Shapes 3 Ways" and "Expanded Use of box-shadow and border-radius"). The game CSS already uses 42 gradients, so the capability is proven in this repo: paper grain, tape, torn edges, rounded panels.
9. Cross-document view transitions (`@view-transition { navigation: auto }`) — lesson-to-lesson movement on GitHub Pages with no JS. Not in the three sources; verify in the target browsers first.

**(b) Formatting and displaying the content better**

1. **Subgrid** — the highest-value item here. Extending the parent grid downward lets rows of sibling blocks align: a chart's rows line up with the prose beside it, two blocks in one `.itemrow` share option rows, `.qitem` columns align across a row. Parent defines the tracks; the child sets `display:grid; grid-template-rows:subgrid; grid-row:span N`. Gotchas recorded from the source: rows must be reserved explicitly or the content collapses into one row; line numbers reset to 1 inside the subgrid; `auto-fill` / `auto-fit` cannot be combined with subgrid; empty reserved rows cost 0px but `gap` still counts them, so the `span 99` workaround adds space. Fallback: `@supports not (grid-template-columns: subgrid)`.
2. Multi-column prose (`columns` + `break-inside:avoid`) for word sets and definitions, with `::marker` and counters for custom list markers (moderncss.dev, "Totally Custom List Styles").
3. `display: contents` — a wrapper that must exist for semantics (a `figure`, a `ul`, a `.qitem`) stops blocking the parent grid; the children become grid items.
4. `aspect-ratio` + `object-fit` — media tiles sized without fixed heights (0 uses today).
5. `font-variant-numeric: tabular-nums` — number columns, counts, and the game HUD pairs.
6. `field-sizing: content` — the production textarea grows as the student writes, bounded by `min-height` / `max-height`, no JS. Chrome-only at source time, so an enhancement.
7. `:placeholder-shown` / `:user-valid` — per-field state display with no extra classes.
8. `text-box-trim` and `hanging-punctuation` — optical alignment of headings and opening quotes; support is partial, so progressive.

**(c) Easier to work with / less explicit specification**

1. `:has()` — state read from existing markup: an answered block, a filled textarea, a chosen option, an empty row, a block whose child is focused. That removes classes a build would otherwise have to write, and removes JS from the engine for the same effect.
2. `@property` `initial-value` — see (a)1. It removes the "a failed `var()` collapses the layout" class of bug at the mechanism level.
3. `@layer` — a fixed cascade order (`reset, base, components, engine`). A vehicle or an engine overrides without matching specificity, and `!important` stops being the tool that settles disagreements.
4. `@scope (.panel) to (.itemrow)` — a vehicle's rules apply inside its own block and stop there, so no unique class prefix per vehicle (experimental per the source).
5. Container style queries — `data-look` sets `--look`; CSS answers `@container style(--look: compact)`. A vehicle adapts to a named variant instead of a class (experimental).
6. `attr()` for short labels plus counters — a badge or a note drawn from `data-*`; arbitrary-string `attr()` is level 5 and partial, so keep it to short labels and numbers.
7. Native `popover` + `popovertarget` — light-dismiss popovers for glossary and hint chips with no JS, in the top layer so they escape a block's overflow.
8. `accent-color` and `appearance:none` radio styling — the site's radios are UA-default today; one property colours them, and moderncss.dev has the full cross-browser radio pattern with `:checked` states.
9. `interpolate-size: allow-keywords` — animate to `auto` height: a `<details>` reveal or an expanding block, with no measured heights.
10. `@supports` — the site has no build step, so every new feature ships behind a query with today's look as the fallback.
11. `color-scheme` + `light-dark()` — one token set, two schemes; a reading page at night without duplicating rules.

**Support facts that travel with the plan (source-stated).** Production ready: `@layer`, `:has()`, nesting, container size queries, logical properties, `::backdrop`, `color-mix()`. Progressive enhancement: `text-wrap`, `@property`, subgrid, `@starting-style`. Experimental: `anchor()`, `field-sizing`, `@scope`, container style queries. Subgrid is supported in all major browsers since 2023 but still under 90% of global use, which is why the `@supports not` fallback is part of its plan.

**Deliberately not taken.** Anchor positioning (`anchor()`) — Chrome-only at source time, and the engine's popup is positioned against a text range, which an anchor cannot name. `calc-size()` / `interpolate-size` — only for auto-height animation, and `interpolate-size` already covers that. Logical properties — the site is left-to-right only, so no gain beyond consistency. Two-value `display` — readability only. `shape-outside` — no current art to wrap text around.

**Relationship to the headers.** None of the above belongs in a `## ` header until it is the mechanism a build actually uses. When batch 2 lands, the header index grows by one id per new mechanism (`LOOKS`, `STATE`, `COUNT`), each stating when to use it, the markup it needs, the look it produces, and what toggles it — the four fields agreed in the 2026-11-14 review, with no inventories of content.



