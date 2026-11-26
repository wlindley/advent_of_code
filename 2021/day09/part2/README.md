# 2021 Day 9 Part 2 — Smoke Basin

## Consumer Guide

- **Domain entrypoint**: `solver` in `2021/day09/part2/domain` (`SmokeBasinSolver` bound to `LARGEST_BASINS_PRODUCT_POLICY`).
- **Manifest**: `manifest` in `2021/day09/part2` exposing `meta`, `exampleInput`, `exampleAnswer` (`'1134'`), `solver`, and `Visualizer`.
- **Example**: The 5x10 reference heightmap has 4 basins of sizes `3, 9, 14, 9`; the three largest multiply to `1134`.

## Maintainer Guide

- `part2/domain/solver.ts` instantiates `new SmokeBasinSolver(LARGEST_BASINS_PRODUCT_POLICY)` with zero duplicated domain logic.
- `part2/viz/Part2Visualizer.tsx` delegates rendering and wave-flood playback directly to `SmokeBasinVisualizer` with the Part 2 solver.
- Pure domain modules under `2021/day09/` maintain 100% V8 statement, branch, function, and line coverage with zero UI imports.
