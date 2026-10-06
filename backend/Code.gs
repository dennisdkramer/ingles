/**
 * INGLÊS ABRE PORTAS — "ingles-backpack" backend (Google Apps Script)
 * COMPLETE FILE — replace ALL contents of Code.gs with this, then:
 * Deploy → Manage deployments → pencil icon → Version: New deployment → Deploy.
 * The /exec URL does NOT change when you update a web-app deployment version.
 *
 * Storage model: one row per item in sheet "IAP_backpack!layer".
 * Columns: id | email | track | lesson | type | anchor | data | author | ts | b64
 * Separation is enforced on read AND write: email + track + lesson.
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
        rows.push({ id: r.id, type: r.type, anchor: r.anchor, data: r.data, author: r.author, ts: r.ts, fileId: r.b64 && String(r.b64).indexOf("drive:") === 0 ? String(r.b64).slice(6) : "" });
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
        if (String(all[i].id) === id) { sh.deleteRow(all[i]._row); break; }
      }
      var store = o.b64 || "";
      // large binaries go to Drive, cell keeps a pointer
      if (o.b64 && String(o.b64).length > 150000) {
        try {
          var folder = DriveApp.getFoldersByName(UPLOAD_FOLDER).hasNext()
            ? DriveApp.getFoldersByName(UPLOAD_FOLDER).next()
            : DriveApp.createFolder(UPLOAD_FOLDER);
          var blob = Utilities.newBlob(Utilities.base64Decode(o.b64), o.mime || "audio/webm", id);
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          store = "drive:" + file.getId();
        } catch (upErr) { /* keep inline if upload fails */ }
      }
      sh.appendRow([id, o.email || "", o.track || "", o.lesson || "", o.type || "", o.anchor || "",
        typeof o.data === "string" ? o.data : JSON.stringify(o.data || ""), o.author || "aluno",
        new Date().toISOString(), store]);
      return json_({ result: "ok", id: id });
    }

    if (action === "del") {
      var target = String(o.id);
      var rows2 = rowsToObjs_(sh);
      var deleted = 0;
      // delete bottom-up so row numbers stay valid
      for (var k = rows2.length - 1; k >= 0; k--) {
        if (String(rows2[k].id) === target) { sh.deleteRow(rows2[k]._row); deleted++; }
      }
      return json_({ result: "deleted", count: deleted });
    }

    if (action === "wipe") {
      // teacher-only reset: removes every row whose email+lesson match params (no email = wipe all)
      var rows3 = rowsToObjs_(sh), removed = 0;
      for (var m = rows3.length - 1; m >= 0; m--) {
        var rr = rows3[m];
        var matchAll = !o.email;                       // no filters = wipe everything
        var matchScope = String(rr.email) === String(o.email) && String(rr.lesson) === String(o.lesson);
        if (matchAll || matchScope) { sh.deleteRow(rr._row); removed++; }
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
