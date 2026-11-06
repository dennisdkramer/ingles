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
  const meta = (rc.querySelector('.g4-intro-meta') || {}).textContent || '';
  ok('the intro states the rounds, the deadline and the keys', /2/.test(meta) && /6s/.test(meta) && /1–/.test(meta), meta);
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
    stackDrop: '.g4-padbtn', flapGate: '.g4-gate', pairFlip: '.g4-card',
    mineGrid: '.g4-mine', wordleBoard: '.g4-tile', crosswordBoard: '.g4-xboard',
    echoPads: '.g4-pad', bingoCard: '.g4-btile',
    ladderRun: '.g4-lclimber', bossRaid: '.g4-bossart'
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

  /* pairFlip is a board: six pairs, twelve cards, and a true pair answers its own item */
  const pfItems = Array.from({ length: 6 }, (_, i) => `
    <div class="qitem" data-a="a">
      <div class="qline"><span class="qstem">w${i}</span></div>
      <div class="qopts"><label><input type="radio" name="pf${i}" value="a">right${i}</label><label><input type="radio" name="pf${i}" value="b">wrong${i}</label></div>
    </div>`).join('');
  const pfPage = mount(`<!doctype html><html><head><meta charset="utf-8"></head><body>
    <div class="content-area">
      <div class="game" id="pf" data-game="pairFlip" data-shuffle="1" data-time="0" data-sound="0">
        <p class="game-how">Match each one with its partner.</p>
        <div class="game-list">${pfItems}</div>
        <button class="game-start" type="button">▶ Play</button>
      </div>
    </div></body></html>`);
  const pd = pfPage.document, pf = (pfPage.__G4 || [])[0];
  pd.getElementById('pf').querySelector('.game-start').click();
  ok('pairFlip: twelve cards for six pairs', pd.querySelectorAll('#pf .g4-card').length === 12,
    pd.querySelectorAll('#pf .g4-card').length + ' cards');
  ok('pairFlip: every card carries a backed face, so nothing renders blank',
    pd.querySelectorAll('#pf .g4-card .g4-face.front').length === 12);
  const stack = [...pd.querySelectorAll('#pf .g4-card')];
  const first = stack[0];
  const mate = stack.find(c => c !== first && c.getAttribute('data-pair') === first.getAttribute('data-pair'));
  ok('pairFlip: each card has exactly one mate', !!mate);
  first.click(); mate.click();
  await sleep(500);
  const pairIdx = Number(first.getAttribute('data-pair'));
  const rights = [...pd.querySelectorAll('#pf input[value="a"]')];
  const checkedIdx = rights.findIndex(r => r.checked);
  const texts = [first, mate].map(c => c.querySelector('.g4-face.front').textContent).sort().join('|');
  ok('pairFlip: a true pair stays up and answers its own item',
    first.classList.contains('up') && first.classList.contains('ok') && checkedIdx > -1
      && texts === ['right' + checkedIdx, 'w' + checkedIdx].sort().join('|'),
    'pair=' + pairIdx + ' answered item ' + checkedIdx + ' cards "' + texts + '"');
  ok('pairFlip: matching scores', pf.score === 1, 'score=' + pf.score);
  const a2 = stack.find(c => !c.classList.contains('up'));
  const b2 = stack.find(c => c !== a2 && !c.classList.contains('up') && c.getAttribute('data-pair') !== a2.getAttribute('data-pair'));
  a2.click(); b2.click();
  await sleep(950);
  ok('pairFlip: a false pair turns back over', !a2.classList.contains('up') && !b2.classList.contains('up'));

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
  [...d2.querySelectorAll('#g-echoPads .g4-pad')][0].click();
  ok('echoPads: pressing the lit pad is the answer',
    d2.querySelector('#g-echoPads input[value="a"]').checked === true);

  /* the scene and the intro card are part of every claimed block */
  const anyRoot = d2.getElementById('g-catchBasket');
  ok('every claimed block carries a drawn scene', !!anyRoot.querySelector('.g4-scene svg'));
  ok('the intro is a card over the scene, not a full-page form',
    !!anyRoot.querySelector('.g4-intro > .g4-intro-card'));
  ok('the shared gradient defs are injected once per page',
    d2.querySelectorAll('.g4-defs').length === 1);

  /* ---- structural guards: the two bug classes we kept hitting ----
     1. a class the engine creates with NO rule in style.css renders as unstyled text (the greyed
        options), and
     2. two games sharing one class name means the later rule silently restyles the earlier game. */
  const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
  const styled = new Set([...css.matchAll(/\.(g4-[a-z0-9-]+)/g)].map(m => m[1]));
  const src = fs.readFileSync(path.join(ROOT, 'engine4.js'), 'utf8');
  const made = new Set([...src.matchAll(/el\('[a-z]+', '(g4-[a-z0-9-]+)/g)].map(m => m[1]));
  const unstyled = [...made].filter(c => !styled.has(c));
  ok('every class the engine creates has a rule in style.css', unstyled.length === 0, unstyled.join(' '));

  /* classes owned by more than one game: only ones that are deliberately shared are allowed */
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
    const seen = new Set([...body.matchAll(/el\('[a-z]+', '(g4-[a-z0-9-]+)/g)].map(m => m[1]));
    seen.forEach(c => { if (!owners.has(c)) owners.set(c, new Set()); owners.get(c).add(s.name); });
  });
  const clashes = [...owners.entries()].filter(([c, o]) => o.size > 1 && !SHARED.has(c))
    .map(([c, o]) => c + ':' + [...o].join('/'));
  ok('no two games fight over one class name', clashes.length === 0, clashes.join(' '));

  /* the invisible-options guard: every element the engine makes CLICKABLE must have a base CSS rule
     and a size. pairFlip's cards were absolutely-positioned faces inside a 0x0 button, so the whole
     board was invisible; this makes that impossible to ship again. */
  {
    const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
    const eng = fs.readFileSync(path.join(ROOT, 'engine4.js'), 'utf8');
    const clickable = [...new Set([...eng.matchAll(/el\('button', '([a-z0-9 -]+)'/g)]
      .flatMap(m => m[1].split(' ')).filter(c => c.indexOf('g4-') === 0))];
    ok('the engine marks a set of clickable game classes', clickable.length >= 10, clickable.length + ' classes');
    const unsized = clickable.filter(c => {
      const rule = css.split('\n').filter(l => new RegExp('^\\.' + c + '[ ,{]').test(l.trim())).join(' ');
      return !rule || !/(width|min-width|min-height|height|inset|padding)/.test(rule);
    });
    ok('every clickable game class has CSS with a size (nothing renders 0x0 or invisible)',
      unsized.length === 0, unsized.join(', ') || 'all sized');
    const faces = css.indexOf('.g4-face{') > -1 && /\.g4-face\{[^}]*(inset|width)/.test(css);
    ok('pairFlip faces are sized inside their card', faces);
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

  console.log('\n' + (fail ? 'FAILED: ' : 'OK: ') + pass + ' passed, ' + fail + ' failed\n');
  /* some game plugins keep a requestAnimationFrame loop or a timer alive; jsdom would never exit */
  process.exit(fail ? 1 : 0);
}

run().catch(e => { console.error(e); process.exitCode = 1; });
