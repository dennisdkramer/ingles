/* MOTOR 1 — popup, gravação, caderno, realce por trecho (Ctrl), âncoras robustas, seleção */
window.addEventListener("error",e=>{let b=document.getElementById("errb");
 if(!b){b=document.createElement("div");b.id="errb";b.style.cssText="background:#a33327;color:#fff;padding:8px 12px;font:14px system-ui;text-align:center";document.body.prepend(b);}
 b.innerHTML="⚠ ERRO: "+e.message;});
const h=s=>{let x=0;for(const c of s)x=(x*31+c.charCodeAt(0))|0;return x};
const norm=s=>(s||"").toLowerCase().replace(/[^a-z']/g,"");
const lineNorm=s=>String(s==null?"":s).replace(/[\r\n]/g," "); /* newline -> space (length-preserving), so the anchor always matches the rendered text */
let gate=null;try{gate=JSON.parse(sessionStorage.gate)}catch(e){}
if(!gate||h(gate.email+gate.track+SECRET)!==gate.sig||(!gate.teacher&&gate.track!==TRACK))location.replace("../portal.html");
const who=()=>gate.teacher?"prof":"aluno";
let STUDENT=gate.email, layer=[], sig="", editing=false;
const audioCache={};
let popXY={x:20,y:90};
function toast(m){const t=document.getElementById("toast");t.textContent=m;t.style.display="block";clearTimeout(t._x);t._x=setTimeout(()=>t.style.display="none",2600)}
function b64url(b64,mime){const m=mime||"audio/webm";
 try{const b=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));return URL.createObjectURL(new Blob([b],{type:m}))}
 catch(e){return "data:"+m+";base64,"+b64}}
/* ---- local-action outbox (owner plan 2026-10-14): the UI applies a write immediately, then the op
   is queued in a PERSISTENT outbox (localStorage) and flushed ONE fetch at a time, so rapid actions
   can never burst the backend with concurrent POSTs. A failed write survives a reload and is retried
   with backoff; the server stays the sole source of truth and the outbox only remembers the
   unconfirmed deltas. Each op keeps a STABLE id and the backend add/set/del are idempotent by id, so
   a retry lands exactly once; the latest op per id replaces the earlier one (an add then a del
   coalesces to a del). */
let outbox=[];
const OUTBOX_KEY=()=>"ob_"+gate.email+"_"+TRACK+"_"+L;
function outboxLoad(){try{outbox=JSON.parse(localStorage.getItem(OUTBOX_KEY())||"[]")||[]}catch(e){outbox=[]}}
function outboxSave(){try{localStorage.setItem(OUTBOX_KEY(),JSON.stringify(outbox))}catch(e){}}
function outboxPush(o){outbox=outbox.filter(x=>x.id!==o.id);outbox.push(o);outboxSave();}
function outboxDrop(id){outbox=outbox.filter(x=>x.id!==id);outboxSave();}

let pendingOps=[];
function notePending(o){
  if(!o||!o.id)return;
  pendingOps=pendingOps.filter(p=>Date.now()<p.until&&(p.id!==o.id||p.action!==o.action));
  pendingOps.push({id:o.id,action:o.action,type:o.type,until:Date.now()+12000});
}
/* a row is "in flight" while its write sits in the durable outbox (unconfirmed) OR inside the 12s
   notePending window (just confirmed — the poll needs that window to catch up to the server). */
function pendingFor(id){
  pendingOps=pendingOps.filter(p=>Date.now()<p.until);
  let op=null;for(const p of pendingOps)if(p.id===id)op=p;
  if(op)return op;
  return outbox.find(x=>x.id===id)||null;
}
let flushTimer=null,flushing=false,backoff=1000,offlineWarned=false;
function scheduleFlush(){clearTimeout(flushTimer);flushTimer=setTimeout(flush,300);}
async function sendOne(op){
  try{
    const r=await fetch(BACKPACK,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify(op)});
    const j=await r.json();
    return !!(j&&(j.result==="ok"||j.result==="deleted"||j.result==="wiped"));
  }catch(e){return false;}
}
async function flush(){
  if(flushing||!outbox.length)return;
  flushing=true;
  while(outbox.length){
    const op=outbox[0];
    if(await sendOne(op)){
      outboxDrop(op.id);
      backoff=1000;offlineWarned=false;
    }else{
      if(!offlineWarned){toast("⚠ servidor indisponível — tentando de novo");offlineWarned=true;}
      flushing=false;
      flushTimer=setTimeout(flush,backoff);
      backoff=Math.min(backoff*2,30000);
      return;
    }
  }
  flushing=false;
}
function send(o){
  o.email=STUDENT;o.lesson=L;o.author=who();
  if(o.action!=="del"&&!o.id)o.id=Date.now()+"_"+Math.floor(Math.random()*9999);
  /* the UI already applied this change before send(); queue it in the outbox and flush (network last) */
  notePending(o);
  outboxPush(o);
  scheduleFlush();
  setTimeout(()=>{if(window.currentAnchor&&window.currentAnchor===o.anchor&&pop&&window.showAnchor)window.showAnchor(o.anchor,popXY.x,popXY.y)},900);
}
/* on load: retry anything a previous session left unconfirmed */
outboxLoad();
if(outbox.length)scheduleFlush();
let pop=null,pendingRange=null,lastSelText="",nbSel=null,recStop=null;
/* nbSel = the SELECTION the open popup came from (openNbPopup): {area, note, expand}. The owner's
   overlap rules read it — the recording(s)/note the gesture refers to (nbPopState), the note the selection refers to
   (nbPickNote) and the 💾 Save expansion (nbExpandPlan). It must OUTLIVE a re-render of the SAME
   popup (📝 Add/Edit Note and 💾 Save rebuild the popup through openPop, which closes the old one):
   clearing it here would drop the plan and Save would no longer expand the note. It is cleared by
   the outside-mousedown listener below instead (the user dismissing the popup, i.e. starting a new
   gesture) and overwritten by every openNbPopup. */
const closePop=()=>{if(pop){pop.remove();pop=null}lastSelText=""};
/* ---- note / recording layer (mark.nb) — owner spec 2026-10-12 ---------------------------------
   mark.nb is the ONLY layer that lives inside the text DOM (highlights are painted separately on
   #hlLayer). One phrase carries at most one note and one recording, both keyed by the anchor
   string (= the phrase text), exactly as the server rows are. These helpers are shared by the
   selection popup below AND by engine2's showAnchor (a click on an existing mark), so the two
   entry points can never drift apart. */
/* THE local copy of the rows the ONE core save (nbUpsert) has just written, kept OUTSIDE `layer`
   (owner report 2026-10-12: a saved note vanished from the phrase AND from the popup until the
   server confirmed the write). The only sync re-check is the poll, which REPLACES `layer` with the
   server snapshot — and a snapshot fetched before the backend write landed simply does not contain
   the new row, while the popup's note text, the ▶ Play lookup and the phrase's own flags
   (nbAnyPending reads nbEntries) all read exactly that row. So the note blinked out for a whole
   poll cycle even though nothing was lost. The HIGHLIGHT layer never had this: hlList keeps a
   freshly painted highlight and renderLayer only drops it once pendingFor says its window is over.
   Same treatment here, applied to whatever nbUpsert saves (note AND recording): the local copy is
   served in place of the snapshot's absent/older copy for as long as the row's own window stays
   open — the very same 12s window notePending opened when send() fired, no second timer. Once the
   server's row is confirmed the local copy is no longer consulted, an expired window (a write the
   server rejected) drops it, and a row whose MOST RECENT local action was a delete never comes
   back through here. */
let nbLocal=[];
/* THE ONE read point of the note/recording layer: `layer` (server truth) plus the local rows the core
   save (nbUpsert) has just written and whose own action is still inside its grace window (nbLocal —
   a poll bringing a snapshot that predates the write must never blink the row off). type = "note" |
   "rec"; t = an anchor. Omit both for the whole layer. */
function nbRows(type,t){
 const keep=r=>(r.type==="rec"||r.type==="note")&&(!type||r.type===type)&&(t==null||r.anchor===t);
 const rows=layer.filter(keep);
 nbLocal=nbLocal.filter(r=>{const p=pendingFor(r.id);return !!p&&p.action!=="del"});
 nbLocal.forEach(r=>{if(!keep(r))return;const i=rows.findIndex(x=>x.id===r.id);
  if(i>=0)rows[i]=r;else rows.push(r)});
 return rows;
}
const nbEntries=t=>nbRows(null,t);
/* ---- WHICH OCCURRENCE an item belongs to (owner spec 2026-10-13: the anchor TEXT identifies the
   item, POSITION only picks between identical candidates) -----------------------------------------
   A lesson's prose is fixed, so a phrase that occurs twice on a page (the top box AND the dialogue)
   is TWO independent items. The tie-breaker is the (block index, character offset) place the item was
   saved on, measured with the HIGHLIGHT layer's own ruler (hlBlocks/hlOffset) so the two features can
   never disagree about where a span is, and it travels inside the row's `data` cell — exactly where a
   highlight row already keeps its {color,b,o} — so the 10-column sheet schema never changes. A row
   with no tie-breaker (legacy, or a page where the phrase occurs once) falls back to the text. */
function nbMarkPos(m){if(!m||m.dataset.b==null||m.dataset.o==null)return null;
 return{b:Number(m.dataset.b),o:Number(m.dataset.o)}}
function nbSetMarkPos(m,b,o){if(!m||b==null||o==null)return m;
 m.dataset.b=String(b);m.dataset.o=String(o);return m}
/* the (block,offset) a live Range / an nbAreaOfRange area / a stored hint stands for (null = unknown,
   e.g. a range that crosses blocks — those gestures are refused anyway) */
function nbPosOf(at){
 if(!at)return null;
 if(at.blk!=null||(at.s!=null&&at.e!=null))return{b:Number(at.b),o:Number(at.s)};
 if(at.b!=null&&at.o!=null)return{b:Number(at.b),o:Number(at.o)};
 if(at.startContainer!=null)return nbPosOf(nbAreaOfRange(at));   /* a live Range */
 return null}
/* a row's stored place: the b/o inside its `data` cell (JSON for notes and recordings), null for a
   legacy row that carries only its anchor text */
function nbDataPos(data){const s=String(data==null?"":data);if(s.charAt(0)!=="{")return null;
 let d=null;try{d=JSON.parse(s)}catch(e){return null}
 return(d&&d.b!=null&&d.o!=null)?{b:Number(d.b),o:Number(d.o)}:null}
/* the marks of an anchor at ONE occurrence: no position → every piece of that text (the click path),
   a position → only the marks painted there */
