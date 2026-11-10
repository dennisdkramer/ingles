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
 *   - structural guards: every g4- class the engine puts on an element — whether written in an `el()`
 *     call or inside an innerHTML string — has a rule in style.css, and no two games own one name
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
/* the lives are the HEARTS in the stage's top-left corner, so a test reads what the student reads:
   full hearts out of the row's length (the row never shrinks — a spent heart goes hollow). */
const hearts = root => {
  const box = root.querySelector('.g4-hearts');
  if (!box) return '0/0';
  const all = [...box.querySelectorAll('.g4-heart')];
  return all.filter(h => h.classList.contains('full')).length + '/' + all.length;
};

function mount(html, prep) {
  const dom = new JSDOM(html || FIXTURE, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/games4.html',
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addListener: () => { }, removeListener: () => { } });
      w.console.error = (...a) => { console.log('  [page error] ' + a.join(' ')); };
      w.HTMLElement.prototype.scrollIntoView = () => { };
      if (prep) prep(w);
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
  ok('the intro carries no rounds/deadline/keys strip', !rc.querySelector('.g4-intro-meta'));
  ok('the engine marks the block ready — that class is what hides the list', rc.classList.contains('g4-ready'));
  ok('the authored radios survive in the DOM (hidden, not deleted)',
    rc.querySelectorAll('.game-list input[type=radio]').length === 4);
  ok('the intro overlay sits over a still of the game art (a poster, not blank space)',
    !!(rc.querySelector('.g4-poster') || doc.querySelector('.g4-poster')));
  ok('the poster is a picture, not a control surface (nothing clickable on the stage yet)',
    doc.querySelectorAll('.g4-stage button').length === 2,
    doc.querySelectorAll('.g4-stage button').length + ' button(s) on stage (2 = the Play button only + start)');

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

  /* --- catchBasket: a row of words on top, baskets from the block's own option labels --- */
  rc.querySelector('.game-start').click();
  ok('Start begins the run', rc.classList.contains('is-on') && gc.state().running, gc.state().phase);
  ok('one basket per option', doc.querySelectorAll('#catch .g4-bucket').length === 2);
  ok('every basket is drawn art, not a bare box', doc.querySelectorAll('#catch .g4-bucket .g4-art').length === 2);
  ok('the buckets are labelled by the activity (its option text)',
    [...doc.querySelectorAll('#catch .g4-bucket-t')].map(t => t.textContent).join('|') === 'past|now',
    [...doc.querySelectorAll('#catch .g4-bucket-t')].map(t => t.textContent).join('|'));
  ok('ONE word is on the row — the one being sorted, not all of them',
    [...doc.querySelectorAll('#catch .g4-chip')].map(c => c.textContent).join('|') === 'a finished thing',
    [...doc.querySelectorAll('#catch .g4-chip')].map(c => c.textContent).join('|'));
  ok('the first word starts selected', doc.querySelector('#catch .g4-chip').classList.contains('active'));
  ok('the deadline is visible as a bar', !!doc.querySelector('#catch .g4-timebar i'));
  ok('data-time is read as the per-item deadline', gc.state().itemTime === 6000, 'itemTime=' + gc.state().itemTime);
  ok('the right answer is the authored data-a, not a written key', gc.state().key === 'a', 'key=' + gc.state().key);

  gc.hooks.pick('a');
  ok('a hit scores', gc.state().score === 1);
  ok('a hit checks the REAL radio (that is what persists)',
    doc.querySelector('#catch input[name="q1"][value="a"]').checked === true);
  await sleep(700);

  ok('the next item follows on its own', gc.state().prompt === 'a thing happening', gc.state().prompt);
  ok('the answered word leaves the row', doc.querySelectorAll('#catch .g4-chip').length === 1,
    doc.querySelectorAll('#catch .g4-chip').length + ' chip(s) left');

  /* any word can be answered, not only the front of the queue */
  gc.hooks.start();
  const it2 = gc.queue[1];
  gc.pickOn(it2, 'b');
  ok('a word that is NOT at the front can be answered (pickOn)',
    doc.querySelector('#catch input[name="q2"][value="b"]').checked === true);
  ok('pickOn counts it once, not twice', gc.state().score === 1, 'score=' + gc.state().score);
  await sleep(700);

  gc.hooks.pick('b');
  ok('a wrong basket is a miss', gc.state().score === 1 && gc.state().missed === 1,
    'score=' + gc.state().score + ' missed=' + gc.state().missed);
  ok('a miss leaves the radio blank — the blank is the evidence',
    doc.querySelector('#catch input[name="q1"][value="b"]').checked === false);
  await sleep(1100);

  ok('the missed item comes back once', gc.state().replaying === true, 'replaying=' + gc.state().replaying);
  gc.hooks.pick('a');
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
  const card = doc.querySelector('#catch .g4-chip');
  const baskets = doc.querySelectorAll('#catch .g4-bucket');
  ok('a word chip and the baskets are there to drag between', !!card && baskets.length === 2);
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

  /* ---- every game in the menu boots, draws its own furniture, and resolves the authored radio ---- */
  const GAMES = {
    catchBasket: '.g4-bucket', whackMole: '.g4-mole',
    stackDrop: '.g4-padbtn', flapGate: '.g4-gapg',
    mineGrid: '.g4-door', wordleBoard: '.g4-tile', crosswordBoard: '.g4-xboard',
    echoPads: '.g4-pad', bingoCard: '.g4-btile',
    ladderRun: '.g4-lclimber', bossRaid: '.g4-bossart', trainOrder: '.g4-tcar'
  };
  const fixtures = Object.keys(GAMES).map(name => `
    <div class="game" id="g-${name}" data-game="${name}" data-shuffle="0" data-replay="0" data-time="0">
      <p class="game-how">Block for ${name}.</p>
      <div class="game-list">
        <div class="qitem" data-a="a" data-code="1" data-answer="hi" data-at="0,0" data-dir="across">
          <div class="qline"><span class="qstem">first prompt</span></div>
          <div class="qopts"><label><input type="radio" name="n-${name}-1" value="a">hi</label><label><input type="radio" name="n-${name}-1" value="b">bye</label></div>
        </div>
        <div class="qitem" data-a="b" data-code="2" data-answer="ta" data-at="0,0" data-dir="across">
          <div class="qline"><span class="qstem">second prompt</span></div>
          <div class="qopts"><label><input type="radio" name="n-${name}-2" value="a">no</label><label><input type="radio" name="n-${name}-2" value="b">ta</label></div>
        </div>
      </div>
      <button class="game-start" type="button">▶ Start</button>
    </div>`).join('');

  const w2 = mount(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>all</title></head>
    <body><div class="content-area">${fixtures}</div></body></html>`);
  const d2 = w2.document;
  ok('every game in the menu boots', (w2.__G4 || []).length === Object.keys(GAMES).length,
    (w2.__G4 || []).length + '/' + Object.keys(GAMES).length);

  Object.keys(GAMES).forEach(name => {
    const root = d2.getElementById('g-' + name);
    const sceneSvg = root.querySelector('.g4-scene svg');
    ok(name + ': has a drawn scene behind it',
      !!sceneSvg && sceneSvg.innerHTML.length > 300 && sceneSvg.innerHTML.indexOf('url(#g4-') > -1,
      sceneSvg ? sceneSvg.innerHTML.length + ' chars' : 'no scene');
    const g = (w2.__G4 || []).find(x => x.root === root);
    if (!g) { ok(name + ': instance exists', false); return; }
    root.querySelector('.game-start').click();
    const drew = root.querySelector(GAMES[name]);
    const on = root.classList.contains('is-on');
    if (g.board) {
      /* a board game places every card up front and answers out of order — proven on its own below */
      ok(name + ': starts, lays its board out, claims the run',
        on && g.phase === 'play' && !!drew,
        drew ? '' : 'no ' + GAMES[name]);
      return;
    }
    g.hooks.pick('a');
    const radio = root.querySelector('input[name="n-' + name + '-1"][value="a"]');
    ok(name + ': starts, draws its own furniture, marks the radio',
      on && !!drew && !!radio && radio.checked === true,
      (on ? '' : 'not started ') + (drew ? '' : 'no ' + GAMES[name] + ' '));
  });

  /* the three games whose input is typed, not clicked */
  const xw = (w2.__G4 || []).find(x => x.root === d2.getElementById('g-crosswordBoard'));
  xw.hooks.start();
  const cells = [...d2.querySelectorAll('#g-crosswordBoard .g4-gap')];
  cells.forEach((c, i) => { c.value = ['h', 'i'][i]; c.dispatchEvent(new w2.Event('input', { bubbles: true })); });
  ok('crosswordBoard: spelling the word answers it',
    d2.querySelector('#g-crosswordBoard input[value="a"]').checked === true);

  const wd = (w2.__G4 || []).find(x => x.root === d2.getElementById('g-wordleBoard'));
  wd.hooks.start();
  const entry = d2.querySelector('#g-wordleBoard .g4-wtype');
  entry.value = 'hi';
  entry.dispatchEvent(new w2.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  ok('wordleBoard: guessing the word answers it',
    d2.querySelector('#g-wordleBoard input[value="a"]').checked === true);

  const lk = (w2.__G4 || []).find(x => x.root === d2.getElementById('g-echoPads'));
  lk.hooks.start();
  [...d2.querySelectorAll('#g-echoPads .g4-pad')].filter(p => p.getAttribute('data-v') === 'a')[0].click();
  ok('echoPads: the pad with the word that fits answers that item',
    d2.querySelector('#g-echoPads input[value="a"]').checked === true);

  /* the scene and the intro card are part of every claimed block */
  const anyRoot = d2.getElementById('g-catchBasket');
  ok('every claimed block carries a drawn scene', !!anyRoot.querySelector('.g4-scene svg'));
  ok('the intro is a card over the scene, not a full-page form',
    !!anyRoot.querySelector('.g4-intro > .g4-intro-card'));
  ok('the shared gradient defs are injected once per page',
    d2.querySelectorAll('.g4-defs').length === 1);

  /* ---- trainOrder: the order of adjectives, on rails, under a low bridge --------------------------
     One item per WORD. The words of one sentence are laid out together (that is what a train is) and
     the verdict is GEOMETRY: a car further back is shorter, a word grows to the height its own slot is
     allowed, so a word a car too far back comes through the deck. These drive it the way a student
     does — tap a word, tap a car — and then let the train leave on its own. */
  const SLOTLIST = ['opinion', 'size', 'age', 'shape', 'color', 'origin', 'material', 'purpose'];
  const word = (n, stem, key, train) => `
    <div class="qitem" data-a="${key}"${train ? ' data-train="' + train + '"' : ''}>
      <div class="qline"><span class="qstem">${stem}</span></div>
      <div class="qopts">${SLOTLIST.map(v => `<label><input type="radio" name="t${n}" value="${v}">${v}</label>`).join('')}</div>
    </div>`;
  const tPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="tk" data-game="trainOrder" data-shuffle="0" data-time="0" data-depart="0" data-retry="0">
        <p class="game-how">Load the cars.</p>
        <div class="game-list">
          ${word(1, 'lovely', 'opinion')}${word(2, 'little', 'size')}${word(3, 'wooden', 'material')}
          ${word(4, 'French', 'origin', 2)}${word(5, 'round', 'shape', 2)}
        </div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const tkRoot = tPage.document.getElementById('tk');
  const tk = (tPage.__G4 || [])[0];
  const tCars = () => [...tkRoot.querySelectorAll('.g4-tcar')];
  const tDock = () => [...tkRoot.querySelectorAll('.g4-tword')].map(c => c.textContent).join('|');
  /* a tap is a pointerdown and the pointerup that ends it without moving: the card stays picked */
  const tapWord = (label) => {
    const card = [...tkRoot.querySelectorAll('.g4-tword')].find(c => c.textContent === label);
    if (!card) return false;
    card.dispatchEvent(new tPage.Event('pointerdown', { bubbles: true }));
    tPage.document.dispatchEvent(new tPage.Event('pointerup', { bubbles: true }));
    return card.classList.contains('on');
  };
  /* the yard runs on its own clock, so the test waits for the STATE it wants, never for a guessed
     number of milliseconds: a slow machine must not be able to fail the game */
  const until = async (fn, ms = 8000) => {
    const t0 = Date.now();
    while (!fn() && Date.now() - t0 < ms) await sleep(40);
    return fn();
  };
  tkRoot.querySelector('.game-start').click();
  ok('trainOrder: one car per slot — the whole order is always on the rails', tCars().length === 8,
    tCars().length + ' car(s)');
  ok('trainOrder: the first train takes only ITS OWN words to the dock, not the block',
    tDock() === 'lovely|little|wooden', tDock());
  ok('trainOrder: the car behind stands higher and is shorter, so its opening is less room',
    tCars()[0].style.height === '122px' && tCars()[7].style.height === '80px'
    && tCars()[7].style.marginBottom === '42px',
    tCars()[0].style.height + ' @' + tCars()[0].style.marginBottom
    + ' → ' + tCars()[7].style.height + ' @' + tCars()[7].style.marginBottom);
  ok('trainOrder: every car wears its slot name while the level is low',
    [...tkRoot.querySelectorAll('.g4-tslot')].map(t => t.textContent).join('|')
    === 'Opinion|Size|Age|Shape|Color|Origin|Material|Purpose',
    tkRoot.querySelectorAll('.g4-tslot').length + ' plaque(s)');
  ok('trainOrder: tapping a word picks it up', tapWord('lovely'));
  tCars()[0].click();
  ok('trainOrder: a word dropped in its own car checks THAT car\'s radio',
    tPage.document.querySelector('#tk input[name="t1"][value="opinion"]').checked === true);
  const loveLoad = tCars()[0].querySelector('.g4-tload');
  ok('trainOrder: the word grows to the height its own slot is allowed (100px for the front car)',
    !!loveLoad && loveLoad.style.height === '100px' && tCars()[0].classList.contains('ok'),
    loveLoad ? loveLoad.style.height : 'no load');
  /* a word a car too far back: taller than the room that car has */
  tapWord('little');
  tCars()[3].click();
  ok('trainOrder: a word put further back is marked wrong, and its radio is the car it landed in',
    tCars()[3].classList.contains('no')
    && tPage.document.querySelector('#tk input[name="t2"][value="shape"]').checked === true);
  ok('trainOrder: and it bursts through the deck where the growth ends',
    await until(() => !!tCars()[3].querySelector('.g4-tburst')));
  /* a word too far FORWARD fits (a gap), which is why the crash is not symmetric */
  tapWord('wooden');
  tCars()[1].click();
  ok('trainOrder: a word that ends up too far forward fits under the bridge (it is a gap, not a crash)',
    tCars()[1].classList.contains('no') && !tCars()[1].querySelector('.g4-tburst'));
  ok('trainOrder: a full train leaves on its own, and the wreck is on the stage',
    await until(() => tkRoot.querySelector('.g4-ttrain').classList.contains('jolt')),
    tkRoot.querySelector('.g4-ttrain').className);
  ok('trainOrder: the plank over the wrong car is what breaks',
    await until(() => tkRoot.querySelectorAll('.g4-tplank.broken').length === 1),
    tkRoot.querySelectorAll('.g4-tplank.broken').length + ' plank(s)');
  ok('trainOrder: the verdict is stamped on the stage',
    await until(() => /DERAILED/.test((tkRoot.querySelector('.g4-tstamp') || {}).textContent || '')),
    (tkRoot.querySelector('.g4-tstamp') || {}).textContent || '(none)');
  ok('trainOrder: a wreck costs one of the run\'s hearts',
    await until(() => hearts(tkRoot) === '1/2'), hearts(tkRoot));
  ok('trainOrder: the next train is laid for the next sentence',
    await until(() => tDock() === 'French|round'), tDock());
  ok('trainOrder: the new train starts on a clean rail (the last verdict is off the stage)',
    !/showing/.test((tkRoot.querySelector('.g4-tstamp') || {}).className || ''));
  /* the second train, loaded correctly */
  tapWord('French');
  tCars()[5].click();
  tapWord('round');
  tCars()[3].click();
  ok('trainOrder: a train with every word in its own car runs out under the bridge',
    await until(() => tkRoot.querySelector('.g4-ttrain').classList.contains('pull')),
    tkRoot.querySelector('.g4-ttrain').className);
  ok('trainOrder: and it is CLEARED',
    /CLEARED/.test((tkRoot.querySelector('.g4-tstamp') || {}).textContent || ''));
  /* the run ends with the LAST train still on the stage: the ending is part of the game, so the stage is
     kept until the train has gone, and only then handed back to the intro */
  ok('trainOrder: the ending holds the stage (the intro does not cover the last train leaving)',
    await until(() => tk.state().phase === 'over') && tkRoot.classList.contains('is-on'),
    tk.state().phase + ' is-on=' + tkRoot.classList.contains('is-on'));
  ok('trainOrder: ... and hands it back when the yard is empty',
    await until(() => !tkRoot.classList.contains('is-on') && !!tkRoot.querySelector('.g4-prev.on')),
    'is-on=' + tkRoot.classList.contains('is-on'));
  ok('trainOrder: the score is the words that were fitted right (3 of 5)', tk.state().score === 3,
    'score=' + tk.state().score + '/' + tk.state().total);

  /* the labels are a LEVEL lever: a plaque saying "Opinion" over the front car is the answer */
  const lvPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="l31" data-game="trainOrder" data-level="31" data-shuffle="0" data-depart="0">
        <p class="game-how">a</p><div class="game-list">${word(1, 'lovely', 'opinion')}</div>
        <button class="game-start" type="button">▶</button></div>
      <div class="game" id="l31on" data-game="trainOrder" data-level="31" data-labels="1" data-shuffle="0" data-depart="0">
        <p class="game-how">b</p><div class="game-list">${word(2, 'lovely', 'opinion')}</div>
        <button class="game-start" type="button">▶</button></div>
      <div class="game" id="l20" data-game="trainOrder" data-level="20" data-shuffle="0" data-depart="0">
        <p class="game-how">c</p><div class="game-list">${word(3, 'lovely', 'opinion')}</div>
        <button class="game-start" type="button">▶</button></div>
    </div></body></html>`);
  ['l31', 'l31on', 'l20'].forEach(id =>
    lvPage.document.getElementById(id).querySelector('.game-start').click());
  const plaques = id => lvPage.document.querySelectorAll('#' + id + ' .g4-tslot').length;
  ok('trainOrder: level 31 hides the car labels by default', plaques('l31') === 0, plaques('l31') + ' plaque(s)');
  ok('trainOrder: data-labels="1" puts them back', plaques('l31on') === 8, plaques('l31on') + ' plaque(s)');
  ok('trainOrder: level 20 keeps them', plaques('l20') === 8, plaques('l20') + ' plaque(s)');
  /* a lesson page declares its own L; a page with no level at all reads as a beginner */
  const LBL = (id, level) => mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="${id}" data-game="trainOrder" data-shuffle="0" data-depart="0">
        <p class="game-how">d</p><div class="game-list">${word(1, 'lovely', 'opinion')}</div>
        <button class="game-start" type="button">▶</button></div>
    </div>${level ? '<script>const L = ' + level + ';</script>' : ''}</body></html>`);
  const lL = LBL('lL', 34);
  lL.document.getElementById('lL').querySelector('.game-start').click();
  ok('trainOrder: the lesson page\'s own L is the level (L=34 hides the labels)',
    lL.document.querySelectorAll('#lL .g4-tslot').length === 0,
    lL.document.querySelectorAll('#lL .g4-tslot').length + ' plaque(s)');
  const lNo = LBL('lNo', 0);
  lNo.document.getElementById('lNo').querySelector('.game-start').click();
  ok('trainOrder: a page with no level keeps the labels (an unknown student is no expert)',
    lNo.document.querySelectorAll('#lNo .g4-tslot').length === 8,
    lNo.document.querySelectorAll('#lNo .g4-tslot').length + ' plaque(s)');


  /* ---- structural guards: the two bug classes we kept hitting ----
     1. a class the engine creates with NO rule in style.css renders as unstyled text (the greyed
        options), and
     2. two games sharing one class name means the later rule silently restyles the earlier game.
     A class reaches the DOM by TWO routes: the element helper `el('div', 'g4-a g4-b')`, and any
     `class="g4-a g4-b"` inside a string that becomes innerHTML. Reading only the first route left
     whole pictures invisible to both guards — mineGrid's signpost plaque, written in a string, was
     being restyled by a stale `.g4-board` stage rule and no guard could see either half. So the
     scan below reads BOTH routes, here and for each game's ownership. */
  const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
  const styled = new Set([...css.matchAll(/\.(g4-[a-z0-9-]+)/g)].map(m => m[1]));
  const src = fs.readFileSync(path.join(ROOT, 'engine4.js'), 'utf8');
  /* every g4- class the text puts on an element, by either route. A token must be a whole class name
     (`g4-x`), which drops the half-built prefix of a concatenation (`'g4-' + kind`). engine4.js writes
     its HTML in single-quoted strings with escaped quotes (`class=\"g4-x\"`) and the posters use plain
     ones, so the quote may carry any number of backslashes and either quote character. */
  function classesIn(text) {
    const out = new Set();
    /* a class token may carry hyphens (`g4-bucket-t`) but can never END in one: a trailing dash is the
       half-built prefix of a concatenation (`'g4-' + kind`), not a name */
    const take = s => s.split(/\s+/).forEach(c => {
      if (/^g4-[a-z0-9]+(-[a-z0-9]+)*$/.test(c)) out.add(c);
    });
    for (const m of text.matchAll(/el\('[a-z]+', '([^']*)'/g)) take(m[1]);
    for (const m of text.matchAll(/class=\\*["']([^"'\\]+)\\*["']/g)) take(m[1]);
    return out;
  }
  const made = classesIn(src);
  const elOnly = new Set([...src.matchAll(/el\('[a-z]+', '(g4-[a-z0-9-]+)/g)].map(m => m[1]));
  const unstyled = [...made].filter(c => !styled.has(c));
  ok('every class the engine creates has a rule in style.css', unstyled.length === 0, unstyled.join(' '));
  /* a guard on the guard: if the scan narrows back to el() literals it stops seeing the strings, and
     the two guards above quietly become half a guard again */
  ok('the class scan reads innerHTML strings as well as el() calls', made.size > elOnly.size,
    made.size + ' classes vs ' + elOnly.size + ' from el() alone');

  /* classes owned by more than one game: only ones that are deliberately shared are allowed. The
     same two-route scan is used per game, so a class that appears only as `class="…"` in a game's
     picture still counts as that game's. */
  const SHARED = new Set(['g4-again', 'g4-raceopt', 'g4-raceopts']);
  const starts = [];
  src.split('\n').forEach((l, i) => {
    const m = l.match(/^\s*PLUGINS\.([a-zA-Z]+) = function/);
    if (m) starts.push({ name: m[1], start: i });
  });
  const owners = new Map();
  /* the SCENE/POSTER tables build stills out of every game's furniture, so they are not an owner */
  const sceneStart = src.split('\n').findIndex(l => /var SCENE = \{/.test(l));
  const sceneEnd = src.split('\n').findIndex((l, i) => i > sceneStart && /^\s*PLUGINS\./.test(l));
  starts.forEach((s, i) => {
    const body = src.split('\n')
      .map((l, n) => (n >= sceneStart && n < sceneEnd) ? '' : l)
      .slice(s.start, i + 1 < starts.length ? starts[i + 1].start : src.split('\n').length).join('\n');
    classesIn(body).forEach(c => {
      if (!owners.has(c)) owners.set(c, new Set());
      owners.get(c).add(s.name);
    });
  });
  const clashes = [...owners.entries()].filter(([c, o]) => o.size > 1 && !SHARED.has(c))
    .map(([c, o]) => c + ':' + [...o].join('/'));
  ok('no two games fight over one class name', clashes.length === 0, clashes.join(' '));

  /* the unreadable-text guard: the bug was option TEXT rendered in a very light grey on a light
     panel. Size was never the problem, so this checks COLOUR: any rule that sets a text colour on
     a game element must use the ink/cream custom properties or a dark hex. Light greys fail. */
  {
    const lum = (hex) => {
      const h = hex.replace('#', '');
      const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
      const [r, g, b] = [0, 2, 4].map(i => parseInt(n.substr(i, 2), 16) / 255)
        .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const rules = [...css.matchAll(/([^{}]*\.g4-[^{}]*)\{([^}]*)\}/g)];
    const bad = [];
    rules.forEach(m => {
      const color = (m[2].match(/(?:^|;)\s*color:\s*([^;]+)/) || [])[1];
      if (!color) return;
      const v = color.trim().toLowerCase();
      if (v.indexOf('var(--') === 0) return;            /* the palette's own ink/cream */
      if (v === '#fff' || v === '#ffffff' || v === 'white' || v === 'transparent' || v === 'inherit') return;
      const hex = v.match(/#[0-9a-f]{3,6}/);
      if (hex && lum(hex[0]) < 0.35) return;            /* a dark colour is readable */
      bad.push(m[1].trim().split('\n').pop().trim() + ' { color: ' + v + ' }');
    });
    ok('every text colour the games set is ink, cream or a dark colour (no light grey text)',
      bad.length === 0, bad.join(' | ') || 'all readable');
  }

  /* bingoCard must CALL a word, not read the question — the bug you spotted */
  const spoken = [];
  const bPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="bg" data-game="bingoCard" data-shuffle="0" data-time="0" data-sound="0">
        <p class="game-how">Stamp the one you hear.</p>
        <div class="game-list">
          <div class="qitem" data-a="b">
            <div class="qline"><span class="qstem">which of these means a finished action</span></div>
            <div class="qopts"><label><input type="radio" name="bg1" value="a">running</label><label><input type="radio" name="bg1" value="b">walked</label></div>
          </div>
        </div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`, w => {
    w.speechSynthesis = { speak: u => spoken.push(u.text), cancel: () => { } };
    w.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  const bg = (bPage.__G4 || [])[0];
  bPage.document.getElementById('bg').querySelector('.game-start').click();
  await sleep(400);
  ok('bingoCard calls the answer word, not the question',
    spoken.length > 0 && spoken[spoken.length - 1] === 'walked', 'said «' + (spoken[spoken.length - 1] || '') + '»');

  /* the counting is bingoCard's clock, and it stands BESIDE the card — never on the curtain, never twice,
     and never a written instruction inside the stage */
  const bRoot = bPage.document.getElementById('bg'), bBox = bRoot.querySelector('.g4-bingo');
  const bKids = [...bBox.children].map(n => n.className.split(' ')[0]);
  ok('bingoCard: the card is wrapped so a curtain can cover it', !!bRoot.querySelector('.g4-card-wrap .g4-curtain'));
  ok('bingoCard: the lead countdown stands LEFT of the card and the rush countdown RIGHT',
    bKids[0] === 'g4-count' && bKids[bKids.length - 1] === 'g4-count'
    && bBox.firstElementChild.classList.contains('g4-count-lead')
    && bBox.lastElementChild.classList.contains('g4-count-rush'), bKids.join(' | '));
  ok('bingoCard: the rush countdown is only there while the card is open',
    /\.g4-count-rush\{[^}]*visibility:hidden/.test(CSS_SRC)
    && /\.g4-bingo\.open \.g4-count-rush\{visibility:visible\}/.test(CSS_SRC));
  ok('bingoCard: the two counts sit side by side, not stacked', /\.g4-bingo\{[^}]*flex-direction:row/.test(CSS_SRC));
  ok('bingoCard: the stage prints no second instruction and no replay button',
    !bRoot.querySelector('.g4-bingo .g4-yell') && !bRoot.querySelector('.g4-bingo .g4-again'));
  ok('bingoCard: the curtain starts shut', !bBox.classList.contains('open')
    && bBox.firstElementChild.textContent !== '', 'lead «' + bBox.firstElementChild.textContent + '»');
  await sleep(3000);
  ok('bingoCard: the call ends and the curtain rises on its own', bBox.classList.contains('open'));
  ok('bingoCard: the rush countdown runs once the card is open', /^[1-5]$/.test(bBox.lastElementChild.textContent),
    'rush «' + bBox.lastElementChild.textContent + '»');
  ok('bingoCard: the word is called once — there is nothing to replay', spoken.length === 1,
    spoken.length + ' call(s)');
  /* the deadline: the rush reaches zero, the curtain falls, and the item is a miss */
  let waited = 0;
  while (bBox.classList.contains('open') && waited < 7000) { await sleep(50); waited += 50; }
  ok('bingoCard: the curtain falls when the rush countdown ends', !bBox.classList.contains('open'),
    waited + 'ms after the card opened');
  ok('bingoCard: the fallen curtain marks the item wrong (the point is gone)',
    bg.state().missed === 1 && bg.state().score === 0,
    'score=' + bg.state().score + ' missed=' + bg.state().missed);
  ok('bingoCard: the unanswered radio stays blank — the blank is the evidence',
    bPage.document.querySelector('#bg input[value="b"]').checked === false);

  /* the crossword must be a REAL crossword: crossing words share their letter, typed once */
  const xwItems = [['cat', 'a small pet'], ['are', 'you ___ ready']].map(([w, clue], i) => `
    <div class="qitem" data-a="a" data-answer="${w}">
      <div class="qline"><span class="qstem">${clue}</span></div>
      <div class="qopts"><label><input type="radio" name="xw${i}" value="a">${w}</label><label><input type="radio" name="xw${i}" value="b">zzz</label></div>
    </div>`).join('');
  const xPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="xx" data-game="crosswordBoard" data-shuffle="0" data-time="0" data-sound="0">
        <p class="game-how">Fill the grid.</p>
        <div class="game-list">${xwItems}</div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const xr = xPage.document.getElementById('xx');
  xr.querySelector('.game-start').click();
  const xcells = [...xr.querySelectorAll('.g4-gap')];
  ok('crosswordBoard lays the words so they cross (a shared letter, one cell)',
    xcells.length < 6 && xcells.length >= 5, xcells.length + ' cells for 6 letters');
  xcells.forEach(c => {
    const k = c.getAttribute('data-key');
    const want = { '0,0': 'c', '0,1': 'a', '0,2': 't', '1,1': 'r', '2,1': 'e' }[k];
    if (want) { c.value = want; c.dispatchEvent(new xPage.Event('input', { bubbles: true })); }
  });
  ok('crosswordBoard: one typed shared letter finishes both words',
    xr.querySelector('input[name="xw0"][value="a"]').checked === true &&
    xr.querySelector('input[name="xw1"][value="a"]').checked === true);

  /* the crossword punishes nothing: a wrong word takes no point, ends no run, and leaves its radio
     blank (qa/NOTES.md 71 — "wrong answers dont subtract points, there is no fail condition") */
  const yItems = [['cat', 'a small pet'], ['are', 'you ___ ready']].map(([w, clue], i) => `
    <div class="qitem" data-a="a" data-answer="${w}">
      <div class="qline"><span class="qstem">${clue}</span></div>
      <div class="qopts"><label><input type="radio" name="yw${i}" value="a">${w}</label><label><input type="radio" name="yw${i}" value="b">zzz</label></div>
    </div>`).join('');
  const yPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="yy" data-game="crosswordBoard" data-shuffle="0" data-time="0" data-sound="0">
        <p class="game-how">Fill the grid.</p>
        <div class="game-list">${yItems}</div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const yr = yPage.document.getElementById('yy');
  const yg = (yPage.__G4 || [])[0];
  yr.querySelector('.game-start').click();
  [...yr.querySelectorAll('.g4-gap')].forEach(c => {
    if ({ '0,0': 1, '0,1': 1, '0,2': 1 }[c.getAttribute('data-key')] && !c.value) {
      c.value = 'z';
      c.dispatchEvent(new yPage.Event('input', { bubbles: true }));
    }
  });
  ok('crosswordBoard: a wrong word costs no point', yg.state().score === 0,
    'score=' + yg.state().score);
  ok('crosswordBoard: and there is no fail condition', yg.state().phase !== 'over',
    'phase=' + yg.state().phase);
  ok('crosswordBoard: the missed word leaves its radio blank',
    yr.querySelector('input[name="yw0"][value="a"]').checked === false);

  /* ladderRun must actually climb, and a wrong answer must drop it back to the safe rung */
  const lItems = Array.from({ length: 8 }, (_, i) => `
    <div class="qitem" data-a="a">
      <div class="qline"><span class="qstem">rung ${i}</span></div>
      <div class="qopts"><label><input type="radio" name="ld${i}" value="a">yes</label><label><input type="radio" name="ld${i}" value="b">no</label></div>
    </div>`).join('');
  const lPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="ld" data-game="ladderRun" data-shuffle="0" data-time="0" data-replay="0" data-sound="0">
        <p class="game-how">Climb.</p>
        <div class="game-list">${lItems}</div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const ld = lPage.document.getElementById('ld');
  const lg = (lPage.__G4 || [])[0];
  ld.querySelector('.game-start').click();
  const climber = ld.querySelector('.g4-lclimber');
  const y0 = climber.style.bottom;
  lg.hooks.pick('a');
  const y1 = climber.style.bottom;
  ok('ladderRun climbs on a right answer', y0 !== y1, y0 + ' -> ' + y1);
  await sleep(700);
  lg.hooks.pick('b');
  const y2 = climber.style.bottom;
  ok('ladderRun drops back to the safe rung on a wrong one', y2 === y0, y2);

  /* skeetRange: one disc per option, ONE shot per item, and a click on the sky spends that shot */
  const skPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="sk" data-game="skeetRange" data-shuffle="0" data-time="0" data-replay="0" data-sound="0">
        <p class="game-how">One shot per round. Hit the disc that fits.</p>
        <div class="game-list">
          <div class="qitem" data-a="b">
            <div class="qline"><span class="qstem">which one ends with the sound in wanted</span></div>
            <div class="qopts"><label><input type="radio" name="sk1" value="a">walked</label><label><input type="radio" name="sk1" value="b">needed</label></div>
          </div>
          <div class="qitem" data-a="a">
            <div class="qline"><span class="qstem">which one has the long i</span></div>
            <div class="qopts"><label><input type="radio" name="sk2" value="a">seat</label><label><input type="radio" name="sk2" value="b">sick</label></div>
          </div>
        </div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const skr = skPage.document.getElementById('sk');
  const skg = (skPage.__G4 || [])[0];
  skr.querySelector('.game-start').click();
  ok('skeetRange: one disc per option', skr.querySelectorAll('.g4-target').length === 2,
    skr.querySelectorAll('.g4-target').length + ' disc(s)');
  ok('skeetRange: every disc is a drawn ring with its label on a plaque',
    skr.querySelectorAll('.g4-target .g4-ring').length === 2 &&
    [...skr.querySelectorAll('.g4-target .g4-target-t')].map(t => t.textContent).join('|') === 'walked|needed',
    [...skr.querySelectorAll('.g4-target .g4-target-t')].map(t => t.textContent).join('|'));
  ok('skeetRange: the stem is the prompt line on the stage',
    /wanted/.test((skr.querySelector('.g4-prompt') || {}).textContent || ''));
  /* the sky is a shot: one click that hits no disc spends the item and is a miss */
  skr.querySelector('.g4-range').dispatchEvent(new skPage.MouseEvent('click', { bubbles: true }));
  ok('skeetRange: a click on the sky is your one shot, and it is a miss',
    skg.state().missed === 1 && skg.state().score === 0,
    'score=' + skg.state().score + ' missed=' + skg.state().missed);
  ok('skeetRange: a miss leaves the radio blank — the blank is the evidence',
    skr.querySelector('input[name="sk1"][value="a"]').checked === false &&
    skr.querySelector('input[name="sk1"][value="b"]').checked === false);
  await sleep(1200);
  ok('skeetRange: the spent item does not come back (data-replay="0")',
    skg.state().replaying !== true, 'replaying=' + skg.state().replaying);
  const goodDisc = [...skr.querySelectorAll('.g4-target')].find(d => d.getAttribute('data-v') === 'a');
  ok('skeetRange: the next item lays its own discs', !!goodDisc);
  if (goodDisc) goodDisc.click();
  ok('skeetRange: hitting the right disc checks the REAL radio (that is what persists)',
    skr.querySelector('input[name="sk2"][value="a"]').checked === true);
  ok('skeetRange: a hit scores', skg.state().score === 1, 'score=' + skg.state().score);

  /* ---- catchBasket: a right answer waters a pot and plants a flower that STAYS (the garden is the run) ---- */
  const fPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="fb" data-game="catchBasket" data-shuffle="0" data-time="0" data-sound="0">
        <p class="game-how">Sort.</p>
        <div class="game-list">
          ${item(1, 'she ___ here', 'a', [['a', 'walks'], ['b', 'walk']])}
          ${item(2, 'they ___ here', 'b', [['a', 'walks'], ['b', 'walk']])}
        </div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const fRoot = fPage.document.getElementById('fb');
  const fg = (fPage.__G4 || [])[0];
  fRoot.querySelector('.game-start').click();
  const potOf = v => [...fRoot.querySelectorAll('.g4-bucket')].find(b => b.getAttribute('data-v') === v);
  fg.hooks.pick('a');
  ok('catchBasket: a right answer waters that pot', !!potOf('a') && potOf('a').classList.contains('watered'));
  ok('catchBasket: and plants one flower in it', potOf('a').querySelectorAll('.g4-bloom').length === 1,
    potOf('a').querySelectorAll('.g4-bloom').length + ' bloom(s)');
  ok('catchBasket: the pot that was not chosen grows nothing', potOf('b').querySelectorAll('.g4-bloom').length === 0);
  await sleep(750);
  ok('catchBasket: the flower is still there on the next word (the garden is the run)',
    !!potOf('a') && potOf('a').querySelectorAll('.g4-bloom').length === 1,
    potOf('a') ? potOf('a').querySelectorAll('.g4-bloom').length + ' bloom(s)' : 'no pot');

  /* ---- mineGrid: saloon doors. The right door is entered, a wrong one is a snake, and the three
     lives belong to the RUN: an item must never hand one back. ---- */
  const mPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="mg" data-game="mineGrid" data-shuffle="0" data-replay="0" data-time="0" data-sound="0">
        <p class="game-how">Open a door.</p>
        <div class="game-list">
          ${item(1, 'the room where you cook', 'b', [['a', 'hall'], ['b', 'kitchen'], ['c', 'garage'], ['d', 'cellar']])}
          ${item(2, 'the person who fixes a car', 'c', [['a', 'baker'], ['b', 'driver'], ['c', 'mechanic'], ['d', 'plumber']])}
          ${item(3, 'something you borrow from a library', 'a', [['a', 'a book'], ['b', 'a ticket'], ['c', 'a receipt'], ['d', 'a fridge']])}
        </div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const mgRoot = mPage.document.getElementById('mg');
  const mg = (mPage.__G4 || [])[0];
  mgRoot.querySelector('.game-start').click();
  const doorFor = v => [...mgRoot.querySelectorAll('.g4-door')].find(d => d.getAttribute('data-v') === v);
  /* the lives are the HUD's count — read what the student reads, not a private variable */
  const livesTxt = () => hearts(mgRoot);
  ok('mineGrid: one saloon door per option (four doors on the street)',
    mgRoot.querySelectorAll('.g4-door').length === 4, mgRoot.querySelectorAll('.g4-door').length + ' doors');
  ok('mineGrid: the pit is gone (no hole to fall in)',
    mgRoot.querySelectorAll('.g4-pit,.g4-stake').length === 0);
  doorFor('b').click();
  /* he walks (360ms), goes in (560ms), then the runner takes the answer: ~1s before the radio moves */
  await sleep(1200);
  ok('mineGrid: a right door opens and checks its radio, and no snake comes out',
    doorFor('b').classList.contains('ok') && !doorFor('b').classList.contains('bitten') &&
    mgRoot.querySelector('input[name="q1"][value="b"]').checked === true);
  await sleep(600);
  ok('mineGrid: the street did not hand a life back between items (still 3/3)',
    livesTxt() === '3/3', livesTxt());
  doorFor('d').click();
  await sleep(1200);
  ok('mineGrid: a wrong door turns red with the snake in it, and the right door is outlined',
    doorFor('d').classList.contains('no') && doorFor('d').classList.contains('bitten') &&
    doorFor('c').classList.contains('reveal'));
  ok('mineGrid: a snake bite costs exactly one life',
    livesTxt() === '2/3', livesTxt());
  ok('mineGrid: the bite leaves the radio blank (the blank is the evidence)',
    [...mgRoot.querySelectorAll('input[name="q2"]')].every(r => r.checked === false));

  /* ---- bossRaid: the fighter picked on the intro card decides the attack, and the boss answers
     back with two different attacks rather than repeating one. ---- */
  const brPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="br" data-game="bossRaid" data-shuffle="0" data-replay="0" data-time="0" data-sound="0">
        <p class="game-how">Fight.</p>
        <div class="game-list">
          ${item(1, 'first', 'a', [['a', 'yes'], ['b', 'no']])}
          ${item(2, 'second', 'a', [['a', 'yes'], ['b', 'no']])}
          ${item(3, 'third', 'a', [['a', 'yes'], ['b', 'no']])}
          ${item(4, 'fourth', 'a', [['a', 'yes'], ['b', 'no']])}
        </div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const brRoot = brPage.document.getElementById('br');
  const br = (brPage.__G4 || [])[0];
  const picks = [...brRoot.querySelectorAll('.g4-pick-btn')];
  ok('bossRaid: the intro card offers three fighters', picks.length === 3, picks.map(b => b.getAttribute('data-fighter')).join(', '));
  ok('bossRaid: one is picked from the start', picks.filter(b => b.classList.contains('on')).length === 1);
  picks.find(b => b.getAttribute('data-fighter') === 'wizard').click();
  ok('bossRaid: picking a fighter marks it, and only it',
    picks.filter(b => b.classList.contains('on')).length === 1 &&
    picks.find(b => b.getAttribute('data-fighter') === 'wizard').classList.contains('on'));
  brRoot.querySelector('.game-start').click();
  br.hooks.pick('a');
  ok('bossRaid: a right answer fires THAT fighter\'s projectile (the wizard\'s fireball)',
    !!brRoot.querySelector('.g4-proj.fire'), brRoot.querySelectorAll('.g4-proj').length + ' projectile(s)');
  /* the fireball is in the air at once and bursts on the boss 440ms later */
  await sleep(520);
  ok('bossRaid: the fireball bursts on the boss (it flinches)',
    brRoot.querySelector('.g4-bossart').classList.contains('hurt'));
  /* a hit clears after 620ms, a miss after 1000ms: wait the slower one before the next answer */
  await sleep(1200);
  br.hooks.pick('b');
  ok('bossRaid: a wrong answer is the boss\'s turn, and the first one is the bite',
    brRoot.querySelector('.g4-bossart').classList.contains('bite'));
  await sleep(1200);
  br.hooks.pick('b');
  ok('bossRaid: the boss does not repeat itself — the second turn is acid, and it travels',
    !!brRoot.querySelector('.g4-proj.spit'), brRoot.querySelectorAll('.g4-proj').length + ' projectile(s)');
  const bossLives = () => hearts(brRoot);
  ok('bossRaid: two boss turns cost two of the three lives',
    bossLives() === '1/3', bossLives());

  /* ---- the ONE fail condition: the last life ends the run, and the runner is what enforces it, so a
     presentation that only spends the life cannot leave the run going. ---- */
  /* a miss clears after 1000ms: the third pick must wait for the next item, or it is ignored */
  await sleep(1200);
  br.hooks.pick('b');
  await sleep(1500);
  ok('lives 0 ends the run (the third boss turn takes the last heart)',
    bossLives() === '0/3', bossLives());
  ok('lives 0 ends the run: the stage is handed back and the run is over',
    !brRoot.classList.contains('is-on') && br.hooks.state().phase === 'over',
    br.hooks.state().phase);
  ok('lives 0 ends the run: the score line says why',
    /out of lives/.test((brRoot.querySelector('.game-score-line') || {}).textContent || ''),
    (brRoot.querySelector('.game-score-line') || {}).textContent || '(no line)');

  console.log('\n' + (fail ? 'FAILED: ' : 'OK: ') + pass + ' passed, ' + fail + ' failed\n');
  /* some game plugins keep a requestAnimationFrame loop or a timer alive; jsdom would never exit */
  process.exit(fail ? 1 : 0);
}

run().catch(e => { console.error(e); process.exitCode = 1; });
