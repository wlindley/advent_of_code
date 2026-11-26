# 2024 Day 11 Part 2 — Plutonian Pebbles

## Consumer Guide

- **Domain solver**: `domain/solver.ts` (re-exported via `domain/index.ts`) exposes `PART2_BLINKS = 75` and a frozen `solver` (`PuzzleSolver<PebbleLine, bigint, PebbleTraceFrame>`).
- **Manifest**: `index.ts` exports `manifest: PuzzlePartManifest` for automatic discovery by `site/registry.ts` and `tools/aoc/cli.ts`.
- **Visualizer**: `viz/PlutonianPebblesPart2Visualizer.tsx` renders the shared `PebbleEvolutionVisualizer` configured for 75 blinks with playback controls, a dual `log10` growth SVG chart, ordered preview (while `<= 64` stones), rule breakdown bar, and top-12 dominant stone buckets.

## Maintainer Notes

- Part 2 delegates parsing, BigInt histogram evolution, bounded tracing, and solver construction to `../shared` and has zero imports from `../part1`.
- Verified via unit tests (`domain/solver.test.ts`) and independent oracle tests (`domain/solver.oracle.test.ts`: pure-arithmetic top-down memoized recursive DP using `/` and `%` digit splitting, plus a `37 + 38 = 75` Chapman-Kolmogorov semigroup split).
