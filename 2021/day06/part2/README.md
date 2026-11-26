# 2021 Day 6 Part 2 — Lanternfish

## Consumer Guide

- **Domain entrypoint**: `solver` in `2021/day06/part2/domain` (`LanternfishSolver` configured for 256 days).
- **Manifest**: `manifest` in `2021/day06/part2` exposing `meta`, `exampleInput`, `exampleAnswer`, `solver`, and `Visualizer`.
- **Example**: `'3,4,3,1,2'` evaluates to `26984457539n`.

## Maintainer Guide

- `part2/domain/solver.ts` instantiates `new LanternfishSolver(PART2_DAYS)` with zero duplicated simulation logic.
- `part2/viz/Part2Visualizer.tsx` delegates rendering and playback directly to `LanternfishVisualizer` with the Part 2 solver.
- Pure domain modules maintain 100% test coverage and zero UI imports.
