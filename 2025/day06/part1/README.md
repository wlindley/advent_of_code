# `2025/day06/part1` — Trash Compactor (Part 1)

## Consumer Guide
Pure solver and interactive worksheet-tape visualizer for Advent of Code 2025 Day 6 Part 1.

- **CLI Execution**: `npm run aoc -- run 2025 6 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and problem-stepping `trace`.

## Maintainer Guide
- `domain/solver.ts`: extracts horizontal `bigint` operands per `ProblemBlock` (skipping all-space rows and rejecting split digits within a row), evaluates `+` or `*` via `block.evaluate(...)`, and accumulates the grand total. `trace()` emits step `0` plus stride-sampled evaluation frames capped at `DEFAULT_MAX_TRACE_STEPS` (`200`), always retaining the final frame.
- `viz/WorksheetTapeVisualizer.tsx`: renders a 7-block sliding monospace tape centered on the active `ProblemBlock` with `whiteSpace: 'pre'` alignment, active/completed/pending borders, live expression readout, and `<PlaybackControls>`.
