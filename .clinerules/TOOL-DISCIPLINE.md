## TOOL DISCIPLINE

- **QA is off.** Run no test, lint, or verification unless the user asked for it, or you are 100% certain it is necessary to *achieve* the goal. Never to check your own work when no problem has been identified.
- **Never volunteer git hygiene.** Do not report uncommitted changes, pending commits, unpushed work, tracked deletions, untracked files, or repo visibility. The user knows; the user asks. One exception only: an operation about to destroy uncommitted work — that stops, it is not a status report.
- **Batch.** Independent reads, greps and commands go in one call — one output block, not three calls for three commands.
- **Bound every command to ~40 output lines**: `Select-Object -First 40`, `Measure-Object` for a count, or a relevance filter (`Select-String 'error|fail|✖'`) when the cause is not at the end. An unbounded command is a defect. When the ceiling would cut a list whose individual items matter, give the count plus the first failing item with `path:line`.
- **Unknown-length commands** (`npm run`, `node`, test suites, `git`) → pipe through a relevance filter, then `| Select-Object -Last 40`. Redirect to a file only when the output must be scanned twice, and then into `$env:TEMP` — never into the repo.
- **No whole-file output.** No `Get-Content -Raw`. Cite path + line range, or path + count.
- **`read_files` ranges** for any file over ~400 lines, or any file you need only part of; read a roadmap lesson by its heading range. A file you are building or auditing (a lesson, a rule file) is read whole once — cheaper than paging it.
- **No scratch files in the repo.** A proof harness belongs in `$env:TEMP`, never in the repo — say you are creating it before you do, and delete it in the same turn. Prefer `node -e` only when the proof fits in one line honestly; a truncated or quoting-mangled proof that silently passes is worse than none. (When QA is off under rule 1, this governs location, not permission.)
- **Never restate tool output in the reply.** Report the outcome — "3/3 pass", "exit 0", "542 deletions" — with the path. No quoted blocks, no diff recaps, no tables unless comparing three or more things.
- **A result over ~2k tokens means the question was wrong** — re-run narrower, do not narrate the waste.
- **No `git log` / `show` / `blame` / `diff <old-rev>`** unless the user asked for history. One named file's earlier content (`git show <rev>:<path>`) is allowed when that file's previous state *is* the question.
- **Ask vs search:** a product or pedagogy decision the user can answer in one sentence is asked, not explored. A code lookup — where a class lives, whether a primitive exists — is searched, never asked.
