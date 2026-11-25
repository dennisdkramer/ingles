/* MOTOR 2 — control bar, camadas, fala (speechSynthesis), realces persistentes */
/* Behaviour contract: FUNCTION.md - read it before changing anything here. */
const LAYER_VER="v4-server-truth-20261006"; /* Bump to mark a fresh data era */
/* THE SITE ROOT AS THIS PAGE SEES IT: a lesson lives two folders down ("../../"), the capability map sits in
   the root (""). Read from this script's own address, so a page at any depth — and the repo served under
   /<repo>/ on GitHub Pages — resolves to the same place. */
const SITE=new URL(".",(document.currentScript&&document.currentScript.src)||location.href).pathname;
/* AN OPEN PAGE READS NOTHING FROM THE SERVER: a demo on the extra track has no student, so the layer, the
   poll and the student list would be requests for rows that cannot exist. The page answers, marks and
   edits locally, and "Save to repo" is how a demo page is kept. */
const OPENPAGE=!!window.OPEN;
let wipeGuard=0; /* a Clear-page wipe in flight: the poll must not resurrect the rows it is deleting */
let lastPollChange=Date.now(); /* last time the poll saw a change — keeps the poll fast while the student watches */
let lastFull=""; /* the layer content signature used to detect that change */
let completeNow=false; /* optimistic state of the "Complete?" tag button */
/* THE LESSON'S TITLE IS IN ITS FILENAME, so a neighbour's address cannot be built from a number alone:
   lessons.json is read once, and every link in this file asks it. */
let LSN=null;
function lessonHref(n){const hit=(LSN||[]).find(x=>x.n===n);return hit&&hit.file?SITE+TRACK+"/"+encodeURIComponent(hit.file):null;}
async function goLesson(n){
 if(!LSN){try{const r=await fetch(SITE+"lessons.json");if(r.ok){const j=await r.json();LSN=(j&&j[TRACK])||null;}}catch(e){}}
 const h=lessonHref(n);if(h)location.href=h;
}

/* ---- audio: the built-in voice (speechSynthesis) is the delivery — no clips, no manifest ---- */
const SAY_VOICE_WANT=[/aria.*online/i,/jenny.*online/i,/michelle.*online/i,/samantha/i,/allison/i,/ava/i,/susan/i,/google us english/i,/zira/i];
function sayVoice(){
  let vs=[];try{vs=speechSynthesis.getVoices()||[];}catch(e){}
  const en=vs.filter(v=>/^en[-_]us/i.test(v.lang||"")||/^en$/i.test(v.lang||""));
  for(const re of SAY_VOICE_WANT){const v=en.find(x=>re.test(x.name));if(v)return v;}
  return en.find(v=>!v.localService)||en[0]||null;
}
function saySpeak(t,rate){
  try{
    const u=new SpeechSynthesisUtterance(t);u.lang="en-US";u.rate=rate||1;
    const v=sayVoice();if(v)u.voice=v;
    speechSynthesis.cancel();speechSynthesis.speak(u);
  }catch(e){}
}
function sayStop(){
  try{speechSynthesis.cancel();}catch(e){}
}
/* playSay(text[,rate]) — speaks the string with the built-in voice, stopping whatever was playing */
async function playSay(t,rate){
  if(!t)return;
  sayStop();
  saySpeak(t,rate||1);
}
window.playSay=playSay;window.saySpeak=saySpeak;
try{speechSynthesis.onvoiceschanged=()=>{};}catch(e){}
function wireListen(){document.querySelectorAll(".listen").forEach(b=>{b.onclick=()=>{if(editing)return;playSay(b.dataset.say)}})}
wireListen();
document.querySelectorAll("[contenteditable]").forEach(function(n){n.removeAttribute("contenteditable");});
/* ---- content edit mode (teacher): a separate editable copy; live page + marks stay untouched ---- */
const contentId=()=>"content_"+TRACK+"_"+L;
let savedLive="",nbkVal="";
/* the solver's real run(), kept while edit mode holds it at a no-op — see toggleEditMode */
let eqRun=null;

/* THE HIGHLIGHTER STRIP IS FOR AN EXTENSION, NOT FOR THE PAGE. A highlighter leaves `background-color:
   rgb(...)`, a borrowed font or letter-spacing on a span. The page writes its own inline styles with
   pixels — `right:calc(100% + 8px)`, `margin-right:-10px` — so a rule keyed on `px` deleted authored
   styles from every save; a style that names a position, a margin, a width or a gap is the author's. */

/* THE COPY IS CLEANED BEFORE IT IS SERIALISED. A save taken while edit mode is open copies a live
   page that carries the tool's own marks — a `data-layout-grain` frame on every item a drag could
   take, and the chip, the panel and the drag line as body children — so the sweep runs inside the
   copy (`LayoutEditor.clean(cl)`) and the chrome is removed from it. A saved file is a page a reader
   opens: what the tool wrote on the page, the file does not write down. */
