# 2020 Day 7 Part 1 (`Handy Haversacks`)

## Consumer Guide

- **Solver**: `solver` in `2020/day07/part1/domain` (`HaversackSolver` configured with `ANCESTOR_COLORS_POLICY` and `'shiny gold'`).
- **Manifest**: `manifest` in `2020/day07/part1` exposing metadata, 9-rule example (`exampleAnswer: '4'`), `solver`, and `HandyHaversacksPart1Visualizer`.

## Maintainer Architecture

- `domain/solver.ts` wires `ANCESTOR_COLORS_POLICY` and `DEFAULT_TARGET_COLOR` into `HaversackSolver`.
- `viz/HandyHaversacksPart1Visualizer.tsx` delegates rendering and playback state to `HaversackVisualizer` from `2020/day07/shared/viz/`.
- All parsing, graph validation, reverse-BFS layer construction, and trace sampling live in `2020/day07/shared/`.
