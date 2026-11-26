# 2024 Day 13 Part 1 — Claw Contraption

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for automatic site registry discovery.
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solver` (`PuzzleSolver<readonly ClawMachine[], bigint, ClawTraceFrame>`); `./domain/index.ts` exports `PART1_CONFIG` and `solver`.
- **Visualizer**: `./viz/ClawContraptionPart1Visualizer.tsx` renders `ClawContraptionVisualizer` configured with `PART1_CONFIG`.

## Maintainer Guide

- **Architecture**: `part1/domain/` supplies `PART1_CONFIG = new ClawConfig(0n, 100n)` and delegates parsing, exact solving, evaluation, and trace sampling to `../../shared`.
- **Verification**: Unit tests verify the official 4-machine example (`480n`), `executeSolver` integration, and a differential oracle comparing `solveClawMachine` against an exhaustive `(A, B) ∈ [0..100]^2` brute-force minimizer across curated boundary cases and 150 seeded PRNG machines (including 30 collinear cases).
