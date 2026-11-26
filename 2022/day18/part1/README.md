# 2022 Day 18 Part 1 — Boiling Boulders

## Consumer Guide
- **Domain entry**: `./domain/index.ts` exports `solver` (`PuzzleSolver<VoxelDroplet, number, DropletTraceFrame>`).
- **Site manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` wired to `DropletPart1Visualizer` and the official 13-cube example (`64`).
- **CLI execution**: `npm run aoc -- run 2022 18 1` executes `solver` exported from `./domain/solver.ts`.

## Maintainer Notes
- **Algorithm**: `solver.solve` returns `droplet.totalSurfaceArea`, which sums empty 6-connected neighbor faces around every deduplicated lava voxel inside a 1-voxel-padded `Uint8Array` grid.
- **Trace**: `solver.trace` delegates to `traceTotalSurface(droplet, options)` from `../shared/trace.ts`, bounded by `DEFAULT_TRACE_MAX_STEPS` (`60`).
- **Visualization**: `DropletPart1Visualizer.tsx` delegates to `../shared/viz/DropletVisualizer.tsx`, rendering KPI badges, an interactive 90°-rotatable isometric 3D canvas, a 2D XY slice canvas, a color legend, and `PlaybackControls` directly inside `<div className="stack">`.
