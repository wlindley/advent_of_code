# 2019 Day 19 Part 1 — Tractor Beam

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 19 1` (or pass `--input <path>`).
- **Behavior**: Parses an Intcode drone program and counts pulled points across the `50x50` sector `x, y in [0, 49]`.
- **Visualizer**: `viz/Visualizer.tsx` animates the row-by-row SVG span sweep via `TractorBeamVisualizer`.

## Maintainer Guide

- `domain/solver.ts` instantiates `new TractorBeamSolver(AREA_SCAN_POLICY)` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` binds `TractorBeamVisualizer` to Part 1's `solver`.
