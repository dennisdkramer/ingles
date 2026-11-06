# PASS-A — Pass A: independent lesson design generation - DO NOT MODIFY WITHOUT USER SIGN-OFF
	-(Output = `designs/<track>/lessonNN.design.md`) - Create new or overwrite existing.
	- Inputs: [This Lesson's entry in `<track>-ROADMAP.md`] AND `<TRACK>-REGISTER.md`.
	- Deliberately **withheld**: All other files. 
	- Framing for the pass: *"You have no page, no classes and no build mechanics. You have a concept, a student, one session, and the world outside — and you decide what the session is made of and in what order."* 
	- **May say what FORM a piece of teaching wants** — May freely imagine any form - The following are EXAMPLES, not suggestions: a table [to compare/contrast forms/concepts] or [to present vocabulary with translations], a written dialogue to practice reading out loud with the teacher, an audio dialog to practice listening or analysis, a listen-and-tick, a relevant real-world situation/story/music/video as an (explanatory or activity) showcase of the content's use.
	- Naming a content type is a pedagogical recommendation, not page mechanics. It must not name classes, ids, widths or block layout.
	- Coverage of a concept or vocabulary class must not be redundant with a prior lesson: a topic returns deeper, wider, more natural or more register-appropriate — never as the same explanation and the same drills.
	- Write in the file:
      1. The **core**: 2-4 things the student must leave able to *do* (phrased as skill/behaviour - not as a topic):
		   a) *teaching beats* (per core item: what the student must be told, 1–2 sentences).
		   b) *dependencies* (every form and word used → taught where, or marked as intentional inference).
         c) The real situation in which that core is worth having.
      2. **Three candidate (lesson) experiences, from three different channels** (heard / seen / done / read / said).
      3. The chosen one, why it beats the others *for this student*, and what the first 30 seconds feel like.
      4. What the student produces, what evidence it leaves, and any conflict with guidelines or defaults.
      5. **the shape of the session**: what the student meets first, second, third, etc.., where content is better read side by side than in sequence, and content type recommendations when judged important to optimise the lesson. The shape must be compatible with the site's shell. A shape that could not be reconciled with the site's shell is a defect of THIS pass, not of the build:
         -  **The shape is IMAGINED, not inherited.** Which sections the lesson has, how many, in what order, and how each divides its content is invented, never copied or inherited. "The previous lesson did it this way" is not an input. 
         - **Copying a shape is allowed ONLY when the user asks for it**, copying one uninvited is a generation error. Archived and parked content must never be opened, read or used as a reference. (owner instruction 2026-11-03). 
         - Pass A shape and format descriptions are in plain english, never written in the design file as specific css class or code
      6. **`sequence:`** (which slice of a multi-lesson strand this lesson owns, and what the other lessons own) and **`must not re-teach:`** (what a neighbouring lesson owns) — two lines, at the top of the file.
