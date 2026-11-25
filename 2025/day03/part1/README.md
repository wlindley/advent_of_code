# `2025/day03/part1` — Lobby (Part 1)

## Consumer Guide
Pure solver and interactive battery-rack visualizer for Advent of Code 2025 Day 3 Part 1.

- **CLI Execution**: `npm run aoc -- run 2025 3 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and stride-bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: parses newline-delimited `BatteryBank` rows via `parseBatteryBanks`, solves `k = 2` (`PART1_SELECTION_COUNT`) per bank using `BatteryBank.selectMaxJoltage`, and sums `bigint` joltages. `trace()` emits step `0` plus stride-sampled frames capped at `DEFAULT_MAX_TRACE_STEPS` (`250`), always retaining the exact final frame.
- `viz/BatteryRackVisualizer.tsx`: light-mode UI displaying bank/selection/cumulative metadata badges, a responsive CSS grid highlighting `#1`/`#2` selected cells with `var(--accent)`, and `<PlaybackControls>`.
