# Lesson 1 (adult) — design (Pass A)

## Fundamental idea taken from `designs/lesson01.design.md`
The skeleton of the site's first lesson survives intact: **the subject is always spoken**, `be` is the whole
first verb (*ser* and *estar* in one), `a/an` is decided by *sound*, `it` carries time/weather/day, and two
sound habits decide whether you are understood (the final consonant stops clean; `p/t/k` leave with air), with
/ɪ/ vs /æ/ as the first pair the ear needs.

The business furniture is thrown away: no badge, no video call, no "I'm a designer" as the model sentence.
This track's persona is not on a first day at work — they are at a **neighbourhood barbecue that turned into a
party**, and the same six words have to work there.

## Core (what the student can do afterwards)
1. Say who they are, where they are from and what they do **out loud, in a bar**, and answer "what's up?"
   without freezing.
2. Choose `a` / `an` by the **sound** of the next word on the things actually on that table (*a beer, an
   ashtray, an hour, a uniform, an Uber*).
3. Say the time, the day, the weather and the temperature with `it` (*It's ten. It's Saturday. It's hot.*).
4. Place a swear on the **strength ladder** — *damn / hell* (mild, everywhere), *shit* (friends, not
   colleagues), *fuck* (close friends only, never at work, never at a stranger) — and know which one not to
   use at a neighbour's table.
5. Pass the two first sound tests: the final consonant lands (*friend*, not "fren-djee") and `p/t/k` leave
   with a puff (*party*, *table*, *cold*), with /ɪ/ vs /æ/ drilled as *sit/sat, shit/shat, bitch/batch*.

## Teaching beats (per core item) and dependencies
- **The subject is never hidden.** Portuguese hides it (*Sou do Ceará*); English pays for it every time. One
  line: *no subject, no sentence — and a sentence that starts with the verb is an order.* **Dependency:** the
  pronouns arrive here as the thing that fills the slot, glossed (*eu, você, ele…*), never as a table to
  memorise.
- **`be` = *ser* + *estar*.** *I'm Bruno* (sou) / *I'm drunk* (estou). One English verb where Portuguese has
  two. **Dependency:** no other verb on the page. `be` is the only verb, on purpose.
- **`a/an` is an ear decision.** *an hour, an Uber, an honest guy* against *a university, a uniform, a user*.
  Mental model: *the letter lies, the first sound decides.*
- **`it` is the empty subject.** *It's late. It's Friday. It's raining. It's far.* Portuguese says *É tarde /
  São duas / Está chovendo*; the English `it` is not *isso*.
- **The strength ladder.** The track teaches swearing as **register, not decoration**: what the word means,
  how strong it is, who you may say it to. The page gives four rungs with a one-line verdict each and one
  explicit warning (a word that is fine with your friends can end a conversation with a neighbour or a boss).
  Words are written in full where the model allows it; the page says plainly that some words (slurs) are
  *named and explained but never printed as models* — the student is told they exist, not handed them.
- **The two sound laws.** (i) the final consonant lands — *friend, beer, bar, hot*; (ii) `p/t/k` at the start
  of a beat get a puff — *party, table, cold*; no air and the ear hears another word. /ɪ/ vs /æ/ comes as
  *sit/sat, shit/shat, bitch/batch, bin/ban* — four pairs, one listen-and-choose, because this track's
  vocabulary makes those pairs useful immediately.
- **Real stakes.** The three sentences are what you say when a stranger hands you a beer and asks who you are.
  In a loud kitchen, the final consonant is the difference between *I'm from the south* and something nobody
  understands.

## Situation
A Saturday barbecue in a Brazilian neighbourhood abroad (or a bar in Brazil with a gringo at the table). Loud,
fast, beer in hand, someone's playlist in the background. The student is the newest person there.

## Three candidate experiences (three channels)
- **Heard — three people introduce themselves over the noise** (audio), with "ver o que ele disse" reveals,
  then a who-is-who tick. The first thing in a party is that you *hear* people before you read them.
- **Done — the strength ladder** as a physical sort: put eight words in the right rung (mild → never here),
  then say one sentence with the right rung for the right person.
- **Read — a group chat** with five messages mixing registers; the student fixes the two that are wrong for the
  room.

## Chosen
**Heard, entered through the barbecue.** It gives the persona the one thing they came for (understanding fast
real speech) and forces the three target sentences to be *said*, not analysed. The strength ladder is kept as
a section rather than an entrance because it needs the vocabulary of section 1 to land.

**First 30 seconds:** a voice note plays — *"Hey, I'm Bruno. I'm from the south. Grab a beer."* — and the only
thing on the page is one box for the student's own name. They type it. The subject law arrives **after** they
have already used it correctly.

## What the student produces (evidence)
Three typed self-introduction lines, eight `a/an` choices on things on the table, four `it` lines, six
listen-and-tick items, one recording of the three sentences, eight words sorted on the strength ladder, and a
quiz that re-tests all four behaviours on material the training never used.

## Conflicts, and how I resolved them
- **The track demands swearing in most contexts; lesson 1 is level 1.** Resolution: the page teaches the
  *ladder* and four words (*damn, hell, shit, fuck*) with explicit usage verdicts, inside sentences the student
  can actually say (*It's fucking hot. / Damn, it's late.*). It does not teach a slur, and says so.
- **A party is noisy, but the page cannot be noisy.** Resolution: the audio is the noise; the reveals carry the
  written form. Every target line has a `data-say`.
- **`be` = ser + estar is a big claim.** Resolution: two sentences from the student's own night (*I'm Bruno /
  I'm drunk*), one line of explanation, no conjugation table.

## Shape of the session (what is met, in what order)
1. **Três vozes na cozinha** — the heard entrance: three people introduce themselves over the noise.
2. **A sua vez** — the three sentences (name / from / what you do), with the fills.
3. **O sujeito nunca se esconde** — the skeleton with `be`, *ser* + *estar*, gap items.
4. **a ou an?** — the ear rule and the table of things on the table.
5. **O `it` que não é "isso"** — time, day, weather, distance.
6. **A escada do palavrão** — the strength ladder, the four words, who you may say them to.
7. **Lab do som** — final consonant, the puff of `p/t/k`, /ɪ/ vs /æ/.
8. **Treino** — mixed, plus one recording.
9. **Quiz — sem consulta.**

## Notes for the build pass
`data-say` on every target line and every swear example (the audio is the model; the ladder is the advice).
Fill-in sentences are whole utterances, so those blocks are one item per line (`.wide`, reason here).

`recycles:` nothing — first lesson of the track.
`must not re-teach:` lesson 2 owns the cognate suffixes, the false friends and the -tion/-ity/-ic stress rule;
lesson 3 owns the wh- words, the embedded polite question and the repair chunks; lesson 10 owns the full sound
inventory, the key and /ɪ/ vs /iː/ (this page keeps /ɪ/ vs /æ/ only).

