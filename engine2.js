/* MOTOR 2 — control bar, camadas, áudio com cache, realces persistentes */
const LAYER_VER="v4-server-truth-20261006"; /* Bump to mark a fresh data era */
let wipeGuard=0; /* a Clear-page wipe in flight: the poll must not resurrect the rows it is deleting */
let lastPollChange=Date.now(); /* last time the poll saw a change — keeps the poll fast while the student watches */
let lastFull=""; /* the layer content signature used to detect that change */
let completeNow=false; /* optimistic state of the "Complete?" tag button */

function wireListen(){document.querySelectorAll(".listen").forEach(b=>{b.onclick=()=>{if(editing)return;const u=new SpeechSynthesisUtterance(b.dataset.say);u.lang="en-US";u.rate=.9;speechSynthesis.cancel();speechSynthesis.speak(u)}})}
wireListen();
document.querySelectorAll("[contenteditable]").forEach(function(n){n.removeAttribute("contenteditable");});
/* ---- content edit mode (teacher): a separate editable copy; live page + marks stay untouched ---- */
const contentId=()=>"content_"+TRACK+"_"+L;
let savedLive="",nbkVal="";
function fullPageHTML(){const cl=document.documentElement.cloneNode(true);const cb=cl.querySelector("#controlbar");if(cb)cb.innerHTML="";const to=cl.querySelector("#toast");if(to){to.textContent="";to.removeAttribute("style");}const fd=cl.querySelector("#feed");if(fd)fd.innerHTML="";cl.querySelectorAll("#hlLayer,#noteLayer,#printRoot,#errb,.pop,#completebtn").forEach(n=>n.remove());cl.querySelectorAll("mark.nb").forEach(m=>{m.replaceWith(document.createTextNode(m.textContent))});cl.querySelectorAll("[contenteditable]").forEach(n=>n.removeAttribute("contenteditable"));const b=cl.querySelector("body");if(b){b.removeAttribute("class");b.removeAttribute("style");}cl.querySelectorAll("[data-glasp-print],.glasp-extension,.glasp-extension-toaster").forEach(n=>n.remove());cl.querySelectorAll("span[style],b[style],i[style],u[style]").forEach(s=>{const st=s.getAttribute("style")||"";if(/rgb\(|font-family|letter-spacing|px|font-style|background/.test(st))s.removeAttribute("style")});return "<!doctype html>"+cl.outerHTML;}
function contentAreaHTML(saved){const d=new DOMParser().parseFromString(saved,"text/html");const ca=d.querySelector(".content-area");return ca?ca.innerHTML:saved;}
function saveContent(){if(!document.querySelector(".content-area"))return;const o={action:"set",id:contentId(),type:"content",anchor:"",data:fullPageHTML(),email:gate.email,lesson:L,author:"prof",track:TRACK};notePending(o);outboxPush(o);scheduleFlush();}
function toggleEditMode(){
 if(STUDENT!==gate.email){toast("Switch to your own account to edit content.");return;}
 editing=!editing;
 document.body.classList.toggle("editing",editing);
 const ca=document.querySelector(".content-area"),eb=document.getElementById("editpage");
 if(editing){
  savedLive=ca.innerHTML;
  nbkVal=(document.getElementById("feed")||{}).value||"";
  const cov=layer.find(r=>r.type==="content"&&r.data);
  if(cov)ca.innerHTML=contentAreaHTML(cov.data);
  else document.querySelectorAll("mark.nb").forEach(m=>{m.replaceWith(document.createTextNode(m.textContent))});
  wireListen();
  if(ca)ca.setAttribute("contenteditable","true");
  hlReflow();ntReflow();
  if(eb)eb.textContent="✔️ Done";
  toast("Edit mode — click ✔️ Done to save");
 }else{
  if(ca)ca.removeAttribute("contenteditable");
  if(eb)eb.textContent="✏️ Edit";
  saveContent();
  ca.innerHTML=savedLive;
  renderCompleteBtn();
  const fdn=document.getElementById("feed");if(fdn)fdn.value=nbkVal;
  toast("Saved");
 }
}
/* shared notebook: a plain textarea, one per student+lesson, auto-saved (debounced) */
const nbId=()=>"notebook_"+STUDENT+"_"+L;
let nbTimer=null;
function nbSave(){const fd=document.getElementById("feed");if(!fd)return;send({action:"set",id:nbId(),type:"notebook",anchor:"",data:fd.value,track:TRACK});}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="feed"){clearTimeout(nbTimer);nbTimer=setTimeout(nbSave,800);}});
/* ---- exercise answers (input.gap / radio / translation textareas) — type "answer" ------------
   Keyed like notes/highlights: anchor = the text the field answers (a gap's prompt, a question's
   stem, a translation box's prompt), with {b,o} (the highlight ruler) as the tie-breaker for
   duplicate text. Server stays the source of truth; writes go through send() (outbox + grace
   window); an empty answer DELETES its row (no empty-row bloat); restore skips a control the
   student is currently typing in plus any row whose local write is still in flight. */
