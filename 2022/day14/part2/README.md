# 2022 Day 14 Part 2: Regolith Reservoir

## Consumer Guide

- **Manifest**: `manifest` in `2022/day14/part2/index.ts` registers puzzle metadata, the official example (`93`), solver, and `RegolithPart2Visualizer`.
- **Domain API**: `2022/day14/part2/domain/index.ts` exports `FLOOR_BOUNDARY_POLICY` and `solver` (`PuzzleSolver<CaveScan, number, ReservoirTraceFrame>`).
- **CLI Path**: `2022/day14/part2/domain/solver.ts` exports `solver` for `tools/aoc/cli.ts`.

## Maintainer Guide

- `FLOOR_BOUNDARY_POLICY` computes triangle-wide bounds `[500 - floorY, 500 + floorY] × [0, floorY]` where `floorY = scan.maxY + 2` and never triggers abyss escape (`isEscape` always returns `false`).
- Differential testing in `solver.oracle.test.ts` cross-checks both exact settled count and exact settled `(x, y)` coordinates against an independent row-by-row top-down reachability DP oracle across targeted edge topologies and 50 seeded random caves.
- `RegolithPart2Visualizer` delegates rendering and playback to `ReservoirVisualizer` in `2022/day14/shared/viz/`.
