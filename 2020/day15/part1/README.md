# 2020 Day 15 Part 1 — Rambunctious Recitation

## User / Consumer Guide

- **Manifest**: `manifest` in `part1/index.ts` registers `Rambunctious Recitation` (`year: 2020`, `day: 15`, `part: 1`), the official example (`0,3,6` -> `436`), `solver`, and `MemoryGamePart1Visualizer`.
- **Solver**: `solver` in `part1/domain/solver.ts` wraps `new MemoryGameSolver(PART1_TARGET_TURN)`.
  - `parse(raw)` validates a comma-separated sequence of non-negative safe integers into a `StartingSequence`.
  - `solve(sequence)` computes the number spoken on turn `2020`.
  - `trace(sequence, options)` emits bounded `MemoryGameTraceFrame[]` snapshots (`DEFAULT_MAX_TRACE_STEPS = 200`) for interactive playback.
- **Visualizer**: `MemoryGamePart1Visualizer` renders a 16-turn sliding window with Bézier lookback arcs (`TurnArcTimelineSvg`), cumulative growth sparkline and metrics (`GrowthStatsPanel`), telemetry badges, and playback controls.

## Developer / Maintainer Guide

- Part 1 delegates all parsing, Commit-on-Speak simulation, bounded trace sampling, and timeline projection to `2020/day15/shared/`.
- `part1/domain/` is 100% pure TypeScript with zero React or DOM imports so CLI and Vitest runners execute it directly.
