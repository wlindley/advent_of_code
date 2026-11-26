# 2020 Day 10 Part 2 (`Adapter Array`)

## Consumer Guide

- **Solver**: `solver` in `2020/day10/part2/domain` (`AdapterArraySolver` configured with `ARRANGEMENT_COUNT_POLICY`, returning `bigint`).
- **Manifest**: `manifest` in `2020/day10/part2` exposing puzzle metadata, the 31-adapter official example (`exampleAnswer: '19208'`), `solver`, and `AdapterArrayPart2Visualizer`.

## Maintainer Architecture

- `domain/solver.ts` wires `ARRANGEMENT_COUNT_POLICY` into `AdapterArraySolver`.
- `viz/AdapterArrayPart2Visualizer.tsx` delegates playback and SVG staircase rendering to `AdapterChainVisualizer` in `2020/day10/shared/viz/`.
- All parsing, invariant checks, BigInt arrangement DP, trace sampling, and viewport projection live in `2020/day10/shared/`.
