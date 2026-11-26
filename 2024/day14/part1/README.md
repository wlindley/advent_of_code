# 2024 Day 14 Part 1 — Restroom Redoubt

## Consumer Guide

- **Manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` for automatic site registry discovery, selecting `EXAMPLE_REDOUBT_SPACE` (`11×7`) for the official example and `DEFAULT_REDOUBT_SPACE` (`101×103`) otherwise.
- **CLI / Domain Solver**: `./domain/solver.ts` exports `solver` (`PuzzleSolver<readonly Robot[], number, RedoubtSnapshot>`) using `DEFAULT_REDOUBT_SPACE` and `PART1_SECONDS = 100`.
- **Visualizer**: `./viz/RestroomRedoubtPart1Visualizer.tsx` animates `0..100s` occupancy frames with `RedoubtCanvas`, quadrant crosshairs, excluded midline counts, and live safety factor HUD badges.

## Maintainer Guide

- **Architecture**: `part1/domain/` validates `seconds` eagerly, delegates parsing/simulation/snapshots to `../../shared`, and caps playback traces via `sampleTraceIndices` (`DEFAULT_MAX_TRACE_STEPS = 101`).
- **Verification**: Unit tests cover `executeSolver`, endpoint-preserving trace sampling, and eager bounds validation; `solver.oracle.test.ts` cross-checks against an independent tick-by-tick `t = 1..T` grid simulation across the official `11×7` example (`12`), wrap trajectories, crosshair exclusions, stacked robots, `1×1` space, and 60 seeded random swarms.
