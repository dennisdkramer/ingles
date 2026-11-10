# PENDING — Adherence.md [BATCHING] for current task


## [22] - why a literal double-brace reached a committed .md, and the guard against it (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"try to figure out why that happened and make sure it doesnt happen again"> <the render path that makes a .md fatal, and the QA surface a guard has to join> DONE
   - [S1] - the render path read off the failing build's own log <the annotation text of Pages run 620> DONE - every .md is a Jekyll page there: the log shows "Rendering Markup: FORMAT.md", "Rendering Layout: FORMAT.md / Layout source: theme" and, for the file that carries Liquid, "Rendering Liquid" — Liquid reads the raw text and Kramdown converts afterwards
   - [S2] - the QA surface read at source <qa/run.mjs MEMBERS, package.json scripts, VERIFICATION.md, PENDING.md [HANDLING]> DONE - a member is one file plus a scope flag plus a one-line description; 34 tracked .md and not one member opens them; no .github directory, core.hooksPath unset, so nothing ran before a push
### [B2] - the cause <"try to figure out why that happened"> <the chain from one token in the shell to a dead build> DONE
   - [S1] - where the token came from <the [19] line that carried it, against the vocabulary in _shell.html and FORMAT.md:6> DONE - the line recorded the placeholder sweep of business/lesson40.html, and the sweep was named with the shell's own opener, copied from the TRACK_TITLE-style names in `_shell.html` and FORMAT.md:6 and kept without its closing half. A token that is correct where it lives became a syntax error the moment its other half was dropped for brevity.
   - [S2] - why nothing local caught it <what each harness reads, and what my own loop did that turn> DONE - content and overflow read .html, games4 and live read the engines, provenance reads the ledger, landing reads index.html: not one of them opens a .md, and the only process that parses .md is the GitHub build, which runs after the push. My loop pushed twice and never asked the API whether the build succeeded, so the first report of the failure came from the owner.
   - [S3] - why the code span did not protect it <the order of the two passes> DONE - the backticks are Kramdown syntax applied AFTER Liquid: to Liquid they are ordinary characters wrapped around an opener. That is also why FORMAT.md:6 has survived five closed tokens in code spans while the single unclosed one killed the build.
### [B3] - the guard <"make sure it doesnt happen again"> <a check that fails on this defect alone, wired where a build already looks> DONE
   - [S1] - qa/liquid.mjs written <every .md Jekyll renders, scanned for a Liquid opener that no closer balances, naming file:line> DONE - FAIL on an unclosed opener, on an unclosed raw block and on a tag Liquid does not know; WARN on a closed token, which is legal but publishes as a blank; raw spans are jumped whole. Scope is `git ls-files`, the published set, and named paths replace it for a falsification run.
   - [S2] - registered where this repo keeps checks <run.mjs MEMBERS, a package.json script, a VERIFICATION.md bullet and its count> DONE - a `liquid` member with scope ✗ in qa/run.mjs, `npm run qa:liquid` in package.json, and VERIFICATION.md reading "Seven checks" with its own bullet
   - [S3] - falsified against the real breaker <the 74136eb text must fail, today's tree must pass> DONE - `--selftest` 6/6, including the verbatim 74136eb line as 1 fail; the committed PENDING.md of 74136eb read by name fails at its own line 75 (the entry sat higher then); today's 34 tracked .md give 33 clean and exit 0, with FORMAT.md's five closed tokens as warnings
   - [S4] - the rule written where the token was written <PENDING.md [HANDLING] and the pre-push gate> DONE - a [HANDLING] bullet against unclosed openers with the raw-block escape, a [GUIDELINES] bullet saying a push is not a publication and naming the check-runs URL, and `.githooks/pre-push` in LF with the exec bit, enabled by `core.hooksPath`: proved to refuse a staged broken .md with exit 1 and to pass the clean tree with exit 0, then proved again on its first real push. `.gitattributes` pins `.githooks/*` to eol=lf, because this machine's core.autocrlf=true announced it would rewrite the hook to CRLF on the next touch and sh refuses a CRLF shebang — the gate would have evaporated at the next checkout.


## [15] - block kind, charts demoted to an in-block class, solid edges, a width default per entry (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"does the 'dialog' vehicle have an .itemwidth attribute by default? …do all of these have pre-determined itemwidths?">
   - [S1] - `itemwidth` looked for across every .md/.css/.js/.mjs/.html <0 hits> <the real vocabulary is `.itemsize` / `-half` / `-third` / `-twothird`, styled at style.css:205-211>
   - [S2] - how a width is decided today, read at source <FORMAT.md [GENERATION] a-e, and the entries' `fits` prose> <no entry carried a machine-readable slot, so no vehicle had a default; `dialog` included>
   - [S3] - `## [MIXED]` found MISSING while reading the categories <it had been swallowed by the drop script in [13], which rebuilt the menu from entry bodies and so deleted a heading that sat between two entries> <restored verbatim (`## [MIXED] TEACHING/training`) before `twoWordVerb`; TEACHING 7 · MIXED 13 · TRAINING 20 · GAMES 13 = 53>
### [B2] - the stylesheet <"change the dashed line outline on the activity blocks to solid … add a shadow">
   - [S1] - `.panel` dashed → solid, same colour, `4px 4px 0` hard shadow added <`--edge` carries the colour so a kind can override it>
   - [S2] - block kind: `data-kind="teaching"` → ink edge, `"mixed"`/`"training"` → the new `--orange`, untagged → the neutral tan <`.card`, `.game`, `.dialog` moved onto `--edge` too, so the tag works on every block container>
   - [S3] - `.chart` demoted: inside a block it drops its own frame and shadow; a chart standing alone (older lessons) keeps both <the comment that read "A CHART IS A BLOCK" rewritten>
### [B3] - the page
   - [S1] - 15 chart wrappers (`div.chartblock`) turned into real blocks (`.panel`), header + chart inside <"demote charts to an in-block class and wrap it with the same outline as the other blocks">
   - [S2] - 65 blocks tagged with their vehicle's kind <8 teaching · 25 mixed · 32 training — the tag is the menu's `## [...]` category, never a second opinion>
   - [S3] - a bare `itemsize` removed from 14 blocks that are children of an `.itemrow`, where the row decides the width <it claimed full width inside a half>
### [B4] - the entries and the docs <"whats the best option for giving them a default, but making sure that generation knows to resize them based on the lengths of the phrases">
   - [S1] - 53 `**width**` lines, each derived from its own entry's `fits` line (the slots it allows) plus the width its block actually has on the page (the slot it starts at) <full 36 · half 10 · third 3 · twothird 4>
   - [S2] - FORMAT.md: [GENERATION] l) the kind tag, m) width = default + MEASUREMENT, n) solid edge and shadow; i) and the `.chart` class line rewritten <the rule a build reads>
   - [S3] - CONTENT_EXAMPLES.md [INSTRUCTIONS]: one bullet for the `**width**` field
   - [S4] - five `markup` lines that still described a bare `.chart` as the block <signalTable, soundGrid, collocationMatrix, genreDoc, formFill>
