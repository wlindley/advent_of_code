# Day 11 Part 1 — Reactor

Counts every distinct directed path from `you` to `out` through the reactor's directed device network.

## Consumer Guide

- **Domain API** (`2025/day11/part1/domain`):
  - `solver`: `PuzzleSolver<DirectedGraph<string>, bigint, ReactorTraceFrame>` (`parse`, `solve`, `trace`).
  - `solveReactor(graph)`: Computes exact `bigint` path count from `you` to `out`.
  - `traceReactor(graph, options?)`: Emits bounded topological DP playback frames (`DEFAULT_MAX_TRACE_STEPS = 120`).
- **Visualizer** (`ReactorPathVisualizer`): Renders an adaptive layered DAG SVG (labeled pills with live path counts for `<= 45` nodes, compact dots + log2 layer flow bars for larger graphs), HUD badges, and `PlaybackControls`.

## Maintainer Notes

- **Relevant Subgraph Pruning**: `DirectedGraph.relevantSubgraph('you', 'out')` intersects forward-reachable and backward-reachable vertex sets so off-path cycles or dead branches are excluded without affecting `you -> out` cycle detection.
- **Pure Domain**: Zero React/DOM imports in `domain/` or `shared/`.
