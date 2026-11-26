# `2024/day01/part1` — Historian Hysteria (Part 1)

## Consumer Guide
Pure solver and interactive rank-pairing visualization for Advent of Code 2024 Day 1 Part 1.

- **CLI Execution**: `npm run aoc -- run 2024 1 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: sorts each column with `Float64Array.prototype.sort()` (avoiding JavaScript's default lexicographic `Array.prototype.sort()`), pairs sorted order statistics, and checks `Number.isSafeInteger` on cumulative distance. `traceTotalDistance` runs a single linear pass and samples frames to `maxSteps` (`200` default) via `sampleTraceIndices`.
- `viz/LocationDistanceVisualizer.tsx`: uses `usePlayback` and `<PlaybackControls>` to step through a windowed sorted rank-pairing diagram alongside a sampled order-statistic gap ribbon.
