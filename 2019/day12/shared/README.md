# 2019 Day 12 Shared N-Body Simulation & Visualization

## Consumer Documentation

Pure TypeScript N-body simulation, cycle analysis, and trace/visualization modules for AoC 2019 Day 12 (*The N-Body Problem*).

### Public API (`2019/day12/shared/index.ts`)
- **Models (`models.ts`)**: `Vec3`, `MoonState`, `MoonSystem.parse(raw)`, `AXES`, `MAX_ABS_COORDINATE`, `MAX_MOONS`.
- **Simulation (`simulation.ts`)**: `stepAxisInPlace`, `simulateSteps`, `findAxisPeriod`, `analyzeSystemCycles`, `AxisPeriodResult`, `CycleAnalysis`.
- **Tracing (`trace.ts`)**: `buildOrbitStepTrace`, `buildAxisCycleTrace`, `NBodyTraceFrame`, `DEFAULT_MAX_TRACE_FRAMES`.
- **Policies & Solver (`policies.ts`, `solver.ts`)**: `NBodySolver`, `TOTAL_ENERGY_1000_POLICY`, `FIRST_REPEAT_PERIOD_POLICY`, `createTotalEnergyPolicy`, `createFirstRepeatPeriodPolicy`.
- **Layout (`vizLayout.ts`)**: `computeOrbitBounds`, `projectIsometric`, `projectPlane`, `computeEnergyBarRatio`, `computeAxisPhaseProgress`, `formatMoonLabel`.
- **Shared React UI (`viz/`)**: `OrbitVisualizer`, `OrbitCanvasSvg`, `OrbitTelemetryPanel`.

## Maintainer Documentation

- **Strict Axis Independence**: Because pairwise gravity on each axis depends only on that axis's coordinates, X, Y, and Z evolve in separate `Int32Array` buffers without cross-axis coupling.
- **Immutability & Typed Arrays**: Domain value objects (`Vec3`, `MoonState`, `MoonSystem`, `AxisPeriodResult`, `CycleAnalysis`) are frozen; transient `Int32Array` simulation buffers remain mutable and strictly internal to simulation/trace loops.
- **Bounded Visualization**: `buildOrbitStepTrace` and `buildAxisCycleTrace` sample at most `DEFAULT_MAX_TRACE_FRAMES` (`240`) frames and cap per-moon trails at `MAX_TRAIL_LENGTH` (`24`).
