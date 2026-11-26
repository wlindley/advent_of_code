# 2022 Day 9 Part 1 — Rope Bridge

## Consumer Usage
Import `manifest` from `2022/day09/part1` or `solver` from `2022/day09/part1/domain`.
Run via CLI or render `manifest.Visualizer` with raw motion commands (`U|D|L|R <steps>`).

## Maintainer Architecture
- `domain/solver.ts`: Thin 2-knot specialization (`PART1_KNOT_COUNT = 2`) delegating parsing, simulation, and bounded trace sampling to `2022/day09/shared`.
- `domain/solver.oracle.test.ts`: Independent `{ x, y }[]` + `Set<string>` differential test oracle verifying correctness across examples, diagonal cascades, and 50 seeded plans.
- `viz/RopeBridgePart1Visualizer.tsx`: Thin React wrapper rendering `RopeBridgeVisualizer` with the Part 1 solver.
