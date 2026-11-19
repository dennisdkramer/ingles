# HANDOFF - context handoffs between sessions

Write here when a session ends mid-work, or when a task handoff is requested.

---

## 2026-11-19 — generate one lesson, with one section built on a fetched recording

**The task.** Run a lesson generation exactly as `PEDAGOGY-MAP.md` describes, drawing every shape from
`capability-map.html`, and give the lesson **one section built on a real recording** whose lyric is relevant
to what that lesson teaches. The two contract files carry the rules; this note carries the task and the
defects the last session produced, so they are not repeated.

### What "relevant" means for the music section

- The song is chosen **by the lesson's structure, not by taste**. The line must contain the target form or
  the target vocabulary in a way you can point at on the page. A line that merely paraphrases it is not a
  candidate, and a song whose only virtue is being well known is not either.
- The section runs the lesson's own sequence on that line: the student predicts what they will hear, listens,
  the line is marked and read, the rule is stated as it appears **in this line**, then the student produces
  the same structure again from different words. The recording is evidence, never decoration — if removing it
  would cost the student nothing, there is no section.
- One music section per lesson. It is a section with a teaching point and a heading that names it, like every
  other section.

### Cutting the clip — `qa/AUDIO.md` is the procedure; these are the parts that bite

- LRCLIB cannot search lyric text. Find the phrase by web search, then prove it with
  `node qa/audio.mjs --search="<artist> <song>" --finds="<the line's own words>"` — which also prints the
  line number. Never pass a line number you have not seen proved.
- Run once **without `--out`** to see which upload it paired (it checks duration within 2 s), then repeat with
  `--lrc-id=<id>` **pinned**: the site's results move between calls, and an unpinned run can pair a different
  edit of the same song.
- The tool writes `assets/<name>.mp3` itself and prints the block markup, the `data-t` values, `data-duration`
  and the provenance row. Paste what it prints. **Never type or adjust a `data-t` by hand** — if the highlight
  is off, `--cue-shift`; if the excerpt sits wrong, `--early`.
- On a lesson page (one folder below the root) the file is `../assets/<name>.mp3`.
- Append the printed provenance row to `assets/README.md`.
- The player script is already in `_shell.html` (`../player.js`, declared by the CSS header). Nothing else is
  added to the page for audio.

### Defects this week's lesson produced — none may recur

1. **Examples at the band, or the lesson fails.** Explanation prose may be plain and does not have to be
   advanced; every quoted line, example, gap answer, drill and quiz item must be at the lesson's level. A
   page that explains reported speech elegantly around "I'm tired." is a beginner page in advanced prose
   (`capability-map.html` §1A, `PEDAGOGY-MAP.md` [LEVEL]).
2. **The register is one voice for the student and the teacher.** The teacher does not explain a lively text
   in neutral course English; headings, instructions, corrections and jokes are the persona too. Register and
   level outrank every other input in the content pass (`capability-map.html` §1A).
3. **The voice never buys obscurity.** One section, one teaching point, and the heading names it. If two
   headings could be swapped without the page changing, the lesson is a tour of the concept's uses instead of
   a sequence (`capability-map.html` §1A/§1B, `PEDAGOGY-MAP.md` [PASSES] 1a and the headings check).
4. **No British vocabulary in a US track.** The register checker flags it: "mum", "pitch", "changing room",
   "queue", "holiday" belong to the locale list and read as mistakes.
5. **Flash cards own their width.** `.flip`'s two faces are out of flow, so the card has nothing to measure
   itself from: each label carries `flex:0 0 auto;width:min(100%,18rem)`, and a group is a wrapping, centred
   flex row — never `.rows`, never a bare wrapper `div` (`capability-map.html` §4 `#flip`).
6. **Width starts at the minimum and is earned** — 4, or 3 for a one-line block; widen only for the block's own
   content or an empty rest-of-row (`capability-map.html` §1B).
7. **Lesson pages are only reachable through the gate.** Typing or sharing a lesson URL lands on sign-in by
   design (`engine1.js` verifies `sessionStorage.gate`); open pages from the index, never test by URL.

### Finish

`npm run build:lessons`, then `node qa/check.mjs --track=<track> <n>` (it prints roadmap coverage, register
tiers and any locale tell), then `node qa/cmcheck.mjs` if `capability-map.html` changed, then commit and push.

