/**
 * qa/demo.mjs — THE ONE DEFINITION OF A DEMO FOLDER.
 *
 * A demo folder says so itself: `<dir>/track.json` holds `{"demo": true}`. Its pages are opened by anyone
 * with no login, so they are not a track of the book — not in the index, not in lessons.json, and not
 * audited by any harness. Every reader asks this function rather than holding a list of names, so a
 * second demo folder excludes itself without an edit anywhere.
 *
 * An unreadable or absent marker is NOT a demo: a track whose track.json is broken is audited as usual,
 * because a silent skip is how a broken track would stop being noticed.
 */
import fs from 'fs';
import path from 'path';

export function isDemo(root, dir) {
  try {
    const t = JSON.parse(fs.readFileSync(path.join(root, dir, 'track.json'), 'utf8'));
    return !!(t && t.demo);
  } catch (e) { return false; }
}
