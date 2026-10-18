/**
 * QA Smoke Test for Inglês Abre Portas
 * 
 * COVERAGE LIMITATIONS (jsdom fallback):
 * - No real browser rendering (CSS layout not tested)
 * - No actual media stream recording (fake mic not available)
 * - No visual popup positioning verification
 * - sessionStorage simulated via mocks
 * - Network requests to external hosts are mocked/ignored
 * 
 * What IS tested:
 * - JavaScript syntax validity (node --check equivalent)
 * - DOM structure and element existence
 * - Console errors during page load
 * - Basic engine initialization (__A, __B flags)
 * - Selection popup logic
 * - Highlight logic: Ctrl held at mousedown AND at mouseup creates a highlight on its OWN paint
 *   layer (#hlLayer — never an element inside the text); Ctrl released before mouseup creates
 *   nothing; the Hear/Record/Note popup stays shut for the whole Ctrl gesture; the colour palette
 *   recolours it; Ctrl+click on the painted rectangle deletes it; a
 *   highlight may cross a note/recording and BOTH stay whole (the two layers never interact); an
 *   overlapping highlight is SUBTRACTED from the older one (shrunk / split in two / swallowed) and
 *   never merged;
 * - Note/recording OVERLAP RULES (step h): abutting saves are two spans that share no character (the
 *   anchor is the TRIMMED selection — the 2px paper gap itself is the CSS half, the owner's live
 *   check); a selection that partially overwrites a recording LOCKS ⏺ Record (greyed via `.locked`,
 *   still pressable) and its press only toasts the refusal, while covering it exactly stays
 *   re-recordable; a selection overlapping/containing a note edits THAT note and 💾 Save EXPANDS its
 *   area to the union (same row id, the union's text as the anchor), a selection inside it keeps the
 *   note's original string as its reference; a note crossing a recording leaves BOTH displayed (the
 *   crossed mark kept in flagged pieces, both spans measurable) with both rows intact
 * - Grace window: a just-saved note (and a just-recorded clip) survives a poll whose snapshot
 *   predates its own backend write — the row, the phrase's flag and the popup's note line stay
 *   exactly as the click left them (nbLocal/nbEntries, the same pendingFor window as highlights)
 *
 * SCOPE (owner decision 2026-10-11): lesson pages are developed on business/lesson1.html ONLY
 * until the feature set is final. kids/, nsfw/ and the login pages (index.html/portal.html) are
 * parked here on purpose — add their testPage() calls back in main() once business is done.
 */

import { JSDOM } from 'jsdom';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Hash function matching site's h(s)
function h(s) {
    let x = 0;
    for (const c of s) {
        x = (x * 31 + c.charCodeAt(0)) | 0;
    }
    return x;
}

// Generate signature for QA user
function genSig(email, track) {
    const secret = 'abreportas2025';
    return h(email + track + secret);
}

// Simple static file server
function createServer() {
    return http.createServer((req, res) => {
        const urlPath = req.url.split('?')[0];
        let filePath = path.join(ROOT, urlPath === '/' ? 'portal.html' : urlPath);
        
        // Security: prevent directory traversal
        if (!filePath.startsWith(ROOT)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        const ext = path.extname(filePath);
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg'
        };

        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404);
                    res.end('Not Found');
                } else {
                    res.writeHead(500);
                    res.end('Server Error');
                }
                return;
            }
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
            res.end(data);
        });
    });
}

// Mock fetch to ignore external requests
function mockFetch() {
    global.fetch = async (url, options) => {
        const urlStr = url.toString();
    // POST to the backend succeeds (so the outbox flush can drain)
    if (options && options.body && urlStr.includes('script.google.com')) {
        return { ok: true, status: 200, text: async () => '{}', json: async () => ({ result: 'ok' }), headers: new Map() };
    }
        // Ignore external hosts
        if (urlStr.includes('googleapis.com') || 
            urlStr.includes('fonts.') || 
            urlStr.includes('script.google.com') ||
            urlStr.includes('.googleapis')) {
            return {
                ok: false,
                status: 0,
                text: async () => '',
                json: async () => ({}),
                headers: new Map()
            };
        }
        // Mock backend responses
        if (urlStr.includes('action=')) {
            return {
                ok: true,
                status: 200,
                text: async () => '{"status":"ok"}',
                json: async () => ({ status: 'ok' }),
                headers: new Map()
            };
        }
        // Default mock
        return {
            ok: true,
            status: 200,
            text: async () => '',
            json: async () => ({}),
            headers: new Map()
        };
    };
}

/* jsdom implements no layout: Range#getClientRects is missing and every element rect is 0x0.
   The highlight layer is geometry-driven (a text range is measured into painted rectangles and
   Ctrl+click is hit-tested against them), so the harness installs a deterministic fake layout:
   8px per character, 40 characters per line, 20px per line, starting at (10, 30). */
function installFakeLayout(window) {
    const CHAR = 8, PER = 40, LINE = 20, LEFT = 10, TOP = 30;
    const doc = window.document;
    const charOffset = (node) => {
        if (!node) return -1;
        const w = doc.createTreeWalker(doc.body, window.NodeFilter.SHOW_TEXT);
        let sum = 0, n;
        while ((n = w.nextNode())) { if (n === node) return sum; sum += n.data.length; }
        return -1;
    };
    window.Range.prototype.getClientRects = function () {
        const s = charOffset(this.startContainer), e = charOffset(this.endContainer);
        if (s < 0 || e < 0) return [];
        const from = s + (this.startOffset || 0), to = e + (this.endOffset || 0);
        const out = [];
        for (let i = from; i < to;) {
            const col = i % PER, row = Math.floor(i / PER), take = Math.min(to - i, PER - col);
            const left = LEFT + col * CHAR, top = TOP + row * LINE;
            out.push({ left, top, width: take * CHAR, height: LINE, right: left + take * CHAR, bottom: top + LINE, x: left, y: top });
            i += take;
        }
        return out;
    };
}

