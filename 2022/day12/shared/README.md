# 2022 Day 12 Shared Domain & Visualization

## Consumer Guide

`2022/day12/shared/index.ts` exports the pure TypeScript elevation grid, reverse-BFS solver engine, trace builder, and `StartCondition` strategy interface:

- `parseHeightMap(raw)` / `HeightMap`: immutable `0..25` elevation grid with unique `S` (`0`) and `E` (`25`) indices.
- `StartCondition`: `{ label, matches(map, index) }` predicate for selecting valid start cells.
- `computeReverseBfs(map)` / `ReverseBfsField`: distance and predecessor field rooted at `E`, with `distanceAt`, `nextStepFrom`, `countByDistance`, `findNearestStart`, and `reconstructPath`.
- `buildHillClimbTrace(map, field, condition, options?)` / `HillClimbTraceFrame`: bounded wavefront snapshots (`DEFAULT_MAX_TRACE_STEPS = 120`).
- `createHillClimbingSolver(condition)`: produces a frozen `PuzzleSolver<HeightMap, number, HillClimbTraceFrame>`.

`2022/day12/shared/viz/` provides reusable React + Canvas UI components (`HillClimbingVisualizer` and `ElevationCanvas`) parameterized by `{ rawInput, solver, condition }`.

## Maintainer Guide

- **Reverse-BFS Inversion**: Searching backwards from `E` (`height(neighbor) >= height(curr) - 1`) solves both single-source (`S`) and multi-source (`a`) shortest paths with one `O(R * C)` pass.
- **Immutability**: Domain instances call `Object.freeze(this)` and defensively copy `Uint8Array` / `Int32Array` buffers without freezing typed arrays directly.
- **No Derived State**: `HillClimbTraceFrame.winningStartReached`, `HillClimbTraceFrame.isComplete`, `HeightMap.size`, and `ReverseBfsField` metrics are computed via getters.
- **Module Boundary**: `shared/index.ts` never imports from `shared/viz/`.