const ansNorm=s=>lineNorm(String(s==null?"":s)).replace(/\s+/g," ").trim();
function ansQstem(radio){let el=radio&&radio.closest?radio.closest("label"):null;if(!el)return null;
 const opts=el.closest(".qopts");if(opts){const line=opts.previousElementSibling;const st=line?line.querySelector(".qstem"):null;if(st)return st;}
 let p=el.previousElementSibling;while(p){if(p.classList.contains("qstem"))return p;if(p.classList.contains("qnum"))return null;p=p.previousElementSibling;}
 return null}
function ansOf(el){
 if(el.matches&&el.matches("input.gap")){const w=el.parentElement;if(!w)return null;return{anchor:ansNorm(w.textContent),posEl:w}}
 if(el.matches&&el.matches('input[type="radio"]')){const st=ansQstem(el);if(!st)return null;return{anchor:ansNorm(st.textContent),posEl:st}}
 if(el.tagName==="TEXTAREA"&&el.id!=="feed"){const w=el.parentElement;if(!w)return null;return{anchor:ansNorm(w.textContent),posEl:w}}
 return null}
function ansPos(posEl){const blk=hlBlockOf(posEl);if(!blk)return null;
 const b=hlBlocks().indexOf(blk);if(b<0)return null;
 const w=document.createTreeWalker(posEl,NodeFilter.SHOW_TEXT);const n=w.nextNode();
 const o=n?hlOffset(blk,n,0):-1;return o<0?null:{b,o}}
let ansLocal=[];
function ansRows(){
 const rows=layer.filter(r=>r.type==="answer");
 ansLocal=ansLocal.filter(r=>{const p=pendingFor(r.id);return !!p&&p.action!=="del"});
 ansLocal.forEach(r=>{const i=rows.findIndex(x=>x.id===r.id);if(i>=0)rows[i]=r;else rows.push(r)});
 return rows;
}
function ansValueOf(r){if(!r)return"";let j=null;try{j=JSON.parse(String(r.data||"{}"))}catch(e){return String(r.data||"")}
 return(j&&typeof j.v==="string")?j.v:""}
function ansRowFor(t,pos){const rows=ansRows().filter(r=>r.anchor===t);
 if(!rows.length)return null;
 if(!pos)return rows[0];
 return rows.find(r=>{const p=nbDataPos(r.data);return p&&p.b===pos.b&&p.o===pos.o})||null}
function ansSet(t,v,pos){
 const cur=ansRowFor(t,pos);
 if(v===""){
  if(cur){layer=layer.filter(x=>x.id!==cur.id);ansLocal=ansLocal.filter(r=>r.id!==cur.id);send({action:"del",id:cur.id});}
  return;
 }
 if(cur&&ansValueOf(cur)===v)return;
 const id=cur?cur.id:(Date.now()+"_"+Math.floor(Math.random()*9999));
 const data=JSON.stringify(pos?{v:v,b:pos.b,o:pos.o}:{v:v});
 const row={id:id,type:"answer",anchor:t,author:who(),ts:new Date().toISOString(),data:data};
 const i=layer.findIndex(x=>x.id===id);
 const merged=i>=0?(layer[i]=Object.assign({},layer[i],row)):(layer.push(row),row);
 ansLocal=ansLocal.filter(r=>r.id!==id);ansLocal.push(merged);
 send({action:cur?"set":"add",id:id,type:"answer",anchor:t,data:data});
}
function ansSaveEl(el){const o=ansOf(el);if(!o||!o.anchor)return;ansSet(o.anchor,el.value,ansPos(o.posEl));}
let ansTimer=null;
document.addEventListener("change",e=>{const t=e.target;
 if(t&&t.matches&&(t.matches("input.gap")||t.matches('input[type="radio"]')||(t.tagName==="TEXTAREA"&&t.id!=="feed")))ansSaveEl(t);
 else if(t&&t.id==="feed")nbSave();});
