# 2024 Day 19 Part 1 — Linen Layout

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for automatic site discovery (`year: 2024, day: 19, part: 1, exampleAnswer: '6'`).
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solvePart1` and `solver` (`PuzzleSolver<LinenLayout, number, LinenTraceFrame>`) for `tools/aoc/cli.ts`.
- **Visualizer**: `./viz/LinenPart1Visualizer.tsx` delegates to `../../shared/viz/LinenVisualizer` in `'possible'` mode, displaying stripe ribbons, witness tile splits or stall markers, log₂ DP prefix charts, and sampled playback.

## Maintainer Guide

- **Architecture**: `part1/domain/` contains only a thin `PuzzleSolver` facade over `../../shared` (`parseLinenLayout`, `countPossibleDesigns`, `buildLinenTrace`), keeping zero React/DOM imports in domain code.
- **Verification**: `domain/solver.test.ts` exercises `executeSolver` with a deterministic fake `Clock`, full and capped trace generation, and invalid input rejection; `../../shared/dp.oracle.test.ts` provides differential and stress verification.
