# `2019/day01/shared` — Rocket Equation Fuel Domain & Visualization Primitives

## Consumer Guide
Pure TypeScript domain primitives and shared SVG visualizer components for AoC 2019 Day 1 Parts 1 and 2.

- `index.ts`: pure TS barrel exporting `SINGLE_STAGE_FUEL_POLICY`, `RECURSIVE_FUEL_POLICY`, `ModuleManifest`, `parseModuleMasses`, `FuelTraceFrame`, `createFuelSolver`, and SVG layout helpers (`computeGaugeRatio`, `computeModuleWindow`, `computeStageSegments`). Contains zero React/DOM imports.
- `viz/RocketFuelVisualizer.tsx` & `viz/FuelCascadeSvg.tsx`: shared light-mode interactive step visualizer parameterized by `FuelPolicy` and `PuzzleSolver`.

## Maintainer Guide
- `fuelPolicy.ts`: defines the `FuelPolicy` strategy interface (`SingleStageFuelPolicy`, `RecursiveFuelPolicy`) and `assertValidMass` / `computeStepFuel` boundary checks.
- `moduleManifest.ts`: immutable `ModuleManifest` value object with dynamic `count`, `totalMass`, and `maxMass` getters (no stored derived state).
- `fuelCalculator.ts`: `FuelTraceFrame` value object, full-stream cumulative trace sampling (`DEFAULT_MAX_TRACE_STEPS = 120`), and `createFuelSolver(policy)`.
- `vizLayout.ts`: pure SVG geometry helpers for cumulative gauges, bounded module windows, and proportional stage cascade bars.
