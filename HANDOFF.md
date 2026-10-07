# HAND-OFF — Inglês Abre Portas (start here, new session)

Read this file fully before acting. Then read HARNESS.md (binding rules),
FUNCTION.md and FORMAT.md (binding contracts), ISSUES.md (open items).

## Verified repo state (checked 2026-10-05 in the prior session)
- Branch: main @ commit 75e172d, working tree clean, pushed to GitHub.
- Files present: portal.html, index.html, style.css, engine1.js, engine2.js,
  access.json, logo.png, business/lesson1.html, kids/lesson1.html,
  nsfw/lesson1.html, backend/Code.gs, qa/smoke.mjs, HARNESS.md, FUNCTION.md,
  FORMAT.md, ISSUES.md.
- Live site: https://dennisdkramer.github.io/ingles/ (portal served via index.html)

## Known NOT-done item
- The "make the page 1400px wide" change was NEVER applied to style.css
  (it was falsely reported as done). style.css still has the old ~780px
  .page-container rule. Do not assume it is done; verify by reading the file.

## First actions for the new session (in order)
1. Read HARNESS.md, FUNCTION.md, FORMAT.md, ISSUES.md.
2. Run `node qa/smoke.mjs` — must be green before any edit.
3. Verify current state yourself (file reads / curl live URLs). Never trust
   claims from this handoff or from history without re-checking.
4. Ask the owner which task to start (likely: fixed 1400px page layout per
   FORMAT.md update request, then drawing functionality fixes per ISSUES.md).

## Owner context
- Non-technical English teacher (GitHub: dennisdkramer). Give exact steps.
- Conversation language: ALWAYS English. Portuguese appears only inside site
  content (lessons, UI labels meant for Brazilian students).
- One feature per commit. Follow the loop in HARNESS.md rule 5 after every
  file edit: edit → QA green → build marker → commit/push → sleep 75 →
  curl live URL → paste evidence of the actual output when reporting.
- If a prompt is unclear or you doubt scope: STOP and ask. Do nothing extra.