document.addEventListener("input",e=>{const t=e.target;
 if(t&&t.matches&&(t.matches("input.gap")||(t.tagName==="TEXTAREA"&&t.id!=="feed"))){clearTimeout(ansTimer);ansTimer=setTimeout(()=>ansSaveEl(t),800)}});
function ansSaveAll(){document.querySelectorAll("input.gap, textarea").forEach(el=>{if(el.tagName==="TEXTAREA"&&el.id==="feed")return;ansSaveEl(el)});}
function flushNow(){ansSaveAll();nbSave();scheduleFlush()}
window.addEventListener("pagehide",flushNow);
document.addEventListener("visibilitychange",()=>{if(document.hidden)flushNow()});
function renderAnswers(){
 const pending=new Set(ansRows().filter(r=>pendingFor(r.id)).map(r=>r.id));
 document.querySelectorAll("input.gap, textarea").forEach(el=>{
  if(el.tagName==="TEXTAREA"&&el.id==="feed")return;
  const o=ansOf(el);if(!o||!o.anchor)return;
  const row=ansRowFor(o.anchor,ansPos(o.posEl));
  if(row&&pending.has(row.id))return;
  if(document.activeElement===el)return;
  const want=row?ansValueOf(row):"";
  if(el.value!==want)el.value=want;
 });
 document.querySelectorAll('input[type="radio"]').forEach(el=>{
  const o=ansOf(el);if(!o||!o.anchor)return;
  const row=ansRowFor(o.anchor,ansPos(o.posEl));
  if(row&&pending.has(row.id))return;
  const want=row?ansValueOf(row):null;
  const should=(want!=null&&el.value===want);
  if(el.checked!==should)el.checked=should;
 });
}
/* "Complete?" tag button (2026-10-22): a per-student+track+lesson tag with no other effect.
   Rendered for BOTH students and teachers; for a teacher it tags the currently selected student. */
