# 2020 Day 6 Part 1: Custom Customs

## Consumer Guide

- **Manifest**: `export const manifest: PuzzlePartManifest` in `2020/day06/part1/index.ts`.
- **Solver**: `export const solver` in `2020/day06/part1/domain/solver.ts` implements `PuzzleSolver<CustomsBatch, number, CustomsTraceFrame>`.
- **Example**: 5-group official example -> `11`.
- **Visualizer**: `CustomCustomsPart1Visualizer` renders each group's 26-question responder matrix, per-question vote bars, OR/AND consensus strips, and shared `PlaybackControls`.

## Maintainer Design

- `part1/domain/solver.ts` binds `new CustomsSolver(ANY_YES_POLICY)` from `2020/day06/shared`.
- `part1/viz/CustomCustomsPart1Visualizer.tsx` passes `ANY_YES_POLICY` to `CustomsVisualizer`.
- Bitmask encoding, SWAR popcount, group parsing, consensus policies, and budget-sampled traces live in `2020/day06/shared/` for reuse in Part 2.
