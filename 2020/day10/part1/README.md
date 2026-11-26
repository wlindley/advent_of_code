# 2020 Day 10 Part 1 (`Adapter Array`)

## Consumer Guide

- **Solver**: `solver` in `2020/day10/part1/domain` (`AdapterArraySolver` configured with `JOLTAGE_DIFF_PRODUCT_POLICY`, returning `bigint`).
- **Manifest**: `manifest` in `2020/day10/part1` exposing puzzle metadata, the 31-adapter official example (`exampleAnswer: '220'`), `solver`, and `AdapterArrayPart1Visualizer`.

## Maintainer Architecture

- `domain/solver.ts` wires `JOLTAGE_DIFF_PRODUCT_POLICY` into `AdapterArraySolver`.
- `viz/AdapterArrayPart1Visualizer.tsx` delegates playback and SVG staircase rendering to `AdapterChainVisualizer` in `2020/day10/shared/viz/`.
- All parsing, invariant checks, difference counting, trace sampling, and viewport projection live in `2020/day10/shared/`.
