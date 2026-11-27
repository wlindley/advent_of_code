# 2020 Day 11 Part 2 (`Seating System`)

## Consumer Guide

- **Solver**: `solver` in `2020/day11/part2/domain` (`SeatingSystemSolver` configured with `LINE_OF_SIGHT_SEATING_RULE`, returning `number`).
- **Manifest**: `manifest` in `2020/day11/part2` exposing puzzle metadata, the 10x10 example layout (`exampleAnswer: '26'`), `solver`, and `SeatingPart2Visualizer`.

## Maintainer Architecture

- `domain/solver.ts` wires `LINE_OF_SIGHT_SEATING_RULE` (`crowdThreshold = 5`) into `SeatingSystemSolver`.
- `viz/SeatingPart2Visualizer.tsx` delegates playback, HiDPI canvas rendering, and visibility-ray inspection to `SeatingVisualizer` in `2020/day11/shared/viz/`.
- All grid parsing, CSR visibility graph construction, synchronous round stepping, cycle detection, and trace sampling live in `2020/day11/shared/`.
