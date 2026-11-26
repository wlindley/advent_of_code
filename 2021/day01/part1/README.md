# 2021 Day 1 Part 1 — Sonar Sweep (`2021/day01/part1`)

Counts consecutive single-reading depth increases (`W = 1`) across a sonar depth report.

## Consumer Interface

- `domain/solver.ts`: exports `PART1_WINDOW_SIZE` (`1`) and `solver` (`PuzzleSolver<SonarReport, number, SweepTraceFrame>`).
- `domain/index.ts`: barrel re-exporting `PART1_WINDOW_SIZE` and `solver`.
- `index.ts`: exports `manifest` (`PuzzlePartManifest`) with `meta`, `exampleInput`, `exampleAnswer` (`"7"`), `solver`, and `Visualizer`.
- `viz/Part1Visualizer.tsx`: binds `solver` and `PART1_WINDOW_SIZE` to `SonarSweepVisualizer`.

## Maintainer Architecture

- **Thin Part Layer**: `part1/domain` delegates parsing, increase counting, and bounded trace sampling directly to `2021/day01/shared` (`W = 1`), keeping Part 1 cleanly separated from Part 2 (`W = 3`).
- **Visualization**: `Part1Visualizer` renders a bounded light-mode bathymetry profile (`<= 240` polyline points) and step-by-step comparison playback (`<= 120` frames) via `SonarSweepVisualizer`.