function nbMarksAt(t,pos){const ms=nbMarks(t);if(!pos)return ms;
 return ms.filter(m=>{const p=nbMarkPos(m);return!!p&&p.b===pos.b&&p.o===pos.o})}
function nbFlagAt(t,pos,cls){const other=cls==="has-note"?"has-rec":"has-note";const ms=nbMarksAt(t,pos).filter(m=>!m.classList.contains(other));ms.forEach(m=>m.classList.add(cls));return ms[0]||null}
/* a stored occurrence → a live Range, with the highlight layer's own locate+range helpers (hlLocate:
   the stored b/o when the anchor still sits there, else the block hint, else the anchor text alone) */
function nbRangeOf(t,b,o){if(t==null)return null;const s=String(t);
 const spot=hlLocate(s,b,o);
 return(spot&&spot.start>=0)?hlRangeOf({b:spot.b,start:spot.start,end:spot.start+s.length}):null}
/* the range a save should wrap: the LIVE selection, else the stored/known occurrence, else the text */
function nbRangeFor(t,pos,at){if(at&&at.startContainer!=null)return at;
 if(pos)return nbRangeOf(t,pos.b,pos.o);
 return findRange(t)}
/* the text a live selection covers, straight from the DOM. The browser's own selection string
   NORMALISES a line break to a space (lesson 1's line 31 → 32 crosses "·\n"), and a row anchored to
   that normalised string can never be found in the page again (findRange) nor satisfy "a mark covers
   exactly its own anchor text" — the owner's "anchored to exactly what the mark paints" (QA B-F4
   step 2). Null when the range crosses a block, i.e. when its text is ambiguous. */
function nbSpanText(r){const a=nbAreaOfRange(r);if(!a)return null;
 return lineNorm(a.blk.textContent.slice(a.s,a.e)).replace(/\s+$/,"")||null}
/* ---- where a note/recording sits on the page: the OVERLAP RULES below need real spans ----------
   A row is keyed by its anchor text, so its span is measured from the mark that paints it (in pieces
   or not: from its first piece's first text to its last piece's last text) and falls back to
   findRange for a row whose mark is not on the page yet. The offsets use the SAME ruler as the
   highlights (hlBlocks/hlOffset), so the two features can never disagree about where a span is. */
function nbAreaOfRange(r){
 if(!r)return null;
 const nrm=hlRangeNorm(r);if(!nrm)return null;
 const blk=hlBlockOf(nrm.s.n);
 if(!blk||hlBlockOf(nrm.e.n)!==blk)return null;
 const s=hlOffset(blk,nrm.s.n,nrm.s.off),e=hlOffset(blk,nrm.e.n,nrm.e.off);
 if(s<0||e<=s)return null;
 const b=hlBlocks().indexOf(blk);if(b<0)return null;
 return{b:b,s:s,e:e,blk:blk};
}
/* a Range's boundary containers, normalized to TEXT nodes, with empty boundaries clamped to the
   adjacent text node. Two false positives are fixed: (1) a selection whose end lands at a block
   boundary has the block ELEMENT itself as its container; (2) dragging the pointer just past a
   block edge lands the end on the NEXT block's first text node at offset 0 (or the start on a
   node's very end) — selecting NOTHING there, yet hlBlockOf would read it as a block crossing. */
function hlRangeNorm(r){
 if(!r)return null;
 let s=nbTextPoint(r.startContainer,r.startOffset,true);
 let e=nbTextPoint(r.endContainer,r.endOffset,false);
 if(!s||!e)return null;
 const clampS=(s.n.nodeType===3&&s.off>=s.n.data.length);
 const clampE=(e.n.nodeType===3&&e.off<=0);
 if(!clampS&&!clampE)return{s,e};
 const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const arr=[];let n;while(n=w.nextNode())arr.push(n);
 if(clampS){const i=arr.indexOf(s.n);if(i>=0&&i<arr.length-1)s={n:arr[i+1],off:0};}
 if(clampE){const i=arr.indexOf(e.n);if(i>0)e={n:arr[i-1],off:arr[i-1].data.length};}
 return{s,e};
}
function nbAreaOf(anchor){
 const a=String(anchor||"");if(!a)return null;
 const ps=nbMarks(a);
 let r=null;
 if(ps.length){const f=nbEdgeText(ps[0],true),l=nbEdgeText(ps[ps.length-1],false);
  if(f&&l){r=document.createRange();try{r.setStart(f,0);r.setEnd(l,l.data.length)}catch(e){r=null}}}
 return nbAreaOfRange(r||findRange(a));
}
/* a ROW's span on the page: its stored occurrence wins over the first text match, so a note kept for
   the dialogue's phrase is not mistaken for the identical phrase in the top box */
function nbAreaOfRow(r){if(!r)return null;const p=nbDataPos(r.data);
 return nbAreaOfRange(nbRangeOf(r.anchor,p?p.b:null,p?p.o:null))||nbAreaOf(r.anchor)}
/* the span a live selection means for the note layer, TRIMMED to t — and the trimmed selection IS
   the anchor: a mark then covers exactly its own anchor text, so two abutting saves share no
   character. */
function nbSelArea(r,t){
 if(!r)return null;
 const area=nbAreaOfRange(r);if(!area||t==null)return area;
 const i=lineNorm(area.blk.textContent.slice(area.s,area.e)).indexOf(lineNorm(t));
 if(i<0)return null;
 return{b:area.b,s:area.s+i,e:area.s+i+t.length,blk:area.blk};
}
/* a span → a live Range (the same offsets→range helper the highlight records use) */
function nbAreaRange(a){if(!a)return null;
 const p=hlPosition(a.blk,a.s),q=hlPosition(a.blk,a.e);
 if(!p||!q)return null;
 const r=document.createRange();try{r.setStart(p.n,p.off);r.setEnd(q.n,q.off)}catch(e){return null}return r}
/* two spans overlap when they share a character — merely TOUCHING (a.e===c.s) is not an overlap */
const nbOverlap=(a,c)=>!!a&&!!c&&a.b===c.b&&a.s<c.e&&a.e>c.s;
/* the note a selection refers to (owner rule, overlaps 2026-10-12): the FIRST note, in text order,
   whose span overlaps the selection. It becomes the popup's ACTIVE note — and 💾 Save then expands
   its area to the new selection, or keeps its own string as the reference when the selection sits
   strictly inside it. */
function nbPickNote(area){
 if(!area)return null;
 let best=null;
 nbRows("note").forEach(r=>{const a=nbAreaOfRow(r);
  if(!nbOverlap(a,area))return;
  if(!best||a.s<best.area.s)best={anchor:r.anchor,area:a}});
 return best;
}
/* the 💾 Save plan for a selection that overlaps a note (owner rule): the note's AREA is EXPANDED to
   the new selection — the union of the two spans — and the union's own text becomes the note's new
   anchor/reference (the row is re-anchored, never duplicated). A selection strictly INSIDE the note
   plans nothing: the note keeps its original string as its reference. */
function nbExpandPlan(note,area){
 if(!note||!area||!note.area||note.area.b!==area.b)return null;
 if(note.area.s<=area.s&&note.area.e>=area.e)return null;      /* selection inside the note */
 const s=Math.min(note.area.s,area.s),e=Math.max(note.area.e,area.e);
 const raw=area.blk.textContent;let ss=s,ee=e;while(ss<ee&&/\s/.test(raw[ss]))ss++;while(ee>ss&&/\s/.test(raw[ee-1]))ee--;
 return{area:{b:area.b,s:ss,e:ee,blk:area.blk},anchor:raw.slice(ss,ee)};
}
/* the exact owner wording of the ⏺ Record refusal and of the ambiguous ▶ Play / 🔊 Delete press (see
   nbPopState/nbPopHTML/nbWirePopup). Any selection
   that touches a recording — sitting inside it, overlapping it or containing it — is refused, so the
   only way to change a clip is to delete it first. */
const NB_REC_LOCKED="cannot overwrite recording, delete first";
const NB_REC_AMBIG="please select a distinct recording";
/* the RECORDINGS a gesture refers to (owner spec 2026-10-12 #2):
     • popup opened from a SELECTION → every recording whose span the selection overlaps — the one it
       sits inside, crosses or contains. This is what enables ▶ Play for the referenced clip ("text
       selection within or overlapping one existing recording"), locks ⏺ Record, and makes ▶ Play and
       🔊 Delete ambiguous as soon as MORE THAN ONE recording is involved;
     • popup opened by a CLICK on a mark (no selection) → the rows stored on that anchor (its own
       phrase, so a click on a recorded phrase locks ⏺ Record exactly like selecting it does).
   Measured with the same ruler as everything else (nbAreaOf → hlBlocks/hlOffset), so the two features
   can never disagree about where a span is. */
function nbRecsAt(t,area){
 if(!area)return nbRows("rec",t);
 return nbRows("rec").filter(r=>nbOverlap(nbAreaOfRow(r),area));
}
/* THE ONE resolution of what the open popup is about (owner spec 2026-10-12 #2: "clicking or text
   selection needs to check for a recording AND check for a note"): the recording rows the gesture
   refers to (recs), the ONE of them ▶ Play and 🔊 Delete act on (rec — null when there is none or the
   gesture involves several), and the note the gesture refers to (note = the anchor of the ACTIVE note:
   the note a selection overlaps/contains, or the note stored on a clicked mark). Every button state
   and every button action is derived from this one call, so the buttons can never disagree about
   which item they act on. */
function nbPopState(t){
 const area=(nbSel&&nbSel.area)||null;
 const recs=nbRecsAt(t,area);
 const note=area?(nbPickNote(area)||null):(nbRows("note",t)[0]||null);
 return{area:area,recs:recs,rec:recs.length===1?recs[0]:null,note:note?note.anchor:null};
}
/* is a local note/recording action for this anchor still inside its grace window? (engine2's
   renderLayer consults this so a 1s poll cannot blink a mark that was just created or deleted) */
function nbAnyPending(t){return nbEntries(t).some(it=>pendingFor(it.id))}
/* the saved note text of an anchor (for the 📝 Show view) — null when there is none. */
function nbNoteText(t){const e=nbEntries(t).find(it=>it.type==="note");return e?nbNoteTextOf(e.data):null}
/* the note text inside a row's `data` cell. The JSON envelope carries the tie-breaker (b/o) BESIDE the
   text — the same place a highlight row keeps its {color,b,o} — while a legacy row is the plain string. */
function nbNoteTextOf(data){const s=String(data==null?"":data);if(s.charAt(0)!=="{")return s;
 let d=null;try{d=JSON.parse(s)}catch(e){return s}
 return(d&&typeof d.t==="string")?d.t:s}
/* the `data` cell a save writes: the note text plus the occurrence it was saved on (owner spec
   2026-10-13 — the text identifies the item, the place only picks between identical candidates) */
