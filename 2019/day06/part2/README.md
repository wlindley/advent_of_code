# `2019/day06/part2` — Universal Orbit Map (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive orbital-transfer visualizer for Advent of Code 2019 Day 6 Part 2.

- **CLI Execution**: `npm run aoc -- run 2019 6 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts` (`exampleAnswer: '4'`).
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `SANTA_TRANSFER_POLICY` to `OrbitMapSolver` from `../../shared`.
- `viz/Visualizer.tsx`: delegates rendering to `<OrbitMapVisualizer>` with `SANTA_TRANSFER_POLICY` and `<PlaybackControls>`.
