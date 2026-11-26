# `2020/day01/part1` — Report Repair (Part 1)

## Consumer Guide
Pure solver and interactive two-pointer visualization for Advent of Code 2020 Day 1 Part 1.

- **CLI Execution**: `npm run aoc -- run 2020 1 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: thin adapter over `2020/day01/shared` configured with `PART1_TUPLE_SIZE = 2` and `TARGET_EXPENSE_SUM = 2020`, throwing `RangeError` if no matching pair exists.
- `viz/ExpenseRepairPart1Visualizer.tsx`: delegates to `ExpenseRepairVisualizer` with `tupleSize={2}`, rendering the sorted expense spectrum, sum-delta gauge, and `<PlaybackControls>`.
