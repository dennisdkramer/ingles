  /* ---------------- trainOrder: the order of adjectives, on a flat track under a low bridge ----------
     THE RULE, DRAWN. The slots run Opinion → Size → Age → Shape → Color → Origin → Material → Purpose,
     and that sequence is what the yard is built out of:

       · the track is FLAT and every car stands on it;
       · the CARS step up with the order: each car in the train is STEP px taller than the one in front
         of it, so the deck a card lands on (the car's own top edge) is higher by STEP per slot skipped;
       · a card grows to the height ITS OWN slot leaves it — LEVEL minus the deck that slot stands on —
         so a train loaded correctly has every card top out on ONE level line, LEVEL, which is GAP px
         under the bridge;
       · a card in a car further back than its own is (that car's slot − the card's slot) × STEP too
         tall, so it comes through the bridge. The cards are a permutation of the openings, so a wrong
         order ALWAYS puts at least one card over LEVEL: a swap cannot hide, because the heights would
         have to sum to the same total.

     Two ways to lose a train, and only these two: the load hits the bridge, or the dock clock runs out
     and the train queued behind it rams it. Nothing is marked while the cards are loaded — the shape of
     the load is the only feedback, and the collision is the verdict.

     A TRAIN IS A SENTENCE. One `.qitem` per WORD: the stem is the word, and the options are the cars,
     one radio per slot (`value` naming the slot — `opinion`, `size`, … or `1`–`8`, matched case- and
     punctuation-blind). `data-a` on the item names the slot the word belongs in. The number of CARS is
     the number of words in that train, so one train is one sentence and there is a man in front of every
     car to take the word for it. Items sharing a `data-train` value ride together, in authored order; a
     block with no `data-train` is one train.

     THE RUN. Every card in the dock is the same size — a word's height is not known until it is loaded.
     The student hands each card to a man (drag it onto him, or tap the card then tap the man, or press
     1..n); when the last one is handed over, the men throw them up onto their cars ONE AT A TIME, 500ms
     apart, and only then does each card grow to its slot's height. The train then runs at the bridge on
     the left and the load is judged there, car by car, as it passes. CLEARED is a point and the next
     train; a wreck is not, and the run is the trains.

     LEVERS. `data-depart` (seconds on the dock before the train behind rams it, default 30, `0` = no
     clock) · `data-slots` (the slot names, pipe separated) · `data-labels` (`auto` | `1` | `0`) with
     `data-label-max` — at `auto` the car names are SHOWN up to level 30 and HIDDEN above it, read from
     the lesson's own `L` (or `data-level` on the block), because naming the category is the training
     wheel and a level-30 student is meant to read the cars as positions only · `data-level` · `data-pace`
     (a multiplier on the yard's own theatre, 1 by default — the preview page runs it quick).

     ENDING. The last train is still running at the bridge (or lying wrecked) when the run ends, so the
     view claims `finale(done)` and the runner keeps the stage until the yard is quiet. */
  PLUGINS.trainOrder = function (r) {
    var stage = r.stage;
    /* the slots, in the order the language keeps them. A block may name its own with `data-slots`; a
       radio's value finds its slot by name ("opinion" → Opinion) or by position (1 → Opinion) */
    var SLOTS = (function () {
      var out = [];
      (r.root.getAttribute('data-slots') || '').split('|').forEach(function (s) {
        s = s.replace(/\s+/g, ' ').replace(/^\s|\s$/g, '');
        if (s) out.push(s);
      });
      return out.length ? out : ['Opinion', 'Size', 'Age', 'Shape', 'Color', 'Origin', 'Material', 'Purpose'];
    })();
    /* ---- the yard's arithmetic, in px of the 280px stage, written ONCE and read by everything below ----
       RAIL is the top of the rail (the flat track every car stands on), CAR0 the height of the first
       car, STEP what each car adds to it. A correct load tops out at LEVEL, and the bridge's underside
       is GAP px above that. */
    var RAIL = 60, CAR0 = 34, STEP = 6, LEVEL = 160, GAP = 3, LAST = Math.max(0, SLOTS.length - 1);
    var UNDER = LEVEL + GAP;
    /* ---- and the horizontal ones, in % of the stage's width: the train rests from TRAIN_L to TRAIN_R,
       its locomotive takes LOCOW% of that, and the bridge's arm reaches out to ARM% — so the train at
       rest stands clear of the bridge, and the train behind it has somewhere to come from ---- */
    var TRAIN_L = 32, TRAIN_R = 92, LOCOW = 10, ARM = 27;
    var PACE = Math.max(.2, Math.min(4, num(r.root, 'data-pace', 1) || 1));
    function ms(n) { return Math.round(n * PACE); }

    var yard = el('div', 'g4-yard');
    /* the engine's numbers are written onto the yard, so CSS draws exactly what the engine measures */
    yard.style.setProperty('--rail', RAIL + 'px');
    yard.style.setProperty('--car0', CAR0 + 'px');
    yard.style.setProperty('--step', STEP + 'px');
    yard.style.setProperty('--under', UNDER + 'px');
    yard.style.setProperty('--trainl', TRAIN_L + '%');
    yard.style.setProperty('--trainr', (100 - TRAIN_R) + '%');
    yard.style.setProperty('--locow', LOCOW + '%');
    yard.style.setProperty('--arm', ARM + '%');

    var bank = el('div', 'g4-tbank');
    var rail = el('div', 'g4-ttrack');
    /* the bridge: the POST is behind the track (the far side of it) and the ARM is in front of the
       train, so a load that is too tall disappears behind the arm it is about to hit */
    var post = el('div', 'g4-tpost');
    var arm = el('div', 'g4-tarm');
    var armChunk = el('div', 'g4-tchunk');
    arm.appendChild(armChunk);
    var sign = el('div', 'g4-tsign', '⚠ LOW BRIDGE · ' + GAP + 'px');
    var ram = el('div', 'g4-ttrain g4-tram');
    var train = el('div', 'g4-ttrain');
    var depot = el('div', 'g4-tdepot');
    var dock = el('div', 'g4-twords');
    var clockEl = el('div', 'g4-tclock');
    var stamp = el('div', 'g4-tstamp');
    var fx = el('div', 'g4-tfx');
    [bank, rail, post, ram, train, arm, sign, depot, stamp, fx].forEach(function (n) { yard.appendChild(n); });
    depot.appendChild(clockEl);
    depot.appendChild(dock);
    stage.appendChild(yard);

    var queue = [], trains = [], cars = [], words = [], passes = 0;
    var picked = null, busy = false, ready = false, ended = null;
    var clockLeft = 0, clockTimer = 0, pullTimer = 0, timers = [];

    function later(fn, ms2) { var t = window.setTimeout(fn, ms2); timers.push(t); return t; }
    function stopAll() {
      timers.forEach(function (t) { window.clearTimeout(t); });
      timers = [];
      stopClock();
      if (pullTimer) { window.clearTimeout(pullTimer); pullTimer = 0; }
    }
    function stopClock() { if (clockTimer) { window.clearInterval(clockTimer); clockTimer = 0; } }
    /* a slot name written any way at all is still that slot: "Opinion", "opinion", " origin " */
    function slug(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ''); }
    var SLUGS = SLOTS.map(slug);
    function slotOf(value) {
      var i = SLUGS.indexOf(slug(value));
      if (i > -1) return i;
      var n = Number(value);                    /* 1..8 names a car too, for a block written in numbers */
      if (isFinite(n) && n >= 1 && n <= SLOTS.length) return Math.round(n) - 1;
      return -1;
    }
    /* the student's level. A lesson page declares `L`; a preview page does not, and a block may always
       state its own with `data-level`. No level known reads as a beginner: the names stay up. */
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
    /* ---- the geometry, as the engine means it ---- */
    /* the deck a car of that slot stands on: the car's own top edge, on the flat track */
    function deckTop(slot) { return RAIL + CAR0 + STEP * slot; }
    /* how tall a word of that slot is allowed to be: LEVEL less its own deck. A card that is exactly
       this tall, on exactly that deck, tops out on LEVEL — every time, for every slot. */
    function loadH(slot) { return LEVEL - deckTop(slot); }
    /* ---- the yard is emptied between trains, and every train is laid out of its own words ---- */
    function clearYard() {
      train.innerHTML = '';
      train.className = 'g4-ttrain';
      train.style.transform = '';
      ram.innerHTML = '';
      ram.className = 'g4-ttrain g4-tram';
      ram.style.transform = '';
      armChunk.className = 'g4-tchunk';
      arm.style.opacity = '';
      arm.classList.remove('broken');
      yard.classList.remove('quake', 'fade');
      dock.innerHTML = '';
      fx.innerHTML = '';
      stamp.textContent = '';
      stamp.className = 'g4-tstamp';
      clockEl.innerHTML = '';
      clockEl.style.display = 'none';
      cars = []; words = []; picked = null; ready = false;
    }
}
