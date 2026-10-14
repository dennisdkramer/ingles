# ISSUES — catch-all queue for items that fit no category file (trivial changes, cleanup, inquiries, miscellaneous)
Not a status log and not rules: an open issue that belongs to a category lives in that category's PENDING section (HARNESS.md RULE 7).

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-I<n>.)_

- B-I4 [2026-10-13] BACKEND DATA SHAPE: `?action=dbg` on the live deployment reports 129 rows and the first samples read `email=dennisdkramer@gmail.com, track:"", lesson:1, type:"hl"` — an EMPTY track, which sits outside the `email+track+lesson` keying BACKEND.md defines (every read *and* every write separates per student AND per track). Probably leftover/test rows. PARKED (owner: not needed yet); when it matters, read the whole row set and decide whether to sweep it.
- B-I3 [2026-10-13] LIVE vs DISK LINE ENDINGS: GitHub Pages serves the very same files with LF while the working tree is CRLF, so a live-vs-disk comparison always looks different — index.html 4441 live / 4505 on disk (that 64-byte gap is exactly the line count), business/lesson1.html 14239 / 14356, access.json 274 / 282. No functional effect. PARKED; only worth normalising (`core.autocrlf` / a `.gitattributes`) if a live-vs-disk diff ever needs to be readable.

- B-I1 [2026-10-13] `index.html` + `portal.html` still read `localStorage.prog_` for the lesson list, but nothing writes it any more (the lesson-complete flow was removed): every lesson always renders in the "⭜ Lição N" todo state. Dead progress display — owner to decide delete or rebuild.
