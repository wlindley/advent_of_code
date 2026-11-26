# `2019/day04/part2` — Secure Container (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive odometer visualizer for Advent of Code 2019 Day 4 Part 2.

- **CLI Execution**: `npm run aoc -- run 2019 4 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `EXACT_PAIR_POLICY` to `createSecureContainerSolver` from `../../shared`.
- `viz/Visualizer.tsx`: delegates rendering to `<SecureContainerVisualizer>` with `EXACT_PAIR_POLICY` and `<PlaybackControls>`.
