# 2022 Day 9 Part 2 — Rope Bridge

## Consumer Usage
Import `manifest` from `2022/day09/part2` or `{ PART2_KNOT_COUNT, solver }` from `2022/day09/part2/domain`.
Run via CLI or render `manifest.Visualizer` with raw motion commands (`U|D|L|R <steps>`).

## Maintainer Architecture
- `domain/solver.ts`: Thin 10-knot specialization (`PART2_KNOT_COUNT = 10`) delegating parsing, simulation, and bounded trace sampling to `2022/day09/shared`.
- `domain/solver.test.ts`: Unit tests covering official small/large examples, bounded/default traces, knot threshold boundaries, and invalid input handling.
- `domain/solver.oracle.test.ts`: Independent `{ x, y }[]` + 4-branch follow + `Set<string>` differential test oracle verifying examples, all 4 `(±2, ±2)` diagonal quadrants, negative walks, sparse fallback, and 45 Mulberry32 PRNG plans.
- `viz/RopeBridgePart2Visualizer.tsx`: Thin React wrapper rendering `RopeBridgeVisualizer` with the Part 2 solver.
