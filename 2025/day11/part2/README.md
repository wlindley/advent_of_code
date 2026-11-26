# Day 11 Part 2 — Reactor (Waypoints)

Counts every distinct directed path from `svr` to `out` through the reactor's directed device network that visits both `dac` and `fft` (in either order).

## Consumer Guide

- **Domain API** (`2025/day11/part2/domain`):
  - `solver`: `PuzzleSolver<DirectedGraph<string>, bigint, ReactorWaypointTraceFrame>` (`parse`, `solve`, `trace`).
  - `WaypointCounts`: Frozen 4-state `bigint` tuple `(neither, dacOnly, fftOnly, both)` with dynamic `.total`, `WaypointCounts.unit(mask)`, and bitwise-OR `accumulate(incoming, enterMask)`.
  - `solveReactorWaypoints(graph, query?)`: Computes exact `bigint` count of walks from `source` to `target` visiting both `dac` and `fft`.
  - `traceReactorWaypoints(graph, options?)`: Emits bounded topological DP playback frames (`DEFAULT_MAX_TRACE_STEPS = 120`).
  - `bigintLog2(value)`: Numerically stable `log2` for arbitrarily large positive `bigint` values using the top 53 bits.
- **Visualizer** (`ReactorWaypointVisualizer`): Renders an adaptive layered DAG SVG (labeled cards with 4-segment proportional state bars for `<= 45` nodes, compact dots colored by highest unlocked state + 4-color stacked `log2` layer flow bars for larger graphs), HUD badges, color legend, and `PlaybackControls`.

## Maintainer Notes

- **4-State Bitmask DP**: Each node tracks path counts indexed by the 2-bit mask `(dac: 1) | (fft: 2)`. Relaxing edge `u -> v` promotes every bucket `m` into `m | waypointMaskFor(v, dac, fft)`, handling both waypoint orderings (`dac` before `fft` and `fft` before `dac`) and coincident endpoints uniformly in one pass.
- **Relevant Subgraph Pruning**: `DirectedGraph.relevantSubgraph('svr', 'out')` excludes off-path cycles and unreachable branches before topological sorting.
- **Pure Domain**: Zero React/DOM imports in `domain/` or `shared/`.
