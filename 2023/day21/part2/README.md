# 2023 Day 21 Part 2 — Step Counter

## Consumer Guide

- `domain/index.ts` exports `PART2_STEPS` (`26_501_365n`), `solveInfiniteGarden(map, steps)`, `countInfinitePlotsForSteps(map, steps)`, and `solver: PuzzleSolver<GardenMap, bigint, GardenTraceFrame>`.
- `index.ts` exports `manifest: PuzzlePartManifest` configured with the official `11×11` example (`50` steps -> `1594`) and `26_501_365`-step full-input solver/visualizer dispatch via `resolvePart2Steps`.
- `viz/GardenPart2Visualizer.tsx` renders the Part 2 solve mode/quadratic verification summary above the interactive single-tile parity & wavefront canvas visualizer.

## Maintainer Architecture

- **Two-Mode Solver (`domain/infiniteGarden.ts`)**:
  - Uses exact Newton forward-difference quadratic extrapolation (`QuadraticProgression`) when `map.isQuadraticPeriodicReady() && steps >= BigInt(3 * map.width)`, sampling `k = 0..2` at `r + k*N` and strictly asserting `k = 3` (`r + 3*N`) stabilization before evaluating at `quotient`.
  - Uses bounded infinite BFS (`countInfiniteReachable`) for smaller step counts or non-periodic grids within `MAX_INFINITE_BFS_CELLS`.
- **Solver vs Manifest**: `domain/solver.ts` always solves `PART2_STEPS = 26_501_365n` for CLI and domain execution. `part2/index.ts` adapts the browser manifest so the `11×11` example evaluates at `PART2_EXAMPLE_STEPS = 50n` (`1594`).
- **No Circular Imports**: `GardenPart2Visualizer.tsx` imports only from `../domain`, `../../shared`, and `../../shared/viz/GardenVisualizer` — never from `../index.ts` or `../../part1/`.
