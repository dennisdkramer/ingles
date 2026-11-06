## ROADMAP-GENERATOR

# What this produces

A `<TRACK>-ROADMAP.md` for one track: what is taught at which lesson, and which lesson owns each thing, so that nothing is taught twice and nothing is used before it is taught. Pass A writes one lesson from one entry.

# Process

## INPUT AND OBJECTIVE
- Inputs: `PEDAGOGY.md` + `<TRACK>-REGISTER.md` (files may truncate). Withheld: all other files.
- A single read of a file can come back MIDDLE-TRUNCATED. If it does, you must: 
- Page through the file in bounded chunks with `start_line`/`end_line`, keeping each chunk well under ~6000 characters, until the full file is read, then re-read the full file before relying on it.
- Helper/verification files exist in `ROADMAP GENERATION` folder
- `ROADMAP GENERATION/Test-Roadmap.ps1` is the mechanical half of this file's own check list: run it after the labels exist, then every ~5 lessons, then at the end with `-Report`. It exits 1 on any failure, so it is a test, not a suggestion.
- Working state (spine, labels, item ledger) lives in `ROADMAP GENERATION/work/` — see WORKING FILES below. Do not hold it in memory and do not park it in the roadmap file.
- One entry per lesson, 1–50. 25 and 45 are EXAMS and their entries here should be summary explanations of how best to test the student's skills with the most important learned concepts up to that point. An exam's `uses:` names the 10 primary labels it diagnoses, never the whole block.

## Register
- Do not use 'Register' as a label inside lesson content - (use formal/casual axis)
- Never assign a register to a lesson.
- Register guides which concepts are included in the curriculum and their contexts and vocabulary

## PHASE 1 — THE SHAPE
The whole course in broad strokes, before any label exists. Nothing here is a per-lesson task; it is the frame the lessons get cut from. The spine is written into `ROADMAP GENERATION/work/<track>-spine.md`; the roadmap's `## Shape` block keeps `Start:`, `End:`, `Blocks:` and a pointer to that file. Never write the spine twice and never retype it from memory.

1. Place the fixed points. Lesson 1 + 2 are not free — `PEDAGOGY.md` pins their content. 25 and 45 are exams. 46–50 is the tail after the last exam: only what nothing later depends on.
2. State both ends in what the student can do — `Start:` and `End:`, one sentence each. `PEDAGOGY.md` fixes who is entering.
3. Inventory the concepts the course owes. Every mechanism, contrast and rule `PEDAGOGY.md` names is one the course must teach; add what this track's persona must be able to do. Group them into families.
4. Order the families onto 1–50 by `PEDAGOGY.md`'s difficulty model, written as a spine: one line per family — its lesson range and why it sits there. Judgment is cheap here and expensive once labels exist. Every line goes into the spine work file as it is decided.
5. Describe each block by what the student can do unaided at its end: block 1 (1–24) leaves it done; block 2 (26–44) assumes that and adds; 46–50 assumes both. A block you cannot describe means the spine is mis-cut — cut again.
6. Read the spine back: nothing is spent before it is placed, and nothing held for the tail is needed earlier.
7. Count, do not estimate. `Test-Roadmap.ps1 -Counts` prints the spine line count, the family count and the label count straight from the work files; the `## Decisions` block quotes that output. Numbers typed from memory are wrong numbers — a 36-line spine described as 34 and 42 areas described as 26 is what that looks like.

## WHAT A LABEL IS
- One thing the student must be told here that they were never told before: one rule, one contrast, one mechanism — statable in 1–2 sentences, then drilled. It is the unit a lesson owns.
- Not a label: a lesson title, an activity (roleplay, quiz, listening), a text or topic (small talk, zoom meeting), a word or chunk (→ `vocabulary:`), register (→ the formal/casual axis), anything already taught (→ `deepens:` / `uses:`).
- Word or label? A translation gloss settles it (`"depend on"` = *depender de*) → vocabulary. It needs a rule stated before the student can use it → label.
- One label or two? A student must be able to fail one and pass the other. Nobody could fail A while passing B → one label. One label needing two separate drill sets → two labels.
- A tense is a family, not a label: `past-simple/was-were`, `present-simple/facts-not-now` are labels; `past-simple`, `present-simple` are not.
- Naming: `<area>/<thing>`, third part only to slice one thing across lessons. Choose the areas once and reuse them — never a second name for an area already in use.
- Each head-list line is one plain sentence saying what the label is. If that sentence cannot be written, it is not a label.
- Decide a lesson's labels by asking what must be told for the lesson to work, then running each answer through the tests above. Vocabulary noticed along the way goes to `vocabulary:`, not here.

