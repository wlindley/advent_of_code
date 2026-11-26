# 2021 Day 6 Part 1 — Lanternfish

## Consumer Guide

- **Domain entrypoint**: `solver` in `2021/day06/part1/domain` (`LanternfishSolver` configured for 80 days).
- **Manifest**: `manifest` in `2021/day06/part1` exposing `meta`, `exampleInput`, `exampleAnswer`, `solver`, and `Visualizer`.
- **Example**: `'3,4,3,1,2'` evaluates to `5934n`.

## Maintainer Guide

- `part1/domain/solver.ts` instantiates `new LanternfishSolver(PART1_DAYS)` with zero duplicated simulation logic.
- `part1/viz/Part1Visualizer.tsx` delegates rendering and playback directly to `LanternfishVisualizer` with the Part 1 solver.
- Pure domain modules maintain 100% test coverage and zero UI imports.
