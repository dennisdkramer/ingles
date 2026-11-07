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
- One entry per lesson, 1–50. 25 and 45 are EXAMS and their entries here should be summary explanations of how best to test the student's skills with the most important learned concepts up to that point — that explanation is the exam's `Focus:` line, since an exam has no other fields to carry it. An exam's `uses:` names the 10 primary labels it diagnoses, never the whole block.

## Register — the tone of the whole course, and a source of content
`<TRACK>-REGISTER.md` is an input with the same weight as `PEDAGOGY.md`. Both are binding.

- **It sets the tone.** The register the file names as primary — register a) where the file lists them that way, unless its `Persona & goals` line points elsewhere — is the default voice of the whole course: contexts, carriers, jokes, stakes, vocabulary. If the file leaves it genuinely open, the persona's stated priority decides, and the choice is written into the `Tone:` line. A roadmap that teaches the right grammar in a neutral textbook voice has failed this section even with zero checker failures — the checker cannot see tone, so nothing will catch it for you.
- **It sets the content.** Everything the file names is something to be *taught*: the slang, the text-speak, the jargon, the swearing, the taboo words, the formulaic politeness — whichever of those that file actually asks for. They are not decoration on a grammar syllabus and they are not optional. A course that never teaches the register's own required language is a critical failure of the deliverable, whatever else it gets right.
- **A named variety or dialect is content too.** If the file names AAVE, regional speech or another variety, it is taught accurately and attributed — as language people speak, never as a joke, never as "bad English", never silently dropped because it looks harder to grade. If the file sets a censoring policy (how far to mask a swear, whether a slur is explained rather than used), that policy is followed exactly.
- **The flavour comes from the file, never from this generator.** One register file may name youth slang and text-speak, another swearing and taboo language, another business-casual phrasing with slang as a sidenote. This file prescribes no flavour of its own: it prescribes that whatever that file names is copied faithfully — its rowdiness, its politeness ceiling, its brevity, its humour.
- **The primary register wins every tie.** When two contexts, two carriers or two vocabulary items do the same pedagogical job, take the one the primary register's own settings supply over its neutral dictionary twin — `stream`, `grudge match`, `cooked` in a file that names internet and youth culture; `deadline`, `stakeholder`, `push back` in one that names business-casual — unless the neutral word is the very thing the lesson teaches (`bag` when the lesson is counting groceries).
- **Relevance means the relevance of the student the file describes.** `Real-world relevance:` says why *that* student would say this, in the file's own settings — its places, its people, its humour — not why a linguist finds the rule interesting.
- **The register's stakes are the course's stakes.** Whatever the file says the student cares about — absurdity, taboo territory, blunt anger, a negotiation with money on it — is what the carriers put at risk, and a joke or an exaggeration carries grammar exactly as well as a serious example. A whole course of earnest, low-stakes sentences is a register failure even when every label is correct.
- **The register's required language is taught, not deferred.** It enters as `vocabulary:` items and, where a rule is involved, as labels under an area that names what the language is (`slang/...`, `text/...`, `email/...`, `swearing/...` — name the thing, never `register/*`) — spread across the course and finished **before the last exam**. Parking it in the tail because it dates, because it is rude, or because an exam will never ask for it is a critical failure, not a safe choice.
- **No register appears in the output.** Never a `register` label, never a `register/*` area, never a per-lesson register field or assignment, never "this lesson is register b". Where a lesson really must separate levels, it does it with language — a casual form set against its formal twin, both drawn from the file's own settings — never with a tag. The tone is carried by contexts and words, which is the only place a reader can check it.

## PHASE 1 — THE SHAPE
The whole course in broad strokes, before any label exists. Nothing here is a per-lesson task; it is the frame the lessons get cut from. The spine is written into `ROADMAP GENERATION/work/<track>-spine.md`;  Never write the spine twice and never retype it from memory.

1. Place the fixed points. Lesson 1 + 2 are not free — `PEDAGOGY.md` pins their content. 25 and 45 are exams. 46–50 is the tail after the last exam: only what nothing later depends on.
2. Inventory the concepts the course owes. Every mechanism, contrast and rule `PEDAGOGY.md` names is one the course must teach; add what this track's persona must be able to do. The register file's required language — whatever it names — is part of that inventory, not a garnish on it, so it gets its own families here. Group them into families.
3. Order the families onto 1–50 by `PEDAGOGY.md`'s difficulty model, written as a spine: one line per family — its lesson range and why it sits there. Judgment is cheap here and expensive once labels exist. Every line goes into the spine work file as it is decided.
4. Describe each block by what the student can do unaided at its end: block 1 (1–24) leaves it done; block 2 (26–44) assumes that and adds; 46–50 assumes both. A block you cannot describe means the spine is mis-cut — cut again. Describe each block by its register too: which of the file's settings and which of its required language that block owns. A block in which the file's tone and required language appear nowhere is a block that skipped the register file.
5. Read the spine back: nothing is spent before it is placed, nothing held for the tail is needed earlier, and nothing the register file requires to be taught has drifted past the last exam on the grounds that it dates.
6. Count, do not estimate. `Test-Roadmap.ps1 -Counts` prints the spine line count, the family count and the label count straight from the work files; the `## Decisions` block quotes that output. Numbers typed from memory are wrong numbers — a 36-line spine described as 34 and 42 areas described as 26 is what that looks like.

