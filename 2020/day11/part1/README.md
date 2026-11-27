# 2020 Day 11 Part 1 (`Seating System`)

## Consumer Guide

- **Solver**: `solver` in `2020/day11/part1/domain` (`SeatingSystemSolver` configured with `ADJACENT_SEATING_RULE`, returning `number`).
- **Manifest**: `manifest` in `2020/day11/part1` exposing puzzle metadata, the 10x10 example layout (`exampleAnswer: '37'`), `solver`, and `SeatingPart1Visualizer`.

## Maintainer Architecture

- `domain/solver.ts` wires `ADJACENT_SEATING_RULE` (`crowdThreshold = 4`) into `SeatingSystemSolver`.
- `viz/SeatingPart1Visualizer.tsx` delegates playback, HiDPI canvas rendering, and neighbor-ray inspection to `SeatingVisualizer` in `2020/day11/shared/viz/`.
- All grid parsing, CSR neighbor graph construction, synchronous round stepping, cycle detection, and trace sampling live in `2020/day11/shared/`.
