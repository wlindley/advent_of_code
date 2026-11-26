# 2021 Day 3 Part 2 — Binary Diagnostic (`2021/day03/part2`)

Computes submarine life-support rating as the product of oxygen generator and CO2 scrubber ratings via iterative bit-criteria filtering.

## Consumer Interface

- `domain/solver.ts`: exports `solver` (`PuzzleSolver<DiagnosticReport, bigint, LifeSupportTraceFrame>`).
- `domain/index.ts`: barrel exporting `solver`, rating filter primitives, trace builder, and funnel geometry.
- `index.ts`: exports `manifest` (`PuzzlePartManifest`) with `meta`, `exampleInput`, `exampleAnswer` (`"230"`), `solver`, and `Visualizer`.
- `viz/Part2Visualizer.tsx`: interactive candidate narrowing funnel and dual-lane step inspector.

## Maintainer Architecture

- **Pure Domain**: `ratingFilter.ts` locks selections via `selectFilterBit` and `DiagnosticReport` primitives; `lifeSupportTrace.ts` emits bounded parallel lane snapshots; `funnelGeometry.ts` projects trace counts into SVG coordinates.
- **Visualization**: `Part2Visualizer` renders `NarrowingFunnelChart` and `LaneDetailCards` with `PlaybackControls` (capped at `120` frames).
