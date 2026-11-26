# 2024 Day 11 Part 1 — Plutonian Pebbles

## Consumer Guide

- **Domain solver**: `domain/solver.ts` exports `PART1_BLINKS = 25` and `solver` (`PuzzleSolver<PebbleLine, bigint, PebbleTraceFrame>`).
- **Manifest**: `index.ts` exports `manifest: PuzzlePartManifest` for automatic discovery by `site/registry.ts` and `tools/aoc/cli.ts`.
- **Visualizer**: `viz/PlutonianPebblesPart1Visualizer.tsx` renders the shared `PebbleEvolutionVisualizer` configured for 25 blinks with playback controls, a dual `log10` growth SVG chart, ordered line preview (while `<= 64` stones), rule breakdown bar, and top-12 dominant stone buckets.

## Maintainer Notes

- Part 1 delegates all parsing, histogram evolution, tracing, and solver construction to `../shared`.
- Verified via unit tests (`domain/solver.test.ts`) and independent oracle tests (`domain/solver.oracle.test.ts`: literal array expansion for `B = 0..12`, top-down memoized recursive DP for `B = 0..75`, and superposition linearity).
