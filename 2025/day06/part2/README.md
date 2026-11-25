# `2025/day06/part2` — Trash Compactor (Part 2)

## Consumer Guide
Pure solver and interactive right-to-left vertical worksheet visualizer for Advent of Code 2025 Day 6 Part 2.

- **CLI Execution**: `npm run aoc -- run 2025 6 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and right-to-left `trace`.

## Maintainer Guide
- `domain/solver.ts`: `extractVerticalColumns(block)` scans columns right-to-left (`block.width - 1` down to `0`) and rows top-to-bottom (`MSD` to `LSD`) using a 3-state machine (`before` / `inDigits` / `after`) to preserve `0n` columns, skip operator-only all-space columns, and reject interior vertical gaps. `trace()` evaluates blocks right-to-left (`problemIndex = n - step`), capped at `DEFAULT_MAX_TRACE_STEPS` (`200`) while always retaining the final `problemIndex: 0` frame.
- `viz/VerticalWorksheetVisualizer.tsx`: renders a right-to-left 7-block sliding worksheet tape paired with an `MSD ↓ LSD` vertical column decoder and `<PlaybackControls>`.
