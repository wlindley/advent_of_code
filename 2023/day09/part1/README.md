# 2023 Day 9 Part 1 — Mirage Maintenance

## Consumer Overview
Exports `manifest` (`PuzzlePartManifest`) from `part1/index.ts` and pure solver `solver` (`PuzzleSolver<OasisReport, bigint, OasisTraceFrame>`) from `part1/domain/index.ts` for CLI and site execution.

## Maintainer Architecture
- `domain/strategy.ts`: Supplies `FORWARD_EXTRAPOLATION_STRATEGY` (`anchor = layer[last]`, `combine = anchor + below`).
- `domain/solver.ts`: Thin delegation to `OasisReport.extrapolateSum` and `traceOasisReport`.
- `viz/Visualizer.tsx`: Thin wrapper binding `solver` to `DifferencePyramidViz`.
