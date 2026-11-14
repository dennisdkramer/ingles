/**
 * qa/audio.mjs — source → record the licence → cut → rewrite the header → measure → place.
 *
 * WHY THIS EXISTS. `[Constraints] 2` forbids a fetch at RUN TIME: the page must open with no network.
 * It says nothing about authoring time, and I had wrongly extended it to mean a build may not touch
 * audio at all. The three facts a build cannot invent are all machine-checkable, so they are checked
 * here instead of being left to a human with headphones:
 *
 *   - the licence  — the Commons API states it, and it is RECORDED, never judged: any audio is usable
 *                    (owner instruction — a block is a short teaching excerpt used as fair use);
 *   - the cut point — MPEG frame headers are self-describing, so the cut lands on a frame boundary;
 *   - the line times — decoded RMS windows give the silences, and the number of sung segments must
 *                      equal the number of lyric lines. That last check exists because a mismatch
 *                      once shipped a stanza whose last two lines were not the words being sung.
 *
 * A build therefore runs this, pastes what it prints, and has done all of it. Run:
 *
 *   node qa/audio.mjs --file="File:Some_Song.ogg" --out=some-song --lyrics="line one|line two|…"
 *   node qa/audio.mjs --file="File:X.ogg" --out=x --lyrics="…|…" --times=13.0,20.1
 *        (times taken verbatim from the file's own timed transcript — TimedText/`.srt` — for a
 *         recording whose pauses cannot be segmented; each is still proved to land on sound)
 *   node qa/audio.mjs --url=https://…/x.mp3 --out=x --seconds=24
 *   node qa/audio.mjs --in=C:/music/song.mp3 --out=x --lrc="artist title"    (audition the records)
 *   node qa/audio.mjs --in=C:/music/song.mp3 --out=x --lrc-id=9567200 --lines=17,4
 *        (the words AND the times come from that record's own LRC; the clip opens --lead=2 s before
 *         line 17; the record's duration must agree with the decoded file within 2 s)
 *   node qa/audio.mjs --search="artist title" --out=x --lines=17,4
 *        (no audio on hand: the site is searched, the audio is downloaded and converted to mp3, and
 *         it is paired with the LRCLIB record whose duration agrees within 2 s — the whole chain,
 *         unattended. Without --out it prints the pairing and writes nothing)
 *   node qa/audio.mjs --in=C:/music/song.mp3 --lrc-id=3209411 --finds="i came in like a wrecking ball" --count=4
 *        (the line found by its WORDS instead of its index; every line number carrying them is printed,
 *         the first is taken, `--line=<n>` overrides, and absent words refuse the run)
 *        Flags: --early=<s> places every sheet line that far before its cue and accepts a NEGATIVE value
 *        (--early=-2 = two seconds later, for a sheet that runs early against its own upload);
 *        --tail=<s> (default 2) ends the clip past the next cue instead of on it
 *        --cue-shift=<s> moves every data-t by that many seconds and touches no audio (the clip is
 *        right and only the highlight is off; -1 = every line fires a second earlier)
 *
 * The cut is made at the silence after the last lyric line, so the audio carries exactly the lines
 * the block shows. The frames are copied out of the master, so no second encode is paid — unless a
 * fade is asked for: a fade changes amplitude, which a copied MPEG frame cannot express, so a faded
 * clip is re-encoded once through the ffmpeg npm installs (`--fade=0` keeps the pure frame copy).
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TMP = path.join(os.tmpdir(), 'qa-audio');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const arg = (k, d) => {
  const a = process.argv.find(s => s.startsWith('--' + k + '='));
  return a ? a.slice(k.length + 3) : d;
};
const die = m => { console.error('audio: ' + m); process.exit(1); };

/* the analysis page's path, declared here rather than beside the page itself: the `--measure` debug
   run below happens before any of the sourcing flow, and a `let` reached from there would throw. */
let ANALYSIS = 'qa/_audio-analysis.tmp.html';

/* A FAILED RUN MUST NOT LEAVE A 3 MB COPY IN assets/. die() exits, so a try/finally around the work
   is not enough — this is an exit hook, and every temp path is registered as it is created. */
const TEMPS = [];
const rmTemp = () => { for (const rel of TEMPS) { try { fs.unlinkSync(path.join(ROOT, rel)); } catch (e) { /* gone */ } } };
process.on('exit', rmTemp);
const tempPath = (name) => {
  const rel = 'assets/_audio-src-' + name + '-' + Date.now() + '.mp3';
  TEMPS.push(rel);
  return rel;
};

/* a debug entry point: measure one file already in the repo and print what the decoder saw, then
   stop. It exists so the silence and dip readings can be checked against a file whose true line
   onsets are known before either is trusted to write a `data-t`. The block itself sits after the
   analysis page is declared — `ANALYSIS` is a `let`, and calling `measure` above it throws. */
const measureOnly = arg('measure');
if (measureOnly) {
  const m = await measure(measureOnly);
  console.log(JSON.stringify(m, null, 1));
  process.exit(0);
}

/* ---- -1. THE AUDIO AND THE SHEET, FOUND BY NAME (--search) ---------------------------------
   A lesson that decides music is the right vehicle should not need a human to pick a recording.
   `--search="artist title"` does the three lookups a person would do: ask LRCLIB for synced records,
   ask the site for candidate audio WITH their durations, and pair them — a record and a video only
   match when their lengths agree within 2 s, the same tolerance /api/get itself uses and the only
   cheap evidence that this sheet times this audio. The paired audio is downloaded and converted to
   mp3 by the ffmpeg npm installed, and the rest of the run is the existing one. Nothing is cut
   without `--out`: without it the pairing is printed and the run stops. */
