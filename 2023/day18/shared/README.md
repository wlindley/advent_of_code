# AoC 2023 Day 18 Shared Domain

## Consumer Guide

- `RawDigEntry`, `DigStep`, `DigPlanDecoder`, `DIRECT_DIG_PLAN_DECODER`, `parseDigPlan(raw)`: Parses dig-plan lines (`<dir> <dist> (#<hex>)`) and decodes them into orthogonal trench steps.
- `LagoonPolygon.fromSteps(steps)`, `LagoonEdge`, `LagoonBounds`: Immutable closed orthogonal polygon exposing exact `bigint` Shoelace and Pick's theorem getters (`boundaryCount`, `signedDoubleArea`, `absDoubleArea`, `orientation`, `interiorCount`, `totalVolume`).
- `buildLagoonTrace(polygon, options?)`, `LagoonTraceFrame`, `projectPolygonToSvg(polygon, viewport)`: Bounded playback trace frames (`DEFAULT_MAX_TRACE_STEPS = 120`) and aspect-preserving `bigint`-scaled SVG projection.
- `createLagoonSolver(decoder)`: Constructs a `PuzzleSolver<LagoonPolygon, bigint, LagoonTraceFrame>` parameterized by decoding strategy.

## Maintainer Architecture

- **Exact Integer Geometry**: Every coordinate, edge delta, Shoelace term (`x1*y2 - x2*y1`), and Pick's interior count (`(absDoubleArea - boundaryCount + 2n) / 2n`) uses `bigint` with zero floating-point intermediate state and zero stored derived fields.
- **Scale-Safe SVG Projection**: `projectPolygonToSvg` compares aspect ratios via exact cross-multiplication in `bigint` and computes normalized `[0, 1]` ratios in `bigint` (`10_000n` sub-pixel precision) before converting to `number`.
- **Module Boundary**: `shared/index.ts` exports pure TypeScript domain modules only; React/SVG components live under `shared/viz/` as `.tsx` files.
