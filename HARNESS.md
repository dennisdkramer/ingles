# HARNESS — BINDING CONTRACT (read at the start of EVERY session, before any other action)

Owner: dennisdkramer (non-technical English teacher). This file is the single source of
truth for how I (the agent) must behave. If anything below conflicts with my impulses,
THIS FILE WINS. Violating a HARD RULE is a bug to fix immediately, not a judgment call.

---

## HR-0. EXPLICIT SCOPE ONLY — THE FIRST AND STRICTEST RULE
- Before doing ANYTHING, double and TRIPLE-check the owner's actual prompt.
- Do EXACTLY what is asked explicitly — nothing more. No "while I'm here" additions,
  no unrequested verification steps, no proactive improvements, no extra files,
  no bonus research, none of it. If it wasn't asked for, it doesn't happen this turn.
- The bar for acting: the instruction must be plainly present in the prompt. My own
  judgment that something "should also be done" is NEVER sufficient grounds to do it.
- If there is ANY doubt, ambiguity, or missing information: STOP PROCESSING
  IMMEDIATELY and communicate with the owner before going forward. Asking one short
  clarifying question always beats guessing and doing unwanted work.
- Suggested discipline: silently restate to myself (a) exactly what was asked,
  (b) exactly what I plan to output, then verify (b) contains nothing outside (a)
  before executing a single tool call or sending a reply.
- Violation history to learn from: adding formatting rules to HARNESS.md when only
  shown/asked about placement; running deploy-liveness checks nobody requested;
  switching topics mid-conversation without being asked. All forbidden by this rule.

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
- [CLOSED Oct 6, commit 5970eac] Old drawings/notes/recordings reappearing despite
  Sheet deletion — root cause was localStorage ghosts; code now wipes them on load.
  Owner confirmed drawings gone on live site. Re-open only if they return.
- OWNER REPORTED (latest): drawing function "still has problems" — specific symptoms
  not yet described. Ask owner for exact repro steps before touching engine2.js.
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

## HR-11. SITE FORMATTING — FROZEN CONTRACT (do NOT change unless owner asks)
These are current facts of style.css / layout. Any task that touches formatting must
check this section first and preserve everything not explicitly being changed.

### Brand tokens (CSS vars, :root in style.css) — never rename or re-tint:
- --cream:#f4eddd (page background) · --paper:#fdfaf2 (content surfaces)
- --ink:#182136 (text, borders, buttons) · --tan:#b9854c (accents, shadows)
- --rose:#d9c1ba · --ok:#177245 (correct/green) · --bad:#a33327 (wrong/red)
- --ptw:#96601f (Portuguese words) · --blue:#1d4ed8 + --bluebg:#dbeafe (notes)

### Fonts (Google Fonts import at top of style.css):
- Playfair Display 700/900 → h1, h2 (headings, letter-spacing .14em)
- Caveat 700 → .script class (handwritten accents, rotated -2deg)
- Public Sans 400/600/700 → body text, base font 17px/1.6

### Layout skeleton (every lesson page):
- header.brand (centered logo 120px w/ rose drop-shadow) → main#page
  → .page-container (FIXED width:780px, min-height:1200px, paper bg,
  2px solid ink border, NO radius/shadow, position:relative — drawings anchor here)
  → .page-fixed (780x1200 exact). Content does NOT compress dynamically;
  fixed page = PDF-like canvas so drawings stay pinned to specific words.
- Cards: .card = paper bg, 2px ink border, 16px radius, 5px 5px 0 tan hard shadow.
- Buttons: ink bg, cream text, 10px radius, 3px 3px 0 tan shadow, 600 14px Public Sans.
- Links: ink color, weight 600. Dim text: #8a8072 13px.

### Exercise/markup conventions (style.css classes — keep semantics):
- .ptw = Portuguese word in exercises: italic, --ptw color, weight 600. (pedagogy)
- input.gap = fill-in blank: transparent, 2px tan bottom border, #fff8ea bg;
  .gap.ok green tint / .gap.bad red tint after grading.
- fieldset = quiz block, dashed tan border, 12px radius; ok/bad tints as above.
- details (gabarito) = #fff8ea, dashed tan border — answers always inside <details>.
- mark.nb phrase marks: has-rec = underline 2px --ok + 🎙 suffix;
  has-note = bluebg fill + blue text + 📝 suffix. No other mark styling.
- .pop selection popup = fixed, paper, 2px ink border, 14px radius, tan hard shadow,
  max-width 380px; its buttons small (12.5px, one line, English labels).
- #toast = fixed top-center pill, ink/cream. .recind recording indicator top-center.
- .nbImg drawings: position:absolute INSIDE .page-container, border:0,
  pointer-events:none (interact only via global shift/ctrl key handlers).
- @media print: hides header/#topbar/#feed/footer, strips container border/shadow.

### Sizing philosophy (owner directive):
- Controls/hotkey text/buttons: minimum size an average person comfortably sees,
  clicks, reads. Do not enlarge "for beauty"; do not shrink below comfortable.
- Undo/back button floats top-right for BOTH teacher and student; other controls
  + hotkey legend sit at top of each lesson.

### What I must NOT do when asked for unrelated changes:
- Not alter colors, fonts, page width (780px), card/button shadow style, mark
  semantics, or popup design. If a change would touch any of these, I say so
  explicitly and wait for approval before editing.
