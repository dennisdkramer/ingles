# HANDOFF — context handoffs between sessions
A running note for handing context from one session/task to the next: where the work stands, what is in flight, and what to pick up next. Write here when a session ends mid-work, or when the next session needs context that is not obvious from the files themselves. (Not a task queue — see PENDING.md for the active plan and PARKED.md for the backlog.)

---

# Pronunciation transcription model (L2) — source of truth

Appended 2026-10-31. This is the **final, iterated** model for producing L2 (reduced-speech) respellings. `build-dictionary.js` (the `PHONETIC_WORKSPACE_RULES` prompt + `postProcess` function) currently holds an **earlier iteration** — it must be rewritten to match this document before the next dictionary regeneration. Read this first; treat the canonical examples (§9) as ground truth above any rule wording.

## 1. The voice

Neutral, unplaceable American accent. Boston-born, educated, white; lived TX/CA/GA; fluent AAVE. Speaks **rapidly but clearly enunciates** ("allegro"). **Non-rhotic** in the Boston way: an `r` after a full vowel is not heard (`door` → "doah").

AAVE is a desired future target but currently out of scope — except the notation shape is understood, e.g. `ain't` → `ai[n't]` (the `ai` diphthong is one sound, `n't` is the greyed sandhi).

## 2. Purpose — what grey means

- Grey (`[x]`) is a **negative** marker: "this letter is **not pronounced**, or **not pronounced as written**."
- It is **not** a pronunciation guide. Never respell to *show* a sound; grey what doesn't belong.
- The only respelling is `ə` (schwa), used **only** for a genuine "uh" sound.
- Teaching goal: the student learns **what NOT to pronounce** and how to reduce for natural flowing rhythm — not a phonetic transcription.

## 3. Notation

- `-` syllable break · `[x]` greyed letters · `ə` schwa (genuine "uh").
- Only the word's own letters + `ə`, `[ ]`, `-`. No IPA. **Never drop a letter — grey it instead** (silent `e` → `[e]`).

## 4. Core model — 2-phoneme syllable core

- Each syllable's **core = at most 2 distinct phonemes ("sounds")**.
- A "sound" may span several letters: digraphs (`th`, `sh`, `ch`, `ng`), diphthongs (`ai`, `ou`, `oi`, `ei`), vowel teams (`ea`, `ee`, `oo`, `au`), and tight clusters (`st`, `nd`, `ml`, `mr`, `bl`).
- **CVC is always 3 phonemes, never 2** → one phoneme is always greyed (the weakest / most reduced).

## 5. The algorithm (order of operations) — the key

Per syllable, in order:

1. **Reduce vowels first.**
   - Genuine schwa ("uh") → write `ə` if audible; **grey it** if droppable/weakest ("as if no vowel").
   - Vowel not pronounced as-written, and not a schwa → **grey it** (never respell; *weakness is not sufficient to respell*).
   - **Coloured vowel** (before `r`/`n`/`v`/`l`) → resists reduction, **stays plain**.
2. **Count the surviving audible phonemes.**
   - **≤2** → fits the core → **STOP**. Retained consonants are **not** sandhi-greyed, even if word-final. ("Save the coda from sandhi" is decided by **audibility**, not position.)
   - **>2** → grey the excess, **word-final sandhi consonant first**.
3. Never grey an audible sound. Never drop a letter (grey it).

Consequence: **reduce → then sandhi.** Sandhi only fires on the *excess* that reduction didn't already eliminate.

## 6. Settled rules

1. **Schwa = genuine "uh" only.** Weakness ≠ schwa; not-as-written (and not schwa) → grey. `door` → `do[or]`, never `dər`.
2. **CVC → grey the weakest.** `some` → `s[ə]m[e]` (schwa greyed; `s`+`m` core; silent `e` greyed).
3. **Reduce first, then sandhi.** `even` → `e-v[e]n`: "ven"→"vn" (2 = core) → `n` saved. If the schwa were audible ("vən" = 3), the `n` would be sandhi-greyed.
4. **Coloured vowels** resist reduction. `family` → `fa-m[i]ly`, `camera` → `ca-m[e]ra`.
5. **`r` sandhi depends on the preceding vowel.**
   - Full vowel + `r` → `r` dropped (non-rhotic, "we never hear 'dr'") → grey it. `door` → `do[or]`.
   - Schwa + `r` → schwa droppable ("as if no vowel") → **grey the schwa, keep the `r`**. `understand` → `ən-d[ə]r-sta[nd]`.
6. **`-ing` never sounds like just "i"** — the nasal always survives. Three forms: `ing` (original /ŋ/) · `in[g]` (nasal→`n`, `g` drops) · `[i]n[g]` (`i` drops, `n` stays).
7. **`-thing`** in a compound (unstressed) → `th[i]n[g]` (`th` is **plain/audible**; `i` drops; `n` stays; `g` drops). Standalone `thing` (stressed) → **no grey**.
8. **Never drop a letter.** Silent `e` → `[e]` (`s[ə]m[e]`).
9. **No grey-only syllable.** If a syllable is all-greyed it must **collapse** (lose the hyphen). `going` → `go[i]n[g]`.
10. **Word-final `t` after a vowel is usually inaudible** → grey it. `about` → `…[t]` **always**.
11. **Some words always syllable-reduce** — transcribe the reduced form, not the "correct parse." `different` → `di-ff[e]r[e]n[t]` ("di-frn", 2 syllables), never `di-ffə-rə[nt]`.
12. **`str` is not one sound** — it splits and greys the weak middle: `s[t]r`. `street` → `s[t]ree[t]`.
13. **No respelling beyond the table.** In particular never `s`→`z`, `c`→`k` (except `cc`→`ks`), `x`→`z`/`ks`, `y`→`i`. (`anything` → `ə-ny-…`, `everything` → `ev-ry-…`.)
14. **Respelling table** (exact match only): vowel(s) reduced to "uh" → `ə` · `ough`→`o`/`əf`/`o[ff]`/`u` · `ought`→`ot` · `augh`→`o` (or `af`) · `tion`/`sion`→`xn` · `cient`→`xn[t]` · `sure`→`xr` · `eigh`→`ei` · `igh`→`ai` · `cc`→`ks` · `cious`→`x[ə]s` · `alm`→`[o]m`.

