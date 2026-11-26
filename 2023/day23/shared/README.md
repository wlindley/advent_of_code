# 2023 Day 23 Shared Domain

## Consumer Guide

Pure TypeScript domain modules for AoC 2023 Day 23 (*A Long Walk*):

- `parseTrailMap(raw)` / `TrailMap`: parses rectangular `#`/`.`/`^`/`>`/`v`/`<` grids (`rows >= 2`, strictly one `.` on top and bottom rows) and exposes dynamic `start`/`end` cell indices, `walkableDegree(cell)`, and `outgoingNeighbors(cell, ignoreSlopes)` via `SLOPE_DELTA`.
- `contractTrailGraph(map, ignoreSlopes)` / `TrailGraph` / `TrailEdge`: contracts degree-<=2 corridors into weighted junction edges (`weight` derived dynamically as `cells.length - 1`), retaining the longest corridor between parallel `(from, to)` pairs and excluding edges exiting `endId` or entering `startId`.
- `findLongestPath(graph)`: packs outgoing edges in descending-weight CSR arrays (`Int32Array` / `Uint8Array`) and solves exact longest simple path with unique `forcedPreEnd` pruning, incremental `maxIncoming` upper-bound pruning, and recorded `improvements`.
- `buildHikeTrace(map, graph, result, options)`: produces bounded playback frames (`contracted` -> `search` -> `hike` or `unreachable`) capped at `DEFAULT_MAX_TRACE_STEPS = 80`.

## Maintainer Architecture

- **Module DAG**: `trailMap.ts` -> `trailGraph.ts` -> `longestPath.ts` -> `hikeTrace.ts`; `index.ts` is a pure TS barrel with zero `viz/` imports.
- **Invariants**: All domain entities are frozen; `Int32Array` and `Uint8Array` buffers are never frozen. Zero stored derived state or default JS parameter syntax.
