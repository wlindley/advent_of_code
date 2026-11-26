# 2022 Day 6 Part 2 — Tuning Trouble (`2022/day06/part2`)

Finds the first start-of-message marker (14 consecutive distinct lowercase ASCII characters) in a datastream buffer.

## Consumer Interface

- `domain/solver.ts`: exports `MESSAGE_MARKER_LENGTH` (`14`) and `solver` (`MarkerSolver` implementing `PuzzleSolver<DatastreamBuffer, number, MarkerTraceFrame>`).
- `index.ts`: exports `manifest` (`PuzzlePartManifest`) with `exampleInput`, `exampleAnswer` (`"19"`), `solver`, and `Visualizer`.
- `viz/TuningTroublePart2Visualizer.tsx`: binds `solver` to `SignalTapeVisualizer` with `"Start-of-Message"` telemetry and `var(--accent)` accent.

## Maintainer Architecture

- **Thin Part Layer**: `part2/domain` delegates parsing, solving, and trace generation entirely to `2022/day06/shared` (`createMarkerSolver(MESSAGE_MARKER_LENGTH)`), keeping Part 2 decoupled from Part 1 (`K = 4`).
- **Visualization**: `TuningTroublePart2Visualizer` renders the scrolling signal tape deck, duplicate collision jump arcs, and 26-letter `lastSeen` register via `SignalTapeVisualizer`, capped at `120` sampled frames by default.
