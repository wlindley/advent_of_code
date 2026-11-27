# 2019 Day 20 Part 1 — Donut Maze

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 20 1` (or pass `--input <path>`).
- **Behavior**: Parses a torus maze (`#`, `.`, spaces, two-letter portal labels) and computes the minimum step count from `AA` to `ZZ` across flat portal warps.
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive HiDPI canvas playback of up to `240` sampled frames showing corridors, portal markers, and dashed golden warp arcs.

## Maintainer Guide

- `domain/solver.ts` instantiates `new DonutSolver(FLAT_DONUT_POLICY)` from `../../shared`.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` delegates rendering to `DonutVisualizer` bound to Part 1's `solver`.
