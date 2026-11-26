# 2022 Day 6 Part 1 — Tuning Trouble (`2022/day06/part1`)

Finds the first start-of-packet marker (4 consecutive distinct lowercase ASCII characters) in a datastream buffer.

## Consumer Interface

- `domain/solver.ts`: exports `PACKET_MARKER_LENGTH` (`4`) and `solver` (`MarkerSolver` implementing `PuzzleSolver<DatastreamBuffer, number, MarkerTraceFrame>`).
- `index.ts`: exports `manifest` (`PuzzlePartManifest`) with `exampleInput`, `exampleAnswer` (`"7"`), `solver`, and `Visualizer`.
- `viz/TuningTroubleVisualizer.tsx`: binds `solver` to `SignalTapeVisualizer` with `"Start-of-Packet"` telemetry and `var(--gold)` accent.

## Maintainer Architecture

- **Thin Part Layer**: `part1/domain` delegates parsing, solving, and trace generation entirely to `2022/day06/shared` (`createMarkerSolver(PACKET_MARKER_LENGTH)`), keeping Part 1 decoupled from Part 2 (`K = 14`).
- **Visualization**: `TuningTroubleVisualizer` renders the scrolling signal tape deck, duplicate collision jump arcs, and 26-letter `lastSeen` register via `SignalTapeVisualizer`, capped at `120` sampled frames by default.