function fullPageHTML(){const cl=document.documentElement.cloneNode(true);const cb=cl.querySelector("#controlbar");if(cb)cb.innerHTML="";const to=cl.querySelector("#toast");if(to){to.textContent="";to.removeAttribute("style");}const fd=cl.querySelector("#feed");if(fd)fd.innerHTML="";cl.querySelectorAll("#hlLayer,#noteLayer,#printRoot,#errb,.pop,#completebtn,#completerow,.layout-chip,.layout-panel,.layout-line,.layout-grip").forEach(n=>n.remove());cl.querySelectorAll("mark.nb").forEach(m=>{m.replaceWith(document.createTextNode(m.textContent))});cl.querySelectorAll("[contenteditable]").forEach(n=>n.removeAttribute("contenteditable"));const b=cl.querySelector("body");if(b){b.removeAttribute("class");b.removeAttribute("style");}cl.querySelectorAll("[data-glasp-print],.glasp-extension,.glasp-extension-toaster").forEach(n=>n.remove());cl.querySelectorAll("span[style],b[style],i[style],u[style]").forEach(s=>{const st=s.getAttribute("style")||"";if(/rgb\(|font-family|letter-spacing|font-style|background|text-shadow/.test(st)&&!/right:|left:|margin|width|gap/.test(st))s.removeAttribute("style")});cl.querySelectorAll(".content-area .block[data-state]").forEach(n=>n.removeAttribute("data-state"));try{if(window.LayoutEditor)window.LayoutEditor.clean(cl);}catch(e){}try{if(window.EqualizeRows)window.EqualizeRows.clean(cl);}catch(e){}return "<!doctype html>"+cl.outerHTML;}
function contentAreaHTML(saved){const d=new DOMParser().parseFromString(saved,"text/html");const ca=d.querySelector(".content-area");return ca?ca.innerHTML:saved;}
function saveContent(){if(!document.querySelector(".content-area"))return;const o={action:"set",id:contentId(),type:"content",anchor:"",data:fullPageHTML(),email:gate.email,lesson:L,author:"prof",track:TRACK};notePending(o);outboxPush(o);scheduleFlush();}
/* ---- the layout layer, and the two buttons that finish an edit ---------------------------
   layout.js drags any node inside .content-area; it is loaded only for a teacher and only when
   edit mode opens, so a student's page never fetches it. The save path never serialises: the
   page itself is the artifact. "Save to repo" downloads the cleaned document under the page's
   own filename, and qa/watch-saves.mjs (a local watcher) drops it into <TRACK>/ and pushes.
   "Clear ink" deletes the rows that describe the OLD page — highlights, notes, answers and the
   Completed tag — because a moved block leaves them pointing at text that has moved. The
   notebook is the student's own writing and is kept. */
let layoutState = 0;   /* 0 = not asked · 1 = script loading · 2 = ready */
function loadLayout() {
  if (window.LayoutEditor) { LayoutEditor.enable(); return; }
  if (layoutState) return;
  layoutState = 1;
  const s = document.createElement("script");
  s.src = SITE+"layout.js";
  s.onload = function () { layoutState = 2; try { LayoutEditor.enable(); } catch (e) { } };
  s.onerror = function () { layoutState = 0; toast("Layout tool unavailable."); };
  document.body.appendChild(s);
}
function unloadLayout() {
  try { if (window.LayoutEditor) LayoutEditor.disable(); } catch (e) { }
}
function editingOnly(on) {
  ["saverepo", "clearink"].forEach(function (id) {
    const b = document.getElementById(id); if (b) b.hidden = !on;
  });
}
function saveToRepo() {
  const ca = document.querySelector(".content-area"); if (!ca) return;
  /* clean() strips the tool's own chrome first: the chip and the drag line are body children, so a
     clone taken now would carry them into the saved file. */
  try { if (window.LayoutEditor) LayoutEditor.clean(); } catch (e) { }
  const html = fullPageHTML();
  /* THE PAGE KEEPS ITS OWN NAME. `location.pathname` is percent-encoded, so a title with a space used to
     arrive as `lesson1-The-20Capability-20Map.html` — a file no watcher could match to the page it came
     from. Decoding first and then removing only the characters a filesystem refuses leaves the name the
     page actually has, spaces and all. */
  let name = "";
  try { name = decodeURIComponent(location.pathname.split("/").pop() || ""); } catch (e) { name = location.pathname.split("/").pop() || ""; }
  name = (name || "lesson.html").replace(/[<>:"/\\|?*\x00-\x1f]+/g, "-").trim() || "lesson.html";
  if (!/\.html?$/i.test(name)) name += ".html";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  a.download = name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.remove(); }, 5000);
  saveContent();                       /* the backend row stays the safety net, exactly as before */
  toast("Saved to Downloads — run `npm run saves` to land it in the file and push");
}
async function clearInk() {
  const gone = { highlight: 1, note: 1, answer: 1, complete: 1 };
  const rows = layer.filter(function (r) { return gone[r.type]; });
  if (!rows.length) { toast("Nothing stored on this page."); return; }
  const ok = await eodConfirm({
    title: "Clear this page's ink?",
    danger: true,
    body: rows.length + " stored item(s) — highlights, notes, answers and the Completed tag — belong to the old layout and will be deleted. The notebook is kept.",
    confirm: "Delete", cancel: "Keep"
  });
  if (!ok) return;
  rows.forEach(function (r) { send({ action: "del", id: r.id }); });
  layer = layer.filter(function (r) { return !gone[r.type]; });
  sig = layer.map(function (r) { return r.id; }).join(",");
  document.querySelectorAll("mark.nb").forEach(function (m) { m.remove(); });
  document.querySelectorAll("input.gap, textarea").forEach(function (el) {
    if (el.tagName === "TEXTAREA" && el.id === "feed") return;
    el.value = "";
  });
  document.querySelectorAll('input[type="radio"]').forEach(function (el) { el.checked = false; });
  doneBlocks();
  completeNow = false; renderCompleteBtn();
  try { hlReflow(); ntReflow(); } catch (e) { }
  toast("Cleared " + rows.length + " item(s)");
}
/* ---- TEXT MODE: ONE ITEM IS THE EDITING HOST ------------------------------------------------
   THE AREA IS NOT EDITABLE. An element may merge, delete and split only inside its editing host,
   so with `.content-area` as the host a Backspace at the start of a cell's paragraph reached into
   the row above, Enter built structure wherever it was pressed, Ctrl+A selected the whole page
   and a paste could arrive as markup. The host is the ITEM under the press — the nearest
   paragraph, list item, cell, heading, figure, table, summary or item div, never a `.rows` and
   never a `.block` — chosen on pointerdown, which runs before the browser places the caret.
   None of it reaches the saved page: fullPageHTML() strips every contenteditable, and leaving
   edit mode drops the host.
   INSIDE A HOST, AN EDIT NEVER BUILDS STRUCTURE: Enter and Shift+Enter are one line break, and a
   paste is its plain text, one line at a time. The break and the pasted text are the browser's own
   edit commands where it has them and written by hand where it declines, so the caret stays the
   browser's and undo keeps working. */
let hostEl = null;
const HOSTY = 'p,li,td,th,dt,dd,figure,table,pre,blockquote,h1,h2,h3,h4,h5,h6,summary';
function hostArea(){ return document.querySelector('.content-area'); }
/* the nearest item a press belongs to; null where there is none (a row's own padding, the page) */
function hostFor(t) {
  const area = hostArea();
  if (!area || !t || t.nodeType !== 1 || !area.contains(t)) return null;
  const box = (t.closest && (t.closest('.rows>*') || t.closest('.block'))) || null;
  let div = null;
  for (let n = t; n && n !== area; n = n.parentElement) {
    if (n.nodeType !== 1) break;
    if (n.matches(HOSTY)) return n;
    if (n.tagName === 'DIV' && n !== box && !(n.classList && n.classList.contains('rows'))) div = n;
    if (n === box) break;
  }
  return div || box;
}
function setHost(n) {
  if (hostEl === n) return;
  if (hostEl) hostEl.removeAttribute('contenteditable');
  hostEl = n && n.nodeType === 1 ? n : null;
  if (hostEl) hostEl.setAttribute('contenteditable', 'true');
}
/* the one door to the host: layout.js drops it for the length of a drag and hands a new block's
   headline to it, so no second file keeps its own idea of what is editable */
window.editText = { host: function () { return hostEl; }, set: setHost, drop: function () { setHost(null); } };
/* A LINE BREAK IS WRITTEN HERE, NOT BUILT: the browser's own command first, and a `<br>` by hand
   where it declines (a cancelled `beforeinput` is not always a command it will run). A break at
   the end of the item takes a second `<br>`, or the empty line the caret sits on has no height. */
function lineBreak() {
  const s = window.getSelection();
  if (!s || !s.rangeCount) return;
  try { if (document.execCommand('insertLineBreak')) return; } catch (e) { }
  const r = s.getRangeAt(0);
  r.deleteContents();
  const br = document.createElement('br');
  r.insertNode(br);
  let tail = br.nextSibling;
  while (tail && tail.nodeType === 3 && !tail.nodeValue.trim()) tail = tail.nextSibling;
  const caret = document.createRange();
  if (!tail && br.parentNode) {
    const pad = document.createElement('br');
    br.parentNode.insertBefore(pad, br.nextSibling);
    caret.setStartBefore(pad);
  } else caret.setStartAfter(br);
  caret.collapse(true);
  s.removeAllRanges();
  s.addRange(caret);
}
function insertText(s) { try { document.execCommand('insertText', false, s); } catch (e) { } }
function textPress(e) {
  if (!editing) return;
  const t = e.target && e.target.nodeType === 1 ? e.target : null;
  if (!t || !t.closest) return;
  /* a press on a control is the control's, not the text's */
  if (t.closest('input,textarea,button,select,option,a,label,.pop,.layout-panel,.layout-chip,.layout-grip')) return;
  setHost(hostFor(t));
}
function textInput(e) {
  if (!editing || !hostEl) return;
  const t = e.target;
  if (!(t === hostEl || (t && hostEl.contains(t)))) return;
  const type = e.inputType;
  if (type === 'insertParagraph' || type === 'insertLineBreak') {
    e.preventDefault();
    lineBreak();
  } else if (type === 'insertFromPaste' || type === 'insertFromDrop') {
    e.preventDefault();
    const dt = e.dataTransfer;
    const txt = dt ? String(dt.getData('text/plain') || '') : '';
    txt.replace(/\r/g, '').split('\n').forEach(function (line, i) {
      if (i) lineBreak();
      if (line) insertText(line);
    });
  }
}
/* A SUMMARY'S SPACE AND ENTER ARE THE FOLD'S, NOT THE CARET'S. A `<summary>` answers Space and
   Enter by opening or shutting its `<details>`, so a title typed in edit mode lost every space — a
   section saved as "Authoranoptimallesson" instead of "Author an optimal lesson" — and Enter folded
   the section instead of breaking the line. The press is taken here, before the fold acts on it, and
   the character is written by hand: a real space (execCommand, so undo still walks back through it),
   a real break (the same `lineBreak()` the rest of the mode uses). */
function textFold(e) {
  if (!editing || !hostEl || hostEl.tagName !== 'SUMMARY') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === ' ') { e.preventDefault(); insertText(' '); }
  else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); lineBreak(); }
}
function textMode(on) {
  if (!on) setHost(null);
  const area = hostArea();
  if (!area || area.__textMode === !!on) return;
  area.__textMode = !!on;
  const add = on ? 'addEventListener' : 'removeEventListener';
  area[add]('pointerdown', textPress, true);
  area[add]('beforeinput', textInput, true);
  area[add]('keydown', textFold, true);
}
function toggleEditMode(){
 if(STUDENT!==gate.email){toast("Switch to your own account to edit content.");return;}
 editing=!editing;
 document.body.classList.toggle("editing",editing);
 const ca=document.querySelector(".content-area"),eb=document.getElementById("editpage");
 if(editing){
  /* THE PAGE IS EDITED AS IT IS SOLVED. The solver's numbers stay on the live page while the layer is
     on — flex, width, the spacing margins and the data-eq mark — so what the teacher drags against is
     the geometry a reader gets, and a cell carries its own width when it moves. A drop re-solves the
     row it landed in (LayoutEditor.resolve), and Done re-solves the whole page. The reveal class has to
     be present: the sheet hides .content-area while it is missing. */
  if(window.EqualizeRows) document.documentElement.classList.add("eq-ready");
  savedLive=ca.innerHTML;

  nbkVal=(document.getElementById("feed")||{}).value||"";
  const cov=layer.find(r=>r.type==="content"&&r.data);
  if(cov)ca.innerHTML=contentAreaHTML(cov.data);
  else document.querySelectorAll("mark.nb").forEach(m=>{m.replaceWith(document.createTextNode(m.textContent))});
  wireListen();
  textMode(true);                     /* the item under the press becomes the editing host */
  hlReflow();ntReflow();
  loadLayout();editingOnly(true);      /* the drag layer rides with edit mode, and only with it */
  if(eb)eb.textContent="✔️ Done";
  toast(OPENPAGE
    ? "Edit mode — click to type, Shift+drag to move a block, Alt+click to centre one; 💾 Save to repo keeps it"
    : "Edit mode — click to type, Shift+drag to move a block, Alt+click to centre one; ✔️ Done saves");
 }else{
  textMode(false);                    /* drops the host, so nothing stays editable */
  unloadLayout();editingOnly(false);   /* disable() also strips the chip and the drag line, so the save is clean */
  if(eb)eb.textContent="✏️ Edit";
  saveContent();
  /* On a gate page the server holds the layout and the reload reads it from there, so the live page goes
     back to what it was before the edit. An OPEN page has no server: reverting here would throw away the
     arrangement the teacher just made, and nothing exists to load it back from. It keeps what it has. */
  if (!OPENPAGE) ca.innerHTML = savedLive;
  /* DONE RE-SOLVES: the widths are measured again for the page the teacher left, so the geometry is the
     solver's and not a sum of what the drags happened to carry. */
  if(window.EqualizeRows){ try{ EqualizeRows.clean(document); EqualizeRows.run(); }catch(e){} }
  eqRun=null;
  renderCompleteBtn();
  const fdn=document.getElementById("feed");if(fdn)fdn.value=nbkVal;
  toast(OPENPAGE
    ? "Layout kept in this tab. 💾 Save to repo writes it to the file."
    : "Saved");
 }
}
/* ALT+E TOGGLES EDIT MODE, FROM ANYWHERE. The hotkey lives here rather than in layout.js because
   layout.js is only loaded when the layer is; this file is on the page from the start, so the combo can
   ENTER edit mode as well as leave it. It runs the button's own function, so it does exactly what
   Edit / Done does — save, revert where the server holds the layout, and re-solve. */
