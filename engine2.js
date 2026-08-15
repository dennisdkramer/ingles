/* MOTOR 2 — topbar, camadas, quiz, áudio com cache, desenho/realce persistentes */
const LAYER_VER="v2-clear-all-20240815"; /* Bump this to wipe all drawings/notes/recordings */
document.querySelectorAll(".listen").forEach(b=>b.onclick=()=>{const u=new SpeechSynthesisUtterance(b.dataset.say);u.lang="en-US";u.rate=.9;speechSynthesis.cancel();speechSynthesis.speak(u)});
(async()=>{try{
 let extra="";
 if(gate.teacher){
  const ac=await(await fetch("../access.json?"+Date.now())).json();
  const st=Object.entries(ac.students||{}).filter(([e,s])=>s.track===TRACK);
  extra=' <select id="sel"><option value="'+gate.email+'">demo (você)</option>'+st.map(([e,s])=>'<option value="'+e+'">'+(s.name||e)+"</option>").join("")+"</select>";
  if(TRACK==="kids")extra+=' <button id="mute">🔕 aux off</button>';}
 topbar.innerHTML='🦺 '+gate.email+' · <b>'+TRACK+'</b> · <a href="../portal.html">Index</a> · <button id="sync">🔄</button> · <span class="dim">Shift+clique=desenhar · Shift+dir=apagar · Ctrl+clique=realçar · Ctrl+Z=desfazer</span>'+extra;
 if(gate.teacher){sel.onchange=()=>{STUDENT=sel.value;sig="";loadLayer()};
  const m=document.getElementById("mute");if(m)m.onclick=()=>{auxOn=!auxOn;send({action:"set",data:JSON.stringify({auxOff:!auxOn})});m.textContent=auxOn?"🔕 aux off":"🔔 aux on";};}
 topbar.insertAdjacentHTML("beforeend",' <select id="modeToggle"><option value="off">off</option><option value="limit">limit</option><option value="teacher">teacher only</option></select>');
 const modeSel=document.getElementById("modeToggle");
 modeSel.onchange=()=>{mode=modeSel.value;send({action:"set",data:JSON.stringify({mode})});};
 document.getElementById("sync").onclick=()=>{sig="";loadLayer()};
 loadLayer();setInterval(loadLayer,15000);
 setupUndo();setupDrawing();
}catch(e){let b=document.getElementById("errb");if(b)b.innerHTML+=" · topbar: "+e.message}})();

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
 const ub=document.createElement("button");
 ub.id="undoBtn";
 ub.textContent="↶ Desfazer";
 ub.title="Desfazer (Ctrl+Z)";
 ub.style.cssText="position:fixed;top:10px;right:10px;z-index:1000;padding:6px 10px;font-size:13px;border-radius:6px;background:var(--ink);color:var(--cream);border:0;cursor:pointer;box-shadow:2px 2px 0 var(--tan);display:none;";
 ub.onclick=()=>doUndo();
 document.body.appendChild(ub);
}

function doUndo(){
 if(!undoStack.length)return;
 const last=undoStack.pop();
 updateUndoButton();
 if(last.type==="draw"||last.type==="highlight"){
  send({action:"del",id:last.id,type:last.type});
  const idx=layer.findIndex(it=>it.id===last.id);
  if(idx>=0){layer.splice(idx,1);sig=layer.map(x=>x.id).join(",");}
  const el=document.querySelector('[data-id="'+last.id+'"]');
  if(el)el.remove();
 }else if(last.type==="input"){
  last.el.value=last.prev;
 }else if(last.type==="radio"){
  const r=last.el.querySelector('input[value="'+last.prev+'"]');
  if(r)r.checked=true;
 }else if(last.type==="delete"){
  send({action:"add",type:last.item.type,b64:last.item.b64,mime:last.item.mime,data:JSON.stringify(last.item.data||{}),id:last.item.id});
  layer.push(last.item);
  sig=layer.map(x=>x.id).join(",");
  if(last.item.type==="draw")placeImg(last.item);
  if(last.item.type==="highlight")renderHighlight(last.item);
 }
}

