/* MOTOR 2 — topbar, camadas, quiz, áudio com cache, desenho/realce persistentes */
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
  const m=document.getElementById("mute");if(m)m.onclick=()=>{auxOn=!auxOn;send({action:"set",data:JSON.stringify({auxOff:!auxOn})});m.textContent=auxOn?"🔕 aux off":"🔔 aux on"};}
 // Mode toggle: off/limit/teacher
 topbar.insertAdjacentHTML("beforeend",' <select id="modeToggle"><option value="off">off</option><option value="limit">limit</option><option value="teacher">teacher only</option></select>');
 const modeSel=document.getElementById("modeToggle");
 modeSel.onchange=()=>{mode=modeSel.value;send({action:"set",data:JSON.stringify({mode})});};
 document.getElementById("sync").onclick=()=>{sig="";loadLayer()};
 loadLayer();setInterval(loadLayer,15000);
 setupDrawing();setupUndo();
}catch(e){let b=document.getElementById("errb");if(b)b.innerHTML+=" · topbar: "+e.message}})();

let mode="off"; // off, limit, teacher
let undoStack=[];
function pushUndo(action){undoStack.push(action);if(undoStack.length>50)undoStack.shift();}

function setupUndo(){
 document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="z"){e.preventDefault();doUndo();}});
 const ub=document.createElement("button");ub.id="undoBtn";ub.textContent="↶";ub.title="Desfazer (Ctrl+Z)";
 ub.style.cssText="position:fixed;top:10px;right:10px;z-index:100;padding:6px 10px;font-size:16px;border-radius:8px;";
 ub.onclick=()=>doUndo();
 document.body.appendChild(ub);
}

function doUndo(){
 if(!undoStack.length)return;
 const last=undoStack.pop();
 if(last.type==="draw"||last.type==="highlight"){send({action:"del",id:last.id,type:last.type});}
 else if(last.type==="input"){last.el.value=last.prev;}
 else if(last.type==="radio"){const r=last.el.querySelector('input[value="'+last.prev+'"]');if(r)r.checked=true;}
}

let cv,ctx,drawing=false,lastX=0,lastY=0,touches={};
function setupDrawing(){
 const page=document.getElementById("page");
 page.style.position="relative";page.style.overflow="hidden";
 
 page.addEventListener("mousedown",e=>{
  if(mode==="teacher"&&!gate.teacher)return;
  if(mode==="limit"&&!gate.teacher)return;
  if(e.shiftKey&&e.button===2){e.preventDefault();handleDelete(e);return;}
  if(e.shiftKey&&e.button===0){e.preventDefault();startDraw(e.clientX,e.clientY);return;}
  if((e.ctrlKey||e.metaKey)&&e.button===0){e.preventDefault();handleHighlight(e);return;}
 });
 
 page.addEventListener("mousemove",e=>{if(drawing){doDraw(e.clientX,e.clientY);}});
 page.addEventListener("mouseup",e=>{if(drawing){endDraw();}});
 page.addEventListener("contextmenu",e=>{if(e.shiftKey)e.preventDefault();});
 
 page.addEventListener("touchstart",e=>{
  if(mode==="teacher"&&!gate.teacher)return;
  if(mode==="limit"&&!gate.teacher)return;
  touches[e.touches[0].identifier]={x:e.touches[0].clientX,y:e.touches[0].clientY,time:Date.now()};
  if(e.touches.length===2){e.preventDefault();startDraw(e.touches[0].clientX,e.touches[0].clientY);}
  if(e.touches.length===3){e.preventDefault();handleHighlightTouch(e);}
  if(e.touches.length===4){e.preventDefault();handleDeleteTouch(e);}
 },{passive:false});
 
 page.addEventListener("touchmove",e=>{
  if(drawing&&e.touches.length===2){e.preventDefault();doDraw(e.touches[0].clientX,e.touches[0].clientY);}
 },{passive:false});
 
 page.addEventListener("touchend",e=>{
  if(drawing&&e.touches.length<2){endDraw();}
  delete touches[e.changedTouches[0].identifier];
 });
}

function startDraw(x,y){
 if(!auxOn)return;
 drawing=true;lastX=x;lastY=y;
 cv=document.createElement("canvas");
 cv.style.cssText="position:absolute;inset:0;z-index:5;pointer-events:none;touch-action:none";
 cv.width=document.getElementById("page").offsetWidth;
 cv.height=document.getElementById("page").offsetHeight;
 document.getElementById("page").appendChild(cv);
 ctx=cv.getContext("2d");
 ctx.strokeStyle="#b3261e";ctx.lineWidth=3;ctx.lineCap="round";
 ctx.beginPath();ctx.moveTo(lastX-cv.offsetLeft,lastY-cv.offsetTop);
}

