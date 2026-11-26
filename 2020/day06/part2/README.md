# 2020 Day 6 Part 2: Custom Customs

## Consumer Guide

- **Manifest**: `export const manifest: PuzzlePartManifest` in `2020/day06/part2/index.ts`.
- **Solver**: `export const solver` in `2020/day06/part2/domain/solver.ts` implements `PuzzleSolver<CustomsBatch, number, CustomsTraceFrame>`.
- **Example**: 5-group official example -> `6`.
- **Visualizer**: `CustomCustomsPart2Visualizer` renders each group's 26-question responder matrix, per-question vote bars, OR/AND consensus strips, and shared `PlaybackControls`.

## Maintainer Design

- `part2/domain/solver.ts` binds `new CustomsSolver(ALL_YES_POLICY)` from `2020/day06/shared`.
- `part2/viz/CustomCustomsPart2Visualizer.tsx` passes `ALL_YES_POLICY` to `CustomsVisualizer`.
- Bitmask encoding, SWAR popcount, group parsing, consensus policies, and budget-sampled traces live in `2020/day06/shared/` and are shared cleanly across Part 1 and Part 2.