const nbNoteData=(text,pos)=>JSON.stringify(pos?{t:String(text),b:pos.b,o:pos.o}:{t:String(text)});
const nbRecData=pos=>JSON.stringify(pos?{b:pos.b,o:pos.o}:{});
/* escape a user string for safe innerHTML (the popup is built as an HTML string) */
const nbEsc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
/* the saved note of an anchor shown ABOVE the buttons (owner spec 2026-10-12): the whole note is
   always visible on the popup, as PLAIN dark text — no blue background and no 📝 icon (that icon,
   still present in legacy rows, is stripped); null when the phrase has no note. */
function nbNoteDisplay(t){
 const v=nbNoteText(t);
 if(v==null)return null;
 const s=String(v).replace(/^\s*(?:📝|📌|🗒)\s*/u,"").trim();
 return s?s:null;
}
/* the popup carries SEVEN buttons, and ALL of them always exist (owner spec 2026-10-12). ▶ Hear,
   ⏺ Record and 📝 Add/Edit Note are always clickable; the other four light up only when they apply and
   are otherwise GREYED OUT (never hidden). What applies comes from nbPopState(t) — the recording(s)
   and the note the gesture refers to:
     ▶ Play    — exactly ONE recording is involved: it plays THAT clip (with more than one involved it
                 carries the disabled LOOK, `.locked`, and its press only toasts NB_REC_AMBIG)
     🔊 Delete — the same single recording, dropping just the recorded audio (the note stays)
     💾 Save   — a note is currently being added / edited
     📝 Delete — the gesture refers to a saved note; drops just that note (the recording stays)
   ⏺ Record is the ONE always-present-but-refusing button: it carries the disabled LOOK (`.locked`, NOT
   the `disabled` attribute — a genuinely disabled button fires no click event) as soon as ANY
   recording is involved — the
   press must still be heard, and it toasts NB_REC_LOCKED.
   The saved note (when any) is shown ABOVE the buttons; the SELECTED TEXT is NOT repeated in the
   popup (owner spec 2026-10-12). The button ids: H=Hear P=Play R=Record A=Delete-audio N=Add/Edit Note
   Play swaps its glyph for a processing spiral while the clip is playing; ⏺ Record shows a
   countdown of the remaining capture time (owner spec 2026-10-12).
   It intentionally carries NO trailing icon: the underline / blue-wash of the phrase itself is the
   only signal, and it is applied by the SAVE (engine2 renderLayer or the note Save), never by the
   click. */
function nbPopHTML(t,editing){
 const st=nbPopState(t);
 const play=!!st.rec,ambig=st.recs.length>1;   /* one recording involved vs more than one */
 const nb=nbNoteDisplay(t);
 /* ▶ Play and 🔊 Delete act on the SAME single recording; while more than one is involved both carry
    the disabled LOOK (.locked) and their press only toasts NB_REC_AMBIG (owner spec 2026-10-12 #2). */
 const playAttr=play?' title="ouvir a gravação selecionada"':(ambig?' class="locked" aria-disabled="true" title="'+NB_REC_AMBIG+'"':' disabled title="nada para ouvir"');
 const audioAttr=play?' title="apagar somente a gravação (áudio)"':(ambig?' class="locked" aria-disabled="true" title="'+NB_REC_AMBIG+'"':' disabled title="nada para apagar"');
 /* the popup does NOT repeat the selected text: the phrase is right
    there in the page, so a title echoing it is redundant. #pTitle stays as an empty anchor so a
    refresh can keep targeting a stable node. */
 const noteHTML=nb!=null?'<div id="nbNote" title="nota salva">'+nbEsc(nb)+'</div>':"";
 return '<div id="pTitle"></div>'+noteHTML+
  '<span class="poprow"><button id="pH" title="ouvir em voz alta">▶ Hear</button>'+
  '<button id="pP"'+playAttr+'><span class="lbl">▶ Play</span></button>'+
  '<button id="pR"'+(st.recs.length?' class="locked" aria-disabled="true" title="'+NB_REC_LOCKED+'"':' title="gravar"')+'><span class="lbl">⏺ Record</span></button>'+
  '<button id="pA"'+audioAttr+'><span class="lbl">🔊 Delete</span></button></span>'+
  '<span class="poprow"><button id="pN">📝 Add/Edit Note</button>'+
  '<button id="pS" title="salvar a nota"'+(editing?"":' disabled')+'>💾 Save</button>'+
  '<button id="pD" title="apagar somente a nota"'+(st.note?"":' disabled')+'>📝 Delete</button></span>';
}
/* wire a freshly-opened .pop for an anchor: range = the live selection when the popup came from
   one (null when it came from a click on the mark). Shared by trySelPopup and showAnchor. Every
   button exists, so each handler is wired unconditionally; the disabled ones simply do nothing
   when clicked. The note editor is open exactly while the popup holds a #nt textarea (re-entering
   Add/Edit Note keeps whatever was already typed). */
/* swap a popup button's glyph for a processing SPIRAL (owner spec 2026-10-12): on=true replaces the
   label with `<span class="spin">` (record while a clip is being captured, play while the clip is
   sounding); on=false restores the untouched label markup. `data-lbl` keeps the original HTML, so the
   swap is fully reversible and idempotent — never swaps twice. */
function nbBtnSpinner(btn,on){
 if(!btn)return;
 const lbl=btn.querySelector(".lbl");
 if(!lbl)return;
 if(on){
  if(btn.dataset.spin)return;
  btn.dataset.spin="1";btn.dataset.lbl=lbl.innerHTML;
  lbl.innerHTML='<span class="spin"></span>';
 }else{
  if(!btn.dataset.spin)return;
  lbl.innerHTML=btn.dataset.lbl;delete btn.dataset.spin;delete btn.dataset.lbl;
 }
}
function nbFixButtons(){if(pop)pop.querySelectorAll("button").forEach(b=>{if(b.offsetWidth)b.style.minWidth=b.offsetWidth+"px"})}
function nbWirePopup(t,r,x,y){
 if(!pop)return;
 nbFixButtons();
 const H=pop.querySelector("#pH");
 if(H)H.onclick=()=>{const u=new SpeechSynthesisUtterance(t);u.lang="en-US";u.rate=.95;speechSynthesis.cancel();speechSynthesis.speak(u)};
 const P=pop.querySelector("#pP");
 /* ▶ Play shows the processing SPIRAL for the whole playback (owner spec 2026-10-12). ON at the
    click, BEFORE the Drive/?action=file fetch, so even a first-ever fetch shows it; OFF when playback
    really stops — nbPlayAudio fires its done() on BOTH "ended" and a failed play/lookup, so the
    spiral can never get stuck on.
    It plays the ONE recording the gesture refers to (nbPopState), so a selection that merely
    OVERLAPS a recording plays THAT clip ("the referenced recording"); while more than one recording
    is involved the button carries the disabled LOOK and its press only toasts NB_REC_AMBIG. */
 if(P)P.onclick=()=>{if(P.disabled)return;
  if(P.classList.contains("locked")){toast(NB_REC_AMBIG);return}
  const st=nbPopState(t);if(!st.rec)return;
  nbBtnSpinner(P,true);nbPlayRecording(st.rec.anchor,()=>nbBtnSpinner(P,false))};
 const R=pop.querySelector("#pR");
 /* a LOCKED ⏺ Record refuses with the owner's toast instead of recording — the button carries the
    disabled LOOK but no `disabled` attribute, which is the only way a press can still be heard. It is
    locked as soon as ANY recording is involved (nbPopState.recs), so the only
    way to change a clip is to delete it first (NB_REC_LOCKED, owner spec 2026-10-12 #2). */
 if(R)R.onclick=()=>{if(R.classList.contains("locked")){toast(NB_REC_LOCKED);return}if(pop&&pop.dataset.recording){if(recStop){recStop();recStop=null}return}rec(t,R)};
 const N=pop.querySelector("#pN");
 if(N)N.onclick=()=>{
  const ta=pop.querySelector("#nt"),cur=ta?ta.value:null;
  /* a fresh editor is prefilled with the saved note (a change never silently wipes the old one) */
  openPop(t,x,y,nbPopHTML(t,true)+'<textarea id="nt" rows="3" placeholder="write a note…">'+nbEsc(cur!=null?cur:(nbNoteText(t)||""))+'</textarea>');
  nbWirePopup(t,r,x,y);
  pop.querySelector("#nt").focus();
 };
 const S=pop.querySelector("#pS");
 if(S)S.onclick=()=>{if(S.disabled)return;nbSaveNote(t,x,y)};
 const D=pop.querySelector("#pD");
 /* 📝 Delete drops ONLY the note the gesture refers to and 🔊 Delete ONLY the recording (nbDeleteItem):
    the two items are independent, so neither button can take the other one with it (owner spec
    2026-10-12 #2). 🔊 Delete acts on the same single recording ▶ Play would play; with more than one
    involved it carries the disabled LOOK and toasts NB_REC_AMBIG instead of guessing. */
 if(D)D.onclick=()=>{if(D.disabled)return;nbDeleteItem(t,"note")};
 const A=pop.querySelector("#pA");
 if(A)A.onclick=()=>{if(A.disabled)return;
  if(A.classList.contains("locked")){toast(NB_REC_AMBIG);return}
  nbDeleteItem(t,"rec")};
}
/* ONE CORE SAVE for the note/recording layer:
   💾 Save (note) and rec() (recording) both go through here, so the two save paths can never
   drift apart again. It re-uses the id of the row ALREADY stored for this anchor+type, so a re-save
   REPLACES that row on the server (backend add/set deletes the row with the same id first) instead of
   appending a second one. That duplicate row was exactly why an edited note's Save looked like a
   no-op: the layer's first-match lookup (nbNoteText/nbPlayRecording) kept returning the OLD row.
   Equally for a recording: a rec row is always REPLACED, never duplicated, so the first-match lookup
   can never play a stale earlier clip. The local `layer` is updated BEFORE the network
   call (same "immediate" principle as nbDeleteItem) because the popup and renderLayer read the
   layer: without it the change only showed up at the next 1s poll. Network last (FUNCTION.md).
   The row is ALSO remembered in nbLocal, the local copy nbEntries serves while this write is still
   inside its grace window (see above) — the same treatment the highlight gives a freshly painted
   rectangle in hlList, so a poll snapshot that predates the write cannot blink the note out. */
