/* MOTOR 2 — control bar, camadas, quiz, áudio com cache, realces persistentes */
const LAYER_VER="v4-server-truth-20261006"; /* Bump to mark a fresh data era */

/* One-time cleanup of ALL legacy local ghosts: shadow lists + device-only layer copies.
   Server is now the single source of truth; any nb_* localStorage entry is a ghost
   from the old "salvo apenas nesse dispositivo" system and must go. */
try{for(const k of Object.keys(localStorage))if(k.startsWith("deletedIds_")||k.startsWith("nb_"))localStorage.removeItem(k)}catch(e){}

document.querySelectorAll(".listen").forEach(b=>b.onclick=()=>{const u=new SpeechSynthesisUtterance(b.dataset.say);u.lang="en-US";u.rate=.9;speechSynthesis.cancel();speechSynthesis.speak(u)});
(async()=>{try{
 let extra="";
 if(gate.teacher){
  const ac=await(await fetch("../access.json?"+Date.now())).json();
  const st=Object.entries(ac.students||{}).filter(([e,s])=>s.track===TRACK);
  extra=' <select id="sel"><option value="'+gate.email+'">demo (you)</option>'+st.map(([e,s])=>'<option value="'+e+'">'+(s.name||e)+"</option>").join("")+"</select>";}
 const bar=document.getElementById("controlbar")||topbar;
 bar.innerHTML='<button id="undoBtn" title="Undo (Ctrl+Z)">↶ Undo</button> · 🦺 '+gate.email+' · <b>'+TRACK+'</b> · <a href="../portal.html">Index</a> · <span class="dim">Ctrl+Z=undo</span>'+extra;
 if(gate.teacher){sel.onchange=()=>{STUDENT=sel.value;sig="";loadLayer()};}
 loadLayer();
 /* ---- cross-session poll (owner spec 2026-10-12) — the ONLY re-check there is: add/set/del on
    either side (teacher or student) reach the other as fast as a 3s poll allows. Each send()
    marks its own id+action "pending" for 6s (engine1.js notePending/pendingFor); renderLayer()
    below skips reverting/resurrecting anything that's still inside its own 6s pending window, so
    a snapshot that races ahead of the backend write can never undo-then-redo a local action. This
    generic (by id+action, not by feature) pairing is the whole mechanism — any future action type
    that goes through send() is covered automatically, no per-action special-casing needed. */
 setInterval(loadLayer,3000);
 setupUndo();
}catch(e){let b=document.getElementById("errb");if(b)b.innerHTML+=" · control bar: "+e.message}})();

let undoStack=[];

function pushUndo(action){
 undoStack.push(action);
 if(undoStack.length>50)undoStack.shift();
 updateUndoButton();
}

function updateUndoButton(){
 const ub=document.getElementById("undoBtn");
 if(ub)ub.style.display=undoStack.length?"inline-block":"none";
}

function setupUndo(){
 document.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==="z"){e.preventDefault();doUndo();}
 });
 const ub=document.getElementById("undoBtn");
 if(ub){ub.style.display="none";ub.onclick=()=>doUndo();}
}

function doUndo(){
 if(!undoStack.length)return;
 const last=undoStack.pop();
 updateUndoButton();
 if(last.type==="input"){
  last.el.value=last.prev;
 }else if(last.type==="radio"){
  const r=last.el.querySelector('input[value="'+last.prev+'"]');
  if(r)r.checked=true;
 }else if(last.type==="delete"){
  /* re-add the item with its original id — server stores it again */
  send({action:"add",type:last.item.type,anchor:last.item.anchor,b64:last.item.b64,mime:last.item.mime,data:JSON.stringify(last.item.data||{}),id:last.item.id});
 }else if(last.type==="note"){
  /* the popup's 🗑 Delete removes the whole note/recording set of ONE phrase in a single action
     (engine1.js nbDeleteAnchor): undo restores every item with its original id and re-marks the
     phrase, so the DOM (mark.nb) and the server end up exactly as they were */
  last.items.forEach(it=>{
   if(it.anchor)ensureMark(it.anchor,it.type);
   send({action:"add",type:it.type,anchor:it.anchor,b64:it.b64,mime:it.mime,data:JSON.stringify(it.data||{}),id:it.id});
  });
 }else if(last.type==="hl"){
  if(last.kind==="add"){
   /* undo a new highlight = take it away again */
   if(last.id)send({action:"del",id:last.id});
   hlDrop(last.id);closePop();
  }else if(last.kind==="color"){
   /* undo a recolour = paint the previous colour back */
   const rec=hlById(last.id);
   if(rec)hlSetColor(rec,last.from);
   if(last.id)send({action:"set",type:"hl",anchor:last.anchor,data:JSON.stringify({color:last.from,b:rec?rec.b:last.b,o:rec?rec.start:last.start}),id:last.id});
  }else if(last.kind==="del"){
   /* undo a deletion = put the record back here and now, then store it again */
   hlReadd(last.item);
   send({action:"add",type:"hl",anchor:last.item.anchor,data:JSON.stringify(last.item.data||{}),id:last.item.id});
  }
 }
}

