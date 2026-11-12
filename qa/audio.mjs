/**
 * qa/audio.mjs — source → check the licence → cut → rewrite the header → measure → place.
 *
 * WHY THIS EXISTS. `[Constraints] 2` forbids a fetch at RUN TIME: the page must open with no network.
 * It says nothing about authoring time, and I had wrongly extended it to mean a build may not touch
 * audio at all. The three facts a build cannot invent are all machine-checkable, so they are checked
 * here instead of being left to a human with headphones:
 *
 *   - the licence  — the Commons API states it; a file that is not PD/CC0 is refused, not credited;
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
 *
 * The cut is made at the silence after the last lyric line, so the audio carries exactly the lines
 * the block shows. Nothing is re-encoded: the frames are copied, so the audio is bit-identical.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
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

const outName = arg('out') || die('--out=<name> is required (it becomes assets/<name>.mp3)');
const lyrics = (arg('lyrics', '') || '').split('|').map(s => s.trim()).filter(Boolean);
const wantSeconds = Number(arg('seconds', '0'));
const pageUrl = arg('file');
const directUrl = arg('url');
if (!pageUrl && !directUrl) die('give --file="File:…" (Commons) or --url=<mp3>');

/* ---- 1. the source, and its licence ------------------------------------------------------- */
let src = directUrl, credit = null, licence = null, sourcePage = null, title = null;

if (pageUrl) {
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
  licence = short;

  /* a licence that is merely *stated* is not a licence to ship: only PD / CC0 pass, and CC BY
     passes only because this tool writes the credit line into the figcaption. Anything else is
     refused here rather than argued about later. */
  if (!/^(CC0|Public domain|PD)/i.test(short) && !/^CC BY/i.test(short)) {
    die('licence "' + short + '" is not PD/CC0/CC-BY — refusing to place it. Pick another recording.');
  }

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
  const hasTranscript = !!arg('times', '');
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
  // a direct URL carries no licence metadata, so the caller states it, and it is recorded verbatim
  licence = arg('licence') || 'UNKNOWN';
  credit = arg('credit') || 'unknown';
  if (licence === 'UNKNOWN') die('with --url you must also give --licence="CC0" and --credit="who made it"');
  console.log('source: ' + src + '\n  licence: ' + licence + ' (as given) · credit: ' + credit);
}

fs.mkdirSync(TMP, { recursive: true });
const origPath = path.join(TMP, outName + '-original.mp3');
{
  const r = await fetch(src, { headers: { 'User-Agent': 'ingles-site/1.0 (teaching material)' } });
  if (!r.ok) die('download failed: ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(origPath, buf);
  console.log('  downloaded: ' + buf.length + ' bytes -> ' + origPath);
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
const fromAt = Math.max(0, Number(arg('from', '0')) || 0);
const orig = await measure(relTmp, null, fromAt);
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
   So with --times the gate reports and does not refuse; the guard moves to qa/hear.mjs, which reads
   the words back out of the clip after it is cut. */
if (lyrics.length && orig.longestHoldSec != null && orig.longestHoldSec < 0.5) {
  const where = (fromAt ? fromAt.toFixed(1) + '–' + (fromAt + 12).toFixed(1) + ' s' : 'the first 12 s');
  const why = 'NO SINGING: the longest held note in ' + where + ' is ' + orig.longestHoldSec +
    ' s (voiced ' + Math.round((orig.voicedFrac || 0) * 100) + '% of loud frames). A spoken intro or an ' +
    'instrumental passes the phrase test and the energy test and still has no held note — this is how a ' +
    'spoken verse shipped once. Choose a recording where a voice actually sings.';
  if (!arg('times', '')) die(why);
  console.log('  voice gate: ' + why);
  console.log('  voice gate: NOT refusing — this file ships a timed transcript, which is direct evidence of');
  console.log('              the words. Verify with: node qa/hear.mjs --file=assets/<out>.mp3 --mode=line --lyrics="…"');
}

/* ---- TIMES FROM AN AUTHORITATIVE TRANSCRIPT (--times=a,b,c) ------------------------------
   Some recordings have no silence at all: a 1910 cylinder, an orchestra under the voice, a band.
   No segmentation can find their lines, so the acoustic route cannot time them — which is why one
   shipped with the wrong words against the wrong verse. When the file ships with a human-made
   timed transcript (a Wikimedia TimedText/`.srt` track, a subtitle file), those times ARE the
   ground truth: someone wrote the words down while listening to THIS file. The tool takes them
   verbatim, refuses to invent any, and still proves each one lands on sound. */
const givenTimes = (arg('times', '') || '').split(',')
  .map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0);
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
  console.log('  times: ' + givenTimes.join(' · ') + ' s — taken verbatim from the file\'s own timed transcript');
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
  const next = givenTimes[lyrics.length];
  cutAt = wantSeconds || (next ? next - 0.05 : Math.min(orig.duration, givenTimes[lyrics.length - 1] + 7));
} else if (!cutAt) {
  die('give --lyrics="…|…" (the cut follows the last line) or --seconds=<n>');
}
if (cutAt > orig.duration) cutAt = orig.duration;

