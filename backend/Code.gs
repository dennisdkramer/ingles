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
 * Access control: approved students + pending signup requests live in sheet IAP_backpack!access
 * (email|name|track|status|ts). Approve/reject/queue verify the caller is a TEACHER; every access
 * action verifies the Google ID token server-side (tokeninfo) before trusting an email.
 * REMINDER: this file only runs after a NEW DEPLOYMENT VERSION (Deploy → Manage deployments).
 */

var SS_NAME = "IAP_backpack";
var TAB = "layer";
var HEADERS = ["id", "email", "track", "lesson", "type", "anchor", "data", "author", "ts", "b64"];
var UPLOAD_FOLDER = "IAP_uploads";
var ACCESS_TAB = "access";
var ACCESS_HEADERS = ["email", "name", "track", "status", "ts"];
var TEACHERS = ["dennisdkramer@gmail.com"];
var CLIENT_ID = "872457390510-jsk9pooj688ogvp6hs9ca4js3iqk5n69.apps.googleusercontent.com";

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

/* ---------- access-control storage (approved students + pending requests) ----------
   The allowed-student list and the request queue live in their own tab so they never mix
   with lesson-content rows in `layer`. Teachers stay in access.json on the client and are
   mirrored in TEACHERS here for server-side authorization of approve/reject/queue. */
function getAccessSheet_() {
  var ss = getSS_();
  var sh = ss.getSheetByName(ACCESS_TAB);
  if (!sh) sh = ss.insertSheet(ACCESS_TAB);
  var header = sh.getLastRow() >= 1
    ? sh.getRange(1, 1, 1, ACCESS_HEADERS.length).getValues()[0]
    : [];
  if (header.join("|") !== ACCESS_HEADERS.join("|")) {
    sh.clear();
    sh.appendRow(ACCESS_HEADERS);
  }
  return sh;
}
function accessRows_() {
  var sh = getAccessSheet_();
  var v = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < v.length; i++) {
    out.push({
      email: String(v[i][0] || ""),
      name: String(v[i][1] || ""),
      track: String(v[i][2] || ""),
      status: String(v[i][3] || ""),
      ts: String(v[i][4] || ""),
      _row: i + 1
    });
  }
  return out;
}
function accessRow_(email) {
  var rows = accessRows_();
  for (var i = 0; i < rows.length; i++) if (rows[i].email.toLowerCase() === String(email).toLowerCase()) return rows[i];
  return null;
}
function accessUpsert_(email, name, track, status) {
  var sh = getAccessSheet_();
  var rows = accessRows_();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].email.toLowerCase() === String(email).toLowerCase()) {
      sh.getRange(rows[i]._row, 1, 1, ACCESS_HEADERS.length).setValues([[String(email), String(name || ""), String(track || ""), String(status || "pending"), new Date().toISOString()]]);
      return;
    }
  }
  sh.appendRow([String(email), String(name || ""), String(track || ""), String(status || "pending"), new Date().toISOString()]);
}
/* verify a Google ID token server-side (tokeninfo) so an email is never trusted from the client. */
function verifyToken_(token) {
  if (!token) throw new Error("missing token");
  var resp = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token), { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) throw new Error("invalid token");
  var info = JSON.parse(resp.getContentText());
  if (String(info.aud) !== CLIENT_ID) throw new Error("token audience mismatch");
  if (!info.email) throw new Error("no email in token");
  if (!info.email_verified) throw new Error("unverified email");
  return info;
}
function isTeacher_(email) {
  for (var i = 0; i < TEACHERS.length; i++) if (TEACHERS[i].toLowerCase() === String(email).toLowerCase()) return true;
  return false;
}
/* last lesson a student tagged "complete" (type:"complete" rows in layer), for the teacher's jump button.
   Matching mirrors the layer GET that drives the lesson page's "Completed" tag: keyed by the student
   email (case-insensitive) + type "complete". The track is used only to disambiguate when BOTH the
   student's track and the row's track are present; a row whose track is empty still counts (the tag
   button itself keys on email+lesson+type and never requires a track match). */
