# PEDAGOGY-MAP — COURSE ROADMAP

## TRACK - Student Persona & Goals - The 3 utilized [Registers] for each track - The Contexts that they should be used in. 
### For any generated content: its socio-linguistic context defines its register as one of its TRACK's three context-dependent register options.

1. BUSINESS TRACK - A Working adult who needs to communicate in meetings or a university setting. They may be a Researcher, an IT professional, an Engineer, or they may want to learn a more professional-sounding version of english for personal reasons. They value analysis and problem-solving. They have busy lives and value tangible progress.
   a) [Confident and direct business-casual with context-aware formality]
      - Normal interactions with family, coworkers, managers, clients, and service interactions. 
   b) [Colloquial adult peer-to-peer speech]
      - Neutral communication with close family/friends/partners.
   c) [Candid and uninhibited adult informal] - Include common slang, swears, touch on AAVE (eg. 'aint'),  Colloquial text-speak (eg. wtf, lol), 'youth' slang (eg. "That's cooked").
	  - Expressing anger, contempt, sarcasm, humor, dismissiveness/blunt phrasing ("Yeah, whatever..").
	  - Included as sidenotes accompanying equivalent [business-casual] or [peer-to-peer] phrases.
	  
2. KIDS - A 14 year old boy. Preference for novelty, silly stakes, visible progress. Short attention span.
   a) [Colloquial adolescent casual but respectful]
      - Default (with strangers, parents, teachers)
   b) [Colloquial adolescent peer-to-peer speech]
      - With friends or peers in school environment
   c) [Informal - Memelord/Rizzlord]
      - With close friends, casual environments, online chat

3. ADULT - Culture and real life are the hooks; self-expression matters more than accuracy drills- goal of understanding AAVE and music. Swears and dirty language must be taught as a core element of the course, but may be censored according to model judgement ('f---', 'shi-', 'c---', etc..)
   a) [Colloquial adult peer-to-peer speech] - (includes 'mild' swears eg. 'bullshit', 'that sucks', 'he's an asshole')
      - Default
   b) [Candid and uninhibited adult informal] - (Includes any commonly used adult language)
      - With friends, family
   c) [Uninhibited informal, raunchy and with street slang] - (when appropriate this register includes and explains the most taboo language in modern use, including slurs - and teaches the student if and when they should use or NOT use them. )
      - In appropriate 'street' environments or with closest friends, romantic partners, joking, angry, etc..


## LESSON GENERATION (BINDING PROCESS)

### 1. Two passes, with a barrier between them
**Pass A — design.** Inputs: this lesson's entry, a high-level understanding of the lesson's place in the overall plan, and minimal details of its adjacent lessons to optimize flow and reduce redundancy; the track persona; the student's level. Deliberately **withheld**: FORMAT.md, FUNCTION.md, the archived lessons, the primitive inventory (the class/component vocabulary) and the PAGE of every other lesson. Framing for the pass: *"You have no page, no classes and no build mechanics. You have a concept, a student, one session, and the world outside — and you decide what the session is made of and in what order."* Pass A **may say what FORM a piece of teaching wants** — a table to compare forms, a dialogue to hear, a listen-and-tick, a box to record, a chart of minimal pairs: naming a content type is a pedagogical recommendation, not page mechanics. It must not name classes, ids, widths or block layout. Output — `designs/lessonNN.design.md`:
   - the **core**: 2-4 things the student must leave able to *do*, phrased as skill/behaviour - not as a topic- and:
		a)*teaching beats* (per core item: what the student must be told, 1–2 sentences) and 
		b)*dependencies* (every form and word used → taught where, or marked as intentional inference)
   - the real situation in which that core is worth having;
   - a **`band:` line the build reads** — `band: <track> · L<NN> · C<CC> (content level) · registers: <1a/2b/3c …> ·
     contexts: <the fields the examples may use>`. It is the design's record of the §1 register choice and of the level
     pair the §4 language rule runs on; it is not an extra rule.
   - **three candidate (lesson) experiences, from three different channels** (heard / seen / done / read / said);
   - the chosen one, why it beats the others *for this student*, and what the first 30 seconds feel like;
   - what the student produces, what evidence it leaves, and any conflict with the defaults below;
   - **the shape of the session**: what the student meets first, second, third — how many sections, their order, where content is better read side by side than in sequence, and which content type each section wants where that matters. The shape must be recognisably **a lesson page of THIS site** — one column of sections under a single title, opening with a short statement of what the lesson installs, ending with practice and a no-consultation quiz — and free in everything inside those guardrails (section count, order, internal divisions, which sections are heard / spoken / read / done). A shape that could not be reconciled with the site's shell is a defect of THIS pass, not of the build.
**The shape is IMAGINED, not inherited.** Which sections the lesson has, how many, in what order, and how each divides its content is invented fresh in Pass A for THAT lesson — from its design, not from a template and not from another lesson. "The previous lesson did it this way" is not an input. **Copying a shape is allowed when the user asks for it**, and only then; copying one uninvited is a generation error. The archived / parked pages are **untracked and gitignored**: they must never be opened, read or used as a reference (owner instruction 2026-11-03). `style.css` is implementation only: the build may read it for an *implementation* question (which class or knob does what) — never to decide content or shape.
**Pass B — build.** Inputs: the design (including its shape) + FORMAT.md + FUNCTION.md + **§3–§7 of this file** (the non-negotiables, content-authoring rules, level checkpoints, vehicles and site contract are build inputs, not background) + this lesson's roadmap entry + the redundancy check described below. The build is a **synthesis, not obedience**, and the feedback path is three-tier: (i) a purely mechanical realisation — how the shape is built with the available blocks — is Pass B's call, no escalation; (ii) a change that alters the shape or one of the design's teaching beats is made and then **written back into the design file** (§4); (iii) a conflict or ambiguity that cannot be resolved that way is escalated (§2). Pass B never silently contradicts a teaching beat, and it may not replace the design's shape on its own authority — only when the user instructs it, or after repeated failure to generate or implement that shape (in which case it proceeds, records the change in the design file, and does not escalate).
   - **No other lesson's PAGE is read.** Redundancy and flow are checked against structured extracts only: the neighbouring lessons' roadmap entries (`Content:` / `Key vocabulary:` / `Focus:`) and the vocabulary/concept inventory (`VOCABULARY.md`). A page read is a shape absorbed, and no wording can un-read it.
	
### 2. ESCALATE / CONFER
	- Existing plans, content types, and examples are **defaults that a better idea is expected to beat**. A plan that suggests substantive changes to the lesson contents or new designs/functions is presented to the owner for approval, feedback, or veto before it is executed.
	- Conflicts and uncertainty always trigger escalation: **stop, present the idea, name the conflict, propose the resolution.** Never squash the idea to fit a rule, and never silently comply with the rule either.
   - Limit [attempt quantity / time spent] on reconciliation and/or problem resolution. maximum of 3 attempts to solve the same/similar/connected problem(s) without significant progress. After third attempt, log in ISSUES.md and skip to next section/lesson/subtask batch as appropriate.
	- If a rule would have blocked something better, that's an escalation, not a workaround (the mirror image of §2).
	- Handling depends on scope of elements involved in any escalation/conflict: 
		a) Planning/Content/Vehicle for a single section which does not interfere with successful generation of other sections -> (concise explanation of escalation and next-step recommendation appended to lessonNN.design.md - Affected content skipped, task processing continues)
		b) Conflict is limited to content of one specific lesson, but [more than one section is affected or risks being degraded] -> (escalation elaborated in lessonNN.design.md, task skips to next requested lesson generation if applicable)
		c) Any issue that effects the content of multiple lessons or generation in general - (task is immediately paused to confer with the user)

