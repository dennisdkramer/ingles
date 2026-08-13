/* MOTOR 2 — topbar, camadas, quiz, áudio com cache, desenho persistente */
document.querySelectorAll(".listen").forEach(b=>b.onclick=()=>{const u=new SpeechSynthesisUtterance(b.dataset.say);u.lang="en-US";u.rate=.9;speechSynthesis.cancel();speechSynthesis.speak(u)});
(async()=>{try{
 let extra="";
 if(gate.teacher){
  const ac=await(await fetch("../access.json?"+Date.now())).json();
  const st=Object.entries(ac.students||{}).filter(([e,s])=>s.track===TRACK);
  extra=' <select id="sel"><option value="'+gate.email+'">demo (você)</option>'+st.map(([e,s])=>'<option value="'+e+'">'+(s.name||e)+"</option>").join("")+"</select>";
  if(TRACK==="kids")extra+=' <button id="mute">🔕 aux off</button>';
 }
 topbar.innerHTML='🦺 '+gate.email+' · <b>'+TRACK+'</b> · <a href="../portal.html">Index</a> · <button id="sync">🔄</button> · <button id="draw">✏️ Draw</button> · <span class="dim">Ctrl+V pastes an image</span>'+extra;
 if(gate.teacher){sel.onchange=()=>{STUDENT=sel.value;sig="";loadLayer()};
  const m=document.getElementById("mute");if(m)m.onclick=()=>{auxOn=!auxOn;send({action:"set",data:JSON.stringify({auxOff:!auxOn})});m.textContent=auxOn?"🔕 aux off":"🔔 aux on"};}
 document.getElementById("sync").onclick=()=>{sig="";loadLayer()};
 document.getElementById("draw").onclick=drawToggle;
 loadLayer();setInterval(loadLayer,15000);
}catch(e){let b=document.getElementById("errb");if(b)b.innerHTML+=" · topbar: "+e.message}})();
async function loadLayer(){
 try{const r=await fetch(BACKPACK+"?action=layer&email="+encodeURIComponent(STUDENT)+"&lesson="+L);
  layer=(await r.json()).rows||[];}catch(e){layer=[];}
 const sKeys=new Set(layer.map(x=>x.anchor+"|"+x.type)),sIds=new Set(layer.map(x=>x.id));
 for(const row of Object.values(localGet()))if(!sIds.has(row.id)&&!sKeys.has(row.anchor+"|"+row.type))layer.push(row);
 const s=layer.map(x=>x.id).join(",");if(s===sig)return;sig=s;
 const set=layer.find(x=>x.type==="setting");auxOn=!set||!JSON.parse(set.data||"{}").auxOff;
 document.getElementById("draw").style.display=auxOn?"":"none";
 layer.forEach(it=>{if(it.type==="rec"&&it.fileId&&!audioCache["f:"+it.fileId]){
  fetch(BACKPACK+"?action=file&id="+it.fileId).then(r=>r.json()).then(j=>{if(j.b64)audioCache["f:"+it.fileId]=b64url(j.b64,j.mime)}).catch(()=>{});}});
 renderLayer();
}
function renderLayer(){
 document.querySelectorAll("mark.nb").forEach(m=>m.classList.remove("has-rec","has-note"));
 document.querySelectorAll(".nbImg").forEach(i=>i.remove());
 feed.innerHTML="";
 layer.forEach(it=>{
  if((it.type==="rec"||it.type==="note")&&it.anchor){
   const m=document.querySelector('mark.nb[data-a="'+CSS.escape(it.anchor)+'"]');
   if(m)m.classList.add("has-"+it.type);else ensureMark(it.anchor,it.type);}
  if(it.type==="draw"||it.type==="img")placeImg(it);
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
 const img=document.createElement("img");img.className="nbImg";img.src=b64url(j.b64,j.mime);
 img.style.top=(d.top||0)+"px";img.style.border="0";img.style.pointerEvents="none";
 // Only clickable for deletion while holding Shift - otherwise completely inert
 if(it.author===who()||gate.teacher){
  document.addEventListener("keydown",function shiftHandler(e){
   if(e.key==="Shift"){img.style.pointerEvents="auto";img.style.cursor="pointer";}
  });
  document.addEventListener("keyup",function shiftHandler(e){
   if(e.key==="Shift"){img.style.pointerEvents="none";img.style.cursor="default";}
  });
  img.onmousedown=(e)=>{if(e.shiftKey){e.preventDefault();e.stopPropagation();if(confirm("Delete this drawing?")){
   // Remove from local layer array immediately to prevent reappearance on reload
   const idx=layer.findIndex(x=>x.id===it.id);if(idx>=0)layer.splice(idx,1);
   send({action:"del",id:it.id,type:it.type});img.remove();}}};
 }
 document.getElementById("page").appendChild(img);
}
async function showAnchor(a,x,y){
 window.currentAnchor=a;
 const items=layer.filter(z=>z.anchor===a&&(z.type==="rec"||z.type==="note"));
 const recs=items.filter(z=>z.type==="rec");
 const notes=items.filter(z=>z.type==="note");
 const note=notes.length?notes[notes.length-1]:null;
 let html='<b style="font-size:14px">'+a.slice(0,46)+'</b><div id="auhold"></div>';
 if(note)html+='<div style="margin:4px 0;border-left:3px solid var(--blue);padding:2px 6px"><i>'+note.author+":</i> "+note.data+"</div>";
 html+='<span style="white-space:nowrap"><button id="pH">▶ Hear</button><button id="pR">⏺ Record</button><button id="pN">📝 Note</button><button id="pX">✖ Close</button></span>';
 openPop(a,x,y,html);
 pop.querySelector("#pH").onclick=()=>{const u=new SpeechSynthesisUtterance(a);u.lang="en-US";u.rate=.95;speechSynthesis.cancel();speechSynthesis.speak(u)};
 const hold=pop.querySelector("#auhold");
 const it=recs.length?recs[recs.length-1]:null;
 const cached=audioCache["a:"+a]||(it&&it.fileId?audioCache["f:"+it.fileId]:null);
 if(it||cached){
  const au=document.createElement("audio");au.controls=true;au.style.width="100%";
  au.onerror=()=>{hold.insertAdjacentHTML("beforeend",'<div class="dim">⚠ o áudio não carregou.</div>')};
  hold.appendChild(au);
  if(it){const d=JSON.parse(it.data||"{}");if(d.fb)hold.insertAdjacentHTML("beforeend",'<div class="dim">'+d.fb+"</div>");}
  if(cached){au.src=cached;}
  else if(it&&it.fileId){
   hold.insertAdjacentHTML("beforeend",'<div class="dim" id="ldmsg"><span class="spin"></span> carregando…</div>');
   const kill=setTimeout(()=>{const m=document.getElementById("ldmsg");if(m)m.innerHTML="⚠ nao encontrado";},4000);
   fetch(BACKPACK+"?action=file&id="+it.fileId).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(j=>{
    if(!j.b64)throw new Error("sem áudio");
    const u=b64url(j.b64,j.mime);audioCache["f:"+it.fileId]=u;au.src=u;clearTimeout(kill);
    const m=document.getElementById("ldmsg");if(m)m.remove();}).catch(()=>{clearTimeout(kill);
    const m=document.getElementById("ldmsg");if(m)m.innerHTML="⚠ nao encontrado";});
  }
 }
 pop.querySelector("#pR").onclick=()=>rec(a);
 pop.querySelector("#pN").onclick=()=>{pop.insertAdjacentHTML("beforeend",'<textarea id="nt" rows="2" placeholder="write a note…"></textarea><br><button id="ns">💾 Save</button>');
  const ta=pop.querySelector("#nt");if(note)ta.value=note.data;
  pop.querySelector("#ns").onclick=()=>{const v=ta.value.trim();if(v)send({action:"add",type:"note",anchor:a,data:v});closePop();};};
 pop.querySelector("#pX").onclick=closePop;
}
/* desenho: barra flutuante própria (nunca fica presa) + Esc + persistente */
let cv,ctx,drawing=false,drawTop=0,drawbar=null;
function drawToggle(){if(!auxOn)return;
 if(!drawing){drawing=true;drawTop=scrollY;
  cv=document.createElement("canvas");cv.width=innerWidth;cv.height=innerHeight;
  cv.style.cssText="position:fixed;inset:0;z-index:8;cursor:crosshair;touch-action:none";document.body.appendChild(cv);
  ctx=cv.getContext("2d");ctx.strokeStyle="#b3261e";ctx.lineWidth=3;ctx.lineCap="round";
  cv.onpointerdown=e=>{ctx.beginPath();ctx.moveTo(e.clientX,e.clientY);cv.setPointerCapture(e.pointerId);ctx._d=1};
  cv.onpointermove=e=>{if(ctx._d){ctx.lineTo(e.clientX,e.clientY);ctx.stroke()}};
  cv.onpointerup=()=>ctx._d=0;
  drawbar=document.createElement("div");drawbar.className="pop";
  drawbar.style.cssText="position:fixed;top:10px;right:10px;z-index:12";
  drawbar.innerHTML='<button id="dSave">💾 Save drawing</button> <button id="dCancel">✖ Cancel</button>';
  document.body.appendChild(drawbar);
  drawbar.querySelector("#dSave").onclick=()=>endDraw(true);
  drawbar.querySelector("#dCancel").onclick=()=>endDraw(false);
 } else endDraw(true);}
function endDraw(save){drawing=false;
 if(drawbar){drawbar.remove();drawbar=null}
 if(!cv)return;
 if(save){const b64=cv.toDataURL("image/png").split(",")[1];
  send({action:"add",type:"draw",b64,mime:"image/png",data:JSON.stringify({top:drawTop})});}
 cv.remove();cv=null;}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&drawing)endDraw(false)});
