# 2024 Day 16 Part 1 — Reindeer Maze

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for site registry auto-discovery with the 15×15 official example (`7036`).
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solver` (`PuzzleSolver<ReindeerMaze, number, MazeTraceFrame>`) backed by `part1Objective`.
- **Visualizer**: `./viz/ReindeerMazePart1Visualizer.tsx` renders `ReindeerMazeVisualizer` (`Part 1 (Lowest Score)`) with Canvas 2D Dijkstra wave propagation, canonical path reconstruction, and live score HUD.

## Maintainer Guide

- **Architecture**: `part1/domain/` defines `part1Objective` (throws if `E` is unreachable, else returns `analysis.bestScore`) and wires `createReindeerMazeSolver(part1Objective)` from `../../shared`.
- **Verification**: `solver.test.ts` checks Examples 1 (`7036`) and 2 (`11048`), `executeSolver` with a deterministic clock fake, bounded traces, and unreachable-target errors; `shared/dijkstra.oracle.test.ts` cross-checks against an independent SPFA oracle across examples, edge cases, and 40 seeded random mazes.
