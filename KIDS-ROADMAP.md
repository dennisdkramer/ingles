# KIDS-ROADMAP

## Decisions

   · Item budget: 10 vocabulary items in every teaching lesson, the floor of the 10–12 window. The student is 14 with a short attention span, so width comes from labels and carrier length, never from more words.
   · Label budget: 3–4 labels per teaching lesson. The pinned lessons 1–2 carry 3 each, because PEDAGOGY.md pins one overview plus one code for each of them and a fourth would be a drill, not a lesson.
   · Exam budget: exams at 25 and 45 own no `teaches:` and no `vocabulary:`, and each names exactly 10 primary labels under `uses:` (`-ExamUses 10`). Ten is the diagnosis: the ones where a failure means the block has not landed.
   · Tail policy: lessons 46–50 are tail — nothing in 1–45 depends on them.
   · Split rule: a concept a student could fail while passing its neighbour is two labels, never one wider label — hence `sound/short-vs-long` and `sound/vowel-pairs` side by side in lesson 2.
   · Spelling ruling (ambiguity): US spellings are used throughout (favorite, color, soccer), chosen once so a vocabulary item is never split into two spellings.
   · Tail-length ruling (ambiguity): the generator fixes 25 and 45 as exams but not the shape after them. Ruling: block 2 ends at 44 and the tail is 46–50, five lessons, which is the shape the checker counts.
   · Numbers: the counts below came out of `Test-Roadmap.ps1 -Counts` after the last lesson was written, never from memory.
   · Shape of the cut: 27 families, 181 labels over 27 areas, 480 vocabulary items, 48 teaching lessons and 2 exams.

## Shape

   · Blocks: 1–24 Foundations (sound, hooks, one skeleton, fact and right-now, prepositions, past) · 25 EXAM · 26–44 Building (future, phrasal families, the perfect, comparison, conditions, reporting) · 45 EXAM · 46–50 Tail (past perfect, imaginary conditionals, passive, tags, slang)
   · Spine: 27 families — spine kept in `ROADMAP GENERATION/work/kids-spine.md` (not shipped)

## Lesson 1

   - Focus: What this track is and the two codes that make English readable: letters are not sounds, and a cognate's ending tells you how to say it.
   - teaches: `sound/vowel-no-fixed`, `cognate/suffix-codes`, `method/one-rule-then-drill`
   - Deepens: none - lesson 1 has nothing behind it to deepen.
   - Uses: none - nothing earlier is leaned on here.
   - Vocabulary: video, computer, music, possible, famous, natural, invention, creature, distance, action
   - Examples: "video is vii-dee-oh, not vee-dee-oh"; "invention ends in -tion, so it lands as invenção"; "famous ends in -ous, so it lands as famoso"; "distance ends in -ance, so it lands as distância"
   - Real-world relevance: Every stream title and chat message is full of these words, and a 14-year-old meets them before knowing why they sound wrong in Portuguese shape.

## Lesson 2

   - Focus: Same letter, two sounds: the silent e that flips a vowel and the vowel pairs that are one sound, plus the cognates whose shape lies.
   - teaches: `sound/short-vs-long`, `sound/vowel-pairs`, `cognate/partial-trap`
   - Deepens: `sound/vowel-no-fixed`, `cognate/suffix-codes` - the overview becomes a worked rule: two spelling patterns that predict the sound, and the suffix code pushed to the cognates it cannot rescue.
   - Uses: none - everything borrowed here is being deepened.
   - Vocabulary: parent, push, pretend, actually, library, college, cheese, foot, moon, tree
   - Examples: "hat and hate, bit and bite"; "cheese and feet carry ee, moon carries oo"; "my parents are not meus parentes"; "actually means na verdade, not atualmente"
   - Real-world relevance: These are the words that make a student sound fluent in English and say the opposite of what they meant in front of the wrong person.

## Lesson 3

   - Focus: be, get and it: how to say how you are, what you got, and what the weather is doing.
   - teaches: `hook/be-state`, `hook/get-wildcard`, `hook/it-empty-subject`, `sound/contractions-be`
   - Deepens: `sound/short-vs-long` - the vowel that was read alone last lesson now disappears inside I'm and it's, so the spelling stops predicting anything.
   - Uses: `video` - the item from lesson 1 returns inside a be sentence.
   - Vocabulary: hungry, bored, tired, ready, late, sick, dead, free, ticket, battery
   - Examples: "I'm hungry, it's late, my battery is dead"; "I got a ticket for the match"; "it's raining, not está chovendo with no subject"
   - Real-world relevance: A student states their own state and reports a small win or a small loss dozens of times a day, and every one of those sentences is be or get.

## Lesson 4

   - Focus: have, do, make, go: the four verbs that cover what Portuguese splits and merges with ter and fazer.
   - teaches: `hook/have-own`, `hook/do-action`, `hook/make-vs-do`, `hook/go-place`
   - Deepens: `hook/be-state` - be named a state; these four name what you own, perform or move toward, so the same short sentence now carries an action.
   - Uses: `hook/get-wildcard` - get is still the fallback when none of the four fits, and it is checked against them here.
   - Vocabulary: money, idea, job, chore, homework, dish, mess, room, project, "have fun"
   - Examples: "I have a project and no idea"; "do the dishes, make a mess, make a plan"; "I go to school by bus"; "I'm gonna get some money for it"
   - Real-world relevance: Pocket money, chores and school projects are an adolescent's main economy, and Portuguese covers all of it with ter and fazer.