### [B5] - verify
   - [S1] - qa/examples.mjs gained three invariants — every entry names a width slot, every block carries its vehicle's kind, no chart stands where a block belongs <9/9>
   - [S2] - the stylesheet stamp bumped in index.html (77783f5ff4 → 0b82c6b681) <qa/landing.mjs fails on a stale stamp; all landing checks pass>

## [14] - block letters and horizontal pairing on preview-blocks.html, and the notes that landed after [13] (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"blocks in the same vehicle pair together horizontally if they are smaller widths. Make sure all these blocks get a letter header"> <the corpus convention, then the page's own block inventory>
   - [S1] - the lettered-block rule read at source <FORMAT.md:13> <how a block header is written and where it sits> DONE - `A. ` + title in an `<h3>`, inside-top, restarting at A in every section
   - [S2] - a built lesson read for the pairing markup <adult/lesson1.html:50-60, style.css:204-214> <`.itemrow[data-cols]` with `itemsize-*` children> DONE - third+twothird and half+half both already have CSS
### [B2] - letter and pair every block <the ask> <54 sections: 40 vehicles + 14 drafts>
   - [S1] - 65 letter headers on 40 vehicles, restarting at A per vehicle <a block with its own `<h3>` keeps that title and gains only the letter> <no block carries two headers>
   - [S2] - six vehicles paired on one row: twoWordVerb, contextFit, wordFamily, signScan, measureLocal, barCount <the sub-full blocks of a vehicle sit side by side>
   - [S3] - chart blocks wrapped in a `chartblock` div so the header has somewhere to sit <a `.chart` cannot hold an `<h3>`> <15 charts lettered, table width class moved to the wrapper>
   - [S4] - drafts left alone <their `dim` lines already annotate each panel with its width> <no clash with A./B.>
### [B3] - the notes written after [13]
   - [S1] - contextFit: both blocks half width <note> <bank + situations on one row; entry's `fits` rewritten>
   - [S2] - lineRepair: the dropped/blended block deleted <note> <the pair is the whole display; `best for` / `does` / `markup` rewritten>
   - [S3] - ruleCard: the three lines +4pt <note> <22px on each; entry's `markup` states it>
   - [S4] - formulaFrame: the frame becomes the header <note> <`<h3>A. I'd rather ___ than ___ .</h3>`; the duplicate line removed; entry rewritten>
   - [S5] - soundGrid: X and TI tagged Portuguese, no parenthesis <note> <`<b><i lang="pt">X</i></b>`; `:lang(pt)` italicises it; no colour, because that would recolour every Portuguese gloss in the corpus>
   - [S6] - chatSample renamed to `dialog` <note> <6 hits in CONTENT_EXAMPLES.md, 2 in qa/NOTES.md, 6 in the page, all counted before and after>
   - [S7] - infoGap: the `them` facts block deleted, the ask panel takes the `them` header <note> <A. you + B. them; entry rewritten>
   - [S8] - the stale `chunkBank → delete` note dropped <it named a vehicle that was renamed to contextFit, which this same batch asks to change, not delete> <reported, not silently applied>
   - [S9] - emphaticBeat: the explainer its own `fits` demands <a request left from [9] that the page never showed> <a `.card` stating the pattern with two marked readings, half width, beside the items; entry rewritten>
### [B4] - verify
   - [S1] - order, balance, links <54/54 sections, divs 591/591, 0 dangling jump-links, 0 order mismatches> <qa/examples.mjs 6/6>

## [GUIDELINES]
- Requested changes are committed and pushed when done by default. For any changes that are not pushed, the user must be notified at Turn completion.
- Avoid rapid successive pushes when a single combined push would do — build markers, a live-site curl or a fixed sleep are tools reached for when the risk of an undetected deploy problem is real, not mandatory steps after every push.
- A push is not a publication: GitHub builds the site after it, and a build that fails leaves the PREVIOUS deployment serving while the push reports success. Before any push that touches a `.md`, run `node qa/liquid.mjs` (the pre-push hook runs it too, and `--no-verify` is how that guard was skipped on 2026-11-10). After any push that changes what the site serves, read the Pages run for that commit — `https://api.github.com/repos/dennisdkramer/ingles/commits/<sha>/check-runs` — and a `failure` at the step "Build with Jekyll" means the change is not live, whatever `git push` said.


## [HANDLING]
- For each completed [Sn], replace `[Sn]` with `[Sn] DONE - <date> - <which files it modified>` and begin work on the following `[Sn]` or the first `[Sn]` in the following `[Bn]`.
- For each completed [Bn] (or when all [Sn] within it are marked `DONE` and/or `STALE`, replace `[Bn]` with `[Bn]- DONE`.
- For any [n], [Bn], or [Sn] that no longer conforms to the current plan or user intent, or is otherwise judged as stale, it is marked `STALE`.
- At the start of each turn when its batches are written, any [n],[Bn],and or [Sn] remaining in [CURRENT] are read. For each that is not marked `DONE` or `STALE`, it is presented to the user as a choice to a) merge with current turn's batches, b) migrate to PAST_BATCHES.md, or c) delete.
- When all [Bn] within any [n] are [completed and/or marked `DONE` and/or `STALE`], all content within section [n] is cleared, and [n] is migrated and appended to PAST_BATCHES.md.
- For any [change in plans] or [deviation from the batching/order in pending.md] You must - Update any relevant [[n] and/or [Bn] and/or [Sn]] to reflect the change(s) and add `- UPDATED <The user's original plan for that item><Why the change occurred>` to each of them.
- Read only the active `### [Bn]` batch section unless [its completion] or [user instruction] mandates reading its siblings.
- Never write an unclosed Liquid opener in this file or any other `.md` — two opening braces, or a brace plus a percent sign. Every `.md` here is rendered as a Jekyll page and Liquid parses it BEFORE Markdown, so a code span is no protection; [19] killed the Pages build exactly this way and the site kept serving the old list. To show a token, put it in a raw block or leave a character between the braces, and run `node qa/liquid.mjs` before the push that carries it.

