# 2024 Day 10 Part 1 — Hoof It

## Consumer Guide
Computes the total trailhead score across all height-`0` cells in a topographic grid, where each trailhead's score is the count of distinct height-`9` peaks reachable via strictly `+1` orthogonal steps.

- `domain/index.ts` exports `SCORE_METRIC`, `solveHoofItPart1`, `traceHoofItPart1`, and `solver` (`PuzzleSolver<TopographicMap, number, TrailheadTraceFrame>`).
- `index.ts` exports `manifest` for site auto-discovery (`site/registry.ts`).
- `viz/HoofItPart1Visualizer.tsx` renders the interactive elevation heatmap, active trailhead basin, and reachable peak beacons with playback controls.

## Maintainer Guide
- `SCORE_METRIC` implements `PeakContributionMetric` (`mode: 'score'`), validating `pathCount >= 1` and returning `1` per reachable peak.
- Trailhead exploration and trace sampling live in `../../shared/trails.ts` so Part 2 can swap only the `PeakContributionMetric` strategy.
- Correctness is cross-checked in `domain/solver.oracle.test.ts` against an independent bottom-up `9 -> 0` `BigInt` bitset DP oracle across all 5 official examples and 40 seeded random grids.
