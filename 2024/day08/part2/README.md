# `2024/day08/part2` — Resonant Collinearity (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive SVG antinode visualizer for Advent of Code 2024 Day 8 Part 2.

- **CLI Execution**: `npm run aoc -- run 2024 8 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/harmonicLineRule.ts`: Implements `HARMONIC_LINE_RULE`, normalizing `(dr, dc)` by `gcd(|dr|, |dc|)` and casting bidirectional rays across all in-bounds collinear lattice nodes.
- `domain/solver.ts`: Thin Part 2 facade delegating to `collectAntinodes` and `traceAntinodes` from `../../shared`.
- `domain/solver.oracle.test.ts`: Cross-validates Part 2 against an independent cell-by-cell Euclidean cross-product oracle across official examples and 60 seeded PRNG grids plus trace parity.
- `viz/ResonancePart2Visualizer.tsx`: Thin React wrapper passing `HARMONIC_LINE_RULE` to `../../shared/viz/ResonanceVisualizer`.
