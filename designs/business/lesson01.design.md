# Lesson 1 — design (Pass A)

## Core (what the student can do afterwards)
1. Introduce themselves and say where they are from, with the subject always spoken: *I'm Ana. I'm from Recife.*
2. Name things with the right article by sound: *an email, a desk, a university*.
3. Say the time, the weather and the day with *it*: *It's nine. It's raining. It's Monday.*
4. Land the two habits that decide whether a Brazilian is understood: the final consonant stops clean (*desk*, not "desk-ee") and *p/t/k* come out with a puff; and the ear starts to separate /ɪ/ from /æ/ (*sit* / *sat*).

## Situation
First morning at a new job: four introductions at the door, a desk, and someone asking "where are you from?" and "what time is it?".

## Candidates
- **Heard — four doorways.** Four two-line introductions at the door (audio only: name, city, job). The student ticks who is from where, then imitates the one they liked.
- **Done — the badge wall.** The student builds a badge for themselves and for the four people they just met (name + job + city), then labels the objects on the desk from a photo wall (*a/an*).
- **Read — the welcome note.** A one-paragraph welcome note using *be* and *it*, read and rewritten in the first person.

## Chosen
**Done (the badge wall), with Heard as the entrance.** At A0 the only content the student already owns is their own identity and what is in front of them: a badge makes the target sentences true of them within twenty seconds, and *a/an* becomes a physical decision (a badge → an ID badge). Reading a note is the weakest candidate here because decoding English text is exactly what an A0 student cannot yet do.

**First 30 seconds:** the page plays *"Hi, I'm Marina. I'm the new project manager."* and asks only for the student's own name in a box. The subject rule ("in English the subject is never hidden") lands *after* they have already said it right.

## What the student produces (evidence)
Typed badge lines (name/job/city), *a/an* choices, four listen-and-tick items, a 1-sentence recording (*"Welcome! I'm ___, the new ___."*), then a quiz that re-tests all four core behaviours without reusing the training items.

## Conflicts, and how I resolved them
- **The entry asks for /ɪ/ vs /æ/ *and* the six stops *and* the final consonant, all in lesson 1.** At A0 that is three sound topics in one sitting. Resolution: the six stops are *presented* through words the student is already producing (badge, city, desk) — no separate consonant section; /ɪ/ vs /æ/ gets one 8-item listen-and-choose; the final consonant gets the "badge test" (say your job, not "manager-ee"). Flagged because it trades coverage for retention — the owner may prefer all three at full length.
- **Recording at A0 can embarrass an adult.** Resolution: one sentence only, chosen from two options, with the model audio played twice before recording.

## Notes for the build pass
Everything in Portuguese except the target sentences and their audio; one small *be* block, no larger tables; audio on every target line; the badge is the page's spine, not a decoration.

### Owner revision (2026-11-03) — the opener states the teaching intent
The opener was first written as an activity preview (`Abertura: … ouça ▶, repita, grave ⏺` + the site's notebook legend, copied from the kids page). Owner correction: it must say WHAT the lesson installs, and the `be` = *ser* + *estar* mapping is the point a Brazilian A0 student needs first. Now: "O que esta aula instala:" → the three target strings (the fixed facts = *ser*), the subject law, the state use (`I am hungry` = *estou com fome* — one verb where Portuguese has two), the sound law. The new `#barhelp` shell line carries the tool explanation, so no lesson prose describes the site. The ser/estar contrast is trained too: a chart row + merged note in §3, two gap items, and a Quiz C item. The generalized rule now lives in FORMAT.md ("Lesson opener (abertura) — contract").

## Pass B — build notes (2026-11-03, page generated)

Page: `business/lesson1.html` (+ identical `.edit.html` sidecar). Sections: 1 Quatro portas (the Heard entrance) · 2 O seu crachá (the badge wall, the spine) · 3 O sujeito nunca se esconde (be) · 4 a/an by sound · 5 O coringa it · 6 Sound Lab · 7 Treino · 8 Quiz.

### Decisions taken inside the design (Pass B may merge/split/reorder for the teaching beats)

- **A compact "a letra não manda no som" beat opens the Sound Lab** (A: cat · cake · car · about; O: go · good · who). It is the mental model that makes §4 (a/an decided by sound) true, and it is in this lesson's roadmap `Content:`. The conflict note above only resolved the *three* extra sound topics, and those are honoured exactly as resolved.
- **The six stops stay folded into (c)** — one explanatory line (p/t/k as the voiceless twins of b/d/g, aspiration at the start of a syllable), no separate consonant section.
- **The pair test uses eight clean /ɪ/ vs /æ/ pairs**: sit/sat, hit/hat, big/bag, fit/fat, did/dad, pin/pan, list/last, patch/pitch. `man/men` and `ship/sheep` were dropped — they are /æ/ vs /e/ and /ɪ/ vs /iː/, so they would drill the wrong contrast in this lesson.
- **Recording stays one sentence, two options, model played first** (conflict note): §2A and §8D.
- **The badge's cargo card asks for the article** (`I'm a/an ____`) instead of hard-coding `I'm a`, which would have taught *I'm a engineer*; its hint names both models (a designer / an analyst) and §4 explains the rule.
- **The quiz never reuses a training item**: be-practice tests am/is/are in one set of sentences and the quiz in another; the translation works the same behaviour through different sentences (Ela é engenheira / Nós somos analistas / Está quente hoje).

### Width decisions (FORMAT requires the reason here, not in the page)

- §1 doorways — two `itemrow[data-cols="2"]` rows: *compare* four introductions that differ only in name, city and job.
- §2 badge — one `itemrow[data-cols="3"]`: *divide* the badge into its three fixed slots (nome / cidade / cargo).
- §3 be and §4 a/an — `itemrow[data-cols="3"]`: *contrast* the three be forms (I am / he·she·it is / you·we·they are) and the three article cases (a / an / the traps).
- Everything else is full width (`.panel itemsize`, `.chart`, `.card`): one teaching object per block, no row.
- **Slot saturation, not width**: the long fill-in lists (be, a/an, it's, quiz) are `.blanks.sent.cols` (two columns) rather than four, because a four-column 268px cell could not hold prompt + blank (measured in real Chrome: up to 356px of content). The /ɪ/ vs /æ/ items keep both options in the `.qline` beside the stem because `.qopts{justify-content:space-between}` spread a two-option pair across the full 1200px and destroyed the pair.
