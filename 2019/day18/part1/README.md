# 2019 Day 18 Part 1 — Many-Worlds Interpretation

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 18 1` (or pass `--input <path>`).
- **Behavior**: Parses an ASCII underground vault map (`#`, `.`, `@`, `a-z`, `A-Z`) with one entrance and finds the minimum step count to collect all keys.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive HiDPI canvas playback of up to `240` sampled frames showing walls, doors, keys, and the explorer trail.

## Maintainer Guide

- `domain/solver.ts` instantiates `new VaultSolver(SINGLE_EXPLORER_POLICY)` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` delegates rendering to `VaultVisualizer` bound to Part 1's `solver`.