const search = arg('search', '');
let searchedFile = null, searchedRecordId = '', searchedUrl = '';
if (search) {
  if (arg('in') || arg('url') || arg('file')) die('--search fetches the audio itself — drop --in / --url / --file');
  if (arg('lrc') || arg('lrc-file')) die('--search finds the sheet too — drop --lrc / --lrc-file');
  /* `--lrc-id` PINS THE PAIRING. The site's search results move between calls, and two records of
     the same song can each sit 0.0 s from some upload, so an unpinned run can pair a different edit
     on the next invocation and cut different audio under the same name. Pass the id the audition
     printed and the same record — and therefore the same video — is chosen every time. */
  const pinId = arg('lrc-id', '');
  const H = { 'User-Agent': 'ingles-site/1.0 (teaching material)' };
  const json = async (u) => {
    let r = null;
    for (let i = 0; i < 2 && !r; i++) {
      try { r = await fetch(u, { headers: H, signal: AbortSignal.timeout(12000) }); }
      catch (e) { if (i === 0) await sleep(800); }
    }
    if (!r || !r.ok) return [];
    return r.json();
  };
  const found = await json('https://lrclib.net/api/search?q=' + encodeURIComponent(search));
  let records = (found || []).filter(x => x.syncedLyrics && Number(x.duration) > 0)
    .map(x => ({ id: x.id, artist: x.artistName, track: x.trackName, dur: Number(x.duration) }));
  if (pinId) {
    const only = records.filter(r => String(r.id) === String(pinId));
    if (only.length) records = only;
    else {
      const one = await json('https://lrclib.net/api/get/' + encodeURIComponent(pinId));
      if (!one || !one.syncedLyrics) die('LRCLIB record ' + pinId + ' is not a synced record');
      records = [{ id: one.id, artist: one.artistName, track: one.trackName, dur: Number(one.duration) }];
    }
    console.log('LRCLIB: pinned to record ' + pinId + ' · ' + records[0].track + ' (' + records[0].dur.toFixed(2) + ' s)');
  }
  if (!records.length) die('LRCLIB has no synced record for "' + search + '" — nothing to time against');
  console.log('LRCLIB: ' + records.length + ' synced records for "' + search + '"');

  let ytDlp, ffmpegPath;
  try {
    ytDlp = (await import('youtube-dl-exec')).default;
    ffmpegPath = (await import('ffmpeg-static')).default;
  } catch (e) {
    die('the downloader is not installed (' + e.message + ') — run: npm install');
  }

  let table = '';
  try {
    table = await ytDlp('ytsearch8:' + search, {
      flatPlaylist: true, skipDownload: true, noWarnings: true, noUpdate: true,
      socketTimeout: 20, print: '%(id)s\t%(duration)s\t%(title)s',
    });
  } catch (e) {
    const why = String((e && (e.stderr || e.message)) || e).split('\n').filter(Boolean).slice(-2).join(' ');
    die('the search failed: ' + why);
  }
  const vids = String(table || '').split('\n').map(l => l.split('\t'))
    .filter(c => c.length >= 3 && c[0] && c[0] !== 'NA')
    .map(c => ({ id: c[0], dur: Number(c[1]), title: c[2] }));
  if (!vids.length) die('the search returned no video with a duration');
  console.log('  site: ' + vids.length + ' candidates');

  const pairs = [];
  for (const v of vids) {
    if (!Number.isFinite(v.dur)) continue;
    for (const r of records) {
      const d = Math.abs(v.dur - r.dur);
      if (d <= 2) pairs.push({ v, r, d });
    }
  }
  pairs.sort((a, b) => a.d - b.d);
  if (!pairs.length) {
    console.log('  records: ' + records.slice(0, 4).map(r => r.artist + ' ' + r.dur.toFixed(0) + ' s').join(' · '));
    console.log('  videos:  ' + vids.slice(0, 4).map(v => v.dur + ' s').join(' · '));
    die('no audio candidate matches a synced record within 2 s');
  }
  const best = pairs[0];
  console.log('  pair: "' + best.v.title + '" (' + best.v.dur + ' s) ↔ LRCLIB ' + best.r.id + ' · ' +
    best.r.artist + ' (' + best.r.dur.toFixed(2) + ' s) · ' + best.d.toFixed(1) + ' s apart');

  const dest = path.join(TMP, 'search-' + Date.now() + '.mp3');
  fs.mkdirSync(TMP, { recursive: true });
  try {
    await ytDlp('https://www.youtube.com/watch?v=' + best.v.id, {
      extractAudio: true, audioFormat: 'mp3', audioQuality: '0', noPlaylist: true,
      ffmpegLocation: ffmpegPath, output: dest, noWarnings: true, noUpdate: true,
    });
  } catch (e) {
    const why = String((e && (e.stderr || e.message)) || e).split('\n').filter(Boolean).slice(-3).join(' ');
    die('the download failed: ' + why);
  }
  if (!fs.existsSync(dest)) die('the download wrote no file at ' + dest);
  searchedFile = dest;
  searchedRecordId = String(best.r.id);
  searchedUrl = 'https://www.youtube.com/watch?v=' + best.v.id;
  console.log('  downloaded: ' + (fs.statSync(dest).size / 1048576).toFixed(1) + ' MB -> ' + dest);
  if (!arg('out')) {
    console.log('nothing cut — add --out=<name> --lines=<first>,<count> to build the block');
    process.exit(0);
  }
}

/* ---- 0. THE TIMES, FROM AN OUTSIDE TIMED LYRIC SHEET (LRCLIB) ------------------------------
   A line's time belongs to ONE MASTER: an LRC is written by someone listening to a particular
   release, so it times that release and no other. Given that master's file (--in), the record is
   fetched by id, a run of consecutive lines is taken out of it, and the timing problem becomes a
   lookup — no segmentation, no dip test, no guessing which silence is a line break:
     node qa/audio.mjs --in=song.mp3 --out=x --lrc-id=9567200 --lines=17,4
   The words and the `data-t`s both come from the record, the clip opens --lead=2 s before the first
   line so the student hears it arrive, and the record's own duration must agree with the decoded
   file within 2 s — the tolerance /api/get itself matches on, and the one check that catches a wrong
   master (another mix or edit) before a student sees a highlight on the wrong words.
   `--lrc="<query>"` without --lrc-id only auditions the records and writes nothing, like --scan. */
const lead = Math.max(0, Number(arg('lead', '2')) || 0);
/* EVERY SHEET TIME LANDS A SPLIT SECOND LATE. An LRC or a subtitle is tapped while listening, so its
   cue sits on the stressed vowel rather than on the consonant that opens the line. Each cue is
   therefore moved `--early` seconds back (default 1) together with the clip's head, so the first
   highlight always opens `--lead` seconds in and every `data-t` is unchanged by the shift.
   NEGATIVE VALUES ARE THE OTHER DIRECTION, and they are a legitimate fix: a sheet can be early
   against its own upload — an older, live or re-issued recording whose intro runs longer than the
   master the sheet was written on — and then `--early=-2` places every line two seconds later. The
   clamp is ±10 s, past which the sheet and the audio are different works, not a mis-timed one. */
const earlyRaw = arg('early', '1');
if (!Number.isFinite(Number(earlyRaw))) die('--early must be a number of seconds, e.g. --early=-2');
const early = Math.max(-10, Math.min(10, Number(earlyRaw)));
/* A FADE IS OPTIONAL AND ON BY DEFAULT. 0 disables it and keeps the frame copy. */
const fade = Math.max(0, Number(arg('fade', '0.5')) || 0);
/* THE CLIP ENDS `--tail` SECONDS PAST THE NEXT LINE'S CUE, NOT ON IT. The end is the one place a
   mis-timed sheet is audible as a missing word, and the last line shown is the one the block is
   teaching; two seconds of the next line costs nothing and means a sync error of a second still
   leaves the last line whole inside the clip. */
const tail = Math.max(0, Number(arg('tail', '2')) || 0);
/* A CUE SHIFT MOVES ONLY THE `data-t`s. Some reports are about the placement and not about the sound:
   the clip is right and every highlight fires a second early. `--early` cannot fix that on its own,
   because it moves the clip's head by the same second. `--cue-shift=-1` subtracts a second from every
   `data-t` and leaves the audio byte-identical, so one command still reproduces the page. */
const cueShift = Number(arg('cue-shift', '0')) || 0;
let lrcSel = null;
const lrcQuery = arg('lrc', '');
const lrcId = arg('lrc-id', '') || searchedRecordId;
const lrcFile = arg('lrc-file', '');

function parseLrc(text) {
  const rows = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const tags = raw.match(/\[(\d+):(\d+(?:[.:]\d+)?)\]/g) || [];
    /* the words are what survives once the tags are cut out; a cue with no words under it is an
       instrumental gap and is dropped, so `--lines` counts the lines a reader counts */
    const words = raw.replace(/\[[^\]]*\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!words) continue;
    for (const tag of tags) {
      const m = /\[(\d+):(\d+(?:[.:]\d+)?)\]/.exec(tag);
      if (!m) continue;
      const t = Number(m[1]) * 60 + Number(String(m[2]).replace(':', '.'));
      if (Number.isFinite(t)) rows.push({ t: Math.round(t * 1000) / 1000, text: words });
    }
  }
  return rows.sort((a, b) => a.t - b.t);
}