const destRel = 'assets/' + outName + '.mp3';
const info = cutTo(fs.readFileSync(origPath), cutAt, path.join(ROOT, destRel), fromAt);
console.log('  cut ' + (fromAt ? info.start.toFixed(2) + '–' + cutAt.toFixed(2) : '0–' + cutAt.toFixed(2)) +
  ' s → ' + info.bytes + ' bytes, ' + info.frames + ' frames, ' + info.duration.toFixed(2) + ' s, ' + info.header);

/* LINE TIMES COME FROM THE ORIGINAL, NOT FROM RE-SEGMENTING THE CUT. The cut is a byte prefix of the
   original, so its phrase boundaries are the original's — but its loudest moment differs, so the 2%
   threshold moves and a re-segment can find one phrase fewer. Anchoring on the cut's own segmentation
   refused a correct recording for an artefact of its own measurement. */
const starts = (givenTimes.length ? givenTimes.slice()
  : (lyrics.length && !noTiming ? segs.slice(0, lyrics.length).map(s => s.start) : []))
  .map(t => Math.max(0, Math.round((t - info.start) * 1000) / 1000));

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
const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const songName = arg('title', '') ||
  (title ? title.replace(/^File:/, '').replace(/\.\w+$/, '').replace(/_/g, ' ') : outName);

/* THE FIGCAPTION IS A CREDIT LINE, NOT A BUILD LOG. assets/README.md requires the credit on the
   page because a printed page travels without that file — so the page carries who sang it, under
   what licence, and (if the clip is shorter than the song) that it is an excerpt and how long it
   lasts. How the file was cut, at what second, by what method, is maintenance detail: it belongs in
   the README row and nowhere the student reads. */
/* "Performed by" is only right when the credit IS a performer. Commons credits are sometimes a list
   (Words: …; Music: …; Performance: …), and prefixing that with "Performed by" produces a sentence
   that describes a composer as a singer. So the performance clause is lifted out for the <h4>, and a
   compound credit stays whole in the figcaption, where the full attribution belongs. */
const creditParts = String(credit).split(/;\s*/).map(s => s.trim()).filter(Boolean);
const perfClause = (creditParts.find(p => /^Performance:/i.test(p)) || '').replace(/^Performance:\s*/i, '');
const compound = /[:;]/.test(credit);
const performer = perfClause || (compound ? '' : String(credit));
const attribution = compound ? '<b>' + esc(credit) + '</b>' : '';
const licenceLine = '<b>' + esc(licence) + '</b>' + (sourcePage ? ', Wikimedia Commons' : '') + '. ' +
  (lyrics.length ? 'The first ' + lyrics.length + ' lines only: ' : '') +
  mmss(cutM.duration) + ' of the song.';

/* TWO SHAPES, ONE PIPELINE. `--width=half` is `musicPlayer`: the caption opens the figure and the
   lines sit in a single list. `--width=full` is `lyricSheet` per [03]: the <h3> is the title, an
   <h4> carries the performer, and the lines and the explainer sit in two columns — because the
   highlight is honest only while a line and a row are the same thing, and a long line in a narrow
   column wraps into three rows under a mark that is supposed to be singing one. The figcaption comes
   after the sheet in the full shape (HTML requires it first or last) and carries the attribution. */
const full = /^full/i.test(arg('width', 'half'));
const sheet = [
  '  <ol class="vz-lyrics">',
  ...lyrics.map((l, i) => '    <li data-t="' + (starts[i] != null ? starts[i] : '') + '">' + esc(l) + '</li>'),
  '  </ol>',
];
const fig = full
  ? [
      '<div class="panel itemsize" data-kind="mixed">',
      '<h3>' + esc(songName) + '</h3>',
      '<figure class="vz-play">',
      performer ? '  <h4>Performed by <b>' + esc(performer) + '</b></h4>'
                : '  <h4>' + esc(String(credit)) + '</h4>',
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
      '  <figcaption>' + (attribution ? attribution + ' — ' : '') + licenceLine + '</figcaption>',
      '</figure>',
      '</div>',
      '<!-- OPTION slot: a second .panel below, holding whatever the lesson adds to this block -->',
    ].join('\n')
  : [
      '<div class="panel itemsize-half" data-kind="mixed">',
      '<h3>' + esc(songName) + '</h3>',
      '<figure class="vz-play">',
      '  <figcaption>' + (compound || !performer ? (attribution || '') : 'Performed by <b>' + esc(String(credit)) + '</b>') +
        (attribution ? ' — ' : (performer ? ' — ' : '')) + licenceLine + '</figcaption>',
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
console.log('| `' + outName + '.mp3` | ' + (lyrics.length ? 'the first ' + lyrics.length + ' sung lines, ' : '') +
  cutM.duration.toFixed(2) + ' s, ' + info.bytes + ' bytes — **cut from ' +
  (fromAt ? info.start.toFixed(2) + ' s to ' : 'the start to ') + cutAt.toFixed(2) +
  ' s**, frames copied not re-encoded, and the VBR header rewritten for the cut (frame count, byte count, seek table) | ' +
  (sourcePage || src) + ' | ' + credit + ' | **' + licence + '** |');
console.log('\n--- before it ships ---');
console.log('1. a lesson page needs the `.vz-*` rules from qa/preview-visual.css moved into style.css');
console.log('2. `data-duration` must equal the decoded length: ' + cutM.duration.toFixed(2) + ' s');
console.log('3. every `data-t` must be inside that length: ' + starts.join(', '));
