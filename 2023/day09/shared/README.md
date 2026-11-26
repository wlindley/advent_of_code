# 2023 Day 9 Shared Module

## Consumer Overview
Pure TypeScript domain library for OASIS finite-difference pyramids (`DifferencePyramid`), signed `bigint` report parsing (`parseOasisReport`), strategy-driven extrapolation (`ExtrapolationStrategy`), and bounded step tracing (`traceOasisReport`). Import domain symbols from `shared/index.ts` and visualization components directly from `shared/viz/`.

## Maintainer Architecture
- `strategy.ts`: Direction-agnostic extrapolation interface and immutable `ExtrapolationResult`.
- `pyramid.ts`: Immutable `DifferencePyramid` computing adjacent differences until all-zero convergence and folding bottom-up.
- `parser.ts`: Line-numbered `bigint` validation and `OasisReport` container.
- `trace.ts`: Canonical `OasisTraceFrame` snapshots with lazy `O(N + maxSteps)` sampled materialization.
- `viz/`: Pure React + SVG difference-pyramid renderer (`PyramidSvg`, `DifferencePyramidViz`).
