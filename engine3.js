/* ---- engine3.js — Tier-1 generic games (first game: shootPair) ------------------------------
   Contract (FUNCTION.md owns the behaviour, FORMAT.md the block):
   - The PAGE carries the real answers: a `.game` block holding `.game-list` with ordinary
     `.qitem`s (a `.qstem` prompt, optional `.listen` chip, and `input[type=radio]` options).
     That markup is what persists, what prints, and what a student sees if this file never runs.
   - This engine only ANIMATES and MARKS those radios: shooting a target checks the option it
     stands for and dispatches `change`, so engine1/engine2 save it exactly like a normal answer.
   - Levers (all on the `.game` element, all optional):
       data-skin   duck | ufo            the target's shape + flight style (generic per skin)
       data-speed  px per second         how fast the targets cross the stage   (default 110)
       data-limit  seconds (0 = off)     a countdown; expiring = a miss         (default 0)
       data-replay 0 | 1                 missed items come back once at the end (default 1)
     Item difficulty is NOT an engine lever: it is the content's (the words the lesson chose).
   - Sequence per item: prompt fades in (1s) → 2s countdown → targets take off → shoot → next.
     A wrong shot, or no shot before the limit, is a miss (0 points); a hit is 1 point.
   - Test hook: window.__G is the list of live instances; each exposes `_test` (shoot/takeoff/
     tick/state) so qa/games.mjs drives the state machine without real timers. */
