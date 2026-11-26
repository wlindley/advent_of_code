# AoC 2022 Day 25 Part 2 — Full of Hot Air (Finale)

## User / Consumer Guide
Verifies that all 49 preceding Advent of Code 2022 stars have been collected and returns the AoC finale completion submission value (`0`), paired with an interactive 50-star illumination visualizer.

## Developer / Maintainer Guide
- Pure TypeScript domain module (`./domain/solver.ts`) validates star counts, emits bounded `FinaleTraceFrame` snapshots via `shared/core` (`validateMaxSteps`, `sampleTraceIndices`), and maintains 100% V8 coverage with zero coupling to `part1/`.
