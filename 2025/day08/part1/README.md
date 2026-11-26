# `2025/day08/part1` — Playground

## Consumer Guide
Solves Advent of Code 2025 Day 8 Part 1 by connecting the `K` closest pairs of 3D junction boxes (default `PART1_PAIR_COUNT = 1000`, or `10` for the official 20-box example in the web runner) and multiplying the sizes of the three largest resulting circuits.

### Public API
- `2025/day08/part1/domain/index.ts`:
  - `PART1_PAIR_COUNT`, `DEFAULT_MAX_TRACE_STEPS`
  - `selectClosestPairs(points, pairCount)`
  - `connectClosestCircuits(points, pairCount)`
  - `traceCircuitConnections(points, pairCount, options?)`
  - `solver`: `PuzzleSolver<readonly Point3D[], number, CircuitTraceFrame>`
- `2025/day08/part1/index.ts`: `manifest: PuzzlePartManifest` for browser discovery.

## Maintainer Guide
- **Exact Metric & Bounded Memory**: `selectClosestPairs` validates coordinate spans with `BigInt` up front so all squared distances fit safely in IEEE-754 integers (`<= Number.MAX_SAFE_INTEGER`), then maintains a fixed-capacity `K`-element typed-array max-heap with strict `(distSq, u, v)` tie-breaking.
- **Kruskal-Style Quota**: Every closest pair (including redundant intra-circuit pairs) consumes one step of the `pairCount` budget via `DisjointSet.union`.
- **Bounded Visualization**: `traceCircuitConnections` snapshots at most `maxSteps` (`120` by default) checkpoints so large custom inputs render smoothly in the interactive 3D orbit canvas.
