# BACKEND — backend contract (source of truth: backend/Code.gs)

## PENDING

_(Batches queued for this category, newest first. Cleared once done AND committed. Batch ids: B-BE<n>.)_

_(none queued.)_

## WHAT IT IS
- ONE Google Apps Script web app (`backend/Code.gs`), deployed on the owner's account (I cannot deploy). Every lesson page points at the same deployment through `const BACKPACK` (exec URL in MASTER_CONTEXT.md).
- It is the only server: the frontend is static GitHub Pages, so all shared state lives here.
- Storage: sheet `IAP_backpack!layer`, columns `id | email | track | lesson | type | anchor | data | author | ts | b64`, plus sheet `IAP_backpack!access` (columns `email | name | track | status | ts`) for the approved-student list and the pending-request queue, plus the Drive folder `IAP_uploads` for recording audio.
- Separation is enforced on READ *and* on WRITE by `email + track + lesson` — no cross-student and no cross-book visibility, teacher tools included.

## API
- GET `?action=ping` → health check · `?action=layer&email=…&lesson=…` → every row for that student+lesson (what engine2.js polls — adaptively) · `?action=file&id=<fileId>` → the recording bytes from Drive · `?action=dbg` → server info · `?action=students&track=…` → the approved-student list for that book (used by the teacher's student selector in the control bar).
- POST (JSON body): `add` (new row, id minted if absent) · `set` (replaces the row that has the same id — this is what the ONE core save uses for note re-save / clip re-record) · `del` (removes every row with that id) · `wipe` (teacher reset for one email+lesson, or everything when no email is given).
- POST access-control (JSON body, Google ID token required and verified server-side): `status` (report an email's status — approved / pending / unknown) · `request` (record a pending signup request) · `approve` (teacher-only; adds the email to the allowed list with the book assigned at approval) · `reject` (teacher-only; removes the pending request) · `queue` (teacher-only; returns the pending requests and approved students). approve/reject/queue also verify the caller is a teacher.
- Writes are network-last: the popup/layer updates immediately, the POST follows. Only the layer rows are read back, so a backend edit never needs a frontend change.

## RULES THAT MUST NOT DRIFT
- A recording's audio always goes to Drive; the row keeps a `drive:<fileId>` pointer in the `b64` column. Inline base64 is a last-resort fallback only when the upload itself fails (clip must fit a spreadsheet cell, <45k chars).
- `del`, `set` (replacing a row) and `wipe` also TRASH the Drive file they orphan (`purgeDrive_` never throws and never blocks the row delete) — no orphaned audio left in IAP_uploads.
- Every recording row carries its own fileId, so the frontend can play (`?action=file&id=`) or delete a clip without any extra field.
- A script lock serializes POSTs; every response is JSON (`{result}` / `{count,purged}` / `{error}`) and every thrown error comes back as `{error}`.
- Access-control actions verify the Google ID token server-side (tokeninfo, audience = CLIENT_ID) before trusting an email; approve/reject/queue additionally verify the caller is a teacher (the TEACHERS constant, kept in sync with access.json). The `access` tab holds students+requests and must never be read or written as `layer` rows.
- A Code.gs edit only takes effect after a NEW deployment version (Deploy → Manage deployments); the `/exec` URL does not change, so pages need no update.
- qa/smoke.mjs mocks `fetch` and never calls this backend for real: verify backend changes by the diff plus the affected code path (real curl against the deployed URL only when the risk is real).
