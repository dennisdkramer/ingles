# BUSINESS · batch record — the ledger, not a plan

One line per lesson, appended in two phases. It is the only memory: pass 1 of the next lesson reads the last rows, and `npm run batchcheck` reads all of them and the pages.

**Pass 1 writes** the sections: `S<number>-<subject>[@<device>]:<block subjects>`, and the quiz as `Q:<block subjects>`.
**Pass 2 appends** what it built: `el:<element>[:count]`, `qel:<element>[:count]`, `reg:<sections in voice>/<sections>`.

```
```
A fenced block is an example and is never read: each lesson's row is written **below** this line, outside any fence, because `npm run batchcheck` skips every line inside one.



- **subject** — what the block or section is *about*: `rul` form · `rsn` reasoning · `ex` worked example · `con` contrast · `exc` exception · `voc` words as a set · `mng` what one means · `prn` how it sounds · `tim` where it sits in time · `soc` when it is said · `rcp` earlier material.
- **device** — the element doing the teaching in that section, if any (`chart`, `timeline`, `pos`, `comic`, `map`, `key`…). Leave it off when the prose teaches.
- **element** — the id of the markup box you copied: `chunks` `stripgaps` `chartanswer` `dialoggap` `mc` `matching` `correction` `fill` `dictation` — and `translation` is the correction or the dictation asking for a translation, recorded as `translation` `flip` `map`. Count every unit that holds a control and is one of these forms — a bare keyed gap is a component, not a unit, not every kind once. The unit carries `data-activity="<the same id>"`; a game is a skin and records the element underneath it. A keyed gap is not an element: it is carried inside one of these forms, and a lone gap is a component beside other teaching, never an activity.

**Before writing a lesson**, read the previous rows and ask: which elements have not appeared in the last 3 (one is required); how many of the palette the last 5 lessons hold (60% required, from lesson 10); which of the palette the last 10 lack (none allowed, from lesson 10); which sections still need a device no recent section used. **There is no batch plan — the answers come from what already happened.**

**Before finishing a lesson**, run `npm run batchcheck` after appending the row.

---

L1 | S1-prn@chart:rsn>ex>voc | S2-rul@key:ex>exc | S3-prn:con>exc | S4-rsn:ex | S5-rul@chart:voc>mng>ex | S6-con:mng>voc | Q:prn>rul>con | el:mc:8,dictation:4,chartanswer:4,matching:5,fill:6,flip:8 | qel:mc:6,matching:4,dictation:3 | reg:7/8

L2 | S1-rul@pos:rul>ex>con | S2-rul@chart:rsn>voc>ex | S3-rul@timeline:rsn>ex>con | S4-voc@chart:voc>mng>ex | S5-voc:rsn>con>exc | S6-soc:voc>prn>mng>ex | S7-prn@player:soc>ex>mng | S8-rul:ex | Q:rul>voc>con>mng | el:chunks:1,fill:2,chartanswer:1,mc:2,dialoggap:1,translation:2,dictation:2,matching:1 | qel:mc:1,fill:1,matching:1,translation:1,dictation:1 | reg:9/10

L3 | S1-con@chart:rul>ex>con | S2-rul@pos:rsn>ex>mng | S3-rul:rul>voc>ex | S4-con@pair:con>voc>ex | S5-rul@chart:voc>con>exc | S6-mng:mng>con>ex | S7-voc:ex>exc | S8-rul:ex | Q:rul>con>voc | el:mc:2,fill:3,chartanswer:2,correction:1,stripgaps:1,translation:2,matching:1 | qel:mc:1,fill:1,chartanswer:1,matching:1,translation:1 | reg:9/10

