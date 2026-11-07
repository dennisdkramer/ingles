/* ---- engine4.js — Tier-1 games: ONE runner, games as presentations ----------------------------
   Contract (FUNCTION.md owns behaviour, FORMAT.md the block):
   - The PAGE carries the real answers: `.game > .game-list > .qitem` (a `.qstem` prompt, optional
     `.listen` chip, `input[type=radio]` options). That markup persists, prints, and is what a
     student sees if this file never runs.
   - The engine only PRESENTS those items and MARKS the radios: a correct pick checks the option it
     stands for and dispatches `change`, so engine1/engine2 save it like any answer. A wrong pick
     leaves the radio blank — the blank is the teacher's evidence.
   - Versatility rule: the runner owns the queue, scoring, replay, HUD, deadline and sound; a game
     supplies only `show / mark / clear`. Content authoring is identical for every game, so
     `data-game` is a presentation choice and never a content choice.
   Levers (all optional, on the `.game` element):
     data-game      which presentation (one per PLUGINS key: catchBasket, whackMole, stackDrop,
                   flapGate, skeetRange, mineGrid, wordleBoard, crosswordBoard,
                   echoPads, bingoCard, ladderRun, bossRaid)
     data-time      ms per item, 0 = no deadline   (0)   ← this is difficulty
     data-limit     seconds for the whole run, 0 = off (0)
     data-replay    0 | 1   missed items return once at the end (1)
     data-retry     0 | 1   the run may be repeated at all: no replay of the misses and no Play again
                            (1). A block that IS the quiz sets 0 — what the student answered once,
                            stands; a block in the training part leaves it on (default 1)
     data-shuffle   0 | 1   present items in random order (1)
     data-rounds    how many items a run uses, 0 = all authored (0)
     data-prompt    0 | 1   show the stem on the HUD line (1)
     data-sound     0 | 1   hit / miss / win blips (1)
     data-skin      free-form name; CSS may theme on it, the engine never reads it
   The score in the HUD is a pair of numbers and never a word with a unit: `got/items`, counting up
   from 0/6 as items are got. Lives are NOT a number in that pair — a presentation that reports them
   (`view.lives()`) gets a row of HEARTS in the stage's top-left corner, on a card, because a heart is
   read at a glance and a pair of numbers has to be read. A presentation may also expose
   `view.reset()`, called when a run starts, so a restart opens full.
   ONE fail condition, and the runner enforces it: `view.lives()` reaching 0 ends the run, for every
   game, without the presentation having to say so. A shape that spends a life in its own `mark()`
   simply reports the smaller number and the run ends on the next beat; the misses are not replayed
   afterwards, because the run is over for real. A presentation may additionally call `r.finish()`
   itself (flapGate does, from its flight loop) — `finish` is idempotent, so the second call is a
   no-op rather than a second score line.
   A presentation may also claim two things about the stage it draws:
     view.ownsPrompt      it draws the item's own stem itself (a chip, a clue panel, a tower block), so
                          the runner does not draw the same words a second time on the HUD line
     PLUGINS.x.timeScale  a static number; the block's `data-time` is multiplied by it, because that
                          game needs a slower clock than the one the author wrote (skeetRange)
   Test hook: window.__G4 lists live runners; each exposes `_test`
   (start / step / pick / expire / finish / state) so a headless test drives the state machine.
------------------------------------------------------------------------------------------------ */
window.GAMES4 = (function () {
  'use strict';
  var PLUGINS = {};
  var nowMs = function () {
    return (window.performance && window.performance.now) ? window.performance.now() : Date.now();
  };
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function num(elm, name, dflt) {
    var v = elm.getAttribute(name), n = (v == null || v === '') ? NaN : Number(v);
    return isFinite(n) ? n : dflt;
  }
  function flag(elm, name, dflt) {
    var v = elm.getAttribute(name);
    if (v == null || v === '') return !!dflt;
    return !(v === '0' || v === 'false');
  }
  function radios(item) { return [].slice.call(item.querySelectorAll('input[type="radio"]')); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  /* ---- sound: blips from an oscillator, no files, no network; every failure is silent.
     Browsers gate audio until a gesture, and Start is a gesture, so nothing plays unbidden. ---- */
  var SFX = (function () {
    var ctx = null;
    function tone(freq, ms, type, vol) {
      try {
        if (!ctx) {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          ctx = new AC();
        }
        if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
        var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime, v = vol || 0.05;
        o.type = type || 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(v, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
        o.connect(g); g.connect(ctx.destination);
        o.start(t); o.stop(t + ms / 1000 + 0.02);
      } catch (e) { /* no sound is not an error */ }
    }
    return {
      tone: tone,
      /* one short note at a chosen pitch — a flip, a step, a pad */
      blip: function (on, hz, ms) { if (on) tone(hz || 440, ms || 90); },
      hit: function (on) { if (!on) return; tone(680, 90); setTimeout(function () { tone(1020, 110); }, 65); },
      miss: function (on) { if (on) tone(150, 200, 'sawtooth', 0.04); },
      /* mineGrid: a glass on the saloon bar — two tiny, very bright chimes that die at once */
      clink: function (on) {
        if (!on) return;
        tone(2093, 55, 'sine', 0.05);
        setTimeout(function () { tone(3136, 45, 'sine', 0.04); }, 28);
        setTimeout(function () { tone(1568, 70, 'sine', 0.03); }, 60);
      },
      /* mineGrid: the snake's warning — a short breathy hiss, two low saws against each other */
      hiss: function (on) { if (!on) return; tone(220, 190, 'sawtooth', 0.03); tone(180, 240, 'sawtooth', 0.025); },
      /* whackMole: the mole's squeak — a quick high chirp that rises and cuts off */
      squeak: function (on) {
        if (!on) return;
        tone(1180, 70, 'sine', 0.05);
        setTimeout(function () { tone(1560, 60, 'sine', 0.045); }, 55);
        setTimeout(function () { tone(1320, 50, 'sine', 0.03); }, 115);
      },
      /* whackMole: the groan of a mole hit by mistake — one low note that sags and runs out */
      groan: function (on) {
        if (!on) return;
        tone(196, 180, 'sawtooth', 0.035);
        setTimeout(function () { tone(147, 220, 'sawtooth', 0.03); }, 110);
      },
      win: function (on) {
        if (!on) return;
        [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { tone(f, 150); }, i * 85); });
      }
    };
  })();

  /* ---- art: inline SVG, defined once, reused by every instance ---- */
  var ART = {
    basket: '<svg class="g4-art" viewBox="0 0 120 84" aria-hidden="true" focusable="false">'
      + '<path d="M12 24h96l-11 50H23z" fill="#c98a4b" stroke="#6f4318" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M31 24l5 50M53 24l2 50M67 24l-2 50M89 24l-5 50" stroke="#a86a2c" stroke-width="2.4"/>'
      + '<rect x="7" y="13" width="106" height="15" rx="7" fill="#b3763a" stroke="#6f4318" stroke-width="3"/>'
      + '<path d="M20 20h80" stroke="#8a5622" stroke-width="2"/></svg>',
    /* catchBasket's answer pots: a terracotta pot of soil (the flower that grows in it is separate art,
       because each right answer adds one more bloom to the same pot) */
    pot: '<svg class="g4-art" viewBox="0 0 120 84" aria-hidden="true" focusable="false">'
      + '<path d="M30 36h60l-8 42H38z" fill="#c1653c" stroke="#7d3a1f" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M46 44l2 30M74 44l-2 30" stroke="#a5522f" stroke-width="2.4"/>'
      + '<rect x="22" y="22" width="76" height="16" rx="5" fill="#d2743f" stroke="#7d3a1f" stroke-width="3"/>'
      + '<ellipse cx="60" cy="24" rx="33" ry="5.5" fill="#5d3a24"/></svg>',
    flower: '<svg class="g4-bloom-art" viewBox="0 0 40 60" aria-hidden="true" focusable="false">'
      + '<path d="M20 58V26" stroke="#3f7a3a" stroke-width="3.4" stroke-linecap="round"/>'
      + '<path d="M20 46l-9-5M20 38l9-5" stroke="#3f7a3a" stroke-width="3" stroke-linecap="round"/>'
      + '<g fill="#e4557f"><circle cx="20" cy="15" r="6"/><circle cx="10.5" cy="19" r="5.4"/>'
      + '<circle cx="29.5" cy="19" r="5.4"/><circle cx="14" cy="7.5" r="5"/><circle cx="26" cy="7.5" r="5"/></g>'
      + '<circle cx="20" cy="15" r="3.4" fill="#ffd05a"/></svg>',
    /* flapGate's bird: a drawn body with one wing that flaps on every lift */
    bird: '<svg class="g4-art" viewBox="0 0 62 44" aria-hidden="true" focusable="false">'
      + '<ellipse cx="26" cy="24" rx="19" ry="13" fill="#ffd05a" stroke="#8a5a2b" stroke-width="2.6"/>'
      + '<circle cx="40" cy="17" r="9.5" fill="#ffe9a8" stroke="#8a5a2b" stroke-width="2.4"/>'
      + '<circle cx="44" cy="16" r="1.9" fill="#2a1c10"/>'
      + '<path d="M49 20l11 3-11 3z" fill="#e4813a" stroke="#8a5a2b" stroke-width="1.8"/>'
      + '<path class="g4-wing" d="M22 19q-11-12-15 3 6 7 15 4z" fill="#f4a63a" stroke="#8a5a2b" stroke-width="2.2"/>'
      + '<path d="M10 30q9 7 20 5" stroke="#8a5a2b" stroke-width="2" fill="none" opacity=".45"/>'
      + '</svg>',
    mole: '<svg class="g4-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">'
      + '<path d="M16 80h68" stroke="#3f2a18" stroke-width="4" stroke-linecap="round"/>'
      + '<ellipse cx="50" cy="60" rx="33" ry="30" fill="#7a5433"/>'
      + '<ellipse cx="50" cy="67" rx="23" ry="19" fill="#8d6440"/>'
      + '<circle cx="27" cy="33" r="11" fill="#6b4a2c"/><circle cx="73" cy="33" r="11" fill="#6b4a2c"/>'
      + '<ellipse cx="50" cy="44" rx="27" ry="23" fill="#8d6440"/>'
      + '<ellipse cx="50" cy="57" rx="12" ry="9" fill="#e7b6a2"/>'
      + '<ellipse cx="50" cy="50" rx="5.5" ry="4" fill="#3a2314"/>'
      /* the eyes are one group so the mole can glance left or right while it waits */
      + '<g class="g4-eyes">'
      + '<circle cx="41" cy="40" r="3.4" fill="#20140b"/><circle cx="59" cy="40" r="3.4" fill="#20140b"/>'
      + '<circle cx="42.2" cy="38.8" r="1.1" fill="#fff"/><circle cx="60.2" cy="38.8" r="1.1" fill="#fff"/>'
      + '</g>'
      + '<path d="M36 74q6-7 12-1M64 74q-6-7-12-1" stroke="#3a2314" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
      + '</svg>',
    /* the one little character shared by the three progress games: tower climb, mine runner, boss
       fight. Drawn once so his proportions never disagree between games. */
    hero: '<svg class="g4-art" viewBox="0 0 60 92" aria-hidden="true" focusable="false">'
      + '<circle cx="30" cy="16" r="12" fill="#f4c79b" stroke="#8a5a2b" stroke-width="2.5"/>'
      + '<path d="M18 12q4-9 12-9t12 9" fill="#3d2a1a"/>'
      + '<circle cx="25.5" cy="17" r="1.9" fill="#2a1c10"/><circle cx="34.5" cy="17" r="1.9" fill="#2a1c10"/>'
      + '<path d="M26 22q4 3 8 0" stroke="#8a5a2b" stroke-width="2" fill="none" stroke-linecap="round"/>'
      + '<path d="M30 28v26" stroke="#2f6fb5" stroke-width="11" stroke-linecap="round"/>'
      + '<path d="M30 34l-13 12M30 34l13 12" stroke="#f4c79b" stroke-width="5" stroke-linecap="round"/>'
      + '<path d="M30 52l-8 22M30 52l8 22" stroke="#2b3a4a" stroke-width="6" stroke-linecap="round"/>'
      + '<path d="M22 76h-6M38 76h6" stroke="#1d2733" stroke-width="5" stroke-linecap="round"/>'
      + '</svg>',
    heroHurt: '<svg class="g4-art" viewBox="0 0 60 92" aria-hidden="true" focusable="false">'
      + '<circle cx="30" cy="16" r="12" fill="#e8b78e" stroke="#8a5a2b" stroke-width="2.5"/>'
      + '<path d="M18 12q4-9 12-9t12 9" fill="#2b1d12"/>'
      + '<path d="M22 15l6 4M38 15l-6 4" stroke="#2a1c10" stroke-width="2.4" stroke-linecap="round"/>'
      + '<path d="M26 24q4-2 8 0" stroke="#8a5a2b" stroke-width="2" fill="none" stroke-linecap="round"/>'
      + '<path d="M30 28v26" stroke="#5f7a92" stroke-width="11" stroke-linecap="round"/>'
      + '<path d="M30 34l-13 8M30 34l13 8" stroke="#e8b78e" stroke-width="5" stroke-linecap="round"/>'
      + '<path d="M30 52l-8 22M30 52l8 22" stroke="#2b3a4a" stroke-width="6" stroke-linecap="round"/>'
      + '<path d="M21 20l18 8" stroke="#fdfaf2" stroke-width="5" stroke-linecap="round"/>'
      + '</svg>',
    /* bossRaid's boss: a horned animal head rather than a spiked ball — eyes, muzzle, fangs, claws */
    boss: '<svg class="g4-art" viewBox="0 0 140 130" aria-hidden="true" focusable="false">'
      + '<path d="M26 48Q20 16 38 8q8 12 6 28" fill="#3b2560" stroke="#22143d" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M114 48q6-32-12-40-8 12-6 28" fill="#3b2560" stroke="#22143d" stroke-width="3" stroke-linejoin="round"/>'
      + '<path d="M70 18q44 0 52 40 6 30-14 48-16 16-38 16T32 106q-20-18-14-48Q26 18 70 18z"'
      + ' fill="#5c3b8f" stroke="#2e1d4d" stroke-width="3.4" stroke-linejoin="round"/>'
      + '<ellipse cx="70" cy="76" rx="35" ry="27" fill="#6d47a8"/>'
      + '<circle cx="52" cy="58" r="9.5" fill="#ffd76a"/><circle cx="88" cy="58" r="9.5" fill="#ffd76a"/>'
      + '<circle cx="52" cy="58" r="4" fill="#2e1d4d"/><circle cx="88" cy="58" r="4" fill="#2e1d4d"/>'
      + '<path d="M50 92q20 14 40 0" stroke="#2e1d4d" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
      + '<path d="M56 90l4 13M70 95v12M84 90l-4 13" stroke="#fdfaf2" stroke-width="4.4" stroke-linecap="round"/>'
      + '<path d="M15 94q-9 10-3 20M125 94q9 10 3 20" stroke="#3b2560" stroke-width="6" fill="none" stroke-linecap="round"/>'
      + '</svg>',
    /* the three fighters: the student picks one on the intro card, and the right answer is thrown or
       swung by THAT fighter — a sword cut, a fireball, an arrow */
    heroSword: '<svg class="g4-art" viewBox="0 0 78 92" aria-hidden="true" focusable="false">'
      + '<circle cx="26" cy="16" r="12" fill="#f4c79b" stroke="#8a5a2b" stroke-width="2.5"/>'
      + '<path d="M14 12q4-9 12-9t12 9" fill="#3d2a1a"/>'
      + '<circle cx="21.5" cy="17" r="1.9" fill="#2a1c10"/><circle cx="30.5" cy="17" r="1.9" fill="#2a1c10"/>'
      + '<path d="M22 22q4 3 8 0" stroke="#8a5a2b" stroke-width="2" fill="none" stroke-linecap="round"/>'
      + '<path d="M26 28v24" stroke="#2f6fb5" stroke-width="11" stroke-linecap="round"/>'
      + '<path d="M26 52l-8 22M26 52l8 22" stroke="#2b3a4a" stroke-width="6" stroke-linecap="round"/>'
      + '<path d="M22 76h-6M34 76h6" stroke="#1d2733" stroke-width="5" stroke-linecap="round"/>'
      + '<path d="M26 34l14 10" stroke="#f4c79b" stroke-width="5" stroke-linecap="round"/>'
      + '<path d="M38 45l22-19" stroke="#e8eef5" stroke-width="6" stroke-linecap="round"/>'
      + '<path d="M60 26l9-8 2 3-8 9z" fill="#e8eef5" stroke="#9fb0c2" stroke-width="1.4"/>'
      + '<path d="M34 41l9-5" stroke="#b9854c" stroke-width="5" stroke-linecap="round"/>'
      + '</svg>',
    heroWizard: '<svg class="g4-art" viewBox="0 0 78 92" aria-hidden="true" focusable="false">'
      + '<circle cx="28" cy="18" r="11" fill="#f4c79b" stroke="#8a5a2b" stroke-width="2.5"/>'
      + '<circle cx="24" cy="19" r="1.9" fill="#2a1c10"/><circle cx="33" cy="19" r="1.9" fill="#2a1c10"/>'
      + '<path d="M24 24q4 3 8 0" stroke="#8a5a2b" stroke-width="2" fill="none" stroke-linecap="round"/>'
      + '<path d="M28 4l7 10H21z" fill="#3b2560" stroke="#22143d" stroke-width="2"/>'
      + '<path d="M14 14h28l-3 6H17z" fill="#3b2560" stroke="#22143d" stroke-width="2"/>'
      + '<path d="M28 28q14 22 12 46H14q-2-24 14-46z" fill="#6d47a8" stroke="#3b2560" stroke-width="2.6" stroke-linejoin="round"/>'
      + '<path d="M28 40l6 34H22z" fill="#8a62c9" opacity=".65"/>'
      + '<path d="M17 74h22" stroke="#3b2560" stroke-width="3"/>'
      + '<path d="M54 30v42" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/>'
      + '<circle cx="54" cy="24" r="8" fill="#8fd2ff" stroke="#2f6fb5" stroke-width="2.4"/>'
      + '<circle cx="51" cy="21" r="2.4" fill="#fff" opacity=".8"/>'
      + '</svg>',
    heroArcher: '<svg class="g4-art" viewBox="0 0 78 92" aria-hidden="true" focusable="false">'
      + '<circle cx="26" cy="16" r="12" fill="#f4c79b" stroke="#8a5a2b" stroke-width="2.5"/>'
      + '<path d="M14 12q4-9 12-9t12 9" fill="#6b4520"/>'
      + '<circle cx="21.5" cy="17" r="1.9" fill="#2a1c10"/><circle cx="30.5" cy="17" r="1.9" fill="#2a1c10"/>'
      + '<path d="M22 22q4 3 8 0" stroke="#8a5a2b" stroke-width="2" fill="none" stroke-linecap="round"/>'
      + '<path d="M26 28v24" stroke="#3f7a3a" stroke-width="11" stroke-linecap="round"/>'
      + '<path d="M26 52l-8 22M26 52l8 22" stroke="#2b3a4a" stroke-width="6" stroke-linecap="round"/>'
      + '<path d="M22 76h-6M34 76h6" stroke="#1d2733" stroke-width="5" stroke-linecap="round"/>'
      + '<path d="M26 34l14 8" stroke="#f4c79b" stroke-width="5" stroke-linecap="round"/>'
      + '<path d="M52 24q16 18 0 36" stroke="#8a5a2b" stroke-width="4" fill="none" stroke-linecap="round"/>'
      + '<path d="M52 24v36" stroke="#f0e2c8" stroke-width="1.8"/>'
      + '<path d="M38 42h16" stroke="#b9854c" stroke-width="3" stroke-linecap="round"/>'
      + '</svg>',
    /* bossRaid's projectiles: the fighter's own attack, and the boss's own answer back. Drawn as
       separate art so the same element can fly across the arena whatever the attack is. */
    fireball: '<svg class="g4-art" viewBox="0 0 40 40" aria-hidden="true" focusable="false">'
      + '<circle cx="20" cy="20" r="13" fill="#ff9d2e" opacity=".55"/>'
      + '<path d="M20 4q11 9 8 20-2 10-8 12-6-2-8-12-3-11 8-20z" fill="#ff7a18" stroke="#b33a00" stroke-width="2.4" stroke-linejoin="round"/>'
      + '<path d="M20 13q5 5 3 12-1 5-3 6-2-1-3-6-2-7 3-12z" fill="#ffe08a"/></svg>',
    arrow: '<svg class="g4-art" viewBox="0 0 52 14" aria-hidden="true" focusable="false">'
      + '<path d="M2 7h38" stroke="#8a5a2b" stroke-width="3.2" stroke-linecap="round"/>'
      + '<path d="M40 7l10-5v10z" fill="#e8eef5" stroke="#61707d" stroke-width="1.6" stroke-linejoin="round"/>'
      + '<path d="M4 2l6 5-6 5" fill="none" stroke="#e8a33c" stroke-width="2.6" stroke-linecap="round"/></svg>',
    acid: '<svg class="g4-art" viewBox="0 0 34 34" aria-hidden="true" focusable="false">'
      + '<path d="M17 3q11 12 10 20-1 8-10 8t-10-8Q6 15 17 3z" fill="#8ede3a" stroke="#3f7a12" stroke-width="2.4" stroke-linejoin="round"/>'
      + '<circle cx="13" cy="20" r="2.6" fill="#d6f5a8"/><circle cx="21" cy="25" r="2" fill="#d6f5a8"/></svg>',
    /* mineGrid's saloon: a timber FRAME (the static part) and ONE LEAF. A door in the street is two of
       these leaves hung on the outer jambs, so it splits open from the middle instead of swinging from
       one side. */
    saloonFrame: '<svg class="g4-art" viewBox="0 0 100 130" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
      /* a RING, not a board: the jambs and the rail are drawn, the middle is left empty so the two
         leaves and the snake show through. Kept plain — the word hangs on the sign above the door. */
      + '<g fill="#b3763a" stroke="#6f4318" stroke-width="2.6">'
      + '<rect x="0" y="0" width="100" height="24"/>'
      + '<rect x="0" y="0" width="14" height="130"/>'
      + '<rect x="86" y="0" width="14" height="130"/>'
      + '<rect x="0" y="124" width="100" height="6"/></g>'
      + '<path d="M3 8h94M3 17h94" stroke="#8a5622" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>'
      + '<path d="M7 130V6M93 130V6" stroke="#8a5622" stroke-width="2" opacity=".45"/>'
      + '</svg>',
    saloonLeaf: '<svg class="g4-art" viewBox="0 0 43 91" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
      + '<rect x="1" y="1" width="41" height="89" rx="2.5" fill="#c98a4b" stroke="#6f4318" stroke-width="2.6"/>'
      + '<path d="M6 8h31M6 20h31M6 32h31M6 44h31M6 56h31M6 68h31" stroke="#8a5622" stroke-width="3"'
      + ' stroke-linecap="round" opacity=".5"/>'
      + '<circle cx="35" cy="45" r="3.2" fill="#ffd05a" stroke="#6f4318" stroke-width="1.6"/>'
      + '<rect x="1" y="1" width="41" height="12" rx="2.5" fill="#b3763a" stroke="#6f4318" stroke-width="2.6"/></svg>',
    /* the snake that is waiting behind the wrong door */
    snake: '<svg class="g4-art" viewBox="0 0 66 44" aria-hidden="true" focusable="false">'
      + '<path d="M4 34q10-12 22-6t10 10" stroke="#3f7a3a" stroke-width="8" fill="none" stroke-linecap="round"/>'
      + '<path d="M36 38q12 2 16-10" stroke="#4f9245" stroke-width="8" fill="none" stroke-linecap="round"/>'
      + '<path d="M50 24q6-10 13-6" stroke="#4f9245" stroke-width="8" fill="none" stroke-linecap="round"/>'
      + '<circle cx="57" cy="13" r="6.5" fill="#8ede3a" stroke="#3f7a12" stroke-width="2"/>'
      + '<circle cx="59" cy="12" r="1.7" fill="#2a1c10"/><circle cx="54.5" cy="12" r="1.7" fill="#2a1c10"/>'
      + '<path d="M63 15l4 1-4 2" stroke="#c92a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    star: '<svg class="g4-art" viewBox="0 0 40 40" aria-hidden="true" focusable="false">'
      + '<path d="M20 3l5.6 11.4L38 16l-9 8.8 2.2 12.4L20 31.4 8.8 37.2 11 24.8 2 16l12.4-1.6z"'
      + ' fill="#ffd05a" stroke="#b07c10" stroke-width="2.4" stroke-linejoin="round"/></svg>',
    /* a ladder sized to the run: two rails and one rung per item, so the climb IS the item count */
    ladder: function (n, safeEvery) {
      n = Math.max(3, n | 0); safeEvery = safeEvery || 5;
      var h = 200, gap = h / (n + 1);
      var s = '<svg class="g4-art" viewBox="0 0 90 ' + (h + 20) + '" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
        + '<path d="M24 10v' + h + 'M66 10v' + h + '" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/>';
      for (var i = 1; i <= n; i++) {
        var y = (h + 10 - i * gap).toFixed(1), safe = i % safeEvery === 0;
        s += '<path d="M24 ' + y + 'h42" stroke="' + (safe ? '#ffd05a' : '#c08d55')
          + '" stroke-width="' + (safe ? 7 : 5) + '" stroke-linecap="round"/>';
      }
      return s + '</svg>';
    },
    climber: '<svg class="g4-art" viewBox="0 0 46 52" aria-hidden="true" focusable="false">'
      + '<path d="M23 30v-12" stroke="#2f6fb5" stroke-width="10" stroke-linecap="round"/>'
      + '<circle cx="23" cy="11" r="8" fill="#f4c79b" stroke="#8a5a2b" stroke-width="2.2"/>'
      + '<path d="M17 8q3-6 9-5t6 6" fill="#3d2a1a"/>'
      + '<circle cx="20.5" cy="11.5" r="1.5" fill="#2a1c10"/><circle cx="26" cy="11.5" r="1.5" fill="#2a1c10"/>'
      + '<path d="M23 20l-9-8M23 20l9-9" stroke="#f4c79b" stroke-width="4.2" stroke-linecap="round"/>'
      + '<path d="M23 36l-7 12M23 36l7 12" stroke="#2b3a4a" stroke-width="5" stroke-linecap="round"/>'
      + '</svg>',
    chest: '<svg class="g4-art" viewBox="0 0 60 50" aria-hidden="true" focusable="false">'
      + '<rect x="6" y="18" width="48" height="28" rx="4" fill="#b9854c" stroke="#6b4520" stroke-width="2.6"/>'
      + '<path d="M6 26q0-16 24-16t24 16" fill="#d9a75f" stroke="#6b4520" stroke-width="2.6"/>'
      + '<rect x="25" y="24" width="10" height="12" rx="2" fill="#ffd05a" stroke="#6b4520" stroke-width="2.2"/>'
      + '<path d="M6 30h48" stroke="#6b4520" stroke-width="2"/>'
      + '</svg>'
  };

  /* one item = one authored `.qitem`. The right answer is `data-a` when the author pinned it, else
     the option matching the clip's `data-say` (when the spoken word IS the question, no answer key
     has to be written into the page). */
  function readItems(root) {
    return [].slice.call(root.querySelectorAll('.game-list .qitem')).map(function (it) {
      var stem = it.querySelector('.qstem');
      var listen = it.querySelector('.listen');
      var say = listen ? norm(listen.getAttribute('data-say')) : '';
      var opts = radios(it).map(function (r) {
        var lab = r.parentElement;
        return { value: r.value, text: lab ? lab.textContent.trim() : '', radio: r, label: lab };
      });
      var key = it.getAttribute('data-a');
      if (!key) {
        var m = null;
        opts.forEach(function (o) { if (!m && say && norm(o.text) === say) m = o; });
        key = m ? m.value : '';
      }
      return {
        item: it, prompt: stem ? stem.textContent.trim() : '',
        say: listen ? listen.getAttribute('data-say') : '', opts: opts, key: key
      };
    });
  }
  /* ---------------- the runner: identical for every game ---------------- */
  function Runner(root) {
    var self = this;
    this.root = root;
    this.name = root.getAttribute('data-game') || '';
    this.plugin = PLUGINS[this.name];
    this.items = readItems(root);
    this.queue = [];
    this.idx = 0; this.score = 0; this.total = 0;
    this.replay = flag(root, 'data-replay', 1);
    this.retry = flag(root, 'data-retry', 1);
    this.shuffleOn = flag(root, 'data-shuffle', 1);
    this.usePrompt = flag(root, 'data-prompt', 1);
    this.sound = flag(root, 'data-sound', 1);
    /* a presentation that needs its own clock (skeetRange throws on a slower range) scales the
       author's `data-time` once, here, so the intro card already shows the clock that will run */
    this.itemTime = Math.round(Math.max(0, num(root, 'data-time', 0))
      * ((this.plugin && this.plugin.timeScale) || 1));              // ms per item
    this.limit = Math.max(0, num(root, 'data-limit', 0));         // seconds per run
    this.limitLeft = this.limit;
    this.reduced = reduceMotion;
    this.running = false; this.replaying = false; this.phase = 'idle';
    this.missed = []; this.timers = []; this.clock = 0; this.barRaf = 0;
    this.livesEl = null;

    /* readiness: this class is what hides the authored list, and it is added ONLY by a live instance.
       If engine4.js never loads, or this block names a game that does not exist, the class is absent
       and the page falls back to plain radios and the how-text — the intended no-JS behaviour. */
    root.className += ' g4 g4-ready';

    /* the intro screen is an OVERLAY over the game's own stage, and the stage is pre-drawn with a
       still of that game's art. So before play the block reads as the game it is about to become,
       not as a form with a button under it. The block's own how-text and Play button move inside. */
    var intro = el('div', 'g4-intro');
    var card = el('div', 'g4-intro-card');
    var how = root.querySelector('.game-how');
    if (how) card.appendChild(how);
    var rounds = Math.max(0, num(root, 'data-rounds', 0)) || this.items.length;
    var meta = el('ul', 'g4-intro-meta');
    var bits = ['<li><b>' + rounds + '</b> ' + (rounds === 1 ? 'round' : 'rounds') + '</li>'];
    if (this.itemTime) bits.push('<li><b>' + (Math.round(this.itemTime / 100) / 10) + 's</b> each</li>');
    if (this.limit) bits.push('<li><b>' + this.limit + 's</b> total</li>');
    bits.push('<li>keys <b>1–' + (this.items.length ? Math.max.apply(null, this.items.map(function (i) {
      return i.opts.length;
    })) : 1) + '</b></li>');
    meta.innerHTML = bits.join('');
    card.appendChild(meta);
    this.metaEl = meta;              /* finish() writes the last score into this list */
    intro.appendChild(card);
    this.intro = intro;
    var stage = el('div', 'g4-stage');
    /* the scene: a finished picture of the place this game happens in, behind everything. It stays
       for the whole run, so play never happens on a bare colour. */
    var scene = el('div', 'g4-scene');
    try { if (SCENE[this.name]) scene.innerHTML = SCENE[this.name](); } catch (e) { /* art never breaks play */ }
    stage.appendChild(scene);
    var hud = el('div', 'g4-hud');
    hud.innerHTML = '<span class="score"></span><span class="clock"></span>';
    stage.appendChild(hud);
    if (this.usePrompt) {
      var prompt = el('div', 'g4-prompt');
      stage.appendChild(prompt);
      this.promptEl = prompt;
    }
    /* the deadline is always visible: a bar that empties, because a hidden clock is not a deadline */
    var bar = el('div', 'g4-timebar');
    bar.innerHTML = '<i></i>';
    if (this.itemTime) stage.appendChild(bar);
    this.bar = bar; this.barFill = bar.querySelector('i');
    this.stage = stage; this.hudEl = hud;
    root.insertBefore(stage, root.firstChild);   /* how-text and Play moved into the overlay above */
    stage.appendChild(intro);                    /* the intro sits ON the stage, not above it */

    var btn = root.querySelector('.game-start');
    if (!btn) { btn = el('button', 'game-start', '▶ Play'); btn.type = 'button'; }
    if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
    btn.textContent = '▶ Play';
    card.appendChild(btn);           /* the button lives on the intro card, not under the block */
    btn.addEventListener('click', function () { self.start(); });
    this.btn = btn;
    this.view = this.plugin ? this.plugin(this) : null;
    if (!this.items.length) { btn.disabled = true; btn.textContent = 'No items'; }
    else this.poster();          /* the still of this game's art, behind the intro overlay */

    /* the keyboard is a first-class way to answer: 1..n picks that option */
    root.addEventListener('keydown', function (e) {
      if (!self.running) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.start(); }
        return;
      }
      if (self.phase !== 'play') return;
      var it = self.queue[0], n = parseInt(e.key, 10);
      if (it && n >= 1 && n <= it.opts.length) { e.preventDefault(); self.pick(it.opts[n - 1].value); }
    });
  }

  Runner.prototype.later = function (fn, ms) {
    var self = this;
    var id = setTimeout(function () {
      self.timers = self.timers.filter(function (t) { return t !== id; });
      fn();
    }, ms);
    this.timers.push(id);
    return id;
  };
  Runner.prototype.clearTimers = function () {
    this.timers.forEach(clearTimeout); this.timers = [];
    if (this.clock) { clearInterval(this.clock); this.clock = 0; }
    if (this.barRaf && window.cancelAnimationFrame) window.cancelAnimationFrame(this.barRaf);
    this.barRaf = 0;
  };
  /* The score is a number over its own ceiling, never a word with a unit after it: counting up it is
     the items got out of the run's items and starts at 0/6; an activity that reports lives, attempts
     or health starts full and counts down (3/3, 2/3…). The pair of numbers says which way it goes, and
     it is the whole of the top-right count — there is no separate round counter, because two fractions
     side by side read as one muddled number. The clock joins it only when the block sets a total limit.
     A presentation whose score is NOT "items answered" — flapGate scores the best streak it reached
     before a life was lost — reports it through `view.score()`, and that number is what the HUD shows. */
  Runner.prototype.hud = function () {
    var lives = (this.view && typeof this.view.lives === 'function') ? Math.max(0, this.view.lives()) : null;
    if (lives != null) this.livesTop = Math.max(this.livesTop || 0, lives);
    this.hudEl.querySelector('.score').textContent = this.got() + '/' + this.total;
    this.hudEl.querySelector('.clock').textContent = this.limit ? Math.ceil(this.limitLeft) + 's' : '';
    this.drawLives(lives);
  };
  /* the numerator of the HUD pair: the presentation's own score when it keeps one, else items got */
  Runner.prototype.got = function () {
    if (this.view && typeof this.view.score === 'function') {
      var v = this.view.score();
      if (v != null && isFinite(v)) return Math.max(0, Math.round(v));
    }
    return this.score;
  };
  /* how many lives the shape has left, or null when it keeps none. A shape that reports lives fails at
     zero, which is the ONE fail condition across all games. */
  Runner.prototype.livesLeft = function () {
    if (this.view && typeof this.view.lives === 'function') {
      var n = this.view.lives();
      if (n != null && isFinite(n)) return Math.max(0, Math.round(n));
    }
    return null;
  };
  /* hearts: one per life the presentation reports, in the stage's TOP-LEFT corner on the same card as
     the score. Full hearts first, spent ones left hollow behind them, so the row never changes width
     and a lost life is read as a heart going out rather than as a shorter row. The row is made the
     first time a life is reported, so a game without lives draws no box at all. */
  Runner.prototype.drawLives = function (lives) {
    if (lives == null) return;
    if (!this.livesEl) {
      this.livesEl = el('div', 'g4-hearts');
      this.stage.appendChild(this.livesEl);
    }
    var top = Math.max(1, this.livesTop || 0, lives);
    var html = '';
    for (var i = 0; i < top; i++) {
      html += '<span class="g4-heart' + (i < lives ? ' full' : '') + '">'
        + (i < lives ? '♥' : '♡') + '</span>';
    }
    if (this.livesEl.innerHTML !== html) this.livesEl.innerHTML = html;
    this.livesEl.setAttribute('aria-label', lives + ' of ' + top + ' left');
  };
  Runner.prototype.setPrompt = function (text, on) {
    if (!this.promptEl) return;
    this.promptEl.textContent = text;
    this.promptEl.classList[on ? 'add' : 'remove']('in');
  };
  Runner.prototype.setBar = function (frac) {
    if (!this.barFill) return;
    var pct = Math.max(0, Math.min(1, frac)) * 100;
    this.barFill.style.width = pct.toFixed(1) + '%';
    this.bar.className = 'g4-timebar' + (pct < 25 ? ' low' : '');
  };
  /* the item deadline: driven by a timer, not by an animation, so a dropped frame can never
     swallow an item or hand out a free pass */
  Runner.prototype.startItemClock = function () {
    var self = this;
    if (!this.itemTime) return;
    var t0 = nowMs();
    this.setBar(1);
    var frame = function () {
      if (self.phase !== 'play') return;
      var left = self.itemTime - (nowMs() - t0);
      self.setBar(left / self.itemTime);
      if (left <= 0) { self.expire(); return; }
      if (window.requestAnimationFrame) self.barRaf = window.requestAnimationFrame(frame);
      else self.barRaf = 0;
    };
    if (window.requestAnimationFrame) this.barRaf = window.requestAnimationFrame(frame);
    this.later(function () { if (self.phase === 'play') self.expire(); }, this.itemTime + 40);
  };
  /* start: the student's press is the only way in — no autoplay, no surprise motion */
  Runner.prototype.start = function () {
    var self = this;
    if (!this.items.length) return false;
    /* a quiz block is answered once: once the run is over there is nothing to go back to */
    if (!this.retry && this.phase === 'over') return false;
    this.btn.disabled = false;
    this.clearTimers();
    this.clearPoster();
    this.running = true; this.replaying = false;
    this.dead = false;
    this.score = 0; this.idx = 0; this.missed = []; this.livesTop = 0;
    var list = this.items.slice();
    if (this.shuffleOn) shuffle(list);
    var rounds = Math.max(0, num(this.root, 'data-rounds', 0));
    if (rounds > 0 && rounds < list.length) list = list.slice(0, rounds);
    this.queue = list; this.total = list.length;
    this.limitLeft = this.limit;
    /* a presentation that holds run state of its own (lives, attempts) puts it back before the HUD
       reads it, so a restart starts full and the score can never open at 0/0 */
    if (this.view && typeof this.view.reset === 'function') this.view.reset();
    this.root.classList.add('is-on');
    var line = this.root.querySelector('.game-score-line');
    if (line) line.textContent = '';
    this.btn.textContent = '↻ Restart';
    this.hud();
    if (this.limit) {
      this.clock = setInterval(function () {
        self.limitLeft--; self.hud();
        if (self.limitLeft <= 0) self.finish();
      }, 1000);
    }
    /* a board game (echoPads) lays every item out at once and runs its own order of play. It claims
       the run by returning true from begin(), so the runner does not march the queue. */
    if (this.view && this.view.begin && this.view.begin(this.queue) === true) {
      this.board = true; this.phase = 'play'; this.answered = 0;
      return true;
    }
    this.step();
    return true;
  };

  Runner.prototype.step = function () {
    if (!this.queue.length) return this.finish();
    var it = this.queue[0];
    this.phase = 'play';
    /* the stem is spoken once. A presentation that draws the stem itself (a chip to sort, a clue
       beside the grid, the tower's question block) is already showing it, so drawing it again on the
       HUD line would print the same words twice on one stage: the HUD copy is simply not made. */
    var owns = !!(this.view && this.view.ownsPrompt);
    this.setPrompt(owns ? '' : it.prompt, !owns);
    this.hud();
    if (this.view) this.view.show(it);
    this.startItemClock();
    return it;
  };

  Runner.prototype.next = function () {
    if (this.phase === 'over') return;
    if (!this.queue.length) return this.finish();
    return this.step();
  };

  /* resolve: end the current item. A hit marks the REAL radio and dispatches change — that is what
     persists; a miss leaves it blank, because a blank is the teacher's evidence. */
  Runner.prototype.resolve = function (value, why) {
    var self = this;
    if (!this.running || this.phase === 'done' || this.phase === 'over') return false;
    this.phase = 'done';
    this.clearTimers();
    this.setBar(1);
    var it = this.queue[0];
    var hit = why === 'hit';
    if (hit) {
      this.score++;
      var opt = null;
      (it.opts || []).forEach(function (o) { if (o.value === value) opt = o; });
      if (opt && opt.radio) {
        opt.radio.checked = true;
        if (window.Event) {
          opt.radio.dispatchEvent(new Event('input', { bubbles: true }));
          opt.radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    } else {
      this.missed.push(it);
    }
    this.hud();
    /* the generic miss is only a fallback: a presentation that owns its own miss sound (whackMole's
       groan) sets PLUGINS.x.ownMiss, and then the runner does not play a second sound on top of it */
    if (hit) SFX.hit(this.sound);
    else if (!(this.plugin && this.plugin.ownMiss)) SFX.miss(this.sound);
    if (this.view) this.view.mark(it, hit, value);
    this.hud();          /* an activity that spends a life shows it at once, not on the next item */
    /* THE fail condition, for every game in the engine: no lives left ends the run. A presentation
       that keeps lives (mineGrid's three bites, wordleBoard's two wrong words, flapGate's bricks,
       echoPads' points) does not have to know about it — spending the last one here is enough. The
       run is over for real, so the misses are not replayed afterwards. */
    if (this.livesLeft() === 0) this.dead = true;
    this.later(function () {
      if (self.view) self.view.clear();
      self.queue.shift(); self.idx++;
      self.setPrompt('', false);
      if (self.dead) self.finish(); else self.next();
    }, hit ? 620 : 1000);
    return hit;
  };
  Runner.prototype.pick = function (value) {
    var it = this.queue[0];
    if (!it || this.phase !== 'play') return false;
    return this.resolve(value, value === it.key ? 'hit' : 'miss');
  };
  /* pickOn: answer a specific queued item. Used by games where the student chooses WHICH word to
     work on (a sorting board, a board of tiles) rather than only which option. The item is moved
     to the front first so the runner's own queue accounting stays honest. */
  Runner.prototype.pickOn = function (it, value) {
    if (!it || this.phase !== 'play') return false;
    var at = this.queue.indexOf(it);
    if (at < 0) return false;
    if (at > 0) { this.queue.splice(at, 1); this.queue.unshift(it); }
    return this.resolve(value, value === it.key ? 'hit' : 'miss');
  };
  Runner.prototype.expire = function () {
    if (this.phase !== 'play') return false;
    return this.resolve(null, 'miss');
  };

  /* board mode: a game that places every item at once answers them out of order. The runner still
     owns scoring, the radio write and the score line, so what saves is exactly what always saved. */
  Runner.prototype.scoreBoard = function (it, value) {
    var self = this;
    if (!it || this.phase === 'over') return false;
    var hit = value === it.key, opt = null;
    (it.opts || []).forEach(function (o) { if (o.value === value) opt = o; });
    if (hit) {
      this.score++;
      if (opt && opt.radio) {
        opt.radio.checked = true;
        if (window.Event) {
          opt.radio.dispatchEvent(new Event('input', { bubbles: true }));
          opt.radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      SFX.hit(this.sound);
    } else {
      this.missed.push(it);
      SFX.miss(this.sound);
    }
    this.answered++;
    this.idx = Math.min(this.answered, this.total);
    this.hud();
    /* the same fail condition as resolve(): a board that spends its last life ends the run */
    if (this.livesLeft() === 0) {
      this.dead = true;
      this.later(function () { self.finish(); }, 800);
      return hit;
    }
    if (this.answered >= this.total) this.later(function () { self.finish(); }, 800);
    return hit;
  };

  /* finish: replay the misses once, then write the score and hand the authored list back.
     Idempotent: a shape that spends its last life calls this itself, and the runner calls it too when
     the clock or the queue runs out — the second call must not score the run twice or play the win
     sting again, so an already-finished run is simply handed back. */
  Runner.prototype.finish = function () {
    if (this.phase === 'over' && !this.running) return this.score;
    if (!this.board && this.replay && this.retry && !this.replaying && !this.dead && this.missed.length) {
      this.replaying = true;
      this.queue = this.missed.slice();
      this.missed = [];
      this.idx = Math.max(0, this.total - this.queue.length);
      return this.step();
    }
    this.phase = 'over';
    this.running = false;
    this.root.classList.remove('is-on');
    this.setPrompt('', false);
    if (this.view) this.view.clear();
    this.clearTimers();
    SFX.win(this.sound && this.score > 0);
    var line = this.root.querySelector('.game-score-line');
    if (!line) { line = el('p', 'game-score-line'); this.root.appendChild(line); }
    line.textContent = 'Score: ' + this.got() + ' / ' + this.total
      + (this.dead ? ' — out of lives.'
        : this.got() === this.total ? ' — clean run.'
          : (this.retry ? ' — go again when you like.' : ' — one attempt, as the page asked.'));
    this.btn.textContent = this.retry ? '↻ Play again' : 'Run complete';
    this.btn.disabled = !this.retry;
    /* the run's score is not a thing you lose by looking away: the intro card comes back over the
       stage, so the last score goes on it and stays there until the next run is finished. */
    if (this.metaEl) {
      var last = this.metaEl.querySelector('.g4-intro-last');
      if (!last) { last = el('li', 'g4-intro-last'); this.metaEl.appendChild(last); }
      last.innerHTML = 'last run <b>' + this.got() + '/' + this.total + '</b>';
    }
    this.poster();               /* the art comes back behind the intro overlay */
    return this.score;
  };
  Runner.prototype.clearPoster = function () {
    if (this.posterEl && this.posterEl.parentNode) this.posterEl.parentNode.removeChild(this.posterEl);
    this.posterEl = null;
  };
  /* poster: a still of this game's own art, drawn behind the intro overlay. No timers, no audio,
     no answer state — it is a picture of the game, using the lesson's own words as labels. */
  Runner.prototype.poster = function () {
    this.clearPoster();
    var draw = POSTER[this.name];
    if (!draw || !this.items.length) return;
    var box = el('div', 'g4-poster');
    try { draw(box, this.items); } catch (e) { /* a poster must never break the page */ }
    this.stage.insertBefore(box, this.stage.firstChild);
    this.posterEl = box;
  };

  Runner.prototype.state = function () {
    return {
      phase: this.phase, idx: this.idx, score: this.score, total: this.total,
      running: this.running, replaying: this.replaying, missed: this.missed.length,
      itemTime: this.itemTime,
      key: this.queue[0] ? this.queue[0].key : '', prompt: this.queue[0] ? this.queue[0].prompt : ''
    };
  };
  Runner.prototype._test = function () {
    var self = this;
    return {
      state: function () { return self.state(); },
      start: function () { self.start(); return self.state(); },
      step: function () { return self.step(); },
      pick: function (v) { return self.pick(v); },
      expire: function () { return self.expire(); },
      finish: function () { return self.finish(); }
    };
  };

  /* ---------------- catchBasket: sort the words into pots, and each right one grows a flower ----------
     The word to sort is ONE card, held at the top of the stage and dragged into the pot it belongs in.
     The pots are the block's own option labels, so the activity decides what they are (or pins them with
     data-buckets="left|right"). A right answer tips water over that pot and a flower grows in it; the
     flowers stay for the rest of the run, one per right answer, so the block becomes a garden the class
     has grown rather than a score.
     Real pointer drag (mouse, pen, touch) with a tap-pot fallback, a plain click, and 1../9 keys, so a
     student who never discovers dragging still answers. The card IS the prompt, so the stage does not
     draw the same words again on the HUD line (ownsPrompt). */
  PLUGINS.catchBasket = function (r) {
    var stage = r.stage;
    var wordRow = el('div', 'g4-words');
    var tray = el('div', 'g4-tray');
    stage.appendChild(wordRow); stage.appendChild(tray);
    var chips = [], buckets = [], drag = null, active = null;
    /* how many flowers each pot has grown, by option value: it survives the item, so a pot keeps what
       it earned across the whole run and only a new run plants it empty */
    var blooms = {};
    var MAX_BLOOMS = 6;

    /* the bucket labels are `data-buckets="A|B"` when the activity pins them, else the item's own
       option labels — so a block can decide what its buckets are, per item or for the whole run */
    function labels(item) {
      var pinned = r.root.getAttribute('data-buckets');
      if (pinned) return pinned.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
      return item ? item.opts.map(function (o) { return o.text; }) : [];
    }
    function bucketAt(x, y) {
      var found = null;
      buckets.forEach(function (b) {
        b.classList.remove('hot');
        if (found) return;
        var q = b.getBoundingClientRect();
        if (x >= q.left - 14 && x <= q.right + 14 && y >= q.top - 24 && y <= q.bottom + 30) found = b;
      });
      if (found) found.classList.add('hot');
      return found;
    }
    /* the pot's flowers are drawn from the run's own count, so re-labelling the pots for the next word
       never loses the garden that has already grown */
    function paint(b) {
      var box = b.querySelector('.g4-blooms');
      if (!box) return;
      var n = Math.min(MAX_BLOOMS, blooms[b.getAttribute('data-v')] || 0);
      box.innerHTML = '';
      for (var i = 0; i < n; i++) {
        var f = el('span', 'g4-bloom');
        f.innerHTML = ART.flower;
        box.appendChild(f);
      }
    }
    function clear() {
      drag = null; active = null;
      wordRow.innerHTML = ''; tray.innerHTML = '';
      chips = []; buckets = [];
    }
    function show(item) {
      clear();
      var names = labels(item);
      /* pots first, so a drag can land on one before the student releases. The pots belong to
         THIS item, so a block can re-label them item by item. */
      item.opts.forEach(function (o, i) {
        var b = el('button', 'g4-bucket');
        b.type = 'button';
        b.setAttribute('data-v', o.value);
        b.innerHTML = ART.pot
          + '<span class="g4-bucket-t">' + esc(names[i] || o.text) + '</span>'
          + '<span class="g4-splash" aria-hidden="true"><i></i><i></i><i></i></span>'
          + '<span class="g4-blooms" aria-hidden="true"></span>';
        b.addEventListener('click', function () { if (r.phase === 'play') r.pickOn(item, o.value); });
        tray.appendChild(b);
        buckets.push(b);
        paint(b);
      });
      /* ONE card at a time — the word being sorted. A queue of chips asked the student to read words
         they were not working on, and made the drag target unclear. */
      var c = el('button', 'g4-chip active', item.prompt);
      c.type = 'button';
      c.__item = item;
      c.setAttribute('data-v', item.key);
      c.style.touchAction = 'none';
      c.addEventListener('pointerdown', function (e) { down(e, c); });
      c.addEventListener('pointermove', move);
      c.addEventListener('pointerup', up);
      c.addEventListener('pointercancel', up);
      wordRow.appendChild(c);
      chips.push(c);
      active = item;
    }
    function lift(c, e) {
      var q = c.getBoundingClientRect();
      c.__off = { x: e.clientX - q.left, y: e.clientY - q.top };
      c.__w = q.width; c.__h = q.height;
      c.style.position = 'fixed';
      c.style.width = q.width + 'px';
      c.style.height = q.height + 'px';
      c.style.left = q.left + 'px';
      c.style.top = q.top + 'px';
      c.style.zIndex = '20';
    }
    function drop(c) {
      c.style.position = ''; c.style.left = ''; c.style.top = '';
      c.style.width = ''; c.style.height = ''; c.style.zIndex = '';
    }
    function down(e, c) {
      if (r.phase !== 'play') return;
      if (e.preventDefault) e.preventDefault();
      if (c.setPointerCapture) { try { c.setPointerCapture(e.pointerId); } catch (x) { /* older engines */ } }
      drag = { c: c, id: e.pointerId };
      active = c.__item;
      chips.forEach(function (x) { x.classList.remove('active'); });
      c.classList.add('active', 'dragging');
      lift(c, e);
    }
    function move(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var c = drag.c;
      c.style.left = (e.clientX - c.__off.x) + 'px';
      c.style.top = (e.clientY - c.__off.y) + 'px';
      bucketAt(e.clientX, e.clientY);
    }
    function up(e) {
      if (!drag) return;
      var c = drag.c;
      drag = null;
      c.classList.remove('dragging');
      var b = bucketAt(e.clientX, e.clientY);
      if (b) { r.pickOn(c.__item, b.getAttribute('data-v')); return; }
      drop(c);
      c.classList.remove('active');
      active = null;
    }
    function mark(item, hit, value) {
      buckets.forEach(function (b) {
        var v = b.getAttribute('data-v');
        b.classList.remove('hot');
        if (v === value) b.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) b.classList.add('reveal');
        /* the right pot gets the watering: a splash over its rim, then the flower it just grew */
        if (hit && v === value) {
          b.classList.remove('watered');
          void b.offsetWidth;                       /* restart the splash on a repeated pot */
          b.classList.add('watered');
          blooms[v] = (blooms[v] || 0) + 1;
          paint(b);
        }
      });
      chips.forEach(function (c) {
        if (c.__item !== item) return;
        c.classList.add(hit ? 'caught' : 'spilled');
      });
    }
    /* a new run plants an empty garden */
    function reset() { blooms = {}; }
    return {
      show: show, mark: mark, clear: clear, reset: reset, ownsPrompt: true
    };
  };
  /* ---------------- whackMole: the answers surface from holes, then duck ----------------
     One mole per option; the right one must be hit before the runner's bar empties. The moles are
     drawn art, they rise and duck, and the others drop away the moment an answer lands.
     While they wait, each mole glances left or right at its own random moments (the eyes are one group
     inside the art), so the garden reads as alive rather than as a row of pictures. A right hit
     squeaks; a wrong one is the runner's own miss sound. */
  PLUGINS.whackMole = function (r) {
    var stage = r.stage;
    var grid = el('div', 'g4-grid');
    stage.appendChild(grid);
    var moles = [], live = false, idle = 0;

    /* the glance: each mole picks a direction and holds it for a moment, then looks front again. The
       loop is re-armed off the runner's own timers, so a new item or a finished run stops it dead. */
    function glance() {
      if (!live) return;
      var up = moles.filter(function (m) { return m.parentNode && !m.classList.contains('ok') && !m.classList.contains('no'); });
      if (up.length) {
        var m = up[Math.floor(Math.random() * up.length)];
        var dir = Math.random() < 0.5 ? 'look-l' : 'look-r';
        m.classList.remove('look-l', 'look-r');
        m.classList.add(dir);
        r.later(function () { m.classList.remove(dir); }, 520 + Math.random() * 620);
        /* a faint sniff at some of the glances, so the garden is heard as well as seen */
        if (Math.random() < 0.25) SFX.blip(r.sound, 720 + Math.random() * 240, 45);
      }
      idle = r.later(glance, 700 + Math.random() * 900);
    }
    function clear() {
      live = false;
      if (idle) { clearTimeout(idle); idle = 0; }
      grid.innerHTML = ''; moles = [];
    }
    function show(item) {
      clear();
      live = true;
      var n = Math.max(6, Math.min(9, item.opts.length + 2)), holes = [], i;
      for (i = 0; i < n; i++) {
        var h = el('div', 'g4-hole');
        h.innerHTML = '<span class="g4-dirt"></span>';
        grid.appendChild(h);
        holes.push(h);
      }
      var slots = shuffle(holes.slice()).slice(0, item.opts.length);
      item.opts.forEach(function (o, k) {
        if (!slots[k]) return;
        var m = el('button', 'g4-mole');
        m.type = 'button';
        m.setAttribute('data-v', o.value);
        m.innerHTML = ART.mole + '<span class="g4-mole-t">' + esc(o.text) + '</span>';
        m.addEventListener('click', function () { if (r.phase === 'play') r.pick(o.value); });
        slots[k].appendChild(m);
        moles.push(m);
        /* rise out of the hole a beat later, staggered, so it reads as surfacing rather than popping
           in. Reduced motion skips the stagger and shows them already up. */
        if (!r.reduced) {
          m.style.transform = 'translateY(104%)';
          r.later(function () { if (m.parentNode) m.style.transform = ''; }, 70 + k * 95);
        }
      });
      idle = r.later(glance, 600 + Math.random() * 500);
    }
    function mark(item, hit, value) {
      live = false;
      if (idle) { clearTimeout(idle); idle = 0; }
      moles.forEach(function (m) {
        var v = m.getAttribute('data-v');
        m.classList.remove('look-l', 'look-r');
        if (v === value) m.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) m.classList.add('reveal');
        else m.style.transform = 'translateY(104%)';
      });
      if (hit) SFX.squeak(r.sound); else SFX.groan(r.sound);
    }
    return { show: show, mark: mark, clear: clear };
  };

  /* ============================ SCENES ============================
     Full-strength illustrated backdrops, one per game. Not a tint: a finished picture with sky,
     depth and foreground, drawn with gradients so it reads as a place rather than a coloured box.
     The palette is deliberately wider than the page's six colours — a scene is a picture, not UI.

     All gradient and filter ids live in ONE injected <svg class="g4-defs"> (see boot), so any number
     of game blocks on one page share them and no id can collide. Every scene is a 400x260 viewBox the
     stage scales up, anchored to the bottom so the ground never floats in a letterbox. */
  var DEFS = [
    '<svg class="g4-defs" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">',
    '<defs>',
    '<linearGradient id="g4-dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f0"/><stop offset=".55" stop-color="#cfe9f5"/><stop offset="1" stop-color="#fff3d9"/></linearGradient>',
    '<linearGradient id="g4-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b4b8a"/><stop offset=".5" stop-color="#c86f8a"/><stop offset="1" stop-color="#ffcf9b"/></linearGradient>',
    '<linearGradient id="g4-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1026"/><stop offset=".6" stop-color="#182b52"/><stop offset="1" stop-color="#2f2255"/></linearGradient>',
    '<linearGradient id="g4-studio" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101832"/><stop offset=".55" stop-color="#243a63"/><stop offset="1" stop-color="#3d2a58"/></linearGradient>',
    '<linearGradient id="g4-cave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1220"/><stop offset=".6" stop-color="#3a1f2b"/><stop offset="1" stop-color="#6b2f2a"/></linearGradient>',
    '<linearGradient id="g4-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc36a"/><stop offset="1" stop-color="#3d7a3a"/></linearGradient>',
    '<linearGradient id="g4-soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9764b"/><stop offset="1" stop-color="#5d3a24"/></linearGradient>',
    '<linearGradient id="g4-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98f5b"/><stop offset="1" stop-color="#8a562f"/></linearGradient>',
    '<linearGradient id="g4-paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#e9e0c9"/></linearGradient>',
    '<linearGradient id="g4-brick" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d99a76"/><stop offset="1" stop-color="#a4603f"/></linearGradient>',
    '<linearGradient id="g4-sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0d9a8"/><stop offset="1" stop-color="#c99e63"/></linearGradient>',
    '<linearGradient id="g4-curtain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a3233c"/><stop offset="1" stop-color="#4c0f1d"/></linearGradient>',
    '<radialGradient id="g4-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".95"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>',
    '<radialGradient id="g4-vignette" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient>',
    '<filter id="g4-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>',
    '</defs></svg>'
  ].join('');

  /* small parts, so twelve scenes stay readable and keep the same sense of depth */
  function sun(cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 3.4) + '" fill="url(#g4-glow)"/>'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff1c4"/>';
  }
  function cloud(cx, cy, s, o) {
    return '<g opacity="' + (o || .92) + '" fill="#fff"><ellipse cx="' + cx + '" cy="' + cy
      + '" rx="' + (26 * s) + '" ry="' + (11 * s) + '"/>'
      + '<ellipse cx="' + (cx - 16 * s) + '" cy="' + (cy + 4 * s) + '" rx="' + (16 * s) + '" ry="' + (8 * s) + '"/>'
      + '<ellipse cx="' + (cx + 18 * s) + '" cy="' + (cy + 5 * s) + '" rx="' + (18 * s) + '" ry="' + (9 * s) + '"/></g>';
  }
  function hills(fill, y, o) {
    return '<path d="M0 ' + y + ' Q70 ' + (y - 26) + ' 140 ' + y + ' T280 ' + y + ' T420 ' + y
      + ' V260 H0Z" fill="' + fill + '" opacity="' + (o || 1) + '"/>';
  }
  function stars(n) {
    var out = '', seed = 7;
    for (var i = 0; i < n; i++) {
      seed = (seed * 61 + 17) % 397;
      out += '<circle cx="' + (seed % 400) + '" cy="' + (12 + ((seed * 3) % 90)) + '" r="'
        + (i % 3 === 0 ? 1.6 : 1) + '" fill="#fff" opacity="' + (.35 + (i % 4) * .16) + '"/>';
    }
    return out;
  }
  function frame(inner) {
    return '<svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true">'
      + inner + '<rect width="400" height="260" fill="url(#g4-vignette)"/></svg>';
  }


  /* ---------------- posters: one still per game, drawn behind the intro overlay ----------------
     Each uses the same classes the live game uses, so the picture is styled by the same CSS, and the
     labels are the lesson's own option words — the student sees this lesson's content in the game's
     furniture before pressing Play. Nothing here reads or writes an answer. */
  function opts0(items, n) {
    return (items[0].opts || []).slice(0, n || 3).map(function (o) { return o.text; });
  }
  function abs(node, css) { node.style.cssText = css; return node; }
  /* one finished scene per game — the picture the game actually happens in */
  var SCENE = {
    /* orchard: baskets wait on the grass under the trees */
    catchBasket: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-dawn)"/>' + sun(322, 46, 20)
        + cloud(70, 34, .9) + cloud(196, 22, .7, .8)
        + hills('#a8d8b4', 168, .9) + hills('url(#g4-grass)', 196)
        + '<g fill="#4a7c46"><rect x="34" y="150" width="10" height="46" rx="4"/>'
        + '<rect x="356" y="158" width="9" height="40" rx="4"/></g>'
        + '<g fill="#5f9b52"><circle cx="39" cy="140" r="26"/><circle cx="361" cy="148" r="22"/>'
        + '<circle cx="18" cy="158" r="16"/></g>'
        + '<g fill="#c0392b" opacity=".85"><circle cx="31" cy="136" r="4"/><circle cx="49" cy="146" r="4"/>'
        + '<circle cx="356" cy="144" r="3.5"/><circle cx="368" cy="156" r="3.5"/></g>');
    },
    /* garden at dusk: holes in the soil, hills behind */
    whackMole: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-dusk)"/>' + sun(84, 58, 15)
        + hills('#6b4a6e', 150, .85) + hills('#3f2d4a', 176)
        + '<rect y="196" width="400" height="64" fill="url(#g4-soil)"/>'
        + '<g fill="#2d1a12" opacity=".55"><ellipse cx="60" cy="228" rx="34" ry="9"/>'
        + '<ellipse cx="200" cy="244" rx="40" ry="10"/><ellipse cx="340" cy="226" rx="32" ry="9"/></g>'
        + '<g stroke="#7a5030" stroke-width="2" opacity=".5"><path d="M0 214h400"/>'
        + '<path d="M0 238h400" stroke-dasharray="18 12"/></g>');
    },
    /* building site at sunset: the tower goes up here */
    stackDrop: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-dusk)"/>' + sun(318, 52, 22)
        + '<g fill="#3c3350" opacity=".95"><rect x="16" y="150" width="46" height="70"/>'
        + '<rect x="72" y="128" width="34" height="92"/><rect x="300" y="140" width="52" height="60"/>'
        + '<rect x="358" y="164" width="30" height="46"/></g>'
        + '<rect y="212" width="400" height="48" fill="#241d33"/>'
        + '<g stroke="#2a2238" stroke-width="4" fill="none"><path d="M150 212V96h70"/><path d="M150 110h44"/></g>'
        + '<rect x="214" y="96" width="3" height="10" fill="#8f7f5e"/>');
    },
    /* open sky: the flier's playground */
    flapGate: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-dawn)"/>' + sun(60, 40, 18)
        + cloud(120, 52, 1.1) + cloud(268, 34, .8, .85) + cloud(340, 76, .95, .7) + cloud(40, 96, .7, .6)
        + hills('#bfe3c6', 190, .85) + hills('url(#g4-grass)', 222)
        + '<g stroke="#3f6b45" stroke-width="3" fill="none" opacity=".55"><path d="M18 232q8-10 16 0"/>'
        + '<path d="M60 246q8-10 16 0"/><path d="M320 240q8-10 16 0"/></g>');
    },
    /* main street: timber saloon fronts on both sides, a boardwalk underfoot */
    mineGrid: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-dawn)"/>' + sun(330, 46, 20)
        /* the sky runs the whole width; the desert is what is under it, not a strip behind the doors */
        + cloud(66, 30, .8, .8) + cloud(228, 22, .6, .65)
        + '<path d="M0 150l46-34 30 22 34-40 42 52z" fill="#b98c78" opacity=".55"/>'
        + '<path d="M236 148l40-30 26 20 34-34 44 44z" fill="#a97f6c" opacity=".45"/>'
        + '<path d="M0 152h400v108H0z" fill="url(#g4-sand)"/>'
        /* the town: two storefronts, each with an awning, a window and a door board */
        + '<g><rect x="-10" y="70" width="118" height="132" fill="#8a6a48"/>'
        + '<rect x="-10" y="64" width="118" height="12" fill="#a5896a"/>'
        + '<rect x="2" y="82" width="94" height="14" fill="#c98a4b"/>'
        + '<path d="M2 82h94l-6 14H8z" fill="#b3763a"/>'
        + '<g fill="#3a2a1c" opacity=".5"><rect x="12" y="106" width="30" height="34"/><rect x="56" y="106" width="30" height="34"/></g>'
        + '<g stroke="#6f4a2a" stroke-width="2" opacity=".55"><path d="M12 123h30M56 123h30"/></g></g>'
        + '<g><rect x="292" y="82" width="118" height="120" fill="#93714b"/>'
        + '<rect x="292" y="76" width="118" height="12" fill="#a5896a"/>'
        + '<rect x="304" y="94" width="94" height="14" fill="#c98a4b"/>'
        + '<path d="M304 94h94l-6 14h-82z" fill="#b3763a"/>'
        + '<g fill="#3a2a1c" opacity=".5"><rect x="312" y="118" width="30" height="32"/><rect x="356" y="118" width="30" height="32"/></g>'
        + '<g stroke="#6f4a2a" stroke-width="2" opacity=".55"><path d="M312 134h30M356 134h30"/></g></g>'
        /* cacti and stones, so the middle reads as open desert and the doors sit in the town */
        + '<g fill="#4f7a52"><rect x="152" y="164" width="9" height="40" rx="4"/><rect x="140" y="176" width="12" height="8" rx="4"/>'
        + '<rect x="161" y="170" width="12" height="8" rx="4"/></g>'
        + '<g fill="#4f7a52"><rect x="252" y="176" width="7" height="30" rx="3.5"/><rect x="243" y="186" width="9" height="6" rx="3"/></g>'
        + '<g fill="#9a7a4a" opacity=".7"><circle cx="196" cy="216" r="4"/><circle cx="120" cy="228" r="3"/>'
        + '<circle cx="286" cy="222" r="3.5"/></g>'
        + '<g stroke="#a97c45" stroke-width="3" opacity=".45"><path d="M0 238h400"/></g>');
    },
    /* tiled wall: the word board hangs on bricks */
    wordleBoard: function () {
      var bricks = '', r, c, y;
      for (r = 0; r < 7; r++) {
        y = 12 + r * 36;
        bricks += '<path d="M0 ' + y + 'h400"/>';
        for (c = 0; c < 10; c++) bricks += '<path d="M' + (c * 40 + (r % 2 ? 0 : 20)) + ' ' + y + 'v36"/>';
      }
      return frame('<rect width="400" height="260" fill="url(#g4-brick)"/>'
        + '<g stroke="#7d4526" stroke-width="2" opacity=".55">' + bricks + '</g>'
        + '<rect x="112" y="34" width="176" height="192" rx="10" fill="#1d2733" opacity=".22"/>');
    },
    /* newspaper on a desk */
    crosswordBoard: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-wood)"/>'
        + '<rect x="18" y="14" width="364" height="232" rx="6" fill="url(#g4-paper)" filter="url(#g4-soft)" opacity=".55"/>'
        + '<rect x="18" y="14" width="364" height="232" rx="6" fill="url(#g4-paper)"/>'
        + '<g fill="#8a8371" opacity=".5"><rect x="34" y="30" width="120" height="8" rx="3"/>'
        + '<rect x="34" y="46" width="80" height="6" rx="3"/></g>'
        + '<g stroke="#cfc3a3" stroke-width="1" opacity=".6"><path d="M0 30h400"/></g>');
    },
    /* night arcade: the pads glow on a neon grid */
    echoPads: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-night)"/>' + stars(26)
        + '<circle cx="200" cy="150" r="120" fill="url(#g4-glow)" opacity=".28"/>'
        + '<g stroke="#4ad4ff" stroke-width="1.4" opacity=".35"><path d="M0 214h400"/><path d="M0 236h400"/>'
        + '<path d="M40 200l-30 60"/><path d="M150 200l-20 60"/><path d="M250 200l20 60"/>'
        + '<path d="M360 200l30 60"/></g>'
        + '<g fill="#ff5fa2" opacity=".5"><circle cx="60" cy="60" r="2"/><circle cx="340" cy="48" r="2"/>'
        + '<circle cx="200" cy="34" r="2"/></g>');
    },
    /* bingo hall: curtain, lights, a stage to stand on */
    bingoCard: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-studio)"/>'
        + '<path d="M0 0h400v64q-100 40-200 0T0 64Z" fill="url(#g4-curtain)"/>'
        + '<g fill="#ffd76a" opacity=".55"><circle cx="80" cy="30" r="4"/><circle cx="160" cy="18" r="4"/>'
        + '<circle cx="240" cy="18" r="4"/><circle cx="320" cy="30" r="4"/></g>'
        + '<rect y="216" width="400" height="44" fill="#2a1c33"/>'
        + '<g stroke="#54406a" stroke-width="2" opacity=".7"><path d="M0 216h400"/></g>');
    },
    /* studio: spotlights over the ladder */
    ladderRun: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-studio)"/>'
        + '<path d="M120 260 60 0h60l40 260Z" fill="#8fb6ff" opacity=".16"/>'
        + '<path d="M280 260 340 0h-60l-40 260Z" fill="#ffd0e6" opacity=".14"/>'
        + '<rect y="222" width="400" height="38" fill="#141c33"/>'
        + '<g stroke="#3d4f7d" stroke-width="2" opacity=".8"><path d="M0 222h400"/></g>'
        + '<g fill="#ffd76a" opacity=".7"><circle cx="40" cy="18" r="3"/><circle cx="200" cy="10" r="3"/>'
        + '<circle cx="360" cy="18" r="3"/></g>');
    },
    /* arena: torches and a floor */
    bossRaid: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-cave)"/>'
        + '<path d="M0 0h400v40q-60 26-120 0t-120 0T0 40Z" fill="#160d16"/>'
        + '<g><circle cx="46" cy="74" r="30" fill="url(#g4-glow)" opacity=".8"/>'
        + '<rect x="42" y="74" width="8" height="30" fill="#3a2a22"/></g>'
        + '<g><circle cx="354" cy="74" r="30" fill="url(#g4-glow)" opacity=".8"/>'
        + '<rect x="350" y="74" width="8" height="30" fill="#3a2a22"/></g>'
        + '<rect y="214" width="400" height="46" fill="#241419"/>'
        + '<g stroke="#4a2a2b" stroke-width="2" opacity=".8"><path d="M0 214h400"/></g>');
    },
    /* outdoor range at dawn: sky for the discs, a fence to shoot over */
    skeetRange: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-dawn)"/>' + sun(316, 42, 16)
        + cloud(74, 38, .9, .85) + cloud(208, 24, .65, .7)
        + hills('#a8d8b4', 156, .9) + hills('#4f7a52', 188)
        + '<rect y="204" width="400" height="56" fill="url(#g4-grass)"/>'
        + '<path d="M12 216h376" stroke="#8a5622" stroke-width="4" stroke-linecap="round" opacity=".85"/>'
        + '<g stroke="#6b4520" stroke-width="5" stroke-linecap="round" opacity=".9">'
        + '<path d="M22 216v38"/><path d="M104 216v38"/><path d="M186 216v38"/>'
        + '<path d="M268 216v38"/><path d="M350 216v38"/></g>');
    }
  };
  /* ---------------- posters: one still per game, drawn behind the intro overlay ----------------
     Each uses the same classes the live game uses, so the picture is styled by the same CSS, and the
     labels are the lesson's own option words. Nothing here reads or writes an answer. */
  var POSTER = {
    catchBasket: function (box, items) {
      var row = el('div', 'g4-bit');
      row.appendChild(el('div', 'g4-chip active', esc(items[0].prompt)));
      abs(row, 'left:0;right:0;top:6%;display:flex;justify-content:center');
      box.appendChild(row);
      /* same flex tray the live stage uses, and one pot per option the item has */
      var texts = (items[0].opts || []).map(function (o) { return o.text; });
      var tray = el('div', 'g4-bit');
      abs(tray, 'left:3%;right:3%;bottom:4%;display:flex;gap:10px');
      texts.forEach(function (t, i) {
        var b = el('div', 'g4-bucket');
        b.style.flex = '1 1 0';
        b.innerHTML = ART.pot + '<span class="g4-bucket-t">' + esc(t) + '</span>'
          + '<span class="g4-blooms">' + (i === 0 ? '<span class="g4-bloom">' + ART.flower + '</span>' : '') + '</span>';
        tray.appendChild(b);
      });
      box.appendChild(tray);
    },
    whackMole: function (box, items) {
      /* the six holes are the still's garden; the moles are one per option, as in the live game */
      var texts = (items[0].opts || []).map(function (o) { return o.text; });
      for (var i = 0; i < 6; i++) {
        var h = el('div', 'g4-hole g4-bit');
        h.innerHTML = '<span class="g4-dirt"></span>';
        abs(h, 'left:' + (5 + (i % 3) * 31) + '%;top:' + (30 + Math.floor(i / 3) * 34) + '%;width:27%;height:30%');
        if (texts[i]) {
          h.appendChild(el('div', 'g4-mole', ART.mole + '<span class="g4-mole-t">' + esc(texts[i]) + '</span>'));
        }
        box.appendChild(h);
      }
    },
    stackDrop: function (box, items) {
      /* the still is the tower as it stands, drawn in the live game's own furniture: the question card
         held on the left, three blocks already placed, the climber against the tower's left face, the
         chest on top of what has been built, and the answer tray along the floor. No ladder — he climbs
         the stack itself. Same classes as the live game, so the same CSS draws it. */
      var texts = (items[0].opts || []).map(function (o) { return o.text; });
      box.appendChild(abs(el('div', 'g4-qcard g4-bit', esc(items[0].prompt || '')),
        'left:10px;top:50%;width:30%'));
      [0, 30, 60].forEach(function (b, i) {
        box.appendChild(abs(el('div', 'g4-layer g4-bit', esc(texts[i] || '')),
          'left:34%;right:12%;bottom:' + (46 + b) + 'px'));
      });
      box.appendChild(abs(el('div', 'g4-climber g4-bit', ART.hero),
        'left:34%;bottom:76px;width:30px;height:44px;margin-left:-8px'));
      box.appendChild(abs(el('div', 'g4-prize g4-bit', ART.chest),
        'left:34%;right:12%;bottom:136px;width:38px;height:34px;opacity:.85'));
      var n = Math.max(1, texts.length);
      texts.forEach(function (t, i) {
        box.appendChild(abs(el('div', 'g4-padbtn g4-bit', esc(t)),
          'left:' + (36 + i * (52 / n)).toFixed(1) + '%;bottom:8px;width:' + (44 / n).toFixed(1) + '%;height:40px'));
      });
    },
    flapGate: function (box, items) {
      /* the still is the wall at the moment it arrives: gaps cut for the words, the bird in one of them */
      var texts = (items[0].opts || []).map(function (o) { return o.text; });
      var n = Math.max(1, texts.length);
      var wall = el('div', 'g4-walls g4-bit');
      abs(wall, 'left:46%;top:0;bottom:0;width:38%');
      var prev = 0;
      texts.forEach(function (t, i) {
        var top = (100 / n) * i + 5, hgt = (100 / n) - 14;
        wall.appendChild(abs(el('div', 'g4-seg'), 'top:' + prev + '%;height:' + Math.max(0, top - prev) + '%'));
        wall.appendChild(abs(el('div', 'g4-gapg', '<span class="g4-gapg-t">' + esc(t) + '</span>'),
          'top:' + top + '%;height:' + hgt + '%'));
        prev = top + hgt;
      });
      wall.appendChild(abs(el('div', 'g4-seg'), 'top:' + prev + '%;bottom:0'));
      box.appendChild(wall);
      box.appendChild(abs(el('div', 'g4-bird g4-bit', ART.bird), 'left:14px;top:40%;width:40px;height:30px'));
    },
    mineGrid: function (box, items) {
      /* the still is the street: one saloon door per option, hung with its word, the hero watching */
      var texts = opts0(items, 4);
      var n = Math.max(1, texts.length);
      box.appendChild(abs(el('div', 'g4-road'), 'left:0;right:0;bottom:0;height:34%'));
      texts.forEach(function (t, i) {
        var door = el('div', 'g4-door g4-bit');
        door.innerHTML = '<span class="g4-doorsign">' + esc(t) + '</span>'
          + '<span class="g4-dframe"><span class="g4-dhole"></span>'
          + '<span class="g4-dleaf left">' + ART.saloonLeaf + '</span>'
          + '<span class="g4-dleaf right">' + ART.saloonLeaf + '</span>'
          + '<span class="g4-djamb">' + ART.saloonFrame + '</span></span>';
        abs(door, 'left:' + (3 + i * (94 / n)).toFixed(1) + '%;bottom:12%;width:' + (86 / n).toFixed(1) + '%;height:56%');
        box.appendChild(door);
      });
      box.appendChild(abs(el('div', 'g4-runner g4-bit', ART.hero), 'left:50%;bottom:10%;width:26px;height:40px'));
    },

  wordleBoard: function (box, items) {
    var word = String((items[0].opts[0] || {}).text || '').slice(0, 5);
    var grid = el('div', 'g4-wgrid g4-bit');
    for (var r = 0; r < 3; r++) {
      var row = el('div', 'g4-wrow');
      for (var c = 0; c < Math.max(3, word.length); c++) {
        var t = el('div', 'g4-tile');
        if (r === 0 && word[c]) t.textContent = word[c].toUpperCase();
        if (r === 0 && word[c]) t.classList.add(c === 1 ? 'near' : 'ok');
        row.appendChild(t);
      }
      grid.appendChild(row);
    }
    abs(grid, 'left:50%;top:14%;transform:translateX(-50%)');
    box.appendChild(grid);
    box.appendChild(abs(el('div', 'g4-wtype g4-bit', '​'),
      'left:50%;bottom:10%;transform:translateX(-50%);width:180px'));
  },
  crosswordBoard: function (box, items) {
    var word = String((items[0].opts[0] || {}).text || '').slice(0, 6);
    var grid = el('div', 'g4-xgrid g4-bit');
    grid.style.gridTemplateColumns = 'repeat(' + Math.max(3, word.length) + ',34px)';
    for (var i = 0; i < Math.max(3, word.length); i++) {
      var cell = el('div', 'g4-xcell');
      var g = el('div', 'g4-gap' + (i === 0 ? ' from' : ''), i === 0 ? word[0].toUpperCase() : '');
      cell.appendChild(g);
      grid.appendChild(cell);
    }
    abs(grid, 'left:50%;top:30%;transform:translateX(-50%)');
    box.appendChild(grid);
  },
  echoPads: function (box, items) {
    /* the still is the sentence as far as it goes: the given opening, one word placed, then the pads */
    var first = (items[0].item.getAttribute('data-first') || '').trim();
    var line = el('div', 'g4-echo-say g4-bit');
    if (first) line.appendChild(el('span', 'g4-echo-w given', esc(first)));
    var k = 0;
    (items[0].opts || []).forEach(function (o) {
      if (k || o.value !== items[0].key) return;
      line.appendChild(el('span', 'g4-echo-w', esc(o.text)));
      k = 1;
    });
    line.appendChild(el('span', 'g4-echo-cursor', '▌'));
    abs(line, 'left:8%;right:8%;top:12%');
    box.appendChild(line);
    var pads = el('div', 'g4-pads g4-bit');
    (items[0].opts || []).forEach(function (o) {
      pads.appendChild(el('div', 'g4-pad', esc(o.text)));
    });
    abs(pads, 'left:10%;right:10%;top:40%');
    box.appendChild(pads);
  },
  bingoCard: function (box, items) {
    var texts = [];
    items.forEach(function (it) { (it.opts || []).forEach(function (o) { if (texts.length < 9) texts.push(o.text); }); });
    var card = el('div', 'g4-bcard g4-bit');
    for (var i = 0; i < 9; i++) {
      card.appendChild(el('div', 'g4-btile' + (i === 4 ? ' stamped' : ''), esc(texts[i] || '')));
    }
    abs(card, 'left:50%;top:50%;transform:translate(-50%,-50%);width:78%;height:74%;display:grid;grid-template-columns:repeat(3,1fr);gap:6px');
    box.appendChild(card);
  },
  ladderRun: function (box, items) {
    var rungs = el('div', 'g4-rungs g4-bit');
    for (var i = 0; i < 8; i++) {
      rungs.appendChild(el('div', 'g4-rung' + (i === 3 ? ' safe' : '') + (i === 2 ? ' on' : ''), String(i + 1)));
    }
    abs(rungs, 'left:6%;top:14%;bottom:14%;display:flex;flex-direction:column-reverse;gap:3px;width:64px');
    box.appendChild(rungs);
  },
  bossRaid: function (box, items) {
    /* the still is the arena: the boss, its health, and the swordsman it is about to meet */
    var art = el('div', 'g4-bossart g4-bit');
    art.innerHTML = ART.boss;
    abs(art, 'left:50%;top:8%;transform:translateX(-50%);width:96px;height:96px');
    box.appendChild(art);
    box.appendChild(abs(el('div', 'g4-hp g4-bit', '<span class="g4-hp-fill" style="width:72%"></span>'),
      'left:14%;right:14%;top:56%;height:14px'));
    box.appendChild(abs(el('div', 'g4-hero g4-bit', ART.heroSword), 'left:6%;bottom:12%;width:52px;height:76px'));
  },
  skeetRange: function (box, items) {
    /* one disc per option the lesson actually wrote (two to four), label on the disc like the live
       game, and spread across the width so the last disc is never pushed out of frame */
    var texts = (items[0].opts || []).map(function (o) { return o.text; });
    var n = Math.max(1, texts.length);
    texts.forEach(function (t, i) {
      box.appendChild(abs(el('div', 'g4-target g4-bit',
        '<span class="g4-ring"></span><span class="g4-target-t">' + esc(t) + '</span>'),
        'left:' + (4 + i * (92 / n)).toFixed(1) + '%;top:' + (14 + (i % 2) * 28) + '%;width:24%;animation:none'));
    });
    box.appendChild(abs(el('div', 'g4-cross g4-bit'), 'left:52%;top:56%;width:46px;height:46px;margin:-23px 0 0 -23px'));
  }
  };

