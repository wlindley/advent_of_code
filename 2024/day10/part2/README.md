# 2024 Day 10 Part 2 — Hoof It

## Consumer Guide
Computes the total trailhead rating across all height-`0` cells in a topographic grid, where each trailhead's rating is the number of distinct uphill hiking trails ascending by strictly `+1` orthogonal steps to any height-`9` peak.

- `domain/index.ts` exports `RATING_METRIC`, `solveHoofItPart2`, `traceHoofItPart2`, and `solver` (`PuzzleSolver<TopographicMap, number, TrailheadTraceFrame>`).
- `index.ts` exports `manifest` for site auto-discovery (`site/registry.ts`).
- `viz/HoofItPart2Visualizer.tsx` renders the interactive elevation heatmap, active trailhead basin, and per-peak trail multiplicity beacons with playback controls.

## Maintainer Guide
- `RATING_METRIC` implements `PeakContributionMetric` (`mode: 'rating'`), validating `pathCount >= 1` and returning `pathCount` for each reachable height-`9` peak.
- Trailhead exploration, DAG path-count accumulation, and trace sampling live in `../../shared/trails.ts`, keeping Part 2 completely decoupled from Part 1.
- Correctness is cross-checked in `domain/solver.oracle.test.ts` against both a global bottom-up `9 -> 0` elevation-layered DP oracle (up to `57x57` grids) and an unmemoized 10-cell path-enumeration DFS oracle (up to `8x8` grids).
