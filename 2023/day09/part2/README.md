# 2023 Day 9 Part 2 — Mirage Maintenance

## Consumer Overview
Exports `manifest` (`PuzzlePartManifest`) from `part2/index.ts` and pure solver `solver` (`PuzzleSolver<OasisReport, bigint, OasisTraceFrame>`) from `part2/domain/index.ts` for CLI and site execution.

## Maintainer Architecture
- `domain/strategy.ts`: Supplies `BACKWARD_EXTRAPOLATION_STRATEGY` (`anchor = layer[0]`, `combine = anchor - below`).
- `domain/solver.ts`: Thin delegation to `OasisReport.extrapolateSum` and `traceOasisReport`.
- `viz/Visualizer.tsx`: Thin wrapper binding `solver` to `DifferencePyramidViz`.
