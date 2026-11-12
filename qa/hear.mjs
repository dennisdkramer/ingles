/**
 * qa/hear.mjs — what a clip actually SAYS, and whether those words are the lyric lines.
 *
 * WHY THIS EXISTS. Every other audio check in this repo measures sound: where the energy dips, how
 * long a pitch is held, whether a phrase is line-sized. All of them passed a clip whose words were
 * somewhere else entirely — a spoken intro, an instrumental, a different verse — because none of
 * them read a word. A lyric block makes one promise a student can check in four seconds: the line
 * on screen is the line being sung. This is the check for that promise.
 *
 * HOW. Chrome decodes the MP3 (the only decoder on this machine), the page cuts the clip at its own
 * phrase boundaries and writes one 16 kHz mono WAV per phrase, and Windows' own speech recogniser
 * (System.Speech, en-US) reads each one. Two readings:
 *   --mode=words    open dictation: what does this phrase sound like? (a transcript to read)
 *   --mode=line     a closed grammar of the lyric lines: which line is this phrase? (a decision)
 * The second is the strong one: a recogniser forced to choose among four known lines still picks the
 * wrong one when the words are not there, and it picks the right one from singing it half-hears.
 *
 * Recognisers are poor at singing, so a low score is not proof the words are missing — but a phrase
 * that scores near zero on every line, while a clip known to be sung scores high, is the signature
 * of a clip that does not contain the lyric. Run the known-good clip first (see --selftest).
 *
 * Run:  node qa/hear.mjs --file=assets/twinkle-stanza1.mp3 --lyrics="a|b|c|d" [--mode=line|words]
 *       node qa/hear.mjs --selftest        the instrument, on a clip whose words are known
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TMP = path.join(os.tmpdir(), 'qa-hear');
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const argv = process.argv.slice(2);
const arg = (k, d) => { const h = argv.find(a => a.startsWith('--' + k + '=')); return h ? h.slice(k.length + 3) : d; };
const die = m => { console.log('hear: ' + m); process.exit(1); };

let file = arg('file', '');
let lines = (arg('lyrics', '') || '').split('|').map(s => s.trim()).filter(Boolean);
const mode = arg('mode', 'line');

if (argv.includes('--selftest')) {
  file = 'assets/twinkle-stanza1.mp3';
  lines = ['Twinkle, twinkle, little star,', 'How I wonder what you are!',
    'Up above the world so high,', 'Like a diamond in the sky.'];
  console.log('hear: selftest — a clip whose words are known');
}
if (!file) die('give --file=<path> --lyrics="line|line|line" (or --selftest)');
if (!fs.existsSync(path.join(ROOT, file)) && !fs.existsSync(file)) die('no such file: ' + file);
if (mode === 'line' && !lines.length) die('--mode=line needs --lyrics');

/* ---- the page: decode, find phrases, write one WAV per phrase ------------------------------- */
function pageHtml() { return `<!doctype html><meta charset="utf-8"><pre id="out">pending</pre><script>
(async () => {
  const post = (u, b) => fetch(u, { method: 'POST', body: b });
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
    const segs = []; let cursor = 0;
    for (const g of gaps) { if (g[0] - cursor >= 0.3) segs.push([cursor, g[0]]); cursor = Math.max(cursor, g[1]); }
    if (a.duration - cursor >= 0.3) segs.push([cursor, a.duration]);
    /* one WAV per phrase, 16 kHz mono 16-bit, padded 0.12 s either side so a clipped onset or tail
       still has a consonant in it: the recogniser needs the whole word, not just the vowel.
       SLOW, because these are recognisers built for speech and a sung line arrives faster and more
       legato than any sentence: reading the source at 0.7x makes the clip 43% longer and lower, which
       costs nothing (the words are the same words) and is the difference between a transcript and
       noise. Pitch drops with it, which a recogniser does not care about. */
    const R = 16000, SLOW = Number(p.get('slow') || '1');
    const wav = (from, to) => {
      const n = Math.max(1, Math.round((to - from) / SLOW * R));
      const bytes = 44 + n * 2, b = new DataView(new ArrayBuffer(bytes));
      const str = (o, s) => { for (let i = 0; i < s.length; i++) b.setUint8(o + i, s.charCodeAt(i)); };
      str(0, 'RIFF'); b.setUint32(4, bytes - 8, true); str(8, 'WAVE'); str(12, 'fmt ');
      b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
      b.setUint32(24, R, true); b.setUint32(28, R * 2, true); b.setUint16(32, 2, true);
      b.setUint16(34, 16, true); str(36, 'data'); b.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++) {
        const t = from + i / R * SLOW;
        const s0 = Math.floor(t * sr), f = t * sr - s0;
        const v = (ch[s0] || 0) * (1 - f) + (ch[s0 + 1] || 0) * f;
        b.setInt16(44 + i * 2, Math.max(-32767, Math.min(32767, Math.round(v * 32767))), true);
      }
      let bin = '';
      const u8 = new Uint8Array(b.buffer);
      for (let i = 0; i < u8.length; i += 8192) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
      return btoa(bin);
    };
    for (let i = 0; i < Math.min(segs.length, 16); i++) {
      const s = segs[i];
      await post('/wav/' + i, wav(Math.max(0, s[0] - 0.12), Math.min(a.duration, s[1] + 0.12)));
    }
    document.getElementById('out').textContent = JSON.stringify({
      duration: +a.duration.toFixed(3), phrases: segs.length,
      segs: segs.map(s => [+s[0].toFixed(2), +s[1].toFixed(2)]) });
  } catch (e) { document.getElementById('out').textContent = 'ERR ' + e.message; }
})();
</script>`; }


