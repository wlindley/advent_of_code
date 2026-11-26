# `2020/day01/part2` — Report Repair (Part 2)

## Consumer Guide
Pure solver and interactive three-entry two-pointer visualization for Advent of Code 2020 Day 1 Part 2.

- **CLI Execution**: `npm run aoc -- run 2020 1 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: thin adapter over `2020/day01/shared` configured with `PART2_TUPLE_SIZE = 3` and `TARGET_EXPENSE_SUM = 2020`, throwing `RangeError` if no matching triple exists.
- `viz/ExpenseRepairPart2Visualizer.tsx`: delegates to `ExpenseRepairVisualizer` with `tupleSize={3}`, rendering the sorted expense spectrum with anchor highlight, sum-delta gauge, and `<PlaybackControls>`.
