# GRAMATICA-REDACAO · batch record — the ledger, not a plan

One line per lesson, appended in three phases. It is the only memory: pass 1 of the next lesson reads the last rows, and `npm run batchcheck` reads all of them and the pages.

**Pass 1 writes** the sections (one or more) as it writes the lesson, and the quiz: `S<number>-<subject>[@<device>]` for each section in page order, and `Q:<block subjects>`. The number is the row's own and is never printed on the page.
**Pass 2 fills in** each section's block subjects — `S<number>-<subject>[@<device>]:<block subjects>` — appends the elements it built: `el:<element>[:count]`, `qel:<element>[:count]`, and corrects the section list to the page it built: a section it split, merged, renamed, added or dropped is rewritten in the row before the row is finished. The row records the page, not the plan.
**Verify appends** the register score, judged on the built page, section by section: `reg:<sections in voice>/<sections>`. The denominator is the page's section count.

```
L07 | S1-rul@chart:rsn>ex>con>rul | S2-voc:mng>voc>mng | Q:rul>mng>rul>ex | el:dialoggap:3,mc:1 | qel:mc:1,flip:1 | reg:3/5
```

- **subject** — what the block or section is *about*: `rul` form · `rsn` reasoning · `ex` worked example · `con` contrast · `exc` exception · `voc` the words as a set, only when the set itself is the subject · `mng` what one means · `prn` how it sounds · `tim` where it sits in time · `soc` when it is said · `rcp` earlier material.
- **device** — the element doing the teaching in that section, if any (`chart`, `timeline`, `pos`, `comic`, `map`, `key`…). Leave it off when the prose teaches.
- **element** — the id of the markup box you copied: `chunks` `stripgaps` `chartanswer` `dialoggap` `mc` `matching` `correction` `fill` `dictation` — and `translation` is the correction or the dictation asking for a translation, recorded as `translation` `flip` `map`. Count every unit that holds a control and is one of these forms — a bare keyed gap is a component, not a unit, not every kind once. The unit carries `data-activity="<the same id>"`; a game is a skin and records the element underneath it. A keyed gap is not an element: it is carried inside one of these forms, and a lone gap is a component beside other teaching, never an activity.

**Before writing a lesson**, read the previous rows and ask: which elements have not appeared in the last 3 (one is required); how many of the palette the last 5 lessons hold (60% required, from lesson 10); which of the palette the last 10 lack (none allowed, from lesson 10); which sections still need a device no recent section used. **There is no batch plan — the answers come from what already happened.**

**Before finishing a lesson**, run `npm run batchcheck` after appending the row.

---
