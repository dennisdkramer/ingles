/**
 * qa/landing.mjs — student landing index (index.html) structure harness, in jsdom.
 * Run with: node qa/landing.mjs
 *
 * The landing page is behind Google sign-in, so the lesson harnesses cannot reach it. This one loads the
 * real page, stubs the network/Google, renders renderStudent() for a student holding ONE track, and asserts
 * the owner's layout rules (2026-11-03):
 *   - one track column per track in tracks.json, whatever number that is — the page names no track;
 *   - the lesson TITLE is the link to the page (no per-lesson button);
 *   - "Continuar da lição N" sits at the TOP of a granted track's list;
 *   - a track the student was not granted is greyed and inert ("sem acesso", no links);
 *   - go() refuses a track the student does not hold;
 *   - the teacher list: per student an identity line with a right-justified "remove student", then one
 *     switch per track whose ON state is the grant (owner instruction 2026-11-09).
 * The last case is the one that matters for the future: a track that exists in NO file today must still get
 * a column, its track.json label and a grantable option.
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

const cards = [...d.querySelectorAll('.tracks .track-card')];
ok('one column per track', cards.length === w.eval('TRACKSALL.length'),
  cards.length + ' cards for ' + w.eval('TRACKSALL.join("+")'));
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

/* THE CONTINUE BUTTON READS THE SERVER, not a localStorage key no page writes (owner report 2026-11-09:
   it always said "lição 1"). status.progress / status.done arrive WITH the track access list. */
w.eval('LESSONS={business:[{n:1,title:"A"},{n:2,title:"B"},{n:3,title:"C"}],kids:[],adult:[],advanced:[]};'
  + 'PROG={business:2};DONE={business:[1,2]};'
  + 'profile={email:"a@b.c",name:"Ana"};renderStudent(["business"],"Ana");');
const contBtn = d.querySelector('.contbtn');
ok('continue resumes from the backend progress',
  !!contBtn && /lição 3/.test(contBtn.textContent), contBtn ? contBtn.textContent : 'none');
ok('the button jumps to that lesson',
  !!contBtn && /go\('business',3\)/.test(contBtn.getAttribute('onclick') || ''),
  contBtn ? contBtn.getAttribute('onclick') : 'none');
ok('finished rows are teal from the backend list',
  d.querySelectorAll('.tracks .row.done').length === 2, d.querySelectorAll('.tracks .row.done').length + '');
/* a finished book shows no button — one pointing past the last lesson is worse than none */
w.eval('PROG={business:3};DONE={business:[1,2,3]};renderStudent(["business"],"Ana");');
ok('no continue button when the book is finished', !d.querySelector('.contbtn'));

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

/* the teacher list (owner instruction 2026-11-09): TWO lines per student — the identity with a right-justified
   "remove student" link, then one switch per track, whose ON state IS the grant. */
w.eval('teacher=true;'
  + 'QUEUE={pending:[],approved:[{email:"s@x.y",name:"Sol",tracks:[{track:"kids",lastCompleted:0},{track:"business",lastCompleted:1}]}]};'
  + 'document.getElementById("app").innerHTML=approvedHTML();');
