/**
 * qa/games4.mjs — smoke for engine4.js (one runner, games as presentations).
 *
 * jsdom cannot see an animation, so this drives the runner's own state machine through the test
 * hook every instance exposes (`inst.hooks` = start / step / pick / expire / finish / state) and
 * clicks the real buttons where the presentation matters.
 * What it proves (FUNCTION.md → Engines & pages; CONTENT_EXAMPLES.md → the game menu):
 *   - the authored `.game-list` is untouched and visible before Start (no-JS / print fallback)
 *   - Start is the only entry point; the same authored items drive BOTH games, so `data-game` is a
 *     presentation choice, not a content choice
 *   - catchBasket: one bucket per option, the prompt is the falling token, a click answers
 *   - whackMole: one mole per option, popped into holes
 *   - a correct pick marks the REAL radio and dispatches change (that is what persists), +1 point
 *   - a wrong pick is a miss, the radio stays blank, and the item comes back on the replay
 *   - a fall/time-out with no answer is a miss
 *   - the keyboard answers too (1..n)
 *   - finish writes the score line and hands the authored list back
 * Run with: node qa/games4.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENGINE = fs.readFileSync(path.join(ROOT, 'engine4.js'), 'utf8');

const item = (n, stem, key, opts) => `
  <div class="qitem" data-a="${key}">
    <div class="qline"><span class="qnum">${n}.</span><span class="qstem">${stem}</span></div>
    <div class="qopts">${opts.map(o => `<label><input type="radio" name="q${n}" value="${o[0]}">${o[1]}</label>`).join('')}</div>
  </div>`;

const FIXTURE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>games4</title></head><body>
<div class="content-area">
  <div class="game" id="catch" data-game="catchBasket" data-shuffle="0" data-replay="1" data-time="6000">
    <p class="game-how">Drag each one into the basket that fits.</p>
    <div class="game-list">
      ${item(1, 'a finished thing', 'a', [['a', 'past'], ['b', 'now']])}
      ${item(2, 'a thing happening', 'b', [['a', 'past'], ['b', 'now']])}
    </div>
    <button class="game-start" type="button">▶ Start</button>
  </div>
  <div class="game" id="mole" data-game="whackMole" data-shuffle="0" data-time="60000">
    <p class="game-how">Hit the one that fits.</p>
    <div class="game-list">
      ${item(1, 'which one is a greeting', 'c', [['a', 'a'], ['b', 'b'], ['c', 'hello']])}
    </div>
    <button class="game-start" type="button">▶ Start</button>
  </div>
</div></body></html>`;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name + (extra ? '  <<' + extra + '>>' : '')); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  <<' + extra + '>>' : '')); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function mount() {
  const dom = new JSDOM(FIXTURE, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/games4.html',
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addListener: () => { }, removeListener: () => { } });
      w.console.error = (...a) => { console.log('  [page error] ' + a.join(' ')); };
      w.HTMLElement.prototype.scrollIntoView = () => { };
    }
  });
  const w = dom.window;
  w.eval(ENGINE);
  w.eval('window.__booted = window.GAMES4.boot()');
  return w;
}

async function run() {
  console.log('🧪 engine4 / catchBasket + whackMole\n');
  const w = mount();
  const doc = w.document;
  const rc = doc.getElementById('catch'), rm = doc.getElementById('mole');
  const gc = (w.__G4 || []).find(g => g.root === rc);
  const gm = (w.__G4 || []).find(g => g.root === rm);

  ok('boot found both game blocks', w.__G4.length === 2 && !!gc && !!gm, (w.__booted || 0) + ' instance(s)');
  ok('both games read the same authored markup', gc.items.length === 2 && gm.items.length === 1);

  /* --- the DEFAULT view is the game's intro screen --- */
  ok('the block opens on an intro screen', !!rc.querySelector('.g4-intro') && !rc.classList.contains('is-on'));
  ok('the intro carries the authored how-text',
    /Drag each one/.test((rc.querySelector('.g4-intro .game-how') || {}).textContent || ''));
  ok('the intro carries the Play button, not a form', !!rc.querySelector('.g4-intro .game-start'));
  const meta = (rc.querySelector('.g4-intro-meta') || {}).textContent || '';
  ok('the intro states the rounds, the deadline and the keys', /2/.test(meta) && /6s/.test(meta) && /1–/.test(meta), meta);
  ok('the engine marks the block ready — that class is what hides the list', rc.classList.contains('g4-ready'));
  ok('the authored radios survive in the DOM (hidden, not deleted)',
    rc.querySelectorAll('.game-list input[type=radio]').length === 4);
  ok('nothing is drawn on the stage before start',
    doc.querySelectorAll('.g4-bucket').length === 0 && doc.querySelectorAll('.g4-mole').length === 0);

  /* --- the fallback: a block no game claimed stays a plain form --- */
  const orphan = doc.createElement('div');
  orphan.className = 'game';
  orphan.setAttribute('data-game', 'noSuchGame');
  orphan.innerHTML = '<p class="game-how">fallback</p><div class="game-list">'
    + item(1, 'q', 'a', [['a', 'x']]) + '</div><button class="game-start" type="button">▶</button>';
  doc.querySelector('.content-area').appendChild(orphan);
  w.GAMES4.boot();
  ok('an unclaimed block gets NO ready class, so its list and how-text stay visible',
    !orphan.classList.contains('g4-ready') && !orphan.querySelector('.g4-intro'));
  orphan.remove();

  /* --- and CSS must actually express that, or the fallback is a fiction --- */
  const CSS_SRC = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8').replace(/\s+/g, ' ');
  ok('style.css hides the list only behind .g4-ready', /\.game\.g4-ready \.game-list\{display:none\}/.test(CSS_SRC));
  ok('style.css hides a dead Start button on an unclaimed block',
    /\.game:not\(\.g4-ready\) \.game-start\{display:none\}/.test(CSS_SRC));
  ok('print always shows the authored list', /@media print\{[^\n]*\.game-list\{display:block !important/.test(CSS_SRC));

  /* --- catchBasket: baskets are options, the card is the prompt, drag or tap both answer --- */
  rc.querySelector('.game-start').click();
  ok('Start begins the run', rc.classList.contains('is-on') && gc.state().running, gc.state().phase);
  ok('one basket per option', doc.querySelectorAll('#catch .g4-bucket').length === 2);
  ok('every basket is drawn art, not a bare box', doc.querySelectorAll('#catch .g4-bucket .g4-art').length === 2);
  ok('the prompt is a draggable card', doc.querySelector('#catch .g4-card').textContent === 'a finished thing');
  ok('the deadline is visible as a bar', !!doc.querySelector('#catch .g4-timebar i'));
  ok('data-time is read as the per-item deadline', gc.state().itemTime === 6000, 'itemTime=' + gc.state().itemTime);
  ok('the right answer is the authored data-a, not a written key', gc.state().key === 'a', 'key=' + gc.state().key);

  gc.hooks.pick('a');
  ok('a hit scores', gc.state().score === 1);
  ok('a hit checks the REAL radio (that is what persists)',
    doc.querySelector('#catch input[name="q1"][value="a"]').checked === true);
  await sleep(700);

  ok('the next item follows on its own', gc.state().prompt === 'a thing happening', gc.state().prompt);
  gc.hooks.pick('a');
  ok('a wrong pick is a miss', gc.state().score === 1 && gc.state().missed === 1);
  ok('a miss leaves the radio blank — the blank is the evidence',
    doc.querySelector('#catch input[name="q2"][value="a"]').checked === false);
  await sleep(1000);

  ok('the missed item comes back once', gc.state().replaying === true, 'replaying=' + gc.state().replaying);
  gc.hooks.pick('b');
  await sleep(700);
  const line = rc.querySelector('.game-score-line');
  ok('the run ends with the score line',
    gc.state().phase === 'over' && !!line && /Score: 2 \/ 2/.test(line.textContent),
    line ? line.textContent : 'no line');
  ok('the authored list is handed back', !rc.classList.contains('is-on'));

  /* --- an unanswered fall is a miss, not a silent skip --- */
  gc.hooks.start();
  gc.hooks.expire();
  ok('an unanswered fall is a miss', gc.state().missed === 1 && gc.state().score === 0);
  await sleep(1000);

  /* --- the keyboard is a first-class way to answer --- */
  gc.hooks.start();
  rc.dispatchEvent(new w.KeyboardEvent('keydown', { key: '1', bubbles: true }));
  ok('the keyboard answers too (1..n)', gc.state().score === 1, 'score=' + gc.state().score);
  await sleep(700);

  /* --- whackMole: moles are options, drawn, in holes, under a HUD prompt --- */
  rm.querySelector('.game-start').click();
  ok('whackMole surfaces one mole per option', doc.querySelectorAll('#mole .g4-mole').length === 3);
  ok('every mole is drawn art', doc.querySelectorAll('#mole .g4-mole .g4-art').length === 3);
  ok('the moles live in holes', doc.querySelectorAll('#mole .g4-hole').length >= 6,
    doc.querySelectorAll('#mole .g4-hole').length + ' holes');
  ok('a hole has a dirt rim, so it reads as a hole', !!doc.querySelector('#mole .g4-hole .g4-dirt'));
  ok('the prompt sits on the HUD line', doc.querySelector('#mole .g4-prompt').textContent === 'which one is a greeting');
  const right = [...doc.querySelectorAll('#mole .g4-mole')].find(m => m.getAttribute('data-v') === 'c');
  right.click();
  ok('clicking the right mole marks the radio',
    doc.querySelector('#mole input[name="q1"][value="c"]').checked === true);
  ok('and scores', gm.state().score === 1);
  await sleep(700);
  ok('the single-item run ends', gm.state().phase === 'over', gm.state().phase);

  /* --- a pointer drag answers through the same path as a click --- */
  gc.hooks.start();
  const card = doc.querySelector('#catch .g4-card');
  const baskets = doc.querySelectorAll('#catch .g4-bucket');
  ok('the card and the baskets are there to drag between', !!card && baskets.length === 2);
  const fire = (elm, type) => elm.dispatchEvent(new w.MouseEvent(type, { bubbles: true, clientX: 0, clientY: 0 }));
  fire(card, 'pointerdown');
  ok('pointerdown lifts the card', card.classList.contains('dragging'));
  fire(card, 'pointermove');
  fire(card, 'pointerup');
  ok('dropping the card on a basket answers, and marks the real radio',
    doc.querySelector('#catch input[name="q1"][value="a"]').checked === true, 'score=' + gc.state().score);
  await sleep(700);

  /* --- the levers are data, so difficulty is authored, never coded --- */
  const probe = doc.createElement('div');
  probe.className = 'game';
  probe.setAttribute('data-game', 'whackMole');
  probe.setAttribute('data-rounds', '1');
  probe.setAttribute('data-shuffle', '1');
  probe.setAttribute('data-limit', '30');
  probe.innerHTML = '<div class="game-list"></div>';
  doc.querySelector('.content-area').appendChild(probe);
  w.GAMES4.boot();
  const pg = (w.__G4 || []).find(x => x.root === probe);
  ok('the levers are read from the block (limit / shuffle / rounds)', !!pg && pg.limit === 30 && pg.shuffleOn === true);
  ok('an empty game disables itself instead of pretending', !!pg && !!probe.querySelector('.game-start') && probe.querySelector('.game-start').disabled === true);
  ok('boot is idempotent (no double instances)', w.GAMES4.boot() === 3 && probe.__g4 === pg);

  console.log('\n' + (fail ? 'FAILED: ' : 'OK: ') + pass + ' passed, ' + fail + ' failed\n');
  process.exitCode = fail ? 1 : 0;
}

run().catch(e => { console.error(e); process.exitCode = 1; });
