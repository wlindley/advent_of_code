# 2022 Day 15 Shared Domain & SVG Primitives

## Consumer Guide
Pure TypeScript barrel (`./index.ts`) exports:
- `SensorReading`, `OuterDiagonals`, `assertSafeInteger`, `parseSensorReadings`: immutable, safe-integer-validated sensor/beacon geometry using exact `bigint` Manhattan distances, horizontal row slices (`rowSlice`), point coverage (`covers`), and outer boundary diagonals (`outerDiagonals`).
- `mergedRowCoverage`, `distinctBeaconXsOnRow`, `countExcludedOnRow`: interval-union sweep along `y = targetY` using `IntervalUnion` from `../../../shared/core`.

Shared SVG component (`./viz/SensorMapSvg.tsx`, imported directly by part visualizers):
- `SensorMapSvg`: fixed-pixel (`720 × 440`) isotropic SVG map rendering Manhattan sensor diamonds, scanline `y`, merged exclusion intervals, sensor/beacon pins, and optional distress-beacon search box / candidate overlays.

## Maintainer Notes
- `2022/day15/shared/index.ts` is 100% pure TypeScript with zero React/DOM/`viz` imports so pure domain and CLI layers remain decoupled from UI code.
- All distance, interval, and diagonal computations use `bigint` to prevent IEEE-754 precision loss on large coordinates.
- No stored derived state: `radius` and `outerDiagonals` are computed dynamically via getters.
