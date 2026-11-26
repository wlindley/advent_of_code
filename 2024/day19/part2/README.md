# 2024 Day 19 Part 2 — Linen Layout

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for automatic site discovery (`year: 2024, day: 19, part: 2, exampleAnswer: '16'`).
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solvePart2` and `solver` (`PuzzleSolver<LinenLayout, bigint, LinenTraceFrame>`) for `tools/aoc/cli.ts`.
- **Visualizer**: `./viz/LinenPart2Visualizer.tsx` delegates to `../../shared/viz/LinenVisualizer` in `'arrangements'` mode, displaying stripe ribbons, per-design `wayCount`, cumulative `BigInt` arrangement totals, log₂ DP prefix charts, and sampled playback.

## Maintainer Notes

- **Architecture**: `part2/domain/` is a pure TypeScript facade over `../../shared` (`parseLinenLayout`, `countTotalArrangements`, `buildLinenTrace`) with zero React/DOM imports and zero dependency on `part1/`.
- **Verification**: `domain/solver.test.ts` tests `executeSolver` with a deterministic `FakeClock`, `BigInt` precision past 64-bit signed integers, duplicate patterns/designs, differential verification against both an independent memoized `startsWith` `BigInt` oracle and an exhaustive backtracking partition counter, capped/uncapped traces, and invalid input rejection.
