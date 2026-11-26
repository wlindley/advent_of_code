# `2020/day02/part1` — Password Philosophy (Part 1)

## Consumer Guide
Pure solver and interactive character-audit visualization for Advent of Code 2020 Day 2 Part 1.

- **CLI Execution**: `npm run aoc -- run 2020 2 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: thin adapter over `2020/day02/shared` wired to `SLED_RENTAL_POLICY`.
- `viz/PasswordPhilosophyPart1Visualizer.tsx`: delegates to `PasswordAuditVisualizer` with `SLED_RENTAL_POLICY`, rendering character strips, cumulative valid/invalid progress, and `<PlaybackControls>`.
