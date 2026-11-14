/**
 * qa/menu.mjs — CONTENT_EXAMPLES.md read as an INDEX: the heading grammar, in one place.
 *
 * Three things print the index and none of them may own a copy of the regex: the generation brief
 * (`qa/brief.mjs` step 4), the preview page's nav (`qa/serve.mjs` → `qa/readout.js`), and
 * `node qa/brief.mjs --index=json`. A second copy is how the nav came to list names the file no
 * longer had — and to list one shape twice — while the menu itself read cleanly.
 *
 * An entry is the numbered form, which is the one the conversion is producing:
 *
 *   ### [03] <TEACH|OPTION> <HALF-> What it is and/or does <3|6> <2|4>
 *
 * or the legacy form, still read so the two can sit side by side while entries are converted:
 *
 *   ### `lexiconEntry — one word's record (teaching)`
 *
 * `### Build [Constraints]` is scaffolding under [INSTRUCTIONS], not a shape, and is skipped. What
 * sits inside a block — the figures and the inline marks — is not a second file either: it is
 * `[BUILD]`'s construction rules and the numbered `[INSIDE]` entries at the bottom of this file, so
 * the preview page has a block for each numbered entry and nothing else to be stale against.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MENU = 'CONTENT_EXAMPLES.md';

const SCAFFOLD = /^### (Build \[Constraints\]|\[(GAMES|BLOCKS|VISUALS|IN-BLOCK)\])/;
const NUM_RE = /^### \[(\d+)\]\s+<([^>]*)>\s+<([^>]*)>\s*(.*)$/;
const LEG_RE = /^### `([A-Za-z0-9]+)\s*[—–-]\s*(.*)$/;
const KINDS = '(teaching|training|mixed|games|teach|train)';
/* the one mark an entry can carry in its heading: it stays in the file and out of the builder's index,
   because the shape still needs an update before it can be chosen. Stripped from `what`, so everything
   that prints the entry prints the shape and not the mark. */
const MARK = /^IGNORE - pending updates\s*[—–-]\s*/;

/* `<3|6> <2|4>` — either number may be omitted and the brackets may be absent altogether */
function counts(tail) {
  const m = /^(.*?)\s*<([^>]*)>\s*<([^>]*)>$/.exec(tail);
  return m ? { what: m[1].trim(), items: m[2].trim(), opts: m[3].trim() } : { what: tail.trim(), items: null, opts: null };
}

function shapeAt(line, n, section) {
  const num = NUM_RE.exec(line);
  if (num) {
    const c = counts(num[4]);
    const ignored = MARK.test(c.what);
    return {
      line: n, section, raw: line.trimEnd(), key: '[' + num[1] + ']', num: num[1], name: null,
      anchor: 'item-' + num[1], shape: num[2].trim(), size: num[3].trim(),
      what: ignored ? c.what.replace(MARK, '') : c.what,
      counts: c.items === null ? null : { items: c.items, opts: c.opts }, kind: null, form: 'numbered',
      ignore: ignored
    };
  }
  const leg = LEG_RE.exec(line);
  if (!leg) return null;
  let rest = leg[2].trim().replace(/`\s*$/, '');
  let kind = null;
  const k = new RegExp(KINDS + '\\s*$').exec(rest);
  if (k) { kind = k[1]; rest = rest.slice(0, k.index).trim(); }   // the heading's `(teaching)`, not part of what it does
  return {
    line: n, section, raw: line.trimEnd(), key: leg[1], num: null, name: leg[1],
    anchor: 'item-' + leg[1], shape: null, size: null, what: rest, counts: null, kind, form: 'legacy',
    ignore: false
  };
}

function drafts() {
  /* no draft-only shape remains: every shape in the menu is an entry, so this is always empty. Kept as
     an empty list so a reader written against the old shape of this object keeps working. */
  return [];
}

export function readMenu() {
  const text = fs.readFileSync(path.join(ROOT, MENU), 'utf8');
  const lines = text.split(/\r?\n/);
  const sections = [], shapes = [], unparsed = [];
  /* `## [INSTRUCTIONS]` and `## [BUILD]` are scaffolding, not groups: the entries that follow them are
     the menu itself, not members of an instructions section. `[INSIDE]` is the only real group — the
     four figures a host block draws inside itself, which are never chosen on their own. */
  const NOT_A_GROUP = /^(INSTRUCTIONS|BUILD)$/;
  let section = null, group = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const h = /^## \[([^\]]+)\]/.exec(l);
    if (h) {
      section = { key: h[1], title: l.replace(/^##\s+/, '').trimEnd(), line: i + 1 };
      sections.push(section);
      group = NOT_A_GROUP.test(h[1]) ? null : section.key;
      continue;
    }
    if (!l.startsWith('### ') || SCAFFOLD.test(l)) continue;
    const s = shapeAt(l, i + 1, group);
    if (s) { s.header = headerOf(s); shapes.push(s); } else unparsed.push({ line: i + 1, text: l.slice(0, 100) });
  }
  return {
    file: MENU, bytes: Buffer.byteLength(text), lineCount: lines.length,
    sections, shapes, unparsed, drafts: drafts()
  };
}

/* the header rest, as the page prints it under a block: identity first, then what the shape does.
   The preview page shows the mark, because that page is where the update happens. */
export function headerOf(s) {
  if (s.form === 'numbered') {
    return (s.ignore ? 'IGNORE - pending updates — ' : '') + '<' + s.shape + '> <' + s.size + '> ' + s.what +
      (s.counts ? ' <' + s.counts.items + '> <' + s.counts.opts + '>' : '');
  }
  return s.what + (s.kind ? ' (' + s.kind + ')' : '');
}

