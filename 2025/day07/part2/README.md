# `2025/day07/part2` — Laboratories (Part 2)

## Consumer Guide
Pure BigInt solver and interactive quantum timeline-density visualizer for Advent of Code 2025 Day 7 Part 2.

- **CLI Execution**: `npm run aoc -- run 2025 7 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve` (exact `bigint` timeline count), and downsampled `trace`.

## Maintainer Guide
- `domain/solver.ts`: `simulateQuantum()` sweeps rows `startRow + 1 .. rows - 1` using ping-pong `bigint[]` column buffers so overlapping split histories sum without 64-bit overflow, tracking laterally exited timelines (`exitedEarly`) and `Float32Array` per-cell `log2` densities (`EMPTY_DENSITY = -1` distinguishes unvisited `0n` from visited `1n` where `bigIntLog2(1n) === 0`). `downsampleFrames()` bounds traces to `DEFAULT_MAX_TRACE_STEPS` (`160`).
- `viz/QuantumManifoldVisualizer.tsx`: renders a light-mode `<canvas>` with a 4-stop perceptual `log2` heatmap (`#0ea5e9` -> `#6366f1` -> `#d946ef` -> `#f59e0b`), active/past/unreached splitters, wavefront scanline, exact `BigInt` `.meta-row` badges, legend, and `<PlaybackControls>`.
