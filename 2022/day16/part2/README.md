# 2022 Day 16 Part 2 — Proboscidea Volcanium

## Consumer Guide
- **Domain entry**: `./domain/index.ts` exports `solver`, `PART2_TIME_LIMIT = 26`, `DualAgentPlan`, `findOptimalDualAgentPlan`, and `findOptimalDualAgentRoutes`.
- **Site manifest**: `./index.ts` exports `manifest: PuzzlePartManifest` wired to `DualAgentValveVisualizer` and the 10-valve example (`1707`).
- **CLI execution**: `solver` in `./domain/solver.ts` implements `PuzzleSolver<ValveNetwork, number, ValveTimelineFrame>`.

## Maintainer Notes
- **Algorithm**: `computeBestByMask(compressed, 26)` records the maximum single-agent pressure for every reachable subset mask; `findOptimalDualAgentPlan` builds Sum-over-Subsets (SOS) maximums across all `2^K` masks in `O(K * 2^K)` and pairs each mask with the best subset of its bitwise complement.
- **Canonicalization & Reconstruction**: `DualAgentPlan` enforces disjoint non-negative masks and dynamically derives `totalPressure` and `openedMask`. `findOptimalDualAgentRoutes` assigns the higher-scoring subset to `'You'` and reconstructs each agent's schedule via `findOptimalSchedule`.
- **Trace & Visualization**: `solver.trace` delegates to `buildValveTimeline(compressed, routes, 26, options)` bounded by `DEFAULT_MAX_TRACE_STEPS` (`64`). `DualAgentValveVisualizer.tsx` renders KPI badges, `ValveNetworkSvg`, legend, and `PlaybackControls` directly inside `<div className="stack">`.
