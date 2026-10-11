/* MOTOR 1 — popup, gravação, caderno, realce por trecho (Ctrl), âncoras robustas, seleção */
window.addEventListener("error",e=>{let b=document.getElementById("errb");
 if(!b){b=document.createElement("div");b.id="errb";b.style.cssText="background:#a33327;color:#fff;padding:8px 12px;font:14px system-ui;text-align:center";document.body.prepend(b);}
 b.innerHTML="⚠ ERRO: "+e.message;});
const h=s=>{let x=0;for(const c of s)x=(x*31+c.charCodeAt(0))|0;return x};
const norm=s=>(s||"").toLowerCase().replace(/[^a-z']/g,"");
let gate=null;try{gate=JSON.parse(sessionStorage.gate)}catch(e){}
if(!gate||h(gate.email+gate.track+SECRET)!==gate.sig||(!gate.teacher&&gate.track!==TRACK))location.replace("../portal.html");
const who=()=>gate.teacher?"prof":"aluno";
let STUDENT=gate.email, layer=[], sig="", auxOn=true;
const LKEY="nb_"+STUDENT+"_"+TRACK+"_"+L;
const localGet=()=>{try{return JSON.parse(localStorage.getItem(LKEY)||"{}")}catch(e){return{}}};
const audioCache={};
let popXY={x:20,y:90};
function toast(m){const t=document.getElementById("toast");t.textContent=m;t.style.display="block";clearTimeout(t._x);t._x=setTimeout(()=>t.style.display="none",2600)}
function b64url(b64,mime){const b=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));return URL.createObjectURL(new Blob([b],{type:mime||"audio/webm"}))}
function send(o){o.email=STUDENT;o.lesson=L;o.author=who();
 const isDel=(o.action==="del");
 if(!isDel&&!o.id)o.id=Date.now()+"_"+Math.floor(Math.random()*9999);
 fetch(BACKPACK,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify(o)})
  .then(r=>r.json())
  .then(j=>{
   if(isDel){
    if(j&&j.result==="deleted"){
     toast("🗑 apagado ✔");
     loadLayer();
     return;
    }
    toast("⚠ falha ao apagar (servidor)");
    return;
   }
   if(j&&j.result==="ok"){loadLayer();return;}
   throw new Error((j&&j.error)||"resposta inválida");
  })
  .catch(err=>{
   /* server unavailable or errored → keep a local copy so nothing is lost this session */
   if(!isDel){try{const s=localGet();s[o.id]=o;localStorage.setItem(LKEY,JSON.stringify(s))}catch(e){}
    toast("⚠ salvo apenas neste dispositivo");}
   else toast("⚠ servidor indisponível — apagar não confirmou");
  });
 setTimeout(()=>{if(window.currentAnchor&&window.currentAnchor===o.anchor&&pop&&window.showAnchor)window.showAnchor(o.anchor,popXY.x,popXY.y)},900);
 setTimeout(loadLayer,1800);}
let pop=null,pendingRange=null,lastSelText="";
const closePop=()=>{if(pop){pop.remove();pop=null}lastSelText=""};
function openPop(t,x,y,html){closePop();popXY={x,y};pop=document.createElement("div");pop.className="pop";
 pop.style.left=x+"px";pop.style.top=y+"px";pop.style.maxWidth="min(380px, calc(100vw - 16px))";
 pop.innerHTML=html;document.body.appendChild(pop);return pop}
