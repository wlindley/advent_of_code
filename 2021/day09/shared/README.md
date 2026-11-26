# 2021 Day 9 Shared Domain & Visualization

## Consumer Guide

- **`2021/day09/shared`**: Pure TypeScript barrel exporting `Heightmap`, `RIDGE_HEIGHT`, `parseHeightmap`, `LowPoint`, `Basin`, `HeightmapAnalysis`, `analyzeHeightmap`, `LowPointScanFrame`, `BasinFloodFrame`, `SmokeBasinPolicy` (`LOW_POINT_RISK_POLICY`, `LARGEST_BASINS_PRODUCT_POLICY`, `LargestBasinsProductPolicy`), and `SmokeBasinSolver`.
- **`2021/day09/shared/viz/SmokeBasinVisualizer.tsx`**: Interactive Canvas 2D bathymetry visualizer supporting both Part 1 low-point pin accumulation and Part 2 multi-wave basin flood expansion.

## Maintainer Guide

- **One-way DAG**: `shared/core` -> `heightmap` -> `parser` / `basin` -> `trace` -> `policy` -> `solver` -> `shared/index.ts` -> `part1/domain/` -> `shared/viz/` -> `part1/viz/`.
- **Basin Analysis**: `analyzeHeightmap` finds strict 4-neighbor low points in row-major order, runs component-at-a-time iterative flat-`Int32Array`-queue BFS over `height < 9` cells (seeding from low points then sweeping remaining non-ridge plateaus), and maps all row-major low points into their enclosing basin.
- **Wave Tracing**: `LargestBasinsProductPolicy.buildTrace` counting-sorts non-ridge cells by BFS wave depth in `O(R * C)` time and emits bounded sampled `BasinFloodFrame` snapshots with live top-`N` basin products.
- **UI Isolation**: `shared/index.ts` contains zero `viz/` imports; all visualization modules live under `viz/` as `.tsx` files using `:root` CSS tokens resolved via `getComputedStyle`.