Author ([n]=(Prompt], [Bn]=(Batch),[Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [n] - <1 line summary of user prompt>` 
`### [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
`   - [Sn] - <the distinct goal unique to this step> <the File & Section name of the rules which are most relevant> <exit condition>`

# [CURRENT] Prompt - (Active batches, newest first)


## [21] - the owner still cannot see lesson 40 in the live site's list (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"i still dont see it in the list on the live site"> <what the deployed landing reads, and every filter between the file and the screen> DONE
   - [S1] - the landing's list path read at source <index.html: LESSONS fetch, its cache, per-track rendering, any grant/progress cap> DONE - index.html:332 refetches lessons.json with cache:"no-cache" and overwrites the cached copy at index.html:311 before the validated paint, so a browser cache cannot hold a stale list for long; no count cap in the render path
   - [S2] - the deployment shape confirmed <which branch/folder Pages serves, any CNAME, the live base URL> DONE - public repo, default branch main, has_pages true, no CNAME, no .nojekyll; source = main root, built by the legacy "pages build and deployment" workflow
### [B2] - what the server actually returns <"the live site"> <the deployed lessons.json and index.html, compared with the local files> DONE
   - [S1] - the live lessons.json fetched and inspected for business n=40 <read-only> DONE - live is 8163 bytes with business 38 -> 41 (no 40); raw.githubusercontent main is 8233 bytes WITH n=40 "Sore Muscles, Sore Loser" - the push landed, the deploy did not
   - [S2] - the live index.html checked for the same COUNTS/cache logic as local <read-only> DONE - live is 39152 bytes against 39727 locally, and that gap is LINE ENDINGS, not a version gap: the local index.html carries 575 CRLF breaks over 575 lines, so the deployed LF copy is 575 bytes shorter plus 165 bytes of multibyte. The stale-deploy evidence is the 404 on business/lesson40.html and the deployment sha pinned at f65688f, never the size.
### [B3] - the verdict <a named cause, and a fix only where it serves the standing "make it accessible" instruction> DONE
   - [S1] - the failed deploy named <Actions run 42893167700 check runs; deployments pinned at f65688f> DONE - pages run 620 on 87723a6 and run 619 on 74136eb both concluded failure at step "Build with Jekyll"; the last good deployment is f65688f at 18:43
   - [S2] - the breaker found <the annotation log is truncated, so the whole md set was grepped for Liquid openers> DONE - PENDING.md line 95 carried a literal double-brace inside a code span; Liquid runs before Markdown, so Jekyll parsed it as an unterminated variable. Removed. FORMAT.md line 6 is not a breaker: its braces are terminated, so they render as empty strings.
   - [S3] - the fix verified on the host itself <push 9a80b0b, Pages run 42893814399> DONE - build job succeeded at 20:17:47, deployment 7693186343 published sha 9a80b0b at 20:18:01; live lessons.json is now 8233 bytes carrying n=40 "Sore Muscles, Sore Loser" and live business/lesson40.html returns the page with that h1


## [20] - lesson 40 added to the lesson list and reachable from the landing (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"run the json that adds the new lesson to the lesson list and makes it accessible"> <which artifact owns the list, what writes it, what gates access> DONE
   - [S1] - the generator read at source <build-lessons.mjs, and what it reads/writes> DONE - `build-lessons.mjs` walks every track folder's `lesson<N>.html`, takes the title from the `content-area` `<h1>`, and writes `lessons.json`, `tracks.json` (with each track's `count`), index.html's `COUNTS` fallback and the stylesheet stamp
   - [S2] - the outputs and the gate confirmed <lessons.json shape, tracks.json count, access.json, how index.html builds each lesson link> DONE - `index.html` fetches `lessons.json` + `tracks.json`; `access.json` holds only the teacher list, so nothing else gates a track; the lesson link is built as `track/lesson<N>.html`
### [B2] - run it <"run the json that adds the new lesson to the lesson list"> <the regenerated list carrying business/lesson40> DONE
   - [S1] - the generator executed and its output checked for lesson 40 <the repo's own npm script> DONE - `node build-lessons.mjs` exit 0; lessons.json written {"business":49}; index.html COUNTS business 48 -> 49
### [B3] - confirm reachable <"makes it accessible"> <evidence that the landing's data now includes lesson 40> DONE
   - [S1] - the lesson's entry and the track count verified in the generated data <no lesson page is read> DONE - `lessons.json` business carries {"n":40,"title":"Sore Muscles, Sore Loser"}; `tracks.json` business count 49; index.html gained only the COUNTS line (stylesheet stamp unchanged)


## [19] - business lesson 40 authored from the owner's idea cloud alone, then committed and pushed (2026-11-10)
### [B1] - the page's own design <"author the page just from the reference material and creativity"> <a concept spine, a block plan and a vocabulary inventory, drawn from the idea cloud plus the docs already read> DONE
   - [S1] - the reference layer read at source for the markup and the answer paths <style.css as implementation (2.a); engine1/engine2's radio and `input.gap` handling; no lesson page, no CONTENT_EXAMPLES.md, no roadmap, no register> DONE - style.css 64-273, engine2 76-152 and its key lines; block = `.panel`/`.card`/`.dialog`/`.game` with h3 first, `.itemrow` + `itemsize-*`, `.qgrid` > `.qitem` > `.qline`+`.qopts`
   - [S2] - the spine fixed: three concepts, the vocabulary inventory, one question per item, the band 0-12% Portuguese <PEDAGOGY-MAP [AUTHORING] k), s), t), u) and [LEVEL] x)> DONE - 10 sections, 22 blocks; concepts `duration-for-since`, `concession-even-though`, `quantity-shortfall`; 21 taught items, each its own quiz question; 4 graded elements Portuguese (justified glosses), inside the 0-12% band
### [B2] - the page <"overwrite the existing lesson (do not read it)"> <business/lesson40.html and its byte-identical .edit.html sidecar> DONE
   - [S1] - business/lesson40.html written on _shell.html with the owner's placeholders, no lesson page read <FORMAT.md a)-n)> DONE - 40423 bytes, 11 h2 (10 sections + #feed), 22 h3, 125 radios, 31 gaps; div 205/205, table 6/6, no double-brace placeholder left
   - [S2] - the sidecar copied byte-for-byte <FUNCTION [CONTENT]: every lesson ships a full-copy sidecar> DONE - SHA256 equal to the page
### [B3] - ship <"commit and push when done"> <a pushed commit carrying the page, the sidecar and this tracker> DONE
   - [S1] - `git add`, `git commit`, `git push` and the remote's answer recorded <the repo's own branch> DONE - main, origin github.com/dennisdkramer/ingles; only the page, its sidecar and this tracker staged


