# 2020 Day 9 Part 1 (`Encoding Error`)

## Consumer Guide

- **Solver**: `solver` in `2020/day09/part1/domain` (`XmasAttackSolver` configured with `FIRST_INVALID_POLICY` and `DEFAULT_PREAMBLE_LENGTH = 25`, returning `bigint`).
- **Manifest**: `manifest` in `2020/day09/part1` exposing puzzle metadata, a 31-line W=25 example (`exampleAnswer: '125'`), `solver`, and `EncodingErrorPart1Visualizer`.

## Maintainer Architecture

- `domain/solver.ts` wires `FIRST_INVALID_POLICY` and `DEFAULT_PREAMBLE_LENGTH` into `XmasAttackSolver`.
- `viz/EncodingErrorPart1Visualizer.tsx` delegates rendering and playback state to `XmasSignalVisualizer` in `2020/day09/shared/viz/`.
- All stream parsing, sliding-window pair lookup, trace sampling, and viewport projection live in `2020/day09/shared/`.
