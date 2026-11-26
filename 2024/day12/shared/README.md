# 2024 Day 12 Shared Domain & Visualization

Shared pure-TypeScript garden partitioning, fence-cost evaluation, and interactive visualization components for Advent of Code 2024 Day 12 (Part 1 and Part 2 ready).

## Consumer Guide

Import pure domain types and helpers from `./index`:

- `parseGardenMap(raw)` / `GardenMap` — immutable rectangular grid of `A..Z` plant cells (`isValidPlant`).
- `partitionGarden(map)` / `RegionPartition` / `GardenRegion` — 4-connected plant regions in deterministic row-major order.
- `RegionFenceMetric` — strategy interface (`id`, `label`, `unit`, `measure(map, partition, region)`).
- `evaluateTotalFenceCost(map, metric)` / `traceGardenGroups(map, metric, options)` — total fence price and uniformly sampled `GardenTraceFrame` snapshots (`DEFAULT_MAX_TRACE_STEPS = 80`).
- `createGardenGroupsSolver(metric)` — produces a frozen `PuzzleSolver<GardenMap, number, GardenTraceFrame>`.

Visualizers in `./viz/` (`GardenGroupsVisualizer.tsx`, `GardenCanvas.tsx`) are `.tsx`-only React components parameterized by `{ rawInput, solver, metric }`.

## Maintainer Guide

- **Module DAG**: `map.ts` -> `regions.ts` -> `fence.ts` -> `solverFactory.ts` -> `index.ts`. Part modules depend on `shared/index.ts`; `shared/viz/` imports from `../index` and `../../../shared/viz`.
- **Invariants**: `GardenMap`, `GardenRegion`, `RegionPartition`, and `GardenTraceFrame` validate invariants on construction and `Object.freeze` themselves (`Int32Array` buffers stay private and unfrozen). Derived values (`area`, `regionPrice`) are computed dynamically via getters.
- **Flood-fill**: `partitionGarden` uses flat `Int32Array` buffers (`regionIdByCell`, BFS `queue`) for `O(R*C)` partitioning with zero per-cell object allocations.
