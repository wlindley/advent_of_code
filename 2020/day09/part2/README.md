# 2020 Day 9 Part 2 (`Encoding Error`)

## Consumer Guide

- **Solver**: `solver` in `2020/day09/part2/domain` (`XmasAttackSolver` configured with `ENCRYPTION_WEAKNESS_POLICY` and `DEFAULT_PREAMBLE_LENGTH = 25`, returning `bigint`).
- **Manifest**: `manifest` in `2020/day09/part2` exposing puzzle metadata (`puzzleUrl: 'https://adventofcode.com/2020/day/9#part2'`), a 31-line W=25 example (`exampleAnswer: '25'`), `solver`, and `EncodingErrorPart2Visualizer`.

## Maintainer Architecture

- `domain/solver.ts` wires `ENCRYPTION_WEAKNESS_POLICY` and `DEFAULT_PREAMBLE_LENGTH` into `XmasAttackSolver`.
- `viz/EncodingErrorPart2Visualizer.tsx` delegates two-phase rendering and playback state to `XmasSignalVisualizer` in `2020/day09/shared/viz/`.
- All stream parsing, sliding-window pair lookup, two-pointer contiguous-weakness search, trace sampling, and viewport projection live in `2020/day09/shared/`.