function nbUpsert(t,type,fields,from){
 /* `from` = the anchor the row had BEFORE this save: a note whose area EXPANDED keeps its own id and
    takes the union's text as its new anchor (ONE row, a plain "set" — the backend deletes the row
    with that id first, so the anchor simply changes and nothing is duplicated). */
 /* the row this save REPLACES: same anchor+type — and, when the new fields carry a tie-breaker, the
    row stored on the SAME occurrence (a phrase repeated on the page is one item per occurrence, so a
    note in the dialogue must never overwrite the note in the top box) */
 const want=nbDataPos(fields&&fields.data);
 const cur=nbEntries(from!=null?from:t).filter(it=>it.type===type)
  .find(it=>{if(from!=null)return true;const p=nbDataPos(it.data);return(want&&p)?(p.b===want.b&&p.o===want.o):true});
 const id=cur?cur.id:(Date.now()+"_"+Math.floor(Math.random()*9999));
 const row=Object.assign({id:id,type:type,anchor:t,author:who(),ts:new Date().toISOString()},fields||{});
 const i=layer.findIndex(it=>it.id===id);
 const merged=i>=0?(layer[i]=Object.assign({},layer[i],row)):(layer.push(row),row);
 /* keep the local copy of the row too (nbLocal, see nbEntries): the poll that brings a snapshot
    predating this write must not make the note/recording vanish until the server catches up */
 nbLocal=nbLocal.filter(r=>r.id!==id);nbLocal.push(merged);
 send(Object.assign({action:cur?"set":"add"},row));
 return id;
}
/* paint the phrase — this is the SAVE side (called by the popup's 💾 Save): mark.nb carries
   has-note only HERE, never at the moment the note button was clicked. An empty note simply
   closes the editor (no blank save). Network last, so a failed save never undoes what was just
   painted (FUNCTION.md). */
/* grow a note's painted area to the plan's span (owner rule: "the first note area is expanded to the
   new selection"). The UNION is wrapped FIRST: nbWrap MOVES what it covers into the new mark (it
   never clones), so a recording sitting inside the union rides along as a nested piece that keeps its
   own data-a and has-rec — never the old unmark/re-paint dance, which re-derived the recording's span
   from its anchor text and could land on another occurrence of the phrase. Only THEN is the note flag
   dropped from the note's OWN, now-stale pieces: a piece that carries nothing else is unwrapped, a
   piece that also carries the recording stays — so growing a note can never delete, move or re-flag
   the recording (owner spec 2026-10-12 #2: the two items are independent). The ROW itself is
   re-anchored by nbUpsert(…, from) — same id, ONE row. */
function nbExpandNote(anchor,plan){
 const m=nbWrap(plan.anchor,nbAreaRange(plan.area),"note");
 if(!m)return null;
 nbUnflag(anchor,"has-note");
 return m;
}
function nbSaveNote(t,x,y){
 if(!pop)return;
 const ta=pop.querySelector("#nt");if(!ta)return;   /* 💾 Save is live only while editing — never throw */
 const v=ta.value.trim();
 if(!v){refreshNbPopup(t,x,y,false);return}   /* an empty note just closes the editor, never the popup */
 /* OWNER RULE (overlaps): the popup came from a selection that OVERLAPPED this note (nbSel.expand,
    planned by openNbPopup) → the note's AREA expands to the new selection and the union's text
    becomes its anchor; a selection strictly INSIDE the note plans no expansion, so the note keeps its
    original string as its reference. */
 const plan=nbSel&&nbSel.expand;
 let to=t,pos=null;
 if(plan){to=plan.anchor;pos=nbPosOf(plan.area);nbSel.expand=null}
 else{pos=nbPosOf(pendingRange);to=nbSpanText(pendingRange)||t}
 const id=nbUpsert(to,"note",{data:nbNoteData(v,pos)},plan?t:null);   /* same id → REPLACES the row (re-anchored when it grew) */
 ntMake(to,pos?pos.b:null,pos?pos.o:null,id);   /* paint the note's wash on its own layer */
 refreshNbPopup(to,x,y,false);   /* 💾 Save LEAVES the edit state (FUNCTION.md): Save greys again */
}
/* rebuild the popup's buttons for the current state (the two arrays change with saved content and
   the textarea is dropped once the note is saved) — the LIVE note text is kept when edition is in
   flight so refreshing the wording never loses what was typed. */
function refreshNbPopup(t,x,y,editing){
 if(!pop)return;
 const ta=pop.querySelector("#nt"),cur=ta?ta.value:null;
 /* editing is EXPLICIT when passed: 💾 Save must drop the editor even though the popup it is
    called from still holds #nt. Omitted → keep the current state (any future caller). */
 if(editing===undefined)editing=!!ta;
 openPop(t,x,y,nbPopHTML(t,editing)+(editing?'<textarea id="nt" rows="3" placeholder="write a note…">'+nbEsc(cur!=null?cur:"")+'</textarea>':''));
 applyPopupZoom();
 nbWirePopup(t,null,x,y);
}
/* open the seven-button popup for an anchor — and, when it came from a SELECTION (r), resolve the
   owner's OVERLAP rules for that selection (every button state and action then comes from nbPopState):
     • the selection overlaps or contains a NOTE → that note is the ACTIVE note: the popup is about
       the note's own anchor (prefilled, its row found), and 💾 Save then expands the note's area to
       the new selection (nbExpandPlan) without disturbing a recording inside it;
     • the selection overlaps, contains or sits inside a RECORDING → that recording is what ▶ Play
       plays and 🔊 Delete deletes, and ⏺ Record is locked and toasts the refusal (NB_REC_LOCKED).
       MORE than one recording involved → ▶ Play and 🔊 Delete are locked too and toast NB_REC_AMBIG;
     • a selection that merely ABUTS a mark (shares no character) is an ordinary new phrase.
   A popup opened by a click on a mark (showAnchor, r=null) has no selection: its target is the
   mark's own anchor, so the phrase's own note and recording are what its buttons act on — and ⏺
   Record is locked there too (delete the clip first). */
function openNbPopup(t,r,x,y){
 const selArea=r?nbSelArea(r,t):null;
 const note=selArea?nbPickNote(selArea):null;
 const anchor=note?note.anchor:t;
 const target=note?note.area:selArea;      /* the span the popup's own actions act on */
 nbSel={area:selArea,note:note?anchor:null,expand:nbExpandPlan(note,selArea)};
 /* the range the save wraps, TRIMMED to the anchor (nbSelArea): a mark covers exactly its own anchor
    text, so two abutting saves can never share the boundary space */
 pendingRange=(target?nbAreaRange(target):null)||(r?r.cloneRange():null);
 openPop(anchor,x,y,nbPopHTML(anchor,!!pop&&!!pop.querySelector("#nt")));
 nbPlacePopup(r,x,y,true);
 nbWirePopup(anchor,pendingRange,popXY.x,popXY.y);
}
/* wrap the phrase into mark.nb and paint the recording flag — this is the SAVE side for a clip
   (called from rec() once the bytes are ready, and by engine2's renderLayer when a saved
   recording is restored). A recording NEVER paints the mark at the instant ⏺ Record is clicked;
   the underline is the saved clip's proof, per the owner spec. Idempotent: an existing mark.nb is
   reused. (r = the live selection range when the popup came from one.) */
function markRecording(t,r){
 if(r){const m=wrapRange(t,r,"rec");if(m)nbFlagAt(t,nbMarkPos(m)||nbPosOf(r),"has-rec");return m}
 return ensureMark(t,"rec");      /* ensureMark paints the anchor's text AND flags it has-rec */
}
/* 📝 Add/Edit Note (owner spec 2026-10-12): the editor opens over the SAME popup (every button
   stays; the seven buttons simply re-render, and Save lights up). When the phrase already HAS a note
   the editor is prefilled with it, so a change never silently wipes the old one. Pre-focusing the
   textarea keeps the popup open while the user types (the outside-click-to-close listener fires on
   mousedown). Nothing here touches mark.nb — the blue wash is applied only by nbSaveNote/💾 Save,
   never by clicking the note button. */
function nbNoting(t,r,x,y){
 const cur=nbNoteText(t)||"";
 openPop(t,x,y,nbPopHTML(t,true)+'<textarea id="nt" rows="3" placeholder="write a note…">'+nbEsc(cur)+'</textarea>');
 nbWirePopup(t,r,x,y);
 try{pop.querySelector("#nt").focus()}catch(e){}
}
/* ▶ Play recording (owner spec 2026-10-12): the phrase's saved recording, played back on demand.
   Audio never sits in the layer — the row carries only the Drive fileId (uploaded clips) or the
   inline b64 (tiny ones). So the first play fetches the bytes (?action=file&id=…) and turns them
   into an object URL cached under "a:"+anchor — the very same key the just-finished recording
   already uses (rec() above), so a clip you just recorded plays back with zero fetch.
   The chain is resilient by design: a cached URL is tried first, a failed fetch falls through to
   the inline b64 when there is one, and a stale cached URL (revoked/reloaded) retries once from
   the server — the button never dead-ends and never throws into the page. */
function nbPlayAudio(u,done){
 try{const a=new Audio(u);a.addEventListener("ended",()=>{if(done)done(false)},{once:true});
  a.addEventListener("error",()=>{if(done)done(true)},{once:true});
  a.play().catch(()=>{if(done)done(true)});return a}catch(e){return null}
}
/* a play that finished cleanly → retry=false (hide the spiral). A failed play → retry=true: the
   cached URL is dropped and playback is retried once from the server (inline b64 / ?action=file),
   which now rejoins nbPlayRecording WITHOUT a done callback — so a retry never re-enters the spiral
   toggle and can never loop. */
function nbAfterPlay(key,src,done){const a=nbPlayAudio(src,done);if(!a){if(done)done(true);return}clearTimeout(audioCache[key+"_ev"]);a.addEventListener("error",()=>{delete audioCache[key];nbPlayRecording(key.replace(/^a:/,""))},{once:true})}
function nbPlayRecording(t,done){
 const key="a:"+t;
 if(audioCache[key]){nbAfterPlay(key,audioCache[key],done);return}
 const rec=nbEntries(t).find(it=>it.type==="rec");
 if(!rec){toast("Sem gravação nesta frase.");if(done)done();return}
 const fromInline=()=>{if(rec.b64){audioCache[key]=b64url(rec.b64,rec.mime);nbAfterPlay(key,audioCache[key],done);return true}return false};
 if(rec.fileId){
  fetch(BACKPACK+"?action=file&id="+encodeURIComponent(rec.fileId)+"&t="+Date.now())
   .then(r=>r.json()).then(j=>{
    if(j&&j.b64){audioCache[key]=b64url(j.b64,j.mime);nbAfterPlay(key,audioCache[key],done);}
    else if(!fromInline()){toast("⚠ não consegui carregar o áudio");if(done)done();}
   })
   .catch(()=>{if(!fromInline()){toast("⚠ não consegui carregar o áudio");if(done)done()}});
  return;
 }
 if(!fromInline()){toast("Sem gravação nesta frase.");if(done)done();}
}
/* drop ONE flag from EVERY piece of an anchor's mark and unwrap the pieces that carry nothing else —
   leaves a clean DOM, so a later note/recording starts from the same pristine text. A piece that
   still carries the OTHER item stays on the page: that is what lets a note and a recording saved from
   the same selection be deleted one at a time (owner spec 2026-10-12 #2). */
