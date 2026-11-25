# `2025/day01/part2` — Secret Entrance (Part 2: CLICK Method)

## Consumer Guide
Pure solver and interactive click-method dial visualization for Advent of Code 2025 Day 1 Part 2.

- **CLI Execution**: `npm run aoc -- run 2025 1 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: pure TypeScript fold over `Rotation[]` starting at `INITIAL_DIAL_POSITION` (`50`), summing `rotation.countZeroHitsFrom(position)` per rotation in O(1) arithmetic. `DialClickTraceFrame` stores only minimal immutable state (`step`, `rotation`, `fromPosition`, `totalZeroHits`) and derives `toPosition`, `stepZeroHits`, `landedOnZero`, `midRotationHits`, and `fullTurns` via getters. `trace()` samples frames to `maxSteps` (`250` default).
- `viz/ClickDialVisualizer.tsx`: light-mode `280x280` SVG safe dial (`0–99`) rendering an Archimedean spiral sweep (capped at 4 visual turns), a 12-o'clock Zero Gate bar with crossing spark dots and `+N` hit badge, needle readout, click-hit telemetry, and `<PlaybackControls>`.