## [18] - business lesson 40 authored from the owner's idea cloud, with BUSINESS-ROADMAP.md and BUSINESS-REGISTER.md EXCLUDED by instruction (2026-11-10)
- STALE (2026-11-10) - the owner made the exclusion absolute, added CONTENT_EXAMPLES.md to it and disabled QA; superseded by [19]. [B1]-[B3] here are not executed and are not to be executed.
### [B1] - PRE-PROMPT RESEARCH <"open pedagogy_map.md and author lesson 40 in the business track but EXCLUDE BUSINESS-ROADMAP.md and BUSINESS-REGISTER.md from the inputs"> <the build contract verified from its own source, not from memory> IN PROGRESS
   - [S1] - PEDAGOGY-MAP.md read whole <[GENERATION] 1-5, [BUILD] HIGH PRIORITY, [AUTHORING] e)-k), [Claims/practice/budget], [Vehicles], [LEVEL] x)-aa)> DONE - 107 lines; the lesson-40 band is 0-12% Portuguese, floor clamped at 0
   - [S2] - FORMAT.md read whole <skeleton and placeholders, block lettering, slot widths a)-e), `data-kind` l), `data-move`, the mechanical MUSTs> DONE - 67 lines
   - [S3] - FUNCTION.md [CONTENT] read <answers persist only on `input.gap`, radio and a non-feed textarea; `data-retry`; `data-say`> DONE - lines 4-10, rest of the file is runtime and not read
   - [S4] - _shell.html placeholders confirmed <TRACK= business, L=40, TRACK_TITLE, TRACK_UPPER, LESSON_TITLE> DONE - 37 lines
   - [S5] - CONTENT_EXAMPLES.md `###` headings listed, then only the chosen vehicles' own line ranges read <2.b: the menu, never a `####` draft> IN PROGRESS
   - [S6] - qa/lang.mjs and qa/provenance.mjs read at their own definitions <the two self-checks the build must run on this one page, and what each actually reads> IN PROGRESS
   - [S7] - CONFLICT TO THE OWNER: provenance.mjs takes this lesson's `range`, its concept pids and its `- Vocabulary:` coverage from BUSINESS-ROADMAP.md, so a build forbidden to read that file cannot write a record that passes <the exclusion is the owner's instruction, so the record's form is the owner's call, not the build's> AWAITING USER
### [B2] - the lesson page <"author lesson 40 in the business track", voice = a 30-year-old male athlete who likes science, content = the owner's idea cloud> <business/lesson40.html + byte-identical business/lesson40.edit.html> NOT EXECUTED
   - [S1] - the design fixed before markup: the concept spine drawn from the cloud, each block assigned a vehicle, a slot and a move <PEDAGOGY-MAP [BUILD] b)-d), [AUTHORING] k), s), u); FORMAT e) 1-3> NOT EXECUTED
   - [S2] - the page written on the shell, every string in the athlete's voice, band 0-12% Portuguese <PEDAGOGY-MAP [AUTHORING] e), x)-z); FORMAT a)-n)> NOT EXECUTED
   - [S3] - the sidecar written as a byte-identical copy <FUNCTION [CONTENT]> NOT EXECUTED
### [B3] - verify this one page <VERIFICATION.md: a build runs two checks on itself> <green `lang` + the provenance verdict reported> NOT EXECUTED
   - [S1] - `node qa/lang.mjs --track=business 40` <the page's own voice against the band> NOT EXECUTED
   - [S2] - `node qa/provenance.mjs --track=business 40` <the record, its hashes, the span, the concept marks, the quiz coverage> NOT EXECUTED
   - [S3] - `node qa/content.mjs --track=business 40` <engine load, one #feed, `.listen` `data-say`, anchored controls, no console errors> NOT EXECUTED


## [17] - design A for block widths (narrow-first + structural measurement): the plan only (2026-11-10)
### [B1] - the decision recorded <"2. i said go with A" corrects "lets go with a", which had been read as the field question (a)> <design A is the chosen approach; whether the `**width**` field returns is [B2]'s question, not a settled removal> NOT EXECUTED - plan and question only, no edits
   - [S1] - A restated: a block starts at its narrowest allowed slot and grows one step only when a structural element does not fit; prose is excluded because it wraps <the three designs came from last turn's [B1]> NOT EXECUTED
### [B2] - the one new piece of data A needs: the width field <"im thinking we put a "width: #" field that appends to the markup line of each vehicles entry in CONTENT_EXAMPLES.md and corresponds to the AVAILABLE WIDTH OPTIONS for that vehicle">
   - [S1] - a `**width**` field on the `markup` line, per the owner <it belongs to the block, not to the vehicle> NOT EXECUTED
   - [S2] - the multi-block case: one vehicle may own 1..n blocks, so the value has to express a slot per block AND which blocks share a row <the owner's question "a lot of the vehicles are more than one block, how do you think we should deal with that?"> DONE - 40 vehicles, 65 blocks, 9 distinct shapes: `full` 18 · `half+half` 5 · `full | full` 5 · `half+half | full` 4 · `twothird+third` 3 · `third` 2 · `half` 1 · `third+twothird` 1 · `third+third+third | full` 1 (26 of 40 vehicles have no row at all, so the common value is one token)
   - [S4] - THE OWNER'S GRAMMAR: `+` joins the vehicle's blocks in order; a single slot or `<slot>->` per block; no per-row token <"twowordverb Im going to mark the vehicle as half+half. registercontrast full+full. pronlab half+half+full. infogap third+twothird. Formfill Im gonna mark half->">
   - [S4a] - WHY ONE OPERATOR SUFFICES: a row's slots must sum to the row (FORMAT [GENERATION] e), so the row breaks fall OUT of the arithmetic - a row is closed the moment its slots reach 100% <checked against the owner's five examples and against the page: `half+half` = one row (twoWordVerb) · `full+full` = two rows (registerContrast) · `half+half+full` = [half half][full] (pronLab) · `third+twothird` = one row (infoGap) · `third+third+third+full` = [third third third][full] (songStructure). All five parse correctly with no separator, which is the evidence the rule is right.> CONFIRMED BY OWNER
   - [S4b] - `<slot>->` = the default the page uses, and the block may grow in steps as far as full (100%) <"yeah the arrow means up to 100% in steps"> CONFIRMED BY OWNER
   - [S4c] - THE GRAMMAR IS WRITTEN DOWN in FORMAT.md [GENERATION] m), so the owner authors values against a spec and not against a chat message <text only; no entry carries a field yet> DONE
   - [S5] - the prose widths come OUT of the `markup` line once the field exists <"if its already in the markup, once i define it according to this plan, you take that part out"> CONFIRMED BY OWNER - not yet executed
   - [S6] - the pairing is BINDING and a lesson may NOT break a single block out; a lone block uses a single-block vehicle or a primitive <"i think its better if the lessons CANT break single blocks out. we will make sure to include single block vehicle primatives."> RESOLVED BY OWNER
   - [S6b] - primitives do not exist yet: the only single-block vehicles are the 21 that own one block by design, so a lesson needing a lone chart or a lone item list has no vehicle to call <needs a decision when the first lesson wants one> AWAITING USER
   - [S7] - awaiting the owner: the `**width**` value for each of the 40 block-bearing vehicles <the owner is authoring them; nothing is generated until they land> AWAITING USER
   - [S6a] - correction of record: 21 of the 40 vehicles own ONE block (not 22 multi-block) - `full` 18, `third` 2, `half` 1 - and 19 own more than one, so the field is authored per vehicle, never derived from block count <"They are conceptually different, which also allows them to default to completely different sizes"> 
   - [S3] - option ii (parse `fits`) and option iii (a ladder per category) retired <the owner has chosen the field> NOT EXECUTED
   - UPDATED the earlier "allowed slot range, source undecided (i/ii/iii)" → a field appended to the markup line, because the owner chose it and because a vehicle-level range cannot say what its second and third blocks are
