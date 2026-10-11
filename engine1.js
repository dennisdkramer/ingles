/* MOTOR 1 — popup, gravação, caderno, realce por trecho (Ctrl), âncoras robustas, seleção */
window.addEventListener("error",e=>{let b=document.getElementById("errb");
 if(!b){b=document.createElement("div");b.id="errb";b.style.cssText="background:#a33327;color:#fff;padding:8px 12px;font:14px system-ui;text-align:center";document.body.prepend(b);}
 b.innerHTML="⚠ ERRO: "+e.message;});
const h=s=>{let x=0;for(const c of s)x=(x*31+c.charCodeAt(0))|0;return x};
const norm=s=>(s||"").toLowerCase().replace(/[^a-z']/g,"");
let gate=null;try{gate=JSON.parse(sessionStorage.gate)}catch(e){}
if(!gate||h(gate.email+gate.track+SECRET)!==gate.sig||(!gate.teacher&&gate.track!==TRACK))location.replace("../portal.html");
const who=()=>gate.teacher?"prof":"aluno";
let STUDENT=gate.email, layer=[], sig="";
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
 /* Ctrl gesture (Ctrl at mousedown) — or the tail of one — = HIGHLIGHT territory:
    the Hear/Record/Note popup stays shut for the whole gesture. The highlight itself is
    executed on mouseup, never here (see the gesture gate in the HIGHLIGHT section). */
 if(hlDownCtrl||Date.now()<hlSuppressUntil||ctrlHeld||Date.now()-lastCtrlUp<900){
  lastSelText=t;
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
document.addEventListener("click",e=>{const nb=e.target.closest("mark.nb"),h=e.target.closest("mark.hl");
 /* Ctrl+click inside a highlight = delete it. That is the ONLY interaction a highlight has:
    it adds no popup, no hover state and no cursor change to the text. */
 if(e.ctrlKey||e.metaKey){
  if(h&&Date.now()-hlJustRan>600){e.preventDefault();e.stopPropagation();hlDelete(h)}
  return;
 }
 if(!nb)return; /* a bare highlight (its own layer) is not clickable */
 e.stopPropagation();
 if(window.showAnchor)showAnchor(nb.dataset.a,Math.max(8,Math.min(e.clientX,innerWidth-380)),e.clientY+8)});
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
/* ---- HIGHLIGHT (owner spec 2026-10-11, reworked) — its OWN layer (mark.hl), PC only ----------
   Ctrl held at MOUSEDOWN over a selection  → the Hear / Record / Note functions are suppressed
                                              for that whole gesture
   Ctrl STILL held at MOUSEUP               → the selected string becomes a highlight
                                              (nothing else ever triggers a highlight)
   Ctrl + click inside a highlight          → delete that highlight (the ONLY interaction it has)
   Ctrl + drag over a highlight             → merge/extend HIGHLIGHTS only (overlapping or touching
                                              highlights become one)
   A highlight is its own element (mark.hl) and NEVER a note/recording mark (mark.nb): it adds no
   click handler, no hover state and no cursor change, and it never combines with, triggers or
   changes anything about a note or a recording. A selection whose start or end sits inside a
   note/recording mark is refused (that mark would otherwise be split, cloned or moved).
   Highlights are pegged to TEXT (survive resize/zoom), may span lines inside ONE block, never
   cross block elements.
   After creating, a tiny colour palette pops 10px above the LAST highlighted character
   (yellow / transparent red / transparent green); any click or key press closes it. */
const HL_COLORS={yellow:"rgba(255,233,112,.55)",red:"rgba(255,64,64,.34)",green:"rgba(64,200,96,.34)"};
const HL_BLOCK=/^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DD|DETAILS|DIALOG|DIV|DL|DT|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|LI|MAIN|NAV|OL|P|PRE|SECTION|TABLE|TBODY|TD|TFOOT|TH|THEAD|TR|UL)$/;
let ctrlHeld=false,lastCtrlUp=0;
document.addEventListener("keydown",e=>{if(e.key==="Control"||e.key==="Meta")ctrlHeld=true},true);
document.addEventListener("keyup",e=>{if(e.key==="Control"||e.key==="Meta"){ctrlHeld=false;lastCtrlUp=Date.now()}},true);
addEventListener("blur",()=>{ctrlHeld=false;hlDownCtrl=false;hlSuppressUntil=0});
/* ---- gesture gate: the highlight only exists if Ctrl is held at mousedown AND at mouseup ----
   hlDownCtrl   = Ctrl was down when the drag/selection started (suppresses the Hear/Record/Note
                  popup for the whole gesture, whatever happens next)
   hlSuppressUntil = keep that suppression for ~1.2s after the gesture so the debounced
                  selectionchange cannot re-open the popup behind our back
   hlJustRan    = a highlight was created this instant (stops the click that browsers fire at the
                  end of a drag from being read as a Ctrl+click delete) */
let hlDownCtrl=false,hlSuppressUntil=0,hlJustRan=0;
document.addEventListener("mousedown",e=>{const c=!!(e.ctrlKey||e.metaKey);hlDownCtrl=c;
 hlSuppressUntil=c?Number.MAX_SAFE_INTEGER:0},true);
document.addEventListener("mouseup",e=>{const was=hlDownCtrl;hlDownCtrl=false;
 if(!was)return;
 hlSuppressUntil=Date.now()+1200;
 if(e.ctrlKey||e.metaKey||ctrlHeld)hlFromSelection()},true);
/* runs on mouseup only: Ctrl at mousedown AND still held now → highlight the selected string */
function hlFromSelection(){
 const sel=getSelection();if(!sel||!sel.rangeCount)return;
 const t=sel.toString().trim();if(!t)return;
 const rc=sel.getRangeAt(0).cloneRange();
 try{sel.removeAllRanges()}catch(e){}
 lastSelText=t;
 hlApply(rc);
}
/* any key press closes the colour palette (but never the note textarea popup) */
document.addEventListener("keydown",()=>{if(pop&&pop.classList.contains("hlpalpop"))closePop()},true);
function hlClosest(node){const el=node&&(node.nodeType===1?node:node.parentElement);return el&&el.closest?el.closest("mark.hl"):null}
/* the note/recording layer around a node — the two layers must never touch each other */
function hlNbClosest(node){const el=node&&(node.nodeType===1?node:node.parentElement);return el&&el.closest?el.closest("mark.nb"):null}
function hlColorOf(m){return m.classList.contains("hl-red")?"red":m.classList.contains("hl-green")?"green":"yellow"}
function hlPaint(m,c){m.classList.remove("hl-yellow","hl-red","hl-green");m.classList.add("hl-"+(HL_COLORS[c]?c:"yellow"))}
/* put the text back: drop the highlight ELEMENT only — a note/recording mark around it is
   never touched, and if the highlight lived inside one, the note simply stays as it was */
function hlUnwrap(m){
 if(!m||!m.parentNode)return;
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
/* the highlight wrapper: always a NEW mark.hl — never a note/recording mark (mark.nb) */
function hlWrap(text,r){
 if(!r)return null;
 const m=document.createElement("mark");m.className="hl";m.dataset.a=text;
 try{m.appendChild(r.extractContents());r.insertNode(m)}catch(e){return null}
 return m;
}
const hlByAnchor=t=>document.querySelector('mark.hl[data-a="'+CSS.escape(t)+'"]');
/* text → range for the HIGHLIGHT layer: text inside a note/recording mark is fair game,
   text already inside a highlight is not (a highlight never nests in another highlight) */
function hlFindRange(t){
 const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const nodes=[];let all="";let n;
 while(n=w.nextNode()){if(n.parentElement&&n.parentElement.closest("script,style,.pop,mark.hl"))continue;nodes.push({n,start:all.length});all+=n.data;}
 const i=all.indexOf(t);if(i<0)return null;const end=i+t.length;let a=null,b=null;
 for(const o of nodes){if(!a&&o.start<=i&&i<o.start+o.n.data.length)a={n:o.n,off:i-o.start};
  if(!b&&o.start<end&&end<=o.start+o.n.data.length)b={n:o.n,off:end-o.start};}
 if(!a||!b)return null;
 const r=document.createRange();r.setStart(a.n,a.off);r.setEnd(b.n,b.off);return r;
}
/* renderLayer helper: the highlight element for an anchor, rebuilt from the text when missing */
function hlEnsure(t){const m=hlByAnchor(t);if(m)return m;const r=hlFindRange(t);return r?hlWrap(t,r):null}
function hlApply(r){
 if(!r)return;
 /* The note/recording layer must never be split, cloned or moved by a highlight: when the
    selection starts or ends INSIDE a note/recording mark, the gesture is refused outright.
    (Both ends inside the SAME mark is safe — the highlight nests inside it, nothing changes.) */
 if(hlNbClosest(r.startContainer)!==hlNbClosest(r.endContainer)){toast("Destaque não pode atravessar uma nota ou gravação.");return}
 /* grow out of (and swallow) whatever HIGHLIGHT the selection start/end sits inside */
 const mS=hlClosest(r.startContainer),mE=hlClosest(r.endContainer);
 try{if(mS)r.setStartBefore(mS);if(mE)r.setEndAfter(mE)}catch(e){}
 if(hlNbClosest(r.startContainer)!==hlNbClosest(r.endContainer)){toast("Destaque não pode atravessar uma nota ou gravação.");return}
 const root=(()=>{const n=r.commonAncestorContainer;return n.nodeType===1?n:n.parentElement})();
 if(!root)return;
 const frag=r.cloneContents();
 if(frag.querySelectorAll&&[...frag.querySelectorAll("*")].some(x=>HL_BLOCK.test(x.tagName))){toast("Destaque só dentro de um mesmo bloco.");return}
 let s=hlOffset(root,r.startContainer,r.startOffset),e=hlOffset(root,r.endContainer,r.endOffset);
 if(s<0||e<0||e<=s){toast("Selecione um trecho de texto para destacar.");return}
 /* merge: every HIGHLIGHT that overlaps or touches [s,e] becomes part of the new one.
    Only mark.hl is looked at — notes and recordings are never merged or extended. */
 const kill=[];let grew=true;
 while(grew){grew=false;
  root.querySelectorAll("mark.hl").forEach(m=>{
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
 const m=hlWrap(text,nr);
 if(!m)return;
 hlPaint(m,"yellow");
 m.dataset.hlid=Date.now()+"_"+Math.floor(Math.random()*9999);
 hlJustRan=Date.now();
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
