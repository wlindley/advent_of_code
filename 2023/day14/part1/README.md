# AoC 2023 Day 14 Part 1 — Parabolic Reflector Dish

## Consumer Guide

- **Domain entrypoint**: `2023/day14/part1/domain` exports `solver` (`PuzzleSolver<DishPlatform, number, Part1TraceStep>`), `solveNorthTiltLoad`, `traceNorthTilt`, and `DEFAULT_MAX_TRACE_STEPS = 80`.
- **Web manifest**: `2023/day14/part1/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `DishPart1Visualizer` displays telemetry badges (grid dimensions, settled columns, rounded rock count, live north load), a HiDPI `DishCanvas` with a north-edge indicator, column sweep highlight, and per-row load bars, plus bounded `PlaybackControls`.

## Maintainer Architecture

- `domain/solver.ts`: Delegates parsing to `parseDishPlatform`, tilts north via `platform.tilt('north')`, and reads the dynamically computed `northLoad` getter.
- `domain/trace.ts`: Uses `sampleTraceIndices(platform.width + 1, limit)` to build at most `DEFAULT_MAX_TRACE_STEPS` snapshots showing left-to-right column settling without mutating `DishPlatform`.
- `domain/solver.test.ts`: Tests the official example (`136`), edge grids, `executeSolver` with a deterministic clock fake, bounded `maxSteps` sampling, and invalid option rejection.
- `domain/solver.oracle.test.ts`: Cross-checks `solver` against an independent zero-mutation top-to-bottom arithmetic column-load accumulator across edge cases and 60 seeded random grids.
