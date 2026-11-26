# `2022/day03/part2` — Rucksack Reorganization (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive 3-elf badge-intersection visualizer for Advent of Code 2022 Day 3 Part 2.

- **CLI Execution**: `npm run aoc -- run 2022 3 2` (or `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/elfGroup.ts`: immutable `ElfGroup` value object storing only `groupNumber` and a frozen 3-rucksack tuple, computing `badgeMask`, `badgePriority`, and `badgeItem` dynamically via 3-way `allMask` intersection.
- `domain/solver.ts`: sums `group.badgePriority` in `solvePart2` and emits up to `DEFAULT_MAX_TRACE_STEPS = 120` sampled `ElfGroupTraceFrame` snapshots via `validateMaxSteps` and `sampleTraceIndices`.
- `viz/ElfGroupBadgeVisualizer.tsx`: renders group telemetry, stacked 3-elf rucksack rows highlighting the shared badge token, a 2×26 `a–z` / `A–Z` priority heatmap, and `<PlaybackControls>` driven by `usePlayback`.