function say(text, lang) {
    try {
      if (!text || !window.speechSynthesis) return false;
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = lang || 'en-US';
      u.rate = 0.92;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }



  /* ---------------- stackDrop: the answer is a block, and the tower is what you build ----------------
     The question sits to the LEFT of the tower, vertically centred, because it is the thing being built
     AGAINST and not a block stacked on top of the work. The tower stands on the stage floor to its
     right: the right answer is dragged onto it (or clicked, or pressed), the block flies up, lands, and
     stays for the rest of the run. A wrong one tumbles off and the tower is untouched, so the tower
     never loses what was earned and its height IS the progress.
     There is no ladder: the climber climbs the tower itself, one answer at a time, standing against its
     left face. Place every answer and he reaches the chest on top — that is the only reason to stack,
     and it is what the tower is for.
     Authoring: `.qitem` per question (six to ten makes a climb); options are the blocks. `data-time`
     is the deadline for one block. The question card IS the prompt, so the stage does not print the
     same words again on the HUD line (ownsPrompt). */
  PLUGINS.stackDrop = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-tower');
    var qcard = el('div', 'g4-qcard', '');
    var view = el('div', 'g4-stackview');
    var scroll = el('div', 'g4-scroll');
    var stack = el('div', 'g4-stack');
    var climber = el('div', 'g4-climber');
    var prize = el('div', 'g4-prize');
    var pads = el('div', 'g4-towerpads');
    climber.innerHTML = ART.hero;
    prize.innerHTML = ART.chest;
    scroll.appendChild(stack);
    scroll.appendChild(climber); scroll.appendChild(prize);
    view.appendChild(scroll);
    box.appendChild(qcard); box.appendChild(view); box.appendChild(pads);
    stage.appendChild(box);

    var AH = 26, GAP = 4;               /* one tower block, and the seam between two */
    var top = 0;                        /* how tall the tower stands, in px */
    var placed = 0;                     /* answers that have joined the tower */
    var bits = [];                      /* every layer this run drew, so reset can take them back */
    var drag = null, moved = false, busy = false;

    /* the tower may outgrow the window: it is bottom-anchored, so the newest block is kept in view by
       sliding the whole stack down — the words that scroll off are still part of the tower */
    function scrollTo() {
      var viewH = view.clientHeight || 210;
      scroll.style.transform = top > viewH ? 'translateY(' + (top - viewH) + 'px)' : '';
    }
    /* one block of the tower, and the climber rises to its top: he climbs the STACK, there is no ladder */
    function layer(text, cls) {
      var d = el('div', 'g4-layer' + (cls ? ' ' + cls : ''), text);
      d.style.bottom = top + 'px';
      stack.appendChild(d);
      bits.push(d);
      top += AH + GAP;
      prize.style.bottom = top + 'px';        /* the chest sits on top of what has been built */
      climber.style.bottom = (top - AH - GAP) + 'px';
      scrollTo();
      return d;
    }

    function clear() {
      pads.innerHTML = '';
      drag = null; busy = false; moved = false;
      [].slice.call(stack.querySelectorAll('.g4-layer')).forEach(function (d) {
        d.classList.remove('mark-ok', 'mark-no');
      });
    }
    /* a new run builds a new tower */
    function reset() {
      bits.forEach(function (b) { if (b.parentNode) b.parentNode.removeChild(b); });
      bits = [];
      stack.innerHTML = '';
      top = 0; placed = 0;
      qcard.textContent = '';
      climber.style.bottom = '0px';
      climber.classList.remove('cheer');
      prize.classList.remove('won');
      prize.style.bottom = '0px';
      scroll.style.transform = '';
    }
    function show(item) {
      clear();
      qcard.textContent = item.prompt || '⋯';
      item.opts.forEach(function (o) {
        var p = el('button', 'g4-padbtn', o.text);
        p.type = 'button';
        p.setAttribute('data-v', o.value);
        p.addEventListener('pointerdown', function (e) { down(e, p); });
        p.addEventListener('pointermove', move);
        p.addEventListener('pointerup', up);
        p.addEventListener('pointercancel', up);
        p.addEventListener('click', function () {
          if (moved) { moved = false; return; }      /* the drag already answered it */
          place(o.value, p);
        });
        pads.appendChild(p);
      });
    }
    /* the block travels from the tray to the top of the tower, then the answer is taken */
    function place(value, pad) {
      if (r.phase !== 'play' || busy) return false;
      busy = true;
      var bb = box.getBoundingClientRect(), pb = pad ? pad.getBoundingClientRect() : bb;
      var x0 = pb.left - bb.left + pb.width / 2, y0 = pb.top - bb.top;
      var fly = el('div', 'g4-flyblk', pad ? pad.textContent : '');
      fly.style.left = x0 + 'px';
      fly.style.top = y0 + 'px';
      box.appendChild(fly);
      void fly.offsetWidth;
      fly.style.marginLeft = (-fly.offsetWidth / 2).toFixed(0) + 'px';
      var viewH = view.clientHeight || 210;
      var d = Math.max(0, top - viewH);
      var tx = bb.width * 0.61;                       /* the tower's own centre line */
      var ty = viewH - top + d - AH;                  /* where the new block's top edge will be */
      fly.style.transform = 'translate(' + (tx - x0).toFixed(0) + 'px,'
        + (ty - y0).toFixed(0) + 'px) scale(.88)';
      fly.classList.add('go');
      r.later(function () {
        if (fly.parentNode) fly.parentNode.removeChild(fly);
        if (r.phase === 'play') r.pick(value);
      }, r.reduced ? 20 : 320);
      return true;
    }
    function down(e, p) {
      if (r.phase !== 'play' || busy) return;
      if (e.preventDefault) e.preventDefault();
      if (p.setPointerCapture) { try { p.setPointerCapture(e.pointerId); } catch (x) { /* older engines */ } }
      drag = { p: p, id: e.pointerId, v: p.getAttribute('data-v'), x: e.clientX, y: e.clientY };
      moved = false;
    }
    function move(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!moved && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 5) return;
      moved = true;
      if (!drag.lifted) {
        var q = drag.p.getBoundingClientRect();
        drag.off = { x: e.clientX - q.left, y: e.clientY - q.top };
        drag.p.style.position = 'fixed';
        drag.p.style.width = q.width + 'px';
        drag.p.style.height = q.height + 'px';
        drag.p.style.left = q.left + 'px';
        drag.p.style.top = q.top + 'px';
        drag.p.style.zIndex = '20';
        drag.p.classList.add('lifted');
        drag.lifted = true;
      }
      drag.p.style.left = (e.clientX - drag.off.x) + 'px';
      drag.p.style.top = (e.clientY - drag.off.y) + 'px';
    }
    function up(e) {
      if (!drag) return;
      var d = drag, p = d.p;
      drag = null;
      if (d.lifted) {
        p.style.position = ''; p.style.left = ''; p.style.top = '';
        p.style.width = ''; p.style.height = ''; p.style.zIndex = '';
        p.classList.remove('lifted');
      }
      if (!moved) return;                             /* a plain click places it in its own handler */
      var q = view.getBoundingClientRect();
      var over = e.clientX >= q.left && e.clientX <= q.right && e.clientY >= q.top && e.clientY <= q.bottom;
      if (over) place(d.v, p);
    }
    function mark(item, hit, value) {
      var text = '', opt = null;
      (item.opts || []).forEach(function (o) { if (o.value === value) opt = o; });
      if (opt) text = opt.text;
      [].slice.call(pads.querySelectorAll('.g4-padbtn')).forEach(function (p) {
        var v = p.getAttribute('data-v');
        if (v === value) p.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) p.classList.add('reveal');
      });
      if (hit) {
        layer(text, 'mark-ok');
        placed++;
        if (placed >= r.total) {
          prize.classList.add('won');
          climber.classList.add('cheer');
        }
      } else {
        /* the block tumbles off the tower: it is never part of what gets built */
        var bad = layer(text || '—', 'mark-no fall');
        var at = top;
        r.later(function () {
          if (bad.parentNode) bad.parentNode.removeChild(bad);
          top = at - AH - GAP;
          prize.style.bottom = top + 'px';
          climber.style.bottom = Math.max(0, top - AH - GAP) + 'px';
          scrollTo();
        }, r.reduced ? 20 : 520);
      }
    }
    return {
      show: show, mark: mark, clear: clear, reset: reset, ownsPrompt: true
    };
  };

  /* ---------------- flapGate: one-button flight through the right gap ----------------
     The gaps are real holes in a wall. One gap per option, each labelled, and the wall scrolls toward
     the bird at its own speed; the wall reaches the bird about 45% of the way through the item's
     clock, so the words come round more than once. Where the bird is at that moment is the answer —
     the gap it flew through, or the brick it flew into. The words are text in the gaps, not buttons:
     the whole sky is the control, so a click (or Space) flaps and nothing in the wall takes one.
     The bird is drawn, not a black square, and it flaps its wings on every lift — including the one
     automatic flap as the round opens, so it is never falling before the student has touched anything.
     Fall is half what this game used to be: half the gravity, the same lift.
     SCORING, and it is deliberately not "items answered":
       · a right gap is a POINT, and the flight carries on into the next question;
       · a wrong gap is no point at all — it costs nothing else, and the flight carries on;
       · only the BRICK — flying into the wall — costs a life. A life loss zeroes the streak and puts
         the bird back in the middle of the sky, still on the same question, which is what makes the
         wall the one thing worth flying well for.
     So the score is the BEST STREAK reached in any life (`view.score()`), not the number of items got:
     three clean runs of four are worth more than one clean run of six interrupted twice.
     Authoring: `.qitem` per item, one gap per option, `data-time` the deadline (and the wall's speed). */
  PLUGINS.flapGate = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-sky'), wall = el('div', 'g4-walls'), bird = el('div', 'g4-bird');
    bird.innerHTML = ART.bird;
    box.appendChild(wall); box.appendChild(bird);
    stage.appendChild(box);
    var BX = 64, BH = 34, GAPH = 65;   /* the bird sits 30px further right than it used to; gaps 15px taller */
    var G = 168, LIFT = -128;          /* px per second² and px per second: half the old fall */
    var raf = 0, live = false, y = 0, vy = 0, t0 = 0, flight = 0, speed = 0.06;
    var gaps = [], judged = false, lastPass = -1, left = 3, target = '';
    var points = 0, best = 0;          /* the streak, and the best streak any life reached */
    function stop() { live = false; if (raf && window.cancelAnimationFrame) window.cancelAnimationFrame(raf); raf = 0; }
    function home() { return ((box.clientHeight || 280) / 2) - BH / 2; }
    function reset() { left = 3; points = 0; best = 0; }
    function clear() {
      stop();
      wall.innerHTML = ''; gaps = []; judged = false; lastPass = -1; target = '';
      y = home(); vy = 0; flight = 0;
      bird.style.top = y + 'px';
      bird.classList.remove('ok', 'no');
    }
    /* the BRICK, and only the brick: one life, the streak goes back to zero, and the bird is put back
       in the middle of the sky on the SAME question — nothing that was answered is taken back */
    function hitWall() {
      left = Math.max(0, left - 1);
      points = 0;
      bird.classList.remove('no');
      void bird.offsetWidth;
      bird.classList.add('no');
      SFX.miss(r.sound);
      r.hud();
      if (!left) {
        stop();
        r.later(function () { if (r.running) r.finish(); }, 700);
        return true;
      }
      y = home(); vy = LIFT;                  /* back to the middle, on the same round's lift */
      bird.style.top = y + 'px';
      return false;
    }
    function show(item) {
      clear();
      target = item.key;
      var h = box.clientHeight || 280, W = box.clientWidth || 600;
      var n = Math.max(1, item.opts.length);
      /* the gaps are cut out of the wall for real: the segments between them are the bricks */
      var prev = 0;
      for (var i = 0; i < n; i++) {
        var c = h * (i + 1) / (n + 1), top = Math.max(4, c - GAPH / 2);
        var o = item.opts[i];
        /* the answer is TEXT in the gap, not a button: the whole sky is the control (click or Space
           flaps), so nothing in the wall may take a click of its own */
        var g = el('div', 'g4-gapg');
        g.setAttribute('data-v', o.value);
        g.style.top = top + 'px';
        g.style.height = GAPH + 'px';
        g.appendChild(el('span', 'g4-gapg-t', o.text));
        wall.appendChild(g);
        gaps.push({ top: top, value: o.value, gap: g });
        /* the brick between the previous gap and this one */
        if (top > prev) wall.appendChild(seg(prev, top - prev));
        prev = top + GAPH;
      }
      if (h > prev) wall.appendChild(seg(prev, h - prev));
      wall.style.transform = 'translateX(' + W + 'px)';
      /* A pass takes a little under half the item's clock, so the words come round again: the wall is
         never a single throw you either catch or miss, it is a stream you can read twice. */
      speed = (W - BX) / Math.max(1400, (r.itemTime || 6000) * 0.45);
      if (r.reduced) return;
      live = true;
      t0 = (window.performance && performance.now) ? performance.now() : Date.now();
      var frame = function (now) {
        if (!live) return;
        var dt = Math.min(0.05, ((now || t0) - t0) / 1000);
        t0 = now || Date.now();
        vy += G * dt;
        y = Math.max(2, Math.min(h - BH - 2, y + vy * dt));
        bird.style.top = y.toFixed(1) + 'px';
        flight += dt * 1000;
        /* the wall is one continuous stream: when a wall has crossed the stage it comes round again
           from the right, so the answers keep arriving instead of arriving once */
        var unit = W + (wall.offsetWidth || 100);
        var trav = flight * speed;
        var pass = Math.floor(trav / unit);
        wall.style.transform = 'translateX(' + (W - (trav % unit)).toFixed(0) + 'px)';
        if (pass !== lastPass) { lastPass = pass; judged = false; }
        /* the wall meets the bird: the gap it is in is the answer it flew through */
        if (!judged && W - (trav % unit) <= BX) {
          judged = true;
          var cy = y + BH / 2, picked = null;
          gaps.forEach(function (g) { if (cy >= g.top && cy <= g.top + GAPH) picked = g; });
          if (picked) {
            /* a gap is an ANSWER, right or wrong: the runner takes it and the flight moves on to the
               next question. Only the brick costs a life, so a wrong gap is just no point. */
            live = false;
            picked.gap.classList.add(picked.value === target ? 'ok' : 'no');
            bird.classList.add(picked.value === target ? 'ok' : 'no');
            r.pick(picked.value);
            return;
          }
          /* the bricks: the one thing in this game that costs a life */
          if (hitWall()) return;
        }
        raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : 0;
      };
      raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : 0;
      flap();                                     /* the round opens on a lift, never on a fall */
    }
    function seg(top, hgt) {
      var s = el('div', 'g4-seg');
      s.style.top = top + 'px';
      s.style.height = hgt + 'px';
      return s;
    }
    function flap() {
      if (!live || r.phase !== 'play') return;
      vy = LIFT;
      bird.classList.remove('flap');
      void bird.offsetWidth;
      bird.classList.add('flap');
    }
    box.addEventListener('click', flap);
    box.setAttribute('tabindex', '0');
    box.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') { e.preventDefault(); flap(); }
    });
    function mark(item, hit, value) {
      stop();
      gaps.forEach(function (g) {
        var v = g.value;
        if (v === value) g.gap.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) g.gap.classList.add('reveal');
      });
      bird.classList.add(hit ? 'ok' : 'no');
      /* a point for a right gap; a wrong gap (or the clock running out on one) is no point and
         nothing else — the only thing that costs a life here is flying into the wall */
      if (hit) {
        points++;
        best = Math.max(best, points);
        r.hud();
      }
    }
    return {
      show: show, mark: mark, clear: clear, flap: flap, reset: reset,
      lives: function () { return left; },
      score: function () { return best; }
    };
  };


  /* ---------------- skeetRange: one flying target per option, a fixed number of shots ----------------
     Each option's disc is thrown from off the left edge and flies away past the right edge, and every
     disc takes the SAME line: one arc, no wobble, no sine wave. Where each disc starts and how fast it
     crosses are rolled by 5% each, so the rack is never twice the same picture while the lanes still
     say which word is where.
     The AMMO is the run, not the item: you get one shot per item (`data-rounds`/list length), the pips
     in the top-left corner are the shots still in hand, and when the last shot is fired — hit, miss or
     a click on the sky — the run is over and the score is the targets hit. Nothing comes back for a
     second try, so `data-replay="0"` is what a real range writes.
     The range runs 30% slower than the block's own deadline (PLUGINS.skeetRange.timeScale), because a
     word flying past is a word nobody reads: the discs and the clock slow together, so the shot rule is
     unchanged and simply has more time in it.
     Authoring: `.qitem` per item, one disc per option (two to four, as the lesson writes them),
     `data-a` the right option, `data-time` the deadline and the flight time (0 = the throw simply
     repeats, which is the range with no clock). */
  PLUGINS.skeetRange = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-range'), field = el('div', 'g4-discs'), cross = el('div', 'g4-cross');
    box.appendChild(field); box.appendChild(cross);
    stage.appendChild(box);
    var FLIGHT = 7000;                  /* only when the block has no data-time: the throw repeats */
    var ARC = 26;                       /* the one arc, in px: up at the halfway point, level at both ends */
    /* The deadline is 10% longer than the throw, so every disc is across the range (and off it)
       before the item expires: the last disc you can still see is never the one you were waiting for. */
    var PAD = 1.1;
    /* the roll: where a disc starts and how fast it crosses are each varied by 5%, which is enough to
       stop the rack being a fixed picture and too little to move a word out of reading order */
    function jitter(v) { return v * (0.95 + Math.random() * 0.1); }
    function throwTime() { return (r.itemTime || FLIGHT) / PAD; }
    var raf = 0, live = false, t0 = 0, discs = [], spent = false;
    /* the AMMO: one shot per item, so a run of six questions is six shots and the range never resets
       a shot back into the gun. The pips are the block's own count of shots still in hand. */
    var ammoEl = el('div', 'g4-ammo'), ammo = 0, ammoTop = 0;
    box.appendChild(ammoEl);
    function drawAmmo() {
      var html = '';
      for (var i = 0; i < ammoTop; i++) html += '<span class="g4-shot' + (i < ammo ? ' full' : '') + '">●</span>';
      ammoEl.innerHTML = html;
      ammoEl.classList[ammo ? 'remove' : 'add']('empty');
    }
    function reset() {
      ammoTop = Math.max(0, r.items.length);
      ammo = ammoTop;
      drawAmmo();
    }
    function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
    function stop() { live = false; if (raf && window.cancelAnimationFrame) window.cancelAnimationFrame(raf); raf = 0; }
    function clear() { stop(); field.innerHTML = ''; discs = []; spent = false; }
    function aim(ev) {
      var b = box.getBoundingClientRect();
      cross.style.transform = 'translate(' + Math.round(ev.clientX - b.left) + 'px,' + Math.round(ev.clientY - b.top) + 'px)';
      cross.classList.add('live');
    }
    box.addEventListener('mousemove', aim);
    /* one shot: the disc is the answer, and the sky is a miss. Either way a shot is spent — and when
       the last one is gone the run is over, whatever is still in the air. */
    function shot(value) {
      if (r.phase !== 'play' || spent) return false;
      spent = true;
      if (ammo > 0) { ammo--; drawAmmo(); }
      stop();
      cross.classList.add('fire');
      r.later(function () { cross.classList.remove('fire'); }, 240);
      var out = r.pick(value);
      if (!ammo && r.phase === 'play') r.later(function () { if (r.phase === 'play') r.finish(); }, 900);
      return out;
    }
    box.addEventListener('click', function (ev) {
      if (!ev.target || !ev.target.closest) return;
      if (ev.target.closest('.g4-target')) return;    /* the disc's own handler already took it */
      shot(null);
    });
    /* a real throw: out of the trap off-screen left, over the range, away behind the right edge.
       Each disc rolls its own flight and its own start, so no two take the same line, and `p` is
       the share of THAT disc's flight that has gone. */
    function draw(t) {
      var w = box.clientWidth || 640, span = w + 240;
      discs.forEach(function (d) {
        var p = t / d._flight;
        if (!r.itemTime) p = p % 1;                  /* no deadline: throw after throw */
        p = Math.min(1, Math.max(0, p));
        var x = d._x0 + p * span;
        var lift = ARC * 4 * p * (1 - p);            /* one arc: zero at both edges, highest at half way */
        d.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(-lift) + 'px)';
      });
    }
    function show(item) {
      clear();
      /* the lesson decides how many targets there are — one per option, two to four — and the order
         of the options decides the lanes, so no disc ever flies behind another */
      var n = Math.max(1, item.opts.length);
      var flight = throwTime();
      item.opts.forEach(function (o, i) {
        var d = el('button', 'g4-target');
        d.type = 'button';
        d.setAttribute('data-v', o.value);
        d.innerHTML = '<span class="g4-ring"></span><span class="g4-target-t">' + esc(o.text) + '</span>';
        d.addEventListener('click', function (ev) { ev.stopPropagation(); shot(o.value); });
        field.appendChild(d);
        d._lane = n === 1 ? 0.5 : i / (n - 1);       /* even bands, first option highest */
        /* the SAME arc for every disc, rolled 5% on where it starts and 5% on how fast it crosses, so
           the rack is never twice the same picture and the lanes still say which word is where */
        d._arc = ARC;
        d._flight = jitter(flight);
        d._x0 = jitter(-120 - i * 8);                /* off the left edge, never on it */
        d.style.top = (12 + d._lane * 52 + (Math.random() * 2 - 1)) + '%';
        d.style.transform = 'translate(' + Math.round(d._x0) + 'px,0)';
        discs.push(d);
      });
      /* reduced motion keeps the state change and drops the travel: the discs sit still in their
         lanes and you still get exactly one shot at them */
      if (r.reduced) {
        discs.forEach(function (d, i) {
          d.style.left = (5 + (i * 32) / n) + '%';
          d.style.transform = 'none';
        });
        return;
      }
      live = true;
      t0 = now();
      draw(0);
      var frame = function (ts) {
        if (!live) return;
        draw((ts || now()) - t0);
        raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame)
          : setTimeout(function () { frame(now()); }, 16);
      };
      raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame)
        : setTimeout(function () { frame(now()); }, 16);
    }
    function mark(item, hit, value) {
      discs.forEach(function (d) {
        var v = d.getAttribute('data-v');
        if (v === value) d.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) d.classList.add('reveal');
      });
    }
    return { show: show, mark: mark, clear: clear, reset: reset };
  };
  /* the range carries a slower clock than the block asked for: `data-time` is stretched 30% by the
     runner (see the levers at the top), so the discs and the timer slow by the same 30% and a word can
     be read before it has to be shot at. */
  PLUGINS.skeetRange.timeScale = 1.3;

  /* ---------------- mineGrid: open the saloon door you trust ----------------
     The street is the item: every option is a pair of batwing doors into its own saloon, the word hung
     over the top where it can be read. Picking a door is the answer — he WALKS to it first, so the
     choice is a character's risk rather than a bare click — and the door swings open before anything
     is decided, because what is behind it IS the answer.
       right  he goes in: a glass clinks on the bar, the street fades out, and the next question fades
              in on an empty street.
       wrong  a snake comes out of the dark and bites him: one of his three lives gone.
     Three bites end the run. The lives belong to the RUN, not to the item: they are set on the way in
     (reset) and never on the way between items (clear), because the runner empties the stage after
     every answer and a life that came back with the next question would mean a miss cost nothing.
     The count is the HUD's (this presentation reports lives), so the stage draws no second copy of it.
     Marking is exact: on a right answer ONLY the door he opened turns green; on a wrong one that door
     turns red with the snake in it and the right door is outlined.
     Authoring: one `.qitem` per question, one option per door — four doors is what a street holds, so
     a block written for this game writes four options, not two or three. */
  PLUGINS.mineGrid = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-mines'), street = el('div', 'g4-street');
    var road = el('div', 'g4-road'), doors = el('div', 'g4-doors'), tiles = [];
    var hero = el('div', 'g4-runner');
    var flash = el('div', 'g4-flash');          /* the screen flash a snake bite throws */
    hero.innerHTML = ART.hero;
    street.appendChild(road); street.appendChild(doors); street.appendChild(hero);
    box.appendChild(street); box.appendChild(flash);
    stage.appendChild(box);
    var left = 3, busy = false, picked = null, dx = 0;

    /* a restart begins with three lives: run state, so the runner resets it on start */
    function reset() { left = 3; }
    function clear() {
      /* the street is emptied between items — the LIVES are not: they were paid for */
      doors.innerHTML = ''; tiles = []; busy = false; picked = null; dx = 0;
      hero.innerHTML = left < 2 ? ART.heroHurt : ART.hero;
      hero.classList.remove('enter', 'bitten', 'down');
      hero.style.transform = 'translate(0,0)';
    }
    function walkTo(d) {
      var hb = box.getBoundingClientRect(), db = d.getBoundingClientRect();
      dx = Math.round((db.left + db.width / 2) - (hb.left + hb.width / 2));
      hero.style.transform = 'translate(' + dx + 'px,0)';
      /* the CSS `down` state reads the walk from this variable, so a fighter who goes down goes down
         WHERE HE STOOD — never teleported back to the middle of the street */
      hero.style.setProperty('--dx', dx + 'px');
    }
    /* he goes in: the glass, the fade, then the answer is taken so the radio is written by the runner */
    function goIn(d, value) {
      d.classList.add('ok');
      SFX.clink(r.sound);
      hero.classList.add('enter');
      r.later(function () { street.classList.add('away'); }, r.reduced ? 20 : 240);
      r.later(function () { if (r.phase === 'play') r.pick(value); }, r.reduced ? 80 : 560);
    }
    /* the snake: it comes out of the dark, he takes the bite, and the choice still counts as his */
    function bitten(d, value) {
      d.classList.add('bitten', 'no');
      SFX.hiss(r.sound);
      hero.classList.add('bitten');
      /* the whole street flashes — the sting is the screen, not the sprite, and he stays where he is */
      flash.classList.remove('on');
      void flash.offsetWidth;
      if (!r.reduced) flash.classList.add('on');
      r.later(function () { if (r.phase === 'play') r.pick(value); }, r.reduced ? 80 : 520);
    }
    function show(item) {
      clear();
      /* the street fades back in under the new question, so one question never cuts to the next */
      street.classList.remove('away', 'settle');
      void street.offsetWidth;
      street.classList.add('settle');
      item.opts.forEach(function (o) {
        var d = el('button', 'g4-door');
        d.type = 'button';
        d.setAttribute('data-v', o.value);
        d.innerHTML = '<span class="g4-doorsign">' + esc(o.text) + '</span>'
          + '<span class="g4-dframe" aria-hidden="true">'
          + '<span class="g4-dhole"></span>'
          + '<span class="g4-dleaf left">' + ART.saloonLeaf + '</span>'
          + '<span class="g4-dleaf right">' + ART.saloonLeaf + '</span>'
          + '<span class="g4-djamb">' + ART.saloonFrame + '</span>'
          + '<span class="g4-snake">' + ART.snake + '</span>'
          + '</span>';
        d.addEventListener('click', function () {
          if (r.phase !== 'play' || busy) return;
          busy = true; picked = d;
          /* he does NOT walk to the door he picked: which door is safe is exactly what he does not
             know yet, and a man who strides confidently up to the door a snake comes out of reads as
             the game having told him. He walks in only when the door turns out to be the right one. */
          d.classList.add('open');
          r.later(function () {
            if (o.value === item.key) goIn(d, o.value); else bitten(d, o.value);
          }, r.reduced ? 60 : 360);
        });
        doors.appendChild(d);
        tiles.push({ el: d, value: o.value });
      });
    }
    function mark(item, hit, value) {
      tiles.forEach(function (t) {
        var mine = t.el === picked;
        if (hit && t.value === value) t.el.classList.add('ok');
        if (!hit && mine) t.el.classList.add('no');
        if (!hit && t.value === item.key) t.el.classList.add('reveal');
      });
      if (!hit) {
        left = Math.max(0, left - 1);
        hero.innerHTML = left < 2 ? ART.heroHurt : ART.hero;
        if (!left) {
          hero.classList.add('down');
          r.later(function () { if (r.running) r.finish(); }, 700);
        }
      }
      r.later(function () { busy = false; }, 520);
    }
    return { show: show, mark: mark, clear: clear, reset: reset, lives: function () { return left; } };
  };


  /* ---------------- wordleBoard (and hangman): one word, letter by letter ----------------
     The word is authored (`data-answer`) or is the correct option's text. Green = right letter,
     right place; amber = right letter, wrong place. Guessing the word answers the item, so the
     evidence is still the radio — the board is the work.
     The stage is read left to right: the clue sits on the left, the letters and the box you type into
     are the centre pair, and a message appears on the right. The three are on one line, centred
     vertically, so nothing moves when a letter lands — the board is five rows from the first word to
     the last and never grows, shrinks or jumps.
     A wrong length is not an answer and does not cost a row: it says so on the right ("too many
     letters", "too few letters") for 0.5s in, 2s up, 0.5s out, on a card with a red border — the same
     card as the clue, so a mistake reads as part of the board rather than as a floating label.
     The score COUNTDOWNS: the run banks one point per item and a word that is not got (all rows used,
     the clock spent, or the game moving on) costs one. At zero the run is over — a run of easy words
     cannot be "won" by guesswork, because every word you lose is a point you never get back. */
  PLUGINS.wordleBoard = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-wordle');
    var clue = el('div', 'g4-wclue');
    var main = el('div', 'g4-wmain');
    var grid = el('div', 'g4-wgrid');
    var msg = el('div', 'g4-wmsg');
    var entry = document.createElement('input');
    entry.className = 'g4-wtype';
    entry.setAttribute('type', 'text');
    entry.setAttribute('autocomplete', 'off');
    entry.setAttribute('aria-label', 'Type your guess and press Enter');
    main.appendChild(grid); main.appendChild(entry);
    box.appendChild(clue); box.appendChild(main); box.appendChild(msg);
    stage.appendChild(box);
    /* a wall of faint tiles behind the board: the game reads as a board, not a form */
    var back = el('div', 'g4-wbg');
    back.innerHTML = '<svg viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">'
      + '<defs><pattern id="g4wt" width="42" height="42" patternUnits="userSpaceOnUse">'
      + '<rect x="2" y="2" width="38" height="38" rx="6" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-width="2"/>'
      + '</pattern></defs><rect width="400" height="240" fill="url(#g4wt)"/></svg>';
    stage.insertBefore(back, box);
    var word = '', rows = 5, guesses = [], done = false;
    /* LIVES, not a guess countdown: the score counts UP (words got out of the run's words, the runner's
       own count) and two wrong words end the run — `data-lives` says how many, default 2. A word that is
       still unguessed when the rows run out is also a life, because it is a miss like any other. */
    var lives = 2;

    /* the message: 0.5s in, 2s up, 0.5s out (the animation is in the stylesheet) */
    function flash(text) {
      msg.textContent = text;
      msg.classList.remove('show');
      void msg.offsetWidth;
      msg.classList.add('show');
    }
    function target(item) {
      var own = item.item.getAttribute('data-answer');
      if (own) return norm(own).replace(/[^a-z]/g, '');
      var t = '';
      item.opts.forEach(function (o) { if (o.value === item.key) t = o.text; });
      return norm(t).replace(/[^a-z]/g, '');
    }
    function draw() {
      grid.innerHTML = '';
      for (var i = 0; i < rows; i++) {
        var row = el('div', 'g4-wrow');
        for (var j = 0; j < word.length; j++) row.appendChild(el('span', 'g4-tile'));
        grid.appendChild(row);
      }
      guesses.forEach(function (g, ri) {
        var row = grid.children[ri];
        if (!row) return;
        var left = word.split('');
        g.split('').forEach(function (ch, ci) {
          var t = row.children[ci];
          if (!t) return;
          t.textContent = ch.toUpperCase();
          if (word[ci] === ch) { t.className = 'g4-tile ok'; left[ci] = ''; }
        });
        g.split('').forEach(function (ch, ci) {
          var t = row.children[ci];
          if (!t || t.className.indexOf('ok') > -1) return;
          var at = left.indexOf(ch);
          if (at > -1) { t.className = 'g4-tile near'; left[at] = ''; }
          else t.className = 'g4-tile no';
        });
      });
    }
    function clear() { grid.innerHTML = ''; entry.value = ''; guesses = []; word = ''; done = false; }
    function show(item) {
      clear();
      word = target(item);
      clue.innerHTML = '';
      clue.appendChild(el('span', 'g4-wclue-t', item.prompt || ''));
      draw();
      entry.disabled = !word;
      if (word && entry.focus) { try { entry.focus({ preventScroll: true }); } catch (e) { entry.focus(); } }
    }
    function guess(text) {
      if (done || r.phase !== 'play' || !word) return false;
      var g = norm(text).replace(/[^a-z]/g, '');
      if (!g) { flash('Type a word first.'); return false; }
      if (g.length < word.length) { flash('Too few letters — ' + word.length + ' needed.'); return false; }
      if (g.length > word.length) { flash('Too many letters — ' + word.length + ' needed.'); return false; }
      guesses.push(g);
      entry.value = '';
      draw();
      if (g === word) { done = true; r.pick(r.queue[0].key); return true; }
      if (guesses.length >= rows) { done = true; flash('No rows left — it was ' + word.toUpperCase() + '.'); r.expire(); return false; }
      return false;
    }
    entry.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); guess(entry.value); }
    });
    /* a right word needs no extra row: the row the word was typed into is already green, and adding a
       sixth row is what used to make the whole board jump when the answer landed */
    function mark(item, hit) {
      done = true;
      if (hit) return;
      lives = Math.max(0, lives - 1);
      r.hud();
      flash('It was ' + (word || '').toUpperCase() + '.');
    }
    /* a restart opens on a full set of lives again */
    function reset() {
      lives = Math.max(1, num(r.root, 'data-lives', 2));
      guesses = []; word = ''; done = false;
      msg.classList.remove('show'); msg.textContent = '';
    }
    return {
      show: show, mark: mark, clear: clear, guess: guess, entry: entry, reset: reset,
      lives: function () { return lives; }, ownsPrompt: true
    };
  };

  /* ---------------- crosswordBoard: a real crossword, generated from the lesson's own words ----------------
     Every item carries `data-answer` (the word) and `.qstem` (its clue). The board LAYS OUT the whole
     set at once: the first word across, every later word placed so it crosses an existing letter, and
     anything that cannot cross dropped into its own row below. A shared letter is shared — typing it
     once fills both words, which is the point of a crossword and why this is a board game. Each solved
     word answers its own item, so the evidence is still the radio. */
  PLUGINS.crosswordBoard = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-xboard'), grid = el('div', 'g4-xgrid'), clue = el('div', 'g4-xclue');
    box.appendChild(grid); box.appendChild(clue);
    stage.appendChild(box);
    var words = [], map = {}, inputs = {};

    function letters(s) { return norm(s).replace(/[^a-z]/g, ''); }

    /* place the words so they cross: try every shared letter against every placed word */
    function layout() {
      map = {};
      var placed = [];
      function at(rr, cc) { return map[rr + ',' + cc]; }
      function fits(w, r0, c0, dir) {
        var cross = 0;
        for (var i = 0; i < w.length; i++) {
          var rr = r0 + (dir ? i : 0), cc = c0 + (dir ? 0 : i), ex = at(rr, cc);
          if (ex) { if (ex !== w[i]) return -1; cross++; }
          else if (dir ? (at(rr, cc - 1) || at(rr, cc + 1)) : (at(rr - 1, cc) || at(rr + 1, cc))) return -1;
        }
        var rA = r0 - (dir ? 1 : 0), cA = c0 - (dir ? 0 : 1);
        var rB = r0 + (dir ? w.length : 0), cB = c0 + (dir ? 0 : w.length);
        if (at(rA, cA) || at(rB, cB)) return -1;
        return cross;
      }
      function put(word, r0, c0, dir) {
        for (var i = 0; i < word.w.length; i++) {
          map[(r0 + (dir ? i : 0)) + ',' + (c0 + (dir ? 0 : i))] = word.w[i];
        }
        word.r = r0; word.c = c0; word.dir = dir;
        placed.push(word);
      }
      put(words[0], 0, 0, 0);
      for (var i = 1; i < words.length; i++) {
        var w = words[i].w, best = null;
        placed.forEach(function (p) {
          for (var j = 0; j < p.w.length; j++) {
            for (var k = 0; k < w.length; k++) {
              if (w[k] !== p.w[j]) continue;
              var dir = p.dir ? 0 : 1, r0, c0;
              if (dir) { r0 = p.r - k; c0 = p.c + j; } else { r0 = p.r + j; c0 = p.c - k; }
              var cross = fits(w, r0, c0, dir);
              if (cross > 0 && (!best || cross > best.cross)) best = { r: r0, c: c0, dir: dir, cross: cross };
            }
          }
        });
        if (best) put(words[i], best.r, best.c, best.dir);
        else {
          /* could not cross: give it its own row under everything already placed */
          var last = placed.reduce(function (m, p) { return Math.max(m, p.r + (p.dir ? p.w.length : 1)); }, 0);
          put(words[i], last, 0, 0);
        }
      }
      /* normalise to 0,0 and number the words in reading order */
      var minR = 0, minC = 0;
      Object.keys(map).forEach(function (k) {
        var p = k.split(',');
        minR = Math.min(minR, +p[0]); minC = Math.min(minC, +p[1]);
      });
      var fresh = {};
      Object.keys(map).forEach(function (k) {
        var p = k.split(',');
        fresh[(+p[0] - minR) + ',' + (+p[1] - minC)] = map[k];
      });
      map = fresh;
      words.forEach(function (w) { w.r -= minR; w.c -= minC; });
      words.slice().sort(function (a, b) { return a.r - b.r || a.c - b.c; })
        .forEach(function (w, i) { w.num = i + 1; });
    }
    function cellsOf(w) {
      var out = [];
      for (var i = 0; i < w.w.length; i++) {
        var key = (w.r + (w.dir ? i : 0)) + ',' + (w.c + (w.dir ? 0 : i));
        if (inputs[key]) out.push(inputs[key]);
      }
      return out;
    }
    function render() {
      grid.innerHTML = ''; inputs = {};
      var maxR = 0, maxC = 0;
      Object.keys(map).forEach(function (k) {
        var p = k.split(',');
        maxR = Math.max(maxR, +p[0]); maxC = Math.max(maxC, +p[1]);
      });
      var cols = maxC + 1, rowCount = maxR + 1;
      /* the board fills the stage: 10px of margin all round, the clue keeping its own column at the
         side, and the cell size driven by whichever of the two (height, width) runs out first */
      var stageH = stage.clientHeight || 280, stageW = stage.clientWidth || 560;
      var clueW = Math.max(110, Math.round(stageW * 0.32));
      var size = Math.floor(Math.min((stageW - clueW - 24) / cols, (stageH - 20) / rowCount));
      size = Math.max(18, Math.min(52, size));
      grid.style.gridTemplateColumns = 'repeat(' + cols + ',' + size + 'px)';
      grid.style.gridAutoRows = size + 'px';
      for (var rr = 0; rr <= maxR; rr++) {
        for (var cc = 0; cc <= maxC; cc++) {
          var key = rr + ',' + cc, letter = map[key];
          if (!letter) { grid.appendChild(el('div', 'g4-xblock')); continue; }
          var cell = el('div', 'g4-xcell' + (size < 24 ? ' small' : ''));
          var inp = document.createElement('input');
          inp.className = 'g4-gap';
          inp.setAttribute('maxlength', '1');
          inp.setAttribute('autocomplete', 'off');
          inp.setAttribute('aria-label', 'Row ' + (rr + 1) + ' column ' + (cc + 1));
          inp.setAttribute('data-key', key);
          inp.addEventListener('input', function () { type(this); });
          inp.addEventListener('focus', function () { sayClue(this); });
          inp.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !this.value) back(this); });
          cell.appendChild(inp);
          grid.appendChild(cell);
          inputs[key] = inp;
        }
      }
      words.forEach(function (w) {
        var inp = inputs[w.r + ',' + w.c];
        if (!inp) return;
        inp.parentElement.appendChild(el('span', 'g4-xnum', String(w.num)));
      });
    }

    function wordAt(inp) {
      var key = inp.getAttribute('data-key');
      return words.filter(function (w) {
        return cellsOf(w).some(function (c) { return c.getAttribute('data-key') === key; });
      });
    }
    function sayClue(inp) {
      var ws = wordAt(inp);
      var w = ws.filter(function (x) { return !x.solved; })[0] || ws[0];
      if (!w) return;
      /* the clue lives in its own panel beside the grid — the HUD prompt is left alone, because the
         same sentence in two places on one stage is just the same sentence twice */
      clue.textContent = w.num + (w.dir ? ' down' : ' across') + ' — ' + w.clue;
      clue.classList.add('on');
    }
    function nextIn(inp) {
      var ws = wordAt(inp).filter(function (x) { return !x.solved; })[0];
      if (!ws) return;
      var list = cellsOf(ws), i = list.indexOf(inp);
      for (var j = i + 1; j < list.length; j++) {
        if (!list[j].value && !list[j].readOnly) { try { list[j].focus({ preventScroll: true }); } catch (e) { list[j].focus(); } return; }
      }
    }
    function back(inp) {
      var ws = wordAt(inp)[0];
      if (!ws) return;
      var list = cellsOf(ws), i = list.indexOf(inp);
      for (var j = i - 1; j >= 0; j--) {
        if (!list[j].readOnly) { try { list[j].focus({ preventScroll: true }); } catch (e) { list[j].focus(); } return; }
      }
    }
    function type(inp) {
      var v = (inp.value || '').replace(/[^a-zA-Z]/g, '').slice(-1).toUpperCase();
      inp.value = v;
      if (v) nextIn(inp);
      check();
    }

    /* a word is done when every cell holds the right letter — so a shared letter finishes BOTH words.
       A wrong full word shakes and clears, and its item stays blank: the blank is the evidence. */
    function check() {
      if (r.phase !== 'play') return;
      words.forEach(function (w) {
        if (w.solved) return;
        var list = cellsOf(w);
        if (list.length !== w.w.length) return;
        if (list.some(function (c) { return !c.value; })) return;
        var typed = list.map(function (c) { return c.value.toLowerCase(); }).join('');
        if (typed === w.w) {
          w.solved = true;
          list.forEach(function (c) { c.classList.add('ok'); c.readOnly = true; });
          r.scoreBoard(w.it, w.it.key);
        } else {
          list.forEach(function (c) { if (!c.readOnly) { c.classList.add('no'); c.value = ''; } });
          SFX.miss(r.sound);
          r.later(function () { list.forEach(function (c) { c.classList.remove('no'); }); }, 520);
        }
      });
    }

    function begin(queue) {
      words = [];
      queue.forEach(function (it) {
        var w = letters(it.item.getAttribute('data-answer'));
        if (w.length >= 2) words.push({ w: w, it: it, clue: it.prompt || '', solved: false, r: 0, c: 0, dir: 0, num: 0 });
      });
      /* the whole run must be spellable, or this board cannot account for every item */
      if (words.length < 2 || words.length !== queue.length) return false;
      layout(); render();
      /* the clue panel is never blank: it opens on the first word that is still unsolved */
      if (words.length) {
        var w0 = words.filter(function (x) { return !x.solved; })[0] || words[0];
        clue.textContent = w0.num + (w0.dir ? ' down' : ' across') + ' — ' + w0.clue;
        clue.classList.add('on');
      }
      var first = Object.keys(inputs).map(function (k) { return inputs[k]; })
        .filter(function (i) { return !i.readOnly; })[0];
      if (first && first.focus) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
      return true;
    }
    return { begin: begin, show: function () { }, mark: function () { }, clear: function () { }, check: check };
  };

  /* ---------------- echoPads: build the sentence, word by word ----------------
     One run is ONE sentence. `data-first` on the block is the opening the student is given (e.g.
     "Yesterday I"); every `.qitem` after it is the next word of that sentence — its options are the
     word that fits after the words already placed, plus three that are close but do not fit the grammar
     of what is already on the board. So the sentence on the stage is the question, and the pads are
     the only words that could follow it.
     A right pad puts the word in the sentence, answers that item, and moves on. A wrong pad costs one
     point and does NOT move on: the student tries again until that word is right, because the sentence
     cannot continue with a word that does not fit.
     The score is a COUNTDOWN (the HUD pair, `left/start`): `data-lives` points, one gone per wrong
     word; at zero the run is over. That is the whole fail state — no hidden penalty, no timer.
     Authoring: `data-first` the given opening, `data-lives` the countdown (10), one `.qitem` per word
     of the sentence, `data-a` the word that fits, three near misses in the options. `data-time` does
     not apply: a board you fill at your own pace. */
  PLUGINS.echoPads = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-echo');
    var sayLine = el('div', 'g4-echo-say');
    var hint = el('div', 'g4-echo-hint');
    var pads = el('div', 'g4-pads');
    var again = el('button', 'g4-again', '🔊 Say the sentence');
    again.type = 'button';
    box.appendChild(sayLine); box.appendChild(hint); box.appendChild(pads); box.appendChild(again);
    stage.appendChild(box);

    var queue = [], at = 0, parts = [], given = '', points = 10, top = 10, busy = false;

    function sentence() { return (given + ' ' + parts.join(' ')).replace(/\s+/g, ' ').trim(); }
    function paint() {
      sayLine.innerHTML = '';
      if (given) sayLine.appendChild(el('span', 'g4-echo-w given', given));
      parts.forEach(function (w) { sayLine.appendChild(el('span', 'g4-echo-w', w)); });
      if (!given && !parts.length) sayLine.appendChild(el('span', 'g4-echo-blank', '…'));
      sayLine.appendChild(el('span', 'g4-echo-cursor', '▌'));
    }
    function clear() {
      pads.innerHTML = ''; busy = false;
      [].slice.call(box.querySelectorAll('.g4-pad')).forEach(function (p) {
        p.classList.remove('ok', 'no');
      });
    }
    function reset() {
      queue = []; at = 0; parts = []; busy = false;
      given = (r.root.getAttribute('data-first') || '').trim();
      top = Math.max(1, num(r.root, 'data-lives', 10));
      points = top;
      hint.textContent = '';
      pads.innerHTML = '';
      paint();
    }
    /* one item at a time, in the sentence's own order: the pads are the words that could follow */
    function showItem() {
      var it = queue[at];
      paint();
      pads.innerHTML = '';
      if (!it) return;
      hint.textContent = it.prompt && it.prompt !== '·' ? it.prompt : 'Next word:';
      it.opts.forEach(function (o) {
        var p = el('button', 'g4-pad', o.text);
        p.type = 'button';
        p.setAttribute('data-v', o.value);
        p.addEventListener('click', function () { pick(o, p); });
        pads.appendChild(p);
      });
    }
    function pick(o, pad) {
      if (r.phase !== 'play' || busy) return;
      var it = queue[at];
      if (!it) return;
      if (o.value !== it.key) {
        /* one point gone, and the same word is still owed: the sentence cannot move on past it */
        points = Math.max(0, points - 1);
        r.hud();
        pad.classList.remove('no');
        void pad.offsetWidth;
        pad.classList.add('no');
        hint.textContent = 'Not that one — ' + points + ' left. Try the word that fits "' + sentence() + '".';
        if (!points) {
          busy = true;
          r.later(function () { if (r.phase === 'play') r.finish(); }, 700);
        }
        return;
      }
      busy = true;
      pad.classList.add('ok');
      parts.push(o.text);
      paint();
      hint.textContent = '';
      r.scoreBoard(it, o.value);            /* the radio is written, the score counted by the runner */
      at++;
      r.later(function () {
        busy = false;
        if (r.phase === 'play' && at < queue.length) showItem();
      }, 620);
    }
    again.addEventListener('click', function () {
      if (r.phase !== 'play') return;
      var t = sentence();
      if (!t) return;
      say(t, 'en-US');                      /* the sentence, as it stands, out loud */
      SFX.blip && SFX.blip();
    });
    /* board mode: the run IS the sentence, so the game claims the queue and fills it word by word */
    function begin(q) {
      queue = q.slice();
      if (!queue.length) return false;
      at = 0; parts = [];
      paint();
      showItem();
      return true;
    }
    function mark(item, hit, value) {
      [].slice.call(pads.querySelectorAll('.g4-pad')).forEach(function (p) {
        var v = p.getAttribute('data-v');
        if (v === value) p.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) p.classList.add('reveal');
      });
    }
    return {
      begin: begin, show: function () { }, mark: mark, clear: clear, reset: reset,
      lives: function () { return points; }, ownsPrompt: true
    };
  };

  /* ---------------- bingoCard: the caller says it once, then the curtain opens ----------------
     One item per call. The card is covered by a theatre curtain. Two countdowns run the item, and
     neither sits on the curtain: they stand BESIDE the card, in their own cards, so the number is
     always readable against the stage rather than against red velvet.
       left   3 · 2 · 1 — the caller says the word ONCE at the start (no replay and no button: paying
              attention to the one chance IS the activity), and the curtain rises when it reaches zero
       right  5 · 4 · 3 · 2 · 1 — runs only while the card is open. It reaches zero and the curtain
              FALLS, which is the item's deadline: the word is marked wrong and the point it was worth
              is gone.
     A stamp answers the item there and then and stops the right-hand countdown. What was said is
     never shown and the right tile is never revealed: a miss ends the item the way it was answered.
     Nine tiles: the item's options plus decoys taken from the rest of the block, so the card is never
     trivially small. The instruction is the block's own `.game-how` and nothing else — nothing inside
     the stage prints it a second time.
     Authoring: `.qitem` per item, `data-a` the right option (or a `.listen` clip); the caller speaks
     the answer's own words. Leave `data-time` at 0 — the countdown is this game's clock. */
  PLUGINS.bingoCard = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-bingo'), card = el('div', 'g4-bcard');
    var curtain = el('div', 'g4-curtain');
    var lead = el('div', 'g4-count g4-count-lead'), rush = el('div', 'g4-count g4-count-rush');
    var wrap = el('div', 'g4-card-wrap');
    wrap.appendChild(card); wrap.appendChild(curtain);
    box.appendChild(lead); box.appendChild(wrap); box.appendChild(rush);
    stage.appendChild(box);
    var tiles = [], phrase = '', open = false, said = false, gen = 0;
    function pool() {
      var all = [];
      r.items.forEach(function (it) { it.opts.forEach(function (o) { if (all.indexOf(o.text) < 0) all.push(o.text); }); });
      return all;
    }
    function heard(item) {
      /* what the caller says: the clip when there is one, else the CORRECT OPTION's own words —
         never the stem, because a stem is a question and a caller calls answers */
      var right = item.opts.filter(function (o) { return o.value === item.key; })[0];
      return item.say || (right ? right.text : '') || item.prompt || '';
    }
    function clear() {
      gen++;                                        /* every timer of the old item is now stale */
      card.innerHTML = ''; tiles = []; phrase = '';
      open = false; said = false;
      box.classList.remove('open');
      lead.textContent = ''; rush.textContent = '';
      lead.classList.remove('pop'); rush.classList.remove('pop');
    }
    /* one second per number, in the count's own card; the last beat clears it instead of popping 0 */
    function tick(node, n, done) {
      var mine = gen;
      node.textContent = String(n);
      node.classList.remove('pop');
      void node.offsetWidth;                        /* re-trigger the pop-in / fade-out */
      node.classList.add('pop');
      r.later(function () {
        if (mine !== gen || r.phase !== 'play') return;
        if (n > 1) { tick(node, n - 1, done); return; }
        node.textContent = '';
        if (done) done();
      }, 1000);
    }
    function countdown() {
      tick(lead, 3, function () {
        box.classList.add('open');
        open = true;
        /* the card is up: 5 seconds to stamp it, then the curtain falls on the item */
        tick(rush, 5, function () {
          if (r.phase !== 'play' || !open) return;
          open = false;
          box.classList.remove('open');              /* the curtain falls on the unanswered word */
          r.expire();                               /* marked wrong, and the point is gone */
        });
      });
    }
    function show(item) {
      clear();
      phrase = heard(item);
      var mine = item.opts.map(function (o) { return { text: o.text, value: o.value }; });
      var extra = pool().filter(function (t) {
        return !mine.some(function (m) { return m.text === t; });
      }).slice(0, Math.max(0, 9 - mine.length)).map(function (t) { return { text: t, value: '~' + t }; });
      var cells = shuffle(mine.concat(extra).slice(0, 9));
      while (cells.length < 9) cells.push({ text: '·', value: '~' });
      cells.forEach(function (c) {
        var t = el('button', 'g4-btile', c.text);
        t.type = 'button';
        t.setAttribute('data-v', c.value);
        t.addEventListener('click', function () {
          if (r.phase !== 'play' || !open || t.classList.contains('stamped')) return;
          t.classList.add('stamped');
          open = false;                             /* the stamp stops the clock */
          rush.textContent = '';
          r.pick(c.value);
        });
        card.appendChild(t);
        tiles.push(t);
      });
      if (phrase && !said) { said = true; say(phrase); }   /* once per item, and only once */
      countdown();
    }
    function mark(item, hit, value) {
      tiles.forEach(function (t) {
        if (t.getAttribute('data-v') !== value) return;
        t.classList.add(hit ? 'ok' : 'no');
      });
    }
    return { show: show, mark: mark, clear: clear };
  };


  /* ---------------- ladderRun: climb the ladder, one rung per right answer ----------------
     The ladder is drawn as tall as the run has items, a safe rung every five, a climber who steps up
     on a right answer and slides back to the last safe rung on a wrong one, a chest at the top, and a
     rising motif so height can be HEARD as well as seen. A wrong answer keeps what was safely earned —
     that is what makes a ladder a ladder and not a list. */
  PLUGINS.ladderRun = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-ladder'), track = el('div', 'g4-ltrack');
    var rail = el('div', 'g4-rail'), climber = el('div', 'g4-lclimber');
    var prize = el('div', 'g4-lprize'), opts = el('div', 'g4-raceopts');
    prize.innerHTML = ART.chest;
    climber.innerHTML = ART.climber;
    track.appendChild(rail); track.appendChild(prize); track.appendChild(climber);
    box.appendChild(track); box.appendChild(opts);
    stage.appendChild(box);
    var built = 0, climb = 0, safe = 0;
    function safeOf(n) { return Math.floor(n / 5) * 5; }
    function build() {
      if (built === r.total) return;
      built = r.total;
      rail.innerHTML = ART.ladder(Math.max(3, r.total), 5);
      step(0, true);
    }
    /* one rung up is one small move; the safe rung is the floor a fall lands on */
    function step(n, quiet) {
      climb = Math.max(0, Math.min(r.total, n));
      var pct = (climb / (Math.max(3, r.total) + 1)) * 100;
      climber.style.bottom = 'calc(' + pct.toFixed(1) + '% + 6px)';
      climber.classList.toggle('at-top', climb >= r.total);
      prize.classList.toggle('won', climb >= r.total);
      if (!quiet && climb % 5 === 0) SFX.blip(r.sound, 660 + climb * 22, 140);
    }
    function clear() { opts.innerHTML = ''; }
    function show(item) {
      build();
      opts.innerHTML = '';
      item.opts.forEach(function (o) {
        var b = el('button', 'g4-raceopt', o.text);
        b.type = 'button';
        b.setAttribute('data-v', o.value);
        b.addEventListener('click', function () { if (r.phase === 'play') r.pick(o.value); });
        opts.appendChild(b);
      });
    }
    function mark(item, hit, value) {
      [].forEach.call(opts.querySelectorAll('.g4-raceopt'), function (b) {
        var v = b.getAttribute('data-v');
        if (v === value) b.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) b.classList.add('reveal');
      });
      if (hit) {
        step(climb + 1);
        safe = safeOf(climb);
        SFX.blip(r.sound, 380 + climb * 26, 110);
      } else {
        climber.classList.add('slip');
        r.later(function () { climber.classList.remove('slip'); }, 500);
        step(safe, true);
        SFX.miss(r.sound);
      }
    }
    return { show: show, mark: mark, clear: clear };
  };



  /* ---------------- bossRaid: pick a fighter, and every answer is that fighter's attack ----------------
     The student chooses a fighter on the intro card — sword, wizard, archer — and the choice is not
     decoration: it decides HOW the right answer lands. The sword fighter steps in and cuts, the wizard
     throws a fireball that bursts on the boss, the archer's arrow flies straight and fast. So the
     correct answer is visibly thrown by the character the student made, which is the whole appeal of a
     fight game.
     A wrong answer is the boss's turn, and the boss does not repeat itself: it takes turns between a
     BITE (it lunges at the fighter) and ACID (it spits a drop that lands on him). Three hits taken and
     the fighter goes down, so a long drill has an ending that belongs to the answers, not to a timer.
     The lives are the RUN's and the HUD already counts them (this presentation reports `lives`), so the
     arena draws no second copy of the count — the HP bar is the boss's health, which the HUD cannot say.
     Authoring: `.qitem` per question, options are the answers, `data-time` the deadline. Nothing about
     the fighter is authored: the game offers its own three. */
  PLUGINS.bossRaid = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-boss'), arena = el('div', 'g4-arena');
    var art = el('div', 'g4-bossart'), bar = el('div', 'g4-hp'), hpFill = el('div', 'g4-hp-fill');
    var hero = el('div', 'g4-hero'), shots = el('div', 'g4-shots'), opts = el('div', 'g4-raceopts');
    art.innerHTML = ART.boss;
    bar.appendChild(hpFill);
    arena.appendChild(art); arena.appendChild(bar);
    arena.appendChild(shots); arena.appendChild(hero);
    box.appendChild(arena); box.appendChild(opts);
    stage.appendChild(box);

    /* three fighters, three ways of landing the same hit: the art, the projectile (if it throws one),
       how long that projectile takes, and the note the weapon makes */
    var FIGHTERS = {
      sword: { at: 'cut', art: ART.heroSword, label: 'sword', hz: 520 },
      wizard: { at: 'shot', art: ART.heroWizard, label: 'fireball', shot: ART.fireball, cls: 'fire', ms: 440, hz: 300 },
      archer: { at: 'shot', art: ART.heroArcher, label: 'bow', shot: ART.arrow, cls: 'arrow', ms: 260, hz: 760 }
    };
    var fighter = 'sword', lives = 3, turn = 0, pickBtns = {};

    function choose(k) {
      if (!FIGHTERS[k]) return;
      fighter = k;
      hero.innerHTML = FIGHTERS[k].art;
      Object.keys(pickBtns).forEach(function (n) {
        pickBtns[n].classList[n === k ? 'add' : 'remove']('on');
        pickBtns[n].setAttribute('aria-pressed', n === k ? 'true' : 'false');
      });
    }
    /* the choice lives on the intro card, above Play: three drawings, the picked one outlined */
    var card = r.intro && r.intro.querySelector('.g4-intro-card');
    if (card && r.btn) {
      var wrap = el('div', 'g4-pick-wrap');
      wrap.appendChild(el('p', 'g4-pick-lead', 'Pick your fighter'));
      var pick = el('div', 'g4-pick');
      Object.keys(FIGHTERS).forEach(function (k) {
        var b = el('button', 'g4-pick-btn');
        b.type = 'button';
        b.setAttribute('data-fighter', k);
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-label', 'Fight as the ' + FIGHTERS[k].label);
        b.innerHTML = FIGHTERS[k].art + '<span class="g4-pick-t">' + FIGHTERS[k].label + '</span>';
        b.addEventListener('click', function () { choose(k); SFX.blip(r.sound, 520, 70); });
        pick.appendChild(b);
        pickBtns[k] = b;
      });
      wrap.appendChild(pick);
      card.insertBefore(wrap, r.btn);
    }
    choose(fighter);

    /* where a thing is, in the arena's own coordinates: the projectile layer shares them */
    function centre(node) {
      var bb = arena.getBoundingClientRect(), nb = node.getBoundingClientRect();
      return { x: nb.left - bb.left + nb.width / 2, y: nb.top - bb.top + nb.height / 2 };
    }
    function hurtBoss() {
      art.classList.add('hurt');
      r.later(function () { art.classList.remove('hurt'); }, 360);
    }
    function hurtHero() {
      hero.classList.add('recoil', 'hurt');
      SFX.hiss(r.sound);
      r.later(function () { hero.classList.remove('recoil', 'hurt'); }, 440);
    }

    function drawHud() {
      var hp = r.total ? 1 - r.score / r.total : 0;
      hpFill.style.width = Math.max(0, Math.round(hp * 100)) + '%';
    }
    function clear() {
      opts.innerHTML = ''; shots.innerHTML = '';
      hero.classList.remove('recoil', 'hurt');
      art.classList.remove('bite', 'hurt');
      drawHud();
    }
    /* a restart begins with a whole boss: lives are run state, so the runner resets them on start */
    function reset() {
      lives = 3; turn = 0;
      hero.classList.remove('down', 'recoil', 'hurt');
      art.classList.remove('bite', 'hurt');
      shots.innerHTML = '';
      drawHud();
    }
    function show(item) {
      opts.innerHTML = '';
      drawHud();
      item.opts.forEach(function (o) {
        var b = el('button', 'g4-raceopt', o.text);
        b.type = 'button';
        b.setAttribute('data-v', o.value);
        b.addEventListener('click', function () { if (r.phase === 'play') r.pick(o.value); });
        opts.appendChild(b);
      });
    }
    /* a right answer: the fighter's own attack, drawn across the arena it crosses */
    function attack() {
      var f = FIGHTERS[fighter], from = centre(hero), to = centre(art);
      if (f.at === 'cut') {
        hero.classList.add('lunge');
        r.later(function () {
          var s = el('div', 'g4-slash');
          s.style.left = to.x + 'px'; s.style.top = to.y + 'px';
          arena.appendChild(s);
          SFX.tone(f.hz, 120, 'square', 0.05);
          hurtBoss();
          r.later(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 440);
        }, r.reduced ? 20 : 150);
        r.later(function () { hero.classList.remove('lunge'); }, r.reduced ? 60 : 380);
        return;
      }
      var p = el('div', 'g4-proj ' + f.cls);
      p.innerHTML = f.shot;
      p.style.left = from.x + 'px';
      p.style.top = from.y + 'px';
      arena.appendChild(p);
      void p.offsetWidth;                       /* let the browser see the start before the travel */
      p.style.transform = 'translate(' + Math.round(to.x - from.x) + 'px,'
        + Math.round(to.y - from.y) + 'px)';
      SFX.tone(f.hz, 90, 'triangle', 0.05);
      r.later(function () {
        p.classList.add('burst');
        hurtBoss();
        r.later(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 240);
      }, r.reduced ? 20 : f.ms);
    }
    /* a wrong answer: the boss answers, and it does not answer the same way twice */
    function bossTurn() {
      turn++;
      if (turn % 2) {
        /* bite: it comes at him */
        art.classList.add('bite');
        r.later(hurtHero, r.reduced ? 20 : 200);
        r.later(function () { art.classList.remove('bite'); }, r.reduced ? 60 : 540);
        return;
      }
      /* acid: it spits, and the drop travels */
      var from = centre(art), to = centre(hero);
      var p = el('div', 'g4-proj spit');
      p.innerHTML = ART.acid;
      p.style.left = from.x + 'px'; p.style.top = from.y + 'px';
      arena.appendChild(p);
      void p.offsetWidth;
      p.style.transform = 'translate(' + Math.round(to.x - from.x) + 'px,'
        + Math.round(to.y - from.y) + 'px)';
      r.later(function () {
        p.classList.add('burst');
        hurtHero();
        r.later(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 240);
      }, r.reduced ? 20 : 460);
    }
    function mark(item, hit, value) {
      [].forEach.call(opts.querySelectorAll('.g4-raceopt'), function (b) {
        var v = b.getAttribute('data-v');
        if (v === value) b.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) b.classList.add('reveal');
      });
      if (hit) {
        attack();                               /* the fighter the student picked lands it */
      } else {
        lives = Math.max(0, lives - 1);
        bossTurn();
        if (!lives) {
          hero.classList.add('down');
          r.later(function () { if (r.running) r.finish(); }, 900);
        }
      }
      drawHud();
    }
    return { show: show, mark: mark, clear: clear, reset: reset, lives: function () { return lives; } };
  };

  function boot() {
    /* the gradients and filters every scene shares: one hidden <svg> per page, so any number of
       game blocks reuse the same ids and none can collide */
    if (!document.querySelector('.g4-defs')) {
      var host = document.createElement('div');
      host.innerHTML = DEFS;
      if (host.firstChild) document.body.appendChild(host.firstChild);
    }
    var names = Object.keys(PLUGINS);
    var roots = [].slice.call(document.querySelectorAll('.game')).filter(function (root) {
      return names.indexOf(root.getAttribute('data-game')) > -1;
    });
    window.__G4 = roots.map(function (root) {
      if (root.__g4) return root.__g4;
      var inst = new Runner(root);
      inst.hooks = inst._test();
      root.__g4 = inst;
      return inst;
    });
    return window.__G4.length;
  }

  return { boot: boot, games: Object.keys(PLUGINS), version: 2 };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { window.GAMES4.boot(); });
} else {
  window.GAMES4.boot();
}
