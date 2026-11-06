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
                   flapGate, skeetRange, pairFlip, mineGrid, wordleBoard, crosswordBoard,
                   echoPads, bingoCard, ladderRun, bossRaid)
     data-time      ms per item, 0 = no deadline   (0)   ← this is difficulty
     data-limit     seconds for the whole run, 0 = off (0)
     data-replay    0 | 1   missed items return once at the end (1)
     data-shuffle   0 | 1   present items in random order (1)
     data-rounds    how many items a run uses, 0 = all authored (0)
     data-prompt    0 | 1   show the stem on the HUD line (1)
     data-sound     0 | 1   hit / miss / win blips (1)
     data-skin      free-form name; CSS may theme on it, the engine never reads it
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
    mole: '<svg class="g4-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">'
      + '<path d="M16 80h68" stroke="#3f2a18" stroke-width="4" stroke-linecap="round"/>'
      + '<ellipse cx="50" cy="60" rx="33" ry="30" fill="#7a5433"/>'
      + '<ellipse cx="50" cy="67" rx="23" ry="19" fill="#8d6440"/>'
      + '<circle cx="27" cy="33" r="11" fill="#6b4a2c"/><circle cx="73" cy="33" r="11" fill="#6b4a2c"/>'
      + '<ellipse cx="50" cy="44" rx="27" ry="23" fill="#8d6440"/>'
      + '<ellipse cx="50" cy="57" rx="12" ry="9" fill="#e7b6a2"/>'
      + '<ellipse cx="50" cy="50" rx="5.5" ry="4" fill="#3a2314"/>'
      + '<circle cx="41" cy="40" r="3.4" fill="#20140b"/><circle cx="59" cy="40" r="3.4" fill="#20140b"/>'
      + '<circle cx="42.2" cy="38.8" r="1.1" fill="#fff"/><circle cx="60.2" cy="38.8" r="1.1" fill="#fff"/>'
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
    boss: '<svg class="g4-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">'
      + '<path d="M60 6l14 12 18-4 4 18 14 12-8 17 8 17-14 12-4 18-18-4-14 12-14-12-18 4-4-18-14-12 8-17-8-17 14-12 4-18 18 4z" fill="#5c3b8f" stroke="#2e1d4d" stroke-width="3" stroke-linejoin="round"/>'
      + '<circle cx="45" cy="52" r="7" fill="#ffd76a"/><circle cx="75" cy="52" r="7" fill="#ffd76a"/>'
      + '<circle cx="45" cy="52" r="3" fill="#2e1d4d"/><circle cx="75" cy="52" r="3" fill="#2e1d4d"/>'
      + '<path d="M42 82q18 12 36 0" stroke="#2e1d4d" stroke-width="4" fill="none" stroke-linecap="round"/>'
      + '<path d="M48 78l4 8M60 82v8M72 78l-4 8" stroke="#fdfaf2" stroke-width="3" stroke-linecap="round"/>'
      + '</svg>',
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
    this.shuffleOn = flag(root, 'data-shuffle', 1);
    this.usePrompt = flag(root, 'data-prompt', 1);
    this.sound = flag(root, 'data-sound', 1);
    this.itemTime = Math.max(0, num(root, 'data-time', 0));       // ms per item
    this.limit = Math.max(0, num(root, 'data-limit', 0));         // seconds per run
    this.limitLeft = this.limit;
    this.reduced = reduceMotion;
    this.running = false; this.replaying = false; this.phase = 'idle';
    this.missed = []; this.timers = []; this.clock = 0; this.barRaf = 0;

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
    intro.appendChild(card);
    this.intro = intro;
    var stage = el('div', 'g4-stage');
    /* the scene: a finished picture of the place this game happens in, behind everything. It stays
       for the whole run, so play never happens on a bare colour. */
    var scene = el('div', 'g4-scene');
    try { if (SCENE[this.name]) scene.innerHTML = SCENE[this.name](); } catch (e) { /* art never breaks play */ }
    stage.appendChild(scene);
    var hud = el('div', 'g4-hud');
    hud.innerHTML = '<span class="wave"></span><span class="score"></span><span class="clock"></span>';
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
  Runner.prototype.hud = function () {
    this.hudEl.querySelector('.score').textContent = this.score + ' pt';
    this.hudEl.querySelector('.wave').textContent = Math.min(this.idx + 1, this.total) + '/' + this.total;
    this.hudEl.querySelector('.clock').textContent = this.limit ? Math.ceil(this.limitLeft) + 's' : '';
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
    this.clearTimers();
    this.clearPoster();
    this.running = true; this.replaying = false;
    this.score = 0; this.idx = 0; this.missed = [];
    var list = this.items.slice();
    if (this.shuffleOn) shuffle(list);
    var rounds = Math.max(0, num(this.root, 'data-rounds', 0));
    if (rounds > 0 && rounds < list.length) list = list.slice(0, rounds);
    this.queue = list; this.total = list.length;
    this.limitLeft = this.limit;
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
    /* a board game (pairFlip) lays every item out at once and runs its own order of play. It claims
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
    this.setPrompt(it.prompt, true);
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
    if (hit) SFX.hit(this.sound); else SFX.miss(this.sound);
    if (this.view) this.view.mark(it, hit, value);
    this.later(function () {
      if (self.view) self.view.clear();
      self.queue.shift(); self.idx++;
      self.setPrompt('', false);
      self.next();
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
    if (this.answered >= this.total) this.later(function () { self.finish(); }, 800);
    return hit;
  };

  /* finish: replay the misses once, then write the score and hand the authored list back */
  Runner.prototype.finish = function () {
    if (!this.board && this.replay && !this.replaying && this.missed.length) {
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
    line.textContent = 'Score: ' + this.score + ' / ' + this.total
      + (this.score === this.total ? ' — clean run.' : ' — go again when you like.');
    this.btn.textContent = '↻ Play again';
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

  /* ---------------- catchBasket: sort the words into the baskets ----------------
     The words sit in a row along the top — as many as the run has, however many that is — and the
     student drags ANY of them into the basket it belongs in. The baskets are the block's own option
     labels, so the activity decides what they are (or pins them with data-buckets="left|right").
     Real pointer drag (mouse, pen, touch) with a tap-word-then-tap-basket fallback and 1../9 keys,
     so a student who never discovers dragging still answers. */
  PLUGINS.catchBasket = function (r) {
    var stage = r.stage;
    var wordRow = el('div', 'g4-words');
    var tray = el('div', 'g4-tray');
    stage.appendChild(wordRow); stage.appendChild(tray);
    var chips = [], buckets = [], drag = null, active = null;

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
    function clear() {
      drag = null; active = null;
      wordRow.innerHTML = ''; tray.innerHTML = '';
      chips = []; buckets = [];
    }
    function show(item) {
      clear();
      var names = labels(item);
      /* buckets first, so a drag can land on one before the student releases. The buckets belong to
         THIS item, so a block can re-label them item by item. */
      item.opts.forEach(function (o, i) {
        var b = el('button', 'g4-bucket');
        b.type = 'button';
        b.setAttribute('data-v', o.value);
        b.innerHTML = ART.basket + '<span class="g4-bucket-t">' + esc(names[i] || o.text) + '</span>';
        b.addEventListener('click', function () { if (r.phase === 'play') r.pickOn(item, o.value); });
        tray.appendChild(b);
        buckets.push(b);
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
      });
      chips.forEach(function (c) {
        if (c.__item !== item) return;
        c.classList.add(hit ? 'caught' : 'spilled');
      });
    }
    return { show: show, mark: mark, clear: clear };
  };
  /* ---------------- whackMole: the answers surface from holes, then duck ----------------
     One mole per option; the right one must be hit before the runner's bar empties. The moles are
     drawn art, they rise and duck, and the others drop away the moment an answer lands. */
  PLUGINS.whackMole = function (r) {
    var stage = r.stage;
    var grid = el('div', 'g4-grid');
    stage.appendChild(grid);
    var moles = [];

    function clear() { grid.innerHTML = ''; moles = []; }
    function show(item) {
      clear();
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
    }
    function mark(item, hit, value) {
      moles.forEach(function (m) {
        var v = m.getAttribute('data-v');
        if (v === value) m.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) m.classList.add('reveal');
        else m.style.transform = 'translateY(104%)';
      });
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
    /* desk: cards laid out on wood */
    pairFlip: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-paper)"/>'
        + '<g stroke="#cfc3a3" stroke-width="1" opacity=".7"><path d="M0 40h400"/><path d="M0 78h400"/></g>'
        + '<rect y="176" width="400" height="84" fill="url(#g4-wood)"/>'
        + '<g stroke="#6f4523" stroke-width="1" opacity=".45"><path d="M0 196h400"/>'
        + '<path d="M0 214h400"/><path d="M0 236h400"/></g>'
        + '<rect y="170" width="400" height="8" fill="#5d3a1e" opacity=".5"/>');
    },

    /* minefield: dusty dunes and warning stakes */
    mineGrid: function () {
      return frame('<rect width="400" height="260" fill="url(#g4-dawn)"/>'
        + '<path d="M0 150 Q120 120 240 152 T400 148 V260 H0Z" fill="url(#g4-sand)"/>'
        + '<path d="M0 190 Q140 168 260 194 T400 186 V260 H0Z" fill="#b98c54" opacity=".85"/>'
        + '<g stroke="#8a6537" stroke-width="3" opacity=".8"><path d="M48 206v-26"/><path d="M352 214v-26"/></g>'
        + '<g stroke="#7a5427" stroke-width="2" opacity=".6" stroke-dasharray="10 10"><path d="M0 246h400"/></g>'
        + '<g fill="#9a7a4a" opacity=".7"><circle cx="120" cy="238" r="4"/>'
        + '<circle cx="248" cy="230" r="3"/><circle cx="300" cy="248" r="5"/></g>');
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
      /* same flex tray the live stage uses, and one basket per option the item has */
      var texts = (items[0].opts || []).map(function (o) { return o.text; });
      var tray = el('div', 'g4-bit');
      abs(tray, 'left:3%;right:3%;bottom:4%;display:flex;gap:10px');
      texts.forEach(function (t) {
        var b = el('div', 'g4-bucket');
        b.style.flex = '1 1 0';
        b.innerHTML = ART.basket + '<span class="g4-bucket-t">' + esc(t) + '</span>';
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
      /* one landing slot per option, spread by how many the item has */
      var texts = (items[0].opts || []).map(function (o) { return o.text; });
      var n = Math.max(1, texts.length);
      texts.forEach(function (t, i) {
        box.appendChild(abs(el('div', 'g4-slot g4-bit', esc(t)),
          'left:' + (10 + i * (78 / n)).toFixed(1) + '%;bottom:' + (6 + i * (46 / n)).toFixed(1) + '%;width:30%;height:16%'));
      });
      box.appendChild(abs(el('div', 'g4-slot g4-bit', items[0].prompt),
        'left:36%;top:8%;width:34%;height:16%;transform:rotate(-2deg)'));
    },
    flapGate: function (box, items) {
      var texts = (items[0].opts || []).map(function (o) { return o.text; });
      var n = Math.max(1, texts.length);
      texts.forEach(function (t, i) {
        box.appendChild(abs(el('div', 'g4-gate g4-bit', esc(t)),
          'left:56%;top:' + (12 + i * (66 / n)).toFixed(1) + '%;width:38%;height:18%'));
      });
      box.appendChild(abs(el('div', 'g4-car g4-bit'), 'left:12%;top:40%;width:44px;height:26px'));
    },
    pairFlip: function (box, items) {
      var texts = opts0(items, 4);
      for (var i = 0; i < 4; i++) {
        var c = el('div', 'g4-card g4-bit' + (i === 1 ? ' up' : ''));
        c.innerHTML = '<span class="g4-face back"></span><span class="g4-face front">'
          + esc(texts[i] || '') + '</span>';
        abs(c, 'left:' + (8 + (i % 2) * 44) + '%;top:' + (16 + Math.floor(i / 2) * 34) + '%;width:40%;height:28%');
        box.appendChild(c);
      }
    },
    mineGrid: function (box, items) {
      var texts = opts0(items, 4);
      for (var i = 0; i < 4; i++) {
        box.appendChild(abs(el('div', 'g4-mine g4-bit' + (i === 0 ? ' open' : ''), esc(texts[i] || '')),
          'left:' + (6 + (i % 2) * 46) + '%;top:' + (18 + Math.floor(i / 2) * 32) + '%;width:42%;height:28%'));
      }
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
    var pads = el('div', 'g4-pads g4-bit');
    /* one pad per option, as the live game lays them out — the grid wraps them two to a row */
    (items[0].opts || []).forEach(function (o, i) {
      pads.appendChild(el('div', 'g4-pad' + (i === 0 ? ' lit' : ''), esc(o.text)));
    });
    abs(pads, 'left:10%;right:10%;top:20%');
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
    var art = el('div', 'g4-bossart g4-bit');
    art.innerHTML = ART.hex;
    abs(art, 'left:50%;top:8%;transform:translateX(-50%);width:96px;height:96px');
    box.appendChild(art);
    box.appendChild(abs(el('div', 'g4-hp g4-bit', '<span class="g4-hp-fill" style="width:72%"></span>'),
      'left:14%;right:14%;top:56%;height:14px'));
    box.appendChild(abs(el('div', 'g4-hearts g4-bit', '●●●'), 'left:14%;top:4%;'));
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



  /* ---------------- stackDrop: answer, and the answer becomes a rung of a tower ----------------
     The question is a block hovering over a row of landing pads, each pad labelled with one option.
     Pick a pad (click it, or the block lands on the one under it) and the block DROPS into the tower.
     A right drop becomes a rung and the little climber climbs one level; a wrong one crumbles and no
     rung is added. Place every rung and he reaches the star at the top — the reward for finishing is
     the climb, which is why stacking is worth caring about at all.
     Authoring: `.qitem` per question; `data-rounds` is unnecessary (the tower is as tall as the
     list). Difficulty is the list's length and `data-time`. */
  PLUGINS.stackDrop = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-tower'), pads = el('div', 'g4-towerpads'), tower = el('div', 'g4-built');
    var block = el('div', 'g4-block'), climber = el('div', 'g4-climber'), prize = el('div', 'g4-prize');
    climber.innerHTML = ART.hero;
    prize.innerHTML = ART.star;
    box.appendChild(climber); box.appendChild(tower); box.appendChild(prize);
    box.appendChild(block); box.appendChild(pads);
    stage.appendChild(box);
    var padsEls = [], rungs = [], level = 0, total = 0;
    prize.style.display = 'none';

    function clear() {
      pads.innerHTML = ''; padsEls = [];
      block.classList.remove('ok', 'no', 'falling');
      if (!total) total = r.items.length;
      /* the tower is drawn from the very start, empty, so the student can see how far there is to go */
      tower.innerHTML = '';
      rungs = [];
      for (var i = 0; i < total; i++) {
        var rg = el('div', 'g4-rung-slot');
        rg.style.bottom = (i * 22) + 'px';
        tower.appendChild(rg);
        rungs.push(rg);
      }
      level = 0;
      climb();
    }
    function climb() {
      climber.style.bottom = (level * 22 - 2) + 'px';
    }
    function show(item) {
      clear();
      item.opts.forEach(function (o) {
        var p = el('button', 'g4-padbtn', o.text);
        p.type = 'button';
        p.setAttribute('data-v', o.value);
        p.addEventListener('click', function () {
          if (r.phase !== 'play') return;
          dropTo(o.value, p);
        });
        pads.appendChild(p);
        padsEls.push(p);
      });
      block.textContent = item.prompt || '⋯';
      block.style.transform = '';
      block.classList.remove('ok', 'no', 'falling', 'left', 'right');
      /* he wobbles, he never leaves the stage: the old left% drift wrapped text at the edges */
      if (!r.reduced) block.classList.add(level % 2 ? 'lean-left' : 'lean-right');
    }
    /* picking a pad IS the answer; the block falls to that pad so the choice is visible */
    function dropTo(value, pad) {
      block.classList.remove('lean-left', 'lean-right');
      block.classList.add('falling');
      if (pad) {
        var bb = box.getBoundingClientRect(), pb = pad.getBoundingClientRect();
        var dx = (pb.left + pb.width / 2) - (bb.left + bb.width / 2);
        block.style.transform = 'translate(-50%,' + Math.min(150, pb.top - bb.top - 34) + 'px) translateX(' + dx.toFixed(0) + 'px)';
      }
      r.pick(value);
    }
    /* Space/Enter drops the block on the pad it is nearest to, so the game works without aiming */
    function drop() {
      if (r.phase !== 'play' || !padsEls.length) return;
      var mid = block.getBoundingClientRect().left + block.getBoundingClientRect().width / 2;
      var best = null, bestD = 1e9;
      padsEls.forEach(function (p) {
        var pb = p.getBoundingClientRect();
        var d = Math.abs(pb.left + pb.width / 2 - mid);
        if (d < bestD) { bestD = d; best = p; }
      });
      if (best) dropTo(best.getAttribute('data-v'), best);
    }
    box.setAttribute('tabindex', '0');
    box.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); drop(); }
    });
    function mark(item, hit, value) {
      padsEls.forEach(function (p) {
        var v = p.getAttribute('data-v');
        if (v === value) p.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) p.classList.add('reveal');
      });
      block.classList.remove('falling');
      block.classList.add(hit ? 'ok' : 'no');
      if (hit) {
        var rg = rungs[level];
        if (rg) { rg.classList.add('filled'); }
        level++;
        climb();
        if (level >= total) {
          prize.style.display = '';
          prize.classList.add('won');
          climber.classList.add('cheer');
        }
      }
    }
    return { show: show, mark: mark, clear: clear, drop: drop };
  };

  /* ---------------- flapGate: one-button flight through the right gate ----------------
     Taps lift the avatar; the gates scroll toward it, each labelled with an option. Fly through the
     gate that fits. Contact with a wrong gate is the answer, honestly taken. */
  PLUGINS.flapGate = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-sky'), avatar = el('div', 'g4-avatar'), field = el('div', 'g4-gates');
    box.appendChild(field); box.appendChild(avatar);
    stage.appendChild(box);
    var raf = 0, live = false, y = 50, vy = 0, t0 = 0, gates = [];
    function stop() { live = false; if (raf && window.cancelAnimationFrame) window.cancelAnimationFrame(raf); raf = 0; }
    function clear() { stop(); field.innerHTML = ''; gates = []; y = 50; vy = 0; avatar.style.top = '50%'; }
    function show(item) {
      clear();
      item.opts.forEach(function (o, i) {
        var g = el('button', 'g4-gate', o.text);
        g.type = 'button';
        g.setAttribute('data-v', o.value);
        g.style.top = (12 + (i * 76) / Math.max(1, item.opts.length)) + '%';
        g.addEventListener('click', function () { if (r.phase === 'play') { stop(); r.pick(o.value); } });
        field.appendChild(g);
        gates.push(g);
      });
      if (r.reduced) return;
      live = true;
      t0 = (window.performance && performance.now) ? performance.now() : Date.now();
      var frame = function (now) {
        if (!live) return;
        var dt = Math.min(0.05, ((now || t0) - t0) / 1000); t0 = now || Date.now();
        vy += 120 * dt;                    // gravity
        y = Math.min(100, Math.max(0, y + vy * dt));
        avatar.style.top = y.toFixed(1) + '%';
        raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : 0;
      };
      raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : 0;
    }
    function flap() {
      if (!live || r.phase !== 'play') return;
      vy = -46;
    }
    box.addEventListener('click', flap);
    box.setAttribute('tabindex', '0');
    box.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') { e.preventDefault(); flap(); }
    });
    function mark(item, hit, value) {
      stop();
      gates.forEach(function (g) {
        var v = g.getAttribute('data-v');
        if (v === value) g.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) g.classList.add('reveal');
      });
    }
    return { show: show, mark: mark, clear: clear, flap: flap };
  };


  /* ---------------- pairFlip: memory pairs, prompt ↔ option ----------------
     Cards start face down; the prompt is one of them. Turning the prompt and its match answers the
     item. A mismatched pair only costs time, which is the honest cost in a memory game. */
  /* ---------------- pairFlip: a 4x3 board of pairs ----------------
     Six pairs of cards face down: each item's prompt on one card and its right option on another.
     Turn two; a true pair stays up AND answers that item (its radio is checked), a false pair turns
     back. The reading is the game — you cannot match what you have not understood — and every match
     is recorded, so a page of matches is a page of answered items. */
  /* ---------------- skeetRange: one flying target per option, one shot per item ----------------
     Each option's disc is thrown from off the left edge on its own arc and flies away past the right
     edge. The flight lasts exactly the item's own deadline (`data-time`), so the timer running out
     and the last disc leaving the range are the same moment: let them all fly past and the item is
     lost. Nothing is ever teleported — a disc starts and finishes outside the frame — so the travel
     you see is the whole of the throw; with no deadline the same throw simply comes round again.
     The SHOT is the constraint — one click, the discs freeze, and where it landed is the answer.
     Clicking the sky is still your one shot, which is why the crosshair is the cursor and not
     decoration.
     Authoring: `.qitem` per item, one disc per option (two to four, as the lesson writes them),
     `data-a` the right option, `data-time` the deadline and the flight time. `data-replay` brings
     the misses back the way every other game does. */
  PLUGINS.skeetRange = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-range'), field = el('div', 'g4-discs'), cross = el('div', 'g4-cross');
    box.appendChild(field); box.appendChild(cross);
    stage.appendChild(box);
    var FLIGHT = 7000;                  /* only when the block has no data-time: the throw repeats */
    var raf = 0, live = false, t0 = 0, discs = [], spent = false;
    function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
    function stop() { live = false; if (raf && window.cancelAnimationFrame) window.cancelAnimationFrame(raf); raf = 0; }
    function clear() { stop(); field.innerHTML = ''; discs = []; spent = false; }
    function aim(ev) {
      var b = box.getBoundingClientRect();
      cross.style.transform = 'translate(' + Math.round(ev.clientX - b.left) + 'px,' + Math.round(ev.clientY - b.top) + 'px)';
      cross.classList.add('live');
    }
    box.addEventListener('mousemove', aim);
    /* one shot: the disc is the answer, and the sky is a miss. Either way the item is spent. */
    function shot(value) {
      if (r.phase !== 'play' || spent) return false;
      spent = true;
      stop();
      cross.classList.add('fire');
      r.later(function () { cross.classList.remove('fire'); }, 240);
      return r.pick(value);
    }
    box.addEventListener('click', function (ev) {
      if (!ev.target || !ev.target.closest) return;
      if (ev.target.closest('.g4-target')) return;    /* the disc's own handler already took it */
      shot(null);
    });
    /* a real throw: out of the trap off-screen left, up over the range, away behind the right edge.
       `p` is the share of the flight that has gone, and the flight IS the item's own deadline. */
    function draw(t) {
      var w = box.clientWidth || 640, span = w + 240;
      var flight = r.itemTime || FLIGHT;
      var p = t / flight;
      if (!r.itemTime) p = p % 1;                    /* no deadline: throw after throw */
      p = Math.min(1, Math.max(0, p));
      discs.forEach(function (d) {
        var x = -120 + p * span;
        var lift = d._arc * 4 * p * (1 - p);         /* zero at both edges, highest at half way */
        d.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(-lift) + 'px)';
      });
    }
    function show(item) {
      clear();
      /* the lesson decides how many targets there are — one per option, two to four — and the order
         of the options decides the lanes, so no disc ever flies behind another */
      var n = Math.max(1, item.opts.length);
      item.opts.forEach(function (o, i) {
        var d = el('button', 'g4-target');
        d.type = 'button';
        d.setAttribute('data-v', o.value);
        d.innerHTML = '<span class="g4-ring"></span><span class="g4-target-t">' + esc(o.text) + '</span>';
        d.addEventListener('click', function (ev) { ev.stopPropagation(); shot(o.value); });
        field.appendChild(d);
        d._lane = n === 1 ? 0.5 : i / (n - 1);       /* even bands, first option highest */
        d._arc = 22 + (i % 3) * 9;                   /* 22 / 31 / 40px, so neighbours never mirror */
        d.style.top = (16 + d._lane * 40) + '%';
        d.style.transform = 'translate(-120px,0)';   /* already off the left edge on frame zero */
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
    return { show: show, mark: mark, clear: clear };
  };

  PLUGINS.pairFlip = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-pairs'), cards = [], open = [], locked = false, answered = [];
    stage.appendChild(box);

    function begin(queue) {
      var pairs = [];
      queue.forEach(function (it) {
        if (pairs.length >= 6) return;
        var right = null;
        (it.opts || []).forEach(function (o) { if (o.value === it.key) right = o; });
        var left = (it.prompt || '').trim();
        if (!right || !left) return;
        pairs.push({ id: pairs.length, item: it, left: left, right: right.text });
      });
      if (!pairs.length) return false;
      r.total = pairs.length;
      var faces = [];
      pairs.forEach(function (p) {
        faces.push({ pair: p.id, side: 0, text: p.left, item: p.item });
        faces.push({ pair: p.id, side: 1, text: p.right, item: p.item });
      });
      box.innerHTML = ''; cards = []; open = []; locked = false; answered = [];
      shuffle(faces).forEach(function (f) {
        var c = el('button', 'g4-card');
        c.type = 'button';
        c.innerHTML = '<span class="g4-face back">?</span><span class="g4-face front">' + esc(f.text) + '</span>';
        c.setAttribute('data-pair', String(f.pair));
        c.setAttribute('data-side', String(f.side));
        c.addEventListener('click', function () { turn(c, f); });
        box.appendChild(c);
        cards.push({ el: c, face: f });
      });
      return true;
    }

    function turn(c, f) {
      if (r.phase === 'over' || locked) return;
      if (c.classList.contains('up')) return;
      c.classList.add('up');
      open.push({ el: c, face: f });
      SFX.blip(r.sound, 440 + 60 * open.length);
      if (open.length < 2) return;
      var a = open[0], b = open[1];
      if (a.face.pair === b.face.pair && a.face.side !== b.face.side) {
        locked = true;
        open.forEach(function (o) { o.el.classList.add('ok'); });
        var it = a.face.item;
        open = [];
        r.later(function () {
          locked = false;
          if (answered.indexOf(it) < 0) { answered.push(it); r.scoreBoard(it, it.key); }
        }, 340);
        return;
      }
      locked = true;
      r.later(function () {
        open.forEach(function (o) { o.el.classList.remove('up'); });
        open = []; locked = false;
      }, 760);
    }

    function show() { /* board mode: everything is placed up front */ }
    function mark() { /* feedback is the flip itself; the runner does not step in board mode */ }
    function clear() { box.innerHTML = ''; cards = []; open = []; locked = false; }
    return { begin: begin, show: show, mark: mark, clear: clear, turn: turn };
  };


  /* ---------------- mineGrid: send the runner to the cell you trust ----------------
     The field is the options, every word readable, and one cell is mined. Picking a cell is the
     answer, and the runner WALKS to it so the choice is a character's risk, not a bare click. A right
     cell and he grabs the word; a mine throws him, he survives twice (then visibly damaged) and the
     third one finishes him. Three wrong picks ends the run. */
  PLUGINS.mineGrid = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-mines'), field = el('div', 'g4-field'), tiles = [];
    var hero = el('div', 'g4-runner'), lives = el('div', 'g4-lives');
    hero.innerHTML = ART.hero;
    box.appendChild(lives); box.appendChild(field); box.appendChild(hero);
    stage.appendChild(box);
    var left = 3, busy = false;
    function drawLives() {
      lives.textContent = '♥♥♥'.slice(0, left) + '♡♡♡'.slice(0, 3 - left);
    }
    function clear() {
      field.innerHTML = ''; tiles = []; busy = false;
      left = 3;
      hero.innerHTML = ART.hero;
      hero.classList.remove('blown', 'down');
      hero.style.transform = 'translate(0,0)';
      drawLives();
    }
    function walkTo(t) {
      var hb = box.getBoundingClientRect(), tb = t.getBoundingClientRect();
      var dx = (tb.left + tb.width / 2) - (hb.left + hb.width / 2);
      var dy = (tb.top + tb.height / 2) - (hb.top + hb.height * 0.52);
      hero.style.transform = 'translate(' + dx.toFixed(0) + 'px,' + Math.max(-72, Math.min(20, dy)).toFixed(0) + 'px)';
    }
    function show(item) {
      clear();
      var cells = item.opts.map(function (o) { return { text: o.text, value: o.value, trap: false }; });
      cells.push({ text: '', value: null, trap: true });
      shuffle(cells.slice()).forEach(function (c) {
        var t = el('button', 'g4-mine' + (c.trap ? ' trap' : ''));
        t.type = 'button';
        t.setAttribute('data-v', c.value == null ? '' : c.value);
        t.innerHTML = '<span class="g4-mine-in">' + esc(c.text) + '</span>';
        t.addEventListener('click', function () {
          if (r.phase !== 'play' || busy || t.classList.contains('open')) return;
          busy = true;
          walkTo(t);
          t.classList.add('open');
          r.later(function () {
            if (c.trap) r.expire(); else r.pick(c.value);
          }, r.reduced ? 60 : 420);
        });
        field.appendChild(t);
        tiles.push({ el: t, cell: c });
      });
    }
    function mark(item, hit, value) {
      tiles.forEach(function (t) {
        if (t.cell.trap) t.el.classList.add('open', 'boom');
        else if (t.cell.value === item.key) t.el.classList.add('open', 'ok');
        else if (t.cell.value === value) t.el.classList.add('open', 'no');
      });
      if (!hit) {
        left = Math.max(0, left - 1);
        hero.innerHTML = left < 2 ? ART.heroHurt : ART.hero;
        hero.classList.add('blown');
        r.later(function () { hero.classList.remove('blown'); }, 620);
        drawLives();
        if (!left) {
          hero.classList.add('down');
          r.later(function () { if (r.running) r.finish(); }, 700);
        }
      }
      r.later(function () { busy = false; }, 520);
    }
    return { show: show, mark: mark, clear: clear, lives: function () { return left; } };
  };


  /* ---------------- wordleBoard (and hangman): one word, letter by letter ----------------
     The word is authored (`data-answer`) or is the correct option's text. Green = right letter,
     right place; amber = right letter, wrong place. Guessing the word answers the item, so the
     evidence is still the radio — the board is the work. */
  PLUGINS.wordleBoard = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-wordle'), grid = el('div', 'g4-wgrid');
    var entry = document.createElement('input');
    entry.className = 'g4-wtype';
    entry.setAttribute('type', 'text');
    entry.setAttribute('autocomplete', 'off');
    entry.setAttribute('aria-label', 'Type your guess and press Enter');
    box.appendChild(grid); box.appendChild(entry);
    stage.appendChild(box);
    /* a wall of faint tiles behind the board: the game reads as a board, not a form */
    var back = el('div', 'g4-wbg');
    back.innerHTML = '<svg viewBox="0 0 400 240" preserveAspectRatio="none" aria-hidden="true">'
      + '<defs><pattern id="g4wt" width="42" height="42" patternUnits="userSpaceOnUse">'
      + '<rect x="2" y="2" width="38" height="38" rx="6" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-width="2"/>'
      + '</pattern></defs><rect width="400" height="240" fill="url(#g4wt)"/></svg>';
    stage.insertBefore(back, box);
    var word = '', rows = 6, guesses = [], done = false;

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
      draw();
      entry.disabled = !word;
      if (word && entry.focus) { try { entry.focus({ preventScroll: true }); } catch (e) { entry.focus(); } }
    }
    function guess(text) {
      if (done || r.phase !== 'play' || !word) return false;
      var g = norm(text).replace(/[^a-z]/g, '');
      if (!g || g.length !== word.length) return false;
      guesses.push(g);
      entry.value = '';
      draw();
      if (g === word) { done = true; r.pick(r.queue[0].key); return true; }
      if (guesses.length >= rows) { done = true; r.expire(); }
      return false;
    }
    entry.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); guess(entry.value); }
    });
    function mark(item, hit) {
      done = true;
      if (!hit) return;
      var last = el('div', 'g4-wrow');
      word.split('').forEach(function (ch) { last.appendChild(el('span', 'g4-tile ok', ch.toUpperCase())); });
      grid.appendChild(last);
    }
    return { show: show, mark: mark, clear: clear, guess: guess, entry: entry };
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
      var cols = maxC + 1;
      var avail = Math.max(240, (stage.clientWidth || 560) - 170);
      var size = Math.max(19, Math.min(30, Math.floor(avail / cols)));
      grid.style.gridTemplateColumns = 'repeat(' + cols + ',' + size + 'px)';
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
      clue.textContent = w.num + (w.dir ? ' down' : ' across') + ' — ' + w.clue;
      clue.classList.add('on');
      r.setPrompt(w.clue, true);
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
      var first = Object.keys(inputs).map(function (k) { return inputs[k]; })
        .filter(function (i) { return !i.readOnly; })[0];
      if (first && first.focus) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
      return true;
    }
    return { begin: begin, show: function () { }, mark: function () { }, clear: function () { }, check: check };
  };

  /* ---------------- echoPads: Simon, with language ----------------.
     Four pads, one per option, each with its own tone. Every round plays the WHOLE pattern then adds
     one beat to it, so the student is echoing a growing sequence rather than guessing a single pad.
     Echo the full pattern back and the item is answered; a wrong press ends the round honestly.
     "Say it again" replays the same pattern without penalty — memory of a sound is not a guess. */
  PLUGINS.echoPads = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-echo'), pads = el('div', 'g4-pads');
    var line = el('div', 'g4-echo-line', '');
    var again = el('button', 'g4-again', '🔊 Say it again');
    again.type = 'button';
    box.appendChild(line); box.appendChild(pads); box.appendChild(again);
    stage.appendChild(box);
    var els = [], pattern = [], step = 0, playing = false;
    var TONES = [392, 523, 659, 784];

    function lit(i, ms) {
      var p = els[i];
      if (!p) return;
      p.classList.remove('lit');
      p.classList.add('lit');
      SFX.tone(TONES[i % TONES.length], ms || 200, 'sine', 0.2);
      r.later(function () { p.classList.remove('lit'); }, (ms || 200) + 60);
    }
    /* the whole sequence is played back, then the student repeats it */
    function play() {
      if (r.phase !== 'play') return;
      playing = true;
      step = 0;
      els.forEach(function (p) { p.classList.add('muted'); });
      line.textContent = 'Listen… ' + pattern.length + ' beats';
      var i = 0;
      (function beat() {
        if (r.phase !== 'play') { playing = false; return; }
        if (i >= pattern.length) {
          playing = false;
          els.forEach(function (p) { p.classList.remove('muted'); });
          line.textContent = 'Your turn: all ' + pattern.length + ', in order';
          return;
        }
        lit(pattern[i], 210);
        i++;
        r.later(beat, 430);
      })();
    }
    again.addEventListener('click', function () {
      if (playing || r.phase !== 'play') return;
      SFX.blip && SFX.blip();
      play();
    });
    function press(i) {
      if (r.phase !== 'play' || playing) return;
      lit(i, 200);
      if (i !== pattern[step]) {
        line.textContent = 'Beat ' + (step + 1) + ' slipped — it was the ' + (pattern[step] + 1) + '.';
        r.later(function () { if (r.phase === 'play') r.resolve(null, 'miss'); }, 400);
        return;
      }
      step++;
      if (step < pattern.length) return;
      line.textContent = 'Echoed! ' + pattern.length + ' in a row.';
      r.later(function () { if (r.phase === 'play') r.pick(r.queue[0].key); }, 380);
    }
    function clear() { pads.innerHTML = ''; els = []; pattern = []; step = 0; playing = false; line.textContent = ''; }
    function show(item) {
      clear();
      item.opts.slice(0, 4).forEach(function (o, i) {
        var p = el('button', 'g4-pad', o.text);
        p.type = 'button';
        p.setAttribute('data-v', o.value);
        p.setAttribute('data-tone', TONES[i % TONES.length]);
        p.addEventListener('click', function () { press(i); });
        pads.appendChild(p);
        els.push(p);
      });
      /* round N is N+1 beats, capped so the last rounds stay winnable; the block's length sets the
         difficulty, so a lesson with four items is a four-round climb, not a separate setting */
      var want = Math.min(8, 1 + r.idx);
      for (var i = 0; i < want; i++) pattern.push(Math.floor(Math.random() * Math.max(1, els.length)));
      r.later(play, 480);
    }
    function mark(item, hit, value) {
      els.forEach(function (p) {
        var v = p.getAttribute('data-v');
        if (v === value) p.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) p.classList.add('reveal');
      });
      if (!hit) line.textContent = 'It was ' + pattern.length + ' beats — again next round.';
    }
    return { show: show, mark: mark, clear: clear };
  };

  /* ---------------- bingoCard: the voice calls it, you stamp the card ----------------
     Nine tiles: the item's options plus decoys drawn from the rest of the block, so the card is
     never trivially small. A wrong stamp is an answer, taken honestly. */
  PLUGINS.bingoCard = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-bingo'), card = el('div', 'g4-bcard');
    var again = el('button', 'g4-again', '🔊 Call it again');
    again.type = 'button';
    var yell = el('div', 'g4-yell', 'Listen, then stamp it.');
    box.appendChild(yell); box.appendChild(card); box.appendChild(again);
    stage.appendChild(box);
    var tiles = [], phrase = '';
    function pool() {
      var all = [];
      r.items.forEach(function (it) { it.opts.forEach(function (o) { if (all.indexOf(o.text) < 0) all.push(o.text); }); });
      return all;
    }
    again.addEventListener('click', function () { say(phrase); });
    function heard(item) {
      /* what the caller says: the clip when there is one, else the CORRECT OPTION's own words —
         never the stem, because a stem is a question and a caller calls answers */
      var right = item.opts.filter(function (o) { return o.value === item.key; })[0];
      return item.say || (right ? right.text : '') || item.prompt || '';
    }
    function clear() { card.innerHTML = ''; tiles = []; phrase = ''; }
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
          if (r.phase !== 'play' || t.classList.contains('stamped')) return;
          t.classList.add('stamped');
          r.pick(c.value);
        });
        card.appendChild(t);
        tiles.push(t);
      });
      yell.textContent = 'Listen, then stamp it.';
      r.later(function () { if (r.phase === 'play') say(phrase); }, 260);
    }
    function mark(item, hit, value) {
      tiles.forEach(function (t) {
        var v = t.getAttribute('data-v');
        if (v === value) t.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) t.classList.add('reveal');
        if (hit && v === item.key) t.classList.add('stamped');
      });
      if (hit) yell.textContent = 'Line!';
      else { yell.textContent = 'Not that one.'; say(heard(item)); }
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



  /* ---------------- bossRaid: a hero, a boss, and three hearts ----------------
     Every right answer is a hit: the hero steps in and swings, the boss flashes and loses HP. Every
     wrong answer is the boss's turn: it swings back, the hero loses a heart and visibly picks up
     damage. Three hearts gone and he goes down — so a long drill has an ending that belongs to the
     answers, not to a timer. */
  PLUGINS.bossRaid = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-boss');
    var art = el('div', 'g4-bossart'), bar = el('div', 'g4-hp'), hpFill = el('div', 'g4-hp-fill');
    var hearts = el('div', 'g4-hearts'), opts = el('div', 'g4-raceopts');
    var hero = el('div', 'g4-hero');
    art.innerHTML = ART.boss;
    hero.innerHTML = ART.hero;
    bar.appendChild(hpFill);
    box.appendChild(art); box.appendChild(bar); box.appendChild(hearts);
    box.appendChild(hero); box.appendChild(opts);
    stage.appendChild(box);
    var lives = 3;
    function face(hurt) { hero.innerHTML = hurt ? ART.heroHurt : ART.hero; }
    function drawHud() {
      var hp = r.total ? 1 - r.score / r.total : 0;
      hpFill.style.width = Math.max(0, Math.round(hp * 100)) + '%';
      hearts.textContent = '♥♥♥'.slice(0, lives) + '♡♡♡'.slice(0, 3 - lives);
    }
    function clear() { opts.innerHTML = ''; drawHud(); }
    function show(item) {
      opts.innerHTML = '';
      drawHud();
      face(lives < 2);
      item.opts.forEach(function (o) {
        var b = el('button', 'g4-raceopt', o.text);
        b.type = 'button';
        b.setAttribute('data-v', o.value);
        b.addEventListener('click', function () { if (r.phase === 'play') r.pick(o.value); });
        opts.appendChild(b);
      });
    }
    function mark(item, hit, value) {
      if (hit) {
        /* the hero steps in and swings; the boss takes it */
        hero.classList.add('lunge');
        art.classList.add('hurt');
        r.later(function () { hero.classList.remove('lunge'); art.classList.remove('hurt'); }, 420);
      } else {
        /* the boss swings back and the hero takes it */
        lives = Math.max(0, lives - 1);
        art.classList.add('strike');
        hero.classList.add('recoil');
        face(lives < 2);
        r.later(function () { art.classList.remove('strike'); hero.classList.remove('recoil'); }, 460);
      }
      drawHud();
      [].forEach.call(opts.querySelectorAll('.g4-raceopt'), function (b) {
        var v = b.getAttribute('data-v');
        if (v === value) b.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) b.classList.add('reveal');
      });
      if (!lives) {
        hero.classList.add('down');
        r.later(function () { if (r.running) r.finish(); }, 800);
      }
    }
    return { show: show, mark: mark, clear: clear, lives: function () { return lives; } };
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
