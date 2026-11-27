# 2021 Day 13 Part 2 — Transparent Origami

Applies every orthogonal fold instruction to transparent paper and decodes the resulting 5x6 bitmap capital letters into the activation code.

## Consumer Usage

- **CLI / Core Solver (`part2/domain/solver.ts`)**: Exports `solver = new OrigamiSolver(ALL_FOLDS_CODE_POLICY)`. Run via `npm run aoc -- run 2021 13 2`.
- **Site Manifest (`part2/index.ts`)**: Exports `manifest: PuzzlePartManifest` with the 26-dot 2-fold example (`HI`) and `Part2Visualizer`.

## Maintainer Notes

- **Domain Boundary**: `part2/domain/` delegates entirely to `../../shared/` (`ALL_FOLDS_CODE_POLICY` + `OrigamiSolver`) with zero React/DOM imports.
- **Visualization (`part2/viz/Part2Visualizer.tsx`)**: Thin wrapper delegating to `OrigamiVisualizer` (`../../shared/viz/OrigamiVisualizer`), animating every fold step with live OCR preview when the sheet reaches 6 rows.