document.addEventListener("paste",e=>{if(!auxOn)return;
 const it=[...e.clipboardData.items].find(i=>i.type.startsWith("image/"));if(!it)return;
 const f=it.getAsFile(),r=new FileReader();
 r.onload=()=>send({action:"add",type:"img",b64:r.result.split(",")[1],mime:f.type,data:JSON.stringify({top:scrollY})});
 r.readAsDataURL(f)});
function grade(scope,type){let ok=0,tot=0,det=[];
 scope.querySelectorAll("input.gap").forEach(i=>{tot++;const good=(i.dataset.a||"").split("|").map(norm).includes(norm(i.value));
  i.classList.toggle("ok",good);i.classList.toggle("bad",!good);if(good)ok++;det.push({q:i.dataset.a,you:i.value,ok:good})});
 scope.querySelectorAll("fieldset[data-c]").forEach(f=>{tot++;const s=f.querySelector("input:checked");const good=!!s&&s.value===f.dataset.c;
  f.classList.toggle("ok",good);f.classList.toggle("bad",!good);if(good)ok++;det.push({q:f.dataset.q,ok:good})});
 const pct=tot?Math.round(100*ok/tot):0;scope.querySelector(".res").innerHTML="Resultado: <b>"+ok+"/"+tot+" ("+pct+"%)</b>";
 if(type==="quiz"){send({action:"add",type:"quiz",data:JSON.stringify({score:pct,det})});
  const p=JSON.parse(localStorage.getItem("prog_"+gate.email)||"{}");p[TRACK+"_"+L]=Object.assign(p[TRACK+"_"+L]||{},{score:pct});
  localStorage.setItem("prog_"+gate.email,JSON.stringify(p));}}
bPrac.onclick=()=>grade(prac,"practice");
bQuiz.onclick=()=>grade(quiz,"quiz");
sendTr.onclick=()=>{send({action:"add",type:"note",anchor:"Traduções do quiz",data:trw.value})};
done.onclick=()=>{const p=JSON.parse(localStorage.getItem("prog_"+gate.email)||"{}");
 p[TRACK+"_"+L]=Object.assign(p[TRACK+"_"+L]||{},{done:true,date:Date.now()});
 localStorage.setItem("prog_"+gate.email,JSON.stringify(p));send({action:"add",type:"done",data:"{}"});
 if(L>=COUNT)mNext.style.display="none";modal.style.display="block"};
mNext.onclick=()=>location="lesson"+(L+1)+".html";
mIndex.onclick=()=>location="../portal.html";
window.__B=true;