let cv=null,ctx=null,drawing=false;
function setupDrawing(){
 const page=document.getElementById("page");
 page.style.position="relative";
 page.style.overflow="hidden";
 
 page.addEventListener("mousedown",e=>{
  if(mode==="teacher"&&!gate.teacher)return;
  if(mode==="limit"&&!gate.teacher)return;
  if(e.shiftKey&&e.button===2){e.preventDefault();handleDelete(e);return;}
  if(e.shiftKey&&e.button===0){e.preventDefault();startDraw(e.clientX,e.clientY);return;}
  if((e.ctrlKey||e.metaKey)&&e.button===0){e.preventDefault();handleHighlight(e);return;}
 },true);
 
 page.addEventListener("mousemove",e=>{if(drawing){e.preventDefault();doDraw(e.clientX,e.clientY);}},true);
 page.addEventListener("mouseup",e=>{if(drawing){e.preventDefault();endDraw();}},true);
 page.addEventListener("contextmenu",e=>{if(e.shiftKey)e.preventDefault();},true);
 
 page.addEventListener("touchstart",e=>{
  if(mode==="teacher"&&!gate.teacher)return;
  if(mode==="limit"&&!gate.teacher)return;
  if(e.touches.length===2){e.preventDefault();startDraw(e.touches[0].clientX,e.touches[0].clientY);}
  if(e.touches.length===3){e.preventDefault();handleHighlight({clientX:e.touches[0].clientX,clientY:e.touches[0].clientY});}
  if(e.touches.length===4){e.preventDefault();handleDelete({clientX:e.changedTouches[0].clientX,clientY:e.changedTouches[0].clientY});}
 },{passive:false,capture:true});
 
 page.addEventListener("touchmove",e=>{if(drawing&&e.touches.length===2){e.preventDefault();doDraw(e.touches[0].clientX,e.touches[0].clientY);}}, {passive:false,capture:true});
 page.addEventListener("touchend",e=>{if(drawing&&e.touches.length<2){endDraw();}},{capture:true});
}

function startDraw(x,y){
 if(!auxOn)return;
 drawing=true;
 const page=document.getElementById("page");
 const pageRect=page.getBoundingClientRect();
 cv=document.createElement("canvas");
 cv.style.cssText="position:absolute;left:0;top:0;z-index:50;pointer-events:none;";
 cv.width=page.offsetWidth;cv.height=page.offsetHeight;
 page.appendChild(cv);
 ctx=cv.getContext("2d");
 ctx.strokeStyle="#b3261e";ctx.lineWidth=3;ctx.lineCap="round";ctx.lineJoin="round";
 ctx.beginPath();ctx.moveTo(x-pageRect.left,y-pageRect.top);
}

function doDraw(x,y){
 if(!drawing||!ctx)return;
 const page=document.getElementById("page");
 const pageRect=page.getBoundingClientRect();
 ctx.lineTo(x-pageRect.left,y-pageRect.top);ctx.stroke();ctx.beginPath();ctx.moveTo(x-pageRect.left,y-pageRect.top);
}

function endDraw(){
 if(!drawing||!cv)return;
 drawing=false;
 const b64=cv.toDataURL("image/png").split(",")[1];
 const page=document.getElementById("page");
 const drawData={left:0,top:page.scrollTop||0,width:cv.width,height:cv.height};
 const id="d_"+Date.now()+"_"+Math.random().toString(36).slice(2);
 send({action:"add",type:"draw",b64,mime:"image/png",data:JSON.stringify(drawData),id});
 const newItem={id,type:"draw",b64,mime:"image/png",data:JSON.stringify(drawData),author:who(),anchor:""};
 layer.push(newItem);sig=layer.map(x=>x.id).join(",");
 pushUndo({type:"draw",id});
 cv.remove();cv=null;ctx=null;
}

function handleHighlight(e){
 const page=document.getElementById("page");
 const pageRect=page.getBoundingClientRect();
 const x=e.clientX-pageRect.left,y=e.clientY-pageRect.top;
 const id="h_"+Date.now()+"_"+Math.random().toString(36).slice(2);
 const hlData={type:"highlight",x,y,hW:10,hH:20,color:"#fef08a"};
 renderHighlight({id,data:JSON.stringify(hlData)});
 send({action:"add",type:"highlight",data:JSON.stringify(hlData),id});
 const newItem={id,type:"highlight",data:JSON.stringify(hlData),author:who(),anchor:""};
 layer.push(newItem);sig=layer.map(x=>x.id).join(",");
 pushUndo({type:"draw",id});
}

function renderHighlight(hl){
 const d=typeof hl.data==="string"?JSON.parse(hl.data):hl.data||hl;
 const div=document.createElement("div");
 div.className="nbHl";div.dataset.id=hl.id;
 div.style.cssText="position:absolute;left:"+(d.x-d.hW/2)+"px;top:"+(d.y-d.hH/2)+"px;width:"+d.hW+"px;height:"+d.hH+"px;background:"+d.color+";opacity:0.6;z-index:1;pointer-events:none;";
 document.getElementById("page").appendChild(div);
}