### [B3] - the measurement A's growth rule uses <"the rest of the content is tiny" is the case a line-based measure gets wrong> <NOT EXECUTED>
   - [S1] - structural content defined per vehicle kind (table cells, longest option, longest label, input count) and prose explicitly excluded <FORMAT.md [GENERATION] e already states the exclusion; A is what enforces it> NOT EXECUTED
   - [S2] - the measuring tool: headless Chrome over CDP, proven on this page in [16 B1 S3], not a Node character-width table <the build calls it; the same call becomes the harness> NOT EXECUTED
### [B4] - apply, then enforce <NARROWED by [B2 S4]-[S6]: the ladder fixes every slot, so A is no longer a chooser - it may only grow a block the entry marks `->`, and only as far as 100%>
   - [S1] - preview-blocks.html rebuilt from the ladder in each entry, with a per-vehicle report of every block whose width moved <the 21 single-block vehicles and the 19 paired ones, each checked against its own value> NOT EXECUTED
   - [S2] - a harness that fails when the page disagrees with the ladder (a missing row, a block outside its stated slot, a row that does not sum to 100%), and that reports any `->` block whose content overflows its default <it no longer judges a width, it compares one against the authored value> NOT EXECUTED
   - [S3] - published lesson pages, as a separate pass after the preview page is approved <8 lesson files, untouched so far> NOT EXECUTED


## [16] - "lets go with a": the width field removed entirely, flex equal heights, games purple (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"lets go with a"> <verified anchors for every revert site, and the cause of the unequal heights named> DONE - measured in headless Chrome, not guessed
   - [S1] - the 53 `**width**` lines, the `[INSTRUCTIONS]` bullet and `FORMAT.md m)` located and counted <CONTENT_EXAMPLES.md:44+, :8; FORMAT.md:65> DONE - 53 / 1 / 1, no anchor from memory
   - [S2] - the 14 `itemsize` classes removed last turn re-located <qa/preview-blocks.html> DONE - and the count was wrong: 23 tokens differed from 13ca844, because the 15 demoted charts also moved a token, so the restore matched PER SECTION and skipped the sections whose block count changed (the demotion itself)
   - [S3] - every `.itemrow` and its direct children dumped, then measured <qa/preview-blocks.html in headless Chrome via CDP, the launcher shape qa/live.mjs uses> DONE - 26 rows, 25 all-block, ONE wrapper (`infoGap`: row stretched the `itemsize-third` wrapper, the panel inside it stayed 54px short); 0 rows with unequal children; 19 block-to-block adjacencies that are STACKED, not paired
### [B2] - the field removed and the widths back where they were before the change <"make the widths that i had them before this change the default widths" answered by "lets go with a" = remove the field entirely> DONE
   - [S1] - 53 `**width**` lines and the `[INSTRUCTIONS]` bullet deleted <CONTENT_EXAMPLES.md [INSTRUCTIONS]> DONE - 0 width lines, 0 bullet, entries 53 -> 53
   - [S2] - `FORMAT.md m)` rewritten, and a new `n2)` written from today's measured defect <[GENERATION]> DONE - m) says no file stores a default and names the open question; n2) says a row's children ARE the blocks, with the 50px gap recorded as the reason
   - [S3] - the width tokens restored to the 13ca844 values <qa/preview-blocks.html> DONE - 23 restored per section; the 15 chart sections skipped because the demotion is what changed their count, and their token came across with the wrapper
### [B3] - adjacent blocks keep the same height <"i want flex to keep adjascent blocks the same height … they arent on the test page"> DONE
   - [S1] - the cause fixed at its source, per [B1 S3] <qa/preview-blocks.html infoGap: wrapper dropped, `itemsize-third` moved onto the panel, `data-cols="2"` added to the row> DONE - re-measured: 0 unequal children, 0 blocks short of their wrapper, 0 rows whose children fail to fill them
### [B4] - games get their own colour, purple <"give games their own color, maybe purple"> DONE
   - [S1] - `--purple:#5b2a86` and `[data-kind="games"]` beside the other kinds <style.css> DONE - teaching ink, mixed/training orange, games purple, untagged keeps its container's edge
   - [S2] - `FORMAT.md l)` extended <the kind list names games and its colour> DONE
### [B5] - verify and publish <[GUIDELINES]> DONE
   - [S1] - qa/examples.mjs (the width invariant removed with the field) 8/8; landing all pass after the stamp bump (4a205367bd -> 3d83dce539); order 54/54 with 0 mismatches, sections 54/54, divs 592/592 DONE
   - [S2] - commit + push DONE
### [B6] - NOT DONE, deliberately <the width design question from [B1] of the previous turn> <still open: narrow-first + structural measurement, or let CSS size itself, or authored slot + a check> <recorded, no code written>


## [13] - the tags added while [12] was running (2026-11-10)
### [B1] - deletes: stressBar, spellingSoundMap, scaleAxis, falseFriendSplit, audienceRow, sceneCast, dialogueMoves, vocabField, storyStrip, beatGrid, stanceScale, routineMap
   - [S1] - twelve entries removed from the menu and the page, navs rebuilt <[12] carried six, [13] eight more> DONE - menu 70 -> 56 entries, page 70 -> 57 sections (43 blocks + 14 drafts)
   - [S2] - cross-references re-pointed rather than deleted: melodyContour->emphaticBeat, registerContrast's own fits line, emphaticBeat->registerContrast, questionBuilding and repairMoves->chatSample, literalSplit and ruleTree->no name, levelGauge->scaleChoice/politeLadder <the guard in the drop script refused to run while any backticked name survived> DONE
### [B2] - the tags that were changes, not deletes
   - [S1] - soundGrid: rows are X and TI (italic, português) and TH, no phonetic symbols; entry and page <"we dont use those other symbols in this project"> DONE
   - [S2] - collocationMatrix: half width, have and get added as rows <"make it a half-width block and include have and get"> DONE
   - [S3] - chatSample: the owner's question answered in its NOTES section, and the entry now says in `does` that it shares the `.dialog` container and differs by content <"isnt this just a normal dialog? answer by updating the text here"> DONE
   - [S4] - twoWordVerb: two half-width blocks, the second a matching exercise fed by the first block's everyday column <"make the blocks half-width and the second block into a matching exercise"> DONE
### [B3] - melodyContour migrated out of the block list
   - [S1] - entry removed from CONTENT_EXAMPLES.md, written as a `####` draft in IN-BLOCK-VISUALS.md with the five fields <"migrate this to IN-BLOCK-VISUALS.md"> DONE - placed after levelGauge, before the Outside-art appendix
   - [S2] - its page section moved from the blocks region to the drafts region, dim line restated as an in-block element, `.listen` chip and one gap added so the preview shows what the draft says it does <a draft with no item of its own> DONE
