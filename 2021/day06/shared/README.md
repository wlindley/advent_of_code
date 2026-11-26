# 2021 Day 6 Shared Domain & Visualization

## Consumer Guide

Import pure domain types and helpers from `2021/day06/shared`:

- `parseLanternfishSchool(raw)` parses comma-separated timers (`0..8`) into an immutable `LanternfishSchool`.
- `LanternfishSchool.advance(days)` returns a new `LanternfishSchool` after `days` simulation steps using exact `bigint` cohort arithmetic.
- `LanternfishSolver(days)` implements `PuzzleSolver<LanternfishSchool, bigint, LanternfishTraceFrame>` with `PART1_DAYS` (80) and `PART2_DAYS` (256).
- `buildCohortBars(school)` and `buildGrowthCurve(frames, scaleMode)` prepare overflow-proof `0..1` ratios and compact labels for charts.

Import interactive React visualization components directly from `2021/day06/shared/viz/LanternfishVisualizer`.

## Maintainer Guide

- **Module DAG**: `shared/core` -> `school.ts` -> `parser.ts` / `simulation.ts` / `chart.ts` -> `shared/index.ts`. `shared/index.ts` must never import from `viz/`.
- **Invariants**:
  - `LanternfishSchool` and `LanternfishTraceFrame` freeze themselves and their internal 9-tuples; derived values (`totalPopulation`, `spawningCount`, `newbornCount`, `maxCohortCount`, `spawnedToday`) are computed dynamically via getters.
  - All population counts use `bigint` and `bigintLog2` / integer scaling so arbitrarily large horizons never overflow `Number.MAX_VALUE`.
  - Every module maintains 100% statement, branch, function, and line coverage.
