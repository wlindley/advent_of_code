# 2021 Day 3 Part 1 — Binary Diagnostic (`2021/day03/part1`)

Computes submarine power consumption as the product of gamma (most-common column bits) and epsilon (least-common column bits).

## Consumer Interface

- `domain/solver.ts`: exports `solver` (`PuzzleSolver<DiagnosticReport, bigint, PowerTraceFrame>`).
- `domain/index.ts`: barrel re-exporting `solver`.
- `index.ts`: exports `manifest` (`PuzzlePartManifest`) with `meta`, `exampleInput`, `exampleAnswer` (`"198"`), `solver`, and `Visualizer`.
- `viz/Part1Visualizer.tsx`: binds `solver` to `PowerDiagnosticVisualizer`.

## Maintainer Architecture

- **Thin Part Layer**: `part1/domain` delegates parsing, column bit tallying, BigInt rate accumulation, and bounded trace sampling directly to `2021/day03/shared`.
- **Visualization**: `Part1Visualizer` renders a light-mode stacked bit-proportion chart (`<= 64` visible columns) and column-by-column playback (`<= 120` frames) via `PowerDiagnosticVisualizer`.
