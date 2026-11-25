# `2025/day03/part2` — Lobby (Part 2)

## Consumer Guide
Pure solver and interactive 12-slot joltage register visualizer for Advent of Code 2025 Day 3 Part 2.

- **CLI Execution**: `npm run aoc -- run 2025 3 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and stride-bounded `trace` (`BankDropFrame`), plus `traceStackDrops(bank, count)` for per-cell `kept` / `evicted` / `truncated` breakdown.

## Maintainer Guide
- `domain/solver.ts`: reuses `BatteryBank`, `JoltageSelection`, and `parseBatteryBanks` from `../../shared` to pick `PART2_SELECTION_COUNT = 12` cells per bank using `bigint` arithmetic. `traceStackDrops` exposes `dropBudget`, `evictedCount`, and `truncatedCount` as computed readonly getters on a frozen object (no stored derived state). `trace()` caps frames at `DEFAULT_MAX_TRACE_STEPS` (`250`) while still validating and summing every skipped bank.
- `viz/JoltageRegisterVisualizer.tsx`: renders a 12-slot place-value register (`10^11`..`10^0` with `@cellIdx` provenance), a 3-state bank cell grid (`kept` `#1..#12`, `evicted` `pop`, `truncated` `trim`), drop-budget telemetry, and `<PlaybackControls>`.
