# ROADMAP GENERATION

Reusable tooling for generating a `<TRACK>-ROADMAP.md` per `../ROADMAP-GENERATOR.md`.
Written while generating a 50-lesson track (144 labels), where it caught real defects - but only at
the end of the run, so run it from the start on the next track.

## Contents

   - `Test-Roadmap.ps1` - the checker. Exit code 0 = pass, 1 = at least one failure.
   - `sample-report.txt` - what a passing report looks like (0 failures, 0 warnings).
   - `work/` - the generation work files (spine, labels, item ledger) plus `_TEMPLATE-*.md`.
     Nothing there ships; `ROADMAP-GENERATOR.md` says what each file is for.

## Run it

```powershell
# one track
powershell -NoProfile -ExecutionPolicy Bypass -File '.\ROADMAP GENERATION\Test-Roadmap.ps1' -Path .\KIDS-ROADMAP.md

# every *-ROADMAP.md in the repo root, with a saved report
pwsh -File '.\ROADMAP GENERATION\Test-Roadmap.ps1' -All -Report '.\ROADMAP GENERATION\all.report.txt'

# a track that spaces its exams differently, or wants a different item budget
... -ExamLessons 12,30 -MinItems 8 -MaxItems 12

# exams name 10 primary labels (the rule since the first track's post-mortem)
... -ExamUses 10

# the numbers the ## Decisions block quotes: spine lines, labels, areas, items
... -Counts
```

Use `powershell` (5.1) or `pwsh`; the script avoids PS7-only syntax on purpose.

Track name drives the work files: `-Path .\KIDS-ROADMAP.md` looks for
`work/kids-spine.md`, `work/kids-labels.md`, `work/kids-items.md`. Override with
`-SpineFile` / `-LabelsFile`, or pass `..\..\somewhere\kids-labels.md`. Sources are combined, not
ranked: a roadmap may carry its own `## Labels` list, or use a labels ledger, or neither - and if
neither exists the label set is derived from the `teaches:` lines, which is the shipping shape.

## What it checks (mechanical half of "Check before finishing")

| Check | Failure it prevents |
|---|---|
| `## Decisions` -> `## Shape` -> (`## Labels`, optional) -> `## Lesson 1..N` present and in order; N=50; ascending; none missing | truncated or shuffled output |
| Shape carries `Start:`, `End:`, `Blocks:`; a `Spine:` pointer is optional and only its line count is reported, from that line or from the spine work file | empty frame, or a spine that only exists in someone's head |
| Every label lowercase `area/thing`, max 3 parts, defined once | naming drift, duplicate definitions |
| Every label taught exactly once; every taught label listed; every listed label taught | a real failure mode: 3 labels taught at L37 and listed nowhere |
| Work files, when present: `## Labels` and the labels ledger agree; every `teaches:` matches the ledger's `→ L<n>`; unassigned labels reported | the seam that broke first: the label list and the `teaches:` lines drifting apart |
| Every `uses:`/`deepens:` points at a **strictly earlier** lesson, and at a label somebody teaches or an item somebody introduced | forward references, self-references (a lesson leaning on a label it teaches) |
| Teaching lessons: `MinItems`-`MaxItems` vocabulary items and `MinLabels`-`MaxLabels` labels | one-item lessons, padded chapters |
| Exams: no `teaches:`, no vocabulary items, `Focus:` present, `Uses:` present, and `Uses:` = `-ExamUses` labels when that is set | exams silently becoming lessons; exams that list 40 labels instead of diagnosing 10 |
| Every lesson after the last exam says `tail` in its `Generation:` line | a tail lesson something later depends on, declared nowhere |
| No vocabulary item repeated in another lesson unless the later lesson names it in `deepens:`; no bare particle (`up`, `on`, `by`, ...) | the 10 duplicates that had to be repaired late in the run |
| Item ledger, when present: every item is used somewhere and at the lesson the ledger claims | a ledger filled in at the end, which catches nothing |
| Every entry carries its 8 fields in order (exams: Focus/Uses/Generation) | dropped `Real-world relevance` / `Generation` lines |
| No `page`/`section`/`class`/`chapter` meta references; no `register` label or `Register:` field | spec bans the entry naming a page, a class or a width |

