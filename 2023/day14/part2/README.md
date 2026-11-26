# AoC 2023 Day 14 Part 2 — Parabolic Reflector Dish

## Consumer Guide

- **Domain entrypoint**: `2023/day14/part2/domain` exports `solver` (`PuzzleSolver<DishPlatform, number, Part2TraceStep>`), `solveSpinCycleLoad`, `analyzeSpinCycles`, `SpinCycleAnalysis`, `spinOnce`, `buildTraceFromAnalysis`, `traceSpinCycles`, `DEFAULT_TARGET_CYCLES` (`1_000_000_000`), and `DEFAULT_MAX_TRACE_STEPS` (`80`).
- **Web manifest**: `2023/day14/part2/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `DishPart2Visualizer` displays live telemetry badges (`Phase`, `μ / λ`, `North load`, `1e9 Target`), a HiDPI `DishCanvas` with per-row load bars, an interactive `RhoLoadChart` showing transient tail, cycle loop, closure arc, and projected target cycle, plus bounded `PlaybackControls`.

## Maintainer Architecture

- `domain/cycle.ts`: Implements `spinOnce` (`north -> west -> south -> east` via `TILT_DIRECTIONS`) and `SpinCycleAnalysis`, an immutable value object storing only `history`, `targetCycles`, and `cycleStart` (`null` if no repeat occurs within `targetCycles`), deriving `repeatCycle`, `cycleLength`, `equivalentCycle`, `finalPlatform`, `finalLoad`, and `loadSeries` dynamically via getters.
- `domain/trace.ts`: Converts a `SpinCycleAnalysis` into at most `DEFAULT_MAX_TRACE_STEPS` frozen `Part2TraceStep` frames (`initial`, `transient`, `cycle`, `closure`, `projection`), preserving endpoints and closure/projection frames even under tight `maxSteps` caps.
- `domain/solver.ts`: Exposes `solveSpinCycleLoad` and the frozen `solver` contract backed by `parseDishPlatform`.
- `domain/cycle.test.ts`, `domain/trace.test.ts`, `domain/solver.test.ts`: Unit tests covering official example grids/loads, exact closure and pre-closure boundaries, fixed points, 1-step transients, load-collision fingerprint checks, bounded trace sampling, `executeSolver` with a fake `Clock`, and invalid input/option rejection.
- `domain/solver.oracle.test.ts`: Differential oracle comparing `SpinCycleAnalysis` and `solver` against an independent O(1)-memory Floyd tortoise-and-hare detector and brute-force `spinOnce` across edge cases and 40 seeded random dishes.
