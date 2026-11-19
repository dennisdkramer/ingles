# ADVANCED-AAVE · batch record — the ledger, not a plan

One line per lesson, appended in two phases. It is the only memory: pass 1 of the next lesson reads the last rows, and `npm run batchcheck` reads all of them and the pages.

**Pass 1 writes** the sections: `S<number>-<subject>[@<device>]:<block subjects>`, and the quiz as `Q:<block subjects>`.
**Pass 2 appends** what it built: `el:<element>[:count]`, `qel:<element>[:count]`, `reg:<sections in voice>/<sections>`.

```
L07 | S1-rul@chart:rsn>ex>con>rul | S2-voc:mng>voc>mng | Q:rul>mng>rul>ex | el:gap:3,mc:1 | qel:mc:1,flip:1 | reg:3/5
```

- **subject** — what the block or section is *about*: `rul` form · `rsn` reasoning · `ex` worked example · `con` contrast · `exc` exception · `voc` words as a set · `mng` what one means · `prn` how it sounds · `tim` where it sits in time · `soc` when it is said · `rcp` earlier material.
- **device** — the element doing the teaching in that section, if any (`chart`, `timeline`, `pos`, `comic`, `map`, `key`…). Leave it off when the prose teaches.
- **element** — `gap` `mc` `chunks` `stripgaps` `chartanswer` `matching` `correction` `translation` `dictation` `flip` `game`. Count every activity block, not every kind once.

**Before writing a lesson**, read the previous rows and ask: which elements have not appeared in the last 3 (one is required); how many of the eleven the last 5 lessons hold (7 required, from lesson 10); which two the last 10 lack (none allowed, from lesson 10); which sections still need a device no recent section used. **There is no batch plan — the answers come from what already happened.**

**Before finishing a lesson**, run `npm run batchcheck` after appending the row.

---
