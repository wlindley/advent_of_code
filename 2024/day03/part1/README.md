# `2024/day03/part1` — Mull It Over (Part 1)

## Consumer Guide
Pure solver and interactive memory-scanner visualization for Advent of Code 2024 Day 3 Part 1.

- **CLI Execution**: `npm run aoc -- run 2024 3 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: sums `MulInstruction.product` over `ParsedMemory.mulInstructions` (`sumMultiplications`) and emits bounded `MulScanTraceFrame` snapshots sampled uniformly up to `DEFAULT_MAX_TRACE_STEPS` (`200`) via `sampleTraceIndices`.
- `viz/CorruptedMemoryVisualizer.tsx`: uses `usePlayback` and `<PlaybackControls>` to step through a 36-character sliding memory tape window alongside a 5-row contribution timeline and 72-bar sampled product overview strip.
