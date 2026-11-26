# 2022 Day 15 Part 1 — Beacon Exclusion Zone

## Consumer Guide
- **Domain entry**: `./domain/index.ts` exports `solver` (bound to `PART1_TARGET_Y = 2_000_000`), `createPart1Solver(targetY)`, `buildExclusionTrace`, `ExclusionTraceFrame`, and `DEFAULT_MAX_TRACE_STEPS`.
- **Site manifest**: `./index.ts` exports `manifest: PuzzlePartManifest`, automatically routing the official example input to `y = 10` (`26`) and custom inputs to `y = 2_000_000`.
- **CLI execution**: `solver` in `./domain/solver.ts` implements `PuzzleSolver<readonly SensorReading[], bigint, ExclusionTraceFrame>` for `tools/aoc/cli.ts`.

## Maintainer Notes
- **Algorithm**: Each `SensorReading` computes its Manhattan radius in `bigint` and projects onto `y = targetY` via `rowSlice(targetY)`. `mergedRowCoverage` merges all non-null intervals with `IntervalUnion`, and `countExcludedOnRow` subtracts `distinctBeaconXsOnRow.size`.
- **Trace invariants**: `buildExclusionTrace` samples `readings.length + 1` prefix counts bounded by `DEFAULT_MAX_TRACE_STEPS` (`120`), constructing each `ExclusionTraceFrame` from strictly the prefix `readings[0..processed - 1]`. `ExclusionTraceFrame` stores no derived counts; all metrics are dynamic getters.
- **Visualization**: `ExclusionZoneVisualizer.tsx` renders KPI badges, `SensorMapSvg.tsx`, and `PlaybackControls` inside `<div className="stack">`.
