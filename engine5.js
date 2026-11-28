/**
 * engine5.js — the flipCard primitive (capability map #flip).
 *
 * WHAT IT IS FOR. Rote training on single words and short phrases: one prompt stands at the top of
 * the block, and the student picks the card that answers it. A right pick flips the card and tints
 * its back; a wrong one flips it, tints it red, and turns it back after a moment. The prompt is
 * drawn from the cards themselves, so a set of four works as well as a set of twelve.
 *
 * THE MARKUP IT EXPECTS (all of it in the page, nothing generated here):
 *   <div class="block" data-look="stripes" id="flip">
 *     <h4 class="flip-ask" aria-live="polite">…</h4>
 *     <div class="flip-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
 *       <label class="flip" style="--flip-h:112px">
 *         <input type="checkbox">
 *         <span class="card3d">
 *           <span class="face" style="text-align:center"><b>the item</b><span class="dim">what it is</span></span>
 *           <span class="face back" style="text-align:center"><b>what it means</b></span>
 *         </span>
 *       </label>
 *       …
 *     </div>
 *   </div>
 *
 * THE PROMPT IS A BACK'S OWN TEXT. The answer of every card is its `.back`, so the block needs no
 * second copy of the answers and no attribute: edit the back and the prompt follows. A block with
 * no `.flip-ask`, or with fewer than two cards, is left alone — it prints as a plain grid of cards
 * and the page still reads.
 *
 * SHIPPED, NOT A PROTOTYPE. `_shell.html` declares this file beside the engines, so every lesson
 * page has it. A page with no `.flip-grid` pays one query and nothing else.
 */
(function () {
  'use strict';

  var grids = document.querySelectorAll('.flip-grid');
  if (!grids.length) return;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  Array.prototype.forEach.call(grids, function (grid) {
    var block = grid.closest('.block');
    if (!block) return;
    var ask = block.querySelector('.flip-ask');
    if (!ask) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.flip'));
    if (cards.length < 2) return;

    var backs = cards.map(function (c) {
      var back = c.querySelector('.face.back');
      return back ? back.textContent.replace(/\s+/g, ' ').trim() : '';
    });

    var pool = [], turn = -1, lock = 0;

    function next() {
      if (!pool.length) pool = shuffle(cards.map(function (_, i) { return i; }));
      turn = pool.pop();
      ask.textContent = backs[turn];
    }

    function tint(card, ok) {
      var back = card.querySelector('.face.back');
      if (back) back.style.background = 'color-mix(in oklab, var(' + (ok ? '--ok' : '--err') + ') 26%, var(--paper))';
    }

    function clear() {
      cards.forEach(function (c) {
        var input = c.querySelector('input');
        if (input) input.checked = false;
        var back = c.querySelector('.face.back');
        if (back) back.style.background = '';
      });
    }

    cards.forEach(function (card, i) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        if (lock) return;
        var input = card.querySelector('input');
        if (input) input.checked = true;
        tint(card, i === turn);
        if (i !== turn) {
          setTimeout(function () {
            if (lock) return;
            if (input) input.checked = false;
            var back = card.querySelector('.face.back');
            if (back) back.style.background = '';
          }, 700);
          return;
        }
        lock = 1;
        setTimeout(function () { clear(); lock = 0; next(); }, 1400);
      });
    });

    next();
  });
})();
