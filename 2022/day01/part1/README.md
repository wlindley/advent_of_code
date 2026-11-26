# `2022/day01/part1` — Calorie Counting (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive leaderboard visualizer for Advent of Code 2022 Day 1 Part 1.

- **CLI Execution**: `npm run aoc -- run 2022 1 1` (or `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: delegates parsing to `parseCalorieInventories`, ranks the top `PART1_TOP_COUNT` (`1`) Elf via `rankTopElves`, and totals via `sumCalories`. `traceMaxCalories` simulates all Elves for exact leader telemetry while sampling up to `DEFAULT_MAX_TRACE_STEPS` (`120`) frames.
- `viz/CalorieLeaderboardVisualizer.tsx`: light-mode bar chart centered on the active Elf window with current leader highlighting, item breakdown, and `<PlaybackControls>` driven by `usePlayback`.