## Lesson 5

   - Focus: a, the and there is: how English introduces a thing, then points back at it, and how it says something exists.
   - teaches: `hook/there-is-are`, `article/a-vs-the`, `article/no-article-general`
   - Deepens: `hook/have-own` - PT "tem" covers both owning and existing; this lesson splits have from there is and drills the split.
   - Uses: `hook/go-place` - the place words below are the ones go lands on.
   - Vocabulary: shop, street, park, mall, cinema, gym, field, court, "bus stop", snack
   - Examples: "there's a gym near the park"; "I go to the gym, I go to the park"; "I like snacks, not I like the snacks"; "the shop on the corner"
   - Real-world relevance: Every description of where something is starts with a or the, and "tem um parque perto daqui" is the sentence a Brazilian says wrong most often in English.

## Lesson 6

   - Focus: The frame every English sentence is built on, and the one place the verb itself changes: the -s of he, she and it.
   - teaches: `mode/skeleton`, `mode/empty-mode-verb-marks`, `present/third-person-s`, `mode/verb-base-form`
   - Deepens: `hook/be-state` - be was one verb with its own forms; the same slot now takes any verb, and only he, she and it leave a mark on it.
   - Uses: `hook/go-place` - the place slot at the end of the frame is the place from go.
   - Vocabulary: play, like, want, live, walk, run, eat, watch, study, sleep
   - Examples: "subject + mode + verb + object + place + time"; "he plays, they play"; "I play after school, I play at the park"
   - Real-world relevance: The frame is what makes a sentence the student has never heard sayable, which is the whole point of a 14-year-old learning a language for memes and games.

## Lesson 7

   - Focus: Saying no: the marker leaves the verb and sits on don't or doesn't, and the verb goes back to base.
   - teaches: `mode/filled-mode-marker-moves`, `mode/do-support`, `mode/negation-dont-doesnt`, `sound/contractions-negative`
   - Deepens: `mode/empty-mode-verb-marks` - the -s the verb carried alone in lesson 6 moves onto does here, which is the same rule with the mode slot filled.
   - Uses: `mode/skeleton` - the negative is the frame with the mode slot filled and nothing else moved.
   - Vocabulary: know, need, speak, drive, cook, sing, dance, swim, read, work
   - Examples: "he doesn't speak, she doesn't drive"; "I don't cook and I don't need to"; "it isn't far, I'm not tired"
   - Real-world relevance: Refusing, disagreeing and saying "I can't" is most of what a teenager says to a parent, and "he doesn't plays" is the error that never dies.

## Lesson 8

   - Focus: Asking: do and does move in front of the subject, a wh-word goes first, and the short answer repeats the mode.
   - teaches: `question/do-does-front`, `question/short-answer`, `question/wh-front`, `question/subject-who`
   - Deepens: `mode/do-support` - do already filled the mode for negation; here the same do moves in front of the subject, so nothing new enters the sentence, it only changes place.
   - Uses: `mode/skeleton`, `present/third-person-s` - the -s is what decides do or does, and it stays on the subject side in who plays.
   - Vocabulary: name, favorite, phone, password, username, nickname, score, seat, team, price
   - Examples: "what's your username"; "who plays on your team"; "do you have the password"; "yes I do, no I don't"
   - Real-world relevance: Joining a lobby, swapping handles or finding the score are all questions, and a kid who cannot ask stays outside the group.

## Lesson 9

   - Focus: The simple present means a fact, a habit or a rule of the world, and it never means happening now.
   - teaches: `present/facts-not-now`, `present/general-truth`, `present/habit`, `present/scheduled-fact-future`
   - Deepens: `present/third-person-s` - the -s from lesson 6 gets its real job here: it marks a fact, and a fact never marks a moment.
   - Uses: `mode/skeleton` - every sentence below is the frame with an empty mode slot.
   - Vocabulary: cat, dog, spider, snake, sun, ice, grow, bite, hate, prefer
   - Examples: "cats hate water"; "the stream starts at eight"; "I walk to school every day"; "spiders bite, snakes bite"
   - Real-world relevance: Facts are how a student argues about games, animals and rules, and "I study English" is the sentence that gets mistranslated into "I am studying" every single time.

## Lesson 10

   - Focus: Frequency words in the right slot, a routine told in order, and where in, on and at sit when the routine needs a time.
   - teaches: `present/frequency-adverbs`, `present/routine-chain`, `present/every-and-once`, `prep/at-night-in-the-morning`
   - Deepens: `present/facts-not-now` - a habit was one kind of fact; here it is placed in time, with the frequency word in its slot and the steps in order.
   - Uses: `present/third-person-s`, `hook/it-empty-subject` - the routine is third person half the time, and the clock needs the empty it.
   - Vocabulary: alarm, breakfast, shower, lunch, dinner, clock, weekday, weekend, uniform, toothbrush
   - Examples: "I always hit snooze"; "it's eight at night"; "in the morning, at night, on Monday"; "on weekdays I'm at school"
   - Real-world relevance: The routine is the only context where a student repeats the same ten sentences every day, which makes it the cheapest place to make the grammar automatic.

## Lesson 11

   - Focus: The other form of the present: be + -ing for the action in progress, and the spelling that -ing needs.
   - teaches: `continuous/be-plus-ing`, `continuous/right-now`, `continuous/temporary`, `continuous/ing-spelling`
   - Deepens: `hook/be-state` - be carried a state alone in lesson 3; with -ing behind it the same be carries an action in progress, which is the one thing the fact block cannot say.
   - Uses: `mode/skeleton`, `present/facts-not-now` - the frame is unchanged and the fact form is the contrast this lesson is measured against.
   - Vocabulary: chat, stream, download, upload, search, scroll, type, click, charge, "log in"
   - Examples: "I'm charging my phone"; "he's downloading the update"; "I'm living with my uncle this month"; "getting, running, making"
   - Real-world relevance: A kid narrating what they are doing on a phone is the natural habitat of this form, and "estou baixando" is the sentence that exposes the mistake instantly.

