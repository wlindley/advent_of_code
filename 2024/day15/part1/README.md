# 2024 Day 15 Part 1 — Warehouse Woes

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for site registry auto-discovery with the 10×10 official example (`10092`).
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solver` (`PuzzleSolver<WarehouseSpec, number, WarehouseFrame>`) backed by `PART1_PUSH_RULE`.
- **Visualizer**: `./viz/WarehousePart1Visualizer.tsx` renders `WarehouseVisualizer` (`Part 1 (1x crates)`) with Canvas 2D crate/wall/robot animation, blocked-bump indicator, and live GPS sum HUD.

## Maintainer Guide

- **Architecture**: `part1/domain/` implements `PART1_PUSH_RULE` (ray scan across `'O'` crates and O(1) endpoint swap) and wires `createWarehouseSolver(PART1_PUSH_RULE)` from `../../shared`.
- **Verification**: `solver.test.ts` covers the small (`2028`) and large (`10092`) examples, all four directions, multi-box chains, unwalled edges, `executeSolver` with a deterministic clock fake, and sampled traces. `solver.oracle.test.ts` cross-checks every step of the small example, the large example final board, edge cases, and 50 seeded random warehouses against an independent `string[][]` tail-to-head shift oracle.
