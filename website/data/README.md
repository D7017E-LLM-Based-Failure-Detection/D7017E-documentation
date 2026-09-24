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

- 2026-09-21 — ALL — Documentation repo set up. → [CONTRIBUTING.md](CONTRIBUTING.md)
- 2026-09-24 — ALL — Presented work done during Week 38-39 in meeting with the product owner & Co. 
- 
<!-- Example entries, delete when the log has real content:
- 2026-09-24 — G2 (name) — Read the LLM+KG roadmap survey, 4 bibtex entries added. → [references/references.bib](references/references.bib)
- 2026-09-25 — G1 (name, name) — Conveyor belt powered up, photoelectric sensor readings logged. → [groups/g1-testbed-telemetry-tinyml](groups/g1-testbed-telemetry-tinyml/README.md)
- 2026-09-26 — ALL — Agreed the MQTT topic + payload schema G1 sends to iCAP. → [groups/g3-icap](groups/g3-icap/README.md)
-->