document.addEventListener("keydown",function(e){
 if(!e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key!=="e"&&e.key!=="E")return;
 e.preventDefault();e.stopPropagation();
 toggleEditMode();
},true);
/* shared notebook: a plain textarea, one per student+lesson, auto-saved (debounced) */
const nbId=()=>"notebook_"+STUDENT+"_"+L;
let nbTimer=null;
function nbSave(){const fd=document.getElementById("feed");if(!fd)return;send({action:"set",id:nbId(),type:"notebook",anchor:"",data:fd.value,track:TRACK});}
document.addEventListener("input",e=>{if(e.target&&e.target.id==="feed"){clearTimeout(nbTimer);nbTimer=setTimeout(nbSave,800);}});
/* ---- exercise answers (input.gap / radio / translation textareas) — type "answer" ------------
   THE NUMBER IS THE IDENTITY. A control carrying a number in `name` — `a1c1` for an item, `a1c1g1`
   for its first gap (FUNCTION.md [CONTENT]) — is keyed by that name alone: the number is unique on the
   page, so no ruler and no ordinal are needed, and rewording or reordering leaves every answer where
   it was. A control with no such name is keyed the LEGACY way, unchanged: anchor = the text the field
   answers (a gap's prompt, a question's stem, a translation box's prompt), with {b,o} (the highlight
   ruler) as the tie-breaker for duplicate text. Server stays the source of truth; an empty answer
   DELETES its row (no empty-row bloat); restore skips a control the student is currently typing in
   plus any row whose local write is still in flight. */
const ansNorm=s=>lineNorm(String(s==null?"":s)).replace(/\s+/g," ").trim();
function ansQstem(radio){let el=radio&&radio.closest?radio.closest("label"):null;if(!el)return null;
 const opts=el.closest(".qopts");
 if(opts){const line=opts.previousElementSibling;
  /* THE STEM MAY *BE* THAT SIBLING. The documented item is `.qitem > .qstem + .qopts`, so the line before
     the options is the `<p class="qstem">` itself — and `querySelector(".qstem")` never matches the
     element it is called on, so the branch below found nothing and every radio in that shape returned
     null: no anchor, no save, and a chosen option that came back unselected after a refresh. A line that
     IS the stem is now taken as one; the `.qline` wrapper (a game's own markup) still resolves by
     searching inside it. */
  const st=line?((line.classList&&line.classList.contains("qstem"))?line:line.querySelector(".qstem")):null;
  if(st)return st;}
 let p=el.previousElementSibling;while(p){if(p.classList.contains("qstem"))return p;if(p.classList.contains("qnum"))return null;p=p.previousElementSibling;}
 return null}
/* THE TEXT A GAP ANSWERS = the nearest ancestor that carries text: its own parent for a normal prompt
   ("a ___ locker"), the ROW for a gap alone in a table cell (<td><input class="gap"></td>), the BLOCK for a
   lone .blanks line whose only text is the sibling .pt gloss. (hlBlockOf is no help: a <div> IS a text
   block, so the empty wrapper would be the block.)

   ITS PLACE = the ordinal among the gaps sharing that anchor (-1, -2, …) whenever the parent holds more than
   one gap or carries no text, because such gaps share an anchor AND a text offset (an empty cell has no text
   node at all, so ansPos gives null and ansRowFor(anchor,null) returns the FIRST row) — the second answer
   used to overwrite the first (B-I12). A text offset is never negative, so an ordinal can never collide with
   one. A normal single-gap prompt keeps its exact old anchor and offset: nothing already saved is re-keyed. */
