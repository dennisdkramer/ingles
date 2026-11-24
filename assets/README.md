# assets — vendored media

Nothing here is fetched at run time: a page that shows one of these files works offline and on a USB stick. `../assets/…` is the path from a lesson folder, the same depth convention as `../logo.png`.

**A recording is added with the tool, never by hand.** `node qa/audio.mjs` fetches, cuts, times and writes the file, and prints the player figure with its `data-t` values and the provenance row. Run it twice — once to see which upload it paired, then again with `--lrc-id` pinned — because the site's results move between calls. No `data-t` is ever edited by eye: a highlight that fires early or late is moved with `--cue-shift`, an excerpt sitting wrong inside the recording with `--early`, and either flag leaves the command that reproduces the file. The tool's figure is pasted onto the page unchanged.

**Licence.** A file goes in only when its licence is known and stated below, and public domain is preferred for anything the page annotates — a marked-up derivative of a share-alike work inherits share-alike. The credit belongs on the page too (`<p class="vz-cite">`), because a printed page travels without this file.

**Provenance.** The row the tool prints is pasted under this heading in the same commit as the file. Nothing else is recorded here — not the page the file sits on, not what the page teaches with it.

| File | What it is | Source | Author | Licence |
|---|---|---|---|---|
| `believer.mp3` | lines 6–9 of that sheet's 31, 27.26 s, 655533 bytes — **cut from 24.26 s to 51.56 s**, re-encoded once with a 0.5 s fade at each end, every line placed 1 s before its sheet time | https://www.youtube.com/watch?v=5tpxXDILZHs | The Monkees | **not stated** |
| `works-hard.mp3` | lines 1–4 of that sheet's 64, 18.76 s, 451629 bytes — **cut from 21.77 s to 40.57 s**, re-encoded once with a 0.5 s fade at each end, every line placed 1 s before its sheet time | https://www.youtube.com/watch?v=3STBh9adlNk | Donna Summer | **not stated** |
| `iwannahold.mp3` | lines 4–5 of that sheet's 35, 11.90 s, 286893 bytes — **cut from 15.72 s to 27.67 s**, re-encoded once with a 0.5 s fade at each end, every line placed 1 s before its sheet time | https://www.youtube.com/watch?v=v1HDt1tknTc | The Beatles | **not stated** |
| `thatway.mp3` | lines 5–9 of that sheet's 53, 28.59 s, 687789 bytes — **cut from 21.70 s to 50.34 s**, re-encoded once with a 0.5 s fade at each end, every line placed 1 s before its sheet time | https://www.youtube.com/watch?v=4fndeDfaWCg | Backstreet Boys | **not stated** |
| `wheregoing.mp3` | lines 1–4 of that sheet's 26, 20.65 s, 497133 bytes — **cut from 11.57 s to 32.27 s**, re-encoded once with a 0.5 s fade at each end, every line placed 1 s before its sheet time | https://www.youtube.com/watch?v=07Uddzq_H9Q | Diana Ross | **not stated** |

| `business-l36-someone-like-you.mp3` | lines 1–4 of that sheet's 43, 33.62 s, 808173 bytes — **cut from 11.16 s to 44.81 s**, re-encoded once with a 0.5 s fade at each end, every line placed 1 s before its sheet time | https://www.youtube.com/watch?v=hLQl3WQQoQ0 | Adele | **not stated** |

| `country-roads.mp3` | lines 5–8 of that sheet's 30, 29.71 s, 714285 bytes — **cut from 26.83 s to 56.57 s**, re-encoded once with a 0.5 s fade at each end, every line placed 1 s before its sheet time | LRCLIB record 38428903 ("John Denver - Take Me Home, Country Roads") | John Denver | **not stated** |

| `penny-lane.mp3` | lines 5–8 of that sheet's 32, 22.13 s, 532845 bytes — **cut from 17.02 s to 39.20 s**, re-encoded once with a 0.5 s fade at each end, every line placed 1 s before its sheet time | LRCLIB record 12328880 ("The Beatles - Penny Lane") | The Beatles | **not stated** |
