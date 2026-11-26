# 2022 Day 18 Part 2 — Boiling Boulders

## Consumer Guide
- **Domain entry**: `./domain/index.ts` exports `solver` (`PuzzleSolver<VoxelDroplet, number, DropletTraceFrame>`).
- **Site manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` wired to `DropletPart2Visualizer` and the official 13-cube example (`58`).
- **CLI execution**: `npm run aoc -- run 2022 18 2` executes `solver` exported from `./domain/solver.ts`.

## Maintainer Notes
- **Algorithm**: `solver.solve` computes `ExteriorFlood.compute(droplet).exteriorSurfaceArea`, running a 6-connected BFS from padded local index `0` to classify exterior air vs. sealed interior cavities and counting lava faces adjacent to exterior air.
- **Trace**: `solver.trace` delegates to `traceExteriorSurface(droplet, options)` from `../shared/trace.ts`, bounded by `DEFAULT_TRACE_MAX_STEPS` (`60`) and reporting trapped air counts/faces per slice.
- **Visualization**: `DropletPart2Visualizer.tsx` delegates to `../shared/viz/DropletVisualizer.tsx`, rendering KPI badges (including trapped pocket metrics), an interactive 90°-rotatable isometric 3D canvas, a 2D XY slice canvas, a color legend, and `PlaybackControls` directly inside `<div className="stack">`.
