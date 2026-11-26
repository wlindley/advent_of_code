# AoC 2023 Day 17 Part 1 — Clumsy Crucible

## Consumer Guide

- **Domain entrypoint**: `2023/day17/part1/domain` exports `solver` (`PuzzleSolver<HeatMap, number, CrucibleTraceFrame>`).
- **Web manifest**: `2023/day17/part1/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `CruciblePart1Visualizer` configures the shared `CrucibleVisualizer` with `CLUMSY_CRUCIBLE_RULE` (`[1, 3]`) and renders telemetry badges, a HiDPI thermal grid canvas, legend, and `PlaybackControls`.

## Maintainer Architecture

- `domain/solver.ts`: Delegates parsing to `parseHeatMap`, solving to `CrucibleRouter(CLUMSY_CRUCIBLE_RULE).search(map).goalHeat`, and wavefront sampling to `CrucibleRouter.trace(map, options)`.
- `viz/CruciblePart1Visualizer.tsx`: Thin Part 1 wrapper around `2023/day17/shared/viz/CrucibleVisualizer.tsx`, sampling up to `DEFAULT_MAX_TRACE_STEPS` (`120`) frames so large grids stay responsive.
- `domain/solver.test.ts`: Verifies the official `13x13` example (`102`) via `executeSolver` with a deterministic fake `Clock` and validates sampled trace endpoints.
