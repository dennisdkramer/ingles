# Lesson 6 — design (Pass A)

## Core (what the student can do afterwards)
1. Choose **go / come**, **take / bring**, **pick up / catch** by direction — not by translating the Portuguese word.
2. Say where they went and when, with the past form attached to the verb: *I went, I came, I took, I got, I left, I met, I arrived*.
3. Say *-ed* three ways (*stopped* /t/, *arrived* /d/, *started* /ɪd/) and hear the American flap T (*water, better, later*).
4. Place the event in time: *yesterday, last night, two days ago, in 2020*.

## Teaching beats (per core item) and dependencies
- **go leaves, come arrives.** *Go* is movement away from where the speaker is; *come* is movement toward the speaker (or toward the person being spoken to — hence *"I'm coming!"* when you are on your way to *them*). The decision is never about the Portuguese verb; it is about **where the speaker stands**.
- **levar splits into take and bring.** *Take* = away from here; *bring* = to here. **buscar** is *pick up* (collect a thing or a person) and **pegar** (a bus, a train, a cold) is *catch*. Dependencies: *get* was introduced in lesson 1's vocabulary and is now the third member of the set (*get = fetch / obtain*).
- **sair / chegar / voltar are two each.** *leave* and *go out*; *arrive* and *get there*; *come back* (to the speaker) and *go back* (away). One Portuguese verb, two English directions.
- **The past arrives with the verb, not later.** *went, came, took, got, left, met, arrived* are as frequent as their present forms, so teaching the present alone would force a second lesson later for words the student already half-knows. A participle column is shown for shape only (*gone, come, taken, got, left, met*) — the present perfect itself is lesson 20's.
- **-ed has three sounds, decided by the last sound of the verb**: /t/ after a voiceless sound (*stopped, watched, asked*), /d/ after a voiced one (*arrived, called, played*), /ɪd/ after *t/d* (*started, needed, waited*) — the only case that adds a syllable.
- **Spelling is mechanical**: +ed, *e* → +d, consonant + *y* → -ied, short stressed syllable → double the consonant (*stop → stopped*).
- **Time words carry the tense** so the student does not need to conjugate to signal the past: *yesterday, last night/week, two days ago, in 2020*.

## Situation
The morning after a business trip: the student tells a colleague where they went, who they met, what they took and when they came back — and hears the same story told back faster.

## Candidates (three channels)
- **Heard — the voicemail.** A four-line voicemail about a trip (audio only): the student ticks who went where and when.
- **Done — the trip map.** A simple map with arrows (here → the client → the airport → home); the student writes one sentence per arrow, choosing go/come and take/bring by the arrow's direction.
- **Read — the reimbursement form.** A short expense note in the past; the student rewrites it as a spoken summary.

## Chosen
**Done (the trip map), entered through Heard.** Direction is a spatial decision, and a map with arrows makes the decision visible before it is verbal — the student stops translating "levar" and starts asking "away from here or toward here?". The voicemail then proves the choice in fast speech. The form is the weakest entrance at this level (it reads like paperwork and hides the direction).

**First 30 seconds:** a phone rings; one line plays (*I'm coming!*) and two arrows appear on the map; the student clicks the arrow that matches. No rule yet.

## What the student produces (evidence)
Six direction choices, eight past forms written from the infinitive, six *-ed* sound classifications, a trip narration of four sentences written then recorded, and a quiz on all four behaviours with no reused item.

## Conflicts, and how I resolved them
- **A participle column is a preview of the present perfect (lesson 20).** Resolution: the column exists only to show the **shape** of the system, is labelled as such, and only one recognition contrast (*I went / I've gone*) is used — no present-perfect production anywhere.
- **The past is a big topic for one session.** Resolution: the past is taught **only for these verbs** (the movement set), with the -ed machinery attached to them; other verbs and the full past system are not opened here.
- **Flap T could belong to the sound lessons.** Resolution: it is taught here because it *is* the /d/ sound of these very words in American speech (*called, arrived*); the consonant map stays in lesson 10.

## Shape of the session (what is met, in what order)
1. **O mapa** — the entrance: two arrows, one line of audio, one click; then go/come laid out by direction.
2. **levar, trazer, buscar** — take/bring/pick up/catch as the same direction decision.
3. **sair, chegar, voltar** — one Portuguese verb, two English directions.
4. **O passado chega junto** — present / past / participle for the whole set.

## Pass B — build notes (2026-11-03, page generated)

Page: `business/lesson6.html` (+ identical `.edit.html` sidecar).
Sections: 1 O mapa (go/come entrance) · 2 levar/trazer/buscar · 3 sair/chegar/voltar · 4 O passado chega junto (present·past·participle) · 5 O -ed e seus três sons + flap T · 6 Palavras do passado · 7 Treino · 8 Quiz.

### Decisions taken inside the design (Pass B, recorded per §4)
- **The map is two audio cards with two arrows**, not a drawn map: the direction decision is the whole exercise, and two arrows already carry it.
- **§4 shows the participle column with the label "reconhecer"** so the preview can never read as a lesson requirement; the single *I go / I went / I've gone* clip is the only place the form is heard.
- **`travel` (US `traveled`) is used as the counter-example of doubling** because it is true and it teaches the *reason* (stress position) rather than a letter rule.
- **The quiz keeps a written group** (`Escreva em inglês`) so the past is produced, not only recognised.

### Width decisions
- §4 past table — full `.chart` (5 columns).
- §5 three -ed sounds — `itemrow[data-cols="3"]`: *divide* one ending into its three sounds.
- §7 B+C and Quiz B+C — `itemrow[data-cols="2"]`: adjacent compressible groups.
- §2/§3/§6 tables — full `.chart` (4–5 columns).

### QA
`node qa/content.mjs 6` ✅ (chart 6 · panel 15 · listen 40 · gap 44 · radio 60, no anchor hints) ·
`node qa/width.mjs 6` ✅ · `node qa/overflow.mjs 6` ✅ clean (27 blocks).

5. **O -ed e seus três sons** — spelling first, then /t/ /d/ /ɪd/, then the flap T.
6. **Palavras do passado** — the time words, and the sentence frame they make possible.
7. **Treino** — forms, direction, sounds, narration, recording.
8. **Quiz — sem consulta.**

## Notes for the build pass
Portuguese for the explanation; every arrow decision has audio on both options; the past forms are always shown in a three-column table (present · past · participle), never alone; the -ed sounds are trained on these verbs only.