/* THE ANCHOR IS THE ITEM, NOT ITS NUMBER. A gap alone in a table cell used to take the CELL's text as its
   anchor, and the only text in that cell is the item number — so every such gap was keyed "1.", "2." …, the
   same strings the next block's items carry, and the only thing telling two of them apart was the {b,o}
   offset. That offset is an INDEX into the page's block list, and engine4 inserts a stage into every game
   block at load: a row saved while those stages existed is looked up at the next load before they do, the
   offset misses by a few, the answer does not come back — and then the unload's save wrote the empty field
   over the row. So a number-only ancestor is SKIPPED and the walk continues to the row/cell that carries
   the item's own words, which is unique and does not move. */
function ansNumberOnly(p){const t=ansNorm(p.textContent||"");return /^\d+\.?$/.test(t)}
function ansAnchorOf(el){let p=el.parentElement;
 while(p){const t=ansNorm(p.textContent);if(t&&!ansNumberOnly(p))return t;p=p.parentElement}
 return""}
/* the anchor the same control had before the rule above (its nearest ancestor, number and all) — read only
   as a FALLBACK by ansRowFor, so an answer saved under the old key is still found and migrates to the new
   one the next time the student answers it. Nothing is lost to the change. */
function ansAnchorLegacy(el){let p=el.parentElement;
 while(p){const t=ansNorm(p.textContent);if(t)return t;p=p.parentElement}
 return""}
function ansCellPos(el,a){const blk=hlBlockOf(el);if(!blk)return null;
 const b=hlBlocks().indexOf(blk);if(b<0)return null;
 let k=0;const gs=blk.querySelectorAll("input.gap, textarea");
 for(let i=0;i<gs.length;i++){const g=gs[i];
  if(g.id==="feed")continue;                     /* the notebook is not an item, so it is not counted */
  if(g===el)break;
  if(ansAnchorOf(g)===a)k++;}
 return{b:b,o:-1-k}}
/* TWO CONTROLS IN ONE CELL SHARE AN ANCHOR **and** a text offset (the cell's first text node), so they
   were written to the SAME row and the second answer silently replaced the first. The ordinal is
   therefore taken whenever the wrapper holds more than one control of EITHER kind — a gap or a
   textarea — not only more than one gap. A wrapper with a single control keeps the exact offset it
   always had, so nothing already saved is re-keyed. */
function ansGap(el,w){
 const a=ansAnchorOf(el);if(!a)return null;
 const many=w.querySelectorAll&&w.querySelectorAll("input.gap, textarea").length>1;
 if(!many&&ansNorm(w.textContent))return{anchor:a,posEl:w};
 return{anchor:a,posEl:w,pos:ansCellPos(el,a)}}
function ansPosOf(o){return(o&&o.pos)?o.pos:ansPos(o&&o.posEl)}
function ansOf(el){
 /* a numbered control is its own identity — see the header comment above. The shape is the one
    FUNCTION.md [CONTENT] documents, `a<section>c<block letter><item>` with an optional `g<n>` for a gap, so a
    page that never adopted the convention keeps the legacy text anchor and nothing it saved moves. */
 const num=(typeof el.name==="string"&&/^a\d+[a-z]\d+(g\d+)?$/.test(el.name))?el.name:null;
 if(num)return{anchor:num,posEl:null,pos:null};
 if(el.matches&&el.matches("input.gap")){const w=el.parentElement;if(!w)return null;return ansWithAlt(el,ansGap(el,w))}
 if(el.matches&&el.matches('input[type="radio"]')){const st=ansQstem(el);if(!st)return null;
  /* a choice is keyed by the words of its own question, which are unique on the page and never move */
  return{anchor:ansNorm(st.textContent),posEl:st}}
 if(el.tagName==="TEXTAREA"&&el.id!=="feed"){const w=el.parentElement;if(!w)return null;
  /* a translation/dictation box follows the same rule as a gap: one control in its cell keeps the
     offset it always had, two of them in the same cell take the ordinal so they cannot overwrite
     each other's row */
  return ansWithAlt(el,ansGap(el,w)||{anchor:ansNorm(w.textContent),posEl:w})}
 return null}
/* the same control's PREVIOUS anchor (its nearest text ancestor, item number and all) is carried beside the
   stable one so a row saved under the old key is still found — see ansRowFor */
function ansWithAlt(el,o){
 if(!o||!o.anchor)return o;
 const a=ansAnchorLegacy(el);
 if(a&&a!==o.anchor)o.alt=a;
 return o}
function ansPos(posEl){const blk=hlBlockOf(posEl);if(!blk)return null;
 const b=hlBlocks().indexOf(blk);if(b<0)return null;
 const w=document.createTreeWalker(posEl,NodeFilter.SHOW_TEXT);const n=w.nextNode();
 const o=n?hlOffset(blk,n,0):-1;return o<0?null:{b,o}}
let ansLocal=[];
function ansRows(){
 const rows=layer.filter(r=>r.type==="answer");
 ansLocal=ansLocal.filter(r=>{const p=pendingFor(r.id);return !!p&&p.action!=="del"});
 ansLocal.forEach(r=>{const i=rows.findIndex(x=>x.id===r.id);if(i>=0)rows[i]=r;else rows.push(r)});
 return rows;
}
function ansValueOf(r){if(!r)return"";let j=null;try{j=JSON.parse(String(r.data||"{}"))}catch(e){return String(r.data||"")}
 return(j&&typeof j.v==="string")?j.v:""}
function ansRowFor(t,pos,alt){let rows=ansRows().filter(r=>r.anchor===t);
 if(!rows.length&&alt&&alt!==t)rows=ansRows().filter(r=>r.anchor===alt);  /* saved before the anchor rule */
 if(!rows.length)return null;
 if(!pos)return rows[0];
 /* AN ORDINAL IS THE IDENTITY. Two controls that share one anchor are told apart by the ordinal (-1, -2 …),
    and the ordinal counts SIBLING CONTROLS, so it does not move when the page around them changes — while
    `b` beside it is an index into the whole page's block list and does drift (a game inserts its stage at
    load). So an ordinal row is matched on the ordinal alone: the second field of a cell can neither take
    the first one's row nor lose its own to a moved index. */
 if(pos.o<0){
  const m=rows.filter(r=>{const p=nbDataPos(r.data);return p&&p.o===pos.o});
  return m.length===1?m[0]:null}
 const hit=rows.find(r=>{const p=nbDataPos(r.data);return p&&p.b===pos.b&&p.o===pos.o});
 if(hit)return hit;
 /* a text offset can drift too (a block is edited, a game inserts its stage): when the anchor names exactly
    ONE answer, that row IS this control's answer and a moved offset must not hide it */
 return rows.length===1?rows[0]:null}