if (lrcQuery || lrcId || lrcFile) {
  const H = { 'User-Agent': 'ingles-site/1.0 (teaching material)' };
  const getJson = async (u) => {
    /* a lookup tool must not hang: LRCLIB is fast usually and slow or silent occasionally, so every
       request carries a deadline and one retry */
    let r = null, err = null;
    for (let i = 0; i < 2 && !r; i++) {
      try {
        r = await fetch(u, { headers: H, signal: AbortSignal.timeout(12000) });
      } catch (e) {
        err = e;
        if (i === 0) await sleep(800);
      }
    }
    if (!r) die('LRCLIB did not answer (' + (err && err.name || 'no response') + ') — try again in a moment');
    if (r.status === 429 || r.status === 503) {
      die('LRCLIB answered ' + r.status + ' — honour Retry-After (' +
        (r.headers.get('retry-after') || '?') + ' s) and run again');
    }
    if (!r.ok) return null;
    return r.json();
  };
  let rec = null, rows = null, dur = Number(arg('lrc-duration', '')) || null, where = '';
  if (lrcFile) {
    /* AN LRC ALREADY SAVED. The same sheet read off the disk: LRCLIB is the usual source, not the
       only one, and this keeps the route working when the host is slow, down, or the sheet was
       written by someone else. `--lrc-duration` states the length of the master it times, which is
       what the guard below needs when there is no record to read it from. */
    const p = path.resolve(ROOT, lrcFile);
    if (!fs.existsSync(p)) die('no such LRC file: ' + p);
    rows = parseLrc(fs.readFileSync(p, 'utf8'));
    where = 'LRC file ' + lrcFile;
  } else if (lrcId) {
    rec = await getJson('https://lrclib.net/api/get/' + encodeURIComponent(lrcId));
    if (!rec) die('no LRCLIB record with id ' + lrcId);
    if (!rec.syncedLyrics) die('LRCLIB record ' + lrcId + ' carries no synced lyrics — pick another record');
    rows = parseLrc(rec.syncedLyrics);
    dur = rec.duration;
    where = 'LRCLIB ' + rec.id + ': ' + rec.artistName + ' — ' + rec.trackName;
  } else {
    const list = (await getJson('https://lrclib.net/api/search?q=' + encodeURIComponent(lrcQuery))) || [];
    console.log('LRCLIB "' + lrcQuery + '": ' + list.length + ' records');
    for (const x of list) {
      const n = parseLrc(x.syncedLyrics).length;
      console.log('  id ' + x.id + ' · ' + x.artistName + ' · ' + x.albumName + ' · ' +
        (x.duration == null ? 'no duration' : x.duration.toFixed(1) + ' s') + ' · ' +
        (n ? n + ' timed lines' : 'NO synced lyrics') + (x.hasWordSync ? ' · word timings' : ''));
    }
    console.log('nothing written — re-run with --lrc-id=<id> from that list');
    process.exit(0);
  }
  if (!rows || !rows.length) die('that sheet holds no timed lines');
  /* A LINE FOUND BY ITS WORDS, NOT BY ITS INDEX. The builder has the words, not the number, and the
     number is a fact about one sheet that it cannot know. Both sides are normalised (case, apostrophes,
     punctuation, runs of space); every line whose text contains the words is printed, because a chorus
     repeats and more than one hit is normal rather than an error; the first is taken unless `--line=<n>`
     names another. It refuses only when the words are absent — the one case where the words and the
     sheet really disagree. */
  let foundFirst = 0;
  const finds = arg('finds', '');
  if (finds) {
    if (arg('lines', '')) die('--finds finds the first line itself — drop --lines (--count=<n> sets how many)');
    const norm = s => String(s).toLowerCase().replace(/[\u2019]/g, "'")
      .replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
    const q = norm(finds);
    if (!q) die('--finds needs the words of a line');
    const hits = rows.map((r, i) => (norm(r.text).includes(q) ? i + 1 : 0)).filter(Boolean);
    if (!hits.length) {
      die('no line in that sheet carries "' + finds + '" — the words and the sheet disagree. ' +
        'A song whose words only paraphrase the target is not a candidate');
    }
    const want = Math.floor(Number(arg('line', String(hits[0]))));
    if (!hits.includes(want)) {
      die('--line=' + want + ' does not carry those words — they are at line ' + hits.join(', '));
    }
    foundFirst = want;
    console.log('  --finds: "' + finds + '" is at line ' + hits.join(', ') + ' of ' + rows.length +
      ' timed lines' + (hits.length > 1 ? ' — a repeat, the first is taken' : ''));
  }
  const sel = String(arg('lines', '')).split(',').filter(s => s.trim() !== '').map(Number);
  const countArg = Math.floor(Number(arg('count', '0')) || 0);
  const first = foundFirst || (sel.length ? Math.max(1, Math.floor(sel[0])) : 1);
  const count = foundFirst ? (countArg > 0 ? countArg : 4)
    : (sel.length > 1 ? Math.max(1, Math.floor(sel[1])) : rows.length - first + 1);
  if (first > rows.length) die('--lines=' + first + ' is past the end of that record (' + rows.length + ' timed lines)');
  const take = rows.slice(first - 1, first - 1 + count);
  if (arg('lyrics', '')) die('--lrc-id brings the words too — drop --lyrics');
  if (arg('times', '')) die('--lrc-id brings the times too — drop --times');
  if (arg('from', '')) die('--lrc-id sets the start (' + lead + ' s before line ' + first + ') — drop --from or raise --lead');
  lrcSel = {
    record: rec, first, where, dur, total: rows.length,
    lines: take.map(r => r.text),
    times: take.map(r => r.t),
    next: rows[first - 1 + take.length] ? rows[first - 1 + take.length].t : null,
  };
  console.log(where + ' (' + (dur == null ? 'NO duration to check' : dur.toFixed(2) + ' s') + ')');
  console.log('  lines ' + first + '–' + (first + take.length - 1) + ' of ' + rows.length + ' (' +
    (lrcSel.next == null ? 'none after them' : 'line ' + (first + take.length) + ' at ' + lrcSel.next.toFixed(2) + ' s') +
    '): ' + take.map((r, i) => (first + i) + ' @ ' + r.t.toFixed(2)).join(' · '));
}

const outName = arg('out') || die('--out=<name> is required (it becomes assets/<name>.mp3)');
if (arg('finds', '') && !lrcSel) die('--finds needs a timed sheet: add --lrc-id= / --lrc-file= / --search=');
const lyrics = lrcSel ? lrcSel.lines.slice()
  : (arg('lyrics', '') || '').split('|').map(s => s.trim()).filter(Boolean);
const wantSeconds = Number(arg('seconds', '0'));
const pageUrl = arg('file');
const directUrl = arg('url');
const localIn = arg('in') || searchedFile;
if (!pageUrl && !directUrl && !localIn) die('give --file="File:…" (Commons), --url=<mp3> or --in=<path to an mp3>');

/* ---- 1. the source, and its licence ------------------------------------------------------- */
let src = directUrl, credit = null, licence = null, sourcePage = null, title = null;

