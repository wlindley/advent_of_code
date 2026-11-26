# `2019/day03/shared` — Crossed Wires Engine

## Consumer Guide
Pure TypeScript BigInt geometry engine, solver factory, and canvas visualizer shared across AoC 2019 Day 3 Parts 1 and 2.
- `parseWirePair`, `findCrossings`, `pickBestCrossing`
- `MANHATTAN_METRIC` (Part 1) and `SIGNAL_DELAY_METRIC` (Part 2)
- `createCrossedWiresSolver(metric)` for `PuzzleSolver<WirePair, bigint, WireTraceFrame>`
- `viz/CrossedWiresVisualizer.tsx` and `viz/WireCircuitCanvas.tsx` for React rendering

## Maintainer Guide
- `types.ts`: immutable `WireSegment` and `WireCrossing` value objects with dynamically computed getters (no stored derived state).
- `geometry.ts`: exact orthogonal & collinear (`ClosedInterval`) intersection, origin exclusion, and unconditional min-step deduplication.
- `trace.ts`: BigInt fixed-point Cartesian viewport projection (`projectPoint`) and bounded `sampleTraceIndices` trace generation.