Thresholds are parameters, so a different track's decisions can be encoded instead of argued with.
`-ExamUses` defaults to 0 (not enforced) so files generated before that rule still validate: run new
tracks with `-ExamUses 10`. A roadmap written before either newer rule (inline `## Labels`, exams
listing every label they touch) passes only with the defaults and would need editing, not just
flagging, to pass `-ExamUses 10`.

## What it cannot check (still yours)

   - Whether a label really is **one** rule statable in 1-2 sentences, or two labels in a trench coat.
   - Whether the same concept got **two names** across areas (one track taught `there is` twice: as
     `be/existence-there` and as `clause/dummy-subject` - merging them was a judgement call, not a
     mechanical one). Read the area list it prints and ask.
   - Whether vocabulary suits the persona, or whether an `Examples:` line is natural English.
   - Whether every spine family is actually taught, and whether the tail is really tail.
   - Whether the 10 labels an exam names are the *right* 10 - the count is checked, the choice is not.
   - Whether a `deepens:` line genuinely takes the item further, or was written to silence the duplication
     check. Any declared repeat reads as legal to the script; only reading it can tell.

## Traps that cost time on the first track

1. **Encoding.** The `## Labels` lines separate label from gloss with an em dash. Under PowerShell's
   default ANSI read that becomes mojibake and the label parser silently returns 0 labels. Always
   `-Encoding UTF8` (the script already does).
2. **Two label syntaxes.** `## Labels` entries are *not* backtick-wrapped (`- area/thing - gloss`);
   entry references *are* (`` `area/thing` ``). A parser written for one finds nothing in the other;
   the script accepts both.
3. **Quoted chunks contain commas.** `"yeah, whatever"` breaks a naive `split(',')` and inflates the
   item count. Split on commas outside quotes.
4. **Exams use `-` placeholders.** `teaches: -` and `Vocabulary: -` are the house style, so absent vs
   empty has to be distinguished before counting.
5. **Vocabulary dups are invisible while writing.** Everyday verbs (`send`, `write`, `plan`, `while`,
   `when`) recur naturally across 50 lessons. Two legal answers: substitute an item that fits the
   lesson, or repeat it deliberately and name it in that lesson's `deepens:` line. What is not legal is
   deleting it to dodge the check - the floor is 10.
6. **`-File` cannot pass an array.** `pwsh -File script.ps1 -ExamLessons 3,5` does not bind a two-element
   array; the parameter is a string list that the script splits on commas for exactly this reason. Same
   reason `-ExamUses` takes a single number.

## Workflow that makes failures cheap

1. Write `## Decisions` first, including the item budget, the label budget and the exam-uses budget.
2. Write the spine into `work/<track>-spine.md`, then run `-Counts` and **copy** the spine-line and
   family counts into Decisions. The first run's Decisions claimed 34 lines for a 36-line spine and
   26 areas for 42 - both typed from memory instead of read back.
3. Write `work/<track>-labels.md` with the `→ L<n>` column filled, then run the script with
   `-Path <file>` **before** any entry exists: the label checks already work on a file with no lessons
   and will tell you which labels are assigned nowhere or taught twice.
4. Write entries in ascending order, ~3 lessons per file edit (the editor truncates large writes),
   appending to `work/<track>-items.md` as you go, and re-run the script every ~5 lessons. Nearly every
   failure this script can report is cheaper at five lessons than at fifty.
5. Run it last with `-Report` and keep the report next to the roadmap, then re-run once with the
   `work/` files moved aside to prove the deliverable validates on its own.
