/* MOTOR 2 — control bar, camadas, áudio com cache, realces persistentes */
const LAYER_VER="v4-server-truth-20261006"; /* Bump to mark a fresh data era */
let wipeGuard=0; /* a Clear-page wipe in flight: the poll must not resurrect the rows it is deleting */
let lastPollChange=Date.now(); /* last time the poll saw a change — keeps the poll fast while the student watches */
let lastFull=""; /* the layer content signature used to detect that change */

function wireListen(){document.querySelectorAll(".listen").forEach(b=>{b.onclick=()=>{if(editing)return;const u=new SpeechSynthesisUtterance(b.dataset.say);u.lang="en-US";u.rate=.9;speechSynthesis.cancel();speechSynthesis.speak(u)}})}
wireListen();
/* ---- content edit mode (teacher): a separate editable copy; live page + marks stay untouched ---- */
const contentId=()=>"content_"+TRACK+"_"+L;
let savedLive="",editTimer=null;
function saveContent(){const ca=document.querySelector(".content-area");if(!ca)return;const o={action:"set",id:contentId(),type:"content",anchor:"",data:ca.innerHTML,email:gate.email,lesson:L,author:"prof",track:TRACK};notePending(o);outboxPush(o);scheduleFlush();}
function toggleEditMode(){
 if(STUDENT!==gate.email){toast("Switch to 'demo (you)' to edit content.");return;}
 editing=!editing;
 document.body.classList.toggle("editing",editing);
 const ca=document.querySelector(".content-area"),eb=document.getElementById("editpage");
 if(editing){
  savedLive=ca.innerHTML;
  const cov=layer.find(r=>r.type==="content"&&r.data);
  if(cov)ca.innerHTML=cov.data;
  else document.querySelectorAll("mark.nb").forEach(m=>{m.replaceWith(document.createTextNode(m.textContent))});
  wireListen();
  if(ca)ca.setAttribute("contenteditable","true");
  hlReflow();ntReflow();
  if(eb)eb.textContent="✔️ Done";
  toast("Edit mode — changes auto-save");
 }else{
  if(ca)ca.removeAttribute("contenteditable");
  if(eb)eb.textContent="✏️ Edit";
  saveContent();
  ca.innerHTML=savedLive;
  toast("Saved");
 }
}
document.addEventListener("input",e=>{if(!editing)return;if(e.target&&e.target.closest&&e.target.closest(".content-area")){clearTimeout(editTimer);editTimer=setTimeout(saveContent,2000)}});
(async()=>{try{
 let extra="";
 if(gate.teacher){
  const ac=await(await fetch("../access.json?"+Date.now())).json();
  const st=Object.entries(ac.students||{}).filter(([e,s])=>s.track===TRACK);
  extra=' <select id="sel"><option value="'+gate.email+'">demo (you)</option>'+st.map(([e,s])=>'<option value="'+e+'">'+(s.name||e)+"</option>").join("")+"</select>";}
 const bar=document.getElementById("controlbar")||topbar;
 bar.innerHTML="🦺 "+gate.email+" · <b>"+TRACK+"</b> · <a href=\"../portal.html\">Index</a>"+extra+' · <button type="button" id="clearpage">🧹 Clear page</button>';
 const cp=document.getElementById("clearpage");
 if(cp)cp.onclick=()=>{
  if(!confirm("Delete ALL highlights, notes and recordings on this page?"))return;
  send({action:"wipe"});                      /* network-last, like every other write */
  layer=[];hlList=[];ntList=[];sig="";wipeGuard=Date.now()+12000;
  document.querySelectorAll("mark.nb").forEach(m=>m.remove());
  hlReflow();ntReflow();
  const f=document.getElementById("feed");if(f)f.innerHTML='<div class="dim">Nada ainda — destaque um texto e anote ou grave algo.</div>';
 };
  const ppb=document.createElement("button");ppb.type="button";ppb.id="printpage";ppb.textContent="🖨 Print";
  ppb.onclick=()=>{if(typeof printLesson==="function")printLesson();else toast("Print unavailable.")};
  bar.appendChild(ppb);
  if(gate.teacher){
   const eb=document.createElement("button");eb.type="button";eb.id="editpage";eb.textContent="✏️ Edit";eb.onclick=()=>toggleEditMode();bar.appendChild(eb);
   const rb=document.createElement("button");rb.type="button";rb.id="revertpage";rb.textContent="↩️ Revert";rb.onclick=()=>{if(!confirm("Discard your saved edits and restore the original content?"))return;send({action:"del",id:contentId()});toast("Reverting…");setTimeout(()=>location.reload(),900)};bar.appendChild(rb);
  }

 if(gate.teacher){sel.onchange=()=>{STUDENT=sel.value;sig="";loadLayer()};}
 loadLayer();
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
 feed.innerHTML="";
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
  if(it.type==="note"&&!it.anchor){
   feed.innerHTML+="<div>📝 traduções · <i>"+it.author+"</i></div>";}
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
 if(!feed.innerHTML)feed.innerHTML='<div class="dim">Nada ainda — destaque um texto e anote ou grave algo.</div>';
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