L4 | S1-rul@timeline:rul>ex>con | S2-voc@key:voc>mng>prn | S3-rul@chart:rul>con>ex | S4-prn@key:rul>prn>ex | S5-rul:rul>con>exc | S6-soc@player:ex>mng>soc | S7-soc:ex>rul>ex | S8-soc@map:ex>con | S9-prn:ex | Q:rul>voc>con | el:fill:2,chartanswer:2,mc:2,dictation:2,dialoggap:1,map:1,translation:1,correction:1 | qel:mc:1,fill:1,chartanswer:1,correction:1,dictation:1,translation:1 | reg:10/11

L5 | S1-rsn@chart:rsn>ex>con | S2-voc@key:voc>prn>mng | S3-rul@timeline:rul>ex>rsn | S4-con@chart:con>exc>ex | S5-mng:mng>con>exc | S6-soc@dialog:soc>ex>mng | S7-voc@flip:voc>mng | S8-rul:ex | Q:rul>con>mng | el:chunks:1,fill:2,mc:2,correction:2,dialoggap:1,flip:1,translation:1,dictation:1 | qel:mc:1,fill:1,correction:1,chunks:1,translation:1,dictation:1 | reg:9/10

L6 | S1-rul@chart:rul>ex | S2-rsn@pos:mng>ex | S3-rul@gloss:rul>exc>ex | S4-con:con>ex>ex | S5-voc@chart:voc>mng | S6-mng@comic:ex>ex | S7-soc@dialog:soc>ex>ex | Q:rul>ex>con | el:fill:2,chartanswer:2,mc:1,correction:2,translation:2,chunks:1,dialoggap:2,dictation:1 | qel:mc:1,dialoggap:1,fill:1,translation:1,correction:1 | reg:9/9

L7 | S1-prn@key:prn>rul>ex | S2-rul@timeline:rul>ex>ex | S3-mng@dialog:mng>ex | S4-con@pair:con>ex | S5-voc@chart:voc>ex | S6-rul@flip:rul>mng | S7-soc@player:soc>ex>ex | Q:prn>rul>voc | el:dictation:2,fill:1,dialoggap:1,correction:2,matching:1,flip:1,chartanswer:1,mc:1,translation:1 | qel:mc:1,chartanswer:1,translation:1,correction:1 | reg:9/9

L8 | S1-rul@pos:rul>ex>ex | S2-rsn@chart:rul>ex | S3-exc@pair:con>ex | S4-mng@gloss:mng>ex | S5-soc@dialog:soc>ex>mng | S6-soc@map:soc>ex | Q:rul>exc>ex | el:correction:2,fill:2,mc:2,matching:2,dialoggap:1,map:1,translation:1 | qel:mc:1,fill:1,matching:1,correction:1,translation:1 | reg:8/8

L9 | S1-rul@timeline:rul>ex>mng | S2-rul@chart:rul>ex | S3-con@chart:con>ex | S4-soc@dialog:soc>ex | S5-mng@gloss:mng>ex | S6-exc@pair:exc>ex | S7-rcp:ex | Q:rul>ex>con | el:fill:2,chartanswer:1,dialoggap:1,mc:2,correction:2,stripgaps:1,dictation:1,translation:1 | qel:mc:1,fill:1,dictation:1,correction:1,translation:1 | reg:9/9

L10 | S1-rul@chart:rul>ex>ex | S2-rul@chart:rul>ex | S3-mng@gloss:mng>ex | S4-voc:voc>ex | S5-rsn:rsn>ex | S6-rcp:ex | Q:rul>voc>ex | el:fill:2,chartanswer:2,mc:2,translation:2,dictation:1,chunks:1,correction:1 | qel:mc:1,fill:1,chartanswer:1,translation:1,correction:1 | reg:8/8

L11 | S1-rul@chart:rul>ex | S2-rsn@gloss:rsn>ex | S3-rul@chart:con>rul | S4-voc@flip:voc>ex | S5-mng@gloss:mng>voc | S6-soc@dialog:soc | S7-exc@pos:exc>rul | S8-rcp:rcp>mng>ex | Q:con>rul>mng>voc>rul>con | el:chartanswer:3,fill:2,matching:2,correction:2,translation:2,flip:1,dialoggap:1,dictation:1,mc:1 | qel:mc:1,fill:1,chartanswer:1,matching:1,correction:1,translation:1 | reg:10/10