document.addEventListener("mousedown",e=>{if(pop&&!pop.contains(e.target))closePop()});
/* seleção: abre só quando a seleção MUDA (funciona em mobile; não dispara ao clicar em botões) */
function trySelPopup(){
 const sel=getSelection();const t=sel?sel.toString().trim():"";
 if(!t||t.length<3||t.length>200)return;
 if(t===lastSelText)return;
 if(!sel.rangeCount)return;
 const r=sel.getRangeAt(0);
 const n=r.commonAncestorContainer;const el=n.nodeType===1?n:n.parentElement;
 if(el&&el.closest(".pop,script,style,button,textarea,input,select,a,label"))return;
 /* Ctrl held (or released <1s ago) = HIGHLIGHT: mark the text and suppress this popup */
 if(ctrlHeld||Date.now()-lastCtrlUp<900){
  const rc=r.cloneRange();
  try{sel.removeAllRanges()}catch(e){}
  lastSelText=t;
  hlApply(rc);
  return;
 }
 pendingRange=r.cloneRange();
 const rect=r.getBoundingClientRect();
 const x=Math.max(8,Math.min(rect.left||20,innerWidth-380)),y=(rect.bottom||60)+8;
 openPop(t,x,y,'<b style="font-size:14px">'+t.slice(0,42)+(t.length>42?"…":"")+'</b><br><span style="white-space:nowrap"><button id="pH">▶ Hear</button><button id="pR">⏺ Record</button><button id="pN">📝 Note</button></span>');
 pop.querySelector("#pH").onclick=()=>{const u=new SpeechSynthesisUtterance(t);u.lang="en-US";u.rate=.95;speechSynthesis.cancel();speechSynthesis.speak(u)};
 pop.querySelector("#pR").onclick=()=>{wrapRange(t,pendingRange);rec(t)};
 pop.querySelector("#pN").onclick=()=>{wrapRange(t,pendingRange);
  openPop(t,x,y,'<textarea id="nt" rows="3" placeholder="write a note…"></textarea><br><button id="ns">💾 Save</button> <button id="px">Cancel</button>');
  pop.querySelector("#ns").onclick=()=>{const v=pop.querySelector("#nt").value.trim();if(v)send({action:"add",type:"note",anchor:t,data:v});closePop();};
  pop.querySelector("#px").onclick=closePop;};
 lastSelText=t;
}
let selTimer=null;
document.addEventListener("selectionchange",()=>{clearTimeout(selTimer);selTimer=setTimeout(trySelPopup,350)});
document.addEventListener("touchend",()=>{clearTimeout(selTimer);selTimer=setTimeout(trySelPopup,450)});
document.addEventListener("click",e=>{const m=e.target.closest("mark.nb");if(!m)return;e.stopPropagation();
 /* Ctrl+click inside a highlight = delete it (never opens the Hear/Record/Note popup) */
 if((e.ctrlKey||e.metaKey)&&m.classList.contains("has-hl")){e.preventDefault();hlDelete(m);return}
 if(window.showAnchor)showAnchor(m.dataset.a,Math.max(8,Math.min(e.clientX,innerWidth-380)),e.clientY+8)});
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
/* ---- HIGHLIGHT (owner spec 2026-10-11) — text-range marker, PC only ---------------------
   Ctrl + select text             → highlight the selected string
   Ctrl + click inside a highlight → delete that highlight
   Ctrl + drag over a highlight    → merge/extend (overlapping or touching marks become one)
   Ctrl is held (or was released <1s ago) → the Hear/Record/Note popup is suppressed
   After creating, a tiny colour palette pops 10px above the LAST highlighted character
   (yellow / transparent red / transparent green); any click or key press closes it.
   Highlights are pegged to TEXT (survive resize/zoom), may span lines inside ONE block,
   never cross block elements, and coexist with a recording or a note on the same span. */
