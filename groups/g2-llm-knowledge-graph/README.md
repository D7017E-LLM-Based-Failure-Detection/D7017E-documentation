# G2 — LLM ↔ knowledge graph integration

> Status: draft
> Owner: G2 — <names>
> Last meaningful update: 2026-09-21

**Task.** Develop an explainable reasoning loop at the intersection of LLMs and
formally represented knowledge about the automation process, expressed in RDF
ontologies. Starting point: the 2024 LLM+KG review (`[@pan2024llmkg]`, see
[references/reading-list.md](../../references/reading-list.md)), plus what has
happened in the two years since.

## What goes in this folder

- Literature: what the survey says, what came after it, comparable systems
- Ontology: competency questions it must answer, classes and properties, reused
  vocabularies, IRI scheme, SHACL validation
- Reasoning loop: question → retrieval/SPARQL → LLM → check → answer; prompting;
  what an "explanation" consists of and how it traces back to triples
- Evaluation: the question set, what counts as correct and explainable, results

One file per topic. Reading notes go in `references/notes/<bibtexkey>.md`
(template: [reading-note.md](../../templates/reading-note.md)); evaluation runs go
in [experiments/](../../experiments/README.md).

## What the other groups need from us

| To/from | What | Owner | Agreed? |
|---|---|---|---|
| from G3 | How platform data reaches the graph, and the SPARQL endpoint | | ☐ |
| to G3 | Answer + explanation format the UI can show an operator | | ☐ |
| to ALL | Base IRI and the asset/signal id → IRI mapping | | ☐ |

## Current state

| # | Item | Status | Next |
|---|---|---|---|
| 1 | | | |