## Lesson 12

   - Focus: The same verb in both forms: the fact and the moment, standing next to each other so the choice stops being a guess.
   - teaches: `present/simple-vs-continuous`, `present/not-now-trap`, `present/question-simple-vs-continuous`, `continuous/with-always`
   - Deepens: `present/facts-not-now`, `continuous/right-now` - the two forms are put against each other here, so what was learned separately becomes one decision made per sentence.
   - Uses: `mode/skeleton`, `question/do-does-front` - the two question forms are the sharpest test of the choice.
   - Vocabulary: sofa, fridge, "living room", charger, headphones, noise, volume, screen, blanket, curtain
   - Examples: "do you play? are you playing?"; "I'm on the sofa, I sit on the sofa when I study"; "you're always losing the charger"
   - Real-world relevance: "O que você está fazendo?" answered with "I study" is the sound of a Brazilian speaking English, and it is fixed in exactly one lesson of paired drills.

## Lesson 13

   - Focus: The verbs that refuse -ing: know, like, want, need, hate, believe, and the senses.
   - teaches: `present/state-verbs-no-ing`, `present/state-in-now`, `present/have-possession-vs-action`, `present/senses-simple`
   - Deepens: `present/facts-not-now` - the fact form was chosen for facts; here it is forced on a set of verbs even when the moment is right now.
   - Uses: `continuous/right-now`, `continuous/be-plus-ing` - these verbs are defined by what they refuse, so the continuous has to be on screen to be refused.
   - Vocabulary: opinion, truth, smell, taste, sound, memory, joke, secret, luck, reason
   - Examples: "I want water now"; "it smells like rain"; "I'm having lunch, but I have a bike"; "I know the truth"
   - Real-world relevance: A teenager states opinions and wants all day, and "I'm wanting" or "I'm knowing" is the mark of a student who learned -ing as a decoration.

## Lesson 14

   - Focus: can: ability, permission and requests in one word that never changes shape.
   - teaches: `modal/can-ability`, `modal/can-permission-request`, `modal/can-question-order`, `sound/can-vs-cant`
   - Deepens: `mode/verb-base-form` - the base form after a filled mode was the rule from lesson 6; can is the first mode with no -s to give, so the rule is finally visible on a word that cannot change.
   - Uses: `mode/skeleton`, `question/do-does-front` - can takes the question slot do takes, which is the whole point of calling it a mode.
   - Vocabulary: skate, guitar, trick, coach, level, skill, ball, bike, goal, race
   - Examples: "I can play the guitar"; "can you skate?"; "I can't do that, not yet"; "can I go now?"
   - Real-world relevance: "I can't" and "can I" open every door in a game lobby and in a house with rules, and the spoken can/can't difference decides whether the answer was yes.

## Lesson 15

   - Focus: to and for: direction, the infinitive marker, purpose, and the one Portuguese word that splits into both.
   - teaches: `prep/to-direction`, `prep/to-infinitive-marker`, `prep/for-purpose`, `prep/para-split`
   - Deepens: `hook/go-place` - go needed a place in lesson 4; here the preposition in front of that place is explained, so to stops being a word the student copies and becomes the direction marker.
   - Uses: `modal/can-permission-request` - every request in this lesson is built on can, which is where the pair is drilled.
   - Vocabulary: gift, card, favor, prize, ride, lift, winner, coin, tip, balloon
   - Examples: "give it to me"; "this is for you"; "I made it for fun"; "I want to try"; "can you do me a favor?"
   - Real-world relevance: "para" is one word in Portuguese and two in English, so this is the split that marks a speaker as translating rather than speaking.

## Lesson 16

   - Focus: on, in and at as three shapes: contact, container, point — in space and in time.
   - teaches: `prep/on-contact`, `prep/in-container`, `prep/at-point`, `prep/time-preps`
   - Deepens: `prep/to-direction` - to showed movement toward a place; on, in and at describe the shape of where it landed, so the pair go to / stand at is now visible.
   - Uses: `hook/go-place`, `article/a-vs-the` - the place needs its article before the preposition can be chosen.
   - Vocabulary: box, drawer, pocket, wall, shelf, corner, floor, roof, gate, door
   - Examples: "in the box, on the shelf, at the door"; "in 2026, on Monday, at eight"; "it's on the app, in the game"
   - Real-world relevance: Finding things and fixing times is most of what a student texts about, and one wrong preposition is the error a native speaker notices first.

## Lesson 17

   - Focus: Verbs that carry their preposition: the pair is the word, changing the preposition changes the meaning, and the object can hide at the end of a question.
   - teaches: `prep/verb-plus-prep-unit`, `prep/prep-changes-meaning`, `prep/prep-at-end-in-questions`
   - Deepens: `prep/to-direction` - to was a marker standing on its own; here it is welded to verbs, so listen to and belong to stop being a choice and become part of the unit.
   - Uses: `question/wh-front`, `modal/can-permission-request` - the wh-question and the request are the two frames the pairs are drilled in.
   - Vocabulary: "wait for", "depend on", "listen to", "agree with", "belong to", "worry about", "ask for", "pay for", "laugh at", "think about"
   - Examples: "who are you waiting for?"; "it depends on the weather"; "I listen to music every day"; "I agree with you"; "he never pays for anything"
   - Real-world relevance: These ten pairs cover waiting, paying, worrying and listening, which is what a group chat is made of, and the preposition is what a teacher can hear going wrong.

## Lesson 18

   - Focus: was and were: the past of be, there was and there were, and the one verb that never borrows did.
   - teaches: `past/be-was-were`, `past/there-was-were`, `past/was-there-question`, `past/be-past-vs-simple`
   - Deepens: `hook/be-state` - be named a state in the present; the same verb takes the past here and it is the only verb in the course that never borrows did.
   - Uses: `hook/there-is-are`, `article/a-vs-the` - there is becomes there was, and the noun after it still decides the form.
   - Vocabulary: weather, party, trip, game, crowd, line, hill, beach, farm, hotel
   - Examples: "I was at the game"; "we were at the beach"; "there was a crowd, there were lines"; "were you at the party?"
   - Real-world relevance: Where you were and how it was is the opening of every story a 14-year-old tells, and "I did be" is what comes out when be is treated like any other verb.

