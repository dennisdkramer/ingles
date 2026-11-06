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
    var how = root.querySelector('.game-how');
    if (how) intro.appendChild(how);
    var rounds = Math.max(0, num(root, 'data-rounds', 0)) || this.items.length;
    var meta = el('ul', 'g4-intro-meta');
    var bits = ['<li><b>' + rounds + '</b> ' + (rounds === 1 ? 'round' : 'rounds') + '</li>'];
    if (this.itemTime) bits.push('<li><b>' + (Math.round(this.itemTime / 100) / 10) + 's</b> each</li>');
    if (this.limit) bits.push('<li><b>' + this.limit + 's</b> total</li>');
    bits.push('<li>keys <b>1–' + (this.items.length ? Math.max.apply(null, this.items.map(function (i) {
      return i.opts.length;
    })) : 1) + '</b></li>');
    meta.innerHTML = bits.join('');
    intro.appendChild(meta);
    this.intro = intro;
    var stage = el('div', 'g4-stage');
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
    intro.appendChild(btn);          /* the button lives on the intro screen, not under the block */
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

  /* ---------------- catchBasket: DRAG the token into the basket that fits ----------------
     Real pointer drag (mouse, pen, touch) with a tap-a-basket fallback, so a student who never
     discovers dragging still answers. The deadline is the runner's bar, not the motion. */
  PLUGINS.catchBasket = function (r) {
    var stage = r.stage;
    var tray = el('div', 'g4-tray');
    stage.appendChild(tray);
    var token = null, buckets = [], drag = null;

    function place(dx, dy, scale) {
      if (!token) return;
      token.style.transform = 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px) scale(' + (scale || 1) + ')';
    }
    function bucketAt(x, y) {
      var found = null;
      buckets.forEach(function (b) {
        b.classList.remove('hot');
        if (found) return;
        var q = b.getBoundingClientRect();
        if (x >= q.left - 14 && x <= q.right + 14 && y >= q.top - 22 && y <= q.bottom + 30) found = b;
      });
      if (found) found.classList.add('hot');
      return found;
    }
    function clear() {
      drag = null;
      if (token && token.parentNode) token.parentNode.removeChild(token);
      token = null;
      buckets.forEach(function (b) { if (b.parentNode) b.parentNode.removeChild(b); });
      buckets = [];
    }
    function show(item) {
      clear();
      item.opts.forEach(function (o) {
        var b = el('button', 'g4-bucket');
        b.type = 'button';
        b.setAttribute('data-v', o.value);
        b.innerHTML = ART.basket + '<span class="g4-bucket-t">' + esc(o.text) + '</span>';
        b.addEventListener('click', function () { if (r.phase === 'play') r.pick(o.value); });
        tray.appendChild(b);
        buckets.push(b);
      });
      token = el('div', 'g4-card', item.prompt);
      stage.appendChild(token);
      place(0, 0, 1);
      if (window.PointerEvent) {
        token.style.touchAction = 'none';
        token.addEventListener('pointerdown', down);
        token.addEventListener('pointermove', move);
        token.addEventListener('pointerup', up);
        token.addEventListener('pointercancel', up);
      }
    }
    function down(e) {
      if (r.phase !== 'play' || !token) return;
      if (e.preventDefault) e.preventDefault();
      if (token.setPointerCapture) { try { token.setPointerCapture(e.pointerId); } catch (x) { /* older engines */ } }
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
      token.classList.add('dragging');
    }
    function move(e) {
      if (!drag || e.pointerId !== drag.id) return;
      place(e.clientX - drag.x, e.clientY - drag.y, 1.05);
      bucketAt(e.clientX, e.clientY);
    }
    function up(e) {
      if (!drag) return;
      drag = null;
      if (token) token.classList.remove('dragging');
      var b = bucketAt(e.clientX, e.clientY);
      if (b) { r.pick(b.getAttribute('data-v')); return; }
      if (!token) return;
      token.style.transition = 'transform .28s cubic-bezier(.3,1.4,.6,1)';
      place(0, 0, 1);
      r.later(function () { if (token) token.style.transition = ''; }, 300);
    }
    function mark(item, hit, value) {
      var target = null;
      buckets.forEach(function (b) {
        var v = b.getAttribute('data-v');
        b.classList.remove('hot');
        if (v === value) { b.classList.add(hit ? 'ok' : 'no'); target = b; }
        else if (!hit && v === item.key) b.classList.add('reveal');
      });
      if (!token) return;
      if (hit && target) {
        var tq = token.getBoundingClientRect(), bq = target.getBoundingClientRect();
        token.style.transition = 'transform .34s ease-in,opacity .34s ease';
        token.style.transform = 'translate(-50%,-50%) translate('
          + ((bq.left + bq.width / 2) - (tq.left + tq.width / 2)) + 'px,'
          + ((bq.top + bq.height / 2) - (tq.top + tq.height / 2)) + 'px) scale(.4)';
        token.style.opacity = '.2';
      } else {
        token.classList.add('wrong');
      }
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

  /* ---------------- posters: one still per game, drawn behind the intro overlay ----------------
     Each uses the same classes the live game uses, so the picture is styled by the same CSS, and the
     labels are the lesson's own option words — the student sees this lesson's content in the game's
     furniture before pressing Play. Nothing here reads or writes an answer. */
  function opts0(items, n) {
    return (items[0].opts || []).slice(0, n || 3).map(function (o) { return o.text; });
  }
  function abs(node, css) { node.style.cssText = css; return node; }
  var POSTER = {
    catchBasket: function (box, items) {
      var texts = opts0(items, 3);
      texts.forEach(function (t, i) {
        var b = el('div', 'g4-bucket g4-bit');
        b.innerHTML = ART.basket + '<span class="g4-bucket-t">' + esc(t) + '</span>';
        abs(b, 'left:' + (4 + i * 32) + '%;bottom:6px;width:28%;height:30%');
        box.appendChild(b);
      });
      box.appendChild(abs(el('div', 'g4-card g4-bit', items[0].prompt),
        'left:50%;top:34%;transform:translate(-50%,-50%) rotate(-3deg)'));
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
    skeetRange: function (box, items) {
      opts0(items, 3).forEach(function (t, i) {
        box.appendChild(abs(el('div', 'g4-disc g4-bit', esc(t)),
          'left:' + (8 + i * 30) + '%;top:' + (24 + i * 12) + '%;width:26%;padding:10px 8px'));
      });
    },
    raceLane: function (box, items) {
      opts0(items, 4).forEach(function (t, i) {
        var lane = abs(el('div', 'g4-raceopt g4-bit'),
          'left:6%;top:' + (14 + i * 19) + '%;width:' + (34 + i * 12) + '%;');
        lane.innerHTML = '<i class="g4-car"></i><span>' + esc(t) + '</span>';
        box.appendChild(lane);
      });
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
    brickRight: function (box, items) {
      var texts = opts0(items, 4);
      for (var i = 0; i < 8; i++) {
        box.appendChild(abs(el('div', 'g4-brick g4-bit', texts[i % texts.length] || ''),
          'left:' + (4 + (i % 4) * 24) + '%;top:' + (8 + Math.floor(i / 4) * 16) + '%;width:22%;height:13%'));
      }
      box.appendChild(abs(el('div', 'g4-ball g4-bit'), 'left:46%;bottom:26%;width:18px;height:18px'));
      box.appendChild(abs(el('div', 'g4-paddle g4-bit'), 'left:34%;bottom:9%;width:32%;height:12px'));
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

    lockCode: function (box, items) {
    var dial = el('div', 'g4-dial g4-bit');
    for (var i = 0; i < 3; i++) dial.appendChild(el('div', 'g4-digit', ''));
    abs(dial, 'left:0;right:0;top:6%;display:flex;justify-content:center;gap:8px');
    box.appendChild(dial);
    var pad = el('div', 'g4-pad g4-bit');
    for (var k = 1; k <= 5; k++) pad.appendChild(el('div', 'g4-key', String(k)));
    abs(pad, 'left:6%;right:6%;bottom:8%;display:grid;grid-template-columns:repeat(5,1fr);gap:6px');
    box.appendChild(pad);
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
  spinPick: function (box, items) {
    var reel = el('div', 'g4-reel g4-bit');
    ['7', '·', '3'].forEach(function (ch, i) {
      reel.appendChild(el('div', 'g4-reel-d', i === 1 ? (String(items.length)) : ch));
    });
    abs(reel, 'left:50%;top:30%;transform:translateX(-50%);display:flex;gap:8px');
    box.appendChild(reel);
  },
  ladderRun: function (box, items) {
    var rungs = el('div', 'g4-rungs g4-bit');
    for (var i = 0; i < 8; i++) {
      rungs.appendChild(el('div', 'g4-rung' + (i === 3 ? ' safe' : '') + (i === 2 ? ' on' : ''), String(i + 1)));
    }
    abs(rungs, 'left:6%;top:14%;bottom:14%;display:flex;flex-direction:column-reverse;gap:3px;width:64px');
    box.appendChild(rungs);
  },
  boardQuiz: function (box, items) {
    var cols = Math.max(2, (items[0].opts || []).length);
    var grid = el('div', 'g4-bgrid g4-bit');
    grid.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    for (var i = 0; i < cols * 3; i++) {
      grid.appendChild(el('div', 'g4-bcell' + (i === 1 ? ' on' : ''), String((i % 3) + 1)));
    }
    abs(grid, 'left:50%;top:52%;transform:translate(-50%,-50%);width:80%');
    box.appendChild(grid);
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

  /* ---------------- skeetRange: aim, ONE shot per item ----------------
     Each option is a disc drifting on its own slow arc; the cursor is the crosshair. One click is
     the shot — no spray, no retry, which is exactly what makes it feel like skill. */
  PLUGINS.skeetRange = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-skeet');
    var discs = [];
    stage.appendChild(box);
    function clear() { box.innerHTML = ''; discs = []; }
    function show(item) {
      clear();
      item.opts.forEach(function (o, i) {
        var d = el('button', 'g4-disc', o.text);
        d.type = 'button';
        d.setAttribute('data-v', o.value);
        d.style.top = (18 + (i % 3) * 26) + '%';
        d.style.animationDuration = (5.2 + i * 1.1) + 's';
        d.style.animationDelay = (i % 2 ? '-2.4s' : '0s');
        d.addEventListener('click', function (e) {
          e.stopPropagation();
          if (r.phase === 'play') r.pick(o.value);
        });
        box.appendChild(d);
        discs.push(d);
      });
    }
    function mark(item, hit, value) {
      discs.forEach(function (d) {
        var v = d.getAttribute('data-v');
        if (v === value) d.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) d.classList.add('reveal');
        d.classList.add('halt');
      });
    }
    return { show: show, mark: mark, clear: clear };
  };

  /* ---------------- raceLane: answer to accelerate ----------------
     Correct answers push the avatar toward the finish, wrong ones stall it, and the ghost of the
     student's best run is the opponent — competition without a server. */
  PLUGINS.raceLane = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-race');
    var trackB = el('div', 'g4-lane ghost'), trackA = el('div', 'g4-lane');
    var carA = el('div', 'g4-car'), carB = el('div', 'g4-car');
    var opts = el('div', 'g4-raceopts');
    trackA.appendChild(carA); trackB.appendChild(carB);
    box.appendChild(trackB); box.appendChild(trackA); box.appendChild(opts);
    stage.appendChild(box);
    var ghostKey = 'g4ghost:' + (r.root.id || 'race') + ':' + r.total;
    function ghost() { try { return Number(localStorage.getItem(ghostKey)) || 0; } catch (e) { return 0; } }
    function place() {
      var done = r.total ? Math.min(1, r.score / r.total) : 0;
      carA.style.left = (done * 100).toFixed(1) + '%';
      carB.style.left = (Math.min(1, ghost()) * 100).toFixed(1) + '%';
    }
    function clear() { opts.innerHTML = ''; place(); }
    function show(item) {
      opts.innerHTML = '';
      place();
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
      place();
      if (hit) {
        try {
          if (r.score / r.total > ghost()) localStorage.setItem(ghostKey, String(r.score / r.total));
        } catch (e) { /* private mode is not an error */ }
      }
    }
    return { show: show, mark: mark, clear: clear };
  };

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

  /* ---------------- brickRight: breakout, but the bricks are the options ----------------
     The paddle follows the pointer, the ball does the choosing: the brick it knocks out is the
     answer. Two rectangles and a vector is the whole physics. Reduced motion turns the bricks into
     plain buttons. */
  PLUGINS.brickRight = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-brk'), field = el('div', 'g4-bricks');
    var canvas = document.createElement('canvas');
    canvas.className = 'g4-canvas';
    box.appendChild(field); box.appendChild(canvas);
    stage.appendChild(box);
    var raf = 0, live = false, bricks = [], paddleX = 0.5, ball = null, key = null, ctx = null;

    function stop() { live = false; if (raf && window.cancelAnimationFrame) window.cancelAnimationFrame(raf); raf = 0; }
    function clear() { stop(); field.innerHTML = ''; bricks = []; ball = null; }
    function paint() {
      if (!ctx) return;
      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#182136';
      ctx.fillRect(paddleX * w - 34, h - 22, 68, 9);
      if (ball) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#b9854c';
        ctx.fill();
      }
    }
    function show(item) {
      clear();
      key = item.key;
      item.opts.forEach(function (o) {
        var b = el('button', 'g4-brick', o.text);
        b.type = 'button';
        b.setAttribute('data-v', o.value);
        b.addEventListener('click', function () { if (r.phase === 'play') r.pick(o.value); });
        field.appendChild(b);
        bricks.push({ el: b, value: o.value, dead: false });
      });
      if (r.reduced) return;
      canvas.width = canvas.clientWidth || 520;
      canvas.height = canvas.clientHeight || 160;
      ctx = canvas.getContext ? canvas.getContext('2d') : null;
      ball = { x: canvas.width / 2, y: canvas.height - 40, vx: 2.2, vy: -2.6 };
      live = true;
      var frame = function () {
        if (!live || !ball) return;
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.x < 6 || ball.x > canvas.width - 6) ball.vx *= -1;
        if (ball.y < 6) ball.vy *= -1;
        var px = paddleX * canvas.width;
        if (ball.y > canvas.height - 26 && Math.abs(ball.x - px) < 44) ball.vy = -Math.abs(ball.vy);
        if (ball.y > canvas.height + 12) {                     // a dropped ball is a free retry
          ball.x = canvas.width / 2; ball.y = canvas.height - 40; ball.vy = -2.6;
        }
        paint();
        raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : 0;
      };
      raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : 0;
    }
    function move(e) {
      var box2 = box.getBoundingClientRect();
      var p = (e.clientX - box2.left) / Math.max(1, box2.width);
      paddleX = Math.min(0.94, Math.max(0.06, p));
      paint();
    }
    box.addEventListener('pointermove', move);
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { paddleX = Math.max(0.06, paddleX - 0.06); paint(); }
      if (e.key === 'ArrowRight') { paddleX = Math.min(0.94, paddleX + 0.06); paint(); }
    });
    box.setAttribute('tabindex', '0');
    function mark(item, hit, value) {
      stop();
      bricks.forEach(function (b) {
        if (b.value === value) b.el.classList.add(hit ? 'ok' : 'no');
        else if (!hit && b.value === key) b.el.classList.add('reveal');
      });
    }
    return { show: show, mark: mark, clear: clear };
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

  /* ---------------- lockCode: every correct answer releases one digit ----------------
     The expected digit is authored on the item (`data-code`), else it is the correct option's slot.
     Typing it on the keypad opens that digit's box; a wrong digit is spent. */
  PLUGINS.lockCode = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-lock'), dial = el('div', 'g4-dial'), pad = el('div', 'g4-pad');
    var want = '';
    box.appendChild(dial); box.appendChild(pad);
    stage.appendChild(box);
    function digitOf(item) {
      var own = item.item.getAttribute('data-code');
      if (own) return String(own).slice(0, 1);
      var i = 0, at = 0;
      item.opts.forEach(function (o) { if (o.value === item.key) at = i; i++; });
      return String(at + 1);
    }
    function clear() { pad.innerHTML = ''; dial.innerHTML = ''; }
    function show(item) {
      clear();
      want = digitOf(item);
      var d = el('div', 'g4-digit', '?');
      d.setAttribute('data-want', want);
      dial.appendChild(d);
      for (var n = 1; n <= 9; n++) {
        (function (n) {
          var b = el('button', 'g4-key', String(n));
          b.type = 'button';
          b.addEventListener('click', function () {
            if (r.phase !== 'play') return;
            if (String(n) === want) r.pick(item.key);
            else r.expire();
          });
          pad.appendChild(b);
        })(n);
      }
    }
    function mark(item, hit) {
      var d = dial.querySelector('.g4-digit');
      if (d) {
        d.textContent = hit ? want : '✕';
        d.className = 'g4-digit ' + (hit ? 'ok' : 'no');
      }
      [].forEach.call(pad.querySelectorAll('.g4-key'), function (k) {
        if (k.textContent === want) k.classList.add('reveal');
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
    var again = el('button', 'g4-again', '🔊 Say it again');
    again.type = 'button';
    box.appendChild(pads); box.appendChild(again);
    stage.appendChild(box);
    var els = [], phrase = '';
    again.addEventListener('click', function () { say(phrase); });
    function clear() { pads.innerHTML = ''; els = []; phrase = ''; }
    function show(item) {
      clear();
      phrase = item.say || item.prompt || '';
      item.opts.forEach(function (o) {
        var p = el('button', 'g4-pad', o.text);
        p.type = 'button';
        p.setAttribute('data-v', o.value);
        p.addEventListener('click', function () {
          if (r.phase !== 'play') return;
          p.classList.add('lit');
          r.later(function () { p.classList.remove('lit'); }, 260);
          r.pick(o.value);
        });
        pads.appendChild(p);
        els.push(p);
      });
      r.later(function () { if (r.phase === 'play') say(phrase); }, 260);
    }
    function mark(item, hit, value) {
      els.forEach(function (p) {
        var v = p.getAttribute('data-v');
        if (v === value) p.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) p.classList.add('reveal');
      });
      if (!hit) say(item.say || item.prompt || '');
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

  /* ---------------- spinPick: the reel decides what comes next ----------------
     Carries no answer: it is the companion that removes the "1, 2, 3" march. The reel lands on the
     item's number, then the item is answered right under it. */
  PLUGINS.spinPick = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-spin'), reel = el('div', 'g4-reel'), opts = el('div', 'g4-spinopts');
    var lever = el('button', 'g4-lever', '🎰 Spin');
    lever.type = 'button';
    box.appendChild(reel); box.appendChild(lever); box.appendChild(opts);
    stage.appendChild(box);
    var digits = [], ticker = 0;
    for (var i = 0; i < 3; i++) { var d = el('div', 'g4-reel-d', '0'); reel.appendChild(d); digits.push(d); }
    function land(n) {
      var s = String(n).padStart(3, '0');
      digits.forEach(function (d, i) { d.textContent = s[i]; });
      reel.classList.remove('spinning');
    }
    function go() {
      if (ticker) { clearInterval(ticker); ticker = 0; }
      if (r.reduced) { land(r.idx + 1); return; }
      reel.classList.add('spinning');
      ticker = setInterval(function () {
        digits.forEach(function (d) { d.textContent = Math.floor(Math.random() * 10); });
      }, 60);
      r.later(function () { if (ticker) { clearInterval(ticker); ticker = 0; } land(r.idx + 1); }, 700);
    }
    lever.addEventListener('click', go);
    function clear() { opts.innerHTML = ''; if (ticker) { clearInterval(ticker); ticker = 0; } }
    function show(item) {
      clear();
      go();
      item.opts.forEach(function (o) {
        var b = el('button', 'g4-spinopt', o.text);
        b.type = 'button';
        b.setAttribute('data-v', o.value);
        b.addEventListener('click', function () { if (r.phase === 'play') r.pick(o.value); });
        opts.appendChild(b);
      });
    }
    function mark(item, hit, value) {
      [].forEach.call(opts.querySelectorAll('.g4-spinopt'), function (b) {
        var v = b.getAttribute('data-v');
        if (v === value) b.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) b.classList.add('reveal');
      });
    }
    return { show: show, mark: mark, clear: clear, spin: go };
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

  /* ---------------- boardQuiz: a board of cells, two teams, points ----------------
     Teams alternate on every answer, so the board reads as a game long before anyone wins it. The
     grid is the difficulty axis; the cells are the items. */
  PLUGINS.boardQuiz = function (r) {
    var stage = r.stage;
    var box = el('div', 'g4-board'), grid = el('div', 'g4-bgrid'), head = el('div', 'g4-bhead');
    var opts = el('div', 'g4-raceopts');
    box.appendChild(head); box.appendChild(grid); box.appendChild(opts);
    stage.appendChild(box);
    var cells = [], team = 0, scores = [0, 0];
    function drawHead() {
      head.innerHTML = '<span class="g4-team' + (team === 0 ? ' on' : '') + '">A · ' + scores[0] + '</span>'
        + '<span class="g4-team' + (team === 1 ? ' on' : '') + '">B · ' + scores[1] + '</span>';
    }
    function build() {
      grid.innerHTML = ''; cells = [];
      r.items.forEach(function (it, i) {
        var c = el('div', 'g4-bcell', String(i + 1));
        grid.appendChild(c);
        cells.push(c);
      });
      grid.style.gridTemplateColumns = 'repeat(' + Math.min(6, Math.max(3, cells.length)) + ',1fr)';
    }
    function clear() { opts.innerHTML = ''; drawHead(); }
    function show(item) {
      if (!cells.length) build();
      opts.innerHTML = '';
      drawHead();
      cells.forEach(function (c, i) { c.classList.toggle('on', i === r.idx); c.classList.remove('done'); });
      item.opts.forEach(function (o) {
        var b = el('button', 'g4-raceopt', o.text);
        b.type = 'button';
        b.setAttribute('data-v', o.value);
        b.addEventListener('click', function () { if (r.phase === 'play') r.pick(o.value); });
        opts.appendChild(b);
      });
    }
    function mark(item, hit, value) {
      if (hit) scores[team]++;
      if (cells[r.idx]) cells[r.idx].classList.add(hit ? 'done' : 'lost');
      team = 1 - team;
      drawHead();
      [].forEach.call(opts.querySelectorAll('.g4-raceopt'), function (b) {
        var v = b.getAttribute('data-v');
        if (v === value) b.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) b.classList.add('reveal');
      });
    }
    return { show: show, mark: mark, clear: clear, scores: function () { return scores.slice(); } };
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
