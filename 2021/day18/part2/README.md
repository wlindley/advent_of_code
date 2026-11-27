# 2021 Day 18 Part 2 — Snailfish

Finds the maximum magnitude obtainable from adding any two distinct snailfish homework numbers in either order and reducing their sum.

## Consumer Usage

- **CLI / Domain Solver (`part2/domain/solver.ts`)**: Exports `solver = new SnailfishSolver(MAX_PAIR_MAGNITUDE_POLICY)` implementing `parse`, `solve`, `trace`, and `formatAnswer`.
- **Site Manifest (`part2/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the official 10-line example (`3993`) and `Part2Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part2/domain/` delegates exclusively to `../../shared/` with zero React or DOM imports.
- **Visualization (`part2/viz/Part2Visualizer.tsx`)**: Thin wrapper rendering `SnailfishVisualizer`, animating the winning ordered pair addition, explosions, and splits as a flat leaf depth profile.
