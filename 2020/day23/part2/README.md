# 2020 Day 23 Part 2 — Crab Cups

## User Overview
Extends the initial cup arrangement sequentially up to cup `1,000,000` and simulates `10,000,000` clockwise pick-up-and-splice moves. The answer multiplies the two cup labels immediately clockwise of cup `1` as a `bigint`.

## Developer Notes
- **Domain Entry (`domain/solver.ts`)**: Binds `CrabCupsSolver` to `MILLION_CUPS_POLICY` and re-exports `solver` via `domain/index.ts`.
- **Visualizer (`viz/CrabCupsPart2Visualizer.tsx`)**: Thin wrapper passing `solver` to `CrabCupsVisualizer`, which renders bounded 12-cup local-window ribbon frames (`isFullRing === false`).
- **Manifest (`index.ts`)**: Exports `manifest` (`PuzzlePartManifest`) with `exampleInput: '389125467'` and `exampleAnswer: '149245887792'`.