### [B4] - verify and publish
   - [S1] - order 57/57 with 0 mismatches, 57/57 sections, 606/606 divs, no stale names, examples.mjs 6/6 DONE
### [B5] - refused on purpose
   - [S1] - a `### chunkBank` section asking for `delete` appeared after the rename to `contextFit` was done <a name that no longer exists, contradicting the rename from 20 minutes earlier> AWAITING USER: delete the vehicle now called contextFit, or delete only the stale section
   - [S2] - `wordFamily` ends mid-sentence ("this one is good but we can"), `pronLab` is a note-to-self, twoWordVerb adds "we may need to utilize checkboxes so you can confer with me" <nothing actionable yet>

## [12] - the remaining change tags in qa/NOTES.md, entry and preview (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"keep working on any other items that ive requested changes for"> <every tag that is not a delete, and where its vehicle stands>
   - [S1] - NOTES.md re-read at its 14:39 state <beforeAfterStrip's `d` had become `delete`> <the tag list> DONE - 3 change tags outstanding: formulaFrame, signalTable, contextFit
   - [S2] - the preview checked against the entries <ruleCard, lineRepair and mediaSnippet were rewritten in [9] but their page markup never was> <which pages disagree> DONE - 3 more items whose preview still showed the old shape
### [B2] - the entries and their previews brought back into agreement
   - [S1] - formulaFrame: `**markup**` one third width, `**fits**` third; page `itemsize-third`, "The frame holds" line gone <"remove 'the frame holds' line and make 1/3 width block"> DONE
   - [S2] - signalTable: `<colgroup>` at 16%, first column headed `The Cue`, `**fits**` half even with sentence examples <"make the first column thinner ... the header ... can be 'The Cue'"> DONE
   - [S3] - ruleCard preview: `Pattern:` / `Means:` / `Use when:`, centred, one third, explainer on the line below each <the entry change landed in [9]; the preview still showed the old card> DONE
   - [S4] - lineRepair preview: the two gap items removed for the label lines, dim line to `evidence none` <the entry was made teaching-only in [9], the preview kept the exercise> DONE
   - [S5] - mediaSnippet preview: a named concept, a second line showing it, the same two questions asked of both <the preview still showed one line and three questions> DONE
   - [S6] - `chunkBank` renamed `contextFit` on the page, in the nav, and in the NOTES section that keys on `data-item` <"call this vehicle 'contextFit'"> DONE
### [B3] - beforeAfterStrip deleted <its tag now reads `delete`>
   - [S1] - entry, page section and nav link removed; `humourFlag` re-pointed at `registerContrast`, two IN-BLOCK-VISUALS asides rewritten <no reference survives> DONE
### [B4] - verify and publish
   - [S1] - menu 70 -> 69 entries, page 70 -> 69 sections (56 blocks + 13 drafts), navs rebuilt <order index-by-index, balance, hrefs> DONE - 0 mismatches, 69/69 sections, 611/611 divs, 0 dangling links, examples.mjs 6/6
### [B5] - not done, reported
   - [S1] - `dictation`: its tag asks for a 15-20+ restriction, but no vehicle of that name exists in CONTENT_EXAMPLES.md, IN-BLOCK-VISUALS.md or any preview page <AWAITING USER: rebuild the entry, or drop the request>
   - [S2] - the seven preview-games4 tags (skeetRange, bingoCard, bossRaid, stackDrop, echoPads, flapGate) are engine4.js work, not entry text <untouched here>

## [11] - the delete tags added after [10]: annotatedExample, exceptionBench, errorGallery (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"im still seeing entries on the preview page that I marked for deletion"> <the tags as they stand on disk now>
   - [S1] - qa/NOTES.md re-read, not remembered <its LastWriteTime moved 14:19 -> 14:22 after [10]> <every section's text as it is now> DONE - the file now ends mid-word: `### beforeAfterStrip` holds a single `d`
   - [S2] - the delete tags differenced against both preview pages <qa/preview-blocks.html 73 items, qa/preview-games4.html 13> <the three still live, and where> DONE - annotatedExample, exceptionBench and errorGallery are the only delete tags still on a page (blocks page lines 64/104/117); the games page carries no delete tag
   - [S3] - cross-references to the three counted <CONTENT_EXAMPLES.md + IN-BLOCK-VISUALS.md> <none, so the deletion is clean> DONE - 0 references from any other entry or draft
### [B2] - remove the three from both files <"im still seeing entries on the preview page that I marked for deletion"> <menu and page agree again: 70 items>
   - [S1] - drop the three entries from CONTENT_EXAMPLES.md <[TEACHING] 24 -> 21> <no `### ` heading and no backticked name left>
   - [S2] - drop the three sections from qa/preview-blocks.html <60 blocks -> 57> <no id, no href, both navs rebuilt>
### [B3] - verify and publish
   - [S1] - qa/examples.mjs green <the draft -> item check> <6/6>
   - [S2] - page balanced and in menu order <sections, divs, ids, hrefs> <counts match>
   - [S3] - commit and push <PENDING.md [GUIDELINES]> <origin/main at local HEAD>
### [B4] - the open question, not acted on <"d" under `### beforeAfterStrip`> <asked, not assumed>

## [8] - the word-for-word rule, in the owner's wording (2026-11-10)
### [B1] - insert the rule after "Do not assume." <"__FOR ANY EDIT THAT REPLACES TEXT__ of a file in the repo root, if a message proposed it, the proposed new text must be shown accompanied by every word of the old text that is to be altered. (APENDING.md/PAST_BATCHES.md exempt)"> <ADHERENCE.md [UNDERSTANDING] carries it> DONE - their words kept word for word, with APENDING.md -> PENDING.md as the only correction; NO scope clause added (lesson pages are not in the repo root, so the phrase already excludes them) and NO "whole passage, not only the words that differ" clause added, since rule 16 forbids adding to proposed wording. Standing instruction noted: finished text in qa/NOTES.md is DELETED, never replaced, so that file is outside this rule by construction
### [B2] - the showing has a PLACE <"it doesnt specify that it must be shown IN the message that proposed it, and specifically accompanying the proposal"> <the proposing message is the grammatical subject, so where it is shown is fixed> DONE - three words for three: "the proposed new text must be shown" -> "that message shows the proposed new text". Same length, no words added. The stronger variant (delete "if a message proposed it, " so a proposing message is mandatory and a silent edit is impossible) was OFFERED and NOT applied, because it is a scope change. Recorded for the owner's answer
### [B3] - commit and push <PENDING.md [GUIDELINES]> <origin/main at local HEAD>

