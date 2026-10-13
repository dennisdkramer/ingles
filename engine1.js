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
function b64url(b64,mime){const m=mime||"audio/webm";
 try{const b=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));return URL.createObjectURL(new Blob([b],{type:m}))}
 catch(e){return "data:"+m+";base64,"+b64}}
/* ---- local-action grace window (owner spec 2026-10-12): the ONLY sync re-check is a plain poll
   (engine2.js: setInterval(loadLayer,3000)) — no per-action immediate reload any more. Every
   send() marks its id+action "pending" for 6s; a poll that lands mid-write must never revert what
   the user just did and then re-apply it a moment later. Generic by id+action: any FUTURE action
   type that goes through send() gets this protection automatically — see FUNCTION.md "Sync". */
let pendingOps=[];
function notePending(o){
 if(!o||!o.id)return;
 pendingOps=pendingOps.filter(p=>Date.now()<p.until&&(p.id!==o.id||p.action!==o.action));
 pendingOps.push({id:o.id,action:o.action,type:o.type,until:Date.now()+6000});
}
function pendingFor(id){
 pendingOps=pendingOps.filter(p=>Date.now()<p.until);
 /* the LAST action queued for this id = what the user most recently did to that row. Inside one
    window an "add" can be followed by a "del" (save, then delete): the del is the truth then,
    which is what nbLocal/nbEntries below need; every other caller only asks "is anything still in
    flight for this id?", for which the first match was already enough. */
 let op=null;for(const p of pendingOps)if(p.id===id)op=p;
 return op;
}
function send(o){o.email=STUDENT;o.lesson=L;o.author=who();
 const isDel=(o.action==="del");
 if(!isDel&&!o.id)o.id=Date.now()+"_"+Math.floor(Math.random()*9999);
 /* the UI already applied this change (hlApply/hlSetColor/hlDrop/ensureMark/...) before send()
    was called: protect it from a stale poll instead of reloading the layer right now. */
 notePending(o);
 fetch(BACKPACK,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify(o)})
  .then(r=>r.json())
  .then(j=>{
   if(isDel){
    /* a delete is SILENT on success (owner spec 2026-10-12): the item visibly leaves the page, and one
       del goes out per ROW — so the old "🗑 apagado ✔" pill fired once per row (a phrase with a note
       + a recording raised TWO, and a late poll could raise one minutes after the click) and read as
       if it were disconnected from the delete. Only a real failure to delete still speaks up. */
    if(j&&j.result==="deleted")return;
    toast("⚠ falha ao apagar (servidor)");
    return;
   }
   if(j&&j.result==="ok")return;
   throw new Error((j&&j.error)||"resposta inválida");
  })
  .catch(err=>{
   /* server unavailable or errored → keep a local copy so nothing is lost this session */
   if(!isDel){try{const s=localGet();s[o.id]=o;localStorage.setItem(LKEY,JSON.stringify(s))}catch(e){}
    toast("⚠ salvo apenas neste dispositivo");}
   else toast("⚠ servidor indisponível — apagar não confirmou");
  });
 setTimeout(()=>{if(window.currentAnchor&&window.currentAnchor===o.anchor&&pop&&window.showAnchor)window.showAnchor(o.anchor,popXY.x,popXY.y)},900);
}
let pop=null,pendingRange=null,lastSelText="",nbSel=null;
/* nbSel = the SELECTION the open popup came from (openNbPopup): {area, note, expand}. The owner's
   overlap rules read it — the ⏺ Record lock (nbRecBlocked), the note the selection refers to
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
   open — the very same 6s window notePending opened when send() fired, no second timer. Once the
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
/* ---- where a note/recording sits on the page: the OVERLAP RULES below need real spans ----------
   A row is keyed by its anchor text, so its span is measured from the mark that paints it (in pieces
   or not: from its first piece's first text to its last piece's last text) and falls back to
   findRange for a row whose mark is not on the page yet. The offsets use the SAME ruler as the
   highlights (hlBlocks/hlOffset), so the two features can never disagree about where a span is. */