### 3. Non-Negotiables
	- the page runs on the site: mechanical skeleton + deliverable state the engines can read (FORMAT.md, FUNCTION.md);
    - every factual claim is true and defensible — never pad a section with an unverified assertion.
    - **language and register** are each decided by one rule (§4, §1): an [introduction · explanatory text · tip ·
      headline · column header] may be in Portuguese only if its parent [LESSON NUMBER] < [CONTENT LEVEL]; Portuguese
      in any other content type only when *defensibly optimal for teaching purposes* to do so; and the socio-linguistic
      context of any content fixes its register as one of its TRACK's three options. Nothing else governs either.

### 4. CONTENT AUTHORING
	a) Restructuring Pass A is allowed: Pass B may merge/split/reorder to serve the teaching beats, writing changes back into the design file; escalation is for unresolved *conflicts* only.
	b) Explanatory layer may live anywhere__: lead, chart cell, an extra explanation column, a `tr.note` row. A chart is a teaching device, not a display device.
	c) Every (word/new form) the student must understand is [taught or glossed inline in PT] before it is used, else removed; if a block wants the student to *infer*, the page says so.
	d) Coverage ≠ section plan__: a roadmap item doesn't get its own h2 unless it earns one.
	e) No budget ≠ no depth__: length is not a proxy, and enumeration is not depth.
    - Never show the answer in a prompt; a hint may only be in the language the student is not producing.
    - No copy-exercises: the student produces from memory or meaning, never transcribes the prompt.
	f) Coverage of a concept or vocabulary class must not be redundant with a prior lesson: a topic returns deeper, wider, more natural or more register-appropriate — never as the same explanation and the same drills.
	g) Teach in context, in phrases, inside a scenario, dialogue or story — not isolated glosses.
	h) Whenever feasible(sanity check the existance, relevance, appropriateness, and accessability of each), teach the rule, the reasoning(the mental model), and its direct consequences (integrated with the lesson content or in its own section as apppropriate); say plainly when [there is no clear or consistent] [rule and/or reasoning]. 
	i) Each item carries the condition that decides it (a gloss that could go either way is not an item).
	j) False cognates (eg. 'pretend' -X- 'pretender' -> 'intend') and words which [in one language cleanly map onto] [more than one word in the other] (eg. 'live' -> 'morar' / 'viver') are presented together with these characteriscs [shown/explained/demonstrated as appropriate].
	l) Practice trains the lesson's concepts in conceptually distinct blocks, inline with what they train and/or in a penultimate section. The last section is a quiz that tests all of it — it may echo the training, never copy it.
	m) Multiple-choice options are shuffled so the right one is not always in the same slot.
	n) Boilerplate & filler are last resorts.
		
		#### Lesson Length / Content Quantity
	o) Never compress, summarise or omit an item to fit a page.
	p) There is no cap on sections, tables, examples, exercises, dictation lines, recordings or quiz items, and no page-length limit. 
	q) All primary concepts and specific items suggested by the entry must be appropriately explained and trained *in its own lesson* — explain → show → recognise → produce → test.

		####  Vocabulary - (`Key vocabulary:`)
	r) Each lesson must present at least 10 new vocabulary items which are relevant to and may overlap with the other teaching needs of the lesson (eg. a lesson teaching modes counts "would" as a vocabulary item).
	s) Vocabulary lists are SUGGESTIONS, which must be analysed and grouped by function, teach inside phrases, drill and recycle as appropriate

		####  WHEN TO USE PORTUGUESE
	t) Explanations go in English when the student at that level can read them, and in **concise** Portuguese when they cannot — compare the student's level with the level *that particular text* demands, sentence by sentence. 
	u) Portugues use Phases out smoothly as english proficiency increases. the following are checkpoints, not partitions: the student is somewhere on a continuous ramp, the lesson number only names roughly where the ramp has reached.
      - **Language rule — the only one.** For any generated [**lesson introduction, explanatory text, tip, headline, or
        column header**]: it may be in Portuguese if its parent [LESSON NUMBER] < [CONTENT LEVEL] (§5 x). Portuguese
        within other content types — a vocabulary list with its Portuguese translations, an English phrase with its
        Portuguese phrase below it, a law box, a note row, an answer hint — is included ONLY when *defensibly optimal
        for teaching purposes* to do so.
      - **The lesson number is the lever, not a quota.** N rises and C does not follow it: at lesson 5 almost every
        explanation has C > N and Portuguese is everywhere; at lesson 40 only genuinely hard content still clears
        C > N, so PT explanations become rare — while a word list with its translations, or an English phrase with the
        full Portuguese phrase under it, may still appear, because those are other content types judged by
        defensibility, not by level.
      - **Nothing counts.** No word counts, sentence counts, percentages, per-section quotas or length ceilings.
      - **Marking is formatting, not budget.** Portuguese is always italic and always marked `lang="pt"` / `.pt` /
        `.ptw` (FORMAT), so it reads as Portuguese to the student and to the author.


### 5. LEVEL -
 	v) "STUDENT LEVEL" = [Current Lesson #] = "LESSON DIFFICULTY"
   w) "LEVEL APPROPRIATE" = [STUDENT LEVEL ± 5] - ("appropriate"/"appropriateness" [must be clearly understandable as a specific characteristic defined by its parent phrase/context] ELSE = [LEVEL APPROPRIATE])
   x) "GRAMMAR LEVEL"/"CONTENT LEVEL" = two scores, never one:
      G = grammar level — structure only, ignore meaning: 1-10 one clause in a base tense; 11-20 two clauses joined, or
          one clause out of base order (question, negative, there is); 21-30 one subordination or one non-base form
          (relative, perfect, going to, modal); 31-40 two of those at once (passive, reported, conditional); 41-50 three
          or more, or embedding past one level (nominalisation, fronted inversion, mixed conditional).
      C = content level — the ideas only, ignore the grammar: how much the sentence asks the student to hold, relate or
          infer. 1 extremely simple, 50 complex and/or opaque to the learner.
      Cross-check both with [1 + 49 * ln(P) / ln(100)], P = [ASSESS PERPLEXITY SCORE OF PHRASE] clamped to 1..100, so
          P=1 gives 1 and P=100 gives 50 (ln(1)=0, so the divisor is plain ln(100)). Score the whole phrase, not its words.
   y) "VOCABULARY LEVEL" = intuition, 1 (extremely simple word/phrase/idea) to 50 (extremely complex, unusual or opaque
          to the learner), CHECKED against the frequency band of its content words (function words don't count):
          rank   1-250 | 251-750 | 751-2,000 | 2,001-4,000 | 4,001-7,000 | 7,001-12,000 | unlisted, jargon, idiom
          V      1-8   |   9-15  |   16-24   |    25-32    |    33-40    |    41-46     |    47-50
          Intuition and band disagree by more than 5? Say why in the design file (idiom, false friend, transparent
          technical term), otherwise use the band's midpoint. The band is the check; intuition does not override it silently.
   z) Page check: median G, median C and median V each inside N ± 5 (w), with at least two items at N+1..N+3 — a page
          that passes only because ±5 is wide is flat, not appropriate.
    
  

### 6. Vehicles
Any vehicle is allowed: authored text, dialogue or chart; real material (song, clip, article, document, photo); interactive (game, timed drill, role-play); a project; something nobody has tried yet. Two tiers decide how it gets built:
   - **Tier 0** — existing primitives (FORMAT.md): tables, cards, dialogues, audio chips, gap-fills, multiple choice, recording, text boxes.
   - **Tier 1** — one *generic* engine, then free with per-lesson data: `shootPair` (two targets, one right), `sortOut` (buckets), `raceClock` (timed drill), `revealGrid` (memory), `orderLine` (sequence). Novelty should be parameterised, not bespoke: a new game is usually item data + a skin on an existing engine. New Tier-1 engines are proposed to the owner and built once, then reused.
   - **Tier 2** — bespoke simulation or multi-step project: propose it, don't build it unbidden.
