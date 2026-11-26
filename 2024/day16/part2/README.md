# 2024 Day 16 Part 2 — Reindeer Maze (Best Seats)

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for site registry auto-discovery with the 15×15 official example (`45`).
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solver` (`PuzzleSolver<ReindeerMaze, number, MazeTraceFrame>`) backed by `part2Objective`.
- **Visualizer**: `./viz/ReindeerMazePart2Visualizer.tsx` renders `ReindeerMazeVisualizer` (`Part 2 (Best Seats)`) with `showAllOptimalTiles={true}`, animating Dijkstra exploration, canonical path reconstruction, and the final union of all optimal seat tiles.

## Maintainer Guide

- **Architecture**: `part2/domain/` defines `part2Objective` (throws `'End tile E is unreachable from start tile S'` if unreachable, else returns `analysis.optimalTileCount`) and wires `createReindeerMazeSolver(part2Objective)` from `../../shared`.
- **Verification**:
  - `domain/solver.test.ts`: covers Examples 1 (`45`) and 2 (`64`), `executeSolver` with a `FakeClock`, bounded trace frames (`showOptimalMask` revealed only on `'complete'`), corridor/turn/fork/multi-heading-`E` tie cases, and unreachable/malformed errors.
  - `domain/solver.oracle.test.ts`: cross-checks against an independent bidirectional Dijkstra oracle (including 30 seeded random reachable mazes) and an exhaustive state-visited DFS oracle on `<= 7×7` tie-heavy mazes.
