# 2020 Day 7 Part 2 (`Handy Haversacks`)

## Consumer Guide

- **Solver**: `solver` in `2020/day07/part2/domain` (`HaversackSolver` configured with `NESTED_BAG_COUNT_POLICY` and `'shiny gold'`).
- **Manifest**: `manifest` in `2020/day07/part2` exposing metadata, 9-rule example (`exampleAnswer: '32'`), `solver`, and `HandyHaversacksPart2Visualizer`.

## Maintainer Architecture

- `domain/solver.ts` wires `NESTED_BAG_COUNT_POLICY` and `DEFAULT_TARGET_COLOR` into `HaversackSolver`.
- `viz/HandyHaversacksPart2Visualizer.tsx` delegates rendering and playback state to `HaversackVisualizer` from `2020/day07/shared/viz/`.
- All parsing, graph validation, topological BigInt DP layer construction, and trace sampling live in `2020/day07/shared/`.