/* ---- run the page, collecting the WAVs it posts back --------------------------------------- */
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(path.join(TMP, 'wav'), { recursive: true });
const PAGE = 'qa/_hear-' + process.pid + '.tmp.html';
fs.writeFileSync(path.join(ROOT, PAGE), pageHtml());

const wavs = [];
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (req.method === 'POST' && u.startsWith('/wav/')) {
    let body = '';
    req.on('data', d => { body += d; });
    req.on('end', () => {
      const i = Number(u.slice(5));
      wavs[i] = Buffer.from(body, 'base64');
      fs.writeFileSync(path.join(TMP, 'wav', String(i).padStart(2, '0') + '.wav'), wavs[i]);
      res.writeHead(204); res.end();
    });
    return;
  }
  const fp = path.join(ROOT, u);
  fs.stat(fp, (e, st) => {
    if (e) { res.writeHead(404); res.end(); return; }
    const type = /\.mp3$/.test(fp) ? 'audio/mpeg' : /\.html?$/.test(fp) ? 'text/html' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(fp).pipe(res);
  });
});
const port = await new Promise(r => { srv.listen(0, '127.0.0.1', () => r(srv.address().port)); });

const profile = path.join(os.tmpdir(), 'chrome-hear-' + Date.now());
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--mute-audio',
  '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });

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
await send('Page.navigate', { url: 'http://127.0.0.1:' + port + '/' + PAGE + '?f=/' + file.replace(/\\/g, '/')
  + '&slow=' + arg('slow', '1') });
let out = null;
for (let i = 0; i < 120 && !out; i++) {
  await sleep(250);
  const r = await send('Runtime.evaluate', { expression: "document.getElementById('out').textContent", returnByValue: true });
  const v = r.result && r.result.result && r.result.result.value;
  if (v && v !== 'pending') out = v;
}
ws.close(); chrome.kill(); srv.close();
fs.unlinkSync(path.join(ROOT, PAGE));
if (!out || out.startsWith('ERR')) die('could not decode ' + file + ': ' + out);
const info = JSON.parse(out);


/* ---- Windows' own recogniser: one phrase per WAV ------------------------------------------- */
/* System.Speech is .NET Framework only, so this must be Windows PowerShell, not pwsh 7 — the
   difference is not cosmetic: on pwsh the assembly fails to load and every phrase reads as silence. */
const psPath = path.join(TMP, 'recognise.ps1');
fs.writeFileSync(psPath, `
param([string]$dir, [string]$mode, [string]$linesB64)
Add-Type -AssemblyName System.Speech
$lines = @()
if ($linesB64) { $lines = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($linesB64)) -split "\`n" | Where-Object { $_ } }
$res = @()
Get-ChildItem -Path $dir -Filter *.wav | Sort-Object Name | ForEach-Object {
  $r = New-Object System.Speech.Recognition.SpeechRecognitionEngine
  $r.InitialSilenceTimeout = [TimeSpan]::FromSeconds(0.4)
  $r.BabbleTimeout = [TimeSpan]::FromSeconds(0)
  $r.EndSilenceTimeout = [TimeSpan]::FromSeconds(0.2)
  if ($mode -eq 'line' -and $lines.Count -gt 0) {
    $c = New-Object System.Speech.Recognition.Choices
    foreach ($l in $lines) { $c.Add($l) }
    $g = New-Object System.Speech.Recognition.GrammarBuilder
    $g.Append($c)
    $r.LoadGrammar((New-Object System.Speech.Recognition.Grammar($g)))
  } else {
    $r.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
  }
  $r.SetInputToWaveFile($_.FullName)
  $txt = @(); $cf = @()
  for ($i = 0; $i -lt 6; $i++) {
    try { $x = $r.Recognize() } catch { $x = $null }
    if ($null -eq $x) { break }
    $txt += $x.Text; $cf += [math]::Round($x.Confidence, 3)
  }
  $r.Dispose()
  $res += [pscustomobject]@{ f = $_.Name; text = ($txt -join ' | '); conf = ($cf -join ',') }
}
$res | ConvertTo-Json -Compress
`, 'utf8');