## PHASE 2 — THE LABELS
1. Cut the spine into labels, family by family. A family that cannot hold its weight as a label was never a concept — take it out of the spine; a family that needs more room gets split, never a wider label.
2. Write the label list in full into `ROADMAP GENERATION/work/<track>-labels.md` — lowercase, `-` inside a part, `/` between parts, at most 3 parts. One line each: `label — one plain sentence saying what it is`, then an assignment column `→ L<n>`. That file is the only legal source while generating: no label used in an entry that is not listed there. It is **tooling, not deliverable** — the roadmap's `teaches:` lines are the record of which lesson owns which label, so the roadmap ships without any label list and still says what is taught where.
3. Fill the assignment column before writing any entry: every label to exactly one lesson. `teaches:` is then copied from the column, never invented at entry time. Where two lessons look like they both teach it, the earlier keeps it and the later gets a `deepens:` line naming what is new, or a `uses:` line that says nothing more.
4. A split topic is two labels (`sound-work/inventory`, `sound-work/contractions`), never one label in two lessons.
5. Calibrate: 3–6 labels under each `teaches:`. Fewer = a chapter, not a lesson. More = a drill, not a lesson.
6. Every family in the spine is taught somewhere. If one is not, the labels are wrong — not the spine.
7. Run `Test-Roadmap.ps1` the moment the assignment column is filled, before any entry exists. It works on a roadmap with no lessons yet and reports labels listed but never assigned, plus labels taught twice — the defect that survived to lesson 50 last time because nothing compared the two lists.

## PHASE 3 — THE ENTRIES
1. `deepens:` and `uses:` point only at lower-numbered lessons, and both accept **two kinds of name**: a label in backticks (`` `report/backshift` ``) and a vocabulary item written exactly as it appears in `vocabulary:` (bare word, or the quoted chunk if it has one). What is new under `deepens:` is still said in words after the names. A lesson never names its own labels or items in either field — those are what it teaches, not what it leans on.
2. Fill `vocabulary:` — at least 10 items per teaching lesson. Single word in plain form (`prices`→`price`, `went`→`go`); fixed chunk exactly as taught, head verb in base form, in double quotes (`"depend on"`, `"up from"`). Anything with a slot is a label, not an item. Never a bare particle (`up`, `on`, `with`) as its own item. Parentheses only to separate two senses (`"bring up" (raise a topic)`); a usage note is never in `vocabulary:` — it becomes a label (`contrast/...`) or is carried in `Examples:`.
3. An item already used in an earlier lesson is a defect unless this lesson names it under `deepens:`. Everyday words recur naturally across 50 lessons (`send`, `write`, `plan`, `when`, `while`), so check `ROADMAP GENERATION/work/<track>-items.md` before adding one: either the repeat is deliberate and gets a `deepens:` line, or the item is swapped for one that fits this lesson. Do not delete it to make the count work — the floor is 10.
4. Exams 25 and 45 own no `teaches:` and add no `vocabulary:`: `Focus:` says what they test, and `uses:` names exactly the **10 primary labels** — the ten where a failure means the block has not landed. It is a diagnosis, not an inventory: a list of 40 tests nothing in particular.
5. The tail (whatever sits after the last exam) says so out loud: its `Generation:` line opens with `Tail - nothing later depends on it.` That sentence is what makes a marginal placement auditable instead of a feeling.
6. Write entries in ascending order, two or three lessons per write. A long write comes back truncated, and a truncated entry is a `teaches:` line with no lesson behind it.

## WORKING FILES (temp — never shipped)
Generation state is too large to hold in memory and too noisy to leave in the deliverable. It lives in `ROADMAP GENERATION/work/`, three files per track, created before the first entry and read on every entry:

| File | Holds | Written | Read when |
|---|---|---|---|
| `<track>-spine.md` | the families, in spine form (one line per family: lesson range + why here) | PHASE 1 | cutting labels; describing the blocks |
| `<track>-labels.md` | every label, its one-sentence gloss, and its assignment column `→ L<n>` | PHASE 2 | every `teaches:`; every `uses:`/`deepens:` |
| `<track>-items.md` | every vocabulary item with the lesson that introduced it | PHASE 3, as you go | before adding any item, to catch a repeat |

Rules:

