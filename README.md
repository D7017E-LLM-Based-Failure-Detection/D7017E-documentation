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

Format: `<a id="YYYY-MM-DD-slug"></a>YYYY-MM-DD — [G1|G2|G3|ALL] — what happened. → link`

The `<a id>` is invisible on GitHub and lets a [personal log](people/README.md)
entry link to this one (`README.md#YYYY-MM-DD-slug`). No names or titles here: this
log is about the team's work. Who did what goes in your own log.

<!-- Add new entries directly below this line -->
- <a id="2026-09-25-personal-logs"></a>2026-09-25 — ALL — Personal activity logs added, one per person, linkable to entries here. → [people/](people/README.md)
- <a id="2026-09-25-project-description"></a>2026-09-25 — ALL — Everyone worked together on the project description and completed it.
- <a id="2026-09-24-delivery-repo"></a>2026-09-24 — ALL — Delivery repo drafted: component contract, component registry, first end-to-end scenario (S01), ADR 0001 (containers) proposed. → D7017E-delivery
- <a id="2026-09-24-po-meeting"></a>2026-09-24 — ALL — Presented work done during Week 38-39 in meeting with the product owner & Co. 
- <a id="2026-09-22-graphdb-fastapi"></a>2026-09-22 — G2 — Added an initial FastAPI query endpoint, GraphDB Docker configuration and setup instructions. Explored GraphDB and tried SPARQL queries.
- <a id="2026-09-21-docs-repo"></a>2026-09-21 — ALL — Documentation repo set up. → [CONTRIBUTING.md](CONTRIBUTING.md)
- <a id="2026-09-21-g1-lab-visit"></a>2026-09-21 — G1  — Meeting in the Lab with the supervisor. They showed us around and scheduled a demonstration of the system later this week.
- <a id="2026-09-21-llm-kg-repo"></a>2026-09-21 — G2 — Created the llm-kg repository, imported MAESTRO, and added Python environment instructions and a quickstart script for querying example data.
- <a id="2026-09-21-g2-sprint-planning"></a>2026-09-21 — G2 — Held a sprint planning meeting.


<!-- Example entries, delete when the log has real content:
- 2026-09-24 — G2 — Read the LLM+KG roadmap survey, 4 bibtex entries added. → [references/references.bib](references/references.bib)
- 2026-09-25 — G1 — Conveyor belt powered up, photoelectric sensor readings logged. → [groups/g1-testbed-telemetry-tinyml](groups/g1-testbed-telemetry-tinyml/README.md)
- 2026-09-26 — ALL — Agreed the MQTT topic + payload schema G1 sends to iCAP. → [groups/g3-icap](groups/g3-icap/README.md)
-->
