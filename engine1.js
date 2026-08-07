/* MOTOR 1 — popup, gravação, caderno, âncoras robustas */
window.addEventListener("error",e=>{let b=document.getElementById("errb");
 if(!b){b=document.createElement("div");b.id="errb";b.style.cssText="background:#a33327;color:#fff;padding:8px 12px;font:14px system-ui;text-align:center";document.body.prepend(b);}
 b.innerHTML="⚠ ERRO: "+e.message;});
const h=s=>{let x=0;for(const c of s)x=(x*31+c.charCodeAt(0))|0;return x};
const norm=s=>(s||"").toLowerCase().replace(/[^a-z']/g,"");
let gate=null;try{gate=JSON.parse(sessionStorage.gate)}catch(e){}
if(!gate||h(gate.email+gate.track+SECRET)!==gate.sig||(!gate.teacher&&gate.track!==TRACK))location.replace("../portal.html");
const who=()=>gate.teacher?"prof":"aluno";
let STUDENT=gate.email, layer=[], sig="", auxOn=true;
const LKEY="nb_"+gate.email+"_"+TRACK+"_"+L;
const localGet=()=>{try{return JSON.parse(localStorage.getItem(LKEY)||"{}")}catch(e){return{}}};
function toast(m){const t=document.getElementById("toast");t.textContent=m;t.style.display="block";clearTimeout(t._x);t._x=setTimeout(()=>t.style.display="none",2600)}
function b64url(b64,mime){const b=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));return URL.createObjectURL(new Blob([b],{type:mime||"audio/webm"}))}
function send(o){o.email=STUDENT;o.lesson=L;o.author=who();o.id=Date.now()+"_"+Math.floor(Math.random()*9999);
 const keep=Object.assign({},o);
 try{const s=localGet();s[o.id]=keep;localStorage.setItem(LKEY,JSON.stringify(s))}
 catch(e){try{delete keep.b64;const s=localGet();s[o.id]=keep;localStorage.setItem(LKEY,JSON.stringify(s))}catch(e2){}}
 fetch(BACKPACK,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain"},body:JSON.stringify(o)}).catch(()=>{});
 setTimeout(()=>{sig="";loadLayer()},600);
 setTimeout(async()=>{try{const r=await fetch(BACKPACK+"?action=layer&email="+encodeURIComponent(STUDENT)+"&lesson="+L);
  const rows=(await r.json()).rows||[];toast(rows.some(x=>x.id===o.id)?"💾 salvo no caderno compartilhado ✔":"⚠ salvo apenas neste dispositivo");}
  catch(e){toast("⚠ salvo apenas neste dispositivo")}},1800);}
/* ---- popup de seleção ---- */
let pop=null,pendingRange=null;
const closePop=()=>{if(pop){pop.remove();pop=null}};
function openPop(t,x,y,html){closePop();pop=document.createElement("div");pop.className="pop";pop.style.left=x+"px";pop.style.top=y+"px";pop.innerHTML=html;document.body.appendChild(pop);return pop}
document.addEventListener("mousedown",e=>{if(pop&&!pop.contains(e.target))closePop()});
document.addEventListener("mouseup",e=>{try{
 const t=getSelection().toString().trim();
 if(t.length<3||t.length>200||e.target.closest(".pop"))return;
 pendingRange=getSelection().rangeCount?getSelection().getRangeAt(0).cloneRange():null;
 const x=Math.min(e.clientX,innerWidth-370),y=e.clientY+8;
 openPop(t,x,y,'<b style="font-size:14px">'+t.slice(0,42)+(t.length>42?"…":"")+'</b><br><button id="pH">▶ Hear</button><button id="pR">⏺ Record</button><button id="pN">📝 Note</button>');
 pop.querySelector("#pH").onclick=()=>{const u=new SpeechSynthesisUtterance(t);u.lang="en-US";u.rate=.95;speechSynthesis.cancel();speechSynthesis.speak(u)};
 pop.querySelector("#pR").onclick=()=>{wrapRange(t,pendingRange);rec(t)};
 pop.querySelector("#pN").onclick=()=>{wrapRange(t,pendingRange);
  openPop(t,x,y,'<textarea id="nt" rows="3" placeholder="escreva a anotação…"></textarea><br><button id="ns">💾 salvar</button> <button id="px">cancelar</button>');
  pop.querySelector("#ns").onclick=()=>{const v=pop.querySelector("#nt").value.trim();if(v)send({action:"add",type:"note",anchor:t,data:v});closePop();};
  pop.querySelector("#px").onclick=closePop;};
}catch(err){let b=document.getElementById("errb");if(b)b.innerHTML+=" · popup: "+err.message}});
document.addEventListener("click",e=>{const m=e.target.closest("mark.nb");if(!m)return;e.stopPropagation();
 if(window.showAnchor)showAnchor(m.dataset.a,Math.min(e.clientX,innerWidth-370),e.clientY+8)});
/* ---- âncoras: envolve a seleção exata; encontra texto mesmo dividido entre elementos ---- */
function wrapRange(t,r){if(!r)return document.querySelector('mark.nb[data-a="'+CSS.escape(t)+'"]');
 const m=document.createElement("mark");m.className="nb";m.dataset.a=t;
 try{m.appendChild(r.extractContents());r.insertNode(m)}catch(e){return null}
 return m}
function findRange(t){
 const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const nodes=[];let all="";let n;
 while(n=w.nextNode()){if(n.parentElement&&n.parentElement.closest("script,style,.pop,mark.nb"))continue;nodes.push({n,start:all.length});all+=n.data;}
 const i=all.indexOf(t);if(i<0)return null;const end=i+t.length;let a=null,b=null;
 for(const o of nodes){if(!a&&o.start<=i&&i<o.start+o.n.data.length)a={n:o.n,off:i-o.start};
  if(!b&&o.start<end&&end<=o.start+o.n.data.length)b={n:o.n,off:end-o.start};}
 if(!a||!b)return null;
 const r=document.createRange();r.setStart(a.n,a.off);r.setEnd(b.n,b.off);return r;
}
function ensureMark(t,type){
 let m=document.querySelector('mark.nb[data-a="'+CSS.escape(t)+'"]');
 if(!m){const r=findRange(t);if(!r)return;m=document.createElement("mark");m.className="nb";m.dataset.a=t;
  try{m.appendChild(r.extractContents());r.insertNode(m)}catch(e){return}}
 m.classList.add("has-"+type);
}
/* ---- gravação: fecha após 2s de silêncio (máx 10s), indicador 🎙 + spinner ---- */
async function rec(t){let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){alert("Microfone bloqueado — abra a lição em aba própria.");return}
 closePop();
 const ind=document.createElement("div");ind.className="pop recind";
 ind.innerHTML='<span class="pulse">🎙</span> gravando… <b style="font-size:12px">'+t.slice(0,30)+"</b>";
 document.body.appendChild(ind);
 const mr=new MediaRecorder(stream),ch=[];mr.ondataavailable=e=>ch.push(e.data);mr.start();
 const R=new(window.SpeechRecognition||window.webkitSpeechRecognition)();R.lang="en-US";let heard="";
 R.onresult=e=>heard=e.results[0][0].transcript;try{R.start()}catch(e){}
 let ac=null,an=null,buf=null,lastLoud=0,everLoud=false,done=false;const t0=Date.now();
 try{ac=new(window.AudioContext||window.webkitAudioContext)();
  const srcn=ac.createMediaStreamSource(stream);an=ac.createAnalyser();an.fftSize=512;srcn.connect(an);
  buf=new Uint8Array(an.frequencyBinCount);}catch(e){}
 let sil=null;
 const finish=()=>{if(done)return;done=true;if(sil)clearInterval(sil);
  mr.stop();try{R.stop()}catch(e){}stream.getTracks().forEach(x=>x.stop());if(ac)ac.close();
  ind.innerHTML='<span class="spin"></span> processando…';
  const f=new FileReader();f.onload=()=>{const fb=feedback(t,heard);
   send({action:"add",type:"rec",anchor:t,b64:f.result.split(",")[1],mime:"audio/webm",data:JSON.stringify({score:fb.score,heard,fb:fb.msg})});
   ind.remove();};
  f.readAsDataURL(new Blob(ch,{type:"audio/webm"}));};
 sil=setInterval(()=>{
  if(an){an.getByteTimeDomainData(buf);let loud=false;
   for(let i=0;i<buf.length;i++){if(Math.abs(buf[i]-128)>14){loud=true;break}}
   if(loud){lastLoud=Date.now();everLoud=true}
   if(everLoud&&Date.now()-lastLoud>2000)return finish();}
  if(Date.now()-t0>10000)return finish();
 },100);
}
function feedback(target,heard){const T=norm(target).split(/\s+/),H=norm(heard).split(/\s+/);
 if(!heard)return{score:0,msg:"Não ouvi nada — fale perto do microfone."};
 let ok=0;const notes=[];T.forEach((w,i)=>{const hw=H[i];if(hw===w)ok++;else notes.push(hint(w,hw||"(sumiu)"))});
 if(H.length!==T.length)notes.push("Ritmo: "+H.length+" palavras ouvidas vs "+T.length+" do alvo — as palavrinhas (to, the, a) quase somem.");
 return{score:Math.round(100*ok/T.length),msg:ok===T.length?"🎉 Soou nativo!":"Ouvi: “"+heard+"”. "+notes.join(" ")}}
function hint(w,hw){let tip="";
 if(/th/.test(w)&&/^[tdfv]/.test(hw))tip="“th” = língua entre os dentes (ouça com ▶).";
 if(/s$/.test(w)&&!/s$/.test(hw))tip="O “s” final sumiu.";
 return 'Alvo: “'+w+'” (o computador entendeu “'+hw+'”).'+(tip?" "+tip:" Ouça o trecho com ▶ e compare.")}
window.__A=true;

