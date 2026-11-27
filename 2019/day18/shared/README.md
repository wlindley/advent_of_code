# Day 18 Shared Vault Solver Kernel

Pure TypeScript key-dependency graph builder, 46-bit Dijkstra search, bounded trace sampler, and canvas layout helpers shared across Advent of Code 2019 Day 18 parts.

## Consumer Guide

- `VaultSolver`: `PuzzleSolver` parameterized by `SINGLE_EXPLORER_POLICY` (Part 1) or `QUAD_ROBOT_POLICY` (Part 2).
- `parseVaultMap(raw)` / `splitVaultForQuadRobots(map)`: Immutable `VaultMap` with private typed-array cell lookups (`isWall`, `keyId`, `doorBit`).
- `buildVaultKeyGraph(map)` & `solveVaultOptimal(map, graph)`: Pareto-minimal BFS graph + Dijkstra over `(heldMask, packedRobots)`.
- `computeVaultRenderMetrics`, `buildKeyRingBadges`, `formatVaultStatus`: Canvas sizing and HUD telemetry helpers.

## Maintainer Architecture

Module DAG (strictly acyclic, zero `viz/` imports in `index.ts`):
- `vaultMap.ts` -> `shared/core` (`Grid2D`, `DIRS_8`)
- `vaultPolicy.ts` -> `vaultMap.ts`
- `keyGraph.ts` -> `shared/core` (`DIRS_4`), `vaultMap.ts`
- `vaultSearch.ts` -> `shared/core` (`MinHeap`), `keyGraph.ts`, `vaultMap.ts`
- `vaultTrace.ts` -> `shared/core`, `keyGraph.ts`, `vaultMap.ts`, `vaultPolicy.ts`, `vaultSearch.ts`
- `vizLayout.ts` -> `vaultMap.ts`, `vaultTrace.ts`
- `viz/VaultVisualizer.tsx` -> React HiDPI `<canvas>` UI consuming the shared barrel and `shared/viz` `PlaybackControls`.