function completeId(){return "complete_"+STUDENT+"_"+TRACK+"_"+L;}
function ensureCompleteBtn(){
 let btn=document.getElementById("completebtn");
 if(!btn){
  btn=document.createElement("button");
  btn.type="button";btn.id="completebtn";btn.className="complete-btn";
  const fd=document.getElementById("feed");
  let anchor=fd;
  const prev=fd?fd.previousElementSibling:null;
  if(prev&&prev.tagName==="H2")anchor=prev;
  if(anchor)anchor.parentNode.insertBefore(btn,anchor);
  else{const ca=document.querySelector(".content-area");if(ca)ca.appendChild(btn);}
 }
 btn.onclick=()=>{
  const pid=completeId();
  if(completeNow){send({action:"del",id:pid});layer=layer.filter(r=>r.type!=="complete");}
  else{send({action:"add",id:pid,type:"complete",anchor:"",data:"1",track:TRACK});layer.push({id:pid,type:"complete",anchor:"",data:"1"});}
  completeNow=!completeNow;renderCompleteBtn();
 };
 return btn;
}
function renderCompleteBtn(){
 const pid=completeId();
 const row=layer.find(r=>r.type==="complete");
 if(!pendingFor(pid))completeNow=!!row;
 const btn=ensureCompleteBtn();
 btn.textContent=completeNow?"Completed":"Complete?";
 btn.classList.toggle("is-done",completeNow);
}
(async()=>{try{
 const bar=document.getElementById("controlbar")||topbar;
 let extra="";
 if(gate.teacher){extra=' <select id="sel"><option value="'+gate.email+'">'+(gate.teacherName||gate.email)+'</option></select>';}
 bar.innerHTML="🦺 "+gate.email+" · <b>"+TRACK+"</b> · <a href=\"../index.html\">Index</a>"+extra+' · <button type="button" id="clearpage">🧹 Clear page</button>' + ' <button type="button" id="prevlesson"'+(L>1?'':' disabled')+' title="Lição '+(L-1)+'">← Last lesson</button>' + ' <button type="button" id="nextlesson"'+(L<COUNT?'':' disabled')+' title="Lição '+(L+1)+'">Next lesson →</button>';
 const pv=document.getElementById("prevlesson");if(pv&&L>1)pv.onclick=()=>location.href="lesson"+(L-1)+".html";
 const nx=document.getElementById("nextlesson");if(nx&&L<COUNT)nx.onclick=()=>location.href="lesson"+(L+1)+".html";
 const cp=document.getElementById("clearpage");
 if(cp)cp.onclick=()=>{
  if(!confirm("Delete ALL highlights, notes and recordings on this page?"))return;
  send({action:"wipe"});                      /* network-last, like every other write */
  layer=[];hlList=[];ntList=[];sig="";wipeGuard=Date.now()+12000;
  document.querySelectorAll("mark.nb").forEach(m=>m.remove());
  hlReflow();ntReflow();
 };
 const ppb=document.createElement("button");ppb.type="button";ppb.id="printpage";ppb.textContent="🖨 Print";
 ppb.onclick=()=>{if(typeof printLesson==="function")printLesson();else toast("Print unavailable.")};
 bar.appendChild(ppb);
 if(gate.teacher){
  const eb=document.createElement("button");eb.type="button";eb.id="editpage";eb.textContent="✏️ Edit";eb.onclick=()=>toggleEditMode();bar.appendChild(eb);
  const rb=document.createElement("button");rb.type="button";rb.id="revertpage";rb.textContent="↩️ Revert";rb.onclick=()=>{if(!confirm("Discard your saved edits and restore the original content?"))return;send({action:"del",id:contentId()});toast("Reverting…");setTimeout(()=>location.reload(),900)};bar.appendChild(rb);
 }
 const selEl=document.getElementById("sel");
 if(gate.teacher&&selEl){selEl.onchange=()=>{
  STUDENT=selEl.value;sig="";
  const opt=selEl.selectedOptions&&selEl.selectedOptions[0];
  if(STUDENT===gate.email){delete gate.student;gate.name=gate.teacherName||"";}
  else{gate.student=STUDENT;gate.name=opt?(opt.textContent||""):"";}
  gate.sig=h(gate.email+gate.track+SECRET);
  try{sessionStorage.gate=JSON.stringify(gate);}catch(e){}
  if(gate.name)document.querySelectorAll(".stuname").forEach(el=>el.textContent=gate.name);
  loadLayer();
};}
 if(gate.teacher){
  (async()=>{
   let st=[];
   try{
    const j=await(await fetch(BACKPACK+"?action=students&track="+encodeURIComponent(TRACK)+"&t="+Date.now())).json();
    st=(j&&j.students)||[];
   }catch(e){st=[];}
   const el=document.getElementById("sel");
   if(el){el.innerHTML='<option value="'+gate.email+'">'+(gate.teacherName||gate.email)+'</option>'+st.map(s=>'<option value="'+s.email+'">'+(s.name||s.email)+"</option>").join("");el.value=STUDENT;}
  })();
 }
 loadLayer();renderCompleteBtn();
 /* ---- cross-session poll (owner spec 2026-10-12) — the ONLY re-check there is: add/set/del on
    either side (teacher or student) reach the other as fast as the adaptive poll allows. Each send()
    marks its own id+action "pending" for 12s (engine1.js notePending/pendingFor); renderLayer()
    below skips reverting/resurrecting anything that's still inside its own 12s pending window, so
    a snapshot that races ahead of the backend write can never revert-then-reapply a local action. This
    generic (by id+action, not by feature) pairing is the whole mechanism — any future action type
    that goes through send() is covered automatically, no per-action special-casing needed. */
  /* adaptive poll (owner 2026-10-14): 1s while visible and recently active (a user input or a poll change); 5s after 1 minute of neither; paused while hidden */
  let lastUserActivity=Date.now(),pollTimer=null;
  const pollDelay=()=>(Date.now()-Math.max(lastUserActivity,lastPollChange)>60000)?5000:1000;
 const schedulePoll=()=>{
  clearTimeout(pollTimer);pollTimer=null;
  if(document.hidden)return;
  pollTimer=setTimeout(async()=>{pollTimer=null;await loadLayer();schedulePoll();},pollDelay());
 };
  ["pointerdown","pointermove","keydown"].forEach(ev=>document.addEventListener(ev,()=>{lastUserActivity=Date.now()},{passive:true}));
  document.addEventListener("visibilitychange",()=>{if(document.hidden){clearTimeout(pollTimer);pollTimer=null;}else{lastUserActivity=Date.now();schedulePoll();}});
 schedulePoll();
}catch(e){let b=document.getElementById("errb");if(b)b.innerHTML+=" · control bar: "+e.message}})();

