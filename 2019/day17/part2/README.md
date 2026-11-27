# 2019 Day 17 Part 2 — Set and Forget

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 17 2` (or pass `--input <path>`).
- **Behavior**: Captures the scaffold grid, traces a greedy straight-segment path across all scaffold cells, compresses the movement sequence into `Main` + `A`/`B`/`C` ASCII routines (`<= 20` characters each), and runs a patched `memory[0] = 2` Intcode VM to return the collected dust as a `bigint`.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive sweep playback of up to `120` sampled frames showing the compressed routines, robot heading, swept path, and final dust count.

## Maintainer Guide

- `domain/solver.ts` instantiates `new ScaffoldSolver(DUST_COLLECTION_POLICY)` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` delegates rendering to `ScaffoldVisualizer` bound to Part 2's `solver`.
