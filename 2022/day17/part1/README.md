# 2022 Day 17 Part 1 — Pyroclastic Flow

## Consumer Guide
- **Domain entry**: `./domain/index.ts` exports `solver` and `PART1_ROCK_COUNT = 2022n`.
- **Site manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` wired to `PyroclasticPart1Visualizer` and the official 40-jet example (`3068`).
- **CLI execution**: `solver` in `./domain/solver.ts` implements `PuzzleSolver<JetPattern, bigint, PyroclasticTraceFrame>`.

## Maintainer Notes
- **Algorithm**: `solver.solve` delegates to `simulateTower(jets, 2022n)` in `../shared/simulate.ts`, using 7-bit row masks and cycle detection over `(nextRockIndex, nextJetIndex, reachableProfile)`.
- **Trace**: `solver.trace` delegates to `traceTower(jets, 2022n, options)` capped at `DEFAULT_TRACE_MAX_STEPS` (`120`).
- **Visualization**: `PyroclasticPart1Visualizer.tsx` delegates to `../shared/viz/PyroclasticVisualizer.tsx`, which renders KPI badges, `ChamberCanvas`, legend, and `PlaybackControls` directly inside `<div className="stack">`.