## 7. "Sound"/phoneme definition — STILL OPEN (the unresolved crux)

Not settled. Working hypothesis:
- Diphthong / digraph / vowel team = 1 sound (`ai`, `ou`, `th`, `sh`, `ng`, `ea`, `oo`…).
- Tight 2-consonant cluster = 1 sound (`st`, `nd`, `ml`, `mr`, `bl`).
- 3-consonant cluster with a weak middle = **split** (`str` → `s[t]r`).

Open: the exact boundary between "tight cluster (1 sound)" and "split cluster (multiple sounds)". Hypothesis: *audibility of the middle consonant* decides — unconfirmed.

## 8. Deterministic post-process (code — `postProcess` in build-dictionary.js)

After the model returns L2, apply these (word-shaped and reliable — don't leave them to the model):

1. **`-thing` compounds** (`something`/`nothing`/`anything`/`everything`, word length > 5): force the `thing` suffix to `[thi]n[g]`.
2. **Reverse "spell-the-sound" respellings** (only when the word spells that sound with the original letter): `k`→`c` (word has `c`, no `k`) · `z`→`s` (word has `s`, no `z`) · `gz`/`ks`→`x` (word has `x`).
3. **Warn** (keep, don't reject) about any letter still foreign to the word.

## 9. Canonical examples (ground truth)

| word | L2 | why |
|---|---|---|
| because | `b[ə]-cə[se]` | `be`→weak schwa; `au`→`ə` (genuine "uh" of "cuz"); `se` sandhi |
| something | `s[ə]m[e]-th[i]n[g]` | schwa greyed (CVC excess); silent `e` greyed; `th` plain; `i`/`g` greyed; `n` kept |
| thing | `thing` | standalone, stressed → no grey |
| nothing | `nə-th[i]n[g]` | `no`→`nə` (2-core, schwa plain) |
| anything | `ə-ny-th[i]n[g]` | `y` kept (no `y`→`i`) |
| everything | `ev-ry-th[i]n[g]` | `y` kept |
| going | `go-in[g]` / `go[i]n[g]` | `-ing` nasal survives; collapsed form drops the hyphen |
| meeting | `mee-tin[g]` / `mee-t[i]n[g]` | `-ing` nasal survives |
| doing | `do-in[g]` / `do[i]n[g]` | `-ing` nasal survives |
| understand | `ən-d[ə]r-sta[nd]` | schwa greyed (droppable), `r` kept (audible "dr"); `nd` sandhi |
| about | `ə-bo[u][t]` / `ə-b[ou][t]` / `ə-b[ə][t]` | `t` **always** greyed; vowel grey depends on actual sound |
| different | `di-ff[e]r[e]n[t]` | always "di-frn" (2 syllables) |
| even | `e-v[e]n` | reduce "ven"→"vn" → `n` saved from sandhi |
| government | `gə-v[e]r[n]-m[e]n[t]` | follow the sounds |
| probably | `prə-b[ab]ly` | prefer this; non-natives can't do `bly` as one phoneme |
| actually | `ac-t[u]a-lly` | `t`→ch still "corresponds"; `u` greyed (unconnected) |
| exactly | `e[x]-a[ct]-ly` | current acceptable; target `e-[x]a-c[t]ly` (see §10 — do **not** risk changing logic) |
| door | `do[or]` | `oo`→`o`; `r` non-rhotic greyed ("doah") |
| street | `s[t]ree[t]` | `str`→`s[t]r`; final `t` sandhi |
| to (+consonant) | `t[ə]` | schwa drops in "t'go" |
| ain't | `ai[n't]` | AAVE sample: `ai` diphthong = 1 sound; `n't` sandhi |
| comfortable | `co[mf]-tə-bl` | `-for-` collapses → `mf` greyed |
| every | `ev-ry` | `e` of `-er-` drops; `y` kept |
| family | `fa-m[i]ly` | `ml` = one sound |
| camera | `ca-m[e]ra` | `mr` = one sound; final `ra` as-written (no `ə`) |
| police | `pə-li[ce]` | `o`→schwa; `ce` sandhi |

## 10. Open questions / low-priority

- **`exactly`**: precise target is `e-[x]a-c[t]ly` (the /gz/→"z" derives from `x`, which is greyed; `a`/`c` clearly heard; `t` drops). Current logic yields `e[x]-a[ct]-ly`, which is acceptable. **Do not alter the logic for this one word if it risks regressing any good output.**
- **"Sound" definition** (§7).
- **AAVE** integration (future; §1).

