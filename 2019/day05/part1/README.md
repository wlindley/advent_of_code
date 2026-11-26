# `2019/day05/part1` — Sunny with a Chance of Asteroids (Part 1)

## Consumer Guide
Pure TypeScript solver and interactive diagnostic debugger for Advent of Code 2019 Day 5 Part 1.

- **CLI Execution**: `npm run aoc -- run 2019 5 1` (or pass `--input <path>`).
- **Web Manifest**: `export const manifest: PuzzlePartManifest` in `index.ts`.
- **Domain Solver**: `export const solver` in `domain/solver.ts` implements `parse`, `solve`, and bounded `trace`.

## Maintainer Guide
- `domain/solver.ts`: binds `AIR_CONDITIONER_SYSTEM_ID` (`1n`) to `createDiagnosticSolver` from `../../shared`.
- `viz/Visualizer.tsx`: delegates rendering to `<DiagnosticVisualizer>` with `<PlaybackControls>`, decoded operand badges, I/O output stream badges, and bounded memory window.
