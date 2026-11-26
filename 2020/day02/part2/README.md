# `2020/day02/part2` — Password Philosophy (Part 2)

## Consumer Guide
Pure solver and interactive positional-XOR audit visualization for Advent of Code 2020 Day 2 Part 2.

- **CLI Execution**: `npm run aoc -- run 2020 2 2` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: thin adapter over `2020/day02/shared` wired to `TOBOGGAN_POLICY`.
- `viz/PasswordPhilosophyPart2Visualizer.tsx`: delegates to `PasswordAuditVisualizer` with `TOBOGGAN_POLICY`, highlighting checked 1-based slots, XOR match/miss tiles, and `<PlaybackControls>`.
