# `2022/day04/part1` — Camp Cleanup (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive interval-comparison visualizer for Advent of Code 2022 Day 4 Part 1.

- **CLI Execution**: `npm run aoc -- run 2022 4 1` (or `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: counts `pair.hasFullContainment` in `solvePart1` and emits up to `DEFAULT_MAX_TRACE_STEPS = 120` sampled `AssignmentTraceFrame` snapshots via `validateMaxSteps` and `sampleTraceIndices`.
- `viz/SectionRangeVisualizer.tsx`: renders step telemetry, a two-bar SVG interval view using discrete-unit `BigInt` projection (`bounds.end - bounds.start + 1n` denominator), an overlap highlight band, a 5-relation tally strip, and `<PlaybackControls>` driven by `usePlayback`.