const HL_COLORS={yellow:"rgba(255,233,112,.55)",red:"rgba(255,64,64,.34)",green:"rgba(64,200,96,.34)"};
const HL_BLOCK=/^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DD|DETAILS|DIALOG|DIV|DL|DT|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|LI|MAIN|NAV|OL|P|PRE|SECTION|TABLE|TBODY|TD|TFOOT|TH|THEAD|TR|UL)$/;
let ctrlHeld=false,lastCtrlUp=0;
document.addEventListener("keydown",e=>{if(e.key==="Control"||e.key==="Meta")ctrlHeld=true},true);
document.addEventListener("keyup",e=>{if(e.key==="Control"||e.key==="Meta"){ctrlHeld=false;lastCtrlUp=Date.now()}},true);
addEventListener("blur",()=>{ctrlHeld=false});
/* any key press closes the colour palette (but never the note textarea popup) */
document.addEventListener("keydown",()=>{if(pop&&pop.classList.contains("hlpalpop"))closePop()},true);
function hlClosest(node){const el=node&&(node.nodeType===1?node:node.parentElement);return el&&el.closest?el.closest("mark.nb.has-hl"):null}
function hlColorOf(m){return m.classList.contains("hl-red")?"red":m.classList.contains("hl-green")?"green":"yellow"}
function hlPaint(m,c){m.classList.remove("hl-yellow","hl-red","hl-green");m.classList.add("hl-"+(HL_COLORS[c]?c:"yellow"))}
/* drop the highlight from a mark; if nothing else lives on it, put the text back */
function hlUnwrap(m){
 if(!m)return;
 const keep=m.classList.contains("has-rec")||m.classList.contains("has-note");
 m.classList.remove("has-hl","hl-yellow","hl-red","hl-green");delete m.dataset.hlid;
 if(keep||!m.parentNode)return;
 const p=m.parentNode;while(m.firstChild)p.insertBefore(m.firstChild,m);p.removeChild(m);
}
/* (node,offset) → character offset, counted over all text inside root */
function hlOffset(root,node,off){
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let a=0,n;
 while(n=w.nextNode()){if(n===node)return a+off;a+=n.data.length}
 return -1;
}
/* character offset → (node,offset) */
function hlPosition(root,at){
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let a=0,n;
 while(n=w.nextNode()){const len=n.data.length;if(at<=a+len)return{n,off:at-a};a+=len}
 return null;
}
function hlDelete(m){
 if(!m)return;
 const id=m.dataset.hlid,anchor=m.dataset.a;
 hlUnwrap(m);
 if(typeof pushUndo==="function")pushUndo({type:"hl",kind:"del",item:{type:"hl",anchor,data:{color:"yellow"},id}});
 closePop();
 /* network last: a failed save must never undo what the user just saw */
 if(id)send({action:"del",id});
}
function hlApply(r){
 if(!r)return;
 /* grow out of (and swallow) whatever highlight the selection start/end sits inside */
 const mS=hlClosest(r.startContainer),mE=hlClosest(r.endContainer);
 try{if(mS)r.setStartBefore(mS);if(mE)r.setEndAfter(mE)}catch(e){}
 const root=(()=>{const n=r.commonAncestorContainer;return n.nodeType===1?n:n.parentElement})();
 if(!root)return;
 const frag=r.cloneContents();
 if(frag.querySelectorAll&&[...frag.querySelectorAll("*")].some(x=>HL_BLOCK.test(x.tagName))){toast("Destaque só dentro de um mesmo bloco.");return}
 let s=hlOffset(root,r.startContainer,r.startOffset),e=hlOffset(root,r.endContainer,r.endOffset);
 if(s<0||e<0||e<=s){toast("Selecione um trecho de texto para destacar.");return}
 /* merge: every highlight that overlaps or touches [s,e] becomes part of the new one */
 const kill=[];let grew=true;
 while(grew){grew=false;
  root.querySelectorAll("mark.nb.has-hl").forEach(m=>{
   if(kill.indexOf(m)>=0)return;
   const mr=document.createRange();mr.selectNodeContents(m);
   const ms=hlOffset(root,mr.startContainer,mr.startOffset),me=hlOffset(root,mr.endContainer,mr.endOffset);
   if(ms<0||me<0)return;
   if(me>=s&&ms<=e){if(ms<s){s=ms;grew=true}if(me>e){e=me;grew=true}kill.push(m)}});
 }
 kill.forEach(m=>{if(m.dataset.hlid)send({action:"del",id:m.dataset.hlid});hlUnwrap(m)});
 const a=hlPosition(root,s),b=hlPosition(root,e);
 if(!a||!b){toast("Não foi possível destacar este trecho.");return}
 const nr=document.createRange();nr.setStart(a.n,a.off);nr.setEnd(b.n,b.off);
 const text=nr.toString();if(!text.trim())return;
 const m=wrapRange(text,nr);
 if(!m)return;
 m.classList.add("has-hl");hlPaint(m,"yellow");
 m.dataset.hlid=Date.now()+"_"+Math.floor(Math.random()*9999);
 if(typeof pushUndo==="function")pushUndo({type:"hl",kind:"add",id:m.dataset.hlid,el:m});
 hlPalette(m);
 /* network last: a failed save must never suppress the undo entry or the palette */
 send({action:"add",type:"hl",anchor:text,data:JSON.stringify({color:"yellow"}),id:m.dataset.hlid});
}
/* tiny colour swatches, 10px above the last highlighted character */
function hlPalette(m){
 const w=document.createTreeWalker(m,NodeFilter.SHOW_TEXT);let t=null,n;
 while(n=w.nextNode())t=n;
 const rr=document.createRange();
 try{if(t){rr.setStart(t,t.data.length);rr.collapse(true)}else{rr.selectNodeContents(m);rr.collapse(false)}}catch(e){try{rr.selectNodeContents(m)}catch(e2){}}
 const rect=(rr.getBoundingClientRect?rr.getBoundingClientRect():m.getBoundingClientRect())||{};
 const x=Math.max(8,Math.min(rect.right||rect.left||20,innerWidth-150));
 const y=Math.max(4,(rect.top||24)-10);
 openPop("",x,y,'<span class="hlpal">'+["yellow","red","green"].map(c=>'<button type="button" data-c="'+c+'" title="'+c+'" style="background:'+HL_COLORS[c]+'"></button>').join("")+"</span>");
 if(!pop)return;
 pop.classList.add("hlpalpop");
 pop.querySelectorAll("button[data-c]").forEach(b=>{
  b.onclick=()=>{const c=b.dataset.c,from=hlColorOf(m);
   hlPaint(m,c);
   if(typeof pushUndo==="function")pushUndo({type:"hl",kind:"color",id:m.dataset.hlid,anchor:m.dataset.a,el:m,from});
   closePop();
   if(m.dataset.hlid)send({action:"set",type:"hl",anchor:m.dataset.a,data:JSON.stringify({color:c}),id:m.dataset.hlid});
  };
 });
}
async function rec(t){let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){alert("Microfone bloqueado — abra a lição em aba própria.");return}
 closePop();
 const ind=document.createElement("div");ind.className="pop recind";
 ind.innerHTML='<span class="pulse">🎙</span> gravando… <b style="font-size:12px">'+t.slice(0,30)+"</b>";
 document.body.appendChild(ind);
 const mr=new MediaRecorder(stream),ch=[];
 mr.ondataavailable=e=>{if(e.data&&e.data.size>0)ch.push(e.data)};
 mr.start();
 const R=new(window.SpeechRecognition||window.webkitSpeechRecognition)();R.lang="en-US";let heard="";
 R.onresult=e=>{try{heard=e.results[0][0].transcript}catch(e2){}};try{R.start()}catch(e){}
 let ac=null,an=null,buf=null,lastLoud=0,everLoud=false,done=false;const t0=Date.now();
 try{ac=new(window.AudioContext||window.webkitAudioContext)();
  const srcn=ac.createMediaStreamSource(stream);an=ac.createAnalyser();an.fftSize=512;srcn.connect(an);
  buf=new Uint8Array(an.frequencyBinCount);}catch(e){}
 let sil=null;
 const finish=()=>{if(done)return;done=true;if(sil)clearInterval(sil);
  try{R.stop()}catch(e){}
  ind.innerHTML='<span class="spin"></span> processando…';
  let sent=false;
  const process=()=>{if(sent)return;sent=true;
   const blob=new Blob(ch,{type:"audio/webm"});
   try{audioCache["a:"+t]=URL.createObjectURL(blob)}catch(e){}
   const f=new FileReader();f.onload=()=>{const fb=feedback(t,heard);
    send({action:"add",type:"rec",anchor:t,b64:f.result.split(",")[1],mime:"audio/webm",data:JSON.stringify({score:fb.score,heard,fb:fb.msg})});
    ind.remove();};
   f.readAsDataURL(blob);};
  mr.onstop=process;
  try{mr.stop()}catch(e){process()}
  setTimeout(()=>{stream.getTracks().forEach(x=>x.stop());if(ac)ac.close()},300);
  setTimeout(process,2000);};
 sil=setInterval(()=>{
  if(an){an.getByteTimeDomainData(buf);let loud=false;
   for(let i=0;i<buf.length;i++){if(Math.abs(buf[i]-128)>14){loud=true;break}}
   if(loud){lastLoud=Date.now();everLoud=true}
   if(everLoud&&Date.now()-lastLoud>2000)return finish();}
  if(Date.now()-t0>10000)return finish();
 },100);}
function feedback(target,heard){
 const tok=s=>(s||"").toLowerCase().split(/[^a-z']+/).filter(Boolean);
 const T=tok(target),H=tok(heard);
 if(!heard)return{score:0,msg:"Alvo: "+target+"<br>Ouvi: (nada)"};
 let ok=0;T.forEach((w,i)=>{if(H[i]===w)ok++});
 return{score:Math.round(100*ok/Math.max(T.length,1)),msg:"Alvo: "+target+"<br>Ouvi: "+heard};
}
window.__A=true;
