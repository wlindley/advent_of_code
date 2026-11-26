# 2021 Day 5 Part 1 — Hydrothermal Venture

Counts integer lattice points where at least two horizontal or vertical hydrothermal vent segments overlap.

## Consumer Interface

- `domain/index.ts` / `domain/solver.ts`: exports `solver` (`PuzzleSolver<VentField, number, VentTraceFrame>`).
- `viz/Part1Visualizer.tsx`: binds `solver` and `AXIS_ALIGNED_POLICY` to `VentFieldVisualizer`.
- `index.ts`: exports `manifest: PuzzlePartManifest`.

## Maintainer Architecture

- **Zero-Logic Wrapper**: `part1/domain/solver.ts` delegates directly to `createVentSolver(AXIS_ALIGNED_POLICY)` in `2021/day05/shared`.
- **Bounded Visualization**: `VentFieldVisualizer` caps trace frames at `120` and cumulative hotspot coordinates at `25,000`, rendering segments and overlaps onto a HiDPI Canvas 2D viewport.