function ansSet(t,v,pos,alt){
 const cur=ansRowFor(t,pos,alt);
 if(v===""){
  if(cur){layer=layer.filter(x=>x.id!==cur.id);ansLocal=ansLocal.filter(r=>r.id!==cur.id);send({action:"del",id:cur.id});}
  return;
 }
 if(cur&&ansValueOf(cur)===v)return;
 const id=cur?cur.id:(Date.now()+"_"+Math.floor(Math.random()*9999));
 const data=JSON.stringify(pos?{v:v,b:pos.b,o:pos.o}:{v:v});
 const row={id:id,type:"answer",anchor:t,author:who(),ts:new Date().toISOString(),data:data};
 const i=layer.findIndex(x=>x.id===id);
 const merged=i>=0?(layer[i]=Object.assign({},layer[i],row)):(layer.push(row),row);
 ansLocal=ansLocal.filter(r=>r.id!==id);ansLocal.push(merged);
 send({action:cur?"set":"add",id:id,type:"answer",anchor:t,data:data});
}
function ansSaveEl(el){const o=ansOf(el);if(!o||!o.anchor)return;ansSet(o.anchor,el.value,ansPosOf(o),o.alt);}
/* AN EMPTY FIELD IS NOT AN ERASED ANSWER. `ansSaveAll` (the unload flush) used to write EVERY field's
   current value, so a field the page had simply not restored yet — its row saved under a drifted offset,
   or read before the page finished building itself — was written back as "" and its row DELETED on the
   server. That is how the answers went one at a time on successive refreshes (owner report 2026-11-20).
   Only a field the STUDENT actually edited is saved from here on: `ansDirty` is marked by the input and
   change handlers, and an untouched field can never overwrite what the server holds. */
const ansDirty=new WeakSet();
function ansMarkDirty(el){if(el&&el.nodeType===1)ansDirty.add(el)}
/* THE DEBOUNCE IS PER FIELD. One shared timer meant that typing in a second field within 800 ms
   cancelled the first field's pending save outright — reported against a block that puts a
   listen-and-write field under each line of the same cell, where the second answer arrived and the
   first never did. Each field now carries its own timer, so nothing can cancel anything else. */
const ansTimers=new WeakMap();
document.addEventListener("input",e=>{const t=e.target;
 if(t&&t.matches&&(t.matches("input.gap")||(t.tagName==="TEXTAREA"&&t.id!=="feed"))){
  ansMarkDirty(t);
  clearTimeout(ansTimers.get(t));
  ansTimers.set(t,setTimeout(()=>ansSaveEl(t),800));}});
/* a gap or a choice finishes its answer when the field is LEFT (blur / Tab / Enter) — a radio saves on
   its own change, and the notebook keeps its own debounce below */
document.addEventListener("change",e=>{const t=e.target;
 if(t&&t.matches&&(t.matches("input.gap")||t.matches('input[type="radio"]')||(t.tagName==="TEXTAREA"&&t.id!=="feed"))){ansMarkDirty(t);ansSaveEl(t);}
 else if(t&&t.id==="feed")nbSave();});
/* re-clicking an already-checked radio DE-SELECTS it (and clears its saved answer). The browser runs the
   PRE-CLICK activation first — it CHECKS the radio (unchecking its group) and only then dispatches the
   click — and reverts that if the click is cancelled. So `checked` inside a click handler is ALWAYS true
   and can never tell a first click from a re-click: testing it (the code before 2026-11-03) cancelled
   EVERY radio click, and the browser's revert put the group back on its previous option — reported as
   "the radios do not accept input" / "the picked choice reverts". The pre-click state is captured on
   pointerdown / mousedown / keydown (all run BEFORE the activation), and the de-select happens AFTER the
   click, because cancelling the click would only make the browser restore the very option being removed. */
let ansRadioPre=null;
function ansRadioTarget(el){
 if(!el||!el.closest)return null;
 if(el.matches&&el.matches('input[type="radio"]'))return el;
 const lab=el.closest("label");return lab&&lab.querySelector?lab.querySelector('input[type="radio"]'):null;
}
function ansArmRadio(el){const r=ansRadioTarget(el);ansRadioPre=r?{el:r,checked:r.checked}:null;}
document.addEventListener("pointerdown",e=>ansArmRadio(e.target),true);
document.addEventListener("mousedown",e=>ansArmRadio(e.target),true);
document.addEventListener("keydown",e=>{if(e.key===" "||e.key==="Spacebar"||e.key==="Enter")ansArmRadio(e.target)},true);
document.addEventListener("click",e=>{const t=ansRadioTarget(e.target);if(!t)return;
 const pre=ansRadioPre&&ansRadioPre.el===t?ansRadioPre.checked:false;ansRadioPre=null;
 if(!pre)return;                              /* a first click on this option: the browser's check stands */
 setTimeout(()=>{if(!t.checked)return;t.checked=false;
  const o=ansOf(t);if(o&&o.anchor)ansSet(o.anchor,"",ansPosOf(o));},0);
});
/* the leftover global timer and its listener are gone: the per-field debounce above replaced them */
function ansSaveAll(){document.querySelectorAll("input.gap, textarea").forEach(el=>{
 if(el.tagName==="TEXTAREA"&&el.id==="feed")return;
 if(!ansDirty.has(el))return;                    /* untouched: it must never erase a row the page could not restore */
 ansSaveEl(el)});}
function flushNow(){ansSaveAll();nbSave();scheduleFlush()}
window.addEventListener("pagehide",flushNow);
document.addEventListener("visibilitychange",()=>{if(document.hidden)flushNow()});
/* A VIEW IS NOT A SAVE. A snapshot that arrives WITHOUT this control's row used to erase whatever the
   student had typed: the write may have been answered and then dropped by the backend, the row may have
   been deleted on another device, or the page may have been re-edited so the anchor moved. The value on
   the screen is still the student's answer, so it is written again instead of being wiped — once per
   anchor for the life of the page, so a genuinely deleted row cannot be resurrected in a loop and a
   second miss hands the snapshot the last word, exactly as before. */
const ansResent=new Set();
function ansResend(o,v,pos){
 if(!o||!o.anchor||ansResent.has(o.anchor))return;
 ansResent.add(o.anchor);
 ansSet(o.anchor,v,pos,o.alt);
}
function renderAnswers(){
 const pending=new Set(ansRows().filter(r=>pendingFor(r.id)).map(r=>r.id));
 document.querySelectorAll("input.gap, textarea").forEach(el=>{
  if(el.tagName==="TEXTAREA"&&el.id==="feed")return;
  const o=ansOf(el);if(!o||!o.anchor)return;
  const pos=ansPosOf(o);
  const row=ansRowFor(o.anchor,pos,o.alt);
  if(row&&pending.has(row.id))return;
  if(document.activeElement===el)return;
  if(!row){                                        /* no row: keep what is on the screen, and re-save it */
   if(el.value!=="")ansResend(o,el.value,pos);
   return;
  }
  const want=ansValueOf(row);
  if(el.value!==want)el.value=want;
 });
 document.querySelectorAll('input[type="radio"]').forEach(el=>{
  const o=ansOf(el);if(!o||!o.anchor)return;
  const pos=ansPosOf(o);
  const row=ansRowFor(o.anchor,pos,o.alt);
  if(row&&pending.has(row.id))return;
  if(!row){                                        /* the same rule for a choice: a checked one is re-sent */
   if(el.checked)ansResend(o,el.value,pos);
   return;
  }
  const want=ansValueOf(row);
  const should=(want!=null&&el.value===want);
  if(el.checked!==should)el.checked=should;
 });
 doneBlocks();
}
/* ---- a block reports its own progress (owner 2026-11-21) ------------------------------------
   EVERY QUESTION IN THE BLOCK HAS AN ANSWER ON IT — a gap with at least one character, a written
   field with text, one option picked in each radio group, at least one box ticked in each group of
   checkboxes — and the block carries data-state="done", which the sheet draws as its green frame
   (#80 STATE). A question that empties takes the state away again, so the block returns to its own
   look (red on a stripes block). A block is a question group this way: each `input.gap` and
   `textarea` is one on its own, a radio group is one (keyed by `name`), and a run of checkboxes is
   one (keyed by the `.qopts` / `.qitem` / `.opts` that holds them).
   Opted in per page by <html data-done>; an authored data-state on a block is kept and restored.
   fullPageHTML strips the state from the saved clone, so a file never keeps the report of the
   student who saved it. */
