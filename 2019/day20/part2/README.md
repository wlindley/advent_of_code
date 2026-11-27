# 2019 Day 20 Part 2 — Donut Maze

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 20 2` (or pass `--input <path>`).
- **Behavior**: Parses a torus maze and computes the shortest path from outer `AA` at depth `0` to outer `ZZ` at depth `0`, stepping `+1` depth through inner portals and `-1` depth through outer portals (`AA`/`ZZ` are walls at nonzero depth; outer warps are blocked at depth `0`).
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive HiDPI canvas playback of up to `240` sampled frames showing depth progression, peak depth, and warp telemetry.

## Maintainer Guide

- `domain/solver.ts` instantiates `new DonutSolver(RECURSIVE_DONUT_POLICY)` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` delegates rendering to `DonutVisualizer` bound to Part 2's `solver`.
