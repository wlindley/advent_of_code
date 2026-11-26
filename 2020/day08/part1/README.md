# 2020 Day 8 Part 1 (`Handheld Halting`)

## Consumer Guide

- **Solver**: `solver` in `2020/day08/part1/domain` (`BootCodeSolver` configured with `LOOP_ACCUMULATOR_POLICY`, returning `bigint`).
- **Manifest**: `manifest` in `2020/day08/part1` exposing puzzle metadata, the 9-instruction example (`exampleAnswer: '5'`), `solver`, and `HandheldHaltingPart1Visualizer`.

## Maintainer Architecture

- `domain/solver.ts` wires `LOOP_ACCUMULATOR_POLICY` into `BootCodeSolver`.
- `viz/HandheldHaltingPart1Visualizer.tsx` delegates rendering and playback state to `BootDebuggerVisualizer` in `2020/day08/shared/viz/`.
- All instruction parsing, execution, loop detection, trace sampling, and debugger viewport projections live in `2020/day08/shared/`.