## WHAT A LABEL IS
- One thing the student must be told here that they were never told before: one rule, one contrast, one mechanism — statable in 1–2 sentences, then drilled. It is the unit a lesson owns.
- Not a label: a lesson title, an activity (roleplay, quiz, listening), a text or topic (small talk, zoom meeting), a word or chunk (→ `vocabulary:`), a register assignment (never in the output at all), anything already taught (→ `deepens:` / `uses:`).
- The register's own items — slang, text-speak, jargon, set phrases — sit on the vocabulary side by default (`"that's cooked"`, `lol`, `"circle back"`); they become labels only when a rule decides where they are allowed or how they are built (`slang/where-not-to-use`, `text/abbreviation-set`). Never shaped as `register/*`.
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
8. The register file's language rules are labels like any other (`slang/...`, `text/...`, `email/...`, `swearing/...` — whatever areas its own language needs): cut them here with real lesson ranges, and check by eye that no required family landed only after the last exam. The checker knows nothing about register, so this step is the only guard there is.

## PHASE 3 — THE ENTRIES
1. `deepens:` and `uses:` point only at lower-numbered lessons, and both accept **two kinds of name**: a label in backticks (`` `report/backshift` ``) and a vocabulary item written exactly as it appears in `vocabulary:` (bare word, or the quoted chunk if it has one). What is new under `deepens:` is still said in words after the names. A lesson never names its own labels or items in either field — those are what it teaches, not what it leans on.
2. Fill `vocabulary:` — at least 10 items per teaching lesson. Single word in plain form (`prices`→`price`, `went`→`go`); fixed chunk exactly as taught, head verb in base form, in double quotes (`"depend on"`, `"up from"`). Anything with a slot is a label, not an item. Never a bare particle (`up`, `on`, `with`) as its own item. Parentheses only to separate two senses (`"bring up" (raise a topic)`); a usage note is never in `vocabulary:` — it becomes a label (`contrast/...`) or is carried in `Examples:`. Then spend the ten in the register's favour: whenever the topic allows, at least a third of the items come from the primary register's own domains — the settings and the language the register file names — and never all ten neutral. Ten items that could belong to any English course are ten items wasted, and the student who has to sit through them knows it.
3. An item already used in an earlier lesson is a defect unless this lesson names it under `deepens:`. Everyday words recur naturally across 50 lessons (`send`, `write`, `plan`, `when`, `while`), so check `ROADMAP GENERATION/work/<track>-items.md` before adding one: either the repeat is deliberate and gets a `deepens:` line, or the item is swapped for one that fits this lesson. Do not delete it to make the count work — the floor is 10.
4. Exams 25 and 45 own no `teaches:` and add no `vocabulary:`: `Focus:` says what they test, and `uses:` names exactly the **10 primary labels** — the ten where a failure means the block has not landed. It is a diagnosis, not an inventory: a list of 40 tests nothing in particular.
5. The tail (whatever sits after the last exam) touches on more advanced ideas to challenge the student, current events, slang that they havent learned yet, or synthesizing and training the totality of their english skills. It is an extension, never the only home of the register's required language: the minimum that file demands is finished before the last exam, and the tail may only go past it.
6. Write `Examples:` in the register's voice, not the teacher's. A carrier should read like something the student would actually say or send in the file's own settings: a joke, an exaggeration, a message to a friend, a line from a meeting — whatever that register sounds like. If every carrier in a lesson could sit in a grammar table with the names filed off, the register has been ignored — keep the grammar, rewrite the sentences. `Real-world relevance:` answers "where does this student actually meet this?" in the settings the register file names, not in linguistics.
7. Write entries in ascending order, two or three lessons per write. A long write comes back truncated, and a truncated entry is a `teaches:` line with no lesson behind it.

## WORKING FILES (temp — never shipped)
Generation state is too large to hold in memory and too noisy to leave in the deliverable. It lives in `ROADMAP GENERATION/work/`, three files per track, created before the first entry and read on every entry:

| File | Holds | Written | Read when |
|---|---|---|---|
| `<track>-spine.md` | the families, in spine form (one line per family: lesson range + why here) | PHASE 1 | cutting labels; describing the blocks |
| `<track>-labels.md` | every label, its one-sentence gloss, and its assignment column `→ L<n>` | PHASE 2 | every `teaches:`; every `uses:`/`deepens:` |
| `<track>-items.md` | every vocabulary item with the lesson that introduced it | PHASE 3, as you go | before adding any item, to catch a repeat |

Rules:

