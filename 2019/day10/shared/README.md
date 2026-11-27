# `2019/day10/shared` — Monitoring Station Shared Kernel & Visualizer

## Consumer Guide
Pure TypeScript geometry, asteroid-field parsing, visibility analysis, clockwise vaporization scheduler, bounded trace builders, and shared React SVG visualizers for Advent of Code 2019 Day 10.

- `index.ts`: pure TS barrel exporting `AsteroidPoint`, `AsteroidMap`, ray helpers (`gcdInt`, `reduceRay`, `rayHalfPlane`, `compareRaysClockwise`), `analyzeVisibility`, `findVisibleTargets`, `computeVaporizationSchedule`, policies (`BEST_MONITOR_POLICY`, `VAPORIZATION_200TH_POLICY`), `MonitoringStationSolver`, trace frames, and `vizLayout` helpers (zero `viz/` imports).
- `viz/`: React `.tsx` components (`AsteroidFieldSvg`, `MonitoringStationVisualizer`) parameterized by `solver`.

## Maintainer Guide
- **Row-Major Half-Ray Stamp**: `computeVisibilityCounts` exploits strictly ascending `(y, x)` asteroid order so `i < j` always points into the forward half-plane (`ry > 0` or `(rx = 1, ry = 0)`), counting both endpoints once per distinct ray stamp in `Uint32Array`.
- **Exact Integer Polar Sweep**: `compareRaysClockwise` splits rays into `[12 o'clock, 6 o'clock)` (`0`) and `[6 o'clock, 12 o'clock)` (`1`), breaking within-half-plane ties with exact integer cross-product signs (`a.ry * b.rx - a.rx * b.ry`).
- **Immutability & Derived State**: Domain objects are frozen with derived values (`coordinateCode`, `asteroidCount`, `bestStation`, `bestDetectedCount`, `detectedCount`, `isNewBest`, `activeEvent`, etc.) computed via getters.
