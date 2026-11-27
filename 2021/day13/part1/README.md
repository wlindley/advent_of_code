# 2021 Day 13 Part 1 — Transparent Origami

Counts the distinct visible dots remaining after applying the first orthogonal fold instruction to a sheet of transparent paper.

## Consumer Usage

- **CLI / Core Solver (`part1/domain/solver.ts`)**: Exports `solver = new OrigamiSolver(FIRST_FOLD_COUNT_POLICY)`, implementing `parse`, `solve`, and `trace`.
- **Site Manifest (`part1/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the official 18-dot example (`17`) and `Part1Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part1/domain/` delegates entirely to `../../shared/` (`FIRST_FOLD_COUNT_POLICY` + `OrigamiSolver`) with zero React/DOM imports.
- **Visualization (`part1/viz/Part1Visualizer.tsx`)**: Thin wrapper delegating to `OrigamiVisualizer`, which animates the initial sheet with the upcoming crease and the post-fold merged/reflected dots.
