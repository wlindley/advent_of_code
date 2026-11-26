# 2021 Day 2 Part 2 — Dive! (`2021/day02/part2`)

Computes the product of final horizontal position and depth under aim-steered navigation rules.

## Consumer Interface

- `domain/solver.ts`: exports `solver` (`PuzzleSolver<SubmarineCourse, bigint, NavigationTraceFrame>`).
- `domain/index.ts`: barrel re-exporting `solver`.
- `index.ts`: exports `manifest` (`PuzzlePartManifest`) with `meta`, `exampleInput`, `exampleAnswer` (`"900"`), `solver`, and `Visualizer`.
- `viz/Part2Visualizer.tsx`: binds `solver` and `AIM_NAVIGATION_POLICY` to `DiveTrajectoryVisualizer`.

## Maintainer Architecture

- **Thin Part Layer**: `part2/domain` delegates parsing, pose stepping (`AIM_NAVIGATION_POLICY`), and bounded trace sampling directly to `2021/day02/shared`, keeping Part 2 isolated from Part 1 (`DIRECT_NAVIGATION_POLICY`).
- **Visualization**: `Part2Visualizer` renders a bounded light-mode 2D trajectory (`<= 240` sampled poses), aim tangent ray, and step-by-step playback (`<= 120` frames) via `DiveTrajectoryVisualizer`.
