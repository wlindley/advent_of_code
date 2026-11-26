# Day 12 Shared Domain (`2023/day12/shared`)

## Consumer Guide

Pure TypeScript module providing record parsing, suffix dynamic programming, bounded trace generation, and solver creation for AoC 2023 Day 12 (Hot Springs):

- `SpringRecord` / `parseSpringRecords(raw)`: parses and validates `[.#?]+` spring condition rows paired with positive integer group lengths.
- `validateUnfoldFactor(copies)`: validates positive safe integer unfold multipliers.
- `countArrangements(record)` / `sumArrangements(records, unfoldFactor)`: exact `BigInt` arrangement counting in `O(L * G)` time.
- `buildArrangementDpTable(record)` / `reconstructWitness(record, table)`: builds a frozen `(G + 1) x (L + 1)` suffix-DP table and greedily extracts one concrete valid arrangement (or `null` when impossible).
- `buildHotSpringsTrace(records, unfoldFactor, options?)`: computes totals across all records and returns uniformly sampled `HotSpringsTraceFrame` snapshots capped by `maxSteps` (`DEFAULT_MAX_TRACE_STEPS = 80`).
- `createHotSpringsSolver(unfoldFactor)`: returns a frozen `PuzzleSolver` configured for Part 1 (`1`) or Part 2 (`5`).

Note: `shared/index.ts` is strictly pure TS and never exports anything from `shared/viz/`.

## Maintainer Architecture

- `record.ts`: immutable value object (`Object.freeze`) with derived getters (`length`, `groupCount`, `wildcardCount`) and `unfold(copies)`.
- `dp.ts`: suffix-DP using a local mutable `Int32Array` dot-prefix table (`buildDotPrefix`, never frozen) and rolling `bigint[]` rows for `countArrangements`.
- `trace.ts`: delegates index sampling to `shared/core`'s `sampleTraceIndices` and `validateMaxSteps`.
- `viz/` (`.tsx` only): `HotSpringsVisualizer.tsx` and `DpHeatmapSvg.tsx` consume `shared/index.ts` and `shared/viz/` playback primitives.
