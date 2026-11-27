# 2021 Day 14 — Shared Extended Polymerization Domain

Pure TypeScript pair-histogram polymerization engine and reusable chart visualizer for Advent of Code 2021 Day 14 (*Extended Polymerization*).

## Consumer API (`shared/index.ts`)

- **Polymer Domain (`polymer.ts`)**: `validateStepCount`, `InsertionRule`, `PolymerFormula`, and `PolymerState` (`BigInt` pair counts + invariant terminal element anchor, `step`, `advance`, `elementFrequencies`, `spread`, `activeReactions`).
- **Parser (`parser.ts`)**: `parsePolymerFormula(raw)` normalizes line endings and validates template and `AB -> C` rule syntax.
- **Simulation & Solver (`simulation.ts`)**: `PART1_STEPS`, `PART2_STEPS`, `DEFAULT_MAX_TRACE_STEPS`, `PolymerTraceFrame`, `tracePolymerization`, and `PolymerizationSolver`.
- **Chart Projections (`chart.ts`)**: `scaleBigIntRatio`, `formatGroupedBigInt`, `formatCompactBigInt`, `scaleValue`, `buildElementBars`, `buildTopReactions`, and `buildGrowthCurve`.

## Maintainer Architecture

- **Dependency DAG**: `polymer` → `parser` → `simulation` → `chart` → `index.ts` (zero `viz/` imports).
- **Invariants & Immutability**: All domain value objects are `Object.freeze`d; derived values (`leftProduct`, `rightProduct`, `totalLength`, `elementFrequencies`, `spread`) are computed dynamically via getters with zero stored derived state.
- **BigInt Safety**: Pair counts and scaling ratios use exact `bigint` arithmetic and `bigintLog2(value + 1n)` so arbitrary step counts remain exact past `2^64` and `2^1024`.
- **Shared Visualization (`shared/viz/`)**: `PolymerizationVisualizer`, `PolymerStatsBar`, `ElementFrequencyChart`, `ActiveReactionsChart`, and `SpreadCurveChart` reuse `PlaybackControls` with bounded trace sampling (`41` max frames).
