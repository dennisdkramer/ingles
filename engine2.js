/* MOTOR 2 — control bar, camadas, quiz, áudio com cache, desenho/realce persistentes */
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
  extra=' <select id="sel"><option value="'+gate.email+'">demo (you)</option>'+st.map(([e,s])=>'<option value="'+e+'">'+(s.name||e)+"</option>").join("")+"</select>";
  if(TRACK==="kids")extra+=' <button id="mute">🔕 aux off</button>';}
 const bar=document.getElementById("controlbar")||topbar;
 bar.innerHTML='<button id="undoBtn" title="Undo (Ctrl+Z)">↶ Undo</button> · 🦺 '+gate.email+' · <b>'+TRACK+'</b> · <a href="../portal.html">Index</a> · <button id="sync" title="Sync now">🔄 Sync</button> · <span class="dim">Ctrl+Z=undo</span>'+extra;
 if(gate.teacher){sel.onchange=()=>{STUDENT=sel.value;sig="";loadLayer()};
  const m=document.getElementById("mute");if(m)m.onclick=()=>{auxOn=!auxOn;send({action:"set",data:JSON.stringify({auxOff:!auxOn})});m.textContent=auxOn?"🔕 aux off":"🔔 aux on";};}
 bar.insertAdjacentHTML("beforeend",' <select id="modeToggle"><option value="off">visibility off</option><option value="limit">limited</option><option value="teacher">teacher only</option></select>');
 const modeSel=document.getElementById("modeToggle");
 modeSel.onchange=()=>{mode=modeSel.value;send({action:"set",data:JSON.stringify({mode})});};
 document.getElementById("sync").onclick=()=>{sig="";loadLayer()};
 loadLayer();setInterval(loadLayer,15000);
 setupUndo();
}catch(e){let b=document.getElementById("errb");if(b)b.innerHTML+=" · control bar: "+e.message}})();

let mode="off";
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
  send({action:"add",type:last.item.type,b64:last.item.b64,mime:last.item.mime,data:JSON.stringify(last.item.data||{}),id:last.item.id});
 }
}

async function loadLayer(){
 let rows=[];
 try{const r=await fetch(BACKPACK+"?action=layer&email="+encodeURIComponent(STUDENT)+"&lesson="+L+"&ver="+LAYER_VER+"&t="+Date.now());rows=(await r.json()).rows||[];}catch(e){rows=[];}
 /* Server is the source of truth: rebuild layer from scratch every sync.
    No localStorage merge, no deletedIds shadow list — deletions are real on the server now. */
 layer=rows;
 const s=layer.map(x=>x.id).join(",");if(s===sig)return;sig=s;
 const set=layer.find(x=>x.type==="setting");auxOn=!set||!JSON.parse(set.data||"{}").auxOff;
 if(set&&JSON.parse(set.data||"{}").mode){mode=JSON.parse(set.data||"{}").mode;if(document.getElementById("modeToggle"))document.getElementById("modeToggle").value=mode;}
 renderLayer();
}

function renderLayer(){
 document.querySelectorAll("mark.nb").forEach(m=>m.classList.remove("has-rec","has-note"));
 feed.innerHTML="";
 layer.forEach(it=>{
  if((it.type==="rec"||it.type==="note")&&it.anchor){
   const m=document.querySelector('mark.nb[data-a="'+CSS.escape(it.anchor)+'"]');
   if(m)m.classList.add("has-"+it.type);else ensureMark(it.anchor,it.type);}
  if(it.type==="quiz"||it.type==="done"||(it.type==="note"&&!it.anchor)){
   const d=JSON.parse(it.data||"{}");
   feed.innerHTML+="<div>"+(it.type==="done"?"✅ concluída":it.type==="quiz"?"📝 quiz "+d.score+"%":"📝 "+(it.anchor||"traduções"))+" · <i>"+it.author+"</i></div>";}
 });
 if(!feed.innerHTML)feed.innerHTML='<div class="dim">Nada ainda — destaque um texto e anote ou grave algo.</div>';
}

window.__B=true;
