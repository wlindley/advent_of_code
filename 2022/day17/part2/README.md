# 2022 Day 17 Part 2 — Pyroclastic Flow

## Consumer Guide
- **Domain entry**: `./domain/index.ts` exports `solver` and `PART2_ROCK_COUNT = 1_000_000_000_000n`.
- **Site manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` wired to `PyroclasticPart2Visualizer` and the official 40-jet example (`1514285714288`).
- **CLI execution**: `solver` in `./domain/solver.ts` implements `PuzzleSolver<JetPattern, bigint, PyroclasticTraceFrame>`.

## Maintainer Notes
- **Algorithm**: `solver.solve` delegates to `simulateTower(jets, 1_000_000_000_000n)` in `../shared/simulate.ts`, detecting repeating `(nextRockIndex, nextJetIndex, reachableProfile)` states and fast-forwarding remaining whole cycles with `bigint` arithmetic.
- **Trace**: `solver.trace` delegates to `traceTower(jets, 1_000_000_000_000n, options)` capped at `DEFAULT_TRACE_MAX_STEPS` (`120`).
- **Visualization**: `PyroclasticPart2Visualizer.tsx` delegates to `../shared/viz/PyroclasticVisualizer.tsx`, rendering KPI badges, `ChamberCanvas`, legend, and `PlaybackControls`.
