# 2021 Day 7 Part 2 — The Treachery of Whales

## Consumer Guide

- **Domain entrypoint**: `solver` in `2021/day07/part2/domain` (`CrabAlignmentSolver` bound to `TRIANGULAR_FUEL_MODEL`).
- **Manifest**: `manifest` in `2021/day07/part2` exposing `meta`, `exampleInput`, `exampleAnswer`, `solver`, and `Visualizer`.
- **Example**: `'16,1,2,0,4,2,7,1,2,14'` evaluates to `168n` at target `5n`.

## Maintainer Guide

- `part2/domain/solver.ts` instantiates `new CrabAlignmentSolver(TRIANGULAR_FUEL_MODEL)` with zero duplicated search logic.
- `part2/viz/Part2Visualizer.tsx` delegates rendering and playback directly to `CrabAlignmentVisualizer` with the Part 2 solver.
- Pure domain modules maintain 100% V8 test coverage and zero UI imports.
