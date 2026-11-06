## TOOL DISCIPLINE

- `read_files` requires `start_line`/`end_line` for any file over ~400 lines, or for any file you only need part of; read a roadmap lesson by its heading range, never the file. A file you are building or auditing (a lesson, a rule file) is read whole once — that is cheaper than paging it.

- No `Get-Content -Raw`; no output path may print a whole file.

- Every command carries a bounding filter, ceiling __40 output lines__ (`Select-Object -First 40` / `Measure-Object` / `Select-String`). Unbounded commands are a defect. A filter chosen for relevance (`Select-String 'error|fail|✖'`) satisfies this as well as a positional cut, and is required when the cause is not at the end.

- Unknown-length commands (`npm run`, `node`, test suites, `git`) → redirect to a temp file, then print the lines that carry the cause; if nothing matches a cause filter, the last 40.

- No `git log` / `show` / `blame` / `diff <old-rev>` unless the user asked for history. Reading one named file's earlier content (`git show <rev>:<path>`) is allowed when that file's previous state *is* the question — recovering a deleted lesson, checking your own edit.

- Never restate tool output in the reply; cite path + count.

- A result over ~2k tokens means the question was wrong — re-run narrower, don't narrate the waste.

- If the user can answer a *product or pedagogy* decision in one sentence, ask instead of exploring. Code lookups — where a class or engine is defined, whether a primitive exists — are searched, not asked.
