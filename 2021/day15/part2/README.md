# 2021 Day 15 Part 2 — Chiton

Expands the base `1..9` risk grid into a `5×5` tiled cavern with wrap-around risk increments and computes the lowest cumulative entry-risk path from `(0, 0)` to `(rows - 1, cols - 1)` using four-directional orthogonal movement.

## Consumer Usage

- **CLI / Domain Solver (`part2/domain/solver.ts`)**: Exports `solver = new CavernRiskSolver(PART2_POLICY)` implementing `parse`, `analyze`, `solve`, `trace`, and `formatAnswer`.
- **Site Manifest (`part2/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the `10×10` example (`315`) and `Part2Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part2/domain/` delegates exclusively to `../../shared/` with zero React or DOM imports and zero imports from `part1/`.
- **Visualization (`part2/viz/Part2Visualizer.tsx`)**: Thin wrapper rendering `CavernVisualizer`, animating the iso-risk Dijkstra wavefront and optimal path reveal over an `ImageData` heatmap.
