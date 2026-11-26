# `2025/day08/part2` — Playground (Part Two)

## Consumer Guide
Solves Advent of Code 2025 Day 8 Part 2 by connecting closest 3D junction box pairs until all boxes merge into one circuit, returning the `bigint` product of the X coordinates of the final bridging pair.

### Public API
- `2025/day08/part2/domain/index.ts`:
  - `DEFAULT_MAX_TRACE_STEPS` (`120`)
  - `SingleCircuitResult` (`mstEdges`, `sideOf`, `answer`, derived `finalEdge` getter)
  - `BridgeTraceFrame` (`edgeCount`, `totalEdges`, `lastEdge`, `edgeXProduct`, derived `componentCount` and `isFinalBridge` getters)
  - `connectUntilSingleCircuit(points)`
  - `traceFinalBridge(points, options?)`
  - `solver`: `PuzzleSolver<readonly Point3D[], bigint, BridgeTraceFrame>`
- `2025/day08/part2/index.ts`: `manifest: PuzzlePartManifest` for browser discovery.

## Maintainer Guide
- **Why Prim's Instead of Materializing All Pairs**: With `N` up to thousands of junction boxes, sorting all `N(N-1)/2` pairs uses `O(N^2)` memory. Using dense `O(N^2)` Prim's algorithm in `O(N)` typed arrays (`Uint8Array`, `Float64Array`, `Int32Array`) with exact lexicographic tie-breaking `(distSq, min(u, v), max(u, v))` produces the identical unique Minimum Spanning Tree as Kruskal's algorithm.
- **Chronological Order & Side Partitioning**: Sorting Prim's `N - 1` MST edges with `compareJunctionPairs` recovers Kruskal's exact merge sequence. Unioning the first `N - 2` edges in a `DisjointSet` partitions all vertices into the two pre-bridge circuits (`sideOf`), enabling the 3D visualizer to color each side distinctly and highlight the final bridging beam.
- **Bounded Visualization**: `traceFinalBridge` bounds snapshots to `maxSteps` (`120` by default) while always preserving step `0`, pre-bridge step `N - 2`, and the final bridge `N - 1`.