## Lesson 19

   - Focus: Regular past: -ed, the three sounds it makes, and the time words that force it.
   - teaches: `past/regular-ed`, `past/past-time-markers`, `sound/ed-sound-rules`
   - Deepens: `past/be-was-were` - be had its own past form; every other verb builds one, and -ed is the default build.
   - Uses: `mode/skeleton`, `prep/time-preps` - the finished time words take no preposition (yesterday, last night), which is the contrast being drilled.
   - Vocabulary: visit, start, finish, stop, call, help, move, order, arrive, answer
   - Examples: "I called, he helped, we finished"; "yesterday, last night, two hours ago"; "wanted and needed end in -id"
   - Real-world relevance: Recounting yesterday is the most common past-tense act in a teenager's day, and the -ed ending is the first place a Brazilian accent shows.

## Lesson 20

   - Focus: The verbs that ignore -ed, and did: the past mode that takes the marker so the verb can go back to base.
   - teaches: `past/irregular-verbs`, `past/did-back-to-base`, `past/did-questions`, `past/irregular-families`
   - Deepens: `past/regular-ed` - -ed was the default build; these verbs refuse it, and because they are the most frequent verbs in the language they are learned as families, not one by one.
   - Uses: `mode/filled-mode-marker-moves`, `question/do-does-front` - did is the same migration the -s made onto does, and it fronts the question the same way.
   - Vocabulary: take, keep, leave, find, buy, bring, catch, throw, break, fall
   - Examples: "did you take it?"; "I didn't break it"; "he took, he kept, he left"; "sing sang, drink drank, begin began"
   - Real-world relevance: Every story a kid tells about a lost charger, a broken controller or a fight is made of these ten verbs, and "did you went" is the error that survives years of lessons.

## Lesson 21

   - Focus: Telling it in the past: the finished time that forces the form, the action/state choice, and the linkers that make the order audible.
   - teaches: `past/finished-time-rule`, `past/past-narrative`, `past/did-vs-was`, `story/linking-then-after`
   - Deepens: `past/irregular-verbs`, `past/past-time-markers` - the two past families come together as one story: the time word opens it and the irregulars carry it.
   - Uses: `past/did-questions`, `past/there-was-were` - the questions are asked with did and the scene is set with there was.
   - Vocabulary: suddenly, later, finally, then, "at first", "in the end", luckily, anyway, immediately, afterwards
   - Examples: "first there was a line, then we got in"; "I took the bus, then I walked"; "later it broke, and afterwards I was fine"
   - Real-world relevance: Retelling a match, a stream or a school fight in order is the single most requested act of a teenage speaker, and the linkers are what keep the listener oriented.

## Lesson 22

   - Focus: Whose is it: object pronouns, possessives, and the reflexive that points back at the subject.
   - teaches: `pronoun/object-forms`, `pronoun/possessive-adjectives`, `pronoun/possessive-pronouns`, `pronoun/reflexive-self`
   - Deepens: `article/a-vs-the` - articles point at a thing without naming an owner; possessives name the owner instead, and the two never both appear.
   - Uses: `prep/verb-plus-prep-unit` - the object form is what follows the preposition in every one of those pairs: with me, for them.
   - Vocabulary: cousin, neighbor, uncle, aunt, group, twin, brother, sister, player, owner
   - Examples: "that's mine, not his"; "I did it myself"; "give it to them"; "my brother and his friend"
   - Real-world relevance: Ownership fights over a controller, a seat or a phone are settled with these forms, and "the my phone" is a sentence that marks a beginner forever.

## Lesson 23

   - Focus: Commands and invitations: the bare verb with no subject, don't for no, let's for us, and the softeners that keep it polite.
   - teaches: `mode/imperative-base`, `mode/imperative-negative`, `mode/lets-invite`, `mode/polite-imperative-softeners`
   - Deepens: `mode/skeleton` - the frame loses its subject and keeps everything else, so the command is the same skeleton with an empty first slot, which is why the verb cannot take -s.
   - Uses: `mode/negation-dont-doesnt` - don't already negated an action; here it negates a command with no subject in front of it.
   - Vocabulary: press, hold, tap, swipe, drag, skip, pause, mute, restart, "log out"
   - Examples: "press start, don't skip it"; "hold the button"; "let's try again"; "could you pass it, please?"
   - Real-world relevance: Every tutorial, every app and every request to a parent or a teacher is an imperative, so this is the form the student meets before any sentence with a subject.

## Lesson 24

   - Focus: How much and how many: countable against uncountable, some and any, and the safe default a lot of.
   - teaches: `count/countable-vs-uncountable`, `count/some-vs-any`, `count/much-vs-many`, `count/a-lot-of-both`
   - Deepens: `article/no-article-general` - the general statement took no article; here it takes a quantity word instead, and which one depends on whether the noun is countable.
   - Uses: `hook/there-is-are`, `question/wh-front` - how much and how many open the question, and there is or there are finishes the answer.
   - Vocabulary: soda, juice, bread, rice, sugar, salt, meat, fruit, bottle, packet
   - Examples: "there isn't much sugar"; "how many bottles?"; "some juice, any bread?"; "a lot of rice, a lot of friends"
   - Real-world relevance: Ordering food, splitting a bill and checking what is left in the fridge all live here, and "many money" is the giveaway that the countable split was never made.

