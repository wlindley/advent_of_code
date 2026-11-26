# 2022 Day 12 Part 2: Hill Climbing Algorithm

## Consumer Guide

- **Manifest**: `manifest` in `2022/day12/part2/index.ts` registers the puzzle metadata, 5×8 example (`29`), solver, and `HillClimbingPart2Visualizer`.
- **Domain API**: `2022/day12/part2/domain/index.ts` exports `ANY_LOWEST_START_CONDITION` and `solver` (`PuzzleSolver<HeightMap, number, HillClimbTraceFrame>`).
- **CLI Path**: `2022/day12/part2/domain/solver.ts` exports `solver` for `tools/aoc/cli.ts`.

## Maintainer Guide

- `ANY_LOWEST_START_CONDITION` delegates to `createHillClimbingSolver` in `2022/day12/shared/`, matching any cell whose height is `0` (`'a'` or `'S'`).
- Because `ReverseBfsField.findNearestStart` scans cells in reverse-BFS visit order, the first height-`0` cell encountered is guaranteed to have minimum distance to `E`.
- Correctness is cross-checked by `solver.oracle.test.ts` against two independent forward-BFS oracles (multi-source and per-source) across deterministic edge cases, 20 ramped reachable-by-construction grids, and 15 uniform random grids.
- `HillClimbingPart2Visualizer` is a thin wrapper over `HillClimbingVisualizer` in `2022/day12/shared/viz/`.
