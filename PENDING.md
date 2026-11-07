# PENDING — active subtask batch plan (global RULE 0, item 6)

The live working plan for the CURRENT task. When a prompt decomposes into subtask batches (global RULE 0, item 6) they are written here, executed in order, and cleared here once done AND committed. Deferred / not-yet-started work does not live here — it stays in the backlog. Bugs/problems live in ISSUES.md. Handoffs live in HANDOFF.md.

_(Active batches, newest first. Cleared once done AND committed.)_

## 2026-11-06 (cont.) — retire the clip pipeline; qa/ out of git; rules file

1. ✅ Clip pipeline retired: `build-audio.mjs` deleted; `build:audio` / `audio:check` and the
   `kokoro-js` + `@breezystack/lamejs` devDependencies dropped from `package.json`; the `audio/`
   entries dropped from `.vscode/settings.json`. (`engine2.js`, `FUNCTION.md`, `PEDAGOGY-MAP.md`,
   `STATUS.md` landed earlier this session; `audio/` itself was deleted by the owner.)
2. ✅ `qa/` untracked — `.gitignore` gains `qa/`, then `git rm -r --cached qa/`: 14 tracked files
   leave the repo, the folder stays on disk and still runs `npm run qa`.
3. ✅ `.clinerules/TOOL-DISCIPLINE.md` rewritten (batching, bounded output, no scratch files).
4. ✅ Commit + push.
5. ⬜ NOT pushed, awaiting the owner's decision: the 132 unrelated tracked deletions in the working
   tree — `designs/` 100, `kids/` 22, `adult/` 6, `PASS-A.md`, and 3 `.clinerules/` workspace files.

## 2026-11-06 (cont.) — remaining items from qa/NOTES.md

1. `mineGrid` — the pit is GONE. Four saloon doors per item; the wrong door opens on a snake that
   bites (one life), the right door is entered, a glass clink plays and the street fades out before
   the next question fades in.
2. `bossRaid` — the student picks a fighter on the intro card (sword / wizard / archer); each fighter
   has its own attack (sword cut, fireball, arrow) that visibly lands on the boss; the boss answers
   back with one of two attacks (a bite that lunges, acid that flies) chosen in turn.
3. `ladderRun` preview item 6 — "if it rains, we stay / will stay" is two correct sentences; replace
   with one unambiguously wrong option.
4. `qa/NOTES.md` items already landed this session: skeetRange, catchBasket, stackDrop, wordleBoard,
   crosswordBoard numbers, echoPads, bingoCard, flapGate walls/gaps, whackMole bare stems.
5. qa/games4.mjs tests for the new behaviour, and `npm run qa`.

## 2026-11-06 — qa/notes.md feedback on the nine game entries in CONTENT_EXAMPLES.md

1. runner-level class fixes: a presentation that draws the item's stem itself suppresses the HUD copy
   of the same stem (deleting the duplicate, not mandating one); `data-retry` lever; `timeScale`.
2. `skeetRange` — targets and deadline 30% slower, one shared arc, wider lane spread.
3. `catchBasket` — grow a flower per correct answer, water splash over the pot.
4. `stackDrop` — real vertical stack, question block at the bottom, drag the answer on top, ladder
   segments up the side, climber, treasure at the top.
5. `flapGate` — gaps in scrolling walls, drawn flapping bird, bird +30px right, auto-flap, half gravity.
6. `wordleBoard` — one row fewer, no layout shift, clue left / error message right, both centred.
7. `mineGrid` — four authored answers, hit/miss marking fixed, new signpost visuals.
8. `crosswordBoard` — grid fills the height with a 10px margin, clue moved to the side, duplicate clue gone.
9. `echoPads` — whole-sentence activity: first word given, next word plus three near misses, countdown
   score, wrong pick costs a point and can be retried.
10. `bingoCard` — one instruction (header, not a button), audio button recoloured, curtain over the card,
   one play, 3s countdown, curtain opens, no replay, no answer shown.
11. `whackMole` — the stem is the thing to find, written bare (contract text; the preview already complies).
12. `ladderRun` — one unambiguous answer per item (the preview's "if it rains…" item is fixed).
13. `bossRaid` — better sprite and animation, a character the student picks, and a boss that answers back.
14. preview content for the changed games, qa/games4.mjs, `npm run qa`.


