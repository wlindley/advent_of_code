# 2021 Day 11 Part 2 — Dumbo Octopus

## Consumer Guide

- **Solver**: `export const solver` in `domain/solver.ts` (`OctopusSolver(FIRST_SYNC_STEP_POLICY)`), returning the first 1-based step where all octopuses flash simultaneously (`195` on the 10×10 example).
- **Manifest**: `export const manifest` in `index.ts` registers metadata, the 10×10 example, `solver`, and `Part2Visualizer`.
- **Visualizer**: `Part2Visualizer` delegates to `OctopusVisualizer`, animating the 2D energy heatmap, flashed cells, step-by-step flash sparkline, and playback controls up to synchronization.

## Maintainer Guide

- `domain/` has zero DOM/React imports and injects `FIRST_SYNC_STEP_POLICY` into `OctopusSolver`.
- `Part2Visualizer` is a thin wrapper over `2021/day11/shared/viz/OctopusVisualizer`.
- All grid validation, BFS cascade simulation, trace sampling, and policy logic reside in `2021/day11/shared/`.
