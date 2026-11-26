# `2019/day01/part1` — The Tyranny of the Rocket Equation (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive telemetry visualizer for Advent of Code 2019 Day 1 Part 1.

- **CLI Execution**: `npm run aoc -- run 2019 1 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `SINGLE_STAGE_FUEL_POLICY` to `createFuelSolver` from `../shared`.
- `viz/Visualizer.tsx`: delegates rendering to the shared `<RocketFuelVisualizer>` with `SINGLE_STAGE_FUEL_POLICY` and `<PlaybackControls>`.