const b64 = Buffer.from(lines.join('\n'), 'utf8').toString('base64');
let raw = '';
try {
  raw = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', psPath, '-dir', path.join(TMP, 'wav'), '-mode', mode, '-linesB64', b64],
    { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
} catch (e) { die('the recogniser failed: ' + (e.stderr || e.message)); }
let heard = [];
try { heard = JSON.parse(raw || '[]'); } catch { die('could not read the recogniser output'); }
if (!Array.isArray(heard)) heard = [heard];

/* ---- what came back, and whether the lyric is in the clip at all ---------------------------- */
/* TWO questions, and they are not the same one. (1) PRESENCE: is this line in the clip anywhere?
   (2) ALIGNMENT: does line N sit at phrase N? Presence is the one that matters, because the failure
   that shipped twice was a clip full of different words — a spoken intro, an instrumental, a verse
   nobody asked for — and every energy test passed it. So the verdict is presence first. */
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
const STOP = new Set(['a', 'an', 'the', 'and', 'of', 'to', 'in', 'for', 'on', 'is', 'are', 'it',
  'that', 'this', 'i', 'you', 'my', 'me', 'we', 'be', 'as', 'so', 'with', 'at', 'by', 'from', 'up',
  'how', 'what', 'like', 'oh', 'o']);
const content = s => norm(s).filter(w => !STOP.has(w) && w.length > 1);

/* edit distance, because a sung word comes back near-right rather than right: "diamond" is heard as
   "dillon" and every exact-match score calls that a miss */
function dist(a, b) {
  const m = a.length, n = b.length;
  if (!m || !n) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}
const near = (a, b) => {
  if (a === b) return true;
  const L = Math.max(a.length, b.length);
  if (L < 4) return false;
  if (a.startsWith(b) || b.startsWith(a)) return true;
  return dist(a, b) / L <= 0.34;
};
/* how much of `line` can be found in the word list `pool`, 0..1 */
function found(line, pool) {
  const want = content(line);
  if (!want.length) return 0;
  const used = new Set();
  let hit = 0;
  for (const w of want) {
    for (let i = 0; i < pool.length; i++) {
      if (used.has(i)) continue;
      if (near(w, pool[i])) { hit++; used.add(i); break; }
    }
  }
  return hit / want.length;
}

const allHeard = content(heard.map(h => h.text || '').join(' '));
console.log('hear: ' + file + ' — ' + info.duration.toFixed(2) + ' s, ' + info.phrases + ' phrases');
console.log('mode: ' + mode + (mode === 'line' ? ' · forced choice among the lines' : ' · open dictation'));
console.log('');

const verdicts = lines.map((l, k) => ({ k, text: l, at: found(l, allHeard) }));
for (const v of verdicts) {
  const words = content(v.text);
  console.log('  line ' + (v.k + 1) + '  ' + (v.at * 100).toFixed(0).padStart(3) + '% of its words heard' +
    (v.at >= 0.5 ? '  ✓' : '  ✗') + '  ' + v.text.slice(0, 58));
  console.log('           wants: ' + words.join(', '));
}
console.log('');
let alignOk = 0, alignTotal = 0;
for (let i = 0; i < heard.length; i++) {
  const h = heard[i], seg = info.segs[i] || [0, 0];
  console.log('  phrase ' + String(i).padStart(2) + '  ' + (seg[0].toFixed(2) + '–' + seg[1].toFixed(2) + ' s') +
    '  heard: ' + (h.text || '(nothing)').slice(0, 60));
  if (lines[i]) {
    alignTotal++;
    const own = found(lines[i], content(h.text || ''));
    if (own >= 0.4) alignOk++;
    console.log('          its own line ' + (i + 1) + ': ' + (own * 100).toFixed(0) + '%' + (own >= 0.4 ? '  ✓' : '  ✗'));
  }
}
console.log('');
const present = verdicts.filter(v => v.at >= 0.5).length / Math.max(1, lines.length);
const heardAny = allHeard.length;
console.log('presence: ' + verdicts.filter(v => v.at >= 0.5).length + '/' + lines.length +
  ' lines are in this clip (' + (present * 100).toFixed(0) + '%) · ' + heardAny +
  ' content words were heard at all');
if (alignTotal) console.log('alignment: ' + alignOk + '/' + alignTotal + ' phrases carry their own line');
if (present < 0.5) {
  console.log('');
  console.log('  VERDICT: the words on the page are NOT in this clip. Do not ship it — pick another');
  console.log('  recording, another span, or different lines. The lines and the audio are one object.');
} else if (heardAny < 4) {
  console.log('');
  console.log('  VERDICT: the recogniser found almost nothing to read — this proves nothing either way.');
  console.log('  Treat the timing as unverified, not as verified.');
} else {
  console.log('');
  console.log('  VERDICT: the lyric is in the clip. Only the timings remain to be judged.');
}

