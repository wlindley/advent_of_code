# 2021 Day 15 Part 1 — Chiton

Computes the lowest cumulative entry-risk path from `(0, 0)` to `(rows - 1, cols - 1)` across a `1..9` risk grid using four-directional orthogonal movement.

## Consumer Usage

- **CLI / Domain Solver (`part1/domain/solver.ts`)**: Exports `solver = new CavernRiskSolver(PART1_POLICY)` implementing `parse`, `analyze`, `solve`, `trace`, and `formatAnswer`.
- **Site Manifest (`part1/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the `10×10` example (`40`) and `Part1Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part1/domain/` delegates exclusively to `../../shared/` with zero React or DOM imports.
- **Visualization (`part1/viz/Part1Visualizer.tsx`)**: Thin wrapper rendering `CavernVisualizer`, animating the iso-risk Dijkstra wavefront and optimal path reveal over an `ImageData` heatmap.
