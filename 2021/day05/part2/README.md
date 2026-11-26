# 2021 Day 5 Part 2 — Hydrothermal Venture

Counts integer lattice points where at least two horizontal, vertical, or 45-degree diagonal hydrothermal vent segments overlap.

## Consumer Interface

- `domain/index.ts` / `domain/solver.ts`: exports `solver` (`PuzzleSolver<VentField, number, VentTraceFrame>`).
- `viz/Part2Visualizer.tsx`: binds `solver` and `OCTILINEAR_POLICY` to `VentFieldVisualizer`.
- `index.ts`: exports `manifest: PuzzlePartManifest`.

## Maintainer Architecture

- **Zero-Logic Wrapper**: `part2/domain/solver.ts` delegates directly to `createVentSolver(OCTILINEAR_POLICY)` in `2021/day05/shared`.
- **Bounded Visualization**: `VentFieldVisualizer` caps trace frames at `120` and cumulative hotspot coordinates at `25,000`, rendering segments and overlaps onto a HiDPI Canvas 2D viewport.
