# How we document

So that nobody has to reconstruct the project from memory or chat history when the
final report is written. Write it down the same day.

```
README.md         Group activity log + entry point
people/           Who's in which group + one personal activity log per person
groups/g1 g2 g3/  Each group's working documentation
experiments/      One file per measurement or run, with the numbers
references/       references.bib (all citations) + reading-list.md (everything else)
report/           outline.md, figures/, assets/
templates/        Copy one when you start a new doc
```

Folders are created when there is something to put in them — no empty placeholders.

1. **README is the log, docs are the state.** Log entries are never edited to stay
   current; documents always are. Fix the doc, then log the fix. (Adding a missing
   `<a id>` anchor to an old entry is fine.)
2. **Two logs.** Team-relevant events (milestones, decisions, anything someone else
   needs) go in the group log in `README.md`, with no names or titles. What you did goes in your own
   `people/<you>.md`. A personal entry that is part of a group entry links to it
   explicitly with `⇡`. Format and example: [people/README.md](people/README.md).
3. **Every claim from outside the project gets a citation.** Academic sources go in
   `references/references.bib` and are cited inline as `[@bibtexkey]`; courses,
   product docs and slide decks go in `references/reading-list.md`. If it is not in
   the `.bib`, it cannot be cited in the report.
4. **Numbers live in `experiments/`,** not in prose. Prose links to them.
5. **Anything that affects another group** is written down where both groups can see
   it, the day it is agreed — not left in a meeting.
6. **Absolute dates** (2026-09-21), never "last week".
7. Filenames lowercase-with-hyphens; dates only where the file is an event
   (`experiments/2026-10-02-belt-vibration.md`).
8. Drafts belong in the repo. A half-written doc marked `> Status: draft` beats no doc.

Start each document with:

```markdown
# Title

> Status: draft | stable
> Owner: name (G1/G2/G3)
> Last meaningful update: YYYY-MM-DD
```
