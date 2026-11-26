# 2021 Day 2 Part 1 — Dive! (`2021/day02/part1`)

Computes the product of final horizontal position and depth under direct displacement rules.

## Consumer Interface

- `domain/solver.ts`: exports `solver` (`PuzzleSolver<SubmarineCourse, bigint, NavigationTraceFrame>`).
- `domain/index.ts`: barrel re-exporting `solver`.
- `index.ts`: exports `manifest` (`PuzzlePartManifest`) with `meta`, `exampleInput`, `exampleAnswer` (`"150"`), `solver`, and `Visualizer`.
- `viz/Part1Visualizer.tsx`: binds `solver` and `DIRECT_NAVIGATION_POLICY` to `DiveTrajectoryVisualizer`.

## Maintainer Architecture

- **Thin Part Layer**: `part1/domain` delegates parsing, pose stepping (`DIRECT_NAVIGATION_POLICY`), and bounded trace sampling directly to `2021/day02/shared`, keeping Part 1 isolated from Part 2 (`AIM_NAVIGATION_POLICY`).
- **Visualization**: `Part1Visualizer` renders a bounded light-mode 2D trajectory (`<= 240` sampled poses) and step-by-step playback (`<= 120` frames) via `DiveTrajectoryVisualizer`.