if (localIn) {
  /* ANY FILE THE OWNER HAS. A master is often on no public host — a purchase, a rip, a recording a
     lesson already uses. --in takes the path; the licence and the credit are recorded as given
     because nothing is fetched, so there is nothing to read them from. No licence is refused. */
  src = path.resolve(ROOT, localIn);
  licence = arg('licence') || 'not stated';
  credit = arg('credit') || ((lrcSel && lrcSel.record) ? lrcSel.record.artistName : 'unknown');
  title = (lrcSel && lrcSel.record) ? lrcSel.record.trackName : null;
  sourcePage = searchedUrl || localIn;
  console.log('source: ' + src + '\n  licence: ' + licence + ' (as given) · credit: ' + credit);
} else if (pageUrl) {
  const api = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=videoinfo'
    + '&viprop=url|derivatives|extmetadata&titles=' + encodeURIComponent(pageUrl);
  const r = await fetch(api, { headers: { 'User-Agent': 'ingles-site/1.0 (teaching material)' } });
  if (!r.ok) die('Commons API answered ' + r.status);
  const j = await r.json();
  const pages = j.query && j.query.pages ? Object.values(j.query.pages) : [];
  const p = pages[0];
  if (!p || !p.videoinfo || !p.videoinfo[0]) die('no such file on Commons: ' + pageUrl);
  const vi = p.videoinfo[0];

  const meta = vi.extmetadata || {};
  const short = (meta.LicenseShortName && meta.LicenseShortName.value) || '';
  const artist = ((meta.Artist && meta.Artist.value) || '').replace(/<[^>]*>/g, '').trim();
  title = p.title;
  sourcePage = vi.descriptionurl;
  credit = arg('credit', '') || artist || 'unknown';
  licence = short || 'not stated on Commons';

  /* NO LICENCE GATE (owner instruction). Every recording is usable: a block plays a few lines of a
     teaching excerpt, which the owner uses as fair use, so the licence is RECORDED and never judged.
     The block prints no credit line — its italic <h4> names the performer and nothing else — so the
     provenance row this tool prints is the record of who made the file and under what licence. */

  /* THE VOICE GATE. A tool that measures phrase boundaries cannot tell singing from a guitar — an
     instrumental of "Salley Gardens" cut perfectly into eight whistle phrases and every check passed.
     The description is the only cheap evidence, so it is read before a byte of audio moves: a voice
     word passes (and covers "voice with guitar accompaniment"); instrument words with no voice word
     refuse; nothing either way is a loud warning, because silence here is how that demo got made. */
  const desc = ((meta.ImageDescription && meta.ImageDescription.value) || '')
    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const cats = (p.categories || []).map(c => c.title).join(' ');
  /* THE TITLE IS EVIDENCE AND WAS BEING IGNORED. A file called `"Lowlands" sung by the USNA's
     Midshipmen Glee Club` was refused because its description said only "by the USNA Band" — the one
     sentence that states the singing is the filename. `glee` and `chorus` join the voice words for the
     same reason: a glee club is a choir with a different name, and the instrument list calls it a club. */
  const hay = desc + ' ' + cats + ' ' + title;
  const VOICE = /\b(vocal|vocals|vocalist|sing|sings|sung|singer|singing|voice|a\s?cappella|choir|choral|chorus|glee|tenor|soprano|baritone|mezzo|alto|contralto|hymn|chant|chanters?)\b/i;
  /* `quartet`, `trio` and `ensemble` are NOT instrument words. A quartet may be four singers — the
     Knickerbocker Quartet was refused for being one, on a file that ships its own transcript. They
     count as instruments only when an instrument names them ("string quartet", "jazz trio"). */
  const INSTRUMENT = /\b(instrumental|whistle|fiddle|violin|piano|guitar|harp|flute|orchestra|band|karaoke|backing)\b|\b(string|brass|wind|sax|jazz|piano)\s+(quartet|trio|ensemble)\b/i;
  const hasTranscript = !!arg('times', '') || !!lrcSel;
  if (VOICE.test(hay)) {
    console.log('  voice: found in the description — "' + desc.slice(0, 110) + '"');
  } else if (INSTRUMENT.test(hay) && !arg('allow-instrumental', '')) {
    if (hasTranscript) {
      console.log('  voice: the description reads instrumental ("' + desc.slice(0, 90) + '"), but this file');
      console.log('         ships a timed transcript — someone wrote those words down while listening to it,');
      console.log('         which is stronger evidence than a description line. Not refusing.');
    } else {
      die('NO VOICE: the description says instrumental — "' + desc.slice(0, 140) +
        '". This block lights lyric lines against singing, so an instrumental has nothing to light. ' +
        'Pass --allow-instrumental only if the block will carry no lyrics at all, or --times= if this ' +
        'file ships its own timed transcript.');
    }
  } else {
    console.log('  voice: CANNOT TELL from the description — listen to it before shipping; the word ' +
      '"vocal" appears nowhere in "' + desc.slice(0, 90) + '"');
  }

  const derivs = (vi.derivatives || []).filter(d => /audio\/mpeg/.test(d.type || ''));
  src = derivs.length ? derivs[derivs.length - 1].src : vi.url;
  console.log('source: ' + title + '\n  licence: ' + short + ' · credit: ' + credit + '\n  audio: ' + src);
} else {
  /* a direct URL carries no licence metadata, so the caller states what it knows and it is recorded
     verbatim; neither field is required, because no licence is refused */
  licence = arg('licence') || 'not stated';
  credit = arg('credit') || 'unknown';
  console.log('source: ' + src + '\n  licence: ' + licence + ' (as given) · credit: ' + credit);
}

fs.mkdirSync(TMP, { recursive: true });
const origPath = path.join(TMP, outName + '-original.mp3');
{
  const buf = localIn
    ? (fs.existsSync(src) ? fs.readFileSync(src) : die('no such file: ' + src))
    : await (async () => {
        const r = await fetch(src, { headers: { 'User-Agent': 'ingles-site/1.0 (teaching material)' } });
        if (!r.ok) die('download failed: ' + r.status);
        return Buffer.from(await r.arrayBuffer());
      })();
  fs.writeFileSync(origPath, buf);
  console.log('  ' + (localIn ? 'read' : 'downloaded') + ': ' + buf.length + ' bytes -> ' + origPath);
}

