# 2021 Day 17 — Shared Trick Shot Domain

Pure TypeScript ballistic interval solver, prefix-sum phase-space analyzer, policy strategies, and bounded visualizer for Advent of Code 2021 Day 17 (*Trick Shot*).

## Consumer API (`shared/index.ts`)

- **Target (`target.ts`)**: `MAX_TARGET_COORD`, `TargetArea`, and `parseTargetArea(raw)` with positive-x / negative-y invariant validation.
- **Ballistics (`ballistics.ts`)**: `LaunchVelocity`, `ProbePoint`, `XStepInterval`, `YStepInterval`, `computeXStepInterval`, `computeYStepInterval`, and `simulateTrajectory`.
- **Analyzer (`analyzer.ts`)**: `TrickShotAnalysis` and `analyzeTargetArea(target)` using `Int32Array` step-window prefix sums (`countMatchingVx`, `bestVyInterval`, `maxApexY`, `validVelocityCount`).
- **Policy (`policy.ts`)**: `TrickShotPolicy`, `MAX_APEX_POLICY` (Part 1), and `VALID_VELOCITY_COUNT_POLICY` (Part 2).
- **Trace (`trace.ts`)**: `DEFAULT_MAX_TRACE_STEPS`, `MAX_ARC_POINTS`, `MAX_PHASE_BANDS`, `PhaseBand`, `TrickShotTraceSnapshot`, `TrickShotTraceFrame`, and `traceTrickShot`.
- **Solver (`solver.ts`)**: `TrickShotSolver` parameterized by `TrickShotPolicy`.

## Maintainer Architecture

- **Dependency DAG**: `target` → `ballistics` → `analyzer` → `policy` → `trace` → `solver` → `index.ts` (zero `viz/` imports).
- **Prefix-Sum Intersection**: Counts overlapping `vx` step intervals for any `y` step window `[firstStep, lastStep]` in O(1) via `#xLoPrefix[lastStep] - #xHiPrefix[firstStep - 1]`.
- **Immutability**: Value objects call `Object.freeze(this)`; `Int32Array` buffers remain encapsulated and unfrozen.
- **Shared Visualization (`shared/viz/`)**: `TrickShotVisualizer`, `TrickShotTelemetry`, `BallisticArcSvg` (<= 240 arc points), and `VelocityPhaseSpaceSvg` (<= 96 `vy` bands) using light-mode CSS tokens.
