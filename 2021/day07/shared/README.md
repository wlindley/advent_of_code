# 2021 Day 7 Shared Domain & Visualization

## Consumer Guide

- **`2021/day07/shared`**: Pure TypeScript barrel exporting `FuelCostModel` (`LINEAR_FUEL_MODEL`, `TRIANGULAR_FUEL_MODEL`), `CrabFleet`, `parseCrabFleet`, `CrabAlignmentSolver`, `findOptimalAlignment`, `traceAlignmentSearch`, and chart/formatting helpers (`buildSwarmHistogram`, `buildFuelLandscape`, `scaleBigIntRange`, `formatSignedGroupedBigInt`, `formatSignedCompactBigInt`).
- **`2021/day07/shared/viz/CrabAlignmentVisualizer.tsx`**: Reusable interactive visualizer rendered by Part 1 (and Part 2) with playback over binary-search bracket narrowing, swarm coordinate histogram, and convex fuel landscape chart.

## Maintainer Guide

- **One-way DAG**: `shared/core` -> `fuelModel` -> `fleet` -> `parser` / `alignment` -> `chart` -> `shared/index.ts` -> `part1/domain/` -> `shared/viz/` -> `part1/viz/`.
- **Exact BigInt arithmetic**: All positions, distances, and fuel totals use `bigint` with `floorDiv`/`ceilDiv` so arbitrary coordinates (including negative or `> 2^100`) never lose precision.
- **Convex discrete search**: `stepAlignmentBracket` probes `mid` and `mid + 1` to halve `[lo, hi]` in `O(N log(max - min))` time, breaking ties leftward (`midFuel <= nextFuel`).
- **UI isolation**: `shared/index.ts` contains zero `viz/` imports; all `viz/` modules use `.tsx` extensions exclusively.
