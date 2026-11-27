# 2020 Day 17 Shared Domain (`Conway Cubes`)

## User / Consumer Guide

Import pure domain models, simulation engine, trace snapshots, and parameterized solver from `2020/day17/shared`:

- `parsePocketSlice(raw)` -> immutable `PocketSlice` (`width`, `height`, `activeCount`, `isActive(x, y)`).
- `POCKET_3D_POLICY` / `POCKET_4D_POLICY` -> frozen `PocketPolicy` configs for 3D (26 neighbors) and 4D (80 neighbors) over 6 cycles.
- `PocketLattice` -> bounded-envelope 3D/4D simulator exposing `cycle`, `maxCycles`, `dimensions`, `activeCount`, `stepCycle()`, and `snapshotFrame()`.
- `PocketCycleTraceFrame` / `PocketSliceSnapshot` -> per-cycle diff snapshots (`0` inactive, `1` surviving, `2` born, `3` dying) with dynamic metric getters and `wValues` / `slicesForW(w)`.
- `new ConwayCubesSolver(policy)` -> `PuzzleSolver` implementing `parse`, `solve`, `trace`, and `formatAnswer`.

React visualizers live under `2020/day17/shared/viz/` and are never imported or re-exported by `shared/index.ts`.

## Developer / Maintainer Architecture

Strict one-way DAG:

`shared/core -> model.ts / policies.ts -> trace.ts -> lattice.ts -> solver.ts -> index.ts`

- **Separable 1D box-sum convolution**: Each cycle runs 3 (or 4) orthogonal 1D 3-tap box-sum passes (`convolveAxis`) alternating across `tmpA`/`tmpB` `Uint8Array` buffers, eliminating 26/80-branch neighbor loops in favor of `O(N * D)` arithmetic.
- **Zero-churn Part 2**: `PocketLattice`, `PocketCycleTraceFrame`, and `ConwayCubesVisualizer` already support `dimensions: 4` and multi-`w` hyperplane selection via `POCKET_4D_POLICY`.
- **Immutability**: Domain classes defensively copy `Uint8Array` buffers and `Object.freeze(this)` on wrappers only (never calling `Object.freeze` on typed arrays).
