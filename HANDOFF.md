# HANDOFF — context handoffs between sessions
A running note for handing context from one session/task to the next: where the work stands, what is in flight, and what to pick up next. Write here when a session ends mid-work, or when the next session needs context that is not obvious from the files themselves.

_(Cleared 2026-11-04 at the owner's request — nothing is in flight.)_

## 2026-11-04 — docs re-balanced + adult 1-3 rebuilt

**Docs.** New **`IMPLEMENTATION.md`** = the build manual (what each class/knob does, the mechanics the author gets
for free, the answer-keying rules, the QA enforcement map, the hard limits, and a dated owner-spec ledger). It
now owns the prose that used to live inside `style.css` (129 comment lines → 30 one-line pointers that name the
section of IMPLEMENTATION.md), and the implementation detail that had grown inside FORMAT.md rule 4 (tiling,
odd-last-item, `.wide`, `.cols` retirement, `glossdrop`) is stated there as a *requirement* with a pointer, not
as a class inventory. FORMAT.md's §1(d) now names IMPLEMENTATION.md; FILESYSTEM/STATUS/PARKED were updated.
**Nothing about appearance changed**: `style.css` declarations were verified byte-identical after the comment
migration (237 code lines, 0 diffs).

**Adult track, lessons 1-3** (Pass A + Pass B, rebuilt on the tiled layout): `designs/adult/lesson01-03.design.md`
+ `adult/lesson1-3.html` and their `.edit.html` twins. Content per PEDAGOGY-MAP's adult persona: subject law /
`be` / `a-an` by sound / `it` + the **swear-strength ladder** (L1); cognate suffixes, the formal-vs-said word,
five false friends, the -tion/-sion/-ity/-ic stress rule, /ɪ/-/iː/ and /ʌ/-/æ/ (L2); wh- questions with `be`, the
embedded polite question, repair chunks, /w/ vs /h/, and the ladder applied inside a question (L3). Lessons 2-3
recycle lesson 1 rather than re-teach it. `COUNTS.adult=3`, `lessons.json` rebuilt.

**Verified.** `node qa/content.mjs --track=adult 1 2 3` ✅ (no anchor hints left — duplicate stems/prompts fixed),
`node qa/width.mjs --track=adult 1 2 3` ✅, `node qa/overflow.mjs --track=adult 1 2 3` ✅ in real Chrome (three
CELL findings were found and fixed in markup: plain `.blanks` cells were too narrow for glossed words → the
blocks became `.blanks sent`; `.blanks.wide` does not exist and now says so in IMPLEMENTATION §3.3),
`node qa/smoke.mjs --track=adult 1 2 3` ✅.

**Open:** (a) **ROWWRAP ruling still owed by the owner** (PARKED, unchanged) — adult pages are ROWWRAP-clean but
the rule itself is still undecided; (b) **adult audio not rendered** (`node build-audio.mjs --dir adult`); (c)
lessons 4+ of the adult track; (d) `COUNTS.adult` must be raised with every batch; (e) the working tree also
carries the owner's earlier uncommitted work (engine2 B-I12 fix, QA traps, docs) — it was committed together with
this batch, so the audio/ROWWRAP items are the only follow-ups left from it.

