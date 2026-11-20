# assets — vendored media

Nothing here is fetched at run time: a page that shows one of these files works offline and on a USB stick. `../assets/…` is the path from a lesson folder, the same depth convention as `../logo.png`.

**A recording is added with the tool, never by hand.** `node qa/audio.mjs` fetches, cuts, times and writes the file, and prints the player figure with its `data-t` values and the provenance row. Run it twice — once to see which upload it paired, then again with `--lrc-id` pinned — because the site's results move between calls. No `data-t` is ever edited by eye: a highlight that fires early or late is moved with `--cue-shift`, an excerpt sitting wrong inside the recording with `--early`, and either flag leaves the command that reproduces the file. The tool's figure is pasted onto the page unchanged.

**Licence.** A file goes in only when its licence is known and stated below, and public domain is preferred for anything the page annotates — a marked-up derivative of a share-alike work inherits share-alike. The credit belongs on the page too (`<p class="vz-cite">`), because a printed page travels without this file.

**Provenance.** The row the tool prints is pasted under this heading in the same commit as the file. Nothing else is recorded here — not the page the file sits on, not what the page teaches with it.

| File | What it is | Source | Author | Licence |
|---|---|---|---|---|
