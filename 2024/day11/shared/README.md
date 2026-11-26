# 2024 Day 11 Shared Domain & Visualizer

## Consumer Guide

Import pure TypeScript domain primitives from `./index`:

- `parsePebbleLine(raw)` / `PebbleLine`: validates whitespace-separated non-negative integer stone labels into an immutable `PebbleLine` with `toHistogram(): Map<bigint, bigint>`.
- `blinkStone(stone)`: applies the single-blink rule (`0n -> [1n]`, even decimal digit count -> two split halves, odd -> `[stone * 2024n]`).
- `countStonesAfterBlinks(line, blinkCount)`: advances a `Map<bigint, bigint>` histogram for `blinkCount` steps using a memoized transition cache.
- `tracePebbleEvolution(line, blinkCount, options?)`: produces sampled `PebbleTraceFrame` snapshots (`totalStones`, `distinctStones`, `ruleCounts`, `orderedPreview` up to 64 stones, and top-12 `topBuckets`).
- `createPlutonianPebblesSolver(blinkCount)`: builds a frozen `PuzzleSolver<PebbleLine, bigint, PebbleTraceFrame>`.

Shared React visualization components live in `./viz/*.tsx` (`GrowthChartSvg.tsx`, `PebbleEvolutionVisualizer.tsx`) and are never re-exported from `./index.ts`.

## Maintainer Notes

- **DAG**: `pebbles.ts` -> `evolution.ts` -> `trace.ts` -> `solverFactory.ts` -> `index.ts`. `viz/` consumes `../index` and `../../../../shared/{core,viz}`.
- **Precision**: all stone labels, counts, and histogram totals use `bigint`; `GrowthChartSvg` uses `bigintLog2` and `PebbleEvolutionVisualizer` computes rule percentages via BigInt scaled division.
- **Immutability**: `PebbleLine`, transition records, and trace frames are deeply frozen at construction boundaries.
