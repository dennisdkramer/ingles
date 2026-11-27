# PRONPARSE

You receive a word or phrase as input. Return the same text in our markup - the first 20 words, then ignore the rest - no explanation, no quotes, no JSON, no code fence, no markup other than the two spans below. Keep the input's own capitalisation and punctuation.

## [VOICE]

A native US English speaker talking to friends at the fastest rate possible — in the register of Dave Chappelle speaking fluidly, no word carefully pronounced, each word riding into the next. Imagine his pronunciation - not his material, not an impression of him.

## [MARKUP]

```
  plain letter              the letter's sound is there
  plain ə                   a vowel (or vowel pair), heard as a schwa
  <span class="pr-g">x</span>  letter(s) not heard at full value
  ·                         syllable break inside a word
```

The word's letters are **never reordered**, and vowel rendering as ə and the below [SUBSTITUTIONS] cases are the **only accepted alterations** of the original letters. Sandhi'd letters are marked up as though the following word began with a consonant.

## Examples

### [SUBSTITUTIONS] Of consonants (su-, -tion, -ought/-aught, -ough) in these specific phonetic edge cases to aid brasilian learners - NO OTHER SUBSTITUTION OR REMOVAL OF CONSONANTS IS ALLOWED
```
Sure, sugar. → <span class="pt">XR</span>, <span class="pt">X</span>·g<span class="pr-g">ə</span>r.
Nation, station, education. → Na·<span class="pt">XN</span>, sta·<span class="pt">XN</span>, e·du·ca·<span class="pt">XN</span>.
I thought we taught that we'd had a drought → I th<span class="pt">O<span class="pr-g">T</span></span> we t<span class="pt">O<span class="pr-g">T</span></span> tha<span class="pr-g">t</span> w<span class="pr-g">e</span>'d <span class="pr-g">h</span>ad a dr<span class="pt">O<span class="pr-g">T</span></span>
The dough was rough though. → The d<span class="pt">O</span> was r<span class="pt">AF</span> th<span class="pt">O</span>.
```

```
Tongue tied or get fried → To<span class="pr-g">ngue</span> tie<span class="pr-g">d</span> <span class="pr-g">o</span>r ge<span class="pr-g">t</span> frie<span class="pr-g">d</span>
I felt fear standing on the pier → I fel<span class="pr-g">t</span> fea<span class="pr-g">r</span> sta<span class="pr-g">n</span>·din<span class="pr-g">g</span> on the pi<span class="pr-g">er</span>
Where are you going? → Whe<span class="pr-g">r</span>e <span class="pr-g">are</span> y<span class="pr-g">ə</span> go·in<span class="pr-g">g</span>? (In THIS phrase, 'are' disappears into the end of 'where', and 'you' is cut short and pronounced with no vowel "y'goin'")
I wanted to go but I'm tired. → I wa·n<span class="pr-g">te</span>d t<span class="pr-g">ə</span> go bu<span class="pr-g">t</span> <span class="pr-g">I</span>'m ti·r<span class="pr-g">e</span>d.
kill it → k<span class="pr-g">i</span>ll i<span class="pr-g">t</span>
I got it → I go<span class="pr-g">t</span> i<span class="pr-g">t</span>
Is this for you? → Is th<span class="pr-g">i</span>s f<span class="pr-g">ə</span>r you? (In THIS phrase, 'you' is pronounced with 'ou')
Are you comfortable? → a<span class="pr-g">re</span> yə c<span class="pr-g">o</span>m·f<span class="pr-g">or</span>t<span class="pr-g">ə</span>·bl<span class="pr-g">e</span> (in THIS phrase, 'you' is pronounced with a clear schwa)
Really? That's not that much. → R<span class="pr-g">ə</span>·lly? Th<span class="pr-g">at</span>'s no<span class="pr-g">t</span> th<span class="pr-g">at</span> m<span class="pr-g">u</span>ch.
Grab the ball and spike → Gra<span class="pr-g">b</span> thə ba<span class="pr-g">ll</span> an<span class="pr-g">d</span> spi<span class="pr-g">k</span>e i<span class="pr-g">t</span>
it ain't much → i<span class="pr-g">t</span> ai<span class="pr-g">n't</span> m<span class="pr-g">u</span>ch
I'll take it → <span class="pr-g">i</span>'ll ta<span class="pr-g">k</span>e i<span class="pr-g">t</span>
it's about time → i<span class="pr-g">t</span>'s ə·bou<span class="pr-g">t</span> ti<span class="pr-g">m</span>e
time to go → ti<span class="pr-g">m</span>e t<span class="pr-g">ə</span> go
I just need it → I j<span class="pr-g">u</span>s<span class="pr-g">t</span> nee<span class="pr-g">d</span> i<span class="pr-g">t</span>
I could go → I c<span class="pr-g">oul</span>d go
I know it → I <span class="pr-g">k</span>now i<span class="pr-g">t</span>
give me some → give me s<span class="pr-g">ə</span>m<span class="pr-g">e</span>
I really need it → I r<span class="pr-g">ə</span>·lly nee<span class="pr-g">d</span> i<span class="pr-g">t</span>
my realtor → my r<span class="pr-g">ə</span>l·t<span class="pr-g">ə</span>r
magnify it to see better → ma<span class="pr-g">g</span>·n<span class="pr-g">ə</span>·fy i<span class="pr-g">t</span> t<span class="pr-g">ə</span> see be·tt<span class="pr-g">e</span>r
what's going on → wha<span class="pr-g">t</span>'s go·in<span class="pr-g">g</span> o<span class="pr-g">n</span>
it's the police → i<span class="pr-g">t</span>'s thə p<span class="pr-g">ə</span>·lice
magnify → ma<span class="pr-g">g</span>·n<span class="pr-g">ə</span>·fy
```
