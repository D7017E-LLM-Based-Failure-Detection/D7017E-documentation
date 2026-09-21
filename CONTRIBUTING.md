# How we document

So that nobody has to reconstruct the project from memory or chat history when the
final report is written. Write it down the same day.

```
README.md         Activity log + entry point
groups/g1 g2 g3/  Each group's working documentation
experiments/      One file per measurement or run, with the numbers
references/       references.bib (all citations) + reading-list.md (everything else)
report/           outline.md, figures/, assets/
templates/        Copy one when you start a new doc
```

Folders are created when there is something to put in them — no empty placeholders.

1. **README is the log, docs are the state.** Log entries are never edited to stay
   current; documents always are. Fix the doc, then log the fix.
2. **Every claim from outside the project gets a citation.** Academic sources go in
   `references/references.bib` and are cited inline as `[@bibtexkey]`; courses,
   product docs and slide decks go in `references/reading-list.md`. If it is not in
   the `.bib`, it cannot be cited in the report.
3. **Numbers live in `experiments/`,** not in prose. Prose links to them.
4. **Anything that affects another group** is written down where both groups can see
   it, the day it is agreed — not left in a meeting.
5. **Absolute dates** (2026-09-21), never "last week".
6. Filenames lowercase-with-hyphens; dates only where the file is an event
   (`experiments/2026-10-02-belt-vibration.md`).
7. Drafts belong in the repo. A half-written doc marked `> Status: draft` beats no doc.

Start each document with:

```markdown
# Title

> Status: draft | stable
> Owner: name (G1/G2/G3)
> Last meaningful update: YYYY-MM-DD
```
