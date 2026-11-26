# 2024 Day 15 Part 2 — Warehouse Woes

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for site registry auto-discovery with the 10×10 official example (`9021`).
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solver` (`PuzzleSolver<WarehouseSpec, number, WarehouseFrame>`) backed by `PART2_PUSH_RULE`.
- **Visualizer**: `./viz/WarehousePart2Visualizer.tsx` renders `WarehouseVisualizer` (`Part 2 (2x crates)`) with Canvas 2D `[` / `]` wide-crate animation, blocked-bump indicator, and live GPS sum HUD.

## Maintainer Guide

- **Architecture**: `part2/domain/` implements `PART2_PUSH_RULE`:
  - `buildInitialState` widens each raw row (`#`->`##`, `O`->`[]`, `.`->`..`, `@`->`@.`) into `WarehouseState`.
  - Horizontal pushes (`<`/`>`) scan along the robot's row to the first empty or wall tile and shift contiguous `[`/`]` cells when unblocked.
  - Vertical pushes (`^`/`v`) run a BFS (`collectVerticalBoxes`) tracking canonical crate-left keys (`row * width + leftC`) across both halves of each touched crate, aborting with zero mutation if any half hits a wall or out-of-bounds, and applying a two-pass clear-then-write (`applyVerticalShift`) when clear.
- **Verification**: `solver.test.ts` covers the small (`618`, exact final rows) and large (`9021`) examples, horizontal multi-box chains, aligned stacks, staggered `1 -> 2 -> 3` fan-out, asymmetric partial blocks, diamond convergence, zero-box and unwalled grids, `executeSolver` with a deterministic clock fake, sampled traces, and invalid inputs. `solver.oracle.test.ts` cross-checks every step of the small example, the large example final board, edge cases, and 50 seeded random warehouses against an independent memoized copy-on-write `string[][]` oracle.
