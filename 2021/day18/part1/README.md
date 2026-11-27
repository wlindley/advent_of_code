# 2021 Day 18 Part 1 — Snailfish

Computes the magnitude of the sequential left-to-right sum of nested snailfish number pairs after applying leftmost explode and split reduction rules.

## Consumer Usage

- **CLI / Domain Solver (`part1/domain/solver.ts`)**: Exports `solver = new SnailfishSolver(HOMEWORK_SUM_POLICY)` implementing `parse`, `solve`, `trace`, and `formatAnswer`.
- **Site Manifest (`part1/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the official 10-line example (`4140`) and `Part1Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part1/domain/` delegates exclusively to `../../shared/` with zero React or DOM imports.
- **Visualization (`part1/viz/Part1Visualizer.tsx`)**: Thin wrapper rendering `SnailfishVisualizer`, animating sampled additions, explosions, and splits as a flat leaf depth profile.