function doDraw(x,y){
 if(!drawing||!ctx)return;
 const nx=x-cv.offsetLeft,ny=y-cv.offsetTop;
 ctx.lineTo(nx,ny);ctx.stroke();ctx.beginPath();ctx.moveTo(nx,ny);
 lastX=x;lastY=y;
}

function endDraw(){
 if(!drawing||!cv)return;
 drawing=false;
 const b64=cv.toDataURL("image/png").split(",")[1];
 const top=cv.offsetTop+scrollY;
 const id="d_"+Date.now()+"_"+Math.random().toString(36).slice(2);
 send({action:"add",type:"draw",b64,mime:"image/png",data:JSON.stringify({top}),id});
 pushUndo({type:"draw",id});
 cv.remove();cv=null;
}

function handleHighlight(e){
 const rect=document.getElementById("page").getBoundingClientRect();
 const x=e.clientX-rect.left,y=e.clientY-rect.top;
 const id="h_"+Date.now()+"_"+Math.random().toString(36).slice(2);
 const hl={type:"highlight",x,y,hW:8,hH:20,id,color:"#fef08a"};
 renderHighlight(hl);
 send({action:"add",type:"highlight",data:JSON.stringify(hl),id});
 pushUndo({type:"draw",id});
}

function handleHighlightTouch(e){
 const t=e.touches[0],rect=document.getElementById("page").getBoundingClientRect();
 const x=t.clientX-rect.left,y=t.clientY-rect.top;
 const id="h_"+Date.now()+"_"+Math.random().toString(36).slice(2);
 const hl={type:"highlight",x,y,hW:8,hH:20,id,color:"#fef08a"};
 renderHighlight(hl);
 send({action:"add",type:"highlight",data:JSON.stringify(hl),id});
 pushUndo({type:"draw",id});
}

function renderHighlight(hl){
 const div=document.createElement("div");
 div.className="nbHl";div.dataset.id=hl.id;
 const d=JSON.parse(hl.data||hl);
 div.style.cssText="position:absolute;left:"+(d.x-d.hW/2)+"px;top:"+(d.y-d.hH/2)+"px;width:"+d.hW+"px;height:"+d.hH+"px;background:"+d.color+";opacity:0.6;pointer-events:none;z-index:1";
 document.getElementById("page").appendChild(div);
}

function handleDelete(e){
 const rect=document.getElementById("page").getBoundingClientRect();
 const x=e.clientX-rect.left,y=e.clientY-rect.top;
 checkDeleteAt(x,y);
}

function handleDeleteTouch(e){
 const t=e.changedTouches[0],rect=document.getElementById("page").getBoundingClientRect();
 const x=t.clientX-rect.left,y=t.clientY-rect.top;
 checkDeleteAt(x,y);
}

function checkDeleteAt(x,y){
 const items=document.querySelectorAll(".nbImg,.nbHl");
 let found=null;
 items.forEach(el=>{
  const r=el.getBoundingClientRect(),pr=document.getElementById("page").getBoundingClientRect();
  const ex=r.left-pr.left+el.offsetWidth/2,ey=r.top-pr.top+el.offsetHeight/2;
  const dist=Math.sqrt((x-ex)**2+(y-ey)**2);
  if(dist<5)found=el;
 });
 if(found){
  const id=found.dataset.id;
  if(id){
   const item=layer.find(it=>it.id===id);
   if(item&&(item.author===who()||gate.teacher)){
    send({action:"del",id:item.id,type:item.type});
    found.remove();
    pushUndo({type:"draw",id:item.id});
   }
  }
 }
}

async function loadLayer(){
 try{const r=await fetch(BACKPACK+"?action=layer&email="+encodeURIComponent(STUDENT)+"&lesson="+L);
  layer=(await r.json()).rows||[];}catch(e){layer=[];}
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
 img.style.cssText="position:absolute;left:20px;top:"+((d.top||0)-document.getElementById("page").offsetTop+scrollY)+"px;max-width:calc(100% - 40px);border:0;pointer-events:none;z-index:4";
 document.getElementById("page").appendChild(img);
}
