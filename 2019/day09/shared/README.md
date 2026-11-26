# `2019/day09/shared` — Sensor Boost Complete Intcode Domain & Trace Support

## Consumer Guide
Pure TypeScript domain and visualization-layout primitives shared between Day 9 Part 1 and Part 2:

- `boostModels.ts`: `BOOST_TEST_MODE` (`1n`), `BOOST_SENSOR_MODE` (`2n`), frozen `BoostReport` with derived getters, and `BoostTraceFrame`.
- `boostRunner.ts`: `runBoost`, `solveBoost`, two-pass `traceBoost`, and frozen `BoostSolver` (`PuzzleSolver`).
- `vizLayout.ts`: pure frame-cell reads, instruction disassembly (`POS`/`IMM`/`REL`), relative-base-aware step summaries, and bounded tape/sparse windows.
- `viz/`: interactive React components (`BoostVisualizer`, `RegisterDisassemblyPanel`, `OutputStreamPanel`, `SparseMemoryPanel`).

## Maintainer Guide
- `index.ts` strictly exports pure TypeScript modules with zero `viz/` imports so `tools/aoc/cli.ts` and Node tests import cleanly without React/DOM dependencies.
- `traceBoost` uses two-pass probe-then-capture via `validateMaxSteps` and `sampleTraceIndices` to bound browser trace size on long BOOST runs while capturing `relativeBaseBefore/After` and sparse memory snapshots.
