# 2021 Day 15 — Shared Chiton Pathfinding Domain

Pure TypeScript flat-array grid expansion, 10-bucket Dial's Dijkstra solver, and reusable Canvas 2D visualizer for Advent of Code 2021 Day 15 (*Chiton*).

## Consumer API (`shared/index.ts`)

- **Cavern Grid (`cavern.ts`)**: `wrapRisk`, `validateRiskCells`, `CavernPolicy`, `PART1_POLICY`, `PART2_POLICY`, `RiskGrid`, and `CavernMap`.
- **Parser (`parser.ts`)**: `parseRiskGrid(raw)` validates non-empty rectangular `1..9` digit grids with LF or CRLF line endings.
- **Pathfinder (`pathfinder.ts`)**: `CavernPathResult` and `findLowestRiskPath(map)` using flat `Int32Array` distances and 10 cyclic distance buckets.
- **Trace (`trace.ts`)**: `DEFAULT_MAX_TRACE_STEPS`, `CavernTraceFrame`, and `traceCavernPath(result, options)` building an `O(V + maxDistance)` prefix-sum timeline sampled up to 48 frames.
- **Solver (`solver.ts`)**: `CavernRiskSolver` parameterized by `CavernPolicy`.

## Maintainer Architecture

- **Dependency DAG**: `cavern` → `parser` → `pathfinder` → `trace` → `solver` → `index.ts` (zero `viz/` imports).
- **Zero Stale Entries Invariant**: Edge weights equal the target cell risk `1..9`, and Dial's algorithm pops vertices in non-decreasing distance order; therefore, the first visit to any cell is optimal (`dist[next] === -1` suffices without re-queueing or stale-entry checks).
- **Immutability**: Domain classes call `Object.freeze(this)` without freezing underlying typed arrays (`Uint8Array` / `Int32Array`); private buffers are defensively copied at construction.
- **Shared Visualization (`shared/viz/`)**: `CavernVisualizer`, `CavernTelemetry`, and `CavernCanvas` run a single Dijkstra pass in `useMemo`, sample at most 48 frames, and render `ImageData` heatmaps using resolved CSS variables.