- The roadmap file is output, not scratch. It carries `## Decisions`, `## Shape` (Start, End, Blocks, pointer to the spine file) and the lessons — and **no label list**: the glosses and the assignment column stay in `work/<track>-labels.md`. A `## Labels` block is optional; if present it holds the pointer line and the counts only.
- The deliverable must validate on its own. `Test-Roadmap.ps1` re-derives the label set from the `teaches:` lines when it finds neither a list nor a ledger, so nothing in `work/` has to be committed with the roadmap. What that costs is one check, the only one that cannot be derived from the entries: a label planned in the work file and taught nowhere. Run the checker while the ledger still exists and that check is live; after the files are gone, the roadmap's own consistency (each label taught once, no forward reference) is all that is left to verify — which is the part a reader of the deliverable can verify too.
- The work files are the source of truth for anything the compiler of this file would otherwise have to remember: a label's gloss, its owning lesson, whether an item has been used before. Memory over 50 lessons silently drifts; a file does not.
- Order of work, once: spine → labels + assignments → `Test-Roadmap.ps1` (labels only) → entries in chunks of 2–3 lessons → `Test-Roadmap.ps1` every ~5 lessons → final run with `-Report`.

## Check before finishing
- `## Shape` is filled: Start, End, block names, a pointer to the spine work file, and every family in that spine taught somewhere.
- While the ledger exists: the labels work file is filled and every label in it has an assignment; every label used is listed there; every label listed is under some `teaches:`, exactly once. In the shipped file the surviving half is the one a reader can check — each label taught exactly once, nothing used before it is taught.
- The deliverable validates without `work/`. Move the folder aside and `Test-Roadmap.ps1` must still exit 0: the label set is re-derived from the `teaches:` lines. A roadmap that only passes with the build artifacts next to it is not finished.
- No forward reference in `deepens:`/`uses:`; no lesson names its own labels or items there; no item repeated from another lesson without its name appearing in that lesson's `deepens:` line.
- Every teaching lesson ≥10 items: no bare particle, no split chunk, no slot-as-item. Exams 25/45 carry neither `teaches:` nor new items, and their `uses:` is exactly 10 primary labels.
- Every lesson after the last exam opens its `Generation:` line with the tail sentence.
- Every count quoted in `## Decisions` came out of `Test-Roadmap.ps1 -Counts`, not out of memory.
- No entry names a page, a class, a width or a section order.
- `Test-Roadmap.ps1 -Path <file> -Report <file>` exits 0. A roadmap that has not been run through it is not finished — most of the failures it reports are cheap at five lessons and expensive at fifty.

# Output to (<TRACK>-ROADMAP.md) - DO NOT MODIFY WITHOUT USER SIGN-OFF

## How to read an entry

   · Focus:    the lesson in one line
   · Teaches:  the labels this lesson explains for the first time
   · Deepens:  labels or items from an earlier lesson that this one takes further, and what is new (in words)
   · Uses:     labels or items from an earlier lesson that this lesson leans on without explaining
   · Vocabulary:  the words and chunks this lesson introduces (two written forms, above)
   · Examples: carriers for the content — suggestions, not a required list
   · Real-world relevance: what makes the item worth knowing in the context of the track
   · Generation: build instruction or hold note for this page

## Decisions
   · <ruling> — <why>
   · ...

   One line per ruling a later reader could otherwise re-open: item budget, label budget, exam-uses
   budget, repeated-vocabulary policy, tail policy. Any number quoted here comes from `-Counts` output.

## Shape
   · Start: what the student can do at lesson 1
   · End: what the student can do after lesson 50
   · Blocks: 1–24 <name> · 25 EXAM · 26–44 <name> · 45 EXAM · 46–50 <name>
   · Spine: <n> families — spine kept in `ROADMAP GENERATION/work/<track>-spine.md` (not shipped)

   The spine lines themselves stay in that work file: one line per family — `<concept family> — lessons N–M — why here`. The roadmap carries the pointer and the counts so the shape can be read without carrying the whole cut of the course, and the file still validates with the work folder gone.

## Labels — OPTIONAL, normally omitted
   · Source: `ROADMAP GENERATION/work/<track>-labels.md` — <n> labels (build artifact, not shipped)
   · Areas: <area> (<count>) · <area> (<count>) · ...

   Omit this block. The deliverable carries no label list: the `<n>` labels and their one-sentence glosses
   live in the work file while the track is being built, and the roadmap's `teaches:` lines are the record
   of which lesson owns which label. Include it only to publish the counts.

## Lesson 1: <title>
   · Focus: ...
   · teaches: ...
   · Deepens: ...
   etc..

## Lesson 25: EXAM — <what this exam is for>
   · Focus: ...
   · Uses: the 10 primary labels, each one a family that must have landed
   · Generation: how to test them — a task per family, crossed rather than one label per question

   Exams carry no `teaches:`, no `Vocabulary:` and no `Examples:`: they add nothing to the course, they
   find out what is missing from the student.