## Lesson 25

   - Focus: Block 1 diagnosis: the frame, the fact-versus-right-now choice, the past in place, and the prepositions that Portuguese merges.
   - Uses: `mode/skeleton`, `mode/do-support`, `present/facts-not-now`, `continuous/right-now`, `present/state-verbs-no-ing`, `past/irregular-verbs`, `past/did-back-to-base`, `prep/para-split`, `prep/time-preps`, `question/wh-front`

## Lesson 26

   - Focus: gonna: how English says the future out loud, and why it is not the verb go.
   - teaches: `future/gonna-mode`, `future/going-to-place`, `future/gonna-go-distinction`, `sound/gonna-reduction`
   - Deepens: `hook/go-place` - go with a place was movement in lesson 4; with gonna in front of a verb the same words point at the future, and the two are judged against each other here.
   - Uses: `mode/skeleton`, `continuous/right-now` - the future sits in the mode slot and the right-now form is what it is contrasted with.
   - Vocabulary: schedule, calendar, invite, reminder, "group chat", selfie, movie, concert, camping, barbecue
   - Examples: "I'm gonna stream at eight"; "I'm going to the mall"; "I'm gonna go to the mall"; "we're gonna camp on the weekend"
   - Real-world relevance: Plans are a teenager's main social currency, and "I'm going to study" versus "I'm gonna study" is the difference between a plan and a future that the student hears every day on stream.

## Lesson 27

   - Focus: will: the decision taken as you speak, against gonna, the plan that was already made.
   - teaches: `future/will-sudden-decision`, `future/will-vs-gonna`, `future/wont-negative`, `future/will-question-offer`
   - Deepens: `future/gonna-mode` - gonna covered a plan already made; will is the other half of the future, so the lesson is a choice between two modes rather than a new tense.
   - Uses: `modal/can-permission-request`, `question/wh-front` - the offer and the wh-question are the two frames every will sentence sits in.
   - Vocabulary: promise, deal, "right away", "in a minute", probably, sure, maybe, "of course", definitely, "no worries"
   - Examples: "I'll help you, I promise"; "will you bring it? of course"; "I'm gonna study later, probably"; "I won't tell anyone"
   - Real-world relevance: Promising, offering and refusing politely is how a kid negotiates a favour with a parent or a friend, and will is the word that makes it a promise instead of a plan.

## Lesson 28

   - Focus: The arranged future: be + -ing with a time, and the time words that make the future audible.
   - teaches: `future/continuous-arrangement`, `future/time-expression-required`, `future/in-two-weeks`, `future/next-vs-last`
   - Deepens: `continuous/right-now`, `future/gonna-mode` - the continuous meant now and gonna meant intention; a fixed arrangement is the third future and is built from the first two.
   - Uses: `prep/time-preps`, `question/wh-front` - the appointment needs in, on or at, and the confirmation is a question.
   - Vocabulary: appointment, practice, rehearsal, tournament, deadline, tomorrow, tonight, "next time", "the day after", midday
   - Examples: "I'm meeting him at eight"; "the tournament is next week"; "I'm playing in two weeks"; "tonight I'm not doing anything"
   - Real-world relevance: A practice, a tournament and a deadline are the three fixed points of a student's week, and dropping the time word is what makes English sound vague instead of arranged.

## Lesson 29

   - Focus: The get family: one root, four particles, four different actions, and where the object goes.
   - teaches: `phrasal/get-family`, `phrasal/particle-changes-meaning`, `phrasal/get-literal-vs-idiom`, `phrasal/object-after-particle`
   - Deepens: `hook/get-wildcard` - get was the wildcard in lesson 3, one verb doing four jobs; with particles it becomes a family, and the wildcard finally has directions.
   - Uses: `prep/on-contact`, `prep/prep-changes-meaning` - the particle behaves like the preposition against the surface, and the pair is the unit for both.
   - Vocabulary: "get up", "get back", "get on", "get off", "get in", "get out", "get over", "get along", "get together", "get away"
   - Examples: "I get up at seven"; "get on the bus, get off at the mall"; "we get along"; "I got back before dark"
   - Real-world relevance: Getting up, getting on a bus and getting along with someone are three sentences a 14-year-old needs every single day, and English says all three with get.

## Lesson 30

   - Focus: The look family: the same pattern with a second root, plus the particle that splits when a pronoun appears.
   - teaches: `phrasal/look-family`, `phrasal/separable-split`, `phrasal/phrasal-first-formal-gloss`, `phrasal/look-after-care`
   - Deepens: `phrasal/get-family`, `phrasal/object-after-particle` - get showed the family pattern; look repeats it with a new root, so the pattern becomes a method the student can apply to the next root alone.
   - Uses: `prep/prep-changes-meaning`, `pronoun/object-forms` - the split particle exists because the pronoun is an object form, so the two rules meet here.
   - Vocabulary: "look at", "look for", "look up", "look over", "look after", "look out", "look forward to", "look around", "look into", "look away"
   - Examples: "look it up"; "look after your brother"; "I'm looking forward to it"; "look out!"
   - Real-world relevance: Searching a word, checking a message and watching a sibling are all look, and the formal twins (consult, verify, supervise) are glosses the student should recognise but never use by default.

## Lesson 31

   - Focus: What English sounds like when it is fast: wanna, gotta, kinda, and the consonants that slide.
   - teaches: `sound/wanna-gotta`, `sound/kinda-sorta`, `sound/linking-consonant-vowel`, `sound/weak-forms-of-to`
   - Deepens: `sound/gonna-reduction`, `future/gonna-mode` - gonna was already a mode and a reduction; the rest of the set joins it here, and linking is added under them.
   - Uses: `sound/can-vs-cant` - the weak-form principle was already met in can, so the student has one rule and four more examples of it.
   - Vocabulary: "wanna", "gotta", "kinda", "sorta", "dunno", "lemme", "gimme", yeah, nope, yep
   - Examples: "I wanna go, I gotta go"; "whatcha doing?"; "turn it off" heard as one word; "kinda cool, kinda weird"
   - Real-world relevance: This is the English of a stream, a rap verse and a group voice note, and a student who only knows the written forms cannot hear the spoken ones.

