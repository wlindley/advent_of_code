# `2025/day04/part2` — Printing Department (Part 2)

## Consumer Guide
Pure solver and interactive k-core peeling visualizer for Advent of Code 2025 Day 4 Part 2.

- **CLI Execution**: `npm run aoc -- run 2025 4 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and strided wave-peeling `trace`. `peelWarehouse(floor)` returns an immutable `PeelingResult` with `removalWave`, `waveCounts`, `totalRolls`, and derived getters (`totalWaves`, `totalRemoved`, `survivorCount`).

## Maintainer Guide
- `domain/solver.ts`: uses `floor.computeDegreeMap()` and dual-offset padded/grid neighbor arrays (`paddedOffsets`, `gridOffsets`) to peel `< MAX_BLOCKING_NEIGHBORS` (`4`) rolls wave by wave in `O(R * C)` time with duplicate-free frontier claiming. `trace()` emits `[{ wave: 0, removedThisWave: 0, cumulativeRemoved: 0 }]` when `totalWaves === 0`, or stride-sampled frames bounded by `DEFAULT_MAX_TRACE_STEPS` (`250`).
- `viz/WarehousePeelingVisualizer.tsx`: renders a `<canvas>` peeling contour (slate standing `#475569`, amber active wave `#f59e0b`, cyan-to-blue historical contour, crimson `#dc2626` final 4-core reveal), a per-wave removal bar chart, `.meta-row` badges, and `<PlaybackControls>`.
