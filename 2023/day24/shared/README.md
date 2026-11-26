# AoC 2023 Day 24 Shared Domain & Visualization Modules

## Consumer Guide

- **`Vec3`, `Hailstone`, `TestArea`, `parseHailstones`** (`hailstone.ts`): Exact BigInt 3D vector primitives, input parsing (`px, py, pz @ vx, vy, vz`), and exact square XY test-area containment/normalization.
- **`classifyPair2D`, `summarizeIntersections2D`, `countFutureIntersections2D`** (`intersection2d.ts`): Exact BigInt Cramer's rule classification of 2D ray intersections (`inside`, `outside`, `past-a`, `past-b`, `past-both`, `parallel`).
- **`RationalLinearSystem`** (`linearSolver.ts`): Incremental Gauss-Jordan RREF solver over arbitrary-precision `Rational` numbers.
- **`solveRockTrajectory`, `RockTrajectory`** (`rockTrajectory.ts`): Linearizes `(P - p_i) x (V - v_i) = 0` relative to an anchor hailstone, solves the 6-unknown system exactly, and verifies integer non-negative collision times for every hailstone.
- **`buildHailTrace2D`, `clipRayToViewport`** (`hailTrace2d.ts`) & **`buildRockTrace`** (`rockTrace.ts`): Bounded trace builders sharing frozen geometry arrays across frames.
- **`HailVisualizer`** (`viz/HailVisualizer.tsx`): Interactive HiDPI canvas visualizer with `PlaybackControls`.

## Maintainer Architecture

Strict one-way module DAG:
1. `hailstone.ts` -> `shared/core` (zero external deps)
2. `intersection2d.ts` -> `hailstone.ts`
3. `linearSolver.ts` -> `shared/core` (`Rational`)
4. `rockTrajectory.ts` -> `hailstone.ts`, `linearSolver.ts`
5. `hailTrace2d.ts` -> `hailstone.ts`, `intersection2d.ts`, `shared/core`
6. `rockTrace.ts` -> `hailstone.ts`, `rockTrajectory.ts`, `shared/core`
7. `index.ts` -> pure TS barrel re-exporting modules 1-6 (zero `viz/` imports)
8. `viz/*.tsx` -> `index.ts` + `shared/viz` (presentation-only `.tsx` modules)

### Key Invariants
- All domain arithmetic uses exact `bigint` or `Rational` so large coordinates (e.g. `10^14`) never suffer IEEE-754 precision loss.
- Normalization to floating-point viewport coordinates happens **only** at the final boundary (`TestArea.normalizeRatio`), using fixed-point `1e-6` scaling.
- Derived properties (`span`, `totalPairs`, `rank`, `isFullRank`, `positionSum`) are computed via getters rather than stored.
