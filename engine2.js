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
 bar.innerHTML="🦺 "+gate.email+" · <b>"+TRACK+"</b> · <a href=\"../portal.html\">Index</a> · <span class=\"dim\">Ctrl+Z=undo</span> <span class=\"undo-group\"><button id=\"undoBtn\" title=\"Undo (Ctrl+Z)\">↶ Undo</button><button id=\"redoBtn\" title=\"Redo (Ctrl+Y)\">↷ Redo</button></span>"+extra;
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

let undoStack=[],redoStack=[];

function pushUndo(action){
 undoStack.push(action);
 if(undoStack.length>50)undoStack.shift();
 /* a brand-new action branches the history: anything that was undone can no longer be redone */
 redoStack.length=0;
 updateUndoButton();
}

/* both buttons are ALWAYS present next to the "Ctrl+Z=undo" legend; they only grey out (disabled)
   when their own stack is empty — nothing ever hides or removes them from the control bar */
function updateUndoButton(){
 const ub=document.getElementById("undoBtn"),rb=document.getElementById("redoBtn");
 if(ub)ub.disabled=!undoStack.length;
 if(rb)rb.disabled=!redoStack.length;
}

function setupUndo(){
 document.addEventListener("keydown",e=>{
  const m=e.ctrlKey||e.metaKey;if(!m)return;
  const k=(e.key||"").toLowerCase();
  if(k==="z"&&!e.shiftKey){e.preventDefault();doUndo();}
  else if(k==="y"||(k==="z"&&e.shiftKey)){e.preventDefault();doRedo();}
 });
 const ub=document.getElementById("undoBtn"),rb=document.getElementById("redoBtn");
 if(ub)ub.onclick=()=>doUndo();
 if(rb)rb.onclick=()=>doRedo();
 updateUndoButton();
}

/* apply ONE undo/redo action: DOM first, network last (a failed save must never undo what the
   user just saw). Returns the action that would perform the OPPOSITE direction, so doUndo/doRedo
   can push it onto the other stack and the two stay perfectly in sync. */
function applyAction(a){
 if(!a)return null;
 if(a.type==="input"){
  const cur=a.el?a.el.value:undefined;
  if(a.el)a.el.value=a.prev;
  return {type:"input",el:a.el,prev:cur};
 }else if(a.type==="radio"){
  const cur=a.el&&a.el.querySelector('input:checked');const from=cur?cur.value:null;
  const r=a.el&&a.el.querySelector('input[value="'+a.prev+'"]');
  if(r)r.checked=true;
  return {type:"radio",el:a.el,prev:from};
 }else if(a.type==="delete"){
  /* the 🗑 Delete action now carries an items[] (engine1 nbDeleteAnchor); older entries used a
     single item — accept both so an undo of a delete really re-adds the phrase's whole set */
  const items=a.items||(a.item?[a.item]:[]);
  items.forEach(it=>{
   if(it.anchor)ensureMark(it.anchor,it.type);
   send({action:"add",type:it.type,anchor:it.anchor,b64:it.b64,mime:it.mime,data:JSON.stringify(it.data||{}),id:it.id});
  });
  return {type:"delete",items:items.slice()};
 }else if(a.type==="note"){
  a.items.forEach(it=>{
   if(it.anchor)ensureMark(it.anchor,it.type);
   send({action:"add",type:it.type,anchor:it.anchor,b64:it.b64,mime:it.mime,data:JSON.stringify(it.data||{}),id:it.id});
  });
  return {type:"note",items:a.items.slice()};
 }else if(a.type==="hl"){
  if(a.kind==="add"){
   /* undo/redo of "create a highlight": take it away, or put it back at its exact place/colour.
      Capture the live record BEFORE dropping it — its anchor + offsets + colour are what `hlReadd`
      needs, and a creation entry only carries the id. */
   const rec0=hlById(a.id);
   const item=a.item||(rec0?{id:rec0.id,anchor:rec0.anchor,data:{color:rec0.color,b:rec0.b,o:rec0.start}}:null);
   hlDrop(a.id);closePop();
   if(a.id)send({action:"del",id:a.id});
   return {type:"hl",kind:"add",id:a.id,item:item};
  }else if(a.kind==="del"){
   /* undo/redo of "delete a highlight": put the record back here and now, then store it again */
   hlReadd(a.item);
   send({action:"add",type:"hl",anchor:a.item.anchor,data:JSON.stringify(a.item.data||{}),id:a.item.id});
   return {type:"hl",kind:"del",item:a.item};
  }else if(a.kind==="color"){
   /* undo/redo of "recolour": paint the target colour; the inverse needs the colour we are leaving */
   const rec=hlById(a.id);
   const now=rec?rec.color:null;
   if(rec)hlSetColor(rec,a.to);
   if(a.id)send({action:"set",type:"hl",anchor:a.anchor,data:JSON.stringify({color:a.to,b:rec?rec.b:a.b,o:rec?rec.start:a.start}),id:a.id});
   const other=now!=null?now:a.from;
   return {type:"hl",kind:"color",id:a.id,anchor:a.anchor,from:other,to:a.from,b:rec?rec.b:a.b,start:rec?rec.start:a.start};
  }
 }
 return null;
}

function doUndo(){
 if(!undoStack.length)return;
 const last=undoStack.pop();
 const inv=applyAction(last);
 if(inv)redoStack.push(inv);
 updateUndoButton();
}

function doRedo(){
 if(!redoStack.length)return;
 const last=redoStack.pop();
 const inv=applyAction(last);
 if(inv)undoStack.push(inv);
 updateUndoButton();
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
