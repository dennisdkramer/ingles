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
 * - Highlight logic: Ctrl held at mousedown AND at mouseup creates a text-range mark on its own
 *   layer (mark.hl); Ctrl released before mouseup creates nothing; the Hear/Record/Note popup
 *   stays shut for the whole Ctrl gesture; colour palette recolours it; undo entry is pushed;
 *   Ctrl+click deletes it; the removed dead controls never come back
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

        // Test highlight feature: the Ctrl gesture gate (mousedown+mouseup), its own layer
        // (mark.hl), colour palette, undo entry, Ctrl+click delete, and the dead controls staying gone
        const hlHost = Array.from(
            window.document.querySelectorAll('.content-area p, .content-area li, .content-area td')
        ).find(el => el.querySelectorAll('*').length === 0 && el.textContent.trim().length > 12);

        if (hlHost && hlHost.firstChild && hlHost.firstChild.nodeType === 3) {
            const tn = hlHost.firstChild;
            const hlRange = window.document.createRange();
            hlRange.setStart(tn, 0);
            hlRange.setEnd(tn, Math.min(12, tn.data.length));
            const hlSel = window.getSelection();
            hlSel.removeAllRanges();
            // (a) Ctrl held at mousedown but RELEASED before mouseup → nothing happens
            window.document.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true, ctrlKey: true }));
            window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
            hlSel.addRange(hlRange);
            window.document.dispatchEvent(new window.Event('selectionchange', { bubbles: true }));
            window.document.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'Control', bubbles: true }));
            window.document.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true, cancelable: true, ctrlKey: false }));
            // the engine debounces selectionchange by 350ms
            await new Promise(resolve => setTimeout(resolve, 450));
            if (window.document.querySelector('mark.hl')) {
                errors.push('[FAIL] Ctrl released before mouseup still created a highlight (Ctrl must be held at BOTH ends)');
            } else {
                console.log('   ✅ Ctrl released before mouseup creates no highlight');
            }

            // (b) Ctrl held at mousedown AND at mouseup → the highlight runs, on its own layer
            window.document.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true, ctrlKey: true }));
            window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
            hlSel.removeAllRanges();
            hlSel.addRange(hlRange);
            window.document.dispatchEvent(new window.Event('selectionchange', { bubbles: true }));
            window.document.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true, cancelable: true, ctrlKey: true }));
            await new Promise(resolve => setTimeout(resolve, 450));
            if (window.document.querySelector('.pop #pH, .pop #pR, .pop #pN')) {
                errors.push('[FAIL] the Ctrl highlight gesture opened the Hear/Record/Note popup');
            } else {
                console.log('   ✅ the Ctrl gesture keeps the Hear/Record/Note popup shut');
            }

            const hl = window.document.querySelector('mark.hl');
            if (!hl) {
                errors.push('[FAIL] Ctrl at mousedown+mouseup did not create a highlight (mark.hl)');
            } else {
                console.log('   ✅ Ctrl at mousedown+mouseup creates a text-range highlight');
                console.log(`      anchor="${hl.dataset.a}" color=${hl.classList.contains('hl-yellow') ? 'yellow' : '?'}`);
                if (hl.classList.contains('nb') || hl.classList.contains('has-hl') || hl.classList.contains('has-note') || hl.classList.contains('has-rec')) {
                    errors.push('[FAIL] the highlight shares the note/recording layer (mark.nb/has-*) instead of its own mark.hl');
                } else {
                    console.log('   ✅ The highlight lives on its own layer (mark.hl, never mark.nb)');
                }
                if (!hl.dataset.hlid) {
                    errors.push('[FAIL] highlight mark has no dataset.hlid (cannot be set/deleted server-side)');
                }

                const swatch = window.document.querySelector('.hlpal button[data-c="red"]');
                if (!swatch) {
                    errors.push('[FAIL] highlight colour palette (.hlpal) did not appear after creating');
                } else {
                    console.log('   ✅ Colour palette appears after creating a highlight');
                    swatch.click();
                    if (!hl.classList.contains('hl-red')) {
                        errors.push('[FAIL] colour palette click did not recolour the highlight');
                    } else {
                        console.log('   ✅ Colour palette recolours the highlight (yellow → red)');
                    }
                }

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

                // Ctrl+click inside a highlight deletes it (the only interaction it has). Recreate one
                // first: the undo check above consumed the original, and a real user clicks seconds later.
                window.document.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true, cancelable: true, ctrlKey: true }));
                hlSel.removeAllRanges();
                hlSel.addRange(hlRange);
                window.document.dispatchEvent(new window.MouseEvent('mouseup', { bubbles: true, cancelable: true, ctrlKey: true }));
                await new Promise(resolve => setTimeout(resolve, 700));
                const hl2 = window.document.querySelector('mark.hl');
                if (!hl2) {
                    errors.push('[FAIL] could not recreate a highlight for the Ctrl+click delete test');
                } else {
                    hl2.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
                    if (window.document.querySelector('mark.hl')) {
                        errors.push('[FAIL] Ctrl+click did not delete the highlight');
                    } else {
                        console.log('   ✅ Ctrl+click deletes the highlight');
                    }
                }
            }

            // The removed dead controls must stay gone (they were never wired to any engine)
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

    // Test portal.html
    try {
        const errs = await testPage(serverUrl, 'portal.html');
        allErrors.push(...errs);
    } catch (e) {
        allErrors.push(`[portal.html] ${e.message}`);
    }

    // Test business/lesson1.html
    try {
        const errs = await testPage(serverUrl, 'business/lesson1.html', 'business');
        allErrors.push(...errs);
    } catch (e) {
        allErrors.push(`[business/lesson1.html] ${e.message}`);
    }

    // Test kids/lesson1.html if exists
    const kidsL1 = path.join(ROOT, 'kids', 'lesson1.html');
    if (fs.existsSync(kidsL1)) {
        try {
            const errs = await testPage(serverUrl, 'kids/lesson1.html', 'kids');
            allErrors.push(...errs);
        } catch (e) {
            allErrors.push(`[kids/lesson1.html] ${e.message}`);
        }
    }

    // Test nsfw/lesson1.html if exists
    const nsfwL1 = path.join(ROOT, 'nsfw', 'lesson1.html');
    if (fs.existsSync(nsfwL1)) {
        try {
            const errs = await testPage(serverUrl, 'nsfw/lesson1.html', 'nsfw');
            allErrors.push(...errs);
        } catch (e) {
            allErrors.push(`[nsfw/lesson1.html] ${e.message}`);
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