async function loadLayer(){
 let rows=[];
 try{const r=await fetch(BACKPACK+"?action=layer&email="+encodeURIComponent(STUDENT)+"&lesson="+L+"&ver="+LAYER_VER+"&t="+Date.now());rows=(await r.json()).rows||[];}catch(e){rows=[];}
 /* Server is the source of truth: rebuild layer from scratch every sync.
    No localStorage merge, no deletedIds shadow list — deletions are real on the server now. */
 layer=rows;
 const s=layer.map(x=>x.id).join(",");if(s===sig)return;sig=s;
 renderLayer();
}

function renderLayer(){
 /* Clear the note/recording flags of every mark.nb — except the ones with a local action still in
    flight (nbAnyPending, engine1.js). A mark created or deleted a moment ago must keep EXACTLY the
    state the click gave it: stripping the class here and re-adding it on the next poll is precisely
    the "appearing and disappearing" the owner reported. Same id+action grace window as everything
    else — the rule is general, not special-cased. */
 document.querySelectorAll("mark.nb").forEach(m=>{if(!nbAnyPending(m.dataset.a))m.classList.remove("has-rec","has-note")});
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
  if((it.type==="rec"||it.type==="note")&&it.anchor){
   /* a row whose own local action is still pending is skipped (the UI already applied it); rows
      with nothing in flight still (re)build the mark and its flag as before */
   if(!pendingFor(it.id)){
    const q='mark.nb[data-a="'+CSS.escape(it.anchor)+'"]';
    let m=document.querySelector(q);
    if(m)m.classList.add("has-"+it.type);else{ensureMark(it.anchor,it.type);m=document.querySelector(q);}
   }
  }
  if(it.type==="quiz"||it.type==="done"||(it.type==="note"&&!it.anchor)){
   const d=JSON.parse(it.data||"{}");
   feed.innerHTML+="<div>"+(it.type==="done"?"✅ concluída":it.type==="quiz"?"📝 quiz "+d.score+"%":"📝 "+(it.anchor||"traduções"))+" · <i>"+it.author+"</i></div>";}
 });
 /* a highlight whose server row no longer exists leaves the layer (the server is the truth);
    one with a local action still pending (add/set/del) stays exactly as the UI left it until
    the pending window elapses or a later poll confirms the server agrees */
 const hlIds=new Set(layer.filter(it=>it.type==="hl"&&it.anchor).map(it=>it.id));
 hlList=hlList.filter(rec=>hlIds.has(rec.id)||pendingFor(rec.id));
 hlReflow();
 if(!feed.innerHTML)feed.innerHTML='<div class="dim">Nada ainda — destaque um texto e anote ou grave algo.</div>';
}

/* fallback: nenhum engine define window.showAnchor;
   sem isto, clique simples em uma frase marcada lançaria ReferenceError no handler de click.
   Reapresenta o popup ▶ Hear / ⏺ Record / 📝 Note (e 🗑 Delete quando a frase já tem algo
   salvo) para a âncora clicada. Usa os mesmos helpers do popup de seleção (engine1.js), então
   os dois pontos de entrada — selecionar ou clicar na marca — se comportam igual: mesma
   marcação imediata, mesmo delete. Aqui não há seleção (r=null): recordMark/ensureMark operam
   sobre a marca já existente. */
if(typeof window.showAnchor!=="function"){window.showAnchor=function(a,x,y){openNbPopup(a,null,x,y);}}

window.__B=true;
