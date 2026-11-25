# `2025/day01/part1` — Secret Entrance (Part 1)

## Consumer Guide
Pure solver and interactive dial visualization for Advent of Code 2025 Day 1 Part 1.

- **CLI Execution**: `npm run aoc -- run 2025 1 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: pure TypeScript fold over `Rotation[]` starting at `INITIAL_DIAL_POSITION` (`50`), counting `position === 0`. `trace()` always simulates all rotations for exact `zeroCount` telemetry and samples frames to `maxSteps` (`250` default) so large inputs remain responsive in the UI.
- `viz/DialVisualizer.tsx`: light-mode SVG safe dial (`0–99`) showing tick marks, directional sweep arc, multi-turn indicator ring (`distance >= 100`), zero-hit highlighting, and `<PlaybackControls>`.