/* ---- 2. the frames: parse, cut, and rewrite the VBR header -------------------------------- */
const BR = {
  '1-3': [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  '2-3': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const SR = { 1: [44100, 48000, 32000], 2: [22050, 24000, 16000], 25: [11025, 12000, 8000] };

function parseFrames(b) {
  let start = 0;
  if (b.toString('latin1', 0, 3) === 'ID3') {
    const size = ((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) | ((b[8] & 0x7f) << 7) | (b[9] & 0x7f);
    start = 10 + size + (b[5] & 0x10 ? 10 : 0);
  }
  const frames = [];
  let pos = start, t = 0, meta = null, sr = 44100, samples = 1152;
  while (pos + 4 <= b.length) {
    if (b[pos] !== 0xff || (b[pos + 1] & 0xe0) !== 0xe0) { pos++; continue; }
    const verBits = (b[pos + 1] >> 3) & 3, layerBits = (b[pos + 1] >> 1) & 3;
    const brIdx = (b[pos + 2] >> 4) & 15, srIdx = (b[pos + 2] >> 2) & 3, pad = (b[pos + 2] >> 1) & 1;
    if (verBits === 1 || layerBits !== 1 || brIdx === 0 || brIdx === 15 || srIdx === 3) { pos++; continue; }
    const ver = verBits === 3 ? 1 : (verBits === 2 ? 2 : 25);
    const br = BR[(ver === 1 ? '1' : '2') + '-3'][brIdx] * 1000;
    sr = SR[ver][srIdx];
    samples = ver === 1 ? 1152 : 576;
    const len = Math.floor((samples / 8) * br / sr) + pad;
    if (len < 24 || pos + len > b.length) { pos++; continue; }
    const frame = b.subarray(pos, pos + len);
    const where = frame.toString('latin1', 4, 44);
    const tag = ['Xing', 'Info', 'VBRI'].find(s => where.indexOf(s) >= 0);
    if (tag && !meta) {
      /* frame-relative index — `where` starts at frame byte 4, and getting this wrong by 4 shifts
         every field, which makes the element ignore the header it was handed */
      meta = { frame, at: frame.indexOf(tag), tag };
      pos += len;
      continue;
    }
    frames.push({ buf: frame, t, dur: samples / sr });
    t += samples / sr;
    pos += len;
  }
  return { id3: b.subarray(0, start), frames, meta, sr };
}

/** cut at a given time and write a file whose Xing frame describes the CUT, not the original.
    `fromT` drops everything before that point too — a 1910 cylinder opens with a spoken announcement and
    an orchestra, and a lyric sheet that spends a third of its length before the first line invites the
    reader to conclude the words and the audio disagree. The kept frames are contiguous, so the cut is
    still a byte range of the original and nothing is re-encoded. */
function cutTo(srcBuf, wantT, destPath, fromT) {
  const { id3, frames, meta } = parseFrames(srcBuf);
  const from = Math.max(0, fromT || 0);
  const kept = frames.filter(f => f.t + f.dur > from && f.t + f.dur <= wantT);
  const dur = kept.reduce((a, f) => a + f.dur, 0);
  const audioBytes = kept.reduce((a, f) => a + f.buf.length, 0);
  const chunks = [id3];
  if (meta) {
    const m = Buffer.from(meta.frame);
    const base = meta.at + 4;
    const flags = m.readUInt32BE(base);
    const total = audioBytes + m.length;
    m.writeUInt32BE(kept.length, base + 4);
    m.writeUInt32BE(total, base + 8);
    if (flags & 0x2) {
      /* the seek table is addressed in time WITHIN THE CUT, so it is built from relative offsets —
         keeping the original times here makes every seek land `from` seconds late */
      let acc = 0;
      const rel = kept.map(f => { const v = acc; acc += f.dur; return v; });
      const cum = kept.map(f => { const v = acc; acc += f.buf.length; return v; });
      for (let i = 0; i < 100; i++) {
        const target = dur * i / 100;
        let k = rel.findIndex(t => t >= target);
        if (k < 0) k = kept.length - 1;
        m[base + 12 + i] = Math.max(0, Math.min(255, Math.round(255 * (cum[k] + m.length) / total)));
      }
    }
    chunks.push(m);
  }
  for (const f of kept) chunks.push(f.buf);
  const out = Buffer.concat(chunks);
  fs.writeFileSync(destPath, out);
  return { bytes: out.length, duration: dur, frames: kept.length, totalFrames: frames.length,
    start: kept.length ? kept[0].t : from,
    header: meta ? meta.tag + ' rewritten' : 'no VBR header present' };
}



/* ---- 3. the silences: decoded RMS in headless Chrome -------------------------------------- */
/* the analysis page: named for its own run, so two runs at once cannot overwrite each other.
   A function rather than a const, because `measure()` is called by the `--measure` run above this
   line and a `const` would still be in its temporal dead zone; a declaration is hoisted. */
function analysisHtml() { return `<!doctype html><meta charset="utf-8"><pre id="out">pending</pre><script>
(async () => {
  try {
    const p = new URLSearchParams(location.search);
    const buf = await (await fetch(p.get('f'))).arrayBuffer();
    const ctx = new OfflineAudioContext(1, 1, 44100);
    const a = await ctx.decodeAudioData(buf);
    const ch = a.getChannelData(0), sr = a.sampleRate, win = Math.round(sr * 0.02);
    let peak = 0;
    const rms = [];
    for (let i = 0; i < ch.length; i += win) {
      let s = 0;
      for (let j = i; j < Math.min(i + win, ch.length); j++) s += ch[j] * ch[j];
      const v = Math.sqrt(s / win); rms.push(v); if (v > peak) peak = v;
    }
    const q = Math.max(peak * 0.02, 0.002);
    const gaps = []; let run = null;
    rms.forEach((v, i) => {
      const t = i * 0.02;
      if (v < q) { if (!run) run = [t, t + 0.02]; else run[1] = t + 0.02; }
      else if (run) { if (run[1] - run[0] >= 0.24) gaps.push(run); run = null; }
    });
    if (run && run[1] - run[0] >= 0.24) gaps.push(run);
    /* energy either side of a moment: a line that starts at t must have sound after it and a dip
       before it, which is the only evidence this side of listening that the words sit on singing */
    const energy = (from, to) => {
      const i0 = Math.max(0, Math.floor(from / 0.02)), i1 = Math.min(rms.length, Math.ceil(to / 0.02));
      let s = 0, n = 0;
      for (let i = i0; i < i1; i++) { s += rms[i] * rms[i]; n++; }
      return n ? +Math.sqrt(s / n).toFixed(5) : 0;
    };
    const times = String(p.get('t') || '').split(',').filter(Boolean).map(Number);
    const probes = times.map(t => ({ t: t, before: energy(t - 0.35, t - 0.1), after: energy(t + 0.1, t + 0.6) }));
    /* DIPS, NOT SILENCES. A choir holds a note through the line break, so the gap between lines
       never reaches the silence floor and a silence-only reading sees one long phrase. What is
       always there is a valley: a stretch where the energy falls well below the median of the
       second around it. A line starts where the energy climbs back out of a valley. */
    const S = 15;                                   /* 0.3 s of smoothing, mono 20 ms windows */
    const env = rms.map((_, i) => {
      let s = 0, n = 0;
      for (let j = Math.max(0, i - S); j < Math.min(rms.length, i + S + 1); j++) { s += rms[j]; n++; }
      return s / n;
    });
    const valleys = [];
    for (let i = 2; i < env.length - 2; i++) {
      if (!(env[i] <= env[i - 1] && env[i] <= env[i + 1])) continue;
      const around = [];
      for (let j = Math.max(0, i - 100); j < Math.min(env.length, i + 100); j++) around.push(env[j]);
      around.sort((x, y) => x - y);
      const med = around[Math.floor(around.length / 2)] || 0;
      if (med > 0 && env[i] > med * 0.65) continue;              /* not a valley, just a wobble */
      if (valleys.length && (i - valleys[valleys.length - 1]) * 0.02 < 1.2) continue;
      valleys.push(i);
    }
    const onsets = valleys.map(v => {
      let peak = v;
      for (let j = v; j < Math.min(env.length, v + 75); j++) if (env[j] > env[peak]) peak = j;
      const thr = env[v] + 0.45 * (env[peak] - env[v]);
      let k = v;
      while (k < peak && env[k] < thr) k++;
      return +(k * 0.02).toFixed(2);
    });
    /* SINGING OR SPEECH — the dip test cannot tell them apart, which is how a spoken intro shipped.
       Singing holds vowels: a frame has a strong periodic peak at one lag and keeps that lag. Speech
       glides and is full of unvoiced consonants. Measured over the TWELVE SECONDS THAT SHIP — the
       window is offset by the --from value, because a cylinder opens with a spoken announcement and a
       gate that reads 0–12 s would grade the announcer and refuse the singer. Fractions, so a quiet
       recording cannot flatter itself. */
    const winFrom = Math.max(0, Number(p.get('from') || 0));
    const fromI = Math.round(sr * winFrom);
    const LIMIT = Math.min(ch.length, Math.round(sr * (winFrom + 12)));
    const fl = 1024, hop = Math.round(sr * 0.02);
    const minLag = Math.round(sr / 400), maxLag = Math.round(sr / 70);
    let loud = 0, voiced = 0;
    const f0 = [];
    for (let i = fromI; i + fl + maxLag < LIMIT; i += hop) {
      let e = 0;
      for (let j = 0; j < fl; j++) e += ch[i + j] * ch[i + j];
      if (Math.sqrt(e / fl) < peak * 0.02) continue;
      loud++;
      let br = 0, bl = 0;
      for (let lag = minLag; lag <= maxLag; lag++) {
        let s = 0, e1 = 0, e2 = 0;
        for (let j = 0; j < fl; j++) {
          const x = ch[i + j], y = ch[i + j + lag];
          s += x * y; e1 += x * x; e2 += y * y;
        }
        const r = s / Math.sqrt(e1 * e2 + 1e-9);
        if (r > br) { br = r; bl = lag; }
      }
      if (br > 0.5) { voiced++; f0.push(sr / bl); }
    }
    let runHold = 0, hold = 0;
    for (let k = 1; k < f0.length; k++) {
      runHold = Math.abs(f0[k] - f0[k - 1]) / f0[k - 1] < 0.03 ? runHold + 1 : 0;
      if (runHold > hold) hold = runHold;
    }
    document.getElementById('out').textContent =
      JSON.stringify({ duration: +a.duration.toFixed(3), gaps: gaps.map(g => g.map(v => +v.toFixed(2))),
        onsets: onsets, probes: probes,
        voicedFrac: +(voiced / Math.max(1, loud)).toFixed(3), longestHoldSec: +(hold * 0.02).toFixed(2) });
  } catch (e) { document.getElementById('out').textContent = 'ERR ' + e.message; }
})();
</script>`; }

function freePort() {
  return new Promise(res => {
    const s = http.createServer();
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
  });
}

/* the debug run, now that ANALYSIS exists */
if (measureOnly) {
  const m = await measure(measureOnly);
  console.log(JSON.stringify(m, null, 1));
  process.exit(0);
}

async function measure(relPath, times, from) {
  ANALYSIS = 'qa/_audio-analysis-' + process.pid + '.tmp.html';
  fs.writeFileSync(path.join(ROOT, ANALYSIS), analysisHtml());
  const port = await freePort();
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const fp = path.join(ROOT, u);
    fs.stat(fp, (e, st) => {
      if (e) { res.writeHead(404); res.end(); return; }
      const type = /\.mp3$/.test(fp) ? 'audio/mpeg' : /\.html?$/.test(fp) ? 'text/html' : 'application/octet-stream';
      const range = req.headers.range;
      if (range && /\.mp3$/.test(fp)) {
        const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
        const s = m[1] ? parseInt(m[1], 10) : 0, e2 = m[2] ? parseInt(m[2], 10) : st.size - 1;
        res.writeHead(206, {
          'Content-Type': type, 'Accept-Ranges': 'bytes',
          'Content-Range': 'bytes ' + s + '-' + e2 + '/' + st.size, 'Content-Length': e2 - s + 1,
        });
        fs.createReadStream(fp, { start: s, end: e2 }).pipe(res);
        return;
      }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(fp).pipe(res);
    });
  });
  await new Promise(r => srv.listen(port, '127.0.0.1', r));

  const profile = path.join(TMP, 'chrome-' + Date.now());
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--mute-audio',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });

  /* the browser writes its debug port into the profile; poll for it rather than pick one */
  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    await sleep(250);
    try {
      const f = path.join(profile, 'DevToolsActivePort');
      if (fs.existsSync(f)) {
        const [p] = fs.readFileSync(f, 'utf8').split('\n');
        const list = await (await fetch('http://127.0.0.1:' + p.trim() + '/json/list')).json();
        const pg = list.find(t => t.type === 'page');
        if (pg) wsUrl = pg.webSocketDebuggerUrl;
      }
    } catch { /* not up yet */ }
  }
  if (!wsUrl) { chrome.kill(); srv.close(); die('chrome did not expose a debug port'); }

  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const waiting = new Map();
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
  });
  const send = (method, params) => new Promise(r => { const i = ++id; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

  await send('Page.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' + ANALYSIS + '?f=/' + relPath
    + (times && times.length ? '&t=' + times.join(',') : '')
    + (from ? '&from=' + from : '') });
  let out = null;
  for (let i = 0; i < 80 && !out; i++) {
    await sleep(250);
    const r = await send('Runtime.evaluate', { expression: "document.getElementById('out').textContent", returnByValue: true });
    const v = r.result && r.result.result && r.result.result.value;
    if (v && v !== 'pending') out = v;
  }
  ws.close(); chrome.kill(); srv.close();
  fs.unlinkSync(path.join(ROOT, ANALYSIS));
  if (!out || out.startsWith('ERR')) die('could not decode ' + relPath + ': ' + out);
  return JSON.parse(out);
}


