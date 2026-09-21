# G1 — Testbed, telemetry and tinyML

> Status: draft
> Owner: G1 — <names>
> Last meaningful update: 2026-09-21

**Task.** Operate the conveyor belt in the lab and build the infrastructure that
collects telemetry from its sensors and turns it into knowledge; possibly develop
small ML models that run on microcontrollers — using industrial software development
standards. G1 is the interface to the physical process for the other two groups.

**Training (eventually):** IEC 61499 basic introduction · distributed automation
(EAE) · HMI/SCADA (EAE) — links in [references/reading-list.md](../../references/reading-list.md).

## What goes in this folder

- The testbed: hardware inventory, sensors, I/O map, how to start and stop the belt safely
- The telemetry pipeline: sampling, timestamping, protocol, where the data ends up
- From data to knowledge: features, events, anomalies
- tinyML: what the model predicts, how it is trained, what it costs on the device
- IEC 61499: course notes and our function block application

One file per topic, named after it. Measurements go in
[experiments/](../../experiments/README.md).

## What the other groups need from us

| To | What | Owner | Agreed? |
|---|---|---|---|
| G3 | Telemetry: transport, topic/endpoint, payload schema, rate, units, timestamps | | ☐ |
| G3/G1 | How a trained model gets onto the microcontroller | | ☐ |

## Current state

| # | Item | Status | Next |
|---|---|---|---|
| 1 | | | |