function nbUnflag(t,cls,pos){
 /* pos (optional) limits the sweep to the ONE occurrence the item lives on: the same words may carry
    an independent item further down the page, and deleting/expanding this one must not touch it */
 nbMarksAt(t,pos===undefined?null:pos).forEach(m=>{
  m.classList.remove(cls);
  if(m.classList.contains("has-rec")||m.classList.contains("has-note"))return;
  try{const p=m.parentNode;while(m.firstChild)p.insertBefore(m.firstChild,m);p.removeChild(m)}catch(e){}
 });
}
/* DELETE ONE ITEM (owner spec 2026-10-12 #2 — "notes and recordings need to be saved as separate
   items … we need delete to work separately too"): the popup's 📝 Delete drops ONLY the note the
   gesture refers to and 🔊 Delete ONLY the recording, each resolved by the same nbPopState the buttons
   were rendered from. Nothing else is touched: the other row, its mark pieces, its flags and the other
   button's state all survive, so a new note within/overlapping/containing a recording (or the
   reverse) can never take the other item with it. Unwraps the mark only once its own flag was the
   last one (nbUnflag). Drops the rows from the local `layer` at once (the server is the source of
   truth, but the UI must not keep a deleted item until the next 1s poll), then sends one del per row —
   network last, silent on success (the item visibly leaves the page). */
function nbDeleteItem(t,type){
 const st=nbPopState(t);
 const anchor=type==="note"?st.note:(st.rec?st.rec.anchor:null);
 if(!anchor){toast(type==="note"?"Nada para apagar nesta nota.":"Nada para apagar nesta gravação.");return}
 const rows=nbRows(type,anchor);
 layer=layer.filter(it=>it.type!==type||it.anchor!==anchor);
 if(type==="rec")delete audioCache["a:"+anchor];   /* a deleted clip must never replay from the cache */
 /* a note is dropped from its own layer; a recording drops its underline flag where it sits */
 if(type==="note")rows.forEach(r=>ntDrop(r.id));
 else rows.forEach(r=>nbUnflag(anchor,"has-rec",nbDataPos(r.data)));
 refreshNbPopup(t,popXY.x,popXY.y,false);   /* the popup stays; only a later click/touch/gesture dismisses it */
 rows.forEach(r=>send({action:"del",id:r.id}));
}
function openPop(t,x,y,html){closePop();popXY={x,y};pop=document.createElement("div");pop.className="pop";
 pop.style.left=x+"px";pop.style.top=y+"px";
 pop.innerHTML=html;document.body.appendChild(pop);return pop}
/* page zoom: keep the note/record popup a constant on-screen size (CSS zoom) while it keeps following
   its anchor (re-placed on every zoom change). CSS zoom re-flows (no sub-pixel blur); the highlight
   palette is never touched. */
let nbPlaceR=null,nbPlaceX=0,nbPlaceY=0;
let dprBase=1;try{dprBase=window.devicePixelRatio||1}catch(e){}
function popScale(){return ((window.visualViewport&&visualViewport.scale)||1)*((window.devicePixelRatio||1)/(dprBase||1))}
function nbPlacePopup(r,x,y,fit){
 if(r)nbPlaceR=r;
 if(x!==undefined){nbPlaceX=x;nbPlaceY=y;}
 if(!pop)return;
 const sx=window.scrollX||0,sy=window.scrollY||0;
 const ow=pop.offsetWidth,oh=pop.offsetHeight;
 let rl=0,rt=0,rw=1,rb=0,endX=0;
 if(nbPlaceR){const rr=nbPlaceR.getBoundingClientRect();rl=rr.left;rt=rr.top;rw=rr.width;rb=rr.bottom;
  try{const er=nbPlaceR.cloneRange();er.collapse(false);endX=er.getBoundingClientRect().left;}catch(e){endX=rr.right;}}
 else{rl=nbPlaceX-sx;rt=nbPlaceY-sy;rb=nbPlaceY-sy;endX=nbPlaceX-sx;}
 const isCenter=(rw<ow),anchorX=isCenter?ow/2:ow;
 const leftV=(isCenter)?(rl+rw/2-anchorX):(endX-anchorX);
 const topV=rb+10;
 pop.style.transformOrigin=anchorX+"px 0px";
 pop.style.transform="scale("+(1/popScale())+")";
 pop.style.left=(leftV+sx)+"px";pop.style.top=(topV+sy)+"px";
 if(fit){const vv=window.visualViewport||null,vl=vv?vv.offsetLeft:0,vt=vv?vv.offsetTop:0,vw=vv?vv.width:innerWidth,vh=vv?vv.height:innerHeight;
  let tb=pop.getBoundingClientRect();
  if(tb.bottom>=vt+vh){pop.style.top=(rt-10-tb.height+sy)+"px";tb=pop.getBoundingClientRect();}
  if(tb.left<=vl){pop.style.left=(parseFloat(pop.style.left)+(vl-tb.left)+5)+"px";}
  else if(tb.right>=vl+vw){pop.style.left=(parseFloat(pop.style.left)-(tb.right-(vl+vw))-5)+"px";}}
 popXY={x:parseFloat(pop.style.left),y:parseFloat(pop.style.top)};
}
function applyPopupZoom(){if(pop&&!pop.classList.contains("hlpalpop"))pop.style.transform="scale("+(1/popScale())+")"}
function popFitZoom(){if(pop&&!pop.classList.contains("hlpalpop"))nbPlacePopup()}
if(window.visualViewport){visualViewport.addEventListener("resize",popFitZoom);visualViewport.addEventListener("scroll",popFitZoom)}
addEventListener("resize",popFitZoom);
/* popup placement: below the END (bottom-right) of the span, kept inside the viewport (10px from the
   right edge). The caller passes the selection's bounding rect, or the click point as a zero-area rect. */
function nbPopupXY(r){
 const sx=window.scrollX||0,sy=window.scrollY||0;
 return {x:(r.right||(r.left||20)+1)+sx, y:(r.bottom||60)+sy};
}
document.addEventListener("mousedown",e=>{if(pop&&pop.contains(e.target)){if(!(e.target.closest&&e.target.closest("textarea,input,select")))e.preventDefault();return}closePop();nbSel=null;try{getSelection().removeAllRanges()}catch(e){}});
/* mobile: a TAP outside the popup dismisses it, but a pan/pinch-zoom (which also starts with a
   touchstart) must NOT dismiss the popup or clear the selection — only a touch that ends without
   moving counts as a tap. */
let tsEl=null,tsX=0,tsY=0,tsMoved=false;
document.addEventListener("touchstart",e=>{const t=e.touches&&e.touches[0];tsX=t?t.clientX:0;tsY=t?t.clientY:0;tsEl=e.target;tsMoved=false;},{passive:true});
document.addEventListener("touchmove",e=>{const t=e.touches&&e.touches[0];if(t){const dx=t.clientX-tsX,dy=t.clientY-tsY;if(dx*dx+dy*dy>64)tsMoved=true;}},{passive:true});
document.addEventListener("touchend",e=>{if(!tsMoved&&pop&&tsEl&&!pop.contains(tsEl)){closePop();nbSel=null;try{getSelection().removeAllRanges()}catch(err){}}});
/* ---- gesture gate (owner spec 2026-10-12): Hear/Record/Note and Highlight are BOTH decided
   strictly at mouse-release, never mid-drag. mouseIsDown blocks the debounced selectionchange
   path for the whole press; the moment the button is released this same function is called
   directly (see the mouseup listener just below), so the popup opens exactly at release, gated
   on Ctrl exactly like the highlight gesture is (Ctrl released → Note/Record/Hear; Ctrl held →
   highlight only, per the HIGHLIGHT section gate further down). */
let mouseIsDown=false;
document.addEventListener("mousedown",()=>{mouseIsDown=true});
document.addEventListener("mouseup",()=>{mouseIsDown=false;clearTimeout(selTimer);trySelPopup()});
/* seleção: abre só quando a seleção MUDA (funciona em mobile; não dispara ao clicar em botões) */
function trySelPopup(){ if(editing)return;
  const sel=getSelection();let t=sel?sel.toString().trim():"";
  if(mouseIsDown)return; /* never open mid-drag — the mouseup listener fires this at release */
  if(t===lastSelText)return;
  if(!t)return;
  /* Ctrl gesture (Ctrl at mousedown) — or the tail of one — = HIGHLIGHT territory: the highlight
     has no size limit, so neither the note/record popup NOR its size message fires for it. */
  if(hlDownCtrl||Date.now()<hlSuppressUntil||ctrlHeld||Date.now()-lastCtrlUp<900){lastSelText=t;return;}
  if(t.length<3||t.length>200){lastSelText=t;toast("please select between 3 and 200 characters of text to enable notes and recordings");return;}
 if(!sel.rangeCount)return;
 const r=sel.getRangeAt(0);
 const n=r.commonAncestorContainer;const el=n.nodeType===1?n:n.parentElement;
 if(el&&el.closest(".pop,script,style,button,textarea,input,select,a"))return;
 /* ONE BLOCK ONLY (owner spec 2026-10-12, same rule the highlight already uses): a selection
    that crosses a block element (paragraph → list item, cell → cell, heading → paragraph, …)
    must NOT trigger this popup. It is refused with a toast — same wording family as the
    highlight's refusal — and the popup stays shut. The check is the same helper (hlBlockOf,
    hoisted) so the two features can never drift apart. Wrapped in try/catch exactly like
    hlApply: in a real browser the getters can throw on a stale/edge range; jsdom may lack
    layout — either way the popup degrades to staying shut, never to a page error. */
 try{
  const nrm=hlRangeNorm(r);
  if(!nrm||!hlBlockOf(nrm.s.n)||hlBlockOf(nrm.s.n)!==hlBlockOf(nrm.e.n)){
   toast("Selecione um trecho dentro de um mesmo bloco.");
   lastSelText=t;
   return;
  }
 }catch(e){lastSelText=t;return;}
 /* the anchor is the DOM's OWN text of the span, never the browser's selection string: that string
    NORMALISES a line break to a space (lesson 1's line 31 → 32 crosses "·\n"), so a row stored from
    it could never be found in the page again and its mark would not "cover exactly its own anchor
    text" — the owner's "anchored to exactly what the mark paints" (QA B-F4 step 2). The span above is
    inside ONE block, so its text is unambiguous; the wrap is trimmed to it the same way. */
 const dom=nbSpanText(r);
 if(dom){const dt=dom.trim();if(dt.length>=3&&dt.length<=200)t=dt}
 pendingRange=r.cloneRange();
 const p=nbPopupXY(r.getBoundingClientRect());
 openNbPopup(t,pendingRange,p.x,p.y);
 lastSelText=t;
}
let selTimer=null;
document.addEventListener("selectionchange",()=>{clearTimeout(selTimer);selTimer=setTimeout(trySelPopup,350)});
document.addEventListener("touchend",()=>{clearTimeout(selTimer);selTimer=setTimeout(trySelPopup,450)});
document.addEventListener("click",e=>{if(editing)return;const nb=e.target.closest("mark.nb");
 /* Ctrl+click on a painted highlight = delete it. That is the ONLY interaction a highlight has:
    the layer is pointer-events:none (so it never blocks a click, a drag or a selection), which
    is why the click is hit-tested against the painted rectangles here. It adds no popup, no
    hover state and no cursor change to the text. */
 if(e.ctrlKey||e.metaKey){
   const moved=!hlDownXY||Math.abs(e.clientX-hlDownXY.x)>4||Math.abs(e.clientY-hlDownXY.y)>4;
   if(!moved&&Date.now()-hlJustRan>600){const rec=hlAtPoint(e.clientX,e.clientY);
   if(rec){e.preventDefault();e.stopPropagation();hlDelete(rec)}}
  return;
 }
 if(lastSelText)return; /* the click at the tail of a selection drag must not re-open the popup for a mark/note */
 if(nb){e.stopPropagation();
  if(window.showAnchor){const p=nbPopupXY({left:e.clientX,right:e.clientX,top:e.clientY,bottom:e.clientY});showAnchor(nb.dataset.a,p.x,p.y)}return}
 /* a note is painted on its own pointer-events:none layer, so a click on its text lands below it:
    hit-test the note layer (like a highlight) and open the same popup for the note's anchor */
 const nr=ntAtPoint(e.clientX,e.clientY);
 if(nr){e.stopPropagation();
  if(window.showAnchor){const p=nbPopupXY({left:e.clientX,right:e.clientX,top:e.clientY,bottom:e.clientY});showAnchor(nr.anchor,p.x,p.y)}}});