## [7] - the load formula: an activity multiplier against the content level (2026-11-10)
### [B1] - build the formula <"each 'activity' with answers or fields needs a multiplier ... multiplied by the content level that the generator chooses"> <load = L × M, M = qty × pace × risk> DONE - 2026-11-10 - PEDAGOGY-MAP.md [LEVEL] x-aa, CONTENT_EXAMPLES.md [INSTRUCTIONS], FORMAT.md 15
   - [S1] - state the formula and its guardrails beside the 1-50 content scale it acts on <PEDAGOGY-MAP.md [LEVEL]> <x-aa added after v, before [Register]> DONE - four rules: the product, M declared by the activity, load-not-kind plus both directions, and a LENGTH guard (not a cap) at ~70
   - [S2] - state the field every activity must carry <CONTENT_EXAMPLES.md [INSTRUCTIONS]> <the **load** line and its shape> DONE - one bullet with the shape `qty ×1.0 at <baseline> → ×<N> at <ceiling> · pace ×<N> when data-time · risk ×<N> at data-retry="0"`
   - [S3] - point the block option-count rule at it <FORMAT.md 15> <one clause, no second definition> DONE - the clause names the multiplier and points at x; no arithmetic restated
### [B2] - the per-activity numbers <"then i will go into the blocks and define them for you to extract out of notes.md"> <every entry's **load** line filled> AWAITING USER - the 91 entries carry none yet; the numbers come out of qa/NOTES.md when the owner defines them
### [B2b] - drop the invented word, and stop capping load <"whats the point of defining 'band' at all? I dont remember defining or using the term anywhere"; "clamping to 50 and splitting is probably not the right idea. Maybe split at 70"> <[LEVEL] uses only the project's own vocabulary: content level (v) and load, with no clamp on the product> DONE - 2026-11-10 - "band" removed from t/x/z/aa (it is `qa/lang.mjs`'s word for the Portuguese-share window, a different thing entirely); `load = L × M` uncapped, only L capped at 50; aa is now a LENGTH guard at ~70 rather than a difficulty cap; CONTENT_EXAMPLES.md [INSTRUCTIONS] points at the uncapped formula. Note for the owner: no +/-5 tolerance exists anywhere in the docs - the only slack in the project is `qa/lang.mjs`'s one-element slack
### [B3] - commit and push <PENDING.md [GUIDELINES]> <origin/main at local HEAD> DONE - f32a04e (docs), 2d9ed45 (the engine work that was still uncommitted from [4])

## [4] - trainOrder teardown: no train graphics, a normal train, the noun frame (2026-11-10)
### [B1] - PRE-PROMPT RESEARCH <"remove all the train graphics ... just a normal looking train with 8 flatbed cars behind it"> <what "train graphics" covers, and how a block declares its own words>
   - [S1] - read yardGame's train construction and ART.loco <engine4.js> <every element the train draws is enumerated>
   - [S2] - read the .g4-t* train rules <style.css> <which rules belong to the train and which to the yard/bridge>
   - [S3] - read the preview-games4 trainOrder block and the engine's prompt card <qa/preview-games4.html, engine4.js Runner> <the prompt element and how a block carries data>
   - [S4] - clear [B1] and batch the writes <ADHERENCE [BATCHING] 1)> <batches below>
### [B2] - strip the train graphics and build a normal train <"remove all the train graphics ... just a normal looking train ... behind it"> <no drawn locomotive, plain flatbeds> DONE - ART.loco deleted, the ornamented car body deleted, the old flex train CSS + crew/depot/ram/boom/fail CSS deleted, plain cab-and-boiler engine and equal-height flatbeds, poster rebuilt to match
### [B3] - the cars come from the adjectives <"The train will spawn with that many cars"> <N adjectives, N cars, 8 max> DONE - build() reads this train's items, one car per distinct slot in slot order, capped at 8; place()/depart() now speak in slots
### [B4] - the prompt card is the noun's frame <"make the top prompt card ... say \"That's a _______ [noun]\""> <the card reads the frame once> DONE - `data-noun`, the game owns the prompt (ownsPrompt), the frame is written once per run
### [B5] - a real test block <"generate a noun and 8 random adjectives in the html for our test run"> <noun + 8 adjectives in the page> DONE - data-noun="car", eight adjectives covering all eight slots, single train
### [B6] - the description says adjectives only <"only for adjectives ... make sure that is in its description"> <CONTENT_EXAMPLES states it> DONE - ADJECTIVES ONLY bullet, the noun frame bullet, 1-8 adjectives, cars follow the adjectives, plain-train art
### [B7] - publish
   - [S1] - commit and push <git> <origin/main at local HEAD>
   - [S2] - four re-implementation questions recorded in qa/NOTES.md §trainOrder <"if you have questions ... put the question in the notes and move to the next one"> <Q1 verdict, Q2 gesture, Q3 labels, Q4 wreck> AWAITING USER

## [3] - all game notes in qa/NOTES.md (2026-11-10)
### [B1] - notes inventoried against the code <"keep working on the games until all of the instructions in my notes are implemented"> <every section read, every clause mapped to a game> DONE
### [B2] - the small notes: skeetRange, whackMole, catchBasket DONE - engine4.js, style.css, qa/NOTES.md
   - [S1] - skeetRange: rack REVERTED to the old positioning (left edge, lanes 12–64%), cap six discs, miss sound halved (buzzer 0.125), gunshot −30% (0.42), answer plaques unclipped <qa/NOTES.md 31> DONE
   - [S2] - whackMole: a molehill in front of each mole, word above his head so the hill cannot cover it, bare cells <qa/NOTES.md 90> DONE
   - [S3] - catchBasket: 2–4 pots; a later bloom is drawn bigger so "the biggest" exists; a girl in a dress walks in and plucks it (a tie is random) <qa/NOTES.md 84> DONE
