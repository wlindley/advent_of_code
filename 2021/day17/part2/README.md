# 2021 Day 17 Part 2 — Trick Shot

Counts all distinct integer launch velocities `(vx, vy)` whose discrete step trajectory intersects the target trench rectangle.

## Consumer Usage

- **CLI / Domain Solver (`part2/domain/solver.ts`)**: Exports `solver = new TrickShotSolver(VALID_VELOCITY_COUNT_POLICY)` implementing `parse`, `analyze`, `solve`, `trace`, and `formatAnswer`.
- **Site Manifest (`part2/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the official example (`112`) and `Part2Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part2/domain/` delegates exclusively to `../../shared/` with zero React or DOM imports.
- **Visualization (`part2/viz/Part2Visualizer.tsx`)**: Thin wrapper rendering `TrickShotVisualizer`, animating the `vy` phase-space sweep, running valid-velocity count, and representative ballistic trajectory arc.
