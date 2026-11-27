# Day 20 Shared Donut Maze Solver Kernel

Pure TypeScript Donut Maze parser, all-pairs portal corridor graph, depth-parameterized Dijkstra search, bounded trace sampler, and canvas layout helpers shared across Advent of Code 2019 Day 20 Parts 1 and 2.

## Consumer Guide

- `DonutSolver`: `PuzzleSolver` parameterized by `FLAT_DONUT_POLICY` (Part 1) or `RECURSIVE_DONUT_POLICY` (Part 2).
- `parseDonutMaze(raw)`: Immutable `DonutMaze` with private unfrozen `Uint8Array` ASCII grid and margin-invariant `outer`/`inner` portal classification.
- `buildPortalGraph(maze)` & `solveDonutMaze(maze, policy)`: Corridor-BFS portal graph + Dijkstra over `(depth, portalId)` states checking goal on pop.
- `computeDonutRenderMetrics`, `computeDepthStats`, `formatDonutStatus`: Canvas sizing, depth telemetry, and status formatting helpers.

## Maintainer Architecture

Module DAG (strictly acyclic, zero `viz/` imports in `index.ts`):
- `maze.ts` -> `shared/core` (`DIRS_4`)
- `policy.ts` -> `maze.ts`
- `graph.ts` -> `shared/core` (`DIRS_4`), `maze.ts`
- `search.ts` -> `shared/core` (`MinHeap`), `graph.ts`, `maze.ts`, `policy.ts`
- `solver.ts` -> `shared/core`, `graph.ts`, `maze.ts`, `policy.ts`, `search.ts`
- `vizLayout.ts` -> `maze.ts`, `solver.ts`
- `viz/DonutVisualizer.tsx` -> React HiDPI `<canvas>` UI consuming `shared/index.ts` and `shared/viz` `PlaybackControls`.
