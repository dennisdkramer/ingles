  /* ---------------- trainOrder: the order of adjectives, on a train that must fit under a bridge ------

     THE PICTURE, and why a wrong order breaks it.
     A train stands on a FLAT track with a low girder bridge across the LEFT of the yard, and it runs out
     to the left, under that bridge. There is one car per adjective slot, in the order the language keeps
     them — Opinion at the front (leftmost, because that is the end that reaches the bridge first) through
     Purpose at the back — and the CARS are what step: each car behind the one in front is 6px TALLER, so
     its loading deck is 6px higher. Every word grows to the height its OWN slot is allowed — the front
     slot's word is the tallest block and each slot further back is 6px shorter — so a word standing on
     its own car tops out on ONE level line, 3px under the girder: the whole train fits, with 3px to
     spare. A word put in a car BEHIND its own stands on a deck 6px higher than its height expected, so
     its top comes through the bridge. A word put in a car IN FRONT of its own is only shorter than it
     needed to be and leaves a gap under the bridge — which is why SKIPPING A CAR IS FINE. The sentence
     climbs either way; only an order that lifts a load into the girder is a wreck.

     THE ROUND. The words of one sentence wait in the dock at the bottom at ONE size, with a porter
     standing in front of every car. The student hands each word to a porter (drag it, or tap the word and
     tap the car), and when the last one has been handed over the porters THROW them up onto their cars
     half a second apart, and each card expands to its own slot's height as it lands. No colour, no
     verdict and no cue while that happens: the reveal is the height itself. Then the train goes. If
     nothing hits the bridge it runs out of the yard, the train scores the run ONE POINT and the next
     train rolls in. If something does, the load comes through the deck, the girder breaks over that car,
     the train lurches to a stop and that train is a wreck: no point, and the next train rolls in.

     THE DOCK CLOCK. Every train has a departure clock (`data-depart`, default 30s). If it runs out while
     words are still in the dock, the train BEHIND rams it: a second locomotive comes in from the right,
     hits it, and the yard goes up. That train is a wreck too. Then everything fades, and a second later
     the next train arrives, the porters walk up from the bottom of the screen, and a fresh set of words
     appears in the dock.

     BOARD MODE, one item per WORD. Items that share a `data-train` value are one sentence, in the order
     they are authored; a block with no `data-train` is one train. An item's options are the SLOTS (one
     radio per car — the cars ARE those options, so a block that writes six writes six cars), `value`
     naming the slot (`opinion`, `size`, …, matched case-blind) or its number (1–8), and `data-a` is the
     slot the word belongs in. A word thrown into its own car checks that car's radio — the evidence the
     teacher reads; a word anywhere else leaves its radio blank.

     THE SCORE IS TRAINS, not words. `view.score()` reports the trains that came through, and `begin()`
     states `r.total` itself so the HUD's pair reads 2/4 for a run of four trains — one point a train.
     That is why a correctly placed word is checked here rather than through `r.scoreBoard` (which would
     count WORDS into the run's score and could outnumber the trains): the radio write is the same one.

     LEVERS. `data-slots` (a `|` list, defaulting to the block's own options) · `data-depart` (seconds on
     the dock, 0 = no clock) · `data-labels` (`auto` | `1` | `0`: the car-name plaques) · `data-label-max`
     (the level the plaques stop helping, 30) · `data-level` (this block's level, when the page has no
     lesson number of its own). The labels are HIDDEN above `data-label-max`: by then the student is
     expected to know the order, and a plaque saying "Opinion" over the front car is the answer written
     on the page. */
  PLUGINS.trainOrder = function (r) {
    var stage = r.stage;
    /* the yard's arithmetic, in px from the BOTTOM of the stage. These are not decoration: they are the
       rule the game teaches, so they are written once here and the yard is built out of them.
         DOCK   the hand of cards, along the bottom
         GUY    a porter, standing on the platform below the rails
         RAIL   the line every car stands on — the track is FLAT
         CAR0   the front car's body; each car behind it is STEP taller, so its deck is STEP higher
         CARD0  the front slot's load; each slot further back is STEP shorter
       so a load in its own car tops out at RAIL + CAR0 + CARD0 = TALL for every car, and the girder's
       underside is GAP (3px) above that. */
    var SH = 340, DOCK = 54, GUY = 56, RAIL = 110, CAR0 = 34, STEP = 6, CARD0 = 118, GAP = 3;
    var TALL = RAIL + CAR0 + CARD0, OB = TALL + GAP;
    /* where the train rests, and where the bridge's right edge is, in % of the yard's width. The train
       stands clear of the bridge so it has a run-up, and stops short of the right edge so the train
       behind it can be seen coming in when the clock runs out. */
    var TRAIN_L = 26, TRAIN_W = 64, GATE = 22, LOCO = 9;
    /* the stage is taller than the shared 280px: this game is drawn from the bottom up in px, so the
       height comes from the same constants rather than from a CSS rule that could drift from them */
    stage.style.height = SH + 'px';

    /* the slots, in the order the language keeps them: the block's own options name them (the cars ARE
       the options), `data-slots` overrides, and the eight canonical names are the last resort */
    var SLOTS = (function () {
      var out = [];
      (r.root.getAttribute('data-slots') || '').split('|').forEach(function (s) {
        s = s.replace(/\s+/g, ' ').replace(/^\s|\s$/g, '');
        if (s) out.push(s);
      });
      if (!out.length) {
        (r.items && r.items[0] ? r.items[0].opts || [] : []).forEach(function (o) {
          var t = (o.text || '').replace(/\s+/g, ' ').replace(/^\s|\s$/g, '');
          if (t) out.push(t);
        });
      }
      return out.length ? out : ['Opinion', 'Size', 'Age', 'Shape', 'Color', 'Origin', 'Material', 'Purpose'];
    })();
    var N = SLOTS.length;
    function slug(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ''); }
    var SLUGS = SLOTS.map(slug);
    function slotOf(value) {
      var i = SLUGS.indexOf(slug(value));
      if (i > -1) return i;
      var n = Number(value);                    /* 1..8 names a car too, for a block written in numbers */
      if (isFinite(n) && n >= 1 && n <= N) return Math.round(n) - 1;
      return -1;
    }
    /* the student's level. A lesson page declares `L`; a preview page does not, and a block may always
       state its own with `data-level`. No level known reads as a beginner: the plaques stay up. */
    function levelNow() {
      var own = num(r.root, 'data-level', 0);
      if (own > 0) return own;
      try { if (typeof L === 'number' && isFinite(L)) return L; } catch (e) { /* no lesson number */ }
      return null;
    }
    function labelsOn() {
      var v = (r.root.getAttribute('data-labels') || 'auto').toLowerCase();
      if (v === '1' || v === 'on' || v === 'show') return true;
      if (v === '0' || v === 'off' || v === 'hide') return false;
      var lvl = levelNow();
      return lvl == null ? true : lvl <= num(r.root, 'data-label-max', 30);
    }
}
