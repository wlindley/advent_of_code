# Day 20 Shared Domain & Visualization

## User / Consumer Overview
Shared pure-TypeScript engine and interactive visualizer for AoC 2024 Day 20 (*Race Condition*). Parameterized by `CheatConfig(maxDuration, minSaving)` so Part 1 (`K = 2`) and Part 2 (`K = 20`) share the exact same distance-field, diamond-search, trace, and visualization pipeline.

### Public Exports (`./index.ts`)
- `CheatConfig`, `PART1_DEFAULT_CONFIG`, `PART1_EXAMPLE_CONFIG`, `PART2_DEFAULT_CONFIG`, `PART2_EXAMPLE_CONFIG`
- `GridPoint`, `Cheat`, `Racetrack`, `UNREACHABLE`, `parseRacetrack`
- `DistanceField`, `computeBfsDistances`
- `SavingBucket`, `CheatSummary`, `analyzeCheats`
- `RaceConditionSnapshot`, `RaceConditionPhase`, `DEFAULT_MAX_TRACE_STEPS`, `buildCheatTrace`, `createRaceConditionSolver`

### UI Components (`./viz/`)
- `RacetrackCanvas`: HiDPI canvas showing walls, start-distance heatmap, `S`/`E`, active Manhattan diamond of radius `maxDuration`, and cheat vector `start -> end`.
- `SavingHistogram`: SVG bar chart revealing saving buckets progressively up to `revealedBucketCount`.
- `RaceConditionVisualizer`: Complete HUD, canvas, histogram, legend, and playback controls.

## Developer / Maintainer Architecture
- **Strict one-way DAG**: `model.ts` -> `parser.ts` / `bfs.ts` -> `cheats.ts` -> `snapshot.ts` -> `index.ts` -> `viz/*` (zero `viz/` imports in `index.ts`).
- **Dual BFS**: `computeBfsDistances` runs flat `Int32Array` 4-neighbor BFS from both `S` and `E`, producing `distFromStart`, `distFromEnd`, and non-decreasing `reachableOrder`.
- **Single-pass diamond scan**: `analyzeCheats` iterates `reachableOrder` while `distFromStart[u] <= baseline - minSaving - 2` (guaranteed termination before `E`) and scans clamped `|dr| + |dc| <= maxDuration` cells with `d >= 2`.
- **Trace bounding**: `buildCheatTrace` caps frames at `DEFAULT_MAX_TRACE_STEPS` (`80`) via `sampleTraceIndices`.
