# 2020 Day 8 Part 2 (`Handheld Halting`)

## Consumer Guide

- **Solver**: `solver` in `2020/day08/part2/domain` (`BootCodeSolver` configured with `REPAIR_BOOT_POLICY`, returning `bigint`).
- **Manifest**: `manifest` in `2020/day08/part2` exposing puzzle metadata, the 9-instruction example (`exampleAnswer: '8'`), `solver`, and `HandheldHaltingPart2Visualizer`.

## Maintainer Architecture

- `domain/solver.ts` wires `REPAIR_BOOT_POLICY` into `BootCodeSolver`.
- `viz/HandheldHaltingPart2Visualizer.tsx` delegates rendering and playback state to `BootDebuggerVisualizer` in `2020/day08/shared/viz/`.
- All instruction parsing, reverse-BFS repair discovery, execution, trace sampling, and debugger viewport projections live in `2020/day08/shared/`.
