# 2020 Day 23 Part 1 — Crab Cups

## User Overview
Simulates 100 moves of Crab Cups on the initial cup circle: each move picks up the 3 cups immediately clockwise of the current cup, selects a destination cup (`current - 1` wrapping around `maxCup` while skipping the 3 picked-up cups), re-inserts the 3 cups immediately clockwise of the destination, and advances the current cup clockwise. The answer concatenates all labels clockwise after cup `1`.

## Developer Notes
- **Domain Entry (`domain/solver.ts`)**: Binds `CrabCupsSolver` to `STANDARD_CUPS_POLICY` and re-exports `solver` via `domain/index.ts`.
- **Visualizer (`viz/CrabCupsPart1Visualizer.tsx`)**: Thin wrapper passing `solver` to `CrabCupsVisualizer`.
- **Manifest (`index.ts`)**: Exports `manifest` (`PuzzlePartManifest`) with the 9-cup official example (`exampleInput: '389125467'`, `exampleAnswer: '67384529'`).
