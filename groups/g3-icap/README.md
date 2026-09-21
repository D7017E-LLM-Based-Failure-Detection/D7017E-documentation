# G3 — iCAP: Industrial Cognitive Analytics Platform

> Status: draft
> Owner: G3 — <names>
> Last meaningful update: 2026-09-21

**Task.** Develop a SCADA-like system with scalable data storage and a web-based
interface. iCAP interfaces the other two groups: it hosts the knowledge graphs,
visualizes the automation process and the collected data, and provides the place
where edge ML models are built. The partner-university platform deck is
**inspiration only** — our design and functionality may differ (deck linked in
[references/reading-list.md](../../references/reading-list.md)).

## What goes in this folder

- Requirements: who uses it, for what; numbered functional requirements; scale,
  latency, security
- Architecture: services, ingest, API, triple store / SPARQL endpoint, edge-ML support
- Storage: data model, chosen databases, retention, what happens as volume grows
- Web UI: screens, live process view, dashboards, how G2's explanations are shown
- Deployment: how to run it, environments, observability

One file per topic. Load tests and benchmarks go in
[experiments/](../../experiments/README.md).

## What the other groups need from us

| To/from | What | Owner | Agreed? |
|---|---|---|---|
| from G1 | Telemetry ingest: transport, schema, rate | | ☐ |
| to G2 | Platform data → graph, and where the graph is hosted | | ☐ |
| from G2 | Reasoning results to display | | ☐ |
| to G1 | Model delivery to the device | | ☐ |

## Current state

| # | Item | Status | Next |
|---|---|---|---|
| 1 | | | |
