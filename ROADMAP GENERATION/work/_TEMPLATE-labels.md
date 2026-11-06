# <TRACK> — LABELS (work file, PHASE 2)

Copy to `work/<track>-labels.md`. This file is the **only legal source** of labels.
One line per label, grouped by area:

    - <area>/<thing> — one plain sentence saying what it is. → L<n>

Rules:
- Fill `→ L<n>` for every line **before writing any entry**. `teaches:` in the roadmap is copied from this column.
- `→ L0` (or no arrow) means unassigned — `Test-Roadmap.ps1` reports it.
- Lowercase; `-` inside a part; `/` between parts; at most 3 parts.
- One label, one lesson. A split topic is two labels.
- Run the checker now, with no lessons written: it reports listed-but-unassigned and taught-twice.

## <area>

- <area>/<thing> — ... → L1
- ...

## <area>

- <area>/<thing> — ... → L3
- ...