/* ---- 4. the cut point, the cut, and the guards -------------------------------------------- */
/* A LINE IS A SUNG SEGMENT, NOT A GAP INDEX. Counting gaps means a leading or trailing silence
   shifts every index by one and every lyric line lands on the wrong phrase — the exact defect this
   replaced. So: the sound before the first gap, the sound between each pair of gaps, and the sound
   after the last one; anything under 0.3 s is breath, not a phrase. */
function segmentsOf(m) {
  const segs = [];
  let cursor = 0;
  for (const g of m.gaps) {
    if (g[0] - cursor >= 0.3) segs.push({ start: cursor, end: g[0] });
    cursor = Math.max(cursor, g[1]);
  }
  if (m.duration - cursor >= 0.3) segs.push({ start: cursor, end: m.duration });
  return segs;
}

const relTmp = tempPath(outName);
fs.copyFileSync(origPath, path.join(ROOT, relTmp));
/* read --from before measuring: the singing-or-speech gate grades the window that SHIPS, and a
   cylinder's spoken announcement would otherwise be graded instead of the verse */
/* with an outside lyric sheet the clip opens `--lead` seconds before the first line, so the student
   hears the line arrive instead of landing on its first syllable */
const fromAt = Math.max(0, arg('from', '') !== '' ? (Number(arg('from')) || 0)
  : (lrcSel ? Math.round((lrcSel.times[0] - lead - early) * 1000) / 1000 : 0));
const orig = await measure(relTmp, null, fromAt);
/* THE ONE CHECK THAT CATCHES THE WRONG MASTER. An LRC times the release it was written against, so a
   different mix, edit or upload passes every acoustic test and still carries the wrong times. The
   record's own duration is compared with the DECODED length before anything is cut, at the 2 s
   tolerance LRCLIB's /api/get matches on. */
if (lrcSel && lrcSel.dur != null && Math.abs(orig.duration - lrcSel.dur) > 2) {
  die('this file decodes to ' + orig.duration.toFixed(2) + ' s but ' + lrcSel.where +
    ' is ' + Number(lrcSel.dur).toFixed(2) + ' s — that sheet times its own master, not this file, ' +
    'so no timing here would be honest. Use the release the record describes, or pick another record.');
}
const segs = segmentsOf(orig);
console.log('  original: ' + orig.duration.toFixed(2) + ' s, ' + orig.gaps.length + ' silences, ' +
  segs.length + ' sung phrases');
console.log('  phrases: ' + segs.slice(0, 10).map(s => s.start.toFixed(2)).join(' · ') + (segs.length > 10 ? ' …' : ''));
fs.unlinkSync(path.join(ROOT, relTmp));

/* --scan: measure a candidate and stop. Choosing a recording is the expensive part of this tool —
   a refused cut costs a download plus a decode — so the audition writes nothing and prints the
   three numbers a choice needs: where the phrases begin, how long each one lasts, and whether that
   shape could be a line at all. */
if (arg('scan', '')) {
  const st = segs.map(s => +s.start.toFixed(2));
  const du = segs.map(s => +(s.end - s.start).toFixed(2));
  const sp = st.slice(1).map((t, i) => +(t - st[i]).toFixed(2));
  console.log('  SCAN — nothing cut, nothing written');
  console.log('  starts: ' + st.join(', '));
  console.log('  lengths: ' + du.join(', '));
  if (du.length) {
    const lo = Math.min.apply(null, du), hi = Math.max.apply(null, du);
    console.log('  spacing: ' + sp.join(', '));
    console.log('  length ' + lo.toFixed(2) + '–' + hi.toFixed(2) + ' s · ratio ' + (hi / lo).toFixed(2) +
      ' · line-sized: ' + (lo >= 1.2 && hi <= 22) + ' · even enough: ' + (hi / lo <= 3.2));
  }
  process.exit(0);
}

/* A SPOKEN INTRO PASSES EVERY OTHER CHECK: the dip test finds phrases, the energy test proves sound
   after each start, the count matches the lines — and none of it says a voice was singing. Held pitch
   does. Validated on three clips: a cappella solo 0.98 s, choir 2.12 s, a spoken intro 0.30 s. A
   sentence has no note longer than about a third of a second, so below half a second of held pitch
   there is nothing for a lyric line to light against.

   EXCEPT WHEN THE FILE BRINGS ITS OWN TRANSCRIPT. The gate is here because no acoustic test reads a
   word; a timed transcript IS someone reading the words off this file, line by line, which is better
   evidence of singing than held pitch — and the one class it misjudges is exactly the class that
   carries transcripts: acoustic-era recordings, band-limited and noisy, where the pitch tracker
   jitters past the 3% stability window on every frame while the singer holds the note perfectly.
   So with a timed transcript the gate reports and does not refuse: the transcript is someone reading the
   words off this file, which is better evidence of singing than held pitch. */
if (lyrics.length && orig.longestHoldSec != null && orig.longestHoldSec < 0.5) {
  const where = (fromAt ? fromAt.toFixed(1) + '–' + (fromAt + 12).toFixed(1) + ' s' : 'the first 12 s');
  const why = 'NO SINGING: the longest held note in ' + where + ' is ' + orig.longestHoldSec +
    ' s (voiced ' + Math.round((orig.voicedFrac || 0) * 100) + '% of loud frames). A spoken intro or an ' +
    'instrumental passes the phrase test and the energy test and still has no held note — this is how a ' +
    'spoken verse shipped once. Choose a recording where a voice actually sings.';
  if (!arg('times', '') && !lrcSel) die(why);
  console.log('  voice gate: ' + why);
  console.log('  voice gate: NOT refusing — this file ships a timed transcript, which is direct evidence of');
  console.log('              the words');
}