/* ---- the mark SET of an anchor: mark.nb[data-a=<the anchor text>] -------------------------------
   An anchor is usually painted by ONE mark element, but a note/recording painted ACROSS an older
   mark's edge SPLITS that older mark into pieces that BOTH keep its data-a and its flags. The
   anchor's text is then the concatenation of its pieces, each piece keeps its own 2px inset on its
   own edges (style.css), and every lookup below (and in engine2's renderLayer) still finds the row.
   This is what makes abutting and overlapping saves possible at all */
function nbMarks(t){return [...document.querySelectorAll('mark.nb[data-a="'+CSS.escape(String(t))+'"]')]}
/* flag EVERY piece of an anchor (has-rec / has-note) and hand back the first one */
function nbFlag(t,cls){const other=cls==="has-note"?"has-rec":"has-note";const ms=nbMarks(t).filter(m=>!m.classList.contains(other));ms.forEach(m=>m.classList.add(cls));return ms[0]||null}
/* the first/last TEXT node inside a node (a mark piece's own text, however deeply nested) */
function nbEdgeText(n,first){if(!n)return null;if(n.nodeType===3)return n;
 const k=[...n.childNodes];
 for(let i=first?0:k.length-1;first?i<k.length:i>=0;first?i++:i--){const t=nbEdgeText(k[i],first);if(t)return t}
 return null}
/* (node,offset) → the TEXT node that range boundary really sits on (an element boundary is pushed to
   the first/last text inside the child next to it) */
function nbTextPoint(c,off,first){if(!c)return null;if(c.nodeType===3)return{n:c,off:off};
 const k=[...c.childNodes];
 if(first){for(let i=off;i<k.length;i++){const t=nbEdgeText(k[i],true);if(t)return{n:t,off:0}}}
 else{for(let i=off-1;i>=0;i--){const t=nbEdgeText(k[i],false);if(t)return{n:t,off:t.data.length}}}
 return null}
/* split an element at child k: it keeps [0,k) and the REST moves into a same-styled clone placed
   right after it (an inline handler the split would otherwise lose is copied over) */
function nbSplitEl(el,k){if(!el||k<=0||k>=el.childNodes.length)return el;
 const c=el.cloneNode(false);try{if(el.onclick)c.onclick=el.onclick}catch(e){}
 while(el.childNodes.length>k)c.appendChild(el.childNodes[k]);
 el.parentNode.insertBefore(c,el.nextSibling);return c}
/* wrap a range into a NEW mark.nb[data-a=t] and return it (null when the range covers no node).
   The two boundaries are first pushed out to whole SIBLING nodes (a text node is split, a partially
   covered element is split with nbSplitEl) and the covered run is MOVED into the new mark — never
   cloned. A mark of the SAME type that is crossed by the edge is split into pieces that keep its own
   data-a and flags; a mark of the OTHER type (note vs recording) is NEVER split — it is carried whole
   (nested) into the new mark, so creating a note never splits a recording and vice versa. */
function nbOtherMark(el,type){return !!(el&&el.nodeType===1&&el.tagName==="MARK"&&el.classList.contains(type==="note"?"has-rec":"has-note")&&!el.classList.contains("has-"+type))}
function nbWrap(t,r,type){
 if(!r)return null;
 const s=nbTextPoint(r.startContainer,r.startOffset,true),e=nbTextPoint(r.endContainer,r.endOffset,false);
 if(!s||!e)return null;
 const m=document.createElement("mark");m.className="nb";m.dataset.a=String(t);
 /* the mark remembers WHICH occurrence it was painted on (same ruler as the highlights), so every
    later lookup that carries a place can tell two identical phrases apart */
 const at=nbAreaOfRange(r);if(at)nbSetMarkPos(m,at.b,at.s);
 if(s.n===e.n){                              /* inside ONE text node: split it into head/mid/tail */
  if(e.off<=s.off)return null;
  const mid=s.n.splitText(s.off);
  if(e.off-s.off<mid.data.length)mid.splitText(e.off-s.off);
  mid.parentNode.insertBefore(m,mid);m.appendChild(mid);return m;
 }
 let sN=s.n,eN=e.n;
 if(s.off>0)sN=sN.splitText(s.off);           /* sN keeps only the covered head */
 if(e.off<eN.data.length)eN.splitText(e.off); /* the uncovered tail leaves eN */
 const ca=r.commonAncestorContainer;
 let sTop=sN;
 for(let p=sN.parentNode;p&&p!==ca;p=p.parentNode){
  if(nbOtherMark(p,type)){sTop=p;continue;}
  const i=Array.prototype.indexOf.call(p.childNodes,sTop);
  if(i>0)sTop=nbSplitEl(p,i);else sTop=p}     /* after a split the clone carries the covered side */
 let eTop=eN;
 for(let p=eN.parentNode;p&&p!==ca;p=p.parentNode){
  if(nbOtherMark(p,type)){eTop=p;continue;}
  const i=Array.prototype.indexOf.call(p.childNodes,eTop);
  if(i+1<p.childNodes.length)nbSplitEl(p,i+1);/* the uncovered tail leaves; eTop keeps the covered end */
  eTop=p}
 const run=[];for(let n=sTop;n;n=n.nextSibling){run.push(n);if(n===eTop)break}
 if(!run.length||run[run.length-1]!==eTop)return null;
 ca.insertBefore(m,sTop);
 run.forEach(n=>m.appendChild(n));
 return m}
/* wrap an anchor's range (a live selection when the popup came from one; the text found by findRange
   when a stored row is being restored). An anchor that is ALREADY painted (SAME type) is never wrapped
   twice: a note and a recording on the SAME phrase are TWO SEPARATE marks, each carrying its own flag. */
function wrapRange(t,r,type){
 /* only a mark painted at THE SAME OCCURRENCE counts as "this item already": the phrase may be
    painted on ANOTHER occurrence of the same words (a note in the top box and a recording in the
    dialogue), and reusing that mark would flag the wrong place and leave this span unpainted */
 const pos=nbPosOf(r);
 const ex=nbMarksAt(t,pos).filter(m=>m.classList.contains("has-"+type))[0]||(pos?null:nbMarks(t).filter(m=>m.classList.contains("has-"+type))[0]);if(ex)return ex;
 return r?nbWrap(t,r,type):null}
/* an anchor's text → a live Range. Marked text is walked TOO: an anchor may abut, cross or sit
   inside another mark and stays findable. */
function findRange(t){
 const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const nodes=[];let all="";let n;
 while(n=w.nextNode()){if(n.parentElement&&n.parentElement.closest("script,style,.pop,#hlLayer"))continue;nodes.push({n,start:all.length});all+=n.data;}
 const i=lineNorm(all).indexOf(lineNorm(t));if(i<0)return null;const end=i+t.length;let a=null,b=null;
 for(const o of nodes){if(!a&&o.start<=i&&i<o.start+o.n.data.length)a={n:o.n,off:i-o.start};
  if(!b&&o.start<end&&end<=o.start+o.n.data.length)b={n:o.n,off:end-o.start};}
 if(!a||!b)return null;
 const r=document.createRange();r.setStart(a.n,a.off);r.setEnd(b.n,b.off);return r;
}
/* (re)paint an anchor's mark and flag it: reuse the existing mark set, otherwise wrap the anchor's
   text where it lies on the page */
function ensureMark(t,type,at){
 /* `at` = where to paint: a live Range (a selection just made), a stored {b,o} place (a row being
    restored) or nothing (a click on a mark → the text itself decides, as before) */
 const pos=nbPosOf(at);
 let ms=nbMarksAt(t,pos).filter(m=>m.classList.contains("has-"+type));
 if(!ms.length){
  const r=nbRangeFor(t,pos,at);
  if(!r)return null;
  const m=nbWrap(t,r,type);if(!m)return null;
  if(pos)nbSetMarkPos(m,pos.b,pos.o);
  ms=[m];
 }
 ms.forEach(m=>m.classList.add("has-"+type));
 return ms[0];
}
/* ---- HIGHLIGHT (owner spec 2026-10-11 #2) — its OWN PAINT LAYER, never inside the text ------
   Ctrl held at MOUSEDOWN over a selection  → the Hear / Record / Note functions are suppressed
                                              for that whole gesture
   Ctrl STILL held at MOUSEUP               → the selected string becomes a highlight
                                              (nothing else ever triggers a highlight)
   Ctrl + click on a painted highlight      → delete that highlight (the ONLY interaction it has)
   Ctrl + drag over a highlight             → SUBTRACT, never merge (owner spec 2026-10-12, hlSubtract): the new
                                               highlight keeps its WHOLE selection and the older highlight loses exactly the
                                               characters it covers — it shrinks, is split into two,
                                               or is deleted when nothing of it is left
                                              (a highlight is never merged with another one)
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
   (yellow / transparent red / transparent green); any click or key press closes it — except
   Ctrl/Meta, the gesture's own key, whose still-held auto-repeat must not kill it. */
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
document.addEventListener("mousedown",e=>{if(editing)return;const c=!!(e.ctrlKey||e.metaKey);hlDownCtrl=c;
 hlDownXY={x:e.clientX,y:e.clientY};
 hlSuppressUntil=c?Number.MAX_SAFE_INTEGER:0},true);
