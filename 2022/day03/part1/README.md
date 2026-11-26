# `2022/day03/part1` — Rucksack Reorganization (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive compartment/priority-heatmap visualizer for Advent of Code 2022 Day 3 Part 1.

- **CLI Execution**: `npm run aoc -- run 2022 3 1` (or `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: sums `rucksack.misplacedPriority` in `solvePart1` and emits up to `DEFAULT_MAX_TRACE_STEPS = 120` sampled `RucksackTraceFrame` snapshots via `validateMaxSteps` and `sampleTraceIndices`.
- `viz/RucksackCompartmentVisualizer.tsx`: renders step telemetry, side-by-side compartment tokens with misplaced-item highlighting, a 2×26 `a–z` / `A–Z` priority heatmap, and `<PlaybackControls>` driven by `usePlayback`.
