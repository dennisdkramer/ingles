/* ---- engine4.js — Tier-1 games: ONE runner, games as presentations ----------------------------
   Contract (FUNCTION.md owns behaviour, FORMAT.md the block):
   - The PAGE carries the real answers: `.game > .game-list > .qitem` (a `.qstem` prompt, optional
     `.listen` chip, `input[type=radio]` options). That markup persists, prints, and is what a
     student sees if this file never runs.
   - The engine only PRESENTS those items and MARKS the radios: a correct pick checks the option it
     stands for and dispatches `change`, so engine1/engine2 save it like any answer. A wrong pick
     leaves the radio blank — the blank is the teacher's evidence.
   - Versatility rule: the runner owns the queue, scoring, HUD, deadline and sound; a game
     supplies only `show / mark / clear`. Content authoring is identical for every game, so
     `data-game` is a presentation choice and never a content choice.
   Levers (all optional, on the `.game` element):
     data-game      which presentation (one per PLUGINS key: catchBasket, whackMole, stackDrop,
                   flapGate, skeetRange, mineGrid, wordleBoard, crosswordBoard,
                   echoPads, bingoCard, ladderRun, bossRaid, trainOrder)
     data-time      ms per item, 0 = no deadline   (0)   ← this is difficulty
     data-limit     seconds for the whole run, 0 = off (0)
     data-retry     0 | 1   the run may be repeated at all (1). A game that TRAINS leaves the default on;
                            the block that IS the page's quiz writes 0, because what the student answered
                            once is the evidence and a replay would only let them edit it. So a generated
                            quiz-section `.game` carries data-retry="0" and a training-section one carries
                            nothing.
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
   ONE PASS, NO RECYCLING: an item is answered once per run and a miss is never put back in the queue,
   on any game. A run therefore uses each of its items exactly once and a point lost is lost — no second
   chance at the same question, which would be the run marking its own work down as a formality.
   RECYCLING BELONGS TO A GAME THAT COSTS LIVES: a presentation that reports `view.lives()` may show the
   student the same question or answer again, because the retry is paid out of a count the HUD displays
   (echoPads re-asks the word it was told is wrong, and charges a life). A presentation with no lives
   never does — replayable or not: a block that charges nothing for a second try has no reason to offer
   one, and the blank radio is worth more than an answer the student reached on the third attempt.
   ONE fail condition, and the runner enforces it: `view.lives()` reaching 0 ends the run, for every
   game, without the presentation having to say so. A shape that spends a life in its own `mark()`
   simply reports the smaller number and the run ends on the next beat; the misses are not replayed
   afterwards, because the run is over for real. A presentation may additionally call `r.finish()`
   itself (flapGate does, from its flight loop) — `finish` is idempotent, so the second call is a
   no-op rather than a second score line.
   A presentation may also claim these things about the stage it draws, and one about its end:
     view.ownsPrompt      it draws the item's own stem itself (a chip, a clue panel, a tower block), so
                          the runner does not draw the same words a second time on the HUD line
     PLUGINS.x.timeScale  a static number; the block's `data-time` is multiplied by it, because that
                          game needs a slower clock than the one the author wrote (skeetRange)
     PLUGINS.x.noTimer    true: the game IS its own clock — flapGate's wall coming at the bird — so the
                          block runs with no deadline at all: no "each" chip on the intro card, no time
                          bar, nothing to expire. `data-time` on such a block is ignored rather than fought
     PLUGINS.x.noShuffle  true: the game's OWN order is the content — echoPads' sentence is read word by
                          word — so the items are never shuffled, whatever `data-shuffle` says
     view.finale(done)    the run ends with a picture of its own ending, and only the presentation knows
                          when it has finished: `finish()` keeps the stage, the run's score card and the
                          hidden intro until `done()` is called, so the train is still leaving the yard
                          when the last answer lands (trainOrder). It plays its own end cue — the runner
                          plays no win sting — and a throw settles the stage like any other ending

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
    /* Two of the sounds a game makes cannot be synthesized honestly: a GUNSHOT and a wrong-answer
       BUZZER. Those are files, published free by Mixkit (free for personal and commercial use, no
       attribution required, but not to be re-hosted on their own), so the engine points at the
       publisher's own copy instead of shipping a copy in this repo. A page that wants its own files —
       a school with no internet, or a school that wants a different gun — says so BEFORE this script
       runs:
         window.SFX_FILES = { gunshot: 'sfx/gunshot.mp3', buzzer: 'sfx/buzzer.mp3' };
       A file that will not load is silence, never an error: the game still runs, and it still plays the
       synthesized cues around it. */
    var CLIPS = {
      /* "Game gun shot" — 1s https://mixkit.co/free-sound-effects/gunshot/ */
      gunshot: 'https://assets.mixkit.co/active_storage/sfx/1662/1662-preview.mp3',
      /* "Wrong answer bass buzzer" — 2s https://mixkit.co/free-sound-effects/buzzer/ */
      buzzer: 'https://assets.mixkit.co/active_storage/sfx/948/948-preview.mp3'
    };
    if (window.SFX_FILES) { for (var k in window.SFX_FILES) { if (window.SFX_FILES[k]) CLIPS[k] = window.SFX_FILES[k]; } }
    var loaded = {};                    /* name -> the one Audio element, so a file is fetched once */
    /* play a recorded clip; `ms` cuts it short, `vol` is its own level (see the buzzer below) */
    function clip(name, ms, vol) {
      try {
        var src = CLIPS[name];
        if (!src) return false;
        var a = loaded[name];
        if (!a) { a = loaded[name] = new Audio(src); a.preload = 'auto'; }
        a.volume = vol || 0.55;
        try { a.currentTime = 0; } catch (e) { /* not loaded yet: it starts at the top anyway */ }
        var p = a.play();
        if (p && p.catch) p.catch(function () { /* autoplay refused, or no file: silence */ });
        if (ms) setTimeout(function () { try { a.pause(); } catch (e) { /* gone */ } }, ms);
        return true;
      } catch (e) { return false; }
    }
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
      /* trainOrder: a coupling closing — a wooden knock with a metal ring on top of it */
      clank: function (on) {
        if (!on) return;
        tone(520, 70, 'square', 0.035);
        setTimeout(function () { tone(1180, 60, 'sine', 0.028); }, 22);
      },
      /* trainOrder: the guard's whistle — two short, then one long, in the same breath */
      horn: function (on) {
        if (!on) return;
        tone(494, 150, 'sine', 0.05);
        setTimeout(function () { tone(440, 330, 'sine', 0.05); }, 170);
      },
      /* trainOrder: the wheels getting moving — five beats that quicken as they go */
      chuff: function (on) {
        if (!on) return;
        [0, 150, 280, 390, 480].forEach(function (d, i) {
          setTimeout(function () { tone(96 + i * 6, 90, 'sawtooth', 0.03); }, d);
        });
      },
      /* trainOrder: the departure whistle — a rise, a top, a fall, which is what makes it read as a
         train and not as a beep */
      sweep: function (on) {
        if (!on) return;
        tone(392, 130, 'sine', 0.045);
        setTimeout(function () { tone(523, 160, 'sine', 0.05); }, 120);
        setTimeout(function () { tone(392, 260, 'sine', 0.045); }, 290);
      },
      /* trainOrder: the wreck — a low boom with falling steel over it */
      crash: function (on) {
        if (!on) return;
        tone(70, 460, 'sawtooth', 0.06);
        setTimeout(function () { tone(122, 220, 'square', 0.03); }, 60);
        setTimeout(function () { tone(1500, 90, 'square', 0.02); }, 120);
        setTimeout(function () { tone(88, 300, 'sawtooth', 0.03); }, 260);
      },
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
      },
      /* the recorded two (see CLIPS): played only where they are what the moment actually is */
      clip: clip,
      /* the shot: the disc was hit and the gun went off. Both levels came down on the owner's note
         (qa/NOTES.md 31: the miss sound 50% quieter, the gunshot 30%): a fired shot is loud already,
         and the verdict underneath it does not need to shout to be heard. */
      shot: function (on) { if (on) clip('gunshot', 0, 0.42); },
      /* a wrong shot: the buzzer at HALF the level it played at, and never played on its own (the
         range fires the gun with it) */
      wrong: function (on) { if (on) clip('buzzer', 0, 0.125); },
      /* point a name at another file at runtime (the page can also do it before the script loads) */
      setSrc: function (name, url) {
        if (!name || !url) return false;
        CLIPS[name] = url; loaded[name] = null;
        return true;
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
    /* catchBasket: the girl in a dress who comes for the biggest flower at the end of the run. Drawn to
       the hero's proportions so the garden reads as the same illustrated world. */
    girl: '<svg class="g4-art" viewBox="0 0 60 92" aria-hidden="true" focusable="false">'
      + '<path d="M18 16q0-13 12-13t12 13v16q-5-6-12-6t-12 6z" fill="#6b3f1f"/>'
      + '<circle cx="30" cy="17" r="11" fill="#f4c79b" stroke="#8a5a2b" stroke-width="2.2"/>'
      + '<path d="M19 13q3-9 11-9t11 9z" fill="#4a2a12"/>'
      + '<circle cx="25.5" cy="18" r="1.8" fill="#2a1c10"/><circle cx="34.5" cy="18" r="1.8" fill="#2a1c10"/>'
      + '<path d="M26 23q4 3 8 0" stroke="#8a5a2b" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
      + '<path d="M30 27v6" stroke="#f4c79b" stroke-width="5" stroke-linecap="round"/>'
      + '<path d="M25 33h10l8 29H17z" fill="#e4557f" stroke="#a82c52" stroke-width="2.2" stroke-linejoin="round"/>'
      + '<path d="M20 45h20" stroke="#ffd05a" stroke-width="2.6"/>'
      + '<path d="M24 35l-6 13M36 35l6 13" stroke="#f4c79b" stroke-width="4.4" stroke-linecap="round"/>'
      + '<path d="M26 62v15M34 62v15" stroke="#f4c79b" stroke-width="4.6" stroke-linecap="round"/>'
      + '<path d="M23 79h7M30 79h7" stroke="#5b2d84" stroke-width="4.2" stroke-linecap="round"/>'
      + '</svg>',
    /* ladderRun: the banknote he throws off the top of the prompt card, and the dog that takes the ladder
       down when a point was missed */
    cash: '<svg class="g4-art" viewBox="0 0 44 24" aria-hidden="true" focusable="false">'
      + '<rect x="1" y="1" width="42" height="22" rx="3" fill="#7fbf4d" stroke="#3f6b22" stroke-width="2"/>'
      + '<rect x="5" y="5" width="34" height="14" rx="2" fill="#a8d97a" stroke="#4f8a2c" stroke-width="1.4"/>'
      + '<circle cx="22" cy="12" r="5" fill="#e9f7d8" stroke="#4f8a2c" stroke-width="1.4"/>'
      + '<path d="M22 9.4v5.2M20 10.6h4M20 13.4h4" stroke="#4f8a2c" stroke-width="1.2" stroke-linecap="round"/>'
      + '</svg>',
    dog: '<svg class="g4-art" viewBox="0 0 70 44" aria-hidden="true" focusable="false">'
      + '<path d="M16 20q-8-3-11-10" stroke="#8a6a44" stroke-width="4" fill="none" stroke-linecap="round"/>'
      + '<ellipse cx="34" cy="24" rx="18" ry="10" fill="#8a6a44" stroke="#4d3a22" stroke-width="2.2"/>'
      + '<path d="M24 32v9M34 32v9M44 32v9M52 32v9" stroke="#6b5335" stroke-width="4" stroke-linecap="round"/>'
      + '<circle cx="54" cy="17" r="8" fill="#8a6a44" stroke="#4d3a22" stroke-width="2.2"/>'
      + '<path d="M50 11q-4-7 2-8 4 3 3 8z" fill="#5f472c"/>'
      + '<ellipse cx="61" cy="19" rx="6" ry="4" fill="#a9855a" stroke="#4d3a22" stroke-width="1.8"/>'
      + '<circle cx="66" cy="18" r="1.6" fill="#2a1c10"/>'
      + '<circle cx="55" cy="15" r="1.5" fill="#2a1c10"/>'
      + '</svg>',
    /* trainOrder's distance: two ridges of hills behind the yard, the far one hazed and the near one
       darker, with snow on the two high peaks — a place the train is travelling THROUGH, not a flat
       backdrop (qa/NOTES.md 89) */
    mountains: '<svg viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
      + '<path d="M0 118V70l46-40 46 38 38-24 46 34 38-44 44 38 38-24 44 32 42-40 18 22v48z" fill="#a9bccd"/>'
      + '<path d="M132 44l14-14 14 14-6 10-8-4-8 4z" fill="#f2f7fb"/>'
      + '<path d="M214 34l18-18 18 18-8 12-10-5-10 5z" fill="#f2f7fb"/>'
      + '<path d="M0 118V96l54-34 50 30 46-22 60 30 58-34 58 32 74-24v44z" fill="#8d9fb0"/>'
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
      + '</svg>',
    /* trainOrder's LOCOMOTIVE, drawn facing LEFT (the train runs out to the left, so the engine leads).
       Redrawn AGAIN after seeing it on screen (qa/NOTES.md 94): the first redraw was still a dark blue
       smudge against blue-grey hills with wheels smaller than the flatbeds'. This one is a BRICK-RED
       engine with a black smokebox, brass fittings and driving wheels as big as the wagons' own — six
       fat shapes, thick dark outlines, and nothing inside them that has to be resolved at 90px wide. */
    engine: '<svg class="g4-art" viewBox="0 0 108 72" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">'
      /* the coupling rod, behind the wheels */
      + '<rect x="22" y="55" width="72" height="4" rx="2" fill="#b9c2cc" stroke="#17181c" stroke-width="1.6"/>'
      /* three big driving wheels, sitting exactly on the rail */
      + '<g stroke="#17181c" stroke-width="2.6">'
      + '<circle cx="22" cy="57" r="15" fill="#2f353c"/><circle cx="22" cy="57" r="5.4" fill="#e8eef4"/>'
      + '<circle cx="58" cy="57" r="15" fill="#2f353c"/><circle cx="58" cy="57" r="5.4" fill="#e8eef4"/>'
      + '<circle cx="94" cy="57" r="15" fill="#2f353c"/><circle cx="94" cy="57" r="5.4" fill="#e8eef4"/>'
      + '</g>'
      /* cowcatcher at the front, and the brass buffer beam above it */
      + '<path d="M1 72l9-26h9l-6 26z" fill="#4a5a6a" stroke="#17181c" stroke-width="2" stroke-linejoin="round"/>'
      + '<rect x="3" y="30" width="11" height="17" rx="1" fill="#e0b23a" stroke="#17181c" stroke-width="2"/>'
      /* the boiler: a fat red cylinder with a black smokebox door at its front */
      + '<rect x="13" y="16" width="58" height="30" rx="13" fill="#b23c33" stroke="#17181c" stroke-width="2.4"/>'
      + '<circle cx="24" cy="31" r="16" fill="#2b2b30" stroke="#17181c" stroke-width="2.4"/>'
      + '<circle cx="24" cy="31" r="7" fill="#d9d2c4" stroke="#17181c" stroke-width="1.6"/>'
      + '<rect x="48" y="16" width="4" height="30" fill="#e0b23a"/>'
      /* the funnel: a flared top on a short stack */
      + '<rect x="15" y="3" width="15" height="15" fill="#2b2b30" stroke="#17181c" stroke-width="2"/>'
      + '<path d="M10 3h25l-3-3H13z" fill="#2b2b30" stroke="#17181c" stroke-width="2" stroke-linejoin="round"/>'
      /* the brass dome, as wide as it is tall so it still reads at 20px */
      + '<path d="M54 16q6-16 19 0z" fill="#e0b23a" stroke="#17181c" stroke-width="2" stroke-linejoin="round"/>'
      /* the cab at the back: a tall maroon box, a wide cream window, an overhanging black roof */
      + '<rect x="70" y="6" width="36" height="40" rx="2" fill="#7d2b26" stroke="#17181c" stroke-width="2.4"/>'
      + '<rect x="76" y="12" width="19" height="15" rx="1.5" fill="#dff0f7" stroke="#17181c" stroke-width="1.8"/>'
      + '<path d="M67 6h41l-3-6H70z" fill="#2b2b30" stroke="#17181c" stroke-width="2" stroke-linejoin="round"/>'
      /* the running board the wheels sit under, the headlamp on the front, the drawbar at the back */
      + '<rect x="8" y="46" width="97" height="6" rx="2" fill="#2b2b30" stroke="#17181c" stroke-width="1.8"/>'
      + '<circle cx="12" cy="21" r="4" fill="#ffd05a" stroke="#17181c" stroke-width="1.6"/>'
      + '<rect x="104" y="38" width="4" height="7" rx="1" fill="#2b2b30" stroke="#17181c" stroke-width="1.4"/>'
      + '</svg>',
    /* trainOrder's LOADER: one stands in front of every flatbed with his arms out to take the adjective off
       the dock, so the drop has somewhere to happen. Cap, overalls, boots, both palms up. */
    loader: '<svg class="g4-art" viewBox="0 0 44 60" aria-hidden="true" focusable="false">'
      + '<path d="M6 26q2-9 16-9t16 9" fill="none" stroke="#22374a" stroke-width="4.6" stroke-linecap="round"/>'
      + '<circle cx="5" cy="25" r="3.4" fill="#f4c79b" stroke="#8a5a2b" stroke-width="1.6"/>'
      + '<circle cx="39" cy="25" r="3.4" fill="#f4c79b" stroke="#8a5a2b" stroke-width="1.6"/>'
      + '<rect x="16" y="36" width="5" height="15" rx="2" fill="#3f6f9a" stroke="#22374a" stroke-width="1.6"/>'
      + '<rect x="23" y="36" width="5" height="15" rx="2" fill="#3f6f9a" stroke="#22374a" stroke-width="1.6"/>'
      + '<rect x="14" y="50" width="9" height="5" rx="2" fill="#3a2d1c" stroke="#22374a" stroke-width="1.4"/>'
      + '<rect x="22" y="50" width="9" height="5" rx="2" fill="#3a2d1c" stroke="#22374a" stroke-width="1.4"/>'
      + '<rect x="13" y="20" width="18" height="19" rx="4" fill="#3f6f9a" stroke="#22374a" stroke-width="2"/>'
      + '<path d="M17 21v17M27 21v17" stroke="#d9c48f" stroke-width="1.6"/>'
      + '<circle cx="22" cy="12" r="7.5" fill="#f4c79b" stroke="#8a5a2b" stroke-width="1.8"/>'
      + '<path d="M14 9q3-6 8-6t8 6z" fill="#22374a"/>'
      + '<path d="M12 9h21" stroke="#22374a" stroke-width="3" stroke-linecap="round"/>'
      + '<circle cx="19" cy="12" r="1.3" fill="#2a1c10"/><circle cx="25" cy="12" r="1.3" fill="#2a1c10"/>'
      + '<path d="M20 16q2 1.6 4 0" stroke="#8a5a2b" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
      + '</svg>',
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
        say: listen ? listen.getAttribute('data-say') : '', opts: opts, key: key,
        /* the authored element itself: a presentation that groups its items by an attribute of the
           source (trainOrder's `data-train`) reads it here rather than guessing from the prompt */
        el: it
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
    this.retry = flag(root, 'data-retry', 1);
    this.shuffleOn = flag(root, 'data-shuffle', 1);
    this.usePrompt = flag(root, 'data-prompt', 1);
    this.sound = flag(root, 'data-sound', 1);
    /* a presentation that needs its own clock (skeetRange throws on a slower range) scales the
       author's `data-time` once, here, so the intro card already shows the clock that will run */
    this.itemTime = Math.round(Math.max(0, num(root, 'data-time', 0))
      * ((this.plugin && this.plugin.timeScale) || 1));              // ms per item
    /* a game that is its own clock has no deadline to keep: the lever wins over the authored data-time,
       so a page written before the game lost its timer cannot put one back */
    if (this.plugin && this.plugin.noTimer) this.itemTime = 0;
    this.limit = Math.max(0, num(root, 'data-limit', 0));         // seconds per run
    this.limitLeft = this.limit;
    this.reduced = reduceMotion;
    this.running = false; this.phase = 'idle';
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
    /* A GAME MAY OWN ITS START LINE (`PLUGINS.<game>.startText`): the finish belongs to the game, so the
       sentence that names it does too. The block's own how-text is REPLACED rather than stacked under a
       second line, and a block with no how-text gets the line anyway. */
    var startLine = (this.plugin && PLUGINS[this.name] && PLUGINS[this.name].startText) || '';
    if (how) {
      if (startLine) how.textContent = startLine;
      card.appendChild(how);
    } else if (startLine) card.appendChild(el('p', 'game-how', startLine));
    /* NO rounds / deadline / keys strip on the start card: the student sees the game's own picture and
       the Play button, not a stat line before they have played anything. */
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
    /* the score of the run that has just ended, printed in the corner the LIVE score uses while playing:
       the same place, so a returning student reads "Score: 4/6" as that card's vacancy filled in. It is
       the block's ONE place for a final score — nothing is printed under the block — and it is hidden
       during a run (the live score is there) and until there is something to show. */
    var prev = el('div', 'g4-prev');
    prev.innerHTML = '<span>Score:</span><b></b>';
    stage.appendChild(prev);
    this.prevEl = prev;
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
    /* the stage goes BELOW the block's lettered header, never above it: FORMAT.md requires the h3 to be
       the block's first line, so a block that opens with one keeps it on top and the stage lands directly
       under it. A block whose markup has no heading is inserted at the top exactly as before. */
    var head = root.firstElementChild;
    if (head && /^H[1-6]$/.test(head.tagName)) root.insertBefore(stage, head.nextSibling);
    else root.insertBefore(stage, root.firstChild);   /* how-text and Play moved into the overlay above */
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
     A presentation whose score is NOT "items answered" reports it through `view.score()`, and that
     number is what the HUD shows. `this.best` is the same idea kept HIDDEN: the highest a run has
     reached while it was still going, which is what a run that RESTARTS keeps (a presentation that
     sends the run back to its first item sets the live score to zero, and this is the count that is not
     thrown away — the final score is the best attempt, not the last one). */
  Runner.prototype.hud = function () {
    var lives = (this.view && typeof this.view.lives === 'function') ? Math.max(0, this.view.lives()) : null;
    if (lives != null) this.livesTop = Math.max(this.livesTop || 0, lives);
    /* the default HUD score is a live pair of numbers. ANY presentation whose score must not be read while
       it is being played — bossRaid today — declares `PLUGINS.<game>.hideScoreLive = true`, and this one
       block of the runner hides the WHOLE score card for it (the paper pill and all, not just its digits).
       The gate is `running`, not `phase === 'play'`: resolve() moves the run through `done` for the beat
       between an answer and the next item, so a play-only test would let the card flash for that whole
       beat. `running` is true from start() until finish(), so the card is hidden for the entire run and the
       run's number still returns on the end card like every other game. */
    var scoreEl = this.hudEl.querySelector('.score');
    var hideScore = !!(this.plugin && this.plugin.hideScoreLive && this.running);
    scoreEl.style.display = hideScore ? 'none' : '';
    if (!hideScore) scoreEl.textContent = this.got() + '/' + this.total;
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
    this.settled = false;
    this.score = 0; this.best = 0; this.idx = 0; this.missed = []; this.livesTop = 0;
    var list = this.items.slice();
    /* shuffle is the default, but a game whose CONTENT is the item order (echoPads: one word per item,
       making one sentence) can never be shuffled — a shuffled sentence is a nonsense sentence */
    if (this.shuffleOn && !(this.plugin && this.plugin.noShuffle)) shuffle(list);
    var rounds = Math.max(0, num(this.root, 'data-rounds', 0));
    if (rounds > 0 && rounds < list.length) list = list.slice(0, rounds);
    this.queue = list; this.total = list.length;
    /* the order this run was dealt in, kept so a run that restarts (a wall strike) asks the same
       questions in the same order — a restart is a second attempt, not a different test */
    this.dealt = list.slice();
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
      this.best = Math.max(this.best || 0, this.score);
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
    /* the generic cues are only a fallback: a presentation that owns its own sound (whackMole's groan,
       skeetRange's gun / buzzer / crowd) sets PLUGINS.x.ownMiss — or ownSound, for both cues — and then
       the runner does not play a second sound on top of it */
    if (this.plugin && this.plugin.ownSound) { /* the presentation has played it already */ }
    else if (hit) SFX.hit(this.sound);
    else if (!(this.plugin && this.plugin.ownMiss)) SFX.miss(this.sound);
    if (this.view) this.view.mark(it, hit, value);
    this.hud();          /* an activity that spends a life shows it at once, not on the next item */
    /* THE fail condition, for every game in the engine: no lives left ends the run. A presentation
       that keeps lives (mineGrid's three bites, wordleBoard's two wrong words, flapGate's bricks,
       echoPads' three wrong pads) does not have to know about it — spending the last one here is enough. The
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

  /* finalScore: the number a run is judged on. A run that never restarts is judged on exactly what it
     scored; a run that restarts (flapGate's wall strike) may have had its live score zeroed on the way,
     so the best it reached is kept and the BEST attempt is the number the block hands back. */
  Runner.prototype.finalScore = function () {
    return Math.max(this.got(), this.best || 0);
  };
  /* restartRun: put the run back to its FIRST item, still running, with the same questions in the same
     order — a second attempt at the same test, not a different one. The live score goes back to zero,
     because those items are about to be asked again and a count that kept them would pay twice for one
     answer. Nothing that is written in the page is taken back: the radios of the attempt that ended stay
     written, so the evidence survives its restart. The PRESENTATION is not reset — the lives it holds are
     spent, which is what a restart costs. Only a game with lives calls this: the same question shown
     twice is what the hearts pay for. */
  Runner.prototype.restartRun = function () {
    var self = this;
    if (!this.running || this.phase === 'over' || !this.dealt) return false;
    this.clearTimers();
    if (this.view) this.view.clear();
    this.dead = false;
    this.score = 0; this.answered = 0; this.idx = 0; this.missed = [];
    this.queue = this.dealt.slice();
    this.total = this.queue.length;
    this.limitLeft = this.limit;
    if (this.limit) {
      this.clock = setInterval(function () {
        self.limitLeft--; self.hud();
        if (self.limitLeft <= 0) self.finish();
      }, 1000);
    }
    this.step();
    return true;
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
      this.best = Math.max(this.best || 0, this.score);
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
      /* A board game's answer IS a choice among the item's own options — trainOrder's car is the option
         the student picked — so a wrong choice still writes the radio it names: that radio is what the
         teacher reads, and "they put it in the Size car" is the evidence. A miss that names NO option
         (wordleBoard's used-up row, trainOrder's word left on the dock) writes nothing, because there is
         nothing to write. */
      if (opt && opt.radio && opt.radio.checked !== true) {
        opt.radio.checked = true;
        if (window.Event) {
          opt.radio.dispatchEvent(new Event('input', { bubbles: true }));
          opt.radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
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

  /* finish: write the score and hand the authored list back. No second pass over the misses: an item is
     answered once per run, so a point lost is lost and the run never recycles its questions.
     Idempotent: a shape that spends its last life calls this itself, and the runner calls it too when
     the clock or the queue runs out — the second call must not score the run twice or play the win
     sting again, so an already-finished run is simply handed back. */
  Runner.prototype.finish = function () {
    if (this.phase === 'over' && !this.running) return this.finalScore();
    this.phase = 'over';
    this.running = false;
    this.setPrompt('', false);
    /* A presentation may end its run with a picture of its OWN ending, and only it knows when that
       picture is finished: trainOrder's last train is still running out of the yard (or standing in it
       wrecked) when the last answer lands, and the intro card coming back over the stage would cover
       the moment the run was played for. So a view that defines `view.finale(done)` keeps the stage —
       and the run's score card, and the intro — until it calls `done()`. Everything else hands the
       stage back here and now, exactly as before; a finale that throws must never leave the block
       dead looking unfinished, so the throw settles it. */
    var self = this;
    var ending = !!(this.view && typeof this.view.finale === 'function');
    this.clearTimers();
    if (!ending) {
      this.root.classList.remove('is-on');
      if (this.view) this.view.clear();
      SFX.win(this.sound && this.finalScore() > 0);
    }
    this.btn.textContent = this.retry ? '↻ Play again' : 'Run complete';
    this.btn.disabled = !this.retry;
    /* the run's score is not a thing you lose by looking away, and it is not a sentence under the block
       either: the intro comes back over the stage, and the run that just ended is written in the corner
       the live score uses — "Score:" over the pair — so it reads as that card coming back with the
       number still on it. Same corner, same card, every game. */
    var settle = function () {
      if (self.settled) return;
      self.settled = true;
      self.root.classList.remove('is-on');
      if (self.view) self.view.clear();
      if (self.prevEl) {
        self.prevEl.querySelector('b').textContent = self.finalScore() + '/' + self.total;
        self.prevEl.classList.add('on');
      }
      self.poster();               /* the art comes back behind the intro overlay */
    };
    if (!ending) { settle(); return this.finalScore(); }
    try { this.view.finale(settle); } catch (e) { settle(); }
    return this.finalScore();
  };
  /* `settled` is per FINISH: a run that starts again clears it, so the same block can end twice in one
     page's life (a replayed run) without the second ending being skipped as already written */
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
    var chips = [], buckets = [], drag = null, active = null, cur = null, girl = null;
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
        /* A LATER BLOOM IS A BIGGER BLOOM, so "the biggest flower in the garden" is a thing the garden
           can have (qa/NOTES.md 83). The pot that was watered most holds the winner, and two pots level
           on blooms is the tie the girl settles by picking one at random. */
        var s = 0.72 + i * 0.07;
        f.style.width = Math.round(18 * s) + 'px';
        f.style.height = Math.round(46 * s) + 'px';
        box.appendChild(f);
      }
    }
    /* one pot, made once. A pot is the answer's target, so it reads its value and its word OFF THE
       STAGE at the moment it is used, not from the item that happened to build it. */
    function addPot() {
      var b = el('button', 'g4-bucket');
      b.type = 'button';
      b.innerHTML = ART.pot
        + '<span class="g4-bucket-t"></span>'
        + '<span class="g4-splash" aria-hidden="true"><i></i><i></i><i></i></span>'
        + '<span class="g4-blooms" aria-hidden="true"></span>';
      b.addEventListener('click', function () {
        if (r.phase === 'play' && cur) r.pickOn(cur, b.getAttribute('data-v'));
      });
      tray.appendChild(b);
      buckets.push(b);
      return b;
    }
    /* clear ends an ITEM, and the garden is not part of an item: the pots and every flower already grown
       in them stay exactly where they are, and only the answer's own colours come off. Rebuilding them
       grew the whole garden again after every answer, which reads as a reload rather than a garden. */
    function clear() {
      drag = null; active = null;
      wordRow.innerHTML = '';
      chips = [];
      buckets.forEach(function (b) { b.classList.remove('ok', 'no', 'reveal', 'hot'); });
    }
    function show(item) {
      clear();
      cur = item;
      var names = labels(item);
      /* pots first, so a drag can land on one before the student releases. The pots belong to
         THIS item, so a block can re-label them item by item — but the pot itself and the flowers in it
         are the RUN's, so an item only re-points and re-labels them. */
      while (buckets.length < item.opts.length) paint(addPot());
      item.opts.forEach(function (o, i) {
        var b = buckets[i];
        b.style.display = '';
        b.setAttribute('data-v', o.value);
        b.classList.remove('watered');
        var t = b.querySelector('.g4-bucket-t');
        if (t) t.textContent = names[i] || o.text;
      });
      /* a pot this item does not use is put away, not removed: it keeps its flowers for the next item */
      for (var i = item.opts.length; i < buckets.length; i++) buckets[i].style.display = 'none';
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
      /* the run is over when this was the last item: the garden is as full as it will get, so the girl
         walks in and takes the biggest flower in it (qa/NOTES.md 83). The wait lets the last bloom grow
         before she arrives. */
      if (r.queue.length <= 1) r.later(harvest, r.reduced ? 60 : 700);
    }
    /* THE GIRL IN THE DRESS: she walks in from the left of the tray to the biggest bloom on the stage,
       plucks it, and walks out with it in her hand. "Biggest" is the tallest bloom drawn — a later bloom
       in a pot is bigger than the one before it — and blooms of the same height are the tie she settles
       by picking one of them at random. */
    function harvest() {
      var all = [].slice.call(tray.querySelectorAll('.g4-bloom'));
      if (!all.length) return;
      var best = 0;
      all.forEach(function (f) { best = Math.max(best, f.getBoundingClientRect().height); });
      var tied = all.filter(function (f) { return f.getBoundingClientRect().height >= best - 0.5; });
      var bloom = tied[Math.floor(Math.random() * tied.length)];
      var tb = tray.getBoundingClientRect(), bb = bloom.getBoundingClientRect();
      var GW = 46;
      var toX = bb.left - tb.left + bb.width / 2 - GW / 2;
      var walk = Math.round(700 + Math.abs(toX) * 1.1);   /* further to walk, longer it takes */
      girl = el('div', 'g4-girl');
      girl.innerHTML = ART.girl + '<span class="g4-girl-hand">' + ART.flower + '</span>';
      girl.style.transform = 'translateX(' + (-GW - 10) + 'px)';
      tray.appendChild(girl);
      void girl.offsetWidth;                          /* let the browser see her start off the tray */
      girl.classList.add('walking');
      girl.style.transition = 'transform ' + walk + 'ms linear';
      girl.style.transform = 'translateX(' + Math.round(toX) + 'px)';
      r.later(function () {
        girl.classList.remove('walking');
        girl.classList.add('picked');
        bloom.classList.add('picked');
      }, walk + 60);
      r.later(function () {
        var off = (tray.clientWidth || 600) + GW + 20;
        girl.classList.add('walking');
        girl.style.transition = 'transform ' + Math.round(600 + off * 1.1) + 'ms linear';
        girl.style.transform = 'translateX(' + off + 'px)';
      }, walk + 620);
    }
    /* a new run plants an empty garden — the pots are the same pots, so each is repainted empty rather
       than thrown away and made again */
    function reset() { blooms = {}; buckets.forEach(paint); }
    return {
      show: show, mark: mark, clear: clear, reset: reset, ownsPrompt: true
    };
  };
  /* ---------------- whackMole: the answers surface from holes, then duck ----------------
     One mole per option; the right one must be hit before the runner's bar empties. The moles are
     drawn art, they rise and duck, and the others drop away the moment an answer lands.
     While they wait every mole bobs shallowly on its own clock and blinks at its own pace (two CSS
     vars per mole), and each glances left or right at its own random moments (the eyes are one group
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
      /* ALWAYS A 3x2 GARDEN: six holes, always — the grid never reflows between items, and the content
         contract is 2-6 options (CONTENT_EXAMPLES.md §`whackMole`), so one hole per option always fits. */
      var n = 6, holes = [], i;
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
        /* each mole breathes on its own clock: a different period and a negative delay, so the garden
           never pulses in time and no two neighbours are at the same point of the bob */
        m.className += ' alive';
        m.style.setProperty('--bob-d', (2.1 + Math.random() * 1.1).toFixed(2) + 's');
        m.style.setProperty('--bob-t', (-Math.random() * 2.4).toFixed(2) + 's');
        m.style.setProperty('--blink-d', (4.2 + Math.random() * 3.4).toFixed(2) + 's');
        m.style.setProperty('--blink-t', (-Math.random() * 5).toFixed(2) + 's');
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
        m.classList.remove('look-l', 'look-r', 'alive');
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
  /* the orchard is never quite still. A meadow of flowers that nod on their stems, petals coming down
     out of the trees, and a butterfly working along the grass. All of it is SVG plus the class names
     style.css animates, so it costs no timer, needs no attention from the engine, and stops entirely
     under `prefers-reduced-motion`. */
  function fxFlower(x, y, r, face) {
    return '<path d="M' + x + ' ' + (y + r * 2.6) + 'V' + y + '" stroke="#2f6b33" stroke-width="1.6" stroke-linecap="round"/>'
      + '<g fill="' + face + '">'
      + '<circle cx="' + x + '" cy="' + (y - r * .7) + '" r="' + (r * .72) + '"/>'
      + '<circle cx="' + (x - r * .8) + '" cy="' + (y - r * .1) + '" r="' + (r * .64) + '"/>'
      + '<circle cx="' + (x + r * .8) + '" cy="' + (y - r * .1) + '" r="' + (r * .64) + '"/>'
      + '<circle cx="' + (x - r * .42) + '" cy="' + (y - r * 1.15) + '" r="' + (r * .52) + '"/>'
      + '<circle cx="' + (x + r * .42) + '" cy="' + (y - r * 1.15) + '" r="' + (r * .52) + '"/>'
      + '</g><circle cx="' + x + '" cy="' + (y - r * .5) + '" r="' + (r * .44) + '" fill="#ffd05a"/>';
  }
  function fxMeadow() {
    var faces = ['#e4557f', '#f7f2e4', '#ffb703', '#d97fd4', '#f7f2e4'];
    var xs = [14, 40, 68, 96, 126, 268, 298, 328, 356, 384], out = '';
    for (var i = 0; i < xs.length; i++) {
      var y = 176 + (i % 3) * 8, r = 5.5 + (i % 3);
      /* each flower nods on its own clock, so the meadow breathes instead of pulsing together */
      out += '<g class="g4-fx-bloom" style="animation-delay:-' + (i * 0.83).toFixed(2) + 's">'
        + fxFlower(xs[i], y, r, faces[i % faces.length]) + '</g>';
    }
    return out;
  }
  function fxPetals() {
    var seeds = [[44, -2.2, 9], [98, -5.4, 11], [152, -8.1, 10], [238, -3.1, 12],
      [302, -6.6, 9.5], [352, -9.2, 11.5], [190, -1.4, 13]], out = '';
    for (var i = 0; i < seeds.length; i++) {
      out += '<circle class="g4-fx-petal" cx="' + seeds[i][0] + '" cy="120" r="'
        + (1.7 + (i % 2) * 0.6) + '" fill="' + (i % 3 ? '#e4557f' : '#f8dbe6') + '"'
        + ' style="animation-delay:' + seeds[i][1] + 's;animation-duration:' + seeds[i][2] + 's"/>';
    }
    return out;
  }
  function fxButterfly(x, y, dur, delay) {
    return '<g transform="translate(' + x + ',' + y + ')">'
      + '<g class="g4-fx-fly" style="animation-duration:' + dur + 's;animation-delay:' + delay + 's">'
      + '<g class="g4-fx-flap">'
      + '<ellipse cx="-4.4" cy="-1" rx="5.4" ry="3.8" fill="#ffb703" stroke="#a9741a" stroke-width="1"/>'
      + '<ellipse cx="4.4" cy="-1" rx="5.4" ry="3.8" fill="#ffb703" stroke="#a9741a" stroke-width="1"/>'
      + '</g><circle r="1.5" fill="#5a3a12"/></g></g>';
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
    /* orchard: baskets wait on the grass under the trees — and the grass itself is awake */
    catchBasket: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-dawn)"/>' + sun(322, 46, 20)
        + cloud(70, 34, .9) + cloud(196, 22, .7, .8)
        + hills('#a8d8b4', 168, .9) + hills('url(#g4-grass)', 196)
        + '<g fill="#4a7c46"><rect x="34" y="150" width="10" height="46" rx="4"/>'
        + '<rect x="356" y="158" width="9" height="40" rx="4"/></g>'
        + '<g fill="#5f9b52"><circle cx="39" cy="140" r="26"/><circle cx="361" cy="148" r="22"/>'
        + '<circle cx="18" cy="158" r="16"/></g>'
        + '<g fill="#c0392b" opacity=".85"><circle cx="31" cy="136" r="4"/><circle cx="49" cy="146" r="4"/>'
        + '<circle cx="356" cy="144" r="3.5"/><circle cx="368" cy="156" r="3.5"/></g>'
        + fxMeadow() + fxPetals() + fxButterfly(70, 132, 7.5, -1) + fxButterfly(276, 120, 9.5, -4.5));
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
    },
    /* the yard at dawn. The scene is composed for the band the stage actually shows: on a wide block
       the picture is sliced from the BOTTOM, so the town, the mill chimney and the water tower sit just
       above the embankment the live game draws over them, and the sky above is there for narrow screens */
    trainOrder: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-dawn)"/>' + sun(58, 44, 15)
        + cloud(196, 30, .9, .78) + cloud(322, 22, .65, .6)
        + hills('#a9cfae', 198, .9) + hills('#6d9a79', 218)
        + '<g fill="#48565f" opacity=".9"><rect x="16" y="176" width="12" height="60"/>'
        + '<rect x="38" y="202" width="54" height="34"/><path d="M38 202l27-14 27 14z"/>'
        + '<rect x="300" y="190" width="9" height="46"/><rect x="290" y="178" width="28" height="12"/>'
        + '<rect x="318" y="208" width="54" height="28"/></g>'
        + '<g fill="#3f4b53" opacity=".55"><rect x="196" y="212" width="64" height="24"/>'
        + '<rect x="130" y="218" width="30" height="18"/></g>'
        + '<rect y="226" width="400" height="34" fill="url(#g4-sand)"/>'
        + '<g stroke="#a97c45" stroke-width="2" opacity=".32"><path d="M0 240h400"/></g>');
    }
  };
  /* ---------------- posters: one still per game, drawn behind the intro overlay ----------------
     Each uses the same classes the live game uses, so the picture is styled by the same CSS, and the
     labels are the lesson's own option words. Nothing here reads or writes an answer. */
  /* ONE TRAIN GEOMETRY, shared by the live yard and by the start card's still, because the train is
     CENTRED IN THE YARD and its length is the lesson's own (2 to 8 adjectives). The whole train — engine
     plus wagons — is a fixed 76% of the yard whatever its length: the engine takes 1.2 car pitches and the
     wagons n, so one pitch is 76/(n+1.2) of the yard and the wagons' box is n pitches wide. The box is
     then pushed right by HALF the engine's overhang, which is exactly what centres the ASSEMBLY rather
     than centring the wagons and letting the engine hang off the left edge.
     `--runx` is the pull: the distance that carries the last wagon clear of the stage. It is a percentage
     of the BOX, because that is what a translate percentage measures — and the box shrinks as the train
     gets shorter, so a fixed -130% would stop a two-car train half on the stage. */
  function trainGeom(host, n) {
    n = Math.max(1, Math.min(8, n || 8));
    var pitch = 76 / (n + 1.2);                     /* one car pitch, % of the yard */
    var tw = pitch * n;                             /* the wagons' box, % of the yard */
    var locoOut = pitch * 1.2;                      /* how far the engine stands left of the box, % of yard */
    var gap = (100 - tw) / 2;
    var runx = -(((gap + locoOut / 2 + tw) / tw) * 100 + 2);   /* % of the BOX, plus a 2% margin */
    host.style.setProperty('--tw', tw.toFixed(4) + '%');
    host.style.setProperty('--shift', (locoOut / 2).toFixed(4) + '%');
    host.style.setProperty('--locoOut', (locoOut / tw * 100).toFixed(4) + '%');  /* of the BOX */
    host.style.setProperty('--pitchBox', (100 / n).toFixed(4) + '%');            /* of the BOX */
    host.style.setProperty('--runx', runx.toFixed(2) + '%');
    return n;
  }
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
      /* the still is the tower as it stands, drawn in the live game's own furniture: three blocks already
         placed, the climber against the tower's left face, and the chest waiting on the roof the tower is
         being built to. No question on the poster either — the game has none. Same classes as the live
         game, so the same CSS draws it. */
      var texts = (items[0].opts || []).map(function (o) { return o.text; });
      [0, 30, 60].forEach(function (b, i) {
        box.appendChild(abs(el('div', 'g4-layer g4-bit', esc(texts[i] || '')),
          'left:52px;bottom:' + (46 + b) + 'px;height:26px'));
      });
      box.appendChild(abs(el('div', 'g4-climber g4-bit', ART.hero),
        'left:52px;bottom:76px;width:30px;height:44px;margin-left:-8px'));
      box.appendChild(abs(el('div', 'g4-ledge g4-bit'), 'left:52px;bottom:132px;height:10px'));
      box.appendChild(abs(el('div', 'g4-prize g4-bit', ART.chest), 'bottom:142px;height:34px;opacity:.85'));
      box.appendChild(abs(el('div', 'g4-roof g4-bit'), 'bottom:176px;height:12px'));
      var n = Math.max(1, texts.length);
      var tray = abs(el('div', 'g4-towerpads g4-bit'), 'left:52px;right:12px;bottom:8px;height:40px');
      texts.forEach(function (t, i) {
        tray.appendChild(el('div', 'g4-padbtn', esc(t)));
      });
      box.appendChild(tray);
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
      /* the still is the street as the game draws it: the SAME saloon frontage, the same boardwalk and the
         same row of doorways in the same place, so the doors stand on the saloon's foot and not down in
         the road — and NO word hangs over them, because a word is the answer card and a block nobody has
         started asks nothing yet. */
      var texts = opts0(items, 4);
      /* the stage's own insets, so every absolute child lands exactly where the live game puts it: the
         frontage, the boardwalk and the row of doors are the same three pieces the game builds, in the
         same order and from the same classes */
      var frame_ = el('div', 'g4-bit');
      abs(frame_, 'left:10px;right:10px;top:8px;bottom:8px');
      var facade = el('div', 'g4-facade');
      facade.innerHTML = '<span class="g4-cornice"></span>'
        + '<span class="g4-saloon-win a"></span><span class="g4-saloon-win b"></span>';
      var road = el('div', 'g4-road');
      abs(road, 'left:-10px;right:-10px;bottom:0;height:74px');
      var row = el('div', 'g4-doors');
      texts.forEach(function () {
        var door = el('div', 'g4-door');
        door.innerHTML = '<span class="g4-dframe" aria-hidden="true">'
          + '<span class="g4-dhole"></span>'
          + '<span class="g4-dleaf left">' + ART.saloonLeaf + '</span>'
          + '<span class="g4-dleaf right">' + ART.saloonLeaf + '</span>'
          + '<span class="g4-djamb">' + ART.saloonFrame + '</span></span>';
        row.appendChild(door);
      });
      frame_.appendChild(facade); frame_.appendChild(road); frame_.appendChild(row);
      box.appendChild(frame_);
      box.appendChild(abs(el('div', 'g4-runner g4-bit', ART.hero), 'left:50%;bottom:4px;width:30px;height:46px;margin-left:-15px'));
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
    /* NO PROMPT CARD on the start page: the sentence card (the given opening + the word placed) is the
       item's own content, and drawing it here hangs a prompt over a block that has not started yet. The
       still is the pad row only — the sentence appears when Play does. */
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
    /* NO PROMPT BOARD in the still: the board at the top of the rail is the item's own stem, so drawing
       it on the start page hangs the first question over a block that has not started yet. The still is
       the ladder only — the question appears when Play does. */
  },
  bossRaid: function (box, items) {
    /* the still is the arena: the boss and the swordsman it is about to meet. NO health bar — the bar
       is a count of the run, and the start page is the block before anything has been played. */
    var art = el('div', 'g4-bossart g4-bit');
    art.innerHTML = ART.boss;
    abs(art, 'left:50%;top:8%;transform:translateX(-50%);width:96px;height:96px');
    box.appendChild(art);
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
  },
    trainOrder: function (box, items) {
      /* the still is the yard it happens in: the girder, the grade, and a train of EMPTY flatbeds
         climbing it. Not one word of the lesson is on it — the words are what the run answers, so a
         block nobody has started must not show its first answer on the start card.
         THE STILL WEARS THE YARD'S OWN CLASS, because every part of it is laid out from the yard's
         geometry (--rail, --deck, --gap, --tw, --gut): without them the bridge and the planks had no
         coordinates and piled into the top-left corner, and the train had no width at all. */
      box.className = 'g4-poster g4-yard';
      box.appendChild(el('div', 'g4-tgirder g4-bit'));
      box.appendChild(el('div', 'g4-tsign g4-bit', '⚠ LOW BRIDGE · 3px'));
      var deck = el('div', 'g4-tdeck g4-bit');
      deck.appendChild(el('div', 'g4-tdspace'));
      /* the still is THIS block's train: as many wagons and as many men as the lesson wrote (2 to 8), so
         the start card promises the game the student is about to get rather than always eight cars */
      var stillN = Math.max(2, Math.min(8, (items || []).length || 8));
      for (var i = 0; i < stillN; i++) deck.appendChild(el('div', 'g4-tplank'));
      box.appendChild(deck);
      box.appendChild(el('div', 'g4-tbank g4-bit'));
      box.appendChild(el('div', 'g4-ttrack g4-bit'));
      var train = el('div', 'g4-ttrain g4-bit');
      /* the still's locomotive is the same drawn engine the live game uses, on the same centred geometry */
      trainGeom(box, stillN);
      var loco = el('div', 'g4-tloco');
      loco.innerHTML = ART.engine;
      train.appendChild(loco);
      for (var k = 0; k < stillN; k++) {
        var car = el('div', 'g4-tcar');
        /* the cars are absolutely positioned by the stylesheet, so the still lays them out on the same
           pitch the live game uses — the old flex-era height/marginBottom pair left all eight stacked */
        car.style.left = (k * 100 / stillN) + '%';
        car.style.width = 'calc(' + (100 / stillN) + '% - 4px)';
        car.style.setProperty('--k', String(k));
        car.appendChild(el('div', 'g4-tbody'));
        car.appendChild(el('i', 'g4-twheel a'));
        car.appendChild(el('i', 'g4-twheel b'));
        train.appendChild(car);
      }
      var crew = el('div', 'g4-tcrew');
      for (var g = 0; g < stillN; g++) {
        var guy = el('div', 'g4-tguy');
        guy.innerHTML = ART.loader;
        guy.style.left = (g * 100 / stillN) + '%';
        guy.style.width = (100 / stillN) + '%';
        crew.appendChild(guy);
      }
      /* the crew is the TRAIN'S SIBLING, not its child, exactly as in the live game: the geometry vars are
         percentages of the yard, so a crew inside the train box would resolve them against the train */
      box.appendChild(crew);
      box.appendChild(train);
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
     THERE IS NO QUESTION ON THE STAGE. The task is telling the right phrase from the wrong one, so the
     option blocks are the whole of what is read: a prompt beside them would be a second thing to read
     for an answer the student picks by recognising the phrase. `ownsPrompt` stays on, so the runner
     leaves the HUD line empty as well.
     The tower stands on the stage floor: the right answer is dragged onto it (or clicked, or pressed),
     the block flies up, lands, and stays for the rest of the run. A block is as big as the option it came
     from — same height as the tray's blocks — so the tower is visibly built out of the answers
     themselves. A wrong one tumbles off and the tower is untouched, so the tower never loses what was
     earned and its height IS the progress.
     WHY the tower is built: it is built to a ROOF. The ledge, the chest on it and the roof over it are
     fixed from the first block, at the height the finished tower reaches, so the stack has a destination
     the student can see and every right answer is one block nearer to it. A ledge that rises with the
     tower asks for nothing, and a tower with nothing above it is a scoreboard with pictures on it. Reach
     the roof and the chest is won — that is every block placed — and the climber celebrates.
     There is no ladder: the climber climbs the tower itself, one answer at a time, standing against its
     left face.
     Authoring: `.qitem` per question (six to ten makes a climb); options are the blocks. `data-time`
     is the deadline for one block. */
  PLUGINS.stackDrop = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-tower');
    var view = el('div', 'g4-stackview');
    var scroll = el('div', 'g4-scroll');
    var stack = el('div', 'g4-stack');
    var climber = el('div', 'g4-climber');
    var ledge = el('div', 'g4-ledge');
    var prize = el('div', 'g4-prize');
    var roof = el('div', 'g4-roof');
    var pads = el('div', 'g4-towerpads');
    var flag = el('div', 'g4-flag');
    /* A MARIO FLAGPOLE, not a flag emoji (qa/NOTES.md 36): a pole with a knob on top and a pennant that
       waves for as long as it is standing. He runs along the top of the finished tower and jumps at it. */
    flag.innerHTML = '<span class="g4-pole"></span><span class="g4-pennant"></span>';
    var coin = el('div', 'g4-coin'); coin.textContent = '🪙';
    climber.innerHTML = ART.hero;
    prize.innerHTML = ART.chest;
    scroll.appendChild(stack);
    scroll.appendChild(climber); scroll.appendChild(ledge); scroll.appendChild(prize);
    scroll.appendChild(roof);
    view.appendChild(scroll);
    box.appendChild(view); box.appendChild(pads); box.appendChild(flag); box.appendChild(coin);
    stage.appendChild(box);

    var AH = 48, GAP = 4, LH = 10;      /* one tower block (= the option block), the seam, the ledge */
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
    /* The height of one block comes from the run's own length: the whole tower has to stand inside the
       window, so ten blocks — the most a stage holds with the words still readable, and the reason the
       fit stops counting at ten — share the height that is there, and a shorter run gets taller blocks up
       to the block's own size (48px). A tower of eleven or twelve keeps the ten-block height and scrolls:
       a block shorter than the word inside it is not a block. The tray takes the same height, so an
       answer and the block it becomes are one size. */
    var MAXFIT = 10;
    function fitBlocks() {
      var n = Math.min(MAXFIT, Math.max(1, r.total));
      var stageH = box.clientHeight || 280;
      /* the answers now stand on the RIGHT, so the tower has the bottom of the stage to itself: its floor
         drops 35px, which is the note's "move the stack items down 35px". The old tray top sat at ~62px
         above the floor (a full 48px block plus its 14px foot), so the new floor is ~27px. Each block then
         shares the height from that floor to the top across the run. */
      AH = Math.floor((stageH - 40 - (n - 1) * GAP) / n);   /* 27px floor + ~13px of roof headroom */
      AH = Math.max(19, Math.min(48, AH));
      view.style.bottom = '27px';
    }
    /* the roof the tower is built TO. It is fixed the moment the tray tells us how tall a block is, at the
       height the finished tower will reach, so the goal is in the picture from the first answer and every
       block placed closes the gap on it. A ledge that moves up with the tower is a goal that asks for
       nothing. */
    function raiseRoof() {
      var goal = Math.max(1, r.total) * (AH + GAP);
      ledge.style.bottom = goal + 'px';
      prize.style.bottom = (goal + LH) + 'px';
      roof.style.bottom = (goal + LH + 34) + 'px';
      /* the flag he runs and jumps to at the end — to the RIGHT of the finished tower, where he runs — and
         the coin that pops out when he reaches it */
      flag.style.bottom = (goal + LH) + 'px';
      flag.style.left = 'calc(var(--tw) + var(--tww) + 18px)';
      /* the coin comes out of the top of the pole, where the knob is */
      coin.style.bottom = (goal + LH + 60) + 'px';
      coin.style.left = 'calc(var(--tw) + var(--tww) + 14px)';
      flag.classList.remove('on');
      coin.classList.remove('pop');
    }
    /* the finish, all answers right: he runs along the finished tower and jumps at the flag, and the coin it
       knocks out pops up. THE RUN IS MEASURED, not a fixed 112px (qa/NOTES.md 37): the jump lands him at
       the pole wherever the pole actually stands, so a narrow stage and a wide one both finish on the pole. */
    function runToFlag() {
      if (r.reduced) { flag.classList.add('on'); return; }
      var fr = flag.getBoundingClientRect(), cr = climber.getBoundingClientRect();
      climber.style.setProperty('--run', Math.max(40, Math.round(fr.left - cr.left - 6)) + 'px');
      climber.classList.add('mario');
      r.later(function () { flag.classList.add('on'); coin.classList.add('pop'); }, 300);
    }
    /* the finish, short of the top: he does not reach the flag — he trips and falls on his face */
    function faceplant() {
      if (r.reduced) return;
      r.later(function () { climber.classList.add('faceplant'); }, 300);
    }
    /* one block of the tower, and the climber rises to its top: he climbs the STACK, there is no ladder */
    function layer(text, cls) {
      var idx = Math.round(top / (AH + GAP));    /* which block up the tower this is (0 = the first) */
      var d = el('div', 'g4-layer' + (cls ? ' ' + cls : ''), text);
      d.style.height = AH + 'px';
      d.style.bottom = top + 'px';
      /* RIGHT-JUSTIFIED and tapering: every block shares the tower's right edge, and each block above the
         first is 20px narrower than the one below it, so the stack narrows as it climbs to the roof */
      d.style.left = 'auto';
      d.style.right = 'calc(100% - var(--tw) - var(--tww))';
      d.style.width = 'max(60px, calc(var(--tww) - ' + (idx * 20) + 'px))';
      stack.appendChild(d);
      bits.push(d);
      top += AH + GAP;
      climber.style.bottom = Math.max(0, top - AH - GAP) + 'px';
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
    /* a new run builds a new tower, and the roof goes back to its own height with it */
    function reset() {
      bits.forEach(function (b) { if (b.parentNode) b.parentNode.removeChild(b); });
      bits = [];
      stack.innerHTML = '';
      top = 0; placed = 0;
      climber.style.bottom = '0px';
      climber.classList.remove('cheer', 'mario', 'faceplant');
      flag.classList.remove('on');
      coin.classList.remove('pop');
      ledge.style.bottom = '0px';
      roof.style.bottom = '0px';
      prize.classList.remove('won');
      prize.style.bottom = LH + 'px';
      scroll.style.transform = '';
    }
    function show(item) {
      clear();
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
      if (!bits.length) { fitBlocks(); raiseRoof(); }   /* an empty tower sets this run's block size */
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
      /* the tower's own centre line, taken from its LEDGE: the ledge is exactly as wide as the blocks, so
         the flight is aimed where the block will land rather than at the middle of the answer tray */
      var sb = ledge.getBoundingClientRect();
      var tx = sb.left - bb.left + sb.width / 2;
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
          /* every answer was right, so the stack reached the roof: he runs and jumps to the flag and the
             coin pops out (the run ends right after, so the win plays as the run closes) */
          prize.classList.add('won');
          runToFlag();
        }
      } else {
        /* the block tumbles off the tower: it is never part of what gets built, and the roof stays where
           the run set it — the tower is now one block further from the chest, not the chest nearer */
        var bad = layer(text || '—', 'mark-no fall');
        var at = top;
        r.later(function () {
          if (bad.parentNode) bad.parentNode.removeChild(bad);
          top = at - AH - GAP;
          climber.style.bottom = Math.max(0, top - AH - GAP) + 'px';
          scrollTo();
        }, r.reduced ? 20 : 520);
      }
      /* the run is closing (this was the last item) and the tower never reached the roof — a miss kept a
         block off it — so he does not get to the flag: he falls on his face */
      if (r.queue.length <= 1 && placed < r.total) faceplant();
    }
    return {
      show: show, mark: mark, clear: clear, reset: reset, ownsPrompt: true
    };
  };

  /* ---------------- flapGate: one-button flight through the right gap ----------------
     The gaps are real holes in a wall. One gap per option, each labelled, and the wall scrolls toward
     the bird at its own pace. There is NO TIMER (`PLUGINS.flapGate.noTimer`): the wall arriving is the
     whole of the clock, so nothing is on a deadline, nothing expires, and the student has as long as the
     stream of walls lasts. Where the bird is when the wall reaches it is the answer — the gap it flew
     through, or the brick it flew into. The words are text in the gaps, not buttons: the whole sky is
     the control, so a click (or Space) flaps and nothing in the wall takes one.
     A RIGHT gap is flown THROUGH: he does not stop in the doorway he chose, he carries on out the far
     side of it, and the next wall is already on its way in from the right, so the next choice arrives
     straight after this one instead of after a wait.
     The bird is drawn, not a black square, and it flaps its wings on every lift — including the one
     automatic flap as the round opens, so it is never falling before the student has touched anything.
     Fall is half what this game used to be: half the gravity, the same lift.
     SCORING:
        · a right gap is a POINT, and the flight carries on through it into the next question;
        · a wrong gap is no point at all — it costs nothing else, and the flight carries on;
        · the BRICK — flying into the wall — costs a heart AND THE RUN: the block starts again at its
          first question, with the same questions in the same order, and the live score goes back to
          zero, because the attempt is over and those items are about to be asked again. The hearts
          that are left are what the next attempt flies with; the spent ones stay spent.
     So a run that hits a wall twice can still end on its best attempt: the runner keeps the highest
     score any attempt reached and that is the block's final score (`finalScore`), never the last,
     half-flown attempt.
     Authoring: `.qitem` per item, one gap per option. `data-time` is not used by this game. */
  PLUGINS.flapGate = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-sky'), bird = el('div', 'g4-bird');
    bird.innerHTML = ART.bird;
    box.appendChild(bird);
    stage.appendChild(box);
    var BX = 64, BH = 34, GAPH = 65;   /* the bird sits 30px further right than it used to; gaps 15px taller */
    var G = 168, LIFT = -128;          /* px per second² and px per second: half the old fall */
    /* how long one wall takes to reach the bird. This is the game's clock, because there is no timer:
       nothing expires, the stream just keeps coming */
    var CROSS = 2800;
    var raf = 0, live = false, y = 0, vy = 0, t0 = 0, speed = 0.06;
    /* A WALL IS AN OBJECT IN FLIGHT, not a state of the stage (qa/NOTES.md 60). Each one is cut once, flies
       from the right edge to past the left one at the stream's own pace, and is retired when it is gone.
       The wall the bird has just flown through KEEPS GOING, and the next question is cut into a wall behind
       it, so the flight is continuous: the sky is never empty waiting for the next wall to appear. */
    var walls = [], judgedWall = null, target = '', left = 3;
    function stop() { live = false; if (raf && window.cancelAnimationFrame) window.cancelAnimationFrame(raf); raf = 0; }
    function home() { return ((box.clientHeight || 280) / 2) - BH / 2; }
    function reset() { left = 3; }
    function newWall() {
      var w = { el: el('div', 'g4-walls'), gaps: [], judged: true, built: false, x: 0 };
      w.el.style.transform = 'translateX(9999px)';
      box.insertBefore(w.el, bird);     /* behind the bird, which is z-index 3 */
      walls.push(w);
      return w;
    }
    function clear() {
      stop();
      walls.forEach(function (w) { if (w.el.parentNode) w.el.parentNode.removeChild(w.el); });
      walls = []; judgedWall = null; target = '';
      y = home(); vy = 0;
      bird.style.top = y + 'px';
      bird.classList.remove('ok', 'no', 'through');
    }
    /* the BRICK, and only the brick: one heart, and then the RUN starts again — the block goes back to
       its first question in the order it was dealt, and the score of the attempt that just ended is gone
       with it. Nothing that was answered is taken back out of the page: those radios stay written. */
    function hitWall() {
      left = Math.max(0, left - 1);
      bird.classList.remove('no');
      void bird.offsetWidth;
      bird.classList.add('no');
      SFX.miss(r.sound);
      r.hud();
      stop();                                  /* this wall's flight is over either way */
      if (!left) {
        r.later(function () { if (r.running) r.finish(); }, 700);
        return true;
      }
      r.later(function () { if (r.running) r.restartRun(); }, 620);
      return true;
    }
    /* an item is cut into a wall on its way IN, never into the one the bird is flying through: that is what
       keeps the flight continuous across a question (qa/NOTES.md 60) */
    function show(item) {
      target = item.key;
      var h = box.clientHeight || 280, W = box.clientWidth || 600;
      var w = null;
      for (var i = 0; i < walls.length; i++) { if (!walls[i].built) { w = walls[i]; break; } }
      if (!w) w = newWall();
      w.el.innerHTML = '';
      /* the gaps are cut out of the wall for real: the segments between them are the bricks */
      w.gaps = [];
      var n = Math.max(1, item.opts.length), prev = 0;
      for (var j = 0; j < n; j++) {
        var c = h * (j + 1) / (n + 1), top = Math.max(4, c - GAPH / 2);
        var o = item.opts[j];
        /* the answer is TEXT in the gap, not a button: the whole sky is the control (click or Space
           flaps), so nothing in the wall may take a click of its own */
        var g = el('div', 'g4-gapg');
        g.setAttribute('data-v', o.value);
        g.style.top = top + 'px';
        g.style.height = GAPH + 'px';
        g.appendChild(el('span', 'g4-gapg-t', o.text));
        w.el.appendChild(g);
        w.gaps.push({ top: top, value: o.value, gap: g });
        /* the brick between the previous gap and this one */
        if (top > prev) w.el.appendChild(seg(prev, top - prev));
        prev = top + GAPH;
      }
      if (h > prev) w.el.appendChild(seg(prev, h - prev));
      w.built = true; w.judged = false;
      w.x = W;
      w.el.style.transform = 'translateX(' + W + 'px)';
      /* one wall's crossing of the stage is the whole clock this game has (noTimer): a fixed pace, so the
         words come round again and again until one is flown through */
      speed = (W - BX) / CROSS;
      /* the loop runs under `prefers-reduced-motion` too: the wall's flight is the GAME, not an effect,
         and with no timer there is nothing else that could ever bring a wall to the bird or end an item */
      live = true;
      t0 = (window.performance && performance.now) ? performance.now() : Date.now();
      if (!raf) raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : 0;
      flap();                                     /* the round opens on a lift, never on a fall */
    }
    var frame = function (now) {
      if (!live) return;
      var dt = Math.min(0.05, ((now || t0) - t0) / 1000);
      t0 = now || Date.now();
      var h = box.clientHeight || 280;
      vy += G * dt;
      y = Math.max(2, Math.min(h - BH - 2, y + vy * dt));
      bird.style.top = y.toFixed(1) + 'px';
      /* every wall in flight moves, and one that is past the left edge is retired and waits to be cut */
      walls.forEach(function (w) {
        if (!w.built) return;
        w.x -= speed * dt * 1000;
        if (w.x + (w.el.offsetWidth || 100) < 0) {
          w.built = false; w.judged = true; w.gaps = []; w.el.innerHTML = '';
          w.el.style.transform = 'translateX(9999px)';
          return;
        }
        w.el.style.transform = 'translateX(' + Math.round(w.x) + 'px)';
      });
      /* the wall meets the bird: the gap it is in is the answer it flew through. The NEAREST unread wall
         is the one that counts, so two walls on the screen at once can never both be answered. */
      var near = null;
      walls.forEach(function (w) {
        if (!w.built || w.judged) return;
        if (w.x <= BX && (!near || w.x > near.x)) near = w;
      });
      if (near) {
        near.judged = true;
        judgedWall = near;
        var cy = y + BH / 2, picked = null;
        near.gaps.forEach(function (g) { if (cy >= g.top && cy <= g.top + GAPH) picked = g; });
        if (picked) {
          /* A GAP IS AN ANSWER, right or wrong: the runner takes it and the flight CARRIES ON, because he
             is still flying when the next question is cut into the wall behind this one. Only the brick
             costs a life. */
          var right = picked.value === target;
          picked.gap.classList.add(right ? 'ok' : 'no');
          bird.classList.add(right ? 'ok' : 'no');
          if (right) bird.classList.add('through');
          r.pick(picked.value);
        } else if (hitWall()) {
          return;                                  /* the brick: the run is over, or starting again */
        }
      }
      raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : 0;
    };
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
      /* THE FLIGHT IS NOT STOPPED HERE (qa/NOTES.md 60): the wall he flew through keeps going and the next
         one is already on its way, so a run is one continuous flight through every gate in it. */
      var w = judgedWall;
      if (w) {
        w.gaps.forEach(function (g) {
          var v = g.value;
          if (v === value) g.gap.classList.add(hit ? 'ok' : 'no');
          else if (!hit && v === item.key) g.gap.classList.add('reveal');
        });
      }
      bird.classList.add(hit ? 'ok' : 'no');
      /* a right gap is a point, counted by the runner; a wrong gap — or the clock running out on one —
         is no point and nothing else. The only thing that costs a heart here is flying into the wall. */
      if (hit) r.hud();
    }
    return {
      show: show, mark: mark, clear: clear, flap: flap, reset: reset,
      lives: function () { return left; }
    };
  };
  /* this game has no timer: the wall coming at the bird is the clock, and a deadline on top of it would
     be a second thing to watch */
  PLUGINS.flapGate.noTimer = true;


  /* ---------------- skeetRange: one flying target per option, a fixed number of shots ----------------
     Each option's disc is thrown from off the left edge and flies away past the right edge, and every
     disc takes the SAME line: one arc, no wobble, no sine wave. Where each disc starts and how fast it
     crosses are rolled by 5% each, so the rack is never twice the same picture while the lanes still
     say which word is where.
     The AMMO is the run, not the item: you get one shot per item (`data-rounds`/list length), the pips
     in the top-left corner are the shots still in hand, and when the last shot is fired — hit, miss or
     a click on the sky — the run is over and the score is the targets hit. Nothing comes back for a
     second try inside the run (a miss is spent); whether the RUN itself may be replayed is `data-retry`
     — on by default for training, `0` for the block that is the page's quiz.
     The range runs 30% slower than the block's own deadline (PLUGINS.skeetRange.timeScale), because a
     word flying past is a word nobody reads: the discs and the clock slow together, so the shot rule is
     unchanged and simply has more time in it.
     The two sounds are recorded, not synthesized, because the verdicts are different things: the GUN
     goes off on every shot, and the BUZZER says the shot was wrong — on the wrong disc and on a shot at
     nothing at all, where it plays UNDER the gun. There is no crowd. The files are listed in SFX (see
     CLIPS) and the range plays its own, so the runner's generic pair is switched off for it
     (PLUGINS.skeetRange.ownSound).
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
    var raf = 0, live = false, t0 = 0, discs = [], spent = false, cur = null;
    /* the AMMO: one shot per item, so a run of six questions is six shots and the range never resets
       a shot back into the gun. The cartridges are the block's own count of shots still in hand. */
    var ammoEl = el('div', 'g4-ammo'), ammo = 0, ammoTop = 0;
    box.appendChild(ammoEl);
    function drawAmmo() {
      var html = '';
      for (var i = 0; i < ammoTop; i++) html += '<span class="g4-shot' + (i < ammo ? ' full' : '') + '"></span>';
      ammoEl.innerHTML = html;
      ammoEl.classList[ammo ? 'remove' : 'add']('empty');
      ammoEl.setAttribute('aria-label', ammo + ' of ' + ammoTop + ' shots left');
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
      /* THE SOUND IS THE VERDICT: a shot was fired either way, so the GUN goes off either way — and
         when the disc was the wrong one, or nothing was hit at all, the buzzer says so underneath it.
         There are two verdicts, not three: a miss and a wrong disc cost the same thing and sound the
         same. */
      SFX.shot(r.sound);
      if (value == null || !cur || value !== cur.key) SFX.wrong(r.sound);
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
      cur = item;
      /* the lesson decides how many targets there are — one per option, 2 to 6 (CONTENT_EXAMPLES.md
         §`skeetRange`) — and a seventh is dropped rather than piled onto the rack */
      var opts = item.opts.slice(0, 6);
      var n = Math.max(1, opts.length);
      var flight = throwTime();
      /* THE RACK IS THE WAY IT WAS (qa/NOTES.md 31: the discs were spread far too much and the owner
         asked for the old positioning back): every disc enters at the left edge, a few px apart, on the
         lanes the options decide. */
      opts.forEach(function (o, i) {
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
  /* the range plays its own two sounds — the gun on every shot, the buzzer (at half level) only when the
     shot was wrong or hit nothing — so the runner's generic pair would be a second verdict on top of each
     shot. There is no crowd sound. */
  PLUGINS.skeetRange.ownSound = true;

  /* ---------------- mineGrid: open the saloon door you trust ----------------
     ONE building, four doorways: a rustic timber frontage runs behind the doors with a painted SALOON
     board on it, so the four doors read as entrances to one saloon rather than four kiosks. Each option
     is a pair of batwing doors in its own opening, and its word hangs over the top where it can be read
     — the card's BOTTOM edge is pinned to the TOP of its doorway, so the words line up with the doors
     they belong to however tall the doors are.
     The building fills about three quarters of the stage, is shifted right together with the doors, and
     the question is a board on the LEFT of the doors, drawn by this game (ownsPrompt) so the runner does
     not print the same sentence a second time on the HUD line.
     Picking a door is the answer: he WALKS to it and stands in front of it, and the door swings open
     before anything is decided, because what is behind it IS the answer.
       right  he goes in — the step through the door and his fade run as ONE movement — a glass clinks on
              the bar, the street fades out, and the next question fades in on an empty street.
       wrong  a snake comes out of the dark and bites him: one of his three lives gone, and he ends every
              bite the same way — down on the spot he is standing on, then out of sight. He never snaps
              back to the middle of the road between questions; the street coming back brings him back.
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
    var facade = el('div', 'g4-facade');        /* the saloon itself: one frontage behind every door */
    /* the built parts of the frontage CSS alone has no pseudo-element left for: the cornice under the
       eave, and a window either side of the porch. Background, never controls. */
    facade.innerHTML = '<span class="g4-cornice"></span>'
      + '<span class="g4-saloon-win a"></span><span class="g4-saloon-win b"></span>';
    var road = el('div', 'g4-road'), doors = el('div', 'g4-doors'), tiles = [];
    var ask = el('div', 'g4-mprompt');          /* the question, on its own board to the left of the doors */
    var hero = el('div', 'g4-runner');
    var flash = el('div', 'g4-flash');          /* the screen flash a snake bite throws */
    hero.innerHTML = ART.hero;
    street.appendChild(facade); street.appendChild(road); street.appendChild(doors);
    street.appendChild(ask); street.appendChild(hero);
    box.appendChild(street); box.appendChild(flash);
    stage.appendChild(box);
    var left = 3, busy = false, picked = null, dx = 0;

    /* a restart begins with three lives: run state, so the runner resets it on start — and the question
       board goes blank, because the last run's question is not this run's */
    function reset() { left = 3; ask.classList.remove('in'); ask.textContent = ''; }
    function clear() {
      /* the street is emptied between items — the LIVES are not: they were paid for. The question board
         goes too: it is this game's own prompt card, and a card left standing is the intro screen asking a
         question nobody has been given. `show` puts it back with the next item. */
      doors.innerHTML = ''; tiles = []; busy = false; picked = null; dx = 0;
      ask.classList.remove('in');
      hero.innerHTML = left < 2 ? ART.heroHurt : ART.hero;
      hero.classList.remove('enter', 'bitten', 'down', 'gone');
      hero.style.transform = 'translate(0,0)';
      hero.style.setProperty('--dx', '0px');
    }
    /* he stands in front of the door he picked: the walk is the choice being made, and his own x is
       what the `down` state reads, so a fighter who goes down goes down where he stood */
    function walkTo(d) {
      var hb = box.getBoundingClientRect(), db = d.getBoundingClientRect();
      dx = Math.round((db.left + db.width / 2) - (hb.left + hb.width / 2));
      hero.style.transform = 'translate(' + dx + 'px,0)';
      hero.style.setProperty('--dx', dx + 'px');
    }
    /* he goes in: the step through the doorway and the fade are one movement, then the answer is taken
       so the radio is written by the runner. The street itself NEVER leaves the stage (qa/NOTES.md 76,
       "make the graphics not disappear and reappear at the beginning of each round"): the held beat is
       the door closing behind him, not the frontage fading out and back in. */
    function goIn(d, value) {
      d.classList.add('ok');
      SFX.clink(r.sound);
      hero.classList.add('enter');
      r.later(function () { if (r.phase === 'play') r.pick(value); }, r.reduced ? 80 : 640);
    }
    /* the snake: it comes out of the dark, he takes the bite, and the choice still counts as his.
       EVERY bite ends the same way, not only the last one: he reels where he stands, he goes down at the
       door he chose (never back in the middle of the road), and he is gone before the next question
       arrives. The street fading back in is what brings him back. */
    function bitten(d, value) {
      d.classList.add('bitten', 'no');
      SFX.hiss(r.sound);
      hero.classList.add('bitten');
      /* the whole street flashes — the sting is the screen, not the sprite, and he stays where he is */
      flash.classList.remove('on');
      void flash.offsetWidth;
      if (!r.reduced) flash.classList.add('on');
      r.later(function () { if (r.phase === 'play') hero.classList.add('down'); }, r.reduced ? 20 : 300);
      r.later(function () { if (r.phase === 'play') hero.classList.add('gone'); }, r.reduced ? 40 : 640);
      r.later(function () { if (r.phase === 'play') r.pick(value); }, r.reduced ? 80 : 820);
    }
    function show(item) {
      clear();
      /* THE FRONTAGE DOES NOT BLINK BACK: the next question changes the doors under a street that never
         left the stage, so no fade-in is played over it. */
      street.classList.remove('away', 'settle');
      /* the question is drawn by THIS game, on its board to the LEFT of the doors, so the runner leaves
         the HUD line empty (ownsPrompt): the same sentence in two places is the same sentence twice */
      if (r.usePrompt) { ask.textContent = item.prompt || ''; ask.classList.add('in'); }
      item.opts.forEach(function (o) {
        var d = el('button', 'g4-door');
        d.type = 'button';
        d.setAttribute('data-v', o.value);
        /* the word is a child of the DOORWAY, so its bottom edge sits on the doorway's top edge by
           construction and no change of door height can separate a word from its door */
        d.innerHTML = '<span class="g4-dframe" aria-hidden="true">'
          + '<span class="g4-doorsign">' + esc(o.text) + '</span>'
          + '<span class="g4-dhole"></span>'
          + '<span class="g4-dleaf left">' + ART.saloonLeaf + '</span>'
          + '<span class="g4-dleaf right">' + ART.saloonLeaf + '</span>'
          + '<span class="g4-djamb">' + ART.saloonFrame + '</span>'
          + '<span class="g4-snake">' + ART.snake + '</span>'
          + '</span>';
        d.addEventListener('click', function () {
          if (r.phase !== 'play' || busy) return;
          busy = true; picked = d;
          walkTo(d);
          r.later(function () { d.classList.add('open'); }, r.reduced ? 0 : 260);
          r.later(function () {
            if (o.value === item.key) goIn(d, o.value); else bitten(d, o.value);
          }, r.reduced ? 60 : 620);
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
    return { show: show, mark: mark, clear: clear, reset: reset, ownsPrompt: true, lives: function () { return left; } };
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
     The score COUNTS UP: it is the words actually spelled right, out of the block's own answers, and a
     word that is not got (all rows used, the clock spent, or the game moving on) simply never adds one.
     Missing a word costs a LIFE instead: two of them (`data-lives`, default 2) and the run is over at
     zero — the runner's one fail condition, not the board's own. */
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
      /* ONE number per square, not per word: an across word and a down word that begin in the same
         square are the same clue number on a printed crossword, and two numbers stacked in one cell is
         just a smudge. So the number is handed out to the CELL, and both words read it back. */
      var numbered = {}, n = 0;
      words.slice().sort(function (a, b) { return a.r - b.r || a.c - b.c; })
        .forEach(function (w) {
          var k = w.r + ',' + w.c;
          if (numbered[k] == null) { n++; numbered[k] = n; }
          w.num = numbered[k];
        });
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
      var drawn = {};
      words.forEach(function (w) {
        var key = w.r + ',' + w.c, inp = inputs[key];
        /* one number per cell: a word that starts in a square already numbered shares that number */
        if (!inp || drawn[key]) return;
        drawn[key] = true;
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

    /* THERE ARE NO WRONG ANSWERS ON THIS BOARD (qa/NOTES.md 72). A full word typed wrongly is not a miss
       and is not answered: the letters stay exactly where the student put them, nothing is scored, and
       they keep at it until the word goes green. A right word is a POINT, and five of them wins the board;
       a board that never reaches five simply stays open with whatever it has, because this game has no
       clock and no lives, so nothing can expire under it. */
    function check() {
      if (r.phase !== 'play') return;
      words.forEach(function (w) {
        if (w.solved) return;
        var list = cellsOf(w);
        if (list.length !== w.w.length) return;
        if (list.some(function (c) { return !c.value; })) return;
        var typed = list.map(function (c) { return c.value.toLowerCase(); }).join('');
        if (typed !== w.w) return;                 /* wrong letters do nothing at all */
        w.solved = true;
        list.forEach(function (c) { c.classList.add('ok'); c.readOnly = true; });
        r.scoreBoard(w.it, w.it.key);
        if ((r.score || 0) >= 5) {
          flash('Board complete — ' + (r.score || 0) + ' points!');
          r.later(function () { if (r.phase === 'play') r.finish(); }, 950);
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
     THE ITEMS ARE NEVER SHUFFLED (`PLUGINS.echoPads.noShuffle`): the order of the `.qitem`s IS the
     sentence, so a shuffled queue reads the words in the wrong order and the sentence becomes the
     nonsense this game exists to prevent. The options are still one word that fits and three near
     misses, so nothing is given away by keeping the order.
     A right pad puts the word in the sentence, answers that item, and moves on. A wrong pad costs one
     LIFE and does NOT move on: the student tries again until that word is right, because the sentence
     cannot continue with a word that does not fit.
     The score COUNTS UP — the words placed, out of the sentence's own words — and it is the HUD pair,
     `got/total`. LIVES are separate and are the row of hearts: `data-lives` of them (3), one gone per
     wrong word, and the last one is the end of the run. At zero the score on the board is the final
     score: nothing is taken back and nothing is replayed.
     Authoring: `data-first` the given opening, `data-lives` the lives (3), one `.qitem` per word
     of the sentence, `data-a` the word that fits, three near misses in the options. The sentence has to
     be sensible from the given opening to the last pad, and each item has exactly ONE answer that could
     plausibly follow what is already on the board: a pad that also fits is a broken item, because the
     student who reads the sentence is the one who gets it wrong.
     THE THREE NEAR MISSES ARE WRITTEN IN A SECOND PASS, per item, against the words placed BEFORE it
     (never after), and each candidate is TESTED by substituting it into that context and reading the
     result: a candidate that still reads as a possible continuation is rejected and replaced. No script
     can do that test — only a reader can — so it is a rule of authoring, not a check. The shape is
     mechanical and must hold too: four pads per item, each a single word, none repeated within its
     item, and one item per word after `data-first`.
     `data-time` does not apply: a board you fill at your own pace. */
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

    var queue = [], at = 0, parts = [], given = '', lives = 3, top = 3, busy = false;
    /* TWO DIFFICULTY LEVELS, decided by the lesson the block is on and never shown to the student
       (qa/NOTES.md 53): `data-level` on the block wins, else the page's own L, and a lesson numbered 20
       or above is level 2. LEVEL 1 is the game as it always was. LEVEL 2 HAS NO HINT AT ALL — the word
       that fits has to be read off the sentence, not off a card — and its items must then hold nothing
       that could be put there: every other pad is impossible in that position, not merely unlikely
       (qa/NOTES.md 54, an authoring rule this engine cannot test). */
    function level() {
      var d = parseInt(r.root.getAttribute('data-level'), 10);
      if (!isNaN(d)) return d;
      try { return typeof L === 'number' ? L : 0; } catch (e) { return 0; }
    }
    function hard() { return level() >= 20; }
    /* the prompt card belongs to a RUN: it is not on the stage before the game starts (qa/NOTES.md 52) */
    box.className += ' off';

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
      top = Math.max(1, num(r.root, 'data-lives', 3));
      lives = top;
      hint.textContent = '';
      pads.innerHTML = '';
      box.classList.remove('off');
      paint();
    }
    /* one item at a time, in the sentence's own order: the pads are the words that could follow */
    function showItem() {
      var it = queue[at];
      paint();
      pads.innerHTML = '';
      if (!it) return;
      hint.textContent = hard() ? '' : (it.prompt && it.prompt !== '·' ? it.prompt : 'Next word:');
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
        /* one life gone, and the same word is still owed: the sentence cannot move on past it */
        lives = Math.max(0, lives - 1);
        r.hud();
        pad.classList.remove('no');
        void pad.offsetWidth;
        pad.classList.add('no');
        hint.textContent = hard() ? '' : 'Not that one — ' + lives + ' ' + (lives === 1 ? 'life' : 'lives')
          + ' left. Try the word that fits "' + sentence() + '".';
        if (!lives) {
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
      lives: function () { return lives; }, ownsPrompt: true
    };
  };

  /* the sentence is read from its first word to its last: shuffling the items shuffles the WORDS, and a
     shuffled sentence is exactly the nonsense this game is here to teach against. The order IS the
     content, so this one presentation turns the shuffle off rather than fighting it. */
  PLUGINS.echoPads.noShuffle = true;
/* the start card's own line (see the runner's `startText`): the level-2 warning, which is the game's
   whole demand — read the sentence instead of trusting a similar-looking word (qa/NOTES.md 55) */
PLUGINS.echoPads.startText = 'Build a sentence - Dont get distracted by similar words!';

  /* ---------------- bingoCard: the caller says it once, then the curtain opens ----------------
     One item per call. The card is covered by a theatre curtain and it is DEAD CENTRE of the stage at
     every moment: the grid is one fixed box, centred in a column, so the deadline card beside it cannot
     push it off centre and the card never re-measures between items. The grid takes the stage's own
     width (up to 840px) — twice the box it had — so a tile is a readable word plaque, and it shrinks
     rather than overflowing on a narrow screen.
     A ROUND IS STARTED, NOT ARRIVED AT: 15px under the grid sits 'Begin Round — Hear Word'. Nothing is
     said until it is pressed, and pressing it says the word ONCE and starts the count — so the one
     chance at the word is a decision the student made rather than a sound that arrived while they were
     still reading the tiles. The button is dead for the rest of that round and comes back for the next.
     Two countdowns run the item, each where it belongs:
       on the curtain  3 · 2 · 1 — dead centre over the velvet, because it belongs to the card it is about
              to uncover, and the curtain rises when it reaches zero
       right   5 · 4 · 3 · 2 · 1 — 30px to the right of the grid, on the grid's own middle line, and only
              while the card is open. It reaches zero and the curtain FALLS, which is the item's deadline:
              the word is marked wrong and the point it was worth is gone.
     A stamp answers the item there and then and stops the deadline countdown. What was said is
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
    /* the round's own start, 15px under the grid: the word is not said until this is pressed, so the one
       chance at it is a decision the student made. Pressing it says the word ONCE and starts 3 · 2 · 1. */
    var begin = el('button', 'g4-begin', 'Begin Round — Hear Word');
    begin.type = 'button';
    /* the lead-in count lives ON the curtain and inside the card's own box, so "dead centre" is the
       card's centre and not the stage's; the deadline sits outside, 30px off the grid's right edge */
    wrap.appendChild(card); wrap.appendChild(curtain); wrap.appendChild(lead);
    box.appendChild(wrap); box.appendChild(begin); box.appendChild(rush);
    stage.appendChild(box);
    var tiles = [], phrase = '', open = false, said = false, gen = 0, armed = 'off';
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
      armed = 'off';
      begin.disabled = true;
      begin.textContent = 'Begin Round — Hear Word';
      box.classList.remove('open');
      lead.textContent = ''; rush.textContent = '';
      lead.classList.remove('pop'); rush.classList.remove('pop');
    }
    /* the deadline card sits 30px to the RIGHT of the grid's own right edge, on the grid's middle line.
       It is measured off the grid rather than guessed, because the grid takes the stage's width; the
       layout itself never moves, so this is a placement, not a thing that happens between items. */
    function placeRush() {
      var gb = wrap.getBoundingClientRect(), bb = box.getBoundingClientRect();
      rush.style.left = Math.round(gb.right - bb.left + 30) + 'px';
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
        /* the card is up: SEVEN seconds to stamp it (qa/NOTES.md 43), then the curtain falls on the item */
        tick(rush, 7, function () {
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
      placeRush();
      /* the round is ARMED, not running: the word is said when Begin is pressed, and not before.
         The label names the round it starts (qa/NOTES.md 45-46), read off the run's own progress so a
         restart begins again at the start label instead of counting on from the last attempt. */
      armed = 'ready';
      begin.disabled = false;
      begin.textContent = r.answered
        ? 'Next Round! - Listen to the Target Word'
        : 'Start Game - Listen to the Target Word';
    }
    /* Begin: the word is said ONCE, the button goes quiet for the round, and 3 · 2 · 1 starts over the
       curtain. A second press cannot happen — the button is disabled for the rest of the item. */
    begin.addEventListener('click', function () {
      if (r.phase !== 'play' || armed !== 'ready') return;
      armed = 'run';
      begin.disabled = true;
      begin.textContent = 'Listen…';
      if (phrase && !said) { said = true; say(phrase); }
      countdown();
    });
    function mark(item, hit, value) {
      tiles.forEach(function (t) {
        if (t.getAttribute('data-v') !== value) return;
        t.classList.add(hit ? 'ok' : 'no');
      });
    }
    /* the prompt is CLAIMED and left empty: the stem is the word "listen" and the caller already says that
       word, so a card at the top would be the instruction printed over a word nobody reads */
    return { show: show, mark: mark, clear: clear, ownsPrompt: true };
  };


  /* ---------------- ladderRun: climb the ladder, one rung per right answer ----------------
     The ladder rises to the PROMPT, not to a prize: the item's own stem is a board at the top of the
     rail, so what the student climbs toward is the question itself. One right answer is one rung of
     distance, out of as many rungs as the run has items — the same pair the HUD shows, climbed/run.
     A wrong answer keeps what was safely earned: the climber slides back to the last safe rung, every
     fifth, which is what makes a ladder a ladder and not a list. A rung only ever comes from a right
     answer, so he reaches the top only when every answer was right.
     TWO ENDINGS, and the run's own answers decide which (qa/NOTES.md 65). The graffiti is gone:
       every answer right   he climbs on top of the prompt card, walks to its centre, and THROWS MONEY out
                            — the notes fall and land on the answer cards below;
       a point missed       a dog runs past and knocks the ladder over, and the ladder and the climber both
                            go down with it.
     A rising motif per rung, so height can be HEARD. */
  PLUGINS.ladderRun = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-ladder'), track = el('div', 'g4-ltrack');
    var rail = el('div', 'g4-rail'), climber = el('div', 'g4-lclimber');
    var board = el('div', 'g4-lprompt'), boardT = el('span', 'g4-lprompt-t');
    var opts = el('div', 'g4-raceopts');
    board.appendChild(boardT);
    climber.innerHTML = ART.climber;
    track.appendChild(rail); track.appendChild(board); track.appendChild(climber);
    box.appendChild(track); box.appendChild(opts);
    stage.appendChild(box);
    var built = 0, climb = 0, safe = 0, ended = false;
    function safeOf(n) { return Math.floor(n / 5) * 5; }
    function build() {
      if (built === r.total) return;
      built = r.total;
      rail.innerHTML = ART.ladder(Math.max(3, r.total), 5);
      step(0, true);
    }
    /* one rung up is one move toward the board: his head finishes level with its bottom edge, so the
       last rung is him standing at the question. Measured in the track's own pixels — a percentage of a
       box whose height only exists at run time cannot put him at the top */
    function step(n, quiet) {
      climb = Math.max(0, Math.min(r.total, n));
      var room = Math.max(0, (track.clientHeight || 200) - 48);
      climber.style.bottom = ((r.total ? climb / r.total : 0) * room).toFixed(1) + 'px';
      climber.classList.toggle('at-top', climb >= r.total);
      if (climb >= r.total && !quiet) jackpot();
    }
    function reset() {
      climb = 0; safe = 0; built = 0; ended = false;
      boardT.textContent = '';
      opts.innerHTML = '';
      climber.style.bottom = '0px';
      climber.style.left = '30px';
      climber.classList.remove('at-top', 'oncard', 'walking', 'toppled');
      rail.classList.remove('toppled');
      [].slice.call(box.querySelectorAll('.g4-cash, .g4-dog')).forEach(function (n) {
        if (n.parentNode) n.parentNode.removeChild(n);
      });
    }
    function clear() { opts.innerHTML = ''; }
    function show(item) {
      build();
      boardT.textContent = item.prompt || '';
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
      /* the run is over on the last item. Every answer right has already started the money finish from
         step(); a point missed is the dog's turn (qa/NOTES.md 65). */
      if (r.queue.length <= 1 && climb < r.total) dogWreck();
    }
    /* THE MONEY FINISH (qa/NOTES.md 65): he climbs onto the prompt card, walks along it to its centre,
       and throws the notes out of his hand — each one falls and lands on an answer card below. */
    function jackpot() {
      if (ended) return;
      ended = true;
      SFX.blip(r.sound, 940, 220);
      var t = track.getBoundingClientRect(), b = board.getBoundingClientRect();
      var onTop = Math.max(0, (track.clientHeight || 200) - (b.top - t.top) + 2);
      climber.classList.add('oncard');
      climber.style.left = Math.max(4, b.left - t.left + 4) + 'px';   /* up the face of the card */
      climber.style.bottom = onTop + 'px';
      r.later(function () {
        climber.classList.add('walking');
        /* along the top of the card to its centre, where he stands to throw */
        climber.style.left = Math.max(4, b.left - t.left + b.width / 2 - 17) + 'px';
      }, r.reduced ? 40 : 460);
      var notes = Math.max(4, Math.min(10, r.total * 2));
      for (var i = 0; i < notes; i++) {
        r.later(throwNote, (r.reduced ? 80 : 1000) + i * (r.reduced ? 110 : 280));
      }
      r.later(function () { climber.classList.remove('walking'); }, (r.reduced ? 260 : 1500));
    }
    /* one note, out of his hand and down onto an answer card, where it stays */
    function throwNote() {
      var cards = [].slice.call(opts.querySelectorAll('.g4-raceopt'));
      if (!cards.length) return;
      var target = cards[Math.floor(Math.random() * cards.length)];
      var bb = box.getBoundingClientRect(), cb = climber.getBoundingClientRect();
      var tb = target.getBoundingClientRect();
      var x0 = cb.left - bb.left + cb.width / 2, y0 = cb.top - bb.top;
      var note = el('div', 'g4-cash', ART.cash);
      note.style.left = x0 + 'px';
      note.style.top = y0 + 'px';
      note.style.setProperty('--dx', Math.round((tb.left - bb.left + tb.width * (0.2 + Math.random() * 0.6)) - x0) + 'px');
      note.style.setProperty('--dy', Math.round((tb.top - bb.top + tb.height * 0.3) - y0) + 'px');
      note.style.setProperty('--rot', Math.round(-260 - Math.random() * 240) + 'deg');
      box.appendChild(note);
      void note.offsetWidth;
      note.classList.add('fall');
    }
    /* THE DOG FINISH (qa/NOTES.md 65): a point was missed, so a dog runs past, knocks the ladder over,
       and the ladder and the climber both go down with it. */
    function dogWreck() {
      if (ended) return;
      ended = true;
      var w = box.clientWidth || 480;
      var dog = el('div', 'g4-dog', ART.dog);
      dog.style.transform = 'translateX(' + (w + 80) + 'px)';
      box.appendChild(dog);
      void dog.offsetWidth;
      dog.classList.add('running');
      dog.style.transition = 'transform ' + (r.reduced ? 220 : 950) + 'ms linear';
      dog.style.transform = 'translateX(' + Math.round(Math.max(120, w * 0.30)) + 'px)';
      r.later(function () {
        dog.classList.remove('running');
        rail.classList.add('toppled');
        climber.classList.add('toppled');
        SFX.crash(r.sound);
      }, r.reduced ? 240 : 950);
      r.later(function () {
        dog.style.transition = 'transform 700ms linear';
        dog.style.transform = 'translateX(-140px)';
      }, r.reduced ? 500 : 1700);
    }
    return { show: show, mark: mark, clear: clear, reset: reset, ownsPrompt: true };
  };
  /* the start card's own line, because the finish is this game's (see the runner's `startText`) */
  PLUGINS.ladderRun.startText = 'Get all the phrases right, climb to the top and get your Trump Ca$h!';



  /* ---------------- bossRaid: pick a fighter, and every answer is that fighter's attack ----------------
     The student chooses a fighter on the intro card — sword, wizard, archer — and the choice is not
     decoration: it decides HOW the right answer lands. The sword fighter steps in and cuts, the wizard
     throws a fireball that bursts on the boss, the archer's arrow flies straight and fast. So the
     correct answer is visibly thrown by the character the student made, which is the whole appeal of a
     fight game.
     A wrong answer is the boss's turn, and the boss always answers the same way: it SPITS ACID — a
     drop that travels across the arena and bursts on the fighter in a green splash. One attack, read
     once, so a wrong answer is never confusing and never takes two different shapes. Three hits taken
     and the fighter goes down, so a long drill has an ending that belongs to the answers, not to a
     timer.
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
    var fighter = 'sword', lives = 3, pickBtns = {}, hits = 0, need = 1;

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

    /* the boss's health is `need` (= total questions − 2) hits: the bar is those hits LEFT, counting DOWN
       as the fighter lands them, and an empty bar is the boss dead — the bar is the fight's own clock, not a
       mirror of the score */
    function drawHud() {
      var hp = need ? 1 - hits / need : 0;
      hpFill.style.width = Math.max(0, Math.round(Math.max(0, hp) * 100)) + '%';
    }
    function clear() {
      opts.innerHTML = ''; shots.innerHTML = '';
      hero.classList.remove('recoil', 'hurt');
      art.classList.remove('hurt');
      drawHud();
    }
    /* a restart begins with a whole boss: lives are run state, so the runner resets them on start */
    function reset() {
      lives = 3;
      hits = 0;
      need = Math.max(1, r.total - 2);
      hero.classList.remove('down', 'recoil', 'hurt', 'charge');
      art.classList.remove('hurt', 'down');
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
    /* the acid's splash: the green the drop was carrying, thrown outward off the body it hit.
       Its own class names — catchBasket already owns `.g4-splash`, `.g4-drop` and `g4splash`, and the
       later @keyframes of a shared name would have replaced this one outright */
    function splash(x, y) {
      var s = el('div', 'g4-acid-splash');
      s.style.left = x + 'px'; s.style.top = y + 'px';
      for (var i = 0; i < 7; i++) {
        var d = el('span', 'g4-acid-drop'), a = (i / 7) * Math.PI * 2, r = 14 + (i % 3) * 9;
        d.style.setProperty('--dx', Math.round(Math.cos(a) * r) + 'px');
        d.style.setProperty('--dy', Math.round(Math.sin(a) * r) + 'px');
        d.style.setProperty('--sz', (i % 3 === 0 ? 1.3 : 0.85) + '');
        s.appendChild(d);
      }
      arena.appendChild(s);
      r.later(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 620);
    }
    /* a right answer: the fighter's own attack, drawn across the arena it crosses */
    function attack() {
      var f = FIGHTERS[fighter], from = centre(hero), to = centre(art);
      if (f.at === 'cut') {
        /* he RUNS to the boss, cuts at close range and runs back: the run is the distance between the
           two of them, not a fixed nudge, so the sword lands on the body it was aimed at */
        hero.style.setProperty('--run', Math.max(40, Math.round(to.x - from.x - 30)) + 'px');
        hero.classList.add('charge');
        r.later(function () {
          var s = el('div', 'g4-slash');
          s.style.left = to.x + 'px'; s.style.top = to.y + 'px';
          arena.appendChild(s);
          SFX.tone(f.hz, 120, 'square', 0.05);
          hurtBoss();
          r.later(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 440);
        }, r.reduced ? 20 : 300);
        r.later(function () { hero.classList.remove('charge'); }, r.reduced ? 60 : 640);
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
    /* a wrong answer: the boss always spits — the drop travels, and it lands in a green splash */
    function bossTurn() {
      var from = centre(art), to = centre(hero);
      var p = el('div', 'g4-proj spit');
      p.innerHTML = ART.acid;
      p.style.left = from.x + 'px'; p.style.top = from.y + 'px';
      arena.appendChild(p);
      void p.offsetWidth;
      p.style.transform = 'translate(' + Math.round(to.x - from.x) + 'px,'
        + Math.round(to.y - from.y) + 'px)';
      SFX.tone(300, 90, 'triangle', 0.05);
      r.later(function () {
        p.classList.add('burst');
        splash(to.x, to.y);
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
        hits++;
        drawHud();
        if (hits >= need) {
          /* `need` hits and the boss is dead: the fight is won there, even if the item list has more. Marking
             the run dead lets the runner's own post-answer step CLOSE it (resolve finishes instead of
             stepping to the next item), so no next question flashes past after the boss falls. */
          art.classList.add('down');
          r.dead = true;
        }
      } else {
        /* a hit costs a LIFE, never a point: the score only ever counts the hits that landed, so a wrong
           answer takes a heart and leaves the score exactly where it was. */
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
  /* bossRaid opts into the runner's generic hide-the-score switch: its score counts the hits that landed
     and the student must not read it mid-fight. The switch is not bossRaid-specific — ANY presentation can
     hide its HUD score card the same way, by setting `PLUGINS.<game>.hideScoreLive = true`; the runner
     hides the whole score card for that game while a run is live and prints the run's number on the end
     card like every other game. Enabling it elsewhere is this one line. */
  PLUGINS.bossRaid.hideScoreLive = true;


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

  /* ---------------- the yard: adjective order on rails ----------------
     Eight adjective slots are fixed by the language, so trainOrder always stands eight cars on the
     rails and the verdict is GEOMETRY: every roof is level (a car further back is 6px shorter and
     lifted 6px, so its OPENING is 6px less room) while a word grows to the room its OWN slot leaves.
     A word put a car too far back therefore stands up through the deck and bursts; a word put too
     far forward leaves a gap — the crash is not symmetric, and only the back is fatal. */
  var SLOTS = ['opinion', 'size', 'age', 'shape', 'color', 'origin', 'material', 'purpose'];
  var CAR0 = 122, CAR_LIFT = 6, OPEN0 = 100;
  /* the height an adjective stands at on its OWN car. It only grows when the car is further back than its
     slot allows: a load needing more room than the deck gives is visibly too tall for the car it stands in,
     and the taller it is the later the car — the error, made visible at the moment of loading. */
  var CARDH = 26, CARD_RISE = 9;

  function yardGame(r) {
    function tag(cls, text) { var n = el('div', cls); if (text != null) n.textContent = text; return n; }

    var yard = tag('g4-yard');
    /* a sky above and hills in the distance, so the yard is a place on the ground rather than a beige
       field (qa/NOTES.md 89) */
    var mts = tag('g4-tmount'); mts.innerHTML = ART.mountains;
    yard.appendChild(tag('g4-tsky'));
    yard.appendChild(mts);
    ['g4-tground', 'g4-tplat', 'g4-tsleep', 'g4-trail'].forEach(function (c) { yard.appendChild(tag(c)); });
    var bridge = tag('g4-tbridge');
    ['g4-tgirder', 'g4-tdeck', 'g4-tabut'].forEach(function (c) { bridge.appendChild(tag(c)); });
    bridge.appendChild(tag('g4-tsignl', '\u26a0 LOW BRIDGE'));
    var planksBox = tag('g4-tplanks'), planks = [];
    for (var p = 0; p < 3; p++) { var pl = tag('g4-tplank'); planksBox.appendChild(pl); planks.push(pl); }
    bridge.appendChild(planksBox);
    bridge.appendChild(tag('g4-tbrk'));
    yard.appendChild(bridge);
    var train = tag('g4-ttrain');
    yard.appendChild(train);
    /* the crew's own row in the yard, OUTSIDE the train's box, so the train can leave without them */
    var crew = tag('g4-tcrew');
    yard.appendChild(crew);
    var dock = tag('g4-tdock');
    yard.appendChild(dock);
    var stamp = tag('g4-tstamp');
    yard.appendChild(stamp);
    r.stage.appendChild(yard);

    var cars = [], guys = [], words = [], picked = null, wrongs = 0, burstCar = -1, placed = 0;
    /* `given` is the cards the crew is holding: one entry per card already handed to a man, each waiting for
       the toss onto the wagon in front of him. `placed` counts the cards that have LANDED on a deck. */
    var given = [];
    /* how many cards this train puts out (= its cars, capped at eight) */
    var need = 0;
    var lives = 2, done = false, busy = false, built = false;
    /* the slot each car carries, in slot order — one entry per car (see build) */
    var slotOf = [];

    /* THE TRAINS: `data-train` groups the words of one sentence, and its absence is the first train. */
    var trains = [];
    (function group() {
      var cur = null;
      r.items.forEach(function (it, i) {
        var g = it.el.getAttribute('data-train') || '';
        if (!cur || cur.key !== g) { cur = { key: g, items: [] }; trains.push(cur); }
        cur.items.push({ it: it, i: i, home: SLOTS.indexOf(it.key) });
        if (cur.items[cur.items.length - 1].home < 0) cur.items[cur.items.length - 1].home = 0;
      });
      if (!trains.length) trains.push({ key: '', items: [] });
    })();
    var ti = 0;

    function build() {
      train.innerHTML = '';
      /* THE LOCOMOTIVE: a drawn side view (ART.engine) rather than a stack of boxes — the boxes were what
         the owner read as a terrible caboose. */
      var loco = tag('g4-tloco');
      loco.innerHTML = ART.engine;
      train.appendChild(loco);
      /* ONE CAR PER ADJECTIVE (qa/NOTES.md 89-108): the block's own word count decides the train's length,
         two to eight, so a lesson at an early level runs a short train and a later one a long one. The
         cars are ordered by the slot each word belongs to, so the front car is the earliest slot in this
         train's own set — two words that share a slot get two cars, and either of them is the right place
         for both. A word's `home` is therefore a SLOT, and `slotOf[k]` is the slot the k-th car stands for. */
      var list = trains[ti].items.slice(0, 8);
      var order = list.slice().sort(function (a, b) { return a.home - b.home; });
      slotOf = order.map(function (w) { return w.home; });
      var n = Math.max(1, order.length);
      /* the train is CENTRED and its length is the lesson's own: one geometry for however many adjectives */
      trainGeom(yard, n);
      cars = [];
      for (var k = 0; k < n; k++) {
        var car = tag('g4-tcar');
        car.style.left = (k * 100 / n) + '%';
        car.style.width = 'calc(' + (100 / n) + '% - 4px)';
        var body = tag('g4-tbody');
        body.appendChild(tag('g4-tdeckbed'));
        car.appendChild(body);
        var wh = tag('g4-twheels');
        wh.appendChild(tag('g4-twheel a'));
        wh.appendChild(tag('g4-twheel b'));
        car.appendChild(wh);
        train.appendChild(car);
        cars.push(car);
      }
      /* ONE LOADER PER CAR, standing in front of his flatbed with his arms out to take the adjective off the
         dock. He is the DROP TARGET (qa/NOTES.md 94-98): a card is given to a man, not to a wagon, and each
         man is placed on the pitch of the car he serves, so "the man you gave it to" and "the car in front of
         him" are the same answer — which is what he throws it onto once every card is out.
         THE CREW IS NOT PART OF THE TRAIN: it is its own row in the YARD, on the train's own left/width so the
         men stand under their cars to the pixel, but outside the train's box — so when the train pulls out
         they stay where they are, on the ground, and watch it go (qa/NOTES.md 99). */
      crew.innerHTML = '';
      guys = [];
      for (var g = 0; g < n; g++) {
        var guy = tag('g4-tguy');
        guy.innerHTML = ART.loader;
        guy.style.left = (g * 100 / n) + '%';
        guy.style.width = (100 / n) + '%';
        guy.addEventListener('click', function (k2) { return function () { handTo(k2); }; }(g));
        crew.appendChild(guy);
        guys.push(guy);
      }
    }

    /* THE DOCK: the adjectives of THIS train, one card each, in the order they were authored. A card is
       DRAGGED onto a car and the drop loads it; a tap still picks it up (the card stays up until it is
       placed), and the next tap on a car puts it there — so a mouse, a finger and a keyboard all work. */
    function buildDock() {
      dock.innerHTML = '';
      words = [];
      /* THE DOCK KEEPS THE AUTHORED ORDER: a sentence's adjectives are dressed in sentence order, and it is
         the CAR each one stands on that has to be right — a shuffled dock would only hide the words. It also
         stops at eight, the same ceiling build() puts on the cars and the crew: a ninth adjective would have
         no man to carry it and no wagon to land on. */
      var list = trains[ti].items.slice(0, 8);
      need = list.length;
      list.forEach(function (w) {
        var c = tag('g4-tword g4-tcard', w.it.prompt);
        c.addEventListener('pointerdown', function (e) { beginDrag(e, w, c); });
        dock.appendChild(c);
        words.push({ w: w, el: c });
      });
    }

    function pick(w, card) {
      if (busy || done) return;
      words.forEach(function (o) { o.el.classList.remove('on'); });
      picked = { w: w, card: card };
      card.classList.add('on');
    }

    /* DRAGGING: the pointer takes a card off the dock, a ghost follows it, and the man under it lights up.
       Releasing over a man gives him the card; releasing anywhere else leaves the word in hand (a tap on a
       card then a tap on a man is the same two steps without the drag). */
    var drag = null;
    function beginDrag(e, w, c) {
      if (busy || done) return;
      if (e && e.preventDefault) e.preventDefault();
      pick(w, c);
      drag = { w: w, card: c, x0: (e && e.clientX) || 0, y0: (e && e.clientY) || 0, ghost: null, moved: false };
      document.addEventListener('pointermove', onDragMove, true);
      document.addEventListener('pointerup', onDragUp, true);
      document.addEventListener('pointercancel', onDragUp, true);
    }
    function carAt(x, y) {
      /* THE MEN ARE THE TARGETS, and their hit box reaches a little above their heads so a drop near the deck
         still lands on the man standing under it. Each man's box is a whole car pitch wide. */
      for (var i = 0; i < guys.length; i++) {
        var b = guys[i].getBoundingClientRect();
        if (x >= b.left && x <= b.right && y >= b.top - 26 && y <= b.bottom + 10) return i;
      }
      return -1;
    }
    function onDragMove(e) {
      if (!drag) return;
      if (!drag.moved && Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        drag.ghost = drag.card.cloneNode(true);
        drag.ghost.className = 'g4-tcard g4-tghost';
        drag.ghost.style.width = (drag.card.offsetWidth || 90) + 'px';
        document.body.appendChild(drag.ghost);
        drag.card.classList.add('lifting');
      }
      drag.ghost.style.left = e.clientX + 'px';
      drag.ghost.style.top = e.clientY + 'px';
      var over = carAt(e.clientX, e.clientY);
      guys.forEach(function (g, i) { g.classList.toggle('hot', i === over); });
    }
    function onDragUp(e) {
      document.removeEventListener('pointermove', onDragMove, true);
      document.removeEventListener('pointerup', onDragUp, true);
      document.removeEventListener('pointercancel', onDragUp, true);
      if (!drag) return;
      var d = drag;
      drag = null;
      guys.forEach(function (g) { g.classList.remove('hot'); });
      if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
      d.card.classList.remove('lifting');
      if (!d.moved) return;                     /* a tap, not a drag: the word stays in hand */
      var over = carAt(e.clientX, e.clientY);
      if (over >= 0) handTo(over);
    }

    /* A CARD IS GIVEN TO A MAN (qa/NOTES.md 94-98). He takes it, holds it up in his hands, and waits: the
       wagons are only loaded once the whole crew has a card each, and then they throw them. One man holds one
       card — a second drop on a man who already has one is refused, so every wagon gets exactly one word. */
    function handTo(g) {
      if (busy || done || !picked || !guys[g]) return;
      if (guys[g].classList.contains('holding')) return;
      var w = picked.w, card = picked.card;
      picked = null;
      card.classList.remove('on');
      if (card.parentNode) card.parentNode.removeChild(card);
      var chip = tag('g4-tagrip', w.it.prompt);
      guys[g].appendChild(chip);
      guys[g].classList.add('holding');
      given.push({ w: w, k: g, chip: chip });
      if (r.sound) SFX.clank(r.sound);
      if (given.length >= need) toss();
    }

    /* EVERY CARD IS OUT: the men throw what they hold onto the wagon in front of them, one after the other
       down the line, and each card lands on its own deck where the verdict is read. */
    function toss() {
      busy = true;
      given.forEach(function (a, i) {
        r.later(function () { throwTo(a); }, r.reduced ? i * 40 : i * 140);
      });
    }
    /* one card, out of a man's hands and onto the deck in front of him */
    function throwTo(a) {
      var car = cars[a.k];
      if (!car || !a.chip.parentNode) return;
      var yb = yard.getBoundingClientRect();
      var cb = a.chip.getBoundingClientRect();
      var deck = car.querySelector('.g4-tbody').getBoundingClientRect();
      var cx = cb.left - yb.left + cb.width / 2, cy = cb.top - yb.top + cb.height / 2;
      var dx = (deck.left - yb.left + deck.width / 2) - cx;
      var dy = (deck.top - yb.top - 8) - cy;
      var fly = tag('g4-tthrow g4-tcard', a.w.it.prompt);
      fly.style.left = cx + 'px';
      fly.style.top = cy + 'px';
      fly.style.transform = 'translate(-50%,-50%)';
      yard.appendChild(fly);
      void fly.offsetWidth;
      fly.style.transition = 'transform ' + (r.reduced ? 60 : 340) + 'ms cubic-bezier(.25,.8,.4,1)';
      fly.style.transform = 'translate(-50%,-50%) translate(' + Math.round(dx) + 'px,' + Math.round(dy) + 'px) rotate(-7deg)';
      r.later(function () {
        if (fly.parentNode) fly.parentNode.removeChild(fly);
        if (a.chip.parentNode) a.chip.parentNode.removeChild(a.chip);
        if (guys[a.k]) guys[a.k].classList.remove('holding');
        land(a.w, a.k);
      }, r.reduced ? 90 : 350);
    }

    /* A CARD LANDS ON ITS DECK: the car's slot is written into the word's own radios, so the answer sheet
       records where the student put it, which is what the inquest reads back — not whether he was right. */
    function land(w, k) {
      if (done) return;
      var want = SLOTS[slotOf[k]];
      w.it.opts.forEach(function (o) {
        if (String(o.value) === want && o.radio) o.radio.checked = true;
      });
      var hit = w.home === slotOf[k];
      /* further back than its slot allows = the load needs more headroom than the deck it landed on */
      var late = slotOf[k] - w.home;
      var load = tag('g4-tload', w.it.prompt);
      load.style.height = (CARDH + (late > 0 ? Math.min(54, late * CARD_RISE) : 0)) + 'px';
      cars[k].appendChild(load);
      cars[k].classList.add('loaded');
      cars[k].classList.add(hit ? 'ok' : 'no');
      if (hit) r.score = (r.score || 0) + 1;
      /* the HUD is the live score and this game scores a card as it LANDS, not through the runner's own
         answer path — without this the card would stand at whatever it read when the train pulled in */
      if (r.hud) r.hud();
      else {
        wrongs++;
        /* ONLY A WORD TOO FAR BACK IS FATAL: its own slot allows more room than the opening it landed
           in, so it stands up through the deck and bursts where the growth ends. Too far forward leaves
           a gap instead — the crash is not symmetric, and that asymmetry is the lesson. */
        if (w.home < slotOf[k]) {
          if (burstCar < 0) burstCar = k;
          r.later(function () {
            if (!cars[k] || cars[k].querySelector('.g4-tburst')) return;
            cars[k].appendChild(tag('g4-tburst'));
            if (r.sound) SFX.crash(r.sound);
          }, r.reduced ? 60 : 260);
        }
      }
      placed++;
      if (r.sound) SFX.clank(r.sound);
      if (placed >= need) {
        busy = true;
        r.later(depart, r.reduced ? 140 : 560);
      }
    }

    function depart() {
      var bad = wrongs > 0;
      if (bad) {
        train.classList.add('jolt');
        bridge.classList.add('hit');
        var which = burstCar >= 0 ? (slotOf[burstCar] || 0) % planks.length : 0;
        planks[which].classList.add('broken');
        stamp.className = 'g4-tstamp showing bad';
        stamp.textContent = 'DERAILED';
        lives = Math.max(0, lives - 1);
        if (r.drawLives) r.drawLives(lives);
        if (r.sound) SFX.crash(r.sound);
      } else {
        train.classList.add('pull');
        stamp.className = 'g4-tstamp showing ok';
        stamp.textContent = 'CLEARED';
        if (r.sound) { SFX.horn(r.sound); r.later(function () { SFX.chuff(r.sound); }, 280); }
      }
      burstCar = -1;
      r.later(next, r.reduced ? 320 : 1500);
    }

    function next() {
      ti++;
      if (ti >= trains.length || lives <= 0) { finish(); return; }
      reset();
    }

    function reset() {
      train.className = 'g4-ttrain';
      bridge.className = 'g4-tbridge';
      stamp.className = 'g4-tstamp';
      stamp.textContent = '';
      wrongs = 0; placed = 0; busy = false; picked = null; burstCar = -1;
      /* the crew starts each train empty-handed: the cards a man held belong to the train that just left */
      given = [];
      guys.forEach(function (g) {
        g.className = 'g4-tguy';
        [].slice.call(g.querySelectorAll('.g4-tagrip')).forEach(function (c) { g.removeChild(c); });
      });
      planks.forEach(function (p) { p.classList.remove('broken'); });
      build();
      buildDock();
    }

    function finish() {
      if (done) return;
      done = true;
      r.finish();
    }

    /* the ending is part of the game: the stage is held while the last train runs out or wrecks, and
       only then handed back to the intro */
    function finale(cb) {
      setTimeout(function () { if (cb) cb(); }, r.reduced ? 320 : 1150);
    }

    /* THE QUESTION IS THE NOUN'S FRAME (qa/NOTES.md 89): "That's a _______ [noun]", with the noun the
       adjectives describe. `data-noun` on the block carries it; without one the frame still shows, with
       the blank and nothing after it. The card belongs to the GAME, not to an item — every adjective on
       the train fills the same sentence — so the runner is told not to rewrite it per item. */
    function frame() {
      if (!r.usePrompt || !r.promptEl) return;
      var noun = (r.root.getAttribute('data-noun') || '').trim();
      r.promptEl.innerHTML = '';
      r.promptEl.appendChild(document.createTextNode("That's a "));
      r.promptEl.appendChild(el('span', 'g4-tblank'));
      if (noun) r.promptEl.appendChild(document.createTextNode(' ' + noun + '.'));
      r.promptEl.classList.add('in');
    }

    /* A START RE-ARMS THE WHOLE YARD, and it is the runner that calls this (`view.reset`) before every
       run — the first and the fifth alike. `reset()` below is a different job: it lays the NEXT train of a
       run already in progress, so it cannot serve as the start hook. After a finished run `ti` stands past
       the last train, and laying `trains[ti]` threw, which aborted start() itself — that is why Play again
       never began a second round — while `done` was still set, so not even a card could have landed. */
    function rearm() {
      ti = 0;
      lives = 2;
      done = false;
      busy = false;
      picked = null;
      built = true;
      reset();                   /* lays the first train, its crew and its dock */
    }

    /* THE RUNNER WIPES THE PROMPT LINE BEFORE IT CALLS THIS (step(): setPrompt then view.show), so the noun's
       frame is written HERE, on every item, not once per run — a frame written before the item would be
       erased by the runner a moment later, which is exactly what happened when rearm() drew it. */
    function show() {
      frame();
      if (built || busy || done) return;
      built = true;
      reset();
    }

    return {
      show: show,
      mark: function () { },
      clear: function () { },
      reset: rearm,
      finale: finale,
      ownsPrompt: true,
      lives: function () { return lives; }
    };
  }

  PLUGINS.trainOrder = function (r) { return yardGame(r); };
  /* THE YARD PLAYS ITS OWN SOUNDS — the coupling, the whistle, the wreck — so the runner's generic
     right/wrong pair would be a second verdict over the picture */
  PLUGINS.trainOrder.ownSound = true;
  /* THE ORDER IS THE CONTENT: a shuffled dock would ask the student to put the third word in the
     front car and call it right */
  PLUGINS.trainOrder.noShuffle = true;


  return { boot: boot, games: Object.keys(PLUGINS), version: 2 };

})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { window.GAMES4.boot(); });
} else {
  window.GAMES4.boot();
}
