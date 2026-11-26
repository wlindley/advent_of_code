# 2021 Day 7 Part 1 — The Treachery of Whales

## Consumer Guide

- **Domain entrypoint**: `solver` in `2021/day07/part1/domain` (`CrabAlignmentSolver` bound to `LINEAR_FUEL_MODEL`).
- **Manifest**: `manifest` in `2021/day07/part1` exposing `meta`, `exampleInput`, `exampleAnswer`, `solver`, and `Visualizer`.
- **Example**: `'16,1,2,0,4,2,7,1,2,14'` evaluates to `37n` at target `2n`.

## Maintainer Guide

- `part1/domain/solver.ts` instantiates `new CrabAlignmentSolver(LINEAR_FUEL_MODEL)` with zero duplicated search logic.
- `part1/viz/Part1Visualizer.tsx` delegates rendering and playback directly to `CrabAlignmentVisualizer` with the Part 1 solver.
- Pure domain modules maintain 100% V8 test coverage and zero UI imports.