function handleDelete(e){
 const page=document.getElementById("page");
 const pageRect=page.getBoundingClientRect();
 checkDeleteAt(e.clientX-pageRect.left,e.clientY-pageRect.top,pageRect);
}

function checkDeleteAt(x,y,pageRect){
 const items=[...document.querySelectorAll(".nbImg"),...document.querySelectorAll(".nbHl")];
 let found=null,minDist=Infinity;
 items.forEach(el=>{
  const r=el.getBoundingClientRect();
  const cx=r.left-pageRect.left+r.width/2,cy=r.top-pageRect.top+r.height/2;
  const dist=Math.sqrt((x-cx)**2+(y-cy)**2);
  if(dist<minDist&&dist<=5){minDist=dist;found=el;}
 });
 if(found){
  const id=found.dataset.id;
  if(id){
   const item=layer.find(it=>it.id===id);
   if(item&&(item.author===who()||gate.teacher)){
    const itemCopy={...item};
    send({action:"del",id:item.id,type:item.type});
    const idx=layer.findIndex(it=>it.id===id);
    if(idx>=0){layer.splice(idx,1);sig=layer.map(x=>x.id).join(",");}
    found.remove();
    pushUndo({type:"delete",id:item.id,item:itemCopy});
   }
  }
 }
}

async function loadLayer(){
 try{const r=await fetch(BACKPACK+"?action=layer&email="+encodeURIComponent(STUDENT)+"&lesson="+L+"&ver="+LAYER_VER);layer=(await r.json()).rows||[];}catch(e){layer=[];}
 const sKeys=new Set(layer.map(x=>x.anchor+"|"+x.type)),sIds=new Set(layer.map(x=>x.id));
 for(const row of Object.values(localGet()))if(!sIds.has(row.id)&&!sKeys.has(row.anchor+"|"+row.type))layer.push(row);
 const s=layer.map(x=>x.id).join(",");if(s===sig)return;sig=s;
 const set=layer.find(x=>x.type==="setting");auxOn=!set||!JSON.parse(set.data||"{}").auxOff;
 if(set&&JSON.parse(set.data||"{}").mode){mode=JSON.parse(set.data||"{}").mode;if(document.getElementById("modeToggle"))document.getElementById("modeToggle").value=mode;}
 renderLayer();
}

function renderLayer(){
 document.querySelectorAll("mark.nb").forEach(m=>m.classList.remove("has-rec","has-note"));
 document.querySelectorAll(".nbImg,.nbHl").forEach(i=>i.remove());
 feed.innerHTML="";
 layer.forEach(it=>{
  if((it.type==="rec"||it.type==="note")&&it.anchor){
   const m=document.querySelector('mark.nb[data-a="'+CSS.escape(it.anchor)+'"]');
   if(m)m.classList.add("has-"+it.type);else ensureMark(it.anchor,it.type);}
  if(it.type==="draw")placeImg(it);
  if(it.type==="highlight")renderHighlight(it);
  if(it.type==="quiz"||it.type==="done"||(it.type==="note"&&!it.anchor)){
   const d=JSON.parse(it.data||"{}");
   feed.innerHTML+="<div>"+(it.type==="done"?"✅ concluída":it.type==="quiz"?"📝 quiz "+d.score+"%":"📝 "+(it.anchor||"traduções"))+" · <i>"+it.author+"</i></div>";}
 });
 if(!feed.innerHTML)feed.innerHTML='<div class="dim">Nada ainda — destaque um texto e anote ou grave algo.</div>';
}

async function placeImg(it){
 let j=null;
 if(it.b64)j={b64:it.b64,mime:it.mime||"image/png"};
 else if(it.fileId){try{const r=await fetch(BACKPACK+"?action=file&id="+it.fileId);j=await r.json();}catch(e){return}}
 if(!j||!j.b64)return;
 const d=JSON.parse(it.data||"{}");
 const img=document.createElement("img");img.className="nbImg";img.dataset.id=it.id;
 img.src=b64url(j.b64,j.mime);
 img.style.cssText="position:absolute;left:"+(d.left||0)+"px;top:"+(d.top||0)+"px;max-width:calc(100% - 40px);border:0;z-index:4;";
 document.getElementById("page").appendChild(img);
}
window.__B=true;
