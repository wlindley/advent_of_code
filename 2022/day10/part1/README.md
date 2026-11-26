# 2022 Day 10 Part 1 — Cathode-Ray Tube

## Consumer Usage
Import `manifest` from `2022/day10/part1` or `solver` from `2022/day10/part1/domain`.
Run via CLI or render `manifest.Visualizer` with raw `noop` and `addx V` instructions.

## Maintainer Architecture
- `domain/solver.ts`: Thin Part 1 wrapper delegating parsing, typed-array CPU timeline execution, and probe summation (`[20, 60, 100, 140, 180, 220]`) to `2022/day10/shared`.
- `domain/solver.oracle.test.ts`: Independent micro-op queue expansion and event-driven probe sampler oracles verified across examples and 200 seeded programs.
- `viz/CathodeRayTubePart1Visualizer.tsx`: Thin React wrapper rendering `CrtTimelineVisualizer` with Part 1 probe markers enabled.
