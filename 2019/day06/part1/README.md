# `2019/day06/part1` — Universal Orbit Map (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive orbital-depth visualizer for Advent of Code 2019 Day 6 Part 1.

- **CLI Execution**: `npm run aoc -- run 2019 6 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts` (`exampleAnswer: '42'`).
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `TOTAL_ORBITS_POLICY` to `OrbitMapSolver` from `../../shared`.
- `viz/Visualizer.tsx`: delegates rendering to `<OrbitMapVisualizer>` with `TOTAL_ORBITS_POLICY` and `<PlaybackControls>`.
