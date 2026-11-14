# AUDIO — fetch, cut and time a recording

`node qa/audio.mjs …` writes `assets/<name>.mp3` itself, then prints the block's markup and a provenance
row for `assets/README.md`. Nothing is copied or renamed by hand.

## Routes

Sheet route — a timed lyric sheet exists (LRCLIB):

```
node qa/audio.mjs --search="<artist> <song>" --out=<name> --lines=<first>,<count>
```

Run it once **without `--out`**: it prints the record and the upload it paired and writes nothing. Then
repeat with `--lrc-id=<id>` **pinned**, because the site's results move between calls and an unpinned run
can pair a different edit of the same song. `--lines=<first>,<count>` is the first timed lyric line of that
sheet and how many lines to show.

Wikimedia route — the file is on Commons:

```
node qa/audio.mjs --file="File:<name>.ogg" --out=<name> --lyrics="line|line"
```

`--times=a,b,c` takes the line times from the file's own timed transcript instead of from its silences;
`--from=<s>` starts after a spoken intro.

Local route — the audio is already on disk:

```
node qa/audio.mjs --in=<path> --out=<name> --lrc-id=<id> --lines=<first>,<count>
```

## Flags and defaults

| flag | default | what it does |
|---|---|---|
| `--lead=<s>` | 2 | seconds of audio before the first placed line; line 1 always lights `--lead` seconds in |
| `--early=<s>` | 1 | places every sheet line that many seconds before its cue; **negative places them later** (`--early=-2`); clamped ±10 |
| `--tail=<s>` | 2 | the clip ends this far past the sheet's next cue, not 0.05 s before it |
| `--fade=<s>` | 0.5 | fade at each end, done by one ffmpeg re-encode; `--fade=0` keeps the pure frame copy |
| `--width=full` | off | prints the full-width shape |

## The steps, in order

1. the lines asked for are taken from the sheet (or the pinned record), with the cue after them, which ends
   the clip `--tail` seconds past that cue;
2. the site is searched for candidate audio **with durations**; a record pairs only with an upload whose
   length agrees within 2 s — LRCLIB's own tolerance, and the one check that catches a different mix;
3. the paired audio is downloaded and converted to mp3 by the ffmpeg `npm install` provides;
4. the clip opens `--lead` seconds before the first **placed** cue;
5. every cue is placed `--early` seconds before the sheet puts it (negative = after), because a cue is
   tapped on the stressed vowel and the line begins on the consonant before it; `data-t` is that placement
   minus the clip start, so it does not move with the sign;
6. the frames are copied without re-encoding and the cut's `Xing`/`Info` frame is rewritten — frame count,
   byte count, 100-entry seek table;
7. the clip is re-encoded once with a `--fade` fade at each end, because a copied MPEG frame cannot carry a
   changed amplitude, so the shipped file is a second generation;
8. the shipped file is decoded and its length is `data-duration`;
9. every `data-t` is proved to land on sound — 0.5 s after it (`t+0.1`–`t+0.6`) against 0.25 s before
   (`t−0.35`–`t−0.1`), at least 0.006; a line that lands in a hole stops the run. The "NO SINGING"
   voice-gate warning does not stop a sheet-timed run, because the sheet is direct evidence of the words;
10. it prints the panel, the figure with its lyric list, and the provenance row.

## When the sync is off

`--early` is the only control, and it is a constant per song. "The lines fire N seconds early" means the
highlight must move **later**: subtract N from the current `--early` (1 → -2 for three seconds). "N
seconds late" means add N. A recut overwrites `assets/<name>.mp3` and reprints the markup, and `data-t` is
unchanged by `--early` — only the clip's head moves.

Editing the page's `data-t` values instead touches no audio and is legitimate for a one-off. Record the
shift in the provenance row: a rebuild prints the tool's own numbers, not the hand edit.

## What ships

`data-duration` is the decoded length of the file that shipped, the provenance row goes to
`assets/README.md`, and the page must load the player script named in `## AUDIO PLAYER` in `style.css`.
