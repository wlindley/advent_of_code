# 2021 Day 5 Shared Hydrothermal Venture Core (`2021/day05/shared`)

Reusable hydrothermal vent geometry, parser, adaptive dense/sparse coverage accumulators, policy-driven overlap engine, viewport projection, bounded trace generator, and interactive Canvas 2D visualizer shared across Part 1 and Part 2.

## Consumer Interface

- `types.ts`: `VentPoint`, `VentSegment`, `VentBounds`, `computeSegmentBounds`, `VentField`, `SegmentOrientation`, and `VentSelectionPolicy`.
- `parser.ts`: `parseVentField` validating `x1,y1 -> x2,y2` lines with 1-based `SyntaxError`/`RangeError` reporting.
- `accumulator.ts`: `DenseCoverageAccumulator` (`Uint32Array`), `SparseCoverageAccumulator` (`Map`), `createCoverageAccumulator`, `NOOP_COVERAGE_OBSERVER`, and `MAX_DENSE_GRID_CELLS` (`4_000_000`).
- `engine.ts`: `AXIS_ALIGNED_POLICY`, `OCTILINEAR_POLICY`, `VentOverlapSummary`, `analyzeVentField`, and `countVentOverlaps`.
- `viewport.ts`: `ViewportTransform` providing 1:1 aspect-preserving projection onto Canvas 2D.
- `trace.ts`: `FrameHotspotCollector`, `VentTraceFrame`, `traceVentField` (`DEFAULT_MAX_TRACE_STEPS = 120`, `MAX_TRACE_HOTSPOTS = 25_000`), and `createVentSolver`.
- `index.ts`: pure TypeScript barrel with zero UI/React imports.
- `viz/`: light-mode `VentCanvas.tsx`, `VentLegend.tsx`, and `VentFieldVisualizer.tsx`.

## Maintainer Architecture

- **Adaptive Dense/Sparse Accumulation**: `analyzeVentField` computes tight bounds from policy-selected segments only so large skipped lines never force sparse mode; `createCoverageAccumulator` picks a flat `Uint32Array` when `bounds.area <= maxDenseCells`, otherwise falling back to a `Map<string, number>`.
- **Single Source of Truth**: `VentSegment`, `VentBounds`, `VentField`, `VentOverlapSummary`, `ViewportTransform`, and `VentTraceFrame` are frozen and compute derived metrics dynamically via getters.
