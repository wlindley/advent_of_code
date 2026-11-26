# 2021 Day 9 Part 1 — Smoke Basin

## Consumer Guide

- **Domain entrypoint**: `solver` in `2021/day09/part1/domain` (`SmokeBasinSolver` bound to `LOW_POINT_RISK_POLICY`).
- **Manifest**: `manifest` in `2021/day09/part1` exposing `meta`, `exampleInput`, `exampleAnswer` (`'15'`), `solver`, and `Visualizer`.
- **Example**: The 5x10 reference heightmap has 4 strict low points (`1, 0, 5, 5`), yielding total risk level `15`.

## Maintainer Guide

- `part1/domain/solver.ts` instantiates `new SmokeBasinSolver(LOW_POINT_RISK_POLICY)` with zero duplicated domain logic.
- `part1/viz/Part1Visualizer.tsx` delegates rendering and playback directly to `SmokeBasinVisualizer` with the Part 1 solver.
- Pure domain modules under `2021/day09/` maintain 100% V8 statement, branch, function, and line coverage with zero UI imports.
