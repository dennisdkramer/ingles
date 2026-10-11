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
document.addEventListener("click",e=>{const nb=e.target.closest("mark.nb");
 /* Ctrl+click on a painted highlight = delete it. That is the ONLY interaction a highlight has:
    the layer is pointer-events:none (so it never blocks a click, a drag or a selection), which
    is why the click is hit-tested against the painted rectangles here. It adds no popup, no
    hover state and no cursor change to the text. */
 if(e.ctrlKey||e.metaKey){
  if(Date.now()-hlJustRan>600){const rec=hlAtPoint(e.clientX,e.clientY);
   if(rec){e.preventDefault();e.stopPropagation();hlDelete(rec)}}
  return;
 }
 if(!nb)return; /* a bare highlight (painted on its own layer) is not clickable */
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
/* ---- HIGHLIGHT (owner spec 2026-10-11 #2) — its OWN PAINT LAYER, never inside the text ------
   Ctrl held at MOUSEDOWN over a selection  → the Hear / Record / Note functions are suppressed
                                              for that whole gesture
   Ctrl STILL held at MOUSEUP               → the selected string becomes a highlight
                                              (nothing else ever triggers a highlight)
   Ctrl + click on a painted highlight      → delete that highlight (the ONLY interaction it has)
   Ctrl + drag over a highlight             → merge/extend HIGHLIGHTS only (overlapping or touching
                                              highlights of the same block become one)
   A highlight is NOT part of the text: it is a translucent rectangle overlay (#hlLayer,
   pointer-events:none) measured from the text range. The text DOM belongs to the note/recording
   layer (mark.nb) alone, so the two layers have ZERO interaction — a highlight may cross a note
   or a recording in any way, both stay whole and complete, and neither ever splits, moves,
   clones, hides, blocks or suppresses the other. A highlight adds no click handler, no hover
   state and no cursor change to the text.
   A highlight is anchored by TEXT + (block index, character offset), so it survives a reload and
   is re-measured (reflow) on resize/zoom and whenever the page re-lays-out.
   It may span lines inside ONE block, never across block elements.
   After creating, a tiny colour palette pops above the LAST painted rectangle
   (yellow / transparent red / transparent green); any click or key press closes it. */
const HL_BLOCK=/^(ADDRESS|ARTICLE|ASIDE|BLOCKQUOTE|DD|DETAILS|DIALOG|DIV|DL|DT|FIELDSET|FIGCAPTION|FIGURE|FOOTER|FORM|H[1-6]|HEADER|HR|LI|MAIN|NAV|OL|P|PRE|SECTION|TABLE|TBODY|TD|TFOOT|TH|THEAD|TR|UL)$/;
const HL_BLOCKSEL="p,li,fieldset,h1,h2,h3,h4,h5,h6,dd,dt,td,th,blockquote,figcaption,summary,pre,div";
const HL_COLORNAMES=["yellow","red","green"];
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
                  end of a drag from being read as a Ctrl+click delete)
   hlDownXY     = where the gesture started: a Ctrl+click (no movement) is a DELETE, a Ctrl+drag
                  (movement) is a new/extended highlight — even when it starts on a highlight */
let hlDownCtrl=false,hlSuppressUntil=0,hlJustRan=0,hlDownXY=null;
document.addEventListener("mousedown",e=>{const c=!!(e.ctrlKey||e.metaKey);hlDownCtrl=c;
 hlDownXY={x:e.clientX,y:e.clientY};
 hlSuppressUntil=c?Number.MAX_SAFE_INTEGER:0},true);
document.addEventListener("mouseup",e=>{const was=hlDownCtrl;hlDownCtrl=false;
 if(!was)return;
 hlSuppressUntil=Date.now()+1200;
 const moved=!hlDownXY||Math.abs(e.clientX-hlDownXY.x)>4||Math.abs(e.clientY-hlDownXY.y)>4;
 if(moved&&(e.ctrlKey||e.metaKey||ctrlHeld))hlFromSelection()},true);
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
/* ---- the highlight paint layer: rectangles measured from the text, nothing else -------------- */
let hlList=[]; /* live highlights — a highlight exists HERE and nowhere else in the DOM */
function hlLayerEl(){let L=document.getElementById("hlLayer");
 if(!L){L=document.createElement("div");L.id="hlLayer";L.setAttribute("aria-hidden","true");document.body.appendChild(L)}
 return L}
/* every text block of the page in document order = the offset ruler of the highlights and the
   block a highlight is allowed to live in (a highlight never crosses blocks) */
function hlBlocks(){return [...document.querySelectorAll(HL_BLOCKSEL)].filter(el=>!el.closest(".pop,#hlLayer,script,style"))}
function hlBlockOf(node){const el=node&&(node.nodeType===1?node:node.parentElement);return el&&el.closest?el.closest(HL_BLOCKSEL):null}
function hlBlockEl(i){if(i==null||i<0)return null;const b=hlBlocks();return i<b.length?b[i]:null}
function hlById(id){return hlList.find(r=>r.id===id)||null}
const hlColorOk=c=>HL_COLORNAMES.indexOf(c)>=0?c:"yellow";
/* (node,offset) → character offset, counted over all the text inside root. Notes/recordings are
   text too, so the highlight keeps its offsets whatever the note layer wraps around. */
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
/* the character offsets of a record → a live text Range */
function hlRangeOf(rec){const bl=hlBlockEl(rec.b);if(!bl)return null;
 const a=hlPosition(bl,rec.start),b=hlPosition(bl,rec.end);if(!a||!b)return null;
 const r=document.createRange();
 try{r.setStart(a.n,a.off);r.setEnd(b.n,b.off)}catch(e){return null}
 return r}
/* the painted rectangles of one highlight, in DOCUMENT coordinates */
function hlRectList(rec){const r=hlRangeOf(rec);if(!r)return [];
 let list=[];try{list=r.getClientRects?[...r.getClientRects()]:[]}catch(e){list=[]}
 if(!list.length){try{const b=r.getBoundingClientRect();if(b&&(b.width||b.height))list=[b]}catch(e){}}
 const sx=window.scrollX||0,sy=window.scrollY||0;
 return list.filter(b=>b.width>0||b.height>0).map(b=>({left:b.left+sx,top:b.top+sy,width:b.width,height:b.height}))}
/* repaint the layer from the records: it never touches a single text node */
function hlReflow(){const L=hlLayerEl();L.innerHTML="";
 hlList.forEach(rec=>{rec.rects=hlRectList(rec);
  rec.rects.forEach(r=>{const d=document.createElement("div");
   d.className="hlr hlr-"+rec.color;d.dataset.hlid=rec.id;
   d.style.left=Math.round(r.left)+"px";d.style.top=Math.round(r.top)+"px";
   d.style.width=Math.round(r.width)+"px";d.style.height=Math.round(r.height)+"px";
   L.appendChild(d)})})}
/* Ctrl+click hit test: the layer is pointer-events:none, so the click lands on the text below */
function hlAtPoint(x,y){const sx=window.scrollX||0,sy=window.scrollY||0;
 return hlList.find(rec=>(rec.rects||[]).some(r=>x+sx>=r.left&&x+sx<=r.left+r.width&&y+sy>=r.top&&y+sy<=r.top+r.height))||null}
/* re-measure when the page re-lays-out: resize/zoom, web fonts, <details>, any mouseup */
let hlReflowTimer=0;
function hlQueueReflow(){clearTimeout(hlReflowTimer);hlReflowTimer=setTimeout(hlReflow,80)}
addEventListener("resize",hlQueueReflow);
addEventListener("load",hlQueueReflow);
document.addEventListener("toggle",hlQueueReflow,true);
document.addEventListener("mouseup",()=>{if(hlList.length)hlQueueReflow()},true);
if(document.fonts&&document.fonts.ready)try{document.fonts.ready.then(hlQueueReflow)}catch(e){}
function hlSetColor(rec,c){if(!rec)return null;rec.color=hlColorOk(c);hlReflow();return rec}
function hlDrop(id){hlList=hlList.filter(r=>r.id!==id);hlReflow()}
/* put a deleted highlight back (undo): same id, same place, same colour */
function hlReadd(item){if(!item)return null;
 hlList=hlList.filter(r=>r.id!==item.id);
 return hlRestore({id:item.id,anchor:item.anchor,data:JSON.stringify(item.data||{})})}
function hlDelete(rec){if(!rec)return;
 const id=rec.id,anchor=rec.anchor,data={color:rec.color,b:rec.b,o:rec.start};
 hlDrop(id);
 if(typeof pushUndo==="function")pushUndo({type:"hl",kind:"del",item:{type:"hl",anchor,data,id}});
 closePop();
 /* network last: a failed save must never undo what the user just saw */
 if(id)send({action:"del",id})}
/* ---- where a stored highlight lives: (block index, character offset) with text fallbacks ----
   The text+offset anchor wins over the anchor text alone, so two identical strings highlighted
   in the same block keep their own places. Old rows carry only the anchor text (fallback). */
function hlLocate(anchor,bHint,oHint){
 const t=String(anchor||"");if(!t)return null;
 const bl=hlBlocks();
 if(bHint!=null&&oHint!=null&&bl[bHint]){try{if(bl[bHint].textContent.substr(oHint,t.length)===t)return{b:bHint,start:oHint}}catch(e){}}
 if(bHint!=null&&bl[bHint]){const i=bl[bHint].textContent.indexOf(t);if(i>=0)return{b:bHint,start:i}}
 for(let i=0;i<bl.length;i++){const j=bl[i].textContent.indexOf(t);if(j>=0)return{b:i,start:j}}
 return null;
}
function hlMake(anchor,color,b,start,id){
 const t=String(anchor);
 const rec={id:id||Date.now()+"_"+Math.floor(Math.random()*9999),anchor:t,color:hlColorOk(color),
  b:b,start:Number(start),end:Number(start)+t.length};
 rec.rects=hlRectList(rec);hlList.push(rec);hlReflow();return rec;
}
/* renderLayer helper: the live highlight for a server row, rebuilt from the row when missing */
function hlRestore(row){
 const anchor=String((row&&row.anchor)||"");if(!anchor)return null;
 let d={};try{d=JSON.parse(row.data||"{}")}catch(e){}
 let rec=hlById(row.id);
 if(rec){rec.pending=0;rec.color=hlColorOk(d.color);return rec}
 const spot=hlLocate(anchor,d.b,d.o);
 if(!spot||spot.start<0)return null;       /* that text is not on the page any more */
 rec=hlMake(anchor,d.color,spot.b,spot.start,row.id);
 rec.pending=0;return rec;
}
function hlApply(r){
 if(!r)return;
 const blk=hlBlockOf(r.startContainer);
 if(!blk){toast("Selecione um trecho de texto para destacar.");return}
 /* one block only — a highlight never contains a block element */
 const frag=r.cloneContents();
 if(frag.querySelectorAll&&[...frag.querySelectorAll("*")].some(x=>HL_BLOCK.test(x.tagName))){toast("Destaque só dentro de um mesmo bloco.");return}
 let s=hlOffset(blk,r.startContainer,r.startOffset),e=hlOffset(blk,r.endContainer,r.endOffset);
 if(s<0||e<0){toast("Destaque só dentro de um mesmo bloco.");return}
 if(e<=s){toast("Selecione um trecho de texto para destacar.");return}
 const b=hlBlocks().indexOf(blk);
 if(b<0)return;
 /* merge: highlights of this block that overlap or touch the selection become part of the new
    one. The note/recording layer is never looked at — a highlight may cross it freely. */
 const kill=hlList.filter(rec=>rec.b===b&&rec.end>=s&&rec.start<=e);
 kill.forEach(rec=>{if(rec.start<s)s=rec.start;if(rec.end>e)e=rec.end});
 kill.forEach(rec=>{hlList=hlList.filter(x=>x!==rec);if(rec.id)send({action:"del",id:rec.id})});
 const text=blk.textContent.slice(s,e);
 if(!text.trim()){hlReflow();return}
 const m=hlMake(text,"yellow",b,s);
 m.pending=Date.now();
 hlJustRan=Date.now();
 if(typeof pushUndo==="function")pushUndo({type:"hl",kind:"add",id:m.id});
 hlPalette(m);
 /* network last: a failed save must never suppress the undo entry or the palette */
 send({action:"add",type:"hl",anchor:m.anchor,data:JSON.stringify({color:"yellow",b:m.b,o:m.start}),id:m.id});
}
/* tiny colour swatches, just above the LAST painted rectangle of the highlight.
   The colours themselves live in style.css (#hlLayer .hlr-* and .hlpal button[data-c]) */
function hlPalette(rec){
 hlReflow();
 const rs=rec.rects||[];
 const last=rs.length?rs.reduce((a,b)=>((b.top>a.top||(b.top===a.top&&b.left>a.left))?b:a)):null;
 const sx=window.scrollX||0,sy=window.scrollY||0,vw=window.innerWidth||800;
 const x=Math.max(8,Math.min(last?Math.round(last.left+last.width)-sx:24,vw-150));
 const y=Math.max(4,Math.round(last?last.top-sy:40)-30);
 openPop("",x,y,'<span class="hlpal">'+HL_COLORNAMES.map(c=>'<button type="button" data-c="'+c+'" title="'+c+'"></button>').join("")+"</span>");
 if(!pop)return;
 pop.classList.add("hlpalpop");
 pop.querySelectorAll("button[data-c]").forEach(b=>{
  b.onclick=()=>{const c=b.dataset.c,from=rec.color;
   hlSetColor(rec,c);
   if(typeof pushUndo==="function")pushUndo({type:"hl",kind:"color",id:rec.id,anchor:rec.anchor,from,b:rec.b,start:rec.start});
   closePop();
   if(rec.id)send({action:"set",type:"hl",anchor:rec.anchor,data:JSON.stringify({color:c,b:rec.b,o:rec.start}),id:rec.id});
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
