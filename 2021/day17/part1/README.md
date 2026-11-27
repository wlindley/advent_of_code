# 2021 Day 17 Part 1 — Trick Shot

Finds the maximum apex y-coordinate achievable by any integer launch velocity `(vx, vy)` whose discrete step trajectory intersects the target trench rectangle.

## Consumer Usage

- **CLI / Domain Solver (`part1/domain/solver.ts`)**: Exports `solver = new TrickShotSolver(MAX_APEX_POLICY)` implementing `parse`, `analyze`, `solve`, `trace`, and `formatAnswer`.
- **Site Manifest (`part1/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the official example (`45`) and `Part1Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part1/domain/` delegates exclusively to `../../shared/` with zero React or DOM imports.
- **Visualization (`part1/viz/Part1Visualizer.tsx`)**: Thin wrapper rendering `TrickShotVisualizer`, animating the `vy` phase-space sweep and the winning max-apex ballistic trajectory arc.
