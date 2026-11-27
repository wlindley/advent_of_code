# 2020 Day 15 Part 2 — Rambunctious Recitation

## User / Consumer Guide

- **Manifest**: `manifest` in `part2/index.ts` registers `Rambunctious Recitation` (`year: 2020`, `day: 15`, `part: 2`), the official example (`0,3,6` -> `175594`), `solver`, and `MemoryGamePart2Visualizer`.
- **Solver**: `solver` in `part2/domain/solver.ts` wraps `new MemoryGameSolver(PART2_TARGET_TURN)`.
  - `parse(raw)` validates a comma-separated sequence of non-negative safe integers into a `StartingSequence`.
  - `solve(sequence)` computes the number spoken on turn `30,000,000`.
  - `trace(sequence, options)` emits bounded `MemoryGameTraceFrame[]` snapshots (`DEFAULT_MAX_TRACE_STEPS = 200`) capped at `MAX_TRACE_TURN = 20,000` so the browser remains responsive.
- **Visualizer**: `MemoryGamePart2Visualizer` renders a 16-turn sliding window with Bézier lookback arcs (`TurnArcTimelineSvg`), cumulative growth sparkline and metrics (`GrowthStatsPanel`), telemetry badges including trace-horizon truncation indicator, and playback controls.

## Developer / Maintainer Guide

- Part 2 delegates all parsing, Commit-on-Speak simulation, bounded trace sampling, and timeline projection to `2020/day15/shared/` with zero imports from `part1/`.
- `part2/domain/` is 100% pure TypeScript with zero React or DOM imports so CLI and Vitest runners execute it directly.
