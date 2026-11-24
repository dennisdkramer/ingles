/**
 * qa/rows3.mjs — the drop shapes of the layout editor, in a REAL browser (hit testing is the
 * instrument, so jsdom cannot answer it): a cell on the band between two rows, a cell merged into a
 * cell, an item on a level-3 cell's side band, an item dropped in a level-3 cell's middle, an item
 * held on the exact edge of another item (the level-3 gesture, red line) and on the wide side of the
 * cell (the level-2 gesture, blue line), a row picked up by its grip, and a block made with Shift +
 * right click — and undo after each, which must put the page back exactly.
 *
 * Why a browser: `pick()` asks `document.elementFromPoint(x, y)`, so the answer depends on the box
 * the pointer is actually over. A jsdom page has no boxes, and a probe that aims at coordinates no
 * element covers would "pass" by testing nothing.
 *
 * The fixture is qa/fixtures/rows3.html: four sections, one shape each. Every section carries the
 * band its shape needs — qa/rows3.mjs does not measure the page, it drives the same pointer events a
 * teacher's Shift+drag produces and reads the DOM the tool leaves behind.
 *
 *   node qa/rows3.mjs            (QA_ON=1 for the run: the kill switch in qa/off.mjs)
 *   $env:CHROME="C:\\path\\to\\chrome.exe"   override the browser
 */
import { qaOff } from './off.mjs';
qaOff('rows3');

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FIXTURE = 'qa/fixtures/rows3.html';

function launch(profile) {
  const args = ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--window-size=1400,1000', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-sync', '--disable-extensions',
    '--allow-file-access-from-files', '--mute-audio', 'about:blank'];
  const proc = spawn(CHROME, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    let buf = '';
    proc.stderr.on('data', d => {
      buf += d.toString();
      const m = buf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (m) resolve({ proc, ws: m[1] });
    });
    proc.on('error', reject);
    setTimeout(() => reject(new Error('chrome did not start:\n' + buf)), 20000);
  });
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const c = { ws, id: 0, waiters: new Map(),
      send(method, params = {}, sessionId) {
        const id = ++c.id;
        return new Promise((res, rej) => {
          c.waiters.set(id, { res, rej, method });
          ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
          setTimeout(() => { if (c.waiters.has(id)) { c.waiters.delete(id); rej(new Error('CDP timeout: ' + method)); } }, 30000);
        });
      } };
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      const w = m.id && c.waiters.get(m.id);
      if (!w) return;
      c.waiters.delete(m.id);
      m.error ? w.rej(new Error(w.method + ': ' + JSON.stringify(m.error))) : w.res(m.result);
    });
    ws.addEventListener('error', e => reject(new Error('ws: ' + (e.message || ''))));
    ws.addEventListener('open', () => resolve(c));
  });
}

