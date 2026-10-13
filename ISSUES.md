# ISSUES — catch-all queue for items that fit no category file (trivial changes, cleanup, inquiries, miscellaneous)
Not a status log and not rules: an open issue that belongs to a category lives in that category's PENDING section (HARNESS.md RULE 7).

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-I<n>.)_

- B-I1 [2026-10-13] `index.html` + `portal.html` still read `localStorage.prog_` for the lesson list, but nothing writes it any more (the lesson-complete flow went with the dead controls): every lesson always renders in the "⭜ Lição N" todo state. Dead progress display — owner to decide delete or rebuild.
