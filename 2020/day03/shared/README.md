# Day 3 Shared Domain (`2020/day03/shared`)

Pure TypeScript domain and trace modules for Advent of Code 2020 Day 3 (*Toboggan Trajectory*).

## Consumer API (`shared/index.ts`)
- `parseForestMap` / `ForestMap`: parses `.` / `#` grids via `Grid2D.fromLines` with modular horizontal wrapping.
- `Slope`, `LandingStep`, `PART1_SLOPES`, `PART2_SLOPES`, `validateSlopes`: validated step deltas and dynamic landing coordinates.
- `evaluateTrajectory`, `countTreesOnSlope`, `multiplySlopeTreeCounts`, `TrajectoryRun`: O(rows / down) modular stride evaluation and `bigint` product aggregation.
- `traceTrajectories`, `SlopeProgress`, `TrajectoryTraceFrame`, `DEFAULT_MAX_TRACE_STEPS`: row-sampled simulation snapshots.
- `createTobogganSolver`: factory producing a `PuzzleSolver<ForestMap, bigint, TrajectoryTraceFrame>`.

## Maintainer Notes
- Strict one-way DAG: `forest` & `slope` -> `trajectory` & `traceModels` -> `trace` -> `solverFactory` -> `index.ts`.
- `viz/` contains React/canvas TSX components only and is never re-exported from `shared/index.ts`.
