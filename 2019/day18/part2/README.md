# 2019 Day 18 Part 2 — Many-Worlds Interpretation

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 18 2` (or pass `--input <path>`).
- **Behavior**: Accepts either a single-`@` vault (automatically splitting its open 3x3 center into `@#@/###/@#@`) or a pre-split 4-`@` vault, and computes the minimum total steps for four robots to collect all keys.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive HiDPI canvas playback of up to `240` sampled frames showing walls, doors, keys, and all four robot trails.

## Maintainer Guide

- `domain/solver.ts` instantiates `new VaultSolver(QUAD_ROBOT_POLICY)` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` delegates rendering to `VaultVisualizer` bound to Part 2's `solver`.
