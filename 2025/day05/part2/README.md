# `2025/day05/part2` — Cafeteria (Part 2)

## Consumer Guide
Pure solver and interactive sorted interval-coalescing visualizer for Advent of Code 2025 Day 5 Part 2.

- **CLI Execution**: `npm run aoc -- run 2025 5 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve` (`bigint`), and coalescing-step `trace`.

## Maintainer Guide
- `domain/solver.ts`: reuses `parseDatabase` from `../../shared` and `IntervalUnion.totalLength` from `../../../../shared/core` to compute exact `bigint` union coverage while ignoring Section 2 available IDs. `trace()` sorts a copy of `db.freshRanges` by `(start asc, end asc)`, classifies each step (`new`, `touch`, `absorbed`, `extend`), freezes `mergedIntervals` per emitted snapshot, and stride-samples up to `DEFAULT_MAX_TRACE_STEPS` (`200`) while guaranteeing the final frame.
- `viz/IntervalCoalesceVisualizer.tsx`: renders a two-lane `640x108` light-mode SVG (top incoming sorted band + dashed drop connector, bottom coalesced bands with `3px` minimum width and BigInt-safe projection), live KPI badges (`Union IDs`, `Overlap Eliminated`, `Bands`), and `<PlaybackControls>`.
