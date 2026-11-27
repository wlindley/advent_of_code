# 2019 Day 19 Part 2 — Tractor Beam

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 19 2` (or pass `--input <path>`).
- **Behavior**: Parses an Intcode drone program and finds the closest `100x100` square inside the beam, returning `x * 10000 + y`.
- **Visualizer**: `viz/Visualizer.tsx` animates the jump/walk boundary search and fitted square via `TractorBeamVisualizer`.

## Maintainer Guide

- `domain/solver.ts` instantiates `new TractorBeamSolver(CLOSEST_SQUARE_POLICY)` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` binds `TractorBeamVisualizer` to Part 2's `solver`.
