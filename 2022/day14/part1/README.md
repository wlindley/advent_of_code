# 2022 Day 14 Part 1: Regolith Reservoir

## Consumer Guide

- **Manifest**: `manifest` in `2022/day14/part1/index.ts` registers puzzle metadata, the official example (`24`), solver, and `RegolithPart1Visualizer`.
- **Domain API**: `2022/day14/part1/domain/index.ts` exports `ABYSS_BOUNDARY_POLICY` and `solver` (`PuzzleSolver<CaveScan, number, ReservoirTraceFrame>`).
- **CLI Path**: `2022/day14/part1/domain/solver.ts` exports `solver` for `tools/aoc/cli.ts`.

## Maintainer Guide

- `ABYSS_BOUNDARY_POLICY` computes tight cone-clamped bounds `[max(500 - maxY, minX - 1), min(500 + maxY, maxX + 1)] × [0, scan.maxY + 1]` and terminates when `y >= bounds.maxY`.
- Differential testing in `solver.oracle.test.ts` cross-checks both exact settled count and exact settled `(x, y)` coordinates against an independent `Set<string>` simulator across targeted edge topologies and 50 seeded random caves.
- `RegolithPart1Visualizer` delegates rendering and playback to `ReservoirVisualizer` in `2022/day14/shared/viz/`.
