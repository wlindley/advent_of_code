# `2019/day07/part1` — Amplification Circuit (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive schematic visualizer for Advent of Code 2019 Day 7 Part 1.

- **CLI Execution**: `npm run aoc -- run 2019 7 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `SERIES_CIRCUIT_MODE` (`[0n, 1n, 2n, 3n, 4n]`) to `AmplifierCircuitSolver` from `../../shared`.
- `viz/Visualizer.tsx`: delegates rendering to `<AmplifierVisualizer>` with `<AmplifierChainSvg>`, `<LeaderboardPanel>`, and `<PlaybackControls>`.
