/* ---- engine4.js — Tier-1 games v2: ONE runner, many presentations ------------------------------
   Contract (FUNCTION.md owns behaviour, FORMAT.md the block):
   - The PAGE carries the real answers: `.game > .game-list > .qitem` — a `.qstem` prompt, an
     optional `.listen` chip, and `input[type=radio]` options. That markup persists, prints, and is
     what a student sees if this file never runs.
   - This engine only PRESENTS those items and MARKS the radios: a correct pick checks the option it
     stands for and dispatches `change`, so engine1/engine2 save it exactly like a normal answer. A
     wrong pick leaves the radio untouched — a blank is the teacher's evidence.
   - Versatility rule: the runner owns the queue, scoring, replay, HUD and timing; a game supplies
     only `show / mark / clear`. Authoring is therefore identical for every game, and `data-game`
     can be swapped without touching one word of content.
   Levers (all optional, all on the `.game` element):
     data-game      catchBasket | whackMole              which presentation
     data-speed     catchBasket px/s fall (60) · whackMole ms on screen (3400)
     data-limit     seconds for the whole run, 0 = off (0)
     data-replay    0 | 1  missed items return once at the end (1)
     data-shuffle   0 | 1  present items in random order (1)
     data-rounds    how many items a run uses, 0 = all authored (0)
     data-prompt    0 | 1  show the stem in the HUD line (1). Off when the game shows it itself.
     data-skin      free-form name; CSS may theme on it, the engine never reads it
   Test hook: window.__G4 is the list of live runners; each exposes `_test`
   (start / pick / expire / step / state), so a headless test drives the state machine.
--------------------------------------------------------------------------------------------- */
window.GAMES4 = (function () {
  var PLUGINS = {};

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function num(el, name, dflt) {
    var v = el.getAttribute(name);
    var n = v == null || v === '' ? NaN : Number(v);
    return isFinite(n) ? n : dflt;
  }
  function flag(el, name, dflt) {
    var v = el.getAttribute(name);
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
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* one item = one authored `.qitem`. The right answer is `data-a` when the author pinned it, else
     the option that matches the clip's `data-say` (when the spoken word IS the question, no answer
     key has to be written into the page). */
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
    this.limit = Math.max(0, num(root, 'data-limit', 0));
    this.limitLeft = this.limit;
    this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.running = false; this.replaying = false; this.phase = 'idle';
    this.missed = []; this.timers = []; this.clock = 0;

    /* the animated layer is built once and inserted after `.game-how`; the authored list stays
       underneath, untouched, and is what prints or shows if this file never runs */
    root.className += ' g4';
    var stage = el('div', 'g4-stage');
    var hud = el('div', 'g4-hud');
    hud.innerHTML = '<span class="wave"></span><span class="score"></span><span class="clock"></span>';
    stage.appendChild(hud);
    var prompt = el('div', 'g4-prompt');
    if (this.usePrompt) stage.appendChild(prompt);
    this.stage = stage; this.hudEl = hud; this.promptEl = prompt;
    var how = root.querySelector('.game-how');
    root.insertBefore(stage, how ? how.nextSibling : root.firstChild);

    var btn = root.querySelector('.game-start');
    if (!btn) { btn = el('button', 'game-start', '▶ Start'); btn.type = 'button'; root.appendChild(btn); }
    if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
    btn.addEventListener('click', function () { self.start(); });
    this.btn = btn;
    this.view = this.plugin ? this.plugin(this) : null;
    if (!this.items.length) { btn.disabled = true; btn.textContent = 'No items'; }

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
  };
  Runner.prototype.hud = function () {
    this.hudEl.querySelector('.score').textContent = this.score + ' pt';
    this.hudEl.querySelector('.wave').textContent = Math.min(this.idx + 1, this.total) + '/' + this.total;
    this.hudEl.querySelector('.clock').textContent = this.limit ? Math.ceil(this.limitLeft) + 's' : '';
  };
  Runner.prototype.setPrompt = function (text, on) {
    if (!this.usePrompt) return;
    this.promptEl.textContent = text;
    this.promptEl.classList[on ? 'add' : 'remove']('in');
  };

  /* start: the student's press is the only way in — no autoplay, no surprise motion */
  Runner.prototype.start = function () {
    var self = this;
    if (!this.items.length) return false;
    this.clearTimers();
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
    if (this.view) this.view.mark(it, hit, value);
    this.later(function () {
      if (self.view) self.view.clear();
      self.queue.shift(); self.idx++;
      self.setPrompt('', false);
      self.next();
    }, hit ? 520 : 900);
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
    var line = this.root.querySelector('.game-score-line');
    if (!line) { line = el('p', 'game-score-line'); this.root.appendChild(line); }
    line.textContent = 'Score: ' + this.score + ' / ' + this.total
      + (this.score === this.total ? ' — clean run.' : ' — go again when you like.');
    this.btn.textContent = '↻ Play again';
    return this.score;
  };

  Runner.prototype.state = function () {
    return {
      phase: this.phase, idx: this.idx, score: this.score, total: this.total,
      running: this.running, replaying: this.replaying, missed: this.missed.length,
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

  /* ---------------- game: catchBasket — categorise it before it lands ----------------
     The prompt falls as a token; every option is a bucket. One click is one answer, and the fall is
     the deadline. Any task whose options are categories, labels or two competing forms fits. */
  PLUGINS.catchBasket = function (r) {
    var stage = r.stage;
    var speed = Math.max(15, num(r.root, 'data-speed', 60));   // px per second
    var tray = el('div', 'g4-tray');
    var token = null, buckets = [], live = false, raf = 0;
    stage.appendChild(tray);

    function floorY() { return Math.max(30, (stage.clientHeight || 260) - 104); }
    function stop() {
      live = false;
      if (raf && window.cancelAnimationFrame) window.cancelAnimationFrame(raf);
      raf = 0;
    }
    function clear() {
      stop();
      if (token && token.parentNode) token.parentNode.removeChild(token);
      token = null;
      buckets.forEach(function (b) { if (b.parentNode) b.parentNode.removeChild(b); });
      buckets = [];
    }
    function show(item) {
      clear();
      item.opts.forEach(function (o) {
        var b = el('button', 'g4-bucket', o.text);
        b.type = 'button';
        b.setAttribute('data-v', o.value);
        b.addEventListener('click', function () { if (live) r.pick(o.value); });
        tray.appendChild(b);
        buckets.push(b);
      });
      token = el('div', 'g4-token', item.prompt);
      stage.appendChild(token);
      live = true;
      var to = floorY();
      if (r.reduced) {
        token.style.transform = 'translate(-50%,' + to + 'px)';
      } else {
        var t0 = (window.performance && window.performance.now) ? window.performance.now() : Date.now();
        var frame = function (now) {
          if (!live) return;
          var dt = Math.max(0, ((now || t0) - t0) / 1000);
          var y = Math.min(to, 8 + speed * dt);
          token.style.transform = 'translate(-50%,' + y.toFixed(1) + 'px)';
          if (y >= to) { r.expire(); return; }
          raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : 0;
        };
        raf = window.requestAnimationFrame ? window.requestAnimationFrame(frame) : 0;
      }
      /* the deadline is a timer, not the animation: a dropped frame must never swallow an item */
      r.later(function () { if (live) { live = false; r.expire(); } }, Math.max(700, (to / speed) * 1000) + 40);
    }
    function mark(item, hit, value) {
      stop();
      buckets.forEach(function (b) {
        var v = b.getAttribute('data-v');
        if (v === value) b.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) b.classList.add('reveal');
      });
      if (token) {
        token.style.transform = '';
        token.classList.add(hit ? 'caught' : 'spilled');
      }
    }
    return { show: show, mark: mark, clear: clear };
  };

  /* ---------------- game: whackMole — hit it before it ducks ----------------
     Every option pops out of a hole; click the one that fits before they drop. Recognition under
     time, so it suits any task with a right/not-right answer. */
  PLUGINS.whackMole = function (r) {
    var stage = r.stage;
    var dwell = Math.max(700, num(r.root, 'data-speed', 3400));   // ms on screen
    var grid = el('div', 'g4-grid'), moles = [];
    stage.appendChild(grid);

    function clear() { grid.innerHTML = ''; moles = []; }
    function show(item) {
      clear();
      var holes = [], n = Math.max(6, Math.min(9, item.opts.length + 2));
      for (var i = 0; i < n; i++) { var h = el('div', 'g4-hole'); grid.appendChild(h); holes.push(h); }
      var slots = shuffle(holes.slice()).slice(0, item.opts.length);
      item.opts.forEach(function (o, i) {
        if (!slots[i]) return;
        var m = el('button', 'g4-mole', o.text);
        m.type = 'button';
        m.setAttribute('data-v', o.value);
        m.addEventListener('click', function () { if (r.phase === 'play') r.pick(o.value); });
        slots[i].appendChild(m);
        moles.push(m);
      });
      r.later(function () { if (r.phase === 'play') r.expire(); }, dwell);
    }
    function mark(item, hit, value) {
      moles.forEach(function (m) {
        var v = m.getAttribute('data-v');
        if (v === value) m.classList.add(hit ? 'ok' : 'no');
        else if (!hit && v === item.key) m.classList.add('reveal');
      });
    }
    return { show: show, mark: mark, clear: clear };
  };

  function boot() {
    var names = Object.keys(PLUGINS);
    var roots = [].slice.call(document.querySelectorAll('.game')).filter(function (r) {
      return names.indexOf(r.getAttribute('data-game')) > -1;
    });
    window.__G4 = roots.map(function (r) {
      if (r.__g4) return r.__g4;
      var i = new Runner(r);
      i.hooks = i._test();
      r.__g4 = i;
      return i;
    });
    return window.__G4.length;
  }

  return { boot: boot, games: Object.keys(PLUGINS), version: 1 };
})();

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { window.GAMES4.boot(); });
else window.GAMES4.boot();