L12 | S1-rul@timeline:rul>ex | S2-rul@chart:rul>con | S3-voc@chart:voc>ex | S4-prn@key:prn>ex | S5-rul@pair:rul>ex | S6-soc@dialog:soc | S7-soc@map:soc | S8-rcp:rcp>ex>ex | Q:con>rul>ex>voc>rul>con | el:fill:2,mc:2,chartanswer:2,correction:2,translation:2,chunks:2,dictation:1,dialoggap:1,map:1 | qel:mc:1,fill:1,chunks:1,chartanswer:1,correction:1,translation:1 | reg:10/10

L13 | S1-mng@chart:mng>ex | S2-con@gloss:con>ex | S3-voc@chart:voc>mng | S4-rul:rul>con | S5-rcp:ex | S6-soc@dialog:soc | S7-mng:ex | Q:con>rul>voc>rul>ex>con | el:mc:2,fill:2,correction:2,translation:2,matching:1,stripgaps:1,dialoggap:1,chartanswer:1,dictation:1 | qel:mc:1,fill:1,chartanswer:1,correction:1,dictation:1,translation:1 | reg:9/9

L14 | S1-rul@timeline:rul>ex | S2-rul@chart:con>ex | S3-mng@gloss:mng>ex | S4-voc@flip:voc>ex | S5-rul:rul>con | S6-soc@dialog:soc | S7-mng:ex>ex | Q:mng>rul>con>voc>ex>mng | el:fill:2,chartanswer:2,mc:2,translation:2,flip:1,correction:1,dialoggap:1,chunks:1,matching:1,dictation:1 | qel:mc:1,fill:1,chartanswer:1,matching:1,dictation:1,translation:1 | reg:9/9

L15 | S1-rul@pos:rul>ex | S2-voc@chart:voc>mng | S3-rul@chart:con>ex | S4-exc@gloss:mng>ex | S5-soc@dialog:soc>ex | S6-rul:rul>con | S7-mng:ex>ex | Q:con>rul>mng>voc>ex>con | el:mc:2,matching:2,chartanswer:2,fill:2,translation:2,chunks:2,dialoggap:1,correction:1,dictation:1 | qel:mc:1,fill:1,chartanswer:1,matching:1,dictation:1,translation:1,chunks:1 | reg:9/9

L16 | S1-rsn@chart:rsn>ex | S2-con@chart:con>ex | S3-voc@gloss:voc>mng | S4-exc:exc>con | S5-soc@map:soc | S6-mng@dialog:mng>ex | S7-rcp:rcp>ex>ex | Q:con>rul>rul>mng>voc>con | el:mc:2,chartanswer:2,matching:2,fill:2,translation:2,map:1,dialoggap:1,chunks:1,correction:1 | qel:mc:1,fill:1,correction:1,chartanswer:1,matching:1,translation:1 | reg:9/9

L17 | S1-rul@chart:rul>ex | S2-con@chart:con>ex | S3-voc@gloss:voc>mng | S4-rul:rul>con | S5-rcp@stripgaps:rcp | S6-soc@dialog:soc>ex | S7-mng:mng>ex>ex | Q:con>rul>voc>mng>ex>con | el:fill:2,chartanswer:2,translation:2,matching:1,correction:1,stripgaps:1,dialoggap:1,chunks:1,mc:1,flip:1,dictation:1 | qel:mc:1,fill:1,chartanswer:1,flip:1,dictation:1,translation:1 | reg:9/9

