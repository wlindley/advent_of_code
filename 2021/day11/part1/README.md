# 2021 Day 11 Part 1 — Dumbo Octopus

## Consumer Guide

- **Solver**: `export const solver` in `domain/solver.ts` (`OctopusSolver(TOTAL_FLASHES_100_POLICY)`), returning total flashes after 100 steps (`1656` on the 10×10 example).
- **Manifest**: `export const manifest` in `index.ts` registers metadata, the 10×10 example, `solver`, and `Part1Visualizer`.
- **Visualizer**: `Part1Visualizer` delegates to `OctopusVisualizer`, animating the 2D energy heatmap, flashed cells, step-by-step flash sparkline, and playback controls.

## Maintainer Guide

- `domain/` has zero DOM/React imports and injects `TOTAL_FLASHES_100_POLICY` into `OctopusSolver`.
- `Part1Visualizer` is a thin wrapper over `2021/day11/shared/viz/OctopusVisualizer`.
- All grid validation, BFS cascade simulation, trace sampling, and policy logic reside in `2021/day11/shared/`.