async function testPage(serverUrl, pageName, track = 'business') {
    console.log(`\n🧪 Testing ${pageName}...`);
    const errors = [];
    const logs = [];

    const email = 'qa@test.com';
    const sig = genSig(email, track);

    // Read HTML file
    const filePath = pageName.includes('/') 
        ? path.join(ROOT, pageName)
        : path.join(ROOT, pageName);
    
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    let html = fs.readFileSync(filePath, 'utf8');

    // Inject session storage mock before engines load
    const sessionMock = `
    <script>
    (function() {
        const SIG = ${sig};
        const gateData = {
            email: "${email}",
            track: "${track}",
            teacher: true,
            sig: SIG
        };
        // Mock sessionStorage
        const store = {};
        window.sessionStorage = {
            getItem: (k) => store[k] || null,
            setItem: (k, v) => { store[k] = v; },
            get length() { return Object.keys(store).length; },
            key: (i) => Object.keys(store)[i] || null,
            removeItem: (k) => { delete store[k]; },
            clear: () => { for (const k in store) delete store[k]; }
        };
        // Pre-set gate
        sessionStorage.setItem('gate', JSON.stringify(gateData));
        
        // Mock navigator.mediaDevices for recording
        navigator.mediaDevices = navigator.mediaDevices || {};
        navigator.mediaDevices.getUserMedia = async () => ({
            getTracks: () => [],
            getAudioTracks: () => []
        });
        
        // Track initialization
        window.__INIT_LOG = [];
    })();
    </script>
    `;

    // Insert mock right after <head>
    html = html.replace('<head>', '<head>' + sessionMock);

    // Create JSDOM instance
    const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        resources: 'usable',
        url: serverUrl + '/' + pageName,
        pretendToBeVisual: true,
        beforeParse(window) {
            // the adaptive poll pauses while the page is hidden — mark the harness page hidden
            // so the poll never fires and the harness drives loadLayer() explicitly
            try { Object.defineProperty(window.document, 'hidden', { value: true, configurable: true }); } catch (e) {}
            // Mock additional browser APIs
            window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
            window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
            window.cancelAnimationFrame = (id) => clearTimeout(id);

            // jsdom ships no fetch: expose the Node-side mock on the page so engine
            // send()/loadLayer() behave like they do in a browser
            window.fetch = (...args) => global.fetch(...args);
            
            // Mock getBoundingClientRect for selection popup positioning
            const mockRect = { top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20, x: 0, y: 0 };
            window.Element.prototype.getBoundingClientRect = function() { return mockRect; };
            window.HTMLElement.prototype.getBoundingClientRect = function() { return mockRect; };
            window.Range.prototype.getBoundingClientRect = function() { return mockRect; };
            installFakeLayout(window);
            
            // Mock localStorage (delete first, then define property)
            delete window.localStorage;
            const store = {};
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: (k) => store[k] || null,
                    setItem: (k, v) => { store[k] = String(v); },
                    removeItem: (k) => { delete store[k]; },
                    clear: () => { for (const k in store) delete store[k]; },
                    get length() { return Object.keys(store).length; },
                    key: (i) => Object.keys(store)[i] || null
                },
                writable: true,
                configurable: true
            });

            // Capture console
            const origError = window.console.error;
            const origLog = window.console.log;
            window.console.error = (...args) => {
                const msg = args.join(' ');
                if (!msg.includes('Failed to load resource') && !msg.includes('net::')) {
                    errors.push(`[ERROR] ${msg}`);
                }
                origError?.(...args);
            };
            window.console.log = (...args) => {
                logs.push(args.join(' '));
                origLog?.(...args);
            };
        }
    });

    // Wait for scripts to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { window } = dom;

    // Check __A and __B flags only on lesson pages (portal doesn't load engines)
    if (pageName.includes('lesson')) {
        // Check __A flag (engine1 loaded)
        if (!window.__A) {
            errors.push('[FAIL] window.__A is not true (engine1.js may not have loaded)');
        } else {
            console.log('   ✅ engine1.js loaded (__A=true)');
        }

        // Check __B flag (engine2 loaded)  
        if (!window.__B) {
            errors.push('[FAIL] window.__B is not true (engine2.js may not have loaded)');
        } else {
            console.log('   ✅ engine2.js loaded (__B=true)');
        }

        // Check for error banner
        const errb = window.document.getElementById('errb');
        if (errb && errb.style.display !== 'none') {
            errors.push('[FAIL] Error banner (#errb) is visible');
        }
    }

    // Test selection popup on lesson pages
    if (pageName.includes('lesson')) {
        // Find a phrase element to select
        const phrases = window.document.querySelectorAll('.phrase, p, span');
        if (phrases.length > 0) {
            // Simulate selection
            const target = phrases[0];
            const range = window.document.createRange();
            range.selectNodeContents(target);
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            // Dispatch selectionchange event
            const event = new window.Event('selectionchange', { bubbles: true });
            window.document.dispatchEvent(event);

            // Wait for popup
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check for popup
            const popup = window.document.querySelector('.pop');
            if (!popup) {
                // Try alternative selectors
                const altPopup = window.document.querySelector('[class*="pop"]');
                if (!altPopup) {
                    errors.push('[WARN] Selection popup (.pop) not found after selectionchange');
                }
            } else {
                console.log('   ✅ Selection popup appears on text selection');
            }
        }

        /* ---- HIGHLIGHT: its own paint layer (#hlLayer) with ZERO interaction with the note layer.
           jsdom has no layout, so installFakeLayout() gave the page deterministic fake geometry
           (8px per character, 40 chars per line, 20px per line). That makes the overlay real work:
           text range → painted rectangles → Ctrl+click hit test. */
        const hlHost = Array.from(
            window.document.querySelectorAll('.content-area p, .content-area li, .content-area td')
        ).find(el => el.querySelectorAll('*').length === 0 && el.textContent.trim().length > 18);

        if (hlHost && hlHost.firstChild && hlHost.firstChild.nodeType === 3) {
            const tn = hlHost.firstChild;
            const hlRange = window.document.createRange();
            hlRange.setStart(tn, 0);
            hlRange.setEnd(tn, Math.min(12, tn.data.length));
            const hlSel = window.getSelection();
            const rects = () => window.document.querySelectorAll('#hlLayer .hlr');
            const recCount = () => { try { return window.eval('hlList.length'); } catch (e) { return -1; } };
            const gesture = async (range, { ctrlDown = true, ctrlUp = true, to = [40, 30] } = {}) => {
                window.document.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true, ctrlKey: ctrlDown, clientX: 1, clientY: 1 }));
                if (ctrlDown) window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
                hlSel.removeAllRanges();
                hlSel.addRange(range);
                window.document.dispatchEvent(new window.Event('selectionchange', { bubbles: true }));
                if (!ctrlUp) window.document.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'Control', bubbles: true }));
                window.document.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true, cancelable: true, ctrlKey: ctrlUp, clientX: to[0], clientY: to[1] }));
                await new Promise(resolve => setTimeout(resolve, 450));   // engine debounces selectionchange by 350ms
            };

            /* (a) Ctrl held at mousedown but RELEASED before mouseup → nothing happens */
            await gesture(hlRange, { ctrlUp: false });
            if (rects().length || recCount() !== 0) {
                errors.push('[FAIL] Ctrl released before mouseup still created a highlight (Ctrl must be held at BOTH ends)');
            } else {
                console.log('   ✅ Ctrl released before mouseup creates no highlight');
            }

            /* (b) Ctrl at mousedown AND at mouseup → the highlight runs on its own paint layer */
            await gesture(hlRange);
            if (window.document.querySelector('.pop #pH, .pop #pR, .pop #pN')) {
                errors.push('[FAIL] the Ctrl highlight gesture opened the Hear/Record/Note popup');
            } else {
                console.log('   ✅ the Ctrl gesture keeps the Hear/Record/Note popup shut');
            }
            if (!rects().length) {
                errors.push('[FAIL] Ctrl at mousedown+mouseup painted no highlight rectangle around the selection');
            } else {
                console.log(`   ✅ Ctrl at mousedown+mouseup paints a highlight on its own layer (${rects().length} rect)`);
                console.log(`      anchor="${window.eval('hlList[0].anchor')}" start=${window.eval('hlList[0].start')} end=${window.eval('hlList[0].end')} color=${window.eval('hlList[0].color')}`);
                if (!rects()[0].dataset.hlid) {
                    errors.push('[FAIL] the painted highlight has no id (cannot be set/deleted server-side)');
                }
                if (window.eval('hlList[0].b') == null) {
                    errors.push('[FAIL] the highlight was not anchored by block + character offset');
                }
            }
            /* it must not be an element of the text */
            if (window.document.querySelector('mark.hl')) {
                errors.push('[FAIL] the highlight was inserted into the text (mark.hl) instead of its own paint layer');
            } else {
                console.log('   ✅ The highlight is not in the text DOM (no mark.hl — painted on its own layer)');
            }

            /* (c) the colour palette recolours the paint layer */
            const swatch = window.document.querySelector('.hlpal button[data-c="red"]');
            if (!swatch) {
                errors.push('[FAIL] highlight colour palette (.hlpal) did not appear after creating');
            } else {
                swatch.click();
                const cls = rects()[0] ? rects()[0].className : '';
                if (cls.indexOf('hlr-red') < 0 || window.eval('hlList[0].color') !== 'red') {
                    errors.push('[FAIL] colour palette click did not recolour the highlight');
                } else {
                    console.log('   ✅ Colour palette recolours the highlight (yellow → red)');
                }
            }

            /* (c2) the palette belongs to the Ctrl gesture, so the gesture's OWN key must not close
               it: the palette is created at mouseup with Ctrl still held, and the keyboard keeps
               auto-repeating that key's keydown while the finger stays there. Any other key still
               closes it (that is the documented rule) */
            await gesture(hlRange);
            const palette = () => window.document.querySelector('.pop.hlpalpop');
            if (!palette()) {
                errors.push('[FAIL] the colour palette (.pop.hlpalpop) did not appear for the keydown test');
            } else {
                window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
                window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Control', repeat: true, bubbles: true }));
                window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Meta', repeat: true, bubbles: true }));
                if (!palette()) {
                    errors.push('[FAIL] the Ctrl/Meta keydown (auto-repeat while Ctrl stays held) closed the colour palette of its own gesture');
                } else {
                    console.log('   ✅ The palette survives the Ctrl/Meta repeat of its own gesture');
                    window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'a', bubbles: true }));
                    if (palette()) {
                        errors.push('[FAIL] any other key press no longer closes the colour palette');
                    } else {
                        console.log('   ✅ Any other key press still closes the palette');
                    }
                }
            }

            try { window.eval('hlList=[]; hlReflow()'); } catch (e) {}

            /* (e) OVERLAPPING HIGHLIGHTS ARE SUBTRACTED, NEVER MERGED (owner spec 2026-10-12): the new
               highlight keeps its WHOLE selection and every character it covers is removed from the
               highlight already sitting on it, so a SECOND COLOUR is never lost. A strictly-inside
               overlap SPLITS the older highlight in two (each piece keeping the older colour), a
               full cover swallows every row under it, and a merely TOUCHING range shares no
               character, so both stay whole. */
            try { window.eval('hlList=[]; hlReflow()'); } catch (e) {}
            if (tn.data.length < 16) {
                console.log('   ⏭  overlap-subtraction test skipped (text node too short)');
            } else {
                const hlSpan = (a, b) => { const r = window.document.createRange(); r.setStart(tn, a); r.setEnd(tn, b); return r; };
                const hlPieces = () => { try { return window.eval('hlList.map(r=>[r.start,r.end,r.color])'); } catch (e) { return []; } };
                const hlRowAt = (a, b) => hlPieces().find(([p, q]) => p === a && q === b) || null;
                /* every POST send() makes — the poll's GET carries no body, so it is ignored */
                const qaPosts = [];
                const qaFetch = window.fetch;
                window.fetch = (u, o) => { if (o && o.body) { try { qaPosts.push(JSON.parse(o.body)); } catch (e) {} } return qaFetch(u, o); };
                try {
                    /* a RED highlight over [1,11] … */
                    await gesture(hlSpan(1, 11));
                    const redSwatch = window.document.querySelector('.hlpal button[data-c="red"]');
                    if (redSwatch) redSwatch.click();
                    const base = hlRowAt(1, 11);
                    if (!base || base[2] !== 'red') {
                        errors.push('[FAIL] could not build the overlap test (no red highlight over [1,11])');
                    } else {
                        /* … then a new one STRICTLY INSIDE it: the old range must be split in two */
                        qaPosts.length = 0;
                        await gesture(hlSpan(4, 8));
                        const cut = hlPieces();
                        if (cut.length !== 3 || !hlRowAt(1, 4) || !hlRowAt(8, 11) || !hlRowAt(4, 8)) {
                            errors.push(`[FAIL] the overlap was not subtracted into two pieces + the new highlight (got ${JSON.stringify(cut)})`);
                        } else if (hlRowAt(1, 4)[2] !== 'red' || hlRowAt(8, 11)[2] !== 'red' || hlRowAt(4, 8)[2] !== 'yellow') {
                            errors.push(`[FAIL] a surviving piece lost the older highlight's colour (${JSON.stringify(cut)})`);
                        } else {
                            console.log('   ✅ A highlight inside another SPLITS it: [1,11] red → [1,4] + [8,11] red, new [4,8] yellow');
                        }
                        if (hlRowAt(1, 11)) {
                            errors.push('[FAIL] the unioned/old highlight is still in the layer (merge survived)');
                        }
                        const setRow = qaPosts.find(o => o.action === 'set' && o.type === 'hl');
                        const addRow = qaPosts.find(o => o.action === 'add' && o.type === 'hl');
                        if (!setRow || !addRow || qaPosts.some(o => o.action === 'del')) {
                            errors.push(`[FAIL] the split was not persisted as set+add (posts: ${JSON.stringify(qaPosts)})`);
                        } else {
                            console.log('   ✅ The split reaches the server as a "set" (trimmed row) + an "add" (second piece)');
                        }
                    }
                    /* a new highlight covering the whole span swallows every row under it */
                    qaPosts.length = 0;
                    await gesture(hlSpan(1, 11));
                    const full = hlPieces();
                    const dels = qaPosts.filter(o => o.action === 'del').length;
                    if (full.length !== 1 || !hlRowAt(1, 11)) {
                        errors.push(`[FAIL] a highlight covering an older one did not swallow it (got ${JSON.stringify(full)})`);
                    } else if (full[0][2] !== 'yellow') {
                        errors.push(`[FAIL] the fully covering highlight did not keep its own colour (${JSON.stringify(full)})`);
                    } else if (dels !== 3) {
                        errors.push(`[FAIL] the swallowed rows were not deleted server-side (dels=${dels}, expected 3)`);
                    } else {
                        console.log('   ✅ A highlight that covers the others swallows them (3 rows deleted, 1 highlight left)');
                    }
                    /* touching ≠ overlapping: no shared character, so both stay whole */
                    try { window.eval('hlList=[]; hlReflow()'); } catch (e) {}
                    qaPosts.length = 0;
                    await gesture(hlSpan(1, 6));
                    await gesture(hlSpan(6, 11));
                    const seam = hlPieces();
                    if (seam.length !== 2 || !hlRowAt(1, 6) || !hlRowAt(6, 11)) {
                        errors.push(`[FAIL] two highlights that merely touch were merged or trimmed (got ${JSON.stringify(seam)})`);
                    } else if (qaPosts.filter(o => o.action !== 'add').length) {
                        errors.push(`[FAIL] a touching highlight rewrote its neighbour (posts: ${JSON.stringify(qaPosts)})`);
                    } else {
                        console.log('   ✅ Two highlights that merely TOUCH stay whole (a same-colour seam is allowed)');
                    }
                } finally {
                    window.fetch = qaFetch;
                    try { window.eval('hlList=[]; hlReflow()'); } catch (e) {}
                }
            }

            /* (f) a note/recording mark and a highlight may intersect: BOTH stay whole, nothing is
               refused, nothing is split — the two layers never talk to each other */
            const noteFrom = 4, noteTo = Math.min(14, tn.data.length - 4);
            const nRange = window.document.createRange();
            nRange.setStart(tn, noteFrom);
            nRange.setEnd(tn, noteTo);
            const nb = window.document.createElement('mark');
            nb.className = 'nb has-note';
            nb.dataset.a = tn.data.slice(noteFrom, noteTo);
            try { nb.appendChild(nRange.extractContents()); nRange.insertNode(nb); } catch (e) {}
            const nbBefore = window.document.querySelector('mark.nb') ? window.document.querySelector('mark.nb').outerHTML : '';
            const textBefore = hlHost.textContent;

            const walk = window.document.createTreeWalker(hlHost, window.NodeFilter.SHOW_TEXT);
            const txts = []; let w2;
            while ((w2 = walk.nextNode())) txts.push(w2);
            if (!nbBefore || txts.length < 3) {
                console.log('   ⏭  layer-independence test skipped (could not build a note mark)');
            } else {
                /* the selection starts BEFORE the note and ends AFTER it: a crossing highlight */
                const crossRange = window.document.createRange();
                crossRange.setStart(txts[0], 2);
                crossRange.setEnd(txts[txts.length - 1], Math.min(3, txts[txts.length - 1].data.length));
                await gesture(crossRange);

                const toastEl = window.document.getElementById('toast');
                if (toastEl && /atravessar/.test(toastEl.textContent || '')) {
                    errors.push('[FAIL] a highlight crossing a note was still refused (the layers must never interact)');
                } else {
                    console.log('   ✅ A highlight crossing a note/recording is never refused');
                }
                if (recCount() !== 1 || !rects().length) {
                    errors.push('[FAIL] a highlight crossing a note/recording was not created');
                } else {
                    const start = window.eval('hlList[0].start'), end = window.eval('hlList[0].end');
                    if (start > noteFrom || end < noteTo) {
                        errors.push(`[FAIL] the crossing highlight lost part of the selection (start=${start} end=${end}, note=${noteFrom}..${noteTo})`);
                    } else {
                        console.log(`   ✅ The crossing highlight keeps the whole range (${start}..${end}, note ${noteFrom}..${noteTo} inside it)`);
                    }
                }
                const nbNow = window.document.querySelector('mark.nb');
                if (!nbNow || nbNow.outerHTML !== nbBefore) {
                    errors.push('[FAIL] the note/recording mark was changed by the highlight (the layers must not interact)');
                } else {
                    console.log('   ✅ The note/recording mark is untouched by the highlight (both exist, whole and separate)');
                }
                if (hlHost.textContent !== textBefore) {
                    errors.push('[FAIL] the page text changed while highlighting (the text DOM must never be touched)');
                } else {
                    console.log('   ✅ The page text is unchanged (highlights are painted, never inserted)');
                }

                /* (g) Ctrl+click on the painted rectangle deletes the highlight, not the note */
                await new Promise(resolve => setTimeout(resolve, 700));   /* hlJustRan guard = 600ms */
                const r0 = rects()[0];
                if (!r0) {
                    errors.push('[FAIL] no painted rectangle to Ctrl+click for the delete test');
                } else {
                    const cx = parseFloat(r0.style.left) + parseFloat(r0.style.width) / 2;
                    const cy = parseFloat(r0.style.top) + parseFloat(r0.style.height) / 2;
                    window.eval('hlDownXY={x:' + cx + ',y:' + cy + '}');   /* mark this click as "no movement" so the delete fires */
                    window.document.body.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, clientX: cx, clientY: cy }));
                    const nbAfter = window.document.querySelector('mark.nb');
                    if (rects().length || recCount() !== 0) {
                        errors.push('[FAIL] Ctrl+click on the painted highlight did not delete it');
                    } else if (!nbAfter || nbAfter.outerHTML !== nbBefore) {
                        errors.push('[FAIL] deleting the highlight also touched the note/recording mark');
                    } else {
                        console.log('   ✅ Ctrl+click deletes the highlight and leaves the note/recording whole');
                    }
                }
            }
            /* ---- NOTE/RECORDING popup: the TWO deletes are INDEPENDENT (owner spec 2026-10-12 #2).
               🔊 Delete drops ONLY the recorded audio and 📝 Delete ONLY the note: the other item's row,
               its mark pieces and its flags all survive, and mark.nb is unwrapped only once its LAST
               flag is gone. Each click sends one del, network last, silent on success. */
            const contentArea = window.document.querySelector('.content-area');
            if (contentArea) {
                const nbText = 'Delete me please today';
                const nbP = window.document.createElement('p');
                nbP.textContent = nbText;
                contentArea.appendChild(nbP);
                /* the phrase as the page renders it after both saves: the recording's mark.nb (has-rec);
                   the note is painted on its own layer, not on this mark */
                const nbMark = window.document.createElement('mark');
                nbMark.className = 'nb has-rec';
                nbMark.dataset.a = nbText;
                const nbFrag = window.document.createRange().extractContents();
                nbMark.appendChild(nbFrag);
                nbP.appendChild(nbMark);

                /* a saved note AND a saved recording on that phrase, from the same selection (what the
                   server would return). layer is a let-bound global, so it must be set through eval
                   (reading hlList via eval is the same pattern). */
                const nbRow = { id: 'qa_note_1', type: 'note', anchor: nbText, data: 'hi' };
                const nbRecRow = { id: 'qa_rec_1', type: 'rec', anchor: nbText, data: '{}', fileId: 'drive-file-1', mime: 'audio/webm' };
                window.eval('layer = ' + JSON.stringify([nbRecRow, nbRow]));
                const openNb = () => window.showAnchor(nbText, 20, 40);
                const closeNb = () => { try { window.eval('closePop()'); } catch (e) {} };

                /* (a1) 🔊 Delete drops ONLY the recorded audio — the note, its mark and its flag stay */
                openNb();
                const delNoteBtn = window.document.querySelector('.pop #pD');
                const delRecBtn = window.document.querySelector('.pop #pA');
                const lockRecBtn = window.document.querySelector('.pop #pR');
                const playRecBtn = window.document.querySelector('.pop #pP');
                if (!delNoteBtn || delNoteBtn.disabled) {
                    errors.push('[FAIL] 📝 Delete must be enabled when the phrase has a saved note');
                } else if (!delRecBtn || delRecBtn.disabled) {
                    errors.push('[FAIL] 🔊 Delete must be enabled when the phrase has a saved recording');
                } else if (!lockRecBtn || lockRecBtn.disabled || !lockRecBtn.classList.contains('locked')) {
                    errors.push('[FAIL] ⏺ Record must stay pressable but LOCKED on a phrase that already has a recording (no re-record)');
                } else if (!playRecBtn || playRecBtn.disabled) {
                    errors.push('[FAIL] ▶ Play must be live for a phrase that has its own saved recording');
                } else {
                    /* intercept send()'s POST so we can prove the backend is told about each delete */
                    await new Promise(resolve => setTimeout(resolve, 500));   /* drain any earlier outbox write */
                    const origFetch = window.fetch;
                    const posted = [];
                    window.fetch = (url, opts) => {
                        try { posted.push(JSON.parse(opts.body)); } catch (e) {}
                        return Promise.resolve({ json: () => Promise.resolve({ result: 'deleted', purged: true }) });
                    };
                    delRecBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
                    await new Promise(resolve => setTimeout(resolve, 450));
                    const leftRows = window.eval('layer.map(it=>it.type+":"+it.id).sort()');
                    const leftMark = window.document.querySelector('mark.nb[data-a="' + nbText + '"]');
                    const delMsgs = posted.filter(p => p.action === 'del');
                    if (leftRows.join(',') !== 'note:' + nbRow.id) {
                        errors.push('[FAIL] 🔊 Delete must remove ONLY the recording row (left: ' + JSON.stringify(leftRows) + ')');
                    } else if (delMsgs.length !== 1 || delMsgs[0].id !== nbRecRow.id) {
                        errors.push('[FAIL] 🔊 Delete must send exactly one del, for the recording row (got ' + JSON.stringify(delMsgs.map(m => m.id)) + ')');
                    } else if (window.eval("nbRows('note').length") !== 1) {
                        errors.push('[FAIL] deleting the recording must leave the note whole (note rows left=' + window.eval("nbRows('note').length") + ')');
                    } else {
                        console.log('   ✅ 🔊 Delete drops only the recorded audio — the note, its mark and its flag stay (independent items)');
                    }
                    /* (a2) 📝 Delete then drops ONLY the note: with no item left, mark.nb is unwrapped */
                    closeNb();
                    posted.length = 0;
                    openNb();
                    const delNoteOnly = window.document.querySelector('.pop #pD');
                    if (!delNoteOnly || delNoteOnly.disabled) {
                        errors.push('[FAIL] 📝 Delete must still be enabled for the note after the recording was deleted');
                    } else {
                        delNoteOnly.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
                        await new Promise(resolve => setTimeout(resolve, 450));
                        const nowRows = window.eval('layer.length');
                        const noteDel = posted.filter(p => p.action === 'del');
                        if (nowRows !== 0) {
                            errors.push('[FAIL] 📝 Delete did not clear the note row from the layer (' + nowRows + ' left)');
                        } else if (noteDel.length !== 1 || noteDel[0].id !== nbRow.id) {
                            errors.push('[FAIL] 📝 Delete must send exactly one del, for the note row (got ' + JSON.stringify(noteDel.map(m => m.id)) + ')');
                        } else if (window.document.querySelector('mark.nb[data-a="' + nbText + '"]') || window.eval('ntList.length') !== 0) {
                            errors.push('[FAIL] mark.nb must be unwrapped once its LAST flag is gone');
                        } else if (nbP.textContent !== nbText) {
                            errors.push('[FAIL] deleting a note/recording changed the page text');
                        } else {
                            console.log('   ✅ 📝 Delete drops only the note (one del) and unwraps mark.nb once no flag is left');
                        }
                    }
                    window.fetch = origFetch;
                    await new Promise(resolve => setTimeout(resolve, 50));
                    closeNb();
                }

                /* (b) a selection that CROSSES a block boundary is refused with a toast and opens nothing.
                   Reset the Ctrl-gesture state the highlight tests above left behind (their synthetic
                   gesture never releases on its own in jsdom) — a plain selection must not be seen as
                   the tail of a Ctrl highlight gesture. */
                closeNb();   /* start from no popup so the check below sees only a NEW one */
                window.eval('ctrlHeld=false; hlSuppressUntil=0; lastCtrlUp=0; lastSelText=""');
                const cb1 = window.document.createElement('p'); cb1.textContent = 'First block line';
                const cb2 = window.document.createElement('p'); cb2.textContent = 'Second block line';
                contentArea.appendChild(cb1);
                contentArea.appendChild(cb2);
                const cbRange = window.document.createRange();
                cbRange.setStart(cb1.firstChild, 2);
                cbRange.setEnd(cb2.firstChild, 6);
                const cbSel = window.getSelection(); cbSel.removeAllRanges(); cbSel.addRange(cbRange);
                window.document.dispatchEvent(new window.Event('selectionchange', { bubbles: true }));
                await new Promise(resolve => setTimeout(resolve, 450));   /* engine debounces by 350ms */
                const cbToast = window.document.getElementById('toast');
                if (window.document.querySelector('.pop #pH, .pop #pR, .pop #pN')) {
                    errors.push('[FAIL] a selection crossing a block boundary still opened the note/recording popup');
                } else if (!/bloco/i.test(cbToast ? cbToast.textContent : '')) {
                    errors.push('[FAIL] a cross-block selection was silently ignored (no refusal toast)');
                } else {
                    console.log(`   ✅ cross-block selection is refused with a toast ("${cbToast.textContent}")`);
                }
                closeNb();
            } else {
                console.log('   ⏭  note/recording popup test skipped (no .content-area)');
            }

            /* ---- BUTTONS ALWAYS PRESENT, GREYED WHEN THEY DON'T APPLY (owner spec 2026-10-12): the
               popup always carries Hear / Play / Record / Delete-audio / Add-Edit Note / Save /
               Delete-note. Hear, Record and Add/Edit Note are always clickable; Play and the audio
               delete light up only for the ONE recording the gesture refers to, Save only while
               editing a note, the note delete only when a note is saved. ⏺ Record stays pressable
               but LOCKED on a phrase that already has a recording. The saved note is shown above. */
            if (contentArea) {
                const stText = 'State buttons please now';
                const stP = window.document.createElement('p');
                stP.textContent = stText;
                contentArea.appendChild(stP);
                const stMark = window.document.createElement('mark');
                stMark.className = 'nb has-rec has-note';
                stMark.dataset.a = stText;
                const stFrag = window.document.createRange().extractContents();
                stMark.appendChild(stFrag);
                stP.appendChild(stMark);

                /* what the server would return for that phrase: a recording pointing at a Drive file
                   (b64 in the row is only the `drive:<fileId>` pointer — no audio in the layer) plus a note */
                window.eval('layer = ' + JSON.stringify([
                    { id: 'qa_rec_1', type: 'rec', anchor: stText, data: 'hi', fileId: 'drive-file-1', mime: 'audio/webm' },
                    { id: 'qa_note_1', type: 'note', anchor: stText, data: 'saved note text', author: 'aluno' }
                ]));
                window.showAnchor(stText, 20, 40);
                const qp = sel => window.document.querySelector('.pop ' + sel);
                const playBtn = qp('#pP'), recBtn = qp('#pR'), noteBtn = qp('#pN'),
                      saveBtn = qp('#pS'), del2 = qp('#pD'), hearBtn = qp('#pH'), delRec2 = qp('#pA');
                if (!playBtn || !recBtn || !noteBtn || !saveBtn || !del2 || !hearBtn || !delRec2) {
                    errors.push('[FAIL] the popup must always show ALL SEVEN buttons (Hear/Play/Record/Delete-audio/Add-Edit Note/Save/Delete-note)');
                } else if (playBtn.disabled || delRec2.disabled) {
                    errors.push('[FAIL] ▶ Play and 🔊 Delete must be enabled when the phrase has its own saved recording');
                } else if (recBtn.disabled || noteBtn.disabled) {
                    errors.push('[FAIL] ⏺ Record and 📝 Add/Edit Note must always be clickable');
                } else if (!recBtn.classList.contains('locked')) {
                    errors.push('[FAIL] ⏺ Record must be locked (still pressable) on a phrase that already has a recording');
                } else if (!saveBtn.disabled) {
                    errors.push('[FAIL] 💾 Save must be greyed out until a note is being edited');
                } else if (del2.disabled) {
                    errors.push('[FAIL] 📝 Delete must be enabled when the phrase has a saved note');
                } else {
                    console.log('   ✅ All seven buttons always present; Play/audio-Delete/note-Delete live, Record locked, Save greyed until editing');
                }
                /* the popup must NOT repeat the selected phrase (owner spec 2026-10-12) */
                if (new RegExp(stText).test(window.document.querySelector('.pop').textContent)) {
                    errors.push('[FAIL] the popup must not repeat the selected text');
                } else {
                    console.log('   ✅ the popup does not repeat the selected text');
                }
                const noteShown = window.document.querySelector('.pop #nbNote');
                if (!noteShown || !/saved note text/.test(noteShown.textContent)) {
                    errors.push('[FAIL] the saved note is not shown above the popup buttons');
                } else if (/📝/.test(noteShown.textContent) || /bluebg/.test(noteShown.getAttribute('style') || '')) {
                    errors.push('[FAIL] the saved note must be plain text — no 📝 icon and no blue background');
                } else {
                    console.log('   ✅ the saved note is shown as plain text above the popup buttons (no icon / no blue bg)');
                }
                /* Record ↦ processing spiral, and back (owner spec 2026-10-12) */
                try {
                    window.eval('nbBtnSpinner(document.querySelector(".pop #pR"), true)');
                    const spinningR = window.document.querySelector('.pop #pR .spin');
                    window.eval('nbBtnSpinner(document.querySelector(".pop #pR"), false)');
                    const restoredR = window.document.querySelector('.pop #pR .lbl') && !window.document.querySelector('.pop #pR .lbl .spin');
                    if (!spinningR) errors.push('[FAIL] ⏺ Record did not become the processing spiral');
                    else if (!restoredR) errors.push('[FAIL] ⏺ Record did not restore its glyph');
                    else console.log('   ✅ ⏺ Record becomes the processing spiral while recording, then restores');
                } catch (e) { errors.push('[FAIL] Record spiral swap threw: ' + e.message); }
                /* ▶ Play carries a .lbl too, so the same swap backs the "spiral while playing" rule */
                const playLabel = playBtn && playBtn.querySelector('.lbl');
                if (!playLabel) errors.push('[FAIL] ▶ Play has no .lbl span, so the playback spiral cannot be shown');
                else console.log('   ✅ ▶ Play carries the .lbl span used for the playback spiral');
                noteBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
                const saveEdit = qp('#pS');
                if (!qp('#nt') || !saveEdit || saveEdit.disabled) {
                    errors.push('[FAIL] 💾 Save must light up (and the editor open) while a note is being edited');
                } else {
                    console.log('   ✅ 📝 Add/Edit Note opens the editor and 💾 Save lights up');
                    /* OWNER REPORT 2026-10-12: saving an EDITED note did nothing. The save must REPLACE the
                       stored note (nbUpsert re-uses its row id), so after Save the popup shows the NEW text,
                       leaves the edit state, and the layer still holds exactly ONE note row for the anchor */
                    const editTa = qp('#nt');
                    if (editTa) {
                        editTa.value = 'edited note text';
                        const saveNow = qp('#pS');
                        if (saveNow) saveNow.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
                        const shownNow = window.document.querySelector('.pop #nbNote');
                        const noteRows = window.eval(`layer.filter(it=>it.type==='note'&&it.anchor===${JSON.stringify(stText)})`);
                        const saveAfter = window.document.querySelector('.pop #pS');
                        if (!shownNow || !/edited note text/.test(shownNow.textContent)) {
                            errors.push('[FAIL] 💾 Save on an edited note did not show the new text (Save looked like a no-op)');
                        } else if (noteRows.length !== 1 || noteRows[0].id !== 'qa_note_1') {
                            errors.push('[FAIL] 💾 Save on an edited note must REPLACE the stored note row (got ' + noteRows.length + ' row(s))');
                        } else if (saveAfter && !saveAfter.disabled) {
                            errors.push('[FAIL] 💾 Save must grey out again once the note has been saved');
                        } else {
                            console.log('   ✅ 💾 Save on an edited note REPLACES the stored note (one row, new text, editor closed)');
                        }
                    }
                }
                /* re-open from a clean state so the control-flow assertions below start fresh */
                window.eval('closePop()');
                window.showAnchor(stText, 20, 40);

                const playNow = window.document.querySelector('.pop #pP');
                if (playNow) {
                    /* ▶ Play recording: click #1 must fetch the Drive clip via ?action=file&id=<fileId>;
                       click #2 must NOT fetch again — the object URL is cached under a:<anchor>.
                       (jsdom cannot construct a spy for the page's Audio binding, so the cache-hit
                       assertion is what proves playback short-circuits to the cache.) */
                    const origFetch = window.fetch;
                    const fetched = [];
                    window.fetch = (url) => {
                        fetched.push(String(url));
                        return Promise.resolve({ json: () => Promise.resolve({ b64: 'AAAA', mime: 'audio/webm' }) });
                    };
                    try {
                        playNow.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
                        /* OWNER SPEC 2026-10-12: ▶ Play shows the processing SPIRAL while the clip is
                           playing. It goes up AT THE CLICK — synchronously, before the fetch that brings
                           the bytes back — so a first-ever Drive fetch shows it too. */
                        const livePlay = window.document.querySelector('.pop #pP');
                        if (!livePlay || !livePlay.querySelector('.spin')) {
                            errors.push('[FAIL] ▶ Play did not show the processing spiral while the clip plays');
                        } else {
                            console.log('   ✅ ▶ Play shows the processing spiral while the clip plays');
                        }
                        await new Promise(resolve => setTimeout(resolve, 80));
                        const playUrl = fetched.filter(u => /action=file/.test(u))[0];
                        if (!playUrl || !/id=drive-file-1/.test(playUrl)) {
                            errors.push('[FAIL] ▶ Play recording did not fetch the clip via ?action=file&id=…');
                        } else {
                            console.log('   ✅ ▶ Play recording fetches the Drive clip via ?action=file&id=…');
                        }
                        /* …and the spiral is cleared once playback stops (ended / failed play), so it
                           can never get stuck on. jsdom's Audio cannot really play, so the clip stops at
                           once — exactly the "stopped" edge this asserts. */
                        if (window.document.querySelector('.pop #pP .spin')) {
                            errors.push('[FAIL] the playback spiral stayed on after the clip stopped');
                        } else {
                            console.log('   ✅ the playback spiral is cleared once the clip stops');
                        }
                        playNow.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
                        await new Promise(resolve => setTimeout(resolve, 50));
                        if (fetched.filter(u => /action=file/.test(u)).length !== 1) {
                            errors.push('[FAIL] the second ▶ Play recording re-fetched the clip instead of using the cache');
                        } else {
                            console.log('   ✅ ▶ Play recording replays from cache (no second fetch)');
                        }
                    } finally {
                        window.fetch = origFetch;
                    }
                }
                const noteBtn2 = window.document.querySelector('.pop #pN');
                if (noteBtn2) {
                    noteBtn2.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
                    const ta = window.document.querySelector('.pop #nt');
                    if (!ta || ta.value !== 'edited note text') {   /* the 💾 Save test above replaced the stored note */
                        errors.push('[FAIL] 📝 Show note did not open the saved note text');
                    } else {
                        console.log('   ✅ 📝 Show note opens the saved note text (prefilled for editing)');
                    }
                }
                try { window.eval('closePop()'); } catch (e) {}
                /* a re-save of the same anchor+type must REUSE the stored rec row id (ONE row, replaced
                   clip) — the same core save (nbUpsert) the 💾 Save uses, so a rec row is never duplicated
                   and the first-match lookup can never play a stale earlier clip. */
                try {
                    const recFirst = window.eval(`nbUpsert('QA rec anchor','rec',{b64:'AAAA',mime:'audio/webm',data:'{}'}); layer.filter(it=>it.type==='rec'&&it.anchor==='QA rec anchor')`);
                    const recAgain = window.eval(`nbUpsert('QA rec anchor','rec',{b64:'BBBB',mime:'audio/webm',data:'{}'}); layer.filter(it=>it.type==='rec'&&it.anchor==='QA rec anchor')`);
                    if (!recFirst || recFirst.length !== 1 || !recAgain || recAgain.length !== 1 || recFirst[0].id !== recAgain[0].id || recAgain[0].b64 !== 'BBBB') {
                        errors.push('[FAIL] nbUpsert must reuse the stored rec row id (got ' + (recAgain ? recAgain.length : '?') + ' row(s))');
                    } else {
                        console.log('   ✅ nbUpsert reuses the stored rec row id (one row, replaced)');
                    }
                } catch (e) { errors.push('[FAIL] nbUpsert recording replacement threw: ' + e.message); }

                /* OWNER REPORT 2026-10-12: a saved NOTE DISAPPEARED from the phrase and from the popup
                   until the server confirmed the write. ROOT CAUSE — the only sync re-check is the 1s
                   poll, which REPLACES `layer` with the server snapshot; a snapshot fetched before the
                   backend write landed does not contain the new row, and the popup's note text, the
                   ▶ Play lookup and the phrase's own flags (nbAnyPending reads nbEntries) all read
                   exactly that row — so the note blinked out for a whole poll cycle. The highlight
                   never did: hlList keeps a freshly painted highlight and renderLayer only drops it
                   once pendingFor says its window is over. The note/recording layer now keeps the same
                   local copy (nbLocal, filled by the ONE core save nbUpsert), served by nbEntries.
                   Assert: a poll whose snapshot predates the save leaves the note's text, the popped
                   note line AND the phrase's has-note flag exactly as the click left them — for a
                   recording too, since both go through the same core save. */
                try {
                    const gA = 'Grace window phrase';
                    const gJ = JSON.stringify(gA);
                    const gP = window.document.createElement('p');
                    gP.textContent = gA;
                    contentArea.appendChild(gP);
                    window.eval('closePop()');
                    window.showAnchor(gA, 20, 40);
                    window.document.querySelector('.pop #pN').dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
                    window.document.querySelector('.pop #nt').value = 'grace note text';
                    window.document.querySelector('.pop #pS').dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
                    window.eval('closePop()');
                    /* the snapshot the poll would bring BEFORE the backend write is committed: every
                       row that exists now, MINUS the note that was just saved */
                    const gId = window.eval(`(nbEntries(${gJ}).find(it=>it.type==='note')||{}).id`);
                    const gSnap = window.eval(`layer.filter(it=>it.id!==${JSON.stringify(gId)})`);
                    const gOrigFetch = window.fetch;
                    window.fetch = () => Promise.resolve({ json: () => Promise.resolve({ rows: gSnap }) });
                    await window.eval('loadLayer()');
                    window.fetch = gOrigFetch;
                    const gMark = window.eval('ntList.some(r=>r.anchor===' + gJ + ')');
                    const gText = window.eval(`nbNoteText(${gJ})`);
                    window.showAnchor(gA, 20, 40);
                    const gShown = window.document.querySelector('.pop #nbNote');
                    window.eval('closePop()');
                    if (!gId) {
                        errors.push('[FAIL] the grace-window check could not save a note to test with');
                    } else if (gText !== 'grace note text') {
                        errors.push('[FAIL] a saved note vanished when a poll brought a snapshot that predated its write (got ' + JSON.stringify(gText) + ')');
                    } else if (!gMark) {
                        errors.push('[FAIL] the phrase lost its has-note flag while the note\'s write was still in flight');
                    } else if (!gShown || !/grace note text/.test(gShown.textContent)) {
                        errors.push('[FAIL] the popup lost the saved note text while the write was still in flight');
                    } else {
                        console.log('   ✅ a saved note (row + text + phrase flag + popup line) survives a poll that predates its write');
                    }
                    /* the ONE core save covers the recording too — same local copy, same window */
                    window.eval(`nbUpsert('QA grace rec','rec',{b64:'AAAA',mime:'audio/webm',data:'{}'})`);
                    const rSnap = window.eval(`layer.filter(it=>it.anchor!=='QA grace rec')`);
                    window.fetch = () => Promise.resolve({ json: () => Promise.resolve({ rows: rSnap }) });
                    await window.eval('loadLayer()');
                    window.fetch = gOrigFetch;
                    if (window.eval(`nbEntries('QA grace rec').length`) !== 1) {
                        errors.push('[FAIL] a just-recorded clip lost its row when a poll brought a snapshot that predated its write');
                    } else {
                        console.log('   ✅ the same grace window covers a just-recorded clip (one core save)');
                    }
                } catch (e) { errors.push('[FAIL] note grace-window check threw: ' + e.message); }

                /* (h) OVERLAP RULES for notes/recordings (owner spec 2026-10-12). Owner report: note/record
                   actions overlapping a previous one were neither reliably saved nor shown together.
                     • ABUTTING (shares no character) is an ordinary new phrase, and the stored anchor is the
                       TRIMMED selection — a mark therefore covers exactly its own anchor text and two
                       abutting saves share no character, which is what lets style.css leave a 2px gap;
                     • a selection INSIDE / OVERLAPPING / CONTAINING a recording LOCKS ⏺ Record
                       covering it exactly is locked too: it greys (.locked) but stays
                       pressable, and pressing it toasts "cannot overwrite recording, delete first";
                     • the SAME resolution enables ▶ Play for the referenced recording (exactly ONE
                       involved); with MORE THAN ONE recording involved ▶ Play and 🔊 Delete are locked and
                       their press toasts "please select a distinct recording";
                     • the two deletes are INDEPENDENT: 🔊 Delete takes only the recording (the note, its row
                       and its blue wash stay) and 📝 Delete only the note (the recording survives), each
                       unwrapping mark.nb only once its own flag was the last one;
                     • a selection that overlaps or contains a NOTE makes that note the popup's ACTIVE note;
                       💾 Save then EXPANDS the note's area to the new selection (the union's text becomes
                       its new anchor, SAME row id). A selection strictly INSIDE the note edits it but keeps
                       the note's original string as its reference;
                     • a note painted across a recording's edge keeps BOTH on screen: the crossed mark is
                       split into pieces that keep its data-a and its flags, both spans stay measurable and
                       the saved row is untouched.
                   jsdom has no layout, so the 2px paper gap itself is the owner's live check — what is
                   asserted here is the DOM invariant that makes it real (the two spans never share a
                   character) plus every rule above. */
                {
                    const nbPos = (blk, at) => {
                        const w = window.document.createTreeWalker(blk, window.NodeFilter.SHOW_TEXT);
                        let a = 0, n;
                        while ((n = w.nextNode())) { const len = n.data.length; if (at <= a + len) return { n, off: at - a }; a += len; }
                        return null;
                    };
                    const nbArea = t => { try { const a = window.eval('nbAreaOf(' + JSON.stringify(t) + ')'); return a ? [a.s, a.e] : null; } catch (e) { return null; } };
                    const nbReset = () => window.eval('closePop(); ctrlHeld=false; hlSuppressUntil=0; hlDownCtrl=false; lastCtrlUp=0; lastSelText=""; layer=[]; nbLocal=[]');
                    /* select [from,to) of the block's TEXT and let the popup open at the mouse release */
                    const nbSelect = async (blk, from, to) => {
                        window.eval('closePop(); ctrlHeld=false; hlSuppressUntil=0; hlDownCtrl=false; lastCtrlUp=0; lastSelText=""');
                        const p = nbPos(blk, from), q = nbPos(blk, to);
                        const r = window.document.createRange(); r.setStart(p.n, p.off); r.setEnd(q.n, q.off);
                        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
                        window.document.dispatchEvent(new window.Event('selectionchange', { bubbles: true }));
                        window.document.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                        await new Promise(res => setTimeout(res, 420));
                        return window.document.querySelector('.pop');
                    };
                    const nbPress = sel => {
                        const b = window.document.querySelector('.pop ' + sel);
                        if (b) b.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
                        return b;
                    };
                    const nbEdit = async (blk, from, to, text) => {
                        await nbSelect(blk, from, to);
                        nbPress('#pN');
                        const ta = window.document.querySelector('.pop #nt');
                        if (ta) ta.value = text;
                        nbPress('#pS');
                        return window.document.querySelector('.pop');
                    };
                    /* (h1) two ABUTTING saves, no shared character */
                    try {
                        const abText = 'Alpha beta gamma delta';
                        const abP = window.document.createElement('p');
                        abP.textContent = abText;
                        contentArea.appendChild(abP);
                        nbReset();
                        await nbEdit(abP, 0, 10, 'first note');            /* "Alpha beta" */
                        if (!nbArea('Alpha beta')) {
                            errors.push('[FAIL] the abutting-save check could not create its first note');
                        } else {
                            /* the second selection INCLUDES the boundary space (" gamma"): the anchor is the
                               TRIMMED text, so the space stays free and the two spans only abut */
                            await nbEdit(abP, 10, 16, 'second note');
                            const a1 = nbArea('Alpha beta'), a2 = nbArea('gamma');
                            const m1 = window.eval('ntList.some(r=>r.anchor==="Alpha beta")');
                            const m2 = window.eval('ntList.some(r=>r.anchor==="gamma")');
                            if (!m1 || !m2) {
                                errors.push('[FAIL] an abutting save did not get its own mark (m1=' + !!m1 + ' m2=' + !!m2 + ')');
                            } else if (false) { /* notes are on their own layer now; the textContent check is obsolete */
                                errors.push('[FAIL] a mark does not cover exactly its own anchor text ("' + m1.textContent + '" / "' + m2.textContent + '")');
                            } else if (!a1 || !a2 || a1[1] > a2[0]) {
                                errors.push('[FAIL] two abutting saves share a character (areas ' + JSON.stringify(a1) + ' / ' + JSON.stringify(a2) + ')');
                            } else if (abP.textContent !== abText) {
                                errors.push('[FAIL] saving notes changed the page text (' + JSON.stringify(abP.textContent) + ')');
                            } else {
                                console.log('   ✅ Abutting saves keep their own spans (' + a1 + ' | ' + a2 + ') — the boundary space stays free, so style.css leaves the 2px gap');
                            }
                        }
                    } catch (e) { errors.push('[FAIL] abutting-save check threw: ' + e.message); }
                    /* (h2) ⏺ Record LOCKS on ANY involvement of a recording —
                       and the SAME resolution enables ▶ Play for the referenced clip. */
                    try {
                        const rcText = 'Record this phrase well';
                        const rcP = window.document.createElement('p');
                        rcP.textContent = rcText;
                        contentArea.appendChild(rcP);
                        nbReset();
                        window.eval('layer = ' + JSON.stringify([{ id: 'qa_rec_lock', type: 'rec', anchor: 'this phrase', data: '{}' }]));
                        /* the selection CONTAINS the recording ([0,19) covers [7,18)) → locked */
                        const lockPop = await nbSelect(rcP, 0, 19);
                        const R1 = lockPop && lockPop.querySelector('#pR');
                        if (!R1) {
                            errors.push('[FAIL] the recording-lock check could not open the popup over the recording');
                        } else if (R1.disabled) {
                            errors.push('[FAIL] a locked ⏺ Record must keep the disabled LOOK, not the disabled attribute (a press must be heard)');
                        } else if (!R1.classList.contains('locked')) {
                            errors.push('[FAIL] a selection CONTAINING a recording did not lock ⏺ Record');
                        } else {
                            nbPress('#pR');
                            const lt = window.document.getElementById('toast');
                            const msg = lt ? lt.textContent : '';
                            if (!/cannot overwrite recording, delete first/.test(msg)) {
                                errors.push('[FAIL] pressing the locked ⏺ Record did not raise the owner\'s refusal toast (got ' + JSON.stringify(msg) + ')');
                            } else if (lockPop.dataset.recording) {
                                errors.push('[FAIL] the locked ⏺ Record started a recording anyway');
                            } else {
                                console.log('   ✅ ⏺ Record is locked by a selection covering a recording and its press only toasts "cannot overwrite recording, delete first"');
                            }
                        }
                        /* the SAME selection enables ▶ Play for the REFERENCED recording: prove it plays
                           exactly that clip by watching the URL the page hands to Audio(). */
                        const P1 = lockPop && lockPop.querySelector('#pP');
                        if (!P1) {
                            errors.push('[FAIL] the recording popup lost its ▶ Play button');
                        } else if (P1.disabled || P1.classList.contains('locked')) {
                            errors.push('[FAIL] a selection overlapping ONE recording must enable ▶ Play for it');
                        } else {
                            const played = [], OrigAudio = window.Audio;
                            window.Audio = function (u) { played.push(u); return { addEventListener() {}, play() { return Promise.resolve(); }, pause() {} }; };
                            window.eval('audioCache["a:this phrase"]="blob:QA-REC"');
                            try { nbPress('#pP'); } finally { window.Audio = OrigAudio; }
                            if (played[0] !== 'blob:QA-REC') {
                                errors.push('[FAIL] ▶ Play did not play the recording the selection refers to (got ' + JSON.stringify(played) + ')');
                            } else {
                                console.log('   ✅ ▶ Play on a selection overlapping ONE recording plays the REFERENCED clip');
                            }
                            window.eval('delete audioCache["a:this phrase"]');
                        }
                        /* a selection INSIDE the recording is locked too */
                        const pop2 = await nbSelect(rcP, 12, 15);      /* "phr" — inside [7,18) */
                        const R2 = pop2 && pop2.querySelector('#pR');
                        if (!R2 || !R2.classList.contains('locked')) errors.push('[FAIL] a selection INSIDE a recording did not lock ⏺ Record');
                        else console.log('   ✅ a selection INSIDE a recording locks ⏺ Record as well');
                        /* ABUTTING it (no shared character) is an ordinary phrase → Record stays live */
                        const pop3 = await nbSelect(rcP, 18, 23);      /* " well" → "well" [19,23) */
                        const R3 = pop3 && pop3.querySelector('#pR');
                        if (!R3 || R3.classList.contains('locked')) errors.push('[FAIL] a selection that merely ABUTS a recording was locked (' + (R3 ? 'locked' : 'no popup') + ')');
                        else console.log('   ✅ a selection that only ABUTS a recording keeps ⏺ Record live');
                        /* covering it EXACTLY is locked too, and it toasts */
                        const pop4 = await nbSelect(rcP, 7, 18);       /* exactly "this phrase" */
                        const R4 = pop4 && pop4.querySelector('#pR');
                        if (!R4 || !R4.classList.contains('locked')) {
                            errors.push('[FAIL] covering a recording exactly must LOCK ⏺ Record');
                        } else {
                            nbPress('#pR');
                            const t4 = window.document.getElementById('toast');
                            if (!/cannot overwrite recording, delete first/.test(t4 ? t4.textContent : '')) {
                                errors.push('[FAIL] covering the recording exactly did not toast the refusal (got ' + JSON.stringify(t4 ? t4.textContent : '') + ')');
                            } else {
                                console.log('   ✅ covering the recording exactly is locked too');
                            }
                        }
                    } catch (e) { errors.push('[FAIL] recording-lock check threw: ' + e.message); }
                    /* (h2b) MORE THAN ONE recording involved → ▶ Play and 🔊 Delete are ambiguous */
                    try {
                        const twText = 'First clip and second clip here';
                        const twP = window.document.createElement('p');
                        twP.textContent = twText;
                        contentArea.appendChild(twP);
                        nbReset();
                        window.eval('layer = ' + JSON.stringify([
                            { id: 'qa_tw_a', type: 'rec', anchor: 'First clip', data: '{}' },
                            { id: 'qa_tw_b', type: 'rec', anchor: 'second clip', data: '{}' }
                        ]));
                        const twPop = await nbSelect(twP, 0, 26);      /* "First clip and second clip" (both) */
                        const P2 = twPop && twPop.querySelector('#pP');
                        const A2 = twPop && twPop.querySelector('#pA');
                        if (!P2 || !A2) {
                            errors.push('[FAIL] the ambiguity check could not open the popup over both recordings');
                        } else if (P2.disabled || A2.disabled) {
                            errors.push('[FAIL] an ambiguous ▶ Play / 🔊 Delete must keep the disabled LOOK, not the disabled attribute (a press must be heard)');
                        } else if (!P2.classList.contains('locked') || !A2.classList.contains('locked')) {
                            errors.push('[FAIL] a selection touching more than one recording must disable ▶ Play and 🔊 Delete');
                        } else {
                            nbPress('#pP');
                            const amb = window.document.getElementById('toast');
                            if (!/please select a distinct recording/.test(amb ? amb.textContent : '')) {
                                errors.push('[FAIL] pressing the ambiguous ▶ Play did not toast "please select a distinct recording" (got ' + JSON.stringify(amb ? amb.textContent : '') + ')');
                            } else {
                                console.log('   ✅ a selection involving more than one recording locks ▶ Play, and its press toasts "please select a distinct recording"');
                            }
                        }
                        /* narrowing the selection to ONE of them is unambiguous again */
                        const onePop = await nbSelect(twP, 15, 26);    /* exactly "second clip" */
                        const P3 = onePop && onePop.querySelector('#pP');
                        const R5 = onePop && onePop.querySelector('#pR');
                        if (!P3 || P3.disabled || P3.classList.contains('locked')) {
                            errors.push('[FAIL] narrowing the selection to a distinct recording must enable ▶ Play again');
                        } else if (!R5 || !R5.classList.contains('locked')) {
                            errors.push('[FAIL] a selection over one existing recording must still lock ⏺ Record');
                        } else {
                            console.log('   ✅ narrowing the selection to a distinct recording enables ▶ Play again (⏺ Record still locked)');
                        }
                    } catch (e) { errors.push('[FAIL] recording-ambiguity check threw: ' + e.message); }
                    /* (h3) the NOTE rules: active note + area expansion + reference retention */
                    try {
                        const ntText = 'Note one area grows here';
                        const ntP = window.document.createElement('p');
                        ntP.textContent = ntText;
                        contentArea.appendChild(ntP);
                        nbReset();
                        await nbEdit(ntP, 0, 8, 'first');              /* a note on "Note one" */
                        const id0 = window.eval("(nbRows('note').find(r=>r.anchor==='Note one')||{}).id");
                        if (!id0 || !nbArea('Note one')) {
                            errors.push('[FAIL] the note-overlap check could not create its first note');
                        } else {
                            /* a selection that OVERLAPS the note is about THAT note: it is the active note,
                               shown on the popup and prefilled by 📝 Add/Edit Note */
                            const ov = await nbSelect(ntP, 5, 13);     /* "one area" overlaps [0,8) */
                            const shown = ov && ov.querySelector('#nbNote');
                            if (!shown || !/first/.test(shown.textContent)) {
                                errors.push('[FAIL] a selection overlapping a note did not make that note the ACTIVE note');
                            } else {
                                nbPress('#pN');
                                const pre = window.document.querySelector('.pop #nt');
                                if (!pre || pre.value !== 'first') {
                                    errors.push('[FAIL] the active note\'s editor was not prefilled with the saved note (' + JSON.stringify(pre ? pre.value : null) + ')');
                                } else {
                                    pre.value = 'second';
                                    nbPress('#pS');
                                    /* the note's area is EXPANDED to the new selection: the union's text is
                                       its new anchor, ONE row with the SAME id. */
                                    const row = window.eval("nbRows('note').filter(r=>r.anchor==='Note one area')");
                                    const m = window.eval('ntList.some(r=>r.anchor==="Note one area")');
                                    const oldM = window.eval('ntList.some(r=>r.anchor==="Note one")');
                                    const a = nbArea('Note one area');
                                    const shownNow = window.document.querySelector('.pop #nbNote');
                                    if (!row || row.length !== 1 || row[0].id !== id0) {
                                        errors.push('[FAIL] saving an overlapping note must re-anchor the SAME row (got ' + JSON.stringify(row) + ' of ' + JSON.stringify(window.eval('layer.map(r=>[r.type,r.anchor])')) + ')');
                                    } else if (!m || oldM) {
                                        errors.push('[FAIL] the note\'s first area was not EXPANDED to the new selection (mark=' + !!m + ' text="' + (m ? m.textContent : '') + '" oldMark=' + !!oldM + ')');
                                    } else if (!a || a[0] !== 0 || a[1] !== 13) {
                                        errors.push('[FAIL] the expanded note does not cover the union span (' + JSON.stringify(a) + ')');
                                    } else if (ntP.textContent !== ntText) {
                                        errors.push('[FAIL] expanding a note changed the page text');
                                    } else if (!shownNow || !/second/.test(shownNow.textContent)) {
                                        errors.push('[FAIL] the expanded note did not keep its saved text on the popup');
                                    } else {
                                        console.log('   ✅ A selection overlapping a note edits THAT note: its area expands to the new selection (same row, union text as the anchor)');
                                    }
                                    /* a selection strictly INSIDE the note edits it but keeps the note's
                                       ORIGINAL string as its reference (no re-anchoring) */
                                    const inSel = await nbSelect(ntP, 5, 10);    /* "one a" inside [0,13) */
                                    const inShown = inSel && inSel.querySelector('#nbNote');
                                    if (!inShown || !/second/.test(inShown.textContent)) {
                                        errors.push('[FAIL] a selection inside a note did not reference the existing note');
                                    } else {
                                        nbPress('#pN');
                                        const ta2 = window.document.querySelector('.pop #nt');
                                        if (ta2) ta2.value = 'third';
                                        nbPress('#pS');
                                        const row2 = window.eval("nbRows('note').filter(r=>r.anchor==='Note one area')");
                                        const m2n = window.eval('ntList.some(r=>r.anchor==="Note one area")');
                                        if (!row2 || row2.length !== 1 || row2[0].id !== id0) {
                                            errors.push('[FAIL] saving inside a note must keep the note\'s original string as its reference (got ' + JSON.stringify(row2) + ' of ' + JSON.stringify(window.eval('layer.map(r=>[r.type,r.anchor])')) + ')');
                                        } else if (!m2n) {
                                            errors.push('[FAIL] the note\'s mark changed while saving inside the note');
                                        } else {
                                            console.log('   ✅ A selection inside a note edits it but keeps the original string as its reference');
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) { errors.push('[FAIL] note-overlap check threw: ' + e.message); }
                    /* (h4) a note painted ACROSS a recording's edge keeps BOTH on screen */
                    try {
                        const ovText = 'Overlap edge test phrase';
                        const ovP = window.document.createElement('p');
                        ovP.textContent = ovText;
                        contentArea.appendChild(ovP);
                        nbReset();
                        window.eval('layer = ' + JSON.stringify([{ id: 'qa_ov_rec', type: 'rec', anchor: 'edge test', data: '{}' }]));
                        window.eval('ensureMark("edge test","rec")');
                        if (!window.document.querySelector('mark.nb.has-rec[data-a="edge test"]')) {
                            errors.push('[FAIL] the crossing check could not paint its recording');
                        } else {
                            await nbEdit(ovP, 13, 24, 'crossing note');  /* "test phrase" [13,24) crosses [8,17) */
                            const pieces = [...window.document.querySelectorAll('mark.nb[data-a="edge test"]')];
                            const flagged = pieces.every(m => m.classList.contains('has-rec'));
                            const aRec = nbArea('edge test'), aNote = nbArea('test phrase');
                            const recRows = window.eval("nbRows('rec').filter(r=>r.anchor==='edge test').length");
                            if (pieces.length !== 1 || !flagged) {
                                errors.push('[FAIL] a recording crossed by a note was not kept as ONE whole mark (pieces=' + pieces.length + ' flagged=' + flagged + ')');
                            } else if (!aRec || aRec[0] !== 8 || aRec[1] !== 17) {
                                errors.push('[FAIL] the crossed recording\'s span no longer measures as a whole (' + JSON.stringify(aRec) + ')');
                            } else if (window.eval("nbRows('note').filter(r=>r.anchor==='test phrase').length") !== 1) {
                                errors.push('[FAIL] the crossing note was not saved against its own selected text (anchor mismatch)');
                            } else if (recRows !== 1) {
                                errors.push('[FAIL] the crossed recording lost its saved row');
                            } else if (ovP.textContent !== ovText) {
                                errors.push('[FAIL] crossing a recording changed the page text');
                            } else {
                                console.log('   ✅ A note crossing a recording leaves BOTH on screen and saved (recording kept whole, both spans intact)');
                                /* the two items are INDEPENDENT: 📝 Delete takes the note and leaves the
                                   recording (row + flagged pieces) exactly as it was … */
                                nbPress('#pD');
                                const recPieces = [...window.document.querySelectorAll('mark.nb[data-a="edge test"]')];
                                const notesLeft = window.eval("nbRows('note').length");
                                const recsLeft = window.eval("nbRows('rec').filter(r=>r.anchor==='edge test').length");
                                if (notesLeft !== 0 || recsLeft !== 1 || !recPieces.length || !recPieces.every(m => m.classList.contains('has-rec'))) {
                                    errors.push('[FAIL] deleting a note that crossed a recording must leave the recording whole (notes=' + notesLeft + ' recs=' + recsLeft + ' pieces=' + recPieces.length + ')');
                                } else {
                                    console.log('   ✅ 📝 Delete takes only the note — the crossed recording keeps its row and its flagged pieces');
                                    /* …and 🔊 Delete then takes the recording alone, unwrapping the mark */
                                    window.showAnchor('edge test', 20, 40);
                                    nbPress('#pA');
                                    const recMarksLeft = window.document.querySelectorAll('mark.nb[data-a="edge test"]').length;
                                    if (recMarksLeft || window.eval("nbRows('rec').length") || window.eval("nbRows('note').length")) {
                                        errors.push('[FAIL] 🔊 Delete did not remove the recording and its mark once it was the last item (marks=' + recMarksLeft + ')');
                                    } else if (ovP.textContent !== ovText) {
                                        errors.push('[FAIL] deleting the recording changed the page text');
                                    } else {
                                        console.log('   ✅ 🔊 Delete then takes the recording alone and unwraps the mark (page text intact)');
                                    }
                                }
                            }
                        }
                    } catch (e) { errors.push('[FAIL] crossing check threw: ' + e.message); }
                }
            }


        } else {
            console.log('   ⏭  highlight test skipped (no plain-text paragraph found)');
        }

    }


    /* ---- exercise-answer persistence (input.gap / radio / translation textarea) ----
       ansSet→send saves type:"answer" keyed by prompt/stem text; renderAnswers restores it; an
       emptied field deletes its row (no empty-row bloat). */
    try {
        const ansVal = r => JSON.parse(String(r.data || '{}')).v;
        // (1) gap: fill → save → empty → delete
        const gapEl = window.document.querySelector('input.gap');
        if (gapEl) {
            gapEl.value = 'do';
            window.eval('ansSaveEl(document.querySelector("input.gap"))');
            const saved = window.eval('ansRows().filter(r=>r.anchor===ansOf(document.querySelector("input.gap")).anchor)');
            if (!saved || !saved.length || ansVal(saved[0]) !== 'do') {
                errors.push('[FAIL] a filled gap did not save an answer row (v="do")');
            } else {
                console.log('   ✅ a filled gap saves an answer row keyed by its prompt');
            }
            gapEl.value = '';
            window.eval('ansSaveEl(document.querySelector("input.gap"))');
            if (window.eval('ansRows().filter(r=>r.anchor===ansOf(document.querySelector("input.gap")).anchor).length')) {
                errors.push('[FAIL] an emptied gap did not delete its answer row');
            } else {
                console.log('   ✅ an emptied gap deletes its answer row (no empty-row bloat)');
            }
        } else {
            errors.push('[FAIL] no input.gap found for the answer test');
        }
        // (2) radio: pick the first option → save keyed by its stem
        const radioEl = window.document.querySelector('input[type="radio"]');
        if (radioEl) {
            const stem = window.eval('ansOf(document.querySelector(\'input[type="radio"]\')).anchor');
            radioEl.checked = true;
            window.eval('ansSaveEl(document.querySelector(\'input[type="radio"]\'))');
            const rows = window.eval('ansRows().filter(r=>r.anchor===' + JSON.stringify(stem) + ')');
            if (!rows.length || ansVal(rows[0]) !== radioEl.value) {
                errors.push('[FAIL] a picked radio did not save its selection');
            } else {
                console.log('   ✅ a picked radio saves its selection keyed by its question stem');
            }
        }
        // (3) restore: seed one answer row (with its {b,o} tie-breaker) and confirm renderAnswers fills it
        const trw = window.document.querySelector('textarea:not(#feed)');
        if (trw) {
            const info = JSON.parse(window.eval('JSON.stringify((function(){var o=ansOf(document.querySelector("textarea:not(#feed)"));var p=ansPos(o.posEl);return{anchor:o.anchor,b:p?p.b:null,o:p?p.o:null}})())'));
            const row = { id: 'qa_ans_1', type: 'answer', anchor: info.anchor, data: JSON.stringify({ v: 'persisted', b: info.b, o: info.o }) };
            window.eval('layer.push(' + JSON.stringify(row) + ')');
            window.eval('renderAnswers()');
            if (trw.value !== 'persisted') {
                errors.push('[FAIL] renderAnswers did not restore a stored answer into its control');
            } else {
                console.log('   ✅ renderAnswers restores a stored answer into its control');
            }
            window.eval('layer = layer.filter(x=>x.id!=="qa_ans_1")');
            window.eval('renderAnswers()');
        }
    } catch (e) {
        errors.push('[FAIL] answer persistence check threw: ' + e.message);
    }


    /* ---- element-boundary range (drag ending exactly at a block boundary) ----
       The browser sets endContainer to the block ELEMENT; hlRangeNorm must normalize it to a text
       node so the highlight/popup don't falsely read it as a cross-block selection. */
    try {
        const bRes = JSON.parse(window.eval(`JSON.stringify((function(){
            var host = document.querySelector('.content-area p.lead, .content-area p.pt, .content-area td');
            if (!host) return null;
            var w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
            var tn = w.nextNode();
            if (!tn) return null;
            var r = document.createRange();
            r.setStart(tn, 0);
            r.setEnd(host, host.childNodes.length);   /* end ON the element boundary */
            var a = nbAreaOfRange(r);
            return { area: !!a };
        })())`));
        if (bRes && bRes.area !== true) {
            errors.push('[FAIL] nbAreaOfRange fails on an element-boundary range (hlRangeNorm regression)');
        } else if (bRes) {
            console.log('   ✅ an element-boundary range resolves to its block (no false block-crossing)');
        }
    } catch (e) {
        errors.push('[FAIL] element-boundary range check threw: ' + e.message);
    }

    window.close();
    
    return errors;
}

async function main() {
    console.log('🔍 Inglês Abre Portas — QA Smoke Test (jsdom fallback)\n');
    console.log('⚠️  Running in jsdom mode (no real browser):\n' +
                '   • No CSS layout/visual tests\n' +
                '   • No real click/selection fidelity\n' +
                '   • No real media stream (recording mocked)\n' +
                '   • sessionStorage/localStorage mocked\n' +
                '   • External network requests ignored\n');

    const server = createServer();
    const PORT = 8765;

    await new Promise(resolve => server.listen(PORT, resolve));
    const serverUrl = `http://localhost:${PORT}`;
    console.log(`🌐 Local server running at ${serverUrl}\n`);

    // Mock fetch for external requests
    mockFetch();

    const allErrors = [];

    /* SCOPE: business only (owner decision 2026-10-11) — one page, one track, one run.
       Parked until the business build is final: portal.html (login pages), kids/lesson1.html,
       nsfw/lesson1.html. Re-enable by adding their testPage() entry back to this list. */
    for (const [page, track] of [['business/lesson1.html', 'business']]) {
        try {
            const errs = await testPage(serverUrl, page, track);
            allErrors.push(...errs);
        } catch (e) {
            allErrors.push(`[${page}] ${e.message}`);
        }
    }

    server.close();

    console.log('\n' + '='.repeat(50));
    
    if (allErrors.length === 0) {
        console.log('✅ ALL TESTS PASSED');
        process.exit(0);
    } else {
        console.log('❌ TESTS FAILED:\n');
        allErrors.forEach((err, i) => {
            console.log(`  ${i + 1}. ${err}`);
        });
        process.exit(1);
    }
}

main().catch(e => {
    console.error('[FATAL]', e);
    process.exit(1);
});