Referencing material instead of embedding it is fine (a song named by lyric, "go and listen to it"); a *link* that ships must resolve, and the section must still teach if it dies.

### 7. Site contract (mechanical)
   - Publish `<lesson>.html` **and an identical `<lesson>.edit.html`**.
   - Authored content sits in `.content-area` under one `<h1>` — that heading is the title `build-lessons.mjs` reads.
   - Navigation is purely sequential (`← Last` / `Next →`); there is no lesson count anywhere.
   - Exercise state must land on `input.gap`, `input[type=radio]` or a non-feed `textarea` — that is what persists (FUNCTION.md). If Pass A suggests a new exercise type that conflicts with this, escalate per #2.
   - `data-say` carries how a line is **said**, not how it is written; `npm run build:audio` renders the clips.
   - Shell, classes and sizing: FORMAT.md. Behaviour, engines and edit mode: FUNCTION.md.




## BUSINESS TRACK:
### Field key:
   · `Content:`  everything the lesson teaches, as one merged entry — former "Add" notes live here too, under the concept they belong to
   · `Examples:` / `Key vocabulary:`  suggestions, include as appropriate
   · `Focus:`  the lesson in one line
   · `Advanced element:`  the extra depth the lesson earns when there is room for it
   · `Professional relevance:`  where the working context is what makes the item worth knowing
   · `Sequence:`  marks a topic deliberately taught across more than one lesson: which slice this lesson owns, and what the other lessons must leave alone
   · `Exit criteria:`  what the student can do when a block closes
   · `Note:`  caveats for generation: what a neighbouring lesson owns, and what this page must not teach
   · `Generation:`  build instruction or hold note for that page


