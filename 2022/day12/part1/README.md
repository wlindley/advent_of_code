# 2022 Day 12 Part 1: Hill Climbing Algorithm

## Consumer Guide

- **Manifest**: `manifest` in `2022/day12/part1/index.ts` registers the puzzle metadata, 5×8 example (`31`), solver, and `HillClimbingPart1Visualizer`.
- **Domain API**: `2022/day12/part1/domain/index.ts` exports `FIXED_START_CONDITION` and `solver` (`PuzzleSolver<HeightMap, number, HillClimbTraceFrame>`).
- **CLI Path**: `2022/day12/part1/domain/solver.ts` exports `solver` for `tools/aoc/cli.ts`.

## Maintainer Guide

- `FIXED_START_CONDITION` delegates to `createHillClimbingSolver` in `2022/day12/shared/`, matching only `map.startIndex` (`S`).
- Correctness is cross-checked by `solver.oracle.test.ts` using an independent forward-BFS oracle across official examples, edge corridors, and 60 seeded random heightmaps.
- `HillClimbingPart1Visualizer` is a thin wrapper over `HillClimbingVisualizer` in `2022/day12/shared/viz/`.
