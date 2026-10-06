# HARNESS — BINDING CONTRACT (read at the start of EVERY session, before any other action)

Owner: dennisdkramer (non-technical English teacher). This file is the single source of
truth for how I (the agent) must behave. If anything below conflicts with my impulses,
THIS FILE WINS. Violating a HARD RULE is a bug to fix immediately, not a judgment call.

---

## HR-1. LANGUAGE — HARD RULE
- ALL replies to the owner are in ENGLISH. Always. No exceptions.
- The project contains Portuguese content (lesson text, .ptw words, UI labels like
  "salvo apenas nesse dispositivo"). That content STAYS PORTUGUESE where it belongs.
  But my conversation with the owner is English because the OWNER WRITES IN ENGLISH.
- Basic logic test before sending any reply: "Did the user's last message ask me to
  produce Portuguese?" If no → reply in English. Do NOT let surrounding Portuguese
  file content bleed into my prose. This has happened repeatedly; treat it as the
  #1 known failure mode and self-check every response.

## HR-2. EVIDENCE BEFORE CLAIMS — HARD RULE
- I may say "verified", "deployed", "live", or "working" ONLY in a message that
  contains pasted terminal output proving it (curl result, node --check, git log,
  QA run output). No proof → no claim. Say "not yet verified" instead.
- I may never restate a past success without re-checking the current state first
  (git status, live curl, file contents). Context between turns may be truncated;
  the repo and the live site are the only reliable memory.

## HR-3. ONE FEATURE PER COMMIT — HARD RULE
- Each commit = exactly one coherent feature/fix. Never bundle unrelated changes.
- Commit message states the feature plainly.
- ONE commit at a time pushed — rapid successive pushes jam the GitHub Pages queue.

## HR-4. THE LOOP — run for EVERY change, in order, no skipping:
  a. Re-read this HARNESS.md and `git status` + `git log -3` to know actual state.
  b. Make the ONE change.
  c. Run `node qa/smoke.mjs`. Must be green. If red: fix, re-run. NEVER commit red.
  d. Add/update marker `<!-- build: <ISO timestamp> -->` in every changed HTML file.
  e. `git add -A && git commit && git push origin main` (auth via saved remote URL).
  f. `sleep 75` then `curl -s <live URL>` and grep the new build marker. Paste output.
     If not live after ~3 min, investigate deploy and report honestly.
  g. Only then report done — with evidence attached.

## HR-5. SCOPE DISCIPLINE — HARD RULE
- Do exactly what was asked. No unrequested changes, no "improvements" on the side.
- If I think something else should change, I PROPOSE it in a reply and wait.
- When uncertain about intent, ask one short clarifying question instead of guessing.

## HR-6. FILES & CONVENTIONS
- Engines/style ship as FULL files when updated. Lessons are content-only
  (config consts + engine includes). Never ask the owner to hand-paste fragments
  into files I can edit myself.
- Backend: Google Apps Script "ingles-backpack". I cannot edit it (owner's Google
  account). I maintain `backend/Code.gs` in-repo as the canonical copy; owner
  paste-deploys it. BACKPACK exec URL currently:
  https://script.google.com/macros/s/AKfycbxSR8UmOwosLIgn1-AGKhgXJvdqOVkzMqrTwdlWNF9kOkt-256TqTacOsQlo6JyHplR/exec
- Auth gate: sessionStorage signed with SECRET ("abreportas2025"), hash h(s):
  x=0; for each char: x=(x*31+code)|0 ; applied to email+track+SECRET.
- OAuth origin: https://dennisdkramer.github.io (add origins if host changes).

## HR-7. PEDAGOGY RULES (content — do not break)
- NO improvised phonetic respellings; pronunciation audio comes from ▶ TTS.
- Portuguese ONLY for translation/explanation. PT words in exercises: italic+colored (.ptw).
- Popup buttons: English, small, one line. ONE re-writable note per phrase.
- Recordings = underlined mark; notes = blue mark.
- L1 teaches "vowels have no fixed sound"; cognate suffix codes; Tense Truth
  (present simple = facts/habits ONLY); reductions (gonna/wanna/woulda) early;
  get = coringa; quiz honesty note; gabarito inside <details>.
- Three fully separate tracks: kids (casual/slang), business (formal), nsfw
  (18+, swearing, AAVE-aware). Own folder, own lesson order, own voice.

## HR-8. KNOWN OPEN ISSUES (carry forward until closed with evidence)
- Old drawings/notes/recordings still visible on live site despite Sheet deletion —
  suspect: stale rows resynced, localStorage ghosts, or backend serving old data.
- Drawing interactions (shift+click draw / shift+right-click delete / ctrl+click
  highlight / ctrl+z undo / touch gestures / 3-way toggle / floating undo button)
  need manual browser testing by owner; jsdom QA cannot verify real clicks/canvas.
- Fixed page layout: owner reported text still compresses dynamically — needs
  truly static PDF-like layout + print/export.

## HR-9. HISTORY OF STANDING INSTRUCTIONS (all still active)
- Persistence must be per-student AND per-book (track), server-backed.
- Drawings: borderless, anchored to fixed page positions (point at specific words),
  auto-save per stroke, no popups, click-to-delete only within ~5px of the stroke,
  not a bounding box. Touch: 2-finger=draw, 3-finger=highlight, 4-finger=delete
  (instant, no popup). Ctrl+z reverts deletions/draws/typing/field actions
  sequentially. Back/undo button usable by teacher AND student, floats top-right;
  other controls + hotkey info at top of each lesson, minimum comfortable size.
- 3-way toggle: off / limit (no student draw+undo) / teacher-only (no student
  interaction).
- Lesson layout: prettier, consistent (iteration pending).

## HR-10. UPDATING THIS FILE
- Whenever the owner says "from now on…", "always…", "never…" — I MUST append the
  rule here in the same turn, then follow it thereafter. This file is the persistent
  memory; conversations are not.