### [B3] - the medium notes: crosswordBoard, ladderRun, stackDrop DONE
   - [S1] - crosswordBoard: a wrong full word does nothing at all; a right word is a point; five points closes the board <qa/NOTES.md 74> DONE
   - [S2] - ladderRun: graffiti art/overlay/CSS deleted; a perfect run climbs onto the prompt card and throws banknotes onto the answer cards; a missed point brings the dog and topples the ladder; startText set <qa/NOTES.md 67> DONE
   - [S3] - stackDrop: Mario flagpole with waving pennant, the jump measured to the pole, coin from the knob, faceplant already fired on a short tower <qa/NOTES.md 37> PART — "the platform from the old version" is a question in the notes (two slabs read as one, and the ledge is the block flight's target)
### [B4] - echoPads and flapGate DONE
   - [S1] - echoPads: strip hidden until the run starts; level = `data-level` else the page's L, 20+ means no hint at all; startText set <qa/NOTES.md 52> DONE
   - [S2] - flapGate: a wall is an object in flight (cut, fly, retire) so the next is already behind the one he flew through and the flight never stops <qa/NOTES.md 61> DONE
### [B5] - trainOrder PART - the four open clauses are questions in qa/NOTES.md 90–94
   - [S1] - sky, two hazed ridges of hills and a real ground plane; no car labels (plaque, `data-labels` lever, `data-label-max`, SLOT_LABEL and the CSS deleted) <qa/NOTES.md 89> DONE
   - [S2] - the caboose bigger than the cars OPEN
   - [S3] - wheels flush on the track; platforms growing from a flat bed per car OPEN
   - [S4] - car count from the adjectives, dock centred, workers as the drop targets with a throw sequence OPEN
   - [S5] - a card's height still comes from its own slot (`OPEN0 - 6 * home`), so a disordered train bursts through the deck <already the rule> KEPT
### [B6] - publish
   - [S1] - every note tagged `[done]` or answered with a written question <qa/NOTES.md> <nothing silently dropped> DONE
   - [S2] - no QA harness run <"stop doing QA that isnt asked for"> <`node --check engine4.js` only, which is a syntax check on the edited file, not a test> DONE
   - [S3] - CONTENT_EXAMPLES.md entries rewritten where a game changed (bingoCard 7s, crosswordBoard, flapGate stream, echoPads levels, ladderRun, trainOrder labels) DONE
   - [S4] - commit and push

## [2] - CONTENT_EXAMPLES.md: purpose, limits and min/max for every game - MIGRATED 2026-11-10
### [B1] - PRE-PROMPT RESEARCH <"delete trainsteps ... updating the rest of the games according to my comments in notes.md"> <notes.md = qa/NOTES.md (only notes file tracked); 11 game sections on preview-games4.html; trainSteps inventory> DONE - 2026-11-10 - none
   - [S1] - notes file resolved and every game comment enumerated <ADHERENCE [ANALYSE] a)> <skeetRange, stackDrop, bingoCard, echoPads, flapGate, ladderRun, crosswordBoard, mineGrid, catchBasket, whackMole, trainOrder> DONE
   - [S2] - trainSteps-only vs shared inventoried <engine4.js yardGame 3508-3745> <only the !order branches, the two PLUGINS lines, preview-games4.html item-trainSteps, kids/lesson23 block> DONE
   - [S3] - clear [B1]; user answered the lesson23 question: delete the block, lesson keeps no game; CONTENT_EXAMPLES.md must state purpose/limits/min-max per game <ADHERENCE [BATCHING] 1)> <batches below> DONE
### [B2] - delete trainSteps and the code only it needed <"delete trainsteps and anything that ONLY IT needed"> <trainOrder is the only yard mode> DONE - 2026-11-10 - engine4.js, kids/lesson23.html, kids/lesson23.edit.html, qa/preview-games4.html
   - [S1] - drop the `mode` argument and every `!order` branch in yardGame; delete PLUGINS.trainSteps, its ownSound and noShuffle; shuffle() stays (runner 716, whackMole 1223) <engine4.js 3508-3745> <yardGame single-mode, no trainSteps symbol in engine4.js> DONE
   - [S2] - remove the kids/lesson23 game block from both the page and its .edit twin <"Delete the game block from kids/lesson23"> <no data-game="trainSteps" in either file> DONE
   - [S3] - remove the trainSteps section from the games preview <qa/preview-games4.html item-trainSteps> <its note box is gone> DONE
   - [S4] - harnesses green after the removal <qa/content.mjs, qa/games4.mjs, qa/overflow.mjs> <games4 147/15 - the same pre-existing 15; kids/lesson23 loads; nothing overflows> DONE
### [B3] - CONTENT_EXAMPLES.md answer ranges <carried out as [2]> DONE - 2026-11-10 - CONTENT_EXAMPLES.md, FORMAT.md, ISSUES.md
### [B4] - trainOrder per its notes <"the rest of the games according to my comments in notes.md"> <the new yard presentation>
   - [S1] - ground and distant mountains behind the rails <qa/NOTES.md 92> <no flat beige background>
   - [S2] - caboose larger than the cars; every wheel flush on the track <qa/NOTES.md 92> <geometry checks>
   - [S3] - platforms grow from a flat bed per car; no car labels; car count follows the adjectives <qa/NOTES.md 92> <labels gone, count derived>
   - [S4] - dock centred at the bottom; drag words onto workers standing at each platform, workers throw them aboard <qa/NOTES.md 92> <drag works, throw animation runs>
   - [S5] - card height set by its own slot, so a wrong order necessarily hits the bridge <qa/NOTES.md 92> <bridge fail on disordered train>
### [B5] - the simpler game notes <"the rest of the games"> <each note executed and verified>
   - [S1] - crosswordBoard: wrong answers cost nothing, no fail condition <qa/NOTES.md 71> <already true in the code - scoreBoard never decrements and no lives() is exposed; three assertions added to qa/games4.mjs proving score 0, phase play, radio blank> DONE
   - [S2] - whackMole: always 3x2, min 2 max 6, holes just wider than the moles <qa/NOTES.md 87> <n fixed at 6; mole inset 6px->3px a side so the burrow hugs it> DONE - 2026-11-10 - engine4.js, style.css
   - [S3] - mineGrid: the art does not blink out at round start <qa/NOTES.md 76> <the away/settle fade pair removed from goIn/show and their CSS dropped; the street never leaves the stage> DONE - 2026-11-10 - engine4.js, style.css
   - [S4] - bingoCard: button text visible, items 15px narrower, two round labels <qa/NOTES.md 42-46> <button paper-on-ink so it cannot vanish, card width -45px (15px a column), labels read off r.answered> DONE - 2026-11-10 - engine4.js, style.css
   - [S5] - skeetRange: miss -50%, gunshot -30%, 2-6 targets spread on two axes, answer cards unclipped <qa/NOTES.md 31> <measurements check>
   - [S6] - catchBasket: min 2 max 4, and a girl picks the biggest flower at the end <qa/NOTES.md 81-82> <ending check>
### [B6] - the heavier game notes <"the rest of the games"> <each note executed and verified>
   - [S1] - stackDrop: 10px steeper step, no platform, flagpole and animated flag, run-and-jump onto the flag with a coin, face-plant on a miss <qa/NOTES.md 36-37> <both endings run>
   - [S2] - echoPads: no prompt card on the start screen, hidden two-level difficulty at lesson 20, level 2 with no hint and impossible decoys, new start text <qa/NOTES.md 51-54> <both levels check>
   - [S3] - ladderRun: graffiti gone; money thrown from the top on a clean run, dog knocks the ladder over otherwise; new start text <qa/NOTES.md 64-66> <both endings run>
   - [S4] - flapGate: walls continue and a second wall follows, one continuous flight through every gate <qa/NOTES.md 59> <continuous run check>
### [B7] - record and publish <PENDING.md [GUIDELINES] commit-by-default; qa/NOTES.md 12-15 [done] tag> <committed, pushed>
   - [S1] - tag each executed notes section `[done]` (the tag that lets a section be deleted) <qa/NOTES.md 12-15> <only finished ones tagged>
   - [S2] - run the harnesses and commit the turn's work <qa/content.mjs, qa/games4.mjs, qa/overflow.mjs> <green, committed>
   - [S3] - push <PENDING.md [GUIDELINES] one combined push> <origin/main at local HEAD>



