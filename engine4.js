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
     data-game      catchBasket | whackMole        which presentation
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

  /* finish: replay the misses once, then write the score and hand the authored list back */
  Runner.prototype.finish = function () {
    if (this.replay && !this.replaying && this.missed.length) {
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
      /* same flex tray the live stage uses, so the intro is a true still of the game */
      var texts = opts0(items, 3);
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
      var texts = opts0(items, 3);
      for (var i = 0; i < 6; i++) {
        var h = el('div', 'g4-hole g4-bit');
        h.innerHTML = '<span class="g4-dirt"></span>';
        abs(h, 'left:' + (5 + (i % 3) * 31) + '%;top:' + (30 + Math.floor(i / 3) * 34) + '%;width:27%;height:30%');
        if (texts[i] && i !== 1) {
          h.appendChild(el('div', 'g4-mole', ART.mole + '<span class="g4-mole-t">' + esc(texts[i]) + '</span>'));
        }
        box.appendChild(h);
      }
    },
    stackDrop: function (box, items) {
      opts0(items, 3).forEach(function (t, i) {
        box.appendChild(abs(el('div', 'g4-slot g4-bit', esc(t)),
          'left:' + (10 + i * 26) + '%;bottom:' + (6 + i * 18) + '%;width:30%;height:16%'));
      });
      box.appendChild(abs(el('div', 'g4-slot g4-bit', items[0].prompt),
        'left:36%;top:8%;width:34%;height:16%;transform:rotate(-2deg)'));
    },
    flapGate: function (box, items) {
      opts0(items, 3).forEach(function (t, i) {
        box.appendChild(abs(el('div', 'g4-gate g4-bit', esc(t)),
          'left:56%;top:' + (12 + i * 26) + '%;width:38%;height:18%'));
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
    (items[0].opts || []).slice(0, 4).forEach(function (o, i) {
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



  /* ---------------- stackDrop: drop the sliding block into a gap ----------------
     The gaps under the block are the options. Press (click / Space) to drop: land on a gap and that
     option answers; miss every gap and the item is spent. */
  PLUGINS.stackDrop = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-stack'), slots = el('div', 'g4-slots');
    var block = el('div', 'g4-block');
    box.appendChild(block); box.appendChild(slots);
    stage.appendChild(box);
    var raf = 0, live = false, t0 = 0, slotsEls = [];
    function stop() { live = false; if (raf && window.cancelAnimationFrame) window.cancelAnimationFrame(raf); raf = 0; }
    function clear() { stop(); slots.innerHTML = ''; slotsEls = []; block.style.left = '50%'; }
    function show(item) {
      clear();
      item.opts.forEach(function (o) {
        var s = el('button', 'g4-slot', o.text);
        s.type = 'button';
        s.setAttribute('data-v', o.value);
        s.addEventListener('click', function () { if (r.phase === 'play') { stop(); r.pick(o.value); } });
        slots.appendChild(s);
        slotsEls.push(s);
      });
      block.textContent = item.prompt || '⋯';
      if (r.reduced) return;
      live = true;
      t0 = (window.performance && performance.now) ? performance.now() : Date.now();
      var frame = function (now) {
        if (!live) return;
        var t = ((now || t0) - t0) / 1000;
        block.style.left = (50 + Math.sin(t * 1.6) * 40).toFixed(2) + '%';
        raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : 0;
      };
      raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : 0;
    }
    function drop() {
      if (!live || r.phase !== 'play') return;
      stop();
      var bb = block.getBoundingClientRect(), mid = bb.left + bb.width / 2;
      var best = null, bestD = 1e9;
      slotsEls.forEach(function (s) {
        var sb = s.getBoundingClientRect();
        var d = Math.abs(sb.left + sb.width / 2 - mid);
        if (d < bestD) { bestD = d; best = s; }
      });
      if (best && bestD < bb.width / 2 + 24) r.pick(best.getAttribute('data-v'));
      else r.expire();
    }
    box.addEventListener('click', function () { drop(); });
    box.setAttribute('tabindex', '0');
    box.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); drop(); }
    });
    function mark(item, hit, value) {
      stop();
      slotsEls.forEach(function (s) {
        var v = s.getAttribute('data-v');
        if (v === value) s.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) s.classList.add('reveal');
      });
      block.classList.add(hit ? 'ok' : 'no');
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
  PLUGINS.pairFlip = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-pairs'), cards = [], open = [], matched = false;
    stage.appendChild(box);
    function clear() { box.innerHTML = ''; cards = []; open = []; matched = false; }
    function show(item) {
      clear();
      var faces = [{ kind: 'prompt', text: item.prompt || '?', value: null }]
        .concat(item.opts.map(function (o) { return { kind: 'opt', text: o.text, value: o.value }; }));
      shuffle(faces.slice()).forEach(function (f) {
        var c = el('button', 'g4-card');
        c.type = 'button';
        c.innerHTML = '<span class="g4-face back">?</span><span class="g4-face front">' + esc(f.text) + '</span>';
        c.setAttribute('data-kind', f.kind);
        c.setAttribute('data-v', f.value == null ? '' : f.value);
        c.addEventListener('click', function () { turn(c, f); });
        box.appendChild(c);
        cards.push({ el: c, face: f });
      });
    }
    function turn(c, f) {
      if (r.phase !== 'play' || matched) return;
      if (c.classList.contains('up') || open.length >= 2) return;
      c.classList.add('up');
      open.push({ el: c, face: f });
      if (open.length < 2) return;
      var a = open[0].face, b = open[1].face;
      var hitPair = (a.kind === 'prompt' && b.value === r.queue[0].key)
        || (b.kind === 'prompt' && a.value === r.queue[0].key);
      if (hitPair) { matched = true; r.pick(r.queue[0].key); return; }
      r.later(function () {
        open.forEach(function (o) { o.el.classList.remove('up'); });
        open = [];
      }, 620);
    }
    function mark(item, hit, value) {
      cards.forEach(function (c) {
        if (c.face.kind === 'opt' && c.face.value === item.key) c.el.classList.add('up', 'ok');
      });
    }
    return { show: show, mark: mark, clear: clear, turn: turn };
  };

  /* ---------------- mineGrid: open the field without setting off the trap ----------------
     Each tile hides a claim; one hides a trap. Opening a tile takes the judgement it carries, so a
     blind click is an answer the student made. */
  PLUGINS.mineGrid = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-mines'), tiles = [];
    stage.appendChild(box);
    function clear() { box.innerHTML = ''; tiles = []; }
    function show(item) {
      clear();
      var cells = item.opts.map(function (o) { return { text: o.text, value: o.value, trap: false }; });
      cells.push({ text: '✷', value: null, trap: true });
      shuffle(cells.slice()).forEach(function (c) {
        var t = el('button', 'g4-mine' + (c.trap ? ' trap' : ''), '');
        t.type = 'button';
        t.innerHTML = '<span class="g4-mine-in">' + esc(c.text) + '</span>';
        t.addEventListener('click', function () {
          if (r.phase !== 'play' || t.classList.contains('open')) return;
          t.classList.add('open');
          if (c.trap) r.expire();
          else r.pick(c.value);
        });
        box.appendChild(t);
        tiles.push({ el: t, cell: c });
      });
    }
    function mark(item, hit, value) {
      tiles.forEach(function (t) {
        if (t.cell.trap) t.el.classList.add('open', 'boom');
        else if (t.cell.value === item.key) { t.el.classList.add('open', 'ok'); }
        else if (t.cell.value === value) t.el.classList.add('open', 'no');
      });
    }
    return { show: show, mark: mark, clear: clear };
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

  /* ---------------- crosswordBoard: crossed words, one letter per cell ----------------
     Every item carries `data-answer`, `data-at="row,col"` and `data-dir="across|down"`. A cell that
     has been right once keeps its letter, so words cross and the grid fills like a crossword. */
  PLUGINS.crosswordBoard = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-xw'), grid = el('div', 'g4-xgrid');
    box.appendChild(grid);
    stage.appendChild(box);
    var solved = {}, cells = [];
    function place(item) {
      var ans = norm(item.item.getAttribute('data-answer')).replace(/[^a-z]/g, '');
      if (!ans) return null;
      var at = (item.item.getAttribute('data-at') || '0,0').split(',');
      var down = (item.item.getAttribute('data-dir') || 'across') === 'down';
      return { ans: ans, r0: parseInt(at[0], 10) || 0, c0: parseInt(at[1], 10) || 0, down: down };
    }
    function clear() { grid.innerHTML = ''; cells = []; }
    function show(item) {
      clear();
      var p = place(item);
      if (!p) return;
      grid.style.gridTemplateColumns = 'repeat(' + (p.down ? 1 : p.ans.length) + ',34px)';
      for (var i = 0; i < p.ans.length; i++) {
        var rr = p.r0 + (p.down ? i : 0), cc = p.c0 + (p.down ? 0 : i);
        var k = rr + ',' + cc;
        (function (k, i) {
          var cell = el('div', 'g4-xcell'), inp = document.createElement('input');
          inp.className = 'g4-gap' + (solved[k] ? ' from' : '');
          inp.setAttribute('maxlength', '1');
          inp.setAttribute('autocomplete', 'off');
          inp.setAttribute('aria-label', 'Letter ' + (i + 1));
          if (solved[k]) inp.value = solved[k].toUpperCase();
          inp.addEventListener('input', function () { check(p); });
          cell.appendChild(inp);
          grid.appendChild(cell);
          cells.push({ inp: inp, key: k });
        })(k, i);
      }
      var first = cells.filter(function (c) { return !solved[c.key]; })[0];
      if (first && first.inp.focus) { try { first.inp.focus({ preventScroll: true }); } catch (e) { first.inp.focus(); } }
    }
    function check(p) {
      if (r.phase !== 'play') return;
      var typed = cells.map(function (c) { return (c.inp.value || '').toLowerCase(); }).join('');
      if (typed.length < p.ans.length) return;
      if (typed === p.ans) {
        cells.forEach(function (c) { solved[c.key] = (c.inp.value || '').toLowerCase(); });
        r.pick(r.queue[0].key);
      } else {
        cells.forEach(function (c) { if (!solved[c.key]) c.inp.value = ''; c.inp.classList.add('no'); });
        r.later(function () { cells.forEach(function (c) { c.inp.classList.remove('no'); }); }, 600);
      }
    }
    function mark(item, hit) {
      cells.forEach(function (c) { c.inp.classList.add(hit ? 'ok' : 'no'); c.inp.disabled = true; });
    }
    return { show: show, mark: mark, clear: clear, check: check };
  };

  /* ---------------- echoPads: hear it, then press the pad that matches ----------------
     The voice says the item; the pads are the options. A pad lights when pressed, so the room can
     see the guess, and the "again" button says it again. No files: the built-in voice is the clip. */
  PLUGINS.echoPads = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-echo'), pads = el('div', 'g4-pads');
    var line = el('div', 'g4-echo-line', '');
    box.appendChild(line); box.appendChild(pads);
    stage.appendChild(box);
    var els = [], pattern = [], step = 0, playing = false;
    var TONES = [392, 523, 659, 784];

    function lit(i, ms) {
      var p = els[i];
      if (!p) return;
      p.classList.remove('lit');
      p.classList.add('lit');
      SFX.tone(TONES[i % TONES.length], ms || 200, 'sine', 0.18);
      r.later(function () { p.classList.remove('lit'); }, (ms || 200) + 60);
    }
    /* the whole sequence is played back, then the student repeats it; every round adds one beat */
    function play() {
      if (r.phase !== 'play') return;
      playing = true;
      line.textContent = 'Listen… ' + pattern.length + ' beats';
      var i = 0;
      (function beat() {
        if (r.phase !== 'play') { playing = false; return; }
        if (i >= pattern.length) {
          playing = false; step = 0;
          line.textContent = 'Now you: all ' + pattern.length + ', in order';
          return;
        }
        lit(pattern[i], 200);
        i++;
        r.later(beat, 420);
      })();
    }
    function press(i) {
      if (r.phase !== 'play' || playing) return;
      lit(i, 200);
      if (i !== pattern[step]) {
        line.textContent = 'That was beat ' + (step + 1) + ' — it slipped.';
        r.later(function () { if (r.phase === 'play') r.resolve(null, 'miss'); }, 340);
        return;
      }
      step++;
      if (step < pattern.length) return;
      line.textContent = 'Echoed! ' + pattern.length + ' in a row.';
      r.later(function () { if (r.phase === 'play') r.pick(r.queue[0].key); }, 360);
    }
    function clear() { pads.innerHTML = ''; els = []; pattern = []; step = 0; playing = false; line.textContent = ''; }
    function show(item) {
      clear();
      item.opts.slice(0, 4).forEach(function (o, i) {
        var p = el('button', 'g4-pad', o.text);
        p.type = 'button';
        p.setAttribute('data-v', o.value);
        p.addEventListener('click', function () { press(i); });
        pads.appendChild(p);
        els.push(p);
      });
      /* round 1 is two beats, and each later round is one longer — the runner's item index is the
         round number, so the difficulty is the block's length, not a separate setting */
      var want = Math.min(6, 2 + r.idx);
      for (var i = 0; i < want; i++) pattern.push(Math.floor(Math.random() * Math.max(1, els.length)));
      r.later(play, 420);
    }
    function mark(item, hit, value) {
      els.forEach(function (p) {
        var v = p.getAttribute('data-v');
        if (v === value) p.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) p.classList.add('reveal');
      });
      if (!hit) line.textContent = 'It was ' + pattern.length + ' beats. Again next round.';
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
    function clear() { card.innerHTML = ''; tiles = []; phrase = ''; }
    function show(item) {
      clear();
      phrase = item.say || item.prompt || '';
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
      else { yell.textContent = 'Not that one.'; say(item.say || item.prompt || ''); }
    }
    return { show: show, mark: mark, clear: clear };
  };


  /* ---------------- ladderRun: rising stakes on a ladder, a safe rung every five ----------------
     A wrong answer drops the marker to the last safe rung — the run keeps what was safely earned,
     which is what makes a ladder a ladder and not a list. */
  PLUGINS.ladderRun = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-ladder'), rungs = el('div', 'g4-rungs'), opts = el('div', 'g4-raceopts');
    var marker = el('div', 'g4-marker');
    box.appendChild(rungs); box.appendChild(marker); box.appendChild(opts);
    stage.appendChild(box);
    var cells = [], safe = 0;
    function safeOf(n) { return Math.floor(n / 5) * 5; }
    function build() {
      rungs.innerHTML = ''; cells = [];
      for (var i = r.total; i >= 1; i--) {
        var c = el('div', 'g4-rung' + (i % 5 === 0 ? ' safe' : ''), String(i));
        rungs.appendChild(c);
        cells.push({ el: c, n: i });
      }
    }
    function place(n) { cells.forEach(function (c) { c.el.classList.toggle('on', c.n === n); }); }
    function clear() { opts.innerHTML = ''; place(r.score); }
    function show(item) {
      if (!cells.length) build();
      opts.innerHTML = '';
      place(r.score);
      item.opts.forEach(function (o) {
        var b = el('button', 'g4-raceopt', o.text);
        b.type = 'button';
        b.setAttribute('data-v', o.value);
        b.addEventListener('click', function () { if (r.phase === 'play') r.pick(o.value); });
        opts.appendChild(b);
      });
    }
    function mark(item, hit, value) {
      if (hit) safe = safeOf(r.score);
      [].forEach.call(opts.querySelectorAll('.g4-raceopt'), function (b) {
        var v = b.getAttribute('data-v');
        if (v === value) b.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) b.classList.add('reveal');
      });
      place(hit ? r.score : Math.max(0, safe));
      if (!hit) cells.forEach(function (c) { if (c.n <= safe) c.el.classList.add('kept'); });
    }
    return { show: show, mark: mark, clear: clear };
  };


  /* ---------------- bossRaid: a HP bar, three hearts, one ending ----------------
     Every correct answer lands a hit; every wrong one costs a heart. A long drill gets a shape and
     an end, which is the whole reason to skin it at all. */
  PLUGINS.bossRaid = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-boss'), art = el('div', 'g4-bossart'), bar = el('div', 'g4-hp'),
      hpFill = el('div', 'g4-hp-fill'), hearts = el('div', 'g4-hearts'), opts = el('div', 'g4-raceopts');
    art.innerHTML = '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">'
      + '<polygon points="60,8 105,34 105,86 60,112 15,86 15,34" fill="#3b2b4a" stroke="#1c1327" stroke-width="4"/>'
      + '<polygon points="60,26 88,42 88,78 60,94 32,78 32,42" fill="none" stroke="#c9a0e0" stroke-width="3"/>'
      + '<circle cx="45" cy="56" r="7" fill="#f2d6ff"/><circle cx="75" cy="56" r="7" fill="#f2d6ff"/>'
      + '<path d="M42 78q18 12 36 0" stroke="#f2d6ff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
    bar.appendChild(hpFill);
    box.appendChild(art); box.appendChild(bar); box.appendChild(hearts); box.appendChild(opts);
    stage.appendChild(box);
    var lives = 3;
    function drawHud() {
      var hp = r.total ? 1 - r.score / r.total : 0;
      hpFill.style.width = Math.max(0, Math.round(hp * 100)) + '%';
      hearts.textContent = '♥♥♥'.slice(0, lives) + '♡♡♡'.slice(0, 3 - lives);
    }
    function clear() { opts.innerHTML = ''; drawHud(); }
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
    function mark(item, hit, value) {
      if (hit) art.classList.add('hurt'); else lives = Math.max(0, lives - 1);
      drawHud();
      r.later(function () { art.classList.remove('hurt'); }, 300);
      [].forEach.call(opts.querySelectorAll('.g4-raceopt'), function (b) {
        var v = b.getAttribute('data-v');
        if (v === value) b.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) b.classList.add('reveal');
      });
      if (!lives) r.later(function () { if (r.running) r.finish(); }, 700);
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