## Lesson 32

   - Focus: The third form: have or has + past participle, and the pile of participles that are neither the base nor the past.
   - teaches: `perfect/have-participle`, `perfect/irregular-participles`, `perfect/no-time-anchor`, `perfect/contractions-ive`
   - Deepens: `past/irregular-verbs` - the irregular set gave the second form; the perfect needs the third, so the table gains one column and the pattern carries over.
   - Uses: `hook/have-own`, `past/regular-ed` - have is now the mode rather than possession, and the -ed is the participle the regular half already knows.
   - Vocabulary: write, win, lose, hear, feel, send, spend, sell, tell, sit
   - Examples: "I've never written a song"; "he's lost his keys"; "have you eaten?"; "go went gone, do did done"
   - Real-world relevance: "I've seen it" and "I saw it" split the two pasts a student mixes most, and the third column is where a Brazilian gets stuck because Portuguese has no such form.

## Lesson 33

   - Focus: The perfect for a duration that started in the past and is still true: the trap that Portuguese sets with the simple present.
   - teaches: `perfect/duration-from-past`, `perfect/vs-simple-present`, `perfect/still-yet-duration`
   - Deepens: `perfect/have-participle` - the form is now put to one job, and the job is a duration rather than a finished event.
   - Uses: `present/facts-not-now`, `past/past-time-markers` - the simple present is exactly what this lesson forbids, and the finished time word is what would move the sentence to the past.
   - Vocabulary: "all day", "all week", "for ages", "a long time", "so far", lately, recently, "these days", still, neighborhood
   - Examples: "I've worked here for five years"; "I've lived here all my life"; "I've known him for ages"
   - Real-world relevance: "Trabalho aqui há cinco anos" said as "I work here for five years" is the single sentence that identifies a Brazilian speaker, so it gets a whole lesson rather than a warning.

## Lesson 34

   - Focus: The perfect for experience: ever, never, just, already, yet, and the question that forces the past instead.
   - teaches: `perfect/experience-ever-never`, `perfect/asking-with-ever`, `perfect/just-already-yet`, `perfect/vs-past-when-question`
   - Deepens: `perfect/duration-from-past` - duration was one use of the perfect; experience is the other, and the time word is what decides between them.
   - Uses: `past/did-questions`, `question/wh-front` - the when-question is the past simple's territory and is drilled as the counter-example.
   - Vocabulary: try, abroad, mountain, waterfall, cave, island, jungle, snowboard, hike, surf
   - Examples: "have you ever been abroad?"; "I've never tried surfing"; "I've just seen it"; "when did you go?"
   - Real-world relevance: Comparing what you have and have not done is the conversation a teenager has with a stranger on the first day of anything, and the when-question is where it flips to the past.

## Lesson 35

   - Focus: since and for: the starting point against the length, and the how-long question that needs both.
   - teaches: `perfect/for-length`, `perfect/since-point`, `perfect/how-long-question`, `perfect/ago-vs-since`
   - Deepens: `perfect/duration-from-past` - duration had no anchor; since and for are the two anchors, one a point in time and one a length of it.
   - Uses: `prep/time-preps`, `question/wh-front` - the point after since behaves like an at or an in, and the question is the wh-frame again.
   - Vocabulary: age, childhood, "primary school", "high school", "first time", "last time", month, year, decade, anniversary
   - Examples: "I've played since I was nine"; "I've played for six years"; "how long have you had it?"; "two years ago, not since two years"
   - Real-world relevance: How long you have had a phone, a friend or a game account is small talk a 14-year-old runs on, and mixing since with for turns a clear answer into a puzzle.

## Lesson 36

   - Focus: Comparing two things: -er or more, the than that follows, and the four forms that refuse both.
   - teaches: `compare/short-er`, `compare/long-more`, `compare/than-link`, `compare/irregular-forms`
   - Deepens: `hook/be-state` - be named a quality through an adjective from lesson 3 onwards; here the adjective gains an ending, so the same small sentence can weigh two things against each other.
   - Uses: `pronoun/possessive-pronouns`, `question/wh-front` - the comparison partner is usually mine or yours, and which one opens the question.
   - Vocabulary: fast, slow, big, small, easy, hard, cheap, expensive, funny, loud
   - Examples: "mine is faster than yours"; "this one is more expensive"; "better, worse, further"; "which one is bigger?"
   - Real-world relevance: Comparing phones, teams and prices is the sport of a school corridor, and "more fast" is the mistake that survives the longest.

## Lesson 37

   - Focus: Picking one out of all of them: the superlative with the, equal and unequal with as, and the plural after one of the.
   - teaches: `compare/superlative-est`, `compare/as-as-equal`, `compare/best-vs-better`, `compare/one-of-the`
   - Deepens: `compare/than-link`, `compare/short-er` - comparing two was the pair; choosing one out of a group widens the same mechanism and puts the in front of it.
   - Uses: `article/a-vs-the`, `compare/irregular-forms` - the is the article pointing at the only one, and the irregular forms supply the best and the worst.
   - Vocabulary: champion, record, medal, trophy, legend, ranking, scoreboard, rival, audience, season
   - Examples: "he's the best player in the season"; "one of the best"; "not as fast as him"; "the worst game ever"
   - Real-world relevance: Ranking a team, a player or a game is a teenager's favourite judgement, and the superlative is how a player becomes a legend in a group chat.

