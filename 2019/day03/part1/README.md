# `2019/day03/part1` — Crossed Wires (Part 1)

## Consumer Guide
Pure TypeScript BigInt solver and interactive circuit visualizer for Advent of Code 2019 Day 3 Part 1.

- **CLI Execution**: `npm run aoc -- run 2019 3 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `MANHATTAN_METRIC` to `createCrossedWiresSolver` from `../../shared`.
- `viz/Visualizer.tsx`: delegates rendering to `<CrossedWiresVisualizer>` with `MANHATTAN_METRIC` and `<PlaybackControls>`.
