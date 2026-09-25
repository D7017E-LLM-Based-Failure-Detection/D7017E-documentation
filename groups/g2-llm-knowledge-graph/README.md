# G2 — LLM ↔ knowledge graph integration

> Status: draft
> Owner: G2 — <names>
> Last meaningful update: 2026-09-25

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
| 1 | MAESTRO ontology foundation | Imported into llm-kg on 2026-09-21, including examples, queries, rules and validation | Select and describe the project's own system using the vocabulary |
| 2 | Local RDF query prototype | Quickstart script added on 2026-09-21; loads ontology, plant and runtime files with RDFLib | Use the example queries to explore the data |
| 3 | FastAPI application | Initial endpoint added on 2026-09-22; queries local RDF files and returns the first result | Connect the API to GraphDB and define its response format |
| 4 | GraphDB environment | Docker Compose configuration and setup/import instructions added on 2026-09-22 | Verify database import and queries in the running environment |
| 5 | MAESTRO handbook | Local handbook and README link added on 2026-09-22; still uncommitted in llm-kg as of 2026-09-25 | Review and commit the handbook in llm-kg |
| 6 | LLM integration | Described in the documentation; not implemented in the current application code | Implement retrieval and the reasoning loop |

Implementation: [llm-kg repository](https://github.com/D7017E-LLM-Based-Failure-Detection/llm-kg).
Dated milestones and source commits are recorded in the shared
[activity log](../../README.md#activity-log).

The handbook covers RDF/Turtle notation, the local MAESTRO vocabulary, GraphDB
setup and queries, modelling a system, sensor/runtime data, reasoning and
validation, and future FastAPI/RAG integration. Its date comes from local
filesystem timestamps; the implementation milestone dates come from Git commits.
The API currently uses an in-memory RDFLib graph. The configuration and guides
alone do not establish that GraphDB imports or end-to-end LLM integration have
been completed.
