# `2019/day08/part2` — Space Image Format (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive layer-compositing OCR visualizer for Advent of Code 2019 Day 8 Part 2.

- **CLI Execution**: `npm run aoc -- run 2019 8 2` (or `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts` (decodes a 6-layer `SPACE` example).
- **Domain Solver**: `export const solver` in `domain/solver.ts` enforces standard `25x6` dimensions for `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `DECODED_MESSAGE_POLICY` and `STANDARD_IMAGE_DIMENSIONS` (`25x6`) to `SpaceImageSolver` from `../../shared`.
- `index.ts`: generates a deterministic 6-layer `SPACE` example from `CANONICAL_GLYPHS` with staggered `slot + (row % 2)` reveal layers.
- `viz/Visualizer.tsx`: delegates rendering to `<SpaceImageVisualizer>` with dual pixel grids, progressive `Decoded Slots` badges, layer histogram, and `<PlaybackControls>`.
