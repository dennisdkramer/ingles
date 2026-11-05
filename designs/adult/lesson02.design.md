# Lesson 2 (adult) — design (Pass A)

## Fundamental idea taken from `designs/lesson02.design.md`
The cognate code is the fastest vocabulary a Portuguese speaker will ever get: a suffix maps onto an English
suffix and a word they already own becomes an English word. Lesson 1 gave the skeleton; lesson 2 gives the
first thousand words and the two traps that come with them — the cognate that is not the word people use, and
the false friend that means something else entirely. It also brings the first stress rule, because a cognate
with the stress in the wrong place is not recognised.

Re-contexted for this track: the carrier is **a playlist and a late-night conversation about music, films and
people**, not a report. The vocabulary is the vocabulary of an adult social life (*application, opportunity,
relationship, generation, musician, concert, documentary*) plus the false friends that cause real embarrassment
(*actually, push, pretend, assist, lunch, college, parents, eventually*).

## Core (what the student can do afterwards)
1. Turn a Portuguese word into its English cognate by its **suffix**, and know when the cognate is NOT the word
   people say (*photograph → photo, telephone → phone, television → TV, automobile → car, profession → job*).
2. Recognise and use the five **false friends** that actually trip Brazilians in adult conversation: *actually*
   (= na verdade, not "atualmente"), *push* (= empurrar, not "puxar"), *pretend* (= fingir, not "pretender"),
   *lunch* (= almoço, not "lanche"), *parents* (= pais, not "parentes").
3. Stress a cognate so it is recognised: **-TION / -SION / -ITY / -IC** put the stress on the syllable *before*
   the suffix (*infor-MA-tion, de-CI-sion, possi-BI-lity, ro-MAN-tic*), and the stress often lands elsewhere
   than in the Portuguese word.
4. Hear the short vowels that decide half these words: /ɪ/ vs /iː/ (*shit/sheet, bitch/beach, live/leave*) and
   /ʌ/ vs /æ/ (*cut/cat, but/bat*) — because mishearing them is how a compliment becomes an insult.

## Teaching beats and dependencies
- **The suffix is a key, not magic.** -ção → -tion · -dade → -ty · -mente → -ly · -ado/-ido → -ed · -ivo →
  -ive · -mento → -ment · -ista → -ist. Said plainly: it works *most* of the time, and the exceptions are the
  ones people actually say.
- **The cognate is often the formal word, and nobody says the formal word.** *I have an opportunity* is real;
  *I have an occasion* is not. Pairs side by side, with which one belongs at a bar.
- **False friends are taught as a swap, not a list.** Each gets its Portuguese meaning, its English meaning and
  the word the student actually wanted. *I'm actually tired* ≠ *atualmente*; *push the door* ≠ *puxe a porta*
  (that is *pull*, which is the door that says PUSH).
- **The stress rule is the same rule four times.** -tion, -sion, -ity, -ic: stress the syllable before the
  suffix. One model per suffix, hand-clapped, then six to place.
- **The vowel pairs are the adult register.** *shit/sheet, bitch/beach, live/leave* and *cut/cat, but/bat* —
  taught because the words are in the student's night.
- **Register beat:** the same opinion said three ways (*That's nonsense. / That's bullshit. / That's fucking
  bullshit.*) — lesson 1's ladder applied to a cognate (*ridiculous → ridículo*), so the ladder is visibly a
  tool and not a list.

## Situation
A late-night kitchen table after a concert: someone's phone on the counter, a song playing, two people arguing
about a film, a cousin visiting from Portugal who says *"puxe"* and pushes the door. The student has the
vocabulary of the room but not the words for it.

## Three candidate experiences
- **Heard — a song chorus and a conversation over it**: tick which cognates were heard and which one was a
  false friend. Music is this track's stated hook, and cognates are dense in lyrics.
- **Done — the suffix factory**: twenty Portuguese words, produce the English cognate, then mark the four that
  nobody says that way.
- **Read — a film review in English** with six cognates and two false friends underlined; decide which
  underlined word is wrong.

## Chosen
**The suffix factory, entered through the song.** The heard entrance is the track's hook but it cannot carry the
*production* of twenty words; the factory does, in one screen, and gives the visible progress this persona
wants. The song opens the section (two lines, one cognate, one false friend) and hands straight into the rule.

**First 30 seconds:** two lines of a chorus on the page, one word highlighted — *generation* — with the
question *"you already know this word; why?"* The answer is the suffix key, and the student gets it in one line
before any table appears.

## What the student produces (evidence)
Sixteen suffix transformations (typed), six false-friend swaps (chosen), six stress placements, four listening
pairs, three register versions of one opinion, one recording of a two-line opinion using two cognates, and a
quiz that tests the rule on words the training never used.

## Conflicts, and how I resolved them
- **The roadmap wants the whole suffix code plus false friends plus stress plus vowels in one lesson.**
  Resolution: seven suffixes, five false friends, one stress rule (four suffixes, one behaviour) and two vowel
  pairs. The rest of the code is left to later recycling, and the page says so.
- **A song would need a real clip we cannot ship.** Resolution: the lyric is *named*, quoted two lines, and the
  page says where to hear it; the audio chips read the words, not the record.
- **False friends invite a long list.** Resolution: five, each with a sentence the student would really say.

## Shape of the session
1. **Duas linhas de uma música** — the heard entrance, one cognate, one false friend.
2. **A fábrica de sufixos** — the seven keys, the table, sixteen words.
3. **O cognato que ninguém fala** — the formal/real pair (*photograph/photo, profession/job…*).
4. **Falsos amigos** — the five swaps, with the sentence each one ruins.
5. **Onde bate a sílaba** — -tion/-sion/-ity/-ic, six placements.
6. **Vogais curtas** — /ɪ/ vs /iː/, /ʌ/ vs /æ/, four listening pairs.
7. **A escada aplicada** — one opinion in three strengths.
8. **Treino** — mixed, plus one recording.
9. **Quiz — sem consulta.**

## Notes for the build pass
`.wide` on the transformation block: each item is a Portuguese word plus its English in one line, wider than a
tile (reason stated here). `data-say` on every cognate pair and on the three register versions.

`recycles:` lesson 1's `be`, `a/an` by sound, `it`, and the strength ladder (reused, not re-taught).
`must not re-teach:` lesson 1's subject law and sound laws; lesson 3 owns wh- questions, embedded questions and
repair chunks; lesson 4 owns the simple present and -s.

