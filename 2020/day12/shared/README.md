# 2020 Day 12 — Rain Risk Shared Domain

## User / Consumer Guide

Pure TypeScript domain package modeling AoC 2020 Day 12 navigation under both ship-heading (Part 1) and waypoint-offset (Part 2) steering rules:

- **`model.ts`**: `Vec2` (BigInt 2D vector with `manhattanNorm`, `add`, `scale`, `rotateCw`), `NavigationInstruction` (validated action/value and `% 90n === 0n` turn invariant), `ShipState`, and `parseNavigationInstructions`.
- **`rules.ts`**: `NavigationRule` strategy, `HEADING_NAVIGATION_RULE`, `WAYPOINT_NAVIGATION_RULE`, `stepNavigation`, and `simulateNavigation`.
- **`trace.ts`**: `NavigationTraceFrame`, `DEFAULT_MAX_TRACE_STEPS`, and single-pass `traceNavigation` bounded via `sampleTraceIndices`.
- **`projection.ts`**: `ChartBounds`, `computeChartBounds`, BigInt fixed-point `projectPoint`, `projectVectorDirection`, and `formatCompassCoords`.
- **`solver.ts`**: `RainRiskSolver` implementing `PuzzleSolver<readonly NavigationInstruction[], bigint, NavigationTraceFrame>`.
- **`index.ts`**: Pure TypeScript barrel (zero `viz/` or DOM imports).

## Developer / Maintainer Guide

- **Invariants**: All coordinates and instruction magnitudes use `bigint` to prevent precision loss on arbitrarily large inputs. Derived values (`manhattanNorm`, `manhattanDistance`, `label`, `isFinal`, `eastSpan`, `northSpan`, `span`) are computed dynamically via getters.
- **Turn Arithmetic**: Rotation angles normalize via `Number((degrees / 90n) % 4n)` into `QuarterTurn` (`0 | 1 | 2 | 3`) and index a 4-tuple of clockwise 90° transforms.
- **Differential Oracle**: `rules.oracle.test.ts` cross-checks both rules against an independent Gaussian-integer (`e + i·n`) reference implementation across 50 seeded PRNG voyages.