document.addEventListener("mouseup",e=>{if(editing)return;const was=hlDownCtrl;hlDownCtrl=false;
 if(!was)return;
 hlSuppressUntil=Date.now()+1200;
 const moved=!hlDownXY||Math.abs(e.clientX-hlDownXY.x)>4||Math.abs(e.clientY-hlDownXY.y)>4;
 if(moved&&(e.ctrlKey||e.metaKey||ctrlHeld))hlFromSelection()},true);
/* runs on mouseup only: Ctrl at mousedown AND still held now → highlight the selected string */
function hlFromSelection(){
 const sel=getSelection();if(!sel||!sel.rangeCount)return;
 const t=sel.toString().trim();if(!t)return;
 const rc=sel.getRangeAt(0).cloneRange();
 lastSelText=t;
 hlApply(rc);
}
/* any key press closes the colour palette — EXCEPT Ctrl/Meta themselves: the palette is born while
   the gesture key is STILL held down (the highlight runs at mouseup, Ctrl and all), so the keyboard
   keeps auto-repeating that key's keydown right when the palette appears; the repeat of the key
   that owns the gesture must never close the popup that gesture just opened (FUNCTION.md) */
document.addEventListener("keydown",e=>{
 if(e.key==="Control"||e.key==="Meta")return;
 if(pop&&pop.classList.contains("hlpalpop")){closePop();try{getSelection().removeAllRanges()}catch(e){}}},true);
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
 /* a ZERO-WIDTH rect paints nothing and must not become a rectangle: Chrome hands one back for a
    range that starts on an inline-box boundary (the bf2b diagnostic showed the same row painted
    twice — [x,y,0,h] beside [x,y,w,h] — which made "one rectangle per occurrence" fail). `height` is
    kept in the test only so a degenerately flat rect can never slip through either. */
 return list.filter(b=>b.width>0&&b.height>0).map(b=>({left:b.left+sx,top:b.top+sy,width:b.width,height:b.height}))}
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
/* re-measure AFTER the layout settles (double rAF): the <details> toggle event and fonts.ready both
   fire before the browser re-lays-out / re-paints, so a plain timer could read the old geometry. */
function hlReflowAfterLayout(){requestAnimationFrame(()=>requestAnimationFrame(hlReflow))}
addEventListener("resize",hlQueueReflow);
addEventListener("load",hlQueueReflow);
document.addEventListener("toggle",hlReflowAfterLayout,true);
document.addEventListener("mouseup",()=>{if(hlList.length)hlQueueReflow()},true);
if(document.fonts&&document.fonts.ready)try{document.fonts.ready.then(hlReflowAfterLayout)}catch(e){}
function hlSetColor(rec,c){if(!rec)return null;rec.color=hlColorOk(c);hlReflow();return rec}
function hlDrop(id){hlList=hlList.filter(r=>r.id!==id);hlReflow()}
function hlDelete(rec){if(!rec)return;
 const id=rec.id;
 hlDrop(id);
 closePop();
 /* network last: a failed save must never undo what the user just saw */
 if(id)send({action:"del",id})}
/* ---- where a stored highlight lives: (block index, character offset) with text fallbacks ----
   The text+offset anchor wins over the anchor text alone, so two identical strings highlighted
   in the same block keep their own places. Old rows carry only the anchor text (fallback). */
function hlLocate(anchor,bHint,oHint){
 const t=String(anchor||"");if(!t)return null;
 const bl=hlBlocks();
 if(bHint!=null&&oHint!=null&&bl[bHint]){try{if(lineNorm(bl[bHint].textContent).substr(oHint,t.length)===lineNorm(t))return{b:bHint,start:oHint}}catch(e){}}
 if(bHint!=null&&bl[bHint]){const i=lineNorm(bl[bHint].textContent).indexOf(lineNorm(t));if(i>=0)return{b:bHint,start:i}}
 for(let i=0;i<bl.length;i++){const j=lineNorm(bl[i].textContent).indexOf(lineNorm(t));if(j>=0)return{b:i,start:j}}
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
 if(rec){rec.color=hlColorOk(d.color);return rec}
 const spot=hlLocate(anchor,d.b,d.o);
 if(!spot||spot.start<0)return null;       /* that text is not on the page any more */
 rec=hlMake(anchor,d.color,spot.b,spot.start,row.id);
 return rec;
}
/* ---- NOTE = its own paint layer (owner option 1, 2026-10-13) ----------------------------------
   A note is a light-blue wash painted on #noteLayer, exactly like a highlight on #hlLayer: a note is
   NOT an element of the text, so a note and a recording (mark.nb) can overlap in any way and never
   interact. Recordings stay mark.nb.has-rec (the underline). */
let ntList=[];
function ntLayerEl(){let L=document.getElementById("noteLayer");
 if(!L){L=document.createElement("div");L.id="noteLayer";L.setAttribute("aria-hidden","true");document.body.appendChild(L)}
 return L}
function ntRectList(rec){const r=nbRangeOf(rec.anchor,rec.b,rec.o);if(!r)return [];
 let list=[];try{list=r.getClientRects?[...r.getClientRects()]:[]}catch(e){list=[]}
 if(!list.length){try{const b=r.getBoundingClientRect();if(b&&(b.width||b.height))list=[b]}catch(e){}}
 const sx=window.scrollX||0,sy=window.scrollY||0;
 return list.filter(b=>b.width>0&&b.height>0).map(b=>({left:b.left+sx,top:b.top+sy,width:b.width,height:b.height}))}
function ntReflow(){const L=ntLayerEl();L.innerHTML="";
 ntList.forEach(rec=>{rec.rects=ntRectList(rec);
  rec.rects.forEach(r=>{const d=document.createElement("div");d.className="ntr";d.dataset.ntid=rec.id;
   d.style.left=Math.round(r.left)+"px";d.style.top=Math.round(r.top)+"px";
   d.style.width=Math.round(r.width)+"px";d.style.height=Math.round(r.height)+"px";L.appendChild(d)})})}
function ntMake(anchor,b,o,id){
 const t=String(anchor);
 const spot=(b==null||o==null)?hlLocate(t,null,null):{b:Number(b),start:Number(o)};
 if(!spot||spot.start<0)return null;
 const nid=id||Date.now()+"_"+Math.floor(Math.random()*9999);
 ntList=ntList.filter(r=>r.id!==nid);   /* replace, never duplicate (a re-anchored note keeps its id) */
 const rec={id:nid,anchor:t,b:spot.b,o:spot.start};
 rec.rects=ntRectList(rec);ntList.push(rec);ntReflow();return rec}
function ntById(id){return ntList.find(r=>r.id===id)||null}
function ntRestore(row){const anchor=String((row&&row.anchor)||"");if(!anchor)return null;
 let rec=ntById(row.id);
 if(rec){const p=nbDataPos(row.data);if(p){rec.b=p.b;rec.o=p.o}return rec}
 const p=nbDataPos(row.data);
 return ntMake(anchor,p?p.b:null,p?p.o:null,row.id)}
function ntDrop(id){ntList=ntList.filter(r=>r.id!==id);ntReflow()}
function ntAtPoint(x,y){const sx=window.scrollX||0,sy=window.scrollY||0;
 return ntList.find(rec=>(rec.rects||[]).some(r=>x+sx>=r.left&&x+sx<=r.left+r.width&&y+sy>=r.top&&y+sy<=r.top+r.height))||null}
let ntReflowTimer=0;
function ntQueueReflow(){clearTimeout(ntReflowTimer);ntReflowTimer=setTimeout(ntReflow,80)}
function ntReflowAfterLayout(){requestAnimationFrame(()=>requestAnimationFrame(ntReflow))}
addEventListener("resize",ntQueueReflow);
addEventListener("load",ntQueueReflow);
document.addEventListener("toggle",ntReflowAfterLayout,true);
document.addEventListener("mouseup",()=>{if(ntList.length)ntQueueReflow()},true);
if(document.fonts&&document.fonts.ready)try{document.fonts.ready.then(ntReflowAfterLayout)}catch(e){}
/* hover cursor for notes: the note wash lives on a pointer-events:none layer, so it can't carry a CSS
   cursor the way the recording underline does (mark.nb{cursor:pointer}). Hit-test the note rects on
   mousemove (the same ntAtPoint the click handler uses) and show the hand pointer over a note. */
document.addEventListener("mousemove",e=>{document.body.style.cursor=ntAtPoint(e.clientX,e.clientY)?"pointer":""},{passive:true});

/* ---- PRINT (owner 2026-10-15): a custom Print button renders a clean, print-safe snapshot of the
   lesson instead of the broken @media print + mix-blend-mode + background-graphics path. Marks are
   re-painted as flat translucent fills (no blend), recording underlines become a real text-decoration,
   typed inputs/radios/textarea are baked into the text, and print-color-adjust:exact forces the washes
   to print. The snapshot is removed as soon as print() returns, so the hlBlocks() ruler never sees it. */
