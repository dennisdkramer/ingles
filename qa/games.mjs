/**
 * qa/games.mjs — smoke for engine3.js (the Tier-1 game engine, first game shootPair).
 *
 * jsdom cannot see an animation, so this drives the ENGINE's own state machine through the test
 * hook every instance exposes (`inst.hooks` = start / takeoff / shoot / tick / next / state).
 * What it proves (FUNCTION.md → Engines & pages; FORMAT.md → the `.game` block):
 *   - the authored `.game-list` is untouched and visible before Start (no-JS / print fallback)
 *   - Start is the only entry point; it hides the list and begins the fade → countdown → takeoff
 *   - one target per authored option, each carrying its word on a plaque; skins are generic
 *   - the right answer is inferred from the clip's data-say when the page pins no `data-a`
 *   - a hit marks the REAL radio and dispatches change (that is what persists), +1 point
 *   - a wrong shot is a miss (0 points) and the item ends
 *   - time-out and "all targets off screen" are misses too
 *   - misses come back once, then the score line is written and the list is handed back
 * Run with: node qa/games.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENGINE = fs.readFileSync(path.join(ROOT, 'engine3.js'), 'utf8');

const FIXTURE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>game</title></head><body>
<div class="content-area">
  <div class="game" data-game="shootPair" data-skin="duck" data-speed="400" data-replay="1">
    <button class="game-start" type="button">▶ Start</button>
    <p class="game-how">Two targets, one spoken word.</p>
    <div class="game-list">
      <div class="qgrid stack">
        <div class="qitem"><div class="qline"><span class="qnum">1.</span><span class="qstem"><button class="listen" data-say="ship.">▶</button> Round 1</span></div>
          <div class="qopts"><label><input type="radio" name="w1" value="a">ship</label><label><input type="radio" name="w1" value="b">sheep</label></div></div>
        <div class="qitem"><div class="qline"><span class="qnum">2.</span><span class="qstem"><button class="listen" data-say="three.">▶</button> Round 2</span></div>
          <div class="qopts"><label><input type="radio" name="w2" value="a">tree</label><label><input type="radio" name="w2" value="b">three</label><label><input type="radio" name="w2" value="c">free</label></div></div>
      </div>
    </div>
  </div>
</div></body></html>`;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + name + (extra ? '  «' + extra + '»' : '')); }
  else { fail++; console.log('  ❌ ' + name + (extra ? '  «' + extra + '»' : '')); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function mount(html) {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/game.html',
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addListener: () => { }, removeListener: () => { } });
      w.console.error = (...a) => { console.log('  [page error] ' + a.join(' ')); };
      w.HTMLElement.prototype.scrollIntoView = () => { };
    }
  });
  const w = dom.window;
  w.eval(ENGINE);
  w.eval('window.__booted = window.GAMES.boot()');
  /* the harness owns the clock: give each instance a huge travel time so only the test moves it */
  (w.__G || []).forEach(g => { g.speed = 1e9; g.limit = 0; g.reduced = true; });
  return w;
}

async function run() {
  console.log('🧪 engine3 / shootPair smoke\n');
  const w = mount(FIXTURE);
  const root = w.document.querySelector('.game');
  const g = w.__G[0];
  ok('boot found the game block', !!g, (w.__booted || 0) + ' instance(s)');

  /* --- before Start: the authored list is the page, nothing is hidden, nothing moves --- */
  ok('list is visible before start (no-JS fallback)', !root.classList.contains('is-on'));
  ok('no target exists before start', w.document.querySelectorAll('.target').length === 0);

  /* --- Start is the entry point --- */
  root.querySelector('.game-start').click();
  ok('Start begins the run', root.classList.contains('is-on') && !!g.state().running, g.state().phase);
  ok('the first prompt is the authored stem', g.promptEl.textContent.indexOf('Round 1') >= 0, g.promptEl.textContent);

  /* --- takeoff: one target per option, word on a plaque, right answer read from data-say --- */
  g.hooks.takeoff();
  let st = g.state();
  ok('takeoff puts one target per option on the stage', st.targets === 2, 'targets=' + st.targets);
  ok('the right answer comes from the clip, not a written key', st.key === 'a', 'key=' + st.key);
  const plaques = [].map.call(w.document.querySelectorAll('.target .plaque'), p => p.textContent);
  ok('every target carries its word on a plaque', plaques.join('|') === 'ship|sheep', plaques.join('|'));
  ok('the duck skin renders the duck class', !!w.document.querySelector('.target.duck'));

  /* --- a hit marks the real radio and scores --- */
  const before = g.state().score;
  g.hooks.shoot('a');
  const radio = w.document.querySelector('input[name="w1"][value="a"]');
  ok('a hit scores a point', g.state().score === before + 1, 'score=' + g.state().score);
  ok('a hit checks the authored radio (that is what persists)', radio.checked === true);
  await sleep(400);

  /* --- second wave: three options, a wrong shot is a miss and moves on --- */
  g.hooks.takeoff();
  st = g.state();
  ok('wave 2 carries three targets', st.targets === 3, 'targets=' + st.targets);
  const scoreAfterHit = g.state().score;
  g.hooks.shoot('a');                      /* wave 2's answer is b (three) */
  ok('a wrong shot scores nothing', g.state().score === scoreAfterHit, 'score=' + g.state().score);
  ok('a wrong shot checks no radio', w.document.querySelector('input[name="w2"]:checked') === null);
  await sleep(700);

  /* --- misses replay once, then the run ends and the list comes back --- */
  g.hooks.takeoff();
  g.hooks.shoot('b');
  await sleep(700);
  st = g.state();
  ok('the run ends after the replay', st.running === false, 'phase=' + st.phase);
  ok('the authored list is handed back', !root.classList.contains('is-on'));
  const line = root.querySelector('.game-score-line');
  ok('the final score line is written', !!line && /Score: \d+ \/ 2/.test(line.textContent || ''), line ? line.textContent : '');
  ok('the button offers a second run', /Start again/.test(root.querySelector('.game-start').textContent));

  /* --- time-out and escape are misses --- */
  const w2 = mount(FIXTURE);
  const g2 = w2.__G[0];
  g2.limit = 5;
  g2.hooks.start();
  g2.hooks.takeoff();
  g2.hooks.tick(6000);
  ok('a countdown that expires is a miss', g2.state().score === 0, 'phase=' + g2.state().phase);

  const w3 = mount(FIXTURE);
  const g3 = w3.__G[0];
  g3.speed = 100;
  g3.hooks.start();
  g3.hooks.takeoff();
  g3.hooks.tick(999999);
  ok('targets that leave the screen end the item', g3.state().score === 0 && g3.state().phase === 'done', 'phase=' + g3.state().phase);

  /* --- skins are generic: the same markup flies as a UFO --- */
  const w4 = mount(FIXTURE.replace('data-skin="duck"', 'data-skin="ufo"'));
  const g4 = w4.__G[0];
  g4.hooks.start(); g4.hooks.takeoff();
  ok('a second skin reuses the same contract', !!w4.document.querySelector('.target.ufo'), 'skins=' + w4.GAMES.skins.join(','));
  ok('the ufo skin still scores', g4.hooks.shoot('a') === true);

  console.log('\n' + (fail ? '❌ ' + fail + ' FAILED / ' + pass + ' passed' : '✅ ALL GAME TESTS PASSED (' + pass + ')'));
  process.exit(fail ? 1 : 0);
}
run().catch(e => { console.error('[FATAL]', e); process.exit(1); });

