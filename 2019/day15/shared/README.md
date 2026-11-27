# Day 15 Shared Oxygen System Kernel

Pure TypeScript Intcode repair droid exploration, BFS distance-field solving, bounded trace sampling, and batched SVG layout modules shared across Advent of Code 2019 Day 15 parts.

## Consumer Guide

- `OxygenSystemSolver`: `PuzzleSolver` implementation parameterized by `SHORTEST_PATH_POLICY` (Part 1 fewest commands from origin to oxygen system) or `OXYGEN_FILL_MINUTES_POLICY` (Part 2 minutes for oxygen wavefront to fill every open cell).
- `executeOxygenSystem(program, limits?)`: Explores the full reachable compartment via iterative DFS with backtracking and returns an immutable `ShipMap`.
- `traceOxygenSystem(program, policy, maxSteps?, limits?)`: Uniformly samples up to `maxSteps` (`120` by default) `OxygenTraceFrame` snapshots across `'explore'` and `'solve'` phases.
- `buildOxygenSvgLayout(frame, policy)`: Batches compartment walls, open tiles, BFS wave/frontier cells, shortest path, and droid/origin/oxygen markers into compact SVG geometry.

## Maintainer Architecture

Module DAG (strictly acyclic, zero `viz/` imports in `index.ts`):
- `droidIo.ts` -> `2019/shared/intcode` (`IoChannel` with O(1) cursor-draining `takeOutput()`).
- `oxygenModels.ts` -> pure types, `ShipBounds`, `ShipMap` (dynamic `bounds`, `openCount`, `wallCount` getters), `OxygenPolicy`, and direction/status helpers.
- `shipSearch.ts` -> `oxygenModels.ts` (`DistanceField` and O(V) head-index queue BFS + path reconstruction).
- `shipExplorer.ts` -> `2019/shared/intcode`, `droidIo.ts`, `oxygenModels.ts` (iterative DFS mapping with strict VM step, move-count, output-protocol, and backtrack invariants).
- `oxygenSolver.ts` -> `shared/core`, `2019/shared/intcode`, `oxygenModels.ts`, `shipExplorer.ts`, `shipSearch.ts` (bounded two-phase trace sampler and policies).
- `vizLayout.ts` -> `oxygenModels.ts` (batched SVG geometry in `<= 8` primitives).
- `viz/ShipCompartmentVisualizer.tsx` -> React UI consuming the shared barrel and `shared/viz` `PlaybackControls`.
