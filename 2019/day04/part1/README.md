# `2019/day04/part1` — Secure Container (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive odometer visualizer for Advent of Code 2019 Day 4 Part 1.

- **CLI Execution**: `npm run aoc -- run 2019 4 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `AT_LEAST_PAIR_POLICY` to `createSecureContainerSolver` from `../../shared`.
- `viz/Visualizer.tsx`: delegates rendering to `<SecureContainerVisualizer>` with `AT_LEAST_PAIR_POLICY` and `<PlaybackControls>`.
