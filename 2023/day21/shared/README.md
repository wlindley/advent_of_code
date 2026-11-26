# 2023 Day 21 Shared Domain

## Consumer Guide

Pure TypeScript modules for AoC 2023 Day 21 (*Step Counter*):

- `parseGardenMap(raw)` / `GardenMap`: parses `.`, `#`, `S` rectangular grids (preserving leading whitespace, stripping only trailing line endings) and exposes bounds-checked and wrapped rock lookups plus periodicity-readiness checks (`hasClearCardinalCross`, `hasClearOuterBorder`, `isQuadraticPeriodicReady`).
- `computeFiniteDistances(map, maxSteps)` / `FiniteDistanceMap`: bounded BFS distance map with `countReachableAt(step)` and `distanceHistogram()`.
- `countFiniteReachable(map, steps)` / `countInfiniteReachable(map, steps)`: exact finite and tight-tile-radius bounded infinite BFS plot counters.
- `QuadraticProgression`: exact `bigint` Newton forward-difference quadratic model from `y0, y1, y2`.
- `buildGardenTrace(map, steps, options)`: sampled step-by-step trace frames (`GardenTraceFrame`) using `distanceHistogram()` without per-step grid cloning.

## Maintainer Architecture

- **DAG**: `gardenMap.ts` -> `gardenBfs.ts` -> `gardenTrace.ts`; `quadraticExtrapolation.ts` is standalone; `index.ts` is a pure TS barrel with zero `viz/` imports.
- **Invariants**: All domain entities freeze `this` and defensively copy `Uint8Array`/`Int32Array` buffers without freezing TypedArrays. `countInfiniteReachable` relies on the `tileRadius` invariant guaranteeing every neighbor expanded at `dist < steps` lies strictly inside `[0, totalH) x [0, totalW)`, and enforces `MAX_INFINITE_BFS_CELLS` before buffer allocation.
