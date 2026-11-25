# `2025/day04/part1` — Printing Department (Part 1)

## Consumer Guide
Pure solver and interactive warehouse degree-heatmap visualizer for Advent of Code 2025 Day 4 Part 1.

- **CLI Execution**: `npm run aoc -- run 2025 4 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and row-sweeping `trace`.

## Maintainer Guide
- `domain/solver.ts`: parses `.` / `@` grids into `WarehouseFloor`, computes `computeDegreeMap()`, and counts `@` cells with degree `< MAX_BLOCKING_NEIGHBORS` (`4`). `trace()` emits step `0` plus stride-sampled row-sweep snapshots capped at `DEFAULT_MAX_TRACE_STEPS` (`250`), always keeping the final row frame.
- `viz/WarehouseCanvasVisualizer.tsx`: renders a `<canvas>` 8-neighbor degree heatmap (emerald `< 4`, amber-to-crimson `>= 4`, slate unscanned rows, `#2563eb` active scanline), a partitioned `0..8` degree histogram, `.meta-row` badges, and `<PlaybackControls>`.