function printLesson(){
 const src=document.querySelector(".content-area");
 if(!src){toast("Nada para imprimir.");return}
 let pv=document.getElementById("printRoot");if(pv)pv.remove();
 hlReflow();ntReflow();                       /* re-measure marks at the current layout/scroll */
 const clone=src.cloneNode(true);
 const sr=src.getBoundingClientRect(),sx=window.scrollX||0,sy=window.scrollY||0;
 const ox=sr.left+sx,oy=sr.top+sy;            /* content-area origin in DOCUMENT coords */
 const layer=document.createElement("div");layer.className="pr-layer";
 hlList.forEach(rec=>{(rec.rects||[]).forEach(r=>{
  const d=document.createElement("div");d.className="pr-hl pr-hl-"+rec.color;
  d.style.left=(r.left-ox)+"px";d.style.top=(r.top-oy)+"px";d.style.width=r.width+"px";d.style.height=r.height+"px";
  layer.appendChild(d)})});
 ntList.forEach(rec=>{(rec.rects||[]).forEach(r=>{
  const d=document.createElement("div");d.className="pr-nt";
  d.style.left=(r.left-ox)+"px";d.style.top=(r.top-oy)+"px";d.style.width=r.width+"px";d.style.height=r.height+"px";
  layer.appendChild(d)})});
 clone.appendChild(layer);
 /* bake the student's typed answers + selections into the snapshot so they always print */
 clone.querySelectorAll("input.gap, input[type=text]").forEach(inp=>{
  const sp=document.createElement("span");sp.className="pr-gap";sp.textContent=inp.value||"\u00A0";inp.replaceWith(sp)});
 clone.querySelectorAll("textarea").forEach(tx=>{
  const d=document.createElement("div");d.className="pr-trw";d.textContent=tx.value||"";tx.replaceWith(d)});
 clone.querySelectorAll("input[type=radio], input[type=checkbox]").forEach(inp=>{
  const sp=document.createElement("span");sp.className="pr-radio "+(inp.checked?"pr-on":"pr-off");
  sp.textContent=inp.checked?"●":"○";inp.replaceWith(sp)});
 const root=document.createElement("div");root.id="printRoot";root.appendChild(clone);
 document.body.appendChild(root);
 document.body.classList.add("printing");     /* scope the @media print hide/show to this button press */
 window.print();
 document.body.classList.remove("printing");
 root.remove();                               /* never leave the clone in the DOM (ruler safety) */
}

/* ---- OVERLAP = SUBTRACT, NEVER MERGE (owner spec 2026-10-12) -----------------------------------
   A new highlight WINS the characters it covers: every character of the selection is removed from
   the highlight(s) already sitting on it, so a second highlight can carry a DIFFERENT colour over
   text that was already highlighted.
   The new highlight always keeps its WHOLE selection: nothing is ever extended to cover an older
   highlight (no union). `end` is EXCLUSIVE (hlMake: end = start + anchor.length), so a highlight
   that merely TOUCHES the new range (old.end === s or old.start === e) shares NO character with it
   and is left untouched — two same-colour highlights may sit side by side, seam and all.
   What survives of an older highlight keeps its OWN colour and row model; only its range shrinks:
     • partly covered                → ONE piece, the SAME row (a "set" with the shorter anchor);
     • new range strictly inside it  → TWO pieces: the first keeps the row (a "set"), the second is
                                       a brand-new row (an "add") — the highlight really is split
                                       in two, one row per piece, each keeping the older colour;
     • fully covered                 → no character left → its row is DELETED ("del").
   A piece that would be pure whitespace is not painted (the same rule a fresh selection follows);
   if that leaves nothing to paint at all, the row is deleted rather than left behind. */
function hlSubtract(s,e,b){
 hlList.filter(rec=>rec.b===b&&rec.start<e&&rec.end>s).forEach(rec=>{
  const bl=hlBlockEl(rec.b);if(!bl)return;
  const full=bl.textContent,head=rec.start,tail=rec.end;
  const parts=[];
  if(head<s)parts.push([head,Math.min(s,tail)]);
  if(tail>e)parts.push([Math.max(e,head),tail]);
  hlList=hlList.filter(x=>x!==rec);        /* the old range leaves the layer, whatever survives below */
  let row=rec.id,kept=0;
  parts.forEach(([p,q])=>{
   const t=full.slice(p,q);
   if(!t.trim())return;                    /* a whitespace-only piece is not a highlight */
   const keep=row;                         /* the FIRST surviving piece stays on the older row */
   const piece=hlMake(t,rec.color,rec.b,p,keep);
   send({action:keep?"set":"add",type:"hl",anchor:piece.anchor,id:piece.id,
    data:JSON.stringify({color:piece.color,b:piece.b,o:piece.start})});
   row=null;kept++;
  });
  if(!kept&&rec.id)send({action:"del",id:rec.id});
 });
}
function hlApply(r){
 if(!r)return;
 const nrm=hlRangeNorm(r);
 if(!nrm){toast("Selecione um trecho de texto para destacar.");return}
 const blk=hlBlockOf(nrm.s.n);
 if(!blk){toast("Selecione um trecho de texto para destacar.");return}
 /* one block only — a highlight never crosses a block boundary (boundaries normalized to text) */
 if(hlBlockOf(nrm.e.n)!==blk){toast("Destaque só dentro de um mesmo bloco.");return}
 const s=hlOffset(blk,nrm.s.n,nrm.s.off),e=hlOffset(blk,nrm.e.n,nrm.e.off);
 if(s<0||e<0){toast("Destaque só dentro de um mesmo bloco.");return}
 if(e<=s){toast("Selecione um trecho de texto para destacar.");return}
 const b=hlBlocks().indexOf(blk);
 if(b<0)return;
 const text=blk.textContent.slice(s,e);
 if(!text.trim()){hlReflow();return}     /* nothing worth painting — and nothing to subtract either */
 /* the selection wins the characters it covers: whatever highlight was already there loses exactly
    those characters (see hlSubtract) — the ranges are NEVER unioned, so the new colour survives.
    The note/recording layer is never looked at — a highlight may cross it freely. */
 hlSubtract(s,e,b);
 const m=hlMake(text,"yellow",b,s);
 hlJustRan=Date.now();
 hlPalette(m);
 /* network last: a failed save must never suppress the palette */
 send({action:"add",type:"hl",anchor:m.anchor,data:JSON.stringify({color:"yellow",b:m.b,o:m.start}),id:m.id});
}
/* tiny colour swatches, just above the LAST painted rectangle of the highlight.
   The colours themselves live in style.css (#hlLayer .hlr-* and .hlpal button[data-c]) */
function hlPalette(rec){
 hlReflow();
 const rs=rec.rects||[];
 const last=rs.length?rs.reduce((a,b)=>((b.top>a.top||(b.top===a.top&&b.left>a.left))?b:a)):null;
 const sx=window.scrollX||0,sy=window.scrollY||0,vw=window.innerWidth||800;
 const PAL_W=62,hlW=last?last.width:0;
 const cx=hlW<PAL_W;
 const rawX=last?(cx?(last.left+hlW/2-PAL_W/2):(last.left+hlW-PAL_W)):24;
 const x=Math.max(8,Math.min(Math.round(rawX),vw-PAL_W-8+sx));
 const y=Math.max(4,Math.round(last?last.top:40)-35);
 openPop("",x,y,'<span class="hlpal">'+HL_COLORNAMES.map(c=>'<button type="button" data-c="'+c+'" title="'+c+'"></button>').join("")+"</span>");
 if(!pop)return;
 pop.classList.add("hlpalpop");
 pop.querySelectorAll("button[data-c]").forEach(b=>{
  b.onclick=()=>{const c=b.dataset.c;
   hlSetColor(rec,c);
   closePop();
   try{getSelection().removeAllRanges()}catch(e){}   /* choosing a colour deselects the text */
   if(rec.id)send({action:"set",type:"hl",anchor:rec.anchor,data:JSON.stringify({color:c,b:rec.b,o:rec.start}),id:rec.id});
  };
 });
}
async function rec(t,rb){
 if(!pop||pop.dataset.recording)return;      /* one recording per phrase at a time (re-entry guard) */
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){alert("Microfone bloqueado — abra a lição em aba própria.");return}
  /* the Record button's glyph becomes a COUNTDOWN of the remaining capture time (10s max) instead of a toast. */
 if(pop)pop.dataset.recording="1";
 const press=on=>{if(rb&&rb.isConnected)nbBtnSpinner(rb,on)};
  const REC_MAX=10000;
  const tick=sec=>{if(rb&&rb.isConnected){const lbl=rb.querySelector(".lbl");if(lbl){if(!rb.dataset.lbl)rb.dataset.lbl=lbl.innerHTML;rb.dataset.spin="1";lbl.textContent=sec+"s";}}};
  tick(10);
 const ind=document.createElement("div");ind.className="pop recind";
 ind.innerHTML='<span class="pulse">🎙</span> gravando… <b style="font-size:12px">'+t.slice(0,30)+"</b>";
 document.body.appendChild(ind);
 const mr=new MediaRecorder(stream),ch=[];
 mr.ondataavailable=e=>{if(e.data&&e.data.size>0)ch.push(e.data)};
 mr.start();
 let ac=null,an=null,buf=null,lastLoud=0,everLoud=false,done=false;const t0=Date.now();
 try{ac=new(window.AudioContext||window.webkitAudioContext)();
  const srcn=ac.createMediaStreamSource(stream);an=ac.createAnalyser();an.fftSize=512;srcn.connect(an);
  buf=new Uint8Array(an.frequencyBinCount);}catch(e){}
 let sil=null;
 const finish=()=>{if(done)return;done=true;if(sil)clearInterval(sil);
  ind.innerHTML='<span class="spin"></span> processando…';
  let sent=false;
  const process=()=>{if(sent)return;sent=true;
   const blob=new Blob(ch,{type:"audio/webm"});
   try{audioCache["a:"+t]=URL.createObjectURL(blob)}catch(e){}
   const f=new FileReader();f.onload=()=>{
   /* the phrase is underlined only NOW — on save, never on the Record click. The wrap uses the USER'S
      SELECTION (nbSel.area → its own Range), never a note's area/anchor, so the recording is an
      INDEPENDENT item on exactly the text the user selected; with no selection (a click on a mark)
      the existing mark is reused, and ensureMark is the safety net that guarantees the underline
      instead of waiting for the next poll. */
   const rr=(nbSel&&nbSel.area)?nbAreaRange(nbSel.area):null;
   const rt=rr?nbSpanText(rr):t;
   const mk=markRecording(rt,rr)||ensureMark(rt,"rec",rr);
   const rp=(mk&&nbMarkPos(mk))||nbPosOf(rr);
   /* the row is anchored to exactly what the mark PAINTS and keeps the place it paints on as its
      tie-breaker (owner spec 2026-10-13): a phrase repeated on the page is restored on ITS OWN
      occurrence after a reload, never on the first match of the same words */
   nbUpsert(rt,"rec",{b64:f.result.split(",")[1],mime:"audio/webm",data:nbRecData(rp)});
   ind.remove();press(false);refreshNbPopup(rt,popXY.x,popXY.y,false);};   /* popup stays after the clip saves */
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
   tick(Math.max(0,Math.ceil((REC_MAX-(Date.now()-t0))/1000)));
   if(Date.now()-t0>REC_MAX)return finish();
 },100);
 recStop=()=>{
  if(done)return;
  done=true;
  if(sil)clearInterval(sil);
  try{mr.ondataavailable=null;mr.onstop=null;mr.stop()}catch(e){}
  ch.length=0;
  try{stream.getTracks().forEach(x=>x.stop())}catch(e){}
  try{if(ac)ac.close()}catch(e){}
  try{ind.remove()}catch(e){}
  press(false);
  if(pop)delete pop.dataset.recording;
 };}
window.__A=true;
