# Final report — outline

> Status: draft
> Owner: ALL
> Last meaningful update: 2026-09-21

One report, three subsystems. `←` points at what a section will be written from —
when you document something, check whether a section here should point at it.
Adjust to the course's required structure once it is known.

## 1. Introduction
- 1.1 Background — industrial automation, telemetry, why LLMs and formal knowledge
- 1.2 Problem statement
- 1.3 Aim and research/engineering questions
- 1.4 Delimitations ← what we deliberately did not build
- 1.5 Report structure

## 2. Background and related work
- 2.1 Industrial automation, IEC 61499 and SCADA ← [G1](../groups/g1-testbed-telemetry-tinyml/README.md)
- 2.2 Telemetry and edge/tiny machine learning ← [G1](../groups/g1-testbed-telemetry-tinyml/README.md)
- 2.3 Knowledge representation: RDF, OWL, SHACL, SPARQL ← [G2](../groups/g2-llm-knowledge-graph/README.md)
- 2.4 LLM and knowledge graph integration ← G2 literature, `[@pan2024llmkg]`
- 2.5 Industrial analytics platforms ← [G3](../groups/g3-icap/README.md)

## 3. Method
- 3.1 Development process and division of work
- 3.2 Testbed and experimental setup ← G1
- 3.3 Evaluation approach ← G2 evaluation method, G3 scalability targets

## 4. System design
- 4.1 Overall architecture ← [assets/diagrams/](assets/diagrams)
- 4.2 Interfaces between subsystems ← the "what the other groups need from us" tables in each group README
- 4.3 Design decisions and trade-offs

## 5. Subsystem: testbed, telemetry and tinyML (G1)
← [groups/g1-testbed-telemetry-tinyml](../groups/g1-testbed-telemetry-tinyml/README.md)

- 5.1 Testbed and instrumentation
- 5.2 Telemetry pipeline
- 5.3 From data to knowledge
- 5.4 On-device models
- 5.5 Implementation according to industrial practice

## 6. Subsystem: LLM–knowledge graph reasoning (G2)
← [groups/g2-llm-knowledge-graph](../groups/g2-llm-knowledge-graph/README.md)

- 6.1 Ontology
- 6.2 Reasoning loop
- 6.3 Explainability mechanism
- 6.4 Failure modes and mitigations

## 7. Subsystem: iCAP platform (G3)
← [groups/g3-icap](../groups/g3-icap/README.md)

- 7.1 Requirements
- 7.2 Architecture
- 7.3 Storage and scalability
- 7.4 Web interface and visualization
- 7.5 Support for edge ML

## 8. Results
- 8.1 End-to-end demonstration
- 8.2 Per-subsystem measurements ← [experiments/](../experiments/README.md)
- 8.3 Requirement fulfilment ← G3 requirements

## 9. Discussion
- 9.1 Interpretation of results
- 9.2 Limitations and threats to validity
- 9.3 Ethical, safety and industrial-deployment considerations

## 10. Conclusions and future work

## References
Generated from [references/references.bib](../references/references.bib) — the only
bibliography file. Figures: keep the editable source next to the export, in
[figures/](figures) and [assets/diagrams/](assets/diagrams).

## Appendices
- A. Interface agreements between the groups
- B. Ontology listing
- C. Hardware inventory and I/O map
- D. Full experiment logs
