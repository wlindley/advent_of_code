# `2019/day08/part1` — Space Image Format (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive layer visualizer for Advent of Code 2019 Day 8 Part 1.

- **CLI Execution**: `npm run aoc -- run 2019 8 1` (or `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` enforces standard `25x6` dimensions for `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `MIN_ZERO_CHECKSUM_POLICY` and `STANDARD_IMAGE_DIMENSIONS` (`25x6`) to `SpaceImageSolver` from `../../shared`.
- `index.ts`: adapts `EXAMPLE_INPUT` (`123456789012`) to `3x2` via `selectDimensionsForInput` and passes the same `manifestSolver` to both `manifest.solver` and `Visualizer`.
- `viz/Visualizer.tsx`: delegates rendering to `<SpaceImageVisualizer>` with dual pixel grids, stacked layer histogram, and `<PlaybackControls>`.
