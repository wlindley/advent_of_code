# `2025/day05/part1` — Cafeteria (Part 1)

## Consumer Guide
Pure solver and interactive interval-union binary-search probe visualizer for Advent of Code 2025 Day 5 Part 1.

- **CLI Execution**: `npm run aoc -- run 2025 5 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and query-probing `trace`.

## Maintainer Guide
- `domain/solver.ts`: builds a normalized `IntervalUnion` from `db.freshRanges` and probes every ID in `db.availableIds` without deduplicating queries. `trace()` emits step `0` plus stride-sampled probe frames capped at `DEFAULT_MAX_TRACE_STEPS` (`200`), sharing the single `union.intervals` reference across frames and retaining the exact final frame.
- `viz/IntervalProbeVisualizer.tsx`: projects `bigint` intervals onto a `640x84` SVG axis with a `3px` minimum band width, highlights matched intervals in `var(--ok)`, draws active fresh/spoiled probe pins, and integrates `<PlaybackControls>`.
