# 2024 Day 10 Shared Topographic Domain

## Consumer Guide
Pure TypeScript domain primitives and reusable visualization components for Advent of Code 2024 Day 10 (*Hoof It*).

- Import domain types and functions from `./index`:
  - `parseTopographicMap(raw)` parses rectangular grids of `'0'..'9'` and `'.'` (`IMPASSABLE_HEIGHT = -1`) into an immutable `TopographicMap`.
  - `evaluateTotalMetric(map, metric)` evaluates total trailhead contribution under a `PeakContributionMetric` strategy (`'score'` or `'rating'`).
  - `traceTrailheads(map, metric, options)` produces uniformly sampled `TrailheadTraceFrame` snapshots bounded by `DEFAULT_MAX_TRACE_STEPS = 80`.
- Visualization components live under `./viz/` (`TopographicVisualizer`, `TopographicCanvas`, `palette`) and are never re-exported from `./index`.

## Maintainer Guide
- **Single source of truth**: `TopographicMap` wraps only `Grid2D<number>` with zero stored derived fields; `trailheadIndices()` and `peakIndices()` are computed on demand.
- **Bounded search buffers**: `trails.ts` allocates reusable `Int32Array` `visitedStamp`, `ways`, and `queue` (`MAX_REACHABLE_CELLS = 181`, the Manhattan radius-9 diamond bound) once per evaluation/trace call. Because BFS visits heights `0 -> 9` in level order, `ways[v]` is finalized before `v` is dequeued.
- **100% pure domain coverage**: All `.ts` modules in `shared/` and `shared/viz/palette.ts` are pure TypeScript with zero DOM/React dependencies.