const doneAuthored=new WeakMap();
function doneUsed(el){
  if(el.type==="radio"){
    const n=el.getAttribute("name");
    const g=n?el.ownerDocument.querySelectorAll('input[type="radio"][name="'+n.replace(/(["\\])/g,"\\$1")+'"]'):[el];
    return [].some.call(g,function(x){return x.checked;});
  }
  if(el.type==="checkbox"){
    const box=el.closest(".qopts,.qitem,.opts")||el.parentElement;
    return [].some.call(box.querySelectorAll('input[type="checkbox"]'),function(x){return x.checked;});
  }
  return String(el.value||"").trim()!=="";
}
function doneBlocks(){
  if(!document.documentElement.hasAttribute("data-done"))return;
  document.querySelectorAll(".content-area .block").forEach(function(b){
    const ctrls=[].filter.call(b.querySelectorAll('input.gap,textarea,input[type="radio"],input[type="checkbox"]'),
      function(el){return !(el.tagName==="TEXTAREA"&&el.id==="feed");});
    if(!ctrls.length)return;
    if(!doneAuthored.has(b))doneAuthored.set(b,b.getAttribute("data-state"));
    const ok=ctrls.every(doneUsed);
    const orig=doneAuthored.get(b);
    if(ok){if(b.getAttribute("data-state")!=="done")b.setAttribute("data-state","done");}
    else if(b.getAttribute("data-state")==="done"){if(orig)b.setAttribute("data-state",orig);else b.removeAttribute("data-state");}
  });
}
["input","change"].forEach(function(ev){document.addEventListener(ev,function(){doneBlocks();});});
/* a re-click de-selects a radio after the browser's own activation, so the report is taken once the
   whole click (and that timeout) has run */
document.addEventListener("click",function(){setTimeout(doneBlocks,0);});
/* "Complete?" tag button (2026-10-22): a per-student+track+lesson tag with no other effect.
   Rendered for BOTH students and teachers; for a teacher it tags the currently selected student. */
function completeId(){return "complete_"+STUDENT+"_"+TRACK+"_"+L;}
function ensureCompleteBtn(){
 let row=document.getElementById("completerow");
 if(!row){
  row=document.createElement("div");
  row.id="completerow";row.className="complete-row";
  const fd=document.getElementById("feed");
  let anchor=fd;
  const prevEl=fd?fd.previousElementSibling:null;
  if(prevEl&&prevEl.tagName==="H2")anchor=prevEl;
  const pb=document.createElement("button");
  pb.type="button";pb.textContent="← Last";pb.disabled=L<=1;
  pb.onclick=()=>{if(L>1)goLesson(L-1)};
  const btn=document.createElement("button");
  btn.type="button";btn.id="completebtn";btn.className="complete-btn";
  const nb=document.createElement("button");
  nb.type="button";nb.textContent="Next →";
  nb.onclick=()=>goLesson(L+1);
  row.appendChild(pb);row.appendChild(btn);row.appendChild(nb);
  if(anchor)anchor.parentNode.insertBefore(row,anchor);
  else{const ca=document.querySelector(".content-area");if(ca)ca.appendChild(row);}
 }
 const btn=document.getElementById("completebtn");
 btn.onclick=()=>{
  const pid=completeId();
  if(completeNow){send({action:"del",id:pid});layer=layer.filter(r=>r.type!=="complete");}
  else{send({action:"add",id:pid,type:"complete",anchor:"",data:"1",track:TRACK});layer.push({id:pid,type:"complete",anchor:"",data:"1"});}
  completeNow=!completeNow;renderCompleteBtn();
 };
 return btn;
}
/* ---- reveal & lock: Complete shows each key and freezes the page, Clear takes both back ----
   The key lives in the page: data-answer on a typed control (pipes separate accepted forms), data-a on
   the .qitem for a radio group or a tick set (one place per pipe).
   An option the student ticked that the key does not name is marked wrong. Nothing here touches the backend, and the student's own answer stays an
   ordinary answer row - this only reads the page and marks it. */
function ansKeyText(el){
 const raw=el.getAttribute("data-answer")||"";
 return raw.split("|").map(s=>s.trim()).filter(Boolean).join(" / ");
}
function applyCompleted(on){
 document.body.classList.toggle("is-completed",!!on);
 document.querySelectorAll("[data-answer]").forEach(el=>{
  const host=el.parentElement;if(!host)return;
  /* THE PILL IS THE CONTROL'S, NOT THE CELL'S. A cell can hold two fields — a gap and a written field, or
     two dictation boxes — and a host-wide lookup handed the second field the first one's pill and
     overwrote it: one answer shown, the other lost. Each control keeps its own pill on itself, and where a
     host holds more than one control every pill sits right after the control it belongs to; a host with a
     single control keeps the pill at the end of the cell, exactly as before. */
  let sp=el.__ans&&host.contains(el.__ans)?el.__ans:null;
  if(!on){if(sp){sp.remove();el.__ans=null}host.classList.remove("has-ans");return;}
  if(!sp){
   sp=document.createElement("span");sp.className="ans";
   if(host.querySelectorAll("[data-answer]").length>1)el.insertAdjacentElement("afterend",sp);
   else host.appendChild(sp);
   el.__ans=sp;
  }
  host.classList.add("has-ans");
  const v=ansKeyText(el);if(sp.textContent!==v)sp.textContent=v;
 });
 document.querySelectorAll(".qitem[data-a]").forEach(q=>{
  const right=q.getAttribute("data-a"), rights=right.split("|").map(t=>t.trim());
  q.querySelectorAll(".qopts label").forEach(lab=>{
   const inp=lab.querySelector('input[type="radio"],input[type="checkbox"]');
   lab.classList.toggle("correct",!!on&&!!inp&&rights.includes(inp.value));
   /* THE KEY IS GREEN, THE STUDENT'S MISTAKE IS RED: an option the student ticked that the key does not
      name is marked wrong, so an extra tick in a multi-place answer is visible rather than silent. */
   lab.classList.toggle("wrong",!!on&&!!inp&&!!inp.checked&&!rights.includes(inp.value));
  });
 });
 document.querySelectorAll("input.gap, textarea").forEach(el=>{
  if(el.tagName==="TEXTAREA"&&el.id==="feed")return;
  if(on)el.setAttribute("readonly","readonly");else el.removeAttribute("readonly");
 });
 document.querySelectorAll('input[type="radio"], .qitem[data-a] input[type="checkbox"]').forEach(el=>{el.disabled=!!on});
}
function renderCompleteBtn(){
 const pid=completeId();
 const row=layer.find(r=>r.type==="complete");
 if(!pendingFor(pid))completeNow=!!row;
 const btn=ensureCompleteBtn();
 btn.textContent=completeNow?"Completed":"Complete?";
 btn.classList.toggle("is-done",completeNow);
 applyCompleted(completeNow);
}
(async()=>{try{
 const bar=document.getElementById("controlbar");
 let extra="";
 if(gate.teacher){extra=' <select id="sel"><option value="'+gate.email+'">'+(gate.teacherName||gate.email)+'</option></select>';}
 const folder=String(TRACK),cap=folder.charAt(0).toUpperCase()+folder.slice(1);
 /* The bar (owner instruction 2026-11-09): Index is a BUTTON and comes FIRST; the current book gets its own
    lesson selector beside it, rendering the same .bookitem list the Index page does, with the number as plain
    text and the name as the only link; the identity and the book's name are gone from the bar. Glyphs are
    written as HTML entities so this file stays pure ASCII. */
 bar.innerHTML='<button type="button" id="idxbtn" title="Back to the index">&#8962; Index</button>'
  +'<div class="bookdrop barsel"><button type="button" class="bookbtn" id="barselbtn">'+cap+' &#9662;</button>'
  +'<div class="bookmenu" id="barselmenu" hidden></div></div>'
  +extra
  +' <button type="button" id="prevlesson"'+(L>1?'':' disabled')+' title="Lesson '+(L-1)+'">&#8592; Last</button>'
  +' <button type="button" id="nextlesson" title="Lesson '+(L+1)+'">Next &#8594;</button>';
 const ib=document.getElementById("idxbtn");if(ib)ib.onclick=()=>location.href=SITE+"index.html";
 /* the book's lessons, built on FIRST OPEN so a lesson page pays nothing for a list it may never open; the
    label and the swatch come from tracks.json and the items from lessons.json — the same two sources the
    Index page reads, so the two lists cannot drift apart. */
 const sb=document.getElementById("barselbtn"),sm=document.getElementById("barselmenu");
 const escT=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 let selLoaded=false;
 if(sb&&sm){
  fetch(SITE+"tracks.json").then(r=>r.ok?r.json():null).then(list=>{
   const m=(Array.isArray(list)?list:[]).find(x=>x&&x.name===folder);if(!m)return;
   if(m.label)sb.textContent=m.label+(m.icon?" "+m.icon:"")+" \u25BE";
   if(/^#[0-9a-f]{3,8}$/i.test(String(m.color||"")))sb.style.setProperty("--sw",m.color);
  }).catch(()=>{});
  sb.onclick=async e=>{
   e.stopPropagation();
   const wasOpen=!sm.hidden;sm.hidden=true;if(wasOpen)return;
   if(!selLoaded){
    let ls=[];
    try{const r=await fetch(SITE+"lessons.json");if(r.ok){const j=await r.json();ls=(j&&j[folder])||[];}}catch(err){}
    if(!ls.length){
     sm.innerHTML='<div class="bookitem"><span class="lnum">&mdash;</span><span class="ltitle dim">no lessons</span></div>';
    }else{
     selLoaded=true;
     sm.innerHTML=ls.map(le=>{
      const n=le.n,num=(n<10?"0":"")+n,t=le.title?escT(le.title):"&mdash;";
      /* the entry carries its FILENAME; an entry without one is a stale list and is not linked */
      const h=le.file?SITE+folder+"/"+encodeURIComponent(le.file):"";
      return '<div class="bookitem'+(n===L?' cur':'')+'"><span class="lnum">'+num+'</span>'
       +(h?'<a class="ltitle" href="'+h+'" title="'+num+'. '+t+'"'+(n===L?' aria-current="page"':'')+'>'+t+'</a>'
           :'<span class="ltitle dim" title="'+t+'">'+t+'</span>')+'</div>';
     }).join("");
    }
   }
   sm.hidden=false;
  };
  document.addEventListener("click",e=>{if(!e.target.closest(".barsel"))sm.hidden=true;});
 }
 const pv=document.getElementById("prevlesson");if(pv&&L>1)pv.onclick=()=>goLesson(L-1);
 const nx=document.getElementById("nextlesson");if(nx)nx.onclick=()=>goLesson(L+1);
 const cp=document.createElement("button");cp.type="button";cp.id="clearpage";cp.textContent="\u{1F9F9} Clear page";
 if(cp)cp.onclick=async()=>{
  /* the site's own dialog, never the browser's (owner instruction 2026-11-09) */
  if(!(await eodConfirm({title:"Clear this page?",danger:true,body:"Delete ALL highlights, notes and recordings on this page? This cannot be undone.",confirm:"Clear page",cancel:"Keep it"})))return;
  send({action:"wipe"});                      /* network-last, like every other write */
  layer=[];hlList=[];ntList=[];sig="";wipeGuard=Date.now()+12000;
  document.querySelectorAll("mark.nb").forEach(m=>m.remove());
  hlReflow();ntReflow();
  /* Clear empties the page as well as the records: the typed answers, the reveal and the lock are this
     page's own state, and the wipe row has just deleted every answer row they were rendered from. */
  document.querySelectorAll("input.gap, textarea").forEach(el=>{if(el.tagName==="TEXTAREA"&&el.id==="feed")return;el.value=""});
  document.querySelectorAll('input[type="radio"]').forEach(el=>{el.checked=false});
  completeNow=false;renderCompleteBtn();
 };
 const ppb=document.createElement("button");ppb.type="button";ppb.id="printpage";ppb.textContent="🖨 Print";
 ppb.onclick=()=>{if(typeof printLesson==="function")printLesson();else toast("Print unavailable.")};
 bar.appendChild(ppb);
 /* Clear page sits to the RIGHT of Print (owner instruction 2026-11-09). It is created here rather than
    written into the innerHTML above because the bar's order is Index · book selector · [extra] · Last ·
    Next · Print · Clear page — a node appended after Print is what puts it in that place. */
 bar.appendChild(cp);
 if(gate.teacher){
  const eb=document.createElement("button");eb.type="button";eb.id="editpage";eb.textContent="✏️ Edit";eb.onclick=()=>toggleEditMode();bar.appendChild(eb);
  const rb=document.createElement("button");rb.type="button";rb.id="revertpage";rb.textContent="↩️ Revert";rb.onclick=async()=>{if(!(await eodConfirm({title:"Discard your edits?",danger:true,body:"Discard your saved edits and restore the original content?",confirm:"Revert",cancel:"Keep edits"})))return;send({action:"del",id:contentId()});toast("Reverting…");setTimeout(()=>location.reload(),900)};bar.appendChild(rb);
  /* the two buttons that finish an edit: they exist only for the teacher and show only inside edit
     mode, so the bar a reader sees never changes. Save downloads the page; the watcher places it. */
  const sb=document.createElement("button");sb.type="button";sb.id="saverepo";sb.textContent="💾 Save to repo";sb.hidden=true;sb.onclick=()=>saveToRepo();bar.appendChild(sb);
  const ib=document.createElement("button");ib.type="button";ib.id="clearink";ib.textContent="🧹 Clear ink";ib.hidden=true;ib.onclick=()=>clearInk();bar.appendChild(ib);
 }
 const selEl=document.getElementById("sel");
 if(gate.teacher&&selEl){selEl.onchange=()=>{
  STUDENT=selEl.value;sig="";
  const opt=selEl.selectedOptions&&selEl.selectedOptions[0];
  if(STUDENT===gate.email){delete gate.student;gate.name=gate.teacherName||"";}
  else{gate.student=STUDENT;gate.name=opt?(opt.textContent||""):"";}
  gate.sig=h(gate.email+gate.track+SECRET);
  try{sessionStorage.gate=JSON.stringify(gate);}catch(e){}
  if(gate.name)document.querySelectorAll(".stuname").forEach(el=>el.textContent=gate.name);
  loadLayer();
};}
 if(gate.teacher&&!OPENPAGE){
  (async()=>{
   let st=[];
   try{
    const j=await(await fetch(BACKPACK+"?action=students&track="+encodeURIComponent(TRACK)+"&t="+Date.now())).json();
    st=(j&&j.students)||[];
   }catch(e){st=[];}
   const el=document.getElementById("sel");
   if(el){el.innerHTML='<option value="'+gate.email+'">'+(gate.teacherName||gate.email)+'</option>'+st.map(s=>'<option value="'+s.email+'">'+(s.name||s.email)+"</option>").join("");el.value=STUDENT;}
  })();
 }
 loadLayer();renderCompleteBtn();
 /* ---- cross-session poll (owner spec 2026-10-12) — the ONLY re-check there is: add/set/del on
    either side (teacher or student) reach the other as fast as the adaptive poll allows. Each send()
    marks its own id+action "pending" for 12s (engine1.js notePending/pendingFor); renderLayer()
    below skips reverting/resurrecting anything that's still inside its own 12s pending window, so
    a snapshot that races ahead of the backend write can never revert-then-reapply a local action. This
    generic (by id+action, not by feature) pairing is the whole mechanism — any future action type
    that goes through send() is covered automatically, no per-action special-casing needed. */
  /* adaptive poll (owner 2026-10-14): 1s while visible and recently active (a user input or a poll change); 5s after 1 minute of neither; paused while hidden */
  let lastUserActivity=Date.now(),pollTimer=null;
  const pollDelay=()=>(Date.now()-Math.max(lastUserActivity,lastPollChange)>60000)?5000:1000;
 const schedulePoll=()=>{
  if(OPENPAGE)return;
  clearTimeout(pollTimer);pollTimer=null;
  if(document.hidden)return;
  pollTimer=setTimeout(async()=>{pollTimer=null;await loadLayer();schedulePoll();},pollDelay());
 };
  ["pointerdown","pointermove","keydown"].forEach(ev=>document.addEventListener(ev,()=>{lastUserActivity=Date.now()},{passive:true}));
  document.addEventListener("visibilitychange",()=>{if(document.hidden){clearTimeout(pollTimer);pollTimer=null;}else{lastUserActivity=Date.now();schedulePoll();}});
 schedulePoll();
}catch(e){let b=document.getElementById("errb");if(b)b.innerHTML+=" · control bar: "+e.message}})();

async function loadLayer(){
 if(OPENPAGE)return;
 let rows=null;
 try{
  const r=await fetch(BACKPACK+"?action=layer&email="+encodeURIComponent(STUDENT)+"&lesson="+L+"&ver="+LAYER_VER+"&t="+Date.now());
  if(r&&r.ok){const j=await r.json();if(j&&Array.isArray(j.rows))rows=j.rows;}
 }catch(e){rows=null;}
 /* A FAILED READ IS NOT AN EMPTY SERVER (owner report 2026-11-20: "the answers disappear from the page
    after about ten seconds"). The poll runs every second while the student works, so ONE dropped
    request — an Apps Script hiccup, a tunnel, a moment offline, a gateway page that is not JSON — used
    to arrive here as `rows=[]`, and `layer` was then rebuilt "from the server" as nothing: every field
    on the page blanked, and the render that follows is not undoable. Nothing is committed unless the
    snapshot was actually READ: on a failure `layer` keeps exactly what it had, no signature is touched,
    nothing re-renders, and the next poll (1s away) asks again. The server is still the source of truth
    — a successful read that is genuinely empty empties the page, as it must. */
 if(rows===null)return;
 layer=rows;
  const s=layer.map(x=>x.id).join(",");
  /* a change (add/del/edit/recolour) keeps the adaptive poll fast while the student watches */
  const full=layer.map(r=>r.id+"|"+r.type+"|"+r.anchor+"|"+r.data+"|"+r.ts).join("\n");
  if(full!==lastFull){lastFull=full;lastPollChange=Date.now();}
  if(s===sig)return;sig=s;
 if(Date.now()<wipeGuard)return;   /* a Clear-page wipe is still in flight — never resurrect its rows */
 renderLayer();
}

function renderLayer(){
 /* Clear the note/recording flags of every mark.nb — except the ones with a local action still in
    flight (nbAnyPending, engine1.js). A mark created or deleted a moment ago must keep EXACTLY the
    state the click gave it: stripping the class here and re-adding it on the next poll is precisely
    the "appearing and disappearing" the owner reported. Same id+action grace window as everything
    else — the rule is general, not special-cased. */
 document.querySelectorAll("mark.nb").forEach(m=>{if(!nbAnyPending(m.dataset.a))m.classList.remove("has-rec")});
 /* highlight layer (#hlLayer): the records are the only truth here, so a highlight whose server
    row is gone disappears and the ones still stored are rebuilt from their row (anchor + offsets,
    or the anchor text alone for old rows). The text DOM is never touched: highlights are painted
    over the text, notes/recordings are elements inside it.
    GENERIC PENDING GATE (owner spec 2026-10-12): if THIS id still has a local action in flight
    (pendingFor, engine1.js) — add, set (recolour) OR del — this poll's row is stale by
    definition: the UI already applied that action directly (hlApply/hlSetColor/hlDrop), so the
    row is skipped entirely rather than re-applied, which is what caused the old revert-then-
    reapply flicker. Works for ANY action type that goes through send()+notePending, not just
    highlights — a future feature needs no special-casing here, just call notePending(o) in its
    send() path (already automatic, since send() itself calls it). */
 layer.forEach(it=>{
  if(it.type==="hl"&&it.anchor){
   if(!pendingFor(it.id))hlRestore(it);
  }
  if(it.type==="rec"&&it.anchor){
   if(!pendingFor(it.id)){
    const pos=nbDataPos(it.data);
    if(nbMarksAt(it.anchor,pos).filter(m=>m.classList.contains("has-rec")).length)nbFlagAt(it.anchor,pos,"has-rec");
    else ensureMark(it.anchor,"rec",pos);
   }
  }
  if(it.type==="note"&&it.anchor){
   if(!pendingFor(it.id))ntRestore(it);
  }
  if(it.type==="key"&&it.anchor){
   if(!pendingFor(it.id))ntRestore(it);
  }
 });
 /* a highlight whose server row no longer exists leaves the layer (the server is the truth);
    one with a local action still pending (add/set/del) stays exactly as the UI left it until
    the pending window elapses or a later poll confirms the server agrees */
 const hlIds=new Set(layer.filter(it=>it.type==="hl"&&it.anchor).map(it=>it.id));
 hlList=hlList.filter(rec=>hlIds.has(rec.id)||pendingFor(rec.id));
 hlReflow();
 const ntIds=new Set(layer.filter(it=>(it.type==="note"||it.type==="key")&&it.anchor).map(it=>it.id));
 ntList=ntList.filter(rec=>ntIds.has(rec.id)||pendingFor(rec.id));
 ntReflow();
 const fdx=document.getElementById("feed");
 if(fdx&&document.activeElement!==fdx&&!pendingFor(nbId())){
   const nbk=layer.find(r=>r.type==="notebook");
   fdx.value=nbk?(nbk.data||""):"";
 }
  renderAnswers();
  renderCompleteBtn();
}

/* fallback: nenhum engine define window.showAnchor;
   sem isto, clique simples em uma frase marcada lançaria ReferenceError no handler de click.
   Reapresenta o popup de sete botões (▶ Hear / ▶ Play / ⏺ Record / 🔊 Delete / 📝 Note·Save /
   📖 Pronunciation 🔑 / 📝 Delete; os que não se aplicam ficam desabilitados) para a âncora clicada. Usa os
   mesmos helpers do popup de seleção (engine1.js), então os dois pontos de entrada — selecionar ou
   clicar na marca — se comportam igual. Passa a ÁREA da marca (um Range real), não r=null, para que
   openNbPopup resolva por SOBREPOSIÇÃO (nbPopState): clicar numa gravação que cruza uma nota apresenta
   OS DOIS, e ⏺ Record fica travado quando a marca já tem gravação. */
if(typeof window.showAnchor!=="function"){window.showAnchor=function(a,x,y){const area=nbAreaOf(a);openNbPopup(a,area?nbAreaRange(area):null,x,y);};}

window.__B=true;