function nbAreaOfRange(r){
 if(!r)return null;
 const blk=hlBlockOf(r.startContainer);
 if(!blk||blk!==hlBlockOf(r.endContainer))return null;
 const s=hlOffset(blk,r.startContainer,r.startOffset),e=hlOffset(blk,r.endContainer,r.endOffset);
 if(s<0||e<=s)return null;
 const b=hlBlocks().indexOf(blk);if(b<0)return null;
 return{b:b,s:s,e:e,blk:blk};
}
function nbAreaOf(anchor){
 const a=String(anchor||"");if(!a)return null;
 const ps=nbMarks(a);
 let r=null;
 if(ps.length){const f=nbEdgeText(ps[0],true),l=nbEdgeText(ps[ps.length-1],false);
  if(f&&l){r=document.createRange();try{r.setStart(f,0);r.setEnd(l,l.data.length)}catch(e){r=null}}}
 return nbAreaOfRange(r||findRange(a));
}
/* the span a live selection means for the note layer, TRIMMED to t — and the trimmed selection IS
   the anchor: a mark then covers exactly its own anchor text, so two abutting saves share no
   character. (A shared boundary SPACE used to fall inside both of them, which is precisely the
   "selecting the characters/space abutting a note/recording" bug the owner reported.) */
function nbSelArea(r,t){
 if(!r)return null;
 const area=nbAreaOfRange(r);if(!area||t==null)return area;
 const i=area.blk.textContent.slice(area.s,area.e).indexOf(t);
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
const nbSameSpan=(a,c)=>!!a&&!!c&&a.b===c.b&&a.s===c.s&&a.e===c.e;
/* the note a selection refers to (owner rule, overlaps 2026-10-12): the FIRST note, in text order,
   whose span overlaps the selection. It becomes the popup's ACTIVE note — and 💾 Save then expands
   its area to the new selection, or keeps its own string as the reference when the selection sits
   strictly inside it. */
function nbPickNote(area){
 if(!area)return null;
 let best=null;
 nbRows("note").forEach(r=>{const a=nbAreaOf(r.anchor);
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
 return{area:{b:area.b,s:s,e:e,blk:area.blk},anchor:area.blk.textContent.slice(s,e)};
}
/* the exact owner wording of the ⏺ Record refusal (see nbRecBlocked/nbWirePopup) */
const NB_REC_LOCKED="cannot partially overwrite an audio recording, delete the previous recording and try again";
/* ⏺ Record's LOCK (owner rule, overlaps): a selection that would PARTIALLY overwrite an existing
   audio file — overlapping it, containing it, or sitting inside it — is refused. The button keeps
   the disabled LOOK (.locked) but stays pressable, because a truly disabled button fires no click
   event and pressing it MUST raise the refusal toast. Covering a recording EXACTLY is not a partial
   overwrite: that is the documented re-record ("regrava por cima", one rec row replaced in place).
   When the popup came from a SELECTION the rule is about that selection; when it came from a click
   on a mark there is no selection, and the phrase's own span is the target. */
function nbRecBlocked(t){
 const tgt=nbAreaOf(t),sel=nbSel&&nbSel.area;
 return nbRows("rec").some(r=>{const a=nbAreaOf(r.anchor);
  return (nbOverlap(a,sel)&&!nbSameSpan(a,sel))||(nbOverlap(a,tgt)&&!nbSameSpan(a,tgt))});
}
/* is a local note/recording action for this anchor still inside its grace window? (engine2's
   renderLayer consults this so a 3s poll cannot blink a mark that was just created or deleted) */
function nbAnyPending(t){return nbEntries(t).some(it=>pendingFor(it.id))}
/* does this phrase already carry a saved recording / note? The layer (server truth) decides; the
   mark's own flags (has-rec / has-note) are the fallback for the moment between a just-finished
   save and the next poll. Either signal flips the popup's buttons below. */
function nbHasRec(t){return nbEntries(t).some(it=>it.type==="rec")||!!document.querySelector('mark.nb.has-rec[data-a="'+CSS.escape(t)+'"]')}
function nbHasNote(t){return nbEntries(t).some(it=>it.type==="note")||!!document.querySelector('mark.nb.has-note[data-a="'+CSS.escape(t)+'"]')}
/* the saved note text of an anchor (for the 📝 Show view) — null when there is none. */
function nbNoteText(t){const e=nbEntries(t).find(it=>it.type==="note");return e?String(e.data||""):null}
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
/* the popup carries SIX buttons, and ALL of them always exist (owner spec 2026-10-12). Three are
   always clickable — ▶ Hear, ⏺ Record, 📝 Add/Edit Note. The other three only light up when they
   apply, and are otherwise GREYED OUT (disabled, never hidden):
     ▶ Play    — a saved recording exists on the phrase
     💾 Save   — a note is currently being added / edited
     🗑 Delete — the phrase has a saved note or recording
   The saved note (when any) is shown ABOVE the buttons; the SELECTED TEXT is NOT repeated in the
   popup (owner spec 2026-10-12). The phrases carry the button ids: H=Hear P=Play R=Record
   N=Add/Edit Note S=Save D=Delete — order: row1 H P R, row2 N S D. Record and Play swap their glyph
   for a processing SPIRAL while recording / while the clip is playing (owner spec 2026-10-12).
   It intentionally carries NO trailing icon: the underline / blue-wash of the phrase itself is the
   only signal, and it is applied by the SAVE (engine2 renderLayer or the note Save), never by the
   click. */
function nbPopHTML(t,editing){
 const rec=nbHasRec(t),note=nbHasNote(t),owned=rec||note;
 const nb=nbNoteDisplay(t);
 /* ⏺ Record is LOCKED while this popup's span would PARTIALLY overwrite an existing audio file
    (owner rule, overlaps): the button greys out like a disabled one but stays pressable, so that
    pressing it can toast the refusal (nbWirePopup) — a `disabled` button fires no click at all. */
 const locked=nbRecBlocked(t);
 /* the popup does NOT repeat the selected text any more (owner spec 2026-10-12): the phrase is right
    there in the page, so a title echoing it is redundant. #pTitle stays as an empty anchor so a
    refresh can keep targeting a stable node. */
 const noteHTML=nb!=null?'<div id="nbNote" title="nota salva" style="margin:2px 0 4px;white-space:pre-wrap;font-size:13px">'+nbEsc(nb)+'</div>':"";
 return '<div id="pTitle"></div>'+noteHTML+
  '<span style="white-space:nowrap"><button id="pH" title="ouvir em voz alta">▶ Hear</button>'+
  '<button id="pP" title="ouvir a gravação salva"'+(rec?"":' disabled')+'><span class="lbl">▶ Play</span></button>'+
  '<button id="pR"'+(locked?' class="locked" aria-disabled="true" title="'+NB_REC_LOCKED+'"':' title="gravar (regrava por cima)"')+'><span class="lbl">⏺ Record</span></button></span><br>'+
  '<span style="white-space:nowrap"><button id="pN">📝 Add/Edit Note</button>'+
  '<button id="pS" title="salvar a nota"'+(editing?"":' disabled')+'>💾 Save</button>'+
  '<button id="pD" title="apagar gravação, notas e a marcação"'+(owned?"":' disabled')+'>🗑 Delete</button></span>';
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
function nbWirePopup(t,r,x,y){
 if(!pop)return;
 const H=pop.querySelector("#pH");
 if(H)H.onclick=()=>{const u=new SpeechSynthesisUtterance(t);u.lang="en-US";u.rate=.95;speechSynthesis.cancel();speechSynthesis.speak(u)};
 const P=pop.querySelector("#pP");
 /* ▶ Play shows the processing SPIRAL for the whole playback (owner spec 2026-10-12). ON at the
    click, BEFORE the Drive/?action=file fetch, so even a first-ever fetch shows it; OFF when playback
    really stops — nbPlayAudio fires its done() on BOTH "ended" and a failed play/lookup, so the
    spiral can never get stuck on. The old wiring handed that callback straight to nbBtnSpinner and
    done(true) means "play FAILED", so ▶ Play only ever span on an error — never while playing. */
 if(P)P.onclick=()=>{if(P.disabled)return;nbBtnSpinner(P,true);nbPlayRecording(t,()=>nbBtnSpinner(P,false))};
 const R=pop.querySelector("#pR");
 /* a LOCKED ⏺ Record (the selection would PARTIALLY overwrite an existing audio file) refuses with
    the owner's toast instead of recording — the button carries the disabled LOOK but no `disabled`
    attribute, which is the only way a press can still be heard (nbRecBlocked) */
 if(R)R.onclick=()=>{if(R.classList.contains("locked")){toast(NB_REC_LOCKED);return}rec(t,R)};
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
 if(D)D.onclick=()=>{if(D.disabled)return;nbDeleteAnchor(t)};
}
/* ONE CORE SAVE for the note/recording layer (owner rule 2026-10-12, "reuse core functions"):
   💾 Save (note) and rec() (recording) both go through here, so the two save paths can never
   drift apart again. It re-uses the id of the row ALREADY stored for this anchor+type, so a re-save
   REPLACES that row on the server (backend add/set deletes the row with the same id first) instead of
   appending a second one. That duplicate row was exactly why an edited note's Save looked like a
   no-op: the layer's first-match lookup (nbNoteText/nbPlayRecording) kept returning the OLD row.
   Equally for a recording: re-recording over a phrase keeps ONE rec row and can never leave a stale
   earlier clip for that first-match lookup to play. The local `layer` is updated BEFORE the network
   call (same "immediate" principle as nbDeleteAnchor) because the popup and renderLayer read the
   layer: without it the change only showed up at the next 3s poll. Network last (FUNCTION.md).
   The row is ALSO remembered in nbLocal, the local copy nbEntries serves while this write is still
   inside its grace window (see above) — the same treatment the highlight gives a freshly painted
   rectangle in hlList, so a poll snapshot that predates the write cannot blink the note out. */
function nbUpsert(t,type,fields,from){
 /* `from` = the anchor the row had BEFORE this save: a note whose area EXPANDED keeps its own id and
    takes the union's text as its new anchor (ONE row, a plain "set" — the backend deletes the row
    with that id first, so the anchor simply changes and nothing is duplicated). */
 const cur=nbEntries(from!=null?from:t).find(it=>it.type===type);
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
   new selection"): the old mark set leaves the text and the UNION is wrapped under the union's own
   text as the new anchor. A recording that lived on the same phrase is re-painted first, so the new
   note mark carries it whole (nested) instead of dropping its underline until the next poll. The ROW
   itself is re-anchored by nbUpsert(…, from) — same id, ONE row. */
function nbExpandNote(anchor,plan){
 const rec=nbHasRec(anchor);
 nbUnmark(anchor);
 if(rec)ensureMark(anchor,"rec");
 return nbWrap(plan.anchor,nbAreaRange(plan.area));
}
function nbSaveNote(t,x,y){
 if(!pop)return;
 const ta=pop.querySelector("#nt");if(!ta)return;   /* 💾 Save is live only while editing — never throw */
 const v=ta.value.trim();
 if(!v){closePop();return}
 /* OWNER RULE (overlaps): the popup came from a selection that OVERLAPPED this note (nbSel.expand,
    planned by openNbPopup) → the note's AREA expands to the new selection and the union's text
    becomes its anchor; a selection strictly INSIDE the note plans no expansion, so the note keeps its
    original string as its reference. */
 const plan=nbSel&&nbSel.expand;
 let to=t;
 if(plan){const m=nbExpandNote(t,plan);if(m)m.classList.add("has-note");to=plan.anchor;nbSel.expand=null}
 else{const m=ensureMark(t,"note");if(m)m.classList.add("has-note")}
 nbUpsert(to,"note",{data:v},plan?t:null);   /* same id → REPLACES the row (re-anchored when it grew) */
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
 nbWirePopup(t,null,x,y);
}
/* open the six-button popup for an anchor — and, when it came from a SELECTION (r), resolve the
   owner's OVERLAP rules for that selection:
     • the selection overlaps or contains a NOTE → that note is the ACTIVE note: the popup is about
       the note's own anchor (prefilled, its row found), and 💾 Save then expands the note's area to
       the new selection (nbExpandPlan/nbExpandNote);
     • the selection overlaps, contains or sits inside a RECORDING → ⏺ Record is locked and toasts
       the refusal (nbRecBlocked, rendered by nbPopHTML);
     • a selection that merely ABUTS a mark (shares no character) is an ordinary new phrase.
   A popup opened by a click on a mark (showAnchor, r=null) has no selection: its target is the
   mark's own anchor, so a full re-record of that phrase stays available. */
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
 nbWirePopup(anchor,pendingRange,x,y);
}
/* wrap the phrase into mark.nb and paint the recording flag — this is the SAVE side for a clip
   (called from rec() once the bytes are ready, and by engine2's renderLayer when a saved
   recording is restored). A recording NEVER paints the mark at the instant ⏺ Record is clicked;
   the underline is the saved clip's proof, per the owner spec. Idempotent: an existing mark.nb is
   reused. (r = the live selection range when the popup came from one.) */
function markRecording(t,r){
 if(r){const m=wrapRange(t,r);if(m)nbFlag(t,"has-rec");return m}
 return ensureMark(t,"rec");      /* ensureMark paints the anchor's text AND flags it has-rec */
}
/* 📝 Add/Edit Note (owner spec 2026-10-12): the editor opens over the SAME popup (every button
   stays; the six buttons simply re-render, and Save lights up). When the phrase already HAS a note
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
/* remove mark.nb from the text (undo EVERY piece of the anchor) — leaves a clean DOM, so a later
   note/recording starts from the same pristine text */
function nbUnmark(t){nbMarks(t).forEach(m=>{try{const p=m.parentNode;while(m.firstChild)p.insertBefore(m.firstChild,m);p.removeChild(m)}catch(e){}})}
/* DELETE (owner spec 2026-10-12): the popup's 🗑 button removes the saved recording, any notes
   AND the visual element — one action, network last. */
function nbDeleteAnchor(t){
 const items=nbEntries(t);
 if(!items.length){toast("Nada para apagar nesta frase.");closePop();return}
 const entries=items.map(e=>({id:e.id,type:e.type,anchor:e.anchor,b64:e.b64,mime:e.mime,data:e.data}));
 /* drop the rows locally at once too — the server is the source of truth but the UI must not keep a
    deleted item until the next 3s poll (same "immediate" principle as the mark itself) */
 layer=layer.filter(it=>!(it.type==="rec"||it.type==="note")||it.anchor!==t);
 nbUnmark(t);
 closePop();
 entries.forEach(e=>send({action:"del",id:e.id}));
}
function openPop(t,x,y,html){closePop();popXY={x,y};pop=document.createElement("div");pop.className="pop";
 pop.style.left=x+"px";pop.style.top=y+"px";pop.style.maxWidth="min(380px, calc(100vw - 16px))";
 pop.innerHTML=html;document.body.appendChild(pop);return pop}
document.addEventListener("mousedown",e=>{if(pop&&!pop.contains(e.target)){closePop();nbSel=null}});
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
function trySelPopup(){
 const sel=getSelection();const t=sel?sel.toString().trim():"";
 if(!t||t.length<3||t.length>200)return;
 if(mouseIsDown)return; /* never open mid-drag — the mouseup listener fires this at release */
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
 /* ONE BLOCK ONLY (owner spec 2026-10-12, same rule the highlight already uses): a selection
    that crosses a block element (paragraph → list item, cell → cell, heading → paragraph, …)
    must NOT trigger this popup. It is refused with a toast — same wording family as the
    highlight's refusal — and the popup stays shut. The check is the same helper (hlBlockOf,
    hoisted) so the two features can never drift apart. Wrapped in try/catch exactly like
    hlApply: in a real browser the getters can throw on a stale/edge range; jsdom may lack
    layout — either way the popup degrades to staying shut, never to a page error. */
 try{
  if(!hlBlockOf(r.startContainer)||hlBlockOf(r.startContainer)!==hlBlockOf(r.endContainer)){
   toast("Selecione um trecho dentro de um mesmo bloco.");
   lastSelText=t;
   return;
  }
 }catch(e){lastSelText=t;return;}
 pendingRange=r.cloneRange();
 const rect=r.getBoundingClientRect();
 const x=Math.max(8,Math.min(rect.left||20,innerWidth-380)),y=(rect.bottom||60)+8;
 openNbPopup(t,pendingRange,x,y);
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
/* ---- the mark SET of an anchor: mark.nb[data-a=<the anchor text>] -------------------------------
   An anchor is usually painted by ONE mark element, but a note/recording painted ACROSS an older
   mark's edge SPLITS that older mark into pieces that BOTH keep its data-a and its flags. The
   anchor's text is then the concatenation of its pieces, each piece keeps its own 2px inset on its
   own edges (style.css), and every lookup below (and in engine2's renderLayer) still finds the row.
   This is what makes abutting and overlapping saves possible at all: extractContents() used to CLONE
   the crossed mark and split the original, leaving several elements claiming the same anchor and a
   row whose stored anchor matched none of them ("not reliably saved nor simultaneously displayed"). */
function nbMarks(t){return [...document.querySelectorAll('mark.nb[data-a="'+CSS.escape(String(t))+'"]')]}
/* flag EVERY piece of an anchor (has-rec / has-note) and hand back the first one */
function nbFlag(t,cls){const ms=nbMarks(t);ms.forEach(m=>m.classList.add(cls));return ms[0]||null}
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
   cloned. So a mark that is fully covered is carried inside the new one (nested and still whole,
   keeping its own anchor) while a mark that is only crossed by an edge is split into pieces that
   keep its own data-a and flags. */
function nbWrap(t,r){
 if(!r)return null;
 const s=nbTextPoint(r.startContainer,r.startOffset,true),e=nbTextPoint(r.endContainer,r.endOffset,false);
 if(!s||!e)return null;
 const m=document.createElement("mark");m.className="nb";m.dataset.a=String(t);
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
  const i=Array.prototype.indexOf.call(p.childNodes,sTop);
  if(i>0)sTop=nbSplitEl(p,i);else sTop=p}     /* after a split the clone carries the covered side */
 let eTop=eN;
 for(let p=eN.parentNode;p&&p!==ca;p=p.parentNode){
  const i=Array.prototype.indexOf.call(p.childNodes,eTop);
  if(i+1<p.childNodes.length)nbSplitEl(p,i+1);/* the uncovered tail leaves; eTop keeps the covered end */
  eTop=p}
 const run=[];for(let n=sTop;n;n=n.nextSibling){run.push(n);if(n===eTop)break}
 if(!run.length||run[run.length-1]!==eTop)return null;
 ca.insertBefore(m,sTop);
 run.forEach(n=>m.appendChild(n));
 return m}
/* wrap an anchor's range (a live selection when the popup came from one; the text found by findRange
   when a stored row is being restored). An anchor that is ALREADY painted is never wrapped twice:
   a note and a recording on the SAME phrase are ONE mark carrying both flags. */
function wrapRange(t,r){
 const ex=nbMarks(t)[0];if(ex)return ex;
 return r?nbWrap(t,r):null}
/* an anchor's text → a live Range. Marked text is walked TOO: an anchor may abut, cross or sit
   inside another mark, and skipping text inside mark.nb used to make exactly those anchors
   unfindable — the "selecting the characters/space next to a note does nothing" bug. */
function findRange(t){
 const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 const nodes=[];let all="";let n;
 while(n=w.nextNode()){if(n.parentElement&&n.parentElement.closest("script,style,.pop,#hlLayer"))continue;nodes.push({n,start:all.length});all+=n.data;}
 const i=all.indexOf(t);if(i<0)return null;const end=i+t.length;let a=null,b=null;
 for(const o of nodes){if(!a&&o.start<=i&&i<o.start+o.n.data.length)a={n:o.n,off:i-o.start};
  if(!b&&o.start<end&&end<=o.start+o.n.data.length)b={n:o.n,off:end-o.start};}
 if(!a||!b)return null;
 const r=document.createRange();r.setStart(a.n,a.off);r.setEnd(b.n,b.off);return r;
}
/* (re)paint an anchor's mark and flag it: reuse the existing mark set, otherwise wrap the anchor's
   text where it lies on the page */
function ensureMark(t,type){
 if(!nbMarks(t).length){const r=findRange(t);if(!r||!nbWrap(t,r))return null}
 return nbFlag(t,"has-"+type);
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
/* any key press closes the colour palette — EXCEPT Ctrl/Meta themselves: the palette is born while
   the gesture key is STILL held down (the highlight runs at mouseup, Ctrl and all), so the keyboard
   keeps auto-repeating that key's keydown right when the palette appears; the repeat of the key
   that owns the gesture must never close the popup that gesture just opened (FUNCTION.md) */
document.addEventListener("keydown",e=>{
 if(e.key==="Control"||e.key==="Meta")return;
 if(pop&&pop.classList.contains("hlpalpop"))closePop()},true);
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
 if(rec){rec.color=hlColorOk(d.color);return rec}
 const spot=hlLocate(anchor,d.b,d.o);
 if(!spot||spot.start<0)return null;       /* that text is not on the page any more */
 rec=hlMake(anchor,d.color,spot.b,spot.start,row.id);
 return rec;
}
/* ---- OVERLAP = SUBTRACT, NEVER MERGE (owner spec 2026-10-12) -----------------------------------
   A new highlight WINS the characters it covers: every character of the selection is removed from
   the highlight(s) already sitting on it, so a second highlight can carry a DIFFERENT colour over
   text that was already highlighted. The old rule did the opposite — it unioned the two ranges
   into ONE row with ONE colour, which is exactly what destroyed the second colour.
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
 const x=Math.max(8,Math.min(last?Math.round(last.left+last.width)-sx:24,vw-150));
 const y=Math.max(4,Math.round(last?last.top-sy:40)-30);
 openPop("",x,y,'<span class="hlpal">'+HL_COLORNAMES.map(c=>'<button type="button" data-c="'+c+'" title="'+c+'"></button>').join("")+"</span>");
 if(!pop)return;
 pop.classList.add("hlpalpop");
 pop.querySelectorAll("button[data-c]").forEach(b=>{
  b.onclick=()=>{const c=b.dataset.c;
   hlSetColor(rec,c);
   closePop();
   if(rec.id)send({action:"set",type:"hl",anchor:rec.anchor,data:JSON.stringify({color:c,b:rec.b,o:rec.start}),id:rec.id});
  };
 });
}
async function rec(t,rb){
 if(!pop||pop.dataset.recording)return;      /* one recording per phrase at a time (re-entry guard) */
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){alert("Microfone bloqueado — abra a lição em aba própria.");return}
 /* the Record button's glyph becomes the processing SPIRAL for the whole capture (owner spec
    2026-10-12) instead of a toast; the popup is closed only once the clip is saved, so the spiral
    stays visible while the user speaks. */
 if(pop)pop.dataset.recording="1";
 const press=on=>{if(rb&&rb.isConnected)nbBtnSpinner(rb,on)};
 press(true);
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
   markRecording(t,null);   /* the phrase is underlined only now — on save, never on the Record click */
   nbUpsert(t,"rec",{b64:f.result.split(",")[1],mime:"audio/webm",data:JSON.stringify({score:fb.score,heard,fb:fb.msg})});
   ind.remove();press(false);closePop();};
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
