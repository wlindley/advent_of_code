# 2024 Day 13 Part 2 — Claw Contraption

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for automatic site registry discovery (`exampleAnswer: '875318608908'`).
- **CLI / Domain Solver**: `./domain/solver.ts` exports `PART2_PRIZE_OFFSET` (`10_000_000_000_000n`), `PART2_CONFIG`, and `solver` (`PuzzleSolver<readonly ClawMachine[], bigint, ClawTraceFrame>`); `./domain/index.ts` re-exports all three.
- **Visualizer**: `./viz/ClawContraptionPart2Visualizer.tsx` renders `ClawContraptionVisualizer` configured with `PART2_CONFIG`.

## Maintainer Guide

- **Architecture**: `part2/domain/` supplies `PART2_CONFIG = new ClawConfig(10_000_000_000_000n, null)` and delegates parsing, exact solving, evaluation, and trace sampling to `../../shared`.
- **Verification**:
  - `solver.test.ts` checks frozen exports, the official 4-machine example (`875318608908n`) and per-machine trace outcomes, `executeSolver` integration with a fake `Clock`, unbounded `> 100` press and `10^13` collinear wins, trace sampling, and invalid inputs.
  - `solver.oracle.test.ts` cross-checks `solveClawMachine` against an independent `Rational` 2×2 Gauss-Jordan solver and modular-inverse collinear solver across the example, curated `10^13` edge cases, and 150 seeded PRNG machines.