/* ---- TIMES FROM AN AUTHORITATIVE TRANSCRIPT (--times=a,b,c) ------------------------------
   Some recordings have no silence at all: a 1910 cylinder, an orchestra under the voice, a band.
   No segmentation can find their lines, so the acoustic route cannot time them — which is why one
   shipped with the wrong words against the wrong verse. When the file ships with a human-made
   timed transcript (a Wikimedia TimedText/`.srt` track, a subtitle file), those times ARE the
   ground truth: someone wrote the words down while listening to THIS file. The tool takes them
   verbatim, refuses to invent any, and still proves each one lands on sound. */
const givenTimes = lrcSel ? lrcSel.times.slice()
  : (arg('times', '') || '').split(',')
      .map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0);
/* the cues as they will be PLACED: each one `--early` seconds before the sheet puts it */
const sheetStarts = givenTimes.map(t => Math.max(0, Math.round((t - early) * 1000) / 1000));
if (givenTimes.length) {
  if (!lyrics.length) die('--times needs --lyrics as well: the times and the words ship together');
  if (givenTimes.length !== lyrics.length) {
    die('--times has ' + givenTimes.length + ' times but ' + lyrics.length +
      ' lyric lines — the transcript and the lyrics must be the same list');
  }
  for (let i = 1; i < givenTimes.length; i++) {
    if (givenTimes[i] <= givenTimes[i - 1]) die('--times must rise: ' + givenTimes.join(','));
  }
  const lastT = givenTimes[givenTimes.length - 1];
  if (lastT >= orig.duration) die('a --times value (' + lastT + ') is past the end of the file');
  console.log('  times: ' + givenTimes.join(' · ') + ' s — from ' +
    (lrcSel ? lrcSel.where : 'the file\'s own timed transcript') +
    (early ? ', placed ' + Math.abs(early) + ' s ' + (early > 0 ? 'earlier' : 'later') +
      ' (--early=' + early + '): ' + sheetStarts.join(' · ') : ''));
}

let cutAt = wantSeconds;
const noTiming = !!arg('no-timing', '');
if (lyrics.length && !givenTimes.length) {
  if (!segs.length) die('no sung phrases found: this recording cannot be cut to lines mechanically (if the file has a timed transcript, pass --times=)');

  /* PHRASES MUST LOOK LIKE LINES BEFORE ANYTHING IS TIMED. A band recording gives one pause in four
     minutes; a 1917 voice-and-orchestra gives six pauses sixty-five seconds apart. Both pass a
     count-the-phrases check and both produce a block whose highlight is nonsense. So the shape is
     tested first: a line is 1.2–22 seconds of sound, and the phrase lengths sit within 3.2× of each
     other. Failing that, the tool refuses the timing — not the audio. */
  /* ...and only the phrases that SHIP. The cut discards everything after the last line, so a choir
     that slows down in bar nine, or a file holding two songs, is not a defect in the four lines this
     block shows — grading the whole file refused two perfectly good recordings for their tails. */
  const used = Math.min(lyrics.length, segs.length);
  const durs = segs.slice(0, used).map(s => s.end - s.start);
  const lo = Math.min(...durs), hi = Math.max(...durs);
  const evenEnough = hi / lo <= 3.2;
  const lineSized = lo >= 1.2 && hi <= 22;
  if (!lineSized || !evenEnough) {
    const why = 'phrase lengths run ' + lo.toFixed(1) + '–' + hi.toFixed(1) + ' s (' +
      segs.length + ' of them): ' + (!lineSized ? 'those are not line-sized' : 'those are not evenly spaced');
    if (!noTiming) {
      die(why + ' — this is accompaniment, not lines, so no timing would be honest. Re-run with ' +
        '--no-timing --seconds=<n> to ship the words untimed, or pick a recording where the singing ' +
        'leaves a gap between lines.');
    }
    console.log('  WARNING: ' + why + ' — shipping untimed (--no-timing given)');
  }
  if (lyrics.length > segs.length) {
    die(lyrics.length + ' lyric lines but only ' + segs.length +
      ' sung phrases — the audio and the words are not the same shape, so no timings are written');
  }
  if (!noTiming) cutAt = lyrics.length >= segs.length ? orig.duration : segs[lyrics.length].start - 0.05;
} else if (givenTimes.length) {
  /* the cut runs to the start of the line AFTER the last one shown, so the clip ends where the next
     line would begin; past the end of the transcript there is no such time, so --seconds or the end */
  /* an outside sheet also says where the line AFTER the excerpt starts, so the clip ends there */
  const next = (lrcSel && lrcSel.next != null) ? lrcSel.next : givenTimes[lyrics.length];
  cutAt = wantSeconds ||
    (next ? next - 0.05 + tail : Math.min(orig.duration, givenTimes[lyrics.length - 1] + 7 + tail));
} else if (!cutAt) {
  die('give --lyrics="…|…" (the cut follows the last line) or --seconds=<n>');
}
if (cutAt > orig.duration) cutAt = orig.duration;

const destRel = 'assets/' + outName + '.mp3';
const destPath = path.join(ROOT, destRel);
const info = cutTo(fs.readFileSync(origPath), cutAt, destPath, fromAt);
/* THE FADE, AND WHY IT IS A SECOND ENCODE. A copied MPEG frame carries its own amplitudes, so a fade
   cannot be written into the copy; the clip is decoded and re-encoded once by ffmpeg, with a fade of
   `--fade` seconds at each end. The out-fade starts `--fade` before the end, so the clip's own end
   is untouched and whatever the next line opens with is faded instead of chopped. */
