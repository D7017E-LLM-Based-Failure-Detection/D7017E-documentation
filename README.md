# D7017E — Documentation

Shared documentation for the D7017E project. Three groups, one system, one final
report — everything written here is raw material for that report.

| Group | Topic | Docs |
|---|---|---|
| G1 | **Testbed, telemetry & tinyML** — operate the lab conveyor belt, collect sensor telemetry, turn it into knowledge, small ML models on microcontrollers (IEC 61499 / industrial practice) | [groups/g1-testbed-telemetry-tinyml](groups/g1-testbed-telemetry-tinyml/README.md) |
| G2 | **LLM ↔ knowledge graph** — explainable reasoning loop over the automation process represented in RDF ontologies | [groups/g2-llm-knowledge-graph](groups/g2-llm-knowledge-graph/README.md) |
| G3 | **iCAP** — SCADA-like platform: scalable storage, web UI, visualization, host for the knowledge graphs and edge ML | [groups/g3-icap](groups/g3-icap/README.md) |

Where things live: [experiments/](experiments/README.md) (anything with numbers) ·
[references/](references/references.bib) (bibtex + [reading list](references/reading-list.md)) ·
[report/](report/outline.md) (final report outline, figures) ·
[templates/](templates/README.md) · [CONTRIBUTING.md](CONTRIBUTING.md) (how we write this down).

## Activity log

Newest first. One entry per working session, milestone or decision — 1–3 lines,
linking to the document that holds the detail. The log says *what happened*; the
docs say *what it is*.

Format: `YYYY-MM-DD — [G1|G2|G3|ALL] who — what happened. → link`

<!-- Add new entries directly below this line -->
- 2026-09-25 — ALL — Everyone worked together on the project description and completed it.
- 2026-09-21 — ALL — Documentation repo set up. → [CONTRIBUTING.md](CONTRIBUTING.md)
- 2026-09-21 — G1  — Meeting in the Lab with the supervisor. They showed us around and scheduled a demonstration of the system later this week.
- 2026-09-24 — ALL (PO) — Delivery repo drafted: component contract, component registry, first end-to-end scenario (S01), ADR 0001 (containers) proposed. → D7017E-delivery
- 2026-09-24 — ALL — Presented work done during Week 38-39 in meeting with the product owner & Co. 
- 2026-09-22 — G2 — Added a local MAESTRO handbook covering Turtle, ontology vocabulary, GraphDB, queries, system modelling, runtime data, reasoning and future API/RAG integration, plus a README link. The handbook and link remained uncommitted in llm-kg when reviewed on 2026-09-25.
- 2026-09-22 — G2 — Documented GraphDB licensing, repository setup with OWL2-RL, and importing ontology Turtle files. → [Setup guide commit](https://github.com/D7017E-LLM-Based-Failure-Detection/llm-kg/commit/ed11919)
- 2026-09-22 — G2 — Added Docker Compose configuration for GraphDB 11.5.0 on port 7200 with persistent storage, plus startup instructions. → [GraphDB configuration commit](https://github.com/D7017E-LLM-Based-Failure-Detection/llm-kg/commit/0c265ad)
- 2026-09-22 — G2 — Added the initial FastAPI endpoint and launch instructions. The endpoint loads local RDF files using RDFLib and returns the first available-resource query result. → [FastAPI commit](https://github.com/D7017E-LLM-Based-Failure-Detection/llm-kg/commit/e24bcc6)
- 2026-09-21 — G2 — Added a quickstart script to load MAESTRO ontologies and example plant/runtime data, then run the available-resources SPARQL query. → [Quickstart commit](https://github.com/D7017E-LLM-Based-Failure-Detection/llm-kg/commit/12872f7)
- 2026-09-21 — G2 — Documented Python virtual-environment setup and added .venv/ to .gitignore. → [Environment setup commit](https://github.com/D7017E-LLM-Based-Failure-Detection/llm-kg/commit/dae5c69)
- 2026-09-21 — G2 — Moved the imported MAESTRO files from semantic/maestro/ to the top-level maestro/ directory without changing their contents. → [Directory move commit](https://github.com/D7017E-LLM-Based-Failure-Detection/llm-kg/commit/6b8e6f4)
- 2026-09-21 — G2 — Imported the existing MAESTRO ontology stack: 136 files including ontologies, example systems, queries, inference rules, validation, documentation and diagrams. → [MAESTRO import commit](https://github.com/D7017E-LLM-Based-Failure-Detection/llm-kg/commit/1cc4d1c)
- 2026-09-21 — G2 — Created the llm-kg repository with its initial README. → [Initial commit](https://github.com/D7017E-LLM-Based-Failure-Detection/llm-kg/commit/256dda5)
- 2026-09-21 — G2 — Held a sprint planning meeting.


<!-- Example entries, delete when the log has real content:
- 2026-09-24 — G2 (name) — Read the LLM+KG roadmap survey, 4 bibtex entries added. → [references/references.bib](references/references.bib)
- 2026-09-25 — G1 (name, name) — Conveyor belt powered up, photoelectric sensor readings logged. → [groups/g1-testbed-telemetry-tinyml](groups/g1-testbed-telemetry-tinyml/README.md)
- 2026-09-26 — ALL — Agreed the MQTT topic + payload schema G1 sends to iCAP. → [groups/g3-icap](groups/g3-icap/README.md)
-->