async function loadLayer(){
 let rows=[];
 try{const r=await fetch(BACKPACK+"?action=layer&email="+encodeURIComponent(STUDENT)+"&lesson="+L+"&ver="+LAYER_VER+"&t="+Date.now());rows=(await r.json()).rows||[];}catch(e){rows=[];}
 /* Server is the source of truth: rebuild layer from scratch every sync. */
 layer=rows;
  const s=layer.map(x=>x.id).join(",");
  /* a change (add/del/edit/recolour) keeps the adaptive poll fast while the student watches */
  const full=layer.map(r=>r.id+"|"+r.type+"|"+r.anchor+"|"+r.data+"|"+r.ts).join("\n");
  if(full!==lastFull){lastFull=full;lastPollChange=Date.now();}
  if(s===sig)return;sig=s;
 if(Date.now()<wipeGuard)return;   /* a Clear-page wipe is still in flight — never resurrect its rows */
 renderLayer();
}

function renderLayer(){
 /* Clear the note/recording flags of every mark.nb — except the ones with a local action still in
    flight (nbAnyPending, engine1.js). A mark created or deleted a moment ago must keep EXACTLY the
    state the click gave it: stripping the class here and re-adding it on the next poll is precisely
    the "appearing and disappearing" the owner reported. Same id+action grace window as everything
    else — the rule is general, not special-cased. */
 document.querySelectorAll("mark.nb").forEach(m=>{if(!nbAnyPending(m.dataset.a))m.classList.remove("has-rec")});
 /* highlight layer (#hlLayer): the records are the only truth here, so a highlight whose server
    row is gone disappears and the ones still stored are rebuilt from their row (anchor + offsets,
    or the anchor text alone for old rows). The text DOM is never touched: highlights are painted
    over the text, notes/recordings are elements inside it.
    GENERIC PENDING GATE (owner spec 2026-10-12): if THIS id still has a local action in flight
    (pendingFor, engine1.js) — add, set (recolour) OR del — this poll's row is stale by
    definition: the UI already applied that action directly (hlApply/hlSetColor/hlDrop), so the
    row is skipped entirely rather than re-applied, which is what caused the old revert-then-
    reapply flicker. Works for ANY action type that goes through send()+notePending, not just
    highlights — a future feature needs no special-casing here, just call notePending(o) in its
    send() path (already automatic, since send() itself calls it). */
 layer.forEach(it=>{
  if(it.type==="hl"&&it.anchor){
   if(!pendingFor(it.id))hlRestore(it);
  }
  if(it.type==="rec"&&it.anchor){
   if(!pendingFor(it.id)){
    const pos=nbDataPos(it.data);
    if(nbMarksAt(it.anchor,pos).filter(m=>m.classList.contains("has-rec")).length)nbFlagAt(it.anchor,pos,"has-rec");
    else ensureMark(it.anchor,"rec",pos);
   }
  }
  if(it.type==="note"&&it.anchor){
   if(!pendingFor(it.id))ntRestore(it);
  }
 });
 /* a highlight whose server row no longer exists leaves the layer (the server is the truth);
    one with a local action still pending (add/set/del) stays exactly as the UI left it until
    the pending window elapses or a later poll confirms the server agrees */
 const hlIds=new Set(layer.filter(it=>it.type==="hl"&&it.anchor).map(it=>it.id));
 hlList=hlList.filter(rec=>hlIds.has(rec.id)||pendingFor(rec.id));
 hlReflow();
 const ntIds=new Set(layer.filter(it=>it.type==="note"&&it.anchor).map(it=>it.id));
 ntList=ntList.filter(rec=>ntIds.has(rec.id)||pendingFor(rec.id));
 ntReflow();
 const fdx=document.getElementById("feed");
 if(fdx&&document.activeElement!==fdx&&!pendingFor(nbId())){
   const nbk=layer.find(r=>r.type==="notebook");
   fdx.value=nbk?(nbk.data||""):"";
 }
  renderAnswers();
  renderCompleteBtn();
}

/* fallback: nenhum engine define window.showAnchor;
   sem isto, clique simples em uma frase marcada lançaria ReferenceError no handler de click.
   Reapresenta o popup de sete botões (▶ Hear / ▶ Play / ⏺ Record / 🔊 Delete / 📝 Add/Edit Note /
   💾 Save / 📝 Delete; os que não se aplicam ficam desabilitados) para a âncora clicada. Usa os
   mesmos helpers do popup de seleção (engine1.js), então os dois pontos de entrada — selecionar ou
   clicar na marca — se comportam igual. Passa a ÁREA da marca (um Range real), não r=null, para que
   openNbPopup resolva por SOBREPOSIÇÃO (nbPopState): clicar numa gravação que cruza uma nota apresenta
   OS DOIS, e ⏺ Record fica travado quando a marca já tem gravação. */
