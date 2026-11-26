# 2024 Day 12 Part 1 — Garden Groups

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for automatic site registry discovery.
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solver` (`PuzzleSolver<GardenMap, number, GardenTraceFrame>`); `./domain/index.ts` exports `PERIMETER_METRIC` and `solver`.
- **Visualizer**: `./viz/GardenGroupsPart1Visualizer.tsx` renders `GardenGroupsVisualizer` configured with `PERIMETER_METRIC`.

## Maintainer Guide

- **Architecture**: `part1/domain/` delegates parsing, flood-fill partitioning, total evaluation, and trace sampling to `../../shared`, supplying only `PERIMETER_METRIC`.
- **Perimeter Calculation**: For every cell `(r, c)` in a region, each of the 4 orthogonal neighbors `(r + dr, c + dc)` where `!partition.sameRegion(region.id, r + dr, c + dc)` adds 1 fence edge—covering outer borders as well as interior holes.
- **Verification**: Unit tests cover official examples, boundary shapes, nested holes, trace sampling, and a `DisjointSet` graph-identity oracle (`4 * area - 2 * internalEdges`) across 50 seeded random grids.