1. **Lesson 1: Introduction to Sounds & the Sentence Skeleton**
   * Content: the subject is always named (I am from Brazil, never "Sou do Brasil"); be am/is/are; a/an decided by sound (a university, an hour), with everyday objects as the carriers; vowels have no fixed sound (A: cat/cake/car/about · O: go/good/who), the first contrast /ɪ/ vs /æ/ (sit·hit·fit vs cat·hat·mat), the six stops p/t/k and b/d/g as voiceless/voiced pairs, aspiration of p/t/k at the start of a syllable, and the final consonant cut off (cat, dog, car, tree — no extra vowel); the joker it for time, weather, day, distance and temperature (It's 8pm / raining / Monday / far / hot).
   * Focus: first talk + the first phonetic law (sound is not letter).

2. **Lesson 2: The Cognate Fast Lane**
   * Content: the suffix code (-ção → -tion, -dade → -ty, -mente → -ly, -ado → -ed, -ivo → -ive, -mento → -ment, -ista → -ist); the cognate is not always the word people use (photograph → photo, telephone → phone, television → TV, automobile → car, profession → job); false friends (actually, pretend, push, assist, lunch, college); word stress inside the cognates (-TION, -SION, -ITY, -IC always stress the syllable before the suffix: PHO·to·graph → pho·TO·gra·phy → pho·to·GRAPH·ic, and the stress often lands elsewhere than in the Portuguese word); the short vowels in /p/ pat-pet-pit, /t/, /k/ cat-cut-cute; "one strong syllable, the rest relaxed" as the first taste of the stress work in lesson 10.
   * Focus: instant vocabulary + the stress rule it brings for free.

3. **Lesson 3: Question Words & Polite Questions**
   * Content: wh- words with be (what, where, when, who, how, why); the embedded (polite) question with statement order (Can you tell me where the office is?); repair phrases (Sorry, could you say that again? / I didn't catch that), which come back as a full skill in lesson 44; the pronunciation of the set — /w/ as the "uai" glide (what, where, when, why), who with plain /h/ and no /w/, how; what vs that and where vs there as the pair that is easiest to confuse; the six words kept as the highest-frequency words of the language.
   * Focus: asking, and the /w/ sound.

4. **Lesson 4: Simple Present — usage & the -s**
   * Content: what the simple present does (habits, facts, routines) and does not do (past, "now"); the -s of he/she/it (+s, +es, -ies, have → has); affirmative sentences; the present continuous (am/is/are + -ing) as the "now" counterpart, so I work vs I'm working are born together; the coffee-shop scenario and its set (coffee, latte, espresso, barista, order, menu, sugar, milk, cream, to go, here, now); -ing/NG as a nasal with no hard "g"; the frequency words previewed (always, usually, often, sometimes, never) for lesson 8.
   * Focus: the simple present / present continuous pair.

5. **Lesson 5: Do-Support & the Word Order**
   * Content: the fixed order and the [mode] (auxiliary) slot; do/does in questions; short answers (Yes, I do / No, she doesn't); don't/doesn't and where the -s goes; do as a main verb (What do you do?); the skeleton subject + [mode] + verb + rest named once, here, with the promise that every later operator (be, have, will, would, can, should) reuses the same slot — so the later lessons only swap the operator.
   * Focus: the skeleton that carries every other tense.

6. **Lesson 6: Workhorse Verbs — Movement & Transfer (with their simple past)**
   * Content: go vs come; "levar" → take / bring / take (time); "trazer" and "buscar" → bring / pick up / catch; the sair, chegar, voltar, entrar sets; the simple past of exactly these verbs taught next to their present forms (go → went, come → came, take → took, get → got, leave → left, meet → met, arrive → arrived, go out → went out, come back → came back); the +ed spelling rules (+d, consoante + y → -ied, double consonant) and the three sounds of -ed (/t/ in stopped, /d/ in arrived, /ɪd/ in started) plus the American flap T (called); the past time words (yesterday, last night/week, two days ago, in 2020); participles and the present perfect only as a primer — a participle column in the table (gone, come, taken, got, left, met) and one contrast block (I go / I went / I've gone) so the shape of the system is visible, while the simple past stays the only tense in use (the present perfect stands on its own in lesson 20); the frequency argument behind the merge: went, came, took and got are as frequent as go, come, take and get, so the pairs are learned together.
   * Focus: movement verbs in present and past, learnt as one unit.

7. **Lesson 7: Workhorse Verbs — Action & Communication (with their simple past)**
   * Content: say / tell / talk / speak; wait / expect / hope; think / find; pay / cover / charge / spend / waste; miss / be missing / be short of; their past forms in the same breath (say → said, tell → told, speak → spoke, think → thought, find → found, pay → paid, spend → spent, wait → waited, hope → hoped); the /t/ /d/ /ɪd/ contrast revised on these verbs (asked, called, waited); cooking verbs through the imperative — cook, stir, bake, mix, beat, boil, fry, grill, roast, slice, dice, season, serve, taste (Boil the water. / Mix the eggs. / Don't overcook it.), which gives the imperative its first home; the grocery/money field (grocery, cart, aisle, product, price, cashier, checkout, receipt, coupon, discount, sale) as the carrier for pay / charge / spend / cover; the participle primer completed (said, told, spoken, thought, found, paid, spent) with one recognition contrast (I paid / I've paid); the simple past stays the only tense in use.
   * Focus: the context decides the verb; the past arrives with the verb.

8. **Lesson 8: Routine, Frequency & Time**
   * Content: frequency adverbs and their place (before the verb, after be); telling the time (o'clock, half past, quarter past/to, noon/midnight); the school-day field (morning, alarm, breakfast, shower, backpack, classroom, desk, homework, recess, exam, test, assignment, project, due, finished) and the at-home routine (get up, get dressed, have breakfast, leave, get home, go to bed) — the routines the adverbs need; a whole-day narration that recycles the simple past of lessons 6-7.
   * Focus: saying how often, and reading the clock.
   * Note: prepositions of time belong to lesson 17 — at/on/in and the fixed blocks are not taught here.

9. **Lesson 9: There is / There are & Place**
   * Content: there is/are with agreement, questions and negatives; in/on/at for place, plus the rest of the place set — under, above, below, over, behind, in front of, next to, between; and/but/because/so; the kitchen/home field (kitchen, fridge, oven, stove, sink, counter, cabinet, drawer, shelf, cupboard, knife, spoon, fork, plate, bowl, glass, mug, bottle) used with there is/are + place (There's a fridge in the kitchen. / The cups are in the cabinet).
   * Focus: existence + location + connection.

10. **Lesson 10: The Sounds — Vowels, Consonants & the Key (double lesson)**
   * Content: the vowel map — name, "big" sound, "small" sound and schwa, plus the C and G rules and every big/small sound with the spellings that produce it; the consonant map — TH voiced vs voiceless (tongue between the teeth), R (American), H, NG (nasal -ing, no hard g), dark L (will, milk, table, full), /w/ vs /v/ (west vs vest) and the flap T (bet·ter, wa·ter); final consonants cut off, now reinforced by the map; /ɪ/ sit·hit·fit and /æ/ cat·hat·mat kept as the fixed reference pairs; the pronunciation key (· syllable, bold phoneme, gray letters, ə); stress as the engine of the key (one strong syllable per word, the weak ones collapse to ə), the cognate stress patterns of lesson 2 (-TION, -ITY, -IC) read through the key, and the noun/verb stress pairs (REcord vs reCORD, PREsent vs preSENT); the function-word reductions (a, the, of, to, and, for), counting beats, the sleeping vowel, and the key applied to a whole sentence at speed; the dark L of will applied when the modals arrive in lesson 15.
   * Focus: the full sound inventory plus the key that turns spelling into sound — one skill, two halves.
   * Sequence: the sound work, slice 1 of 2 — the inventory and the key (slice 2: lesson 14, contractions and reductions). No later lesson re-teaches this; later lessons only use it inline.

11. **Lesson 11: Past Continuous vs Past Simple**
   * Content: was/were + -ing; negative and question forms; when/while; complete action vs action in progress (now set against the past simple of lessons 6-7); work-story sentences; the movie-production field (filming, scene, director, camera, actor, actress, script, take) as the storytelling carrier; the park/leisure and weather field (picnic, swing, slide, sunny, rainy) for the interruption pattern (We were having a picnic when it started to rain); reported speech, slice 1 — say/tell/mention/reply/ask + that-clause with backshift inside this same frame (She said she was working when the client called) and reported questions with statement order (The client asked if we had finished), using the reporting verbs taken from lesson 7.
   * Focus: narrating, and retelling one thing someone said.
   * Sequence: reported speech, slice 1 of 2 — backshift of the two past forms only, inside the narration frame (slice 2: lesson 30, which owns the full system and must not re-teach this frame).
   * Note: there is no past perfect yet, so backshift stays present → past here; the past perfect form arrives with the third conditional in lesson 19.

12. **Lesson 12: Numbers, Prices & Business Data**
   * Content: cardinals to a million; prices and money ($1,250 = "twelve fifty" or "one thousand two hundred fifty"; R$, €, £); percentages, decimals and fractions (25% = twenty-five percent, 2.5 = two point five, a half, a third, three quarters); dates and years (on July 5th, in 2020, the 1990s); phone numbers, e-mails and URLs as they are said (double letters, at, dot, underscore, dash); ranges and approximations (around 20, between 15 and 20, up to 30); the verb pair the numbers need in order to become statements — rise/fall by 10%, to 250, up from, down to — so a figure is reported, not just pronounced.
   * Key vocabulary: number, price, cost, budget, discount, revenue, sales, target, increase, decrease, percent, average, total, invoice, receipt, deadline; rise, fall, up from, down to.
   * Focus: producing and hearing numbers fast enough to work with them.

13. **Lesson 13: Comparing — Comparatives & Superlatives**
   * Content: short adjectives -er/-est (cheap → cheaper → the cheapest, big → bigger, easy → easier); long adjectives more/most (more expensive, the most efficient); irregulars (good → better → best, bad → worse → worst, far → further); than, as…as, not as…as, less/least; the + superlative and one of the + superlative; intensifiers (much cheaper, a little more expensive, twice as fast); decision language built on the numbers of lesson 12 (25% cheaper, three times faster, the cheapest of the three) and the recommendation frames the work needs (I'd go with…, it's the best option we have, it's slightly more expensive but faster).
   * Key vocabulary: better, best, worse, worst, cheaper, faster, more efficient, the most, slightly, much, twice, option, than, as…as, further, least.
   * Focus: choosing between options out loud.

14. **Lesson 14: Words That Shrink**
   * Content: connected speech; have → 've → 'a; and → 'n; going to → gonna, want to → wanna, have to → hafta, got to → gotta, don't know → dunno, kind of → kinda, sort of → sorta, a lot of → lotta, let me → lemme, give me → gimme; woulda/coulda/shoulda; the contracted be and the contracted negatives — I'm, he's, she's, it's, we're, they're; don't, doesn't, didn't, can't, won't, haven't; 'cause and outta; the 'd ambiguity (would vs had); one sentence carrying every phenomenon of the sound lesson (10) plus this one; the coffee-shop order as the carrier (I'd like a latte but I don't want sugar. / Can you make it extra hot? / To go, please.); regional accents (non-rhotic Boston, Texas/South drawl and y'all, non-rhotic British with the long bath vowel, Australian vowels with rising endings).
   * Focus: contractions and reductions in real speech.
   * Sequence: the sound work, slice 2 of 2 — contractions and reductions, built on the key of lesson 10 (slice 1). No later lesson re-teaches connected speech; later lessons only use it.

15. **Lesson 15: Can, Have to & Should (plus the future)**
   * Content: can/can't; have to/has to, must and gotta; should/shouldn't; the rest of the operator grid — could/may for permission, ought to, shall, and will/would for requests and offers; the single rule (modal + base verb, no to, no -s, one negative per modal); the future forms — will vs be going to vs present continuous for arrangements (I'll call you. / I'm going to call you. / I'm meeting the client at three.); the travel-planning script as carrier (Can we leave early? / Should we visit the museum Saturday? / We must book tickets in advance.); pronunciation: can vs can't in the reduced forms of lesson 14 and the dark L of will from lesson 10.
   * Focus: the operator grid — ability, permission, obligation, advice, offers — and the future.
   * Sequence: modals, slice 1 of 3 — the operators and their core meanings (slice 2: lesson 26, deduction and possibility; consolidation: lesson 41).
   * Note: possibility and deduction (might/may/could be, must have, can't have, should have) are lesson 26's — do not teach them here.

16. **Lesson 16: Countable, Uncountable & Quantifiers**
   * Content: countable vs uncountable; some/any; much/many/a lot of/a few/a little; the container and partitive phrases the kitchen and grocery fields bring — a cup of coffee, a glass of water, a bottle of water, a can of soda, a jar of coffee, a box of paper, a bag of sugar, a piece of advice/information/news; how much vs how many in shopping questions, tying back to the prices of lesson 12; money as uncountable against coins and notes as countable.
   * Focus: how much of a thing there is.
   * Note: a/an by sound is lesson 1's; the definite, indefinite and zero article system is lesson 24's.

17. **Lesson 17: Time & Movement Prepositions**
   * Content: at/on/in for time; the fixed blocks (in the morning, at noon, at night, on the weekend); the rest of the time set — before, after, by (deadline), until, for (duration), during, between, from…to, ago; the calendar/schedule field (calendar, schedule, appointment, deadline, meeting, holiday, weekend, weekday, today, tomorrow, yesterday, next, last, this) as the carrier (by Friday, until noon, for two hours); to/from/into/out of for movement; the at/on/in place trio of lesson 9 recapped as the same point/surface/box logic.
   * Focus: the prepositions that decide the meaning.
   * Note: since + a point in time arrives with the present perfect in lesson 20 — do not teach it here.

18. **Lesson 18: Phrasal Verbs — the System & the "get" Family**
   * Content: what a phrasal verb is and the formal single-word equivalent it usually has; the particle as the carrier of meaning (up = completion, out = exit or exclusion, on = continuation, off = separation); separable vs inseparable, and where the pronoun must go (turn it off, never turn off it); the get family (get up, get back to, get along with, get over, get on with, get out of, get through); the transparent verbs already met in lessons 6-7 (go out, come back, pick up, put on, take off, sit down) gathered and named as one system; the office script as carrier.
   * Focus: the spoken verb — how a verb and a particle make a new word.
   * Sequence: phrasal verbs, slice 1 of 3 — the machinery and the get family (slice 2: lesson 22, people and talk; slice 3: lesson 23, work, planning and problems; lesson 42 consolidates the strand without new items).
   * Note: the passive is lesson 29's and is not taught here; lessons 6-7 preview the participles and this lesson only uses them.

19. **Lesson 19: Conditionals 1 & 2 + Would (plus 0 and 3)**
   * Content: 1st conditional (if + present, will); 2nd conditional (if + past, would; if I were); would for polite requests and offers (I would like…, Would you mind…?); the zero conditional (if + present, present: If you press this button, the machine stops) and the 3rd conditional with regret (if + had + participle, would have + participle: If I had known, I would have called, reusing woulda/coulda/shoulda from lesson 14) — which is also where the past perfect form first arrives; wouldn't/shouldn't/didn't for negative outcomes; problem-solving as the carrier (If I lose my wallet, I'll call the bank immediately); the note that would/should/could here are the same operators lesson 11 uses to report speech.
   * Focus: the four conditional forms.
   * Sequence: conditionals, slice 1 of 2 — the four forms at sentence level (slice 2: lesson 25, mixed and alternative hypotheticals). The alternatives — unless, in case, provided, the inversions — are lesson 25's.
   * Note: the past perfect appears here as a form; it returns in narrative (lesson 36) and inside the mixed conditionals of lesson 25.

20. **Lesson 20: Present Perfect Continuous (closes the present perfect primer)**
   * Content: have/has + been + -ing for actions that started in the past and continue (or have just stopped); How long have you been…?; the present perfect itself finished here — the primer from lessons 6-7 becomes a full form (have/has + participle, already/just/yet/ever/never, for/since, I've worked here for five years), and since + a point in time belongs to this lesson; continuous (in progress) vs simple (finished) — I've been reading the report vs I've read the report; the three-way contrast past simple × present perfect × present perfect continuous; the block handed over — lessons 1-19 revisited as one system.
   * Focus: the last continuous form, and the present perfect standing on its own.
   * Exit criteria: narrate past events unaided; choose between past simple, present perfect and present perfect continuous; move between informal and formal wording with modals and conditionals; place the operator correctly in questions and negatives; read the pronunciation key and produce the reductions; report what someone said.

21. **Lesson 21: Prepositions & Verb+Preposition Systems**
   * Content: preposition systems taught through business e-mail and meeting coordination; the high-frequency verb + preposition units and the preposition the verb fixes (depend on, arrive at, not arrive to); where English and Portuguese prepositions disagree (depender de → depend on, esperar → wait for, casar com → marry); preposition + -ing (good at, interested in, before/after); the place and time sets of lessons 9 and 17 are used here, not retaught.
   * Examples: meeting logistics managed by e-mail ("The discussion will be held at the conference room on Monday" for time and place; "Please send the draft to your manager by Friday" for direction and deadline; "It depends on the client's answer" for the fixed unit)
   * Key vocabulary: depend on (never "depend of"), look at, wait for, work on, listen to, deal with, apply for, agree with (a person) / agree to (a plan), talk about, arrive at, pay for, good at, interested in, before/after + -ing, despite, regarding, between/among, toward, throughout
   * Focus: the preposition the verb or the noun decides.
   * Advanced element: contrasting verb+preposition families (talk to/about, think of/about, hear from/of)
   * Professional relevance: e-mail etiquette, meeting coordination, customer-service scripts

22. **Lesson 22: Phrasal Verbs — People & Talk**
   * Content: the communication and relationship set, each one taught against its formal single-word equivalent (bring up = raise, go over = review, come up with = devise); the particle as the meaning-carrier (turn up / turn down / turn into / turn out); the machinery itself is lesson 18's and is used, not retaught.
   * Examples: briefings and office talk ("Let's go over the results from last quarter" for review; "She brought up the budget again" for raising a topic; "We get along with the new supplier" for a relationship; "He turned up late again" for arrival; "Let's catch up on Friday" for a status talk)
   * Key vocabulary: bring up (raise a topic), go over (review), talk through, point out, catch up with, show up / turn up (arrive), come up with (invent), get along with, fall out with, make up (after a quarrel), look after, hang out; and the formal equivalents raise, review, devise, attend, maintain a relationship
   * Focus: the phrasal verbs people use to talk to each other.
   * Advanced element: particle choice as meaning — turn up / turn down / turn into / turn out
   * Sequence: phrasal verbs, slice 2 of 3 — people and talk (slice 1: lesson 18; slice 3: lesson 23).
   * Professional relevance: team conversation, briefings, feedback

23. **Lesson 23: Phrasal Verbs — Work, Planning & Problems**
   * Content: the work set above, separable vs inseparable where it decides the sentence (carry it out, but look into it); the project and retrospective script as carrier; the formal equivalents as the escape hatch (arrange, postpone, perform, submit, resolve, investigate).
   * Examples: project management and problem-solving ("We need to set up the presentation slides before the meeting" for preparation; "The team wrapped up the client requirements this afternoon" for completion; "Let's look into the client feedback" for investigation; "The team figured out a way to reduce costs by 20%" for a solution; "We need to get over the communication breakdown quickly" for recovery)
   * Key vocabulary: set up (arrange), wrap up (finish), put off (postpone), carry out (perform), take over (assume control), hand in (submit), sign off (approve), sort out (resolve), figure out / work out (solve, understand), look into (investigate), get over (recover from), turn into (become), break down (fail, or analyse), keep up with (stay level with)
   * Focus: getting work done, and getting it unstuck.
   * Advanced element: separable vs inseparable where the meaning stays fixed; the verbs that read as bad news
   * Sequence: phrasal verbs, slice 3 of 3 (slices 1-2: lessons 18 and 22).
   * Professional relevance: project management, task coordination, retrospectives

24. **Lesson 24: Articles & Determiners**
   * Content: a/an for one of many and for first mention; the for what both speakers already know (second mention, shared situation, unique things: the sun, the boss); the zero article for plurals and uncountables in general statements (Cats are independent. / Information is expensive.) against the generic the (The cat is a predator.); a/an with jobs and nationalities; the with superlatives, ordinals and the specific-of-a-group; the institutions and fixed phrases (go to work/school/bed, at home, on time, in the end vs at the end); the uncountables that carry the most traffic (information, advice, news, research, feedback, equipment, furniture, luggage, money) and how they take articles; the pronunciation consequence (the /ðə/ against /ði/ before a vowel).
   * Examples: the report that loses its "the" ("The report was submitted before the deadline" against "Report was submitted before deadline"; "She's an engineer at a fintech" for a/an with jobs; "Information is expensive; the information we bought last year was worthless" for the uncountable and the second mention)
   * Key vocabulary: article, determiner, the, a/an, zero article, generic, specific, first mention, information, advice, research, feedback, equipment, furniture, luggage, money, job, profession
   * Focus: the three small words that decide more than most tenses.
   * Advanced element: generic vs specific as an argumentative choice; the articles that flip a meaning (a few / few, a little / little)
   * Professional relevance: reports and e-mails, where a missing "the" reads as carelessness

25. **Lesson 25: Conditionals — Mixed & Alternative Hypotheticals**
   * Content: mixed conditionals (If I had taken the job, I would be in Berlin now); the alternatives to if — unless, provided / as long as, in case, otherwise, even if, whether…or; the inverted conditional (Had I known, Should you need anything, Were I in your position); would rather / would rather not and rather than; it's time + past; wish / if only for regret; the four forms themselves belong to lesson 19 and are only used here.
   * Examples: weighing options in a decision ("If I had taken the job, I would be in Berlin now" for a mixed past→present; "Unless the client signs by Friday, we lose the slot" for unless; "Had I known about the deadline, I would have started earlier" for the inversion; "I'd rather we waited for the figures" for preference)
   * Key vocabulary: unless, provided, as long as, in case, otherwise, even if, whether…or, Had I known, Should you need, Were I, would rather, rather than, it's time, wish, if only, regret, hypothetical
   * Focus: hypotheticals beyond the four forms.
   * Advanced element: the polite hypothetical as a negotiation tool
   * Sequence: conditionals, slice 2 of 2 — mixed and alternative hypotheticals (slice 1: lesson 19 owns the four forms).
   * Professional relevance: risk talk, negotiation, career planning

26. **Lesson 26: Modals of Deduction & Possibility**
   * Content: the inference system — must be (certain), might/may/could be (possible), can't be (impossible), should be (expected); the past forms — must have / might have / may have / could have / can't have + participle; should have / ought to have for the expectation that failed, against its other life as regret; seem, appear, look like, sound like as hedges; probably / definitely / I doubt as the layer that grades the claim; ability, permission and obligation belong to lesson 15 and are not retaught.
   * Examples: investigation scenarios where the information is incomplete ("The client must have changed their requirements recently" for a past deduction; "The project might succeed if we get additional funding" for possibility; "She can't be working from home today" for elimination; "He should have signed it by now" for the expectation that failed)
   * Key vocabulary: must be, might be, may be, could be, can't be, must have, might have, can't have, should have, ought to have, seem, appear, look like, I doubt, probably, definitely, evidence
   * Focus: how sure the speaker is, and why.
   * Advanced element: critical thinking made audible — grading certainty in a status report
   * Sequence: modals, slice 2 of 3 — deduction and speculation, present and past (slice 1: lesson 15; consolidation: lesson 41).
   * Professional relevance: evidence-based reporting, where an ungraded claim is a liability

27. **Lesson 27: Relative Clauses & Information Density**
   * Content: defining vs non-defining; who/that/which/where/whose/when; the object pronoun that can be dropped and the subject pronoun that cannot; the comma that changes the meaning; the clause that replaces a whole sentence of explanation; reduced clauses (the team working on it) as a recognition step.
   * Examples: report drafting that combines information efficiently ("The team that presented yesterday impressed the board" for restrictive clauses; "The project, which was completed ahead of schedule, received an award" for non-restrictive clauses; "This is the office where we established our first branch" for location)
   * Key vocabulary: who, that, which, where, whose, when, defining, non-defining, comma, omission of the object pronoun, information compression, paraphrase
   * Focus: complex sentences with who/that/which/where.
   * Advanced element: information compression and paraphrasing
   * Professional relevance: business reports, presentations and e-mails

28. **Lesson 28: Gerunds & Infinitives: Advanced Patterns**
   * Content: verb + -ing against verb + to + base (enjoy, mind, avoid, finish, suggest against want, decide, hope, plan, agree, refuse); the pairs where the meaning moves (stop, remember, forget, try, need, go on); preposition + -ing (good at, interested in, before/after, instead of); the infinitive of purpose; make/let/help + base; the -ing form as a subject.
   * Examples: professional development talk comparing action types ("Learning a new language improves cognitive function" for the gerund as subject; "To negotiate effectively, one must understand cultural differences" for the infinitive of purpose; "She enjoys reading management books during her commute" for a mixed pattern)
   * Key vocabulary: enjoy, mind, avoid, finish, suggest, want, decide, hope, plan, agree, refuse, stop, remember, forget, try, need, go on, instead of, purpose, subject
   * Focus: the pattern the verb demands.
   * Advanced element: meaning-changing pairs, and the forms that shift when a preposition arrives
   * Professional relevance: academic and professional writing styles

29. **Lesson 29: Passive Voice & Agency**
   * Content: be + past participle (The report was finished) across the tenses it can wear (is done / was done / has been done / will be done); get + past participle as the informal passive (He got promoted. / I got paid. / The meeting got cancelled.); by + agent and the decision to leave the doer out; modality and purpose on top of it (The form has to be filled in. / The form was sent to be signed); the passive of a phrasal verb keeping its particle (The meeting was called off.); the reporting passives (is expected to, is said to, is believed to); active or passive as a decision about agency.
   * Examples: report and procedure writing where the doer is unknown, obvious or deliberately hidden ("The report was submitted before the deadline" for an unmentioned actor; "The client was informed by e-mail" for the by-agent; "The meeting got cancelled at the last minute" for the everyday get-passive; "The decision is expected to be announced on Friday" for a reporting passive)
   * Key vocabulary: be + past participle, get + past participle, by + agent, is expected to, is said to, is believed to, agency, doer, transitive, intransitive, procedure
   * Focus: who did it, and whether the sentence says so.
   * Advanced element: corporate and diplomatic distance — the passive as a choice, not a habit
   * Sequence: the passive — this lesson owns it; lessons 6-7 preview the participles and lesson 18 uses them, neither teaches the passive.
   * Professional relevance: e-mail tone, formal reports, performance reviews

30. **Lesson 30: Reported Speech & Narrative Voice**
   * Content: say against tell (tell + person); the backshift table (present → past, past → past perfect, will → would, can → could, must → had to); the shift that is usually skipped when the fact is still true; the time and place shifts (now → then, here → there, tomorrow → the next day); reported questions with statement order and reported commands (She told us to wait); the reporting verbs that carry attitude (admit, warn, offer, promise, refuse, claim) and the pattern each one takes; direct against reported voice as a choice of distance.
   * Examples: second-hand reporting in meetings and e-mails ("She said she was working on the report when the client called" for backshift; "He asked if we had finished the proposal" for a reported question; "They told us the deadline had changed" for a reported statement; "She warned us the client would walk" for a verb that carries attitude)
   * Key vocabulary: say, tell, ask, reply, admit, warn, offer, promise, refuse, claim, backshift, if/whether, statement order, the next day, direct, reported
   * Focus: retelling what was said, without repeating it.
   * Advanced element: persuasion through framing — what gets reported and what does not
   * Sequence: reported speech, slice 2 of 2 — the full system (slice 1: lesson 11 owns backshift of the two past forms inside narration; that frame is not re-taught here).
   * Professional relevance: interviewing, negotiation, conflict resolution

31. **Lesson 31: Past Habits & Familiarity (used to, would, be used to)**
   * Content: used to + base for past habits and past states (I used to work nights. / There used to be a shop here.); didn't use to and did you use to…?; would + base for repeated past actions only, never for states; the contrast with the simple past (a closed period against a repeated habit); be used to + -ing/noun and get used to + -ing/noun for what is familiar now; the three look-alikes kept apart (used to work / be used to working / use a tool for); the change-and-onboarding script as carrier.
   * Examples: "I used to walk to work before we moved" for a past habit; "We would meet every Friday when the office was downtown" for a repeated past action; "I'm used to presenting in English now, but I wasn't used to it last year" for familiarity; "She's still getting used to the new software" for adaptation
   * Key vocabulary: used to, didn't use to, did you use to, would, be used to, get used to, be getting used to, habit, routine, familiar, adapt, no longer, back then
   * Focus: how the past repeats, and what you have grown used to.
   * Advanced element: would against used to with states; the pronunciation of used to (/juːstə/)
   * Professional relevance: onboarding, change management, comparing how things were done
   * Note: pronunciation stays inline here (the key of lesson 10, the reductions of lesson 14) — connected speech is not this lesson's main idea.

32. **Lesson 32: Discourse Markers & Cohesion**
   * Content: the written linkers (however, therefore, moreover, furthermore, consequently, in fact, in addition, on the other hand); the spoken ones (well, so, right, anyway, I mean, you know, to be honest); what each one signals — contrast, consequence, addition, reformulation, closing a topic; the ones that get overused against the ones that never get used; cohesion by reference (this, that, the former, the latter) instead of repetition.
   * Examples: group facilitation and writing where the transitions have to be smooth ("Actually, I think we should consider…" for the spoken marker; "The figures improved. However, the timeline slipped." for written contrast; "To sum up, …" for closing a topic)
   * Key vocabulary: however, therefore, moreover, furthermore, consequently, in fact, in addition, on the other hand, anyway, so, right, I mean, to be honest, the former, the latter, cohesion
   * Focus: how a text or a talk holds together.
   * Advanced element: the marker as a claim about the argument, not decoration
   * Professional relevance: lecture notes, meetings, written reports

33. **Lesson 33: Meetings & Collaborative Decision-Making**
   * Content: opening and chairing (Let's get started. / The aim today is…); turn-taking; proposing and seconding (I'd suggest… / Who's in favour?); disagreeing inside the meeting; summarising and assigning (action items, owners, deadlines); the process vocabulary (agenda, minutes, action item, consensus, stakeholder).
   * Examples: chairing a decision ("Let's vote on which approach to implement" for a proposal; "To summarise, we're going with option B and Sam owns the deadline" for the close)
   * Key vocabulary: facilitate, delegate, prioritise, consensus, stakeholder, agenda, minutes, action item, owner, deadline, chair, in favour, summarise
   * Focus: running the room and leaving with decisions.
   * Advanced element: cross-cultural meeting behaviour — silence, interruption, directness
   * Professional relevance: project meetings, team coordination, leadership

34. **Lesson 34: Email, Tone & Formality**
   * Content: the formal ↔ informal ladder applied to real e-mails (Dear Mr Smith / Hi Sam / Hey guys; I am writing to / Just a quick one; I would appreciate / Could you); reading the reader (internal peer, external client, senior); contractions, directness and the imperative; requests, follow-ups, apologies and bad news; subject lines; when formality is the wrong choice.
   * Examples: the same message adapted to three readers ("Dear Team, Please review the attached document" for formal; "Hey guys, quick question about the deadline" for informal; "I'm afraid we can't hit Friday — here's what we can do" for bad news)
   * Key vocabulary: tone, formality, directness, audience, contraction, subject line, opening, sign-off, follow-up, apology, bad news, cc, bcc, warmth
   * Focus: saying the same thing to three different readers.
   * Advanced element: emotional intelligence in writing — warmth without losing the point
   * Professional relevance: client correspondence, internal escalation, networking

35. **Lesson 35: Customer Service & Conflict Resolution**
   * Content: the service script (greet, identify the problem, own it, fix it, close); de-escalation language (I understand your concern. / Let me see what I can do.); saying no without losing the customer; escalation language; the follow-up e-mail; the tone at each stage.
   * Examples: complaint handling at a call centre ("I understand your concern, and I'll escalate this to senior management" for de-escalation; "What I can do today is…" for the partial yes)
   * Key vocabulary: empathy, escalation, escalation path, retention, service recovery, active listening, complaint, resolve, refund, goodwill, follow-up
   * Focus: phone etiquette and problem-solving scripts.
   * Advanced element: de-escalation under real pressure
   * Professional relevance: call centres, client relations, support roles

36. **Lesson 36: Storytelling & Narrative Structure**
   * Content: the shape (hook, set-up, complication, climax, resolution); tense discipline in a story — simple past carries it, past continuous sets the scene, past perfect reaches back, present perfect makes it matter now (each form is taught elsewhere: lessons 6-7, 11, 19, 20); sequencing markers (at first, then, by the time, in the end); detail that earns its place; the long version against the one-line version.
   * Examples: career stories told short ("I was working late when the opportunity arose" for the scene; "By the time the client called, we had already shipped it" for the reach-back)
   * Key vocabulary: hook, set-up, complication, climax, resolution, protagonist, chronological order, by the time, in the end, at first, audience engagement
   * Focus: work stories and career narratives.
   * Advanced element: past perfect as the reach-back tense in narrative
   * Professional relevance: networking, interviews, professional identity

37. **Lesson 37: Small Talk & Deep Conversation**
   * Content: opening moves (How's the week going? / Did you see…?); the follow-up question that turns the weather into something; the signals that show you are following; disclosing a little to get a little; the exit line; the topics that travel and the topics that do not.
   * Examples: networking talk that moves from surface to substance ("So, what do you enjoy doing in your free time?" leading into career topics; "I should let you get back to it — good to meet you" for an exit)
   * Key vocabulary: icebreaker, rapport, follow-up, boundary, disclosure, authenticity, cultural sensitivity, exit line, small talk
   * Focus: getting from surface to substance without a script.
   * Advanced element: cultural sensitivity and appropriate boundaries
   * Professional relevance: networking events, team building, mentorship

38. **Lesson 38: Nuanced Opinion & Agreement**
   * Content: the agreement ladder (I completely agree → I see your point, but… → I'm not sure that's the whole picture → I don't think that holds); concession then counter (I take your point about cost; however…); softening and hedging; asking for the evidence; disagreeing with the idea and never the person.
   * Examples: disagreeing politely in a debate ("I understand your point, but I think there's another perspective" for a counter; "What's that based on?" for asking for the evidence)
   * Key vocabulary: constructive criticism, perspective taking, evidence, concession, rebuttal, hedge, soften, counter-argument, on the one hand
   * Focus: expressing disagreement tactfully.
   * Advanced element: critical thinking and evidence presentation
   * Professional relevance: debates, peer reviews, professional critique

39. **Lesson 39: Checkpoint — Consolidation**
   * Content: lessons 21-38 consolidated as one system — the whole block re-crossed with the exam format already known; the errors that survive, and the personal repair list that comes out of them.
   * Focus: consolidating the 21-38 block before the graded assessment.
   * Generation: SKIP — do not build this page yet; the exam format, item mix and scoring must be planned with the user first.

40. **Lesson 40: Exam 1 — Assessment of Lessons 1-38**
   * Content: graded assessment of the four language skills, scored on a can-do grid built from lessons 1-38, with formal against informal wording inside the spoken part.
   * Focus: measuring the 1-38 block and fixing the entry point for what follows.
   * Generation: SKIP — do not build this page yet; the can-do grid, weighting and pass criteria must be planned with the user first.

41. **Lesson 41: Consolidation — Tenses & Modals at Speed**
   * Content: the tense system re-run at speed — simple present and continuous, the two pasts, present perfect simple and continuous, the past perfect reach-back, the four conditionals (lessons 4-7, 11, 19, 20 and 25 teach them; this page only runs them); the modal grid of lessons 15 and 26 under time pressure; new material arriving only as the carrier, never as a new item; the errors that survive, and why.
   * Examples: the grammar working while the attention is somewhere else ("By the time we completed the project, they had been working on it for six months" for the past perfect continuous; "She should have submitted the report by Friday" for the modal perfect of expectation; "Had I known, I would have called" for the inverted third conditional)
   * Key vocabulary: temporal markers, aspect, modality, hypothetical, had been + -ing, should have, would have, might have, must have, by the time, already/yet
   * Focus: the tenses and the modals together, without stopping to think.
   * Advanced element: holding accuracy while the clock runs
   * Sequence: tenses and modals — consolidation only, no new items (taught in 4-7, 11, 15, 19, 20, 25, 26).
   * Professional relevance: complex project planning and risk assessment

42. **Lesson 42: Consolidation — Phrasal Verbs in Use**
   * Content: the whole strand from lessons 18, 22 and 23 in one place — the same items in new situations, no new verbs; separable and inseparable at speed; the formal equivalent as the escape hatch; the ones too informal for a written report.
   * Examples: the same verbs in natural contexts ("Let's go over the quarterly results" for review; "The team figured out a solution" for a discovery; "We need to wrap up the presentation" for completion)
   * Key vocabulary: contextual meaning, collocation, the formal equivalent, separable, inseparable, idiom
   * Focus: using the set without translating it.
   * Advanced element: idiomatic nuance, and the ones that travel badly
   * Sequence: phrasal verbs — consolidation only, no new items (taught in 18, 22, 23).
   * Professional relevance: native-like fluency and automaticity

43. **Lesson 43: Capstone Working Day**
   * Content: a whole working day carried end to end as one continuous business situation — stand-up, client call, negotiation, written follow-up — using the system without stopping.
   * Examples: one continuous day using everything learned ("We're having a meeting to discuss the quarterly targets" for the opening; "I'll send the summary this afternoon" for the follow-up)
   * Key vocabulary: integration, formality, scenario, follow-up, negotiation, summary
   * Focus: carrying a whole working day on the language alone.
   * Advanced element: integration across language domains inside one continuous scenario
   * Professional relevance: end-to-end business communication

44. **Lesson 44: Self-Correction & Clarification**
   * Content: repair strategies (I meant…, Let me say that again, What I'm trying to say is…); asking for clarification (Could you explain that another way? / Do you mean…?); checking understanding by summarising; self-monitoring against the repair list carried out of lesson 39; when admitting you have not understood is the strong move.
   * Examples: repair in the middle of a conversation ("I misunderstood your point, let me ask again" for repair; "Could you explain that concept from a different angle?" for clarification)
   * Key vocabulary: repair, clarification, paraphrase, checking understanding, self-monitor, reformulate, feedback
   * Focus: repair strategies and asking for clarification.
   * Advanced element: metacognitive awareness — knowing which error you make and why
   * Professional relevance: growth conversations and continuous learning
   * Note: the first repair phrases arrive in lesson 3 (Sorry, could you say that again?) — referenced here, not retaught.

45. **Lesson 45: Professional Email & Professional Writing**
   * Content: the formal e-mail and the short report as forms — layout, opening and closing formulae, paragraph discipline (one idea per paragraph, a topic sentence that says it), the report shape (purpose, findings, recommendation), where the passive earns its place and where it hides responsibility (the form itself is lesson 29's), and length discipline.
   * Examples: business correspondence ("Dear Mr Smith, Thank you for your consideration" for the formal close; "The proposal outlines our strategic approach" for a memo; a findings-and-recommendation report)
   * Key vocabulary: layout, salutation, opening, closing, paragraph, topic sentence, findings, recommendation, attachment, subject line, memo, proposal
   * Focus: writing that survives being forwarded.
   * Advanced element: brand voice and professional identity
   * Professional relevance: client communication, internal memos, external communications

46. **Lesson 46: International Communication & Cultural Intelligence**
   * Content: directness and indirectness across cultures; high- and low-context styles; face-saving and the wording that does it; what "yes" can mean; adapting pace, silence and small talk; English as a lingua franca — clarity ahead of native idiom.
   * Examples: cross-cultural scenarios ("In Japanese business culture, direct criticism is avoided" for indirectness; "When communicating globally, consider local business practices" for adaptation)
   * Key vocabulary: cultural intelligence, ethnocentrism, accommodation, high context, low context, face, directness, silence, lingua franca, global mindset
   * Focus: global business communication and cultural difference.
   * Advanced element: inclusive language and international awareness
   * Professional relevance: cross-cultural collaboration and diplomacy

47. **Lesson 47: Negotiation & Persuasion Skills**
   * Content: interests rather than positions; anchoring and framing; the conditional offer (If you can…, we can…); conceding in steps; handling a stall; closing and confirming in writing; the persuasive register that does not sound like pressure.
   * Examples: deal-making ("To persuade effectively, you must understand the other party's priorities" for interests; "If we take the earlier date, can you hold the price?" for a conditional offer; "We need to find a win-win solution" for framing)
   * Key vocabulary: BATNA, anchor, frame, reciprocity, value proposition, conditional offer, concede, stall, close, win-win
   * Focus: advanced negotiation techniques and persuasive language.
   * Advanced element: influence strategies that survive a second meeting
   * Professional relevance: contract negotiations, sales, leadership

48. **Lesson 48: Leadership & Team Communication**
   * Content: the vision in one sentence; briefing and delegating; feedback in the situation-behaviour-impact shape; coaching questions; the hard conversation; announcing change.
   * Examples: leadership development ("As a leader, I need to communicate vision clearly" for the brief; "Coaching involves asking powerful questions" for the coaching turn; "Here's what changes and here's what doesn't" for the change message)
   * Key vocabulary: vision, brief, delegate, feedback, situation-behaviour-impact, coaching, mentor, accountability, change, motivation
   * Focus: advanced leadership vocabulary and communication styles.
   * Advanced element: coaching, mentoring and delegation language
   * Professional relevance: executive communication and strategic messaging

49. **Lesson 49: Innovation & Future Language**
   * Content: the vocabulary of change and technology; hedging the future (is expected to, is set to, is likely to); the buzzword audit — which words carry meaning and which are decoration.
   * Examples: technology adoption discussions ("The digital transformation initiative requires new skills" for innovation vocabulary; "We're exploring AI-driven solutions for process optimization" for future language; "The pilot is set to roll out in Q3" for the hedge)
   * Key vocabulary: disruption, scalability, digital literacy, future-ready, adaptive, pilot, rollout, adoption curve, is set to, is likely to
   * Focus: emerging business terms and forward-looking language.
   * Advanced element: adaptation to changing business environments
   * Professional relevance: technology adoption, change management

50. **Lesson 50: Global English & Advanced Fluency**
   * Content: a final pass over the whole system under one clock — a negotiation, a written recommendation and a long uninterrupted answer; switching formality on purpose (the same message for a client, a colleague and a friend), with the three options of the track's register table as the reference; code-switching between them without losing the thread; the learner's own remaining errors and a plan for them.
   * Examples: comprehensive review and global English standards ("Our global English strategy emphasizes clear communication across cultures" for global standards; the same message rewritten three ways, once per option of the track's register table)
   * Key vocabulary: linguistic diversity, code-switching, formality, international competency, cross-border communication, clarity, idiom
   * Focus: comprehensive review and global English standards.
   * Advanced element: switching formality on purpose
   * Professional relevance: professional excellence and international competitiveness
