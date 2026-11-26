# `2019/day02/part1` — 1202 Program Alarm (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive memory-tape visualizer for Advent of Code 2019 Day 2 Part 1.

- **CLI Execution**: `npm run aoc -- run 2019 2 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`, auto-discovered by `site/registry.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `ALARM_1202_INPUTS` (`noun = 12n`, `verb = 2n`) to `createAlarmSolver` from `../shared`.
- `viz/Visualizer.tsx`: delegates rendering to `<IntcodeTapeVisualizer>` with `ALARM_1202_INPUTS` and `<PlaybackControls>`.
