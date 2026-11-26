# 2021 Day 1 Part 2 — Sonar Sweep (`2021/day01/part2`)

Counts consecutive three-measurement sliding-window sum increases (`W = 3`) across a sonar depth report.

## Consumer Interface

- `domain/solver.ts`: exports `PART2_WINDOW_SIZE` (`3`) and `solver` (`PuzzleSolver<SonarReport, number, SweepTraceFrame>`).
- `domain/index.ts`: barrel re-exporting `PART2_WINDOW_SIZE` and `solver`.
- `index.ts`: exports `manifest` (`PuzzlePartManifest`) with `meta`, `exampleInput`, `exampleAnswer` (`"5"`), `solver`, and `Visualizer`.
- `viz/Part2Visualizer.tsx`: binds `solver` and `PART2_WINDOW_SIZE` to `SonarSweepVisualizer`.

## Maintainer Architecture

- **Thin Part Layer**: `part2/domain` delegates parsing, stride-3 window-cancellation counting, and bounded trace sampling directly to `2021/day01/shared` (`W = 3`), keeping Part 2 cleanly separated from Part 1 (`W = 1`).
- **Visualization**: `Part2Visualizer` renders a bounded light-mode bathymetry profile (`<= 240` polyline points) and step-by-step comparison playback (`<= 120` frames) via `SonarSweepVisualizer`.
