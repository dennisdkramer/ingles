# [HANDLING]
Author ([Bn]=(Batch), [Sn]=(Step)) two lines below [CURRENT], format as follows:
`## [Bn] - <the overarching thing getting done> <The user's words that guide this task compressed to 1 sentence> <artifact produced>`
---

# [CURRENT]
---
## [B1] - Generate kids lesson 44 through the rewired PEDAGOGY-MAP <"as a test, generate kids lesson 44"> <kids/lesson44-<Title>.html: pass 1 content from KIDS-ROADMAP [44] + KIDS-REGISTER, pass 2 shapes only from capability-map.html, teach → train → quiz, then `npm run build:lessons`, `node qa/check.mjs --track=kids 44`, commit and push>
---

## [B0] - Repair the malformed markup sample that swallows the page <"what did you just do that broke the formatting of capability-map.html"> <capability-map.html:38 — the reveal specimen escapes only its first `<`, so `<summary>` is parsed as a live element and never closes; after the fix `.content-area` has 30 top-level children and 5 direct-child `<h2>`s again, and `node qa/cmcheck.mjs` prints `h2 sections=5` with 0 failures>
---

## [B1] - Rewire PEDAGOGY-MAP's input contract and its passes to the capability map, the register, the roadmap neighbourhood and the pos/audio tooling <"pedagogy-map is not going to look at content examples or style.css anymore, it is going to get everything from the examples on the capability map ... it also needs to be wired up to the steps in capability map 1a and 1b properly ... Make sure that its going to generate robust lessons and not leave any concept thinly explained"> <PEDAGOGY-MAP.md: [GENERATION] steps 3-6 are pass 1 (§1A) then pass 2 (§1B); [I/O] mandatory = the roadmap section + the prior-5/next-2 `##` header lines only, the REGISTER as the strongest input, capability-map.html as the only markup/shape source, _shell.html; tools = qa/pos.mjs, qa/AUDIO.md + qa/audio.mjs (with the ../assets path rule), dictionary.json + pronkey.js, assets/README.md; withheld = style.css, CONTENT_EXAMPLES.md, VEHICLES.md, IN-BLOCK-VISUALS.md, PEDAGOGY.md and every lesson/preview page; new [PASSES] 1a/1b/1c and [COVERAGE] bullets>
## [B2] - Make section 5's activity types one block of half-width examples under section 4's own instruction <"take 5A,B,C,and D and make them half-width and put them all into one block with the same instructions that section 4 has - they are activity types that CAN be their own block, sized appropriately to the content inside them, or they can be inside a block accompanied by or accompanying other material"> <capability-map.html §5: the dialog, the answered chart, the chunks and the strips sit as four half-width examples in one `.block` (two `.rows` of two, no nested `.block`, no `data-span` on an in-block example); the block's instruction states that an activity type may be a block of its own sized to its content or an element inside a block with other material, that a lesson chooses and combines them, and that teaching and training may share one block or be separate>
---
## [B3] - Elaborate the teach-train-quiz contract where lesson generation reads it <"lessons should thoroughly teach the elements of their content, have the student practice those things with training, AND include a quiz at the end that tests that theyve really learned the content"> <PEDAGOGY-MAP.md: [COVERAGE] gains the three obligations in order — teach the content thoroughly, train what was taught, and end with a quiz over the lesson's concepts on material the student has not seen — and [CHECK] verifies the end quiz exists and tests every concept the lesson taught>
---

---
## [B4] - Make the frame's own comment name the capability map instead of the style.css headers <"make sure everything is wired up to reflect that"> <_shell.html: the LESSON CONTENT comment says the classes, widths and mechanics come from capability-map.html's examples, not from the style.css `## ` headers>
---
## [B5] - Make the repository map list the generation inputs the map now declares <"make sure everything is wired up to reflect that"> <FILESYSTEM.md: the LESSON GENERATION line names capability-map.html + the register + the roadmap + _shell + qa/AUDIO.md + qa/pos.mjs, and no longer lists VEHICLES.md / IN-BLOCK-VISUALS.md / CONTENT_EXAMPLES.md as generation inputs>
---
## [B6] - Verify the rewired files and ship them <"lets get them wired up for lesson generation"> <re-read of the three edited files, a grep proving the generation input list names no style.css or CONTENT_EXAMPLES, and a commit+push of only those files (the working tree's uncommitted capability-map.html edit is left as found, unstaged)>
