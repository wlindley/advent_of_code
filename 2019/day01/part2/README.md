# `2019/day01/part2` — The Tyranny of the Rocket Equation (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive telemetry visualizer for Advent of Code 2019 Day 1 Part 2.

- **CLI Execution**: `npm run aoc -- run 2019 1 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `RECURSIVE_FUEL_POLICY` to `createFuelSolver` from `../../shared`.
- `viz/Visualizer.tsx`: delegates rendering to the shared `<RocketFuelVisualizer>` with `RECURSIVE_FUEL_POLICY` and `<PlaybackControls>`.
