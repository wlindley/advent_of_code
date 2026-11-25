# `2025/day07/part1` — Laboratories (Part 1)

## Consumer Guide
Pure solver and interactive beam-cascade visualizer for Advent of Code 2025 Day 7 Part 1.

- **CLI Execution**: `npm run aoc -- run 2025 7 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and downsampled `trace`.

## Maintainer Guide
- `domain/solver.ts`: `simulateBeams()` sweeps rows `startRow + 1 .. rows - 1` using ping-pong `Uint8Array(cols)` buffers so merged beams are deduplicated per column, recording `cellStates` (`Empty`, `Beam`, `UnreachedSplitter`, `HitSplitter`) and per-row `BeamCascadeFrame` snapshots. `downsampleFrames()` caps traces at `DEFAULT_MAX_TRACE_STEPS` (`160`) while validating positive integer `maxSteps`.
- `viz/BeamCascadeVisualizer.tsx`: renders a light-mode `<canvas>` showing pre-wave rows, swept/active beams, hit/unreached splitters, emitter `S`, wavefront row highlight, `.meta-row` badges, legend, and `<PlaybackControls>`.