/* ---- the page side: the four gestures, their assertions, and undo after each ---------------- */
const PROBE = `(function () {
  var CA = document.querySelector('.content-area');
  if (!window.LayoutEditor) return JSON.stringify({ fatal: 'layout.js did not load' });
  var E = window.LayoutEditor;
  E.enable();
  window.__LAYOUT_DEBUG = true;          /* record what pick() decided, for a failing assertion */
  var res = [];
  function ok(name, cond, detail) { res.push({ name: name, ok: !!cond, detail: detail || '' }); }
  function R(id) { var e = document.getElementById(id); return e ? e.getBoundingClientRect() : null; }
  function ev(t, x, y, buttons) {
    return new PointerEvent(t, { bubbles: true, cancelable: true, button: 0,
      buttons: buttons === undefined ? 1 : buttons, shiftKey: true, pointerId: 1,
      pointerType: 'mouse', isPrimary: true, clientX: x, clientY: y });
  }
  function drag(from, x0, y0, x1, y1) {
    from.dispatchEvent(ev('pointerdown', x0, y0, 1));
    window.dispatchEvent(ev('pointermove', (x0 + x1) / 2, (y0 + y1) / 2, 1));
    window.dispatchEvent(ev('pointermove', x1, y1, 1));
    window.dispatchEvent(ev('pointerup', x1, y1, 0));
  }
  function rowOf(el) { var p = el && el.parentElement; return p && p.classList && p.classList.contains('rows') ? p : null; }
  /* the row a node stands in: the node may be the cell itself, or the item inside a cell */
  function rowUnder(el) {
    var p = el && el.parentElement;
    if (p && p.classList && p.classList.contains('rows')) return p;
    var q = p && p.parentElement;
    return q && q.classList && q.classList.contains('rows') ? q : null;
  }
  function rowsIn(el) { var d = 0; for (var p = el; p; p = p.parentElement) if (p.classList && p.classList.contains('rows')) d++; return d; }
  /* THE PAGE, NOT ITS INDENTATION. A move takes the node out of the line it stood on and leaves the
     whitespace text around it where it was, so undo brings the same nodes back beside slightly more
     blank space. Every whitespace-only text node is dropped from BOTH sides before comparing (a clone
     is stripped, the live page is not), so what is compared is the structure and the attributes —
     which is what this harness claims, and the save's own formatting rules own the indentation. */
  function snap() {
    var c = CA.cloneNode(true);
    (function strip(n) {
      for (var k = n.firstChild; k; ) {
        var next = k.nextSibling;
        if (k.nodeType === 3) { if (!k.data.trim()) n.removeChild(k); }
        else if (k.nodeType === 1) strip(k);
        k = next;
      }
    })(c);
    return c.innerHTML;
  }
  function at(x, y) { var e = document.elementFromPoint(x, y); return e ? e.tagName + '#' + (e.id || '') + '.' + (e.className || '') : 'none'; }
  /* every scenario is scrolled into the viewport before it is read: elementFromPoint answers nothing
     for a point below the fold, and a drop that "did not land" for that reason would be a fake pass */
  function view(id) { var e = document.getElementById(id); if (e) e.scrollIntoView({ block: 'center' }); return e; }
  function diff(a, b) {
    var i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (i === a.length && i === b.length) return 'identical';
    return '@' + i + ' was «' + a.slice(i, i + 70) + '» now «' + b.slice(i, i + 70) + '»';
  }

  /* 1 — a CELL dropped on the band between two rows */
  var s1 = snap(), dc = view('dragcell'), r1 = R('r1'), dcr = R('dragcell');
  drag(dc, dcr.left + 10, dcr.bottom - 6, dcr.left + 10, r1.bottom - 14);
  var nr = rowUnder(document.getElementById('dragcell'));
  ok('a cell lands on the band between rows, in a row of its own',
     E.moves() === 1 && !!nr && nr.parentElement && nr.parentElement.id === 'host' && nr.id !== 'r1',
     'moves=' + E.moves() + ' parent=' + (nr && nr.parentElement && nr.parentElement.id) + ' row=' + (nr && (nr.id || nr.className)));
  ok('that row stands at the boundary it was dropped on',
     !!nr && nr.nextElementSibling && nr.nextElementSibling.id === 'r2',
     'next=' + (nr && nr.nextElementSibling && (nr.nextElementSibling.id || nr.nextElementSibling.className)));
  E.undo();
  ok('undo puts the page back', snap() === s1, snap() === s1 ? '' : diff(s1, snap()));

  /* 2 — a CELL merged into a cell: its children arrive as rows, not as bare items */
  var s2 = snap(), mm = view('mergeme'), tgt = document.getElementById('target');
  var mmr = R('mergeme'), blk = tgt.querySelector('.block').getBoundingClientRect();
  drag(mm, mmr.left + 10, mmr.bottom - 6, blk.left + blk.width / 2, blk.bottom - 8);
  var kids = [].slice.call(document.getElementById('target').children);
  var carried = kids.filter(function (k) { return k.classList.contains('rows'); })[0];
  ok('a merged cell leaves its content in a row, beside the block',
     kids.length === 2 && kids[0].classList.contains('block') && !!carried &&
     carried.children.length === 1 && carried.children[0].firstElementChild &&
     carried.children[0].firstElementChild.tagName === 'P',
     'children=' + kids.map(function (k) { return k.tagName + '.' + (k.className || '-'); }).join(' | '));
  E.undo();
  ok('undo puts the page back', snap() === s2, snap() === s2 ? '' : diff(s2, snap()));

  /* 3 — an ITEM dropped on a level-3 cell's side band */
  var s3 = snap(), bi = view('banditem'), a = R('l3a'), bir = R('banditem');
  drag(bi, bir.left + 10, bir.top + 8, a.right - 8, a.top + a.height / 2);
  var holder = document.getElementById('banditem'), cell = holder && holder.parentElement;
  ok('an item takes the side band as a cell beside the one it was dropped on',
     !!cell && cell.tagName === 'DIV' && cell.parentElement && cell.parentElement.id === 'l3',
     'parent=' + (cell && cell.parentElement && (cell.parentElement.id || cell.parentElement.className)));
  E.undo();
  ok('undo puts the page back', snap() === s3, snap() === s3 ? '' : diff(s3, snap()));

  /* 4 — an ITEM dropped in a level-3 cell's middle gets a level-3 row of its own */
  var s4 = snap(), mi = view('miditem'), m1 = R('m1'), mir = R('miditem');
  /* aim in the lower half of the level-3 cell: in the upper half the new row would land exactly
     where the item already stands, which pick() correctly reads as "no move" */
  drag(mi, mir.left + 10, mir.top + 8, m1.left + m1.width / 2, m1.top + m1.height * 0.8);
  var own = rowUnder(document.getElementById('miditem'));
  ok('an item dropped in a level-3 cell\\'s middle gets a level-3 row of its own',
     !!own && own.id !== 'l3m' && rowsIn(own) === 3 && own.parentElement.id === 'midcell',
     'row=' + (own && (own.id || own.className)) + ' rows in chain=' + (own ? rowsIn(own) : '?')
     + ' parent=' + (own && own.parentElement && (own.parentElement.id || own.parentElement.className || own.parentElement.tagName))
     + ' moves=' + E.moves() + ' pick=' + JSON.stringify(window.__lastPick)
     + ' start=' + at(mir.left + 10, mir.top + 8) + ' drop=' + at(m1.left + m1.width / 2, m1.top + m1.height * 0.8)
     + ' midcell=' + [].map.call(document.getElementById('midcell').children, function (k) { return k.tagName + '.' + (k.className || '-'); }).join('|'));
  E.undo();
  ok('undo puts the page back', snap() === s4, snap() === s4 ? '' : diff(s4, snap()));

  /* 5 — A ROW'S GRIP picks the row up. The R1 mark is a pseudo-element and cannot be pressed, so
     the grip is a real button laid over the row's left edge; pressing it must start the same drag a
     Shift press starts, and releasing over nothing must leave the page as it was. */
  var s5 = snap();
  var grips = [].slice.call(document.querySelectorAll('.layout-grip'));
  var rowsL12 = [].filter.call(CA.querySelectorAll('.rows'), function (r) { return rowsIn(r) <= 2 && r.parentElement; });
  ok('every row above level 3 has a grip, and no level-3 row has one',
     grips.length === rowsL12.length && grips.length > 0,
     'grips=' + grips.length + ' rows=' + rowsL12.length);
  var g0 = grips[0], r0 = g0 && g0.__row, gr0 = g0 && g0.getBoundingClientRect();
  ok('a grip sits at its row\\'s left edge', !!gr0 && Math.abs(gr0.left - (r0.getBoundingClientRect().left - 22)) <= 2,
     'grip=' + (gr0 && Math.round(gr0.left)) + ' row=' + (r0 && Math.round(r0.getBoundingClientRect().left)));
  if (g0) {
    g0.dispatchEvent(ev('pointerdown', gr0.left + 4, gr0.top + 4, 1));
    window.dispatchEvent(ev('pointermove', gr0.left + 40, gr0.top + 40, 1));
    ok('pressing a grip starts a drag of that row', r0.classList.contains('layout-dragging'),
       'class=' + r0.className);
    window.dispatchEvent(ev('pointerup', gr0.left + 40, gr0.top + 40, 0));
  }
  ok('a grip release over nothing leaves the page alone', snap() === s5, snap() === s5 ? '' : diff(s5, snap()));

  /* 5b — HELD ALMOST EXACTLY ON AN ITEM'S EDGE: the level-3 gesture. Two paragraphs stand in one
     level-2 cell; dragging one onto the other's edge puts them two cells deep in one row inside that
     cell, and the line turns red while the pointer is there. */
  var s5b = snap(), e1 = document.getElementById('e1'), e2 = document.getElementById('e2');
  var e1r = e1.getBoundingClientRect(), e2r = e2.getBoundingClientRect();
  e2.dispatchEvent(ev('pointerdown', e2r.left + 10, e2r.top + 6, 1));
  window.dispatchEvent(ev('pointermove', e2r.left + 30, e2r.top + 20, 1));
  window.dispatchEvent(ev('pointermove', e1r.left + 3, e1r.top + e1r.height / 2, 1));
  var l3line = (document.querySelector('.layout-line') || {}).className || '';
  var pick3 = JSON.stringify(window.__lastPick);
  ok('the line is red on an item\\'s edge', /lvl3/.test(l3line), 'line=' + l3line + ' pick=' + pick3);
  window.dispatchEvent(ev('pointerup', e1r.left + 3, e1r.top + e1r.height / 2, 0));
  var erow = e1.closest('.rows');
  ok('the arrival and the item are two cells of one level-3 row inside that cell',
     !!erow && rowsIn(erow) === 3 && erow.children.length === 2 &&
     e2.closest('.rows') === erow && e2.parentElement !== e1.parentElement,
     'rows=' + (erow && rowsIn(erow)) + ' cells=' + (erow && erow.children.length) + ' pick=' + pick3);
  E.undo();
  ok('undo puts the page back', snap() === s5b, snap() === s5b ? '' : diff(s5b, snap()));

  /* 5c — the wider part of the cell is the level-2 gesture, and the line is blue there */
  var s5c = snap(), ecell = document.getElementById('edgecell').getBoundingClientRect();
  e2.dispatchEvent(ev('pointerdown', e2r.left + 10, e2r.top + 6, 1));
  window.dispatchEvent(ev('pointermove', e2r.left + 30, e2r.top + 20, 1));
  window.dispatchEvent(ev('pointermove', ecell.left + 20, e1r.top + e1r.height / 2, 1));
  var l2line = (document.querySelector('.layout-line') || {}).className || '';
  var pick2 = JSON.stringify(window.__lastPick);
  ok('the line is blue on the wide side of a cell', /lvl2/.test(l2line), 'line=' + l2line + ' pick=' + pick2);
  window.dispatchEvent(ev('pointerup', ecell.left + 20, e1r.top + e1r.height / 2, 0));
  var row2 = document.getElementById('edgecell').parentElement;
  ok('the arrival is a cell of the level-2 row', e2.parentElement !== document.getElementById('edgecell') && !!e2.parentElement,
     'parent=' + (e2.parentElement && e2.parentElement.tagName));
  E.undo();
  ok('undo puts the page back', snap() === s5c, snap() === s5c ? '' : diff(s5c, snap()));

  /* 6 — SHIFT + RIGHT CLICK above, below or between what is already there makes a block. It arrives
     as a level-1 row with one empty cell in it, and the undo takes the row away again. */
  var s6 = snap();
  window.scrollTo(0, 0);                       /* the page scrolled during the earlier drags; a hit test
                                                  is viewport-relative, so the view is put back first */
  var anchor = document.getElementById('stays').getBoundingClientRect();
  var blocksBefore = CA.querySelectorAll('.block').length;
  var car = CA.getBoundingClientRect();
  var mv0 = E.moves();
  var hit = document.elementFromPoint(anchor.left + 6, anchor.bottom - 2);
  if (hit) hit.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, shiftKey: true,
    clientX: anchor.left + 6, clientY: anchor.bottom - 2 }));
  var blocksAfter = CA.querySelectorAll('.block').length;
  var nb = [].filter.call(CA.querySelectorAll('.block'), function (b) {
    var h = b.querySelector('h3'); return !!h && !h.textContent;
  })[0];
  ok('Shift + right click makes a block', blocksAfter === blocksBefore + 1,
     'before=' + blocksBefore + ' after=' + blocksAfter + ' hit=' + (hit && (hit.tagName + '.' + hit.className))
     + ' mov=' + E.moves() + '/' + mv0 + ' body=' + document.body.className
     + ' scroll=' + window.scrollY + ' vis=' + getComputedStyle(CA).visibility
     + ' anchor=' + Math.round(anchor.left) + ',' + Math.round(anchor.top) + ',' + Math.round(anchor.width) + 'x' + Math.round(anchor.height));
  ok('the new block is a level-1 row holding one empty cell',
     !!nb && rowsIn(nb.closest('.rows')) === 1 && nb.closest('.rows').parentElement === CA &&
     nb.parentElement === nb.closest('.rows').firstElementChild,
     'rows in chain=' + (nb && rowsIn(nb.closest('.rows'))));
  E.undo();
  ok('undo takes the new block away', snap() === s6, snap() === s6 ? '' : diff(s6, snap()));

  E.disable();
  return JSON.stringify({ res: res });
})()`;


