# 2024 Day 18 Shared Domain & Visualization

Pure-TypeScript memory grid model, coordinate parser, 4-neighbor BFS shortest-path solver, bounded trace snapshots, and HiDPI Canvas 2D renderer for Advent of Code 2024 Day 18 (Part 1 and Part 2 ready).

## Consumer Guide

Import pure domain symbols from `./index` (zero React/DOM dependencies):

- `MemorySpace`, `ByteCoord`, `RamRunConfig` (`EXAMPLE_RAM_RUN_CONFIG` = `7×7 / 12`, `DEFAULT_RAM_RUN_CONFIG` = `71×71 / 1024`) — immutable grid recording only each cell's earliest fall timestamp (`NEVER_CORRUPTED = 0x7fffffff` if never corrupted).
- `parseByteCoords(raw)` / `parseMemorySpace(raw, gridSize)` — parses `x,y` byte lists (normalizing CRLF, rejecting empty/malformed/out-of-bounds input).
- `findShortestPath(memory, fallenCount)` / `ShortestPathResult` — flat `Int32Array` 4-neighbor BFS from `(0, 0)` to `(S - 1, S - 1)` returning immutable distance queries and reconstructed path.
- `RamRunSnapshot`, `createStaticSnapshot`, `buildCorruptionAndWaveTrace` — endpoint-preserving corruption + wave + complete snapshots capped by `DEFAULT_MAX_TRACE_STEPS = 80`.

Visual component in `./viz/`: `RamRunCanvas.tsx` (`.tsx`-only HiDPI Canvas 2D grid, BFS wave heatmap, corrupted bytes, `latestByte` / `blockingByte` markers, and shortest path overlay).

## Maintainer Guide

- **Module DAG**: `model.ts` -> `parser.ts` / `bfs.ts` -> `snapshot.ts` -> `index.ts`. `shared/viz/RamRunCanvas.tsx` imports only from `../index`.
- **Invariants**: `MemorySpace`, `ShortestPathResult`, and `RamRunSnapshot` freeze `this` while keeping internal `Int32Array` buffers unfrozen and strictly encapsulated; derived properties (`cellCount`, `byteCount`, `reachable`, `distance`, `visitedCount`, `maxDistance`, `maxWaveDistance`, `revealedVisitedCount`) are computed dynamically with zero stored derived state.
- **Verification**: Cross-checked against an independent `Set<string>` BFS across 60 seeded random grids (with duplicates and endpoint drops) and a reverse-time `DisjointSet` percolation oracle for every `k in [0..B]`.
