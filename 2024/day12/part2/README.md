# 2024 Day 12 Part 2 — Garden Groups (Bulk Discount Sides)

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for automatic site registry discovery.
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solver` (`PuzzleSolver<GardenMap, number, GardenTraceFrame>`); `./domain/index.ts` exports `SIDES_METRIC` and `solver`.
- **Visualizer**: `./viz/GardenGroupsPart2Visualizer.tsx` renders `GardenGroupsVisualizer` configured with `SIDES_METRIC`.

## Maintainer Guide

- **Architecture**: `part2/domain/` delegates parsing, flood-fill partitioning, total evaluation, and trace sampling to `../../shared`, supplying only `SIDES_METRIC`.
- **Sides Calculation**: On any rectilinear polygon (including regions with interior holes or diagonally touching corners), the number of straight sides equals the number of vertices (corners). For each cell `(r, c)` in a region and each diagonal quadrant `(dr, dc) ∈ {(-1,-1), (-1,1), (1,1), (1,-1)}`, `partition.sameRegion(region.id, ...)` detects:
  - **Convex corner**: both orthogonal neighbors `(r + dr, c)` and `(r, c + dc)` are outside the region.
  - **Concave corner**: both orthogonal neighbors are inside the region, while the diagonal neighbor `(r + dr, c + dc)` is outside.
- **Verification**: Unit tests cover all five official Part 2 examples, geometric/diagonal-pinch edge cases, trace sampling, invalid inputs, and an independent directed edge-run merging oracle across 50 seeded random grids.