## Lesson 38

   - Focus: Duty and advice: have to, don't have to, mustn't, should and must, and the two negatives that mean opposite things.
   - teaches: `modal/have-to-duty`, `modal/dont-have-to-vs-mustnt`, `modal/should-advice`, `modal/must-strong`
   - Deepens: `modal/can-ability` - can filled the modal slot for ability; the slot stays the same and the meaning changes with the word, which is why the rest of the modals land here together.
   - Uses: `hook/have-own`, `mode/verb-base-form` - have to is have borrowed for duty, and every modal takes the base form behind it.
   - Vocabulary: rule, curfew, allowance, permission, punishment, warning, helmet, seatbelt, bedtime, excuse
   - Examples: "I have to be home by ten"; "you don't have to, but you should"; "you mustn't tell anyone"; "we should try it"
   - Real-world relevance: Curfew, screen time and permission are the daily negotiation between a 14-year-old and an adult, and don't have to versus mustn't is the difference between freedom and a ban.

## Lesson 39

   - Focus: If this happens, that follows: the first conditional, with the present in the condition and will or gonna in the result.
   - teaches: `if/first-conditional`, `if/no-will-in-if-clause`, `if/comma-and-order`, `if/unless`
   - Deepens: `future/will-sudden-decision` - will was a decision taken now; here it is demoted to the result half of a condition, which is why the condition itself cannot take it.
   - Uses: `present/facts-not-now`, `future/gonna-mode` - the condition half is the fact form, and gonna is the spoken alternative in the result half.
   - Vocabulary: forecast, rain, storm, thunder, lightning, sunshine, umbrella, muddy, freezing, humid
   - Examples: "if it rains, we're gonna stay in"; "I'll go unless it's freezing"; "if you finish, you can play"
   - Real-world relevance: Every negotiation over a match, a trip or a game comes out as an if-sentence, and the will in the if-half is the mistake that sounds wrong to every listener.

## Lesson 40

   - Focus: Saying which one you mean: who for people, that for things, where for places, and the link that can disappear.
   - teaches: `relative/who-for-people`, `relative/that-for-things`, `relative/where-for-places`, `relative/dropped-object`
   - Deepens: `question/subject-who` - who asked a question in lesson 8; here the same word stops asking and starts linking, which is why the pattern is recognisable rather than new.
   - Uses: `article/a-vs-the`, `question/wh-front` - the is doing the pointing and the wh-words are being recycled as linkers.
   - Vocabulary: guy, gamer, stranger, teammate, creator, fan, hater, channel, comment, post
   - Examples: "the guy who beat me"; "the game that broke"; "the place where we met"; "the one I told you about"
   - Real-world relevance: Every recommendation a kid makes carries a who or a that, and without it the description stops at "the guy" and the listener has to guess.

## Lesson 41

   - Focus: Doing against wanting to do: like, love, hate and enjoy take -ing, want, need, plan and hope take to.
   - teaches: `verb/like-doing`, `verb/want-to-do`, `verb/stop-doing-vs-to-do`, `verb/go-doing-activities`
   - Deepens: `continuous/be-plus-ing`, `prep/to-infinitive-marker` - the -ing was the continuous's marker and to was the infinitive marker; here both become noun-like slots after a verb, which is where the two rules meet.
   - Uses: `present/state-verbs-no-ing` - like and hate refuse -ing on themselves, so the same lesson explains why the thing enjoyed still takes it.
   - Vocabulary: hobby, puzzle, chess, karaoke, cosplay, manga, anime, band, drum, skateboard
   - Examples: "I like playing chess"; "I want to learn the drums"; "I stopped playing, I stopped to eat"; "we go skateboarding"
   - Real-world relevance: Asking what someone likes and inviting them to try it is the whole social engine of a school break, and the wrong form after like is the error a teacher corrects first.

## Lesson 42

   - Focus: used to: the habits and states that are gone, and the two ways it is not the same as being used to something.
   - teaches: `past/used-to-habit`, `past/used-to-vs-past-simple`, `past/used-to-be-vs-be-used-to`, `past/used-to-question-negative`
   - Deepens: `past/finished-time-rule` - the finished past was one action at one finished moment; used to names what was true again and again and is not true now, and the two forms are set against each other here.
   - Uses: `mode/skeleton`, `past/did-questions` - the question and the negative take did, so the ordinary past machinery is reused rather than replaced.
   - Vocabulary: remember, "photo album", "back then", village, "roller skates", treehouse, marbles, toy, playground, "way back"
   - Examples: "I used to play marbles"; "I didn't use to like anime"; "did you use to live here?"; "I'm used to it now"
   - Real-world relevance: Talking about how things were when you were small is how kids find out what they have in common, and "I use to" versus "I'm used to" is the pair that gets confused for years.

## Lesson 43

   - Focus: The past continuous: what was already happening when something else happened, and the when or while that joins the two.
   - teaches: `past/continuous-background`, `past/when-vs-while`, `past/continuous-vs-past-simple`, `past/two-continuous-and`
   - Deepens: `continuous/right-now`, `past/past-narrative` - the continuous began as right now and the past began as one action after another; putting the first behind the second is the whole point of the lesson.
   - Uses: `sound/contractions-be`, `prep/time-preps` - was and were are almost always contracted in speech, and the time word is what anchors the background.
   - Vocabulary: hallway, footsteps, streetlight, background, "all of a sudden", meanwhile, flashlight, "power cut", siren, silence
   - Examples: "I was watching when the power cut"; "while I was eating, the alarm went off"; "we were talking and laughing"
   - Real-world relevance: Every story a teenager tells about something that went wrong is built out of a background and an interruption, so this is the tense of the best story in the group.

