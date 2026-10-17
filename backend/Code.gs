/**
 * INGLÊS ABRE PORTAS — "ingles-backpack" backend (Google Apps Script)
 * COMPLETE FILE — replace ALL contents of Code.gs with this, then:
 * Deploy → Manage deployments → pencil icon → Version: New deployment → Deploy.
 * The /exec URL does NOT change when you update a web-app deployment version.
 *
 * Storage model: one row per item in sheet "IAP_backpack!layer".
 * Columns: id | email | track | lesson | type | anchor | data | author | ts | b64
 * Separation is enforced on read AND write: email + track + lesson.
 * Recording audio ALWAYS lives in Drive (folder IAP_uploads) and the b64 column keeps a
 * "drive:<fileId>" pointer; del and wipe trash that file too (purgeDrive_), so deleting an item
 * removes both its row and its audio. (Inline b64 in the row is only a last-resort fallback when
 * the Drive upload itself fails — the Sheet cell cannot hold more than ~50k characters.)
 * GET ?action=layer returns EVERY recording as EITHER fileId (Drive) OR b64 (the inline fallback),
 * so a clip is still playable after a page reload even when it never reached Drive.
 * REMINDER: this file only runs after a NEW DEPLOYMENT VERSION (Deploy → Manage deployments).
 */

var SS_NAME = "IAP_backpack";
var TAB = "layer";
var HEADERS = ["id", "email", "track", "lesson", "type", "anchor", "data", "author", "ts", "b64"];
var UPLOAD_FOLDER = "IAP_uploads";

/* ---------- helpers ---------- */
function getSS_() {
  var files = DriveApp.getFilesByName(SS_NAME);
  while (files.hasNext()) {
    var f = files.next();
    if (f.getMimeType() === MimeType.GOOGLE_SHEETS) return SpreadsheetApp.openById(f.getId());
  }
  return SpreadsheetApp.create(SS_NAME); // creates it if missing
}
function getSheet_() {
  var ss = getSS_();
  var sh = ss.getSheetByName(TAB);
  if (!sh) { sh = ss.insertSheet(TAB); }
  if (sh.getLastColumn() < HEADERS.length || sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].join("|") !== HEADERS.join("|")) {
    sh.clear();
    sh.appendRow(HEADERS);
  }
  return sh;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function rowsToObjs_(sh) {
  var v = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < v.length; i++) {
    var o = {};
    for (var j = 0; j < HEADERS.length; j++) o[HEADERS[j]] = v[i][j];
    o._row = i + 1;
    out.push(o);
  }
  return out;
}
/* trash the Drive file a recording row points to (b64 column = "drive:<fileId>" for uploaded audio).
   Never throws: a missing/already-trashed file (or a plain inline b64 row) is simply nothing to purge,
   and a purge failure must never stop the row itself from being deleted. Returns true only when a file
   was actually moved to the trash. */
function purgeDrive_(store) {
  try {
    var s = String(store || "");
    if (s.indexOf("drive:") !== 0) return false;
    var fid = s.slice(6);
    if (!fid) return false;
    DriveApp.getFileById(fid).setTrashed(true);
    return true;
  } catch (e) { return false; }
}

/* ---------- GET: ping / layer / file / dbg ---------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || "ping";

  if (action === "ping") return json_({ ok: true, t: new Date().toISOString() });

  if (action === "layer") {
    var sh = getSheet_();
    var all = rowsToObjs_(sh);
    var rows = [];
    for (var i = 0; i < all.length; i++) {
      var r = all[i];
      if (String(r.email) === String(p.email) && String(r.lesson) === String(p.lesson)) {
        var store = String(r.b64 || "");
        var onDrive = store.indexOf("drive:") === 0;
        /* a Drive clip travels as its fileId; an inline-fallback clip travels as its own b64. Without
           the b64 here, a recording that never reached Drive (failed upload — e.g. an undeployed or
           over-quota backend — or a legacy row) came back with NO audio at all while the phrase still
           looked saved: "playable right after recording, then no saved audio" (owner report). */
        rows.push({ id: r.id, type: r.type, anchor: r.anchor, data: r.data, author: r.author, ts: r.ts,
          fileId: onDrive ? store.slice(6) : "",
          b64: (!onDrive && store) ? store : "",
          mime: "" });
      }
    }
    return json_({ rows: rows, count: rows.length });
  }

  if (action === "file") {
    try {
      var blob = DriveApp.getFileById(p.id).getBlob();
      var b64 = Utilities.base64Encode(blob.getBytes());
      return json_({ b64: b64, mime: blob.getContentType() });
    } catch (err) { return json_({ error: String(err) }); }
  }

  if (action === "dbg") {
    var sh2 = getSheet_();
    var dump = rowsToObjs_(sh2).slice(-50).map(function (r) {
      return { id: r.id, email: r.email, track: r.track, lesson: r.lesson, type: r.type };
    });
    return json_({ total: sh2.getLastRow() - 1, sample: dump });
  }

  return json_({ error: "unknown action" });
}

