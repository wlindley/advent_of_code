# 2023 Day 06 Shared Domain & Parabola Viz

## Consumer Guide

- **Domain barrel** ([index.ts](index.ts)): strictly pure TypeScript exports (`bigintIsqrt`, `BoatRace`, `RaceSheet`, `extractRaceRows`, `parseUnsignedBigInt`, `parseRaceColumns`, `RaceTraceFrame`, `sampleRaceParabola`, `traceRaceSheet`, `ratioBigInt`, `DEFAULT_MAX_TRACE_STEPS`, `DEFAULT_PARABOLA_SEGMENTS`).
- **Reusable visualizer** ([viz/RaceParabolaVisualizer.tsx](viz/RaceParabolaVisualizer.tsx)): renders any `PuzzleSolver<RaceSheet, bigint, RaceTraceFrame>` as an interactive quadratic parabola explorer.

## Maintainer Guide

- `BoatRace` solves $h(T - h) > D$ in $O(1)$ arithmetic via shifted discriminant $\Delta = T^2 - 4(D + 1)$ and exact floor square root `bigintIsqrt`, returning a `ClosedInterval` over `[hMin, hMax]`.
- `sampleRaceParabola` bounds chart geometry to at most `maxSegments` intervals while preserving `peakHold` and `winningRange` endpoints; `ratioBigInt` scales arbitrarily large `bigint` coordinates into `[0, 1]`.
- `shared/index.ts` intentionally omits `.tsx` re-exports so pure Node/CLI consumers never pull React/DOM types.
