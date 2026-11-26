# 2024 Day 16 Shared — Reindeer Maze

## Consumer Guide

- **`index.ts`**: Pure TypeScript barrel exporting `ReindeerMaze`, `parseReindeerMaze`, `analyzeReindeerMaze`, `MazeAnalysis`, `buildMazeTrace`, `createReindeerMazeSolver`, and direction/cost primitives. Zero React/DOM imports.
- **`viz/`**: Exports `ReindeerMazeVisualizer` and `ReindeerMazeCanvas` (`showAllOptimalTiles` toggleable for Part 1 vs Part 2).

## Maintainer Guide

- **State encoding**: `(cell << 2) | dir` packed into `Int32Array` / `Float64Array` using `StateMinHeap` (`1` per forward step, `1000` per 90° turn).
- **Optimal seats & path**: `analyzeReindeerMaze` runs forward Dijkstra with `bestScore` pruning and an implicit tight-edge backward BFS from all optimal end states (`dist[s] === bestScore`) to populate `optimalMask`, plus deterministic canonical path extraction.
- **Bounded traces**: `buildMazeTrace` samples `'explore'`, `'reconstruct'`, and `'complete'` frames within `DEFAULT_MAX_TRACE_STEPS` (`120`).