/* ---------- POST: add / set / del / wipe ---------- */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (lk) { return json_({ error: "busy" }); }
  try {
    var o = JSON.parse(e.postData.contents);
    var sh = getSheet_();
    var action = (o.action || "add").toLowerCase();

    if (action === "add" || action === "set") {
      var id = String(o.id || (Date.now() + "_" + Math.floor(Math.random() * 99999)));
      // set = replace existing row with same id (if any)
      var all = rowsToObjs_(sh);
      for (var i = 0; i < all.length; i++) {
        if (String(all[i].id) === id) {
          /* replacing a row (note re-save / clip re-record) must trash the Drive file the OLD row
             pointed at, or every re-record would leak its previous clip in IAP_uploads */
          purgeDrive_(all[i].b64);
          sh.deleteRow(all[i]._row);
          break;
        }
      }
      /* a recording's audio ALWAYS goes to Drive (owner spec 2026-10-12): the row keeps only a
         "drive:<fileId>" pointer, never inline audio.
         If the upload itself fails, fall back to an inline
         copy only when it fits a cell (<45k chars) so nothing is ever silently lost. */
      var store = o.b64 || "";
      if (o.b64) {
        try {
          var folder = DriveApp.getFoldersByName(UPLOAD_FOLDER).hasNext()
            ? DriveApp.getFoldersByName(UPLOAD_FOLDER).next()
            : DriveApp.createFolder(UPLOAD_FOLDER);
          var blob = Utilities.newBlob(Utilities.base64Decode(o.b64), o.mime || "audio/webm", id);
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          store = "drive:" + file.getId();
        } catch (upErr) {
          if (String(o.b64).length > 45000) store = ""; // too big for a cell and the upload failed → drop inline
        }
      }
      sh.appendRow([id, o.email || "", o.track || "", o.lesson || "", o.type || "", o.anchor || "",
        typeof o.data === "string" ? o.data : JSON.stringify(o.data || ""), o.author || "aluno",
        new Date().toISOString(), store]);
      return json_({ result: "ok", id: id });
    }

    if (action === "del") {
      var target = String(o.id);
      var rows2 = rowsToObjs_(sh);
      var deleted = 0, purged = false;
      // delete bottom-up so row numbers stay valid
      for (var k = rows2.length - 1; k >= 0; k--) {
        if (String(rows2[k].id) === target) {
          // recording audio that was uploaded to Drive keeps a "drive:<fileId>" pointer in the b64
          // column: trash the file as well, or the delete would only remove the row and leak the audio.
          if (purgeDrive_(rows2[k].b64)) purged = true;
          sh.deleteRow(rows2[k]._row); deleted++;
        }
      }
      return json_({ result: "deleted", count: deleted, purged: purged });
    }

    if (action === "wipe") {
      // teacher-only reset: removes EVERY row whose email+lesson match params (no email = wipe all),
      // regardless of type — marks, answers, the shared notebook, edit-mode staging — so "Clear page"
      // empties everything a student+lesson has, not just what is currently displayed.
      var rows3 = rowsToObjs_(sh), removed = 0;
      for (var m = rows3.length - 1; m >= 0; m--) {
        var rr = rows3[m];
        var matchAll = !o.email;                       // no filters = wipe everything
        var matchScope = String(rr.email) === String(o.email) && String(rr.lesson) === String(o.lesson);
        if (matchAll || matchScope) { purgeDrive_(rr.b64); sh.deleteRow(rr._row); removed++; }
      }
      return json_({ result: "wiped", removed: removed });
    }

    return json_({ error: "unknown action" });
  } catch (err) {
    return json_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
