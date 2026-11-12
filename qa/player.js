/**
 * qa/player.js — the musicPlayer primitive (CONTENT_EXAMPLES.md [PRIMITIVES]).
 *
 * WHAT IT IS FOR. A lesson that teaches from a song needs the track, a way to sit on one line of
 * it, and the words in front of the student. The markup ships `<audio controls>`, so with no
 * JavaScript at all the student still gets play, pause and a scrub bar — this file only upgrades
 * that: a bigger target, a bar you can drag, a time readout, and the lyric line lit while sung.
 *
 * THE MARKUP IT EXPECTS (all of it in the page, nothing generated here):
 *   <figure class="vz-play">
 *     <figcaption>…credit…</figcaption>
 *     <audio class="vz-audio" src="../assets/<name>.mp3" controls preload="metadata"></audio>
 *     <div class="vz-controls"><button class="vz-btn">▶</button>
 *       <span class="vz-time" data-now>0:00</span>
 *       <div class="vz-bar" role="slider" tabindex="0" aria-label="…" aria-valuemin="0"
 *            aria-valuemax="100" aria-valuenow="0"><span class="vz-fill"></span>
 *         <span class="vz-knob"></span></div>
 *       <span class="vz-time" data-dur>0:00</span></div>
 *     <ol class="vz-lyrics"><li data-t="4.98">line</li>…</ol>
 *   </figure>
 *
 * `data-t` IS OPTIONAL AND IS SECONDS INTO THE TRACK. A line without it is still shown and read;
 * it just cannot be jumped to or lit. A build never invents a `data-t`: the number comes from the
 * recording (a silencedetect pass or a listening pass), and a line whose time is a guess is
 * written without one. Clicking a line seeks to it; playback lights the last line passed.
 *
 * Runs on qa/preview-blocks.html only, for now. If the shape is kept, this file and the `.vz-*`
 * rules in qa/preview-visual.css move to the site root and style.css unchanged.
 */
(function () {
  'use strict';

  var roots = document.querySelectorAll('.vz-play');
  if (!roots.length) return;

  function clock(s) {
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  Array.prototype.forEach.call(roots, function (root) {
    var audio = root.querySelector('audio');
    var bar = root.querySelector('.vz-bar');
    var btn = root.querySelector('.vz-btn');
    if (!audio || !bar || !btn) return;

    var fill = bar.querySelector('.vz-fill');
    var knob = bar.querySelector('.vz-knob');
    var now = root.querySelector('[data-now]');
    var dur = root.querySelector('[data-dur]');
    var lines = Array.prototype.slice.call(root.querySelectorAll('.vz-lyrics li'));

    /* the native control is the floor; it goes only once everything below is wired */
    root.classList.add('is-enhanced');
    audio.removeAttribute('controls');

    /* THE BLOCK STATES ITS OWN LENGTH. A VBR mp3's duration is an estimate: the element reports one
       from the file's bitrate, and no two browsers agree. The authoring pass measures the cut and
       writes it to `data-duration`, so the bar, the clock and End all use the length the file really
       has; a block without the attribute falls back to whatever the browser claims. */
    var declared = parseFloat(audio.getAttribute('data-duration'));
    function total() {
      if (declared > 0) return declared;
      return isFinite(audio.duration) ? audio.duration : 0;
    }

    function paint() {
      var d = total(), t = audio.currentTime;
      var p = d > 0 && isFinite(d) ? t / d : 0;
      fill.style.width = (p * 100) + '%';
      knob.style.left = (p * 100) + '%';
      bar.setAttribute('aria-valuenow', String(Math.round(p * 100)));
      bar.setAttribute('aria-valuetext', clock(t) + ' of ' + clock(d));
      if (now) now.textContent = clock(t);
      if (dur) dur.textContent = clock(d);
    }

    function label() {
      var playing = !audio.paused && !audio.ended;
      btn.textContent = playing ? '❚❚' : '▶';
      btn.setAttribute('aria-label', playing ? 'pause' : 'play');
      btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    }

    function light() {
      var t = audio.currentTime, at = -1;
      for (var i = 0; i < lines.length; i++) {
        var v = parseFloat(lines[i].getAttribute('data-t'));
        if (!isNaN(v) && v <= t + 0.05) at = i;
      }
      for (var j = 0; j < lines.length; j++) {
        var has = !isNaN(parseFloat(lines[j].getAttribute('data-t')));
        lines[j].classList.toggle('is-now', has && j === at);
      }
    }

    btn.addEventListener("click", function () {
      if (audio.paused || audio.ended) {
        var p = audio.play();
        if (p && p.catch) p.catch(function () { /* a blocked play leaves the button as it was */ });
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", label);
    audio.addEventListener("pause", label);
    audio.addEventListener("ended", function () { label(); paint(); });
    audio.addEventListener("timeupdate", function () { paint(); light(); });
    audio.addEventListener("loadedmetadata", function () { paint(); label(); });
    audio.addEventListener("seeked", function () { paint(); light(); });

    /* ---- the bar: click, drag, and the keyboard ---------------------------------------- */
    function at(clientX) {
      var r = bar.getBoundingClientRect();
      var p = r.width ? (clientX - r.left) / r.width : 0;
      return Math.min(1, Math.max(0, p));
    }
    function seek(p) {
      var d = total();
      if (!d) return;
      audio.currentTime = Math.min(p * d, d);
      paint(); light();
    }

    var dragging = false;
    bar.addEventListener("pointerdown", function (e) {
      dragging = true;
      if (bar.setPointerCapture) bar.setPointerCapture(e.pointerId);
      seek(at(e.clientX));
      e.preventDefault();
    });
    bar.addEventListener("pointermove", function (e) { if (dragging) seek(at(e.clientX)); });
    function stop(e) {
      dragging = false;
      if (bar.hasPointerCapture && e.pointerId != null && bar.hasPointerCapture(e.pointerId)) {
        bar.releasePointerCapture(e.pointerId);
      }
    }
    bar.addEventListener("pointerup", stop);
    bar.addEventListener("pointercancel", stop);

    bar.addEventListener("keydown", function (e) {
      var step = 5, d = total(), t = audio.currentTime;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") audio.currentTime = Math.min(d, t + step);
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") audio.currentTime = Math.max(0, t - step);
      else if (e.key === "Home") audio.currentTime = 0;
      else if (e.key === "End") audio.currentTime = d;
      else return;
      e.preventDefault();
      paint(); light();
    });

    /* ---- the words --------------------------------------------------------------------- */
    lines.forEach(function (li) {
      if (isNaN(parseFloat(li.getAttribute("data-t")))) return;
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");
      li.addEventListener("click", function () {
        audio.currentTime = parseFloat(li.getAttribute("data-t"));
        paint(); light();
      });
      li.addEventListener("keydown", function (e) {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        li.click();
      });
    });

    paint();
    label();
    light();
  });
}());