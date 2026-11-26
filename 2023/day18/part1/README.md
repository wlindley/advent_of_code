# AoC 2023 Day 18 Part 1 — Lavaduct Lagoon

## Consumer Guide

- **Domain entrypoint**: `2023/day18/part1/domain` exports `solver` (`PuzzleSolver<LagoonPolygon, bigint, LagoonTraceFrame>`).
- **Web manifest**: `2023/day18/part1/index.ts` exports `manifest` for auto-discovery by `site/registry.ts`.
- **Visualizer**: `LagoonPart1Visualizer` renders telemetry badges (steps, bounds, running `B` and `2A`, final `I` and volume), an SVG projection with RGB trench edges and signed Shoelace triangle fan, legend, and `PlaybackControls`.

## Maintainer Architecture

- `domain/solver.ts`: Wires `createLagoonSolver(DIRECT_DIG_PLAN_DECODER)` to parse `<dir> <dist> (#<hex>)` lines directly into `LagoonPolygon` and return `polygon.totalVolume`.
- `viz/LagoonPart1Visualizer.tsx`: Thin Part 1 wrapper around `2023/day18/shared/viz/LagoonPolygonVisualizer.tsx`, sampling up to `DEFAULT_MAX_TRACE_STEPS` (`120`) frames.
- `domain/solver.test.ts`: Verifies the official 14-step example (`62n`) via `executeSolver` with a deterministic fake `Clock` and validates sampled trace endpoints.