/* ---- drive it ---------------------------------------------------------------------------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ingles-rows3-'));
let chrome, cdp;
try {
  chrome = await launch(profile);
  cdp = await connect(chrome.ws);
  const { targetInfos } = await cdp.send('Target.getTargets');
  const page = targetInfos.find(t => t.type === 'page');
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
  const ses = (m, p) => cdp.send(m, p, sessionId);
  await ses('Page.enable');
  await ses('Runtime.enable');
  await ses('Page.navigate', { url: pathToFileURL(path.join(ROOT, FIXTURE)).href });

  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) {
    await sleep(200);
    const r = await ses('Runtime.evaluate', {
      expression: '!!(window.LayoutEditor && document.getElementById("dragcell"))', returnByValue: true });
    ready = r.result.value === true;
  }
  if (!ready) { console.log('✗ the fixture never loaded: ' + FIXTURE); process.exitCode = 1; }
  else {
    const r = await ses('Runtime.evaluate', { expression: PROBE, returnByValue: true });
    const out = JSON.parse(r.result.value);
    if (out.fatal) { console.log('✗ ' + out.fatal); process.exitCode = 1; }
    else {
      console.log('rows3 — the drop shapes and the row grip, through the pointer path layout.js binds');
      for (const t of out.res) console.log(`  ${t.ok ? 'ok  ' : 'FAIL'} ${t.name}${t.ok || !t.detail ? '' : ' — ' + t.detail}`);
      const bad = out.res.filter(t => !t.ok).length;
      console.log(bad ? `\n${bad} of ${out.res.length} failed` : `\n✅ ${out.res.length}/${out.res.length} pass`);
      process.exitCode = bad ? 1 : 0;
    }
  }
} catch (e) {
  console.log('✗ ' + e.message);
  console.log('  set $env:CHROME="C:\\path\\to\\chrome.exe" and try again');
  process.exitCode = 1;
} finally {
  try { cdp && cdp.ws.close(); } catch (e) { }
  try { chrome && chrome.proc.kill(); } catch (e) { }
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
}

