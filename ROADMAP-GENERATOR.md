## ROADMAP-GENERATOR

# What this produces

A `<TRACK>-ROADMAP.md` for one track: what is taught at which lesson, and which lesson owns each thing, so that nothing is taught twice and nothing is used before it is taught. Pass A writes one lesson from one entry.

# Process

## INPUT AND OBJECTIVE
- Inputs: `PEDAGOGY.md` + `<TRACK>-REGISTER.md` . Withheld: designs, pages, `FORMAT.md`, `FUNCTION.md`, other tracks' roadmaps.
- One entry per lesson, 1–50. 25 and 45 are EXAMS and their entries here should be summary explanations of how best to test the student's skills with the most important learned concepts up to that point.

## Register
- Do not use 'Register' as a label inside lesson content - (use formal/casual axis)
- Never assign a register to a lesson.
- Register guides which concepts are included in the curriculum and their contexts and vocabulary

## PHASE 1 — THE SHAPE
The whole course in broad strokes, before any label exists. Nothing here is a per-lesson task; it is the frame the lessons get cut from. Write the result into the file's `## Shape` block.

1. Place the fixed points. Lesson 1 + 2 are not free — `PEDAGOGY.md` pins their content. 25 and 45 are exams. 46–50 is the tail after the last exam: only what nothing later depends on.
2. State both ends in what the student can do — `Start:` and `End:`, one sentence each. `PEDAGOGY.md` fixes who is entering.
3. Inventory the concepts the course owes. Every mechanism, contrast and rule `PEDAGOGY.md` names is one the course must teach; add what this track's persona must be able to do. Group them into families.
4. Order the families onto 1–50 by `PEDAGOGY.md`'s difficulty model, written as a spine: one line per family — its lesson range and why it sits there. Judgment is cheap here and expensive once labels exist.
5. Describe each block by what the student can do unaided at its end: block 1 (1–24) leaves it done; block 2 (26–44) assumes that and adds; 46–50 assumes both. A block you cannot describe means the spine is mis-cut — cut again.
6. Read the spine back: nothing is spent before it is placed, and nothing held for the tail is needed earlier.

## WHAT A LABEL IS
- One thing the student must be told here that they were never told before: one rule, one contrast, one mechanism — statable in 1–2 sentences, then drilled. It is the unit a lesson owns.
- Not a label: a lesson title, an activity (roleplay, quiz, listening), a text or topic (small talk, business email), a word or chunk (→ `vocabulary:`), register (→ the formal/casual axis), anything already taught (→ `deepens:` / `uses:`).
- Word or label? A translation gloss settles it (`"depend on"` = *depender de*) → vocabulary. It needs a rule stated before the student can use it → label.
- One label or two? A student must be able to fail one and pass the other. Nobody could fail A while passing B → one label. One label needing two separate drill sets → two labels.
- A tense is a family, not a label: `past-simple/was-were`, `present-simple/facts-not-now` are labels; `past-simple`, `present-simple` are not.
- Naming: `<area>/<thing>`, third part only to slice one thing across lessons. Choose the areas once and reuse them — never a second name for an area already in use.
- Each head-list line is one plain sentence saying what the label is. If that sentence cannot be written, it is not a label.
- Decide a lesson's labels by asking what must be told for the lesson to work, then running each answer through the tests above. Vocabulary noticed along the way goes to `vocabulary:`, not here.

## PHASE 2 — THE LABELS
1. Cut the spine into labels, family by family. A family that cannot hold its weight as a label was never a concept — take it out of the spine; a family that needs more room gets split, never a wider label.
2. Write `## Labels` in full — lowercase, `-` inside a part, `/` between parts, at most 3 parts. It is the only legal source: no label used in an entry that is not listed there.
3. Assign every label to exactly one lesson under `teaches:`. Where two lessons look like they both teach it, the earlier keeps it and the later gets a `deepens:` line naming what is new, or a `uses:` line that says nothing more.
4. A split topic is two labels (`sound-work/inventory`, `sound-work/contractions`), never one label in two lessons.
5. Calibrate: 3–6 labels under each `teaches:`. Fewer = a chapter, not a lesson. More = a drill, not a lesson.
6. Every family in the spine is taught somewhere. If one is not, the labels are wrong — not the spine.

## PHASE 3 — THE ENTRIES
1. `deepens:` and `uses:` point only at lower-numbered lessons.
2. Fill `vocabulary:` — at least 10 items per teaching lesson. Single word in plain form (`prices`→`price`, `went`→`go`); fixed chunk exactly as taught, head verb in base form, in double quotes (`"depend on"`, `"up from"`). Anything with a slot is a label, not an item. Never a bare particle (`up`, `on`, `with`) as its own item. Parentheses only to separate two senses (`"bring up" (raise a topic)`); a usage note is never in `vocabulary:` — it becomes a label (`contrast/...`) or is carried in `Examples:`.
3. Exams 25 and 45 own no `teaches:` and add no `vocabulary:`: `Focus:` says what they test, `uses:` names the labels drawn on.

## Check before finishing
- `## Shape` is filled: Start, End, block names, one spine line per family, every family taught somewhere.
- Every label used is listed; every label listed is under some `teaches:`, exactly once.
- No forward reference in `deepens:`/`uses:`; no item repeated from another lesson without a `deepens:` line for it.
- Every teaching lesson ≥10 items: no bare particle, no split chunk, no slot-as-item. Exams 25/45 carry neither `teaches:` nor new items.
- No entry names a page, a class, a width or a section order.

# Output to (<TRACK>-ROADMAP.md) - DO NOT MODIFY WITHOUT USER SIGN-OFF

## How to read an entry

   · Focus:    the lesson in one line
   · Teaches:  the labels this lesson explains for the first time
   · Deepens:  labels taught in an earlier lesson that this one takes further, and what is new
   · Uses:     labels taught in an earlier lesson that this lesson leans on without explaining
   · Vocabulary:  the words and chunks this lesson introduces (two written forms, above)
   · Examples: carriers for the content — suggestions, not a required list
   · Real-world relevance: what makes the item worth knowing in the context of the track
   · Generation: build instruction or hold note for this page

## Shape
   · Start: what the student can do at lesson 1
   · End: what the student can do after lesson 50
   · Blocks: 1–24 <name> · 25 EXAM · 26–44 <name> · 45 EXAM · 46–50 <name>
   · Spine: <concept family> — lessons N–M — why here

## Labels
   · <area>/<thing> — one plain sentence saying what it is
   · ...

## Lesson 1: <title>
   · Focus: ...
   · teaches: ...
   · Deepens: ...
   etc..