- The roadmap file is output, not scratch.  the glosses and the assignment column stay in `work/<track>-labels.md`. A `## Labels` block is optional; if present it holds the pointer line and the counts only.
- The deliverable must validate on its own. `Test-Roadmap.ps1` re-derives the label set from the `teaches:` lines when it finds neither a list nor a ledger, so nothing in `work/` has to be committed with the roadmap. What that costs is one check, the only one that cannot be derived from the entries: a label planned in the work file and taught nowhere. Run the checker while the ledger still exists and that check is live; after the files are gone, the roadmap's own consistency (each label taught once, no forward reference) is all that is left to verify — which is the part a reader of the deliverable can verify too.
- The work files are the source of truth for anything the compiler of this file would otherwise have to remember: a label's gloss, its owning lesson, whether an item has been used before. Memory over 50 lessons silently drifts; a file does not.
- Order of work, once: spine → labels + assignments → `Test-Roadmap.ps1` (labels only) → entries in chunks of 2–3 lessons → `Test-Roadmap.ps1` every ~5 lessons → the hand register audit → final run with `-Report`.

## Check before finishing
- While the ledger exists: the labels work file is filled and every label in it has an assignment; every label used is listed there; every label listed is under some `teaches:`, exactly once. In the shipped file the surviving half is the one a reader can check — each label taught exactly once, nothing used before it is taught.
- The deliverable validates without `work/`. Move the folder aside and `Test-Roadmap.ps1` must still exit 0: the label set is re-derived from the `teaches:` lines. A roadmap that only passes with the build artifacts next to it is not finished.
- No forward reference in `deepens:`/`uses:`; no lesson names its own labels or items there; no item repeated from another lesson without its name appearing in that lesson's `deepens:` line.
- Every teaching lesson ≥10 items: no bare particle, no split chunk, no slot-as-item. Exams 25/45 carry neither `teaches:` nor new items, and their `uses:` is exactly 10 primary labels.
- Every count quoted in `## Decisions` came out of `Test-Roadmap.ps1 -Counts`, not out of memory.
- **Register audit, done by hand:** reread `Examples:` and `Real-world relevance:` in ten lessons spread across the blocks. If fewer than half of them could have been written by the student `<TRACK>-REGISTER.md` describes, in that file's own settings and at that file's politeness ceiling, the tone failed the register file. Rewrite the carriers; the labels were never the problem.
- **The register's required language is in the course:** it appears in `vocabulary:` and/or as labels, finished before the last exam, in more than one lesson and more than one block. None of it anywhere is a critical failure, not a small gap.
- **Nothing in the output names a register:** no `register` label, no `register/*` area, no per-lesson register field, and no `## Decisions` line that assigns a register to a lesson. The tone lives in the words or it does not exist.
- No entry names a page, a class, a width or a section order.
- `Test-Roadmap.ps1 -Path <file> -Report <file>` exits 0. A roadmap that has not been run through it is not finished — most of the failures it reports are cheap at five lessons and expensive at fifty.

# Output to (<TRACK>-ROADMAP.md) - DO NOT MODIFY WITHOUT USER SIGN-OFF

## How to read an entry

   · Focus:    the lesson in one line
   · Teaches:  the labels this lesson explains for the first time
   · Deepens:  labels or items from an earlier lesson that this one takes further, and what is new (in words)
   · Uses:     labels or items from an earlier lesson that this lesson leans on without explaining
   · Vocabulary:  the words and chunks this lesson introduces (two written forms, above), spent in
                  the primary register's favour whenever the topic allows
   · Examples: carriers for the content — suggestions, not a required list, written in the student's
               voice and not the teacher's
   · Real-world relevance: where the student `<TRACK>-REGISTER.md` describes actually meets this — in
               that file's own settings — rather than a linguist's reason for teaching it

## Decisions
   · <ruling> — <why>
   · Tone: the primary register named in the register file is the default for contexts, carriers and
     vocabulary, and the required language that file names is taught in `vocabulary:` and/or labels,
     spread across the course and finished before the last exam — no lesson is ever told which
     register it is in.
   · ...

   One line per ruling a later reader could otherwise re-open: item budget, label budget, exam-uses
   budget, repeated-vocabulary policy, tail policy. Any number quoted here comes from `-Counts` output.

   A ruling settles an ambiguity inside this generator. It may never overturn `<TRACK>-REGISTER.md`:
   "the slang dates fast, so it goes in the tail", "register is context colour", "we kept the
   vocabulary neutral so it ages well", "an exam will never ask for it" are not rulings. Each of them
   is the failure the Register section exists to prevent, and writing one down does not make it a
   decision.

## Shape
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
   · Focus: how to test them, in the same line as what the exam is for — a task per family, crossed
            rather than one label per question
   · Uses: the 10 primary labels, each one a family that must have landed

   Exams carry no `teaches:`, no `Vocabulary:` and no `Examples:`: they add nothing to the course, they
   find out what is missing from the student.
