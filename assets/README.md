# assets — vendored art

Nothing here is fetched at run time. A page that shows one of these files works offline, on a
USB stick, and inside a printed copy. `../assets/…` is the path from a lesson folder or from
`qa/`, the same depth convention as `../logo.png`.

Rules for adding a file:

- **Provenance and licence go in this table, in the same commit as the file.** If the licence is
  unknown, the file does not go in.
- **Public domain is preferred for anything we annotate**, because a marked-up or recoloured
  derivative of a share-alike image inherits share-alike, and a lesson page is not the place to
  litigate that. A CC BY-SA plate is usable *unannotated* with attribution and a licence link.
- **Credit the plate on the page too, not only here** (`<p class="vz-cite">`), because a printed
  page travels without this file.
- Keep the original untouched if a crop or overlay is derived from it, and say which is which.

| File | What it is | Source | Author | Licence |
|---|---|---|---|---|
| `speech-organs.png` | Side view of the head and neck with the vocal tract labelled — the reference plate for `mouthCut` | [File:Illu01 head neck.jpg](https://commons.wikimedia.org/wiki/File:Illu01_head_neck.jpg), Wikimedia Commons (originally US National Cancer Institute) | Arcadian | **Public domain** |
| `speech-organs-mouth.png` | Derived from the file above: cropped to the mouth (44,120 → 228×172 px, scaled 2×) and four label fragments painted out, so our own tongue overlays and numbers own the labels | derived, same source | Arcadian (original), crop ours | **Public domain** |

Both files are public domain, so the crops and the SVG overlays drawn on them carry no
obligation. Attribution is still given on the page and here because the drawing is someone
else's work.