let shipped = { bytes: info.bytes, reencoded: false };
if (fade > 0) {
  const outAt = Math.max(0, info.duration - fade);
  const chain = 'afade=t=in:st=0:d=' + fade +
    (outAt > 0 ? ',afade=t=out:st=' + outAt.toFixed(3) + ':d=' + fade : '');
  fs.mkdirSync(TMP, { recursive: true });
  const pre = path.join(TMP, outName + '-cut.mp3');
  fs.renameSync(destPath, pre);
  let fail = null;
  try {
    const bin = (await import('ffmpeg-static')).default;
    execFileSync(bin, ['-v', 'error', '-y', '-i', pre, '-af', chain,
      '-c:a', 'libmp3lame', '-b:a', '192k', destPath], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    fail = String(e.stderr || e.message).trim().split('\n').pop();
  }
  fs.rmSync(pre, { force: true });
  if (fail) die('the fade failed (' + fail + ') — run: npm install');
  shipped = { bytes: fs.statSync(destPath).size, reencoded: true };
}
console.log('  cut ' + (fromAt ? info.start.toFixed(2) + '–' + cutAt.toFixed(2) : '0–' + cutAt.toFixed(2)) +
  ' s → ' + (shipped.reencoded
    ? shipped.bytes + ' bytes, re-encoded once with a ' + fade + ' s fade at each end'
    : info.bytes + ' bytes, ' + info.frames + ' frames, ' + info.header));

/* LINE TIMES COME FROM THE ORIGINAL, NOT FROM RE-SEGMENTING THE CUT. The cut is a byte prefix of the
   original, so its phrase boundaries are the original's — but its loudest moment differs, so the 2%
   threshold moves and a re-segment can find one phrase fewer. Anchoring on the cut's own segmentation
   refused a correct recording for an artefact of its own measurement. */
const starts = (givenTimes.length ? sheetStarts
  : (lyrics.length && !noTiming ? segs.slice(0, lyrics.length).map(s => s.start) : []))
  .map(t => Math.max(0, Math.round((t - info.start + cueShift) * 1000) / 1000));

/* AND THE TIMES ARE PROVED BY ENERGY. A line start must have sound after it and a dip before it: that
   is what distinguishes singing from accompaniment, and it is what the instrumental demo got wrong. */
const cutM = await measure(destRel, starts);
if (Math.abs(cutM.duration - info.duration) > 0.25) {
  console.log('  WARN: frame arithmetic says ' + info.duration.toFixed(2) + ' s but the decoder says ' +
    cutM.duration.toFixed(2) + ' s — use the decoded value');
}
const cutSegs = segmentsOf(cutM);
if (lyrics.length && !noTiming && !givenTimes.length && cutSegs.length < lyrics.length) {
  console.log('  note: the cut measures ' + cutSegs.length + ' phrases where the original had ' +
    lyrics.length + ' — the threshold moved, the timings did not. Judged by energy below.');
}
for (const t of starts) if (t >= cutM.duration) die('a line start (' + t + ') falls after the end of the file');
if (cutM.probes && cutM.probes.length) {
  /* TWO RULES, BECAUSE THE TIMES HAVE TWO SOURCES. A time the tool derived from the audio must show
     a dip before it and sound after it — that is what makes it an onset and not a guess. A time that
     came from the file's own timed transcript has its position settled by a human, so the only thing
     left to prove is that it does not land in a hole: on a 1910 cylinder the surface noise never drops,
     so a rise test would refuse a correct transcript for being noisy. */
  const derived = !givenTimes.length;
  const weak = cutM.probes.filter(p => derived ? (!(p.after > p.before * 1.5) || p.after < 0.004) : p.after < 0.006);
  console.log('  line starts, sound either side (' + (derived ? 'rise test' : 'presence test, times from transcript') +
    '): ' + cutM.probes.map(p =>
    p.t.toFixed(2) + ' (' + p.before.toFixed(4) + '→' + p.after.toFixed(4) + ')').join(' · '));
  if (weak.length) {
    die(weak.length + ' line start(s) do not sit on sound — first at ' + weak[0].t.toFixed(2) + ' s (' +
      weak[0].before.toFixed(4) + ' before, ' + weak[0].after.toFixed(4) + ' after). The words and the ' +
      'audio disagree: check that this recording is sung, and that the lyric lines are the ones it sings.');
  }
}

/* ---- 5. what a build pastes --------------------------------------------------------------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const songName = arg('title', '') ||
  (title ? title.replace(/^File:/, '').replace(/\.\w+$/, '').replace(/_/g, ' ') : outName);

/* NO CREDIT LINE ABOVE THE PLAYER. The block's <h4> is its credit — who performs it, and nothing
   else, italicised by the `h4` rule in `style.css` rather than by an `<i>` here — and the figure
   prints nothing above the <audio>. The licence, the source and
   the excerpt length stay in the provenance row printed below, and THAT ROW IS THE RECORD of
   attribution: every licence is allowed (owner instruction), and the row carries it with the source
   and the credit in place of a printed line. */
/* "Performed by" is not printed: the <h4> is the performer's name alone. Commons credits are
   sometimes a list (Words: …; Music: …; Performance: …), so the performance clause is lifted out for
   the <h4>; a list with no performance clause is carried whole, because a name is better than none. */
const creditParts = String(credit).split(/;\s*/).map(s => s.trim()).filter(Boolean);
const perfClause = (creditParts.find(p => /^Performance:/i.test(p)) || '').replace(/^Performance:\s*/i, '');
const performer = perfClause || String(credit);

/* TWO SHAPES, ONE PIPELINE. `--width=half` is `musicPlayer`: the lines sit in a single list under the
   player. `--width=full` is `lyricSheet` per [03]: the <h3> is the title, the h4 carries the
   performer, and the lines and the explainer sit in two columns — because the
   highlight is honest only while a line and a row are the same thing, and a long line in a narrow
   column wraps into three rows under a mark that is supposed to be singing one. */
const full = /^full/i.test(arg('width', 'half'));
const sheet = [
  '  <ol class="vz-lyrics">',
  ...lyrics.map((l, i) => '    <li data-t="' + (starts[i] != null ? starts[i] : '') + '">' + esc(l) + '</li>'),
  '  </ol>',
];
const fig = full
  ? [
      '<div class="panel itemsize" data-kind="teach">',
      '<h3>' + esc(songName) + '</h3>',
      '<h4>' + esc(performer) + '</h4>',
      '<figure class="vz-play">',
      '  <audio class="vz-audio" src="../' + destRel + '" data-duration="' + cutM.duration.toFixed(2) +
        '" controls preload="metadata"></audio>',
      '  <div class="vz-controls">',
      '    <button class="vz-btn" type="button" aria-label="play" aria-pressed="false">▶</button>',
      '    <span class="vz-time" data-now>0:00</span>',
      '    <div class="vz-bar" role="slider" tabindex="0" aria-label="Play position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="vz-fill"></span><span class="vz-knob"></span></div>',
      '    <span class="vz-time" data-dur>0:00</span>',
      '  </div>',
      '  <div class="vz-sheet">',
      ...sheet.map(l => '  ' + l),
      '    <p class="dim">ONE PARAGRAPH: what these words are doing (never what the block is)</p>',
      '  </div>',
      '</figure>',
      '</div>',
      '<!-- OPTION slot: a second .panel below, holding whatever the lesson adds to this block -->',
    ].join('\n')
  : [
      '<div class="panel itemsize-third" data-kind="teach">',
      '<h3>' + esc(songName) + '</h3>',
      '<h4>' + esc(performer) + '</h4>',
      '<figure class="vz-play">',
      '  <audio class="vz-audio" src="../' + destRel + '" data-duration="' + cutM.duration.toFixed(2) +
        '" controls preload="metadata"></audio>',
      '  <div class="vz-controls">',
      '    <button class="vz-btn" type="button" aria-label="play" aria-pressed="false">▶</button>',
      '    <span class="vz-time" data-now>0:00</span>',
      '    <div class="vz-bar" role="slider" tabindex="0" aria-label="Play position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="vz-fill"></span><span class="vz-knob"></span></div>',
      '    <span class="vz-time" data-dur>0:00</span>',
      '  </div>',
      ...sheet,
      '</figure>',
      '</div>',
    ].join('\n');

console.log('\n--- paste this into the block (' + (full ? 'the block IS the .panel' : 'inside its .panel') + ') ---\n' + fig);
console.log('\n--- provenance row for assets/README.md ---');
console.log('| `' + outName + '.mp3` | ' +
  (lrcSel ? 'lines ' + lrcSel.first + '–' + (lrcSel.first + lyrics.length - 1) +
    ' of that sheet\'s ' + lrcSel.total + ', '
    : lyrics.length ? 'the first ' + lyrics.length + ' sung lines, ' : '') +
  cutM.duration.toFixed(2) + ' s, ' + shipped.bytes + ' bytes — **cut from ' +
  (fromAt ? info.start.toFixed(2) + ' s to ' : 'the start to ') + cutAt.toFixed(2) + ' s**, ' +
  (shipped.reencoded
    ? 're-encoded once with a ' + fade + ' s fade at each end'
    : 'frames copied not re-encoded, and the VBR header rewritten for the cut (frame count, byte count, seek table)') +
  (givenTimes.length && early ? ', every line placed ' + Math.abs(early) + ' s ' +
    (early > 0 ? 'before' : 'after') + ' its sheet time' : '') +
  (cueShift ? ', every `data-t` moved ' + cueShift + ' s (--cue-shift)' : '') +
  ' | ' + (sourcePage || src) + ' | ' + credit + ' | **' + licence + '** |');
console.log('\n--- before it ships ---');
console.log('1. the page must load the player, `qa/player.js`: it draws the bar and the highlight. Without');
console.log('   it the audio keeps its native controls and no line ever lights');
console.log('2. `data-duration` must equal the decoded length: ' + cutM.duration.toFixed(2) + ' s');
console.log('3. every `data-t` must be inside that length: ' + starts.join(', '));
