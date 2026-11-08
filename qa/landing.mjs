/**
 * qa/landing.mjs — student landing index (index.html) structure harness, in jsdom.
 * Run with: node qa/landing.mjs
 *
 * The landing page is behind Google sign-in, so the lesson harnesses cannot reach it. This one loads the
 * real page, stubs the network/Google, renders renderStudent() for a student holding ONE track, and asserts
 * the owner's layout rules (2026-11-03):
 *   - three track columns, one per book;
 *   - the lesson TITLE is the link to the page (no per-lesson button);
 *   - "Continuar da lição N" sits at the TOP of a granted track's list;
 *   - a track the student was not granted is greyed and inert ("sem acesso", no links);
 *   - go() refuses a track the student does not hold;
 *   - the teacher list shows one jump + one per-track removal per held track, plus an add-book control.
 */
import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const vc = new VirtualConsole();            /* swallow jsdom's "navigation not implemented" noise */
const dom = new JSDOM(html, {
  runScripts: 'dangerously', url: 'http://localhost/', virtualConsole: vc,
  beforeParse(w) {
    w.fetch = async () => ({ ok: true, json: async () => ({}), text: async () => '{}' });
    w.confirm = () => true;
    w.matchMedia = () => ({ matches: false, addListener() { }, removeListener() { } });
  }
});
const w = dom.window, d = w.document;
await new Promise(r => setTimeout(r, 80));

const out = [];
const ok = (name, cond, extra = '') => out.push({ name, pass: !!cond, extra });

/* render as a student granted ONLY business */
w.eval('LESSONS={business:[{n:1,title:"First Talk & the Sentence Skeleton"}],kids:[],adult:[]};'
  + 'profile={email:"a@b.c",name:"Ana"};renderStudent(["business"],"Ana");');

const cards = [...d.querySelectorAll('.tracks3 .track-card')];
ok('three track columns', cards.length === 3, cards.length + ' cards');
const byTrack = t => cards.find(c => (c.querySelector('h3') || {}).textContent.includes(t));
const biz = byTrack('Business'), kids = byTrack('Kids'), adult = byTrack('Adulto');
ok('business card is active', biz && !biz.classList.contains('locked'));
ok('kids card is locked', kids && kids.classList.contains('locked'));
ok('adult card is locked', adult && adult.classList.contains('locked'));
ok('locked cards have no links', kids.querySelectorAll('a').length === 0 && adult.querySelectorAll('a').length === 0);
ok('locked cards say "sem acesso"', /sem acesso/i.test(kids.textContent));

const link = biz.querySelector('a.lesson-link');
ok('lesson title is the link', !!link && /First Talk/.test(link.textContent), link ? link.getAttribute('href') : 'none');
ok('row reads "NN. Lesson Name"', !!link && /^01\. /.test(link.textContent.trim()), link ? link.textContent.trim().slice(0, 24) : 'none');
ok('full text kept as a tooltip', !!link && (link.getAttribute('title') || '').indexOf('First Talk') >= 0);
ok('link href points at the page', !!link && link.getAttribute('href') === 'business/lesson1.html');
ok('no per-lesson button remains', biz.querySelectorAll('button:not(.contbtn)').length === 0);
const kidsOfCard = [...biz.children];
const contIdx = kidsOfCard.findIndex(el => el.classList.contains('contbtn'));
const rowIdx = kidsOfCard.findIndex(el => el.classList.contains('row'));
ok('continue button sits ABOVE the list', contIdx > 0 && rowIdx > contIdx, 'contbtn@' + contIdx + ' row@' + rowIdx);

const hello = d.querySelector('.landing-hello');
ok('intro card replaces the account card', !!hello && /English/.test(hello.querySelector('.hello-en').textContent));
ok('intro has the PT line below', !!hello.querySelector('.hello-pt') && /Você já sabe/.test(hello.querySelector('.hello-pt').textContent));
ok('no "trocar conta" button', !/trocar conta/.test(d.getElementById('app').innerHTML));

/* the gate: go() refuses a track the student does not hold (the page logs the refusal to #debug) */
d.getElementById('debug').innerHTML = '';
w.eval('go("kids",1)');
ok('go() refuses a locked track', /sem acesso/.test(d.getElementById('debug').textContent));
d.getElementById('debug').innerHTML = '';
w.eval('go("business",1)');
ok('go() allows a granted track (no refusal)', !/sem acesso/.test(d.getElementById('debug').textContent));

/* the teacher list: a student with TWO tracks gets two jumps, two removals and an add control */
w.eval('teacher=true;'
  + 'QUEUE={pending:[],approved:[{email:"s@x.y",name:"Sol",tracks:[{track:"kids",lastCompleted:0},{track:"business",lastCompleted:1}]}]};'
  + 'document.getElementById("app").innerHTML=approvedHTML();');
const approved = d.getElementById('app');
ok('teacher: one jump button per held track', approved.querySelectorAll('button.jumpbtn').length === 2, approved.querySelectorAll('button.jumpbtn').length + '');
ok('teacher: one per-track remove', /× Kids/.test(approved.innerHTML) && /× Business/.test(approved.innerHTML));
ok('teacher: can grant the remaining track', !!approved.querySelector('select') && /dar acesso/.test(approved.innerHTML));

console.log('\nstudent landing index — jsdom render');
out.forEach(r => console.log('  ' + (r.pass ? '✅ ' : '❌ ') + r.name + (r.extra ? '  «' + r.extra + '»' : '')));
const fails = out.filter(r => !r.pass).length;
console.log(fails ? '\n❌ ' + fails + ' landing check(s) FAILED' : '\n✅ all landing checks passed');
process.exit(fails ? 1 : 0);
