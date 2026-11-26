# `2024/day08/part1` — Resonant Collinearity (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive SVG antinode visualizer for Advent of Code 2024 Day 8 Part 1.

- **CLI Execution**: `npm run aoc -- run 2024 8 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/doubleDistanceRule.ts`: Implements `DOUBLE_DISTANCE_RULE`, emitting only the two exterior reflections `A - (B - A)` and `B + (B - A)` per distinct same-frequency pair.
- `domain/solver.ts`: Thin Part 1 facade delegating to `collectAntinodes` and `traceAntinodes` from `../../shared`.
- `domain/solver.oracle.test.ts`: Cross-validates Part 1 against independent `pair-hashset` and `cell-centric-lookup` oracles across 80 seeded PRNG grids plus trace parity.
- `viz/ResonancePart1Visualizer.tsx`: Thin React wrapper passing `DOUBLE_DISTANCE_RULE` to `../../shared/viz/ResonanceVisualizer`.
