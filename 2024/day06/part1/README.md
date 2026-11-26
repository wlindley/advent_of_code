# `2024/day06/part1` — Guard Gallivant (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive Canvas 2D patrol visualizer for Advent of Code 2024 Day 6 Part 1.

- **CLI Execution**: `npm run aoc -- run 2024 6 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: `countVisitedPositions` runs `simulatePatrol` and rejects looping maps with `Error`; `tracePatrol` records uniformly sampled `GuardTraceFrame` snapshots capped at `DEFAULT_MAX_TRACE_STEPS` (`250`) via `sampleTraceIndices`.
- `viz/canvasRenderer.ts`: draws the HiDPI floorplan, emerald single/multi-visit heatmap (excluding in-place turns), patrol trail polyline, gold start ring, amber turn dots, and oriented blue guard chevron.
- `viz/GuardPatrolVisualizer.tsx`: uses `useMemo` error handling, `usePlayback`, and `<PlaybackControls>` for smooth bounded playback on both example and full puzzle inputs.
