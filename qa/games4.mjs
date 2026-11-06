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
  <div class="game" id="catch" data-game="catchBasket" data-shuffle="0" data-replay="1" data-speed="400">
    <p class="game-how">Catch each one in the basket that fits.</p>
    <div class="game-list">
      ${item(1, 'a finished thing', 'a', [['a', 'past'], ['b', 'now']])}
      ${item(2, 'a thing happening', 'b', [['a', 'past'], ['b', 'now']])}
    </div>
    <button class="game-start" type="button">▶ Start</button>
  </div>
  <div class="game" id="mole" data-game="whackMole" data-shuffle="0" data-speed="60000">
    <p class="game-how">Hit the one that fits.</p>
    <div class="game-list">
      ${item(1, 'which one is a greeting', 'c', [['a', 'a'], ['b', 'b'], ['c', 'hello']])}
    </div>
    <button class="game-start" type="button">▶ Start</button>
  </div>
</div></body></html>`;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + name + (extra ? '  «' + extra + '»' : '')); }
  else { fail++; console.log('  ❌ ' + name + (extra ? '  «' + extra + '»' : '')); }
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
  ok('the authored list is visible before start (no-JS fallback)',
    !rc.classList.contains('is-on') && !!rc.querySelector('.game-list input[type=radio]'));
  ok('nothing is drawn before start',
    doc.querySelectorAll('.g4-bucket').length === 0 && doc.querySelectorAll('.g4-mole').length === 0);

  /* --- catchBasket: buckets are options, the token is the prompt --- */
  rc.querySelector('.game-start').click();
  ok('Start begins the run', rc.classList.contains('is-on') && gc.state().running, gc.state().phase);
  ok('one bucket per option', doc.querySelectorAll('#catch .g4-bucket').length === 2);
  ok('the prompt is the falling token', doc.querySelector('#catch .g4-token').textContent === 'a finished thing');
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

  /* --- whackMole: moles are options, in holes, under a HUD prompt --- */
  rm.querySelector('.game-start').click();
  ok('whackMole pops one mole per option', doc.querySelectorAll('#mole .g4-mole').length === 3);
  ok('the moles live in holes', doc.querySelectorAll('#mole .g4-hole').length >= 6,
    doc.querySelectorAll('#mole .g4-hole').length + ' holes');
  ok('the prompt sits on the HUD line', doc.querySelector('#mole .g4-prompt').textContent === 'which one is a greeting');
  const right = [...doc.querySelectorAll('#mole .g4-mole')].find(m => m.getAttribute('data-v') === 'c');
  right.click();
  ok('clicking the right mole marks the radio',
    doc.querySelector('#mole input[name="q1"][value="c"]').checked === true);
  ok('and scores', gm.state().score === 1);
  await sleep(700);
  ok('the single-item run ends', gm.state().phase === 'over', gm.state().phase);

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

  console.log('\n' + (fail ? '❌ ' : '✅ ') + pass + ' passed, ' + fail + ' failed\n');
  process.exitCode = fail ? 1 : 0;
}

run().catch(e => { console.error(e); process.exitCode = 1; });
