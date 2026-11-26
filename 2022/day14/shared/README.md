# 2022 Day 14 Shared Domain & Visualization

## Consumer Guide

`2022/day14/shared/index.ts` exports the pure TypeScript cave scan model, boundary policy contract, stack-resumed sand simulator, bounded trace builder, and solver factory:

- `parseCaveScan(raw)` / `CaveScan` / `RockPath` / `CavePoint`: immutable axis-aligned rock geometry with `SOURCE_X = 500`, `SOURCE_Y = 0`.
- `CaveBounds` / `CaveBoundaryPolicy`: simulation grid bounds (with optional `floorY`) and escape predicate.
- `simulateReservoir(scan, policy)` / `ReservoirField`: integer cell grid (`CELL_ROCK = -1`, `CELL_AIR = 0`, settled grain order `1..N`) and `escapePath`.
- `buildReservoirTrace(field, options?)` / `ReservoirTraceFrame`: bounded frame snapshots (`DEFAULT_MAX_TRACE_STEPS = 160`) with `'pouring' | 'escaped' | 'blocked'` phases.
- `createReservoirSolver(policy)`: produces a frozen `PuzzleSolver<CaveScan, number, ReservoirTraceFrame>`.

`2022/day14/shared/viz/` provides `ReservoirVisualizer` and `ReservoirCanvas` parameterized by `{ rawInput, policy, solver }`.

## Maintainer Guide

- **Stack-Resumed DFS**: Sand pours from `(500, 0)` along a reusable `(stackX, stackY)` path; settling pops only one frame so subsequent grains resume from the parent cell in amortized `O(1)` per step.
- **Immutability**: Domain classes call `Object.freeze(this)` and wrap `#cells`/`#settledIndices` defensively in `Int32Array` copies without freezing TypedArrays directly.
- **Module Boundary**: `shared/index.ts` is pure TypeScript and never imports from `shared/viz/`.
