# `2022/day01/part2` — Calorie Counting (Part 2)

## Consumer Guide
Pure TypeScript solver and interactive top-three podium visualizer for Advent of Code 2022 Day 1 Part 2.

- **CLI Execution**: `npm run aoc -- run 2022 1 2` (or `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: delegates parsing to `parseCalorieInventories`, ranks the top `PART2_TOP_COUNT` (`3`) Elves via `rankTopElves`, and totals them with safe-integer overflow protection via `sumCalories`. `traceTopThreeCalories` simulates every Elf while sampling up to `DEFAULT_MAX_TRACE_STEPS` (`120`) immutable frames.
- `viz/TopThreePodiumVisualizer.tsx`: renders the 3-slot Gold/Silver/Bronze podium, `"Slot open"` placeholders while the podium fills, an aligned 3rd-place cutoff line across the podium and challenger lane, live item breakdown, and `<PlaybackControls>` driven by `usePlayback`.
