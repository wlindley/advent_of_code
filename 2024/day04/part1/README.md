# `2024/day04/part1` — Ceres Search (Part 1)

## Consumer Guide
Pure solver and interactive 8-direction word-search visualizer for Advent of Code 2024 Day 4 Part 1.

- **CLI Execution**: `npm run aoc -- run 2024 4 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/match.ts`: defines the immutable `WordMatch` value object with validated coordinates, unit 8-way delta, and dynamic `endRow`/`endCol`/`cells` getters.
- `domain/solver.ts`: scans `WordSearchGrid` row-major, gates on `'X'` before checking `DIRS_8` via `matchesAt`, and emits uniformly sampled `WordSearchTraceFrame` snapshots capped at `DEFAULT_MAX_TRACE_STEPS` (`200`).
- `viz/WordSearchVisualizer.tsx`: uses `usePlayback`, `<PlaybackControls>`, and `renderWordSearchCanvas` to animate discovered rays in emerald and the active ray in gold with HiDPI scaling.