const approved = d.getElementById('app');
const row = approved.querySelector('.tadmin-item');
const idLine = row && row.querySelector('.trow.tid');
const sw = row ? [...row.querySelectorAll('.tswitch')] : [];
const swOf = re => sw.find(x => re.test(x.getAttribute('title') || ''));
ok('teacher: one switch per track', sw.length === w.eval('TRACKSALL.length'), sw.length + ' switches');
ok('teacher: the switches are the SECOND line', !!row && row.children[1].classList.contains('tswitches'));
ok('teacher: a held track reads ON', !!swOf(/Kids/) && swOf(/Kids/).classList.contains('on'));
ok('teacher: an unheld track reads OFF', !!swOf(/Adulto/) && !swOf(/Adulto/).classList.contains('on'));
ok('teacher: each switch carries its track.json colour',
  sw.every(x => /--sw:#[0-9a-f]{6}/i.test(x.getAttribute('style') || '')),
  sw.map(x => (x.getAttribute('style') || '').replace('--sw:', '')).join(' '));
ok('teacher: the thumb carries the track icon',
  !!swOf(/Kids/) && /🛹/.test(swOf(/Kids/).querySelector('.tsw-thumb').textContent));
ok('teacher: the checkbox is the state',
  !!swOf(/Kids/) && swOf(/Kids/).querySelector('input').checked === true &&
  !!swOf(/Adulto/) && swOf(/Adulto/).querySelector('input').checked === false);
ok('teacher: no per-book jump or per-book removal remains',
  approved.querySelectorAll('.jumpbtn').length === 0 && !/× Kids/.test(approved.innerHTML));
/* line 1: the link sits OUTSIDE the box that truncates, so no name or email length can ever reach it */
const who = idLine && idLine.querySelector('.twho');
const remBtn = idLine && idLine.querySelector('.remstudent');
ok('teacher: "remove student" on the identity line', !!remBtn && /remove student/i.test(remBtn.textContent));
ok('teacher: name + email live in the shrink box, the link outside it',
  !!who && !!who.querySelector('.tname') && !!who.querySelector('.temail') && !who.contains(remBtn),
  who ? [...who.children].map(e => e.className).join(' | ') : 'no .twho');
/* flipping switches writes ONE batched call per student, and a burst collapses into one request
   (owner report 2026-11-09: several quick changes returned errors) */
const sent = [];
let inFlight = 0, maxInFlight = 0;
w.fetch = async (u, o) => {
  const body = JSON.parse(o.body);
  sent.push(body);
  inFlight++; maxInFlight = Math.max(maxInFlight, inFlight);
  await new Promise(r => setTimeout(r, 25));
  inFlight--;
  return { ok: true, json: async () => ({ result: 'ok', tracks: body.tracks }) };
};
const adultInput = swOf(/Adulto/).querySelector('input');
adultInput.checked = true; w.toggleTrack(adultInput, 's@x.y', 'adult');
ok('a flip disables its row while the batch is out', adultInput.disabled === true);
const kidsInput = swOf(/Kids/).querySelector('input');
kidsInput.checked = false; w.toggleTrack(kidsInput, 's@x.y', 'kids');   /* same burst, second flip */
await new Promise(r => setTimeout(r, 400));
ok('a burst of flips becomes ONE request', sent.length === 1, sent.length + ' request(s)');
ok('the request carries the whole desired set, not one delta',
  !!sent[0] && sent[0].action === 'accessSet' && sent[0].tracks.indexOf('adult') >= 0 &&
  sent[0].tracks.indexOf('kids') < 0, JSON.stringify(sent[0] || {}));
ok('both switches show what was flipped',
  swOf(/Adulto/).classList.contains('on') && !swOf(/Kids/).classList.contains('on'));
ok('the row is re-enabled once saved', adultInput.disabled === false && kidsInput.disabled === false);
/* two students flipped at once are still written one at a time — the backend holds one script lock */
sent.length = 0; maxInFlight = 0;
w.eval('DES.clear();ACQ.clear();'
  + 'QUEUE={pending:[],approved:[{email:"a@x.y",name:"A",tracks:[]},{email:"b@x.y",name:"B",tracks:[]}]};'
  + 'document.getElementById("app").innerHTML=approvedHTML();');
const sA = d.querySelector('.tswitch[data-k="a@x.y|kids"] input');
const sB = d.querySelector('.tswitch[data-k="b@x.y|kids"] input');
sA.checked = true; w.toggleTrack(sA, 'a@x.y', 'kids');
sB.checked = true; w.toggleTrack(sB, 'b@x.y', 'kids');
await new Promise(r => setTimeout(r, 400));
ok('two students are written one at a time',
  sent.length === 2 && maxInFlight === 1, sent.length + ' call(s), max ' + maxInFlight + ' in flight');
/* a frontend published ahead of the backend deployment degrades to one call per change, never to nothing */
sent.length = 0;
w.fetch = async (u, o) => {
  const body = JSON.parse(o.body); sent.push(body);
  return { ok: true, json: async () => (body.action === 'accessSet' ? { error: 'unknown action' } : { result: 'ok' }) };
};
w.eval('ACSINGLE=false;DES.clear();ACQ.clear();'
  + 'QUEUE={pending:[],approved:[{email:"c@x.y",name:"C",tracks:[{track:"kids"}]}]};'
  + 'document.getElementById("app").innerHTML=approvedHTML();');
const cSw = d.querySelector('.tswitch[data-k="c@x.y|adult"] input');
cSw.checked = true; w.toggleTrack(cSw, 'c@x.y', 'adult');
await new Promise(r => setTimeout(r, 300));
ok('an older deployment falls back to per-track calls',
  sent.length === 2 && sent[0].action === 'accessSet' && sent[1].action === 'approve' && sent[1].track === 'adult',
  sent.map(x => x.action + (x.track ? ':' + x.track : '')).join(','));
/* and a signed-in return paints from the cache before it makes any request at all */
w.fetch = async (u) => ({ ok: true, json: async () => (/access\.json/.test(String(u)) ? { teachers: ['t@x.y'] } : { pending: [], approved: [] }) });
w.eval('profile={email:"t@x.y",name:"Tee"};'
  + 'localStorage.setItem("eod_role_t@x.y",JSON.stringify("teacher"));'
  + 'localStorage.setItem("eod_queue_t@x.y",JSON.stringify({pending:[],approved:[{email:"s@x.y",name:"Sol",tracks:[{track:"kids"}]}]}));'
  + 'document.getElementById("app").innerHTML="";');
const booting = w.start();
ok('a signed-in refresh paints from cache before the network',
  /Alunos aprovados/.test(d.getElementById('app').innerHTML) && /Sol/.test(d.getElementById('app').innerHTML),
  d.getElementById('app').innerHTML.slice(0, 40));
await booting;
/* and the same for a student: the cached paint carries the lesson titles and the server's continue number */
w.fetch = async (u) => ({ ok: true, json: async () => (/access\.json/.test(String(u))
  ? { teachers: [] }
  : { status: 'approved', tracks: ['business'], progress: { business: 2 }, done: { business: [1, 2] }, name: 'Ana' }) });
w.eval('profile={email:"st@x.y",name:"Ana"};PROG=null;DONE=null;LESSONS=null;'
  + 'localStorage.setItem("eod_role_st@x.y",JSON.stringify("student"));'
  + 'localStorage.setItem("eod_lessons_st@x.y",JSON.stringify({business:[{n:1,title:"First Talk"},{n:2,title:"Second"},{n:3,title:"Third"}],kids:[],adult:[]}));'
  + 'localStorage.setItem("eod_status_st@x.y",JSON.stringify({status:"approved",tracks:["business"],progress:{business:2},done:{business:[1,2]},name:"Ana"}));'
  + 'document.getElementById("app").innerHTML="";');
const boot2 = w.start();
const cachedBtn = d.getElementById('app').querySelector('.contbtn');
ok('cached student paint: titles come from the cached lessons', /First Talk/.test(d.getElementById('app').innerHTML));
ok('cached student paint: continue from the cached progress',
  !!cachedBtn && /lição 3/.test(cachedBtn.textContent), cachedBtn ? cachedBtn.textContent : 'none');
await boot2;

/* THE FUTURE TRACK CASE: "advanced" exists in no folder and no constant — it arrives only as tracks.json
   would deliver it, which is exactly how a track created next year will arrive. */
w.eval('LESSONS={business:[{n:1,title:"First Talk & the Sentence Skeleton"}],kids:[],adult:[],'
  + 'advanced:[{n:1,title:"Advanced opener"},{n:2,title:"Advanced two"}]};'
  + 'applyTracks([{name:"kids",label:"Kids 🛹",order:1},{name:"business",label:"Business 💼",order:2},'
  + '{name:"adult",label:"Adulto 🔞",order:3},{name:"advanced",label:"Advanced 🚀",order:4}]);'
  + 'renderStudent(["business","advanced"],"Ana");');
const cards4 = [...d.querySelectorAll('.tracks .track-card')];
ok('a fourth track gets its own column', cards4.length === 4, cards4.length + ' cards');
const adv = cards4.find(c => /Advanced/.test((c.querySelector('h3') || {}).textContent || ''));
ok('the new column uses its track.json label', !!adv && /Advanced 🚀/.test(adv.querySelector('h3').textContent));
ok('a granted new track is live, not locked', !!adv && !adv.classList.contains('locked'));
ok('its lessons are listed from lessons.json', !!adv && adv.querySelectorAll('a.lesson-link').length === 2);
w.eval('teacher=true;QUEUE={pending:[],approved:[{email:"s@x.y",name:"Sol",'
  + 'tracks:[{track:"business",lastCompleted:1}]}]};document.getElementById("app").innerHTML=approvedHTML();');
const advSw = [...d.querySelectorAll('#app .tswitch')].find(x => /Advanced/.test(x.getAttribute('title') || ''));
ok('teacher: the new track gets a switch even though nobody holds it', !!advSw && !advSw.classList.contains('on'));
ok('teacher: the new track switch has a colour to turn ON in',
  !!advSw && /--sw:#[0-9a-f]{6}/i.test(advSw.getAttribute('style') || ''),
  advSw ? advSw.getAttribute('style') : 'none');

/* the owner's speed/security report (2026-11-09): the "Carregando" line is a centred spiral; an expired
   credential is refused BEFORE anything protected is painted; a rejected session lands on the login card in
   place, where a reload is what made it feel like being thrown out. */
const spin = w.eval('spinnerHTML()');
ok('the loading state is a centred spiral, not a "Carregando" line',
  /class="loadwrap"/.test(spin) && /class="spinner"/.test(spin) && !/Carregando…/.test(d.body.innerHTML),
  spin.slice(0, 46));
const css = fs.readFileSync('style.css', 'utf8');
ok('the spiral is centred and animated',
  /\.loadwrap\{[^}]*justify-content:center/.test(css) && /\.spinner\{[^}]*animation:spin/.test(css));
w.localStorage.setItem('eod_session',
  JSON.stringify({ cred: 'x', profile: { email: 'e@x.y', exp: Math.floor(Date.now() / 1000) - 60 } }));
ok('an expired credential is refused before any paint',
  w.eval('restoreSession()') === false && !w.localStorage.getItem('eod_session'));
w.eval('profile={email:"e@x.y"};cred="x";teacher=true;document.getElementById("app").innerHTML="protected";bounce();');
ok('a rejected session shows the login card without a reload',
  d.getElementById('acct').hidden === true && d.getElementById('gcard').hidden === false &&
  d.getElementById('app').innerHTML === '');

console.log('\nstudent landing index — jsdom render');
out.forEach(r => console.log('  ' + (r.pass ? '✅ ' : '❌ ') + r.name + (r.extra ? '  «' + r.extra + '»' : '')));
const fails = out.filter(r => !r.pass).length;
console.log(fails ? '\n❌ ' + fails + ' landing check(s) FAILED' : '\n✅ all landing checks passed');
process.exit(fails ? 1 : 0);