## Lesson 44

   - Focus: Passing on what someone said: say against tell, the tense that steps back, and the pronouns that have to move.
   - teaches: `report/say-vs-tell`, `report/backshift`, `report/reporting-question`, `report/reporting-pronouns-time`
   - Deepens: `past/past-narrative`, `question/wh-front` - the backshift is the past doing its usual job one step further back, and the reported question keeps the wh-word but loses the inversion.
   - Uses: `pronoun/object-forms`, `pronoun/possessive-adjectives` - the pronouns move in reported speech, so the whole pronoun set is exercised at once.
   - Vocabulary: "told me", rumor, whisper, shout, reply, argument, apology, "the truth", gossip, "last night"
   - Examples: "she said she was tired"; "he told me he'd be late"; "she asked where I was"; "I told him I didn't know"
   - Real-world relevance: Being the messenger between two friends is a daily job, and getting the pronouns and the tense wrong is how a message turns into a misunderstanding.

## Lesson 45

   - Focus: Block 2 diagnosis: the future modes, the phrasal families, the perfect, comparison and conditions, scored so a failure names its label.
   - Uses: `future/will-vs-gonna`, `future/continuous-arrangement`, `phrasal/separable-split`, `sound/wanna-gotta`, `perfect/experience-ever-never`, `perfect/since-point`, `compare/superlative-est`, `modal/dont-have-to-vs-mustnt`, `if/first-conditional`, `relative/who-for-people`

## Lesson 46

   - Focus: The step before the story starts: had + participle, and the two events that get their order fixed by it.
   - teaches: `perfect/past-perfect`, `perfect/past-perfect-order`, `perfect/before-experience`
   - Deepens: `past/past-narrative` - one action after another was the shape of a story from lesson 21 onwards; the past perfect is the one move that stands outside that order and puts an action before the story's first line.
   - Uses: `past/irregular-verbs`, `past/past-time-markers` - the participle comes from the same irregular table, and the time word is often what makes the earlier event sound earlier.
   - Vocabulary: sunscreen, sunburn, sandcastle, tide, seashell, cooler, towel, horizon, sunset, souvenir
   - Examples: "when we got there, the game had started"; "I had never seen the sea before that trip"; "she had already left"
   - Real-world relevance: Telling a story out of order is what makes it a story rather than a list, and a kid who cannot step back one event cannot explain why they were late.

## Lesson 47

   - Focus: If it were true: the second conditional, would, and the were that every speaker keeps for I.
   - teaches: `if/second-conditional`, `if/would-vs-will-imaginary`, `if/were-you`
   - Deepens: `if/first-conditional` - the first conditional was a real possibility with a real result; the second is the same frame over something that is not true, so only one half changes.
   - Uses: `past/be-was-were`, `if/comma-and-order` - the condition half is the past form of be, and the comma rule carries over unchanged.
   - Vocabulary: lottery, millionaire, superpower, "time machine", rocket, desert, castle, dragon, spaceship, wish
   - Examples: "if I had a million, I'd buy a car"; "if I were you, I'd go"; "what would you do?"
   - Real-world relevance: Hypotheticals are how a teenager tests a decision before making it, and "if I were you" is the exact phrase a friend uses when the advice matters.

## Lesson 48

   - Focus: When the doer does not matter: be + participle, the by that names the agent, and the reason to choose it.
   - teaches: `passive/be-plus-participle`, `passive/agent-with-by`, `passive/why-passive`
   - Deepens: `perfect/have-participle`, `past/regular-ed` - the third form was built for the perfect; the passive reuses it behind be, so the shape is old and only the word order is new.
   - Uses: `past/be-was-were`, `article/a-vs-the` - the be that carries the passive is the same be the past already used, and the article still points at the thing acted on.
   - Vocabulary: invented, discovered, released, updated, uploaded, blocked, translated, designed, hosted, downloaded
   - Examples: "the game was released in May"; "it was made in Brazil"; "my account got blocked"; "English is spoken here"
   - Real-world relevance: Release dates, blocked accounts and "made in" labels are all passive, and a student who only reads active sentences misreads half of what a product page says.

## Lesson 49

   - Focus: Question tags: the flipped short question at the end, the mode it repeats, and the answer that follows it.
   - teaches: `tag/positive-negative-flip`, `tag/repeat-the-mode`, `tag/answer-with-mode`
   - Deepens: `question/short-answer` - the short answer already repeated the mode instead of the verb; the tag does the same job at the other end of the sentence, which is why the mode is the thing being tested.
   - Uses: `sound/can-vs-cant`, `mode/do-support` - the tag is where a weak spoken form carries the meaning, and do-support supplies the do inside the tag.
   - Vocabulary: "right?", seriously, "no way", "for real", obviously, totally, "I guess", "me neither", "me too", "same here"
   - Examples: "you play, don't you?"; "she can't come, can she?"; "no, she can't"; "it's cold, isn't it?"
   - Real-world relevance: A tag turns a statement into an invitation to agree, which is the politest way a teenager has of checking something without asking directly.

## Lesson 50

   - Focus: The layer under the grammar: slang, abbreviations, and the one question that decides whether they are allowed.
   - teaches: `slang/teen-slang-map`, `slang/where-not-to-use`, `text/abbreviation-set`
   - Deepens: `sound/wanna-gotta`, `sound/kinda-sorta` - the reductions were the spoken layer of informal English; slang and texting are the written layer of the same thing, and both are learned as a map with borders.
   - Uses: `sound/vowel-no-fixed`, `cognate/partial-trap` - abbreviations break the spelling-sound rule and the cognate guess at the same time, so both earlier warnings are what make reading them safe.
   - Vocabulary: emoji, meme, hashtag, vibe, flex, "brb", "idk", "tbh", "ngl", "dm"
   - Examples: "idk, tbh"; "that's a flex"; "dm me"; "brb, gaming"
   - Real-world relevance: This is the English a kid actually types all day, and the skill being taught is not the slang but the border: where it earns a laugh and where it costs an interview.