L18 | S1-rul@chart:rul>ex | S2-mng@chart:mng>ex | S3-voc@gloss:voc>mng | S4-rul:rul>con | S5-soc@dialog:soc>ex | S6-rcp:rcp>ex>ex | Q:con>rul>voc>ex>ex>con | el:mc:2,chartanswer:2,translation:2,chunks:2,matching:1,correction:1,dialoggap:1,fill:1,dictation:1 | qel:mc:1,fill:1,chartanswer:1,chunks:1,dictation:1,translation:1 | reg:8/8

L19 | S1-rul@pos:rul>ex | S2-soc@chart:con>ex | S3-voc@chart:voc>mng | S4-tim:rul>con | S5-soc@dialog:soc>ex | S6-rcp:rcp>ex>ex | Q:con>rul>voc>mng>ex>con | el:mc:2,chartanswer:2,matching:2,translation:2,correction:1,dialoggap:1,chunks:1,fill:1,dictation:1 | qel:mc:1,fill:1,chartanswer:1,matching:1,dictation:1,translation:1 | reg:8/8

L20 | S1-rul@chart:rul>ex | S2-rul@chart:mng>ex | S3-voc@gloss:voc>mng | S4-exc:rul>con | S5-soc@map:soc | S6-soc@dialog:soc>ex | S7-rcp:rcp>ex>ex | Q:mng>rul>con>rul>voc>con | el:mc:2,chartanswer:2,matching:2,correction:2,translation:2,map:1,dialoggap:1,chunks:1,fill:1 | qel:mc:1,fill:1,chartanswer:1,correction:1,matching:1,translation:1 | reg:9/9



L21 | S1-rul@chart:rul>ex | S2-rul@pos:rul>ex | S3-voc@gloss:voc>mng | S4-mng@chart:mng>ex | S5-soc@dialog:soc>ex | S6-rcp:rcp>ex>ex | Q:con>rul>voc>mng>ex>con | el:fill:2,mc:2,flip:1,matching:1,dialoggap:1,translation:2,chunks:2 | qel:chunks:1,mc:1,fill:1,translation:1 | reg:8/8

L22 | S1-rul@chart:rul>ex | S2-voc@gloss:voc>mng | S3-rul@pos:rul>con | S4-mng@pair:mng>ex | S5-soc@dialog:soc>ex | S6-mng@audio:mng>ex | S7-rcp:rcp>ex>ex | Q:con>rul>mng>voc>ex>con | el:mc:3,fill:2,matching:1,dialoggap:1,flip:1,dictation:2,stripgaps:1,translation:2,correction:1 | qel:mc:1,fill:1,correction:1,dictation:1 | reg:9/9

L23 | S1-rul@chart:rul>ex | S2-voc:voc>mng | S3-exc@gloss:mng>ex | S4-mng@pair:mng>ex | S5-soc@dialog:soc>ex | S6-rcp:rcp>ex>ex | Q:con>rul>voc>ex>con | el:mc:2,fill:3,chartanswer:1,matching:2,correction:2,dialoggap:1,translation:1,chunks:1 | qel:mc:1,fill:1,correction:1,matching:1 | reg:8/8

L24 | S1-rul@pos:rul>ex | S2-mng@chart:mng>ex | S3-voc@gloss:voc>mng | S4-exc@pair:exc>con | S5-soc@dialog:soc>ex | S6-mng@audio:mng>ex | S7-rcp:rcp>ex>ex | Q:con>rul>voc>mng>ex>con | el:mc:2,fill:2,matching:2,correction:2,dialoggap:1,dictation:1,translation:2,map:1 | qel:mc:1,fill:1,matching:1,correction:1,translation:1 | reg:8/8

L25 | S1-exc:exc>ex | S2-rcp:rcp>ex | S3-rcp:rcp>ex | S4-exc:exc>ex | Q:con>rul>voc>mng>ex>con | el:mc:2,matching:1,correction:2,dialoggap:2,chartanswer:1,chunks:1,fill:1,translation:1,stripgaps:1,dictation:1,map:1 | qel:mc:1,chunks:1,map:1 | reg:5/5
