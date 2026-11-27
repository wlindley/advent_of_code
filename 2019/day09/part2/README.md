# AoC 2019 Day 9 Part 2 — Sensor Boost

## Consumer Guide
- `domain/solver.ts`: exports `solver = new BoostSolver(BOOST_SENSOR_MODE)` implementing `PuzzleSolver<IntcodeProgram, bigint, BoostTraceFrame>`.
- `viz/Visualizer.tsx`: wraps `BoostVisualizer` with the Part 2 Sensor Boost solver (`inputSignal = 2n`).
- `index.ts`: exports `manifest` for automatic site registry discovery.

## Maintainer Guide
- All complete-Intcode semantics (`SparseIntcodeMemory`, `RELATIVE_MODE`, `ADJUST_RELATIVE_BASE_OPCODE`) live in `2019/shared/intcode/`, and BOOST execution/trace/layout logic lives in `2019/day09/shared/`.
- `solveBoost` enforces single-output emission (distress coordinates) and rejects multi-output diagnostic error streams or stalled runs before returning the result.