if(typeof window.showAnchor!=="function"){window.showAnchor=function(a,x,y){const area=nbAreaOf(a);openNbPopup(a,area?nbAreaRange(area):null,x,y);};}

window.__B=true;

/* ---- pronunciation key ----
   PRON: word → { L1, L2?, alts? }. Each is an array of syllables; each syllable is an
   array of [phonemes, bold] segments (bold=1 → <b>, bold=0 → grey .pr-g).
   Syllable boundaries (Rule R): a new syllable begins before each phoneme that precedes
   a vowel phoneme, EXCEPT a word-final silent "e". A multi-letter phoneme is ONE unit and is
   never split: digraphs ch/sh/th/ph/ng/ck/wh/kn/wr/gh, doubles ff/ll/ss/tt/dd/gg/nn/mm/pp/rr/bb,
   r-colored ar/er/ir/or/ur, and consonant clusters that act as one phoneme (e.g. mf in
   comfortable, nt, nd, st, mp). Within a syllable: bold = the nucleus (first two phoneme slots),
   grey = the rest; "ə" = schwa; L2 = a genuine fewer-syllable reduction whose nuclei may be
   consonant-only (bn, pls, fm); alts = same-syllable variants. Rendered wherever the author
   marks data-pron="word" (L1) or data-pron="word:2" (L2). No toggle. */
