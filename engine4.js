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

    /* the intro screen: the block's own how-text and Start button move inside it, so before play the
       block reads as a screen instead of as a form with a button under it */
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
    root.insertBefore(intro, root.firstChild);
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
    root.insertBefore(stage, intro.nextSibling);

    var btn = root.querySelector('.game-start');
    if (!btn) { btn = el('button', 'game-start', '▶ Play'); btn.type = 'button'; }
    if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
    btn.textContent = '▶ Play';
    intro.appendChild(btn);          /* the button lives on the intro screen, not under the block */
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
    return this.score;
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
