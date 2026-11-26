# AoC 2023 Day 17 Part 2 — Clumsy Crucible (Ultra Crucible)

## Consumer Guide

- **Domain entrypoint**: `2023/day17/part2/domain` exports `solver` (`PuzzleSolver<HeatMap, number, CrucibleTraceFrame>`).
- **Web manifest**: `2023/day17/part2/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `CruciblePart2Visualizer` configures the shared `CrucibleVisualizer` with `ULTRA_CRUCIBLE_RULE` (`4..10` blocks) and renders telemetry badges, a HiDPI thermal grid canvas, legend, and `PlaybackControls`.

## Maintainer Architecture

- `domain/solver.ts`: Delegates parsing to `parseHeatMap`, solving to `CrucibleRouter(ULTRA_CRUCIBLE_RULE).search(map).goalHeat`, and wavefront sampling to `CrucibleRouter.trace(map, options)`.
- `viz/CruciblePart2Visualizer.tsx`: Thin Part 2 wrapper around `2023/day17/shared/viz/CrucibleVisualizer.tsx`, sampling up to `DEFAULT_MAX_TRACE_STEPS` (`120`) frames so large grids stay responsive.
- `domain/solver.test.ts`: Verifies the official `13x13` (`94`) and `5x12` (`71`) examples via `executeSolver` with a deterministic fake `Clock`, validates bounded/default traces, unreachable grids (`2x2`, `1x4`, `2x6`, `1x12`), and invalid inputs.
- `domain/solver.oracle.test.ts`: Differential oracle comparing `solver.solve` against an independent 4D `(r, c, dir, run)` 1-step binary-heap Dijkstra across official, boundary, unreachable, and 20 seeded random grids.