const PRON={
 "different":{L1:[[["di",1]],[["ffə",1]],[["rə",1],["nt",0]]],L2:[[["di",1]],[["ffrə",1],["nt",0]]]},
 "probably":{L1:[[["prə",1]],[["bə",1]],[["bly",1]]],L2:[[["prb",1]],[["bly",1]]]},
 "kitchen":{L1:[[["ki",1]],[["tchə",1],["n",0]]]},
 "photograph":{L1:[[["pho",1]],[["tə",1]],[["gra",1],["ph",0]]]},
 "family":{L1:[[["fa",1]],[["mə",1]],[["ly",1]]],L2:[[["fm",1]],[["ly",1]]]},
 "office":{L1:[[["o",1]],[["ffi",1],["ce",0]]]},
 "business":{L1:[[["bi",1],["z",0]],[["nə",1],["s",0]]],L2:[[["bz",1]],[["ns",1]]]},
 "think":{L1:[[["thi",1],["nk",0]]]},
 "graph":{L1:[[["gra",1],["ph",0]]]},
 "beautiful":{L1:[[["be",1],["au",0]],[["tə",1]],[["fə",1],["l",0]]]},
 "mine":{L1:[[["mi",1],["ne",0]]]},
 "his":{L1:[[["h",0],["əs",1]]],alts:[[["əs",1]]]},
 "with":{L1:[[["wi",1],["th",0]]],alts:[[["wi",1]]]},
 "them":{L1:[[["thə",1],["m",0]]],alts:[[["thm",1]],[["əm",1]]]},
 "police":{L1:[[["pə",1]],[["li",1],["ce",0]]],L2:[[["pls",1]]]},
 "arthropod":{L1:[[["ar",1],["th",0]],[["rə",1]],[["po",1],["d",0]]]},
 "the":{L1:[[["thə",1]]],alts:[[["thi",1]]]},
 "of":{L1:[[["əv",1]]]},
 "and":{L1:[[["ən",1]]],alts:[[["n",1]]]},
 "to":{L1:[[["tə",1]]]},
 "a":{L1:[[["ə",1]]]},
 "at":{L1:[[["ət",1]]]},
 "is":{L1:[[["iz",1]]],alts:[[["z",1]]]},
 "are":{L1:[[["ər",1]]]},
 "was":{L1:[[["wə",1],["z",0]]]},
 "were":{L1:[[["wə",1],["r",0]]]},
 "have":{L1:[[["hə",1],["v",0]]],alts:[[["əv",1]]]},
 "has":{L1:[[["hə",1],["z",0]]]},
 "do":{L1:[[["də",1]]]},
 "does":{L1:[[["də",1],["z",0]]]},
 "not":{L1:[[["nə",1],["t",0]]],alts:[[["nt",1]]]},
 "for":{L1:[[["fə",1],["r",0]]]},
 "from":{L1:[[["frə",1],["m",0]]]},
 "that":{L1:[[["thə",1],["t",0]]]},
 "you":{L1:[[["yə",1]]]},
 "we":{L1:[[["wi",1]]]},
 "they":{L1:[[["thə",1]]]},
 "my":{L1:[[["mə",1]]]},
 "your":{L1:[[["yə",1],["r",0]]]},
 "him":{L1:[[["im",1]]]},
 "her":{L1:[[["ər",1]]]},
 "us":{L1:[[["əs",1]]]},
 "I":{L1:[[["I",1]]]},
 "he":{L1:[[["he",1]]],alts:[[["i",1]]]},
 "she":{L1:[[["shi",1]]]},
 "it":{L1:[[["it",1]]]},
 "me":{L1:[[["me",1]]]},
 "our":{L1:[[["ar",1]]]},
 "in":{L1:[[["in",1]]]},
 "on":{L1:[[["on",1]]]},
 "by":{L1:[[["by",1]]]},
 "can":{L1:[[["cə",1],["n",0]]]},
 "will":{L1:[[["wi",1],["ll",0]]],alts:[[["l",1]]]},
 "would":{L1:[[["wə",1],["d",0]]],alts:[[["d",1]]]},
 "could":{L1:[[["cə",1],["d",0]]]},
 "but":{L1:[[["bə",1],["t",0]]]},
 "so":{L1:[[["so",1]]]},
 "or":{L1:[[["or",1]]]},
 "what":{L1:[[["whə",1],["t",0]]]},
 "how":{L1:[[["how",1]]]},
 "there":{L1:[[["the",1],["re",0]]]},
 "here":{L1:[[["he",1],["re",0]]]},
 "no":{L1:[[["no",1]]]},
 "yes":{L1:[[["yes",1]]]},
 "three":{L1:[[["thr",1],["ee",0]]]},
 "thing":{L1:[[["thi",1],["ng",0]]]},
 "thank":{L1:[[["tha",1],["nk",0]]]},
 "mother":{L1:[[["mo",1],["thə",1],["r",0]]]},
 "father":{L1:[[["fa",1],["thə",1],["r",0]]]},
 "brother":{L1:[[["bro",1],["thə",1],["r",0]]]},
 "other":{L1:[[["o",1],["thə",1],["r",0]]]},
 "their":{L1:[[["thə",1],["r",0]]]},
 "car":{L1:[[["ca",1],["r",0]]]},
 "work":{L1:[[["wo",1],["rk",0]]]},
 "more":{L1:[[["mo",1],["re",0]]]},
 "morning":{L1:[[["mo",1],["r",0]],["ni",1],["ng",0]]},
 "water":{L1:[[["wa",1],["tə",1],["r",0]]]},
 "better":{L1:[[["be",1],["ttə",1],["r",0]]]},
 "city":{L1:[[["ci",1],["ty",1]]]},
 "little":{L1:[[["li",1],["ttle",0]]]},
 "party":{L1:[[["par",1],["ty",0]]]},
 "working":{L1:[[["wor",1],["king",0]]]},
 "meeting":{L1:[[["mee",1]],[["ti",1],["ng",0]]]},
 "going":{L1:[[["go",1],["ing",0]]]},
 "doing":{L1:[[["do",1],["ing",0]]]},
 "making":{L1:[[["ma",1],["king",0]]]},
 "taking":{L1:[[["ta",1],["king",0]]]},
 "talking":{L1:[[["tal",1],["king",0]]]},
 "know":{L1:[[["k",0],["no",1]]]},
 "write":{L1:[[["w",0],["ri",1],["te",0]]]},
 "wrong":{L1:[[["w",0],["ro",1],["ng",0]]]},
 "night":{L1:[[["ni",1],["ght",0]]]},
 "light":{L1:[[["li",1],["ght",0]]]},
 "right":{L1:[[["ri",1],["ght",0]]]},
 "eight":{L1:[[["ei",1],["ght",0]]]},
 "listen":{L1:[[["li",1],["s",0],["tə",1],["n",0]]]},
 "often":{L1:[[["o",1],["f",0],["tə",1],["n",0]]]},
 "half":{L1:[[["ha",1],["lf",0]]]},
 "talk":{L1:[[["ta",1],["lk",0]]]},
 "go":{L1:[[["go",1]]]},
 "come":{L1:[[["co",1],["me",0]]]},
 "take":{L1:[[["ta",1],["ke",0]]]},
 "bring":{L1:[[["bri",1],["ng",0]]]},
 "catch":{L1:[[["ca",1],["tch",0]]]},
 "leave":{L1:[[["lea",1],["ve",0]]]},
 "arrive":{L1:[[["a",1],["rri",1],["ve",0]]]},
 "say":{L1:[[["say",1]]]},
 "tell":{L1:[[["te",1],["ll",0]]]},
 "speak":{L1:[[["spea",1],["k",0]]]},
 "wait":{L1:[[["wai",1],["t",0]]]},
 "expect":{L1:[[["ex",1],["pe",1],["ct",0]]]},
 "hope":{L1:[[["ho",1],["pe",0]]]},
 "find":{L1:[[["fi",1],["nd",0]]]},
 "pay":{L1:[[["pay",1]]]},
 "spend":{L1:[[["spe",1],["nd",0]]]},
 "waste":{L1:[[["wa",1],["ste",0]]]},
 "miss":{L1:[[["mi",1],["ss",0]]]},
 "live":{L1:[[["li",1],["ve",0]]]},
 "call":{L1:[[["ca",1],["ll",0]]]},
 "start":{L1:[[["star",1],["t",0]]]},
 "finish":{L1:[[["fi",1],["ni",1],["sh",0]]]},
 "meet":{L1:[[["mee",1],["t",0]]]},
 "get":{L1:[[["ge",1],["t",0]]]},
 "make":{L1:[[["ma",1],["ke",0]]]},
 "like":{L1:[[["li",1],["ke",0]]]},
 "read":{L1:[[["rea",1],["d",0]]]},
 "send":{L1:[[["se",1],["nd",0]]]},
 "been":{L1:[[["bee",1],["n",0]]],L2:[[["bn",1]]]},
 "every":{L1:[[["ev",1]],[["ə",1]],[["ry",1]]],L2:[[["ev",1]],[["ry",1]]]},
 "camera":{L1:[[["ca",1]],[["mə",1]],[["ra",1]]],L2:[[["ca",1],["m",0]],[["ra",1]]]},
 "chocolate":{L1:[[["cho",1],["c",0]],[["ə",1]],[["la",1],["te",0]]],L2:[[["cho",1],["c",0]],[["la",1],["te",0]]]},
 "favorite":{L1:[[["fa",1]],[["və",1]],[["ri",1],["te",0]]],L2:[[["fa",1],["v",0]],[["ri",1],["t",0]]]},
 "comfortable":{L1:[[["co",1],["m",0]],[["fə",1],["r",0]],[["tə",1]],[["bl",1],["e",0]]],L2:[[["co",1],["mf",0]],[["tə",1]],[["bl",1]]]},
 "gonna":{L1:[[["go",1],["n",0]],[["na",1]]]},
 "wanna":{L1:[[["wa",1],["n",0]],[["na",1]]]},
 "gotta":{L1:[[["go",1]],[["tta",1]]]},
 "dunno":{L1:[[["du",1]],[["nno",1]]]},
 "kinda":{L1:[[["ki",1],["n",0]],[["da",1]]]},
 "sorta":{L1:[[["so",1],["r",0]],[["ta",1]]]},
 "lotta":{L1:[[["lo",1]],[["tta",1]]]},
 "hafta":{L1:[[["ha",1],["f",0]],[["ta",1]]]},
 "lemme":{L1:[[["le",1]],[["mme",1]]]},
 "gimme":{L1:[[["gi",1]],[["mme",1]]]},
 "woulda":{L1:[[["wou",1]],[["da",1]]]},
 "coulda":{L1:[[["cou",1]],[["da",1]]]},
 "shoulda":{L1:[[["shou",1]],[["da",1]]]}
};
function pronHTML(entry,level){
 const key=(level==="2")?(entry.L2||entry.alts):(entry.L1||entry.alts);
 if(!key) return null;
 return key.map(function(syl){return syl.map(function(seg){return seg[1]?'<b>'+seg[0]+'</b>':'<span class="pr-g">'+seg[0]+'</span>';}).join('');}).join('·');
}
function wirePron(){
 document.querySelectorAll('[data-pron]').forEach(function(el){
  const spec=(el.getAttribute('data-pron')||'').split(':');
  const entry=PRON[spec[0]]; if(!entry) return;
  const h=pronHTML(entry,spec[1]);
  if(h) el.innerHTML=h;
 });
}
(function(){if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',wirePron);}else{wirePron();}})();
