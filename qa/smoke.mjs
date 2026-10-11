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
 *   recolours it; it pushes an undo entry; Ctrl+click on the painted rectangle deletes it; a
 *   highlight may cross a note/recording and BOTH stay whole (the two layers never interact);
 *   the removed dead controls never come back
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

            /* (d) undo entry */
            let undoOk = null;
            try {
                const before = window.eval('undoStack.length');
                window.eval('doUndo()');
                undoOk = before > 0 && window.eval('undoStack.length') === before - 1;
            } catch (e) { undoOk = null; }
            if (undoOk === true) {
                console.log('   ✅ Highlight pushes an undo entry (consumed by undo)');
            } else if (undoOk === false) {
                errors.push('[FAIL] highlight did not push a usable undo entry');
            } else {
                console.log('   ⏭  highlight undo check skipped (undoStack not inspectable)');
            }
            try { window.eval('hlList=[]; hlReflow()'); } catch (e) {}
            /* (e) a note/recording mark and a highlight may intersect: BOTH stay whole, nothing is
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

                /* (f) Ctrl+click on the painted rectangle deletes the highlight, not the note */
                await new Promise(resolve => setTimeout(resolve, 700));   /* hlJustRan guard = 600ms */
                const r0 = rects()[0];
                if (!r0) {
                    errors.push('[FAIL] no painted rectangle to Ctrl+click for the delete test');
                } else {
                    const cx = parseFloat(r0.style.left) + parseFloat(r0.style.width) / 2;
                    const cy = parseFloat(r0.style.top) + parseFloat(r0.style.height) / 2;
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

            /* (g) the removed dead controls must stay gone (they were never wired to any engine) */
            const dead = ['bPrac', 'bQuiz', 'sendTr', 'done', 'mNext', 'mIndex', 'modeToggle', 'mute']
                .filter(id => window.document.getElementById(id));
            if (dead.length) {
                errors.push('[FAIL] removed dead controls are back in the page: ' + dead.join(','));
            } else {
                console.log('   ✅ no dead controls in the page (bPrac/bQuiz/sendTr/done/mNext/mIndex/modeToggle/mute)');
            }
        } else {
            console.log('   ⏭  highlight test skipped (no plain-text paragraph found)');
        }

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
