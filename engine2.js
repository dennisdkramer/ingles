/* MOTOR 2 — topbar, camadas, quiz */
document.querySelectorAll(".listen").forEach(b=>b.onclick=()=>{const u=new SpeechSynthesisUtterance(b.dataset.say);u.lang="en-US";u.rate=.9;speechSynthesis.cancel();speechSynthesis.speak(u)});
(async()=>{try{
 let extra="";
 if(gate.teacher){
  const ac=await(await fetch("../access.json?"+Date.now())).json();
  const st=Object.entries(ac.students||{}).filter(([e,s])=>s.track===TRACK);
  extra=' <select id="sel"><option value="'+gate.email+'">demo (você)</option>'+st.map(([e,s])=>'<option value="'+e+'">'+(s.name||e)+"</option>").join("")+"</select>";
  if(TRACK==="kids")extra+=' <button id="mute">🔕 aux off</button>';
 }
 topbar.innerHTML='🦺 '+gate.email+' · <b>'+TRACK+'</b> · <a href="../portal.html">índice</a> · <button id="sync">🔄</button> · <button id="draw">✏️ rabiscar</button> · <span class="dim">Ctrl+V cola imagem</span>'+extra;
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
 const loc2=localGet();layer.forEach(r=>{if(r.type==="rec"&&!r.b64){for(const k in loc2){const q=loc2[k];if(q.type==="rec"&&q.anchor===r.anchor&&q.b64){r.b64=q.b64;break}}}});
 const s=layer.map(x=>x.id).join(",");if(s===sig)return;sig=s;
 const set=layer.find(x=>x.type==="setting");auxOn=!set||!JSON.parse(set.data||"{}").auxOff;
 document.getElementById("draw").style.display=auxOn?"":"none";
 renderLayer();
}
function renderLayer(){
 document.querySelectorAll("mark.nb").forEach(m=>m.replaceWith(document.createTextNode(m.textContent)));
 document.querySelectorAll(".nbImg").forEach(i=>i.remove());
 feed.innerHTML="";
 layer.forEach(it=>{
  if((it.type==="rec"||it.type==="note")&&it.anchor)ensureMark(it.anchor,it.type);
  if(it.type==="draw"||it.type==="img")placeImg(it);
  if(it.type==="quiz"||it.type==="done"||(it.type==="note"&&!it.anchor)){
   const d=JSON.parse(it.data||"{}");
   feed.innerHTML+="<div>"+(it.type==="done"?"✅ concluída":it.type==="quiz"?"📝 quiz "+d.score+"%":"📝 "+(it.anchor||"traduções"))+" · <i>"+it.author+"</i></div>";}
 });
 if(!feed.innerHTML)feed.innerHTML='<div class="dim">Nada ainda — destaque um texto e anote ou grave algo.</div>';
}
function ensureMark(t,type){
 let m=document.querySelector('mark.nb[data-a="'+CSS.escape(t)+'"]');
 if(!m){const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
  while(n=w.nextNode()){const i=n.data.indexOf(t);if(i>-1){const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+t.length);
   m=document.createElement("mark");m.className="nb";m.dataset.a=t;try{r.surroundContents(m)}catch(e){return}break}}}
 if(m)m.classList.add("has-"+type);
}
async function placeImg(it){
 if(!it.fileId&&!it.b64)return;let j;
 if(it.fileId){const r=await fetch(BACKPACK+"?action=file&id="+it.fileId);j=await r.json();}
 else j={b64:it.b64,mime:it.mime||"image/png"};
 const d=JSON.parse(it.data||"{}");
 const b=Uint8Array.from(atob(j.b64),c=>c.charCodeAt(0));
 const img=document.createElement("img");img.className="nbImg";img.src=URL.createObjectURL(new Blob([b],{type:j.mime}));
 img.style.top=(d.top||0)+"px";document.getElementById("page").appendChild(img);
}
async function showAnchor(a,x,y){
 const items=layer.filter(z=>z.anchor===a&&(z.type==="rec"||z.type==="note"));
 let html='<b style="font-size:14px">'+a.slice(0,46)+"</b><br>";
 const recs=items.filter(z=>z.type==="rec");
 if(recs.length){const it=recs[recs.length-1],d=JSON.parse(it.data||"{}");
  html+='<audio controls data-f="'+(it.fileId||"")+'" data-b="'+(it.b64||"")+'" style="width:100%"></audio><div class="dim">'+(d.fb||"")+"</div>";}
 items.filter(z=>z.type==="note").forEach(z=>{html+='<div style="margin:4px 0;border-left:3px solid var(--blue);padding:2px 6px"><i>'+z.author+":</i> "+z.data+"</div>"});
 html+='<button id="pR">⏺ '+(recs.length?"regravar":"gravar")+'</button><button id="pN">📝 anotar</button> <button id="pX">fechar</button>';
 openPop(a,x,y,html);
 const au=pop.querySelector("audio");
 if(au){au.onerror=()=>{pop.insertAdjacentHTML("beforeend",'<div class="dim">⚠ o áudio não carregou.</div>')};
  if(au.dataset.b){const b=Uint8Array.from(atob(au.dataset.b),c=>c.charCodeAt(0));au.src=URL.createObjectURL(new Blob([b],{type:"audio/webm"}));}
  else if(au.dataset.f){fetch(BACKPACK+"?action=file&id="+au.dataset.f).then(r=>{if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(j=>{if(!j.b64)throw new Error("resposta sem áudio");const b=Uint8Array.from(atob(j.b64),c=>c.charCodeAt(0));au.src=URL.createObjectURL(new Blob([b],{type:j.mime||"audio/webm"}))}).catch(er=>{pop.insertAdjacentHTML("beforeend",'<div class="dim">⚠ erro ao buscar no caderno: '+er.message+"</div>");au.src="https://docs.google.com/uc?export=open&id="+au.dataset.f;});}}
 pop.querySelector("#pR").onclick=()=>rec(a);
 pop.querySelector("#pN").onclick=()=>{pop.insertAdjacentHTML("beforeend",'<textarea id="nt" rows="2" placeholder="nova anotação…"></textarea><br><button id="ns">💾 salvar</button>');
  pop.querySelector("#ns").onclick=()=>{const v=pop.querySelector("#nt").value.trim();if(v)send({action:"add",type:"note",anchor:a,data:v});closePop();};};
 pop.querySelector("#pX").onclick=closePop;
}
let cv,ctx,drawing=false,drawTop=0;
function drawToggle(){if(!auxOn)return;
 if(!drawing){drawing=true;drawTop=scrollY;
  cv=document.createElement("canvas");cv.width=innerWidth;cv.height=innerHeight;
  cv.style.cssText="position:fixed;inset:0;z-index:8;cursor:crosshair";document.body.appendChild(cv);
  ctx=cv.getContext("2d");ctx.strokeStyle="#b3261e";ctx.lineWidth=3;ctx.lineCap="round";
  cv.onpointerdown=e=>{ctx.beginPath();ctx.moveTo(e.clientX,e.clientY);cv.setPointerCapture(e.pointerId);ctx._d=1};
  cv.onpointermove=e=>{if(ctx._d){ctx.lineTo(e.clientX,e.clientY);ctx.stroke()}};
  cv.onpointerup=()=>ctx._d=0;draw.textContent="💾 salvar rabisco";}
 else{drawing=false;const b64=cv.toDataURL("image/png").split(",")[1];cv.remove();draw.textContent="✏️ rabiscar";
  send({action:"add",type:"draw",b64,mime:"image/png",data:JSON.stringify({top:drawTop})})}}
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
