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

/* ---- pronunciation key (custom dictionary) ----
   One word per row - six columns:
   1. original word
   2. original word with markup  (<b>…</b> = bold syllable core, <span class=pr-g>…</span> = grey hanging letters, · = syllable boundary)
   3. syllable count (level 1)
   4. level 1 output (plain text, · between syllables)
   5. level 2 output (plain text; empty string when no L2 form)
   6. level 2 syllable count (empty string when no L2 form)
   ə = schwa. L2 = natural reduced form (fewer syllables). */
const PRON = [
  ["different", "<b>di</b>·<b>ffə</b>·<b>rə</b><span class='pr-g'>nt</span>", 3, "di·ffə·rənt", "di·ffrənt", 2],
  ["probably", "<b>prə</b>·<b>bə</b>·<b>bly</b>", 3, "prə·bə·bly", "prb·bly", 2],
  ["kitchen", "<b>ki</b>·<b>tchə</b><span class='pr-g'>n</span>", 2, "ki·tchən", "", ""],
  ["photograph", "<b>pho</b>·<b>tə</b>·<b>gra</b><span class='pr-g'>ph</span>", 3, "pho·tə·graph", "", ""],
  ["family", "<b>fa</b>·<b>mə</b>·<b>ly</b>", 3, "fa·mə·ly", "fm·ly", 2],
  ["office", "<b>o</b>·<b>ffi</b><span class='pr-g'>ce</span>", 2, "o·ffice", "", ""],
  ["business", "<b>bi</b><span class='pr-g'>z</span>·<b>nə</b><span class='pr-g'>s</span>", 2, "biz·nəs", "bz·ns", 2],
  ["think", "<b>thi</b><span class='pr-g'>nk</span>", 1, "think", "", ""],
  ["graph", "<b>gra</b><span class='pr-g'>ph</span>", 1, "graph", "", ""],
  ["beautiful", "<b>be</b><span class='pr-g'>au</span>·<b>tə</b>·<b>fə</b><span class='pr-g'>l</span>", 3, "beau·tə·fəl", "", ""],
  ["mine", "<b>mi</b><span class='pr-g'>ne</span>", 1, "mine", "", ""],
  ["his", "<span class='pr-g'>h</span><b>əs</b>", 1, "həs", "əs", "1"],
  ["with", "<b>wi</b><span class='pr-g'>th</span>", 1, "with", "wi", "1"],
  ["them", "<b>thə</b><span class='pr-g'>m</span>", 1, "thəm", "thm / əm", "1 / 1"],
  ["police", "<b>pə</b>·<b>li</b><span class='pr-g'>ce</span>", 2, "pə·lice", "pls", 1],
  ["arthropod", "<b>ar</b><span class='pr-g'>th</span>·<b>rə</b>·<b>po</b><span class='pr-g'>d</span>", 3, "arth·rə·pod", "", ""],
  ["the", "<b>thə</b>", 1, "thə", "thi", "1"],
  ["of", "<b>əv</b>", 1, "əv", "", ""],
  ["and", "<b>ən</b>", 1, "ən", "n", "1"],
  ["to", "<b>tə</b>", 1, "tə", "", ""],
  ["a", "<b>ə</b>", 1, "ə", "", ""],
  ["at", "<b>ət</b>", 1, "ət", "", ""],
  ["is", "<b>iz</b>", 1, "iz", "z", "1"],
  ["are", "<b>ər</b>", 1, "ər", "", ""],
  ["was", "<b>wə</b><span class='pr-g'>z</span>", 1, "wəz", "", ""],
  ["were", "<b>wə</b><span class='pr-g'>r</span>", 1, "wər", "", ""],
  ["have", "<b>hə</b><span class='pr-g'>v</span>", 1, "həv", "əv", "1"],
  ["has", "<b>hə</b><span class='pr-g'>z</span>", 1, "həz", "", ""],
  ["do", "<b>də</b>", 1, "də", "", ""],
  ["does", "<b>də</b><span class='pr-g'>z</span>", 1, "dəz", "", ""],
  ["not", "<b>nə</b><span class='pr-g'>t</span>", 1, "nət", "nt", "1"],
  ["for", "<b>fə</b><span class='pr-g'>r</span>", 1, "fər", "", ""],
  ["from", "<b>frə</b><span class='pr-g'>m</span>", 1, "frəm", "", ""],
  ["that", "<b>thə</b><span class='pr-g'>t</span>", 1, "thət", "", ""],
  ["you", "<b>yə</b>", 1, "yə", "", ""],
  ["we", "<b>wi</b>", 1, "wi", "", ""],
  ["they", "<b>thə</b>", 1, "thə", "", ""],
  ["my", "<b>mə</b>", 1, "mə", "", ""],
  ["your", "<b>yə</b><span class='pr-g'>r</span>", 1, "yər", "", ""],
  ["him", "<b>im</b>", 1, "im", "", ""],
  ["her", "<b>ər</b>", 1, "ər", "", ""],
  ["us", "<b>əs</b>", 1, "əs", "", ""],
  ["I", "<b>I</b>", 1, "I", "", ""],
  ["he", "<b>he</b>", 1, "he", "i", "1"],
  ["she", "<b>shi</b>", 1, "shi", "", ""],
  ["it", "<b>it</b>", 1, "it", "", ""],
  ["me", "<b>me</b>", 1, "me", "", ""],
  ["our", "<b>ar</b>", 1, "ar", "", ""],
  ["in", "<b>in</b>", 1, "in", "", ""],
  ["on", "<b>on</b>", 1, "on", "", ""],
  ["by", "<b>by</b>", 1, "by", "", ""],
  ["can", "<b>cə</b><span class='pr-g'>n</span>", 1, "cən", "", ""],
  ["will", "<b>wi</b><span class='pr-g'>ll</span>", 1, "will", "l", "1"],
  ["would", "<b>wə</b><span class='pr-g'>d</span>", 1, "wəd", "d", "1"],
  ["could", "<b>cə</b><span class='pr-g'>d</span>", 1, "cəd", "", ""],
  ["but", "<b>bə</b><span class='pr-g'>t</span>", 1, "bət", "", ""],
  ["so", "<b>so</b>", 1, "so", "", ""],
  ["or", "<b>or</b>", 1, "or", "", ""],
  ["what", "<b>whə</b><span class='pr-g'>t</span>", 1, "whət", "", ""],
  ["how", "<b>how</b>", 1, "how", "", ""],
  ["there", "<b>the</b><span class='pr-g'>re</span>", 1, "there", "", ""],
  ["here", "<b>he</b><span class='pr-g'>re</span>", 1, "here", "", ""],
  ["no", "<b>no</b>", 1, "no", "", ""],
  ["yes", "<b>yes</b>", 1, "yes", "", ""],
  ["three", "<b>thr</b><span class='pr-g'>ee</span>", 1, "three", "", ""],
  ["thing", "<b>thi</b><span class='pr-g'>ng</span>", 1, "thing", "", ""],
  ["thank", "<b>tha</b><span class='pr-g'>nk</span>", 1, "thank", "", ""],
  ["mother", "<b>mo</b><b>thə</b><span class='pr-g'>r</span>", 1, "mothər", "", ""],
  ["father", "<b>fa</b><b>thə</b><span class='pr-g'>r</span>", 1, "fathər", "", ""],
  ["brother", "<b>bro</b><b>thə</b><span class='pr-g'>r</span>", 1, "brothər", "", ""],
  ["other", "<b>o</b><b>thə</b><span class='pr-g'>r</span>", 1, "othər", "", ""],
  ["their", "<b>thə</b><span class='pr-g'>r</span>", 1, "thər", "", ""],
  ["car", "<b>ca</b><span class='pr-g'>r</span>", 1, "car", "", ""],
  ["work", "<b>wo</b><span class='pr-g'>rk</span>", 1, "work", "", ""],
  ["more", "<b>mo</b><span class='pr-g'>re</span>", 1, "more", "", ""],
  ["morning", "<b>mo</b><span class='pr-g'>r</span>·<b>n</b><span class='pr-g'>undefined</span>·<b>n</b><span class='pr-g'>undefined</span>", 3, "mor·n·n", "", ""],
  ["water", "<b>wa</b><b>tə</b><span class='pr-g'>r</span>", 1, "watər", "", ""],
  ["better", "<b>be</b><b>ttə</b><span class='pr-g'>r</span>", 1, "bettər", "", ""],
  ["city", "<b>ci</b><b>ty</b>", 1, "city", "", ""],
  ["little", "<b>li</b><span class='pr-g'>ttle</span>", 1, "little", "", ""],
  ["party", "<b>par</b><span class='pr-g'>ty</span>", 1, "party", "", ""],
  ["working", "<b>wor</b><span class='pr-g'>king</span>", 1, "working", "", ""],
  ["meeting", "<b>mee</b>·<b>ti</b><span class='pr-g'>ng</span>", 2, "mee·ting", "", ""],
  ["going", "<b>go</b><span class='pr-g'>ing</span>", 1, "going", "", ""],
  ["doing", "<b>do</b><span class='pr-g'>ing</span>", 1, "doing", "", ""],
  ["making", "<b>ma</b><span class='pr-g'>king</span>", 1, "making", "", ""],
  ["taking", "<b>ta</b><span class='pr-g'>king</span>", 1, "taking", "", ""],
  ["talking", "<b>tal</b><span class='pr-g'>king</span>", 1, "talking", "", ""],
  ["know", "<span class='pr-g'>k</span><b>no</b>", 1, "kno", "", ""],
  ["write", "<span class='pr-g'>w</span><b>ri</b><span class='pr-g'>te</span>", 1, "write", "", ""],
  ["wrong", "<span class='pr-g'>w</span><b>ro</b><span class='pr-g'>ng</span>", 1, "wrong", "", ""],
  ["night", "<b>ni</b><span class='pr-g'>ght</span>", 1, "night", "", ""],
  ["light", "<b>li</b><span class='pr-g'>ght</span>", 1, "light", "", ""],
  ["right", "<b>ri</b><span class='pr-g'>ght</span>", 1, "right", "", ""],
  ["eight", "<b>ei</b><span class='pr-g'>ght</span>", 1, "eight", "", ""],
  ["listen", "<b>li</b><span class='pr-g'>s</span><b>tə</b><span class='pr-g'>n</span>", 1, "listən", "", ""],
  ["often", "<b>o</b><span class='pr-g'>f</span><b>tə</b><span class='pr-g'>n</span>", 1, "oftən", "", ""],
  ["half", "<b>ha</b><span class='pr-g'>lf</span>", 1, "half", "", ""],
  ["talk", "<b>ta</b><span class='pr-g'>lk</span>", 1, "talk", "", ""],
  ["go", "<b>go</b>", 1, "go", "", ""],
  ["come", "<b>co</b><span class='pr-g'>me</span>", 1, "come", "", ""],
  ["take", "<b>ta</b><span class='pr-g'>ke</span>", 1, "take", "", ""],
  ["bring", "<b>bri</b><span class='pr-g'>ng</span>", 1, "bring", "", ""],
  ["catch", "<b>ca</b><span class='pr-g'>tch</span>", 1, "catch", "", ""],
  ["leave", "<b>lea</b><span class='pr-g'>ve</span>", 1, "leave", "", ""],
  ["arrive", "<b>a</b><b>rri</b><span class='pr-g'>ve</span>", 1, "arrive", "", ""],
  ["say", "<b>say</b>", 1, "say", "", ""],
  ["tell", "<b>te</b><span class='pr-g'>ll</span>", 1, "tell", "", ""],
  ["speak", "<b>spea</b><span class='pr-g'>k</span>", 1, "speak", "", ""],
  ["wait", "<b>wai</b><span class='pr-g'>t</span>", 1, "wait", "", ""],
  ["expect", "<b>ex</b><b>pe</b><span class='pr-g'>ct</span>", 1, "expect", "", ""],
  ["hope", "<b>ho</b><span class='pr-g'>pe</span>", 1, "hope", "", ""],
  ["find", "<b>fi</b><span class='pr-g'>nd</span>", 1, "find", "", ""],
  ["pay", "<b>pay</b>", 1, "pay", "", ""],
  ["spend", "<b>spe</b><span class='pr-g'>nd</span>", 1, "spend", "", ""],
  ["waste", "<b>wa</b><span class='pr-g'>ste</span>", 1, "waste", "", ""],
  ["miss", "<b>mi</b><span class='pr-g'>ss</span>", 1, "miss", "", ""],
  ["live", "<b>li</b><span class='pr-g'>ve</span>", 1, "live", "", ""],
  ["call", "<b>ca</b><span class='pr-g'>ll</span>", 1, "call", "", ""],
  ["start", "<b>star</b><span class='pr-g'>t</span>", 1, "start", "", ""],
  ["finish", "<b>fi</b><b>ni</b><span class='pr-g'>sh</span>", 1, "finish", "", ""],
  ["meet", "<b>mee</b><span class='pr-g'>t</span>", 1, "meet", "", ""],
  ["get", "<b>ge</b><span class='pr-g'>t</span>", 1, "get", "", ""],
  ["make", "<b>ma</b><span class='pr-g'>ke</span>", 1, "make", "", ""],
  ["like", "<b>li</b><span class='pr-g'>ke</span>", 1, "like", "", ""],
  ["read", "<b>rea</b><span class='pr-g'>d</span>", 1, "read", "", ""],
  ["send", "<b>se</b><span class='pr-g'>nd</span>", 1, "send", "", ""],
  ["been", "<b>bee</b><span class='pr-g'>n</span>", 1, "been", "bn", 1],
  ["every", "<b>ev</b>·<b>ə</b>·<b>ry</b>", 3, "ev·ə·ry", "ev·ry", 2],
  ["camera", "<b>ca</b>·<b>mə</b>·<b>ra</b>", 3, "ca·mə·ra", "cam·ra", 2],
  ["chocolate", "<b>cho</b><span class='pr-g'>c</span>·<b>ə</b>·<b>la</b><span class='pr-g'>te</span>", 3, "choc·ə·late", "choc·late", 2],
  ["favorite", "<b>fa</b>·<b>və</b>·<b>ri</b><span class='pr-g'>te</span>", 3, "fa·və·rite", "fav·rit", 2],
  ["comfortable", "<b>co</b><span class='pr-g'>m</span>·<b>fə</b><span class='pr-g'>r</span>·<b>tə</b>·<b>bl</b><span class='pr-g'>e</span>", 4, "com·fər·tə·ble", "comf·tə·bl", 3],
  ["gonna", "<b>go</b><span class='pr-g'>n</span>·<b>na</b>", 2, "gon·na", "", ""],
  ["wanna", "<b>wa</b><span class='pr-g'>n</span>·<b>na</b>", 2, "wan·na", "", ""],
  ["gotta", "<b>go</b>·<b>tta</b>", 2, "go·tta", "", ""],
  ["dunno", "<b>du</b>·<b>nno</b>", 2, "du·nno", "", ""],
  ["kinda", "<b>ki</b><span class='pr-g'>n</span>·<b>da</b>", 2, "kin·da", "", ""],
  ["sorta", "<b>so</b><span class='pr-g'>r</span>·<b>ta</b>", 2, "sor·ta", "", ""],
  ["lotta", "<b>lo</b>·<b>tta</b>", 2, "lo·tta", "", ""],
  ["hafta", "<b>ha</b><span class='pr-g'>f</span>·<b>ta</b>", 2, "haf·ta", "", ""],
  ["lemme", "<b>le</b>·<b>mme</b>", 2, "le·mme", "", ""],
  ["gimme", "<b>gi</b>·<b>mme</b>", 2, "gi·mme", "", ""],
  ["woulda", "<b>wou</b>·<b>da</b>", 2, "wou·da", "", ""],
  ["coulda", "<b>cou</b>·<b>da</b>", 2, "cou·da", "", ""],
  ["shoulda", "<b>shou</b>·<b>da</b>", 2, "shou·da", "", ""]
];

