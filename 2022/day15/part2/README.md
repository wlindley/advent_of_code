# 2022 Day 15 Part 2 — Beacon Exclusion Zone

## Consumer Guide
- **Domain entry**: `./domain/index.ts` exports `solver` (bound to `PART2_MAX_COORD = 4_000_000`), `createPart2Solver(maxCoord)`, `findDistressBeacon`, `collectCandidates`, `findUniqueUncoveredIndex`, `tuningFrequency`, `buildDistressTrace`, `DistressTraceFrame`, and `DEFAULT_MAX_TRACE_STEPS`.
- **Site manifest**: `./index.ts` exports `manifest: PuzzlePartManifest`, automatically routing the official example input to `[0, 20]^2` (`56000011`) and custom inputs to `[0, 4_000_000]^2`.
- **CLI execution**: `solver` in `./domain/solver.ts` implements `PuzzleSolver<readonly SensorReading[], bigint, DistressTraceFrame>` for `tools/aoc/cli.ts`.

## Maintainer Notes
- **Algorithm**: Each `SensorReading` exposes `outerDiagonals` (`x + y = s` and `x - y = d` at Manhattan distance `radius + 1`). `collectCandidates` deduplicates those lines in `bigint` sets, adds box corners, box-edge intersections, and all `(s, d)` intersections (including the 4 surrounding lattice points when `s + d` is odd), then sorts deterministically. `findUniqueUncoveredIndex` checks sensor coverage and enforces uniqueness (`=== 1`).
- **Trace invariants**: `buildDistressTrace` samples `candidates.length + 1` checkpoints bounded by `DEFAULT_MAX_TRACE_STEPS` (`120`), accumulating only sampled checkpoint candidates in `revealedCandidates` and locking `distressPoint` once `checkedCount > distressIdx`. `DistressTraceFrame` stores no derived properties (`activeCandidate`, `tuningFrequency`, `isComplete` are dynamic getters).
- **Visualization**: `DistressBeaconVisualizer.tsx` renders KPI badges, `SensorMapSvg.tsx` (with search box, candidates, active candidate, covering sensor, and distress point overlays), and `PlaybackControls` inside `<div className="stack">`.
