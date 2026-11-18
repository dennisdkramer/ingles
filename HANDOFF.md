# HANDOFF — context handoffs between sessions
Write here when a session ends mid-work, or when a task handoff is requested. If a handoff is requested while  '## 2. Active Handoff' contains text, append the new handoff and inform the user of the prior contents.

## 1 Last change tag
_(Cleared 2026-11-04 at the owner's request.)_

## 2 Active Handoff

### A. Parked — printing a pronunciation key at build time
- The choice: export `load` from `pronkey.js` (one inert property, no new dependency) or drive the engine with jsdom (no engine change, a new authoring dependency). Recommendation was the export.
- Why it is not a one-liner: the dictionary is per word (28,075 entries, none containing a space), `words()` drops tokens under two characters, and `engine1.js:420-423` shows one key per selection — a phrase needs the tool to tokenise and the page to place the keys under their words.

### B. Settled this session — so it is not re-opened
- A block's look is declared on the block (`data-look`), never derived from `data-kind`; a block's hue is the track's hue.
- A block's width is measured, never chosen: `qa/span.mjs` writes `data-span` (quarter · third · half · twothird · full); the sheet carries the quarter floor, the five spans, and an old-page fallback.
- A heading never sizes its block; the rose rule runs the block's width with a 15px fade at each end.
- `data-kind`'s hue rules are quarantined in `@layer legacy`, which is the weakest layer, so they no longer paint; the built pages will be regenerated.
- No mechanism enters a `## ` header until a build actually uses it, and then with the four fields: when to use, markup required, look, what toggles it.

### C. Open — nothing here is decided
- A dark token set (`light-dark()`) versus the `dark` look alone, which covers the one case that needs it.
- `container-type` on blocks: nothing adapts to a slot yet; revisit when a vehicle asks for it.
- `subgrid`, already used in one place, for aligning a chart's rows with the prose beside it.
- Whether `qa/span.mjs` should be run over the built pages now, or only over pages written under the new system.
