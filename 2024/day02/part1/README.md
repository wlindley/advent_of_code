# `2024/day02/part1` — Red-Nosed Reports (Part 1)

## Consumer Guide
Pure solver and interactive safety-scan visualization for Advent of Code 2024 Day 2 Part 1.

- **CLI Execution**: `npm run aoc -- run 2024 2 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: counts `Report.isSafe` across parsed reports (`countSafeReports`) and emits bounded `ReportScanTraceFrame` snapshots sampled uniformly up to `DEFAULT_MAX_TRACE_STEPS` (`200`) via `sampleTraceIndices`.
- `viz/ReportSafetyVisualizer.tsx`: uses `usePlayback` and `<PlaybackControls>` to step through a report level profile chart alongside a windowed scan table and 72-bar sampled overview strip.