function lastCompleted_(email, track) {
  var sh = getSheet_();
  var all = rowsToObjs_(sh);
  var max = 0;
  var em = String(email || "").toLowerCase();
  var tr = String(track || "").toLowerCase();
  for (var i = 0; i < all.length; i++) {
    var r = all[i];
    if (String(r.email || "").toLowerCase() !== em) continue;
    if (String(r.type) !== "complete") continue;
    var rt = String(r.track || "").toLowerCase();
    if (tr && rt && rt !== tr) continue;
    var n = parseInt(String(r.lesson), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max;
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

  if (action === "students") {
    var allAcc = accessRows_();
    var list = [];
    for (var i = 0; i < allAcc.length; i++) {
      if (allAcc[i].status !== "approved") continue;
      if (p.track && allAcc[i].track !== p.track) continue;
      list.push({ email: allAcc[i].email, name: allAcc[i].name, track: allAcc[i].track });
    }
    return json_({ students: list });
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

    /* ---- access-control actions (Google sign-in approval flow) ---- */
    if (action === "status") {
      var info = verifyToken_(o.token);
      var row = accessRow_(info.email);
      if (row && row.status === "approved") return json_({ status: "approved", email: info.email, name: row.name || info.name, track: row.track });
      if (row && row.status === "pending") return json_({ status: "pending", email: info.email, name: row.name || info.name });
      return json_({ status: "unknown", email: info.email });
    }

    if (action === "request") {
      var info2 = verifyToken_(o.token);
      var row2 = accessRow_(info2.email);
      if (row2 && row2.status === "approved") return json_({ status: "approved", email: info2.email, name: row2.name || info2.name, track: row2.track });
      if (row2 && row2.status === "pending") return json_({ status: "pending", email: info2.email, name: row2.name || info2.name });
      accessUpsert_(info2.email, info2.name || o.name || "", "", "pending");
      return json_({ status: "pending", email: info2.email, name: info2.name || o.name || "" });
    }

    if (action === "approve" || action === "reject") {
      var info3 = verifyToken_(o.token);
      if (!isTeacher_(info3.email)) return json_({ error: "not a teacher" });
      if (!o.email) return json_({ error: "missing email" });
      if (action === "approve") {
        var row3 = accessRow_(o.email);
        var track = o.track || "business";
        accessUpsert_(o.email, (row3 && row3.name) || o.name || o.email, track, "approved");
        return json_({ result: "ok", status: "approved", email: o.email, track: track });
      }
      var shAcc = getAccessSheet_();
      var rowsAcc = accessRows_();
      for (var r = rowsAcc.length - 1; r >= 0; r--) {
        if (rowsAcc[r].email.toLowerCase() === String(o.email).toLowerCase() && rowsAcc[r].status === "pending") {
          shAcc.deleteRow(rowsAcc[r]._row);
        }
      }
      return json_({ result: "ok", status: "rejected", email: o.email });
    }

    if (action === "remove") {
      var info5 = verifyToken_(o.token);
      if (!isTeacher_(info5.email)) return json_({ error: "not a teacher" });
      if (!o.email) return json_({ error: "missing email" });
      var shRem = getAccessSheet_();
      var rowsRem = accessRows_();
      for (var idx = rowsRem.length - 1; idx >= 0; idx--) {
        if (rowsRem[idx].email.toLowerCase() === String(o.email).toLowerCase()) {
          shRem.deleteRow(rowsRem[idx]._row);
        }
      }
      return json_({ result: "ok", status: "removed", email: o.email });
    }

    if (action === "queue") {
      var info4 = verifyToken_(o.token);
      if (!isTeacher_(info4.email)) return json_({ error: "not a teacher" });
      var rows4 = accessRows_();
      var pending = [], approved = [];
      for (var q = 0; q < rows4.length; q++) {
        if (rows4[q].status === "pending") pending.push({ email: rows4[q].email, name: rows4[q].name, ts: rows4[q].ts });
        else if (rows4[q].status === "approved") approved.push({ email: rows4[q].email, name: rows4[q].name, track: rows4[q].track, lastCompleted: lastCompleted_(rows4[q].email, rows4[q].track) });
      }
      return json_({ pending: pending, approved: approved });
    }

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