window.GAMES = (function () {
  var SKINS = {
    duck: {
      cls: 'duck',
      svg: function () {
        return '<svg viewBox="0 0 118 74"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">'
          + '<path d="M22 52c0-11 9-19 21-19h22c9 0 15 4 15 11s-6 11-15 11H45c-11 0-23-3-23-3z" fill="currentColor" fill-opacity=".28"/>'
          + '<circle cx="74" cy="24" r="13" fill="currentColor" fill-opacity=".28"/>'
          + '<path d="M87 21l13 5-13 5z" fill="currentColor" fill-opacity=".5"/>'
          + '<circle cx="77" cy="21" r="1.9" fill="currentColor" stroke="none"/>'
          + '<path d="M46 46c5 6 12 7 18 5"/>'
          + '<path d="M22 52l-13-3 9 9z" fill="currentColor" fill-opacity=".4"/>'
          + '</g></svg>';
      },
      bob: 7, tilt: 3
    },
    ufo: {
      cls: 'ufo',
      svg: function () {
        return '<svg viewBox="0 0 118 74"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">'
          + '<ellipse cx="59" cy="42" rx="42" ry="13" fill="currentColor" fill-opacity=".25"/>'
          + '<path d="M39 36c2-11 10-17 20-17s18 6 20 17z" fill="currentColor" fill-opacity=".35"/>'
          + '<path d="M52 55l7 12 7-12"/>'
          + '<circle cx="59" cy="22" r="2" fill="currentColor" stroke="none"/>'
          + '</g></svg>';
      },
      bob: 2, tilt: 0
    }
  };

  function norm(s) {
    return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function num(el, name, dflt) {
    var v = el.getAttribute(name);
    var n = v == null || v === '' ? NaN : Number(v);
    return isFinite(n) ? n : dflt;
  }
  function radios(item) { return [].slice.call(item.querySelectorAll('input[type="radio"]')); }
  /* one wave = one authored .qitem: its prompt, its options, and which option is right. The right
     answer is `data-a` when the author pinned it, else the option that matches the clip's data-say
     (the spoken word IS the question, so no answer key has to be written into the page). */

  function Instance(root) {
    var self = this;
    this.root = root;
    this.skin = SKINS[root.getAttribute('data-skin')] || SKINS.duck;
    this.speed = Math.max(30, num(root, 'data-speed', 110));
    this.limit = Math.max(0, num(root, 'data-limit', 0));
    this.replay = num(root, 'data-replay', 1) !== 0;
    this.waves = readWaves(root);
    this.queue = this.waves.slice();
    this.idx = 0; this.score = 0; this.total = this.waves.length;
    this.replaying = false; this.running = false;
    this.targets = []; this.limitLeft = 0; this.raf = 0; this.timers = []; this.phase = 'idle';
    this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    /* --- build the animated layer once; the authored list stays untouched underneath --- */
    var stage = root.querySelector('.game-stage');
    if (stage) stage.parentNode.removeChild(stage);
    stage = document.createElement('div'); stage.className = 'game-stage';
    var prompt = document.createElement('div'); prompt.className = 'game-prompt';
    var hud = document.createElement('div'); hud.className = 'game-hud';
    hud.innerHTML = '<span class="wave"></span><span class="score"></span><span class="clock"></span>';
    var fade = document.createElement('div'); fade.className = 'game-fade';
    stage.appendChild(fade); stage.appendChild(prompt); stage.appendChild(hud);
    root.insertBefore(stage, root.firstElementChild);
    this.stage = stage; this.promptEl = prompt; this.hud = hud; this.fade = fade;

    var btn = root.querySelector('.game-start');
    if (!btn) { btn = document.createElement('button'); btn.type = 'button'; btn.className = 'game-start'; root.insertBefore(btn, stage.nextSibling); }
    btn.textContent = '▶ Start';
    btn.addEventListener('click', function () { self.start(); });
    this.btn = btn;
    if (!this.waves.length) { btn.disabled = true; btn.textContent = 'No items'; }

    root.addEventListener('keydown', function (e) {
      if (!self.running) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.start(); } return; }
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= self.targets.length) { e.preventDefault(); self.shoot(self.targets[n - 1].value); }
    });
  }

  Instance.prototype.later = function (fn, ms) {
    var self = this;
    var id = setTimeout(function () { self.timers = self.timers.filter(function (t) { return t !== id; }); fn(); }, ms);
    this.timers.push(id);
    return id;
  };
  Instance.prototype.clearTimers = function () {
    this.timers.forEach(clearTimeout); this.timers = [];
    if (this.raf) { if (window.cancelAnimationFrame) cancelAnimationFrame(this.raf); this.raf = 0; }
  };
  Instance.prototype.hudSet = function () {
    this.hud.querySelector('.score').textContent = this.score + ' pt';
    this.hud.querySelector('.wave').textContent = Math.min(this.idx + 1, this.total) + '/' + this.total;
    this.hud.querySelector('.clock').textContent = this.limit ? Math.ceil(this.limitLeft) + 's' : '';
  };
  Instance.prototype.setPrompt = function (text, on) {
    this.promptEl.textContent = text;
    this.promptEl.classList[on ? 'add' : 'remove']('in');
  };

  function readWaves(root) {
    return [].slice.call(root.querySelectorAll('.game-list .qitem')).map(function (it) {
      var stem = it.querySelector('.qstem');
      var listen = it.querySelector('.listen');
      var say = listen ? norm(listen.getAttribute('data-say')) : '';
      var opts = radios(it).map(function (r) {
        var lab = r.parentElement;
        return { value: r.value, text: norm(lab ? lab.textContent : ''), radio: r, label: lab };
      });
      var key = it.getAttribute('data-a');
      if (!key) {
        var m = null;
        opts.forEach(function (o) { if (!m && say && o.text === say) m = o; });
        key = m ? m.value : '';
      }
      return {
        item: it, prompt: stem ? stem.textContent.trim() : '', say: listen ? listen.getAttribute('data-say') : '',
        opts: opts, key: key
      };
    });
  }

  /* start: the user's press is the only way in (no autoplay, no surprise motion) */
  Instance.prototype.start = function () {
    if (this.running || !this.waves.length) return;
    this.running = true; this.score = 0; this.idx = 0; this.replaying = false;
    this.queue = this.waves.slice(); this.missed = [];
    this.root.classList.add('is-on');
    this.btn.style.display = 'none';
    var line = this.root.querySelector('.game-score-line');
    if (line) line.remove();
    this.hudSet();
    this.next();
  };

  /* next: fade the item in (1s), hold, then let the targets take off (2s after the reveal) */
  Instance.prototype.next = function () {
    var self = this;
    this.clearTimers();
    if (!this.queue.length) return this.finish();
    this.phase = 'fade';
    this.wave = this.queue[0];
    this.fade.classList.add('on');
    this.setPrompt(this.wave.prompt, false);
    this.targets = [];
    this.hudSet();
    this.later(function () {
      self.fade.classList.remove('on');
      self.setPrompt(self.wave.prompt, true);
      self.phase = 'countdown';
      self.limitLeft = self.limit;
      self.hudSet();
      self.later(function () { self.takeoff(); }, 2000);
    }, self.reduced ? 0 : 1000);
  };

  /* takeoff: one target per option, each carrying its word on a plaque; they cross the stage */
  Instance.prototype.takeoff = function () {
    var self = this;
    if (!this.wave) return;
    this.phase = 'fly';
    [].slice.call(this.stage.querySelectorAll('.target')).forEach(function (t) { t.remove(); });
    var w = this.stage.clientWidth || 1120, h = this.stage.clientHeight || 240;
    var n = this.wave.opts.length;
    if (this.wave.say && typeof window.playSay === 'function') { try { window.playSay(this.wave.say); } catch (e) { } }
    this.targets = this.wave.opts.map(function (o, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'target ' + self.skin.cls;
      b.setAttribute('data-v', o.value);
      b.setAttribute('aria-label', o.text || ('target ' + (i + 1)));
      b.innerHTML = self.skin.svg() + '<span class="plaque">' + (o.label ? o.label.textContent.trim() : o.text) + '</span>';
      b.addEventListener('click', function (ev) { ev.preventDefault(); self.shoot(o.value); });
      self.stage.appendChild(b);
      var lane = n === 1 ? 0.5 : (i + 0.5) / n;
      return { value: o.value, el: b, x: -140, y: 30 + lane * (h - 130), phase: i * 1.3 };
    });
    var start = (window.performance && performance.now) ? performance.now() : Date.now();
    var travel = (w + 190) / this.speed * 1000;
    var amp = this.reduced ? 0 : this.skin.bob;
    this.tick = function (now) {
      if (self.phase !== 'fly') return;
      var t = now - start, k = Math.min(1, t / travel), out = 0;
      self.targets.forEach(function (tg) {
        tg.x = -140 + k * (w + 190);
        var bobY = amp ? Math.sin(t / 420 + tg.phase) * amp : 0;
        tg.el.style.transform = 'translate(' + Math.round(tg.x) + 'px,' + Math.round(tg.y + bobY) + 'px)'
          + (self.skin.tilt && !self.reduced ? ' rotate(' + (Math.sin(t / 520 + tg.phase) * self.skin.tilt).toFixed(2) + 'deg)' : '');
        if (tg.x > w + 30) out++;
      });
      if (self.limit) {
        var left = self.limit - t / 1000;
        if (left <= 0) { self.limitLeft = 0; self.hudSet(); return self.resolve(null, 'time'); }
        if (Math.ceil(left) !== Math.ceil(self.limitLeft)) { self.limitLeft = left; self.hudSet(); }
      }
      if (out >= self.targets.length) return self.resolve(null, 'escaped');
      self.raf = window.requestAnimationFrame ? requestAnimationFrame(self.tick) : setTimeout(function () { self.tick(Date.now()); }, 16);
    };
    this.hudSet();
    this.raf = window.requestAnimationFrame ? requestAnimationFrame(this.tick) : setTimeout(function () { self.tick(Date.now()); }, 16);
  };


  /* shoot: the only way to score. A hit marks the real radio (so it persists) and takes the point */
  Instance.prototype.shoot = function (value) {
    if (this.phase !== 'fly') return null;
    var hit = value != null && value === this.wave.key;
    var chosen = null;
    this.wave.opts.forEach(function (o) { if (o.value === value) chosen = o; });
    this.resolve(value, hit ? 'hit' : 'miss', chosen);
    return hit;
  };

  /* resolve: end the item — mark it, then move on after a beat */
  Instance.prototype.resolve = function (value, why, chosen) {
    var self = this;
    if (this.phase === 'done' || this.phase === 'over') return;
    this.phase = 'done';
    this.clearTimers();
    var hit = why === 'hit';
    if (hit) this.score++; else this.missed.push(this.wave);
    this.targets.forEach(function (tg) {
      if (value != null && tg.value === value) tg.el.classList.add(hit ? 'hit' : 'miss');
    });
    if (hit && chosen && chosen.radio) {
      chosen.radio.checked = true;
      if (window.Event) {
        chosen.radio.dispatchEvent(new Event('input', { bubbles: true }));
        chosen.radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    this.hudSet();
    this.later(function () {
      [].slice.call(self.stage.querySelectorAll('.target')).forEach(function (t) { t.remove(); });
      self.queue.shift();
      self.idx++;
      self.setPrompt('', false);
      self.hudSet();
      self.next();
    }, hit ? 260 : 420);
  };

  /* finish: replay the misses once, then report the score and give the authored list back */
  Instance.prototype.finish = function () {
    if (this.replay && !this.replaying && this.missed.length) {
      this.replaying = true;
      this.queue = this.missed.slice();
      this.missed = [];
      return this.next();
    }
    this.phase = 'over';
    this.running = false;
    this.root.classList.remove('is-on');
    this.setPrompt('', false);
    this.fade.classList.remove('on');
    var line = this.root.querySelector('.game-score-line');
    if (!line) { line = document.createElement('p'); line.className = 'game-score-line'; this.root.appendChild(line); }
    line.textContent = 'Score: ' + this.score + ' / ' + this.total + (this.score === this.total ? ' — perfect round.' : ' — shoot again when you like.');
    this.btn.style.display = '';
    this.btn.textContent = '▶ Start again';
    if (this.btn.focus) this.btn.focus();
    return this.score;
  };

  /* live state, read-only (QA + future engines) */
  Instance.prototype.state = function () {
    return { phase: this.phase, idx: this.idx, score: this.score, total: this.total,
      running: this.running, replaying: this.replaying, missed: this.missed.length,
      key: this.wave ? this.wave.key : '', targets: this.targets.length };
  };
  Instance.prototype._test = function () {
    var self = this;
    return {
      state: function () { return self.state(); },
      start: function () { self.start(); return self.state(); },
      takeoff: function () { self.clearTimers(); self.phase = 'countdown'; self.takeoff(); return self.state(); },
      shoot: function (v) { return self.shoot(v); },
      next: function () { self.next(); return self.state(); },
      tick: function (ms) { if (self.tick) self.tick(((window.performance && performance.now) ? performance.now() : Date.now()) + ms); }
    };
  };

  function boot() {
    var roots = [].slice.call(document.querySelectorAll('.game[data-game="shootPair"]'));
    window.__G = roots.map(function (r) { var i = new Instance(r); i.hooks = i._test(); return i; });
    return window.__G.length;
  }

  return { boot: boot, skins: Object.keys(SKINS), version: 1 };
})();

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { window.GAMES.boot(); });
else window.GAMES.boot();

