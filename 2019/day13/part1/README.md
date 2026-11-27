# 2019 Day 13 Part 1 — Care Package

## Consumer Guide

- **Entry point**: `manifest` in `index.ts` and `solver` in `domain/solver.ts`.
- **CLI execution**: `npm run aoc -- run 2019 13 1` (or pass `--input <path>`).
- **Behavior**: Parses an Intcode arcade program, executes it to completion while decoding `(x, y, tileId)` triples onto a sparse screen coordinate map, and returns the count of remaining block tiles (`tileId === 2`).
- **Visualizer**: `viz/Visualizer.tsx` renders an interactive playback of up to `120` uniformly sampled frames on an Atari-style Breakout screen with rainbow block bands, paddle, ball, and recent ball trail.

## Maintainer Guide

- `domain/solver.ts` instantiates `new ArcadeSolver(BLOCK_COUNT_POLICY)` from `../../shared`, delegating VM execution, triple decoding, and trace replay to the shared Day 13 kernel.
- `domain/index.ts` re-exports `solver` for manifest and CLI consumers with zero React or DOM imports.
- `viz/Visualizer.tsx` delegates rendering to `ArcadeCabinetVisualizer` bound to Part 1's `solver`.
