# `2022/day04/part2` — Camp Cleanup (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive interval-overlap visualizer for Advent of Code 2022 Day 4 Part 2.

- **CLI Execution**: `npm run aoc -- run 2022 4 2` (or `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: counts `pair.hasOverlap` in `solvePart2` and emits up to `DEFAULT_MAX_TRACE_STEPS = 120` sampled `OverlapTraceFrame` snapshots via `validateMaxSteps` and `sampleTraceIndices`.
- `viz/OverlapChart.tsx`: renders SVG comparison bars with exact `BigInt` discrete-unit scaling (`((delta) * 10000n) / totalUnits`), multi-section overlap bands, single-point endpoint-touch pins, disjoint missing-section brackets, and adjacent split ticks.
- `viz/OverlapVisualizer.tsx`: renders telemetry emphasizing `tally.overlapCount`, a 5-relation tally strip, and `<PlaybackControls>` driven by `usePlayback`.
