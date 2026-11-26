# `2024/day04/part2` — Ceres Search: X-MAS Crosses (Part 2)

## Consumer Guide
Pure solver and interactive X-MAS cross visualizer for Advent of Code 2024 Day 4 Part 2.

- **CLI Execution**: `npm run aoc -- run 2024 4 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/cross.ts`: defines the immutable `XMasCross` value object (3 stored fields: `centerRow`, `centerCol`, `orientation`) with dynamic corner/center/cell/diagonal getters backed by a total `Record<XMasOrientation, ...>` lookup table, plus `classifyXMasOrientation`.
- `domain/solver.ts`: scans interior `WordSearchGrid` cells row-major, gates on `'A'`, classifies corners into `XMasCross`, tallies `countByOrientation`, and emits uniformly sampled `XMasTraceFrame` snapshots capped at `DEFAULT_MAX_TRACE_STEPS` (`200`).
- `viz/XMasVisualizer.tsx`: uses `usePlayback`, `<PlaybackControls>`, a `Mask unused cells` toggle, orientation counts, and `renderXMasCanvas` to render orientation-colored crosses and gold active highlights with HiDPI scaling.
