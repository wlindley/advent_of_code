# 2023 Day 05 Part 1 — If You Give A Seed A Fertilizer

## Consumer Guide

- **Domain entrypoint** ([domain/index.ts](domain/index.ts)): exports `solver` (`parse`, `solve`, `trace`), `DEFAULT_MAX_TRACE_STEPS` (`200`), `StageTransition`, `SeedJourneyFrame`, `mapSeedToLocation`, `traceSeedJourney`, `findLowestLocation`, and `traceAlmanac`.
- **Site manifest** ([index.ts](index.ts)): registers puzzle metadata, official 4-seed example (`exampleAnswer: '35'`), `solver`, and `AlmanacJourneyVisualizer`.

## Maintainer Guide

- `RangeMap` sorts rules by `source.start` using an explicit `bigint` comparator and binary-searches each stage value, falling back to identity when unmatched.
- `traceAlmanac` tracks the exact global minimum across every seed while sampling full `StageTransition[]` journeys for up to `maxSteps` seeds via `sampleTraceIndices`.
- `AlmanacJourneyVisualizer` normalizes `bigint` values into `[0, 1]` using integer scaling (`(value - min) * 1000n / (max - min)`) to preserve precision above `Number.MAX_SAFE_INTEGER` and keep identity segments horizontal on the parallel-coordinates SVG.
